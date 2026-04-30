import { execFileSync, spawn } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export interface TreeEntry {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export interface GitHubClient {
  getTree(owner: string, repo: string, ref: string): Promise<TreeEntry[]>;
  downloadTarball(
    owner: string,
    repo: string,
    ref: string,
    destDir: string,
  ): Promise<void>;
}

let cachedToken: string | undefined;
let tokenResolved = false;

function resolveToken(): string | undefined {
  if (tokenResolved) return cachedToken;
  tokenResolved = true;
  try {
    cachedToken = execFileSync("gh", ["auth", "token"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    cachedToken = process.env.GITHUB_TOKEN;
  }
  return cachedToken;
}

function authHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

async function fetchApi<T>(
  endpoint: string,
  token?: string,
): Promise<T> {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    headers: authHeaders(token),
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        `Repository not found (404). If it's private, install the gh CLI and run "gh auth login", or set GITHUB_TOKEN.`,
      );
    }
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export function createGitHubClient(): GitHubClient {
  const token = resolveToken();

  return {
    async getTree(owner, repo, ref) {
      const data = await fetchApi<{
        tree: TreeEntry[];
        truncated: boolean;
      }>(`/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`, token);
      if (data.truncated) {
        console.error(
          "Warning: repository tree was truncated (>100k files). Some skills may be missed.",
        );
      }
      return data.tree;
    },

    async downloadTarball(owner, repo, ref, destDir) {
      const url = `https://api.github.com/repos/${owner}/${repo}/tarball/${ref}`;
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `token ${token}`;
      }

      const res = await fetch(url, { headers, redirect: "follow" });
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(
            `Repository not found (404). If it's private, install the gh CLI and run "gh auth login", or set GITHUB_TOKEN.`,
          );
        }
        throw new Error(
          `Failed to download tarball: ${res.status} ${res.statusText}`,
        );
      }

      if (!res.body) {
        throw new Error("Empty response body from tarball download");
      }

      const tar = spawn("tar", ["xz", "--strip-components=1", "-C", destDir], {
        stdio: ["pipe", "inherit", "pipe"],
      });

      let stderr = "";
      tar.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      const nodeStream = Readable.fromWeb(res.body as any);

      await Promise.all([
        pipeline(nodeStream, tar.stdin!),
        new Promise<void>((resolve, reject) => {
          tar.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`tar exited with code ${code}: ${stderr}`));
          });
        }),
      ]);
    },
  };
}

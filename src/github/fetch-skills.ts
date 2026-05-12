import { mkdtempSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { createGitHubClient } from "./client.js";
import type { GitHubRef } from "./parse-url.js";

export interface FetchedSkill {
  localPath: string;
  remotePath: string;
}

export interface FetchResult {
  skills: FetchedSkill[];
  tempDir: string;
}

function findSkillMds(dir: string): string[] {
  const results: string[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isFile() && /^(SKILL|skill)\.md$/.test(entry.name)) {
      results.push(fullPath);
    } else if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
      results.push(...findSkillMds(fullPath));
    }
  }
  return results;
}

export async function fetchRemoteSkills(ref: GitHubRef): Promise<FetchResult> {
  const client = createGitHubClient();
  const treeRef = ref.ref ?? "HEAD";
  const tempDir = mkdtempSync(join(tmpdir(), "skill-linter-"));

  await client.downloadTarball(ref.owner, ref.repo, treeRef, tempDir);

  const allSkillMds = findSkillMds(tempDir);

  let skillMdPaths = allSkillMds;
  if (ref.subpath) {
    const subDir = join(tempDir, ref.subpath);
    skillMdPaths = allSkillMds.filter((p) => p.startsWith(subDir));
    if (skillMdPaths.length === 0) {
      throw new Error(
        `No SKILL.md found under "${ref.subpath}" in ${ref.owner}/${ref.repo}`,
      );
    }
  }

  if (skillMdPaths.length === 0) {
    throw new Error(
      `No SKILL.md files found in ${ref.owner}/${ref.repo}`,
    );
  }

  const skills: FetchedSkill[] = skillMdPaths.map((skillMdPath) => {
    const localPath = dirname(skillMdPath);
    const remotePath = relative(tempDir, localPath);
    return { localPath, remotePath };
  });

  return { skills, tempDir };
}

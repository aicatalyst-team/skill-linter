import { readFile, readdir, stat, access } from "node:fs/promises";
import { join, relative, basename, resolve } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import type { Root as MdastRoot } from "mdast";
import type { ParsedSkill, SkillFile } from "./types.js";
import { extractFrontmatter } from "./frontmatter.js";

const markdownParser = unified()
  .use(remarkParse)
  .use(remarkFrontmatter, ["yaml"]);

async function findSkillMd(dirPath: string): Promise<string | null> {
  const preferred = join(dirPath, "SKILL.md");
  try {
    await access(preferred);
    return preferred;
  } catch { /* not found */ }

  const fallback = join(dirPath, "skill.md");
  try {
    await access(fallback);
    return fallback;
  } catch { /* not found */ }

  return null;
}

async function walkDirectory(dirPath: string, rootPath?: string): Promise<SkillFile[]> {
  const root = rootPath ?? dirPath;
  const files: SkillFile[] = [];
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isFile()) {
      files.push({
        path: fullPath,
        relativePath: relative(root, fullPath),
      });
    } else if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
      const subFiles = await walkDirectory(fullPath, root);
      for (const sub of subFiles) {
        files.push(sub);
      }
    }
  }

  return files;
}

export async function parseSkill(skillDirPath: string): Promise<ParsedSkill> {
  const dirPath = resolve(skillDirPath);
  const dirName = basename(dirPath);

  let dirStat;
  try {
    dirStat = await stat(dirPath);
  } catch {
    // Path does not exist at all
    const parentDir = resolve(dirPath, "..");
    const parentName = basename(parentDir);
    return emptySkill(parentDir, parentName, dirPath, [
      `Path does not exist: ${skillDirPath}`,
    ]);
  }

  if (!dirStat.isDirectory()) {
    // Treat as a direct SKILL.md path
    const resolvedFile = resolve(skillDirPath);
    const parentDir = resolve(resolvedFile, "..");
    const parentName = basename(parentDir);

    return parseSkillFile(parentDir, parentName, resolvedFile);
  }

  const skillMdPath = await findSkillMd(dirPath);
  if (!skillMdPath) {
    return emptySkill(dirPath, dirName, join(dirPath, "SKILL.md"), [
      "SKILL.md not found",
    ]);
  }

  return parseSkillFile(dirPath, dirName, skillMdPath);
}

async function parseSkillFile(
  dirPath: string,
  dirName: string,
  skillMdPath: string,
): Promise<ParsedSkill> {
  const parseErrors: string[] = [];
  let rawContent: string;

  try {
    rawContent = await readFile(skillMdPath, "utf-8");
  } catch {
    return emptySkill(dirPath, dirName, skillMdPath, [
      `Failed to read ${skillMdPath}`,
    ]);
  }

  let frontmatterResult;
  try {
    frontmatterResult = extractFrontmatter(rawContent);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return emptySkill(dirPath, dirName, skillMdPath, [
      `Failed to parse frontmatter: ${msg}`,
    ], rawContent);
  }

  let mdast: MdastRoot;
  try {
    mdast = markdownParser.parse(frontmatterResult.content) as MdastRoot;
  } catch {
    mdast = { type: "root", children: [] };
    parseErrors.push("Failed to parse markdown body");
  }

  const files = await walkDirectory(dirPath);
  const rawContentLines = rawContent.split("\n");
  const bodyLines = frontmatterResult.content.split("\n");

  return {
    dirPath,
    dirName,
    skillMdPath,
    rawContent,
    rawContentLines,
    frontmatter: frontmatterResult.data,
    rawFrontmatter: frontmatterResult.rawFrontmatter,
    frontmatterFieldLines: frontmatterResult.frontmatterFieldLines,
    frontmatterStartLine: frontmatterResult.frontmatterStartLine,
    frontmatterEndLine: frontmatterResult.frontmatterEndLine,
    body: frontmatterResult.content,
    bodyLines,
    bodyStartLine: frontmatterResult.bodyStartLine,
    mdast,
    files,
    parseErrors,
  };
}

function emptySkill(
  dirPath: string,
  dirName: string,
  skillMdPath: string,
  parseErrors: string[],
  rawContent = "",
): ParsedSkill {
  return {
    dirPath,
    dirName,
    skillMdPath,
    rawContent,
    rawContentLines: rawContent ? rawContent.split("\n") : [],
    frontmatter: {},
    rawFrontmatter: "",
    frontmatterFieldLines: new Map(),
    frontmatterStartLine: 1,
    frontmatterEndLine: 1,
    body: "",
    bodyLines: [],
    bodyStartLine: 1,
    mdast: { type: "root", children: [] },
    files: [],
    parseErrors,
  };
}

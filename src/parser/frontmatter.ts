import matter from "gray-matter";
import type { FrontmatterData } from "./types.js";

export interface ExtractedFrontmatter {
  data: FrontmatterData;
  content: string;
  rawFrontmatter: string;
  frontmatterFieldLines: Map<string, number>;
  frontmatterStartLine: number;
  frontmatterEndLine: number;
  bodyStartLine: number;
}

export function extractFrontmatter(
  raw: string,
): ExtractedFrontmatter {
  const parsed = matter(raw);

  let rawFrontmatter = "";
  const frontmatterFieldLines = new Map<string, number>();
  let frontmatterStartLine = 1;
  let frontmatterEndLine = 1;
  let bodyStartLine = 1;

  const hasFrontmatter =
    raw.trimStart().startsWith("---") &&
    Object.keys(parsed.data as object).length > 0;

  if (hasFrontmatter) {
    // gray-matter caches results and drops `.matter` on cache hits,
    // so extract raw frontmatter from the original string instead.
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    rawFrontmatter = fmMatch ? fmMatch[1] : "";
    frontmatterStartLine = 1;
    const fmLines = rawFrontmatter.split("\n");
    frontmatterEndLine = 1 + fmLines.length + 1;
    bodyStartLine = frontmatterEndLine + 1;

    // Pre-compute field name -> line number map
    for (let i = 0; i < fmLines.length; i++) {
      const colonIdx = fmLines[i].indexOf(":");
      if (colonIdx > 0 && !fmLines[i].startsWith(" ") && !fmLines[i].startsWith("\t")) {
        const fieldName = fmLines[i].slice(0, colonIdx);
        // +1 for the opening --- line, +1 for 1-based indexing
        frontmatterFieldLines.set(fieldName, frontmatterStartLine + 1 + i);
      }
    }
  }

  return {
    data: parsed.data as FrontmatterData,
    content: parsed.content,
    rawFrontmatter,
    frontmatterFieldLines,
    frontmatterStartLine,
    frontmatterEndLine,
    bodyStartLine,
  };
}

export function findFieldLine(
  rawFrontmatter: string,
  fieldName: string,
  frontmatterStartLine: number,
  fieldLines?: Map<string, number>,
): number | undefined {
  // Use pre-computed map if available
  if (fieldLines) {
    return fieldLines.get(fieldName);
  }

  const lines = rawFrontmatter.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${fieldName}:`)) {
      // +1 for the opening --- line, +1 for 1-based indexing
      return frontmatterStartLine + 1 + i;
    }
  }
  return undefined;
}

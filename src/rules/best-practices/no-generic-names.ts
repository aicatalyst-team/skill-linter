import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

const GENERIC_NAMES = new Set([
  "helper",
  "helpers",
  "util",
  "utils",
  "utility",
  "utilities",
  "tool",
  "tools",
  "misc",
  "stuff",
  "general",
  "common",
  "script",
  "scripts",
  "test",
  "example",
  "demo",
  "sample",
  "temp",
  "tmp",
  "scratch",
  "default",
  "main",
  "base",
]);

export const noGenericNames: Rule = {
  meta: {
    id: "best-practices/no-generic-names",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description:
      "Skill names should be domain-specific, not generic terms like 'helper' or 'utils'",
    category: "best-practices",
    messages: {
      generic:
        "Name '{{name}}' is too generic — use a domain-specific name (e.g., 'pdf-processing', 'data-analysis')",
    },
  },
  create(context) {
    const { skill } = context;
    const name = skill.frontmatter.name;
    if (typeof name !== "string" || name.trim() === "") return;

    if (GENERIC_NAMES.has(name.trim().toLowerCase())) {
      const line = findFieldLine(skill.rawFrontmatter, "name", skill.frontmatterStartLine, skill.frontmatterFieldLines);
      context.report({
        messageId: "generic",
        data: { name: name.trim() },
        location: { startLine: line },
      });
    }
  },
};

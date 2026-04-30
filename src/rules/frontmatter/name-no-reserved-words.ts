import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

const RESERVED_WORDS = ["anthropic", "claude"];

export const nameNoReservedWords: Rule = {
  meta: {
    id: "frontmatter/name-no-reserved-words",
    type: "problem",
    defaultSeverity: "error",
    fixable: false,
    description:
      "Skill names must not contain reserved words ('anthropic', 'claude')",
    category: "frontmatter",
    messages: {
      reserved:
        "Name '{{name}}' contains reserved word '{{word}}' — skill names must not include 'anthropic' or 'claude'",
    },
  },
  create(context) {
    const { skill } = context;
    const name = skill.frontmatter.name;
    if (typeof name !== "string" || name.trim() === "") return;

    const lower = name.toLowerCase();
    for (const word of RESERVED_WORDS) {
      if (lower.includes(word)) {
        const line = findFieldLine(skill.rawFrontmatter, "name", skill.frontmatterStartLine, skill.frontmatterFieldLines);
        context.report({
          messageId: "reserved",
          data: { name, word },
          location: { startLine: line },
        });
        break;
      }
    }
  },
};

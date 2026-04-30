import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

const MAX_COMPATIBILITY_LENGTH = 500;

export const compatibilityLength: Rule = {
  meta: {
    id: "frontmatter/compatibility-length",
    type: "problem",
    defaultSeverity: "error",
    fixable: false,
    description: "Compatibility field must be 500 characters or less",
    category: "frontmatter",
    messages: {
      tooLong:
        "Compatibility exceeds maximum length of 500 characters ({{length}} chars)",
    },
  },
  create(context) {
    const { skill } = context;
    const compat = skill.frontmatter.compatibility;
    if (typeof compat !== "string") return;

    if (compat.length > MAX_COMPATIBILITY_LENGTH) {
      const line = findFieldLine(skill.rawFrontmatter, "compatibility", skill.frontmatterStartLine, skill.frontmatterFieldLines);
      context.report({
        messageId: "tooLong",
        data: { length: String(compat.length) },
        location: { startLine: line },
      });
    }
  },
};

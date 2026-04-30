import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

const MAX_DESCRIPTION_LENGTH = 1024;

export const descriptionLength: Rule = {
  meta: {
    id: "frontmatter/description-length",
    type: "problem",
    defaultSeverity: "error",
    fixable: false,
    description: "Description must be between 1 and 1024 characters",
    category: "frontmatter",
    messages: {
      tooLong:
        "Description exceeds maximum length of 1024 characters ({{length}} chars)",
    },
  },
  create(context) {
    const { skill } = context;
    const desc = skill.frontmatter.description;
    if (typeof desc !== "string") return;

    if (desc.length > MAX_DESCRIPTION_LENGTH) {
      const line = findFieldLine(skill.rawFrontmatter, "description", skill.frontmatterStartLine, skill.frontmatterFieldLines);
      context.report({
        messageId: "tooLong",
        data: { length: String(desc.length) },
        location: { startLine: line },
      });
    }
  },
};

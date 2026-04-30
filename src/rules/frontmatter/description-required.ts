import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

export const descriptionRequired: Rule = {
  meta: {
    id: "frontmatter/description-required",
    type: "problem",
    defaultSeverity: "error",
    fixable: false,
    description: "The 'description' field is required in frontmatter",
    category: "frontmatter",
    messages: {
      missing: "Required field 'description' is missing from frontmatter",
      empty: "Field 'description' must not be empty",
    },
  },
  create(context) {
    const { skill } = context;
    if (!skill.rawFrontmatter) return;

    const { description } = skill.frontmatter;
    if (description === undefined || description === null) {
      context.report({
        messageId: "missing",
        location: { startLine: skill.frontmatterStartLine },
      });
    } else if (typeof description === "string" && description.trim() === "") {
      const line = findFieldLine(
        skill.rawFrontmatter,
        "description",
        skill.frontmatterStartLine,
        skill.frontmatterFieldLines,
      );
      context.report({
        messageId: "empty",
        location: { startLine: line },
      });
    }
  },
};

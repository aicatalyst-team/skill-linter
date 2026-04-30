import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

export const nameRequired: Rule = {
  meta: {
    id: "frontmatter/name-required",
    type: "problem",
    defaultSeverity: "error",
    fixable: false,
    description: "The 'name' field is required in frontmatter",
    category: "frontmatter",
    messages: {
      missing: "Required field 'name' is missing from frontmatter",
      empty: "Field 'name' must not be empty",
    },
  },
  create(context) {
    const { skill } = context;
    if (!skill.rawFrontmatter) return;

    const { name } = skill.frontmatter;
    if (name === undefined || name === null) {
      context.report({
        messageId: "missing",
        location: { startLine: skill.frontmatterStartLine },
      });
    } else if (typeof name === "string" && name.trim() === "") {
      const line = findFieldLine(
        skill.rawFrontmatter,
        "name",
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

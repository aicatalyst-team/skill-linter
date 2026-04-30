import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";
import { nfkcNormalize } from "../../utils/nfkc.js";

export const nameMatchesDirectory: Rule = {
  meta: {
    id: "frontmatter/name-matches-directory",
    type: "problem",
    defaultSeverity: "error",
    fixable: false,
    description: "The 'name' field must match the parent directory name",
    category: "frontmatter",
    messages: {
      mismatch:
        "Name '{{name}}' does not match directory name '{{dirName}}'",
    },
  },
  create(context) {
    const { skill } = context;
    const name = skill.frontmatter.name;
    if (typeof name !== "string" || name.trim() === "") return;

    const normalizedName = nfkcNormalize(name);
    const normalizedDir = nfkcNormalize(skill.dirName);

    if (normalizedName !== normalizedDir) {
      const line = findFieldLine(skill.rawFrontmatter, "name", skill.frontmatterStartLine, skill.frontmatterFieldLines);
      context.report({
        messageId: "mismatch",
        data: { name: normalizedName, dirName: normalizedDir },
        location: { startLine: line },
      });
    }
  },
};

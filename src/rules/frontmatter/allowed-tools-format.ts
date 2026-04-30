import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

export const allowedToolsFormat: Rule = {
  meta: {
    id: "frontmatter/allowed-tools-format",
    type: "suggestion",
    defaultSeverity: "warning",
    fixable: false,
    description: "allowed-tools must be a space-separated string of tool names",
    category: "frontmatter",
    messages: {
      notString:
        "allowed-tools must be a string, not {{type}}",
    },
  },
  create(context) {
    const { skill } = context;
    const tools = skill.frontmatter["allowed-tools"];
    if (tools === undefined) return;

    if (typeof tools !== "string") {
      const line = findFieldLine(skill.rawFrontmatter, "allowed-tools", skill.frontmatterStartLine, skill.frontmatterFieldLines);
      context.report({
        messageId: "notString",
        data: { type: Array.isArray(tools) ? "array" : typeof tools },
        location: { startLine: line },
      });
    }
  },
};

import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

export const metadataTypes: Rule = {
  meta: {
    id: "frontmatter/metadata-types",
    type: "problem",
    defaultSeverity: "error",
    fixable: false,
    description: "Metadata must be a map of string keys to string values",
    category: "frontmatter",
    messages: {
      notObject: "Metadata must be an object (map), not {{type}}",
      invalidValue:
        "Metadata key '{{key}}' has a non-string value ({{type}}). All metadata values must be strings",
    },
  },
  create(context) {
    const { skill } = context;
    const metadata = skill.frontmatter.metadata;
    if (metadata === undefined) return;

    const line = findFieldLine(skill.rawFrontmatter, "metadata", skill.frontmatterStartLine, skill.frontmatterFieldLines);

    if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
      context.report({
        messageId: "notObject",
        data: { type: Array.isArray(metadata) ? "array" : typeof metadata },
        location: { startLine: line },
      });
      return;
    }

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value !== "string") {
        context.report({
          messageId: "invalidValue",
          data: {
            key,
            type: value === null ? "null" : typeof value,
          },
          location: { startLine: line },
        });
      }
    }
  },
};

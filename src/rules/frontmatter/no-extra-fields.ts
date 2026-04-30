import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

const SPEC_FIELDS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "allowed-tools",
  "metadata",
]);

const EXTENSION_FIELDS = new Set([
  "user-invocable",
  "argument-hint",
  "model",
  "effort",
]);

export const noExtraFields: Rule = {
  meta: {
    id: "frontmatter/no-extra-fields",
    type: "problem",
    defaultSeverity: "error",
    fixable: false,
    description: "Only spec-defined and recognized extension fields are allowed in frontmatter",
    category: "frontmatter",
    messages: {
      unexpected:
        "Unexpected frontmatter field '{{field}}'. Allowed: name, description, license, compatibility, allowed-tools, metadata",
      extension:
        "Field '{{field}}' is a client extension (not in the base Agent Skills spec) — may not be recognized by all agent clients",
    },
  },
  create(context) {
    const { skill } = context;
    if (!skill.rawFrontmatter) return;

    for (const key of Object.keys(skill.frontmatter)) {
      if (SPEC_FIELDS.has(key)) continue;

      const line = findFieldLine(
        skill.rawFrontmatter,
        key,
        skill.frontmatterStartLine,
        skill.frontmatterFieldLines,
      );

      if (EXTENSION_FIELDS.has(key)) {
        context.report({
          messageId: "extension",
          data: { field: key },
          location: { startLine: line },
          severityOverride: "info",
        });
      } else {
        context.report({
          messageId: "unexpected",
          data: { field: key },
          location: { startLine: line },
        });
      }
    }
  },
};

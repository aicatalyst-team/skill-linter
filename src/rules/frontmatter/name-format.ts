import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";
import { nfkcNormalize } from "../../utils/nfkc.js";

const MAX_NAME_LENGTH = 64;

export const nameFormat: Rule = {
  meta: {
    id: "frontmatter/name-format",
    type: "problem",
    defaultSeverity: "error",
    fixable: true,
    description:
      "Name must be 1-64 chars, lowercase alphanumeric + hyphens, no leading/trailing/consecutive hyphens",
    category: "frontmatter",
    messages: {
      tooLong: "Name '{{name}}' exceeds maximum length of 64 characters ({{length}} chars)",
      notLowercase: "Name '{{name}}' must be lowercase",
      invalidChars: "Name '{{name}}' contains invalid characters (only lowercase alphanumeric and hyphens allowed)",
      leadingHyphen: "Name '{{name}}' must not start with a hyphen",
      trailingHyphen: "Name '{{name}}' must not end with a hyphen",
      consecutiveHyphens: "Name '{{name}}' must not contain consecutive hyphens",
    },
  },
  create(context) {
    const { skill } = context;
    const name = skill.frontmatter.name;
    if (typeof name !== "string" || name.trim() === "") return;

    const normalized = nfkcNormalize(name);
    const line = findFieldLine(skill.rawFrontmatter, "name", skill.frontmatterStartLine, skill.frontmatterFieldLines);
    const loc = { startLine: line };

    if (normalized.length > MAX_NAME_LENGTH) {
      context.report({
        messageId: "tooLong",
        data: { name: normalized, length: String(normalized.length) },
        location: loc,
      });
    }

    if (normalized !== normalized.toLowerCase()) {
      context.report({
        messageId: "notLowercase",
        data: { name: normalized },
        location: loc,
        fix: {
          description: "Convert name to lowercase",
          replacement: normalized.toLowerCase(),
        },
      });
    }

    const lower = normalized.toLowerCase();

    if (!/^[a-z0-9-]+$/.test(lower)) {
      context.report({
        messageId: "invalidChars",
        data: { name: lower },
        location: loc,
      });
    }

    if (lower.startsWith("-")) {
      context.report({
        messageId: "leadingHyphen",
        data: { name: lower },
        location: loc,
      });
    }

    if (lower.endsWith("-")) {
      context.report({
        messageId: "trailingHyphen",
        data: { name: lower },
        location: loc,
      });
    }

    if (lower.includes("--")) {
      context.report({
        messageId: "consecutiveHyphens",
        data: { name: lower },
        location: loc,
      });
    }
  },
};

import type { Rule } from "../../engine/types.js";

const MAX_LINES = 500;

export const bodyLineLimit: Rule = {
  meta: {
    id: "content/body-line-limit",
    type: "suggestion",
    defaultSeverity: "warning",
    fixable: false,
    description: "Body should be under 500 lines",
    category: "content",
    messages: {
      tooLong:
        "Body has {{lines}} lines (recommended: <500). Consider moving detail to references/",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0 || skill.body.trim() === "") return;

    const lines = skill.bodyLines.length;
    if (lines > MAX_LINES) {
      context.report({
        messageId: "tooLong",
        data: { lines: String(lines) },
        location: { startLine: skill.bodyStartLine },
      });
    }
  },
};

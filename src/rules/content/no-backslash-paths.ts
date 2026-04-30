import type { Rule } from "../../engine/types.js";

const BACKSLASH_PATH = /\b(scripts|references|assets)\\[\w][\w.\-]*/;

export const noBackslashPaths: Rule = {
  meta: {
    id: "content/no-backslash-paths",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description:
      "File paths should use forward slashes for cross-platform compatibility",
    category: "content",
    messages: {
      backslash:
        "Backslash path '{{path}}' at line {{line}} — use forward slashes for cross-platform compatibility",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0 || skill.body.trim() === "") return;

    const lines = skill.bodyLines;
    for (let i = 0; i < lines.length; i++) {
      const match = BACKSLASH_PATH.exec(lines[i]);
      if (match) {
        context.report({
          messageId: "backslash",
          data: { path: match[0], line: String(skill.bodyStartLine + i) },
          location: { startLine: skill.bodyStartLine + i },
        });
      }
    }
  },
};

import type { Rule } from "../../engine/types.js";

const FETCH_PATTERNS = [
  /curl\s+-[a-zA-Z]*s[a-zA-Z]*S[a-zA-Z]*L?\s+https?:\/\//i,
  /wget\s+(--quiet\s+)?https?:\/\//i,
  /curl\s+-[a-zA-Z]*O\s+https?:\/\//i,
  /curl\s+.*-o\s+\S+\s+https?:\/\//i,
];

export const noRemoteFetch: Rule = {
  meta: {
    id: "security/no-remote-fetch",
    type: "security",
    defaultSeverity: "warning",
    fixable: false,
    description: "Detects fetching content from remote URLs",
    category: "security",
    messages: {
      remoteFetch:
        "Remote content fetch detected at line {{line}} — verify the URL is trusted",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of FETCH_PATTERNS) {
        if (pattern.test(lines[i])) {
          context.report({
            messageId: "remoteFetch",
            data: { line: String(i + 1) },
            location: { startLine: i + 1 },
          });
          break;
        }
      }
    }
  },
};

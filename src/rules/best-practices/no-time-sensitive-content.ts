import type { Rule } from "../../engine/types.js";

const MONTHS = "(?:January|February|March|April|May|June|July|August|September|October|November|December)";

const TIME_SENSITIVE_PATTERNS = [
  new RegExp(`\\b(?:before|after|until|since|starting|by)\\s+${MONTHS}\\s+20\\d{2}\\b`, "i"),
  /\bas of this writing\b/i,
  /\bat the time of writing\b/i,
  /\bcurrently supports?\b/i,
  /\bcurrently requires?\b/i,
  /\bcurrently uses?\b/i,
  /\bat the moment\b/i,
  /\bas of (?:v|version )\d/i,
  /\bdeprecated since\b/i,
  new RegExp(`\\b(?:in|as of)\\s+${MONTHS}\\s+20\\d{2}\\b`, "i"),
];

export const noTimeSensitiveContent: Rule = {
  meta: {
    id: "best-practices/no-time-sensitive-content",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description:
      "Skills should avoid time-sensitive language that becomes stale",
    category: "best-practices",
    messages: {
      timeSensitive:
        "Time-sensitive content detected: '{{match}}'. Skills are installed indefinitely — avoid date-bound or 'currently' language",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0 || skill.body.trim() === "") return;

    const lines = skill.bodyLines;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^```/.test(line.trim())) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      for (const pattern of TIME_SENSITIVE_PATTERNS) {
        const m = line.match(pattern);
        if (m) {
          context.report({
            messageId: "timeSensitive",
            data: { match: m[0] },
            location: { startLine: skill.bodyStartLine + i },
          });
          break;
        }
      }
    }
  },
};

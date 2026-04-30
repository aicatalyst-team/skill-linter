import type { Rule } from "../../engine/types.js";

const UNPINNED_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /npx\s+(?!.*@[\d])[a-z][\w-]+(?!\s*@)/i, label: "npx without version pin" },
  { pattern: /uvx\s+(?!.*@[\d])[a-z][\w-]+(?!\s*@)/i, label: "uvx without version pin" },
  { pattern: /pip\s+install\s+(?!.*[>=<~!])[a-z][\w-]+\s*$/im, label: "pip install without version pin" },
];

export const pinnedVersions: Rule = {
  meta: {
    id: "best-practices/pinned-versions",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description: "Package manager commands should pin versions for reproducibility",
    category: "best-practices",
    messages: {
      unpinned:
        "{{label}} at line {{line}} — consider pinning a version for reproducibility",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    for (let i = 0; i < lines.length; i++) {
      for (const { pattern, label } of UNPINNED_PATTERNS) {
        if (pattern.test(lines[i])) {
          context.report({
            messageId: "unpinned",
            data: { label, line: String(i + 1) },
            location: { startLine: i + 1 },
          });
          break;
        }
      }
    }
  },
};

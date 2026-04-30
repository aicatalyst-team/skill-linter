import type { Rule } from "../../engine/types.js";

const PIPE_TO_SHELL = [
  /curl\s+.*\|\s*(ba)?sh/i,
  /wget\s+.*\|\s*(ba)?sh/i,
  /curl\s+.*\|\s*zsh/i,
  /source\s+<\(\s*curl/i,
  /eval\s+["'`]\$\(\s*curl/i,
  /python[3]?\s+-c\s+.*urllib.*urlopen/i,
];

export const noCurlBash: Rule = {
  meta: {
    id: "security/no-curl-bash",
    type: "security",
    defaultSeverity: "error",
    fixable: false,
    description: "Detects pipe-to-shell execution patterns (curl|bash, wget|sh)",
    category: "security",
    messages: {
      pipeToShell:
        "Pipe-to-shell execution detected at line {{line}} — remote code is executed without inspection",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of PIPE_TO_SHELL) {
        if (pattern.test(lines[i])) {
          context.report({
            messageId: "pipeToShell",
            data: { line: String(i + 1) },
            location: { startLine: i + 1 },
          });
          break;
        }
      }
    }
  },
};

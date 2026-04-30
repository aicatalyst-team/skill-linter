import type { Rule } from "../../engine/types.js";

const MEMORY_TARGETS = [
  /write\s+.*\bAGENTS\.md\b/i,
  /write\s+.*\bCLAUDE\.md\b/i,
  /write\s+.*\bMEMORY\.md\b/i,
  /write\s+.*\bSOUL\.md\b/i,
  /write\s+.*\bGEMINI\.md\b/i,
  /modify\s+.*\bAGENTS\.md\b/i,
  /modify\s+.*\bCLAUDE\.md\b/i,
  /append\s+.*\bAGENTS\.md\b/i,
  /append\s+.*\bCLAUDE\.md\b/i,
  /\.claude\/settings/i,
  /\.cursor\/rules/i,
  /\.clinerules/i,
  /overwrite\s+.*\.(md|json)\s+.*instructions/i,
];

export const noMemoryPoisoning: Rule = {
  meta: {
    id: "security/no-memory-poisoning",
    type: "security",
    defaultSeverity: "error",
    fixable: false,
    description: "Detects instructions to write to agent memory or config files",
    category: "security",
    messages: {
      memoryWrite:
        "Potential memory/config poisoning at line {{line}} — skill attempts to modify agent configuration",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of MEMORY_TARGETS) {
        if (pattern.test(lines[i])) {
          context.report({
            messageId: "memoryWrite",
            data: { line: String(i + 1) },
            location: { startLine: i + 1 },
          });
          break;
        }
      }
    }
  },
};

import type { Rule } from "../../engine/types.js";

const PERSONA_PATTERNS = [
  /^you are (a |an |the )/i,
  /^act as (a |an |the )/i,
  /^pretend (you are|to be) /i,
  /^imagine you (are|were) /i,
  /^role:\s/i,
  /^persona:\s/i,
  /^behave (like|as) (a |an |the )/i,
  /^assume the role of /i,
];

export const noPersonaInstructions: Rule = {
  meta: {
    id: "best-practices/no-persona-instructions",
    type: "suggestion",
    defaultSeverity: "warning",
    fixable: false,
    description:
      "Skills should provide instructions, not persona/roleplay assignments",
    category: "best-practices",
    messages: {
      persona:
        "Persona instruction detected: '{{line}}' — skills should provide domain instructions, not identity assignments",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0 || skill.body.trim() === "") return;

    const lines = skill.bodyLines;
    let inCodeBlock = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;
      const trimmed = lines[i].trim();
      if (trimmed === "") continue;

      const stripped = trimmed.replace(/^[-*>]\s+/, "");

      for (const pattern of PERSONA_PATTERNS) {
        if (pattern.test(stripped)) {
          const preview = stripped.length > 80 ? stripped.slice(0, 77) + "..." : stripped;
          const isQuoted = trimmed.startsWith(">");
          context.report({
            messageId: "persona",
            data: { line: preview },
            location: { startLine: skill.bodyStartLine + i },
            severityOverride: isQuoted ? "info" : undefined,
          });
          break;
        }
      }
    }
  },
};

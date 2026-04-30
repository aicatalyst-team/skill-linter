import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

const TRIGGER_PATTERNS = [
  /\buse\s+(this\s+)?(skill\s+)?when(ever)?\b/i,
  /\binvoke\s+(this\s+)?(skill\s+)?when(ever)?\b/i,
  /\brun\s+(this\s+)?when(ever)?\b/i,
  /\bactivate\s+when(ever)?\b/i,
  /\buse\s+(this\s+)?(skill\s+)?to\b/i,
  /\buse\s+(this\s+)?(skill\s+)?for\b/i,
  /\buse\s+(this\s+)?(skill\s+)?after\b/i,
  /\buse\s+(this\s+)?(skill\s+)?before\b/i,
  /\buse\s+(this\s+)?(skill\s+)?during\b/i,
];

export const descriptionHasTriggerWords: Rule = {
  meta: {
    id: "best-practices/description-has-trigger-words",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description: "Description should use imperative phrasing to help agents activate the skill",
    category: "best-practices",
    messages: {
      noTrigger:
        'Description lacks trigger phrasing. Consider starting with "Use when..." or "Use this skill to..." for better agent activation',
    },
  },
  create(context) {
    const { skill } = context;
    const desc = skill.frontmatter.description;
    if (typeof desc !== "string" || desc.trim() === "") return;

    const hasTrigger = TRIGGER_PATTERNS.some((p) => p.test(desc));
    if (!hasTrigger) {
      const line = findFieldLine(skill.rawFrontmatter, "description", skill.frontmatterStartLine, skill.frontmatterFieldLines);
      context.report({
        messageId: "noTrigger",
        location: { startLine: line },
      });
    }
  },
};

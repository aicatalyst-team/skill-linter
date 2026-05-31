import type { Rule } from "../../engine/types.js";

const WORD_THRESHOLD = 1000;

export const hasEvals: Rule = {
  meta: {
    id: "best-practices/has-evals",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description:
      "Non-trivial skills should include evals/ with test cases for output quality",
    category: "best-practices",
    messages: {
      noEvals:
        "Consider adding an evals/ directory with test cases — see https://agentskills.io/skill-creation/evaluating-skills",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const wordCount = skill.body.split(/\s+/).filter(Boolean).length;
    if (wordCount < WORD_THRESHOLD) return;

    const hasEvalsDir = skill.files.some((f) =>
      f.relativePath.startsWith("evals/"),
    );

    if (!hasEvalsDir) {
      context.report({ messageId: "noEvals" });
    }
  },
};

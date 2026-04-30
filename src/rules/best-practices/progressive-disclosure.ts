import type { Rule } from "../../engine/types.js";
import { estimateTokens } from "../../utils/token-counter.js";

const THRESHOLD_TOKENS = 3000;

export const progressiveDisclosure: Rule = {
  meta: {
    id: "best-practices/progressive-disclosure",
    type: "suggestion",
    defaultSeverity: "warning",
    fixable: false,
    description: "Large body content should be split into references/ for progressive disclosure",
    category: "best-practices",
    messages: {
      shouldSplit:
        "Body is ~{{tokens}} tokens but references/ is empty or missing. Move detailed content to references/ for progressive disclosure",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0 || skill.body.trim() === "") return;

    const tokens = estimateTokens(skill.body);
    if (tokens <= THRESHOLD_TOKENS) return;

    const hasRefs = skill.files.some((f) => f.relativePath.startsWith("references/"));

    if (!hasRefs) {
      context.report({
        messageId: "shouldSplit",
        data: { tokens: String(tokens) },
        location: { startLine: skill.bodyStartLine },
      });
    }
  },
};

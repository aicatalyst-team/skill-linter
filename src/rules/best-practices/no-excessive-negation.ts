import type { Rule } from "../../engine/types.js";
import { forEachNonCodeLine } from "../../utils/code-block-tracker.js";

const BULLET_LINE = /^[-*+]\s+/;
const NEGATIVE_BULLET = /^[-*+]\s+(don't|do not|never|avoid|must not|should not|shouldn't|cannot|can't|won't|will not)\b/i;

const MIN_NEGATIVE_COUNT = 5;
const MAX_NEGATIVE_RATIO = 0.3;

export const noExcessiveNegation: Rule = {
  meta: {
    id: "best-practices/no-excessive-negation",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description:
      "Skills should primarily tell agents what to do, not what not to do",
    category: "best-practices",
    messages: {
      excessive:
        "{{negative}} of {{total}} bullet points ({{percent}}%) are prohibitions. Focus on positive instructions instead of 'don't' rules",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0 || skill.body.trim() === "") return;

    let totalBullets = 0;
    let negativeBullets = 0;

    forEachNonCodeLine(skill.bodyLines, (line) => {
      if (BULLET_LINE.test(line.trim())) {
        totalBullets++;
        if (NEGATIVE_BULLET.test(line.trim())) {
          negativeBullets++;
        }
      }
    });

    if (
      negativeBullets >= MIN_NEGATIVE_COUNT &&
      totalBullets > 0 &&
      negativeBullets / totalBullets > MAX_NEGATIVE_RATIO
    ) {
      const percent = Math.round((negativeBullets / totalBullets) * 100);
      context.report({
        messageId: "excessive",
        data: {
          negative: String(negativeBullets),
          total: String(totalBullets),
          percent: String(percent),
        },
        location: { startLine: skill.bodyStartLine },
      });
    }
  },
};

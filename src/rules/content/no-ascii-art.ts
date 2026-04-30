import type { Rule } from "../../engine/types.js";
import { forEachNonCodeLine } from "../../utils/code-block-tracker.js";

const BOX_DRAWING = /[─-╿▀-▟]/;
const REPEATED_DECORATIVE = /^[=*~#_^]{4,}$/;

function isDecorative(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4) return false;
  if (BOX_DRAWING.test(trimmed)) return true;
  if (REPEATED_DECORATIVE.test(trimmed)) return true;
  return false;
}

export const noAsciiArt: Rule = {
  meta: {
    id: "content/no-ascii-art",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description:
      "Skills should not contain decorative ASCII art or box-drawing characters",
    category: "content",
    messages: {
      asciiArt:
        "Decorative content detected — ASCII art and box-drawing characters waste tokens in skill files",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0 || skill.body.trim() === "") return;

    forEachNonCodeLine(skill.bodyLines, (line, i) => {
      if (isDecorative(line)) {
        context.report({
          messageId: "asciiArt",
          location: { startLine: skill.bodyStartLine + i },
        });
      }
    });
  },
};

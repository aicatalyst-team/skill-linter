import type { Rule } from "../../engine/types.js";

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

    const lines = skill.bodyLines;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^```/.test(line.trim())) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      if (isDecorative(line)) {
        context.report({
          messageId: "asciiArt",
          location: { startLine: skill.bodyStartLine + i },
        });
      }
    }
  },
};

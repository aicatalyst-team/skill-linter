import type { Rule } from "../../engine/types.js";

// U+200B zero-width space, U+200C ZWNJ, U+200D ZWJ, U+2060 word joiner, U+FEFF BOM
const ZERO_WIDTH_CHARS = /[​‌‍⁠﻿]/;
// U+202A-U+202E LTR/RTL embedding/override, U+2066-U+2069 isolates
const RTL_OVERRIDE = /[‪-‮⁦-⁩]/;
// U+E0001-U+E007F Unicode tag characters (supplementary plane)
const TAG_CHARS = /[\u{E0001}-\u{E007F}]/u;

export const noObfuscation: Rule = {
  meta: {
    id: "security/no-obfuscation",
    type: "security",
    defaultSeverity: "error",
    fixable: false,
    description: "Detects Unicode obfuscation techniques (zero-width chars, RTL override)",
    category: "security",
    messages: {
      zeroWidth: "Zero-width Unicode character detected at line {{line}} — may hide malicious content",
      rtlOverride: "RTL/LTR override character detected at line {{line}} — may obscure text direction",
      tagChars: "Unicode tag characters detected at line {{line}} — may be used for smuggling",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    for (let i = 0; i < lines.length; i++) {
      if (ZERO_WIDTH_CHARS.test(lines[i])) {
        context.report({
          messageId: "zeroWidth",
          data: { line: String(i + 1) },
          location: { startLine: i + 1 },
        });
      }
      if (RTL_OVERRIDE.test(lines[i])) {
        context.report({
          messageId: "rtlOverride",
          data: { line: String(i + 1) },
          location: { startLine: i + 1 },
        });
      }
      if (TAG_CHARS.test(lines[i])) {
        context.report({
          messageId: "tagChars",
          data: { line: String(i + 1) },
          location: { startLine: i + 1 },
        });
      }
    }
  },
};

import type { Rule } from "../../engine/types.js";

const BASE64_PATTERN = /[A-Za-z0-9+/]{40,}={0,2}/;
const DECODE_PATTERNS = [
  /base64\s+-d/i,
  /base64\s+--decode/i,
  /atob\s*\(/i,
  /Buffer\.from\(.*,\s*['"]base64['"]\)/i,
  /b64decode/i,
];

export const noBase64Payloads: Rule = {
  meta: {
    id: "security/no-base64-payloads",
    type: "security",
    defaultSeverity: "error",
    fixable: false,
    description: "Detects base64-encoded content that could hide malicious payloads",
    category: "security",
    messages: {
      decodeCommand: "Base64 decode command detected at line {{line}} — could execute obfuscated payload",
      suspiciousBlob: "Suspicious base64-encoded string detected at line {{line}} ({{length}} chars)",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of DECODE_PATTERNS) {
        if (pattern.test(lines[i])) {
          context.report({
            messageId: "decodeCommand",
            data: { line: String(i + 1) },
            location: { startLine: i + 1 },
          });
          break;
        }
      }

      const match = lines[i].match(BASE64_PATTERN);
      if (match && match[0].length > 60) {
        context.report({
          messageId: "suspiciousBlob",
          data: { line: String(i + 1), length: String(match[0].length) },
          location: { startLine: i + 1 },
        });
      }
    }
  },
};

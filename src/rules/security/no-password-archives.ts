import type { Rule } from "../../engine/types.js";

const ARCHIVE_PATTERNS = [
  /unzip\s+-P\s/i,
  /unzip\s+.*-P\s/i,
  /7z\s+x\s+-p/i,
  /7z\s+e\s+-p/i,
  /tar\s+.*--password/i,
  /gpg\s+--passphrase\s/i,
  /openssl\s+.*-pass\s/i,
];

export const noPasswordArchives: Rule = {
  meta: {
    id: "security/no-password-archives",
    type: "security",
    defaultSeverity: "error",
    fixable: false,
    description: "Detects password-protected archive extraction (classic evasion technique)",
    category: "security",
    messages: {
      passwordArchive:
        "Password-protected archive extraction detected at line {{line}} — common evasion technique for malicious payloads",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of ARCHIVE_PATTERNS) {
        if (pattern.test(lines[i])) {
          context.report({
            messageId: "passwordArchive",
            data: { line: String(i + 1) },
            location: { startLine: i + 1 },
          });
          break;
        }
      }
    }
  },
};

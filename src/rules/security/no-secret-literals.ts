import type { Rule } from "../../engine/types.js";

const SECRET_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/, label: "OpenAI/Anthropic API key" },
  { pattern: /sk-ant-[a-zA-Z0-9-]{20,}/, label: "Anthropic API key" },
  { pattern: /ghp_[a-zA-Z0-9]{36,}/, label: "GitHub personal access token" },
  { pattern: /gho_[a-zA-Z0-9]{36,}/, label: "GitHub OAuth token" },
  { pattern: /github_pat_[a-zA-Z0-9_]{20,}/, label: "GitHub fine-grained token" },
  { pattern: /AKIA[0-9A-Z]{16}/, label: "AWS access key ID" },
  { pattern: /xox[bpors]-[a-zA-Z0-9-]{10,}/, label: "Slack token" },
  { pattern: /Bearer\s+[a-zA-Z0-9._-]{20,}/, label: "Bearer token" },
  { pattern: /glpat-[a-zA-Z0-9_-]{20,}/, label: "GitLab personal access token" },
  { pattern: /npm_[a-zA-Z0-9]{36,}/, label: "npm access token" },
];

export const noSecretLiterals: Rule = {
  meta: {
    id: "security/no-secret-literals",
    type: "security",
    defaultSeverity: "warning",
    fixable: false,
    description: "Detects hardcoded API keys, tokens, or credentials",
    category: "security",
    messages: {
      secretFound: "Possible hardcoded secret at line {{line}}: {{label}}",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    for (let i = 0; i < lines.length; i++) {
      for (const { pattern, label } of SECRET_PATTERNS) {
        if (pattern.test(lines[i])) {
          context.report({
            messageId: "secretFound",
            data: { line: String(i + 1), label },
            location: { startLine: i + 1 },
          });
          break;
        }
      }
    }
  },
};

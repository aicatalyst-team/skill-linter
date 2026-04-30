import type { Rule } from "../../engine/types.js";

const SENSITIVE_PATHS = [
  /~\/\.ssh\//i,
  /~\/\.aws\/credentials/i,
  /~\/\.aws\/config/i,
  /~\/\.netrc/i,
  /~\/\.gnupg\//i,
  /~\/\.config\/gcloud/i,
  /\/etc\/shadow/i,
  /\/etc\/passwd/i,
  /\.env\b/,
  /credentials\.json/i,
  /service.account.*\.json/i,
];

const SENSITIVE_ENV_VARS = [
  /\$ANTHROPIC_API_KEY/,
  /\$OPENAI_API_KEY/,
  /\$AWS_SECRET_ACCESS_KEY/,
  /\$AWS_SESSION_TOKEN/,
  /\$GITHUB_TOKEN/,
  /\$GH_TOKEN/,
  /\$NPM_TOKEN/,
  /\$DATABASE_URL/,
  /process\.env\.(ANTHROPIC_API_KEY|OPENAI_API_KEY|AWS_SECRET|GITHUB_TOKEN|NPM_TOKEN|DATABASE_URL)/,
];

export const noCredentialAccess: Rule = {
  meta: {
    id: "security/no-credential-access",
    type: "security",
    defaultSeverity: "error",
    fixable: false,
    description: "Detects instructions to read sensitive files or environment variables",
    category: "security",
    messages: {
      sensitivePath: "Reference to sensitive file path detected at line {{line}}: {{match}}",
      sensitiveEnv: "Reference to sensitive environment variable at line {{line}}: {{match}}",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of SENSITIVE_PATHS) {
        const match = lines[i].match(pattern);
        if (match) {
          context.report({
            messageId: "sensitivePath",
            data: { line: String(i + 1), match: match[0] },
            location: { startLine: i + 1 },
          });
          break;
        }
      }

      for (const pattern of SENSITIVE_ENV_VARS) {
        const match = lines[i].match(pattern);
        if (match) {
          context.report({
            messageId: "sensitiveEnv",
            data: { line: String(i + 1), match: match[0] },
            location: { startLine: i + 1 },
          });
          break;
        }
      }
    }
  },
};

import type { Rule } from "../../engine/types.js";

const INJECTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, label: "ignore previous instructions" },
  { pattern: /ignore\s+(all\s+)?prior\s+instructions/i, label: "ignore prior instructions" },
  { pattern: /disregard\s+(all\s+)?previous/i, label: "disregard previous" },
  { pattern: /forget\s+(all\s+)?previous/i, label: "forget previous" },
  { pattern: /you\s+are\s+now\s+a/i, label: "identity override (you are now)" },
  { pattern: /from\s+now\s+on,?\s+you\s+are/i, label: "identity override (from now on)" },
  { pattern: /^system:/im, label: "system message impersonation" },
  { pattern: /\[system\]/i, label: "system message impersonation" },
  { pattern: /<\|?system\|?>/i, label: "system tag impersonation" },
  { pattern: /\[INST\]/i, label: "instruction tag injection" },
  { pattern: /do\s+not\s+follow\s+(any\s+)?(other|previous)\s+(rules|instructions)/i, label: "instruction override" },
  { pattern: /override\s+(all\s+)?(safety|security|restrictions)/i, label: "safety override" },
];

const CODE_FENCE_RE = /^(`{3,}|~{3,})/;

const MENTION_MARKERS_RE =
  /\be\.g\.[\s,]|\bfor\s+example\b|\bsuch\s+as\b|\bfor\s+instance\b|\blike:\s/i;

function isInMentionContext(line: string, pattern: RegExp): boolean {
  const match = pattern.exec(line);
  if (!match) return false;
  const matchStart = match.index;
  const matchEnd = matchStart + match[0].length;

  const beforeMatch = line.slice(0, matchStart);
  const afterMatch = line.slice(matchEnd);

  if (
    (beforeMatch.includes('"') && afterMatch.includes('"')) ||
    (beforeMatch.includes("“") && afterMatch.includes("”"))
  ) {
    return true;
  }

  if (beforeMatch.includes("`") && afterMatch.includes("`")) {
    return true;
  }

  if (MENTION_MARKERS_RE.test(beforeMatch)) {
    return true;
  }

  return false;
}

export const noPromptInjection: Rule = {
  meta: {
    id: "security/no-prompt-injection",
    type: "security",
    defaultSeverity: "error",
    fixable: false,
    description: "Detects prompt injection patterns in skill content",
    category: "security",
    messages: {
      injectionDetected:
        "Potential prompt injection detected: '{{label}}' at line {{line}}",
      injectionInCodeBlock:
        "Potential prompt injection in code block: '{{label}}' at line {{line}} (code blocks are not a safety boundary)",
      injectionInMention:
        "Prompt injection pattern in quoted/example context: '{{label}}' at line {{line}}",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const lines = skill.rawContentLines;
    let inCodeFence = false;

    for (let i = 0; i < lines.length; i++) {
      if (CODE_FENCE_RE.test(lines[i].trimStart())) {
        inCodeFence = !inCodeFence;
        continue;
      }

      for (const { pattern, label } of INJECTION_PATTERNS) {
        if (pattern.test(lines[i])) {
          const isMention = !inCodeFence && isInMentionContext(lines[i], pattern);
          const downgrade = inCodeFence || isMention;

          const messageId = inCodeFence
            ? "injectionInCodeBlock"
            : isMention
              ? "injectionInMention"
              : "injectionDetected";

          context.report({
            messageId,
            data: { label, line: String(i + 1) },
            location: { startLine: i + 1 },
            ...(downgrade ? { severityOverride: "warning" as const } : {}),
          });
          break;
        }
      }
    }
  },
};

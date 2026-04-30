import type { Rule } from "../../engine/types.js";

const VAGUE_PATTERNS = [
  /\bfollow best practices\b/i,
  /\bhandle [\w\s]+ appropriately\b/i,
  /\bensure quality\b/i,
  /\buse your (best )?judgm?ent\b/i,
  /\bas needed\b/i,
  /\bwhen appropriate\b/i,
  /\bas appropriate\b/i,
  /\bbe careful\b/i,
  /\bbe thorough\b/i,
  /\buse common sense\b/i,
  /\bdo the right thing\b/i,
  /\bhandle .+ gracefully\b/i,
  /\bproperly handle\b/i,
  /\bensure correctness\b/i,
  /\bmake sure (everything|it) (works|is correct)\b/i,
];

const THRESHOLD = 2;

export const noVagueInstructions: Rule = {
  meta: {
    id: "best-practices/no-vague-instructions",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description:
      "Skills should give specific instructions, not vague directives like 'follow best practices'",
    category: "best-practices",
    messages: {
      vague:
        "Found {{count}} vague instructions (e.g., '{{example}}'). Replace with specific, actionable guidance",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0 || skill.body.trim() === "") return;

    const matches: string[] = [];
    const lines = skill.bodyLines;
    let inCodeBlock = false;

    for (const line of lines) {
      if (/^```/.test(line.trim())) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      for (const pattern of VAGUE_PATTERNS) {
        const m = line.match(pattern);
        if (m) {
          matches.push(m[0]);
          break;
        }
      }
    }

    if (matches.length > THRESHOLD) {
      context.report({
        messageId: "vague",
        data: { count: String(matches.length), example: matches[0] },
        location: { startLine: skill.bodyStartLine },
      });
    }
  },
};

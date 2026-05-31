import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type { Rule } from "../../engine/types.js";
import { isDataFile } from "../../utils/script-files.js";

const INTERACTIVE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\binput\s*\(/, label: "input()" },
  { pattern: /\bsys\.stdin\.read/, label: "sys.stdin.read" },
  { pattern: /\bgetpass\.getpass/, label: "getpass.getpass" },
  { pattern: /\bread\s+-[ep]/, label: "read -p/-e" },
  { pattern: /\bselect\s+\w+\s+in\b/, label: "select menu" },
  { pattern: /\breadline\.question/, label: "readline.question" },
  { pattern: /\bprocess\.stdin\b/, label: "process.stdin" },
  { pattern: /\bprompt\s*\(/, label: "prompt()" },
  { pattern: /\bSTDIN\.gets\b/, label: "STDIN.gets" },
  { pattern: /\b\$stdin\.gets\b/, label: "$stdin.gets" },
];

export const noInteractiveScripts: Rule = {
  meta: {
    id: "best-practices/no-interactive-scripts",
    type: "problem",
    defaultSeverity: "warning",
    fixable: false,
    description:
      "Scripts must not use interactive prompts — agents run in non-interactive shells",
    category: "best-practices",
    messages: {
      interactive:
        "Script '{{script}}' uses {{label}} — agents cannot respond to interactive prompts. Use CLI flags or env vars instead.",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const scriptFiles = skill.files.filter((f) => {
      if (!f.relativePath.startsWith("scripts/")) return false;
      const rest = f.relativePath.slice("scripts/".length);
      if (rest.includes("/")) return false;
      return !rest.startsWith(".");
    });

    if (scriptFiles.length === 0) return;

    for (const file of scriptFiles) {
      const script = basename(file.relativePath);
      if (isDataFile(script)) continue;

      let content: string;
      try {
        content = readFileSync(file.path, "utf-8");
      } catch {
        continue;
      }

      for (const { pattern, label } of INTERACTIVE_PATTERNS) {
        if (pattern.test(content)) {
          context.report({
            messageId: "interactive",
            data: { script, label },
          });
          break;
        }
      }
    }
  },
};

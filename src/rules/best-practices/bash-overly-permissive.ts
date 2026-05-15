import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";
import { parseAllowedTools, toolBaseName } from "./tool-tiers.js";

const DEFAULT_SHELL_TOOL = "Bash";

const CODE_FENCE_OPEN = /^(`{3,}|~{3,})\s*(bash|shell|sh)\s*$/i;
const CODE_FENCE_END = /^(`{3,}|~{3,})\s*$/;

const SHELL_BUILTINS = new Set([
  "echo",
  "cd",
  "export",
  "set",
  "source",
  "if",
  "then",
  "else",
  "fi",
  "for",
  "do",
  "done",
  "while",
  "case",
  "esac",
  "return",
  "exit",
  "true",
  "false",
  "test",
  "[",
  "[[",
  "bash",
  "sh",
]);

const COMMAND_RE = /^(?:sudo\s+)?(\w[\w.+-]*)/;
const ALL_CAPS_RE = /^[A-Z_][A-Z0-9_]*$/;
const MAX_COMMANDS_TO_SUGGEST = 8;

const PROMPT_RE = /^[#$]\s+/;

function collectBlock(bodyLines: string[], start: number): string[] {
  const lines: string[] = [];
  for (let i = start; i < bodyLines.length; i++) {
    const trimmed = bodyLines[i].trimStart();
    if (CODE_FENCE_END.test(trimmed)) break;
    lines.push(trimmed);
  }
  return lines;
}

function extractCommands(bodyLines: string[]): Set<string> {
  const commands = new Set<string>();

  for (let i = 0; i < bodyLines.length; i++) {
    const trimmed = bodyLines[i].trimStart();
    if (!CODE_FENCE_OPEN.test(trimmed)) continue;

    const block = collectBlock(bodyLines, i + 1);
    i += block.length + 1;

    const hasPrompts = block.some((l) => PROMPT_RE.test(l));

    for (const line of block) {
      if (line === "" || line.startsWith("#")) continue;

      if (hasPrompts && !PROMPT_RE.test(line)) continue;

      const stripped = line.replace(PROMPT_RE, "");
      const m = COMMAND_RE.exec(stripped);
      if (m) {
        const cmd = m[1];
        if (!SHELL_BUILTINS.has(cmd) && !/^\d/.test(cmd) && !ALL_CAPS_RE.test(cmd)) {
          commands.add(cmd);
        }
      }
    }
  }

  return commands;
}

export const bashOverlyPermissive: Rule = {
  meta: {
    id: "best-practices/bash-overly-permissive",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description:
      "Broad shell tool in allowed-tools could be narrowed to specific command patterns",
    category: "best-practices",
    messages: {
      bashCouldBeNarrowed:
        "allowed-tools includes broad '{{shellTool}}' but body only uses: {{commands}}. Consider narrowing to {{suggestion}}",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const raw = skill.frontmatter["allowed-tools"];
    if (typeof raw !== "string") return;

    const opts = context.options[0];
    const shellTool =
      typeof opts === "object" && opts !== null && "shellTool" in opts
        ? String((opts as Record<string, unknown>).shellTool)
        : DEFAULT_SHELL_TOOL;

    const entries = parseAllowedTools(raw);
    const hasBareShell = entries.some(
      (t) => t === shellTool && toolBaseName(t) === shellTool,
    );
    if (!hasBareShell) return;

    const commands = extractCommands(skill.bodyLines);
    if (commands.size === 0 || commands.size > MAX_COMMANDS_TO_SUGGEST) return;

    const sorted = [...commands].sort();
    const suggestion = sorted.map((c) => `${shellTool}(${c}:*)`).join(" ");

    const line = findFieldLine(
      skill.rawFrontmatter,
      "allowed-tools",
      skill.frontmatterStartLine,
      skill.frontmatterFieldLines,
    );
    context.report({
      messageId: "bashCouldBeNarrowed",
      data: { shellTool, commands: sorted.join(", "), suggestion },
      location: { startLine: line },
    });
  },
};

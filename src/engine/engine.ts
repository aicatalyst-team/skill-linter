import { parseSkill } from "../parser/index.js";
import { getAllRules } from "./rule-registry.js";
import type {
  Diagnostic,
  LintResult,
  ReportDescriptor,
  Rule,
  RuleContext,
  Severity,
} from "./types.js";
import type { ParsedSkill } from "../parser/types.js";

export interface EngineOptions {
  rules?: Record<string, Severity | "off" | [Severity | "off", ...unknown[]]>;
}

function interpolateMessage(
  template: string,
  data?: Record<string, string | number>,
): string {
  if (!data) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    data[key] !== undefined ? String(data[key]) : `{{${key}}}`,
  );
}

function resolveRuleSeverity(
  rule: Rule,
  config?: EngineOptions["rules"],
): Severity | "off" {
  if (!config) return rule.meta.defaultSeverity;
  const entry = config[rule.meta.id];
  if (entry === undefined) return rule.meta.defaultSeverity;
  if (typeof entry === "string") return entry;
  if (Array.isArray(entry)) return entry[0];
  return rule.meta.defaultSeverity;
}

function resolveRuleOptions(
  rule: Rule,
  config?: EngineOptions["rules"],
): unknown[] {
  if (!config) return [];
  const entry = config[rule.meta.id];
  if (Array.isArray(entry)) return entry.slice(1);
  return [];
}

const SUPPRESS_RE =
  /<!--\s*skilleval-disable-next-line(?:\s+([\w/,-]+))?\s*-->/;

function parseSuppressedLines(
  lines: string[],
): Map<number, Set<string> | null> {
  const suppressed = new Map<number, Set<string> | null>();
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(SUPPRESS_RE);
    if (match) {
      const targetLine = i + 2;
      if (match[1]) {
        const ruleIds = match[1].split(",").map((r) => r.trim());
        suppressed.set(targetLine, new Set(ruleIds));
      } else {
        suppressed.set(targetLine, null);
      }
    }
  }
  return suppressed;
}

function isSuppressed(
  suppressedLines: Map<number, Set<string> | null>,
  ruleId: string,
  line?: number,
): boolean {
  if (line === undefined) return false;
  const entry = suppressedLines.get(line);
  if (entry === undefined) return false;
  if (entry === null) return true;
  return entry.has(ruleId);
}

export async function lint(
  skillPath: string,
  options: EngineOptions = {},
): Promise<LintResult> {
  const skill = await parseSkill(skillPath);
  const diagnostics: Diagnostic[] = [];
  const rules = getAllRules();
  const suppressedLines = parseSuppressedLines(skill.rawContentLines);

  for (const parseError of skill.parseErrors) {
    diagnostics.push({
      ruleId: "parser",
      severity: "error",
      message: parseError,
      location: { file: skill.skillMdPath },
      category: "structural",
    });
  }

  for (const rule of rules) {
    const severity = resolveRuleSeverity(rule, options.rules);
    if (severity === "off") continue;

    const ruleOptions = resolveRuleOptions(rule, options.rules);

    const context: RuleContext = {
      skill,
      severity,
      options: ruleOptions,
      report(descriptor: ReportDescriptor) {
        if (isSuppressed(suppressedLines, rule.meta.id, descriptor.location?.startLine)) {
          return;
        }

        const template =
          rule.meta.messages[descriptor.messageId] ?? descriptor.messageId;
        const message = interpolateMessage(template, descriptor.data);
        const effectiveSeverity = descriptor.severityOverride ?? severity;

        diagnostics.push({
          ruleId: rule.meta.id,
          severity: effectiveSeverity,
          message,
          location: {
            file: descriptor.location?.file ?? skill.skillMdPath,
            startLine: descriptor.location?.startLine,
            startColumn: descriptor.location?.startColumn,
            endLine: descriptor.location?.endLine,
            endColumn: descriptor.location?.endColumn,
          },
          fix: descriptor.fix,
          category: rule.meta.category,
        });
      },
    };

    await rule.create(context);
  }

  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  let fixableCount = 0;
  for (const d of diagnostics) {
    if (d.severity === "error") errorCount++;
    else if (d.severity === "warning") warningCount++;
    else infoCount++;
    if (d.fix !== undefined) fixableCount++;
  }

  return {
    skillPath,
    diagnostics,
    errorCount,
    warningCount,
    infoCount,
    fixableCount,
    parsedSkill: skill,
  };
}

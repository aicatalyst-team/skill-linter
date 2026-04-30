import pc from "picocolors";
import { relative } from "node:path";
import type { LintResult, Diagnostic, Severity } from "../engine/types.js";
import type { FormatOptions } from "./index.js";

const SEVERITY_LABEL: Record<Severity, string> = {
  error: pc.red("error"),
  warning: pc.yellow("warning"),
  info: pc.blue("info"),
};

const SEVERITY_ORDER: Record<Severity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

function formatLocation(d: Diagnostic): string {
  if (d.location.startLine) {
    const col = d.location.startColumn ?? 1;
    return pc.dim(`${d.location.startLine}:${col}`);
  }
  return pc.dim("  -");
}

function formatDiagnostic(d: Diagnostic): string {
  const loc = formatLocation(d).padEnd(18);
  const sev = SEVERITY_LABEL[d.severity].padEnd(20);
  const ruleId = pc.dim(d.ruleId);
  return `  ${loc}  ${sev}  ${d.message}  ${ruleId}`;
}

function formatPerSkillSummary(result: LintResult): string {
  const parts: string[] = [];
  if (result.errorCount > 0) {
    parts.push(pc.red(`${result.errorCount} error${result.errorCount > 1 ? "s" : ""}`));
  }
  if (result.warningCount > 0) {
    parts.push(pc.yellow(`${result.warningCount} warning${result.warningCount > 1 ? "s" : ""}`));
  }
  if (result.infoCount > 0) {
    parts.push(pc.blue(`${result.infoCount} info`));
  }

  let summary = `  ${result.diagnostics.length} problem${result.diagnostics.length > 1 ? "s" : ""} (${parts.join(", ")})`;
  if (result.fixableCount > 0) {
    summary += pc.dim(`  ${result.fixableCount} fixable with --fix`);
  }
  return summary;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatText(
  results: LintResult[],
  options?: FormatOptions,
): string {
  const lines: string[] = [];
  const verbose = options?.verbose ?? false;
  const elapsedMs = options?.elapsedMs;

  lines.push("");

  for (const result of results) {
    const hasIssues = result.diagnostics.length > 0;

    // In default mode, skip clean skills entirely
    if (!hasIssues && !verbose) {
      continue;
    }

    const displayPath = result.displayPath ?? relative(process.cwd(), result.skillPath);
    lines.push(pc.underline(displayPath));
    lines.push("");

    if (!hasIssues) {
      // verbose mode: show "No issues found" per skill
      lines.push(`  ${pc.green("No issues found")}`);
    } else {
      const sorted = [...result.diagnostics].sort(
        (a, b) =>
          SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
          (a.location.startLine ?? 0) - (b.location.startLine ?? 0),
      );

      for (const d of sorted) {
        lines.push(formatDiagnostic(d));
      }
    }

    lines.push("");

    if (hasIssues) {
      lines.push(formatPerSkillSummary(result));
    }

    lines.push("");
  }

  // Aggregate summary across all skills
  if (results.length > 0) {
    const totalErrors = results.reduce((s, r) => s + r.errorCount, 0);
    const totalWarnings = results.reduce((s, r) => s + r.warningCount, 0);
    const totalInfo = results.reduce((s, r) => s + r.infoCount, 0);
    const totalFixable = results.reduce((s, r) => s + r.fixableCount, 0);
    const totalProblems = totalErrors + totalWarnings + totalInfo;

    const skillWord = results.length === 1 ? "skill" : "skills";
    const timingSuffix = elapsedMs !== undefined
      ? pc.dim(` in ${formatElapsed(elapsedMs)}`)
      : "";

    if (totalProblems === 0) {
      lines.push(
        pc.green(`${pc.bold("\u2714")} ${results.length} ${skillWord} checked, no problems found`) + timingSuffix,
      );
    } else {
      const parts: string[] = [];
      if (totalErrors > 0) {
        parts.push(pc.red(`${totalErrors} error${totalErrors > 1 ? "s" : ""}`));
      }
      if (totalWarnings > 0) {
        parts.push(pc.yellow(`${totalWarnings} warning${totalWarnings > 1 ? "s" : ""}`));
      }
      if (totalInfo > 0) {
        parts.push(pc.blue(`${totalInfo} info`));
      }

      let summary = `${results.length} ${skillWord} checked, ${totalProblems} problem${totalProblems > 1 ? "s" : ""} (${parts.join(", ")})`;
      if (totalFixable > 0) {
        summary += pc.dim(`  ${totalFixable} fixable with --fix`);
      }
      summary += timingSuffix;
      lines.push(summary);
    }

    lines.push("");
  }

  return lines.join("\n");
}

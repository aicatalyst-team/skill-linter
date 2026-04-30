import type { LintResult } from "../engine/types.js";
import { VERSION } from "../version.js";

interface JsonOutput {
  version: string;
  summary: {
    skillCount: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    fixableCount: number;
  };
  skills: Array<{
    path: string;
    diagnostics: Array<{
      ruleId: string;
      severity: string;
      message: string;
      category: string;
      location: {
        file: string;
        startLine?: number;
        startColumn?: number;
      };
      fixable: boolean;
    }>;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    fixableCount: number;
  }>;
}

export function formatJson(results: LintResult[]): string {
  const output: JsonOutput = {
    version: VERSION,
    summary: {
      skillCount: results.length,
      errorCount: results.reduce((s, r) => s + r.errorCount, 0),
      warningCount: results.reduce((s, r) => s + r.warningCount, 0),
      infoCount: results.reduce((s, r) => s + r.infoCount, 0),
      fixableCount: results.reduce((s, r) => s + r.fixableCount, 0),
    },
    skills: results.map((r) => ({
      path: r.displayPath ?? r.skillPath,
      diagnostics: r.diagnostics.map((d) => ({
        ruleId: d.ruleId,
        severity: d.severity,
        message: d.message,
        category: d.category,
        location: {
          file: d.location.file,
          startLine: d.location.startLine,
          startColumn: d.location.startColumn,
        },
        fixable: d.fix !== undefined,
      })),
      errorCount: r.errorCount,
      warningCount: r.warningCount,
      infoCount: r.infoCount,
      fixableCount: r.fixableCount,
    })),
  };

  return JSON.stringify(output, null, 2) + "\n";
}

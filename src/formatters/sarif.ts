import {
  SarifBuilder,
  SarifRunBuilder,
  SarifResultBuilder,
  SarifRuleBuilder,
} from "node-sarif-builder";
import type { LintResult, Severity } from "../engine/types.js";
import { VERSION } from "../version.js";

const SEVERITY_TO_LEVEL: Record<Severity, "error" | "warning" | "note"> = {
  error: "error",
  warning: "warning",
  info: "note",
};

export function formatSarif(results: LintResult[]): string {
  const sarifBuilder = new SarifBuilder();
  const runBuilder = new SarifRunBuilder().initSimple({
    toolDriverName: "skill-linter",
    toolDriverVersion: VERSION,
  });

  const registeredRules = new Set<string>();

  for (const result of results) {
    for (const diag of result.diagnostics) {
      if (!registeredRules.has(diag.ruleId)) {
        const ruleBuilder = new SarifRuleBuilder().initSimple({
          ruleId: diag.ruleId,
          shortDescriptionText: diag.ruleDescription ?? diag.ruleId,
        });
        runBuilder.addRule(ruleBuilder);
        registeredRules.add(diag.ruleId);
      }

      const resultBuilder = new SarifResultBuilder().initSimple({
        ruleId: diag.ruleId,
        level: SEVERITY_TO_LEVEL[diag.severity],
        messageText: diag.message,
        fileUri: diag.location.file,
        startLine: diag.location.startLine ?? 1,
        startColumn: diag.location.startColumn ?? 1,
      });

      runBuilder.addResult(resultBuilder);
    }
  }

  sarifBuilder.addRun(runBuilder);
  const sarifOutput = sarifBuilder.buildSarifOutput();
  return JSON.stringify(sarifOutput, null, 2) + "\n";
}

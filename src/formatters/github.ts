import type { LintResult, Severity } from "../engine/types.js";

const SEVERITY_COMMAND: Record<Severity, string> = {
  error: "error",
  warning: "warning",
  info: "notice",
};

function escapeAnnotationValue(value: string): string {
  return value
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A")
    .replace(/::/g, "%3A%3A");
}

export function formatGithub(results: LintResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    for (const diag of result.diagnostics) {
      const cmd = SEVERITY_COMMAND[diag.severity];
      const file = diag.location.file;
      const line = diag.location.startLine ?? 1;
      const col = diag.location.startColumn ?? 1;
      const title = escapeAnnotationValue(diag.ruleId);
      const message = escapeAnnotationValue(diag.message);

      let params = `file=${file},line=${line},col=${col}`;
      if (diag.location.endLine) {
        params += `,endLine=${diag.location.endLine}`;
      }
      if (diag.location.endColumn) {
        params += `,endColumn=${diag.location.endColumn}`;
      }
      params += `,title=${title}`;

      lines.push(`::${cmd} ${params}::${message}`);
    }
  }

  return lines.join("\n") + (lines.length > 0 ? "\n" : "");
}

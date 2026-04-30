import type { LintResult } from "../engine/types.js";
import { formatText } from "./text.js";
import { formatJson } from "./json.js";
import { formatSarif } from "./sarif.js";
import { formatGithub } from "./github.js";

export type FormatType = "text" | "json" | "sarif" | "github";

export interface FormatOptions {
  verbose?: boolean;
  elapsedMs?: number;
}

export function format(
  results: LintResult[],
  type: FormatType,
  options?: FormatOptions,
): string {
  switch (type) {
    case "text":
      return formatText(results, options);
    case "json":
      return formatJson(results);
    case "sarif":
      return formatSarif(results);
    case "github":
      return formatGithub(results);
  }
}

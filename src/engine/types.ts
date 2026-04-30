export type Severity = "error" | "warning" | "info";

export type RuleCategory =
  | "structural"
  | "frontmatter"
  | "content"
  | "security"
  | "best-practices";

export interface DiagnosticLocation {
  file: string;
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
}

export interface DiagnosticFix {
  description: string;
  replacement?: string;
}

export interface Diagnostic {
  ruleId: string;
  severity: Severity;
  message: string;
  location: DiagnosticLocation;
  fix?: DiagnosticFix;
  category: RuleCategory;
  ruleDescription?: string;
}

export interface RuleMeta {
  id: string;
  type: "problem" | "suggestion" | "security";
  defaultSeverity: Severity;
  fixable: boolean;
  description: string;
  category: RuleCategory;
  messages: Record<string, string>;
}

export interface ReportDescriptor {
  messageId: string;
  data?: Record<string, string | number>;
  location?: Partial<DiagnosticLocation>;
  fix?: DiagnosticFix;
  severityOverride?: Severity;
}

export interface RuleContext {
  skill: import("../parser/types.js").ParsedSkill;
  report(descriptor: ReportDescriptor): void;
  severity: Severity;
  options: unknown[];
}

export interface Rule {
  meta: RuleMeta;
  create(context: RuleContext): void | Promise<void>;
}

export interface LintResult {
  skillPath: string;
  displayPath?: string;
  diagnostics: Diagnostic[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fixableCount: number;
  parsedSkill?: import("../parser/types.js").ParsedSkill;
}

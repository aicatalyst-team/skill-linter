import { describe, it, expect } from "vitest";
import { formatSarif } from "../../../src/formatters/sarif.js";
import type { LintResult } from "../../../src/engine/types.js";

describe("SARIF formatter", () => {
  it("produces valid SARIF JSON", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [
        {
          ruleId: "frontmatter/name-required",
          severity: "error",
          message: "missing name",
          location: { file: "SKILL.md", startLine: 1, startColumn: 1 },
          category: "frontmatter",
        },
      ],
      errorCount: 1,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 0,
    };

    const output = formatSarif([result]);
    const parsed = JSON.parse(output);

    expect(parsed.$schema).toContain("sarif");
    expect(parsed.version).toBe("2.1.0");
    expect(parsed.runs).toHaveLength(1);
    expect(parsed.runs[0].tool.driver.name).toBe("skilleval");
    expect(parsed.runs[0].results).toHaveLength(1);
    expect(parsed.runs[0].results[0].ruleId).toBe("frontmatter/name-required");
    expect(parsed.runs[0].results[0].level).toBe("error");
  });

  it("maps severity levels correctly", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [
        {
          ruleId: "rule/error",
          severity: "error",
          message: "err",
          location: { file: "SKILL.md", startLine: 1 },
          category: "structural",
        },
        {
          ruleId: "rule/warning",
          severity: "warning",
          message: "warn",
          location: { file: "SKILL.md", startLine: 2 },
          category: "content",
        },
        {
          ruleId: "rule/info",
          severity: "info",
          message: "info",
          location: { file: "SKILL.md", startLine: 3 },
          category: "best-practices",
        },
      ],
      errorCount: 1,
      warningCount: 1,
      infoCount: 1,
      fixableCount: 0,
    };

    const output = formatSarif([result]);
    const parsed = JSON.parse(output);
    const results = parsed.runs[0].results;

    expect(results[0].level).toBe("error");
    expect(results[1].level).toBe("warning");
    expect(results[2].level).toBe("note");
  });

  it("deduplicates rules across results", () => {
    const results: LintResult[] = [
      {
        skillPath: "/test/skill-a",
        diagnostics: [
          {
            ruleId: "frontmatter/name-required",
            severity: "error",
            message: "missing",
            location: { file: "SKILL.md", startLine: 1 },
            category: "frontmatter",
          },
        ],
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        fixableCount: 0,
      },
      {
        skillPath: "/test/skill-b",
        diagnostics: [
          {
            ruleId: "frontmatter/name-required",
            severity: "error",
            message: "missing",
            location: { file: "SKILL.md", startLine: 1 },
            category: "frontmatter",
          },
        ],
        errorCount: 1,
        warningCount: 0,
        infoCount: 0,
        fixableCount: 0,
      },
    ];

    const output = formatSarif(results);
    const parsed = JSON.parse(output);
    const rules = parsed.runs[0].tool.driver.rules;
    expect(rules).toHaveLength(1);
    expect(parsed.runs[0].results).toHaveLength(2);
  });

  it("handles empty results", () => {
    const output = formatSarif([]);
    const parsed = JSON.parse(output);
    expect(parsed.runs).toHaveLength(1);
    expect(parsed.runs[0].results).toHaveLength(0);
  });

  it("uses ruleDescription for SARIF rule shortDescription", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [
        {
          ruleId: "frontmatter/name-required",
          severity: "error",
          message: "missing name field",
          location: { file: "SKILL.md", startLine: 1 },
          category: "frontmatter",
          ruleDescription: "Skill must have a name field in frontmatter",
        },
      ],
      errorCount: 1,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 0,
    };

    const output = formatSarif([result]);
    const parsed = JSON.parse(output);
    const rule = parsed.runs[0].tool.driver.rules[0];
    expect(rule.shortDescription.text).toBe("Skill must have a name field in frontmatter");
  });

  it("falls back to ruleId when ruleDescription is absent", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [
        {
          ruleId: "frontmatter/name-required",
          severity: "error",
          message: "missing name",
          location: { file: "SKILL.md", startLine: 1 },
          category: "frontmatter",
        },
      ],
      errorCount: 1,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 0,
    };

    const output = formatSarif([result]);
    const parsed = JSON.parse(output);
    const rule = parsed.runs[0].tool.driver.rules[0];
    expect(rule.shortDescription.text).toBe("frontmatter/name-required");
  });

  it("reads version from package.json", () => {
    const output = formatSarif([]);
    const parsed = JSON.parse(output);
    expect(parsed.runs[0].tool.driver.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

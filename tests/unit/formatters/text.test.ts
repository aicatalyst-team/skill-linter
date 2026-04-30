import { describe, it, expect } from "vitest";
import { formatText } from "../../../src/formatters/text.js";
import type { LintResult } from "../../../src/engine/types.js";

describe("Text formatter", () => {
  it("shows aggregate summary for clean results", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 0,
    };

    const output = formatText([result]);
    expect(output).toContain("1 skill checked, no problems found");
    // Clean skills are not listed individually in default mode
    expect(output).not.toContain("No issues found");
  });

  it("shows 'No issues found' per skill in verbose mode", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 0,
    };

    const output = formatText([result], { verbose: true });
    expect(output).toContain("No issues found");
    expect(output).toContain("1 skill checked, no problems found");
  });

  it("shows diagnostics sorted by severity then line", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [
        {
          ruleId: "content/body-not-empty",
          severity: "warning",
          message: "body is empty",
          location: { file: "SKILL.md", startLine: 5 },
          category: "content",
        },
        {
          ruleId: "frontmatter/name-required",
          severity: "error",
          message: "missing name",
          location: { file: "SKILL.md", startLine: 1 },
          category: "frontmatter",
        },
        {
          ruleId: "best-practices/has-examples",
          severity: "info",
          message: "no examples",
          location: { file: "SKILL.md", startLine: 10 },
          category: "best-practices",
        },
      ],
      errorCount: 1,
      warningCount: 1,
      infoCount: 1,
      fixableCount: 0,
    };

    const output = formatText([result]);
    // Errors should appear before warnings, warnings before info
    const errorIdx = output.indexOf("missing name");
    const warningIdx = output.indexOf("body is empty");
    const infoIdx = output.indexOf("no examples");
    expect(errorIdx).toBeLessThan(warningIdx);
    expect(warningIdx).toBeLessThan(infoIdx);
  });

  it("shows problem count summary", () => {
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

    const output = formatText([result]);
    expect(output).toContain("1 problem");
    expect(output).toContain("1 error");
  });

  it("shows fixable count hint when present", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [
        {
          ruleId: "frontmatter/name-format",
          severity: "error",
          message: "bad name",
          location: { file: "SKILL.md", startLine: 2 },
          fix: { description: "lowercase name", replacement: "my-skill" },
          category: "frontmatter",
        },
      ],
      errorCount: 1,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 1,
    };

    const output = formatText([result]);
    expect(output).toContain("fixable with --fix");
  });

  it("uses displayPath when provided in verbose mode", () => {
    const result: LintResult = {
      skillPath: "/tmp/some-temp-path/my-skill",
      displayPath: "owner/repo:skills/my-skill",
      diagnostics: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 0,
    };

    const output = formatText([result], { verbose: true });
    expect(output).toContain("owner/repo:skills/my-skill");
  });

  it("shows displayPath for skills with issues regardless of verbose", () => {
    const result: LintResult = {
      skillPath: "/tmp/some-temp-path/my-skill",
      displayPath: "owner/repo:skills/my-skill",
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

    const output = formatText([result]);
    expect(output).toContain("owner/repo:skills/my-skill");
  });

  it("shows aggregate summary across multiple skills", () => {
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
            ruleId: "content/body-not-empty",
            severity: "warning",
            message: "empty body",
            location: { file: "SKILL.md", startLine: 1 },
            category: "content",
          },
        ],
        errorCount: 0,
        warningCount: 1,
        infoCount: 0,
        fixableCount: 0,
      },
      {
        skillPath: "/test/skill-c",
        diagnostics: [],
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        fixableCount: 0,
      },
    ];

    const output = formatText(results);
    expect(output).toContain("3 skills checked");
    expect(output).toContain("2 problems");
    expect(output).toContain("1 error");
    expect(output).toContain("1 warning");
    // Clean skill-c should not appear in default mode
    expect(output).not.toContain("skill-c");
  });

  it("shows timing in aggregate summary when provided", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 0,
    };

    const output = formatText([result], { elapsedMs: 150 });
    expect(output).toContain("150ms");

    const output2 = formatText([result], { elapsedMs: 2500 });
    expect(output2).toContain("2.5s");
  });
});

import { describe, it, expect } from "vitest";
import { formatGithub } from "../../../src/formatters/github.js";
import type { LintResult } from "../../../src/engine/types.js";

describe("GitHub formatter", () => {
  it("produces correct annotation format", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [
        {
          ruleId: "security/no-curl-bash",
          severity: "error",
          message: "Pipe-to-shell detected",
          location: { file: "SKILL.md", startLine: 5, startColumn: 1 },
          category: "security",
        },
        {
          ruleId: "content/has-headings",
          severity: "info",
          message: "No headings",
          location: { file: "SKILL.md", startLine: 3, startColumn: 1 },
          category: "content",
        },
      ],
      errorCount: 1,
      warningCount: 0,
      infoCount: 1,
      fixableCount: 0,
    };

    const output = formatGithub([result]);
    expect(output).toContain("::error file=SKILL.md,line=5,col=1,title=security/no-curl-bash::Pipe-to-shell detected");
    expect(output).toContain("::notice file=SKILL.md,line=3,col=1,title=content/has-headings::No headings");
  });

  it("returns empty for no diagnostics", () => {
    const result: LintResult = {
      skillPath: "/test/clean",
      diagnostics: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 0,
    };

    expect(formatGithub([result])).toBe("");
  });

  it("includes endLine and endColumn when present", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [
        {
          ruleId: "content/body-token-budget",
          severity: "warning",
          message: "Too many tokens",
          location: {
            file: "SKILL.md",
            startLine: 5,
            startColumn: 1,
            endLine: 50,
            endColumn: 10,
          },
          category: "content",
        },
      ],
      errorCount: 0,
      warningCount: 1,
      infoCount: 0,
      fixableCount: 0,
    };

    const output = formatGithub([result]);
    expect(output).toContain("line=5,col=1,endLine=50,endColumn=10,title=");
  });

  it("escapes special characters in messages", () => {
    const result: LintResult = {
      skillPath: "/test/my-skill",
      diagnostics: [
        {
          ruleId: "test/rule",
          severity: "error",
          message: "Found pattern:: with\nnewline",
          location: { file: "SKILL.md", startLine: 1 },
          category: "security",
        },
      ],
      errorCount: 1,
      warningCount: 0,
      infoCount: 0,
      fixableCount: 0,
    };

    const output = formatGithub([result]);
    // :: in message should be escaped as %3A%3A
    expect(output).toContain("Found pattern%3A%3A");
    // newline in message should be escaped as %0A
    expect(output).toContain("with%0Anewline");
    // The message portion (after title=test/rule::) should not contain raw newlines
    // Extract the message by splitting on the annotation separator
    const parts = output.split("title=test/rule::");
    expect(parts).toHaveLength(2);
    const messagePart = parts[1];
    expect(messagePart.trim()).toBe("Found pattern%3A%3A with%0Anewline");
  });
});

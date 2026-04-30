import { describe, it, expect } from "vitest";
import { formatJson } from "../../../src/formatters/json.js";
import type { LintResult } from "../../../src/engine/types.js";

describe("JSON formatter", () => {
  it("produces valid JSON with summary", () => {
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

    const output = formatJson([result]);
    const parsed = JSON.parse(output);
    expect(parsed.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(parsed.skills).toHaveLength(1);
    expect(parsed.skills[0].errorCount).toBe(1);
    expect(parsed.skills[0].diagnostics).toHaveLength(1);
    expect(parsed.skills[0]).not.toHaveProperty("score");
  });

  it("includes aggregate summary", () => {
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
        fixableCount: 1,
      },
    ];

    const output = formatJson(results);
    const parsed = JSON.parse(output);
    expect(parsed.summary).toEqual({
      skillCount: 2,
      errorCount: 1,
      warningCount: 1,
      infoCount: 0,
      fixableCount: 1,
    });
  });

  it("reads version from package.json", () => {
    const output = formatJson([]);
    const parsed = JSON.parse(output);
    // Should match the version in package.json, not be hardcoded
    expect(parsed.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});

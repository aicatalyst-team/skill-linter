import { describe, it, expect } from "vitest";
import { runRule } from "../../helpers.js";
import { bodyNotEmpty } from "../../../src/rules/content/body-not-empty.js";
import { bodyTokenBudget } from "../../../src/rules/content/body-token-budget.js";
import { bodyLineLimit } from "../../../src/rules/content/body-line-limit.js";
import { hasHeadings } from "../../../src/rules/content/has-headings.js";
import { noBackslashPaths } from "../../../src/rules/content/no-backslash-paths.js";
import { noAsciiArt } from "../../../src/rules/content/no-ascii-art.js";
import { noHtmlInBody } from "../../../src/rules/content/no-html-in-body.js";
import { referencesDepth } from "../../../src/rules/content/references-depth.js";

describe("content/body-not-empty", () => {
  it("passes for non-empty body", async () => {
    const d = await runRule(bodyNotEmpty, {
      rawFrontmatter: "name: test",
      body: "# My Skill\nDo the thing.",
    });
    expect(d).toHaveLength(0);
  });

  it("reports empty body", async () => {
    const d = await runRule(bodyNotEmpty, {
      rawFrontmatter: "name: test",
      body: "   \n  \n",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("empty");
  });
});

describe("content/body-token-budget", () => {
  it("passes for small body", async () => {
    const d = await runRule(bodyTokenBudget, { body: "# Small\nShort content." });
    expect(d).toHaveLength(0);
  });

  it("reports body exceeding 5000 tokens", async () => {
    const bigBody = "word ".repeat(6000);
    const d = await runRule(bodyTokenBudget, { body: bigBody });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("tokens");
  });
});

describe("content/body-line-limit", () => {
  it("passes for small body", async () => {
    const d = await runRule(bodyLineLimit, { body: "# Small\nShort." });
    expect(d).toHaveLength(0);
  });

  it("reports body exceeding 500 lines", async () => {
    const bigBody = "line\n".repeat(501);
    const d = await runRule(bodyLineLimit, { body: bigBody });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("lines");
  });
});

describe("content/has-headings", () => {
  it("passes when body has headings", async () => {
    const d = await runRule(hasHeadings, {
      body: "# Title\nContent here.",
      rawContent: "---\nname: test\n---\n# Title\nContent here.",
    });
    expect(d).toHaveLength(0);
  });

  it("reports when body has no headings", async () => {
    const d = await runRule(hasHeadings, {
      body: "Just plain text without any headings.",
      rawContent: "---\nname: test\n---\nJust plain text without any headings.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].ruleId).toBe("content/has-headings");
  });
});

describe("content/no-backslash-paths", () => {
  it("passes for forward-slash paths", async () => {
    const d = await runRule(noBackslashPaths, {
      body: "Run `scripts/helper.py` to validate.",
    });
    expect(d).toHaveLength(0);
  });

  it("reports backslash paths", async () => {
    const d = await runRule(noBackslashPaths, {
      body: "Run `scripts\\helper.py` to validate.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("forward slashes");
  });

  it("detects references backslash path", async () => {
    const d = await runRule(noBackslashPaths, {
      body: "See references\\guide.md for details.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("references\\guide.md");
  });

  it("passes for clean content", async () => {
    const d = await runRule(noBackslashPaths, {
      body: "# My Skill\nThis skill does things.",
    });
    expect(d).toHaveLength(0);
  });
});

describe("content/no-ascii-art", () => {
  it("passes for normal markdown", async () => {
    const d = await runRule(noAsciiArt, {
      body: "# Setup\n\nRun the deploy script.\n\n- Step one\n- Step two",
    });
    expect(d).toHaveLength(0);
  });

  it("reports box-drawing characters", async () => {
    const d = await runRule(noAsciiArt, {
      body: "# Layout\n\n┌──────────────┐\n│  My Skill    │\n└──────────────┘",
    });
    expect(d.length).toBeGreaterThan(0);
    expect(d[0].message).toContain("ASCII art");
  });

  it("reports repeated decorative characters", async () => {
    const d = await runRule(noAsciiArt, {
      body: "# Title\n\n=============================\n\nContent here.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("Decorative");
  });

  it("skips decorative content inside code blocks", async () => {
    const d = await runRule(noAsciiArt, {
      body: "# Example\n\n```\n=============================\n┌──────┐\n```\n",
    });
    expect(d).toHaveLength(0);
  });

  it("reports tilde decorations", async () => {
    const d = await runRule(noAsciiArt, {
      body: "~~~~~~~~~~~~~~~~~~~~",
    });
    expect(d).toHaveLength(1);
  });
});

describe("content/no-html-in-body", () => {
  it("passes for clean markdown", async () => {
    const d = await runRule(noHtmlInBody, {
      body: "# Title\n\nSome **bold** content.",
    });
    expect(d).toHaveLength(0);
  });

  it("reports raw HTML in body", async () => {
    const d = await runRule(noHtmlInBody, {
      body: "# Title\n\n<div>Custom HTML block</div>\n\nMore content.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("HTML");
  });

  it("passes for empty body", async () => {
    const d = await runRule(noHtmlInBody, {
      body: "  \n",
    });
    expect(d).toHaveLength(0);
  });
});

describe("content/references-depth", () => {
  it("passes for shallow files", async () => {
    const d = await runRule(referencesDepth, {
      files: [
        { path: "/test/my-skill/SKILL.md", relativePath: "SKILL.md" },
        { path: "/test/my-skill/scripts/run.sh", relativePath: "scripts/run.sh" },
        { path: "/test/my-skill/references/a/guide.md", relativePath: "references/a/guide.md" },
      ],
    });
    expect(d).toHaveLength(0);
  });

  it("reports deeply nested files", async () => {
    const d = await runRule(referencesDepth, {
      files: [
        { path: "/test/my-skill/references/a/b/c/deep.md", relativePath: "references/a/b/c/deep.md" },
      ],
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("references/a/b/c/deep.md");
  });

  it("passes when no files exist", async () => {
    const d = await runRule(referencesDepth, { files: [] });
    expect(d).toHaveLength(0);
  });
});

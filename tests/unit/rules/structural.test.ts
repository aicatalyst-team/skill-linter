import { describe, it, expect } from "vitest";
import { runRule } from "../../helpers.js";
import { skillMdExists } from "../../../src/rules/structural/skill-md-exists.js";
import { directoryStructure } from "../../../src/rules/structural/directory-structure.js";
import { noExtraTopLevelFiles } from "../../../src/rules/structural/no-extra-top-level-files.js";
import { fileReferencesValid } from "../../../src/rules/structural/file-references-valid.js";

describe("structural/skill-md-exists", () => {
  it("passes when SKILL.md exists (no parse errors)", async () => {
    const diagnostics = await runRule(skillMdExists, {
      parseErrors: [],
    });
    expect(diagnostics).toHaveLength(0);
  });

  it("reports when SKILL.md is not found", async () => {
    const diagnostics = await runRule(skillMdExists, {
      parseErrors: ["SKILL.md not found"],
      dirPath: "/test/my-skill",
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("SKILL.md not found");
  });
});

describe("structural/directory-structure", () => {
  it("passes for standard directories", async () => {
    const d = await runRule(directoryStructure, {
      files: [
        { path: "/test/my-skill/scripts/run.sh", relativePath: "scripts/run.sh" },
        { path: "/test/my-skill/references/guide.md", relativePath: "references/guide.md" },
        { path: "/test/my-skill/assets/logo.png", relativePath: "assets/logo.png" },
        { path: "/test/my-skill/SKILL.md", relativePath: "SKILL.md" },
      ],
    });
    expect(d).toHaveLength(0);
  });

  it("reports non-standard directories", async () => {
    const d = await runRule(directoryStructure, {
      files: [
        { path: "/test/my-skill/custom/data.json", relativePath: "custom/data.json" },
        { path: "/test/my-skill/SKILL.md", relativePath: "SKILL.md" },
      ],
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("custom");
  });

  it("ignores hidden directories", async () => {
    const d = await runRule(directoryStructure, {
      files: [
        { path: "/test/my-skill/.vscode/settings.json", relativePath: ".vscode/settings.json" },
      ],
    });
    expect(d).toHaveLength(0);
  });

  it("passes for evals and prompts directories", async () => {
    const d = await runRule(directoryStructure, {
      files: [
        { path: "/test/my-skill/evals/test.json", relativePath: "evals/test.json" },
        { path: "/test/my-skill/prompts/system.md", relativePath: "prompts/system.md" },
      ],
    });
    expect(d).toHaveLength(0);
  });
});

describe("structural/no-extra-top-level-files", () => {
  it("passes for expected files", async () => {
    const d = await runRule(noExtraTopLevelFiles, {
      files: [
        { path: "/test/my-skill/SKILL.md", relativePath: "SKILL.md" },
        { path: "/test/my-skill/LICENSE", relativePath: "LICENSE" },
        { path: "/test/my-skill/README.md", relativePath: "README.md" },
      ],
    });
    expect(d).toHaveLength(0);
  });

  it("reports unexpected top-level files", async () => {
    const d = await runRule(noExtraTopLevelFiles, {
      files: [
        { path: "/test/my-skill/SKILL.md", relativePath: "SKILL.md" },
        { path: "/test/my-skill/random.txt", relativePath: "random.txt" },
        { path: "/test/my-skill/config.yaml", relativePath: "config.yaml" },
      ],
    });
    expect(d).toHaveLength(2);
    expect(d[0].message).toContain("random.txt");
    expect(d[1].message).toContain("config.yaml");
  });

  it("ignores files in subdirectories", async () => {
    const d = await runRule(noExtraTopLevelFiles, {
      files: [
        { path: "/test/my-skill/SKILL.md", relativePath: "SKILL.md" },
        { path: "/test/my-skill/scripts/run.sh", relativePath: "scripts/run.sh" },
      ],
    });
    expect(d).toHaveLength(0);
  });

  it("ignores hidden files", async () => {
    const d = await runRule(noExtraTopLevelFiles, {
      files: [
        { path: "/test/my-skill/.gitignore", relativePath: ".gitignore" },
      ],
    });
    expect(d).toHaveLength(0);
  });
});

describe("structural/file-references-valid", () => {
  it("passes when no local file references exist", async () => {
    const d = await runRule(fileReferencesValid, {
      body: "# Guide\n\nNo links here.",
    });
    expect(d).toHaveLength(0);
  });

  it("passes for external URLs", async () => {
    const d = await runRule(fileReferencesValid, {
      body: "See [docs](https://example.com) and [more](http://example.org).",
    });
    expect(d).toHaveLength(0);
  });

  it("passes for anchor links", async () => {
    const d = await runRule(fileReferencesValid, {
      body: "See [section](#setup) for details.",
    });
    expect(d).toHaveLength(0);
  });

  it("reports broken local file references", async () => {
    const d = await runRule(fileReferencesValid, {
      dirPath: "/tmp/nonexistent-skill-dir-xyz",
      body: "See [guide](references/guide.md) for details.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("references/guide.md");
  });

  it("reports broken image references", async () => {
    const d = await runRule(fileReferencesValid, {
      dirPath: "/tmp/nonexistent-skill-dir-xyz",
      body: "![diagram](assets/arch.png)",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("assets/arch.png");
  });
});

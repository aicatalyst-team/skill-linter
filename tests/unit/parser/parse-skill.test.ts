import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { parseSkill } from "../../../src/parser/index.js";

const FIXTURES = join(import.meta.dirname, "../../fixtures");

describe("parseSkill", () => {
  it("parses a valid minimal skill", async () => {
    const skill = await parseSkill(join(FIXTURES, "valid/minimal-skill"));
    expect(skill.parseErrors).toHaveLength(0);
    expect(skill.frontmatter.name).toBe("minimal-skill");
    expect(skill.frontmatter.description).toContain("minimal skill");
    expect(skill.dirName).toBe("minimal-skill");
    expect(skill.body).toContain("# Minimal Skill");
    expect(skill.bodyStartLine).toBeGreaterThan(1);
  });

  it("parses a full skill with all fields", async () => {
    const skill = await parseSkill(join(FIXTURES, "valid/full-skill"));
    expect(skill.parseErrors).toHaveLength(0);
    expect(skill.frontmatter.name).toBe("full-skill");
    expect(skill.frontmatter.license).toBe("MIT");
    expect(skill.frontmatter.compatibility).toContain("Node.js");
    expect(skill.frontmatter["allowed-tools"]).toContain("Bash");
    expect(skill.frontmatter.metadata).toEqual({
      author: "test-author",
      version: "1.0.0",
    });
    expect(skill.files.length).toBeGreaterThan(0);
  });

  it("returns parse errors for missing SKILL.md", async () => {
    const skill = await parseSkill(join(FIXTURES, "invalid/missing-skill-md"));
    expect(skill.parseErrors).toContain("SKILL.md not found");
  });

  it("extracts frontmatter line numbers", async () => {
    const skill = await parseSkill(join(FIXTURES, "valid/minimal-skill"));
    expect(skill.frontmatterStartLine).toBe(1);
    expect(skill.frontmatterEndLine).toBeGreaterThan(1);
    expect(skill.bodyStartLine).toBe(skill.frontmatterEndLine + 1);
  });

  it("uses dirNameOverride when provided", async () => {
    const skill = await parseSkill(join(FIXTURES, "valid/minimal-skill"), {
      dirNameOverride: "custom-name",
    });
    expect(skill.parseErrors).toHaveLength(0);
    expect(skill.dirName).toBe("custom-name");
    // dirPath should still be the actual path
    expect(skill.dirPath).toContain("minimal-skill");
  });

  it("uses basename when no dirNameOverride is provided", async () => {
    const skill = await parseSkill(join(FIXTURES, "valid/minimal-skill"));
    expect(skill.dirName).toBe("minimal-skill");
  });
});

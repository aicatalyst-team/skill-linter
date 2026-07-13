import { describe, it, expect } from "vitest";
import { runRule } from "../../helpers.js";
import { frontmatterPresent } from "../../../src/rules/frontmatter/frontmatter-present.js";
import { nameRequired } from "../../../src/rules/frontmatter/name-required.js";
import { descriptionRequired } from "../../../src/rules/frontmatter/description-required.js";
import { noExtraFields } from "../../../src/rules/frontmatter/no-extra-fields.js";

describe("frontmatter/frontmatter-present", () => {
  it("passes when frontmatter exists", async () => {
    const diagnostics = await runRule(frontmatterPresent, {
      rawContent: "---\nname: test\n---\n# Body",
    });
    expect(diagnostics).toHaveLength(0);
  });

  it("reports when frontmatter is missing", async () => {
    const diagnostics = await runRule(frontmatterPresent, {
      rawContent: "# No frontmatter here",
      rawFrontmatter: "",
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("no YAML frontmatter");
  });
});

describe("frontmatter/name-required", () => {
  it("passes when name is present", async () => {
    const diagnostics = await runRule(nameRequired, {
      frontmatter: { name: "my-skill", description: "test" },
      rawFrontmatter: "name: my-skill\ndescription: test",
    });
    expect(diagnostics).toHaveLength(0);
  });

  it("reports when name is missing", async () => {
    const diagnostics = await runRule(nameRequired, {
      frontmatter: { description: "test" },
      rawFrontmatter: "description: test",
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("missing");
  });

  it("reports when name is empty", async () => {
    const diagnostics = await runRule(nameRequired, {
      frontmatter: { name: "", description: "test" },
      rawFrontmatter: "name: \ndescription: test",
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("empty");
  });
});

describe("frontmatter/description-required", () => {
  it("passes when description is present", async () => {
    const diagnostics = await runRule(descriptionRequired, {
      frontmatter: { name: "test", description: "A valid description" },
      rawFrontmatter: "name: test\ndescription: A valid description",
    });
    expect(diagnostics).toHaveLength(0);
  });

  it("reports when description is missing", async () => {
    const diagnostics = await runRule(descriptionRequired, {
      frontmatter: { name: "test" },
      rawFrontmatter: "name: test",
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("missing");
  });

  it("reports when description is empty", async () => {
    const diagnostics = await runRule(descriptionRequired, {
      frontmatter: { name: "test", description: "" },
      rawFrontmatter: "name: test\ndescription: ",
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toContain("empty");
  });
});

describe("frontmatter/no-extra-fields", () => {
  it("passes with only allowed fields", async () => {
    const diagnostics = await runRule(noExtraFields, {
      frontmatter: {
        name: "test",
        description: "desc",
        license: "MIT",
        compatibility: "Node 20+",
        "allowed-tools": "Read Bash",
        metadata: { author: "me" },
      },
      rawFrontmatter:
        "name: test\ndescription: desc\nlicense: MIT\ncompatibility: Node 20+\nallowed-tools: Read Bash\nmetadata:\n  author: me",
    });
    expect(diagnostics).toHaveLength(0);
  });

  it("reports extra fields", async () => {
    const diagnostics = await runRule(noExtraFields, {
      frontmatter: { name: "test", description: "d", version: "1.0", author: "x" },
      rawFrontmatter: "name: test\ndescription: d\nversion: '1.0'\nauthor: x",
    });
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics[0].message).toContain("version");
    expect(diagnostics[1].message).toContain("author");
  });

  it("downgrades extension fields to info", async () => {
    const diagnostics = await runRule(noExtraFields, {
      frontmatter: {
        name: "test",
        description: "d",
        "user-invocable": true,
        "argument-hint": "[file]",
        model: "claude-sonnet-4-5",
        effort: "medium",
        context: "fork",
        agent: "Explore",
        when_to_use: "When reviewing PRs",
        arguments: "file branch",
        "disable-model-invocation": true,
        "disallowed-tools": "Write",
        hooks: {},
        paths: "src/**",
        shell: "bash",
      } as any,
      rawFrontmatter:
        "name: test\ndescription: d\nuser-invocable: true\nargument-hint: '[file]'\nmodel: claude-sonnet-4-5\neffort: medium\ncontext: fork\nagent: Explore\nwhen_to_use: When reviewing PRs\narguments: file branch\ndisable-model-invocation: true\ndisallowed-tools: Write\nhooks: {}\npaths: 'src/**'\nshell: bash",
    });
    expect(diagnostics).toHaveLength(13);
    expect(diagnostics.every((d) => d.severity === "info")).toBe(true);
    expect(diagnostics.every((d) => d.message.includes("client extension"))).toBe(true);
  });

  it("downgrades context and agent fields to info", async () => {
    const diagnostics = await runRule(noExtraFields, {
      frontmatter: {
        name: "test",
        description: "d",
        context: "fork",
        agent: "Explore",
      } as any,
      rawFrontmatter: "name: test\ndescription: d\ncontext: fork\nagent: Explore",
    });
    expect(diagnostics).toHaveLength(2);
    expect(diagnostics.every((d) => d.severity === "info")).toBe(true);
    expect(diagnostics[0].message).toContain("context");
    expect(diagnostics[1].message).toContain("agent");
  });

  it("still errors on truly unknown fields alongside extensions", async () => {
    const diagnostics = await runRule(noExtraFields, {
      frontmatter: {
        name: "test",
        description: "d",
        "user-invocable": true,
        bogus: "bad",
      } as any,
      rawFrontmatter: "name: test\ndescription: d\nuser-invocable: true\nbogus: bad",
    });
    const infos = diagnostics.filter((d) => d.severity === "info");
    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(infos).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("bogus");
  });
});

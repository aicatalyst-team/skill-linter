import { describe, it, expect } from "vitest";
import { runRule } from "../../helpers.js";
import { bashOverlyPermissive } from "../../../src/rules/best-practices/bash-overly-permissive.js";

describe("best-practices/bash-overly-permissive", () => {
  it("passes when allowed-tools uses parameterized patterns", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash(glab:*) Read",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash(glab:*) Read",
      body: "```bash\nglab ci get -d\n```\n",
    });
    expect(d).toHaveLength(0);
  });

  it("passes when allowed-tools does not include the shell tool", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Read Write",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Read Write",
      body: "# Steps\n\nJust read and write files.\n",
    });
    expect(d).toHaveLength(0);
  });

  it("passes when body has no code blocks", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash Read",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash Read",
      body: "# Steps\n\nRun some commands as needed.\n",
    });
    expect(d).toHaveLength(0);
  });

  it("detects bare Bash with body only using npm", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash Read",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash Read",
      body: "# Steps\n\n```bash\nnpm install\nnpm test\nnpm run build\n```\n",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("npm");
    expect(d[0].message).toContain("Bash(npm:*)");
  });

  it("detects bare Bash with body only using glab", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: "```bash\nglab ci get -d\nglab mr list\n```\n",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("glab");
    expect(d[0].message).toContain("Bash(glab:*)");
  });

  it("suggests multiple patterns for multiple commands", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: "```bash\ngit status\nnpm test\n```\n",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("git, npm");
    expect(d[0].message).toContain("Bash(git:*) Bash(npm:*)");
  });

  it("does not fire when body uses too many diverse commands", async () => {
    const commands = Array.from({ length: 10 }, (_, i) => `tool${i} --flag`).join("\n");
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: `\`\`\`bash\n${commands}\n\`\`\`\n`,
    });
    expect(d).toHaveLength(0);
  });

  it("skips shell builtins when extracting commands", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: "```bash\nexport FOO=bar\necho hello\nnpm test\n```\n",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("npm");
    expect(d[0].message).not.toContain("echo");
    expect(d[0].message).not.toContain("export");
  });

  it("does not treat bare code blocks as bash", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: "```\nnpm install\n```\n",
    });
    expect(d).toHaveLength(0);
  });

  it("passes when allowed-tools is not a string", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": ["Bash"] as any,
      },
      rawFrontmatter: "name: test\ndescription: test",
      body: "```bash\nnpm test\n```\n",
    });
    expect(d).toHaveLength(0);
  });

  it("strips $ prompt prefix from commands", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: "```bash\n$ npm install\n$ npm test\n```\n",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("npm");
  });

  it("filters out ALL_CAPS variable assignments", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: "```bash\nCLONE_DIR=$(mktemp -d)\ngit clone repo\nrm -rf $CLONE_DIR\n```\n",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("git, rm");
    expect(d[0].message).not.toContain("CLONE_DIR");
  });

  it("ignores bash/sh as narrowable commands", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: "```bash\nbash scripts/run.sh\n```\n",
    });
    expect(d).toHaveLength(0);
  });

  it("ignores bash but keeps other commands", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: "```bash\nbash scripts/setup.sh\nnpm test\n```\n",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("npm");
    expect(d[0].message).not.toContain("bash");
  });

  it("skips output lines in blocks with prompt markers", async () => {
    const d = await runRule(bashOverlyPermissive, {
      frontmatter: {
        name: "test",
        description: "test",
        "allowed-tools": "Bash",
      },
      rawFrontmatter: "name: test\ndescription: test\nallowed-tools: Bash",
      body: "```bash\n$ git clone repo\nCloning into 'repo'...\n$ npm test\n```\n",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("git, npm");
    expect(d[0].message).not.toContain("Cloning");
  });
});

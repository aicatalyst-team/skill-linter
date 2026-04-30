import { describe, it, expect } from "vitest";
import { runRule } from "../../helpers.js";
import { descriptionHasTriggerWords } from "../../../src/rules/best-practices/description-has-trigger-words.js";
import { hasExamples } from "../../../src/rules/best-practices/has-examples.js";
import { gotchasSection } from "../../../src/rules/best-practices/gotchas-section.js";
import { pinnedVersions } from "../../../src/rules/best-practices/pinned-versions.js";
import { noGenericNames } from "../../../src/rules/best-practices/no-generic-names.js";
import { noPersonaInstructions } from "../../../src/rules/best-practices/no-persona-instructions.js";
import { noVagueInstructions } from "../../../src/rules/best-practices/no-vague-instructions.js";
import { descriptionNoFirstPerson } from "../../../src/rules/best-practices/description-no-first-person.js";
import { noTimeSensitiveContent } from "../../../src/rules/best-practices/no-time-sensitive-content.js";
import { noExcessiveNegation } from "../../../src/rules/best-practices/no-excessive-negation.js";
import { nonDescriptiveFilenames } from "../../../src/rules/best-practices/non-descriptive-filenames.js";
import { progressiveDisclosure } from "../../../src/rules/best-practices/progressive-disclosure.js";
import { scriptsAreReferenced } from "../../../src/rules/best-practices/scripts-are-referenced.js";
import { scriptsHaveHelp } from "../../../src/rules/best-practices/scripts-have-help.js";

describe("best-practices/description-has-trigger-words", () => {
  it("passes with trigger phrasing", async () => {
    const d = await runRule(descriptionHasTriggerWords, {
      frontmatter: { description: "Use this skill when deploying to production" },
      rawFrontmatter: "description: Use this skill when deploying to production",
    });
    expect(d).toHaveLength(0);
  });

  it("passes with 'use after' trigger phrasing", async () => {
    const d = await runRule(descriptionHasTriggerWords, {
      frontmatter: { description: "Score and rank backport candidates. Use after the agent completes semantic analysis." },
      rawFrontmatter: "description: Score and rank backport candidates. Use after the agent completes semantic analysis.",
    });
    expect(d).toHaveLength(0);
  });

  it("passes with 'use this skill whenever' phrasing", async () => {
    const d = await runRule(descriptionHasTriggerWords, {
      frontmatter: { description: "Use this skill whenever the user asks to review an ADR" },
      rawFrontmatter: "description: Use this skill whenever the user asks to review an ADR",
    });
    expect(d).toHaveLength(0);
  });

  it("reports missing trigger phrasing", async () => {
    const d = await runRule(descriptionHasTriggerWords, {
      frontmatter: { description: "Deploys to production environments" },
      rawFrontmatter: "description: Deploys to production environments",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("trigger");
  });
});

describe("best-practices/has-examples", () => {
  it("reports no code blocks (empty mdast)", async () => {
    const d = await runRule(hasExamples, { body: "Some content without code." });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("code blocks");
  });
});

describe("best-practices/gotchas-section", () => {
  it("skips short skills", async () => {
    const d = await runRule(gotchasSection, { body: "Short content." });
    expect(d).toHaveLength(0);
  });

  it("reports missing gotchas in long skill", async () => {
    const longBody = "word ".repeat(1200);
    const d = await runRule(gotchasSection, { body: longBody });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("gotchas");
  });

  it("passes when gotchas heading exists", async () => {
    const body = "word ".repeat(1200) + "\n## Gotchas\n\n- Watch out for X";
    const d = await runRule(gotchasSection, { body });
    expect(d).toHaveLength(0);
  });

  it("passes when troubleshooting heading exists", async () => {
    const body = "word ".repeat(1200) + "\n## Troubleshooting\n\n- If X fails, try Y";
    const d = await runRule(gotchasSection, { body });
    expect(d).toHaveLength(0);
  });

  it("passes when error handling heading exists", async () => {
    const body = "word ".repeat(1200) + "\n## Error Handling\n\n- If X fails, check Y";
    const d = await runRule(gotchasSection, { body });
    expect(d).toHaveLength(0);
  });
});

describe("best-practices/pinned-versions", () => {
  it("passes for clean content", async () => {
    const d = await runRule(pinnedVersions, {
      rawContent: "---\nname: test\n---\nnpm install lodash@4.17.21",
    });
    expect(d).toHaveLength(0);
  });

  it("detects unpinned npx", async () => {
    const d = await runRule(pinnedVersions, {
      rawContent: "---\nname: test\n---\nnpx eslint .",
    });
    expect(d.length).toBeGreaterThan(0);
    expect(d[0].message).toContain("npx");
  });
});

describe("best-practices/no-generic-names", () => {
  it("passes for domain-specific names", async () => {
    const d = await runRule(noGenericNames, {
      frontmatter: { name: "pdf-processing" },
      rawFrontmatter: "name: pdf-processing",
    });
    expect(d).toHaveLength(0);
  });

  it("reports generic name 'utils'", async () => {
    const d = await runRule(noGenericNames, {
      frontmatter: { name: "utils" },
      rawFrontmatter: "name: utils",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("generic");
  });

  it("reports generic name 'helper'", async () => {
    const d = await runRule(noGenericNames, {
      frontmatter: { name: "helper" },
      rawFrontmatter: "name: helper",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("generic");
  });

  it("reports generic name 'tools'", async () => {
    const d = await runRule(noGenericNames, {
      frontmatter: { name: "tools" },
      rawFrontmatter: "name: tools",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("generic");
  });

  it("skips when name is missing", async () => {
    const d = await runRule(noGenericNames, {
      frontmatter: { description: "test" },
      rawFrontmatter: "description: test",
    });
    expect(d).toHaveLength(0);
  });
});

describe("best-practices/no-persona-instructions", () => {
  it("passes for normal instructions", async () => {
    const d = await runRule(noPersonaInstructions, {
      body: "# Deployment\n\nRun the deploy script when ready.",
    });
    expect(d).toHaveLength(0);
  });

  it("reports 'You are a...' persona", async () => {
    const d = await runRule(noPersonaInstructions, {
      body: "# Setup\n\nYou are a senior DevOps engineer.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("Persona");
  });

  it("reports 'Act as a...' persona", async () => {
    const d = await runRule(noPersonaInstructions, {
      body: "Act as a database expert and help with queries.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("Persona");
  });

  it("reports 'Assume the role of...' persona", async () => {
    const d = await runRule(noPersonaInstructions, {
      body: "Assume the role of a security auditor.",
    });
    expect(d).toHaveLength(1);
  });

  it("skips persona text inside code blocks", async () => {
    const d = await runRule(noPersonaInstructions, {
      body: "# Example\n\n```\nYou are a helpful assistant.\n```\n",
    });
    expect(d).toHaveLength(0);
  });

  it("downgrades to info when in blockquote", async () => {
    const d = await runRule(noPersonaInstructions, {
      body: "> You are a senior engineer.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].severity).toBe("info");
  });

  it("detects persona in bullet points", async () => {
    const d = await runRule(noPersonaInstructions, {
      body: "- You are a code reviewer.\n- Check all files.",
    });
    expect(d).toHaveLength(1);
  });
});

describe("best-practices/no-vague-instructions", () => {
  it("passes for specific instructions", async () => {
    const d = await runRule(noVagueInstructions, {
      body: "# Steps\n\n- Run pytest with --cov flag\n- Check coverage > 80%\n- Fix any failing tests",
    });
    expect(d).toHaveLength(0);
  });

  it("passes for 1-2 vague phrases (below threshold)", async () => {
    const d = await runRule(noVagueInstructions, {
      body: "# Guidelines\n\n- Follow best practices for error handling\n- Run tests before deploying",
    });
    expect(d).toHaveLength(0);
  });

  it("reports 3+ vague phrases", async () => {
    const d = await runRule(noVagueInstructions, {
      body: "# Guidelines\n\n- Follow best practices\n- Handle errors appropriately\n- Ensure quality of the output",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("vague");
  });

  it("skips vague phrases inside code blocks", async () => {
    const d = await runRule(noVagueInstructions, {
      body: "```\nfollow best practices\nhandle errors appropriately\nensure quality\n```",
    });
    expect(d).toHaveLength(0);
  });
});

describe("best-practices/description-no-first-person", () => {
  it("passes for third-person description", async () => {
    const d = await runRule(descriptionNoFirstPerson, {
      frontmatter: { description: "Processes PDF files and extracts tables" },
      rawFrontmatter: "description: Processes PDF files and extracts tables",
    });
    expect(d).toHaveLength(0);
  });

  it("reports first-person 'I can'", async () => {
    const d = await runRule(descriptionNoFirstPerson, {
      frontmatter: { description: "I can help you process PDF files" },
      rawFrontmatter: "description: I can help you process PDF files",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("third-person");
  });

  it("reports second-person 'You can'", async () => {
    const d = await runRule(descriptionNoFirstPerson, {
      frontmatter: { description: "You can use this to process PDFs" },
      rawFrontmatter: "description: You can use this to process PDFs",
    });
    expect(d).toHaveLength(1);
  });

  it("reports 'We will'", async () => {
    const d = await runRule(descriptionNoFirstPerson, {
      frontmatter: { description: "We will handle all your deployment needs" },
      rawFrontmatter: "description: We will handle all your deployment needs",
    });
    expect(d).toHaveLength(1);
  });

  it("passes for 'Use when...' trigger phrase", async () => {
    const d = await runRule(descriptionNoFirstPerson, {
      frontmatter: { description: "Use when deploying to production" },
      rawFrontmatter: "description: Use when deploying to production",
    });
    expect(d).toHaveLength(0);
  });
});

describe("best-practices/no-time-sensitive-content", () => {
  it("passes for timeless content", async () => {
    const d = await runRule(noTimeSensitiveContent, {
      body: "# Setup\n\nInstall dependencies with npm install.",
    });
    expect(d).toHaveLength(0);
  });

  it("reports 'before Month Year' pattern", async () => {
    const d = await runRule(noTimeSensitiveContent, {
      body: "If before August 2025, use the old API endpoint.",
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("Time-sensitive");
  });

  it("reports 'as of this writing'", async () => {
    const d = await runRule(noTimeSensitiveContent, {
      body: "As of this writing, the latest version is 3.2.",
    });
    expect(d).toHaveLength(1);
  });

  it("reports 'currently supports'", async () => {
    const d = await runRule(noTimeSensitiveContent, {
      body: "The tool currently supports Python 3.10+.",
    });
    expect(d).toHaveLength(1);
  });

  it("skips time-sensitive patterns in code blocks", async () => {
    const d = await runRule(noTimeSensitiveContent, {
      body: "```\ncurrently supports v3\n```",
    });
    expect(d).toHaveLength(0);
  });
});

describe("best-practices/no-excessive-negation", () => {
  it("passes for positive instructions", async () => {
    const d = await runRule(noExcessiveNegation, {
      body: "- Run tests first\n- Check coverage\n- Deploy to staging",
    });
    expect(d).toHaveLength(0);
  });

  it("passes for a few negations below threshold", async () => {
    const body = [
      "- Do the thing",
      "- Run tests",
      "- Don't skip validation",
      "- Never push to main",
      "- Check coverage",
      "- Review the diff",
      "- Deploy carefully",
    ].join("\n");
    const d = await runRule(noExcessiveNegation, { body });
    expect(d).toHaveLength(0);
  });

  it("reports excessive negation (>30% and >=5 negative)", async () => {
    const body = [
      "- Don't use eval",
      "- Never skip tests",
      "- Do not hardcode secrets",
      "- Avoid global state",
      "- Must not use var",
      "- Cannot access production directly",
      "- Run tests",
      "- Check output",
    ].join("\n");
    const d = await runRule(noExcessiveNegation, { body });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("prohibitions");
  });

  it("skips bullets inside code blocks", async () => {
    const body = "```\n- Don't use eval\n- Never skip\n- Avoid globals\n- Must not\n- Cannot do\n```\n- Run tests";
    const d = await runRule(noExcessiveNegation, { body });
    expect(d).toHaveLength(0);
  });
});

describe("best-practices/non-descriptive-filenames", () => {
  it("passes for descriptive filenames", async () => {
    const d = await runRule(nonDescriptiveFilenames, {
      files: [
        { path: "/test/my-skill/references/api-guide.md", relativePath: "references/api-guide.md" },
        { path: "/test/my-skill/scripts/validate.py", relativePath: "scripts/validate.py" },
      ],
    });
    expect(d).toHaveLength(0);
  });

  it("reports generic filename 'doc1.md'", async () => {
    const d = await runRule(nonDescriptiveFilenames, {
      files: [
        { path: "/test/my-skill/references/doc1.md", relativePath: "references/doc1.md" },
      ],
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("doc1.md");
  });

  it("reports generic filename 'data.txt'", async () => {
    const d = await runRule(nonDescriptiveFilenames, {
      files: [
        { path: "/test/my-skill/data.txt", relativePath: "data.txt" },
      ],
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("data.txt");
  });

  it("skips allowed root files", async () => {
    const d = await runRule(nonDescriptiveFilenames, {
      files: [
        { path: "/test/my-skill/SKILL.md", relativePath: "SKILL.md" },
        { path: "/test/my-skill/README.md", relativePath: "README.md" },
        { path: "/test/my-skill/LICENSE", relativePath: "LICENSE" },
      ],
    });
    expect(d).toHaveLength(0);
  });

  it("reports 'notes.md'", async () => {
    const d = await runRule(nonDescriptiveFilenames, {
      files: [
        { path: "/test/my-skill/notes.md", relativePath: "notes.md" },
      ],
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("notes.md");
  });
});

describe("best-practices/progressive-disclosure", () => {
  it("passes for small body", async () => {
    const d = await runRule(progressiveDisclosure, {
      body: "# Small\nShort content.",
    });
    expect(d).toHaveLength(0);
  });

  it("passes when large body has references", async () => {
    const bigBody = "word ".repeat(4000);
    const d = await runRule(progressiveDisclosure, {
      body: bigBody,
      files: [
        { path: "/test/my-skill/references/guide.md", relativePath: "references/guide.md" },
      ],
    });
    expect(d).toHaveLength(0);
  });

  it("reports when large body has no references", async () => {
    const bigBody = "word ".repeat(4000);
    const d = await runRule(progressiveDisclosure, {
      body: bigBody,
      files: [],
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("references/");
  });
});

describe("best-practices/scripts-are-referenced", () => {
  it("passes when no scripts directory exists", async () => {
    const d = await runRule(scriptsAreReferenced, {
      body: "# Guide\nDo the thing.",
      files: [],
    });
    expect(d).toHaveLength(0);
  });

  it("passes when scripts are referenced in body", async () => {
    const d = await runRule(scriptsAreReferenced, {
      body: "# Guide\nRun `scripts/deploy.sh` to deploy.",
      files: [
        { path: "/test/my-skill/scripts/deploy.sh", relativePath: "scripts/deploy.sh" },
      ],
    });
    expect(d).toHaveLength(0);
  });

  it("reports scripts not referenced in body", async () => {
    const d = await runRule(scriptsAreReferenced, {
      body: "# Guide\nDo something manually.",
      files: [
        { path: "/test/my-skill/scripts/deploy.sh", relativePath: "scripts/deploy.sh" },
      ],
    });
    expect(d).toHaveLength(1);
    expect(d[0].message).toContain("deploy.sh");
  });

  it("skips data files in scripts/", async () => {
    const d = await runRule(scriptsAreReferenced, {
      body: "# Guide\nDo the thing.",
      files: [
        { path: "/test/my-skill/scripts/requirements.txt", relativePath: "scripts/requirements.txt" },
        { path: "/test/my-skill/scripts/config.json", relativePath: "scripts/config.json" },
      ],
    });
    expect(d).toHaveLength(0);
  });
});

describe("best-practices/scripts-have-help", () => {
  it("passes when no scripts directory exists", async () => {
    const d = await runRule(scriptsHaveHelp, {
      body: "# Guide",
      files: [],
    });
    expect(d).toHaveLength(0);
  });

  it("skips data files", async () => {
    const d = await runRule(scriptsHaveHelp, {
      files: [
        { path: "/test/my-skill/scripts/requirements.txt", relativePath: "scripts/requirements.txt" },
      ],
    });
    expect(d).toHaveLength(0);
  });
});

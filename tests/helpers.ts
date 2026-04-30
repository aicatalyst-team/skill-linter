import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Root as MdastRoot } from "mdast";
import type { ParsedSkill, FrontmatterData } from "../src/parser/types.js";
import type { RuleContext, Rule, Diagnostic, ReportDescriptor } from "../src/engine/types.js";

const markdownParser = unified().use(remarkParse);

interface TestSkillOptions {
  dirPath?: string;
  dirName?: string;
  skillMdPath?: string;
  rawContent?: string;
  frontmatter?: FrontmatterData;
  rawFrontmatter?: string;
  frontmatterStartLine?: number;
  frontmatterEndLine?: number;
  body?: string;
  bodyStartLine?: number;
  parseErrors?: string[];
  files?: Array<{ path: string; relativePath: string }>;
}

export function createTestSkill(options: TestSkillOptions = {}): ParsedSkill {
  const rawContent = options.rawContent ?? "---\nname: my-skill\n---\n# Test";
  const body = options.body ?? "# Test\n";
  return {
    dirPath: options.dirPath ?? "/test/my-skill",
    dirName: options.dirName ?? "my-skill",
    skillMdPath: options.skillMdPath ?? "/test/my-skill/SKILL.md",
    rawContent,
    rawContentLines: rawContent.split("\n"),
    frontmatter: options.frontmatter ?? { name: "my-skill", description: "A test skill" },
    rawFrontmatter: options.rawFrontmatter ?? "name: my-skill\ndescription: A test skill",
    frontmatterFieldLines: new Map(),
    frontmatterStartLine: options.frontmatterStartLine ?? 1,
    frontmatterEndLine: options.frontmatterEndLine ?? 3,
    body,
    bodyLines: body.split("\n"),
    bodyStartLine: options.bodyStartLine ?? 4,
    mdast: markdownParser.parse(body) as MdastRoot,
    files: options.files ?? [],
    parseErrors: options.parseErrors ?? [],
  };
}

function interpolateMessage(
  template: string,
  data?: Record<string, string | number>,
): string {
  if (!data) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    data[key] !== undefined ? String(data[key]) : `{{${key}}}`,
  );
}

export async function runRule(
  rule: Rule,
  skillOptions: TestSkillOptions = {},
): Promise<Diagnostic[]> {
  const skill = createTestSkill(skillOptions);
  const diagnostics: Diagnostic[] = [];

  const context: RuleContext = {
    skill,
    severity: rule.meta.defaultSeverity,
    options: [],
    report(descriptor: ReportDescriptor) {
      const template = rule.meta.messages[descriptor.messageId] ?? descriptor.messageId;
      const message = interpolateMessage(template, descriptor.data);
      diagnostics.push({
        ruleId: rule.meta.id,
        severity: descriptor.severityOverride ?? context.severity,
        message,
        location: {
          file: descriptor.location?.file ?? skill.skillMdPath,
          startLine: descriptor.location?.startLine,
          startColumn: descriptor.location?.startColumn,
        },
        fix: descriptor.fix,
        category: rule.meta.category,
      });
    },
  };

  await rule.create(context);
  return diagnostics;
}

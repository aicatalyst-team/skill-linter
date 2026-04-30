import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

const MIN_SUBSTANTIVE_LENGTH = 20;
const GENERIC_PATTERNS = [
  /^helps? with/i,
  /^does? /i,
  /^a skill/i,
  /^this skill/i,
  /^skill for/i,
  /^todo/i,
  /^placeholder/i,
  /^test$/i,
  /^just /i,
  /^simply /i,
  /^handles? /i,
  /^manages? /i,
  /^process /i,
  /^do /i,
  /^the /i,
];

export const descriptionQuality: Rule = {
  meta: {
    id: "frontmatter/description-quality",
    type: "suggestion",
    defaultSeverity: "warning",
    fixable: false,
    description:
      "Description should be substantive and specific",
    category: "frontmatter",
    messages: {
      tooShort:
        "Description is only {{length}} characters — should be at least 20 for agents to understand when to activate this skill",
      generic:
        "Description matches a generic pattern. Use imperative phrasing like 'Use when...' to help agents activate this skill correctly",
    },
  },
  create(context) {
    const { skill } = context;
    const desc = skill.frontmatter.description;
    if (typeof desc !== "string" || desc.trim() === "") return;

    const line = findFieldLine(skill.rawFrontmatter, "description", skill.frontmatterStartLine, skill.frontmatterFieldLines);

    if (desc.trim().length < MIN_SUBSTANTIVE_LENGTH) {
      context.report({
        messageId: "tooShort",
        data: { length: String(desc.trim().length) },
        location: { startLine: line },
      });
    }

    for (const pattern of GENERIC_PATTERNS) {
      if (pattern.test(desc.trim())) {
        context.report({
          messageId: "generic",
          location: { startLine: line },
        });
        break;
      }
    }
  },
};

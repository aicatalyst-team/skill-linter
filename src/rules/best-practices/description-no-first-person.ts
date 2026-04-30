import type { Rule } from "../../engine/types.js";
import { findFieldLine } from "../../parser/frontmatter.js";

const FIRST_PERSON_START = /^(I |I'm |I'll |I can |I will |We |We're |We'll |We can |We will |You |You're |You'll |You can |You will )/i;

export const descriptionNoFirstPerson: Rule = {
  meta: {
    id: "best-practices/description-no-first-person",
    type: "suggestion",
    defaultSeverity: "warning",
    fixable: false,
    description:
      "Skill descriptions should use third-person voice, not first or second person",
    category: "best-practices",
    messages: {
      firstPerson:
        "Description starts with '{{match}}' — use third-person voice instead (e.g., 'Processes PDFs…' not 'I can process PDFs…')",
    },
  },
  create(context) {
    const { skill } = context;
    const desc = skill.frontmatter.description;
    if (typeof desc !== "string" || desc.trim() === "") return;

    const match = desc.trim().match(FIRST_PERSON_START);
    if (match) {
      const line = findFieldLine(skill.rawFrontmatter, "description", skill.frontmatterStartLine, skill.frontmatterFieldLines);
      context.report({
        messageId: "firstPerson",
        data: { match: match[1].trim() },
        location: { startLine: line },
      });
    }
  },
};

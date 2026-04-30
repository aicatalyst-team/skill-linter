import { basename } from "node:path";
import type { Rule } from "../../engine/types.js";

const EXPECTED_FILES = new Set([
  "skill.md",
  "license",
  "license.md",
  "license.txt",
  "readme.md",
  "readme",
  "changelog.md",
  "changelog",
]);

export const noExtraTopLevelFiles: Rule = {
  meta: {
    id: "structural/no-extra-top-level-files",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description: "Warn on unexpected files at the skill root level",
    category: "structural",
    messages: {
      unexpected: "Unexpected file '{{file}}' at skill root",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    for (const file of skill.files) {
      // Only top-level files (no directory separator in relative path)
      if (file.relativePath.includes("/")) continue;
      const name = basename(file.relativePath);
      if (!name.startsWith(".") && !EXPECTED_FILES.has(name.toLowerCase())) {
        context.report({
          messageId: "unexpected",
          data: { file: name },
        });
      }
    }
  },
};

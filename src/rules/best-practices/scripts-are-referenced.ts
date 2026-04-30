import { basename } from "node:path";
import type { Rule } from "../../engine/types.js";
import { isDataFile } from "../../utils/script-files.js";

export const scriptsAreReferenced: Rule = {
  meta: {
    id: "best-practices/scripts-are-referenced",
    type: "suggestion",
    defaultSeverity: "warning",
    fixable: false,
    description: "Scripts in scripts/ should be referenced in the SKILL.md body",
    category: "best-practices",
    messages: {
      unreferenced:
        "Script '{{script}}' in scripts/ is not referenced in SKILL.md body — agents won't discover it",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const scriptFiles = skill.files.filter((f) => {
      if (!f.relativePath.startsWith("scripts/")) return false;
      // Only direct children of scripts/ (not nested)
      const rest = f.relativePath.slice("scripts/".length);
      if (rest.includes("/")) return false;
      return !rest.startsWith(".");
    });

    if (scriptFiles.length === 0) return;

    for (const file of scriptFiles) {
      const script = basename(file.relativePath);
      if (isDataFile(script)) continue;

      const refPath = `scripts/${script}`;
      if (!skill.body.includes(script) && !skill.body.includes(refPath)) {
        context.report({
          messageId: "unreferenced",
          data: { script },
        });
      }
    }
  },
};

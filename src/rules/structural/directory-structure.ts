import type { Rule } from "../../engine/types.js";

const KNOWN_DIRS = new Set(["scripts", "references", "assets", "evals", "prompts"]);

export const directoryStructure: Rule = {
  meta: {
    id: "structural/directory-structure",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description: "Warn on non-standard top-level directories",
    category: "structural",
    messages: {
      unknownDir:
        "Non-standard directory '{{dir}}'. Standard directories: scripts/, references/, assets/, evals/",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const topLevelDirs = new Set<string>();
    for (const file of skill.files) {
      const sep = file.relativePath.indexOf("/");
      if (sep !== -1) {
        topLevelDirs.add(file.relativePath.slice(0, sep));
      }
    }

    for (const dir of topLevelDirs) {
      if (!dir.startsWith(".") && !KNOWN_DIRS.has(dir)) {
        context.report({
          messageId: "unknownDir",
          data: { dir },
        });
      }
    }
  },
};

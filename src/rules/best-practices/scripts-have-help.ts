import { readFileSync } from "node:fs";
import { basename } from "node:path";
import type { Rule } from "../../engine/types.js";
import { isDataFile } from "../../utils/script-files.js";

const HELP_INDICATORS = [
  /--help/,
  /argparse/,
  /ArgumentParser/,
  /click\.command/,
  /typer\./,
  /usage:/i,
  /getopts/,
  /getopt/,
];

export const scriptsHaveHelp: Rule = {
  meta: {
    id: "best-practices/scripts-have-help",
    type: "suggestion",
    defaultSeverity: "info",
    fixable: false,
    description: "Scripts should support --help for agentic discoverability",
    category: "best-practices",
    messages: {
      noHelp:
        "Script '{{script}}' does not appear to support --help — agents benefit from self-documenting scripts",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    const scriptFiles = skill.files.filter((f) => {
      if (!f.relativePath.startsWith("scripts/")) return false;
      const rest = f.relativePath.slice("scripts/".length);
      if (rest.includes("/")) return false;
      return !rest.startsWith(".");
    });

    if (scriptFiles.length === 0) return;

    for (const file of scriptFiles) {
      const script = basename(file.relativePath);
      if (isDataFile(script)) continue;

      let content: string;
      try {
        content = readFileSync(file.path, "utf-8");
      } catch {
        continue;
      }

      const hasHelp = HELP_INDICATORS.some((p) => p.test(content));
      if (!hasHelp) {
        context.report({
          messageId: "noHelp",
          data: { script },
        });
      }
    }
  },
};

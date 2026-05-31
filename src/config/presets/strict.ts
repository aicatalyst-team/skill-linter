import type { RuleSeverityConfig } from "../types.js";
import { recommended } from "./recommended.js";

export const strict: Record<string, RuleSeverityConfig> = {
  ...recommended,
  "best-practices/description-has-trigger-words": "warning",
  "best-practices/progressive-disclosure": "warning",
  "best-practices/scripts-are-referenced": "warning",
  "best-practices/has-examples": "warning",
  "best-practices/gotchas-section": "warning",
  "best-practices/pinned-versions": "warning",
  "best-practices/scripts-have-help": "warning",
  "best-practices/no-generic-names": "warning",
  "content/no-backslash-paths": "warning",
  "content/no-ascii-art": "warning",
  "content/no-duplicate-headings": "warning",
  "frontmatter/license-format": "warning",
  "best-practices/no-vague-instructions": "warning",
  "best-practices/no-time-sensitive-content": "warning",
  "best-practices/no-excessive-negation": "warning",
  "best-practices/non-descriptive-filenames": "warning",
  "best-practices/has-evals": "warning",
};

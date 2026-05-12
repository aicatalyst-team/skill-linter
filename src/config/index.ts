import { lilconfig } from "lilconfig";
import type { SkillEvalConfig, ResolvedConfig } from "./types.js";
import { normalizeConfig } from "./normalize.js";
import { defaultConfig } from "./defaults.js";

const MODULE_NAME = "skill-linter";

export async function loadConfig(configPath?: string): Promise<ResolvedConfig> {
  if (configPath) {
    const explorer = lilconfig(MODULE_NAME);
    const result = await explorer.load(configPath);
    if (result && result.config) {
      return normalizeConfig(result.config as SkillEvalConfig);
    }
  }

  const explorer = lilconfig(MODULE_NAME);
  const result = await explorer.search();

  if (result && result.config) {
    return normalizeConfig(result.config as SkillEvalConfig);
  }

  return { ...defaultConfig };
}

export { normalizeConfig } from "./normalize.js";
export type { SkillEvalConfig, ResolvedConfig, RuleSeverityConfig } from "./types.js";

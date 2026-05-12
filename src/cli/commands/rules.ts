import { Command } from "commander";
import pc from "picocolors";
import { registerAllRules } from "../../rules/index.js";
import { getAllRules } from "../../engine/rule-registry.js";
import type { RuleCategory, Severity } from "../../engine/types.js";

const SEVERITY_COLOR: Record<Severity, (s: string) => string> = {
  error: pc.red,
  warning: pc.yellow,
  info: pc.blue,
};

export const rulesCommand = new Command("rules")
  .description("List all available rules")
  .option("--category <name>", "Filter by category")
  .option("--severity <level>", "Filter by default severity")
  .action((options) => {
    registerAllRules();
    let rules = getAllRules();

    if (options.category) {
      rules = rules.filter((r) => r.meta.category === options.category);
    }
    if (options.severity) {
      rules = rules.filter((r) => r.meta.defaultSeverity === options.severity);
    }

    const grouped = new Map<RuleCategory, typeof rules>();
    for (const rule of rules) {
      const cat = rule.meta.category;
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(rule);
    }

    console.log();
    console.log(`  ${pc.bold("skill-linter rules")} (${rules.length} rules)`);
    console.log();

    for (const [category, catRules] of grouped) {
      console.log(`  ${pc.bold(pc.underline(category))}`);
      console.log();
      for (const rule of catRules) {
        const sev = SEVERITY_COLOR[rule.meta.defaultSeverity](
          rule.meta.defaultSeverity.padEnd(7),
        );
        const fix = rule.meta.fixable ? pc.green("fixable") : pc.dim("       ");
        console.log(`    ${pc.cyan(rule.meta.id.padEnd(48))} ${sev}  ${fix}  ${pc.dim(rule.meta.description)}`);
      }
      console.log();
    }
  });

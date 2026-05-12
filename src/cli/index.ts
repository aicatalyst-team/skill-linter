import { Command } from "commander";
import { checkCommand } from "./commands/check.js";
import { rulesCommand } from "./commands/rules.js";
import { initCommand } from "./commands/init.js";
import { newCommand } from "./commands/new.js";
import { VERSION } from "../version.js";

const program = new Command()
  .name("skill-linter")
  .description("Linter, scorer, and evaluator for AI agent skill files")
  .version(VERSION);

program.addCommand(checkCommand, { isDefault: true });
program.addCommand(rulesCommand);
program.addCommand(initCommand);
program.addCommand(newCommand);

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exitCode = 3;
});

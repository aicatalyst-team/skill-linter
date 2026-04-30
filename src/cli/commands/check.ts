import { rmSync } from "node:fs";
import { Command } from "commander";
import { lint } from "../../engine/engine.js";
import { registerAllRules } from "../../rules/index.js";
import { loadConfig } from "../../config/index.js";
import { format, type FormatType } from "../../formatters/index.js";
import {
  resolveProvider,
  runDeepAnalysis,
  deepFindingsToDiagnostics,
  triageDiagnostics,
} from "../../deep/index.js";
import { parseGitHubUrl, fetchRemoteSkills } from "../../github/index.js";
import type { LintResult } from "../../engine/types.js";
import { applyFixes } from "../../engine/fixer.js";
import pc from "picocolors";

export const checkCommand = new Command("check")
  .description("Lint and evaluate skill directories")
  .argument("<paths...>", "Paths to skill directories or SKILL.md files")
  .option("-f, --format <type>", "Output format: text, json, sarif, github", "text")
  .option("--fix", "Auto-fix fixable issues")
  .option("--deep", "Run LLM-powered deep analysis")
  .option("--deep-provider <name>", "LLM provider: anthropic, vertex")
  .option("--deep-model <name>", "LLM model to use for deep analysis")
  .option("--strict", "Treat warnings as errors")
  .option("--rule <id>", "Run only specific rules (repeatable)", collect, [])
  .option("--category <name>", "Run only rules in a category (repeatable)", collect, [])
  .option("-c, --config <path>", "Path to config file")
  .option("--no-config", "Ignore config files, use defaults")
  .option("-q, --quiet", "Suppress all output except errors")
  .action(async (paths: string[], options) => {
    registerAllRules();

    const config = options.config !== false
      ? await loadConfig(typeof options.config === "string" ? options.config : undefined)
      : await loadConfig();

    const resolvedPaths: string[] = [];
    const tempDirs: string[] = [];
    const displayPathMap = new Map<string, string>();

    // Separate local paths from GitHub URLs
    const localPaths: string[] = [];
    const ghRefs: { ref: NonNullable<ReturnType<typeof parseGitHubUrl>>; raw: string }[] = [];
    for (const p of paths) {
      const ghRef = parseGitHubUrl(p);
      if (ghRef) {
        ghRefs.push({ ref: ghRef, raw: p });
      } else {
        localPaths.push(p);
      }
    }

    // Fetch all GitHub repos in parallel
    if (ghRefs.length > 0) {
      if (!options.quiet) {
        for (const { ref } of ghRefs) {
          console.log(`  Fetching skills from ${ref.owner}/${ref.repo}...`);
        }
      }
      const fetchResults = await Promise.all(
        ghRefs.map(({ ref }) => fetchRemoteSkills(ref)),
      );
      for (let i = 0; i < ghRefs.length; i++) {
        const fetchResult = fetchResults[i];
        const { ref } = ghRefs[i];
        tempDirs.push(fetchResult.tempDir);
        for (const skill of fetchResult.skills) {
          resolvedPaths.push(skill.localPath);
          displayPathMap.set(
            skill.localPath,
            `${ref.owner}/${ref.repo}:${skill.remotePath}`,
          );
        }
      }
    }

    resolvedPaths.push(...localPaths);

    const lintResults = await Promise.all(
      resolvedPaths.map(async (path) => {
        const result = await lint(path, { rules: config.rules });
        const ghDisplayPath = displayPathMap.get(path);
        if (ghDisplayPath) {
          result.displayPath = ghDisplayPath;
          for (const diag of result.diagnostics) {
            diag.location.file = diag.location.file.replace(path, ghDisplayPath);
          }
        }
        return { path, result };
      }),
    );

    if (options.deep) {
      const providerName = options.deepProvider ?? config.deep?.provider;
      const provider = resolveProvider(providerName, options.deepModel ?? config.deep?.model);

      const DEEP_CONCURRENCY = 5;
      for (let i = 0; i < lintResults.length; i += DEEP_CONCURRENCY) {
        const batch = lintResults.slice(i, i + DEEP_CONCURRENCY);
        await Promise.all(
          batch.map(({ path, result }) =>
            runDeepForSkill(path, result, provider, options.quiet),
          ),
        );
      }
    }

    const results = lintResults.map(({ result }) => result);

    if (options.fix) {
      for (const result of results) {
        const fixResults = applyFixes(result.diagnostics);
        for (const fr of fixResults) {
          if (!options.quiet) {
            console.log(`  ${pc.green("Fixed")} ${fr.fixesApplied} issue(s) in ${fr.filePath}`);
          }
        }
      }
    }

    const output = format(results, options.format as FormatType);
    if (!options.quiet) {
      process.stdout.write(output);
    }

    for (const dir of new Set(tempDirs)) {
      rmSync(dir, { recursive: true, force: true });
    }

    const hasErrors = results.some((r) => r.errorCount > 0);
    const hasWarnings = results.some((r) => r.warningCount > 0);

    if (hasErrors) {
      process.exitCode = 1;
    } else if (options.strict && hasWarnings) {
      process.exitCode = 2;
    }
  });

async function runDeepForSkill(
  path: string,
  result: LintResult,
  provider: import("../../deep/provider.js").LLMProvider,
  quiet?: boolean,
): Promise<void> {
  try {
    const skill = result.parsedSkill;
    if (!skill) {
      throw new Error(`No parsed skill available for ${path}`);
    }
    const deepResult = await runDeepAnalysis(skill, provider);
    const deepDiags = deepFindingsToDiagnostics(
      deepResult.findings,
      skill.skillMdPath,
    );

    result.diagnostics.push(...deepDiags);

    const hasSecurityFindings = result.diagnostics.some(
      (d) => d.category === "security" && d.location.startLine !== undefined,
    );
    if (hasSecurityFindings) {
      const reviews = await triageDiagnostics(skill, result.diagnostics, provider);
      const dismissed = new Set(
        reviews
          .filter((r) => r.dismiss)
          .map((r) => `${r.ruleId}:${r.line}`),
      );

      if (dismissed.size > 0) {
        result.diagnostics = result.diagnostics.filter((d) => {
          const key = `${d.ruleId}:${d.location.startLine}`;
          if (dismissed.has(key)) {
            if (!quiet) {
              const review = reviews.find(
                (r) => r.dismiss && `${r.ruleId}:${r.line}` === key,
              );
              console.log(
                `  ${pc.green("Dismissed")}  ${d.ruleId} at line ${d.location.startLine}: ${review?.reason ?? "LLM triage"}`,
              );
            }
            return false;
          }
          return true;
        });
      }
    }

    result.errorCount = result.diagnostics.filter((d) => d.severity === "error").length;
    result.warningCount = result.diagnostics.filter((d) => d.severity === "warning").length;
    result.infoCount = result.diagnostics.filter((d) => d.severity === "info").length;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!quiet) {
      console.error(`\n  Deep analysis failed: ${msg}\n`);
    }
  }
}

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

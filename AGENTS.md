# skill-linter

TypeScript CLI linter for AI agent skill files following the [Agent Skills specification](https://agentskills.io). Validates SKILL.md files across 5 categories: structural, frontmatter, content, security, and best practices.

## Tech stack

- TypeScript with ESM (`"type": "module"`) — all imports use `.js` extensions
- Node.js >=22
- vitest for testing
- commander.js for CLI
- gray-matter for YAML frontmatter extraction
- unified/remark for markdown AST parsing
- picocolors for terminal output
- lilconfig for config file discovery

## Commands

```
npm run build          # Compile TypeScript
npm test               # Run all tests (vitest)
npx tsc --noEmit       # Type check without emitting
node bin/skill-linter.js check <path>   # Run the linter locally
```

## Architecture

The engine loop: parse skill directory → run rules → collect diagnostics → format output.

```
src/
├── cli/commands/       # check, rules, init, new
├── config/             # lilconfig loader + presets (recommended, strict, security)
│   └── presets/
├── deep/               # LLM-powered analysis + triage (--deep flag)
│   └── providers/      # Anthropic API + Vertex AI
├── engine/             # Core lint loop, rule registry, fixer, inline suppression
├── formatters/         # text, JSON, SARIF, GitHub annotations
├── github/             # Remote GitHub repo scanning (URL parsing, API client, skill fetching)
├── parser/             # gray-matter + remark → ParsedSkill
├── rules/              # 37 rules in 5 categories
│   ├── structural/
│   ├── frontmatter/
│   ├── content/
│   ├── security/
│   └── best-practices/
└── utils/              # Token counter, NFKC normalization
```

Key types are in `src/engine/types.ts`: `Rule`, `RuleMeta`, `RuleContext`, `Diagnostic`, `LintResult`.

The parser (`src/parser/parse-skill.ts`) produces a `ParsedSkill` object containing frontmatter data, raw content, markdown AST, line number mappings, and file listings.

## Adding a new rule

This is the most common contribution. Every rule follows the same pattern.

### 1. Create the rule file

Create `src/rules/{category}/{rule-name}.ts`:

```typescript
import type { Rule } from "../../engine/types.js";

export const myNewRule: Rule = {
  meta: {
    id: "{category}/{rule-name}",
    type: "problem",              // "problem" | "suggestion" | "security"
    defaultSeverity: "error",     // "error" | "warning" | "info"
    fixable: false,
    description: "Short description of what this rule checks",
    category: "{category}",       // must match the directory
    messages: {
      messageId: "Error message with {{interpolation}}",
    },
  },
  create(context) {
    const { skill } = context;
    if (skill.parseErrors.length > 0) return;

    // Check something on skill.rawContent, skill.frontmatter, skill.mdast, etc.
    // Report findings:
    context.report({
      messageId: "messageId",
      data: { interpolation: "value" },
      location: { startLine: 1 },
    });
  },
};
```

### 2. Register the rule

Add the import and registration in `src/rules/index.ts`.

### 3. Add to presets

Set the severity in each preset file in `src/config/presets/` (recommended.ts, strict.ts, security.ts).

### 4. Write tests

Add tests in `tests/unit/rules/` using the `runRule()` helper from `tests/helpers.ts`:

```typescript
import { runRule } from "../../helpers.js";
import { myNewRule } from "../../../src/rules/{category}/{rule-name}.js";

it("detects the issue", async () => {
  const d = await runRule(myNewRule, {
    rawContent: "---\nname: test\n---\nproblematic content",
  });
  expect(d.length).toBeGreaterThan(0);
});

it("passes for clean content", async () => {
  const d = await runRule(myNewRule, {
    rawContent: "---\nname: test\n---\nclean content",
  });
  expect(d).toHaveLength(0);
});
```

### 5. Add fixtures if needed

Create test skill directories in `tests/fixtures/` for integration tests.

## Rule categories

| Category | Directory | Type | Count |
|----------|-----------|------|-------|
| structural | `src/rules/structural/` | File/directory structure checks | 4 |
| frontmatter | `src/rules/frontmatter/` | YAML frontmatter validation | 12 |
| content | `src/rules/content/` | Markdown body quality | 8 |
| security | `src/rules/security/` | Prompt injection, credential theft, obfuscation | 9 |
| best-practices | `src/rules/best-practices/` | agentskills.io recommendations | 14 |

## ParsedSkill fields available to rules

- `skill.rawContent` — full file content (for line-by-line regex scanning)
- `skill.frontmatter` — parsed YAML frontmatter as `FrontmatterData`
- `skill.rawFrontmatter` — raw frontmatter string (for field line lookup)
- `skill.body` — markdown body after frontmatter
- `skill.mdast` — remark AST of the body (for structural checks like headings, code blocks)
- `skill.dirPath`, `skill.dirName` — skill directory info
- `skill.files` — all files in the skill directory
- `skill.parseErrors` — any parsing failures (check this first, return early if non-empty)

## Known gotchas

- **gray-matter caching**: gray-matter caches results and drops the `.matter` property on cache hits. The parser extracts raw frontmatter via regex instead (`src/parser/frontmatter.ts`).
- **ESM imports**: All imports must use `.js` extensions even for `.ts` files — this is required by Node16 module resolution.
- **Rule registration is global**: Call `clearRules()` in test `beforeEach` when running integration tests that call `registerAllRules()`.
- **Unicode in regex**: Use `\u{XXXXX}` with the `u` flag for supplementary plane characters (see `no-obfuscation.ts`).

## Output formats

The `--format` flag controls output: `text` (default terminal), `json` (structured), `sarif` (GitHub Code Scanning), `github` (::error/::warning annotations). Formatters are in `src/formatters/`.

## Inline suppression

The engine (`src/engine/engine.ts`) supports `<!-- skill-linter-disable-next-line [rule-id] -->` HTML comments in SKILL.md. Suppressed lines are parsed before rules run and filtered in the `report()` callback — transparent to rules.

## Remote GitHub scanning

The `src/github/` module fetches skills from GitHub repos via the Git Trees API (one request for full file tree) and Contents API (file downloads). Uses `gh` CLI when available, falls back to `fetch` + `GITHUB_TOKEN`. Skills are downloaded to OS temp dirs, passed through the normal lint pipeline, then cleaned up. The `check` command maps temp paths to display paths like `owner/repo:path/to/skill`.

## Deep analysis

The `--deep` flag sends skill content to Claude for semantic analysis. Provider SDKs (`@anthropic-ai/sdk`, `@anthropic-ai/vertex-sdk`) are optional peer dependencies — dynamically imported at runtime. The provider abstraction is in `src/deep/provider.ts`.

After static linting, `--deep` also triages security findings via a second LLM pass (`src/deep/analyzer.ts:triageDiagnostics`). The LLM reviews each flagged diagnostic against the skill content and dismisses confirmed false positives (e.g., injection patterns mentioned as examples in documentation).

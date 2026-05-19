# Contributing to skill-linter

## Prerequisites

- Node.js >= 22
- pnpm >= 11

## Getting started

```bash
git clone git@github.com:aicatalyst-team/skill-linter.git
cd skill-linter
pnpm install
pnpm run build
pnpm test
```

## Development workflow

```bash
pnpm run build         # Compile TypeScript
pnpm test              # Run all tests
pnpm tsc --noEmit      # Type check without emitting
pnpm run dev           # Watch mode (rebuild on change)
```

Run the linter locally against a skill directory or GitHub repo:

```bash
node bin/skill-linter.js check path/to/skill
node bin/skill-linter.js check https://github.com/org/repo
```

## Adding a new rule

Rules are the primary way to contribute. Each rule is a single file that checks one thing.

### Step 1: Create the rule file

Add `src/rules/{category}/{rule-name}.ts` where `{category}` is one of: `structural`, `frontmatter`, `content`, `security`, `best-practices`.

Follow the pattern in existing rules (e.g., `src/rules/security/no-curl-bash.ts`). Every rule exports a `Rule` object with:

- `meta` — id, type, severity, description, message templates
- `create(context)` — receives parsed skill data, calls `context.report()` for each finding

### Step 2: Register the rule

Import and add it to the `allRules` array in `src/rules/index.ts`.

### Step 3: Add to presets

Set the default severity in all three preset files:

- `src/config/presets/recommended.ts`
- `src/config/presets/strict.ts`
- `src/config/presets/security.ts`

### Step 4: Write tests

Add tests in `tests/unit/rules/` using the `runRule()` helper:

```typescript
import { runRule } from "../../helpers.js";
import { myRule } from "../../../src/rules/{category}/{rule-name}.js";

it("detects the issue", async () => {
  const d = await runRule(myRule, { rawContent: "---\nname: test\n---\nbad content" });
  expect(d.length).toBeGreaterThan(0);
});

it("passes for clean content", async () => {
  const d = await runRule(myRule, { rawContent: "---\nname: test\n---\ngood content" });
  expect(d).toHaveLength(0);
});
```

### Step 5: Add fixtures if needed

For integration tests, add skill directories to `tests/fixtures/`.

## PR checklist

- [ ] `pnpm tsc --noEmit` passes
- [ ] `pnpm test` passes
- [ ] New rule is registered in `src/rules/index.ts`
- [ ] New rule is added to all three presets
- [ ] Tests cover both positive (detects issue) and negative (passes clean input) cases
- [ ] Security rules: test both context-aware scenarios (pattern in prose vs. in quotes/code blocks)
- [ ] Test that `<!-- skill-linter-disable-next-line rule-id -->` suppresses the rule
- [ ] No unrelated changes

## Code style

- TypeScript strict mode
- ESM with `.js` import extensions (required by Node16 module resolution)
- No comments unless the WHY is non-obvious
- No abstractions beyond what the task requires
- Use `picocolors` for terminal coloring (not chalk)

## Reporting issues

Open an issue at [github.com/aicatalyst-team/skill-linter/issues](https://github.com/aicatalyst-team/skill-linter/issues).

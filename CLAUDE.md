# skill-linter

See AGENTS.md for full project context, architecture, and how to add rules.

## Quick reference

```
npm run build          # Compile
npm test               # Run tests
npx tsc --noEmit       # Type check
node bin/cli.js check tests/fixtures/valid/full-skill   # Smoke test (local)
node bin/cli.js check https://github.com/org/repo       # Smoke test (remote)
```

## Guidelines

- Run `npm test` and `npx tsc --noEmit` before reporting work as complete
- This project is itself a linter — don't add code-style enforcement beyond what the rules check
- ESM with `.js` import extensions throughout
- Prefer editing existing files over creating new ones
- No comments unless the WHY is non-obvious
- When adding a rule: create the rule file, register it in `src/rules/index.ts`, add to all three presets, write tests with the `runRule()` helper
- Security rules should test both bare patterns and patterns in mention context (quotes, backticks, code blocks)
- Inline suppression (`<!-- skill-linter-disable-next-line -->`) is handled by the engine — rules don't need to implement it
- `--deep` flag also triages security findings via LLM to dismiss false positives

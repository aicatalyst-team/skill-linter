# skill-linter

Linter for AI agent skill files following the [Agent Skills specification](https://agentskills.io).

47 rules across 5 categories: structural, frontmatter, content, security, and best practices. Supports text, JSON, SARIF, and GitHub Actions output formats. Optional LLM-powered deep analysis via Anthropic API or Google Cloud Vertex AI.

## Install

```bash
npx skill-linter check ./my-skill
```

Or install globally:

```bash
npm install -g skill-linter
```

## Run from Source

Requires [pnpm](https://pnpm.io) >= 11 (or enable [Corepack](https://nodejs.org/api/corepack.html): `corepack enable`).

```bash
git clone https://github.com/aicatalyst-team/skill-linter.git
cd skill-linter
pnpm install
pnpm run build
pnpm link --global
```

This makes the `skill-linter` command available globally, so you can use it like the published package:

```bash
skill-linter check ./my-skill
skill-linter check https://github.com/org/repo
skill-linter rules
```

To rebuild after making changes:

```bash
pnpm run build
```

Or use watch mode for continuous rebuilds during development:

```bash
pnpm run dev
```

To unlink when done:

```bash
pnpm rm --global skill-linter
```

Requires Node.js >= 22.

## Quick Start

```bash
# Lint a skill directory
skill-linter check ./my-skill

# Lint multiple skills
skill-linter check ./skill-a ./skill-b

# Lint skills from a GitHub repo
skill-linter check https://github.com/org/repo
skill-linter check github:org/repo

# Target a specific skill in a repo
skill-linter check https://github.com/org/repo/tree/main/skills/my-skill

# Scaffold a new skill
skill-linter new my-new-skill

# List all 47 rules
skill-linter rules
```

## Commands

### `skill-linter check <paths...>`

Lint and evaluate skill directories.

```bash
skill-linter check ./my-skill
skill-linter check ./my-skill --format json
skill-linter check ./my-skill --format sarif > results.sarif
skill-linter check ./my-skill --format github
skill-linter check ./my-skill --strict
skill-linter check ./my-skill --fix
skill-linter check ./my-skill --deep
skill-linter check ./my-skill --deep --deep-provider vertex

# Remote GitHub repos
skill-linter check https://github.com/org/repo
skill-linter check https://github.com/org/repo/tree/main/skills/my-skill
skill-linter check github:org/repo
```

| Flag | Description |
|------|-------------|
| `-f, --format <type>` | Output format: `text`, `json`, `sarif`, `github` (default: `text`) |
| `--fix` | Auto-fix fixable issues |
| `--deep` | Run LLM-powered semantic analysis |
| `--deep-provider <name>` | LLM provider: `anthropic`, `vertex` (auto-detected) |
| `--deep-model <name>` | LLM model to use for deep analysis |
| `--strict` | Treat warnings as errors |
| `--rule <id>` | Run only specific rules (repeatable) |
| `--category <name>` | Run only rules in a category (repeatable) |
| `-c, --config <path>` | Path to config file |
| `--no-config` | Ignore config files, use defaults |
| `-q, --quiet` | Suppress warnings and info, show only errors |
| `-v, --verbose` | Show all skills including those with no issues |

Exit codes: `0` = pass, `1` = errors found (or warnings with `--strict`), `2` = config error, `3` = CLI error.

### `skill-linter rules`

List all available rules.

```bash
skill-linter rules
skill-linter rules --category security
skill-linter rules --severity error
```

### `skill-linter init`

Create a `.skill-linterrc.json` config file in the current directory.

### `skill-linter new <name>`

Scaffold a new skill directory with a `SKILL.md` template.

## Rules (47)

### Structural (4)

| Rule | Severity | Description |
|------|----------|-------------|
| `structural/skill-md-exists` | error | SKILL.md must exist |
| `structural/directory-structure` | info | Warn on non-standard directories |
| `structural/no-extra-top-level-files` | info | Warn on unexpected root files |
| `structural/file-references-valid` | warning | Referenced file paths must exist |

### Frontmatter (12)

| Rule | Severity | Fixable | Description |
|------|----------|---------|-------------|
| `frontmatter/frontmatter-present` | error | | Must have YAML frontmatter |
| `frontmatter/name-required` | error | | `name` is required |
| `frontmatter/name-format` | error | yes | 1-64 chars, lowercase, hyphens |
| `frontmatter/name-matches-directory` | error | | Must match parent directory |
| `frontmatter/name-no-reserved-words` | error | | Must not contain reserved words ('anthropic', 'claude') |
| `frontmatter/description-required` | error | | `description` is required |
| `frontmatter/description-length` | error | | 1-1024 characters |
| `frontmatter/description-quality` | warning | | Must be substantive |
| `frontmatter/no-extra-fields` | error | | Only 6 allowed fields |
| `frontmatter/compatibility-length` | error | | Max 500 characters |
| `frontmatter/metadata-types` | error | | Must be string-to-string map |
| `frontmatter/allowed-tools-format` | warning | | Must be space-separated string |

### Content (8)

| Rule | Severity | Description |
|------|----------|-------------|
| `content/body-not-empty` | warning | Body must not be empty |
| `content/body-token-budget` | warning | Body under 5000 tokens |
| `content/body-line-limit` | warning | Body under 500 lines |
| `content/has-headings` | info | Should have headings |
| `content/no-html-in-body` | info | No raw HTML tags |
| `content/references-depth` | info | References one level deep |
| `content/no-backslash-paths` | info | Use forward slashes for cross-platform compatibility |
| `content/no-ascii-art` | info | No decorative ASCII art or box-drawing characters |

### Security (9)

Based on [Snyk ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/) research and [OWASP Agentic Skills Top 10](https://owasp.org/www-project-agentic-skills-top-10/).

| Rule | Severity | Description |
|------|----------|-------------|
| `security/no-prompt-injection` | error | Detects prompt injection patterns (context-aware: patterns in quotes, backticks, or code blocks are downgraded to warnings) |
| `security/no-base64-payloads` | error | Detects obfuscated base64 content |
| `security/no-credential-access` | error | Detects sensitive file/env access |
| `security/no-curl-bash` | error | Detects pipe-to-shell execution |
| `security/no-remote-fetch` | warning | Detects untrusted remote content |
| `security/no-obfuscation` | error | Detects Unicode smuggling |
| `security/no-memory-poisoning` | error | Detects agent config writes |
| `security/no-secret-literals` | warning | Detects hardcoded secrets |
| `security/no-password-archives` | error | Detects password-protected archives |

### Best Practices (14)

| Rule | Severity | Description |
|------|----------|-------------|
| `best-practices/description-has-trigger-words` | info | Use imperative phrasing |
| `best-practices/description-no-first-person` | warning | Use third-person voice in descriptions |
| `best-practices/progressive-disclosure` | info | Split large bodies into references/ |
| `best-practices/scripts-are-referenced` | info | Scripts should be referenced in body |
| `best-practices/has-examples` | info | Should contain code blocks |
| `best-practices/gotchas-section` | info | Non-trivial skills need gotchas |
| `best-practices/pinned-versions` | info | Pin package versions |
| `best-practices/scripts-have-help` | info | Scripts should support --help |
| `best-practices/no-generic-names` | info | Avoid generic names like 'helper' or 'utils' |
| `best-practices/no-persona-instructions` | warning | Provide instructions, not persona assignments |
| `best-practices/no-vague-instructions` | info | Avoid vague directives like 'follow best practices' |
| `best-practices/no-time-sensitive-content` | info | Avoid time-sensitive language that becomes stale |
| `best-practices/no-excessive-negation` | info | Tell agents what to do, not what not to do |
| `best-practices/non-descriptive-filenames` | info | Use descriptive filenames, not generic ones |

## Configuration

Create `.skill-linterrc.json` (or use `skill-linter init`):

```json
{
  "extends": "recommended",
  "rules": {
    "content/no-html-in-body": "off",
    "best-practices/gotchas-section": "warning"
  },
  "ignore": ["node_modules", ".git"]
}
```

Config is discovered via [lilconfig](https://github.com/antonk52/lilconfig): `.skill-linterrc.json`, `.skill-linterrc.yaml`, `skill-linter.config.js`, or `package.json["skill-linter"]`.

### Presets

| Preset | Description |
|--------|-------------|
| `recommended` | All spec rules as errors, best practices as info (default) |
| `strict` | Recommended + best practices elevated to warnings |
| `security` | Security rules only, all as errors |

## Inline Suppression

Suppress specific findings with HTML comments in your SKILL.md:

```markdown
<!-- skill-linter-disable-next-line -->
This line's diagnostics are suppressed.

<!-- skill-linter-disable-next-line security/no-prompt-injection -->
Only the specified rule is suppressed on the next line.
```

## Remote GitHub Scanning

Pass a GitHub URL instead of a local path to scan skills hosted on GitHub:

```bash
skill-linter check https://github.com/org/repo
skill-linter check https://github.com/org/repo/tree/main/skills/my-skill
skill-linter check github:org/repo
```

Authentication uses `gh` CLI (if installed and logged in) with a fallback to the `GITHUB_TOKEN` environment variable. Public repos work without authentication.

## Deep Analysis (`--deep`)

Optional LLM-powered semantic analysis that catches issues regex can't:

- Subtle prompt injection and social engineering
- Self-contradicting instructions
- Description-body misalignment
- System message impersonation
- Script safety issues

When `--deep` is enabled, the LLM also triages static security findings and dismisses confirmed false positives (e.g., injection patterns that appear in documentation or examples). Dismissed findings are removed from the output with an explanation.

### Setup

**Anthropic API:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
skill-linter check ./my-skill --deep
```

**Google Cloud Vertex AI:**
```bash
export GOOGLE_CLOUD_PROJECT=my-project
export GOOGLE_CLOUD_LOCATION=us-east5
skill-linter check ./my-skill --deep --deep-provider vertex
```

Requires installing the provider SDK:
```bash
npm install @anthropic-ai/sdk          # For Anthropic
npm install @anthropic-ai/vertex-sdk   # For Vertex AI
```

## CI/CD

### GitHub Actions

```yaml
- uses: actions/setup-node@v4
- run: npx skill-linter check ./skills --format sarif > results.sarif
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: results.sarif
```

### GitHub Annotations

```yaml
- run: npx skill-linter check ./skills --format github
```

## Programmatic API

```typescript
import { lint, registerAllRules } from "skill-linter";

registerAllRules();
const result = await lint("./my-skill");
console.log(result.errorCount, result.diagnostics);
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, how to add rules, and PR guidelines.

AI agents: see [AGENTS.md](AGENTS.md) for codebase architecture and conventions.

## License

MIT

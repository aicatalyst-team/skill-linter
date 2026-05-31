import { registerRule } from "../engine/rule-registry.js";

import { skillMdExists } from "./structural/skill-md-exists.js";
import { directoryStructure } from "./structural/directory-structure.js";
import { noExtraTopLevelFiles } from "./structural/no-extra-top-level-files.js";
import { fileReferencesValid } from "./structural/file-references-valid.js";

import { frontmatterPresent } from "./frontmatter/frontmatter-present.js";
import { nameRequired } from "./frontmatter/name-required.js";
import { nameFormat } from "./frontmatter/name-format.js";
import { nameMatchesDirectory } from "./frontmatter/name-matches-directory.js";
import { descriptionRequired } from "./frontmatter/description-required.js";
import { descriptionLength } from "./frontmatter/description-length.js";
import { descriptionQuality } from "./frontmatter/description-quality.js";
import { noExtraFields } from "./frontmatter/no-extra-fields.js";
import { compatibilityLength } from "./frontmatter/compatibility-length.js";
import { metadataTypes } from "./frontmatter/metadata-types.js";
import { allowedToolsFormat } from "./frontmatter/allowed-tools-format.js";

import { bodyNotEmpty } from "./content/body-not-empty.js";
import { bodyTokenBudget } from "./content/body-token-budget.js";
import { bodyLineLimit } from "./content/body-line-limit.js";
import { hasHeadings } from "./content/has-headings.js";
import { noHtmlInBody } from "./content/no-html-in-body.js";
import { referencesDepth } from "./content/references-depth.js";

import { noPromptInjection } from "./security/no-prompt-injection.js";
import { noBase64Payloads } from "./security/no-base64-payloads.js";
import { noCredentialAccess } from "./security/no-credential-access.js";
import { noCurlBash } from "./security/no-curl-bash.js";
import { noRemoteFetch } from "./security/no-remote-fetch.js";
import { noObfuscation } from "./security/no-obfuscation.js";
import { noMemoryPoisoning } from "./security/no-memory-poisoning.js";
import { noSecretLiterals } from "./security/no-secret-literals.js";
import { noPasswordArchives } from "./security/no-password-archives.js";

import { descriptionHasTriggerWords } from "./best-practices/description-has-trigger-words.js";
import { progressiveDisclosure } from "./best-practices/progressive-disclosure.js";
import { scriptsAreReferenced } from "./best-practices/scripts-are-referenced.js";
import { hasExamples } from "./best-practices/has-examples.js";
import { gotchasSection } from "./best-practices/gotchas-section.js";
import { pinnedVersions } from "./best-practices/pinned-versions.js";
import { scriptsHaveHelp } from "./best-practices/scripts-have-help.js";
import { noGenericNames } from "./best-practices/no-generic-names.js";
import { noPersonaInstructions } from "./best-practices/no-persona-instructions.js";
import { noVagueInstructions } from "./best-practices/no-vague-instructions.js";
import { descriptionNoFirstPerson } from "./best-practices/description-no-first-person.js";
import { noTimeSensitiveContent } from "./best-practices/no-time-sensitive-content.js";
import { noExcessiveNegation } from "./best-practices/no-excessive-negation.js";
import { nonDescriptiveFilenames } from "./best-practices/non-descriptive-filenames.js";
import { noInteractiveScripts } from "./best-practices/no-interactive-scripts.js";
import { hasEvals } from "./best-practices/has-evals.js";
import { nameNoReservedWords } from "./frontmatter/name-no-reserved-words.js";
import { licenseFormat } from "./frontmatter/license-format.js";
import { noAsciiArt } from "./content/no-ascii-art.js";
import { noBackslashPaths } from "./content/no-backslash-paths.js";
import { noDuplicateHeadings } from "./content/no-duplicate-headings.js";

const allRules = [
  // Structural
  skillMdExists,
  directoryStructure,
  noExtraTopLevelFiles,
  fileReferencesValid,
  // Frontmatter
  frontmatterPresent,
  nameRequired,
  nameFormat,
  nameMatchesDirectory,
  descriptionRequired,
  descriptionLength,
  descriptionQuality,
  noExtraFields,
  compatibilityLength,
  metadataTypes,
  allowedToolsFormat,
  nameNoReservedWords,
  licenseFormat,
  // Content
  bodyNotEmpty,
  bodyTokenBudget,
  bodyLineLimit,
  hasHeadings,
  noHtmlInBody,
  referencesDepth,
  noBackslashPaths,
  noAsciiArt,
  noDuplicateHeadings,
  // Security
  noPromptInjection,
  noBase64Payloads,
  noCredentialAccess,
  noCurlBash,
  noRemoteFetch,
  noObfuscation,
  noMemoryPoisoning,
  noSecretLiterals,
  noPasswordArchives,
  // Best Practices
  descriptionHasTriggerWords,
  progressiveDisclosure,
  scriptsAreReferenced,
  hasExamples,
  gotchasSection,
  pinnedVersions,
  scriptsHaveHelp,
  noGenericNames,
  noPersonaInstructions,
  noVagueInstructions,
  descriptionNoFirstPerson,
  noTimeSensitiveContent,
  noExcessiveNegation,
  nonDescriptiveFilenames,
  noInteractiveScripts,
  hasEvals,
];

export function registerAllRules(): void {
  for (const rule of allRules) {
    registerRule(rule);
  }
}

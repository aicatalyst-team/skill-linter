const NON_SCRIPT_FILES = new Set([
  "requirements.txt",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "pyproject.toml",
  "setup.cfg",
  "Makefile",
  "Dockerfile",
  ".gitignore",
]);

const NON_SCRIPT_EXTENSIONS = new Set([
  ".txt",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".cfg",
  ".ini",
  ".csv",
  ".md",
]);

export function isDataFile(filename: string): boolean {
  if (NON_SCRIPT_FILES.has(filename)) return true;
  const ext = filename.slice(filename.lastIndexOf("."));
  return NON_SCRIPT_EXTENSIONS.has(ext);
}

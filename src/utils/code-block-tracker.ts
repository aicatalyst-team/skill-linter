/**
 * Iterates over lines of text, calling the callback for each line
 * that is NOT inside a fenced code block (```).
 *
 * @param lines - Array of text lines to iterate
 * @param callback - Called with (line, index) for non-code-block lines.
 *                   Return `false` to stop iteration early.
 */
export function forEachNonCodeLine(
  lines: string[],
  callback: (line: string, index: number) => void | false,
): void {
  let inCodeBlock = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i].trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    if (callback(lines[i], i) === false) return;
  }
}

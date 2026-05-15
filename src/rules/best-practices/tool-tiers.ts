const PARAM_RE = /^(\w+)\(.*\)$/;

export function toolBaseName(tool: string): string {
  const m = PARAM_RE.exec(tool);
  return m ? m[1] : tool;
}

export function parseAllowedTools(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

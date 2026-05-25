export function toIsoDate(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

/**
 * Parse the index.md body for one-line summaries.
 * Lines look like: - [[path/slug]] — Summary text (extra info)
 */
export function buildSummaryMap(indexBody: string): Map<string, string> {
  const map = new Map<string, string>();
  const lineRe = /^\s*-\s*\[\[([^\]]+)\]\]\s*[—–-]\s*(.+)$/;
  for (const line of indexBody.split("\n")) {
    const m = line.match(lineRe);
    if (!m) continue;
    const urlPath = m[1].trim();
    const summary = m[2].replace(/\s*\([^)]*\)\s*$/, "").trim();
    map.set(urlPath, summary);
  }
  return map;
}

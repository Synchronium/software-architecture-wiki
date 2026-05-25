import type { NavSection } from "./types.js";

interface NavInput {
  urlPath: string;
  meta: { title: string };
}

const SECTION_ORDER = [
  "styles","concepts","distributed","operations","patterns",
  "databases","streams","comparisons","reference","sources","authors",
] as const;

const SECTION_LABELS: Record<string, string> = {
  styles:      "Styles",
  concepts:    "Concepts",
  distributed: "Distributed",
  operations:  "Operations",
  patterns:    "Patterns",
  databases:   "Databases",
  streams:     "Streams",
  comparisons: "Comparisons",
  reference:   "Reference",
  sources:     "Sources",
  authors:     "Authors",
};

export function buildNav(pages: NavInput[]): NavSection[] {
  const bySection = new Map<string, Array<{ title: string; urlPath: string }>>();
  for (const page of pages) {
    const parts = page.urlPath.split("/");
    if (parts.length < 2) continue; // skip root pages like index, overview
    const section = parts[0];
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section)!.push({ title: page.meta.title, urlPath: page.urlPath });
  }
  for (const entries of bySection.values()) {
    entries.sort((a, b) => a.title.localeCompare(b.title));
  }
  return SECTION_ORDER
    .filter(s => bySection.has(s))
    .map(s => ({ slug: s, label: SECTION_LABELS[s], pages: bySection.get(s)! }));
}

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

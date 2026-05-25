import { describe, it, expect } from "vitest";
import { toIsoDate, buildSummaryMap, buildNav } from "./utils.js";
import { formatDate, escapeHtml } from "./templates.js";
import { resolveWikilinks } from "./wikilinks.js";

// ─── toIsoDate ────────────────────────────────────────────────────────────────

describe("toIsoDate", () => {
  it("returns empty string for falsy values", () => {
    expect(toIsoDate(undefined)).toBe("");
    expect(toIsoDate(null)).toBe("");
    expect(toIsoDate("")).toBe("");
    expect(toIsoDate(0)).toBe("");
  });

  it("converts a Date object to YYYY-MM-DD", () => {
    expect(toIsoDate(new Date("2026-05-22"))).toBe("2026-05-22");
    expect(toIsoDate(new Date("2026-01-01"))).toBe("2026-01-01");
  });

  it("passes through a string unchanged", () => {
    expect(toIsoDate("2026-05-22")).toBe("2026-05-22");
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formats a date with the correct ordinal suffix", () => {
    expect(formatDate("2026-05-01")).toBe("1<sup>st</sup> May 2026");
    expect(formatDate("2026-05-02")).toBe("2<sup>nd</sup> May 2026");
    expect(formatDate("2026-05-03")).toBe("3<sup>rd</sup> May 2026");
    expect(formatDate("2026-05-04")).toBe("4<sup>th</sup> May 2026");
    expect(formatDate("2026-05-22")).toBe("22<sup>nd</sup> May 2026");
    expect(formatDate("2026-05-31")).toBe("31<sup>st</sup> May 2026");
  });

  it("uses 'th' for 11th, 12th, 13th (teen exceptions)", () => {
    expect(formatDate("2026-05-11")).toBe("11<sup>th</sup> May 2026");
    expect(formatDate("2026-05-12")).toBe("12<sup>th</sup> May 2026");
    expect(formatDate("2026-05-13")).toBe("13<sup>th</sup> May 2026");
  });

  it("formats month names correctly", () => {
    expect(formatDate("2026-01-15")).toBe("15<sup>th</sup> January 2026");
    expect(formatDate("2026-12-25")).toBe("25<sup>th</sup> December 2026");
  });

  it("falls back to the raw value for malformed input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

// ─── escapeHtml ───────────────────────────────────────────────────────────────

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("handles non-string input without throwing", () => {
    expect(escapeHtml(undefined as unknown as string)).toBe("");
    expect(escapeHtml(null as unknown as string)).toBe("");
    expect(escapeHtml(42 as unknown as string)).toBe("42");
  });

  it("passes plain text through unchanged", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
  });
});

// ─── buildSummaryMap ─────────────────────────────────────────────────────────

describe("buildSummaryMap", () => {
  it("parses a standard wikilink summary line with em dash", () => {
    const body = "- [[concepts/coupling]] — Coupling and cohesion";
    const map = buildSummaryMap(body);
    expect(map.get("concepts/coupling")).toBe("Coupling and cohesion");
  });

  it("strips trailing parentheticals", () => {
    const body = "- [[concepts/coupling]] — Coupling (informed by: ddia, hard-parts)";
    const map = buildSummaryMap(body);
    expect(map.get("concepts/coupling")).toBe("Coupling");
  });

  it("handles en dash and hyphen separators", () => {
    const body = [
      "- [[concepts/cohesion]] – Cohesion summary",
      "- [[concepts/modularity]] - Modularity summary",
    ].join("\n");
    const map = buildSummaryMap(body);
    expect(map.get("concepts/cohesion")).toBe("Cohesion summary");
    expect(map.get("concepts/modularity")).toBe("Modularity summary");
  });

  it("ignores non-matching lines", () => {
    const body = "## Section\nSome prose.\n- plain list item";
    const map = buildSummaryMap(body);
    expect(map.size).toBe(0);
  });

  it("parses multiple entries", () => {
    const body = [
      "- [[sources/ddia]] — Designing Data-Intensive Applications",
      "- [[concepts/replication]] — Replication strategies",
    ].join("\n");
    const map = buildSummaryMap(body);
    expect(map.size).toBe(2);
    expect(map.get("sources/ddia")).toBe("Designing Data-Intensive Applications");
    expect(map.get("concepts/replication")).toBe("Replication strategies");
  });
});

// ─── buildNav ─────────────────────────────────────────────────────────────────

const page = (urlPath: string, title: string) => ({ urlPath, meta: { title } });

describe("buildNav", () => {
  it("groups pages by section slug", () => {
    const nav = buildNav([
      page("concepts/coupling", "Coupling"),
      page("concepts/modularity", "Modularity"),
      page("distributed/replication", "Replication"),
    ]);
    const concepts = nav.find(s => s.slug === "concepts");
    expect(concepts?.pages).toHaveLength(2);
    const distributed = nav.find(s => s.slug === "distributed");
    expect(distributed?.pages).toHaveLength(1);
  });

  it("excludes root-level pages (index, overview)", () => {
    const nav = buildNav([
      page("index", "Index"),
      page("overview", "Overview"),
      page("concepts/coupling", "Coupling"),
    ]);
    expect(nav.find(s => s.slug === "index")).toBeUndefined();
    expect(nav.find(s => s.slug === "overview")).toBeUndefined();
    expect(nav).toHaveLength(1);
  });

  it("sorts pages alphabetically within each section", () => {
    const nav = buildNav([
      page("concepts/modularity", "Modularity"),
      page("concepts/coupling", "Coupling"),
      page("concepts/abstraction", "Abstraction"),
    ]);
    const titles = nav[0].pages.map(p => p.title);
    expect(titles).toEqual(["Abstraction", "Coupling", "Modularity"]);
  });

  it("respects the canonical section order", () => {
    const nav = buildNav([
      page("authors/someone", "Someone"),
      page("concepts/coupling", "Coupling"),
      page("styles/microservices-architecture", "Microservices"),
    ]);
    const slugs = nav.map(s => s.slug);
    expect(slugs.indexOf("styles")).toBeLessThan(slugs.indexOf("concepts"));
    expect(slugs.indexOf("concepts")).toBeLessThan(slugs.indexOf("authors"));
  });

  it("omits sections that have no pages", () => {
    const nav = buildNav([page("concepts/coupling", "Coupling")]);
    const slugs = nav.map(s => s.slug);
    expect(slugs).not.toContain("distributed");
    expect(slugs).not.toContain("sources");
  });

  it("attaches the correct display label to each section", () => {
    const nav = buildNav([page("distributed/replication", "Replication")]);
    expect(nav[0].label).toBe("Distributed");
  });
});

// ─── resolveWikilinks ─────────────────────────────────────────────────────────

describe("resolveWikilinks", () => {
  const linkMap = new Map([
    ["concepts/coupling", "concepts/coupling"],
    ["sources/ddia", "sources/ddia"],
    ["index", "index"],
  ]);

  it("resolves a known wikilink to an anchor tag", () => {
    const result = resolveWikilinks("See [[concepts/coupling]].", linkMap, "index");
    expect(result).toContain('href="concepts/coupling.html"');
    expect(result).toContain(">Coupling<");
  });

  it("uses the display text when provided", () => {
    const result = resolveWikilinks("[[concepts/coupling|Coupling]]", linkMap, "index");
    expect(result).toContain(">Coupling<");
  });

  it("uses relative paths based on current page depth", () => {
    const result = resolveWikilinks("[[index]]", linkMap, "concepts/coupling");
    expect(result).toContain('href="../index.html"');
  });

  it("marks unknown wikilinks as broken", () => {
    const result = resolveWikilinks("[[missing/page]]", linkMap, "index");
    expect(result).toContain("broken-link");
  });

  it("leaves non-wikilink text unchanged", () => {
    const input = "Plain text with no links.";
    expect(resolveWikilinks(input, linkMap, "index")).toBe(input);
  });
});

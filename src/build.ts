import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { resolveWikilinks } from "./wikilinks.js";
import { renderPage, renderHome, renderTagIndex } from "./templates.js";
import { toIsoDate, buildSummaryMap, buildNav } from "./utils.js";
import type { PageData, PageMeta, LinkMap, TagEntry, NavSection } from "./types.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const SITE_DIR = path.join(ROOT, "site");
const WIKI_DIR = path.join(ROOT, "wiki");
const TEMPLATES_DIR = path.join(ROOT, "templates");

marked.setOptions({ gfm: true });

// ─── File helpers ─────────────────────────────────────────────────────────────

function walkMd(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkMd(full));
    else if (entry.name.endsWith(".md")) results.push(full);
  }
  return results;
}

function ensureDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function write(filePath: string, content: string): void {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, "utf8");
}

// ─── Path helpers ─────────────────────────────────────────────────────────────

/** Absolute source path → urlPath (no leading slash, no extension) */
function toUrlPath(absPath: string): string {
  // wiki/index.md → "index", wiki/concepts/coupling.md → "concepts/coupling"
  const rel = path.relative(WIKI_DIR, absPath);
  return rel.replace(/\.md$/, "").replace(/\\/g, "/");
}

/** urlPath → absolute output path under site/ */
function toOutPath(urlPath: string): string {
  return path.join(SITE_DIR, `${urlPath}.html`);
}

// ─── Frontmatter parsing ──────────────────────────────────────────────────────

function parsePage(absPath: string): { meta: PageMeta; body: string } | null {
  const raw = fs.readFileSync(absPath, "utf8");
  const { data, content } = matter(raw);

  // Root pages (index, overview) may lack full frontmatter — supply defaults
  const meta: PageMeta = {
    title: String(data.title ?? path.basename(absPath, ".md")),
    type: (data.type as PageMeta["type"]) ?? "overview",
    tags: (data.tags as string[]) ?? [],
    sources: (data.sources as string[]) ?? [],
    created: toIsoDate(data.created),
    updated: toIsoDate(data.updated),
  };

  return { meta, body: content };
}

// ─── Main build ───────────────────────────────────────────────────────────────

async function build(): Promise<void> {
  // 1. Clean and recreate site/
  fs.rmSync(SITE_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(SITE_DIR, "assets"), { recursive: true });

  // 2. Collect all source .md files
  const allFiles = walkMd(WIKI_DIR);

  // 3. Parse all files
  const pages: PageData[] = [];
  for (const absPath of allFiles) {
    const parsed = parsePage(absPath);
    if (!parsed) continue;
    const urlPath = toUrlPath(absPath);
    pages.push({
      meta: parsed.meta,
      bodyHtml: "", // filled in step 5
      srcPath: path.relative(ROOT, absPath),
      outPath: toOutPath(urlPath),
      urlPath,
      _body: parsed.body, // temporary; removed before render
    } as PageData & { _body: string });
  }

  // 4. Build link map: urlPath → urlPath (identity; relativeUrl does the rest)
  const linkMap: LinkMap = new Map();
  for (const page of pages) {
    linkMap.set(page.urlPath, page.urlPath);
  }

  // 5. Resolve wikilinks + convert Markdown → HTML
  for (const page of pages as Array<PageData & { _body?: string }>) {
    const rawBody = page._body ?? "";
    delete page._body;
    const resolved = resolveWikilinks(rawBody, linkMap, page.urlPath);
    page.bodyHtml = await marked.parse(resolved);
  }

  // 6. Extract summaries from the index page body
  const indexPage = pages.find((p) => p.urlPath === "index");
  const summaryMap = indexPage
    ? buildSummaryMap(
        resolveWikilinks(
          (parsePage(path.join(WIKI_DIR, "index.md")) as { body: string }).body,
          linkMap,
          "index"
        )
      )
    : new Map<string, string>();

  // 7. Build nav + render each page
  const nav = buildNav(pages);
  const tagMap = new Map<string, TagEntry[]>();

  for (const page of pages) {
    const html =
      page.urlPath === "index" ? renderHome(page, nav) : renderPage(page, nav);
    write(page.outPath, html);

    // Accumulate tag entries
    for (const tag of page.meta.tags ?? []) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push({
        title: page.meta.title,
        urlPath: page.urlPath,
        type: page.meta.type,
        summary: summaryMap.get(page.urlPath) ?? "",
      });
    }
  }

  // 8. Render tag index pages
  fs.mkdirSync(path.join(SITE_DIR, "tags"), { recursive: true });
  for (const [tag, entries] of tagMap) {
    const html = renderTagIndex(tag, entries, nav);
    write(path.join(SITE_DIR, "tags", `${tag}.html`), html);
  }

  // 9. Copy stylesheet
  fs.copyFileSync(
    path.join(TEMPLATES_DIR, "style.css"),
    path.join(SITE_DIR, "assets", "style.css")
  );

  // 10. Report
  const pageCount = pages.length;
  const tagCount = tagMap.size;
  console.log(`Built ${pageCount} pages, ${tagCount} tag indexes → site/`);
}

const isMain = process.argv[1] === new URL(import.meta.url).pathname;
if (isMain) {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

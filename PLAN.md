# Architecture Wiki — Project Reference

## Goal

A personal knowledge base on software architecture — patterns, principles, distributed systems, and engineering trade-offs — built from careful reading of key books. Markdown source files are compiled into a clean, self-hosted static HTML site.

---

## Decisions

| Decision | Choice |
|----------|--------|
| Build language | TypeScript |
| Body typography | Georgia (serif) |
| Dark mode | Yes — `prefers-color-scheme` |
| Site title | "Software Architecture" |
| Hosting | GitHub Pages (`gh-pages` branch via Actions) |
| Test framework | Vitest |

---

## Project Layout

```
src/
├── build.ts        ← entry point; orchestrates all steps
├── templates.ts    ← HTML rendering functions
├── wikilinks.ts    ← wikilink resolution and relative URL helpers
├── utils.ts        ← pure utilities: buildNav, toIsoDate, buildSummaryMap
├── types.ts        ← shared types
└── build.test.ts   ← Vitest test suite (26 tests)
templates/
└── style.css       ← hand-authored stylesheet; copied to site/assets/ at build time
wiki/               ← Markdown source files (the actual wiki content)
site/               ← build output (git-ignored; deployed via gh-pages)
```

### npm packages

| Package | Purpose |
|---------|---------|
| `marked` | Markdown → HTML |
| `gray-matter` | YAML frontmatter parsing |
| `tsx` | Run TypeScript directly (no compile step) |
| `vitest` | Test runner |
| `typescript` | Type checking |
| `@types/node` | Node.js types |

```bash
npm run build   # tsx src/build.ts
npm test        # vitest run
```

---

## Types (`src/types.ts`)

```typescript
type PageType = "source" | "concept" | "pattern" | "style" | "author"
              | "comparison" | "overview" | "reference" | "index"
              | "database" | "stream";

interface PageMeta {
  title: string;
  type: PageType;
  tags: string[];
  sources: string[];
  created: string;   // always coerced to "YYYY-MM-DD" string via toIsoDate()
  updated: string;   // gray-matter parses unquoted YAML dates as Date objects
}

interface PageData {
  meta: PageMeta;
  bodyHtml: string;
  srcPath: string;   // "wiki/concepts/coupling.md"
  outPath: string;   // "site/concepts/coupling.html"
  urlPath: string;   // "concepts/coupling" — the wikilink key
}

type LinkMap = Map<string, string>;  // urlPath → urlPath (identity; relativeUrl does the rest)

interface NavEntry   { title: string; urlPath: string; }
interface NavSection { slug: string; label: string; pages: NavEntry[]; }
interface TagEntry   { title: string; urlPath: string; type: PageType; summary: string; }
```

---

## Build Steps (`src/build.ts`)

1. **Clean** — `fs.rmSync(site/, { recursive: true, force: true })` — full wipe before every build; no stale files can accumulate.
2. **Scan** — `walkMd(wiki/)` collects all `.md` files recursively.
3. **Parse** — `gray-matter` extracts YAML frontmatter; `toIsoDate()` coerces `Date` objects from gray-matter into `"YYYY-MM-DD"` strings.
4. **Build link map** — `Map<urlPath, urlPath>`; used by `relativeUrl()` at render time.
5. **Resolve wikilinks + convert** — `resolveWikilinks()` replaces `[[...]]` patterns with Markdown anchors; `marked.parse()` converts to HTML.
6. **Extract summaries** — `buildSummaryMap()` parses `index.md` for one-line summaries (`- [[path]] — Summary text`) used on tag and section index pages.
7. **Build nav** — `buildNav(pages)` groups pages by section, sorts alphabetically within each section, and respects a canonical section order.
8. **Render pages** — `renderPage()` for content pages, `renderHome()` for `index.md`.
9. **Render tag pages** — one `site/tags/<tag>.html` per unique tag.
10. **Render section index pages** — one `site/<section>/index.html` per nav section; auto-generated from page metadata. **No markdown source files for these** — do not create manually.
11. **Copy stylesheet** — `templates/style.css` → `site/assets/style.css`.

---

## Output Structure

```
site/
├── index.html
├── overview.html
├── assets/style.css
├── {section}/
│   ├── index.html      ← auto-generated section index
│   └── {page}.html
└── tags/
    └── {tag}.html
```

Sections: `styles`, `concepts`, `distributed`, `operations`, `patterns`, `databases`, `streams`, `comparisons`, `reference`, `sources`, `authors`.

---

## Templates (`src/templates.ts`)

### Exported render functions

| Function | Output |
|----------|--------|
| `renderPage(page, nav)` | Content page with breadcrumb, type badge, tag chips, page body |
| `renderHome(page, nav)` | Index/home page (no breadcrumb) |
| `renderTagIndex(tag, entries, nav)` | Tag listing page |
| `renderSectionIndex(slug, label, entries, nav)` | Section listing page |

### Key helpers

- **`renderBase(opts)`** — page shell: `<html>`, `<head>`, sidebar, `<main>`, `<footer>`
- **`renderSidebar(nav, currentUrlPath)`** — collapsible `<details>`/`<summary>` nav; current section auto-expanded via inline synchronous script (avoids UA `details` hiding rules that cannot be reliably overridden with CSS alone)
- **`breadcrumb(urlPath, title)`** — `Home › Section › Page`; section label links to section index; special-cased on section index pages to avoid self-links
- **`typeBadge(type, href?)`** — `<a>` when href provided (links to section index), otherwise `<span>`
- **`tagChips(tags, fromPath)`** — pill links to `tags/<tag>.html`
- **`formatDate(iso)`** — `"2026-05-22"` → `"22<sup>nd</sup> May 2026"`
- **`wrapTables(html)`** — wraps `<table>` in `<div class="table-wrapper">` for horizontal scroll on mobile

---

## CSS Architecture (`templates/style.css`)

- **No external dependencies** — no Google Fonts, no CDN, no runtime JS
- **Custom properties** — all colours and key sizes in `:root` / dark-mode block
- **Flex layout** — `.layout` is a row flex container; sidebar is `flex-shrink: 0`; `<main>` is `flex: 1; min-width: 0; max-width: 100%`
- **`max-width: 100%` on `<main>`** — prevents wide `<pre>` blocks from overflowing; do not add `overflow-x: clip` to `<body>` as it breaks horizontal scrolling of code blocks
- **Sticky sidebar** — `position: sticky; top: 0; max-height: 100vh; overflow-y: auto`
- **Mobile** (`≤720px`) — sidebar becomes full-width block above main; collapsible via `<details>`; "Jump to content ↓" link skips navigation
- **Inline script** in sidebar — `if(matchMedia('(min-width:721px)').matches) document.querySelector('.sidebar-wrapper').setAttribute('open','')` — sets sidebar `open` on desktop before first paint, reliably, without CSS cascade issues

### Colour palette

| Token | Light | Dark |
|-------|-------|------|
| `--bg` | `#fafaf8` | `#1a1a18` |
| `--text` | `#1a1a1a` | `#e8e8e4` |
| `--link` | `#2a5db0` | `#7aaaef` |
| `--accent` | `#b87820` | `#c8922a` |
| `--sidebar-bg` | `#f2f2ee` | `#141412` |
| `--code-bg` | `#f0f0ec` | `#252522` |

---

## Wikilink Resolution (`src/wikilinks.ts`)

Regex: `/\[\[([^\]|#]+?)(?:#([^\]|]+?))?(?:\|([^\]]+?))?\]\]/g`

- Group 1: path (`concepts/coupling`)
- Group 2: anchor (optional, `#Evans-Elaborations`)
- Group 3: display text (optional)

Unknown paths → `<span class="broken-link">...</span>`.

`relativeUrl(fromPath, toPath)` computes the correct `../`-prefixed relative URL so the site works both on the filesystem (`file://`) and when hosted at a subpath.

---

## GitHub Actions (`/.github/workflows/deploy.yml`)

Triggers on push to `main` and `workflow_dispatch`. Runs `npm ci && npm run build`, then publishes `./site` to the `gh-pages` branch via `peaceiris/actions-gh-pages@v4`.

---

## Pending Work

| Priority | Task |
|----------|------|
| 1 | **Code review** — principal engineer review of build code and HTML output ✓ |
| 2 | **Fix duplicate H1** — `parsePage` extracts the first `# H1` from the body as `meta.title`, strips it from the body; template renders it once ✓ |
| 3 | **Accent colour** — pick a new accent colour; apply it in more places (links, active nav items, focus rings, etc.) ✓ |
| 4 | **Accessibility review** — full WCAG audit: heading hierarchy (now fixed by H1 change), colour contrast ratios, ARIA landmarks and labels, keyboard navigation, screen reader testing. `:focus-visible` outline added; deeper audit still needed. |
| 5 | **Tag scan** — review remaining singleton tags; identify pages that should adopt more tags from the canonical set ✓ |
| 6 | **SEO audit** — review all page types for appropriate meta tags. Key known issues: (a) tag index pages (`tags/*.html`) are thin, auto-generated content and should carry `<meta name="robots" content="noindex">` to avoid being indexed as low-quality pages; the all-tags index (`tags/index.html`) could go either way; (b) author and source pages are internal reference pages and may also warrant `noindex`; (c) all content pages lack `<meta name="description">` — consider generating from the first paragraph or the summary map; (d) no `<link rel="canonical">` — needed if the site is ever served at multiple URLs. |

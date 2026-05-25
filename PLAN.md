# Architecture Wiki — HTML Site Plan

## Goal

Convert the Markdown wiki into a deployable static HTML site:
- Wikilinks become real hyperlinks
- Tag index pages list and link every page carrying that tag
- Clean, readable typography — self-contained, no external dependencies
- Free hosting via GitHub Pages

---

## Decisions

| Decision | Choice |
|----------|--------|
| Build language | TypeScript |
| Body typography | Georgia (serif) |
| Dark mode | Yes — via `prefers-color-scheme` |
| Site title | "Software Architecture" |

---

## Tech Stack

### Build: TypeScript (`src/build.ts`)

**Why not a third-party SSG:**
The wiki has bespoke wikilink syntax, custom frontmatter conventions, and a non-standard directory layout. A custom script gives full control over wikilink resolution and tag page generation, with no SSG opinions to fight.

**Why TypeScript over Python:**
User preference. TypeScript's type system makes the frontmatter schema, page data shapes, and template contracts explicit and checkable.

**npm packages:**
| Package | Purpose |
|---------|---------|
| `marked` | Markdown → HTML |
| `gray-matter` | YAML frontmatter parsing |
| `tsx` | Run TypeScript directly (no compile step) |
| `typescript` | Type checking |
| `@types/node` | Node.js types |

```bash
npm install marked gray-matter
npm install -D typescript tsx @types/node
```

### Templates: TypeScript functions (`src/templates.ts`)

HTML is composed in TypeScript using tagged template literals — no separate template engine needed. This keeps templates type-safe and co-located with the data shapes they consume.

Composable structure:
- `renderBase(content, meta)` — page shell: `<html>`, `<head>`, nav, footer
- `renderPage(page)` — wiki content page (sources, concepts, patterns, authors, etc.)
- `renderHome(page)` — wiki index/home page (from `index.md`)
- `renderTagIndex(tag, pages)` — tag index page

One external file: `templates/style.css` — the only non-TypeScript template asset, copied to `site/assets/style.css` at build time.

### Project layout

```
src/
├── build.ts        ← entry point; orchestrates all steps
├── templates.ts    ← HTML rendering functions
├── wikilinks.ts    ← wikilink resolution logic
└── types.ts        ← shared types (PageMeta, PageData, LinkMap, etc.)
templates/
└── style.css       ← stylesheet (hand-authored)
```

### Output directory: `site/`

(`dist/` implies a compiled artefact; `public/` is Netlify-specific; `site/` is the natural English word for what this is.)

### Hosting: GitHub Pages

- Free, no build server required, custom domain support
- Serve from a `gh-pages` branch so `main` stays clean (no committed build output)
- Build and deploy via a single GitHub Actions workflow (`.github/workflows/deploy.yml`)

---

## Output Structure

```
site/
├── index.html              ← wiki home (from index.md)
├── overview.html
├── assets/
│   └── style.css
├── sources/
│   └── *.html
├── concepts/
│   └── *.html
├── distributed/
│   └── *.html
├── operations/
│   └── *.html
├── patterns/
│   └── *.html
├── styles/
│   └── *.html
├── databases/
│   └── *.html
├── streams/
│   └── *.html
├── authors/
│   └── *.html
├── comparisons/
│   └── *.html
├── reference/
│   └── *.html
└── tags/
    └── <tag-name>.html     ← one per tag, e.g. tags/microservices.html
```

File paths mirror the source layout exactly, with `.md` replaced by `.html`.

---

## Build Script (`src/build.ts`)

### Steps (in order)

1. **Scan** — glob `wiki/**/*.md`, plus `index.md` and `overview.md` at root.
2. **Parse** — for each file: extract YAML frontmatter via `gray-matter`; type the result as `PageMeta`; keep remaining text as the Markdown body string.
3. **Build link map** — construct `Map<string, string>` of wikilink path → output path, e.g. `"concepts/coupling"` → `"concepts/coupling.html"`. Used to compute relative URLs at render time.
4. **Resolve wikilinks** — replace all `[[...]]` patterns with Markdown link syntax before passing to `marked`. Three forms handled (see Wikilink Resolution section).
5. **Convert** — run resolved Markdown through `marked.parse()` with `gfm: true` (GitHub Flavoured Markdown — tables, fenced code, strikethrough).
6. **Render** — call the appropriate template function with typed page data; write the resulting HTML string to `site/`.
7. **Generate tag pages** — aggregate all pages by tag; for each tag call `renderTagIndex()` and write to `site/tags/<tag>.html`.
8. **Copy assets** — copy `templates/style.css` → `site/assets/style.css`.

### Types (`src/types.ts`)

```typescript
interface PageMeta {
  title: string;
  type: "source" | "concept" | "pattern" | "style" | "author" |
        "comparison" | "overview" | "reference" | "index";
  tags: string[];
  sources: string[];
  created: string;
  updated: string;
}

interface PageData {
  meta: PageMeta;
  bodyHtml: string;
  srcPath: string;   // e.g. "wiki/concepts/coupling.md"
  outPath: string;   // e.g. "site/concepts/coupling.html"
  urlPath: string;   // e.g. "concepts/coupling"
}

type LinkMap = Map<string, string>;  // wikilink path → urlPath
```

### Running it

```bash
npm run build       # runs: tsx src/build.ts
```

---

## CSS / Typography

Design principles:
- Self-contained: no Google Fonts, no CDN, no JavaScript
- Optimised for long-form reading
- Mobile-first, single column; centred on wider screens
- Dark mode via `@media (prefers-color-scheme: dark)`

Key rules:

| Property | Light | Dark | Rationale |
|----------|-------|------|-----------|
| Body font | `Georgia, 'Times New Roman', serif` | same | Designed for reading; familiar to book readers |
| UI font | `system-ui, sans-serif` | same | Nav, metadata, tags — screen-native |
| Max content width | `70ch` | same | Optimal line length |
| Background | `#fafaf8` | `#1a1a18` | Off-white / off-black |
| Text | `#1a1a1a` | `#e8e8e4` | Near-black / near-white |
| Link | `#2a5db0` | `#7aaaef` | Readable in both modes |
| Code block bg | `#f0f0ec` | `#252522` | Distinct from prose |
| Blockquote border | `#c8a96e` | `#8a6e3a` | Warm accent for callouts |

Additional elements:
- **Tag chips** — small pill labels in the page header, each linking to `tags/<tag>.html`
- **Breadcrumb** — `Software Architecture > Concepts > Coupling`
- **Source citation style** — `(→ source-name)` in muted colour with `↗` glyph, distinct from regular links
- **Blockquotes** — left border in accent colour; `**Contradiction:**` and `**Open question:**` prefixes rendered in bold

---

## Wikilink Resolution Detail (`src/wikilinks.ts`)

Regex: `/\[\[([^\]|#]+?)(?:#([^\]|]+?))?(?:\|([^\]]+?))?\]\]/g`

Capture groups:
1. Path — e.g. `concepts/coupling`
2. Anchor — optional, e.g. `Evans-Elaborations`
3. Display text — optional, e.g. `coupling`

Resolution:
```typescript
function resolveWikilink(
  path: string, anchor: string | undefined,
  display: string | undefined,
  linkMap: LinkMap, currentUrlPath: string
): string {
  const targetUrl = linkMap.get(path);
  if (!targetUrl) {
    const slug = path.split("/").at(-1) ?? path;
    return `<span class="broken-link">${display ?? slug}</span>`;
  }
  const rel = relativeUrl(currentUrlPath, targetUrl)
    + (anchor ? `#${anchor}` : "");
  const label = display ?? path.split("/").at(-1)!
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
  return `[${label}](${rel})`;
}
```

Relative URL computation ensures the site works opened from the filesystem (`file://`) and when hosted at a subpath.

---

## Tag Pages

Each `site/tags/<tag>.html` contains:
- H1: tag name (de-hyphenated, title-cased)
- Subtitle: "N pages"
- Alphabetically sorted list; each entry:
  - **Title** (linked to the page)
  - One-line summary drawn from the `index.md` entry for that page (the text after the `—`)
  - Type badge (concept, pattern, source, etc.)

---

## GitHub Actions Deploy Workflow

File: `.github/workflows/deploy.yml`

```yaml
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./site
```

Every push to `main` rebuilds and redeploys. `site/` stays out of `main`'s tree.

---

## Implementation Order

- [ ] 1. `npm init`, install dependencies, write `tsconfig.json` and `package.json` scripts
- [ ] 2. Write `src/types.ts`
- [ ] 3. Write `templates/style.css` (light + dark mode)
- [ ] 4. Write `src/templates.ts` (base shell + page + home + tag index)
- [ ] 5. Write `src/wikilinks.ts` (regex, resolver, relative URL helper)
- [ ] 6. Write `src/build.ts` (scanner → parser → link-map → resolver → renderer → tag generator → asset copy)
- [ ] 7. Run `npm run build` locally; open `site/index.html` in browser
- [ ] 8. Fix broken links, rendering issues, layout problems
- [ ] 9. Add `site/` and `node_modules/` to `.gitignore`
- [ ] 10. Write `.github/workflows/deploy.yml`
- [ ] 11. Push to GitHub; enable Pages (Settings → Pages → source: `gh-pages` branch)
- [ ] 12. Update `README.md` with the live URL

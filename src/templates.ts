import { relativeUrl } from "./wikilinks.js";
import { escapeHtml, toTitleCase } from "./utils.js";
import type { PageData, PageType, TagEntry, NavSection } from "./types.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatDate(iso: string): string {
  const [year, month, day] = String(iso ?? "").split("-").map(Number);
  if (!year || !month || !day) return escapeHtml(iso);
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  const suffix = day === 1 || day === 21 || day === 31 ? "st"
               : day === 2 || day === 22 ? "nd"
               : day === 3 || day === 23 ? "rd"
               : "th";
  return `${day}<sup>${suffix}</sup> ${months[month - 1]} ${year}`;
}

// href makes the badge a link (to the section index); omit for a plain label
function typeBadge(type: PageType, href?: string): string {
  const text = escapeHtml(type);
  if (href) return `<a class="page-type-badge" href="${escapeHtml(href)}">${text}</a>`;
  return `<span class="page-type-badge">${text}</span>`;
}

function tagChips(tags: string[], fromPath: string): string {
  if (!tags.length) return "";
  const chips = tags
    .map(
      (t) =>
        `<li><a class="tag-chip" href="${relativeUrl(fromPath, `tags/${t}`)}">${escapeHtml(t)}</a></li>`
    )
    .join("");
  return `<ul class="tag-list" aria-label="Tags">${chips}</ul>`;
}

function breadcrumb(urlPath: string, title: string): string {
  const parts = urlPath.split("/");
  const depth = parts.length - 1;
  const prefix = depth > 0 ? "../".repeat(depth) : "";

  const homeLink = `<a href="${prefix}index.html">Software Architecture</a>`;
  if (parts.length === 1) {
    return `<nav class="breadcrumb" aria-label="Breadcrumb">${homeLink} <span class="sep">›</span> ${escapeHtml(title)}</nav>`;
  }
  const sectionSlug = parts[0];
  const sectionLabel = toTitleCase(sectionSlug);
  // On a section index page itself, don't turn the section label into a self-link
  if (parts[1] === "index") {
    return `<nav class="breadcrumb" aria-label="Breadcrumb">${homeLink} <span class="sep">›</span> ${escapeHtml(sectionLabel)}</nav>`;
  }
  const sectionHref = relativeUrl(urlPath, `${sectionSlug}/index`);
  return `<nav class="breadcrumb" aria-label="Breadcrumb">${homeLink} <span class="sep">›</span> <a href="${sectionHref}">${escapeHtml(sectionLabel)}</a> <span class="sep">›</span> ${escapeHtml(title)}</nav>`;
}

/**
 * Inline script that gives a `<details>` element an "open on desktop, closed
 * on mobile" default. The element is rendered with `open` server-side so
 * desktop shows it without JS; this script removes `open` on mobile before
 * first paint and restores it when the viewport widens. Used by both the
 * sidebar and the per-page TOC so the behaviour stays in sync.
 *
 * The selector is interpolated into a JS string literal — only pass trusted
 * static selectors.
 */
function desktopOpenScript(selector: string): string {
  return `<script>(function(){var q=matchMedia('(min-width:721px)'),e=document.querySelector('${selector}');if(!e)return;if(!q.matches)e.removeAttribute('open');q.addEventListener('change',function(ev){if(ev.matches)e.setAttribute('open','');});})();</script>`;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function renderSidebar(nav: NavSection[], currentUrlPath: string): string {
  const currentSection = currentUrlPath.split("/").length > 1
    ? currentUrlPath.split("/")[0]
    : "";

  const sections = nav.map(section => {
    const isOpen = section.slug === currentSection;
    const indexHref = relativeUrl(currentUrlPath, `${section.slug}/index`);
    const isOnIndex = currentUrlPath === `${section.slug}/index`;

    const indexLink = `<li><a class="section-index-link" href="${indexHref}"${isOnIndex ? ' aria-current="page"' : ""}>Index</a></li>`;

    const items = section.pages.map(page => {
      const isCurrent = page.urlPath === currentUrlPath;
      const href = relativeUrl(currentUrlPath, page.urlPath);
      const current = isCurrent ? ' aria-current="page"' : "";
      return `<li><a href="${href}"${current}>${escapeHtml(page.title)}</a></li>`;
    }).join("\n        ");

    return `
    <details${isOpen ? " open" : ""}>
      <summary>${escapeHtml(section.label)}</summary>
      <ul>
        ${indexLink}
        ${items}
      </ul>
    </details>`;
  }).join("");

  const homeHref = relativeUrl(currentUrlPath, "index");
  const overviewHref = relativeUrl(currentUrlPath, "overview");
  const aboutHref = relativeUrl(currentUrlPath, "about");
  const topLinks = `<ul class="nav-top-links">
      <li><a href="${homeHref}"${currentUrlPath === "index" ? ' aria-current="page"' : ""}>Home</a></li>
      <li><a href="${overviewHref}"${currentUrlPath === "overview" ? ' aria-current="page"' : ""}>Overview</a></li>
      <li><a href="${aboutHref}"${currentUrlPath === "about" ? ' aria-current="page"' : ""}>About</a></li>
    </ul>`;

  // Rendered open so desktop shows the sidebar without JS.
  // desktopOpenScript() collapses it on mobile before first paint.
  return `<details class="sidebar-wrapper" open>
    <summary class="sidebar-toggle">Navigation</summary>
    <nav class="sidebar" aria-label="Wiki sections">
    <a class="jump-to-content" href="#main-content">Jump to content ↓</a>
    ${topLinks}${sections}
    </nav>
  </details>
  ${desktopOpenScript(".sidebar-wrapper")}`;
}

// ─── Base shell ───────────────────────────────────────────────────────────────

function truncDesc(text: string, max = 155): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s\S*$/, "") + "…";
}

function renderBase(opts: {
  title: string;
  urlPath: string;
  content: string;
  nav: NavSection[];
  footerNote?: string;
  description?: string;
  noindex?: boolean;
}): string {
  const depth = opts.urlPath.split("/").length - 1;
  const prefix = depth > 0 ? "../".repeat(depth) : "";
  const pageTitle = opts.urlPath === "index"
    ? "Software Architecture"
    : `${opts.title} — Software Architecture`;

  const sidebar = renderSidebar(opts.nav, opts.urlPath);
  const metaRobots = opts.noindex ? '\n  <meta name="robots" content="noindex">' : "";
  const desc = opts.description ? truncDesc(opts.description) : "";
  const metaDesc = desc
    ? `\n  <meta name="description" content="${escapeHtml(desc)}">`
    : "";
  const ogType = opts.urlPath === "index" ? "website" : "article";
  const ogTags = `
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="Software Architecture">${desc ? `\n  <meta property="og:description" content="${escapeHtml(desc)}">` : ""}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">${metaRobots}${metaDesc}${ogTags}
  <title>${escapeHtml(pageTitle)}</title>
  <script>(function(){var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)})();</script>
  <link rel="stylesheet" href="${prefix}assets/style.css">
  <link rel="stylesheet" href="${prefix}pagefind/pagefind-ui.css">
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="site-header">
    <a class="site-title" href="${prefix}index.html">Software Architecture</a>
    <div class="header-controls">
      <button class="search-toggle" type="button" aria-label="Search">Search</button>
      <button class="theme-toggle" type="button" aria-label="Colour scheme: Auto. Click to change.">Auto</button>
    </div>
  </header>
  <dialog class="search-dialog" id="search-dialog" aria-label="Search">
    <button class="search-close" type="button" aria-label="Close search">✕</button>
    <div id="search"></div>
  </dialog>
  <div class="layout">
    ${sidebar}
    <main id="main-content"${!opts.noindex && opts.urlPath !== "index" && opts.urlPath !== "overview" && opts.urlPath !== "about" ? " data-pagefind-body" : ""}>
      ${opts.content}
    </main>
  </div>
  <footer class="site-footer">
    ${opts.footerNote ?? `A personal knowledge base synthesised from key books in the field. <a href="https://github.com/Synchronium/software-architecture-wiki">GitHub</a> · <a href="https://github.com/Synchronium/software-architecture-wiki/issues">Feedback &amp; suggestions</a>`}
  </footer>
  <script defer src="${prefix}pagefind/pagefind-ui.js"></script>
  <script defer src="${prefix}assets/main.js"></script>
</body>
</html>`;
}

// ─── Table of contents ───────────────────────────────────────────────────────

/** GitHub-style slug for heading anchors. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")           // strip any HTML tags
    .replace(/&[a-z]+;/g, "")          // strip HTML entities
    .replace(/[^a-z0-9\s-]/g, "")      // drop punctuation
    .trim()
    .replace(/\s+/g, "-");             // spaces → hyphens
}

/**
 * Extract h2/h3 headings, inject stable IDs into the HTML, and return the
 * TOC HTML alongside the modified body. h1 is the page title (handled by the
 * template). h4+ is omitted to keep the TOC shallow.
 *
 * Returns { html, toc }. `toc` is empty if there are fewer than 3 headings.
 */
function extractToc(html: string): { html: string; toc: string } {
  type Heading = { level: 2 | 3; id: string; text: string };
  const headings: Heading[] = [];
  const seen = new Set<string>();

  const newHtml = html.replace(
    /<h([23])>([^<]+(?:<[^>]+>[^<]*)*?)<\/h\1>/g,
    (_match, levelStr, inner) => {
      const level = parseInt(levelStr, 10) as 2 | 3;
      const text = String(inner).replace(/<[^>]+>/g, "").trim();
      const base = slugify(text);
      // De-dupe by appending -2, -3 … on collision
      let id = base;
      let n = 2;
      while (seen.has(id)) {
        id = `${base}-${n++}`;
      }
      seen.add(id);
      headings.push({ level, id, text });
      return `<h${level} id="${id}">${inner}</h${level}>`;
    }
  );

  if (headings.length < 3) return { html: newHtml, toc: "" };

  // h.text is already HTML-escaped (it comes from inside marked-rendered tags),
  // so we use it as-is here. Re-escaping would double-encode entities like
  // &quot; → &amp;quot;.
  const items = headings
    .map(h => {
      const cls = h.level === 3 ? ' class="toc-sub"' : "";
      return `<li${cls}><a href="#${h.id}">${h.text}</a></li>`;
    })
    .join("");

  // Rendered open so desktop shows the TOC without JS.
  // desktopOpenScript() collapses it on mobile before first paint.
  const toc = `<details class="toc" open>
    <summary>Contents</summary>
    <ol>${items}</ol>
  </details>
  ${desktopOpenScript(".toc")}`;

  return { html: newHtml, toc };
}

// ─── Wiki page ────────────────────────────────────────────────────────────────

export function renderPage(
  page: PageData,
  nav: NavSection[],
  description?: string,
  backlinks?: Array<{ title: string; urlPath: string }>
): string {
  const { meta, bodyHtml, urlPath } = page;

  // Badge links to the section index if this page lives inside a section
  const sectionParts = urlPath.split("/");
  const badgeHref = sectionParts.length > 1
    ? relativeUrl(urlPath, `${sectionParts[0]}/index`)
    : undefined;

  const header = `
    <div class="page-header">
      <div class="breadcrumb-row">${breadcrumb(urlPath, meta.title)}</div>
      <h1>${escapeHtml(meta.title)}</h1>
      <div class="page-meta">
        ${typeBadge(meta.type, badgeHref)}
        ${meta.updated ? `<span class="page-updated">Updated ${formatDate(meta.updated)}</span>` : ""}
      </div>
      ${tagChips(meta.tags ?? [], urlPath)}
    </div>`;

  const sorted = [...(backlinks ?? [])].sort((a, b) => a.title.localeCompare(b.title));
  const backlinksHtml = sorted.length > 0
    ? `<aside class="backlinks" aria-label="Referenced by" data-pagefind-ignore>
        <h2>Referenced by</h2>
        <ul>${sorted.map(b => `<li><a href="${relativeUrl(urlPath, b.urlPath)}">${escapeHtml(b.title)}</a></li>`).join("")}</ul>
      </aside>`
    : "";

  const listenBar = `<div class="listen-bar" data-pagefind-ignore>
    <button class="listen-btn" type="button" aria-label="Listen to this page">Listen</button>
    <button class="listen-stop" type="button" aria-label="Stop listening" hidden>Stop</button>
    <span class="listen-experimental">← experimental</span>
  </div>`;

  const { html: withIds, toc } = extractToc(bodyHtml);
  const wrappedBody = wrapTables(withIds);
  const content = `${header}${listenBar}${toc}<div class="page-body">${wrappedBody}</div>${backlinksHtml}`;
  return renderBase({ title: meta.title, urlPath, content, nav, description });
}

// ─── Home / index page ────────────────────────────────────────────────────────

export function renderHome(page: PageData, nav: NavSection[]): string {
  const wrappedBody = wrapTables(page.bodyHtml);
  const content = `
    <div class="page-header">
      <h1>Software Architecture</h1>
    </div>
    <div class="page-body home-body">${wrappedBody}</div>`;

  return renderBase({
    title: "Software Architecture",
    urlPath: "index",
    content,
    nav,
    description: "A personal knowledge base on software architecture — patterns, principles, distributed systems, and engineering trade-offs, synthesised from key books in the field.",
  });
}

// ─── Tag index page ───────────────────────────────────────────────────────────

export function renderTagIndex(tag: string, entries: TagEntry[], nav: NavSection[]): string {
  const sorted = [...entries].sort((a, b) => a.title.localeCompare(b.title));
  const count = sorted.length;

  const items = sorted
    .map((e) => {
      const href = `../${e.urlPath}.html`;
      return `
      <li class="tag-index-item">
        <a href="${href}">${escapeHtml(e.title)}</a>
        ${typeBadge(e.type)}
        ${e.summary ? `<p class="summary">${escapeHtml(e.summary)}</p>` : ""}
      </li>`;
    })
    .join("");

  const content = `
    <div class="tag-index-header">
      ${breadcrumb("tags/" + tag, toTitleCase(tag))}
      <h1>${escapeHtml(toTitleCase(tag))}</h1>
      <p class="tag-count">${count} ${count === 1 ? "page" : "pages"}</p>
    </div>
    <ul class="tag-index-list">${items}</ul>`;

  return renderBase({
    title: toTitleCase(tag),
    urlPath: `tags/${tag}`,
    content,
    nav,
    noindex: true,
    description: `${count} ${count === 1 ? "page" : "pages"} tagged "${toTitleCase(tag)}" in the Software Architecture wiki.`,
  });
}

// ─── Section index page ───────────────────────────────────────────────────────

export function renderSectionIndex(
  sectionSlug: string,
  label: string,
  entries: Array<{ title: string; urlPath: string; summary: string }>,
  nav: NavSection[]
): string {
  const urlPath = `${sectionSlug}/index`;
  const sorted = [...entries].sort((a, b) => a.title.localeCompare(b.title));
  const count = sorted.length;

  const items = sorted.map(e => {
    const href = relativeUrl(urlPath, e.urlPath);
    return `
    <li class="tag-index-item">
      <a href="${href}">${escapeHtml(e.title)}</a>
      ${e.summary ? `<p class="summary">${escapeHtml(e.summary)}</p>` : ""}
    </li>`;
  }).join("");

  const content = `
    <div class="tag-index-header">
      ${breadcrumb(urlPath, label)}
      <h1>${escapeHtml(label)}</h1>
      <p class="tag-count">${count} ${count === 1 ? "page" : "pages"}</p>
    </div>
    <ul class="tag-index-list">${items}</ul>`;

  return renderBase({
    title: label,
    urlPath,
    content,
    nav,
    description: `All ${count} ${count === 1 ? "page" : "pages"} in the ${label} section of the Software Architecture wiki.`,
  });
}

// ─── All-tags index page ──────────────────────────────────────────────────────

export function renderTagAllIndex(tagMap: Map<string, TagEntry[]>, nav: NavSection[]): string {
  const sorted = [...tagMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  const totalTags = sorted.length;

  const items = sorted
    .map(([tag, entries]) => {
      const count = entries.length;
      const href = `${escapeHtml(tag)}.html`;
      return `
      <li class="tag-index-item">
        <a href="${href}">${escapeHtml(tag)}</a>
        <span class="page-type-badge">${count} ${count === 1 ? "page" : "pages"}</span>
      </li>`;
    })
    .join("");

  const content = `
    <div class="tag-index-header">
      ${breadcrumb("tags/index", "Tags")}
      <h1>Tags</h1>
      <p class="tag-count">${totalTags} ${totalTags === 1 ? "tag" : "tags"}</p>
    </div>
    <ul class="tag-index-list">${items}</ul>`;

  return renderBase({
    title: "Tags",
    urlPath: "tags/index",
    content,
    nav,
    noindex: true,
    description: `Browse all ${totalTags} tags used across the Software Architecture wiki.`,
  });
}

// ─── Table wrapper (for overflow-x scroll on mobile) ─────────────────────────

function wrapTables(html: string): string {
  return html.replace(/<table/g, '<div class="table-wrapper"><table').replace(
    /<\/table>/g,
    "</table></div>"
  );
}

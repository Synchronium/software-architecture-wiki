import { relativeUrl } from "./wikilinks.js";
import { escapeHtml, toTitleCase } from "./utils.js";
import type { PageData, PageMeta, PageType, TagEntry, NavSection } from "./types.js";

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
        `<a class="tag-chip" href="${relativeUrl(fromPath, `tags/${t}`)}">${escapeHtml(t)}</a>`
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
    return `<nav class="breadcrumb">${homeLink} <span class="sep">›</span> ${escapeHtml(title)}</nav>`;
  }
  const sectionSlug = parts[0];
  const sectionLabel = toTitleCase(sectionSlug);
  // On a section index page itself, don't turn the section label into a self-link
  if (parts[1] === "index") {
    return `<nav class="breadcrumb">${homeLink} <span class="sep">›</span> ${escapeHtml(sectionLabel)}</nav>`;
  }
  const sectionHref = relativeUrl(urlPath, `${sectionSlug}/index`);
  return `<nav class="breadcrumb">${homeLink} <span class="sep">›</span> <a href="${sectionHref}">${escapeHtml(sectionLabel)}</a> <span class="sep">›</span> ${escapeHtml(title)}</nav>`;
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
  const topLinks = `<ul class="nav-top-links">
      <li><a href="${homeHref}"${currentUrlPath === "index" ? ' aria-current="page"' : ""}>Home</a></li>
      <li><a href="${overviewHref}"${currentUrlPath === "overview" ? ' aria-current="page"' : ""}>Overview</a></li>
    </ul>`;

  // Script runs synchronously during parse (before first paint) — sets 'open'
  // on desktop so the nav is visible; leaves it unset on mobile so it stays collapsed.
  return `<details class="sidebar-wrapper">
    <summary class="sidebar-toggle">Navigation</summary>
    <nav class="sidebar" aria-label="Wiki sections">
    <a class="jump-to-content" href="#main-content">Jump to content ↓</a>
    ${topLinks}${sections}
    </nav>
  </details>
  <script>(function(){var q=matchMedia('(min-width:721px)'),s=document.querySelector('.sidebar-wrapper');function f(){q.matches?s?.setAttribute('open',''):s?.removeAttribute('open');}f();q.addEventListener('change',f);})();</script>`;
}

// ─── Base shell ───────────────────────────────────────────────────────────────

function renderBase(opts: {
  title: string;
  urlPath: string;
  content: string;
  nav: NavSection[];
  footerNote?: string;
}): string {
  const depth = opts.urlPath.split("/").length - 1;
  const prefix = depth > 0 ? "../".repeat(depth) : "";
  const pageTitle = opts.urlPath === "index"
    ? "Software Architecture"
    : `${opts.title} — Software Architecture`;

  const sidebar = renderSidebar(opts.nav, opts.urlPath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)}</title>
  <link rel="stylesheet" href="${prefix}assets/style.css">
</head>
<body>
  <header class="site-header">
    <a class="site-title" href="${prefix}index.html">Software Architecture</a>
  </header>
  <div class="layout">
    ${sidebar}
    <main id="main-content">
      ${opts.content}
    </main>
  </div>
  <footer class="site-footer">
    ${opts.footerNote ?? "A personal knowledge base synthesised from key books in the field."}
  </footer>
</body>
</html>`;
}

// ─── Wiki page ────────────────────────────────────────────────────────────────

export function renderPage(page: PageData, nav: NavSection[]): string {
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

  const wrappedBody = wrapTables(bodyHtml);
  const content = `${header}<div class="page-body">${wrappedBody}</div>`;
  return renderBase({ title: meta.title, urlPath, content, nav });
}

// ─── Home / index page ────────────────────────────────────────────────────────

export function renderHome(page: PageData, nav: NavSection[]): string {
  const wrappedBody = wrapTables(page.bodyHtml);
  const content = `
    <div class="page-header">
      <h1>Software Architecture</h1>
    </div>
    <div class="page-body home-body">${wrappedBody}</div>`;

  return renderBase({ title: "Software Architecture", urlPath: "index", content, nav });
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

  return renderBase({ title: label, urlPath, content, nav });
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

  return renderBase({ title: "Tags", urlPath: "tags/index", content, nav });
}

// ─── Table wrapper (for overflow-x scroll on mobile) ─────────────────────────

function wrapTables(html: string): string {
  return html.replace(/<table/g, '<div class="table-wrapper"><table').replace(
    /<\/table>/g,
    "</table></div>"
  );
}

import type { PageData, PageMeta, PageType, TagEntry } from "./types.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toTitleCase(s: string): string {
  return s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function typeBadge(type: PageType): string {
  return `<span class="page-type-badge">${escapeHtml(type)}</span>`;
}

function tagChips(tags: string[], fromPath: string): string {
  if (!tags.length) return "";
  const depth = fromPath.split("/").length - 1;
  const prefix = depth > 0 ? "../".repeat(depth) : "";
  const chips = tags
    .map(
      (t) =>
        `<a class="tag-chip" href="${prefix}tags/${encodeURIComponent(t)}.html">${escapeHtml(t)}</a>`
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
  const section = toTitleCase(parts[0]);
  return `<nav class="breadcrumb">${homeLink} <span class="sep">›</span> ${escapeHtml(section)} <span class="sep">›</span> ${escapeHtml(title)}</nav>`;
}

// ─── Base shell ───────────────────────────────────────────────────────────────

function renderBase(opts: {
  title: string;
  urlPath: string;
  content: string;
  footerNote?: string;
}): string {
  const depth = opts.urlPath.split("/").length - 1;
  const prefix = depth > 0 ? "../".repeat(depth) : "";
  const pageTitle = opts.urlPath === "index"
    ? "Software Architecture"
    : `${opts.title} — Software Architecture`;

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
  <main>
    ${opts.content}
  </main>
  <footer class="site-footer">
    ${opts.footerNote ?? "A personal knowledge base synthesised from key books in the field."}
  </footer>
</body>
</html>`;
}

// ─── Wiki page ────────────────────────────────────────────────────────────────

export function renderPage(page: PageData): string {
  const { meta, bodyHtml, urlPath } = page;

  const header = `
    <div class="page-header">
      <div class="breadcrumb-row">${breadcrumb(urlPath, meta.title)}</div>
      <h1>${escapeHtml(meta.title)}</h1>
      <div class="page-meta">
        ${typeBadge(meta.type)}
        ${meta.updated ? `<span class="page-updated">Updated ${formatDate(meta.updated)}</span>` : ""}
      </div>
      ${tagChips(meta.tags ?? [], urlPath)}
    </div>`;

  const wrappedBody = wrapTables(bodyHtml);

  const content = `${header}<div class="page-body">${wrappedBody}</div>`;

  return renderBase({ title: meta.title, urlPath, content });
}

// ─── Home / index page ────────────────────────────────────────────────────────

export function renderHome(page: PageData): string {
  const wrappedBody = wrapTables(page.bodyHtml);
  const content = `
    <div class="page-header">
      <h1>Software Architecture</h1>
    </div>
    <div class="page-body home-body">${wrappedBody}</div>`;

  return renderBase({ title: "Software Architecture", urlPath: "index", content });
}

// ─── Tag index page ───────────────────────────────────────────────────────────

export function renderTagIndex(tag: string, entries: TagEntry[]): string {
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
  });
}

// ─── Table wrapper (for overflow-x scroll on mobile) ─────────────────────────

function wrapTables(html: string): string {
  return html.replace(/<table/g, '<div class="table-wrapper"><table').replace(
    /<\/table>/g,
    "</table></div>"
  );
}

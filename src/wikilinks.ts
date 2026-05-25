import type { LinkMap } from "./types.js";
import { escapeHtml, toTitleCase } from "./utils.js";

// Matches: [[path/slug]], [[path/slug|Display]], [[path/slug#Anchor|Display]]
const WIKILINK_RE = /\[\[([^\]|#]+?)(?:#([^\]|]+?))?(?:\|([^\]]+?))?\]\]/g;

/**
 * Compute a relative URL from one urlPath to another.
 * Both are slash-separated paths without leading slash or .html extension.
 * e.g. relativeUrl("concepts/coupling", "distributed/caching") → "../distributed/caching.html"
 */
export function relativeUrl(fromUrlPath: string, toUrlPath: string): string {
  const fromParts = fromUrlPath.split("/");
  const toParts = toUrlPath.split("/");

  // Number of directory levels to go up from the fromPath's directory
  const upLevels = fromParts.length - 1;
  const prefix = upLevels > 0 ? "../".repeat(upLevels) : "";

  return `${prefix}${toParts.join("/")}.html`;
}

/**
 * Replace all [[wikilinks]] in a Markdown string with Markdown link syntax.
 * Broken links become <span class="broken-link"> HTML (safe to embed in Markdown).
 */
export function resolveWikilinks(
  markdown: string,
  linkMap: LinkMap,
  currentUrlPath: string
): string {
  return markdown.replace(
    WIKILINK_RE,
    (_match, path: string, anchor: string | undefined, display: string | undefined) => {
      const trimmedPath = path.trim();
      const targetUrlPath = linkMap.get(trimmedPath);

      if (!targetUrlPath) {
        const slug = trimmedPath.split("/").at(-1) ?? trimmedPath;
        const label = display ?? toTitleCase(slug);
        return `<span class="broken-link">${label}</span>`;
      }

      let href = relativeUrl(currentUrlPath, targetUrlPath);
      if (anchor) href += `#${anchor.trim()}`;

      const slug = trimmedPath.split("/").at(-1) ?? trimmedPath;
      const label = display ?? toTitleCase(slug);

      // Use HTML anchor directly so it survives marked's Markdown parsing
      return `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
    }
  );
}

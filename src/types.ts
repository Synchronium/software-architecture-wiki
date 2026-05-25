export type PageType =
  | "source"
  | "concept"
  | "pattern"
  | "style"
  | "author"
  | "comparison"
  | "overview"
  | "reference"
  | "index"
  | "database"
  | "stream";

export interface PageMeta {
  title: string;
  type: PageType;
  tags: string[];
  sources: string[];
  created: string;
  updated: string;
}

export interface PageData {
  meta: PageMeta;
  bodyHtml: string;
  srcPath: string;   // e.g. "wiki/concepts/coupling.md"
  outPath: string;   // e.g. "site/concepts/coupling.html"
  urlPath: string;   // e.g. "concepts/coupling" — used as the wikilink key
}

// wikilink path (e.g. "concepts/coupling") → urlPath
export type LinkMap = Map<string, string>;

export interface NavEntry {
  title: string;
  urlPath: string;
}

export interface NavSection {
  slug: string;
  label: string;
  pages: NavEntry[];
}

export interface TagEntry {
  title: string;
  urlPath: string;
  type: PageType;
  summary: string;
}

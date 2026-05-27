# Architecture Wiki — Schema & Rules

> I am your LLM Wiki agent. Read this file at the start of every session before doing anything else. It governs how I maintain the wiki.

---

## Domain

Software architecture: patterns, principles, trade-offs, quality attributes, and engineering practices. Source material is primarily books by industry experts. The goal is a compounding, interlinked knowledge base — not a filing cabinet.

---

## Directory Layout

```
/
├── CLAUDE.md               ← this file — read first every session
├── index.md                ← catalog of all wiki pages (update on every ingest)
├── log.md                  ← append-only activity log
├── overview.md             ← evolving high-level synthesis of the domain
├── split_epub.py           ← script: splits a pandoc-extracted txt into per-chapter files
├── _incoming/              ← all source material and ingestion state
│   ├── raw/                ← source files (immutable — never modify)
│   │   └── *.epub
│   ├── processing/         ← chapter txt files awaiting ingestion
│   │   └── <slug>/
│   │       ├── 00-preamble.txt
│   │       ├── 01-chapter-title.txt
│   │       └── ...
│   └── processed/          ← chapter txt files that have been ingested
│       └── <slug>/
│           └── (same structure, moved here after ingestion)
└── wiki/
    ├── sources/            ← one page per book or document ingested
    ├── concepts/           ← architecture methodology and practice (coupling, modularity, DDD, fitness functions, API design, etc.)
    ├── distributed/        ← distributed systems fundamentals (consensus, replication, consistency, networking, CAP theorem, etc.)
    ├── operations/         ← production operations (availability, monitoring, observability, chaos engineering, failure causes)
    ├── databases/          ← database internals (storage engines, data models, encoding, indexing)
    ├── streams/            ← batch and stream processing (MapReduce, Kafka, event sourcing, CQRS)
    ├── styles/             ← architecture styles (layered, microservices, etc.) + summary page
    ├── patterns/           ← implementation patterns (circuit-breaker, saga, sidecar, etc.)
    ├── authors/            ← author profile pages
    ├── comparisons/        ← comparison tables, analyses, answers to important queries
    └── reference/          ← reference material (technology glossary, terminology, etc.)
```

**Directory guidance:**
- `concepts/` is for architecture methodology, practice, and design — coupling, modularity, fitness functions, architecture quantum, DDD strategic/tactical design, API design, service granularity, evolutionary architecture. Ask: "is this about how to architect a system or how to think about design?" If yes → `concepts/`.
- `distributed/` is for distributed systems fundamentals that could appear in a distributed systems textbook — consensus algorithms, replication, consistency models, CAP theorem, CRDTs, leader election, logical clocks, partitioning, networking (DNS, HTTP, TLS, CDN), load balancing, caching, rate limiting, idempotency, system models. The test: "would a book specifically about distributed systems cover this?" If yes → `distributed/`.
- `operations/` is for production operations concerns — availability, monitoring, observability, chaos engineering, failure causes, manageability. Ask: "is this about running and maintaining a system in production?" If yes → `operations/`.
- `databases/` is for knowledge that is specific to data storage and retrieval: storage engine internals (B-trees, LSM-trees), data models (relational, document, graph), encoding and serialisation formats, OLTP vs OLAP, column-oriented storage. The test: would this page be out of place in a book that isn't about databases? If yes → `concepts/`; if no → `databases/`.
- `streams/` is for batch and stream processing: MapReduce, distributed dataflow engines, Kafka and log-based messaging, stateful stream processing, event sourcing, CQRS, lambda/kappa architectures, data integration patterns.
- `styles/` is for structural architecture choices that define the overall system shape. Includes a summary/navigation page `styles/architecture-styles.md`.
- `patterns/` is for implementation-level patterns that solve specific problems within an architecture (circuit-breaker, saga, outbox, sidecar/service-mesh).
- `reference/` is for reference material that doesn't fit as a concept or pattern — tool glossaries, terminology indexes, quick-reference tables.

---

## Book Slugs

Slugs are the kebab-case full book title. Use these in frontmatter `sources:` fields and in `[[wikilinks]]`.

| Slug | Book |
|------|------|
| `fundamentals-of-software-architecture` | Fundamentals of Software Architecture — Richards & Ford |
| `designing-data-intensive-applications` | Designing Data-Intensive Applications — Kleppmann |
| `software-architecture-the-hard-parts` | Software Architecture: The Hard Parts — Ford, Richards, Sadalage, Dehghani |
| `building-evolutionary-architectures` | Building Evolutionary Architectures — Ford, Parsons, Kua |
| `mastering-api-architecture` | Mastering API Architecture — Gough, Bryant, Auburn |
| `building-event-driven-microservices` | Building Event-Driven Microservices — Bellemare |
| `software-architecture-patterns` | Software Architecture Patterns — Richards |
| `understanding-distributed-systems` | Understanding Distributed Systems — Vitillo |
| `learning-domain-driven-design` | Learning Domain-Driven Design — Khononov |
| `team-topologies` | Team Topologies — Skelton & Pais |
| `domain-driven-design` | Domain-Driven Design — Eric Evans |
| `monolith-to-microservices` | Monolith to Microservices — Sam Newman |
| `enterprise-integration-patterns` | Enterprise Integration Patterns — Hohpe & Woolf |
| `patterns-of-enterprise-application-architecture` | Patterns of Enterprise Application Architecture — Fowler et al. |
| `release-it` | Release It! Design and Deploy Production-Ready Software — Michael Nygard |
| `foundations-of-scalable-systems` | Foundations of Scalable Systems — Ian Gorton |
| `software-architecture-metrics` | Software Architecture Metrics — Ciceri et al. |
| `a-philosophy-of-software-design` | A Philosophy of Software Design — John Ousterhout |
| `accelerate` | Accelerate: The Science of Lean Software and DevOps — Forsgren, Humble & Kim |

---

## Page Frontmatter

Every wiki page must have YAML frontmatter:

```yaml
---
title: "Page Title"
type: source | concept | database | stream | style | pattern | author | comparison | overview | reference
tags: [tag1, tag2]
sources: [slug1, slug2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

**Date rule:** `updated` must always be today's actual date — never a future date, never a guess. Get it with:

```bash
date +%Y-%m-%d
```

---

## H1 and Title Convention

**The build script derives the page title from the first `# H1` in the markdown body, not from the `title` frontmatter field.** The H1 is stripped from the body before rendering so the template's `<h1>` is never duplicated.

This means:

- Every page **must** have exactly one `# H1` at or near the top of the body.
- The `# H1` text **must exactly match** the `title` frontmatter field (the frontmatter field is retained for cataloguing tools that read it directly, e.g. `index.md` summaries and linting scripts, but the HTML site ignores it).
- **Never use `##` or deeper headings as the first heading** — the H1 is the page title; all subsequent sections should be `##`.

Example — correct:

```markdown
---
title: "API Testing"
...
---

# API Testing

## Why It Matters
...
```

---

## Naming Conventions

- Filenames: `kebab-case.md`
- Cross-references: always use `[[wikilinks]]` — e.g. `[[concepts/coupling]]`, `[[authors/martin-kleppmann]]`
- Source citations inline: `(→ [[sources/designing-data-intensive-applications]])`
- Every page should eventually have at least 2 inbound links from other pages

---

## Handling EPUB Sources

### Splitting into chapters (do this first, once per book)

Books are too large to ingest in one session. Split each EPUB into per-chapter files before ingesting:

```bash
# 1. Extract EPUB to plain text
pandoc "_incoming/raw/Book Title.epub" -t plain -o /tmp/book.txt

# 2. Split into per-chapter files → _incoming/processing/<slug>/
python3 split_epub.py /tmp/book.txt _incoming/processing/<slug>/ --slug <slug>
```

This creates `_incoming/processing/<slug>/00-preamble.txt`, `01-chapter-title.txt`, etc. Check the detected chapter list in the script output — if any chapters are missed or wrongly split, adjust by reading the raw txt and splitting manually.

### After ingesting a chapter

Move the chapter file from `processing/` to `processed/` to track what has been done:

```bash
mv _incoming/processing/<slug>/NN-chapter-title.txt _incoming/processed/<slug>/
```

### Checking what remains

```bash
ls _incoming/processing/<slug>/   # files still to ingest
ls _incoming/processed/<slug>/    # files already ingested
```

---

## Workflows

### Ingest

Books are ingested chapter-by-chapter. Each session ingests one or more chapters from `_incoming/processing/<slug>/`.

When the user asks to ingest a chapter (or set of chapters):

1. **Read** — read the chapter file(s) from `_incoming/processing/<slug>/`; build up a picture of key claims, patterns, concepts, authors cited, and where this source agrees or disagrees with what's already in the wiki
2. **Write source page** — create `wiki/sources/<slug>.md` with: overview, chapter-by-chapter key points, key claims, concepts introduced, notable quotes, links to related pages
3. **Update concept/pattern pages** — for each concept or pattern the source addresses: create the page if it doesn't exist; if it does, add this source's perspective and note agreements or contradictions with other sources
4. **Update author pages** — create or update `wiki/authors/<firstname-lastname>.md`
5. **Update overview.md** — revise the high-level synthesis if this source meaningfully shifts the picture
6. **Update index.md** — add the source page and any new concept/pattern/author pages
7. **Append to log.md** — one structured entry (see Log Format below)
8. **Update README.md** — when the last chapter of a book is ingested, update the `## Sources ingested so far` table in `README.md`: add the book if it's not listed, or remove any "in progress" marker if it was already listed

A single ingest typically touches 10–20 pages. Prefer updating existing pages over creating new ones when a concept is already covered.

**H1 rule for every page you create or update:** The first line of the body must be `# Page Title` and must exactly match the `title` frontmatter field. The build script uses the H1 as the rendered page title and strips it from the body — the template then renders it as `<h1>`. A missing or mismatched H1 means the HTML title will be wrong. Never put more than one `#`-level heading in a file.

**Section index pages are auto-generated.** The build script produces `site/{section}/index.html` for every section (concepts, styles, patterns, etc.) directly from the pages it finds. There are no markdown source files for these — do not create or update them manually. They are always up-to-date after a build.

**Placement rules for new pages created during ingest:**
- Architecture styles (layered, microservices, event-driven, etc.) → `wiki/styles/`
- Implementation patterns (circuit-breaker, saga, sidecar, outbox) → `wiki/patterns/`
- Architecture methodology and practice (coupling, modularity, fitness functions, ADRs, DDD, API design) → `wiki/concepts/`
- Distributed systems fundamentals (consensus, replication, consistency models, CAP theorem, networking, caching) → `wiki/distributed/`
- Production operations (availability, monitoring, observability, chaos, failure analysis) → `wiki/operations/`
- Database internals (storage engines, data models, encoding, OLTP/OLAP) → `wiki/databases/`
- Batch and stream processing (MapReduce, Kafka, event sourcing, CQRS) → `wiki/streams/`
- Tool/technology reference entries → `wiki/reference/technology-glossary.md` (add a section, not a new page)

### Query

When the user asks a question:

1. Read `index.md` to identify relevant pages
2. Read those pages in full
3. Synthesise an answer; cite sources with `[[wikilinks]]` and `(→ [[sources/slug]])` inline
4. If the answer is a substantial comparison, analysis, or new synthesis, offer to file it as `wiki/comparisons/<descriptive-title>.md`

Answers filed as pages compound in value — they become citable by future pages.

### Lint

When the user asks for a health-check:

1. Read all pages (via the index)
2. Check for: contradictions between pages, stale claims superseded by newer sources, orphan pages (no inbound links), important concepts mentioned but lacking their own page, missing cross-references, gaps that could be filled by a web search
3. Report findings; ask which to fix
4. Make approved fixes; append a `lint` entry to log.md

---

## Source Page Template

```markdown
---
title: "Full Book Title"
type: source
tags: [architecture, patterns]   # adjust per content
sources: [slug]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Full Book Title

**Authors:** [[authors/firstname-lastname]], ...
**Published:** YYYY
**Slug:** `slug`

## Overview

2–3 paragraph synthesis: what this book is about, its thesis, its intended audience, and where it sits relative to other sources in the wiki.

## Key Claims

- Claim one (→ ch. N)
- Claim two (→ ch. N)
- ...

## Chapter Notes

### Chapter N — Title

Key points from this chapter. Link concepts: [[concepts/coupling]], [[patterns/microservices]].

> **Contradiction:** This conflicts with [[sources/other-slug]]'s claim that...

> **Open question:** Does this hold when...?

## Notable Quotes

> "Quote here." (ch. N)

## Related Pages

- [[concepts/...]]
- [[patterns/...]]
- [[comparisons/...]]
```

---

## Concept / Pattern Page Template

```markdown
---
title: "Concept Name"
type: concept | pattern
tags: [...]
sources: [slug1, slug2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Concept Name

## Definition

What it is, in 1–3 sentences.

## Why It Matters

The architectural significance.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | ... |
| [[sources/designing-data-intensive-applications]] | ... |

> **Contradiction:** [[sources/X]] says A; [[sources/Y]] says B. Unresolved.

## Related Concepts

- [[concepts/...]] — brief reason for the link
- [[patterns/...]]

## Key Quotes

> "..." (→ [[sources/slug]])
```

---

## Author Page Template

```markdown
---
title: "Author Name"
type: author
tags: [author]
sources: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Author Name

**Books in this wiki:** [[sources/slug1]], [[sources/slug2]]

## Background

Brief professional background.

## Core Positions

The recurring themes and stances across their work.

## Books

### [[sources/slug1]] — *Title* (YYYY)

One-paragraph take on this book's argument and quality.
```

---

## Index Maintenance

`index.md` is the LLM's navigation tool and the user's catalog. Update it on every ingest and whenever pages are added or renamed.

Format per entry: `- [[path/slug]] — One-sentence summary. (informed by: slug1, slug2)`

---

## Log Format

```
## [YYYY-MM-DD] <type> | <title>

Brief description of what was done and what changed.
```

Types: `ingest`, `query`, `lint`, `schema-update`.

Log is append-only — never delete or edit past entries.

---

## Content Quality Rules

- **Synthesise, don't transcribe.** Extract key claims and connections; do not copy paragraphs.
- **Cite every claim** that comes from a specific source: `(→ [[sources/slug]])`.
- **Flag contradictions** between sources as `> **Contradiction:** ...` blockquotes.
- **Flag open questions** as `> **Open question:** ...` blockquotes.
- **Update, don't duplicate.** Always check if a concept page already exists before creating one.
- **Link liberally.** When mentioning a concept or pattern that has or should have a page, link it.
- **overview.md is a living document.** It should reflect the current state of understanding, not accumulate stale claims.
- **British spellings throughout.** Use British English in all wiki prose: behaviour, organisation, serialise, centre, catalogue, defence, favour, colour, neighbour, labour. Exception: do not alter code identifiers, product/tool names, or text inside direct quotation blocks that use American spellings.

---

## Session Start Checklist

At the start of every session:
1. Read this file (`CLAUDE.md`)
2. Read `index.md` to orient to what exists
3. Read the last 10 lines of `log.md` to see recent activity
4. Proceed with the user's request

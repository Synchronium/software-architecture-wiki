# Architecture Wiki

A personal knowledge base on software architecture — patterns, principles, distributed systems, data systems, and engineering trade-offs. Built from careful reading of key books in the field.

## Reading the wiki

The wiki uses [Obsidian](https://obsidian.md)-style `[[wikilinks]]` throughout. To get working links and the full graph view:

1. Install [Obsidian](https://obsidian.md) (free)
2. Open Obsidian → **Open folder as vault** → select this repository root
3. Navigate to [index.md](index.md) to browse all pages, or open the Graph View (Ctrl/Cmd+G) to explore connections visually

Reading the files directly on GitHub will show the raw `[[wikilink]]` syntax — the links won't be clickable. Obsidian is the intended reading environment.

## What's here

| Directory | Contents |
|-----------|----------|
| [wiki/concepts/](wiki/concepts/) | Cross-cutting architecture and distributed systems concepts (CAP theorem, consensus, replication, fitness functions, …) |
| [wiki/styles/](wiki/styles/) | Architecture styles — layered, microservices, event-driven, space-based, and more |
| [wiki/patterns/](wiki/patterns/) | Implementation patterns — circuit breaker, saga, outbox, sidecar, … |
| [wiki/databases/](wiki/databases/) | Storage engines, data models, encoding, transactions |
| [wiki/streams/](wiki/streams/) | Batch processing, stream processing, event sourcing, CQRS |
| [wiki/sources/](wiki/sources/) | One page per book: key claims, chapter notes, notable quotes |
| [wiki/authors/](wiki/authors/) | Author profiles and recurring positions |
| [wiki/comparisons/](wiki/comparisons/) | Side-by-side analyses and decision guides |
| [wiki/reference/](wiki/reference/) | Technology glossary and quick-reference tables |
| [index.md](index.md) | Full catalog of all pages |
| [overview.md](overview.md) | Evolving synthesis of the domain |

## Sources ingested so far

| Book | Authors |
|------|---------|
| *Understanding Distributed Systems* | Roberto Vitillo |
| *Fundamentals of Software Architecture* | Mark Richards & Neal Ford |
| *Mastering API Architecture* | Gough, Bryant, Auburn |
| *Building Evolutionary Architectures* | Ford, Parsons, Kua |
| *Designing Data-Intensive Applications* | Martin Kleppmann |
| *Software Architecture Patterns* | Mark Richards |
| *Software Architecture: The Hard Parts* | Ford, Richards, Sadalage, Dehghani |
| *Building Event-Driven Microservices* | Adam Bellemare |
| *Learning Domain-Driven Design* | Vlad Khononov |
| *Team Topologies* | Matthew Skelton & Manuel Pais |
| *Domain-Driven Design* | Eric Evans |
| *Monolith to Microservices* | Sam Newman |
| *Enterprise Integration Patterns* | Gregor Hohpe & Bobby Woolf |
| *Patterns of Enterprise Application Architecture* | Martin Fowler et al. |
| *Release It! Design and Deploy Production-Ready Software* | Michael Nygard |
| *Foundations of Scalable Systems* | Ian Gorton |
| *Software Architecture Metrics* | Ciceri, Farley, Rosa, Weiss, Woods, Harmel-Law, Lilienthal, Ford, von Zitzewitz, Keeling |
| *A Philosophy of Software Design* | John Ousterhout |
| *Accelerate: The Science of Lean Software and DevOps* | Nicole Forsgren, Jez Humble & Gene Kim |

## How this wiki was built

The pages here weren't written by hand — they were generated through a structured ingestion process driven by Claude.

**The process, roughly:**

1. **Extract** — each book (EPUB) is converted to plain text using [pandoc](https://pandoc.org), then split into per-chapter files by a small Python script (`split_epub.py`).

2. **Ingest** — chapters are fed to Claude Code one batch at a time. For each chapter, Claude reads the source text and then:
   - Updates or creates a source page (`wiki/sources/`) summarising the book's key claims and chapter notes
   - Updates or creates concept, pattern, and style pages with the new source's perspective — noting agreements and contradictions with existing pages
   - Updates author profile pages
   - Revises `overview.md` if the chapter shifts the overall synthesis
   - Updates `index.md` and appends a structured entry to `log.md`

3. **Accumulate** — because every ingest pass updates existing pages rather than creating isolated summaries, knowledge compounds: a concept page like `concepts/replication.md` reflects how four different books treat the same idea, with contradictions flagged inline.

**Content quality rules baked into the process** (from [CLAUDE.md](CLAUDE.md)):

- **Synthesise, don't transcribe.** Claude extracts key claims and connections; it does not copy paragraphs. Every assertion is tied back to its source with an inline citation.
- **Update, don't duplicate.** Before creating a new page, Claude checks whether the concept already exists and adds the new perspective to it. This keeps related knowledge in one place rather than scattered.
- **Flag contradictions explicitly.** When two sources disagree, the conflict is surfaced as a `> **Contradiction:**` blockquote on the relevant page — not silently resolved in favour of whichever source was ingested last.
- **Flag open questions.** Unresolved tensions or areas where the source raises a question without answering it are marked as `> **Open question:**` blockquotes.
- **Link liberally.** Any time a concept is mentioned that has (or should have) its own page, it's linked — building the graph that makes Obsidian's graph view useful.
- **overview.md is a living document.** It's updated whenever a new source meaningfully shifts the overall picture, so it reflects current understanding rather than accumulating stale claims.

The full schema — page templates, frontmatter conventions, placement rules, and workflow steps — lives in [CLAUDE.md](CLAUDE.md). The ingestion workflow is not intended for general use — the wiki is the output.

### That said...

If you DO want to add to this, do the following:

1. Install `pandoc` to read the original source material: `brew install pandoc`
2. Plonk your legally-obtained ebook file (works with `.epub`s, haven't tried others) in `./_incoming/raw` - NB: `./_incoming` is gitignored, so as not to publish copywrited material on github.
3. Run `/ingest` in your Claude UI or CLI window.
4. Check the changes make sense, commit them to a branch, and raise a PR

Occasionally, Claude may need to rethink its page structure/hierarchy and "lint" existing pages to clean them up, maintain cross-linking, etc. Just ask Claude!


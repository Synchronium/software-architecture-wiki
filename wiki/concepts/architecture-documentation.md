---
title: "Architecture Documentation"
type: concept
tags: [documentation, c4, uml, archimate, diagrams, communication]
sources: [fundamentals-of-software-architecture, building-evolutionary-architectures, learning-domain-driven-design, mastering-api-architecture]
created: 2026-05-28
updated: 2026-05-28
---

# Architecture Documentation

## Definition

Architecture documentation is the set of artefacts — written, diagrammatic, and presentational — that capture an architecture's *intent*, *structure*, and *decisions* in a form that can be understood by readers who weren't in the room when the architecture was decided. The defining purpose: enabling future engineers (including the architects' future selves) to maintain, evolve, and govern the system without having to re-derive context from the code.

Documentation differs from comments and code: comments explain local choices to readers of the code; documentation explains system-level structure to readers of the architecture.

## Why It Matters

Architecture lives in three places: the code, the architects' heads, and the documentation. The first is authoritative but illegible at scale; the second is fast but mortal; the third is the only one that survives team turnover and scales to multiple readers. From [[sources/fundamentals-of-software-architecture]]: ADRs serve as documentation that captures "intent, not just structure" — the *why* that cannot be reconstructed from reading the code (→ [[concepts/adrs]]).

Documentation has known failure modes: it's expensive to write, it goes stale quickly, and engineers under-invest in it because the readers are future people who don't yet have a voice in priority discussions. Most architecture documentation traditions are pragmatic compromises against these failure modes — making documentation *just sufficient*, *lightweight*, and *automatable* where possible.

## What to Document

Documentation purposes differ; one set of artefacts cannot serve all of them.

| Purpose | Audience | Artefact type | Update frequency |
|--------|---------|---------------|---|
| Decision capture | Future architects, governance | [[concepts/adrs]] | Per-decision (append-only) |
| Structural overview | New engineers, stakeholders | C4 diagrams | Major structural change |
| Runtime behaviour | On-call, debugging | Sequence diagrams, runbooks | Per significant feature |
| API contracts | Consumers, internal/external | OpenAPI, Pact, schema docs | Per API change |
| Strategic context | Leadership, cross-team | Domain vision, context maps | Major business shift |
| Stakeholder communication | Non-engineers | Presentations, infodecks | Per meeting / initiative |

Treating these as the same artefact (the dreaded "architecture document") is the most common documentation failure. Each has different update cadence, audience, and lifespan.

## Notational Conventions

### C4 Model

Simon Brown's C4 model (Context, Container, Component, Class) is the most widely adopted lightweight architecture notation. From [[sources/fundamentals-of-software-architecture]] ch. 19: "C4 (Context/Container/Component/Class; Simon Brown; better suited to monolithic than distributed architectures)."

The four hierarchical levels:
- **System Context** — the system in its environment (users, external systems)
- **Container** — applications, data stores, microservices within the system
- **Component** — major logical groupings within a container
- **Class** — implementation-level (rarely drawn; usually skipped in favour of code)

C4's value is its progressive zoom — each diagram answers questions at its level without trying to be comprehensive. Notation is deliberately informal: boxes and arrows with labels. Notable limitation flagged by [[sources/fundamentals-of-software-architecture]]: better suited to monolithic than distributed architectures, because container relationships in heavily-distributed systems become cluttered.

### UML

The Unified Modeling Language remains useful for specific diagram types but has fallen into general disuse. From [[sources/fundamentals-of-software-architecture]]: "Class and sequence diagrams still useful; most other types fell into disuse." Sequence diagrams in particular remain valuable for documenting runtime interactions; class diagrams for non-trivial inheritance hierarchies.

UML's failure mode is its complexity: the full standard is too large to learn casually, and most teams use a small idiosyncratic subset. The C4 model is in part a response to UML over-engineering.

### ArchiMate

The Open Group's enterprise modelling language. From [[sources/fundamentals-of-software-architecture]]: "Open-source enterprise modelling language; Open Group standard; deliberately 'as small as possible'." Most useful at the enterprise architecture layer rather than for single-system documentation. Tooling is heavier (Archi, BizzDesign); adoption is concentrated in large enterprises with formal EA functions.

### Informal box-and-line diagrams

What most teams actually use. The lack of standard notation is a feature for casual diagrams (low cost to produce, no learning curve) and a bug for diagrams that need to survive (no shared interpretation). Mitigate by adding a brief legend; reserve formal notation for diagrams that will be referenced over months.

### Diagrams-as-code

Mermaid, PlantUML, Structurizr DSL — tools that generate diagrams from text. Trade-off: lower diagram fidelity, but diagrams version-control with the code, render automatically in PR reviews, and avoid the "diagram drifts from the system" failure mode. Increasingly the default for technical-audience documentation.

## ADRs (the documentation that stays current)

Architecture Decision Records are the single documentation practice that consistently survives in living codebases. See [[concepts/adrs]] for the full pattern. Why ADRs work where other documentation fails:

- **Append-only.** Decisions are recorded once, superseded but not edited. No staleness because no updates.
- **Local context.** Each ADR captures the situation that led to the decision; the context is preserved with the choice.
- **Lightweight.** A typical ADR is ~1 page: context, decision, consequences.
- **Per-decision granularity.** Unlike "the architecture document," ADRs are bounded — one decision per ADR.
- **Searchable history.** Reading the ADRs in order tells the story of how the architecture got to where it is.

From [[sources/fundamentals-of-software-architecture]]: "The Context section describes the architecture; the Decision section documents the reasoning; the Consequences section covers trade-offs. Together they form architecture documentation that captures the intent, not just the structure."

## Documentation Practices

### Documentation as code

Store documentation in the repository, treat it like code: PR review, linting, automatic publication, version with the system. From [[sources/building-evolutionary-architectures]]: the fitness-function approach extends to documentation — automated checks ensure ADRs are present for major changes, diagrams are renderable, links don't rot.

### Just sufficient

The "least worst documentation" principle: document what readers genuinely need; don't document what the code already shows. Code is the authoritative source for *what the system does*; documentation should focus on *why* and *how to navigate*. From [[sources/learning-domain-driven-design]] on bounded contexts and context maps: high-level strategic documentation is far more durable and useful than low-level structural documentation that the IDE can derive from code.

### Tracking decision context

The most important documentation property is captured context: which forces were in play, which alternatives were considered, what would invalidate the decision. ADRs nail this; running prose tends not to.

### Stakeholder-appropriate

From [[sources/fundamentals-of-software-architecture]] ch. 22 on presentations: "Presenters have verbal and visual channels. Bullet-Riddled Corpse anti-pattern overloads one channel." Documentation for a presentation differs from documentation for archival reading; **infodecks** (slide decks emailed as standalone documents) need comprehensive content, while **presentations** deliberately need only half — the other half is the speaker.

### Diagrams that survive

The diagrams that survive over multiple years tend to share properties: they are at the *context* or *container* level (not the component or class level, which churn); they include a legend; they are checked into the repository; they have an owner whose name is on them. Most low-level diagrams are write-once, read-once.

## Anti-patterns

**The Big Up-Front Architecture Document.** A 50-page document produced before development starts. By month three of development, the document is out of date; by month six, no one references it. Replace with progressive ADRs.

**Comprehensive UML coverage.** Diagrams for every interaction, every class, every state. The maintenance cost grows with the system; staleness sets in within months. Diagram only what readers need to navigate.

**Documentation as bureaucratic compliance.** Architecture documents produced because process requires them, read by no one. The forcing function (audit, gate review) does not produce useful documentation; it produces documents.

**Bullet-Riddled Corpse.** [[sources/fundamentals-of-software-architecture]] ch. 22: slides covered in text that the speaker reads aloud. Overloads both verbal and visual channels. Use incremental builds; reveal information progressively.

**Cookie-Cutter padding.** Don't pad slides to fill space — ideas don't have a fixed word count. Padding obscures the signal.

**Drift between code and diagrams.** A diagram that contradicts the code is worse than no diagram — it actively misleads. Either keep the diagram automated (diagrams-as-code from system state) or accept the staleness and add a "last validated on" note.

**Single-format documentation.** Treating "architecture documentation" as one artefact rather than a portfolio. Different audiences need different artefacts; one document satisfying all of them satisfies none.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Canonical treatment. C4, UML, ArchiMate notations; ADRs as the durable documentation form; presentation craft (two-channel model, infodecks vs presentations, Invisibility pattern); explicit anti-patterns. |
| [[sources/building-evolutionary-architectures]] | Documentation as code; fitness functions for documentation freshness; ADRs as evolutionary architecture's audit trail. |
| [[sources/learning-domain-driven-design]] | High-level strategic documentation (context maps, domain vision) as the most durable form; ubiquitous language as documentation that lives in the code itself. |
| [[sources/mastering-api-architecture]] | OpenAPI specifications as a documentation form that doubles as machine-readable contract; documentation that drives tooling (mock servers, client generators, gateway config). |

## Related Concepts

- [[concepts/adrs]] — the most durable documentation practice
- [[concepts/architect-soft-skills]] — presentation craft, stakeholder communication
- [[concepts/evolutionary-architecture]] — documentation as living artefact
- [[concepts/ubiquitous-language]] — DDD's "documentation in the code itself"
- [[concepts/large-scale-structure]] — Evans on system metaphor and the documentation of pattern
- [[patterns/context-map]] — DDD's most durable strategic documentation artefact
- [[concepts/fitness-functions]] — automated documentation checks

## Key Quotes

> "ADRs form architecture documentation that captures the intent, not just the structure." — [[sources/fundamentals-of-software-architecture]] ch. 19

> "Bullet-Riddled Corpse anti-pattern overloads one channel." — [[sources/fundamentals-of-software-architecture]] ch. 22

> "Infodecks need comprehensive content; presentations deliberately need only half — the other half is the speaker." — [[sources/fundamentals-of-software-architecture]] ch. 22

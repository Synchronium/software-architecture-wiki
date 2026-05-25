---
title: "Learning Domain-Driven Design"
type: source
tags: [architecture, ddd, domain-driven-design, bounded-contexts, strategic-design, tactical-design, microservices, event-driven]
sources: [learning-domain-driven-design]
created: 2026-05-14
updated: 2026-05-14
---

# Learning Domain-Driven Design

**Author:** [[authors/vlad-khononov]]
**Published:** 2022 (O'Reilly, first edition October 2021)
**Slug:** `learning-domain-driven-design`

## Overview

*Learning Domain-Driven Design* is the clearest available introduction to DDD as a complete methodology — from business analysis through tactical implementation. Khononov's thesis is that software project failure (roughly 70% fail rate by scope/budget/time) is primarily a communication problem, and DDD is the systematic solution. The book is structured in four parts: strategic design (Chs 1–4), tactical design (Chs 5–7), DDD in practice (Chs 8–13), and DDD's relationship to other patterns and styles (Chs 14–16).

The book sits between Evans's original "Blue Book" (rigorous but demanding) and domain-ignorant architecture texts. Khononov distils 10 years of teaching DDD into a progression that makes strategic and tactical patterns legible without sacrificing depth. The running example throughout is WolfDesk, a fictional help desk SaaS company.

This is the most thorough DDD source in the wiki. It grounds abstract concepts like bounded context and ubiquitous language in concrete decision frameworks, and bridges DDD to microservices, event-driven architecture, and data mesh in later chapters.

## Key Claims

- Software project failure is fundamentally a communication problem; DDD attacks the root cause (→ Introduction)
- Subdomain type (core/generic/supporting) is the primary driver of implementation strategy decisions (→ ch. 1)
- Bounded contexts are logical boundaries that encapsulate a ubiquitous language; they need not map 1:1 with subdomains (→ ch. 3)
- The ubiquitous language is not a glossary but a living model — the same term in two bounded contexts has different meanings, and that's correct (→ ch. 2)
- Tactical design choice (transaction script, active record, domain model, event-sourced domain model) must be driven by business logic complexity (→ chs. 5–7)
- Every architectural pattern (layered, ports-and-adapters, CQRS, event sourcing) exists to serve the domain model — not the reverse (→ ch. 8)

## Chapter Notes

### Preamble / Introduction

DDD is divided into *strategic* design (what and why: business domain analysis, component boundaries, integration patterns) and *tactical* design (how: code-level patterns for implementing business logic). The book uses WolfDesk — a help desk ticket SaaS with ticket lifecycle management, autopilot, and fraud detection — as its running example.

The framing: 70% of software projects fail, mostly due to communication failures (unclear requirements, misaligned goals). DDD addresses communication directly, at both the team/domain boundary level (strategic) and at the code level (tactical).

### Chapter 1 — Analysing Business Domains

**Business domain**: a company's main area of activity — the service it provides to clients. Companies can operate in multiple domains (Amazon: retail + cloud). Domains change over time (Nokia: rubber → telecom → mobile).

**Subdomains**: fine-grained areas of business activity. Three types:

| Type | Competitive advantage | Complexity | Volatility | Implementation | Problem type |
|------|-----------------------|------------|------------|----------------|--------------|
| Core | Yes | High | High | In-house (best engineers) | Interesting |
| Generic | No | High | Low | Buy/adopt off-the-shelf | Solved |
| Supporting | No | Low | Low | In-house or outsource | Obvious |

*Core subdomains* are what a company does *differently* from competitors. Must be hard to copy. Require the most advanced engineering. Always change — if competitors catch up, the core subdomain must evolve.

*Generic subdomains* are complex but solved: encryption, auth, accounting, billing. Use existing solutions — implementing from scratch wastes effort and usually produces an inferior result.

*Supporting subdomains* are simple CRUD/ETL logic that supports the core. No competitive advantage; can be outsourced. Low entry barriers.

**Identifying subdomain boundaries**: start with departments (coarse-grained), then drill down. Use "coherent use cases" as the stopping criterion — a subdomain is a set of interrelated use cases operating on the same actors and data. For core subdomains, distil as far as possible; for generic/supporting, stop when further distillation reveals no new strategic insight.

**Domain experts**: subject matter experts who represent the business — neither analysts nor engineers. Knowledge originates with them. Scope varies from full-domain to single-subdomain experts.

> **Key heuristic**: "Would someone pay for this subdomain on its own?" → core. "Is it simpler to hack a quick implementation than integrate an external one?" → supporting (not generic).

### Chapter 2 — Discovering Domain Knowledge

**Ubiquitous language** is the cornerstone practice of DDD. Traditional development creates a chain of translations: domain knowledge → analysis model → requirements → design → code. Each step loses information. DDD replaces this telephone game with a single shared language used by all stakeholders in all communications, including source code.

Properties: business language only (no technical jargon), precise and consistent (one meaning per term; no synonyms), and continuously evolved. Tools: wiki glossaries (nouns), Gherkin BDD tests (behaviour), static analysis (NDepend for code enforcement). Tools support but don't replace actual usage.

Ubiquitous language is effectively model building — a model captures just enough detail to solve the specific problem. Not a copy of reality but a purposeful abstraction. The model should reflect domain experts' mental models.

Cultivation is often co-creative: asking questions uncovers white spots in domain experts' own understanding. Especially true for core subdomains.

See [[concepts/ubiquitous-language]] for the full treatment.

### Chapter 3 — Managing Domain Complexity

**The bounded context pattern** solves the problem of inconsistent models: different domain experts use the same term for different concepts (e.g., "lead" = contact event in marketing; "lead" = full lifecycle in sales). The answer is not a single enterprise model (overengineered everywhere, useful nowhere) but dividing the ubiquitous language into multiple bounded contexts, each internally consistent.

**Subdomains vs. bounded contexts**: subdomains are *discovered* (defined by business strategy); bounded contexts are *designed* (strategic engineering decisions). Not necessarily 1:1 — one bounded context can span multiple subdomains, or one subdomain can be split across multiple bounded contexts. Size: not a rule, depends on problem domain. Too large → hard to keep consistent. Too small → integration overhead.

**Physical boundaries**: each bounded context is an independent service/project with its own stack. **Ownership boundaries**: one team per bounded context (no two teams on the same context; one team can own multiple).

Real-world analogy: the tomato is a fruit in botany, a vegetable in culinary arts, a vegetable in US tax law, and a feedback mechanism in theatre. Same entity, different models in different contexts — each is correct within its bounded context.

See [[concepts/bounded-contexts]] for the full treatment.

### Chapter 4 — Integrating Bounded Contexts

Bounded contexts must integrate. Integration contracts are driven by team collaboration type, not technical preference. Six patterns, grouped by collaboration:

**Cooperation** (well-established communication): *Partnership* (ad hoc two-way coordination; both teams adapt) and *Shared Kernel* (limited overlapping model shared by multiple contexts; costly to coordinate; justified when duplication > coordination cost).

**Customer–Supplier** (upstream has power): *Conformist* (downstream accepts upstream's model as-is), *Anticorruption Layer* (downstream translates upstream's model to protect its own; critical for core subdomain downstream), *Open-Host Service* (upstream decouples public interface from internal model using a "published language"; upstream does the translation for all consumers).

**Separate Ways** (no collaboration): justified for generic subdomains that are cheap to duplicate locally. Never for core subdomains.

**Context map**: visual diagram of bounded contexts and their integration patterns. Reveals high-level design, communication patterns, and organisational issues. Should be maintained as code (Context Mapper tool).

See [[patterns/context-map]] for full treatment.

### Chapter 6 — Tackling Complex Business Logic

**Domain model** pattern for complex business logic (core subdomains). Building blocks from DDD tactical design:

- **Value object**: identified by values; immutable; encapsulates validation + business logic; prevents primitive obsession; use whenever possible
- **Entity**: requires explicit ID; mutable; only used within aggregates (not independently)
- **Aggregate**: consistency enforcement boundary — only aggregate's own business logic may modify its state; one aggregate instance per transaction (the cardinal rule); version field for OCC; commands as public interface; aggregate root as single entry point; references to other aggregates by ID only; keep as small as possible
- **Domain events**: past-tense messages describing what happened; published by aggregate after commits; named precisely per ubiquitous language
- **Domain services**: stateless objects for logic that spans multiple aggregates; for reading/calculating, not for modifying multiple aggregates in one transaction

Application layer is thin: load → execute → persist → publish events. The aggregate does all the work.

See [[patterns/domain-model]] for full treatment.

### Chapter 7 — Modeling the Dimension of Time

**Event-sourced domain model** — same building blocks as the domain model but persists domain events instead of state. Four-step cycle: load events → rehydrate → execute command → append new events. Event store is append-only; uses expectedVersion for OCC.

Advantages: time travel (reconstruct any past state), deep insight (multiple projections), strongly consistent audit log, advanced OCC.
Disadvantages: learning curve, schema evolution complexity, architectural complexity (needs CQRS).
Special: snapshot pattern (for 10K+ events per aggregate), forgettable payload pattern (GDPR compliance in append-only stores).

See [[streams/event-sourcing-cqrs]] for full treatment, including DDIA's complementary mechanistic perspective.

### Chapter 5 — Implementing Simple Business Logic

Introduces the simple end of the business logic implementation spectrum:

**Transaction script**: each operation is a simple procedure; must be transactional (all-or-nothing). Three failure modes: lack of DB transaction, distributed transaction (DB + message bus), implicit distributed transaction (void method communicates success/failure). Solutions: idempotency, optimistic concurrency, [[patterns/outbox-pattern]]. Use for supporting subdomains; never for core.

**Active record**: transaction script that delegates DB access to data-aware objects (objects with CRUD methods). For simple logic with complex data structures. Also called "anemic domain model" — Khononov rejects the pejorative framing; it's valid for simple business logic.

See [[patterns/business-logic-patterns]] for full treatment.

## Notable Quotes

> "To design and build an effective solution, you have to understand the problem." (ch. 1)

> "A core subdomain that is simple to implement can only provide a short-lived competitive advantage. Therefore, core subdomains are naturally complex." (ch. 1)

### Chapter 8 — Architectural Patterns

Three patterns for organising a bounded context's internals, matched to business logic pattern:

**Layered architecture**: presentation layer → business logic layer → data access layer. Top-down dependencies. Natural fit for transaction script and active record. Distinction: *layer* = logical code organisation; *tier* = physical deployment unit. A "three-layer" bounded context can be deployed as a single tier.

**Ports and adapters** (hexagonal/onion/clean): business logic at centre; dependency inversion pushes all infrastructure dependencies to the outer ring. Ports are interfaces defined in the business logic layer; adapters are infrastructure implementations of those ports. Perfect fit for domain model and event-sourced domain model — keeps business logic completely infrastructure-agnostic and testable in isolation. See [[styles/ports-and-adapters]].

**CQRS**: command execution model (strongly consistent aggregate) + read models (projections from domain events). Two projection types: synchronous (catch-up subscription with checkpoint column; strongly consistent) and asynchronous (message bus subscription; eventually consistent). Commands may return data from the strongly consistent model — the strict separation applies to models, not method signatures.

**Architectural slices**: patterns apply per module within a bounded context, not across the entire context. A single bounded context may mix layered, ports-and-adapters, and CQRS across its modules based on each module's business logic complexity.

### Chapter 9 — Communication Patterns

**Model translation**: how bounded context integration patterns (ACL, OHS) are implemented in code.
- *Stateless*: proxy translates each request/event independently. Sync: API gateway or facade. Async: message proxy converting upstream events to downstream schema; distinguishes private events (internal) from public events (published language).
- *Stateful*: aggregation required. Stream processing joins multiple upstream event streams. Backend-for-Frontend (BFF) aggregates data from multiple bounded contexts for a specific consumer.

**Outbox pattern**: two wrong approaches (publish before commit; publish after commit but before crash) → correct approach (state + domain events committed atomically; relay publishes asynchronously). At-least-once delivery; consumers must be idempotent. Pull relay (polling) or push relay (CDC/log tailing). NoSQL: embed outbox array in aggregate document. See [[patterns/outbox-pattern]].

**Saga**: event-driven coordinator for long-running multi-aggregate processes. Listens to domain events; issues commands. Stateless (simple matching) or stateful (event-sourced aggregate). Does not handle compensation — that is a business concern. Warning: don't use sagas to paper over wrong aggregate boundaries.

**Process manager**: a saga with conditional branching. Explicitly instantiated by a command (not triggered by a domain event). Always maintains state. Implemented as an aggregate (state-based or event-sourced). Example: trip booking (flights + hotel + car, different failure paths). See [[patterns/saga]].

### Chapter 10 — Design Heuristics

Bridges strategic and tactical design into a unified decision framework. Key insight: "it depends" is correct but insufficient — specify *what* it depends on.

**Bounded context size heuristic**: treat size as a function of the model, not the other way around. Optimising for small bounded contexts is a mistake. For core subdomains (volatile, uncertain), start wide and decompose as domain knowledge stabilises.

**Business logic pattern decision tree**: (1) event sourcing if money/audit/deep analysis required; (2) domain model if complex logic; (3) active record if complex data structures; (4) transaction script otherwise. Use ubiquitous language complexity as a proxy for business logic complexity (CRUD → simple; processes/invariants → complex).

**Architectural pattern decision tree**: event-sourced → requires CQRS; domain model → requires ports & adapters; active record → layered + service layer; transaction script → minimal layered. Exception: CQRS is also valid when multiple persistent read models are needed regardless of business logic pattern.

**Testing strategy**: domain model/event-sourced → testing pyramid (unit-heavy); active record → testing diamond (integration-heavy); transaction script → reversed testing pyramid (E2E-heavy).

See [[patterns/business-logic-patterns]] for the complete decision trees.

### Chapter 11 — Evolving Design Decisions

Four vectors of change: business domain evolution, organisational structure changes, domain knowledge discovery, and growth.

**Subdomain type evolution**: all six transitions are possible (core↔generic, core↔supporting, generic↔supporting). Changes are driven by competitive dynamics, off-the-shelf availability, business strategy, and complexity growth. Strategic design consequences: integration patterns and implementation strategies must evolve with the subdomain type.

**Pain as signal**: when the existing technical design struggles to support business needs, this is the primary indicator that subdomain type has changed. A supporting subdomain that accumulates complex rules is becoming core. Use this pain as a trigger to reassess.

**Tactical migration paths** (see [[patterns/business-logic-patterns]]): transaction script → active record (encapsulate complex data structures); active record → domain model (make setters private, let compilation errors reveal external state mutation, identify aggregate boundaries); domain model → event-sourced domain model (two migration strategies: generating past transitions or modeling migration events as `migrated-from-legacy`).

**Organisational changes**: team communication shifts affect integration patterns (partnership → customer-supplier when geographic distance grows; customer-supplier → separate ways when collaboration breaks down). Integration patterns must be actively maintained, not assumed stable.

**Growth management**: revisit subdomain, bounded context, and aggregate boundaries regularly. Eliminate accidental complexity (outdated design decisions). Manage essential complexity (inherent business domain complexity) using DDD tools. "Chatty" bounded contexts signal boundaries that need redesign for greater autonomy.

### Chapter 12 — EventStorming

A low-tech collaborative workshop for modeling business processes. Invented by Alberto Brandolini.

**Participants**: engineers, domain experts, product owners, testers, UX, support — diverse backgrounds increase knowledge discovery. Max 10 in-person; max 5 remote.

**10-step process**:
1. Unstructured exploration (orange = domain events, past tense)
2. Timelines (happy path first, then alternatives)
3. Pain points (diamond pink = bottlenecks, gaps, missing knowledge)
4. Pivotal events (vertical bars = context changes → potential bounded context boundaries)
5. Commands (light blue = what triggers events; small yellow = actor)
6. Policies (purple = automation: event → command)
7. Read models (green = data the actor uses to decide to issue a command)
8. External systems (pink = systems outside the domain)
9. Aggregates (large yellow = groups commands + events; reveals consistency boundaries)
10. Bounded contexts (groups of related aggregates → BC candidates)

**Real value**: the process itself — knowledge sharing, alignment, UL formulation. Physical model is secondary.

**Two-phase facilitation**: big picture (steps 1–4) for the whole domain first; then dedicated sessions (all 10 steps) for each process.

See [[concepts/eventstorming]] for the full treatment.

### Chapter 13 — Domain-Driven Design in the Real World

DDD is not greenfield-only — brownfield projects benefit most. DDD is not all-or-nothing.

**Strategic analysis for brownfield**: (1) understand the business domain (who are the customers, what is the competitive advantage, what is the value proposition?); (2) explore current design (identify high-level components, evaluate their tactical and strategic design decisions, chart the current context map).

**Modernization strategy — think big, start small**: align logical boundaries (namespaces, modules) with subdomains first. Only extract physical bounded contexts (separate services) when it's clearly justified.

**Strangler pattern (DDD version)**: a new bounded context implements new requirements and progressively absorbs legacy functionality; a facade routes traffic. Shared database temporarily permitted during migration (exception to the one-DB-per-BC rule). Legacy context is retired when all functionality is migrated.

**Incremental tactical refactoring**: never skip steps — don't jump straight from active record to event-sourced domain model. Introduce value objects first; then find aggregate boundaries; then extract domain model; finally consider event sourcing. Domain model → event-sourced domain model migration strategies covered in Ch 11.

**Pragmatic DDD**: DDD is about letting the business domain drive design decisions, not about mandatory use of any specific pattern. "Undercover DDD" — use tools individually without requiring org-wide buy-in: use ubiquitous language (trivial, borderline common sense); use bounded context principles (reason from first principles, not authority); justify tactical patterns by logic, not DDD dogma.

### Chapter 14 — Microservices

**Microservice = micro-public interface, not micro-codebase**. A service's public interface is its front door. A microservice has a micro front door — a small, focused set of capabilities. Encapsulating the database is required: exposing the DB as part of the public interface makes the interface arbitrarily large.

**Deep modules** (Ousterhout): effective modules are deep — simple public interface over complex internal logic. Shallow modules (interface ≈ logic) add accidental complexity. Method-per-service decomposition creates shallow modules that require expanding their integration interfaces.

**Two boundary extremes**: wider than bounded context = big ball of mud; narrower than microservice threshold = distributed big ball of mud. The safe design space is between bounded context (widest valid boundary) and microservice (narrowest valid boundary).

**Relationship**: all microservices are bounded contexts; not all bounded contexts are microservices. A wide bounded context (multiple subdomains, one team, consistent model) is a valid design, especially early in a core subdomain's lifecycle.

**Granularity heuristic**: align services with subdomains. Subdomains are naturally deep (function = "what"; logic = coherent use cases; strong functional relationships between use cases). Aggregates as services work only when coupling to other aggregates in the subdomain is minimal.

**DDD tools for deeper microservices**: Open-Host Service (published language compresses integration interface, decouples implementation from public API); ACL as standalone service (offloads integration complexity from consuming bounded context).

### Chapter 15 — Event-Driven Architecture

**EDA ≠ event sourcing**: EDA = asynchronous communication between bounded contexts; event sourcing = state management technique inside a bounded context. Events designed for event sourcing (internal state transitions) are not designed for external integration.

**Three event types**:
- **Event notification**: short message; consumer must query producer for details. Advantages: security (explicit auth for detailed data), concurrency (consumer gets latest state on query).
- **Event-carried state transfer (ECST)**: complete/partial entity snapshot; consumers maintain local cache; asynchronous data replication; fault-tolerant (consumer works without producer availability).
- **Domain event**: models what happened in the business domain; includes all data describing the event; not an entity snapshot; not intended for external consumers (use dedicated public events for that).

**Distributed Big Ball of Mud anti-pattern**: exposing internal domain events to external consumers creates: implementation coupling (schema changes break all consumers); functional coupling (consumers duplicate projection logic); temporal coupling (ordering dependencies, hardcoded delays). Fix: encapsulate projection in producer (OHS + published language + ECST).

**Design heuristics**: "assume the worst" (outbox, idempotency, sagas); design explicit private events (internal use) vs public events (OHS published language); choose event type by consistency requirement: eventually consistent → ECST; need last write → notification + subsequent query.

### Chapter 16 — Data Mesh

**OLTP vs OLAP**: operational models are entity-centric, real-time transaction-optimised; analytical models use fact tables (business activities, append-only, similar to domain events) and dimension tables (context for facts). Star schema (one dimension level); snowflake schema (multi-level normalised dimensions). Analytical queries are unpredictable → high normalisation needed.

**Data warehouse**: ETL-based centralised model; strong coupling to operational DB implementation details; cross-team friction; ETL complexity grows to unmanageable scale.

**Data lake**: store raw operational data; transform later; schema-less → data swamp at scale; no data quality guarantees.

**Data mesh — four principles**: (1) Decompose around domains (align analytical model ownership with bounded contexts; same team owns OLTP + OLAP); (2) Data as a product (output ports, SLA, versioning, polyglot formats); (3) Enable autonomy (platform team provides interoperability infrastructure); (4) Build an ecosystem (federated governance body).

**DDD + Data Mesh alignment**: ubiquitous language drives analytical model design; OHS = analytical model is a published language for analytical consumers; CQRS generates analytical projections alongside operational model (multiple simultaneous schema versions); bounded context integration patterns (partnership, ACL, conformist, separate ways) apply to analytical models between product teams.

## Related Pages

- [[concepts/bounded-contexts]] — LDDD's most thorough source for strategic DDD concepts; subdomain taxonomy, sizing heuristic, type evolution, growth management
- [[concepts/ubiquitous-language]] — cornerstone DDD practice; LDDD is the primary source
- [[patterns/context-map]] — integration patterns + model translation (stateless/stateful)
- [[patterns/business-logic-patterns]] — full tactical decision tree (pattern → architecture → testing) + migration paths
- [[patterns/domain-model]] — DDD aggregate, value object, entity, domain event, domain service
- [[styles/ports-and-adapters]] — architectural complement to the domain model
- [[streams/event-sourcing-cqrs]] — event-sourced domain model (four-step cycle) + CQRS projections
- [[patterns/saga]] — saga vs process manager distinction; stateless/stateful saga implementations
- [[patterns/outbox-pattern]] — two wrong approaches + correct approach + NoSQL embedding
- [[concepts/eventstorming]] — 10-step workshop for knowledge discovery and model building
- [[styles/microservices-architecture]] — deep module heuristic; BC vs microservice relationship; subdomain as safe granularity
- [[styles/event-driven-architecture]] — three event types (notification, ECST, domain event); distributed big ball of mud anti-pattern
- [[concepts/data-mesh]] — data mesh as DDD for analytical data; four principles; DDD pattern alignment
- [[concepts/technical-vs-domain-partitioning]] — subdomain analysis drives domain-partitioned architecture

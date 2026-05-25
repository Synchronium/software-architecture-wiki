---
title: "Monolith to Microservices"
type: source
tags: [microservices, migration, decomposition, ddd]
sources: [monolith-to-microservices]
created: 2026-05-15
updated: 2026-05-15
---

# Monolith to Microservices

**Author:** [[authors/sam-newman]]
**Published:** 2019
**Slug:** `monolith-to-microservices`

## Overview

A practitioner's handbook for decomposing existing monolithic systems into microservices — not a theoretical argument for microservices, but a step-by-step guide to doing it safely. Newman insists throughout that microservices are a means to an end: you must articulate the outcome you want before decomposing anything.

The book is structured around the migration lifecycle: clarifying goals, prioritising what to extract first, choosing decomposition patterns, splitting databases, and managing the organisational and operational changes that accompany the technical work. It is explicitly a companion and sequel to Newman's earlier *Building Microservices*.

## Key Claims

- Independent deployability is the single most important property of a microservice — if you get only one thing from the book, get that (→ ch. 1)
- Microservices are not the goal; they are a tool for achieving specific outcomes; cargo-culting them is a failure mode (→ ch. 2)
- Shared databases between services are "one of the worst things you can do if you're trying to achieve independent deployability" (→ ch. 1)
- Incremental migration is non-negotiable; "if you do a big-bang rewrite, the only thing you're guaranteed of is a big bang" (Martin Fowler, cited ch. 2)
- Prematurely decomposing into microservices when the domain is unclear is costly — SnapCI example shows teams that merged back and re-decomposed later succeeded (→ ch. 2)
- Reuse is a poor migration goal; track the actual outcome (time to market, cost) instead (→ ch. 2)
- The strangler fig pattern is the primary incremental extraction vehicle (→ ch. 3)
- Database decomposition is unavoidable for true independent deployability (→ ch. 4)

## Chapter Notes

### Chapter 1 — Just Enough Microservices

Newman defines a microservice as **an independently deployable service modelled around a business domain**. The definition contains three load-bearing words: independently deployable (the operational property), service (the unit), and business domain (the boundary criterion).

**Independent deployability** is the paramount principle: a microservice must be deployable without requiring coordinated changes to other services. This principle cascades into the two other critical rules:
- Services must not share databases (shared databases make independent deployability impossible)
- Service interfaces must be designed from the outside in (what consumers need) not from the inside out (what the implementation exposes)

**Three monolith types:**
1. **Single-process monolith** — all code deployed as one process; the simplest form and often the right starting point
2. **Modular monolith** — single deployment unit composed of separately developed modules with well-defined interfaces; a viable alternative to microservices if module boundaries are stable
3. **Distributed monolith** — the worst of both worlds: separately deployed processes that cannot be deployed independently; all the operational complexity of distribution with none of the decoupling benefit

Newman notes monoliths have genuine advantages: simpler deployment topology, simpler developer workflow, and straightforward code reuse. These advantages disappear as team size and delivery contention grow.

**Newman's four coupling types** (informed by Parnas' 1971 information hiding):
| Coupling type | Description |
|---------------|-------------|
| **Implementation coupling** | Service A depends on the internal implementation of service B (e.g., calling into its internal DB); the most dangerous form |
| **Temporal coupling** | Service A can only function when service B is available at the same time; synchronous calls between services introduce this |
| **Deployment coupling** | Services must be deployed together; the coupling that independent deployability is specifically designed to eliminate |
| **Domain coupling** | Service A needs information from service B's domain to do its work; unavoidable but should be minimised |

Information hiding (Parnas): stable module interfaces over volatile internals — internal implementation changes must not propagate to consumers. This is the fundamental technique for achieving the coupling taxonomy's goals.

**Just Enough DDD:**
- **Aggregates**: self-contained state machines — illegal state transitions are impossible inside the aggregate; a single aggregate should never span more than one transaction
- **Bounded Contexts**: contain one or more aggregates; hide internal implementation from the outside world; map directly to microservice candidates (start decomposition at the BC level, split on aggregates only when coupling between aggregates in the BC is minimal)
- Migration strategy: map bounded contexts first, then split on aggregates where teams are large or coupling justifies it

> "Microservices buy you options." — James Lewis (→ ch. 1)

The monolith has genuine strengths — it should be the default when team size is small, domain understanding is incomplete, or operational maturity is limited.

### Chapter 2 — Planning a Migration

**Microservices are not the goal.** The chapter opens with a story about a team told to "do microservices" without knowing why — a failure mode Newman has seen repeatedly. You must articulate the outcome before starting.

**Three key questions for any team considering migration:**
1. What are you hoping to achieve?
2. Have you considered alternatives to using microservices?
3. How will you know if the transition is working?

**Six commonly cited migration drivers and alternatives:**

| Driver | Microservices rationale | Alternatives first |
|--------|------------------------|---------------------|
| Team autonomy | Service ownership = team ownership | Modular monolith; code ownership delegation |
| Time to market | Independent release cadences | Path-to-production modelling; process improvements |
| Scale for load | Per-service independent scaling | Vertical scaling; horizontal monolith scaling |
| Robustness | Failure isolation across services | Redundant monolith instances across failure planes |
| Scale developer count | Partitioned code reduces contention | Modular monolith with stable module contracts |
| New technology | Per-service tech choice | JVM polyglot; selective component replacement |

**Reuse is a poor goal.** Newman argues reuse is a proxy metric that often leads to optimising the wrong thing. If the real goal is time to market, track that — reuse can increase coordination costs and slow delivery.

**When not to use microservices:**
- **Unclear domain**: wrong boundaries are expensive; SnapCI merged back and re-decomposed more carefully a year later
- **Startups**: microservices solve the problems you get *after* finding product/market fit; scale-ups are better candidates
- **Customer-installed software**: you cannot expect customers to operate Kubernetes clusters
- **No clear reason**: "doing microservices because Netflix does" is not a reason

**Reversible vs Irreversible decisions** (Jeff Bezos, 2015 letter): Type 1 decisions are one-way doors requiring slow deliberation; Type 2 are two-way doors, reversible quickly. Newman treats these as a spectrum. Most microservice migration decisions are closer to reversible — make them quickly, learn, adjust. Irreversible decisions (splitting a database, publishing a public API contract) need more care.

**Incremental migration**: extract one or two services, get them to production, learn, adjust. The extraction is not complete until the service is in production and actively used. Big-bang rewrites guarantee big-bang consequences.

**Domain model for prioritisation:**
1. Run a domain modelling exercise (Event Storming recommended) to identify bounded contexts
2. Map relationships between contexts to assess coupling
3. Use a two-axis prioritisation quadrant (x = value delivered by extraction, y = difficulty of extraction) to select early candidates
4. Prefer functionality with few inbound dependencies (low difficulty) and high business value
5. Revisit and replan regularly as you learn

**Event Storming** (Alberto Brandolini): collaborative bottom-up workshop where technical and non-technical stakeholders define domain events first, then group into aggregates, then identify bounded contexts. The output is a shared understanding as much as a model. Newman endorses it as a near-essential first step before migration.

**Organisational change — Kotter's 8 steps** applied to microservice adoption: establish urgency, build a guiding coalition, develop a vision, communicate it, empower employees, generate short-term wins, consolidate gains, anchor in culture. Key insight: early wins matter disproportionately; if people can't see progress, faith collapses.

**Measuring progress**: both quantitative (cycle time, deployment frequency, failure rate, performance test results) and qualitative (team happiness, empowerment) measures are required. Metrics can be gamed; qualitative feedback catches what numbers miss.

**Avoiding sunk cost fallacy**: small incremental bets make it easier to change direction. Build regular checkpoints (monthly or retrospective-based) to ask: is this still working? Should we try something else?

### Chapter 3 — Splitting the Monolith

The chapter is a catalogue of migration patterns for moving functionality out of a monolith, organised by the type of coupling being broken.

**Strangler Fig Application** (Martin Fowler): the primary incremental extraction vehicle. Three steps: identify the behaviour to migrate, implement it in the new service without touching the monolith, then redirect traffic via a proxy. HTTP reverse proxy (NGINX) is the most common implementation — the proxy becomes the seam separating the monolith from new services. Applies to FTP transports (Homegate example: intercept FTP drops before they reach the monolith) and message queues (content-based router or selective consumption). Important principle: **deployment ≠ release** — the new service can be deployed to production and tested with zero traffic before any redirect is applied. One caution: freeze new feature development on the capability being migrated while migration is in progress; otherwise the new service is chasing a moving target. (→ [[patterns/strangler-fig]])

**UI Composition**: when the monolith renders UI, the redirect cannot always happen at the request level alone. Three approaches: (1) *page composition* — entire routes redirect to the new service; (2) *widget/component composition* (micro frontends) — a page shell assembles components from multiple services, using ESI or JavaScript module federation; (3) *mobile* — server-side configuration (Spotify approach) lets the server tell native clients what to render, enabling server-side migration without synchronised app releases.

**Branch by Abstraction**: for capabilities with no clean external seam (many internal callers, no HTTP boundary). Five steps: create abstraction → all callers use abstraction → build new implementation → switch via feature toggle → clean up old implementation. Feature toggles allow gradual rollout (1% → ramp up) and instant rollback. The **verify variant** (Steve Smith) extends this: run both implementations simultaneously, compare results, but always return the old result to the caller — automatic fallback if the new implementation is wrong. (→ [[patterns/branch-by-abstraction]])

**Parallel Run**: both implementations receive every production request; results are compared; old implementation is the source of truth until the new is verified. Spies wrap the new implementation without exposing its results to callers. GitHub Scientist library operationalises this. Newman clarifies three related but distinct terms: *dark launching* (new service receives traffic but results are discarded, used for performance testing); *canary releasing* (a cohort of real users sees the new implementation's results); *parallel run* (both execute every request, old result returned, new result compared — the strongest correctness verification). James Governor's *progressive delivery* is the umbrella term for this family of techniques. (→ [[patterns/parallel-run]])

**Decorating Collaborator**: a proxy intercepts the inbound request, forwards it to the monolith, then uses the monolith's response to trigger calls to a new service that adds behaviour (e.g., log a loyalty event after an order is placed). The new service "decorates" the monolith's response without the monolith knowing it exists. One caution: resist the temptation to add "smart proxy" logic — keep routing and business logic separate.

**Change Data Capture (CDC)**: react to data changes in the monolith's database rather than calling monolith endpoints. Three implementations, in order of preference: (1) *DB triggers* — fire on insert/update, populate an outbox table; use sparingly as they are hard to test and couple business logic to the database layer; (2) *transaction log pollers* — read the database's write-ahead log (Debezium for PostgreSQL/MySQL, Maxwell for MySQL); the neatest approach because no application code changes are required; (3) *batch delta copier* — periodic batch job reads new/changed rows; simplest to implement but introduces latency.

### Chapter 4 — Decomposing the Database

Splitting the database is the hardest part of microservice migration. A shared database between services creates implementation coupling: services depend on each other's schema internals, making independent deployability impossible.

**The shared database problem**: Newman allows the shared database to persist in exactly two situations — static reference data (read-only, rarely changes) and when deliberately using it as a DB-as-a-Service interface. In all other cases, decompose the database as soon as you decompose the code.

**Coping patterns (when you cannot split yet):**

*Database View*: create a view that projects a stable subset of the monolith's schema; new services read from the view, insulating them from schema changes. Views are read-only — cannot be used for write operations. A materialised view can improve query performance.

*Database Wrapping Service*: wrap the shared database behind a thin service with an explicit API; all consumers migrate to the API; the database becomes internal to the wrapping service. A useful holding pattern while planning a full decomposition. Newman's rule: first stop new access growth (no new callers to the raw database), then migrate existing callers.

*Database-as-a-Service Interface*: a dedicated read-only service endpoint (extends the reporting database pattern). A mapping engine (via CDC, batch export, or event stream) populates a read model optimised for consumer needs. Producers and consumers are decoupled: the producer's schema can change without breaking consumers as long as the mapping engine is updated.

*Aggregate Exposing Monolith*: expose an aggregate as a service endpoint *within* the monolith before extracting it. A stepping stone: new services call the monolith's new API rather than hitting the shared database. This is a pathway to eventually extracting the aggregate as its own service.

**Active decomposition patterns:**

*Change Data Ownership*: move data for a capability to the new service. The monolith is updated to call the new service's API to read/write that data. The new service is now the source of truth. Requires the monolith to be modified — only applicable when you can change the monolith.

*Synchronise Data in Application*: for zero-downtime migrations between two incompatible data stores. Newman describes the Danish medical records system (MySQL → Riak) using three phases: (1) bulk sync old store to new; (2) write to both, read from old; (3) write to both, read from new. Each phase is independently deployed and rolled back if needed.

*Tracer Write*: incrementally move the source of truth from old to new data store while tolerating two sources of truth during transition. Three synchronisation options: write old, async sync to new; write new, sync back to old; dual write from the application. Square Fulfillments example: moved order data incrementally over months with no downtime. Eventually consistency leads to eventual consistency between old and new; this is acceptable during the migration window.

**Database boundary patterns:**

*Repository per Bounded Context*: colocate database mapping code (repository classes, ORM models) with the bounded context that owns the data. Do not share repository classes across contexts. Use SchemaSpy to visualise foreign-key relationships across bounded contexts and identify coupling that must be resolved before database separation.

*Database per Bounded Context*: each bounded context uses a separate logical schema, even within a single monolith database (separate schemas in PostgreSQL, separate databases in MySQL). ThoughtWorks Revenue service modular monolith example: multiple bounded contexts in one deployment unit, but each with its own schema. This is the modular monolith data architecture — ready for physical separation later.

*Monolith as Data Access Layer*: create a service API within the monolith that exposes data to new services, rather than letting new services hit the shared database. JustSocial pattern: the monolith becomes a transitional API layer. Safe when the monolith codebase can be modified.

*Multischema Storage*: new service uses its own schema for new data; still reads legacy data from the monolith's schema during transition. A stepping stone: the new service owns its data model for new records while legacy records are still served from the old source.

**Table-level patterns:**

*Split Table*: tables that span bounded context boundaries must be split. Each column is assigned to the bounded context that owns it. Shared columns are resolved by decision: one context owns the column; the other calls an API to read/write it. Newman acknowledges this requires judgment calls about column ownership, especially for tables that accumulated columns from multiple contexts over time.

*Move Foreign-Key Relationship to Code*: when FK relationships cross bounded context boundaries, remove the database-level FK and enforce the relationship in application code via service calls. Three options for handling deletion of the referenced entity: (1) *check before delete* via service call — avoid, creates temporal coupling; (2) *handle gracefully* — the referencing service detects a missing entity and deals with it (e.g., display "deleted user"); (3) *don't allow deletion* — business rule enforced at the service level.

**Static reference data patterns**: four approaches for data (e.g., country codes, currency codes) that is read-only and shared: (1) duplicate into each service (simplest, accepts mild duplication); (2) dedicated reference data schema (shared but read-only); (3) shared library (Stitch Fix pattern: package static data as a versioned library); (4) dedicated reference data service (FaaS-friendly for cloud functions that cannot share files).

**Transactions:**

Newman is direct: splitting a database means losing ACID transactions across the split boundary. Options:
- *Don't split*: if a transaction truly must be atomic, keep both operations in the same service/database.
- *Sagas*: sequence of local transactions with compensating (backward recovery) or retry (forward recovery) steps. Semantic rollbacks are needed because true rollbacks are often impossible (an email sent cannot be unsent). Reorder saga steps to fail fast: put the most likely-to-fail steps first to minimise the number of compensations required. (→ [[patterns/saga]])
- *Two-Phase Commit*: Newman says "just say no" for most cases — distributed locks, latency, and failure modes make 2PC more trouble than it's worth in a microservice context. (→ [[distributed/distributed-transactions]])

Saga coordination: *orchestrated sagas* use a central coordinator that drives the process, holds the explicit state machine, and handles failures explicitly — better when one team owns the whole saga. *Choreographed sagas* use event-driven coordination — each service reacts to events; no central coordinator — better when multiple teams own different steps. Newman's preference is shaped by team ownership: one team → orchestrate; multiple teams → choreograph. Require correlation IDs for choreographed sagas to track a distributed saga instance across services.

### Chapter 5 — Growing Pains

A chapter of operational patterns keyed to service count. Newman maps problems to approximate service-count thresholds (heuristic, not prescriptive): some emerge at ~5 services, others not until ~100+.

**Service count as the dial**: "Don't think of adopting microservices as flipping a switch; think about it as turning a dial." As the dial turns, different classes of problems emerge. The more coupled the architecture, the earlier problems manifest.

**Ownership at Scale**: Martin Fowler's three ownership models — *strong* (owners must approve all changes from outsiders; PRs for non-owners), *weak* (anyone can change, but should speak to owners first), *collective* (anyone changes anything). Collective ownership works at ~20 colocated developers but becomes "disastrous" at scale (the fintech "colander architecture" anti-pattern: no clear vision, rapid growth to 100+ developers, teams punching new holes wherever they felt like it). Strong ownership is almost universal at 100+ developers in large-scale microservice organisations — each team adopts collective ownership locally, owns a domain area, and embeds product owners.

**Breaking Changes**: Microservices expose contracts to other services; breaking those contracts causes production outages or forces lock-step releases. Newman's three rules: (1) *eliminate accidental breaking changes* — use explicit schemas (protolock for protobuf); schema-less JSON is dangerous because structural breakages are obvious but semantic breakages (same field name, different meaning) are only caught by testing; (2) *prefer expansion changes* — additive changes that don't remove old fields or methods; (3) *give consumers time to migrate*. Two transition approaches: run two simultaneous service versions (extra infra burden, viable only for short periods) vs. one service exposing two contracts on different ports (preferred; can accumulate multiple old contracts, which is painful but better than forcing lock-step). Consumer-driven contracts (Pact) as a testing solution to replace broad cross-service tests.

**Reporting**: The monolithic database made cross-entity reporting trivial. Decomposed databases make it hard. Solution: dedicated reporting database; CDC to populate it from multiple service schemas; database views can project a unified schema from multiple service databases. The reporting use case should be discovered before database decomposition begins — it bites surprisingly early.

**Monitoring and Troubleshooting**: Monitoring becomes harder as the number of moving parts grows. Newman's hierarchy of solutions:
1. *Log aggregation* (ELK stack, Humio): implement this **first**, before going to microservices. "If your organisation struggles to implement a suitable log aggregation system, you might want to reconsider whether you're ready for microservices." Generate correlation IDs at the entry point (API gateway or service mesh); propagate through all downstream calls via HTTP header or message payload; use as the join key in log queries and saga tracking.
2. *Distributed tracing* (Jaeger): captures timing and call chain for diagnosing latency spikes; implement for latency-sensitive systems; existing correlation ID infrastructure makes the switch easier.
3. *Testing in production via synthetic transactions*: script fake user behaviour on a regular basis to catch issues with real users' flows without impacting real users (Atomist example: scripted fake customer sign-up; clean up test accounts after each run).
4. *Observability*: the goal is not just pre-defined alerts but the ability to ask open-ended questions about system behaviour after unexpected events. Logs, traces, and metrics must be queryable ad hoc.

**Local Developer Experience**: JVM services exhaust developer laptops long before Go/Node services do. Solutions: stub services not under active development; Telepresence (hybrid local/remote for Kubernetes users); cloud functions run locally against remote infra. Teams with strong ownership of a few services fare better — they only need to run their own services locally.

**Running Too Many Things**: Manual deployment processes don't scale to 100+ services. Kubernetes for desired state management. Serverless-first recommendation for public cloud (FaaS: developers focus on code; platform handles operational work; limitations exist, but the reduction in operational overhead is significant). **Warning**: "I do see people reaching for Kubernetes and the like a bit too early in the process of adopting microservices, often assuming it is a prerequisite."

**End-to-End Testing**: Test scope becomes unmanageable as cross-team flows require testing across multiple services. Four solutions: (1) limit cross-service tests to within a single team; (2) consumer-driven contracts (Pact) to replace cross-team tests; (3) automated release remediation + progressive delivery (define latency/error thresholds, auto-roll-back if violated — Spinnaker); (4) continuously refine quality feedback cycles — be as willing to remove wrong tests as to add new ones.

**Global vs Local Optimisation**: Teams making individually rational technology decisions (Oracle, MongoDB, PostgreSQL all chosen independently for similar needs) that are collectively irrational. Solutions: use the reversible/irreversible decision framework to determine when local decisions need wider consensus; cross-team technical group (community of practice); Monzo's "proposals" system (free-form docs shared org-wide via Slack, expectation that proposals are open to change).

**Robustness and Resiliency**: Network packets get lost, timeouts occur, cascading failures happen. Solutions: explicit failure handling per call; asynchronous communication to avoid temporal coupling; sensible timeouts; circuit breakers; multiple instances; desired state management. Document production incidents — the learning is lost if the team moves on too quickly.

**Orphaned Services**: Services running for years with no owner, no known source code location. Solutions: service registries (Financial Times Biz Ops — crawls source repos, merges with service discovery data, calculates a System Operability Score per service); collective ownership reduces risk; bring orphaned services into compliance with current standards.

### Chapter 6 — Closing Words

Brief summation of the book's two key messages: (1) gather enough information to make rational decisions about whether microservices are right for your context; (2) adopt incrementally, adapting as you learn. No substantial new technical content. The appendix includes a complete pattern index covering all 20+ patterns from the book.

## Notable Quotes

> "Microservices are not the goal. You don't 'win' by having microservices." (ch. 2)

> "If you do a big-bang rewrite, the only thing you're guaranteed of is a big bang." — Martin Fowler (cited ch. 2)

> "Microservices buy you options." — James Lewis (ch. 1)

> "No shared databases: this is one of the worst things you can do if you're trying to achieve independent deployability." (ch. 1, paraphrased)

> "Copy the questions, not the answers." — Jessica Kerr (on the Spotify model, cited ch. 2)

## Related Pages

- [[styles/microservices-architecture]] — the architecture style Newman is guiding migrations toward
- [[concepts/bounded-contexts]] — the primary unit for migration decomposition
- [[concepts/modularity]] — information hiding and Newman's four coupling types
- [[concepts/fracture-planes]] — monolith type taxonomy and where to split
- [[concepts/eventstorming]] — Event Storming as a near-essential migration planning tool
- [[concepts/evolutionary-architecture]] — strangler fig and incremental migration
- [[concepts/evolutionary-database-design]] — database decomposition patterns from ch. 4
- [[distributed/distributed-transactions]] — loss of ACID when splitting databases; Newman's "just say no" to 2PC
- [[patterns/context-map]] — relationship mapping between bounded contexts
- [[patterns/strangler-fig]] — the primary extraction pattern from ch. 3
- [[patterns/branch-by-abstraction]] — extraction for deeply embedded capabilities
- [[patterns/parallel-run]] — correctness verification during migration
- [[patterns/saga]] — handling distributed transactions after database decomposition
- [[concepts/contracts]] — breaking changes, consumer-driven contracts, expansion changes
- [[operations/observability]] — log aggregation, correlation IDs, distributed tracing, synthetic transactions

---
title: "Software Architecture: The Hard Parts"
type: source
tags: [distributed-systems, decomposition, trade-offs, data, sagas, coupling]
sources: [software-architecture-the-hard-parts]
created: 2026-05-14
updated: 2026-05-14
---

# Software Architecture: The Hard Parts

**Authors:** [[authors/neal-ford]], [[authors/mark-richards]], [[authors/pramod-sadalage]], [[authors/zhamak-dehghani]]
**Published:** 2022
**Slug:** `software-architecture-the-hard-parts`

## Overview

Arose from problems Ford and Richards set aside as "too difficult" while writing *Fundamentals of Software Architecture*. SATH focuses on the decisions in distributed architectures that have no correct answers — only trade-off sets. Data and architecture are treated as co-equal concerns throughout, reflecting the reality that in microservices the database is inside the service boundary.

The book uses ADRs as its documentation format for every architecture decision and fitness functions for governance. A fictional case study (the Sysops Squad) runs throughout — it provides context for examples but is not the substance of the book.

**Structure**: Part I (Ch 1–7) covers static coupling — pulling things apart: decomposition, modularity, data separation, service granularity. Part II (Ch 8–15) covers dynamic coupling — putting things back together: reuse patterns, data ownership, distributed data access, workflow coordination, saga types, contracts, analytical data, trade-off methodology. (Fully ingested.)

## Key Claims

- There are no best practices in architecture — only trade-offs; the architect's goal is the "least worst combination" (→ ch. 1)
- The fundamental question of distributed architecture is: how do you determine the right size and communication style for services? (→ ch. 2)
- Data has moved from a technical concern to an architectural concern in microservices — most "hard parts" derive from the tension between data and architecture (→ ch. 1)
- An architecture quantum requires: independent deployability + high functional cohesion + high static coupling (wiring dependencies) + synchronous dynamic coupling (→ ch. 2)
- A shared database makes a system a single quantum regardless of how distributed its services are (→ ch. 2)
- Dynamic coupling has three interlocking dimensions: communication (sync/async) × consistency (atomic/eventual) × coordination (orchestrated/choreographed) — producing 8 named saga types (→ ch. 2)
- SATH uses "saga" as a broad term for any distributed workflow pattern across all 8 types, not just eventually-consistent compensating transactions (→ ch. 2)

## Chapter Notes

### Preface

FOSA left a pile of "too difficult" problems unresolved. SATH works through those, with data specialists Sadalage and Dehghani added to fully incorporate the data dimension. Result: a guide to trade-off analysis in distributed architectures, focused on the process of decision making rather than specific technologies.

### Chapter 1 — What Happens When There Are No "Best Practices"?

Sets the epistemological foundation: architecture problems are snowflakes — no one has encountered exactly your combination of constraints before. The appropriate response is disciplined trade-off analysis, not a search for silver bullets.

Key concepts introduced:
- **Operational vs analytical data**: operational = OLTP, transactional, runs the business day-to-day; analytical = BI, data science, strategic — not critical for daily operation but for long-term direction.
- **ADRs** as the documentation format used throughout the book (context / decision / consequences).
- **Fitness functions** as the governance mechanism — extends [[sources/building-evolutionary-architectures]] treatment with specific examples: JDepend for detecting component cycles (Java), ArchUnit for governing layer dependencies (Java), NetArchTest for .NET. The Equifax breach (Struts vulnerability, March–July 2017) is presented as a real-world case where a fitness function inserted into every project's deployment pipeline would have caught the vulnerable version automatically.
- **Architecture vs design**: focus is on *why* one choice is better than another, not *how* to implement it.
- Key definitions: service, coupling, component, synchronous/asynchronous communication, orchestration, choreography, atomicity, contract.

> Note: the Sysops Squad case study introduction is fictional scaffolding — ignored per ingestion instructions.

See [[concepts/fitness-functions]], [[concepts/adrs]].

### Chapter 2 — Discerning Coupling in Software Architecture

The most conceptually dense early chapter. Establishes the full framework for trade-off analysis by unpacking the dimensions of coupling in distributed architectures.

**Architecture quantum — expanded definition:**
- Independently deployable + high functional cohesion + **high static coupling** + **synchronous dynamic coupling**
- *Static coupling* = how things are wired together — OS, frameworks, libraries, databases, message brokers. Measurable at compile time. A shared database = always a single quantum, regardless of how separate the services appear to be.
- *Dynamic coupling* = how quanta call one another at runtime — sync vs async

Quantum count by architecture style:
- All monoliths → 1 quantum (single deployment)
- Service-based architecture → 1 quantum (separate services but shared DB)
- Mediator-style EDA → 1 quantum (mediator is a holistic coupling point like the shared DB)
- Broker-style EDA with shared DB → 1 quantum
- Broker-style EDA with multiple separate data stores → multiple quanta
- Microservices with per-service DB → multiple quanta (one per service)
- Tightly coupled UI → collapses multiple service quanta back to 1
- **Micro-frontends** → each service + its UI component forms its own quantum

**Dynamic quantum coupling — 3 dimensions:**
- Communication: synchronous vs asynchronous
- Consistency: atomic vs eventual
- Coordination: orchestrated vs choreographed

**8 saga types** (2³ combinations):

| Pattern | Communication | Consistency | Coordination | Coupling |
|---------|--------------|-------------|-------------|---------|
| Epic Saga | synchronous | atomic | orchestrated | very high |
| Phone Tag Saga | synchronous | atomic | choreographed | high |
| Fairy Tale Saga | synchronous | eventual | orchestrated | high |
| Time Travel Saga | synchronous | eventual | choreographed | medium |
| Fantasy Fiction Saga | asynchronous | atomic | orchestrated | high |
| Horror Story | asynchronous | atomic | choreographed | medium |
| Parallel Saga | asynchronous | eventual | orchestrated | low |
| Anthology Saga | asynchronous | eventual | choreographed | very low |

These names are covered in detail in Chapter 12. The matrix provides a vocabulary for the rest of the book.

See [[concepts/architecture-quantum]], [[patterns/saga]].

## Notable Quotes

> "Don't try to find the best design in software architecture; instead, strive for the least worst combination of trade-offs." (ch. 1)

> "Moving the database within the service boundary moves data concerns into architecture concerns." (ch. 2)

> "If you follow that advice, everything will be so decoupled that nothing can communicate with anything else — it's hard to build software that way!" (ch. 2 — on the limits of the 'maximise decoupling' heuristic)

### Chapter 3 — Architectural Modularity

Why modularity matters, framed as a business case: five key architectural characteristics (availability/fault tolerance, scalability, deployability, testability, maintainability) map to business drivers (speed-to-market, competitive advantage). The chapter argues that architects must justify decomposition via these drivers, not just technical intuition.

**Scalability vs Elasticity** (important distinction not clearly drawn in FOSA):
- *Scalability* = ability to remain responsive as user load gradually increases over time (long-horizon, function of modularity)
- *Elasticity* = ability to remain responsive during sudden spikes (immediate response, function of service granularity and MTTS — mean time to startup)

**Architecture stories**: a concept introduced to distinguish structural refactoring from user stories and technical debt stories. An architecture story captures code refactoring that impacts the structural aspect of the application to satisfy a business driver (e.g., "As an architect, I need to decouple the payment service to support better extensibility for adding additional payment types").

See [[concepts/architectural-decomposition]].

### Chapter 4 — Architectural Decomposition

Covers *how* to break apart a monolith, following the *why* of Ch 3. Introduces the decision tree for selecting a decomposition approach.

**Big Ball of Mud Anti-Pattern** (Brian Foote, 1999): codebases with no internal structure that resist decomposition.

**Elephant Migration Anti-Pattern**: extracting services opportunistically one bite at a time, resulting in an unstructured big ball of distributed mud.

**Two decomposition approaches:**
- *Component-based decomposition*: structured, incremental refactoring of well-defined components into domain services; suited when the codebase has observable structure
- *Tactical Forking* (Fausto De La Torre): clone the entire monolith, give each team a copy, have teams delete what they don't need rather than extract; suited for codebases that are big balls of mud — easier to delete than to untangle coupling

Decomposition feasibility is assessed using Robert Martin's coupling metrics applied at the package/component level: abstractness (A), instability (I), and distance from the main sequence (D = |A + I − 1|). Components in the Zone of Pain (over-concrete, rigid) or Zone of Uselessness (over-abstract, irrelevant) signal structural problems that make decomposition harder.

**Stepping-stone principle**: when decomposing a monolith, consider moving to service-based architecture first (shared DB, coarse-grained domain services) before committing to microservices granularity. Avoids premature distributed transaction complexity.

See [[concepts/architectural-decomposition]], [[concepts/modularity]].

### Chapter 5 — Component-Based Decomposition Patterns

The six patterns applied sequentially during monolith decomposition:

1. **Identify and Size Components**: catalogue all components by namespace; measure statements per component; components should fall within 1–2 standard deviations of the mean; outliers (too large or too small) are candidates for resizing.
2. **Gather Common Domain Components**: identify domain logic (not infrastructure) that is duplicated across components; consolidate; check resulting afferent coupling before proceeding.
3. **Flatten Components**: source code must reside only in leaf-node namespaces (components); classes in root/non-leaf namespaces are "orphaned classes" that must be moved up or down; root namespaces are subdomains, not components.
4. **Determine Component Dependencies**: visualise afferent and efferent coupling between components; "golf ball" (few dependencies) → feasible; "basketball" → difficult; "airliner" → not feasible without rewrite.
5. **Create Component Domains**: group components into logical domains (manifested through namespace prefixes); collaborate with product owner to validate domain groupings.
6. **Create Domain Services**: extract domain groups into separately deployed services → service-based architecture as the migration target.

Each pattern includes automated fitness functions for CI/CD governance (see [[concepts/fitness-functions]]).

**Architecture stories** are used to document and assign structural refactoring tasks to developers throughout this process.

See [[concepts/architectural-decomposition]], [[concepts/fitness-functions]].

### Chapter 6 — Pulling Apart Operational Data

Data decomposition is harder than service decomposition because data is the most important asset and is highly coupled through foreign keys, triggers, and views.

**Data disintegrators** (when to break apart):
1. Change control — breaking schema changes cascade across all services sharing the DB
2. Connection management — distributed services multiply connection pool usage dramatically
3. Scalability — shared DB bottleneck; connections saturate when services scale
4. Fault tolerance — shared DB is a SPOF for all services
5. Architectural quanta — shared DB forces all services into a single quantum
6. Database type optimisation — different data warrants different database types

**Data integrators** (when to keep together):
1. Data relationships — foreign keys, triggers, views are hard to remove
2. Database transactions — ACID is lost when data crosses service boundaries

**Five-step data decomposition process:**
1. Analyse database and create data domains (logical groupings of related tables)
2. Assign tables to schemas (one schema per data domain)
3. Separate database connections per domain (no cross-schema access from services)
4. Move schemas to separate physical database servers (backup-restore or replication)
5. Switch over and decommission original

**Data sovereignty per service**: the end-state where each service owns its own data — called "the nirvana state" for distributed architectures.

**Database type selection**: the chapter covers seven database types with star ratings across seven characteristics: Relational, Key-Value, Document, Column Family (wide column), Graph, NewSQL, Cloud Native, Time-Series. The selection principle: match the database type to the access pattern and data structure of the bounded context — polyglot persistence is the natural outcome of proper data domain decomposition.

**Connection quota management**: two approaches — even distribution (starting point) and variable distribution (optimised over time via fitness functions that measure concurrent connection usage).

See [[concepts/data-decomposition]], [[concepts/architecture-quantum]].

### Chapter 7 — Service Granularity

The critical distinction: *modularity* (breaking systems into parts) vs *granularity* (the size of those parts). Most distributed architecture problems are granularity problems, not modularity problems.

**Granularity disintegrators** (when to break a service apart):
1. Service scope and function — weak cohesion (doing too many unrelated things)
2. Code volatility — parts of the service change at very different frequencies; isolate the volatile part
3. Scalability and throughput — parts have extremely different throughput demands
4. Fault tolerance — one unstable function brings down unrelated stable functions
5. Security — parts have different security requirements; separate access control at the service boundary
6. Extensibility — the service context will continually expand with new variants (e.g., new payment methods)

**Granularity integrators** (when to keep services together):
1. Database transactions — if ACID is required across the combined operation, keep it one service
2. Workflow and choreography — too much inter-service communication creates latency, fault tolerance chains, and reliability issues; if 70%+ of operations require multi-service workflows, consolidate
3. Shared code — high percentage of shared domain code, or frequently changing shared code, argues for consolidation
4. Data relationships — tight bounded-context coupling between tables argues for keeping services together

**Finding balance**: the architect's job is to translate trade-offs into business questions and present them to product owners and sponsors for resolution ("Is it more important to have better data consistency or better security access control?").

See [[concepts/service-granularity]], [[concepts/data-decomposition]].

### Chapter 8 — Reuse Patterns

Code reuse in distributed architectures requires explicit mechanism choices. Four techniques:

1. **Code replication**: copy-paste; acceptable only for small, stable utility code with no business logic
2. **Shared library**: versioned dependency; fine-grained preferred; **never use LATEST**; requires custom deprecation strategy
3. **Shared service**: runtime dependency; appropriate for polyglot environments or high-volatility code; introduces performance/fault tolerance risk
4. **Sidecar / service mesh**: for operational concerns only (logging, monitoring, auth); hexagonal architecture origin; **orthogonal coupling** — operational concerns are orthogonal to business domain; never put domain logic in a sidecar

**Core reuse principle**: reuse = abstraction + slow rate of change. Volatile code should not be shared — sharing it creates a tight release coupling across all consumers.

See [[concepts/reuse-patterns]], [[patterns/sidecar-service-mesh]].

### Chapter 9 — Data Ownership and Distributed Transactions

Data ownership in distributed architectures: three patterns based on who writes the data.

**Single ownership**: one service has write authority; all others access via API. Cleanest pattern.

**Common ownership**: multiple services need to write; create a dedicated data domain service; writes flow through an async queue.

**Joint ownership**: multiple services own different parts of the same table. Four resolution techniques:
1. **Table split**: divide columns into separate tables per owner
2. **Data domain**: shared schema for this specific data (limited shared DB)
3. **Delegate technique**: primary ownership assigned by domain priority or operational characteristics priority
4. **Service consolidation**: merge the services if joint ownership signals over-decomposition

**Eventual consistency patterns** (for cross-service data operations):
1. **Background synchronization**: batch process; breaks bounded context; acceptable for analytics/reporting
2. **Orchestrated request-based**: synchronous propagation during request; complex compensations; tight coupling
3. **Event-based** (preferred): pub/sub; async; decoupled; eventual; scales naturally

See [[concepts/data-decomposition]].

### Chapter 10 — Distributed Data Access

Four patterns for accessing data owned by another service:

1. **Interservice communication**: call the owning service's API; simplest; adds latency and fault tolerance dependency
2. **Column schema replication**: CDC-based replication of needed columns to the consuming service; eventual; no runtime coupling
3. **Replicated caching**: distributed in-memory cache (Hazelcast, Apache Ignite, Oracle Coherence); fast reads; startup dependency; ~500MB limit; not for high update rates
4. **Data domain**: both services access the same schema; fastest; loses data sovereignty; use sparingly

See [[concepts/data-decomposition]] (Distributed Data Access Patterns section).

### Chapter 11 — Managing Distributed Workflows

**Semantic vs implementation coupling** (important distinction):
- *Semantic coupling*: coupling mandated by the business domain; the architect cannot remove it
- *Implementation coupling*: how coordination is implemented (sync/async, atomic/eventual, orchestrated/choreographed); these are the architect's choices

Architects can only minimise implementation coupling; semantic coupling is given by the problem.

**Orchestration** (centralised): clear error handling, queryable state, simpler reasoning; creates coupling to orchestrator, potential bottleneck.

**Choreography** (decentralized): responsive, scalable, decoupled; distributed workflow state, hard to track, complex error handling.

**Workflow state management options for choreography:**
1. **Front controller**: first service in choreography becomes state owner; awkward coupling
2. **Stateless choreography**: no persistent state; reconstruct via query; expensive at query time
3. **Stamp coupling**: embed entire workflow state in each message; simple; increases message size

See [[patterns/saga]].

### Chapter 12 — Transactional Sagas

Full trade-off ratings for all 8 saga types across 4 dimensions (coupling, complexity, responsiveness, scale):

| Type | Coupling | Complexity | Responsiveness | Scale |
|------|---------|-----------|----------------|-------|
| Epic Saga | very high | low | low | very low |
| Phone Tag | high | high | low | low |
| Fairy Tale | high | very low | medium | high |
| Time Travel | medium | low | medium | high |
| Fantasy Fiction | high | high | high | very low |
| Horror Story | medium | very high | high | low |
| Parallel Saga | low | low | high | high |
| Anthology Saga | very low | high | high | very high |

Recommended: Fairy Tale (simplest) and Parallel Saga (scalable). Avoid: Fantasy Fiction and Horror Story (async + atomic = distributed locking nightmare).

**Epic Saga pitfalls**: no isolation (intermediate states visible); side effects during compensation (emails sent, cannot be unsent); compensation failures (compensating transactions can themselves fail).

**Saga state machines**: model each saga as an FSM with explicit state transitions; preferred over compensating transaction chains for responsiveness and debuggability.

**Saga annotation technique**: Java/C# annotations/attributes declaring which saga types a service participates in — governance and traceability mechanism.

See [[patterns/saga]].

### Chapter 13 — Contracts

Contracts are defined broadly: any format used by parts of an architecture to convey information or dependencies — covering protocols, schemas, library interfaces, event formats.

**Strict vs loose spectrum**: strict = exact name/type/order (gRPC/Protobuf, RMI); loose = name-value pairs (JSON), REST resources, GraphQL. Strict = guaranteed fidelity + tight coupling; loose = decoupled + requires fitness functions.

**Consumer-driven contracts**: the consumer specifies what it needs from the provider; provider runs consumer tests as CI gates. Solves the loose coupling + contract fidelity tension. Requires engineering maturity. Pact is the canonical framework.

**Stamp coupling**: passing a large data structure when only a small portion is needed. Anti-pattern when over-specified (brittleness, bandwidth). Legitimate use: workflow state management in choreography (embed full workflow state in each message so the next service can continue the workflow).

See [[concepts/contracts]].

### Chapter 14 — Managing Analytical Data

Three-generation evolution of analytical data patterns:

1. **Data Warehouse**: ETL, Star Schema, centralised; good for historical analysis; fails in distributed architectures due to integration brittleness, domain knowledge fragmentation, and complexity
2. **Data Lake**: load-and-transform (reactive); stores raw data; better for ML; still technically partitioned; PII risks; data staleness; domain relationships hard to discover
3. **Data Mesh** (Zhamak Dehghani): applies microservices' domain partitioning to analytical data; four principles: domain ownership, data as product, self-serve platform, computational federated governance

**Data Product Quantum (DPQ)**: the core architectural unit; adjacent to and operationally separate from its cooperating service; three types: source-aligned, aggregate, fit-for-purpose; uses Parallel Saga or Anthology Saga for communication (always async + eventual, never transactional); governance sidecar embedded by the platform team.

**Cooperative quantum**: the DPQ and its service form a cooperative pair — operationally independent but tightly contract-coupled to each other, loosely coupled to the analytics quantum.

See [[concepts/data-mesh]].

### Chapter 15 — Build Your Own Trade-Off Analysis

Methodological chapter synthesising the book's approach into a repeatable process.

**Three-step trade-off analysis process:**
1. *Find entangled dimensions*: what forces are coupled in this problem? (For the book: communication × consistency × coordination)
2. *Analyse coupling points*: model possible combinations; build a coupling/characteristic matrix
3. *Assess trade-offs*: iterate with "what-if" scenario modeling; fix the most fundamental dimension first, then iterate

**Key techniques:**
- **Qualitative vs quantitative**: architecture trade-offs are almost always qualitative; build comparative assessments from multiple examples rather than seeking numerical metrics
- **MECE lists** (Mutually Exclusive, Collectively Exhaustive): compare like-for-like; don't compare a message queue to an ESB; ensure you've covered the full option space
- **Out-of-context trap**: generic trade-off analysis may point to solution X, but specific domain context may reverse the decision entirely; always add context-specific scenarios
- **Model relevant domain scenarios**: build specific "what-if" topologies for likely workflows before committing to an approach; iterative design reveals emergent trade-offs
- **Prefer bottom line over overwhelming evidence**: reduce analysis to 2-3 key stakeholder-level questions; eliminate technical jargon; focus nontechnical stakeholders on outcomes

**Key observation from the saga trade-off table**: direct inverse correlation between coupling level and scale/elasticity; higher coupling = worse responsiveness/availability (more services involved = more failure points). This pattern generalises beyond sagas.

## Notable Quotes

> "Don't try to find the best design in software architecture; instead, strive for the least worst combination of trade-offs." (ch. 1)

> "Moving the database within the service boundary moves data concerns into architecture concerns." (ch. 2)

> "If you follow that advice, everything will be so decoupled that nothing can communicate with anything else — it's hard to build software that way!" (ch. 2 — on the limits of the 'maximise decoupling' heuristic)

> "Most issues and challenges within distributed systems are typically not related to modularity, but rather granularity." (ch. 7)

## Related Pages

- [[concepts/architecture-quantum]] — significantly expanded by this book
- [[patterns/saga]] — 8 saga types taxonomy introduced here, detailed in ch. 12; full ratings table; orchestration/choreography trade-offs; saga FSM; Epic Saga pitfalls
- [[concepts/fitness-functions]] — additional real-world examples (Equifax, JDepend, ArchUnit, decomposition governance)
- [[concepts/adrs]] — used as the documentation format throughout the book
- [[concepts/architectural-decomposition]] — Ch 3–5: modularity drivers, decomposition approaches, six patterns
- [[concepts/service-granularity]] — Ch 7: disintegrators and integrators
- [[concepts/data-decomposition]] — Ch 6, 9, 10: data disintegrators/integrators, five-step process, database types, ownership patterns, eventual consistency patterns, distributed data access patterns
- [[concepts/reuse-patterns]] — Ch 8: four reuse techniques; core reuse principle
- [[patterns/sidecar-service-mesh]] — Ch 8: sidecar as reuse mechanism; operational-concerns-only constraint; orthogonal coupling
- [[concepts/contracts]] — Ch 13: strict/loose spectrum, stamp coupling, consumer-driven contracts
- [[concepts/data-mesh]] — Ch 14: Data Warehouse, Data Lake, Data Mesh, DPQ, cooperative quantum
- [[sources/fundamentals-of-software-architecture]] — the predecessor; SATH resolves problems FOSA could not
- [[sources/building-evolutionary-architectures]] — fitness functions originated here; SATH extends the governance framework

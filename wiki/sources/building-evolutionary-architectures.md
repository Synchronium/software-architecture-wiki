---
title: "Building Evolutionary Architectures"
type: source
tags: [evolutionary-architecture, fitness-functions, governance, coupling]
sources: [building-evolutionary-architectures]
created: 2026-05-13
updated: 2026-05-14
---

# Building Evolutionary Architectures

**Authors:** [[authors/neal-ford]], [[authors/rebecca-parsons]], [[authors/patrick-kua]]
**Published:** 2017
**Slug:** `building-evolutionary-architectures`

## Overview

*Building Evolutionary Architectures* is the originating text for the fitness function concept as applied to software architecture. Its central argument is that architectural governance must be continuous and automated, not episodic and manual. The book defines **evolutionary architecture** as an architecture that "supports guided, incremental change across multiple dimensions" — guided (not chaotic), incremental (not big-bang), across multiple dimensions (technical, data, security, performance, and more, not just structure).

Authored by three ThoughtWorks practitioners, the book draws on real-world migration and refactoring work across large enterprises. It is more prescriptive and practice-focused than [[sources/fundamentals-of-software-architecture]], which incorporates fitness functions as one governance subsystem; here they are the organising principle of the entire work.

The three pillars of evolutionary architecture:
1. **Incremental change** — small, safe changes supported by deployment pipelines and automated fitness functions
2. **Fitness functions** — any mechanism that provides objective assessment of an architectural property
3. **Appropriate coupling** — matching coupling to business context; inappropriate coupling is the root cause of non-evolvability

## Key Claims

- An evolutionary architecture supports guided, incremental change across multiple dimensions
- Fitness functions are any mechanism (test, metric, monitor, tool) that objectively assesses an architectural characteristic — the abstraction unifies previously ad-hoc tooling under one umbrella
- Inappropriate coupling is the primary cause of architectural non-evolvability; this includes code reuse abuse, vendor lock-in, and shared databases
- Team structure encodes itself in system structure (Conway's Law); the Inverse Conway Maneuver deliberately restructures teams to produce the desired architecture
- The architectural quantum is defined by bounded contexts (DDD) in microservices; smaller quanta enable faster cycle times but increase coordination cost — a sweet spot exists
- Duplication is preferable to coupling in microservices; the Code Reuse Abuse antipattern describes shared libraries that bind independent services together
- Cycle time is proportional to evolution speed: **v ∝ c**; fast deployment pipelines are a competitive business differentiator
- Fitness functions should be intentional (identified upfront for key dimensions), not emergent (discovered only after problems manifest)
- Transactions are the "strong nuclear force" binding quanta — 2PC across services effectively merges them into a single quantum

## Chapter Notes

### Chapter 1 — Software Architecture

Establishes evolvability as a new architectural "-ility" — and specifically as a **meta-characteristic** that wraps and protects all other characteristics. The bit-rot problem: architects design for scalability, security, and performance at project inception, but ongoing development erodes those qualities without active protection. Fitness functions are the protection mechanism.

The definition: "An evolutionary architecture supports guided, incremental change across multiple dimensions." Each word is deliberate — "evolutionary" was chosen over "adaptable" (no directionality), "emergent" (no guidance), "incremental" (only one of three pillars). Multiple dimensions: technical, data, security, operational — all must evolve, not just code structure.

Introduces the PenultimateWidgets example (a large widget retailer used throughout the book) and their Inverse Conway Moment: reorganising from functional silos (frontend/DBA/backend/ops) to cross-functional teams aligned to service boundaries. Changes that previously required cross-team coordination for simple domain changes became intra-team changes, dramatically reducing cycle time.

### Chapter 2 — Fitness Functions

Introduces the formal definition: "An architectural fitness function provides an objective integrity assessment of some architectural characteristic(s)."

The **system-wide fitness function** is the aggregate of all individual functions, providing a framework for trade-offs. When security and scalability fitness functions conflict (caching enables scale but introduces data staleness that fails the security fitness function), the system-wide function provides the language for resolving the conflict. It is not a numeric score; it is a governance framework.

Classification across five dimensions: atomic vs holistic, triggered vs continual, static vs dynamic, automated vs manual, temporal (license monitors, break-on-upgrade tests). Also: intentional vs emergent (emergent = governance failure), domain-specific (custom stress tests for high-security domains).

Priority tiers: **Key** (blocks promotion), **Relevant** (tracked, non-blocking), **Not Relevant** (excluded). Teams should identify fitness functions *before* first development iteration — identifying them early is far cheaper than retrofitting them. **Fitness Function Review**: a formal stakeholder meeting, held at least annually, to re-evaluate priority assignments and discover new dimensions.

### Chapter 3 — Engineering Incremental Change

Deployment pipelines vs CI servers: CI servers handle commit → test result; pipelines extend to commit → production. Pipeline stages are ordered by scope and cost — fast atomic functions first, slow holistic functions later. Fan-out (parallel execution within a stage) and fan-in (all must pass before proceeding) enable both speed and completeness.

**Feature toggles**: enable QA in production by hiding new features behind flags; QA team is granted access while normal users see the existing version. Enables continuous deployment of incomplete features safely.

**GitHub Scientist**: the canonical holistic+continual fitness function for refactoring. Runs old (control) and new (candidate) code paths simultaneously at a configured percentage of production traffic. The control value is always returned; the candidate runs out-of-band with results compared and divergences logged. GitHub used it to replace their shell-script-based Git merge implementation with libgit2 — 1% of production merges ran through the new implementation; after 4 days with zero divergences for 24 hours, the old code was removed. (See [[reference/technology-glossary]])

**Hypothesis-driven development**: replaces requirements with experiments. Capabilities are expressed as falsifiable hypotheses ("if we increase the image size, sales will increase by 5%"). A/B testing provides the measurement. Requires evolutionary architecture to support multiple simultaneous variants. The mobile.de case study: rather than debating three UI approaches, they built all three and let user behaviour decide (→ [[concepts/evolutionary-architecture]]).

### Chapter 4 — Architectural Coupling

Establishes the vocabulary: **module** = logical grouping of related code; **component** = physical packaging of a module; **quantum** = independently deployable unit with high functional cohesion (the full deployment unit including database and dependent infrastructure).

Evolvability ratings for each major architecture style:

| Style | Evolvability | Primary Limiting Factor |
|-------|-------------|------------------------|
| Big Ball of Mud | None | No coupling control |
| ESB-driven SOA | Poor | Central orchestration hub; vendor coupling |
| Mediator EDA | Low | Mediator reintroduces coupling |
| Layered monolith | Low–Medium | Technical partitioning; full deployment |
| Modular monolith | Medium | Single quantum; discipline must be enforced by fitness functions |
| Microkernel | Medium | Plug-in coupling through contracts |
| Service-based | Medium–High | Shared database; coarse quanta |
| Broker EDA | High | Decoupled event channels |
| Microservices | Highest | Maximum decoupling; fine-grained quanta |

Transactions as "strong nuclear force": two-phase commit across services effectively merges their quanta. Service-based architectures can support ACID transactions within coarse services — the pragmatic middle ground. Microservices require saga/eventual consistency.

**Modular monolith**: achieves domain isolation within a single deployable unit through disciplined coupling enforcement. The key insight: IDEs encourage imports that violate module discipline; coding standards alone fail; fitness functions (ArchUnit, JDepend) are required to prevent degradation. Recommended as the intermediate migration step before extracting services (→ [[styles/modular-monolith]]).

**Serverless architectures**: two forms — BaaS (Backend as a Service, wiring together third-party cloud services with little custom code) and FaaS (Function as a Service, stateless functions triggered by events, infrastructure fully managed). FaaS eliminates technical architecture, operational, and security dimensions from consideration — but shifts transactional coordination burden to the caller and suffers from the Last 10% Trap (most capabilities are easy; edge cases require painful workarounds).

**Service templates**: in microservices, each service needs monitoring, logging, auth, and other plumbing. Service templates (DropWizard, Spring Boot) encode these consistently across all services, managed by a platform/infrastructure team. Domain teams extend the template and write only business behaviour. When infrastructure upgrades occur, the template absorbs the change without requiring per-service coordination. This is "appropriate coupling" — coupling that provides architectural value without harming evolvability.

### Chapter 5 — Evolutionary Data

Three forms of inappropriate data coupling that resist evolution: **shared schema coupling** (multiple services sharing tables without ownership), **age/quality of legacy data** (historical schemas encoding defunct business logic in null patterns and inconsistent formats), and **vendor coupling** (proprietary SQL syntax coupling the schema to a specific database engine).

Inappropriate data coupling is the hardest form of coupling to address:
- **Shared schema coupling**: multiple services sharing tables without schema ownership
- **Age/quality of legacy data**: historical schemas encode past business logic in null patterns and inconsistent formats
- **Vendor coupling**: proprietary SQL syntax couples the schema to a specific database vendor

The **expand/contract pattern** enables zero-downtime schema evolution (see [[concepts/evolutionary-database-design]]). The three steps — expand (add new structure), migrate (dual-write + backfill consumers), contract (remove old structure) — never break any consumer at any step. The pattern applies to columns, tables, foreign keys, and denormalisation changes.

Three scenarios for shared database decomposition: (1) clean — no legacy data or integration points, straightforward table claim; (2) legacy data without integration points — use expand/contract at team's own pace; (3) legacy data with integration points — must introduce a service API seam first, migrate all consumers to use the API, then evolve the schema behind it. In Scenario 3, **database triggers** can serve as a temporary transition mechanism: insert-triggers populate the new schema from the old during the migration window, preserving both structures without changing consumer code until they are ready to migrate.

Database migrations should be treated as code: version-controlled, tested, applied sequentially in the deployment pipeline. Flyway (numbered scripts, immutable once applied) and Liquibase (change sets with optional rollback; checksummed) are the primary tools.

The **Reporting antipattern**: OLTP and OLAP in the same service create inadvertent coupling; analytical queries contend with transactional writes, schema changes for operational needs break analytical queries, and analysts couple directly to operational data models. Solution: separate reporting services with their own data stores, fed via event streaming or CDC from the operational service (→ [[streams/event-sourcing-cqrs]]).

### Chapter 6 — Building Evolvable Architectures

Three-step operationalisation: (1) identify dimensions affected by evolution, (2) define fitness functions for each dimension, (3) automate via deployment pipelines.

**Refactoring vs restructuring**: refactoring preserves external behaviour while improving internal structure (Martin Fowler's definition). Architectural changes are more properly called *restructuring* — they change the priorities and characteristics of the system, not just its internals. Fitness functions protect the existing architectural characteristics during restructuring (the GitHub Scientist case study from Ch 3 is the canonical example).

Guidelines:
- **Remove needless variability**: immutable infrastructure; snowflake servers (unique manual configurations) prevent reproducible deployments. The Knight Capital incident: one of eight servers was not updated, causing the old feature-flag path to re-activate on that server. $440M loss in 45 minutes. Snowflake servers + retained feature flags = latent catastrophe.
- **Make decisions reversible**: blue-green deployments, feature flags; feature flags accumulate technical debt — clean up promptly after each migration (Knight Capital as cautionary tale)
- **Prefer evolvable over predictable**: unknown unknowns dominate long-horizon planning; design for changeability, not predicted requirements
- **Build anticorruption layers JIT**: abstract external dependencies behind internal interfaces; delay commitment until the last responsible moment. The BackgrounDRb → Starling case: one ThoughtWorks project extracted a background job processing abstraction at the last responsible moment rather than coupling to a specific implementation upfront. When the third-party background job library changed its API, only the anticorruption layer needed updating, not every job implementation.
- **Build sacrificial architectures**: intentional throw-away systems for MVP and market validation; replace when validated. Twitter's first architecture was deliberately sacrificial — when the service grew beyond the prototype's capacity, they rebuilt. Fred Brooks' second system syndrome is the failure mode: over-engineering the replacement after a successful sacrifice.
- **Mitigate external change**: prefer pull updates (libraries) to push updates (frameworks); wrap transitive dependencies behind stable internal interfaces. The npm left-pad incident (2016): an 11-line utility package removal broke thousands of builds worldwide because projects directly depended on a package with no stable owner. Pull model: update libraries when *you* choose; push model (frameworks) requires updating when the framework provider decides.
- **Libraries vs frameworks**: libraries are passive (called by your code; update when you choose); frameworks are active (call your code via IoC/plugin interfaces; drive your architecture; update aggressively). Prefer libraries for non-differentiating concerns; accept framework coupling only where the framework provides significant value on all its dimensions.
- **Prefer Continuous Delivery over snapshots**: snapshots create speculative dependency updates and stale lockfiles; fluid dependencies (always latest) cause unpredictable breakage. CD forces regular integration and keeps the delta small.
- **Version services internally**: hide multiple API versions within the service; expose a stable external interface; support no more than two versions simultaneously; drive consumer migration before adding a third

### Chapter 7 — Evolutionary Architecture Pitfalls and Antipatterns

**Pitfall vs antipattern**: pitfalls are outcomes of well-intentioned but misapplied practices (easy to fall into, not obvious until you're in them); antipatterns are practices that seem beneficial but produce actively harmful results. The distinction matters because fixes differ — pitfalls require process adjustment; antipatterns require deliberate reversal.

| Name | Type | Summary |
|------|------|---------|
| Vendor King | Antipattern | Architecture coupled to a vendor's product roadmap; vendor constraints become architectural constraints |
| Leaky Abstractions | Pitfall | Abstractions that expose implementation details; all non-trivial abstractions eventually leak (Spolsky's Law); the "abstraction distraction antipattern" is a variant where developers chase abstraction purity at the expense of solving real problems |
| Last 10% Trap | Antipattern | Frameworks handling 90% elegantly but requiring painful workarounds for the remaining 10%; IBM San Francisco Project as example |
| Code Reuse Abuse | Antipattern | Shared libraries coupling microservices together; code reuse and code usability are *inversely proportional* — the more reusable a component must be, the less optimised it is for any specific use case; prefer duplication to coupling in distributed architectures |
| Resume-Driven Development | Pitfall | Selecting technologies for CV value rather than architectural fit |
| Inappropriate Governance | Antipattern | One-size-fits-all technology mandates; solution is **Goldilocks Governance**: maintain three approved technology stacks (simple/medium/complex) rather than a single standard; teams pick the level matching their service's complexity; the PenultimateWidgets case study tracks cycle time per tier as an atomic process-based fitness function — if any tier's cycle time exceeds a threshold, a fitness function alerts the enterprise architect |
| Reporting | Antipattern | OLTP and OLAP in the same service; analytical queries create inadvertent coupling; solution: event-stream the operational data to a separate denormalised reporting database owned by a reporting service |
| Planning Horizons | Pitfall | Sunk cost fallacy applied to architecture; irrational artifact attachment (continuing to invest in a failed architectural decision rather than restructuring) prevents needed change; Rumsfeld's "unknown unknowns" dominate long-horizon plans |
| Lack of Speed to Release | Pitfall | Slow cycle time is itself an architectural fitness function failure; if the pipeline takes too long, fitness functions are run less frequently, degrading their value; treat cycle time as a key process fitness function with an explicit threshold alert |

### Chapter 8 — Putting Evolutionary Architecture into Practice

**Organisational and team factors**: domain-centric cross-functional teams (business analyst, architecture, testing, operations, data) eliminate coordination friction. The goal is for the common unit of change — a business capability — to be handled entirely within one team. Traditional siloed teams mean a simple domain change requires cross-silo coordination (developers wait on DBAs; operations wait on developers), which Conway's Law predicts will produce coupling at those same seams.

**Product over project**: software *projects* have a lifecycle — team forms, builds, hands off to ops, disbands. Software *products* live forever: the team stays associated with the product, maintains ownership of quality metrics, and builds long-term pride. Amazon's **two-pizza teams** operationalise this: no team larger than can be fed by two pizzas; cross-functional; "you build it, you run it." When developers can look across the table at a tired colleague whose sleep they ruined with a 3 AM outage, social accountability replaces institutional accountability.

**Dealing with external change** — consumer-driven contracts as fitness functions: in microservices, consumers provide the provider with a suite of tests expressing what they need from the API. The provider runs all consumer test suites as fitness functions. Any provider change that breaks a consumer's tests fails the pipeline. This is the "engineering safety net" — integration protocol consistency enforced automatically without manual per-release coordination.

**Team coupling and culture**: [[concepts/conways-law]] and the Inverse Conway Maneuver; teams structured around service boundaries, not functional skills. Goldratt's dictum: "Tell me how you measure me, and I will tell you how I will behave" — architects must design metrics and incentives deliberately. Culture of experimentation: kaizen (continuous improvement), spike solutions (XP throw-away experiments for learning), set-based development (explore multiple approaches in parallel for a few days), 20% time / hackathons, hypothesis-driven development (→ [[concepts/evolutionary-architecture]]).

**Enterprise fitness functions**: enterprise architects inject cross-cutting fitness functions into a shared deployment pipeline template that all services inherit — security scans, license legality monitors (temporal), compliance checks. Teams add service-specific fitness functions on top. The PenultimateWidgets platform case study: selling the platform to third parties with its deployment pipeline and embedded fitness functions; certification requires preserving the existing fitness functions.

**Starting points**: (1) *low-hanging fruit* — least coupled, not on critical path; use as proof of concept; gather before/after metrics ("demonstration defeats discussion"); (2) *highest value first* — validate the approach against the most critical part; (3) *testing first* — add coarse-grained functional tests before restructuring, not as a standalone project; (4) *infrastructure first* — if DevOps is broken (outsourced ops, dev/ops firewall, massive technical debt), address it first.

**Business case**: cycle time as competitive differentiator (3-hour vs 6-week cycle time); scale (coupling at any point eventually limits scale — Amazon's monolith-to-microservices as example); advanced capabilities (A/B testing, hypothesis-driven development) only possible with evolvable architecture; reduced risk through incremental change.

**When NOT to build evolutionary architecture**: irredeemable Big Ball of Mud (restructuring costs more than rewriting); other characteristics dominate (LMAX — 6 million transactions/second on a single Java thread by fitting logic in CPU cache — sacrifices evolvability for performance); deliberate sacrificial architecture; planning to close the business.

**Convincing others** — consulting judo: don't lecture; find a pain point, fix it as an exemplar, then demonstrate. The QA environment case study: instead of arguing about DevOps practices, one consultant found that QA environments were the universal pain point, automated provisioning with modern tooling, and demonstrated that both objections ("we don't have time" and "our setup is too complex") were false. Demonstration defeats discussion.

**Future directions**: AI-based fitness functions looking for anomalous architectural behaviour; generative testing (run large numbers of tests, capture outcomes, apply statistical analysis to find unexpected edge cases — complements traditional assertion-based tests).

## Notable Quotes

> "An evolutionary architecture supports guided, incremental change across multiple dimensions." (Ch 1)

> "Transactions represent the strong nuclear force in architecture — they bind architectural quanta together." (Ch 4)

> "Cycle time proportional to evolution speed: v ∝ c." (Ch 3)

> "Tell me how you measure me, and I will tell you how I will behave." — Dr. Eliyahu M. Goldratt (cited Ch 8)

> "Demonstration defeats discussion." (Ch 8)

## Related Pages

- [[concepts/fitness-functions]] — the core governance mechanism introduced by this book
- [[concepts/evolutionary-architecture]] — the broader concept; evo-arch is now the primary source
- [[concepts/architecture-quantum]] — quantum size, bounded context as quantum boundary, cost sweet spot
- [[concepts/deployment-pipelines]] — the automation mechanism for fitness functions
- [[concepts/conways-law]] — team structure → system structure; Inverse Conway Maneuver
- [[concepts/evolutionary-database-design]] — expand/contract, schema migration tools, shared DB decomposition
- [[styles/modular-monolith]] — introduced as a pattern in Ch 4
- [[authors/neal-ford]]
- [[authors/rebecca-parsons]]
- [[authors/patrick-kua]]

---
title: "Decomposition Strategy: How Far to Break Up a System"
type: comparison
tags: [decomposition, microservices, monolith, service-based, modularity, migration]
sources: [fundamentals-of-software-architecture, monolith-to-microservices, software-architecture-the-hard-parts, building-evolutionary-architectures, team-topologies, learning-domain-driven-design]
created: 2026-05-18
updated: 2026-05-29
---

# Decomposition Strategy: How Far to Break Up a System

The most common architectural mistake is decomposing too eagerly — reaching for microservices before the team has the domain knowledge, operational maturity, or organisational structure to benefit from them. The second most common mistake is not decomposing at all, letting a monolith accumulate until change is nearly impossible.

This page answers: **given where you are now, how far should you decompose, and what should drive the decision?**

## The Decomposition Spectrum

```
Layered monolith → Modular monolith → Service-based → Microservices
  (technical          (domain-logical     (domain-physical   (domain-physical
   partitioning)       partitioning,        partitioning,      partitioning,
                       single deploy)       shared DB)         independent DBs)
```

Each step increases operational complexity and coupling flexibility; each step requires more maturity to execute correctly. The right position is the one your team can maintain, not the most sophisticated one you can envision.

## Decision Factors

### 1. Domain understanding

**Don't decompose what you don't understand.** Premature service boundaries cut across the wrong seams, creating coupling that is harder to fix than a monolith — distributed coupling. (→ [[sources/monolith-to-microservices]] ch. 3)

Heuristic: if you cannot draw the bounded context map with reasonable confidence, stay in a monolith. Modularise within the monolith to discover the real boundaries. Extract services only when the boundaries are stable.

> "If you can't build a monolith, what makes you think microservices are the answer?" — Simon Brown (cited in → [[sources/building-evolutionary-architectures]] ch. 4)

### 2. Team structure and size

Conway's Law is a constraint, not a suggestion (→ [[concepts/conways-law]]). Services decompose along team boundaries whether you plan for it or not. The relevant question is: does your team structure *support* the decomposition you're considering?

Team Topologies guidance (→ [[sources/team-topologies]]): a service or bounded context should be ownable by a single stream-aligned team without exceeding that team's cognitive load capacity. The two-pizza rule is an approximation — the real constraint is Dunbar's number and the complexity of the domain the team must hold in mind.

- **Monolith or modular monolith**: appropriate for a single team or two small teams with shared domain ownership
- **Service-based**: 4–8 teams, each owning a coarse domain (OrderService, CatalogService, etc.)
- **Microservices**: many autonomous teams, each owning end-to-end a narrow capability; requires strong platform support

### 3. Operational maturity (DevOps capability)

Distributed systems require significantly more operational sophistication: distributed tracing, per-service deployment pipelines, service discovery, health checks, circuit breakers, distributed configuration, container orchestration. Teams that lack this capability will spend more time operating the distributed system than building features.

The DORA four key metrics (→ [[concepts/four-key-metrics]]) are a good proxy: if deployment frequency is low (monthly or quarterly), a distributed architecture will not improve it — the bottleneck is process and culture, not the architecture.

- **Low DevOps maturity**: modular monolith or service-based; extract services only as capability grows
- **High DevOps maturity**: microservices are viable; the operational overhead is managed, not feared

### 4. Transaction requirements

ACID transactions are local to a single process and database. Decomposing across databases requires sagas for any multi-step operation that must remain consistent — adding significant complexity and losing isolation guarantees (→ [[distributed/distributed-transactions]], [[patterns/saga]]).

Key question: does your domain require strong transactional consistency *across* the proposed service boundaries?

- **Yes, frequently**: stay at service-based architecture (shared database preserves ACID)
- **Yes, occasionally**: service-based or microservices with saga patterns for the cross-boundary cases
- **No, or eventual consistency is acceptable**: microservices are viable

Richards & Ford's warning (→ [[sources/fundamentals-of-software-architecture]] ch. 17): if sagas are the dominant feature of your microservices design, the service boundaries are wrong. Fix granularity before reaching for saga.

### 5. Scalability and elasticity requirements

- **Uniform scaling** (the whole system scales together): monolith is fine; adding replicas of a stateless monolith is straightforward
- **Independent scaling of specific capabilities**: service-based or microservices — you can scale the OrderService without scaling the ReportingService
- **Extreme elasticity / spike workloads**: microservices or space-based architecture (→ [[styles/space-based-architecture]])

Do not decompose for scalability you don't have evidence you need. Premature decomposition is a real cost; defer it until you have load data.

## What Each Style Gives You

| | Modular Monolith | Service-Based | Microservices |
|---|---|---|---|
| Quanta | 1 | Few (2–5) | Many (1 per service) |
| DB strategy | Single DB, logical partitioning | Shared DB (federated schemas) | Independent DB per service |
| ACID transactions | Full ACID | Full ACID within a service | Local only; cross-service needs saga |
| Deployment unit | Whole system | Per service (4–12 services) | Per service (potentially 100+) |
| Operational overhead | Low | Medium | High |
| Team structure | 1–2 teams | Domain teams (one per service) | Many autonomous teams |
| DevOps maturity needed | Low | Medium | High |
| Scalability | Uniform | Per-service (coarse) | Per-service (fine) |
| Service granularity | N/A | Coarse (entire domain) | Fine (narrow capability) |
| Suitable for ACID across domains? | Yes | Yes | No |

## Migration: Recommended Path

The recommended progression (→ [[sources/building-evolutionary-architectures]] ch. 4, [[sources/monolith-to-microservices]] ch. 2):

**Step 1 — Modularise in place.** Impose domain boundaries within the existing monolith. Use fitness functions (ArchUnit, etc.) to enforce module isolation. This reveals where the true coupling lies — and much of it is unexpected. This step is required before extraction; skipping it means extracting along the wrong boundaries.

**Step 2 — Extract to service-based.** Once domain modules are clean, extract the highest-value or highest-change-rate module as a coarse service. Keep the shared database. Validate deployment, observability, and team ownership patterns at this smaller scale.

**Step 3 — Split the database (only when needed).** Splitting the database is the hardest step — it forces you to address data ownership, eventual consistency, and saga patterns. Don't do it before you need to. Newman's heuristic (→ [[sources/monolith-to-microservices]] ch. 4): split the application code first; split the database only when independent scaling or team autonomy genuinely requires it.

**Step 4 — Fine-grained extraction.** Only once team structure, operational maturity, and domain understanding are in place. Each fine-grained service should be small enough for one team to hold its full context, and independently deployable without coordinating with other teams.

## The Ferrari Anti-Pattern

Richards & Ford name this: using the most powerful architecture style (microservices, event-driven) for a problem that doesn't warrant it. A system that doesn't need 99.99% availability, independent scalability of 50+ services, or 20 autonomous teams gains nothing from microservices — and pays all the costs (→ [[sources/fundamentals-of-software-architecture]] ch. 9).

Choose the **least complex architecture that satisfies your actual requirements**, not the most sophisticated one you can imagine needing.

## Granularity Within Microservices

Once you've committed to microservices, granularity is a second decomposition decision. The disintegrators (reasons to split) and integrators (reasons to keep together) framework from SATH (→ [[concepts/service-granularity]]):

**Disintegrators** (reasons to split a service):
- Service scope / single-purpose principle
- Code volatility — some parts change far more frequently than others
- Scalability — different parts need to scale independently
- Fault tolerance — a failure in one part shouldn't take down the others
- Security — parts with different access control requirements
- Extensibility — parts that need to be independently extended or replaced

**Integrators** (reasons to keep services together):
- Database transactions — if two operations must be atomic
- Workflow and choreography — splitting creates saga complexity where none existed
- Shared code — if the shared code changes as frequently as the consuming code, it's not really reusable
- Data relationships — if the data is tightly joined and the join crosses a service boundary on every request

> Key insight from SATH: **volatility-based decomposition is the strongest decomposition driver**. The parts of a system that change together should deploy together. Parts that change independently should deploy independently.

## How Sources Frame the Decision

| Source | Primary lens | Key contribution |
|--------|-------------|-----------------|
| [[sources/fundamentals-of-software-architecture]] | Architecture characteristics | Match style to explicit requirements; Ferrari anti-pattern; never use saga as the dominant pattern |
| [[sources/monolith-to-microservices]] | Migration sequencing | Modularise first, extract second, split DB last; fracture planes as natural seams |
| [[sources/software-architecture-the-hard-parts]] | Granularity trade-offs | Disintegrators vs integrators; volatility as primary decomposition driver; MTTS metric |
| [[sources/building-evolutionary-architectures]] | Evolutionary path | Modular monolith as recommended intermediate; fitness functions to enforce boundaries |
| [[sources/team-topologies]] | Organisational constraints | Conway's Law as a hard constraint; cognitive load as the real boundary determinant |
| [[sources/learning-domain-driven-design]] | Domain boundaries | Bounded context as the unit of decomposition; subdomains as safe granularity heuristic |

## Related Pages

- [[styles/modular-monolith]] — the recommended starting point and intermediate step
- [[styles/service-based-architecture]] — pragmatic middle ground; ACID-preserving
- [[styles/microservices-architecture]] — maximum decomposition; maximum autonomy; maximum cost
- [[concepts/service-granularity]] — disintegrators, integrators, and granularity trade-offs
- [[concepts/fracture-planes]] — eight natural decomposition seams
- [[concepts/architectural-decomposition]] — decomposition patterns and six-pattern taxonomy
- [[concepts/evolutionary-database-design]] — database decomposition patterns
- [[concepts/conways-law]] — why team structure determines service boundaries
- [[comparisons/migration-pattern-selection]] — pattern selection during the decomposition itself (strangler, branch by abstraction, parallel run)
- [[patterns/strangler-fig]] — primary extraction migration pattern
- [[distributed/distributed-transactions]] — what you lose when you split databases

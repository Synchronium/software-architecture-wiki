---
title: "Service-Based Architecture"
type: style
tags: [architecture, distributed, services, domain-partitioning, pragmatic]
sources: [fundamentals-of-software-architecture]
created: 2026-05-13
updated: 2026-05-14
---

# Service-Based Architecture

## Definition

Service-based architecture is a distributed style that decomposes a system into a small number of coarse-grained domain services (typically 4–12, average 7) — "portions of an application" — that share one or more databases and are accessed through a user interface layer. It is described as a *hybrid of microservices*: pragmatically gaining deployment independence and domain isolation without the operational overhead of fine-grained services. (→ [[sources/fundamentals-of-software-architecture]]) Services deploy like traditional monolithic applications (EAR/WAR/assembly); containerization is possible but not required.

## Topology

```
┌──────────────────────────────────────────────┐
│              User Interface                  │
└───────────────────────┬──────────────────────┘
                        │ (API layer, optional)
        ┌───────────────┼──────────────────┐
        ▼               ▼                  ▼
[OrderService]  [CatalogService]  [AccountService]
        │               │                  │
        └───────────────┼──────────────────┘
                        ▼
              ┌─────────────────┐
              │  Shared DB(s)   │
              └─────────────────┘
```

**Services**: each service is coarse-grained, encompassing an entire domain workflow (Order service handles all of ordering — placement, fulfilment, cancellation). Services are independently deployable. Interservice communication is generally avoided; the shared database and coarse granularity mean services can usually complete a business transaction internally. Each domain service contains an API access facade layer that orchestrates the internal business request; this internal class-level orchestration contrasts with the external service orchestration required in microservices.

**Database**: typically a shared relational database, though services can have logical partitioning (separate schemas or table groups per service). Domain service tables can be segregated using database partitioning to prevent cross-service data leakage while keeping one physical database. Federation — multiple separate databases, one per service — is possible but uncommon in this style (that tends toward microservices).

**Database entity objects / shared libraries**: shared class files representing DB schemas can be organised as:
- *Single shared library* (anti-pattern): any DB table change requires redeploying every service, regardless of whether it accesses that table. Causes excessive coordination.
- *Federated shared libraries* per logical database domain (preferred): changes to a table impact only the services using the corresponding library. Tip: make logical DB partitions as fine-grained as possible while maintaining coherent data domains.

**User interface**: a single monolithic UI or federated UI domains matching each service. Can include an optional API gateway.

**Optional API layer**: a reverse proxy or API gateway between UI and services — useful for externalising cross-cutting concerns (metrics, security, auditing, service discovery) without embedding them in the UI.

**Service design internally**: each domain service can be designed as a layered architecture (API facade + business + persistence) or domain partitioned (sub-domains within the service, similar to a modular monolith). This is a per-service design decision.

## ACID vs BASE: The Central Service-Based Trade-off

Because domain services are coarse-grained and share a database, ACID transactions (commit/rollback) work within a single service. In microservices with fine-grained services, ACID is local-only — cross-service operations require BASE (Basic availability, Soft state, Eventual consistency) and saga patterns. (→ [[sources/fundamentals-of-software-architecture]])

Catalogue checkout example: if a credit card is expired in service-based architecture, the entire atomic operation rolls back cleanly. In microservices, the order has already been inserted into the order table before the payment service is invoked — producing inconsistent state that requires compensating sagas.

Trade-off: coarser-grained services preserve ACID but increase the testing scope of any change (a change to order placement requires testing the entire OrderService including payment processing).

## Orchestration vs Choreography

These coordination patterns become important as services become more fine-grained:
- **Orchestration**: a separate mediator service controls and manages the workflow (conductor model — central coordinator).
- **Choreography**: services communicate directly without a central mediator (dancer model — each service reacts to events from others).

Service-based architecture largely avoids the need for either because coarse-grained services handle multi-step operations internally. At the UI or API gateway level, occasional two-service orchestration may still require sagas/BASE.

## When to Use

- Teams that want significantly more agility and deployability than a monolith but lack the DevOps maturity or organisational structure for microservices.
- Systems that need ACID transactions across domain operations — shared databases enable transactions without saga patterns.
- Brownfield migration: each legacy monolith layer becomes a coarse-grained service.
- Organisations structured around domain teams (4–8 developers each owning a service).
- Domain-driven design contexts: coarse-grained services map naturally to DDD bounded contexts.
- When microservices or event-driven architecture would be overkill — the Ferrari analogy: using the most powerful distributed style for a system that doesn't need it wastes resources and adds complexity.

## Architecture Characteristics Ratings

| Characteristic | Rating | Notes |
|----------------|--------|-------|
| Deployability | ★★★★☆ | Each service deploys independently |
| Elasticity | ★★☆☆☆ | Coarse services are expensive to spin up; fine-grained scaling not possible |
| Evolutionary | ★★★☆☆ | Domain services can evolve independently within their boundary |
| Fault tolerance | ★★★★☆ | One failing service does not bring down the system |
| Modularity | ★★★★☆ | Good domain isolation; shared database is the main coupling point |
| Overall cost | ★★★☆☆ | Moderate — distributed overhead without extreme service proliferation |
| Performance | ★★★☆☆ | Fewer network hops than microservices; shared DB avoids chatty calls |
| Reliability | ★★★★☆ | Services are independently reliable |
| Scalability | ★★★☆☆ | Services can be independently scaled (within coarse-service limits) |
| Simplicity | ★★★☆☆ | Simpler than microservices; more complex than a monolith |
| Testability | ★★★★☆ | Services can be tested independently |

## Trade-offs

**Strengths:**
- Supports ACID transactions via shared database — no saga pattern required for most operations.
- Realistic for teams transitioning from monoliths: a small number of services is operationally manageable.
- High testability and deployability without the operational complexity of 100+ microservices.
- Pragmatic convergence of domain partitioning benefits with manageable complexity.

**Weaknesses:**
- Shared database creates schema coupling — database changes must be coordinated across services.
- Elasticity is limited: services are coarse-grained, so spinning up a new instance adds significant memory/CPU.
- Cannot independently scale sub-domain workflows within a service.
- Service-to-service communication via shared database is a coupling anti-pattern that must be avoided.

## Quanta

Multiple quanta possible: each coarse-grained service can be an independent quantum if it has distinct operational characteristics. In practice, many deployments operate as a small number of quanta (the services sharing a database may form a single logical quantum).

## Partitioning

Domain (each service corresponds to a business capability).

## Quanta in Practice

Even though there may be 4–12 separately deployed services, if they all share a database and a UI, the entire system is **one quantum**. (→ [[sources/fundamentals-of-software-architecture]]) As the database and UI are federated, the quantum count rises. Electronics recycling example: two quanta — (1) customer-facing (Quoting + ItemStatus services with their own UI and DB) and (2) internal operations (Receiving + Assessment + Accounting + Recycling + Reporting with a shared internal DB, even though these are separately deployed services).

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Positions as the pragmatic sweet spot for many organisations; emphasises its suitability for teams wanting agility without full microservices complexity |

## Related Pages

- [[styles/microservices-architecture]] — the next step: fine-grained services, no shared database, maximum quanta
- [[styles/layered-architecture]] — the typical starting point before migrating to service-based
- [[distributed/distributed-transactions]] — service-based architectures can use ACID transactions; microservices cannot
- [[comparisons/architecture-styles-comparison]] — side-by-side ratings
- [[comparisons/decomposition-strategy]] — how far to decompose; decision factors; recommended migration path
- [[styles/architecture-styles]] — overview and decision guide for all architecture styles

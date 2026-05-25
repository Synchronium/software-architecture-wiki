---
title: "Layered Architecture"
type: style
tags: [architecture, monolith, technical-partitioning, n-tier]
sources: [fundamentals-of-software-architecture, software-architecture-patterns, domain-driven-design, patterns-of-enterprise-application-architecture]
created: 2026-05-13
updated: 2026-05-17
---

# Layered Architecture

## Definition

The layered (n-tier) architecture organises code into horizontal technical layers — typically presentation, business, persistence, and database. Each layer has a specific technical role, and requests flow downward through the layers.

Also known as: *n-tier architecture*, *multi-tier architecture*.

The layered style is the natural outcome of technically-partitioned organisations ([[concepts/conways-law]]): UI developers, backend developers, rules developers, and DBAs map directly to the four standard layers. This is why it is the most common "accidental architecture" — teams that don't consciously choose a style tend to produce this one. (→ [[sources/fundamentals-of-software-architecture]])

## Topology

```
┌─────────────────────────┐
│    Presentation Layer   │  (web/API, UI)
├─────────────────────────┤
│    Business Layer       │  (domain logic, rules)
├─────────────────────────┤
│    Persistence Layer    │  (ORM, data access)
├─────────────────────────┤
│    Database Layer       │  (SQL/NoSQL)
└─────────────────────────┘
```

**Closed layers**: a request in the presentation layer must pass through every layer below it in order. Enforces the **layers of isolation** principle — each layer is isolated from all layers except its immediate neighbours. This allows any layer to be replaced without impacting others (e.g., swapping JSF for React.js without touching the business layer), provided contracts between layers remain unchanged.

**Open layers**: a layer can be bypassed. Used for shared services, e.g., a shared utilities layer with audit/logging classes that any layer can call directly. Without an open layer, the business layer would need to route through the persistence layer to reach such utilities — unnecessary coupling. Failing to document which layers are open vs closed produces brittle, tightly coupled systems.

**Architecture sinkhole anti-pattern**: requests pass through every layer as simple pass-throughs with no business logic performed — pure object instantiation and forwarding with no added value. This wastes memory and degrades performance. Heuristic (the 80–20 rule): if ≤20% of requests are sinkholes, acceptable. If 80%+ are sinkholes, the layered architecture is wrong for this problem domain or all layers should be made open. (→ [[sources/fundamentals-of-software-architecture]], [[sources/software-architecture-patterns]])

The historical *fast-lane reader pattern* (early 2000s) allowed the presentation layer to bypass intermediate layers for simple data retrieval — a pragmatic workaround for the sinkhole problem, at the cost of isolation.

## Physical Deployment Variants

Three variants are common:
1. Presentation + business + persistence in one deployment unit; database layer as an external database.
2. Presentation in its own deployment unit; business + persistence combined; separate external database.
3. All four layers in a single deployment (including an embedded or in-memory database) — common for on-prem products delivered to customer sites.

## When to Use

- Small, simple applications with a single domain and a limited team.
- Budget-constrained projects needing the simplest possible architecture.
- Systems where time-to-market is secondary to low operational complexity.
- Brownfield migration starting point — legacy systems most commonly use this style.
- As a starting point while evaluating whether a different style is needed. If beginning as layered while assessing microservices, keep inheritance shallow and reuse minimal to preserve the ability to migrate. Do not let the layered structure calcify.

## Architecture Characteristics Ratings

| Characteristic | Rating | Notes |
|----------------|--------|-------|
| Deployability | ★☆☆☆☆ | All-or-nothing deploys; every change requires a full release |
| Elasticity | ★☆☆☆☆ | Cannot scale individual layers independently |
| Evolutionary | ★☆☆☆☆ | Technical coupling makes large-scale change expensive |
| Fault tolerance | ★☆☆☆☆ | Single point of failure for the entire system |
| Modularity | ★☆☆☆☆ | Technical partitioning scatters a domain across all layers |
| Overall cost | ★★★★★ | Cheapest architecture to build and maintain initially |
| Performance | ★★☆☆☆ | Layer traversal adds overhead; cannot isolate hot paths |
| Reliability | ★★★☆☆ | Monolithic deployment is predictable once running |
| Scalability | ★☆☆☆☆ | Must scale the entire application even for one hot layer |
| Simplicity | ★★★★★ | Universally understood; easy to onboard |
| Testability | ★★☆☆☆ | Large monolith makes isolation testing hard |

## Trade-offs

**Strengths:**
- Extreme simplicity — universally understood by developers.
- Lowest initial cost — no infrastructure complexity.
- Good starting point for applications that may not need to scale.

**Weaknesses:**
- The *architecture by implication* and *accidental architecture* anti-patterns: teams that don't consciously choose a style produce layered architecture by default. Conway's Law reinforces this — technically structured organisations naturally build technically partitioned systems.
- Technical partitioning → changes to any business feature touch all layers → low agility.
- Cannot support differing architecture characteristics for different domains — the entire system shares one set of operational requirements (single [[concepts/architecture-quantum]]).
- The architecture sinkhole anti-pattern erodes performance.
- High MTTR: startup times of 2–15 minutes for large layered monoliths mean every incident has extended downtime. (→ [[sources/fundamentals-of-software-architecture]])

## Quanta

Single quantum. All components share a single deployment boundary and a single set of architecture characteristics.

## Partitioning

Technical (see [[concepts/technical-vs-domain-partitioning]]).

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Defines the style formally; warns against "architecture by implication"; introduces layers of isolation and the sinkhole anti-pattern |
| [[sources/software-architecture-patterns]] | Earlier (2015) treatment by the same author — establishes the closed/open layer distinction, layers of isolation concept, and 80/20 sinkhole heuristic; content superseded and expanded by FOSA |
| [[sources/patterns-of-enterprise-application-architecture]] | Fowler's originating treatment: names the three layers as Presentation, Domain, and Data Source; articulates the foundational rule that domain and data source must never depend on presentation; distinguishes layer (logical) from tier (physical); mentions Hexagonal Architecture as a symmetrical alternative; explicitly warns against distributing layers into separate processes — frames distribution as a "complexity booster" with a high cost in development and maintenance (ch. 1) |
| [[sources/learning-domain-driven-design]] | Frames layered architecture in the DDD context: distinguishes the *physical* layer (deployment) from the *logical* layer (code organisation); presents the standard three-layer model (PL → BLL → DAL) as the natural fit for transaction script and active record patterns; contrasts with ports and adapters (hexagonal) as the alternative for domain model patterns; reinforces the sinkhole concern — requests that flow through multiple layers with no meaningful transformation indicate the wrong architectural choice (ch. 8) |
| [[sources/domain-driven-design]] | Evans' original DDD framing: the domain layer is the only mandatory layer — it is where the model lives. The primary function of the other layers is to **isolate** the domain from UI, infrastructure, and application coordination concerns. Domain objects free of presentation and persistence responsibilities can be focused on expressing the model. Also describes the "Smart UI" as a deliberately non-layered alternative for simple, unsophisticated applications — valid in context, but incompatible with DDD and without a migration path to layered architecture. Warns against architectural frameworks that constrain domain design choices (ch. 4) |

## Related Pages

- [[concepts/technical-vs-domain-partitioning]] — layered is the canonical technically-partitioned style
- [[concepts/architecture-characteristics]] — layered scores lowest on most modern characteristics
- [[comparisons/architecture-styles-comparison]] — side-by-side with all other styles
- [[styles/service-based-architecture]] — a practical evolution of layered for teams wanting more agility without full microservices complexity
- [[concepts/model-driven-design]] — Evans' binding principle; layered architecture is the structural prerequisite for MODEL-DRIVEN DESIGN
- [[styles/ports-and-adapters]] — the DDD alternative for core subdomains; inverts the dependency direction layered architecture relies on
- [[patterns/business-logic-patterns]] — layered fits transaction script and active record; ports and adapters fits domain model
- [[patterns/mvc-web-presentation]] — MVC, Page Controller, Front Controller: the presentation layer patterns that sit at the top of a layered architecture
- [[styles/architecture-styles]] — overview and decision guide for all architecture styles

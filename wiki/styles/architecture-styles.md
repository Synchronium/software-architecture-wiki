---
title: "Architecture Styles"
type: style
tags: [trade-offs, microservices, monolith, distributed-systems, modularity]
sources: [fundamentals-of-software-architecture]
created: 2026-05-13
updated: 2026-05-13
---

# Architecture Styles

The eight architecture styles covered in this wiki represent the major structural approaches to organising a software system. Each is a distinct set of trade-offs across the [[concepts/architecture-characteristics]] that matter most for a given problem. Style selection is driven by which characteristics the system needs — not by fashion or familiarity. (→ [[sources/fundamentals-of-software-architecture]])

For full ratings across 11 characteristics and a detailed decision guide, see [[comparisons/architecture-styles-comparison]].

## The Eight Styles

| Style | Partitioning | Quanta | Relative Cost | Best Fit |
|-------|-------------|:------:|:-------------:|----------|
| [[styles/layered-architecture]] | Technical | 1 | ★★★★★ (cheapest) | Simplest viable system; budget-constrained |
| [[styles/pipeline-architecture]] | Technical | 1 | ★★★★ | ETL, data transformation pipelines |
| [[styles/microkernel-architecture]] | Domain | 1 | ★★★ | Product-based systems needing plug-in customisation |
| [[styles/service-based-architecture]] | Domain | 1–few | ★★★ | Pragmatic distributed; ACID transactions needed |
| [[styles/event-driven-architecture]] | Domain | Multiple | ★★★ | High scalability and elasticity; async workloads |
| [[styles/space-based-architecture]] | Domain | 1–few | ★★ | Extreme performance; high-concurrency spikes |
| [[styles/soa-architecture]] | Technical | Variable | ★ | Legacy enterprise (avoid for new systems) |
| [[styles/microservices-architecture]] | Domain | Many | ★ (most expensive) | Large teams; maximum agility; mature DevOps |

## Monolith vs Distributed

**Monolithic styles** — single deployment unit, single [[concepts/architecture-quantum]]:
- [[styles/layered-architecture]] — simplest; technical partitioning
- [[styles/pipeline-architecture]] — ETL-oriented; technical partitioning
- [[styles/microkernel-architecture]] — plug-in extensibility; always one quantum

**Distributed styles** — multiple deployment units, multiple quanta possible:
- [[styles/service-based-architecture]] — coarse-grained services; pragmatic middle ground
- [[styles/event-driven-architecture]] — asynchronous; highest elasticity
- [[styles/space-based-architecture]] — in-memory data grid; extreme throughput
- [[styles/soa-architecture]] — orchestration-driven; legacy pattern
- [[styles/microservices-architecture]] — fine-grained; maximum modularity

Every distributed style pays the [8 Fallacies of Distributed Computing](comparisons/architecture-styles-comparison.md) tax — design explicitly for unreliable networks, latency, and partial failures.

## Technical vs Domain Partitioning

The [[concepts/technical-vs-domain-partitioning]] decision is the most important early structural choice:

**Technical partitioning** groups components by role (presentation, business, persistence). Shared changes cross layers. Examples: layered, pipeline, SOA.

**Domain partitioning** groups components by business capability. Changes are localised to a domain. Examples: microkernel, service-based, event-driven, space-based, microservices.

Domain partitioning has better agility; technical partitioning has lower initial complexity.

## Primary Decision Rule

> Ask first: does the system require multiple sets of [[concepts/architecture-characteristics]] for different parts? If yes, a distributed style is required. If no, a monolith is viable and usually preferable.

See the full decision guide in [[comparisons/architecture-styles-comparison]].

## Style Evolution Paths

Most systems start simpler and migrate toward higher agility as team and operational maturity grows:

- Layered → Service-Based: split into 4–12 domain services; keep shared DB initially
- Service-Based → Microservices: split databases; increase granularity; add DevOps automation
- Layered → Modular Monolith: add domain partitioning within a single deployment as an intermediate step

The [[concepts/evolutionary-architecture]] and strangler fig pattern provide the migration mechanics.

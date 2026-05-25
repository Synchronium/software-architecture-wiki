---
title: "Architecture Styles Comparison"
type: comparison
tags: [trade-offs, microservices, monolith, distributed-systems]
sources: [fundamentals-of-software-architecture]
created: 2026-05-13
updated: 2026-05-13
---

# Architecture Styles Comparison

> For navigation and high-level descriptions of each style, see [[styles/architecture-styles]].

> Ratings are qualitative (★☆☆☆☆ to ★★★★★) based on Richards & Ford's scorecards in [[sources/fundamentals-of-software-architecture]], Ch 10–17. These reflect the *inherent tendencies* of each style — individual implementations can deviate based on design choices.

## At-a-Glance Ratings

| Characteristic | Layered | Pipeline | Microkernel | Svc-Based | Event-Driven | Space-Based | SOA | Microservices |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Deployability | ★ | ★★ | ★★★ | ★★★★ | ★★★ | ★★★ | ★ | ★★★★★ |
| Elasticity | ★ | ★★ | ★★ | ★★ | ★★★★★ | ★★★★★ | ★★ | ★★★★★ |
| Evolutionary | ★ | ★★★ | ★★★ | ★★★ | ★★★★ | ★★ | ★ | ★★★★★ |
| Fault Tolerance | ★ | ★ | ★★ | ★★★★ | ★★★★★ | ★★★ | ★★★ | ★★★★ |
| Modularity | ★ | ★★★ | ★★★ | ★★★★ | ★★★★ | ★★ | ★ | ★★★★★ |
| Overall Cost | ★★★★★ | ★★★★ | ★★★ | ★★★ | ★★★ | ★ | ★ | ★★ |
| Performance | ★★ | ★★ | ★★★ | ★★★ | ★★★★ | ★★★★★ | ★★ | ★★ |
| Reliability | ★★★ | ★★★ | ★★★ | ★★★★ | ★★★★ | ★★★ | ★★★ | ★★★★ |
| Scalability | ★ | ★★ | ★★ | ★★★ | ★★★★★ | ★★★★★ | ★★★ | ★★★★★ |
| Simplicity | ★★★★★ | ★★★★ | ★★★ | ★★★ | ★ | ★ | ★ | ★ |
| Testability | ★★ | ★★★ | ★★★ | ★★★★ | ★★ | ★ | ★★ | ★★★★★ |

## Key Dimensions

### Monolith vs Distributed

**Monolithic styles** (single deployment unit, single quantum):
- [[styles/layered-architecture]] — technical partition, simplest
- [[styles/pipeline-architecture]] — technical partition, ETL-oriented
- [[styles/microkernel-architecture]] — domain partition, customisability-focused

**Distributed styles** (multiple deployment units, multiple quanta possible):
- [[styles/service-based-architecture]] — 4–12 coarse domain services; pragmatic
- [[styles/event-driven-architecture]] — async event-driven; highest elasticity/scalability
- [[styles/space-based-architecture]] — in-memory grid; extreme performance
- [[styles/soa-architecture]] — orchestration-driven; legacy enterprise pattern
- [[styles/microservices-architecture]] — fine-grained; maximum agility

### Technical vs Domain Partitioning

| Technical Partitioning | Domain Partitioning |
|------------------------|---------------------|
| Layered | Microkernel |
| Pipeline | Service-Based |
| SOA | Event-Driven |
| | Space-Based |
| | Microservices |

(See [[concepts/technical-vs-domain-partitioning]])

### Architecture Quanta Count

| Style | Quanta |
|-------|--------|
| Layered | 1 |
| Pipeline | 1 |
| Microkernel | 1 (always) |
| Service-Based | 1–few (coarse services) |
| SOA | Variable (typically few) |
| Event-Driven | Multiple |
| Space-Based | 1–few |
| Microservices | Many (potentially one per service) |

## Decision Guide

**Start here: how many differing sets of architecture characteristics does the system need?**

- **One set** → monolith is viable. Choose based on domain needs:
  - Simplest possible, budget-constrained → [[styles/layered-architecture]]
  - Data transformation / ETL → [[styles/pipeline-architecture]]
  - Customisation is the core use case → [[styles/microkernel-architecture]]

- **Multiple sets** (different scalability, availability, etc. for different parts) → distributed:
  - Team lacks DevOps maturity or needs ACID transactions → [[styles/service-based-architecture]]
  - Highest scalability/elasticity, async workloads → [[styles/event-driven-architecture]]
  - Extreme performance, in-memory required → [[styles/space-based-architecture]]
  - Maximum agility, large teams, mature DevOps → [[styles/microservices-architecture]]
  - SOA → avoid for new systems; used to understand legacy

**Secondary decision: synchronous vs asynchronous communication?**

> "Use synchronous by default, asynchronous when necessary." (→ [[sources/fundamentals-of-software-architecture]])

Async is required when: scalability/elasticity are primary concerns, workflows are long-running, or differing service throughput would cause synchronous timeout/coupling problems.

## The 8 Fallacies of Distributed Computing

Any distributed style pays the costs captured in the [[distributed/fallacies-of-distributed-computing]] (Deutsch, Sun Microsystems, 1994): the network is not reliable, not zero-latency, not infinite-bandwidth, not secure, not static in topology, not administered by one person, not free to use, and not homogeneous. Architects choosing distributed styles must design explicitly for each fallacy.

## Stamp Coupling (Distributed Styles Only)

Stamp coupling — passing more data than needed across service boundaries — wastes bandwidth and creates implicit schema coupling. Mitigate with: field selectors, GraphQL, purpose-specific request/response schemas.

## Style Evolution Paths

Common migration trajectories:
- Layered → Service-Based (split into 4–12 domain services; keep shared DB initially)
- Service-Based → Microservices (split databases; increase granularity; add DevOps automation)
- Layered → Modular Monolith (add domain partitioning within a single deployment; preserve migration option)

## Open Questions

> **Open question:** How do Richards & Ford's ratings compare to Kleppmann's implicit treatment in DDIA? The overlap is primarily in the distributed styles (event-driven, service-based, microservices) and their consistency/transaction trade-offs.

> **Finding:** [[sources/software-architecture-the-hard-parts]] substantially extends this taxonomy. Ch 4 introduces six decomposition patterns for breaking apart a monolith, with service-based architecture as the primary migration destination. Ch 6 adds data decomposition — the five-step process for separating a shared database across services. The key SATH contribution: concrete, step-by-step guidance on *how* to decompose, not just *when*.

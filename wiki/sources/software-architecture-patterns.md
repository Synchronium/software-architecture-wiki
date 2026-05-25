---
title: "Software Architecture Patterns"
type: source
tags: [architecture, patterns, styles, trade-offs]
sources: [software-architecture-patterns]
created: 2026-05-14
updated: 2026-05-14
---

# Software Architecture Patterns

**Author:** [[authors/mark-richards]]
**Published:** 2015
**Slug:** `software-architecture-patterns`

## Overview

An early, concise reference (O'Reilly, ~60 pages) covering five fundamental architecture patterns with explicit characteristic ratings. Preceded *Fundamentals of Software Architecture* (2020) by five years and established Richards's characteristic-rating framework — the same framework later expanded and formalised in FOSA. The five patterns covered (layered, event-driven, microkernel, microservices, space-based) are a subset of the eight styles in FOSA.

The book's primary contribution was to make architecture trade-offs *explicit* and *comparable*: each pattern is rated on six characteristics (agility, deployability, testability, performance, scalability, ease of development), enabling side-by-side comparison. This comparative approach was novel in 2015 and became the model for FOSA's more elaborate treatment.

## Key Claims

- Without a formal architecture, teams produce a big ball of mud — the de facto result of organisational Conway's Law pressure toward the layered style (→ ch. 1)
- Architecture patterns reveal the operational characteristics of an application without examining internals (→ Introduction)
- The layered style is the most common "accidental architecture" because technically-structured organisations naturally produce technically-partitioned systems (→ ch. 1)
- The architecture sinkhole anti-pattern (simple pass-throughs through all layers) is the primary signal that either layers should be made open or layered is the wrong style (→ ch. 1)
- Event-driven architecture cannot support atomic transactions across event processors — if you need this, the style is wrong or the granularity is wrong (→ ch. 2)
- Contract creation and governance is the hardest ongoing challenge in event-driven architecture (→ ch. 2)
- Microkernel is the first-choice style for product-based applications (→ ch. 3)
- In microservices, copying shared utility logic across services (DRY violation) is acceptable to preserve deployment independence (→ ch. 4)
- A 2015 position that has since been superseded: inter-service data needs can be satisfied via a shared database rather than inter-service calls (→ ch. 4 — see Contradictions)

## Chapter Notes

### Introduction

Architecture patterns define the basic characteristics and behaviour of an application — scalability potential, agility, deployability, performance ceiling. Understanding these allows architects to justify decisions with concrete trade-off analysis rather than intuition. The book presents five patterns with explicit ratings on six characteristics; an appendix provides a side-by-side comparison table.

### Chapter 1 — Layered Architecture

The n-tier/layered architecture: four standard layers (presentation, business, persistence, database). Core concepts:

- **Layers of isolation**: closed layers prevent changes from cascading up/down the stack. A UI framework change should not require touching the business layer. This isolation is the primary reason layered architecture is still recommended as a starting point.
- **Open layers**: a shared services layer (logging, utilities, audit) can be marked open, allowing the business layer to bypass it when going to persistence. Failure to document open vs closed layers produces brittle systems.
- **Architecture sinkhole anti-pattern**: requests pass through all layers with no logic performed in any — pure forwarding. 80/20 heuristic: ≤20% sinkholes is acceptable; >20% signals wrong style or too many closed layers.

See [[styles/layered-architecture]].

### Chapter 2 — Event-Driven Architecture

Two topologies: mediator (central orchestrator, knows all steps) and broker (chain-based relay, no central control). Key design issues:

- Mediator implementation options scale with complexity: Spring Integration/Camel/Mule for simple routing; BPEL/Apache ODE for conditional multi-step workflows; jBPM/BPM engines for long-running processes with human interaction.
- **No atomic transactions across event processors** — the central limitation. Event processors are independent units; cross-processor transactions require compensating transactions (sagas), which add significant complexity.
- **Contract governance** is the primary ongoing challenge — settle on a standard data format and versioning policy at the outset.
- Broker topology is generally easier to deploy than mediator because the mediator is tightly coupled to the processors it orchestrates — a change in a processor may require redeploying the mediator.

See [[styles/event-driven-architecture]].

### Chapter 3 — Microkernel Architecture

Core system + plug-in modules. Key concepts:

- **Plug-in registry**: maps feature key → plug-in reference. Contains name, data contract, and remote access protocol details. Ranges from a simple HashMap to a service-discovery tool.
- **Adapters for third-party plug-ins**: when a plug-in does not conform to the standard contract (third-party vendors), wrap it in an adapter. Core invocation code remains contract-consistent regardless of plug-in source.
- **Embeddability**: the microkernel pattern can be embedded within another pattern (e.g., event processor components in EDA implemented as a microkernel for their per-client rules).
- First-choice style for product-based applications with versioned releases and optional features.

See [[styles/microkernel-architecture]].

### Chapter 4 — Microservices Architecture Pattern

Service components as the central concept (variable granularity: from a single module to a large portion of the application). Three topologies:

- **API REST-based**: fine-grained services exposed through an API layer. Common in cloud-based single-purpose web services (Yahoo, Google, Amazon).
- **Application REST-based**: coarser-grained service components accessed via REST from a separately deployed UI layer. For small to medium business applications.
- **Centralised messaging**: replaces REST transport with a lightweight message broker (ActiveMQ, HornetQ). Not SOA — the broker does *no orchestration, transformation, or complex routing*; it is transport only. Suited to larger apps needing advanced queuing, async messaging, and monitoring. SPOF concerns addressed via broker clustering and federation.

Granularity warning: too fine-grained forces orchestration, which slides into SOA complexity. If UI/API layer needs to orchestrate service components, they are too fine-grained.

DRY tradeoff: copying small utility logic across services (rather than extracting a shared service) is acceptable — independence is worth the redundancy.

See [[styles/microservices-architecture]].

> **Contradiction / evolution of thinking:** This 2015 edition recommends using a shared database to satisfy inter-service data needs rather than making inter-service calls (to avoid coupling). By 2020, [[sources/fundamentals-of-software-architecture]] explicitly reverses this: shared databases are a primary cause of the distributed monolith anti-pattern and should be avoided. Both books are by the same author; the shared-database guidance in SAP reflects pre-microservices-maturity thinking and should not be followed today.

### Chapter 5 — Space-Based Architecture

**The core problem**: conventional web apps form a triangle-shaped scaling topology — web servers (widest, easiest to scale), application servers (middle), database (narrowest, hardest to scale). Scaling out one layer just moves the bottleneck to the next. SBA dissolves the database from the hot path entirely by using in-memory replicated data grids within each processing unit.

Key concepts:

- **Two primary components**: processing unit (application logic + in-memory data grid + optional async persistence store + replication engine) and virtualized middleware (messaging grid, data grid, processing grid, deployment manager).
- **Messaging grid**: routes incoming requests to available processing units; ranges from round-robin to next-available algorithms.
- **Data grid**: replicates cache updates across all processing unit instances asynchronously — typically completing in microseconds.
- **Processing grid** (optional): orchestrates requests that require coordination across multiple processing unit types.
- **Deployment manager**: starts and stops processing units based on load monitoring.
- **Not well suited for**: traditional large-scale relational database applications with large amounts of operational data.
- **Alternative name**: "cloud architecture pattern" — but processing units don't need cloud hosting; Richards prefers "space-based."
- **Product examples**: GemFire, JavaSpaces, GigaSpaces, IBM Object Grid, nCache, Oracle Coherence.

Characteristic ratings (SAP's 6-characteristic framework): agility → high; deployability → high; testability → low; performance → high; scalability → high; ease of development → low. Directionally consistent with FOSA's more granular 2020 ratings.

See [[styles/space-based-architecture]].

## Notable Quotes

> "Architecture patterns help define the basic characteristics and behaviour of an application." (Introduction)

> "If you find you need to orchestrate your service components from within the user interface or API layer of the application, then chances are your service components are too fine-grained." (ch. 4)

> "This is a fairly common practice in most business applications implementing the microservices architecture pattern, trading off the redundancy of repeating small portions of business logic for the sake of keeping service components independent." (ch. 4)

## Related Pages

- [[styles/layered-architecture]]
- [[styles/event-driven-architecture]]
- [[styles/microkernel-architecture]]
- [[styles/microservices-architecture]]
- [[styles/space-based-architecture]]
- [[sources/fundamentals-of-software-architecture]] — the 2020 successor, same author; more comprehensive
- [[comparisons/architecture-styles-comparison]]

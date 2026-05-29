---
title: "Integration Styles"
type: concept
tags: [integration, messaging, coupling, enterprise, distributed-systems]
sources: [enterprise-integration-patterns]
created: 2026-05-15
updated: 2026-05-29
---

# Integration Styles

## Key Claims

- **Four styles, ordered by sophistication and decoupling.** File Transfer → Shared Database → Remote Procedure Invocation → Messaging. Each solves the same problem with different trade-offs on coupling, timeliness, intrusiveness, and operational complexity.
- **Decisions are per-integration-point.** Real systems mix all four. Catalogue updates via File Transfer, real-time orders via Messaging, status queries via RPI — choose per integration, not per system.
- **Shared Database is the most dangerous style for microservices.** Implementation coupling that prevents independent deployment. Newman's rule: don't share databases across services. EIP acknowledges the same problem but in the enterprise integration context.
- **RPC's local-call illusion misleads developers.** Remote calls are orders of magnitude slower and more failure-prone than local calls; reasoning about them as method calls (CORBA's original sin) produces brittle systems. Modern RPC frameworks (gRPC) acknowledge the difference rather than hiding it.
- **Messaging is the default for cross-team, cross-platform integration.** Temporal decoupling, location independence, reliable delivery, transformation in transit. The asynchronous design tax is real but well-understood.
- **Evaluate against eight criteria before choosing.** Coupling, intrusiveness, technology selection, data format, data timeliness, data vs functionality, remote communication, reliability. The criteria force the trade-offs into the open.

## Definition

Integration styles are the four fundamental approaches to making heterogeneous enterprise applications exchange information and coordinate behaviour. Each style addresses the same problem — connecting applications built independently on different platforms — but makes different trade-offs on coupling, timeliness, intrusiveness, and operational complexity (→ [[sources/enterprise-integration-patterns]] ch. 2).

The four styles exist on a spectrum of increasing sophistication and increasing complexity:

**File Transfer → Shared Database → Remote Procedure Invocation → Messaging**

## Decision Criteria

Before choosing an integration style, evaluate against eight criteria (→ [[sources/enterprise-integration-patterns]] ch. 2):

| Criterion | Question |
|-----------|----------|
| **Application coupling** | How many assumptions must each party make about the other? |
| **Intrusiveness** | How much code must change in each participating application? |
| **Technology selection** | What specialised software/hardware is required? |
| **Data format** | Must applications agree on a unified schema? How does it evolve? |
| **Data timeliness** | How quickly does a change in one system appear in others? |
| **Data vs functionality** | Do we need to share data, trigger behaviour, or both? |
| **Remote communication** | Must the caller wait synchronously, or can it proceed asynchronously? |
| **Reliability** | What happens if the other system is unavailable when we try to communicate? |

## The Four Styles

### File Transfer

Each application produces files of shared data at regular intervals; others consume them. Integrators handle format transformation between production and consumption.

```
App A ──[produces]──→ files ──[transforms]──→ [consumes] App B
                      (nightly, weekly...)
```

**Advantages:**
- Universal — any OS, any language can read/write files
- No special integration tooling required
- Strong decoupling — applications don't need to know about each other; files are the public interface
- Integrators can be added between producer and consumer without touching either application

**Disadvantages:**
- **Staleness**: systems can diverge between file productions. If an address changes on the same day as a billing run, billing may use the old address
- **Manual coordination overhead**: naming conventions, locking (avoid reading a partially-written file), cleanup responsibility, file delivery if applications share no disk
- **Frequency ceiling**: producing and processing files is expensive; very high-frequency file production is impractical and effectively becomes messaging
- No encapsulation — file format IS the public contract; any internal format change requires file format change

**When to use:** Infrequently-updated reference data (catalogue updates quarterly), batch data warehouse loads, B2B scenarios where the partner provides files and no streaming alternative exists (e.g., FTP over the public Internet where MOM doesn't work well).

### Shared Database

All applications that need to share data store it in a single common database with a unified schema.

```
App A ──→ ┌──────────────┐ ←── App B
          │ Shared DB    │
App C ──→ │ (one schema) │ ←── App D
          └──────────────┘
```

**Advantages:**
- Always consistent — no staleness problem; transaction management handles concurrent updates
- Semantic dissonance is forced out early — applications must agree on a common representation before going live
- SQL is universal; most platforms can connect without extra tooling

**Disadvantages:**
- **Schema design conflict**: creating a schema that satisfies all applications' needs is politically and technically very difficult; often results in a schema that no application team likes
- **Packaged applications won't cooperate**: most commercial software (ERP, CRM) uses its own proprietary schema and reserves the right to change it on every release upgrade
- **Performance bottleneck**: concurrent reads and writes from many applications can cause lock contention and deadlocks; a distributed database with lock conflicts is "a performance nightmare"
- **Post-merger integration**: two separate organisations' applications sharing a schema requires enormous upfront schema alignment effort

**When to use:** Tightly-owned applications that a single team controls, where transactional consistency is essential and the schema can be designed jointly upfront. Rarely viable for cross-organisational integration or packaged application integration.

> **Relationship to microservices:** The Newman perspective (→ [[sources/monolith-to-microservices]]) is that Shared Database is the most dangerous integration style for microservices — it creates implementation coupling that prevents independent deployment. EIP acknowledges the same problem but focuses on the enterprise integration context rather than decomposition.

### Remote Procedure Invocation

Each application exposes a public interface of procedures that can be invoked remotely. Other applications invoke those procedures to trigger behaviour and exchange data.

```
App A ──[invoke: placeOrder(customer, items)]──→ App B
                                          ←──[return: orderId]
```

**Advantages:**
- Encapsulation: data stays inside the owning application; callers trigger behaviour through an interface, preserving the application's ability to manage data integrity
- Supports triggering behaviour (not just data sharing) — solving a limitation of File Transfer and Shared Database
- Familiar semantics for developers accustomed to method calls
- Handles semantic dissonance via multiple interfaces to the same data

**Disadvantages:**
- **Remains tightly coupled**: caller knows the callee's interface; sequencing (calling things in a particular order) creates hidden coupling that makes systems hard to evolve independently
- **Synchronous bias misleads**: RPC makes remote calls look like local calls; developers treat them as equivalent but they are not — remote calls are orders of magnitude slower and orders of magnitude more likely to fail. "Objects that interact in a distributed system need to be dealt with in ways that are intrinsically different from objects that interact in a single address space" (Waldo, 1994)
- **Synchronous blocking**: the caller typically waits for the callee to complete, which creates availability chains — if the callee is slow, the caller is slow
- **Language lock-in**: original RPC frameworks (CORBA, DCOM) tied callers to the same technology stack

**Technologies:** CORBA, COM, .NET Remoting, Java RMI, SOAP/WS-*, gRPC (modern equivalent)

**When to use:** When applications are on the same team's technology stack and can be evolved together; when triggering behaviour (not just data sharing) is required and async design is genuinely impractical. Modern gRPC is the preferred form when strict contract fidelity is required (→ [[concepts/contracts]]).

### Messaging

Applications connect to a common messaging infrastructure and exchange data using small, self-contained messages transferred asynchronously and reliably.

```
App A ──[send message]──→ Message Channel ──[deliver]──→ App B
         (no wait)          (buffers, routes,              (processes
                             transforms)                    when ready)
```

**Advantages:**
- **Temporal decoupling**: sender does not need the receiver to be available; the channel stores the message until delivery is possible
- **Location independence**: sender addresses a logical channel, not a physical machine; the channel infrastructure handles routing
- **Platform independence**: applications connect to the messaging system independently; the channel handles format negotiation
- **Reliable delivery**: messaging infrastructure provides retry, acknowledgement, and dead-letter handling — far more robust than point-to-point TCP connections
- **Transformation in transit**: messages can be transformed between sender and receiver without either knowing; integrators can add routing, filtering, and transformation without touching applications
- **Behavioural collaboration**: small messages enable near-real-time event-driven coordination — closer to RPI than File Transfer in timeliness, but without the synchronous coupling

**Disadvantages:**
- **Async design is harder**: developers must reason about asynchronous flows, message ordering, and compensating actions — not the familiar synchronous model
- **Testing and debugging are harder**: distributed message flows are difficult to trace and reproduce
- **Glue code**: the flexibility of messaging means integrators write significant transformation and routing code
- **Not entirely consistent**: even with frequent messages, there is still some lag; systems are not perfectly synchronous

**When to use:** The default choice for enterprise integration when multiple applications need to share data or coordinate behaviour across organisational boundaries, technology stacks, or deployment schedules. The preferred style when the other three styles' limitations outweigh their simplicity.

## Choosing a Style

| Scenario | Recommended style |
|----------|------------------|
| Infrequent batch data transfer (catalogue updates, data warehouse loads) | File Transfer |
| Applications owned by one team sharing transactional data, no packaged software | Shared Database |
| Same technology stack, triggering behaviour across tightly-coupled services | Remote Procedure Invocation (gRPC) |
| Cross-team, cross-platform, event-driven integration; decoupled evolution | Messaging |
| Supplier-provided data over public Internet (FTP feasible, MOM not) | File Transfer |
| Microservice integration (see Newman) | Messaging (avoid Shared Database) |

Most real integration solutions use a **hybrid** of styles: catalogue updates via File Transfer, real-time order processing via Messaging, synchronous status queries via RPI. The decision is per-integration-point, not a single system-wide choice.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/enterprise-integration-patterns]] | Primary source: formal taxonomy of the four styles; decision criteria; messaging as preferred style but with acknowledged complexity (ch. 2) |
| [[sources/monolith-to-microservices]] | Shared Database is the most dangerous pattern for service decomposition — creates implementation coupling. Async messaging is the default for decoupled microservices. File Transfer appears as a valid decomposition intermediate (FTP variant of Strangler Fig) |
| [[sources/building-event-driven-microservices]] | Messaging (event streaming) as the default integration style; strong preference for log-based brokers (Kafka) over traditional MOM |

## Related Concepts

- [[concepts/messaging]] — deep treatment of messaging properties, channel types, delivery guarantees
- [[concepts/contracts]] — Canonical Data Model is an integration style-level contract mechanism
- [[styles/soa-architecture]] — SOA is built on top of Messaging or RPI; EIP treats it as a desirable integration scenario
- [[concepts/evolutionary-database-design]] — Shared Database decomposition strategies for microservice migrations
- [[concepts/coupling]] — integration styles exist on a coupling spectrum
- [[comparisons/sync-vs-async-communication]] — decision guide for when to choose synchronous (RPI) vs asynchronous (Messaging) communication

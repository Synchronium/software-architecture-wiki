---
title: "Event-Driven Architecture"
type: style
tags: [distributed-systems, events, async, messaging, domain-partitioning, microservices, streaming, ddd, coupling]
sources: [fundamentals-of-software-architecture, understanding-distributed-systems, software-architecture-patterns, building-event-driven-microservices, learning-domain-driven-design]
created: 2026-05-13
updated: 2026-05-29
---

# Event-Driven Architecture

## Key Claims

- **Two topologies, very different shapes.** Broker (events flow peer-to-peer through a message bus, maximum decoupling) and mediator (a central orchestrator routes and tracks workflow). Broker scales further; mediator handles complex workflows more cleanly.
- **Three event types matter.** Notification (something happened, fetch details), Event-Carried State Transfer (event includes the state needed to act), and Domain Event (DDD-flavoured event that captures business meaning). Mixing them carelessly creates contract chaos.
- **Private vs public events.** A service's internal events should not be its external contract. Publish a curated public event stream as the inter-service contract; keep private events for internal coordination.
- **Backpressure is built into the substrate.** Pull-based consumption (Kafka-style) means producers continue at their natural rate while slow consumers accumulate observable lag — no thread blocking, no cascade.
- **Distributed Big Ball of Mud is the dominant anti-pattern.** Event-driven architectures can easily devolve into untraceable spaghetti if event flows aren't designed deliberately. Schema registries, event catalogues, and bounded contexts as event ownership boundaries are the discipline.
- **EDA is often embedded in other styles.** Pure EDA is rare; event-driven microservices, event-sourced bounded contexts, and pipeline-style data flows are how EDA shows up in production. Adding EDA to any style improves backpressure, load smoothing, and responsiveness.


## Definition

Event-driven architecture (EDA) is a distributed, asynchronous style where components communicate via events rather than direct synchronous calls. Components are decoupled — producers emit events without knowing who consumes them; consumers react to events without knowing who produced them. This enables extreme scalability and elasticity but introduces significant complexity in error handling, data consistency, and debugging.

EDA contrasts with the **request-based model**: a request is a deterministic, synchronous, data-driven instruction sent to an orchestrator (e.g., "retrieve order history"). An event is a situation that has occurred that the system must react to (e.g., "bid submitted — determine new highest bidder"). Use request-based for well-structured, data-driven queries needing certainty and control; use event-based for flexible, action-based events requiring high responsiveness and scale.

## Two Topologies

### Broker Topology (Choreography)

No central mediator. The **relay race analogy**: once an event processor hands off the event (the baton), it is done with that event and available for the next one. Messages are *things that have already happened* — past-tense events (order-created, payment-applied, email-sent). Consumers react; they are not commanded.

```
[ServiceA] --event--> [Broker] --event--> [ServiceB]
                                └──event--> [ServiceC]
                                └──event--> [ServiceD]
```

Four components: **initiating event** (triggers the flow), **event broker** (typically federated/clustered, uses topics/pub-sub for fire-and-forget), **event processor** (performs one task, then advertises what it did), **processing event** (the output event advertising completed work).

**Always advertise:** each event processor should publish what it did even when no downstream processor currently listens. This creates a no-cost extensibility hook — future processors can tap the event feed without modifying existing ones.

**Trade-offs:**

| Advantages | Disadvantages |
|---|---|
| Highly decoupled event processors | No workflow control |
| High scalability and performance | Error handling distributed/difficult |
| High responsiveness and fault tolerance | No recoverability or restart capability |
| | Data inconsistency risk |

### Mediator Topology (Orchestration)

A central event mediator knows the steps of a workflow and generates corresponding processing events. Processors respond back to the mediator. Messages are *commands* (things that must happen — place-order, send-email, fulfill-order) — not past-tense events. Commands must be processed; events can be ignored.

```
Initiating Event → [Mediator] → point-to-point queue → [ServiceA]
                             → point-to-point queue → [ServiceB]
                             ← acknowledgements
```

**Mediator implementation choices** (scale with complexity):
- *Apache Camel, Mule ESB, Spring Integration*: simple event flows with basic error handling. Custom code in Java/C#.
- *Apache ODE, Oracle BPEL Process Manager*: complex conditional processing with BPEL (XML-based workflow language). Graphical tooling available.
- *jBPM or similar BPM engine*: long-running workflows requiring human intervention (e.g., manual approval for large trades).

**Recommended delegation model**: always route all events through a simple mediator first. The simple mediator interrogates the event classification and delegates to a more complex mediator only when needed. This avoids choosing a single mediator that's too heavy for simple events or too weak for complex ones.

**Trade-offs:**

| Advantages | Disadvantages |
|---|---|
| Workflow control and state management | More coupling of event processors |
| Error handling and recoverability | Lower scalability (mediator can bottleneck) |
| Restart capability | Lower performance |
| Better data consistency | Difficult to model complex dynamic workflows |

**Topology selection**: broker topology wins on performance, scalability, and decoupling. Mediator topology wins on workflow control, error handling, and recoverability. A common pattern is a hybrid: mediator for the outer workflow structure; broker within sections requiring dynamic processing.

(See also: [[patterns/saga]] for the distributed transaction pattern that often appears in EDA.)

## Request-Based vs Event-Based Model

| Dimension | Request-Based | Event-Based |
|-----------|---------------|-------------|
| Coupling | Tight (requester knows responder) | Loose (producer doesn't know consumers) |
| Timing | Synchronous — caller blocks | Asynchronous — caller continues |
| Typical use | Query, CRUD, interactive workflows | Notification, streaming, background processing |
| Error handling | Synchronous, simple | Asynchronous, complex |
| Example | "Fetch order #123" | "OrderPlaced event → trigger fulfilment, notify customer, update inventory" |

## Responsiveness vs Performance

Async communication improves *responsiveness* but not necessarily *performance*. Example: posting a comment with a 3,000ms processing pipeline:
- Synchronous: user waits 3,100ms (50ms network + 3,000ms processing + 50ms response).
- Asynchronous: user receives ACK in 25ms; processing still takes 3,025ms but the user is not blocked.

Responsiveness = notifying the user the action has been accepted, to be processed momentarily. Performance = making the end-to-end process faster. Async improves the former; optimising the pipeline improves the latter. These are different problems with different solutions.

Caveat: async promises eventual processing, not guaranteed immediate completion. Error conditions (e.g., bad-word rejection) cannot be communicated synchronously; they require out-of-band notification (e.g., email to registered user).

## Error Handling — Workflow Event Pattern

A reactive architecture pattern for async error handling without sacrificing responsiveness:
1. Event consumer encounters an error → immediately **delegates** it via async messaging to a workflow processor, then continues processing the next message in the queue.
2. **Workflow processor** (workflow delegate) inspects the error, attempts to repair the message programmatically (static rules or ML-based anomaly detection), and resubmits to the originating queue.
3. If repair fails, the message is routed to a **dashboard queue** for human intervention (manual fix + resubmit via reply-to header).

Trade-off: repaired messages may arrive out of sequence. For order-sensitive streams (e.g., a brokerage account where SELL must precede BUY), the consumer must queue subsequent messages for that context ID until the repaired message is successfully processed.

## Preventing Data Loss

Three points of potential loss in async messaging, each with a specific mitigation:

1. **Message never reaches the queue or broker crashes before delivery:** Mitigate with *persisted queues* (broker persists to disk, not just memory) + *synchronous send* (producer blocks until broker acknowledges persistence).
2. **Consumer de-queues a message then crashes before processing:** Mitigate with *client acknowledge mode* — message stays in queue with the consumer's client ID attached; no other consumer can read it; if the consumer crashes, the message remains available for reprocessing.
3. **Consumer cannot persist to the database (data error):** Mitigate with ACID database commit + *last participant support (LPS)* — the message is atomically removed from the queue only after a successful DB commit.

Additional patterns:
- **Dead-letter queues (DLQs)**: unprocessable messages are routed to a DLQ for inspection rather than dropped.
- **At-least-once delivery**: accept that duplicate events may occur; make consumers idempotent (→ [[distributed/idempotency]]).

## Request-Reply Messaging

Synchronous communication emulated within EDA via two queues (request queue + reply queue). Two techniques:

- **Correlation ID** (preferred for high-volume systems): producer sends to request queue and records the message ID. Producer waits on reply queue with a message selector filtering for `CID = original message ID`. Consumer processes the request and creates a reply message setting `CID = original message ID`. Producer receives reply because the CID matches its selector.
- **Temporary queue**: producer creates a dedicated ephemeral reply queue per request, passes its name in the reply-to header. No message selector needed. Simpler, but creating/deleting queues at high volume degrades broker performance.

## Broadcast Capabilities

Producer publishes a message to a topic without knowledge of who (if anyone) receives it or what they do with it. This is the highest level of decoupling available in EDA and is essential for patterns like eventual consistency, complex event processing (CEP), and real-time market data distribution. Example: stock price tickers broadcast to all interested consumers — the publisher has no knowledge of who trades, hedges, or analyses based on the price.

## When to Use

- Systems requiring high throughput, scalability, and elasticity — the highest-rated style for these characteristics.
- Workloads with highly variable load (broker absorbs spikes).
- Systems where services need to be decoupled and independently developed/deployed.
- Real-time data processing, notification systems, activity streams.

## Architecture Characteristics Ratings

| Characteristic | Rating | Notes |
|----------------|--------|-------|
| Deployability | ★★★☆☆ | Services deploy independently; broker adds infrastructure dependency |
| Elasticity | ★★★★★ | Brokers absorb load spikes; consumers scale horizontally |
| Evolutionary | ★★★★☆ | Easy to add new consumers without touching producers |
| Fault tolerance | ★★★★★ | Producer failure does not block consumers; messages persist |
| Modularity | ★★★★☆ | Loose coupling via events |
| Overall cost | ★★★☆☆ | Broker infrastructure adds cost; complexity adds development cost |
| Performance | ★★★★☆ | Async avoids blocking; high throughput with message batching |
| Reliability | ★★★★☆ | Persistent queues + DLQs provide reliability |
| Scalability | ★★★★★ | Consumers can be scaled independently |
| Simplicity | ★☆☆☆☆ | Async complexity, eventual consistency, hard-to-debug flows |
| Testability | ★★☆☆☆ | Async flows and eventual consistency make testing difficult |

## Trade-offs

**Strengths:**
- Best-in-class scalability and elasticity across all architecture styles.
- Producers and consumers are completely decoupled — new consumers can be added without any change to producers.
- Naturally fault-tolerant: failures do not cascade synchronously.

**Weaknesses:**
- Complexity: debugging asynchronous flows requires distributed tracing; reproducing errors is difficult.
- Eventual consistency: the system does not immediately reflect all updates; consumers may see stale data.
- Workflow coordination across multiple events is complex in the broker topology.
- Error handling must be designed explicitly (DLQs, retries, idempotency).
- Testability is significantly lower than synchronous styles.

## Quanta

Multiple quanta possible, but the count depends on database sharing and request-reply coupling:
- Services sharing a **single database instance** are in the same quantum, regardless of how async their communication is.
- **Request-reply** where one processor must wait for an immediate response ties both processors into the same quantum (synchronous connascence expressed through async messaging). Example: event processor A sends a request to B to generate an order ID and blocks on the reply. If B is down, A cannot continue. They share fate → same quantum.

## Partitioning

**Technically partitioned**: any domain is typically spread across multiple event processors tied together through mediators, queues, and topics. Changes to a domain usually touch many event processors and messaging artifacts. This is why EDA scores relatively lower on evolutionary architecture characteristics than microservices, even though both are distributed.

## Competing Consumers

**Competing consumers** are the primary scalability mechanism: multiple instances of an event processor consume from the same queue. As request load increases, additional instances are added programmatically. This is how EDA achieves its 5-star scalability and elasticity ratings. Queues provide back-pressure (see [[distributed/backpressure]]): if an event processor slows down or crashes, messages queue up until the processor recovers or new instances are added. Pull-based consumption is the architectural reason EDA handles variable load more gracefully than synchronous chains — backpressure is built into the substrate rather than retrofitted as a stability pattern.

## Hybrid Event-Driven Architectures

EDA is frequently embedded within other architecture styles rather than used standalone:
- **Event-driven microservices**: brokers connect independently deployable fine-grained services
- **Space-based architecture**: uses messaging for data pump (async DB updates from processing units)
- **Microkernel**: plug-ins communicating via events
- **Pipeline**: event-driven version of the filter-and-pipe topology

Adding EDA to any style removes bottlenecks, provides back-pressure for load spikes, and improves user responsiveness.

## Event-Driven Microservices (Bellemare)

Bellemare's *Building Event-Driven Microservices* (→ [[sources/building-event-driven-microservices]]) provides the most detailed treatment of EDM architectures as a complete system — not just topology but event design, data liberation, and stream processing.

### Event Types

Every event is represented as a key/value pair. Three types:

- **Unkeyed event**: singular statement of fact with no key (e.g., user opened a book entity). Used for events that don't track entity state.
- **Entity event**: keyed on the unique ID of an entity (e.g., ISBN for a book). Describes the entity's properties and state at a point in time. Only the latest event per key is needed to determine current state.
- **Keyed event**: has a key but does not represent an entity — used for partitioning and data locality (e.g., stream of user interactions keyed on ISBN for aggregation).

### Table-Stream Duality

Applying entity events in order materialises a stateful table (upsert logic). Conversely, any table can produce an event stream by publishing each update. This **table-stream duality** is the foundation for sharing state between microservices without direct coupling — any consumer reads the event stream and builds its own local materialisation. See also: [[streams/event-sourcing-cqrs]].

**Tombstone**: a keyed event with a null value, signalling deletion of that key from the materialised state. **Log compaction**: the event broker retains only the most recent event per key, reducing disk usage at the expense of event history.

### Event Broker vs Message Broker

A critical distinction for EDM:

| Feature | Message Broker | Event Broker |
|---------|---------------|-------------|
| Event retention | Deleted after consumption | Retained indefinitely |
| Consumer access | Subset of events (shared queue) | Full copy via independent offsets |
| Replayability | No | Yes — consumer can seek to any offset |
| State sharing | Cannot correctly share state | Foundation for state-sharing via streams |

Message brokers (RabbitMQ, traditional MQ) cannot power EDM architectures — consumers each receive only a subset of events. Event brokers (Apache Kafka, Apache Pulsar) maintain an ordered immutable log with per-consumer offsets.

### Event Broker Requirements

For a broker to support EDM at scale, it must provide: **partitioning** (for parallel consumption), **strict ordering within partitions**, **immutability** (events cannot be modified once written), **indexing** (offset tracking for consumers), **infinite retention** (foundational for state in streams), and **replayability** (consumers can reset to any position).

### Microservice Single Writer Principle

Each event stream has exactly one producing microservice. This enables traceable data lineage and clear data ownership. Access controls should enforce write boundaries. A single writer per stream prevents the conflicting-writes problem and makes the producer unambiguously responsible for event quality.

### Synchronous vs Asynchronous Microservices

EDM advocates asynchronous event-driven communication, but synchronous microservices remain appropriate for some tasks. Key comparison:

| Dimension | Synchronous | Asynchronous (EDM) |
|-----------|-------------|---------------------|
| Coupling | Point-to-point API coupling | Coupled on data schema, not implementation |
| Scaling | Dependent on downstream scaling | Independent; broker absorbs load |
| Failure handling | Complex — must handle downstream outages synchronously | Natural isolation; events queue during failures |
| Data access | Requires inter-service calls for external data | Consume from event streams independently |
| Debugging | Simpler — call trace is linear | Harder — requires distributed tracing |
| Testing | Easier integration testing | More complex async flow testing |
| Talent pool | Larger (more experience with sync patterns) | Smaller |

Drawbacks of synchronous: point-to-point couplings at scale, dependent scaling, API versioning overhead, data access tied to implementation, distributed monolith risk. **Hybrid architectures** (both coexist) are the norm — synchronous for user-facing request-response, auth, and external integrations; async EDM for data sharing, background processing, and notifications.

### Microservice Tax

The sum of costs — financial, manpower, and opportunity — for running the full EDM platform: event broker cluster, container management system, deployment pipelines, monitoring, logging. Must be paid centrally (scalable, unified) or independently (fragmented, unsustainable). Small organisations should consider a modular monolith before committing to EDM. The microservice tax is being reduced by improved tooling and managed services, but it remains a significant up-front investment.

### Data Liberation

Migrating existing systems to EDM requires publishing legacy system data to event streams — a process called **data liberation**. Three patterns with different trade-offs are covered in [[patterns/outbox-pattern]].

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Covers broker vs mediator topologies in depth; positions EDA as the highest-scalability style; warns heavily on testability and error-handling complexity |
| [[sources/understanding-distributed-systems]] | Does not treat EDA as an architecture style per se, but covers the underlying concepts (async messaging, at-least-once delivery, idempotency) in depth |
| [[sources/software-architecture-patterns]] | Earlier (2015) treatment — establishes mediator vs broker distinction with concrete mediator implementation ladder (Camel/Mule → BPEL → jBPM); names the no-atomic-transactions limitation explicitly; content superseded and expanded by FOSA |
| [[sources/building-event-driven-microservices]] | Full end-to-end treatment of EDM: event types, table-stream duality, event broker internals, schema design, data liberation, stream processing; most comprehensive single-volume source on EDM |
| [[sources/learning-domain-driven-design]] | DDD-centric treatment. Distinguishes EDA (cross-component communication) from event sourcing (intra-service state management). Three event types: (1) **Event notification** — short message, consumer queries for details; good for security (explicit authorisation for details) and concurrency (get up-to-date state on query); (2) **Event-carried state transfer (ECST)** — full/partial entity snapshot; enables local cache; asynchronous replication; better fault tolerance; (3) **Domain event** — models what happened in the business domain; includes all data describing the event; not an entity snapshot; not designed for external integration. **Distributed big ball of mud anti-pattern**: exposing domain events directly to external consumers creates implementation coupling (schema changes break consumers), functional coupling (duplicate projection logic across consumers), and temporal coupling (ordering dependencies → hardcoded delays). Fix: (a) encapsulate projection logic inside producer using OHS + published language; (b) publish ECST messages instead of internal domain events; (c) use event notifications for truly notification-only signals. Design heuristics: "assume the worst" (outbox, idempotency, sagas); use private vs public events explicitly; choose event type based on consistency requirements (eventually consistent → ECST; need last write → notification + query) (ch. 15) |

## Related Pages

- [[patterns/saga]] — the distributed transaction pattern often used in EDA broker topologies
- [[patterns/outbox-pattern]] — ensures reliable event publishing; also covers data liberation patterns for legacy integration
- [[distributed/idempotency]] — essential for at-least-once delivery in async EDA
- [[styles/microservices-architecture]] — often uses EDA (broker topology / choreography) for inter-service communication
- [[comparisons/architecture-styles-comparison]] — side-by-side ratings
- [[styles/architecture-styles]] — overview and decision guide for all architecture styles
- [[concepts/bounded-contexts]] — DDD foundations; EDM formalises the data communication layer between bounded contexts
- [[streams/event-sourcing-cqrs]] — table-stream duality, CDC, materialization

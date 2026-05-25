---
title: "Building Event-Driven Microservices"
type: source
tags: [event-driven, microservices, streaming, kafka, bounded-contexts, ddd]
sources: [building-event-driven-microservices]
created: 2026-05-14
updated: 2026-05-14
---

# Building Event-Driven Microservices

**Author:** [[authors/adam-bellemare]]
**Published:** 2020 (O'Reilly)
**Slug:** `building-event-driven-microservices`

## Overview

Bellemare's book is the most comprehensive available treatment of event-driven microservices as an end-to-end architectural approach — covering not just the topology but the full lifecycle: event schema design, data liberation from legacy systems, stream processing, testing, deployment, and organisational prerequisites. The central thesis is that **modern event brokers (persistent, replayable, infinite-retention) fundamentally change what's possible**: services no longer need to couple directly to one another to access shared domain data, because the event stream becomes the canonical data communication layer.

The book draws heavily on domain-driven design (bounded contexts, domain ownership) and applies it to the event streaming world. It makes a strong case that the missing piece in most traditional architectures is not the implementation communication structure, but the **data communication structure** — the mechanism by which domain data flows across the organisation. EDM architectures formalise this missing layer.

Technical reviewers include Ben Stopford (Confluent, Apache Kafka co-creator side) and Scott Morrison (PHEMI Systems). The book is practically oriented: it references Kafka, Kafka Connect, Debezium, Apache Avro, Protobuf, and other real tools throughout.

## Key Claims

- The data communication structure is the historically missing layer in software architectures; EDM formalises it (→ ch. 1)
- Events are not mere signals — they are the single source of truth; they must contain the complete description of what happened (→ ch. 3)
- Explicit schemas (Avro, Protobuf) with full-compatibility schema evolution are non-negotiable; implicit schemas are a long-term liability (→ ch. 3)
- Message brokers and event brokers are fundamentally different: event brokers retain events indefinitely and allow each consumer its own full copy (→ ch. 2)
- CDC frameworks (Kafka Connect, Debezium) are a bootstrap tool, not a destination; teams should eventually own their own event production (→ ch. 4)
- The microservice single writer principle: one producer per event stream (→ ch. 2)
- Hybrid architectures (sync + async) are the norm; the question is which tasks suit which model (→ ch. 1)

## Chapter Notes

### Preamble

Book addresses a gap: existing literature either covers event-driven systems superficially (as a replacement for request-response) or covers only one aspect of the puzzle. Technical reviewers: Ben Stopford (Confluent), Scott Morrison (PHEMI Systems).

### Chapter 1 — Why Event-Driven Microservices

Introduces three communication structures — business, implementation, and data — and argues that the data communication structure has historically been absent or ad hoc, forcing the implementation communication structure to serve double duty. This creates the characteristic pathologies of traditional architectures: point-to-point couplings, data access difficulty, inability to separate services cleanly.

EDM architectures formalise the data communication layer via event streams, allowing services to produce domain data once and have any consumer access it independently. Conway's Law (→ [[concepts/conways-law]]) connects team communication structure to architectural structure; the event stream as a data layer partially decouples product boundaries from team boundaries.

Also introduces DDD foundations: domain, subdomain, bounded context (→ [[concepts/bounded-contexts]]). Bounded contexts should align on business requirements, not technical requirements. Key anti-pattern: technical alignment (separate app/data/ops teams) creates cross-cutting dependencies and distributed monoliths.

Benefits of EDM: granularity, scalability, technological flexibility, business-requirement flexibility, loose coupling, CD support, high testability. Drawbacks of synchronous microservices: point-to-point coupling, dependent scaling, service failure handling complexity, API versioning overhead, data access tied to implementation, distributed monolith risk.

### Chapter 2 — Event-Driven Microservice Fundamentals

**Three event types**: unkeyed (singular fact, no key), entity (keyed on unique ID, tracks entity state over time), keyed (keyed, non-entity, used for partitioning and data locality). Entity events are the most important — they power the table-stream duality.

**Table-stream duality** (→ [[streams/event-sourcing-cqrs]]): applying entity events in order materialises a stateful table; any table can produce an event stream by publishing each update. Tombstones (null-value keyed events) signal deletion. Log compaction retains only the most recent event per key; eliminates history but reduces disk usage.

**Event broker requirements**: partitioning (parallel consumption), strict ordering within partitions, immutability, indexing (offsets), infinite retention, replayability. These distinguish an event broker from a message broker. Message brokers delete events after consumption and provide only subset-of-events per consumer; event brokers provide each consumer a full, independent copy of all events via offsets.

**Consuming modes**: as an event stream (consumer groups, independent offsets, partition assignment), or as a queue (each event consumed by one instance, no ordering guarantee, not all brokers support this).

**Microservice single writer principle**: one producer per event stream — enables traceable data lineage and clear ownership.

**Microservice tax**: the sum of costs (financial, manpower, opportunity) for running the full platform — event broker, CMS, deployment pipelines, monitoring, logging. Must be paid centrally or independently. Small organisations should consider modular monolith instead.

### Chapter 3 — Communication and Data Contracts

**Data contract** = data definition (fields, types) + triggering logic (the specific business event that caused it). Both parts are important; changing the triggering logic breaks the semantic meaning of the event, not just its format.

**Explicit schemas** (Avro, Protobuf, Thrift) are essential. Implicit schemas create tribal knowledge dependencies, inter-service inconsistencies, and silent production failures. A common library interpreting implicit schemas creates language-lock, version coupling, and release-cycle dependencies — avoid it.

**Schema evolution** (→ [[concepts/contracts]], [[databases/encoding-and-evolution]]): forward compatibility (newer schema data readable by older consumer), backward compatibility (older schema data readable by newer consumer), full compatibility (both — use by default; can always loosen later, hard to tighten). Schema registry (Confluent Schema Registry, Apache Pulsar's built-in registry) manages versioning.

**Breaking changes**: for entities, always re-create under the new schema (producer's responsibility, not consumer's); keep old stream for forensics, produce new entities to a new stream. For events, create a new stream; old consumers migrate in their own time.

**Event design principles**:
- Tell the truth, the whole truth: the event is the complete record; consumers should not consult any other source
- One event definition per stream — mixing types makes schema validation impossible
- Use narrowest data types — avoid string for numbers, integers for booleans, strings for enums
- Keep events single-purpose — type discriminator fields ("productType: Book/Movie") are an anti-pattern; they couple unrelated business domains into one schema, accumulate nullable fields, and complicate evolution
- Minimise event size — check whether data is truly related and bounded context is scoped correctly
- Involve prospective consumers in event design
- Avoid events as semaphores/signals — if the event doesn't carry the result, there are two sources of truth

### Chapter 4 — Integrating Event-Driven Architectures with Existing Systems

**Data liberation**: the publication of cross-domain data from existing systems to event streams as part of an EDM migration strategy. The liberated stream must eventually-consistently replicate the source data store; it becomes the single source of truth for downstream consumers.

Three data liberation patterns (→ [[patterns/outbox-pattern]]):
1. **Query-based**: bulk load + incremental timestamp/ID polling. Flexible (any data store), customisable (views isolate internal models), but misses hard deletes, intermittent capture, potential resource load on source
2. **Log-based (CDC)**: reads database write-ahead logs or binary logs (Debezium for MySQL/PostgreSQL). Low latency, minimal performance impact, tracks hard deletes — but exposes internal data models and denormalization must happen externally; Debezium and Maxwell are primary tools
3. **Outbox table**: application writes to internal table + outbox in same transaction; relay publishes from outbox. Schema validation before writing (serialisation-before-commit) is the strongest approach; isolates internal data model; requires application code changes

**Eventification**: a downstream event processor that denormalises normalised relational streams (combining User + Location + Employer) into single public-facing entity events — keeps internal models private while providing clean public contracts.

**CDC frameworks** (Kafka Connect, Apache Gobblin, Apache NiFi): useful for bootstrapping and for maintenance-only legacy systems, but create cross-team dependency on the framework team. Prefer having each team own its own event production (outbox or native) to avoid connector fragility and encourage "event-first" thinking.

**Data sinking**: consuming events from the broker and writing to a data store — the inverse of liberation. Enables legacy non-event-driven systems to receive event data without modification.

### Chapter 5 — Event-Driven Processing Basics

The basic EDM microservice loop: consume event → process → emit output events. Introduces stateless topology primitives (→ [[streams/stream-processing]]):

**Transformation operators**: Filter (0 or 1 output), Map (changes key and/or value), MapValue (value only, no repartition required), Custom (arbitrary logic, external calls). Streams can be branched to multiple outputs or merged from multiple inputs; merging requires a coherent unified schema.

**Repartitioning**: producing a new stream with a different key, partition count, or partitioner algorithm to satisfy data locality requirements for downstream stateful consumers. **Copartitioning**: repartition two streams to the same count + same partitioner so events with the same key always land on the same consumer instance — the prerequisite for stateful joins.

**Partition assignment**: the partition assignor distributes partitions equitably across consumer instances. Round-robin (default) keeps copartitioned groups together. Static assignment keeps state-heavy partitions pinned to specific instances even when consumers leave and rejoin. Custom assignment based on external signals (e.g., consumer lag) is also possible.

Stateless failure recovery is trivial: new instance joins the consumer group and inherits partitions. No state restoration required.

### Chapter 6 — Deterministic Stream Processing

Goal: a microservice should produce the same output when reprocessing historical data as it did in near-real-time. Best-effort determinism is achievable; full determinism is not (wall-clock dependencies, external system calls, intermittent failures are inherently nondeterministic).

**Timestamp types**: event time (producer-assigned), broker ingestion time, consumer ingestion time, processing time. Event time is always preferred for determinism. Clock synchronisation via NTP provides ±100ms accuracy across the internet; local LAN NTP achieves <1ms.

**Event scheduling**: when consuming from multiple partitions, select the event with the oldest timestamp for processing. Without scheduling, partition-order consumption would produce different results in real-time vs reprocessing (→ [[streams/stream-processing]]).

**Watermarks vs stream time**: watermarks (Flink, Beam, Spark, Samza) propagate downstream declarations that all events ≤ time T have been processed; a node with multiple inputs sets its event time to the minimum of all inputs. Stream time (Kafka Streams) tracks the highest event-time seen so far; never decremented; each subtopology (split at repartition boundaries) maintains its own stream time independently.

**Late event handling**: drop, wait, or grace period — see [[streams/stream-processing]] for full taxonomy. Strategy must be business-defined, not engineering default.

**Reprocessing**: reset consumer offsets to the beginning; recalculate all stateful consumers; assess volume/time impact; gate side-effects (emails, payments) against replay (→ [[streams/stream-processing]]).

### Chapter 7 — Stateful Streaming

Introduces the internal vs external state store taxonomy (→ [[streams/stream-processing]]):

**Internal state stores**: co-located with the microservice (RocksDB is the canonical implementation). Partition-local materialization. **Changelog**: a compacted broker-backed stream that checkpoints state changes, enabling fast recovery without full input stream replay. **Hot replicas**: secondary copies of materialized state on standby instances — zero-downtime failover at the cost of extra disk. **Global state stores**: materialize all partitions to every instance; for lookup/dimension tables only, not for driving event logic (would produce duplicate output).

Performance benchmark: RocksDB on local SSD = ~65μs / 15,400 req/s per thread. With 1ms network latency (network-attached disk) = ~939 req/s — 16× reduction.

**External state stores**: any technology; full data locality benefit (cross-partition queries); race condition risk (multiple instances writing from independent stream times); each microservice must own its own state — sharing state between microservices is a strong anti-pattern.

**Effectively once processing** (→ [[streams/stream-processing]], [[distributed/idempotency]]): with broker transactions (Kafka) — atomic commit of offsets + changelog + output events; without broker transactions — deduplication via dedupe IDs (hash of event fields, TTL-bounded store, partition-local); or state store transactions (store offsets in state store for atomic state+offset updates, but output events remain at-least-once).

**Rebuilding vs migrating**: rebuilding from source streams is always the safest approach after schema changes; migration is possible for simple additive changes but risky for complex ones.

### Chapter 8 — Building Workflows with Microservices

Covers choreography and orchestration in the EDM context (→ [[patterns/saga]]):

**Choreography**: each service reacts to its input events independently; no central coordinator; emergent workflow from service relationships. Easy to add new steps; brittle to re-ordering; monitoring requires materializing each event stream. Best for simple workflows with 2–3 services and stable ordering.

**Orchestration**: a central orchestrator contains all workflow logic and issues commands to worker microservices; workers contain only their bounded context's business logic (not the orchestrator). The orchestrator tracks workflow state in a materialized store — easy to query and monitor.

**Anti-pattern: God orchestrator** — an orchestrator that issues granular commands to weak minion services. Breaks bounded contexts, produces poor encapsulation, and makes scaling ownership across teams impossible. The orchestrator should delegate full responsibility; workers should be self-contained.

**Event-driven vs direct-call orchestration**: event-driven is more durable (broker isolates failures, built-in retry); direct-call is faster and simpler (good for FaaS workflows). Often mixed in the same workflow.

**Distributed transactions (sagas)**: choreographed sagas work for simple 2–3 service transactions with stable ordering; orchestrated transactions better for complex workflows (centralised rollback, support for timeouts and human inputs, single output stream for transaction results).

**Compensation workflows**: when strict rollback is impractical or worse for the user than a business-level remedy. Not all workflows need to be perfectly reversible — compensation is often preferable to rollback for customer-facing systems.

### Chapter 9 — Microservices Using Function-as-a-Service

FaaS ("serverless") is best understood as a basic producer/consumer implementation that regularly fails — a function executes, terminates, and must re-establish any connections on the next invocation. This framing shapes all FaaS design decisions.

**Trigger types**: event-stream listener (integrated in AWS/GCP/Azure for proprietary brokers; external via Kafka Connect for open source brokers), consumer group lag monitoring (function starts when lag exceeds threshold), scheduled (periodic polling), webhook (direct invocation), resource event (file system/data store changes).

**Critical limitation**: major cloud providers (AWS/GCP/Azure) retain events in their proprietary brokers for only 7 days. This is insufficient for EDM architectures requiring reprocessing and infinite retention. Open source FaaS frameworks (OpenFaaS, OpenWhisk, Kubeless) integrate with Kafka/Pulsar and are preferable for EDM.

**State**: FaaS functions must use external state stores — local state is not guaranteed across invocations. Azure Durable Functions is an exception; it abstracts state persistence automatically.

**Offset commit timing**: commit offsets *after* processing completes (at-least-once guarantee). Committing at start risks data loss if the function fails.

**Ordering and determinism**: FaaS lacks built-in event scheduling and copartitioned state processing. Out-of-order processing is a real risk when calling other functions asynchronously. For deterministic processing, use orchestrated synchronous function calls or a full streaming framework.

**Scaling**: scale based on consumer lag; use step-based scaling or hysteresis to avoid constant consumer group rebalancing (which stalls processing).

**Best fit for FaaS**: stateless processing, highly variable load, simple stateful logic not requiring event ordering.

### Chapter 10 — Basic Producer and Consumer Microservices

BPC = consume → apply business logic → emit output events. Uses basic client libraries with no built-in event scheduling, watermarks, changelogs, or local stateful scaling. Best for external state stores.

**Where BPC works well**:
- **Legacy system integration**: embed a basic client in the legacy system, or use a sidecar BPC to sink event stream data into the legacy data store without modifying the legacy codebase
- **Gating pattern**: wait for all required prerequisite events to arrive before emitting output; order-independent; materialise each input stream into a local table and check for completeness before emitting
- **Data-heavy workloads**: when the business logic is offloaded entirely to an external data layer (ML model, geospatial store, full-text search) — BPC acts as an integration layer
- **Independent scaling**: processing instances and data store can be scaled independently when their load patterns differ (e.g., sleep/wake cycles)

**Hybrid BPC**: delegate complex operations (large joins, aggregations) to an external stream-processing framework (Spark, Flink, KSQL); receive results back via an intermediate event stream. Unlocks framework capabilities without rewriting the microservice.

**Limitations**: requires custom library development for event scheduling, timestamp-based windowing, and copartitioned stateful processing — capabilities that heavyweight/lightweight frameworks (Ch 11–12) provide natively.

### Chapter 11 — Heavyweight Framework Microservices

Covers Apache Spark, Flink, Storm, Heron, and Beam (→ [[streams/stream-processing]]).

**Two defining characteristics**: (1) require a dedicated resource cluster (master + worker nodes + optional ZooKeeper); (2) use their own internal mechanisms for failure recovery, resource allocation, and shuffling — distinct from the event broker and CMS.

**Checkpointing**: operator state (partitionId → offset) + key state (key → value) must be atomically snapshotted to durable external storage (HDFS). Rebuilt before any new events are processed on recovery.

**Dynamic scaling**: cluster restart required for most frameworks. Spark's external shuffle service (ESS) enables limited live scaling by decoupling upstream producers from downstream consumers of shuffled events. Spark 3.0 added a checkpoint-free alternative.

**Deployment evolution**: CMS-integrated deployment (Flink/Spark on Kubernetes) allows each job to have isolated worker resources managed by the CMS — merging heavyweight and microservice deployment patterns.

**Limitations for EDM**: primarily analytical workloads (ETL, windowed aggregations, anomaly detection); JVM-only; not all frameworks support indefinite stream materialization required for gating patterns and table-table joins.

### Chapter 12 — Lightweight Framework Microservices

Contrasts with heavyweight; no dedicated cluster (→ [[streams/stream-processing]]).

**Canonical implementations**: Apache Kafka Streams (embedded library; KStream + KTable API; KSQL via Confluent; foreign-key table-table joins) and Apache Samza embedded mode (similar features; predates Kafka Streams; uses ZooKeeper by default but supports Kubernetes).

**Key architectural benefit**: event broker acts as the shuffle layer (internal event streams replace cluster-internal communication) AND as the state recovery layer (changelogs replace checkpoints to HDFS). Applications deploy and scale like any other microservice.

**Dynamic scaling**: add instances → consumer group rebalance → changelog replay → resume. No application restart required.

**Trade-off**: both implementations are Kafka-only and JVM-only; less portable than heavyweight frameworks.

The stream-table-table join example in Kafka Streams (Advertisement-Sessions → conversion aggregation → join with Advertisement entity stream) illustrates how the lightweight framework handles complex relational event processing without a heavyweight cluster.

### Chapter 13 — Integrating Event-Driven and Request-Response Microservices

EDM and request-response are complementary, not competing. External systems (mobile apps, IoT, third-party APIs, browsers) predominantly communicate via request-response; the receiving service's job is to translate these into the event stream where appropriate (→ [[concepts/api-design]]).

**External event types**: *autonomously generated* events originate from client products unprompted (analytical events, sensor readings, usage metrics — Netflix watch history is the canonical example); *reactively generated* events arise from your service making a blocking call to a third-party API and converting the response to an event (payment gateway, email service). Both types are received via request-response and fed into the event stream.

**Multi-version handling for analytical events**: mobile and IoT apps cannot be force-upgraded on every schema change. Treat external event sources as a set of microservice instances; the event receiver service must handle multiple concurrent schema versions, routing each to the correct output stream by schema type.

**Third-party API integration**: embed a blocking call inside the consume-process-emit loop; commit offsets only after success. Drawbacks: nondeterminism on reprocessing (the API may return different results than during original processing), and reprocessing can flood the third-party API with a burst of requests — throttle with quotas and microservice-level rate limiting.

**Serving state via REST API — internal state stores**: each instance materializes only its assigned partition shards; request routing must reach the instance hosting the requested key. The correct instance is determined by applying the partitioner logic to the request key to get the partition ID, then cross-referencing the consumer group's partition assignments. Round-robin load balancing gives a hit rate of `1/instanceCount`. A smart load balancer pre-routes using partition + consumer group assignments, but this couples the LB to the topology — requires co-deployment and testing. Every instance must still handle misdirected requests and redirect.

**Serving state via REST API — external state stores**: any instance can serve the full domain; no routing required; scaling can exceed partition count (extra instances don't process events but serve requests and act as partition failover standby). Two sub-patterns:
- *All-in-one*: same microservice executable processes events and serves the REST API; simplest deployment model.
- *Separate microservice*: API server is a distinct executable sharing the external state store; same bounded context + same code repo + deployed together. Advantages: language independence, failure isolation between processor and server. Disadvantages: schema/topology changes must be coordinated across both executables; couples two services to a shared data store (softened by treating them as a composite unit).

**Event-first request handling**: parse the incoming request into an event, publish to stream, process asynchronously, materialize to state. Provides a durable record; enables any service to consume the data. Trade-off: read-after-write is eventually consistent (event must materialize before it can be joined or queried); mitigation — cache the just-written value in memory for immediate non-join use.

**Asynchronous UI**: user-facing services consuming event streams must communicate processing latency to the user ("please wait" with disabled input, spinning indicator). Push the UI update when the event has been materialized — business rules govern when a materialized state is "ready". Account for: initial catch-up from time-zero, ongoing updates, retry duplicates (ensure idempotent consumers).

**Approval pattern (gating with human-in-the-loop)**: multiple bounded contexts, each as a separate microservice; human approvals are captured as events; each approval gate produces an event only when its approval conditions are met; downstream services consume approval events, not the original request events. This provides a full audit trail and allows the UI to be stateless (all state is in the event streams). The newspaper designer → editor approval → advertiser approval example illustrates cascading human-in-the-loop gating across three distinct bounded contexts.

**Microfrontends**: frontend components aligned to bounded contexts; each backed by its own EDM microservice. Pairs naturally with event-driven backends because both are composition-based — each service materializes exactly the state it needs from the event streams, and the microfrontend renders that state. Requires a common style guide and lean shared UI element library to maintain visual consistency. Loading state must be handled gracefully for individual component failures. See [[concepts/architecture-quantum]] for the quantum-based rationale.

### Chapter 14 — Supportive Tooling

EDM at scale requires tooling that the organisation can self-serve. Most tooling is custom-built; few open source implementations cover the full surface area.

**Microservice-to-team assignment system**: the foundational tool — tracks which team owns which microservice and which event stream. All other tools depend on it: offset management requires ownership checks; ACL changes require owner approval; schema notification requires routing to the team contact. Build or acquire this first.

**Event stream metadata tagging**: attach metadata to streams; only the owning team can modify tags. Key tags: *owner* (the microservice that writes it), *PII* (personal identifiers — access requires explicit approval), *financial* (billing/revenue events), *namespace* (bounded context hierarchy — hides streams from outside-namespace services), *deprecation* (grandfathered streams blocked from new consumers; delete when consumer count reaches zero). Custom tags should be defined per organisation.

**Quotas**: set at event broker level; prevent accidental denial-of-service from a chatty producer or highly parallelised consumer group; limits CPU/IO share for a given producer or consumer. Set minimum resource guarantees for steady-state services; exempt producers receiving third-party input (throttling them can cause data loss).

**Schema registry workflow**: producer serialises event → registers schema with registry → gets back a schema ID → appends the short ID to the serialised event → caches the ID locally. Consumer receives event → reads schema ID → looks up schema from local cache or registry → deserializes event → caches new schemas. Confluent's implementation stores schemas as events in the broker itself (durable by default). This eliminates schema payload from each event (only the compact ID travels), enables data discovery via free-text search, and provides a single reference for schema evolution.

**Schema creation/modification notifications**: alert consuming teams when an upstream schema they depend on changes. ACLs (next) identify which services consume which streams; cross-referencing those ACLs against the schema change log identifies affected teams. The microservice-to-team assignment system routes the notification to the right team.

**ACLs — enforcing the single writer principle**: each microservice is assigned WRITE permission to only its output streams; no other service can write them. Typical permission set: input streams → READ; output streams → CREATE + WRITE; internal/changelog streams → CREATE + WRITE + READ. Enable ACL enforcement from day one — retrofitting is extremely painful (requires auditing every existing connection). The granting/revoking of permissions should itself be stored as events (immutable audit log). ACLs also enable automatic orphan detection: a stream with no consumer READ permissions and no active producer can be marked for deletion.

**Offset management**: three operations — *reset* (reprocess from the beginning when logic changes); *advance* (skip old data, consume from latest); *specify* (set offset to an exact point in time, e.g. N minutes before a crash for disaster recovery). Access is gated by the microservice-to-team assignment system.

**State management and application reset**: tooling must be able to delete internal streams, changelog streams, and external state store materializations, then reset consumer group offsets to the start — enabling a clean reprocessing from scratch. Ownership-gated: only the microservice owner or admin can reset state.

**Consumer offset lag monitoring**: `lag = most_recent_offset − last_committed_offset`. Burrow (Apache Kafka) computes lag using historical deviation from norms, avoiding false positives in high-throughput streams where lag is never exactly zero. Hysteresis (a scaling tolerance threshold) prevents endless scale-up/scale-down loops when lag oscillates around the threshold.

**Streamlined microservice creation (7 steps)**: (1) create repo; (2) wire CI pipeline; (3) configure webhooks; (4) assign team ownership; (5) register input stream ACLs; (6) create output streams with write permissions; (7) apply microservice template/code generator. Automation ensures new projects inherit current tooling and conventions rather than copying a stale older project.

**Dependency tracking and topology visualisation**: derive all producer–consumer relationships from the ACL permission graph — guaranteed complete, because no service can operate without registering permissions. ACL-derived topology enables: data lineage tracing (which ancestor services produced this event), team overlay visualisation, data discovery, interconnectedness metrics (cross-team stream connections as a coupling proxy), and mapping of microservices to business requirements. Contrast with self-reporting: voluntary and inherently incomplete.

### Chapter 15 — Testing Event-Driven Microservices

EDM topology modularity makes testing tractable: each service has well-defined I/O (event streams, state stores, request-response API). The chapter is explicitly a companion to, not a replacement for, general testing resources (→ [[concepts/api-testing]]).

**Unit testing**: stateless functions are trivial — test filter, map, and custom transformers with boundary conditions. Stateful functions need a state store available for the test duration (mock for isolation; local real implementation for fidelity). Topology testing frameworks (Kafka Streams `TopologyTestDriver`, Spark `MemoryStream`, Flink/Beam built-ins) exercise the full topology without a live broker — inject events with controlled timestamps and ordering; assert on output streams.

**Schema evolution testing**: pull schemas from schema registry; run compatibility checks as part of CI submission. Some frameworks generate schemas from code at compile time, enabling automatic comparison.

**Local integration testing**: two approaches — *embedded* (start broker + schema registry + topology in the same JVM; JVM-only, works well for Kafka/Flink which are all JVM); *containerized* (all dependencies in a shared container; polyglot-compatible, more portable). Test both event-driven and request-response logic simultaneously in local integration.

**Event data strategies**: (1) production data — accurate but security risk, potential prod impact from quota-violating copy burst; (2) curated datasets — controlled but becomes stale and schema changes require updates; (3) schema-generated mock events — no prod impact, supports fuzzing, but relationship integrity must be manually ensured.

**Shared testing environment anti-pattern**: tragedy of the commons — abandoned streams, stale data, interfering load tests. Disposable ephemeral environments (requires multicluster tooling investment) are the preferred alternative.

**Production testing**: run new microservice with its own consumer group and output streams alongside existing production services; excellent for smoke testing; risky for load testing; requires strict cleanup.

### Chapter 16 — Deploying Event-Driven Microservices

Deployment complexity in EDM is amplified by stateful services that may require state store rebuilds and event stream reprocessing on deployment (→ [[concepts/deployment-pipelines]]).

**Key deployment principles**: give teams deployment autonomy (if deployments require synchronisation across services → bounded context smell); standardise process via CI; plan for reprocessing burst impacts on downstream services and SLAs; negotiate breaking schema changes with downstream teams before deploying.

**Basic full-stop pattern (5 steps)**: (1) commit → trigger CI; (2) unit + integration tests in ephemeral environment; (3) pre-deployment validation (stream existence, ACL permissions, schema compatibility); (4) stop → reset → deploy → start; (5) post-deployment validation (lag, logs, endpoint health).

**Rolling update pattern**: update one instance at a time while keeping the service live. Prerequisite: no breaking changes to state store schema, topology structure, or internal event schemas. Brief period of mixed old/new logic during rollout.

**Breaking schema change patterns**: *eventual migration* (two streams — old deprecated, new current; consumers migrate in their own time; risk: migration lingers indefinitely); *synchronised migration* (single switch; all consumers must update before cutover; rarer; high risk if consumers fail their migration). Entity stream changes always require re-creating the entity stream.

**Blue-green deployment**: zero downtime; works for event-consuming services; DOES NOT WORK for event-producing services (both blue and green write to the same output streams → entity overwrites or event duplicates). Use rolling update or full-stop for producers.

### Chapter 17 — Conclusion

The conclusion provides a synthesis of the book's core arguments, not new content. Key summaries worth capturing:

**Communication layers**: a mature data communication layer decouples the ownership and production of data from its access and consumption — services no longer need to perform double duty as both business logic processors and data-access APIs for other services. Failures in one producer no longer make data inaccessible; consumers continue consuming from the broker during producer outages.

**Microservice tax components** (the essential infrastructure every EDM organisation must pay for):
1. Event broker
2. Schema registry and data exploration service
3. Container management system (CMS)
4. Continuous integration, delivery, and deployment service
5. Monitoring and logging service

Not all organisations will pay all five components at once — start with the event broker or CMS, then add others as needed. Cloud providers (AWS, GCP, Azure) significantly reduce overhead.

**Not all microservices need to be "micro"**: organisations that haven't yet paid the microservice tax can use fewer, larger services and still adopt EDM principles to decouple bounded contexts from one another. The transition path is clear: put important business entities and events into the event broker; use the event broker as the single source of truth; avoid direct calls between services.

**Final position**: the data communication layer is the essential architectural contribution of EDM — it extends the power of organisational data to any service that requires it, eliminates access boundaries, and reduces unnecessary coupling caused by request-response integration patterns.

## Notable Quotes

> "One of the tenets of event-driven microservices is that core business data should be easy to obtain and usable by any service that requires it." (ch. 1)

> "An event must describe as accurately as possible what happened and why. It is a statement of fact and, when combined with all the other events in a system, provides a complete history of what has happened." (ch. 3)

> "CDC tools are not the final destination in moving to an event-driven architecture, but instead are primarily meant to help bootstrap the process." (ch. 4)

## Related Pages

- [[concepts/bounded-contexts]] — DDD foundations; three communication structures
- [[styles/event-driven-architecture]] — expanded with BEDM's event broker and microservice fundamentals
- [[patterns/outbox-pattern]] — data liberation patterns from ch. 4
- [[concepts/contracts]] — schema evolution, event design principles, schema registry workflow, ACL enforcement (ch. 3, 14)
- [[streams/event-sourcing-cqrs]] — table-stream duality, materialization, CDC
- [[databases/encoding-and-evolution]] — Avro, Protobuf, schema evolution
- [[concepts/conways-law]] — three communication structures; Conway's Law in EDM context
- [[concepts/api-design]] — serving state from internal/external state stores, event-first request handling (ch. 13)
- [[concepts/architecture-quantum]] — micro-frontends aligned to bounded contexts (ch. 13)
- [[concepts/api-testing]] — EDM testing: topology unit testing, integration testing strategies, event data sourcing (ch. 15)
- [[concepts/deployment-pipelines]] — EDM deployment patterns: rolling update, breaking schema change, blue-green constraints (ch. 16)

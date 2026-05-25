---
title: "Stream Processing"
type: stream
tags: [streaming, kafka, events, windowing, exactly-once, cep, stateful-processing, determinism, repartitioning, copartitioning, late-events, reprocessing]
sources: [designing-data-intensive-applications, building-event-driven-microservices, foundations-of-scalable-systems]
created: 2026-05-13
updated: 2026-05-21
---

# Stream Processing

Stream processing handles data as an unbounded sequence of events — not a bounded dataset processed offline, but a never-ending flow processed with low latency. The key abstraction is the **event**: a small, immutable, self-contained, timestamped record representing something that happened. Events are grouped into **topics** or **streams**. Stream processing is the online counterpart to batch processing; as Apache Flink's designers put it, "batch is a special case of streaming."

## Lambda and Kappa Architectures

Gorton (→ [[sources/foundations-of-scalable-systems]] ch. 15) frames the evolution from batch to stream with two named patterns:

**Lambda architecture (2011):** A hybrid incorporating both batch and stream processing:
- **Batch layer** — processes large volumes of new event data periodically (Hadoop); updates databases on a minutes-to-hours cadence
- **Speed layer** — processes the same events as a stream in real time (Storm) to compensate for the lag between batches; provides low-latency approximations
- **Serving layer** — stores outputs from both layers; queries combine batch and speed results

Lambda's downside: two separate processing stacks (batch and stream) for the same data must be maintained in sync — high operational cost.

**Kappa architecture:** Events are stored in an immutable log (Kafka); consumed and processed as a continuous stream without any separate batch layer. Simpler — one processing paradigm, one codebase. Reprocessing is handled by replaying the log from the beginning with a new consumer group. Now the dominant pattern for new stream processing systems.

---

## Kafka Production Mechanics

Gorton (→ [[sources/foundations-of-scalable-systems]] ch. 14) provides an operator-level view of Kafka that complements the architectural framing from other sources.

**"Dumb broker/smart clients"**: Kafka's broker is responsible only for durable, ordered, partitioned storage. All intelligence — offset tracking, consumer group coordination, semantic interpretation of keys — lives in the client libraries. This maximises broker throughput and makes the broker horizontally scalable without caring about consumer progress.

**Producer async batching:**
- `batch.size` — maximum bytes per batch before flushing; larger values improve throughput at cost of latency
- `linger.ms` — intentional wait period for additional messages to accumulate into a batch; 0 = no wait, send immediately
- `acks=0` — fire-and-forget; highest throughput; data loss on broker failure
- `acks=1` — leader acknowledges; data loss if leader crashes before follower sync
- `acks=all` — all in-sync replicas (ISR) must acknowledge; highest durability
- `enable.idempotence=true` — producer assigns sequence numbers per partition; broker deduplicates retries within a session; combined with `acks=all` achieves exactly-once from the producer perspective

**Consumer delivery semantics via commit timing:**
- `poll()` long-polls the broker for messages (returns a batch)
- **At-most-once**: call `commitSync()` before processing — crash after commit but before processing = lost message
- **At-least-once**: call `commitSync()` after processing — crash before commit = message redelivered on restart
- `consumer.seek(partition, offset)` — manually reset to any offset; enables replay or skip

**Semantic partitioning:** Null key → round-robin; non-null key → `hash(key) % partitions` → same key always routes to same partition, guaranteeing per-key ordering. No total ordering across partitions. Partition count can be increased but **never decreased** — decreasing would break existing key-to-partition assignments for live consumers.

**Consumer groups:**
- All consumers in a group collectively cover all partitions; each partition assigned to exactly one consumer per group
- Consumers beyond the partition count are idle
- **Group coordinator** (broker) tracks membership and triggers rebalances on join/leave
- **Group leader** (first consumer to join) executes the partition assignment algorithm
- **CooperativeStickyAssignor** — incremental rebalance: revoke only the minimum partitions needed for balance, avoiding stop-the-world global rebalances

**ISR and durability:**
- **ISR (In-Sync Replicas)** — replicas caught up to leader within a configurable lag threshold; replicas falling behind are dropped from the ISR
- `acks=all` requires all ISR members to acknowledge before the producer receives confirmation
- `min.insync.replicas=2` — producer write fails (returns error) if ISR size drops below 2; prevents silent data loss when only the leader is alive
- Trade-off: higher `min.insync.replicas` → stronger durability, reduced write availability during partial broker outages

**Real-world scale — Slack:** 1B+ messages/day on 16 brokers with 32 partitions per topic.

---

## Message Broker Taxonomy

Two fundamentally different broker designs determine what stream processing guarantees are achievable.

### AMQP/JMS-Style Brokers (RabbitMQ, ActiveMQ)

- **Message lifecycle**: deleted after consumer acknowledgment.
- **Fan-out**: multiple consumers require separate queues; broker copies messages.
- **Load balancing**: multiple consumers on one queue share the load; each message goes to one consumer.
- **Redelivery**: unacknowledged messages are redelivered — if a consumer crashes, another picks up.
- **Ordering risk**: load balancing + redelivery = messages can arrive out of order at consumers.

Suited for task queues where each message is a job to be processed exactly once by one worker.

### Log-Based Message Brokers (Kafka, Amazon Kinesis, Azure Event Hubs)

- **Structure**: partitioned append-only log per topic. Producers append; consumers track their offset.
- **Message retention**: messages are never deleted by the broker (until log compaction or configurable retention period). Default retention ~7 days; disk buffer at full write speed ~11 hours.
- **Sequential delivery**: within a partition, messages are delivered in strict order to a consumer.
- **Fan-out**: trivially supported — multiple consumer groups each maintain their own independent offset. Replaying messages is trivial.
- **Throughput**: constant regardless of how long messages are retained (sequential I/O).
- **Partitioning**: throughput scales with partition count. A consumer group has at most one consumer per partition.

**Log compaction**: Kafka can compact a log by keeping only the **most recent value per key**. Tombstones (null values) indicate deleted keys. After compaction, the log acts as a full snapshot of the key-value state — consumers can reconstruct a full database from a compacted log without a separate initial snapshot.

This is the mechanism that makes CDC and event sourcing work at scale (→ [[streams/event-sourcing-cqrs]]).

## Stream Processing Use Cases

### Complex Event Processing (CEP)

Queries are persistent (stored in the processor); events flow past and are matched against query patterns. Useful for:
- Fraud detection (pattern: charge followed by international charge within 30 minutes)
- Infrastructure alerting (CPU spike followed by disk I/O spike)
- Business rule matching (order followed by no shipping confirmation within 2 days)

SQL-like languages for pattern matching; Esper, Drools, Apache Storm Trident.

### Stream Analytics

Windowed aggregations over event streams: count events per minute, compute percentiles of response times, detect metric anomalies. Probabilistic data structures (HyperLogLog for distinct counts, t-digest for percentiles) enable approximate answers with bounded memory.

### Materialized View Maintenance

As events arrive, update a derived data store (search index, cache, analytics store) continuously. This extends the batch job output pattern to near-real-time. The event log is the source of truth; derived stores are rebuiltable from replay.

### Search on Streams

Elasticsearch **percolator**: store queries, flow documents past them — match documents against standing queries as they arrive. Used for alerts and notifications.

## Stateless Processing Topology Primitives

The minimal event-driven microservice follows a consume-process-emit loop: consume an event from an input stream, apply processing logic, produce zero or more output events. (→ [[sources/building-event-driven-microservices]] ch. 5)

### Transformation Operators

| Operator | Description | Output cardinality |
|----------|-------------|-------------------|
| Filter | Propagate event only if it meets criteria | 0 or 1 |
| Map | Change event key and/or value | Exactly 1 |
| MapValue | Change only the value (no key change; no repartition required) | Exactly 1 |
| Custom | Apply arbitrary logic, look up state, call external systems synchronously | Varies |

**Branching**: route events to different output streams based on a condition (e.g., event type, error flag). Standard pattern: route unprocessable events to a dead-letter stream rather than dropping them.

**Merging**: consume from multiple input streams and emit to a single output stream. Only merge when a coherent unified schema for the merged domain can be defined.

### Repartitioning and Copartitioning

**Repartitioning** produces a new event stream with a different partition count, event key, or partitioner algorithm. Required when the key must change to ensure data locality for downstream stateful processing, or when partition count needs increasing for parallelism.

**Copartitioning** is the special case where two streams are repartitioned to have the same partition count *and* the same partitioner algorithm. Copartitioned streams guarantee **data locality**: a consumer instance assigned partition N of stream A always holds partition N of stream B — the prerequisite for stateful streaming joins without cross-partition communication.

### Partition Assignment

The partition assignor distributes partitions across consumer instances:
- **Round-robin** (default): equitable distribution; copartitioned groups are kept together on the same instance
- **Static**: specific partitions fixed to specific consumers; no reassignment when a consumer leaves — preferred when large volumes of stateful data are materialized per instance
- **Custom**: tailored to external signals (e.g., balanced by consumer lag)

Stateless processor failures recover trivially: a new instance joins the consumer group and inherits the revoked partitions. No state restoration is needed.

## Windowing

Time-based windowing groups events into finite sets for aggregation:

| Type | Definition | Use case |
|------|-----------|---------|
| **Tumbling** | Fixed size, non-overlapping (1-minute windows: [0,60), [60,120)) | Metrics per minute |
| **Hopping** | Fixed size, overlapping (5-min window, advance 1 min) | Smoothed metrics |
| **Sliding** | All events within a time interval of each other (any 5-minute span) | Session correlation |
| **Session** | Grouped by inactivity gap (end window after N minutes of silence) | User sessions |

### Late Event Handling

How to handle late events is a **business requirement**, not an engineering default. Strategy options:

| Strategy | Behaviour | Trade-off |
|----------|-----------|-----------|
| **Drop** | Discard the event; window is already closed | Lowest latency; data loss for late arrivals |
| **Wait** | Delay window output for a fixed period before emitting | Higher determinism; higher latency; old windows must be retained |
| **Grace period** | Emit when window closes; keep window available for an additional period and re-emit if late events arrive | Responsive + deterministic; more complex state management |

Key questions before choosing: How likely are late events? What is the business impact of dropping them? How much state can be retained while waiting? (→ [[sources/building-event-driven-microservices]] ch. 6)

## Event Time vs Processing Time

**Processing time**: when the event was received by the processor. Simple but non-deterministic — delays, retries, and restarts produce different results.

**Event time**: when the event actually occurred (embedded timestamp). Deterministic — replaying the same log produces the same result. **Always prefer event timestamps** for correctness.

**The straggler problem**: events arrive out of order (especially from mobile clients with intermittent connectivity). The processor must decide when a window is "complete."

Solutions:
1. **Ignore stragglers** (with a metric tracking dropped events).
2. **Publish a correction** when a straggler arrives: retract the earlier result and emit a corrected value.

**Three-timestamp approach for mobile clients**: record event time (device clock), send time (when device transmitted), receive time (server received). The offset between send and receive time estimates clock skew. Use this to adjust event timestamps.

**Timestamps in distributed systems**: four timestamp types exist in an event-driven workflow — *event time* (producer-assigned at occurrence), *broker ingestion time* (assigned on write to the event broker), *consumer ingestion time*, and *processing time* (wall-clock when consumed). Event time is almost always the right choice; broker ingestion time is a fallback when producer clocks are unreliable. Timestamps are synchronised via NTP; inter-datacenter skew can reach ±100ms and is a relevant factor when correlating events across regions.

**Event scheduling**: when consuming from multiple partitions, the common scheduler selects the event with the *oldest timestamp* across all assigned partitions for dispatch. Without event scheduling, round-robin or offset-based selection would produce non-deterministic ordering of interleaved events from different streams.

**Watermarks** (Spark, Flink, Beam, Samza): a declaration propagated downstream that "all events with event time ≤ T have been processed." When a watermark passes a window boundary, that window is considered complete and its result can be emitted. A node with multiple upstream inputs sets its event time to the *minimum* of all input watermarks — the slowest upstream determines progress. Trade-off: earlier watermarks → lower latency, more stragglers accepted; later watermarks → higher latency, fewer stragglers.

**Stream time** (Kafka Streams alternative to watermarks): a consumer tracks the *highest event-time timestamp it has processed so far*; this is the stream time. Stream time only increases. An event with an earlier timestamp than the current stream time is "late." Each subtopology (split at repartition boundaries) maintains its own independent stream time. Differs from watermarks: events are processed depth-first (one at a time through the full topology) rather than buffered at each node; cross-instance communication uses the event broker rather than a cluster-internal shuffle.

> **Contradiction**: Bellemare (stream time, Kafka Streams) and DDIA / mainstream frameworks (watermarks, Flink/Spark/Beam) present two distinct mechanisms for tracking event time progress. Stream time is simpler operationally (no dedicated cluster) but less flexible for complex multi-input topologies. Watermarks provide finer-grained control and are better suited to large-scale cluster-based processing.

## Reprocessing

Because event brokers retain immutable logs with per-consumer offsets, consumers can reset their offsets and replay the entire stream — re-running processing as if starting fresh. Steps for safe reprocessing (→ [[sources/building-event-driven-microservices]] ch. 6):

1. **Determine start point**: stateful consumers should reprocess from the beginning of each subscribed stream (especially entity event streams)
2. **Reset relevant offsets**: any stream contributing to stateful processing should be reset; partial resets produce incorrect state
3. **Assess volume and time**: large streams may take hours to reprocess; consider downstream consumer capacity and whether autoscaling is configured
4. **Assess business impact**: some side effects (e.g., sending emails, charging payments) must not repeat on reprocessing — gate such actions on a flag or route them through a separate idempotency-checked path
5. **Scale up during reprocessing**: maximum consumer parallelism reduces reprocessing time; scale down after catching up

> **Note**: events that arrive late during near-real-time processing (marked as late by stream time / watermarks) may appear in the correct position when the stream is reprocessed from the beginning, because the intermittent network or producer delay that caused the lateness is no longer a factor.

## Stateful State Management

Most production microservices maintain state: running totals, aggregation windows, entity materializations, join buffers. (→ [[sources/building-event-driven-microservices]] ch. 7)

Two core abstractions:
- **Materialized state** — a read-only projection rebuilt from an immutable source event stream
- **State store** — a read-write store where the service writes intermediate computations and business state during processing

### Internal State Stores

Co-located with the microservice instance, most commonly via an embedded key/value store (RocksDB).

**Performance**: RocksDB on a local SSD achieves ~65μs random-access read latency (~15,400 req/s per thread). Adding even 1ms network latency (network-attached disk) drops this to ~939 req/s — a 16× throughput reduction.

**Partition locality**: each instance materializes only its assigned partitions; revoked partitions are dropped on rebalance. A **global state store** variant materializes all partitions to every instance — suitable for small, slowly-changing lookup/dimension tables but must not drive event-processing logic (would produce duplicate output).

**Changelog**: a compacted broker-backed stream recording every state store change. Enables state rebuild without full input stream replay. Rebuilding from a changelog (replaying only the latest entry per key) is far faster than replaying all input events.

**Hot replicas**: additional copies of materialized state maintained on standby instances. On failure, the replica holder is promoted immediately — no rebuild time. Trade-off: extra disk for zero-downtime failover.

**Recovery options** (fastest to slowest):
1. Hot replica promotion — immediate
2. Changelog replay — fast (compacted, only latest per key)
3. Full input stream replay — slowest; required if no changelog; all downstream output is reproduced

Scalability is fully offloaded to the broker and compute cluster — each service scales by adjusting instance count.

### External State Stores

Live outside the microservice container (relational databases, document stores, distributed key/value, geospatial search). Each microservice must maintain its own isolated state copy — sharing materialized state between microservices creates tight coupling and is an anti-pattern.

**Full data locality advantage**: all partitions queryable in one store, enabling relational joins, foreign-key lookups, and geospatial queries without partition locality constraints.

**Race condition risk**: multiple instances write to the same external store from independent stream times — instance A may attempt a join on data instance B has not yet written. Results are nondeterministic and non-reproducible.

**Recovery**: snapshot restore (most common; use the store's native backup; store consumer offsets inside the snapshot for exact offset recovery), or rebuild from source streams / changelogs (expensive due to network latency).

**Rebuilding vs migrating**: for complex state schema changes, rebuild from source streams (guaranteed correct). For simple additive changes, migration works but risks subtle errors not caught until much later.

### Effectively Once Processing

**With broker transactions** (Apache Kafka; Pulsar in progress): atomically commit consumer offsets + changelog updates + output events in a single transaction. Producer failure → broker rolls back; consumers skip uncommitted events. Strongest guarantee.

**Without broker transactions — deduplication**: producers assign events a **dedupe ID** (hash of key, values, and creation time — high-cardinality fields only). Consumers maintain a TTL-bounded, partition-local lookup of seen IDs. Expensive; only best-effort within the TTL window. (→ [[distributed/idempotency]])

**Without broker transactions — state store transactions**: store consumer group offsets inside the state store; use the store's own transaction capability to atomically update state and offsets. Achieves effectively once *state updates* but not effectively once *event production* (output events remain at-least-once).

## Stream Joins

Stream processors often need to combine data from multiple streams or tables.

### Stream-Stream Join (Window Join)

Both inputs are event streams. Maintain state of events within a time window, indexed by a correlation ID. When a matching event arrives on the other side, emit the joined record.

*Example*: Join user activity events with ad impression events within a 1-hour session window.

**Challenge**: time alignment — both sides must have compatible time windows, and stragglers may miss their match.

### Stream-Table Join (Enrichment)

One side is an event stream; the other is a slowly-changing database table. The processor maintains a **local copy of the table** (updated via CDC / changelog stream). For each incoming event, look up the local table copy.

*Example*: Enrich payment events with user profile data (name, country) from a user table.

The local table copy is a derived view of the changelog. **Time dependence**: the enrichment uses the table version at the time the event arrived — a slowly changing dimension (SCD). For correct analysis, use a unique ID per table version.

### Table-Table Join (Materialized View Maintenance)

Both inputs are changelog streams (from CDC). Maintain a materialized join view that updates as either side changes.

*Example*: Maintain a "user timeline" view by joining a users changelog with a posts changelog.

## Fault Tolerance and Exactly-Once

Stream processors must handle node failures without losing or duplicating events.

### Microbatching (Spark Streaming)

Collect events into ~1-second micro-batches; process each batch as a mini-batch job. Exactly-once within a batch via batch job semantics. Latency is bounded by batch interval.

### Checkpointing (Apache Flink)

Periodically snapshot all operator state to durable storage. **Barriers**: special marker messages injected into the data stream by the Flink job manager; when all inputs to an operator have received a barrier on **all input streams**, take a snapshot of that operator's state to persistent storage (RocksDB by default) and echo the barrier downstream. The barrier carries an identifier representing its position in the source (e.g., Kafka offset N). Once the barrier reaches all sinks, the checkpoint is complete. On failure, the entire application is restarted, state is restored from the last complete checkpoint, and the source resumes from offset N+1. (→ [[sources/foundations-of-scalable-systems]] ch. 15)

Trade-off: large operator state → expensive checkpointing → throughput impact. `min-time-between-checkpoints` configuration prevents overlapping checkpoint cycles.

Enables **exactly-once semantics** for stateful operators with low latency (seconds to minutes of state loss in worst case).

### Exactly-Once Semantics

At-least-once delivery (retry on failure) + idempotent writes = effectively-once. Two approaches:

1. **Idempotent operations**: include the message offset in the write; the downstream store rejects duplicate writes with the same offset. Works when the operation naturally supports this (e.g., upsert by message ID).

2. **Atomic commit**: write operator state and output in the same atomic transaction (Google Cloud Dataflow, VoltDB). True exactly-once but requires transactional storage.

### Rebuilding State

Operator state (e.g., aggregation windows, join buffers) must survive failures. Options:
- **Remote datastore** (Redis, Cassandra): state kept externally; reads on every operation → high latency.
- **Kafka-backed state** (Samza, Kafka Streams): replicate state updates to a Kafka topic with log compaction. On recovery, rebuild state by replaying the compacted topic — fast because compaction keeps only latest values.
- **Recompute from input**: if computation is fast, re-read input stream from last checkpoint offset. Trades CPU for eliminating external state storage.

## Heavyweight vs Lightweight Stream Processing Frameworks

(→ [[sources/building-event-driven-microservices]] ch. 11–12)

### Heavyweight Frameworks

**Defining characteristics**: (1) require an independent dedicated resource cluster (master nodes + worker executors + optional ZooKeeper for coordination); (2) use their own internal mechanisms for failure recovery, resource allocation, task distribution, and inter-instance communication. Examples: Apache Spark, Apache Flink, Apache Storm, Apache Heron; Apache Beam (common API that runs on multiple runtimes including Google Dataflow).

**Deployment options**: hosted service (managed, most expensive), dedicated full cluster (historical norm, hundreds/thousands of nodes), or CMS-integrated deployment (Kubernetes as cluster resource manager — Flink/Spark support this, making heavyweight jobs deploy like microservices).

**Checkpointing for state**: snapshots combining *operator state* (partitionId → offset mappings) and *key state* (key → state pairs) written atomically to durable external storage (HDFS or equivalent). On recovery, state is loaded from the checkpoint before any new events are processed.

**Shuffle**: cluster-internal communication between worker nodes (requires external shuffle service for dynamic scaling in Spark; Dataflow/Beam handles this transparently).

**Limitations for EDM microservices**: primarily designed for analytical workloads (ETL, window aggregations, anomaly detection); not designed for microservice-style deployment; JVM-only for most frameworks; not all frameworks support indefinite stream materialization (required for gating patterns and table-table joins).

**Multitenancy**: multiple isolated clusters (higher cost) vs namespacing with resource quotas (shared cluster; risk of resource starvation between teams).

### Lightweight Frameworks

**Defining characteristic**: no dedicated cluster — state management, scaling, and failure recovery are delegated entirely to the event broker and CMS. Applications deploy as individual microservices.

**Shuffle**: events are repartitioned into an *internal event stream* in the broker. Downstream instances consume from this stream independently, enabling the broker to serve as the inter-instance communication layer.

**State and changelogs**: internal state stores backed by compacted changelog streams in the event broker (see [Stateful State Management](#stateful-state-management)). New/recovering instances load changelog to rebuild state before processing new events.

**Dynamic scaling without restart**: add instances → join consumer group → reload changelog → resume. No need to restart the application.

**Hot replicas**: secondary state copies allow zero-downtime failover when a primary instance fails.

**Current options** (both Kafka-only, JVM-only):
- **Apache Kafka Streams**: embedded library; deep Kafka integration; KStream (stream) + KTable (materialized table) API; KSQL for SQL queries (via Confluent); supports foreign-key table-table joins
- **Apache Samza embedded mode**: similar feature set; ZooKeeper coordination by default (can swap for Kubernetes); slightly behind Kafka Streams in feature completeness

**Limitation**: tightly coupled to Apache Kafka; not portable to other event brokers.

### Framework Comparison

| Dimension | Heavyweight (Flink, Spark) | Lightweight (Kafka Streams) |
|-----------|--------------------------|----------------------------|
| Dedicated cluster | Required | Not required |
| State storage | Internal memory + checkpoint to HDFS | Changelog in event broker |
| Shuffle mechanism | Cluster-internal communication | Internal event streams in broker |
| Dynamic scaling | Only some frameworks (Spark ESS) | Yes — add instances and rebalance |
| Deployment model | Job submission to cluster | Standard microservice (CMS) |
| Broker portability | Works with Kafka and others | Kafka-only |
| Languages | JVM + Python | JVM-only |
| Best for | Large-scale analytics, ETL, session analysis | Stateful microservices, stream-table joins |

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Definitive treatment — mechanistic explanation of log-based brokers, windowing, joins, fault tolerance; introduces event time vs processing time distinction; frames stream as natural extension of batch (ch. 11) |
| [[sources/understanding-distributed-systems]] | Covers Kafka at a high level as a reliable message broker pattern; focuses on delivery guarantees and partitioning rather than processing semantics |
| [[sources/building-event-driven-microservices]] | Practical microservice-level treatment: stateless topology primitives, partition assignment, stream time (Kafka Streams) vs watermarks, late event strategies, reprocessing, stateful state stores (internal/external, changelog, hot replicas, effectively once), heavyweight vs lightweight framework comparison (ch. 5–7, 11–12) |
| [[sources/foundations-of-scalable-systems]] | Operator-level Kafka framing: "dumb broker/smart clients" design philosophy; producer batching parameters (batch.size, linger.ms, acks=0/1/all, enable.idempotence); consumer commit timing for at-most-once vs at-least-once; semantic partitioning (hash key) and partition count constraints; consumer group mechanics (coordinator/leader/CooperativeStickyAssignor); ISR + min.insync.replicas durability model; compacted topics for GDPR tombstones; Slack scale data point (ch. 14). Lambda vs Kappa architecture distinction; batch vs stream latency comparison; Flink DataStream API, operator chaining, task slots/task managers, job manager HA, lazy execution; Flink barrier-based checkpointing detail (RocksDB backend, barrier propagation, recovery from offset N+1, min-time-between-checkpoints) (ch. 15) |

## Related Concepts

- [[streams/event-sourcing-cqrs]] — event log as the source of truth for stream processors; CDC as the bridge between databases and streams
- [[streams/batch-processing]] — batch is the bounded, offline version of the same computation model
- [[distributed/partitioning]] — stream topics are partitioned; keys determine which partition an event goes to
- [[distributed/idempotency]] — essential for at-least-once delivery to achieve effectively-once semantics
- [[distributed/consistency-models]] — exactly-once semantics relate to linearizability and integrity guarantees

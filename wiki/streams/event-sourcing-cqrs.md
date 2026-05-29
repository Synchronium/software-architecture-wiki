---
title: "Event Sourcing and CQRS"
type: stream
tags: [event-sourcing, cqrs, cdc, immutability, audit, derived-data, streaming, ddd, domain-model]
sources: [designing-data-intensive-applications, learning-domain-driven-design]
created: 2026-05-13
updated: 2026-05-29
---

# Event Sourcing and CQRS

Event sourcing and CQRS (Command Query Responsibility Segregation) are complementary patterns built on a common insight: an **append-only log of immutable events** is a more fundamental representation of system state than a mutable database. The mutable database is a *derived view* of the log — reconstructible by replaying events. "The truth is the log. The database is a cache of the log." (→ [[sources/designing-data-intensive-applications]] ch. 11)

## Key Claims

- **The log is the source of truth; the database is a cache.** State is the integral of an event stream; the changelog is its derivative. Given the log, you can reconstruct any historical state.
- **Event sourcing is application-level; CDC is database-level.** Event sourcing produces domain-meaningful events as primary state; [[streams/change-data-capture]] produces row-change events as derived state. Both bridge the database/streaming gap but at different semantic depths.
- **CQRS separates the write model from the read models.** The write path validates commands and produces events; multiple read paths derive specialised projections (SQL, search index, analytics store) from the same event log. Each read model is independently optimised; consistency between them is eventual.
- **Coordination-avoiding correctness is achievable.** End-to-end operation IDs + idempotency + deterministic derivation give *integrity* without distributed transactions. Timeliness is sacrificed but recoverable; integrity is precious and must be preserved.
- **Immutability has limits.** GDPR right-to-erasure conflicts with truly immutable logs (Datomic excision, Kafka tombstones); long-lived logs accumulate storage; schema evolution must remain backward-compatible forever.
- **Fowler's four-way taxonomy distinguishes related patterns.** Event Notification, Event-Carried State Transfer, Event Sourcing, CQRS — same vocabulary, different architectural commitments. Confusing them creates expectations the implementation cannot meet.

## Change Data Capture (CDC)

CDC is the **low-level** version of this pattern: observe all changes made to a database and extract them as a stream. The source database remains the system of record; CDC makes its write log available to other systems. See [[streams/change-data-capture]] for the full treatment of log-based vs trigger-based vs query-based mechanisms, data-liberation strategies, and the schema-coupling trade-offs.

**Problem solved**: dual writes — when an application writes to a database and separately writes to a message broker, the two writes can fail independently, creating inconsistency. CDC eliminates the dual write: the database is the **only** write target, and the CDC mechanism reads the database's own write-ahead log to produce events.

**How it works**:
- The database's write-ahead log (WAL) or binlog records every write operation.
- A CDC tool reads this log and publishes events to a message broker (Kafka).
- Downstream consumers (search index, caches, data warehouses, analytics) consume the event stream.

**Log compaction**: a Kafka topic with log compaction (one entry per key, latest wins) enables a consumer to reconstruct the full current state of the database without an initial snapshot. This is effectively a continuously-updated snapshot.

**Tools**: Debezium (MySQL, PostgreSQL, MongoDB, SQL Server), Maxwell (MySQL), Mongoriver (MongoDB), LinkedIn Databus.

**Limitation**: CDC operates at the database level — it captures rows and column changes, not the application-level meaning of the change. You see "column X changed from A to B," not "user Y cancelled their order."

**Asynchrony**: CDC is asynchronous, like replication. Consumers will see events with some lag. This is the same trade-off as read replicas — accept eventual consistency for the derived stores.

## Event Sourcing

Event sourcing is the **application-level** version: the application deliberately records business events as the primary store, not a mutable state database.

### Commands vs Events

- **Command**: a request to do something. Can be validated and rejected. Example: "place order for item X."
- **Event**: an immutable fact — something that happened. Cannot be undone (only compensated). Example: "order for item X was placed at timestamp T."

Commands are validated against current state and, if valid, produce events. Events are appended to the event log. Read models are derived from the event log by replaying events.

### Properties

- **Multiple read views**: the same event log can be projected into different read models for different purposes — a "current state" view, an "order history" view, a "fraud analysis" view, each optimised for its query pattern.
- **Richer information**: a mutable database records only the current state. An event log records what happened — including cancelled items, failed attempts, intermediate states. This is valuable for analytics, debugging, and audit.
- **Deterministic replay**: given the same event log and the same projection logic, you always get the same read model. This enables rebuilding read models from scratch, fixing projections after bugs, and "time-travel" debugging.
- **Natural audit trail**: the event log is the audit log. Each event is an immutable fact, signed by the system that produced it.

### Contrast with CDC

| | CDC | Event Sourcing |
|---|-----|---------------|
| Level | Database internals (WAL/binlog) | Application (business events) |
| Schema | Row-level changes | Domain events with business meaning |
| Log compaction | Can compact: latest state per key is sufficient | Full history needed — compaction loses information |
| Semantics | What rows changed | What happened in the business domain |
| Implementation | Transparent to application | Requires application redesign |

## CQRS — Command Query Responsibility Segregation

CQRS separates the **write model** (commands → events) from the **read model** (queries against materialized views).

```
Command → Validate → Event → Event Log
                                ↓
                         Projection 1 (SQL read model)
                         Projection 2 (search index)
                         Projection 3 (analytics store)
```

**Write path**: synchronous — commands are validated against current state, events are written.
**Read path**: asynchronous — projections are updated from the event log with some lag.

**Advantages**:
- Read models are independently optimised for their query patterns — different data stores, schemas, indexing strategies.
- Write model stays clean — no denormalization or query optimisation on the write side.
- New read models can be built from the existing event log without touching write-side code.

**Disadvantage**:
- Eventual consistency between write and read models. Application must handle "you submitted a command, results will be visible shortly."
- Operational complexity: multiple stores to manage, sync to monitor.

## State = Integral of Event Stream

The relationship between events and state is mathematical:

```
State = ∫ (event stream) dt        [from t=0]
Change stream = d(State) / dt
```

A database is an accumulated view of all writes. A changelog is the derivative — the sequence of changes. Given the changelog (event log), you can reconstruct any version of the state. Given two state snapshots, you can compute the changelog.

This symmetry means batch and stream processing are equivalent:
- **Batch reprocessing**: replay the full event log through a new projection function.
- **Stream processing**: apply new events to an existing materialized view.

The unified batch+stream model (Apache Flink, Apache Beam) exploits this — the same code path handles historical replay and live events.

## Immutability: Benefits and Limits

### Benefits

- **Debugging**: see exactly what happened, in order, with all intermediate states visible.
- **Recovery**: if a bug produces wrong data, replay from the event log through fixed code.
- **Auditability**: immutable log is tamper-evident; hash chains (Merkle trees) can cryptographically verify integrity.
- **Concurrency**: immutable events need no locking — writers append, readers replay.
- **Multiple projections**: different consumers can project the same event log differently.

### Limits

- **GDPR / privacy**: true deletion is required for some data (personal data on erasure request). An immutable log cannot truly delete. Datomic supports "excision" (removing specific values while maintaining the rest of the log). Kafka log compaction can delete tombstoned keys. Neither is as clean as a simple `DELETE FROM`.
- **Storage**: immutable logs grow without bound. Periodic snapshotting + trimming old events is needed for long-lived systems.
- **Schema evolution**: event sourcing requires the event log to remain interpretable forever. Events written years ago by an old schema must still be processable — more demanding than database schema migration. Forward/backward compatible encoding (Avro, Protobuf) is essential (→ [[databases/encoding-and-evolution]]).

## Write Path and Read Path

From Kleppmann's Ch. 12 framing:

- **Write path**: precomputed, eager — data is transformed and derived at write time. Example: search indexing (index the document on ingest).
- **Read path**: on-demand, lazy — data is computed at query time. Example: full-text search with grep (scan on every query).

The **derived dataset** is where these paths meet: the materialized view, search index, or cache is precomputed enough to support fast queries, but derived from a more fundamental event log.

**Shifting the write/read boundary** is a fundamental caching and materialization decision:
- More precomputation → faster reads, slower writes, more storage.
- Less precomputation → slower reads, faster writes, less storage.

Event sourcing + CQRS explicitly separates these concerns, making the trade-off visible.

## End-to-End Event Streams

The event sourcing pattern can extend all the way to the client. Frameworks like React/Redux and Elm already manage client-side state as a stream of events (user interactions + server responses). Server-sent events and WebSockets push state changes from server to client. In this model:

- A user action on one device produces an event.
- The event flows through the event log and stream processors.
- The resulting state change is pushed to all subscribed clients.
- Client UI updates reactively.

This is a natural extension of CQRS: the read model is the client-side state, and it is subscribed to the change stream rather than polled.

## Correctness Without Coordination

From Kleppmann's Ch. 12: strong integrity guarantees can be achieved without distributed transactions or linearizability, by combining end-to-end idempotency with deterministic derivation. (→ [[sources/designing-data-intensive-applications]] ch. 12)

### The End-to-End Argument

The **end-to-end argument** (Saltzer, Reed & Clark, 1984): TCP duplicate suppression, database transactions, and stream processor exactly-once semantics are each correct within their scope — but none is sufficient for application-level correctness. A network timeout leaves the client not knowing if the request was processed. Retry risks double-processing. Correctness must be enforced end-to-end, from origin client to ultimate storage.

**Solution**: assign a unique operation ID (UUID) at the request's origin. This ID flows with the request through all layers and is written to the database as a unique constraint. The database rejects duplicate IDs regardless of retries. This is more robust than 2PC: it works across heterogeneous services, survives network partitions, and requires no cross-service coordination.

### Uniqueness Constraints Without Distributed Transactions

Uniqueness constraints (e.g., unique username, idempotent payment) can be enforced log-based:

1. **Partition the event log by the constrained value** (e.g., hash of username).
2. **Stream processor reads sequentially** per partition — one consumer, deterministic ordering.
3. The processor applies first-write-wins: the first request for a value commits; subsequent requests for the same value are rejected asynchronously.

No cross-partition coordination. Trade-off: rejection is async, not a synchronous error.

### Multi-Partition Requests Without Distributed Transactions

For operations that span multiple partitions (e.g., two-account transfer), a 3-step log-based approach avoids distributed transactions:

1. **Log the request as a single message** partitioned by request ID — the durable record of intent.
2. **Derive partition-specific instructions** from the request event (one message per affected partition).
3. **Consumers process their partition's instructions**, deduplicating by the original request ID.

Each step is a deterministic derivation from immutable events. No coordinator required. Replay from the log recovers the correct state after any failure.

### Timeliness vs Integrity

Two distinct correctness properties that are commonly conflated:

- **Timeliness**: whether reads reflect the most recent writes (what CAP's "C" and linearizability address).
- **Integrity**: whether the system is free from data loss and contradiction (whether committed facts remain correct).

Violations of timeliness are eventual consistency — temporary and often acceptable. Violations of integrity are **perpetual inconsistency** — data is wrong and may never self-correct. Integrity is far more important than timeliness, and can be achieved without strong timeliness guarantees via deterministic derivation + end-to-end operation IDs + idempotent writes.

> "Violations of timeliness are 'eventual consistency,' whereas violations of integrity are 'perpetual inconsistency.'" (→ [[sources/designing-data-intensive-applications]] ch. 12)

See also: [[distributed/consistency-models]] for the full spectrum; [[distributed/cap-theorem]] for how timeliness vs integrity reframes the CAP debate.

## CQRS in the DDD Context

Khononov (→ [[sources/learning-domain-driven-design]] ch. 8) situates CQRS within the domain model pattern: the domain model's aggregate is the write model (strongly consistent, single source of truth), and projections derived from domain events form the read models.

### Projection Types

**Synchronous projection** (simple): implemented as a catch-up subscription. After each command completes, the system updates the read model synchronously. The projection stores a checkpoint (e.g., a `processed_offset` column) representing the last event it processed. On startup, or after a crash, it reads from that checkpoint onwards — no events are missed or replayed twice. Strong consistency: reads immediately reflect recent writes.

**Asynchronous projection** (complex): implemented via a message bus subscription. The aggregate publishes domain events to a message broker; projections consume these events and update their read models independently. Eventual consistency: reads may lag behind writes. More fragile (broker failures, consumer lag) but decouples projection performance from command execution.

### Commands and Read Models

A nuance often missed: **commands are not required to return nothing**. The standard CQRS principle that commands and queries must be strictly separated applies to the *model*, not the method return type. After persisting an updated aggregate, the application layer can immediately query the strongly consistent write model and return data to the caller. This avoids forcing callers to do a subsequent query to get the new state.

### Architectural Slices

CQRS (and other architectural patterns) apply **per module** within a bounded context, not at the bounded context boundary. A bounded context with multiple subdomains may use CQRS for its core subdomain module and a simpler transaction script + layered architecture for its supporting subdomain modules. This per-slice application of patterns prevents over-engineering simple modules with unnecessary infrastructure.

---

## Event-Sourced Domain Model (DDD Perspective)

Khononov (→ [[sources/learning-domain-driven-design]] ch. 7) frames event sourcing as a tactical DDD pattern — the most advanced of the four business logic implementation patterns (→ [[patterns/business-logic-patterns]]). The **event-sourced domain model** uses event sourcing to manage aggregate state: instead of persisting current state, every change to an aggregate produces and persists a domain event.

**Four-step operation cycle**:
1. Load all domain events for the aggregate from the event store
2. Rehydrate (project events into in-memory state representation)
3. Execute the command (business logic validates rules, produces new events)
4. Append new domain events to the event store

**Key distinction**: DDIA's event sourcing is a data-system pattern; LDDD's event-sourced domain model is a tactical DDD pattern. LDDD uses the same building blocks as the domain model (aggregates, value objects, domain events — see [[patterns/domain-model]]). The difference is only in persistence: state-based aggregates persist current state; event-sourced aggregates persist the events themselves.

**Event store**: append-only storage; exposes Fetch(aggregateId) and Append(aggregateId, events, expectedVersion). expectedVersion enables optimistic concurrency (fail if events were appended by another process since the expected version).

**Snapshot pattern**: performance optimisation for aggregates that accumulate 10K+ events. Cache the projected state at a version checkpoint; on load, apply only events after the snapshot. Most systems won't need this — average aggregate lifespans rarely exceed 100 events.

**Forgettable payload pattern**: for GDPR compliance — store sensitive event fields encrypted with a per-aggregate key. To "delete," remove the key from the key store. The events remain but sensitive data is permanently unreadable.

**Advantages** (DDD framing):
- Time travel: reconstitute any past state of an aggregate
- Deep insight: multiple projections from the same event log for analysis and search
- Audit log: the event store is the strongly consistent, append-only audit trail (required by law in some domains)
- Advanced OCC: can inspect exactly which concurrent events collided and make domain-driven decisions about conflict resolution

**Disadvantages**:
- Learning curve: sharp departure from state-based modeling
- Schema evolution: events must remain interpretable indefinitely; changing schemas is harder than DB migrations
- Architectural complexity: requires CQRS to build read models; see DDIA section above

**When to use**: core subdomains where deep insight, audit logs, or complex time-based analysis is genuinely needed. Not for supporting subdomains where simpler patterns suffice.

### Migrating from Domain Model to Event-Sourced Domain Model

The main challenge is the existing aggregate state: there is no event history to replay. Two approaches (→ [[sources/learning-domain-driven-design]] ch. 11):

**Generating past transitions**: infer probable past events from current state and generate an approximate event stream. The generated stream can be projected back to the current state and verified. *Limitation*: intermediate state (e.g., how many times a contact was attempted before conversion) is irrecoverable.

**Migration events**: define an explicit `migrated-from-legacy` event containing the full current state. Projections must handle this event type permanently. *Advantage*: the absence of historical data is made explicit — no one mistakenly assumes the event stream is complete. *Disadvantage*: the legacy marker remains in the event store indefinitely.

The migration event approach is generally preferred because it preserves epistemic honesty: it accurately represents what is and is not known about the aggregate's history.

## Fowler's Event Taxonomy (via Nygard)

Nygard (→ [[sources/release-it]] ch. 16, citing Martin Fowler's "What Do You Mean by 'Event-Driven'?") identifies four distinct uses of the word "event" that are commonly conflated:

| Term | Meaning | Response expected |
|------|---------|------------------|
| **Event notification** | Fire-and-forget announcement | None |
| **Event-carried state transfer** | Event replicates entity state so consumers can work independently | None (data is in the event) |
| **Event sourcing** | All changes recorded as events; current state derived by replaying | None (event is the record) |
| **CQRS** | Read and write use separate structures | — (not technically "events") |

The distinction matters: event notification only tells consumers *that* something happened; event-carried state transfer gives consumers *what* changed so they can avoid round-trips; event sourcing makes events the primary store of truth. Systems that use all three concepts often muddle them in the design.

**Versioning caveat** (Nygard): event format versioning is a long-horizon problem — a message sender communicates with a future (possibly not-yet-written) reader; a message reader receives a call from the distant past. Avoid closed formats (serialised objects, annotation-based mapping frameworks); use open, self-describing formats (JSON) and treat messages as data, not objects.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Definitive mechanistic treatment: CDC mechanism (WAL/binlog), Kafka log compaction, event sourcing vs CDC distinction, CQRS, write/read path framing, immutability benefits and GDPR limits; correctness without coordination (end-to-end argument, uniqueness via log, timeliness vs integrity) (ch. 11–12) |
| [[sources/learning-domain-driven-design]] | DDD-centric treatment: event-sourced domain model as a tactical pattern choice for core subdomains; four-step operation cycle; event store interface; snapshot pattern; forgettable payload for GDPR; advantages and disadvantages from a domain modeling perspective (ch. 7) |
| [[sources/mastering-api-architecture]] | Treats event-driven architecture as a deployment seam for the strangler fig pattern; focuses on API evolution rather than storage internals |
| [[sources/building-evolutionary-architectures]] | Event sourcing as a tool for evolutionary database design; event logs enable schema migration without big-bang migrations |
| [[sources/release-it]] | Fowler's four-way event taxonomy (notification vs state transfer vs event sourcing vs CQRS); versioning challenge of long-lived event formats; prefer open formats and treat messages as data not objects |

## Related Concepts

- [[streams/stream-processing]] — stream processors consume event logs to maintain derived state
- [[streams/batch-processing]] — batch reprocessing of event logs to rebuild read models
- [[streams/change-data-capture]] — CDC as the adjacent pattern; technically faithful but domain-poor compared to event sourcing
- [[databases/storage-engines]] — the append-only log is the shared primitive between LSM-Trees and event sourcing
- [[distributed/idempotency]] — event consumers must be idempotent for at-least-once delivery to be safe
- [[distributed/distributed-transactions]] — event sourcing + outbox pattern replaces 2PC for cross-service consistency
- [[patterns/outbox-pattern]] — the database-level implementation of event publishing without dual writes
- [[patterns/saga]] — sagas are event-sourced distributed transactions
- [[patterns/domain-model]] — the domain model pattern is the basis for the event-sourced domain model; same building blocks (aggregates, value objects, domain events)

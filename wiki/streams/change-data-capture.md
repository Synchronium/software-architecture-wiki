---
title: "Change Data Capture"
type: concept
tags: [cdc, change-data-capture, data-integration, event-streaming, migration, data-pipelines]
sources: [designing-data-intensive-applications, building-event-driven-microservices, monolith-to-microservices, software-architecture-the-hard-parts]
created: 2026-05-28
updated: 2026-05-28
---

# Change Data Capture

## Definition

Change Data Capture (CDC) is the practice of observing changes to a system of record — typically a database — and emitting those changes as a stream of events that downstream systems can consume. Each event describes a single state change (insert, update, delete) with enough information for consumers to derive a current view, propagate the change to other stores, or react to it. The defining property: CDC turns a state-oriented data store into an event source without requiring the application that owns the store to be modified.

## Why It Matters

CDC sits at the boundary between two architectural worlds: the relational/document database tradition (state-oriented, query at read time) and the event-streaming tradition (immutable log, derive views from events). It is the practical bridge that makes the event-streaming approach incrementally adoptable in systems built around relational stores.

Three problems CDC solves:

1. **Data integration without dual writes.** A system that needs to update both a database and a downstream cache, index, or analytics store cannot atomically write to both. The dual-write problem (one write succeeds, the other doesn't) is the classic cause of data drift. CDC eliminates it: the database is the single source of truth; downstream systems consume the changelog (→ [[patterns/outbox-pattern]]).

2. **Data liberation from a shared monolithic database.** [[sources/building-event-driven-microservices]] uses CDC as the foundational pattern: existing services keep writing to the shared DB; CDC liberates the data as an event stream that new services can consume. The monolith doesn't have to change to enable event-driven downstream consumers.

3. **Incremental migration from legacy stores.** A new service can subscribe to CDC events from the legacy DB, build its own view, and shadow-read against it before cutover. From [[sources/monolith-to-microservices]]: CDC is one of Newman's database decomposition patterns, particularly useful when the old system can't be modified to publish events directly.

## How CDC Works

The mechanism depends on the database. Three common implementations:

### Log-based CDC

Read the database's write-ahead log (Postgres WAL, MySQL binlog, MongoDB oplog) and parse change events from it. From [[sources/designing-data-intensive-applications]] ch. 11: "Tools: Debezium, Maxwell." Properties:

- **Captures everything** including changes made bypassing the application (DBA scripts, replication tools)
- **Low overhead** on the source database (the log is being written anyway)
- **High fidelity** — every committed change is captured in order, with timestamps and transaction boundaries
- **Vendor-specific** — log format differs across databases; tools (Debezium) abstract this

This is the dominant CDC approach in modern systems.

### Trigger-based CDC

Database triggers fire on insert/update/delete and write to an audit table or message queue. Properties:

- **Database-agnostic** — works on any RDBMS that supports triggers
- **High overhead** — each write becomes two writes (the change plus the trigger action)
- **Can miss bypassing writes** if the trigger is disabled or bypassed by replication

Common in legacy environments where the log format isn't accessible.

### Query-based CDC

Periodically poll the database for rows with a `last_modified` timestamp or version number greater than the last poll's high-water mark. Properties:

- **Easy to implement** — no special database privileges
- **Miss deletes** — a deleted row doesn't appear in a poll
- **Resolution-limited** — events arrive in poll batches, not in commit order
- **Inefficient** — repeated queries against the source DB

Used when neither log access nor triggers are available; generally inferior to log-based CDC.

## CDC and Event Sourcing

CDC and [[streams/event-sourcing-cqrs]] are related but distinct. Fowler's taxonomy (cited in event-sourcing-cqrs):

| | CDC | Event Sourcing |
|--|---|----|
| Source of truth | Current state (rows in DB) | Event log itself |
| Events derived from | Mutations to state | Domain decisions |
| Event semantics | "Row X was updated to Y" | "OrderPlaced", "PaymentReceived" — business events |
| Can rebuild state? | Yes, via the changelog | Yes, by replay |
| Domain meaning | Low (database-level) | High (business-level) |

CDC events are technically faithful but domain-poor: they describe *what changed in the database*, not *what happened in the business*. From [[sources/building-event-driven-microservices]]: this is the central trade-off of using CDC as a public event stream. Downstream consumers must reconstruct domain meaning from row changes, which couples them to the source schema.

## Patterns Built on CDC

### Outbox Pattern

The canonical solution to the dual-write problem. The application writes the business state and an outbox event in the *same* database transaction. A separate process — typically a CDC pipeline — reads the outbox and publishes events to a message broker. See [[patterns/outbox-pattern]] for the full pattern.

CDC and outbox are complementary: outbox gives you domain-meaningful events (the application writes them, with business semantics); CDC gives you the reliable transport mechanism (atomically captured, exactly-once propagation).

### Data Liberation (Bellemare)

[[sources/building-event-driven-microservices]] frames CDC as one of three data-liberation patterns:

1. **Application-driven** — modify the application to publish events explicitly (requires source-app changes; gives best domain events)
2. **Database-trigger-based** — triggers write to an outbox table; downstream pipeline publishes (medium intrusiveness)
3. **CDC-log-based** — no application changes; downstream parses the log (lowest intrusiveness; lowest domain fidelity)

Choice depends on how much the source app can be modified and how much domain semantics matters to consumers.

### Strangler Migration

The new service subscribes to CDC events from the legacy database, builds an equivalent state, runs in shadow mode (compare outputs), then takes over reads, then writes. CDC enables this migration without requiring legacy-app changes. See [[patterns/strangler-fig]].

### Cache and Index Invalidation

CDC events drive cache invalidation and search-index updates. The pattern resolves a long-standing problem: a stale cache is a dual-write failure; CDC-driven invalidation has the same source of truth as the data itself.

### Multi-Region Replication

CDC streams flow across regions, replicating writes to a remote read replica. This is what most database replication mechanisms do internally; CDC exposes the mechanism at the application layer.

### Bootstrapping New Consumers (Log-Compacted Topics)

From [[sources/designing-data-intensive-applications]] ch. 11: "Log-compacted topics enable DB bootstrap." Kafka can retain only the latest value per key indefinitely; a new consumer subscribing from the start of the topic sees the *current state* of every entity, not the full change history. This makes CDC a viable bootstrap mechanism for new services without coordinating a database snapshot transfer.

## Architectural Considerations

### Schema coupling

CDC events expose the source database schema to consumers. A column rename is a breaking change for every CDC consumer. Mitigations:

- **Schema registry + versioning** — events go through a schema registry (Avro/Protobuf) and consumers handle versions
- **Anti-corruption layer** at the consumer — translate raw CDC events into a consumer-local domain model (→ [[patterns/anti-corruption-layer]])
- **Outbox over raw CDC** — application writes a domain event to the outbox; CDC propagates the outbox event, not the row change

### Ordering guarantees

Log-based CDC preserves per-row ordering (changes to the same row arrive in commit order). Cross-row ordering depends on whether the CDC pipeline preserves transaction boundaries. For single-entity consumers this is usually sufficient; for aggregate consumers that span multiple rows, transaction-preserving CDC matters.

### Replay and snapshotting

A long-running CDC pipeline accumulates state. A new consumer needs to either:
- **Replay from the start** of the log (only viable if the log is retained long enough)
- **Bootstrap from a snapshot** + replay from the snapshot's high-water mark
- **Read from a log-compacted topic** to get the current state without replay

Most production CDC deployments combine snapshot + log: Debezium emits an initial snapshot of all rows on first start, then switches to log-based capture.

### Backpressure on consumers

Slow consumers cannot block the source database — the source keeps committing. The CDC pipeline (broker) must buffer or shed. Log-based brokers (Kafka) handle this naturally with retention; queue-based transports (AMQP) may overflow (→ [[distributed/backpressure]]).

### Initial-load cost

For large tables, the initial snapshot is expensive. Strategies: snapshot only the rows changed in the last N days; perform an out-of-band bulk load; accept that the new consumer is read-incomplete until snapshot completes. From [[sources/building-event-driven-microservices]]: this is one of the main practical limits on CDC adoption for large legacy stores.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Canonical CDC chapter. Log-based, trigger-based, query-based mechanisms; Debezium and Maxwell as canonical tools; log-compacted topics for bootstrap; CDC as the foundation for "unbundling the database." |
| [[sources/building-event-driven-microservices]] | CDC as one of three data-liberation patterns; trade-offs between intrusiveness and domain fidelity; CDC as the bridge between shared-DB monoliths and event-driven services. |
| [[sources/monolith-to-microservices]] | CDC as one of Newman's database decomposition patterns; the legacy-system migration use case; tracer-write pattern as a CDC-adjacent migration approach. |
| [[sources/software-architecture-the-hard-parts]] | CDC referenced as one of the data integration mechanisms for distributed systems; trade-offs in the data-decomposition framework. |

## Related Concepts

- [[patterns/outbox-pattern]] — the dual-write solution that often pairs with CDC
- [[streams/event-sourcing-cqrs]] — adjacent paradigm; events as primary source of truth
- [[streams/stream-processing]] — what consumers do with CDC events
- [[concepts/contracts]] — schema evolution as it applies to CDC events
- [[patterns/anti-corruption-layer]] — protecting consumers from source-schema coupling
- [[patterns/strangler-fig]] — migration use case
- [[concepts/evolutionary-database-design]] — CDC in the context of database decomposition
- [[distributed/backpressure]] — consumer slowness as a CDC pipeline concern
- [[concepts/data-decomposition]] — data ownership and CDC as integration mechanism

## Key Quotes

> "Change Data Capture: observe DB changes as stream, replicate to search index/caches/warehouses; log-compacted topic enables DB bootstrap." — [[sources/designing-data-intensive-applications]] ch. 11

> "CDC events are technically faithful but domain-poor." — paraphrased synthesis of [[sources/building-event-driven-microservices]]

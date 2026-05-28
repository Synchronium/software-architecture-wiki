---
title: "Outbox Pattern"
type: pattern
tags: [distributed-systems, messaging, transactions, reliability, microservices, data-liberation, cdc]
sources: [understanding-distributed-systems, building-event-driven-microservices]
created: 2026-05-13
updated: 2026-05-28
---

# Outbox Pattern

The Outbox pattern guarantees that a database write and a message publication are either both committed or both not committed — without using distributed transactions (2PC). It solves the fundamental dual-write problem.

## The Problem: Dual-Write

A service that both writes to its database and publishes to a message broker faces a race condition:

```
1. Write to DB   ✓
2. Publish to broker  ✗ (crash, network failure)
→ DB updated, message never sent. Inconsistency.
```

Or:

```
1. Write to DB   ✗
2. Publish to broker  ✓
→ Message sent for an event that never actually happened.
```

There is no safe ordering — one can always fail after the other.

## The Solution: Outbox Table

Instead of publishing directly to the broker, write the message to an **outbox table** in the same local database, within the same ACID transaction as the state change:

```sql
BEGIN;
  UPDATE orders SET status = 'confirmed' WHERE id = ?;
  INSERT INTO outbox (id, type, payload, created_at)
    VALUES (gen_uuid(), 'order.confirmed', '{"id":...}', now());
COMMIT;
```

A separate **relay process** (also called a "message relay" or "CDC consumer") reads unprocessed outbox rows and forwards them to the message broker:

```
Relay:  SELECT * FROM outbox WHERE processed = false ORDER BY created_at;
        → publish to broker
        → mark as processed (or delete)
```

## Guarantees

- **Atomicity**: the state change and the outbox entry are written in one ACID transaction — both succeed or both fail.
- **At-least-once delivery**: the relay may publish a message more than once (if it crashes after publishing but before marking as processed). Consumers must be idempotent. (→ [[distributed/idempotency]])
- **No exactly-once delivery**: exactly-once is provably impossible in distributed systems; the outbox provides exactly-once *semantics* through idempotent consumers.

## Relay Implementation Options

**Polling**: relay queries the outbox table on a schedule (simple, adds DB load, latency proportional to poll interval).

**Change Data Capture (CDC)**: relay subscribes to the database's replication log (e.g., Postgres WAL, MySQL binlog via Debezium). Lower latency, no extra DB queries, but requires CDC infrastructure. See [[streams/change-data-capture]] for the full treatment of log-based vs trigger-based vs query-based mechanisms and the schema-coupling trade-offs.

## Relationship to State Machine Replication

Vitillo notes this is conceptually equivalent to state machine replication: the outbox table is the log; the relay is the replication mechanism; the broker is the downstream state machine. (→ [[sources/understanding-distributed-systems]] ch. 13)

## Relationship to Sagas

In a [[patterns/saga]], each local transaction step needs to reliably trigger the next step. The outbox pattern is the standard way to implement this: each Tᵢ writes its next command/event to the outbox alongside its local state change.

## Data Liberation Patterns (Bellemare)

In EDM architectures, existing systems must publish their domain data to event streams as part of migration — a process called **data liberation** (→ [[sources/building-event-driven-microservices]] ch. 4). The outbox table is the recommended approach, but three patterns exist:

### Pattern 1: Query-Based Liberation

Queries the data store directly and publishes results to an event stream. Variants: bulk load (full table each poll), incremental timestamp (records with `updated_at > last_processed`), autoincrementing ID (records with `id > last_processed_id`), custom query (joins/views to isolate internal model).

**Advantages**: works on any data store; SQL views can isolate internal data models from published events; configurable polling frequency per stream.

**Drawbacks**: requires `updated_at` column or equivalent; hard deletes are invisible (must use soft-delete flags); polling load on source system (mitigate with read replica); batch-nature means intermediate updates between polls are lost.

### Pattern 2: Log-Based (CDC Log)

Reads the database's write-ahead log or binary log (MySQL binlog, PostgreSQL WAL). Primary tools: **Debezium** (MySQL, PostgreSQL, MongoDB, and others; targets Kafka and Pulsar), **Maxwell** (MySQL only, Kafka only).

**Advantages**: very low latency; minimal performance impact on source; hard deletes tracked directly in the changelog.

**Drawbacks**: **exposes the internal data model** — all table columns appear in the log; denormalization must happen downstream; schema changes to the source table may break downstream event schemas without warning; limited tool support for DDL changes (Debezium supports MySQL DDL only).

Bootstrapping is required: a full snapshot of existing data must be taken before CDC logging starts, with overlap ensured to avoid gaps.

### Pattern 3: Outbox Table (Recommended)

Described in the core Outbox Pattern section above. Application writes to internal tables and the outbox in a single transaction; relay publishes from the outbox.

**Serialisation timing**: the key design decision.

- **Before-the-fact** (preferred): serialise the event and validate it against the schema *before* committing to the outbox table. If serialisation fails, the transaction rolls back — the internal state and the event stream stay consistent. A single outbox can hold all events since the content is already serialised. Strongest guarantee.
- **After-the-fact**: event written to outbox first; publisher serialises it before producing to the stream. If serialisation fails after commit, the transaction cannot be safely rolled back; the failure must be handled manually. Simpler to implement, but leaves incompatible events stranded in the outbox.

**Eventification**: a downstream event processor that joins multiple internal (private) event streams and denormalises them into public-facing entity events. For example, a `User` entity that references `Location` and `Employer` as foreign keys can be denormalised into a single `User` entity event by a dedicated eventification service — the internal streams remain private, and only the clean public event is exposed.

### CDC Frameworks vs Team-Owned Outbox

Centralised CDC frameworks (Kafka Connect, Apache Gobblin, Apache NiFi) reduce up-front work but create a shared dependency between the framework team and each source team. Any schema change in the source can break the connector, but only the framework team detects this. This creates linearly scaling cross-team dependencies.

> "CDC tools are not the final destination in moving to an event-driven architecture, but instead are primarily meant to help bootstrap the process." (→ [[sources/building-event-driven-microservices]] ch. 4)

Teams that adopt the outbox pattern directly become sole owners of their event production, eliminating the framework team dependency and encouraging "event-first" thinking. Teams that rely on the CDC framework indefinitely fail to make the cultural shift to treating their event streams as a first-class product.

**Data sinking**: the inverse operation — consuming events from the broker and inserting into a legacy data store. Enables non-event-driven systems to receive event data without code changes, via a standalone sink microservice or a connector.

## Outbox Pattern in the DDD Context (Khononov)

Khononov (→ [[sources/learning-domain-driven-design]] ch. 9) frames the outbox pattern specifically in relation to the **domain model** pattern and the **transaction script** failure modes introduced in ch. 5.

### Two Wrong Approaches

**Wrong approach 1 — publish inside the aggregate before commit**: the aggregate generates domain events and attempts to publish them to a message bus before the DB transaction commits. If the transaction then fails, the events have already been published for an aggregate state change that never happened.

**Wrong approach 2 — publish in application layer after commit but before crash**: the application layer commits the aggregate state, then publishes domain events. If the process crashes after commit but before publish, the events are lost — the aggregate changed state but no one was notified.

### The Correct Approach

The aggregate commits its updated state and its domain events atomically as an outbox: state + events written in one DB transaction. A separate relay process (running continuously) reads unpublished outbox entries and publishes them to the message bus, then marks them as published. This guarantees at-least-once delivery.

**Relay implementation**: pull (polling the outbox table) or push (transaction log tailing / CDC). Pull is simpler; push has lower latency and less DB load.

### NoSQL Embedding

For document databases that don't support multi-collection transactions in the same way as relational DBs, embed the outbox messages array directly in the aggregate document. Both the aggregate state and its pending outbox messages are updated atomically in a single document write.

---

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/understanding-distributed-systems]] | Core outbox pattern — atomicity guarantee, relay process, idempotency requirement, equivalence to state machine replication |
| [[sources/building-event-driven-microservices]] | Data liberation context — positions outbox table as one of three data liberation strategies; adds serialisation-before-vs-after analysis, eventification, and the CDC framework dependency anti-pattern |
| [[sources/learning-domain-driven-design]] | DDD context — two wrong approaches (publish before commit; publish after commit but before crash); the correct atomically-committed outbox; NoSQL embedding; pull vs push relay (ch. 9) |

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 13) — outbox pattern, relay process, idempotency requirement, state machine replication equivalence
- (→ [[sources/building-event-driven-microservices]] ch. 4) — data liberation patterns; query-based, CDC log, outbox comparison; eventification; CDC framework anti-pattern

## Related Pages

- [[patterns/saga]]
- [[distributed/distributed-transactions]]
- [[distributed/idempotency]]
- [[styles/event-driven-architecture]] — data liberation is part of EDM migration strategy
- [[streams/event-sourcing-cqrs]] — CDC and event sourcing connection
- [[streams/change-data-capture]] — the transport mechanism that pairs with outbox to give domain-meaningful events with reliable propagation

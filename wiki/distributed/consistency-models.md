---
title: "Consistency Models"
type: concept
tags: [distributed-systems, consistency, replication, correctness]
sources: [understanding-distributed-systems, designing-data-intensive-applications, foundations-of-scalable-systems]
created: 2026-05-13
updated: 2026-05-18
---

# Consistency Models

A consistency model defines the guarantees a distributed system provides about the visibility and ordering of reads and writes across replicas. Choosing a model involves trading off correctness guarantees against performance and availability.

## The Spectrum

Models are ordered from strongest (most correct, most expensive) to weakest (most available, most performant):

### Linearizability (Strong Consistency)
Every operation appears to take effect instantaneously at some point between its invocation and response. All clients observe a single, consistent timeline — equivalent to a single-node system. Reads always return the most recent write.

- Requires reads to go through the leader and be confirmed by a quorum (or equivalent).
- Highest latency, lowest availability under partitions.
- Implemented in: etcd, ZooKeeper, Spanner, DynamoDB (strongly consistent reads).

### Sequential Consistency
All clients observe operations in the same order, but that order need not align with real-time. One client's operations appear to all other clients in program order.

- Weaker than linearizability: no real-time guarantee.
- Used in some CPU memory models (x86 TSO), some distributed databases.

### Causal Consistency
Operations that are causally related (one preceded the other) are observed in causal order by all clients. Concurrent (causally unrelated) operations may be observed in different orders by different clients.

- Proven to be the strongest consistency model compatible with availability + partition tolerance (COPS paper).
- Implemented with vector clocks or dependency tracking.
- Stronger than eventual; weaker than sequential.

### Eventual Consistency
Given no new writes, all replicas will eventually converge to the same value. No guarantees on when convergence occurs or what intermediate states clients see.

- Maximum availability; lowest latency.
- Common in: DNS, Dynamo-style stores (Cassandra, DynamoDB default reads), CDN caches.
- Requires conflict resolution strategy (LWW, CRDTs, application-level merge).

### Strong Eventual Consistency

A stronger variant of eventual consistency provided by CRDTs (→ [[distributed/crdts]]): replicas that have received the same updates are in the same state *immediately* — no further reconciliation needed. The merge operation's commutativity, associativity, and idempotency guarantee this.

Sits between eventual consistency and causal consistency on the spectrum.

## Isolation Levels (Transactions)

For transactional systems, consistency is described in terms of isolation levels (weakest to strongest):

| Level | Anomalies Prevented |
|-------|---------------------|
| Read Uncommitted | None |
| Read Committed | Dirty reads |
| Repeatable Read | Dirty reads, fuzzy reads |
| Serializable | All anomalies (dirty writes, dirty reads, fuzzy reads, phantom reads) |

Full serializability is equivalent to executing transactions one at a time.

## Replication Decisions Map to Consistency Models

Vitillo makes this relationship concrete using Raft as the example (→ [[sources/understanding-distributed-systems]] ch. 10):

| Read routing decision | Consistency model achieved |
|----------------------|--------------------------|
| All reads through leader (leader confirms with quorum first) | **Linearizability** — single global timeline |
| Reads served by a single pinned follower | **Sequential consistency** — same order, but observer can lag |
| Reads served by any follower | **Eventual consistency** — different observers may see different orderings |

The tradeoff: stronger consistency → more coordination → higher latency and lower availability. This is the practical expression of the PACELC theorem: even in the absence of partitions, consistency and latency trade off against each other.

Note on leader reads: the leader cannot serve reads directly from local state without first confirming with a quorum that it is still the leader. A stale leader (partitioned from the majority) would otherwise serve stale reads. This confirmation step is what makes linearizable reads expensive.

## Causal Consistency: COPS Implementation

Vitillo describes COPS (Clusters of Order-Preserving Servers) as a reference implementation of causal+ consistency (causal consistency + conflict resolution via LWW, so concurrent writes always converge). (→ [[sources/understanding-distributed-systems]] ch. 11)

**Key mechanism — dependency tracking**:
- Each client maintains a local **dependency dictionary** (key → version) tracking which versions of keys it has read.
- Reads: the client adds the returned version to its dependency dictionary.
- Writes: the client sends its dependency dictionary with the write request. The replica assigns a version (LWW timestamp) and applies the write locally.
- **Replication**: when a replica receives a replication message for a write, it checks whether all the write's dependencies have been committed locally. If not, it **waits** until they have. This dependency-wait is what enforces causal order — it ensures that cause always arrives before effect.

**Availability trade-off**: a replica can fail after committing locally but before broadcasting. This causes data loss for that write. COPS accepts this tradeoff to avoid paying the latency of waiting for remote acknowledgment on the write path.

COPS shows causal consistency can be implemented across geo-distributed clusters with low write latency and full availability under partitions — the strongest consistency model that can make both guarantees.

## CAP Connection

The [[distributed/cap-theorem]] states that during a network partition, a system must choose between:
- **CP**: Maintain consistency (linearizability), sacrifice availability.
- **AP**: Maintain availability, sacrifice consistency (fall back to eventual).

The PACELC extension adds: even when no partition exists, there is a latency/consistency tradeoff (L vs. C).

## Linearizability: Precise Definition

Kleppmann (→ [[sources/designing-data-intensive-applications]] ch. 9) gives the most precise definition: a system is linearizable if it behaves as though there is only one copy of data, and every operation takes effect atomically at some point between its invocation and completion.

The key consequence: if one client reads a new value, all subsequent reads by any client must also return the new value or something newer. It is a **recency guarantee**, not a transaction isolation guarantee.

**Linearizability is not the same as serializability**:
- Serializability: transactions appear to execute in some serial order (isolation guarantee for multi-object operations).
- Linearizability: individual read/write operations appear instantaneous (recency guarantee for single-object operations).
- A system can be serializable but not linearizable (snapshot isolation — reads from a consistent past snapshot, not the most recent state).
- A system can be linearizable but not serializable (a single-object store with linearizable reads/writes but no multi-object transactions).

**SSI is not linearizable**: SSI reads from a consistent snapshot at transaction start — a past point in time. That snapshot may be stale relative to concurrent writes. This is intentional: the snapshot enables efficient reads without blocking.

## Timeliness vs Integrity (DDIA's Key Distinction)

Kleppmann introduces a distinction that cuts through the "consistency" confusion (→ [[sources/designing-data-intensive-applications]] ch. 12):

- **Timeliness**: users observe the system in an up-to-date state. CAP's "C" (linearizability) is a strong timeliness guarantee. Read-after-write is a weaker timeliness guarantee. Violations of timeliness are "eventual consistency."
- **Integrity**: no data loss, no contradictory data. A derived dataset correctly reflects its source. Violations of integrity are "perpetual inconsistency."

**Integrity is more important than timeliness.** A credit card statement that's delayed by 24 hours is annoying (timeliness violation); one that's missing a transaction or has wrong totals is catastrophic (integrity violation). Many applications can tolerate weak timeliness but cannot tolerate integrity violations.

Coordination-avoiding systems can maintain strong integrity without linearizability — via end-to-end operation IDs, idempotency, and deterministic derivation. See [[sources/designing-data-intensive-applications]] ch. 12.

## Safety vs Liveness

Kleppmann (following Lynch) distinguishes:
- **Safety properties**: nothing bad ever happens. If violated, you can point to the exact moment. Example: linearizability, uniqueness constraint.
- **Liveness properties**: something good eventually happens. Cannot require at every moment. Example: eventual consistency (eventually converges), termination.

Distributed algorithms must always satisfy safety properties; liveness properties hold only under favourable conditions (no infinite failures, eventually synchronous network).

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/understanding-distributed-systems]] | Covers all models from linearizability through eventual; introduces PACELC; causal consistency proven as strongest CA model |
| [[sources/designing-data-intensive-applications]] | Adds precise linearizability definition; clarifies linearizability ≠ serializability; introduces timeliness/integrity distinction; safety vs liveness framing (ch. 9, 12) |
| [[sources/foundations-of-scalable-systems]] | Practitioner framing for distributed databases. Eventual consistency: inconsistency window (no upper bound); tunable consistency (N/W/R parameters) as the practical CAP control; quorum reads and writes (R + W > N guarantees overlap); sloppy quorum + hinted handoff for write availability; anti-entropy repair (read repair + Merkle tree). Key distinction: "immediate consistency" (W=N) ≠ strong consistency — stale reads remain possible during concurrent updates. Strong consistency = serializability + linearizability. 2PC coordinator failure → participants block with held locks → cascading failures in loaded systems. TrueTime as the hardware solution to global linearizability. (ch. 11–12) |

> **Agreement**: both sources identify causal consistency as the strongest consistency model compatible with availability + partition tolerance. Both treat linearizability as too expensive for most distributed use cases. Kleppmann's timeliness/integrity distinction is a significant clarifying addition.

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 10–11) — covers all models from linearizability through eventual; introduces PACELC and causal consistency (COPS).
- (→ [[sources/designing-data-intensive-applications]] ch. 9) — precise linearizability definition; linearizability vs serializability distinction; safety vs liveness.
- (→ [[sources/designing-data-intensive-applications]] ch. 12) — timeliness vs integrity; coordination-avoiding systems.

## Related Pages

- [[comparisons/consistency-model-selection]] — decision guide: which model for which scenario (locks, balances, feeds, multi-region); timeliness vs integrity distinction
- [[distributed/cap-theorem]]
- [[distributed/replication]]
- [[distributed/crdts]]
- [[distributed/distributed-transactions]]
- [[distributed/consensus-algorithms]]
- [[databases/transactions]]
- [[patterns/saga]]

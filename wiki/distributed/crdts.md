---
title: "CRDTs (Conflict-free Replicated Data Types)"
type: concept
tags: [distributed-systems, consistency, coordination-avoidance, replication, correctness]
sources: [understanding-distributed-systems]
created: 2026-05-13
updated: 2026-05-13
---

# CRDTs (Conflict-free Replicated Data Types)

A CRDT is a data structure that can be replicated across multiple nodes and updated independently, with the guarantee that all replicas will **converge** to the same state — without requiring coordination (consensus).

## Formal Definition

A data type qualifies as a CRDT if:

1. Its possible states form a **semilattice** — a set whose elements can be partially ordered.
2. Its merge operation returns the **least upper bound** of any two states, making the merge idempotent, commutative, and associative.

These two properties together guarantee **strong eventual consistency** (stronger than plain eventual consistency):

- **Eventual delivery**: every update applied at one replica is eventually applied at all replicas.
- **Strong convergence**: replicas that have applied the same set of updates are in the same state — *immediately*, not after additional coordination.

Plain eventual consistency only guarantees convergence *eventually*. Strong convergence means any replica that has processed the same updates is already in the same state — no further reconciliation needed.

## Why Merge Properties Matter

If a merge operation is:
- **Idempotent**: merging the same update twice produces the same result as merging it once.
- **Commutative**: merge(A, B) = merge(B, A) — order doesn't matter.
- **Associative**: merge(merge(A, B), C) = merge(A, merge(B, C)) — grouping doesn't matter.

…then replicas can exchange updates in any order, at any time, and will eventually converge. This is why CRDTs work over unreliable broadcast — even gossip + periodic anti-entropy is sufficient, since every update eventually reaches every replica and the merge produces the same result regardless of order.

## Common CRDT Types

### LWW Register (Last-Write-Wins)
- Each write is tagged with a timestamp.
- On merge: keep the value with the greatest timestamp.
- Concurrent writes: one wins deterministically (the one with the higher timestamp).
- Risk: if clocks are skewed, the "wrong" write can win. Mitigated by using logical clocks.

### MV Register (Multi-Value Register)
- On concurrent writes: retain **all** values.
- Merge produces a set of all concurrent versions.
- Application or user must resolve the set (e.g., Amazon shopping cart "add" is an MV register).
- Requires vector clocks to detect concurrency vs. causality.

### Other Common CRDTs
- **G-Counter**: grow-only counter per node; total = sum of all node counters.
- **PN-Counter**: pair of G-Counters (increments + decrements).
- **G-Set**: grow-only set (only add, no remove).
- **2P-Set**: two G-Sets (add + remove); once removed, cannot re-add.
- **OR-Set** (Observed-Remove Set): allows add after remove using unique tags.

## The CALM Theorem

**C**onsistency **A**s **L**ogical **M**onotonicity (Hellerstein & Alvaro) provides the theoretical foundation for when coordination can be avoided:

> A program has a consistent, coordination-free distributed implementation **if and only if** it is **monotonic**.

A program is **monotonic** if new inputs only refine (add to) the output — they can never retract or contradict prior outputs. Computing the union of a set is monotonic; incrementing a counter is monotonic (with the right abstraction). Variable overwrite is *not* monotonic — it retracts the previous value.

**Critical clarification**: CALM's "consistency" ≠ linearizability. CALM focuses on **application-level output consistency** — a program produces the same result regardless of the order inputs are processed. It says nothing about the linearizability of individual reads and writes. This distinction matters:

- A system can be CALM-consistent (same output regardless of order) while being eventually consistent at the storage level.
- Framing consistency only in terms of read/write linearizability unnecessarily restricts the solution space. Some programs can be application-consistent without linearizable storage.

Implications:
- Monotonic programs (CRDTs, union-based computations) need no coordination to achieve consistency.
- Non-monotonic programs (delete, reset, aggregation that must be complete before emitting) fundamentally require coordination.
- Use coordination-free CRDTs where the semantics permit; otherwise, coordinate precisely at the non-monotonic point.

## When to Use CRDTs

CRDTs are appropriate when:
- You need high availability and low latency (mobile clients, geo-distributed systems).
- The data type is naturally monotonic (counters, sets, registers).
- Eventual convergence is sufficient (not linearizability).
- Conflict resolution can be automated (LWW or merge semantics are acceptable).

Not appropriate when:
- Strong invariants must hold globally (e.g., "balance must not go negative").
- All operations require coordination anyway (non-monotonic programs).

## Dynamo-Style Stores and CRDTs

Dynamo-style stores (Cassandra, Riak) use leaderless replication with quorums. CRDTs complement this: instead of resolving conflicts with last-write-wins (losing data), the data structure itself merges correctly. Riak supports native CRDTs. Cassandra uses LWW by default but can be extended.

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 11) — LWW register, MV register, CALM theorem, Dynamo-style stores, anti-entropy.

## Related Pages

- [[distributed/broadcast-protocols]] — CRDTs work over reliable or gossip broadcast; don't require total order
- [[distributed/consistency-models]] — strong eventual consistency sits between eventual and causal consistency
- [[distributed/replication]] — Dynamo-style stores use CRDTs (LWW/MV registers) for conflict resolution
- [[distributed/distributed-transactions]] — CRDTs as an alternative to coordination for certain data types
- [[distributed/cap-theorem]] — monotonic/CRDT programs can be CAP: consistent + available + partition-tolerant

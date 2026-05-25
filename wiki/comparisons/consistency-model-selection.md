---
title: "Consistency Model Selection"
type: comparison
tags: [distributed-systems, consistency, trade-offs, replication, correctness]
sources: [understanding-distributed-systems, designing-data-intensive-applications, foundations-of-scalable-systems]
created: 2026-05-18
updated: 2026-05-18
---

# Consistency Model Selection

Choosing a consistency model is one of the most consequential decisions in distributed system design. Get it wrong in the strong direction and you've built latency and fragility into the critical path. Get it wrong in the weak direction and you've introduced data anomalies that can take months to discover and are catastrophic when they do.

This page answers: given your scenario, which consistency model is the right choice?

## The First Question: Timeliness or Integrity?

Before choosing a model, Kleppmann's distinction cuts through most of the confusion (→ [[sources/designing-data-intensive-applications]] ch. 12):

- **Timeliness**: users see up-to-date data. Strong consistency (linearizability) is a timeliness guarantee.
- **Integrity**: data is never lost or contradictory. No write is silently dropped; no derivation produces incorrect results.

**Integrity is almost always more important than timeliness.** A credit card statement delayed by one hour is annoying (timeliness violation). A statement with a missing transaction or wrong balance is catastrophic (integrity violation).

Most applications that believe they need strong consistency actually need strong *integrity*, which is achievable without linearizability — via end-to-end operation IDs, idempotency, and deterministic derivation. If you can articulate why stale reads matter *functionally* (not just aesthetically), you need strong consistency. If you cannot, you may need strong integrity but not strong consistency.

## The Spectrum

From strongest to weakest:

| Model | Guarantee | Cost | Use when |
|---|---|---|---|
| **Linearizability** | Every read sees the most recent write; single global timeline | Highest latency; unavailable under partition | Correctness is non-negotiable; stale reads cause functional failures |
| **Causal consistency** | Causally related operations observed in order; concurrent ops may differ | Moderate latency; available under partition | Order matters between related operations, but full linearizability isn't required |
| **Eventual consistency** | All replicas converge given no new writes; no ordering guarantee | Lowest latency; highest availability | Read-heavy; tolerate brief inconsistency; conflict resolution is feasible |
| **Strong eventual consistency** (CRDTs) | Replicas that received the same updates are identical immediately | Low latency; available; merge logic required | Distributed counters, collaborative editing, shopping carts |

## Decision Guide by Scenario

### Distributed locks, leader election, uniqueness constraints

**Use: linearizability**

These operations are equivalent to each other and all require linearizability (→ [[distributed/consensus-algorithms]]). The moment two nodes can simultaneously believe they hold a lock, elect themselves leader, or create a uniquely-named resource, correctness collapses. Implemented by: etcd, ZooKeeper, Spanner. There is no weaker model that makes these safe.

### Financial balances, inventory counts — anything where two readers must see the same value right now

**Use: linearizability, or serialisable isolation**

If two users can independently read account balance $100, both decide to withdraw $80, and both succeed, you have a correctness violation regardless of how infrequently it occurs. Whether you need linearizability (per-read recency) or serialisable isolation (per-transaction atomicity) depends on whether the invariant spans one object or multiple objects. See [[databases/transactions]] for the distinction.

Note: if the business can tolerate the occasional anomaly with a compensating process (e.g., bank overdraft fees rather than refused transactions), eventual consistency may be acceptable even here — this is a business decision, not a technical one.

### Read-your-own-writes (user sees their own recent mutations)

**Use: causal consistency, or session-level read-your-writes**

A user who just submitted a form should see that form on the next page load. This is a causal dependency — write-then-read by the same user. Full linearizability is overkill. Causal consistency (or its practical approximation — sticky sessions or version tokens) is sufficient and much cheaper.

Implementation: route the user's subsequent reads to the replica that processed their write (sticky routing), or have the client pass a version token; the read handler waits until the replica has caught up to that version.

### Social media feeds, activity streams

**Use: eventual consistency**

Users can tolerate seeing a post appear in feeds a few seconds after it was published. Brief inconsistency is invisible at human timescales. The feed is a derived projection anyway — the system of record is consistent; the feed is eventually consistent relative to it. Highest availability and lowest read latency are achievable here.

### Shopping cart contents

**Use: strong eventual consistency (CRDT)**

Amazon's Dynamo paper established the canonical answer: a shopping cart is a set that can be added to or removed from concurrently across replicas. LWW (last-write-wins) loses writes. A CRDT-based merge (add-wins set) ensures no item is silently dropped from either replica during a partition (→ [[distributed/crdts]]). The trade-off: a removed item can reappear if it was added on a concurrent replica. Amazon judged this preferable to losing additions.

### Distributed counters (page views, likes, analytics)

**Use: strong eventual consistency (CRDT), or eventual consistency with periodic reconciliation**

Exact real-time counts are rarely required. Approximate counts from eventual consistency are usually acceptable. For exact counts under concurrent increment, a G-Counter (grow-only CRDT) merges correctly from any number of replicas. For decrements, a PN-Counter (positive/negative CRDT pair) works. Both provide exact final counts with strong eventual consistency.

### Configuration, feature flags, service discovery

**Use: linearizability for writes; causal or eventual for reads**

Config writes must be linearisable — two nodes that simultaneously believe they have different values for "is this feature enabled" produce split-brain behaviour. However, reads can be eventually consistent: a flag taking an extra second to propagate to all nodes is almost always acceptable. This asymmetry is the standard pattern for etcd and Consul. (→ [[distributed/control-plane-data-plane]])

### Multi-region deployments

**Use: causal consistency at most; usually eventual consistency**

Cross-region latency (100–300 ms round-trip) makes synchronous replication for linearizability impractical — it adds hundreds of milliseconds to every write. Asynchronous replication is the only option at multi-region scale, which limits you to causal consistency at best, usually eventual consistency in practice.

The operational consequence: failover to another region means accepting that some recent writes may be lost (RPO > 0). This is a business decision, not a technical one. Multi-region is often driven by legal compliance (data residency) more than by failure probability.

## The Practical Expression: Read Routing and Replication

In Raft-based systems (etcd, CockroachDB, YugabyteDB), the consistency level is determined by how reads are routed (→ [[sources/understanding-distributed-systems]] ch. 10):

| Read routing | Consistency model |
|---|---|
| Through leader, confirmed by quorum | Linearizability |
| Through a single pinned follower | Sequential consistency |
| Through any follower | Eventual consistency |

In tunable systems (Cassandra, DynamoDB), consistency is controlled by quorum parameters (→ [[sources/foundations-of-scalable-systems]] ch. 11):

```
R + W > N  →  quorum overlap  →  strong-ish consistency (but not linearizable)
```

Where R = read quorum, W = write quorum, N = replication factor. Setting R + W > N guarantees that reads and writes overlap in at least one replica, reducing the window of inconsistency. Common configuration: N=3, W=2, R=2. This is stronger than eventual consistency but weaker than linearizability — stale reads remain possible during concurrent updates.

## Avoiding the CAP Trap

The CAP theorem is less useful than it appears (→ [[distributed/cap-theorem]]). It covers only linearizability and network partitions, ignores the normal-operation latency/consistency trade-off (PACELC), and forces a binary framing on what is actually a spectrum.

A more useful question: *what anomalies am I trying to prevent, and what cost am I willing to pay?* This leads directly to the consistency level you need, without requiring an answer to "are you CP or AP?"

For most systems, the PACELC trade-off (latency vs consistency in the absence of partitions) is more operationally important than the CAP trade-off (availability vs consistency during partitions). Partitions are rare; latency is constant.

## Source Perspectives

| Source | Key contribution |
|---|---|
| [[sources/designing-data-intensive-applications]] | Timeliness vs integrity distinction; precise linearizability definition; linearizability ≠ serializability; coordination-avoiding correctness (integrity without distributed transactions) |
| [[sources/understanding-distributed-systems]] | Causal consistency as the strongest CA model (COPS implementation); PACELC; practical Raft routing examples; causal+ via COPS |
| [[sources/foundations-of-scalable-systems]] | Tunable consistency (N/W/R); quorum reads/writes; sloppy quorum + hinted handoff; "immediate consistency" (W=N) ≠ linearizability |

> **Key agreement across all three sources**: linearizability is too expensive for most use cases. The right question is not "can we afford linearizability?" but "do we actually need it?" Most applications need integrity and read-your-own-writes, both of which are achievable with causal consistency or well-designed eventual consistency.

## Related Pages

- [[distributed/consistency-models]] — full technical treatment of each model; formal definitions; COPS implementation
- [[distributed/cap-theorem]] — CAP and PACELC; Kleppmann's critique of CAP
- [[distributed/crdts]] — strong eventual consistency; merge operations; CALM theorem
- [[distributed/replication]] — how replication strategy determines consistency level
- [[databases/transactions]] — isolation levels and their relationship to consistency models
- [[distributed/distributed-transactions]] — why linearizability across services is so expensive
- [[patterns/saga]] — the alternative to distributed transactions when consistency can be eventual

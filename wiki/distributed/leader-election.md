---
title: "Leader Election"
type: concept
tags: [distributed-systems, coordination, consensus, raft, fault-tolerance]
sources: [understanding-distributed-systems]
created: 2026-05-14
updated: 2026-05-14
---

# Leader Election

## Definition

Leader election is the process by which a group of distributed processes designates one of their number as the **leader** — the single process with special authority (e.g., accepting writes, assigning work, holding a lock). When the leader fails, the remaining processes elect a new one. (→ [[sources/understanding-distributed-systems]] ch. 9)

## Why It Matters

A single leader simplifies concurrency in distributed systems: instead of coordinating concurrent writes across many replicas, all writes go through one point. This is the basis of state machine replication (→ [[distributed/replication]]). But a leader also introduces a single point of failure and a scalability bottleneck — trade-offs that must be managed carefully.

## Safety and Liveness

Any correct leader election algorithm must guarantee two properties:

- **Safety**: at most one leader exists at any given time (no split-brain).
- **Liveness**: an election eventually completes, even in the presence of failures.

These are instances of the general properties of distributed algorithms: safety (nothing bad ever happens) and liveness (something good eventually does happen).

## Raft Leader Election

Raft's leader election algorithm models each process as a state machine with three states:

```
Follower  →  Candidate  →  Leader
    ↑___________________________↓ (heartbeat timeout)
```

**Followers** expect a periodic heartbeat from the current leader. The heartbeat carries the leader's **election term** — a monotonically increasing integer (a logical timestamp). If a follower doesn't receive a heartbeat within a timeout, it presumes the leader is dead and starts a new election.

**Candidates** start a new election by:
1. Incrementing the current term.
2. Voting for themselves.
3. Sending a vote request (with the new term) to all other processes.

A candidate wins if it collects votes from a **majority** of processes. Majority voting ensures at most one winner per term.

A candidate transitions out of the candidate state when:
- **It wins**: receives a majority of votes → becomes leader, starts sending heartbeats.
- **Another process wins**: receives a heartbeat with a term ≥ its own → returns to follower.
- **Split vote** (multiple candidates, no majority): election timeout fires; starts a new election with a **random timeout** to reduce the chance of another split vote.

## Practical Implementation: CAS + Lease

In practice, leader election rarely needs to be implemented from scratch. The standard approach:

1. Use a **linearizable key-value store** (e.g., etcd, ZooKeeper) that supports compare-and-swap (CAS) with TTL.
2. Each candidate attempts to **create a key** (the "lease") via CAS. Only the first to succeed becomes leader.
3. The leader **renews the TTL** periodically. If it stops (crash, partition), the TTL expires and another candidate can acquire the lease.

**CAS semantics**: `CAS(key, expected_value, new_value)` — atomically updates the key only if its current value matches `expected_value`. This guarantees only one process succeeds.

etcd and ZooKeeper expose exactly this interface and replicate their state using consensus (Raft/ZAB), making them fault-tolerant coordination services.

## The Mutual Exclusion Problem: Leases Are Not Sufficient

A critical subtlety: **holding a lease does not guarantee exclusive access to shared resources**. The issue:

1. Process P acquires lease; TTL = 30s.
2. P pauses (GC, OS scheduling, slow disk) for 31s.
3. Lease expires. Process Q acquires the lease.
4. P resumes, believing it still holds the lease — now two processes believe they are leader.

Checking `lease_expiry > now()` before acting doesn't fully solve this: the check and the action are not atomic, and the lease can expire in the network round trip between them.

**Solution — fencing tokens (version numbers):**

1. Each lease acquisition returns a monotonically increasing **version number** (or fencing token).
2. Every write to the shared resource includes the version number.
3. The resource accepts writes only if the version number is ≥ the highest it has seen.
4. P's stale write (with an old version) is rejected; Q's write (with a newer version) succeeds.

This is implemented as a **conditional write (CAS)** on the resource itself — read the resource, compute the update, write back conditioned on the version not having changed.

**If the resource doesn't support conditional writes**: design around the possibility of occasional split-brain. If the two leaders perform the same idempotent operation, no harm is done.

## Trade-offs

| Concern | Detail |
|---------|--------|
| **SPOF** | Leader failure stalls writes until a new election completes (Raft: typically milliseconds to seconds) |
| **Scalability bottleneck** | All writes (and in some configs, reads) go through one process; throughput bounded by leader capacity |
| **Blast radius** | If the election mechanism fails, the whole system stalls |

**Mitigations**:
- Minimise the work the leader performs — delegate to followers where possible.
- Use **per-partition leaders** (one leader per shard) to scale throughput (→ [[distributed/partitioning]]).
- Be prepared to tolerate occasional momentary split-brain for idempotent operations.

> "As a rule of thumb, if we must have a leader, we have to minimise the work it performs and be prepared to occasionally have more than one." (→ [[sources/understanding-distributed-systems]] ch. 9)

## Relationship to Replication and Consensus

Leader election is a prerequisite for state machine replication (→ [[distributed/replication]]): the Raft replication protocol begins by electing a leader and uses heartbeats from the same election algorithm to detect leader failure.

Leader election also requires consensus: only one candidate can win each term, and that agreement is itself a consensus decision. The fault-tolerant KV stores used for leases (etcd, ZooKeeper) implement consensus internally (→ [[distributed/consensus-algorithms]]).

## Related Concepts

- [[distributed/replication]] — state machine replication uses leader election; chain replication separates data plane from control plane
- [[distributed/consensus-algorithms]] — leader election is an application of consensus; ZooKeeper/etcd implement it
- [[distributed/failure-detection]] — heartbeat timeouts trigger leader elections
- [[distributed/logical-clocks]] — election terms are logical timestamps (Lamport clock semantics)
- [[distributed/partitioning]] — per-partition leaders mitigate the scalability bottleneck

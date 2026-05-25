---
title: "Consensus Algorithms"
type: concept
tags: [distributed-systems, consensus, raft, paxos, zookeeper, coordination, fault-tolerance]
sources: [designing-data-intensive-applications, understanding-distributed-systems, foundations-of-scalable-systems]
created: 2026-05-13
updated: 2026-05-18
---

# Consensus Algorithms

Consensus is the problem of getting a set of nodes to agree on a single value or decision, even when some nodes fail or messages are delayed. It is one of the most fundamental — and most difficult — problems in distributed systems. Its difficulty is formally proven by the **FLP result**. Its solutions underpin leader election, distributed locks, and every strongly consistent distributed database.

## Why Consensus Is Hard: The FLP Result

Fischer, Lynch, and Paterson (1985) proved that in a **purely asynchronous** distributed system where any single process may fail (crash), no deterministic algorithm can guarantee consensus in finite time.

The intuition: if a message is delayed, there is no way to distinguish between a delayed message and a crashed node. A correct node cannot know whether to wait or proceed.

**The Two Generals' Problem** is a useful concrete illustration: two army generals on opposite sides of a city need to coordinate an attack, but messengers may be captured. The first general cannot be certain a message arrived unless they get an acknowledgment — but the acknowledgment may also be captured. No matter how many acknowledgments are exchanged, neither general can achieve certainty. The problem maps directly to distributed systems: "message captured" = message lost or node crashed; "certainty" = consensus. It demonstrates why consensus on an asynchronous network in the presence of crash faults is impossible to guarantee within bounded time (→ [[sources/foundations-of-scalable-systems]] ch. 3).

**In practice**, consensus is achievable because real systems are **partially synchronous** (usually bounded delays, occasionally not) or use **randomization** (random election timeouts). Timeouts break the FLP impossibility by allowing progress when delays exceed a threshold, at the cost of occasionally timing out on a live node.

## Properties of Correct Consensus Algorithms

A consensus algorithm must satisfy:
1. **Uniform agreement**: no two nodes decide differently.
2. **Integrity**: each node decides at most once; decided value must be one that was proposed.
3. **Validity**: nodes cannot decide an arbitrary value — the decided value was actually proposed.
4. **Termination**: all non-crashed nodes eventually decide (liveness property — requires partial synchrony).

## Epoch Numbers and Leader Uniqueness

All practical fault-tolerant consensus algorithms use **epoch/term/ballot numbers** to prevent split-brain:

- Each time a new leader is elected, the epoch number is incremented.
- A leader is guaranteed to be unique within its epoch.
- If two leaders exist (e.g., a old leader that didn't know it was deposed), the higher epoch wins.
- Nodes reject messages from leaders with a stale epoch.

**Two rounds of voting** (the key insight):
1. **Leader election**: a candidate collects votes from a quorum. Voters check that the candidate's log is at least as up-to-date as their own.
2. **Proposal**: the leader collects acknowledgments from a quorum before considering a value committed.

The quorums for these two rounds must **overlap** — this guarantees that any new leader sees all previously committed values.

## Raft

Raft (Ongaro & Ousterhout, 2014) was designed to be understandable. Used in: etcd, CockroachDB, TiKV, Consul.

**Leader election**:
- Each node has a random election timeout (150–300ms typically).
- If no heartbeat is received before timeout, the node becomes a **candidate**, increments its term, and requests votes.
- Voters grant a vote if they haven't voted in this term and the candidate's log is at least as complete.
- A majority of votes → the candidate becomes leader.

**Log replication**:
- Leader appends new entries to its log, then sends `AppendEntries` RPCs to followers.
- An entry is **committed** when acknowledged by a quorum of nodes.
- Leader sends the commit index to followers in subsequent RPCs.

**Log compaction**: periodic snapshots of application state; discard log entries before the snapshot point. The snapshot is stored and the log is truncated.

**Edge case**: Raft has known performance issues when network links are consistently slow — a node whose heartbeats consistently arrive late may trigger repeated false elections. Adding pre-vote (check if you'd win before starting an election) and leader stickiness (don't vote against an apparently live leader) mitigates this.

## Paxos

Paxos (Lamport, 1989/1998) is the original consensus algorithm. Multi-Paxos (for a sequence of values, as in a replicated log) is the practical version. More complex to understand and implement correctly than Raft; various industrial variants exist.

Used conceptually in: Chubby (Google), Spanner (multi-master coordination), various academic systems.

## Zab (ZooKeeper Atomic Broadcast)

Zab is the consensus protocol underlying Apache ZooKeeper. Designed for the ZooKeeper use case: replicate a sequence of state machine transactions.

Primary-backup model with explicit leader. Uses the same quorum + epoch approach. Guarantees that all ZooKeeper servers process leader proposals in the same order.

## Viewstamped Replication (VSR)

VSR (Liskov & Cowling, 2012) is equivalent to Paxos in power, developed independently. Used in some production systems but less common than Raft/Paxos.

## Limitations of Consensus

Understanding the costs prevents over-application:

| Limitation | Implication |
|------------|-------------|
| Synchronous replication | Leader must wait for quorum acknowledgment before committing → latency proportional to slowest quorum member |
| Strict majority required | 2f+1 nodes to tolerate f failures: 3 nodes for 1 failure, 5 for 2. Even a majority ensures only f+1 survivors — not large margin |
| Fixed membership | Standard algorithms assume a fixed set of nodes. Adding/removing nodes requires a separate **joint consensus** phase (Raft) or reconfiguration protocol |
| Network sensitivity | Consistent network delays can cause repeated leader elections (Raft pre-vote helps). Geo-distributed consensus is especially expensive |
| Single-datacenter scope | Most consensus algorithms are designed for LAN latency. Global consensus (Spanner's TrueTime approach) requires significant infrastructure |

## ZooKeeper and etcd as Consensus Primitives

ZooKeeper (Zab-based) and etcd (Raft-based) are the primary production consensus services. They provide:

- **Linearizable atomic operations**: compare-and-set (CAS), create-if-not-exists. Used for implementing distributed locks and leader election.
- **Total order delivery**: every ZooKeeper node processes changes in the same order. `zxid` is a monotonically increasing transaction ID.
- **Failure detection**: **ephemeral nodes** exist only while the client's session is live. Session timeout (missed heartbeats) causes ephemeral nodes to be deleted — automatic failure detection.
- **Change notifications**: clients subscribe to znodes and receive notifications when they change. Used for configuration management and leader election (watch the ephemeral lock znode).

**Typical cluster size**: 3 or 5 nodes (quorum of 2 or 3). This small cluster serves potentially thousands of application nodes that use it for coordination — the consensus service is not in the data path.

## The Equivalence Theorem

All of the following problems are equivalent — each can be reduced to the others, and all require consensus:

- Linearizable compare-and-set (CAS)
- Atomic transaction commit (deciding commit vs abort)
- Total order broadcast (all nodes receive messages in the same order)
- Distributed locks and leases
- Membership and coordination services (who is in the cluster, who is the leader)
- Uniqueness constraints enforced synchronously

This is a deep result: if you need any of these properties, you need consensus. Consensus requires a quorum (strict majority) and has the costs above. You cannot get consensus-level guarantees cheaply.

> **Key insight**: you often don't need consensus. Causal consistency (→ [[distributed/consistency-models]]) is the strongest model compatible with availability + partition tolerance, and many applications can be correct with only causal ordering. Reserve consensus for the small subset of operations that genuinely require it.

## 2PC: Atomic Commit (Not Fault-Tolerant Consensus)

Two-Phase Commit (2PC) solves a related but different problem: atomic commit across multiple participants (databases, message brokers). It is **not** a fault-tolerant consensus algorithm — it cannot satisfy the termination property when the coordinator crashes.

**The protocol** (→ [[sources/designing-data-intensive-applications]] ch. 9):

1. Application requests a globally unique transaction ID from the coordinator.
2. Application begins a single-node transaction on each participant, tagged with the global ID.
3. **Phase 1 — Prepare**: coordinator sends a prepare request to all participants. Each participant makes sure it can definitely commit (writes to disk, checks constraints) and votes yes or no. By voting yes, the participant *surrenders the right to abort unilaterally*.
4. Coordinator collects all votes. If all voted yes → decides to commit; if any voted no → decides to abort. **The coordinator writes this decision to its own durable log** — this is the commit point.
5. **Phase 2 — Commit/Abort**: coordinator sends the decision to all participants and retries indefinitely until all acknowledge. There is no going back from this point.

**Two points of no return**: (1) a participant votes yes; (2) the coordinator writes its decision to disk. These are what make 2PC atomic.

**The blocking problem**: if the coordinator crashes after participants voted yes but before broadcasting the decision, participants are **in doubt** — they hold their locks and cannot proceed. No timeout can resolve this safely; only the coordinator's recovery can. In-doubt transactions may hold locks for minutes (coordinator restart) or indefinitely (coordinator log lost → requires manual administrator intervention). Even rebooting participants doesn't help — a correct 2PC implementation preserves locks across restarts.

**Heuristic decisions**: many XA implementations provide an emergency escape — a participant can unilaterally commit or abort an in-doubt transaction. This deliberately breaks atomicity and should be used only in catastrophic situations.

**Mitigation**: use a replicated coordinator (Paxos group). This is what Spanner does — the coordinator is itself a Paxos group, so coordinator failure does not block indefinitely.

**XA Transactions**: C API standard for heterogeneous 2PC (PostgreSQL, MySQL, DB2, ActiveMQ, HornetQ, IBM MQ). Allows a single 2PC coordinator to span heterogeneous resource managers. Limitations:
- MySQL distributed XA transactions ~10× slower than local transactions (additional fsync + network round-trips).
- Coordinator is a SPOF (often not replicated by default). Coordinator's log becomes crucial durable state — breaks stateless application server model.
- Cannot detect cross-system deadlocks (would require standardised lock exchange protocol).
- Incompatible with SSI (would require cross-system conflict detection protocol).
- Amplifies failures: all participants must respond to commit, so any failure causes the whole transaction to fail.

**3PC**: theoretically non-blocking but requires bounded network delays and process response times — unrealistic in partial synchrony. Not used in production systems.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Most rigorous treatment — proves equivalence theorem, distinguishes 2PC from consensus, covers FLP result, covers ZooKeeper/etcd use cases, critiques XA (ch. 9) |
| [[sources/understanding-distributed-systems]] | Covers Raft and consensus at a high level; focuses on practical use (ZooKeeper for leader election, partition assignment) rather than theoretical depth |
| [[sources/foundations-of-scalable-systems]] | Database practitioner framing. Raft election mechanics (election terms as logical clocks; RequestVote; randomized timers; candidacy requires up-to-date log); Raft implementations: Neo4j, YugabyteDB, Hazelcast (complementing etcd, CockroachDB from other sources). 2PC failure cascade: coordinator failure holds participant locks → concurrent transactions time out → circuit breakers open → cascading failures in loaded systems. VoltDB SPI mechanism: single CPU core per partition, serial single-threaded execution, no locking needed → no 2PC for single-partition transactions; MPI drives 2PC only for multi-partition. Cloud Spanner TrueTime: GPS + atomic clock hardware, ~7ms bounded skew, commit wait period (hold locks for skew duration) to guarantee real-time ordering of linearizable commits. (ch. 12) |

## Related Concepts

- [[distributed/consistency-models]] — linearizability is the consistency property that requires consensus
- [[distributed/replication]] — leader election in replication uses consensus; Raft is both a consensus algorithm and a replication protocol
- [[distributed/distributed-transactions]] — 2PC is the distributed transaction protocol; its blocking limitation motivates sagas and outbox
- [[distributed/cap-theorem]] — consensus is required for linearizability, which is what "C" means in CAP
- [[distributed/partitioning]] — ZooKeeper coordinates partition assignment across nodes
- [[distributed/broadcast-protocols]] — total order broadcast is equivalent to consensus; TOB is the communication primitive underlying consensus implementations

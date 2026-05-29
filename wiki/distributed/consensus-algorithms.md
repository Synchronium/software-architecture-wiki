---
title: "Consensus Algorithms"
type: concept
tags: [distributed-systems, consensus, raft, coordination, fault-tolerance]
sources: [designing-data-intensive-applications, understanding-distributed-systems, foundations-of-scalable-systems, site-reliability-engineering]
created: 2026-05-13
updated: 2026-05-29
---

# Consensus Algorithms

Consensus is the problem of getting a set of nodes to agree on a single value or decision, even when some nodes fail or messages are delayed. It is one of the most fundamental — and most difficult — problems in distributed systems. Its solutions underpin leader election, distributed locks, and every strongly consistent distributed database.

## Key Claims

- **You need consensus for a specific list of properties.** Linearizable compare-and-set, atomic commit, total order broadcast, distributed locks, leader election, and uniqueness constraints are all equivalent — each requires consensus and reduces to the others. The Equivalence Theorem is the reason consensus matters: avoid these properties and you avoid consensus.
- **Most applications don't need consensus.** Causal consistency is the strongest model compatible with availability + partition tolerance, and many applications can be correct with only causal ordering. Reserve consensus for the small subset of operations that genuinely require it.
- **Consensus is provably impossible in pure async systems** (FLP). In practice, partial synchrony plus randomised timeouts breaks the impossibility — at the cost of occasionally timing out on a live node.
- **All practical algorithms use epoch numbers.** Each leader election increments the epoch; nodes reject messages from stale leaders. The two rounds of voting (election + proposal) overlap their quorums to guarantee any new leader sees all committed values.
- **Raft is the production default for new systems.** Designed to be understandable; used in etcd, CockroachDB, TiKV, Consul. Paxos remains in legacy systems and academic treatments; Zab in ZooKeeper.
- **2PC is not fault-tolerant consensus.** It cannot satisfy termination when the coordinator crashes — participants block indefinitely. Use a replicated coordinator (Paxos group) if 2PC is unavoidable.
- **Replica count matters: 3 minimum, 5 best practice.** Fewer than 5 leaves no tolerance for coincident failure during planned maintenance. Topology matters too — a linchpin replica at a network choke point can partition the cluster even with a technically-live quorum.

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

## Ad Hoc Coordination Failure Patterns

Before consensus services existed, teams assembled ad hoc coordination mechanisms. Three recurring failures illustrate why ad hoc approaches cannot provide consensus guarantees. (→ [[sources/site-reliability-engineering]] ch. 23)

1. **STONITH + heartbeat timeout**: primary and replica used a heartbeat to detect failure and a STONITH mechanism to fence the other node. On a network partition, each node concluded the other was dead. Depending on timing, either both shut down (nothing serving) or both became primary (conflicting writes and data corruption). The underlying problem: heartbeat timeouts cannot distinguish a failed node from a partitioned one.

2. **Human-intervened failover**: manually triggered failover has unbounded MTTR and doesn't scale. Operators are overwhelmed exactly when most needed. Humans are the bottleneck.

3. **Gossip-based cluster membership**: gossip protocols detect failures by exchanging member state, but they cannot reach agreement on *who* is the authoritative leader — they provide eventual consistency, not consensus. On a network partition, each half elected its own master, causing split-brain writes.

## Replicated State Machine (RSM)

The RSM is the fundamental building block of reliable coordination. A consensus algorithm (Paxos, Raft, Zab) provides a totally ordered log; the RSM executes operations in that order. The result: any deterministic state machine — a key-value store, a distributed lock, a task queue, a configuration service — can be made highly available across f failures with 2f+1 replicas. (→ [[sources/site-reliability-engineering]] ch. 23)

**Components correctly built on RSM**:
- **Datastores and config stores** (Chubby, etcd, ZooKeeper) — strongly consistent reads and writes
- **Leader election** — one master at a time, guaranteed
- **Distributed locks** — use *leases*, not indefinite locks. Leases expire automatically if the holder crashes; indefinite locks require explicit release, which may never happen if the lock holder dies
- **Task queues** — claim tasks with leases, not deletions. If a worker crashes mid-task, the lease expires and the task becomes reclaimable
- **Pub/sub systems** — atomic broadcast (which requires consensus) ensures all subscribers see events in the same order

## Replica Count and Placement

**Minimum viable**: 3 nodes tolerates 1 failure (2f+1 where f=1). **Best practice**: 5 nodes tolerates 2 simultaneous failures — one planned maintenance and one concurrent hardware failure. Running fewer than 5 means any planned maintenance leaves no tolerance for coincident failure.

**Placement — failure domains**: replicas should span different racks, switches, and power domains. Losing two replicas in the same rack on a switch failure must be survivable.

**Placement — network topology**: naive placement by count can create a **linchpin replica** problem. In a 5-replica deployment, if one replica sits at a network topology choke point, losing it may effectively partition the cluster even though a quorum still technically exists. Topology must be accounted for, not just replica count.

**Geo-distributed replicas**: increase fault tolerance at the cost of increased consensus latency (speed of light over wide-area links). Hierarchical quorums (e.g., 9-replica cross-region) can reduce latency vs flat quorums by optimising for intra-region rounds. (→ [[sources/site-reliability-engineering]] ch. 23)

## Multi-Paxos Performance

In steady state with a stable leader, Multi-Paxos requires **1 round-trip** per consensus operation (the leader sends accepts; followers respond; the leader commits). The two-phase election only happens when the leader changes.

**Duelling proposers** (two nodes simultaneously trying to be leader) cause livelock — each aborts the other's proposal. Mitigated by randomised backoff before re-proposing.

**Disk write latency** (~1–10ms) limits throughput to ~100 ops/s in serial operation. Two techniques break this limit:
- **Batching**: accumulate multiple operations and commit them in one consensus round
- **Pipelining**: have multiple consensus rounds in flight simultaneously; don't wait for round N to complete before starting round N+1

**Quorum leases**: grant read leases to quorum members, allowing them to serve strongly consistent reads locally without a consensus round. The master withholds lease renewal when it needs to make a change, preventing stale reads during the lease window.

## Monitoring Consensus Systems

Key signals to monitor (→ [[sources/site-reliability-engineering]] ch. 23):
- **Member count and health** — alert if any member is unreachable or lagging
- **Number of lagging replicas** — count + bytes behind leader
- **Leader existence** — alert if no leader currently elected (cluster has halted)
- **Leader change rate** — high churn indicates instability (split votes, network issues)
- **Consensus transaction number** — must increase monotonically; a non-increasing number is a bug
- **Proposal counts** — unexpected spikes indicate contention or repeated leader elections
- **Throughput and latency** — end-to-end consensus operation time, not just disk write time

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Most rigorous treatment — proves equivalence theorem, distinguishes 2PC from consensus, covers FLP result, covers ZooKeeper/etcd use cases, critiques XA (ch. 9) |
| [[sources/understanding-distributed-systems]] | Covers Raft and consensus at a high level; focuses on practical use (ZooKeeper for leader election, partition assignment) rather than theoretical depth |
| [[sources/foundations-of-scalable-systems]] | Database practitioner framing. Raft election mechanics (election terms as logical clocks; RequestVote; randomized timers; candidacy requires up-to-date log); Raft implementations: Neo4j, YugabyteDB, Hazelcast (complementing etcd, CockroachDB from other sources). 2PC failure cascade: coordinator failure holds participant locks → concurrent transactions time out → circuit breakers open → cascading failures in loaded systems. VoltDB SPI mechanism: single CPU core per partition, serial single-threaded execution, no locking needed → no 2PC for single-partition transactions; MPI drives 2PC only for multi-partition. Cloud Spanner TrueTime: GPS + atomic clock hardware, ~7ms bounded skew, commit wait period (hold locks for skew duration) to guarantee real-time ordering of linearizable commits. (ch. 12) |
| [[sources/site-reliability-engineering]] | SRE operations perspective. Three case studies of ad hoc coordination failures (STONITH, human failover, gossip). RSM as the correct foundation. Components built on consensus (datastores, leader election, leases, task queues). Replica count guidance: minimum 3, best practice 5. Multi-Paxos performance: 1 RTT in steady state, batching and pipelining, quorum leases for local reads. Replica placement: failure domains, linchpin replica problem, geo-distribution vs latency. Monitoring: member health, lagging replicas, leader existence and change rate, transaction number monotonicity. (ch. 23) |

## Key Takeaways

- **Ask whether you actually need consensus before reaching for it.** Causal consistency is the strongest model compatible with availability + partition tolerance, and most applications can be correct under causal ordering alone.
- **If you need any of the equivalent properties (linearizable CAS, atomic commit, total order broadcast, distributed locks, leader election, uniqueness), use a consensus service.** Don't build your own — use etcd or ZooKeeper.
- **Use 3 nodes minimum, 5 nodes for production.** Fewer than 5 leaves zero tolerance for failure during planned maintenance. Distribute replicas across failure domains; watch for linchpin replica problems.
- **2PC is not fault-tolerant consensus** — its coordinator can block participants indefinitely. Either use a replicated coordinator (Spanner) or use saga + outbox patterns instead.
- **Monitor leader changes, lagging replicas, proposal counts, and transaction-number monotonicity.** Consensus systems fail subtly; the symptoms are observable but easy to miss.

## Related Concepts

- [[distributed/consistency-models]] — linearizability is the consistency property that requires consensus
- [[distributed/replication]] — leader election in replication uses consensus; Raft is both a consensus algorithm and a replication protocol
- [[distributed/distributed-transactions]] — 2PC is the distributed transaction protocol; its blocking limitation motivates sagas and outbox
- [[distributed/cap-theorem]] — consensus is required for linearizability, which is what "C" means in CAP
- [[distributed/partitioning]] — ZooKeeper coordinates partition assignment across nodes
- [[distributed/broadcast-protocols]] — total order broadcast is equivalent to consensus; TOB is the communication primitive underlying consensus implementations

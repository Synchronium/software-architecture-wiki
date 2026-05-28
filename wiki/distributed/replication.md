---
title: "Replication"
type: concept
tags: [distributed-systems, replication, consistency, fault-tolerance, scalability]
sources: [understanding-distributed-systems, designing-data-intensive-applications, foundations-of-scalable-systems]
created: 2026-05-13
updated: 2026-05-28
---

# Replication

Replication stores copies of data on multiple nodes to achieve fault tolerance, read scalability, and geographic distribution. The core challenge is keeping replicas consistent when writes happen.

## State Machine Replication (Raft)

The standard model for strong consistency replication:

1. Leader receives write → appends to its log.
2. Leader replicates log entry to a quorum of followers.
3. Once quorum acknowledges, entry is **committed**.
4. Leader applies committed entry → returns to client.
5. Followers apply committed entries in order → converge to same state.

Only committed entries survive a leader failure. Raft guarantees linearizability for reads if they go through the leader and are confirmed by a quorum.

**Leader election** (→ [[distributed/leader-election]]): Raft uses randomized election timeouts to avoid split votes. A candidate wins by collecting a majority. The leader broadcasts heartbeats to suppress new elections.

## Chain Replication

An alternative to leader-based replication with cleanly separated read/write roles. (→ [[sources/understanding-distributed-systems]] ch. 10)

**Normal operation:**
- Processes are arranged in a linear chain: head → node₂ → ... → tail.
- Writes go exclusively to the **head**, which updates local state and forwards to its successor.
- Each process in the chain updates local state and forwards downstream until the write reaches the **tail**.
- The **tail commits** the write (applies it locally) and sends an acknowledgment back up the chain to the head.
- Reads are served exclusively by the **tail** — which always has the most recent committed state.

This gives strong consistency: both reads and writes are serialised through the tail.

**Fault tolerance** is delegated to a separate **control plane** (itself using Raft for fault tolerance), which monitors the chain and reconfigures it on failure:

| Failure mode | Recovery |
|-------------|---------|
| Head fails | Successor becomes the new head; client retries (write never committed — safe) |
| Tail fails | Predecessor becomes the new tail (all predecessor state ⊇ tail state) |
| Intermediate node X fails | Control plane links X's predecessor to X's successor; X's successor reports last committed sequence number; predecessor sends missing updates downstream |

**Distributing reads for throughput**: replicas can serve reads while maintaining linearizability using a **dirty flag**. Each replica marks an update dirty as it propagates from head to tail. The tail's acknowledgment travels back up the chain, marking updates clean. A replica can serve a read immediately if the latest version is clean; if dirty, it contacts the tail for the committed version. This allows reads to be distributed across the chain without sacrificing consistency.

**Data plane / control plane split**: the chain's data plane (handling individual client requests) requires no leader — it is purely concerned with throughput. The control plane (handling failure reconfiguration) requires a leader (Raft), but it only acts on failures, which are rare. This separation keeps the common case (client requests) free of coordination overhead. Separating [[distributed/control-plane-data-plane|data plane from control plane]] is a general distributed systems pattern. (→ [[sources/understanding-distributed-systems]] ch. 22)

**Properties vs. Raft:**

| Property | Chain Replication | Raft |
|---------|------------------|----|
| Write latency | All N nodes in critical path — one slow node stalls all writes | Quorum (N/2+1) — tolerant of slow tail |
| Read throughput | Can distribute reads across replicas (dirty flag) | Leader is read bottleneck (unless followers used, sacrificing consistency) |
| Failure handling | Control plane must reconfigure before writes resume | Leader handles without stopping progress |
| Simplicity | Fewer failure modes to reason about | More complex state machine |
| Pipeline throughput | Writes can be pipelined — higher raw throughput | Leader serialises writes |

**Real-world application — Azure Storage**: Azure's blob store uses chain replication in its stream layer. The stream layer implements a distributed append-only filesystem; the unit of replication is an **extent** (a chunk of a stream), replicated synchronously across a chain of storage servers. A separate stream manager (control plane, itself fault-tolerant) assigns extents to chains and reconfigures them on failure. This sits underneath a partition layer (range-partitioned file index, split/merge on load) and a stateless front-end layer (reverse proxy for auth + routing) — a concrete data/control plane separation. Azure Storage was built with strong consistency from the start; AWS S3 only added strong consistency in 2021. (→ [[sources/understanding-distributed-systems]] ch. 17)

## Leader-Follower (Database Replication)

Common in relational databases:

| Mode | Behaviour | Tradeoff |
|------|----------|----------|
| **Async** | Leader returns immediately; followers catch up asynchronously | Low latency; can lose data on leader crash |
| **Sync** | Leader waits for all followers to acknowledge | Durable; slow (worst follower sets pace) |
| **Semi-sync** | Leader waits for one follower to acknowledge | Practical compromise |

Managed databases (RDS, Azure SQL) automate failover. Async followers can serve stale reads — useful for read scaling, not for linearizability.

### Replication Log Formats

How writes are communicated to followers differs by format (→ [[sources/designing-data-intensive-applications]] ch. 5):

| Format | Mechanism | Strengths | Weaknesses |
|--------|-----------|-----------|------------|
| **Statement-based** | Replicate the SQL statement itself | Simple, compact | Nondeterministic functions (NOW(), RAND(), auto-increment) produce different values on followers; stored procedures with side effects; ORDER BY on non-unique columns |
| **WAL shipping** | Ship the write-ahead log (storage engine's internal byte format) | Exact byte-for-byte replica | Tightly coupled to storage engine version — cannot run follower on a newer DB version (prevents zero-downtime upgrades) |
| **Logical (row-based)** | Log actual row changes: new values for inserts/updates, PK for deletes | Decoupled from storage engine → cross-version replication, CDC possible | More verbose than WAL |
| **Trigger-based** | Application/DB triggers write changes to a separate log table | Maximum flexibility | Highest overhead, most error-prone |

Logical replication (MySQL binlog, PostgreSQL logical decoding) is the basis for Change Data Capture (CDC), enabling derived systems (search indexes, caches, data warehouses) to follow the primary database.

### Failover Problems

Automated failover has failure modes that are worse than the failure they try to prevent:

- **Unreplicated writes**: if an async follower is promoted to leader, writes the old leader received but didn't replicate are lost. If the new leader then receives writes for those same keys, the discarded writes may conflict with what clients already received — a consistency violation the client cannot detect.
- **Split brain**: if two nodes both believe they are the leader, both accept writes, diverging silently. Safe failover requires fencing the old leader before the new one accepts writes.
- **The GitHub incident**: MySQL follower promoted to leader had an auto-increment counter at a lower value than what Redis had cached. New writes reused old IDs → private data from other users became accessible.
- **Timeout tuning**: too short → unnecessary failovers under load spike; too long → extended downtime after a genuine failure.

## Dynamo-Style (Leaderless) Replication

Any replica accepts reads and writes. Consistency is enforced by quorum intersection:

- **W** write replicas must acknowledge a write.
- **R** read replicas must be consulted for a read.
- If **W + R > N** (total replicas), at least one read replica overlaps with the write quorum → latest value is always visible.

**Important caveat**: W + R > N does not guarantee linearizability on its own. If a write succeeds on fewer than W replicas before the coordinator fails, replicas are left in an inconsistent state — some reads return the latest version while others return stale. For linearizability, writes must be bundled into an atomic transaction so partial writes are prevented. (→ [[sources/understanding-distributed-systems]] ch. 11)

Anti-entropy mechanisms keep replicas in sync:
- **Read repair**: detect stale replicas during reads and correct them.
- **Merkle tree hashes**: background comparison of replica state to find and repair divergence.
- **Anti-entropy process**: background process continually compares replicas and copies missing data. Voldemort lacks anti-entropy → missing data may not appear until next read repair.

Used in: Cassandra, Riak, DynamoDB (default reads).

### Sloppy Quorums and Hinted Handoff

During a network partition, fewer than W home nodes for a key may be reachable. A **sloppy quorum** allows the write to proceed by using any W available nodes, even if they are not the "home" nodes for that key. The substitute nodes accept the write with a hint indicating the intended home node.

When the home nodes recover, the substitute nodes perform **hinted handoff**: they forward the write to the appropriate home node.

- Sloppy quorums improve write durability during partitions.
- They do **not** provide linearizability — the home nodes may be completely unaware of the write until handoff. A strict quorum of home nodes (W+R>N using only home nodes) is required for linearizability.
- Cassandra, Riak, and the original Dynamo paper use sloppy quorums. DynamoDB does not.

### Version Vectors

In leaderless (and multi-leader) replication, version vectors track the write history to distinguish overwrites from concurrent writes:

- Each replica maintains a per-key version number (or per-replica version number).
- The version vector is returned to clients on reads.
- When a client writes, it includes the version vector it last read; the server uses this to detect whether the new write is causally after, before, or concurrent with what it already has.
- **Concurrent writes**: if two writes arrive with the same version base, they are concurrent — the server stores both as siblings for the application to resolve.
- Riak uses **dotted version vectors** (Riak 2.0) — a refinement that prevents false concurrency detection.

> **Version vectors ≠ vector clocks**: vector clocks track causality between events in a distributed computation; version vectors compare state of replicas of a single key. The distinction is subtle but important — using the term "vector clock" for replica state comparison is technically imprecise. (→ [[sources/designing-data-intensive-applications]] ch. 5)

## Consistency and Replication

The replication strategy directly determines the achievable consistency model (→ [[distributed/consistency-models]]):

- State machine replication with quorum reads → linearizability.
- Async leader-follower with follower reads → eventual consistency.
- Leaderless with W+R>N → tunable (strong quorum reads or eventual reads).

## Replication Lag and Its Consequences

When followers are asynchronous, they can lag behind the leader. Kleppmann identifies three important anomalies that arise from replication lag (→ [[sources/designing-data-intensive-applications]] ch. 5):

- **Read-your-writes (read-after-write consistency)**: a user writes something, then reads it back — but the read goes to a lagging follower and the write is not yet visible. Solution: route a user's own reads to the leader, or track the user's last write timestamp and wait for followers to catch up.
- **Monotonic reads**: a user makes two reads in sequence from different followers; the second read returns older data than the first (the second follower lags more). Solution: route a user's reads to the same follower consistently.
- **Consistent prefix reads**: if writes happen in causal order (B causes A) but a follower applies them out of order, a reader may see B before A — a causality violation. Solution: causally related writes must go to the same partition.

These anomalies are forms of eventual consistency in practice. They do not occur with synchronous replication or with single-leader reads.

## Multi-Leader Replication

Multi-leader replication (active-active, master-master) allows multiple nodes to accept writes. Use cases: multi-datacenter deployments, offline-capable clients, real-time collaborative editing.

**Conflict resolution is unavoidable** because two leaders can independently modify the same data. Strategies:
- **Last-write-wins (LWW)**: the write with the highest timestamp wins. Loses data if timestamps overlap due to clock skew (silent data loss). Dangerous in multi-leader setups.
- **Version vectors**: each node maintains a vector of write counts per replica. Enables detection of concurrent writes vs. causally ordered writes.
- **CRDTs**: data structures designed to merge automatically without conflict (→ [[distributed/crdts]]).
- **On-write conflict handlers**: trigger custom conflict logic on write (Bucardo for PostgreSQL, custom Perl handlers).
- **On-read (all versions preserved)**: store all concurrent writes as siblings, return all to the application on next read for resolution (CouchDB approach).
- **Application-level merge**: expose conflicts to the application for custom resolution; Riak and Dynamo use this.

**Multi-leader topologies** (→ [[sources/designing-data-intensive-applications]] ch. 5):

| Topology | Structure | Fault tolerance | Failure mode |
|----------|-----------|-----------------|--------------|
| **Circular** | Each node forwards to one downstream node | Low — one failed node breaks the ring | Default in MySQL multi-leader; nodes tag writes with their ID to detect/drop duplicates already forwarded |
| **Star** | One central forwarding node | Low — central node is a SPOF | Simpler to configure than all-to-all |
| **All-to-all** | Each node writes directly to every other | High — no SPOF | Causality violations: writes can arrive out of order if one network path is faster than another; version vectors help but don't fully solve |

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/understanding-distributed-systems]] | State machine replication (Raft), chain replication, Dynamo-style leaderless — focused on correctness proofs and system models |
| [[sources/designing-data-intensive-applications]] | Most complete treatment — adds replication lag anomalies (read-your-writes, monotonic reads, consistent prefix reads), multi-leader conflict resolution, Dynamo-style in depth (ch. 5) |
| [[sources/foundations-of-scalable-systems]] | Scalability and operations framing. Inconsistency window (duration with no upper bound; affected by replica count, operational load, geographic distance). RYOWs implementation (leader reads; Neo4j bookmark-based). Tunable consistency (N/W/R parameters) as a practical per-request control. Version vectors for conflict detection in leaderless systems. Merkle tree anti-entropy: build binary hash trees per partition, compare root hashes first, traverse to divergent leaves — CPU-intensive, scheduled during low load. Read repair (digest reads for efficiency). In the wild: Netflix Cassandra (6+ PB), bet365 Riak KV. (ch. 10–11) |

> **Agreement**: both sources treat Raft as the reference protocol for strongly consistent single-leader replication. Vitillo proves properties more formally; Kleppmann gives more operational detail.

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 10) — state machine replication (Raft), chain replication, consistency models, CAP/PACELC.
- (→ [[sources/understanding-distributed-systems]] ch. 11) — leaderless (Dynamo-style), anti-entropy, CRDTs.
- (→ [[sources/understanding-distributed-systems]] ch. 17) — Azure Storage architecture: chain replication in stream layer, range-partitioned file index, data/control plane separation.
- (→ [[sources/understanding-distributed-systems]] ch. 19) — database replication (leader-follower, NoSQL/NewSQL).
- (→ [[sources/designing-data-intensive-applications]] ch. 5) — single-leader, multi-leader, leaderless; replication lag anomalies; conflict resolution in depth.

## Related Pages

- [[distributed/consistency-models]]
- [[distributed/cap-theorem]]
- [[distributed/crdts]]
- [[distributed/distributed-transactions]]
- [[distributed/consensus-algorithms]]
- [[databases/transactions]]
- [[streams/change-data-capture]] — logical replication as the foundation for CDC; database write log as event source

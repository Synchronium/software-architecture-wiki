---
title: "Broadcast Protocols"
type: concept
tags: [distributed-systems, messaging, replication, coordination, fault-tolerance]
sources: [understanding-distributed-systems]
created: 2026-05-14
updated: 2026-05-14
---

# Broadcast Protocols

A broadcast protocol delivers a message from one sender to a group of processes. The internet only offers point-to-point (unicast) communication, so multicast must be built on top of it — the challenge being that both senders and receivers can crash at any time. (→ [[sources/understanding-distributed-systems]])

## The Hierarchy

Protocols are ordered from weakest to strongest guarantees:

### Best-Effort Broadcast
Guarantees delivery to all non-faulty processes **if the sender doesn't crash**. If the sender fails mid-broadcast, some processes may never receive the message.

**Implementation**: send the message to all processes one by one over reliable links.

### Reliable Broadcast (Eager)
Guarantees delivery to all non-faulty processes **even if the sender crashes**. Achieved by having every process re-broadcast the message when it first receives it.

**Cost**: O(N²) messages for a group of N processes — each of N processes retransmits to N-1 others.

### Gossip Broadcast
A probabilistic approach to reliable broadcast. Each process retransmits to a random **subset** (e.g., 2) of processes rather than all. Message count is O(N log N) — manageable even for large groups.

**Trade-off**: not a deterministic guarantee — a message *can* fail to reach a process. With well-tuned parameters this probability is negligible. Useful when N is too large for eager reliable broadcast.

### Total Order Broadcast (Atomic Broadcast)
A reliable broadcast that additionally guarantees all processes receive all messages in the **same order**. This is the gold standard for replication consistency.

**Cost**: requires consensus. A fault-tolerant total order broadcast protocol is equivalent to consensus — you cannot implement one without the other. As a result, total order broadcast is unavailable during network partitions (CAP applies).

## Why the Hierarchy Matters

| Protocol | Messages | Crash-tolerant delivery | Order guaranteed |
|----------|----------|-------------------------|------------------|
| Best-effort | O(N) | No (sender crash = partial) | No |
| Reliable (eager) | O(N²) | Yes | No |
| Gossip | O(N log N) | Probabilistic | No |
| Total order | Protocol-dependent | Yes (with quorum) | Yes |

The choice of broadcast protocol determines what consistency guarantees a replicated system can provide:

- **State machine replication** (Raft, Paxos) requires total order broadcast. All replicas receive the same writes in the same order → strong consistency.
- **CRDTs** use reliable broadcast (or even gossip + anti-entropy). Order doesn't matter because the merge operation is commutative and associative. → strong eventual consistency without consensus.
- **Dynamo-style stores** use best-effort broadcast + anti-entropy (read repair, Merkle tree synchronization) as an approximation of reliable broadcast.

## Connection to Consensus

Total order broadcast and consensus are formally equivalent (→ [[sources/understanding-distributed-systems]]):

- **Consensus → Total order broadcast**: use the consensus output to order messages.
- **Total order broadcast → Consensus**: broadcast the proposed value; the first value delivered is the consensus result.

This equivalence means total order broadcast inherits the FLP impossibility result: it cannot be solved deterministically in an asynchronous system with even one crashed process. In practice, algorithms like Raft use partial synchrony (timeouts) to work around this.

## Related Pages

- [[distributed/crdts]] — CRDTs avoid total order broadcast; use commutative merge instead
- [[distributed/replication]] — state machine replication uses total order broadcast (Raft)
- [[distributed/consensus-algorithms]] — consensus ↔ total order broadcast equivalence
- [[distributed/consistency-models]] — broadcast choice determines consistency model achievable

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 11) — best-effort, reliable, gossip, total order broadcast; consensus requirement; relationship to CRDTs.

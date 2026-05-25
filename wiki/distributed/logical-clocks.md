---
title: "Logical Clocks"
type: concept
tags: [distributed-systems, time, ordering, causality, clocks]
sources: [understanding-distributed-systems, designing-data-intensive-applications]
created: 2026-05-14
updated: 2026-05-14
---

# Logical Clocks

## Definition

A logical clock is a mechanism for capturing the causal ordering of events across distributed processes without relying on synchronised physical clocks. In distributed systems, there is no shared global clock, and physical clocks on different nodes drift apart — making physical timestamps unreliable for determining whether one event happened before another. (→ [[sources/understanding-distributed-systems]] ch. 8)

## Why It Matters

To build correct distributed systems, we often need to know whether one operation happened before another. This ordering determines correctness in replication (which write wins?), conflict resolution in CRDTs (→ [[distributed/crdts]]), and causal consistency (→ [[distributed/consistency-models]]). Physical clocks cannot reliably provide this across nodes.

## Physical Clocks: The Problem

**Quartz clocks** are cheap and common but drift at different rates due to manufacturing differences and temperature. Two machines' clocks will diverge over time.

**Clock synchronization (NTP)**: the Network Time Protocol estimates the offset between a client's clock and a reference server's clock, then adjusts the local clock. But:
- NTP adjustments can cause the clock to jump forward or backward.
- A backward jump means an event that happened later could get an earlier timestamp.
- NTP accuracy is bounded by network latency estimation errors.

**Monotonic clocks**: the OS provides a clock that only moves forward, measuring elapsed time since some arbitrary point (e.g., boot). Safe for measuring durations on a single node; useless for comparing timestamps across nodes (they have no common epoch).

**Consequence**: physical clocks cannot be used to definitively order events across processes. Physical timestamps are fine for approximate ordering (e.g., log timestamps for debugging) but not for algorithm correctness.

## The Happened-Before Relationship

The key insight is to capture causality rather than physical time. Event A **happened-before** event B (written A → B) if:
- A and B execute on the same process, and A executes before B.
- A is the sending of a message and B is the receipt of that message.
- A → C and C → B for some event C (transitivity).

If neither A → B nor B → A, then A and B are **concurrent** — there is no causal relationship between them.

## Lamport Clocks

A Lamport clock assigns a logical timestamp to each event by maintaining a counter per process. Rules:

1. Initialize counter to 0.
2. Before executing an operation, increment the counter by 1.
3. When sending a message, increment the counter by 1 and include the current counter value in the message.
4. When receiving a message, set the counter to `max(local_counter, received_counter) + 1`.

**Guarantee**: if A happened-before B, then `timestamp(A) < timestamp(B)`.

**Limitation**: the converse does not hold. If `timestamp(A) < timestamp(B)`, it does not mean A happened-before B — they could be concurrent. Lamport clocks create a total order (with tie-breaking by process ID), but that total order does not imply causality.

**Use case**: providing a consistent global ordering of events when the exact causal relationship is not required — e.g., serialising writes to a replicated log.

## Vector Clocks

Vector clocks extend Lamport clocks to detect concurrency. Each process maintains an **array of counters**, one per process. Rules:

1. Initialize all counters to 0.
2. Before executing an operation, increment own counter by 1.
3. When sending a message, increment own counter by 1 and include the full array.
4. When receiving a message, take element-wise maximum of the received array and local array, then increment own counter by 1.

**Comparison**: given timestamps V₁ and V₂:
- **V₁ happened-before V₂**: every counter in V₁ ≤ corresponding counter in V₂, and at least one is strictly less.
- **V₂ happened-before V₁**: symmetric.
- **Concurrent**: neither condition holds — the events are causally independent.

**Example**: if V₁ = [2, 1, 0] and V₂ = [1, 3, 1], then V₁ and V₂ are concurrent (2 > 1 in position 0 but 1 < 3 in position 1).

**Trade-off**: vector clocks require O(N) storage per event, where N is the number of processes. For systems with many clients, this becomes impractical. Dotted version vectors are an alternative that reduces storage in some topologies.

## Summary: Which Clock for What

| Need | Tool |
|------|------|
| Measure elapsed time on one node | Monotonic clock |
| Approximate ordering for debugging/logging | Physical (wall-time) clock |
| Total ordering of events (not necessarily causal) | Lamport clock |
| Detecting concurrent vs. causally ordered events | Vector clock |
| Causal consistency in a distributed store | Vector clocks or dependency tracking |

## Lamport Timestamps: Insufficient for Uniqueness

A subtle but important limitation: Lamport timestamps establish a total order consistent with causality, but cannot determine whether the order is *final*. Consider two nodes independently trying to claim the same username. Each can generate a Lamport timestamp for its registration request. They can compare timestamps to determine which request should "win." But — they cannot know this at the time of the request: they would need to have received and compared all concurrent requests across the whole system first.

This is why Lamport timestamps alone cannot implement uniqueness constraints in a distributed system. What is needed is **total order broadcast**: a protocol that reliably delivers messages to all nodes in the same order, and where a node knows the order is final once the message is delivered. Consensus is required for total order broadcast, and thus for uniqueness. (→ [[sources/designing-data-intensive-applications]] ch. 9)

## Practical Applications

- **CRDTs**: use vector clocks (or similar) to determine which operations are concurrent and can be merged (→ [[distributed/crdts]])
- **Multi-leader conflict resolution**: last-write-wins using Lamport timestamps; version vectors for detecting true concurrency (→ [[distributed/replication]])
- **Causal consistency**: vector clocks track causal dependencies to ensure causally prior writes are visible before dependent writes (→ [[distributed/consistency-models]])
- **Distributed snapshots**: logical timestamps enable consistent global snapshots without stopping all processes

## Key Quotes

> "In general, we can't use physical clocks to accurately derive the order of events that happened on different processes." (→ [[sources/understanding-distributed-systems]] ch. 8)

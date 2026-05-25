---
title: "CAP Theorem"
type: concept
tags: [distributed-systems, consistency, availability, partitioning]
sources: [understanding-distributed-systems, designing-data-intensive-applications]
created: 2026-05-13
updated: 2026-05-13
---

# CAP Theorem

A distributed system can provide at most two of the following three guarantees simultaneously:

- **C — Consistency**: every read returns the most recent write (linearizability).
- **A — Availability**: every request receives a response (not necessarily the most recent data).
- **P — Partition tolerance**: the system continues operating despite arbitrary message loss between nodes.

Because network partitions are unavoidable in practice (not a design choice), the real tradeoff during a partition is **C vs. A**:

- **CP systems** stop accepting writes (or return errors) to preserve consistency.
- **AP systems** continue serving stale data to preserve availability.

## Limitations of CAP

CAP is often misunderstood or overstated:

1. **Availability in CAP** means every request gets *some* response — even slow responses satisfy it. This is an extreme definition.
2. **Consistency in CAP** specifically means linearizability — many weaker but useful consistency models exist (→ [[distributed/consistency-models]]).
3. The partition/no-partition binary is too coarse; real systems face degraded links, not binary split-brain.

## PACELC Extension

PACELC (Daniel Abadi, 2012) extends CAP to cover *normal operation* (no partition):

```
If Partition:  choose A vs. C
Else:          choose Latency vs. Consistency
```

This captures a critical real-world tradeoff that CAP ignores: even without partitions, you choose between low latency (async replication, stale reads) and strong consistency (synchronous replication, round-trip to leader).

Examples:
- Cassandra: **PA/EL** — prioritises availability during partitions; prioritises low latency normally.
- Spanner: **PC/EC** — prioritises consistency in both cases; achieves low latency via TrueTime (not by weakening consistency).
- DynamoDB (eventual): **PA/EL**; DynamoDB (strong reads): **PC/EC**.

## Kleppmann's Critique: "Best Avoided"

Kleppmann (→ [[sources/designing-data-intensive-applications]] ch. 9) takes the strongest position of any source in this wiki: CAP theorem is "best avoided as a tool for reasoning about systems." His arguments:

1. **Narrow definition of consistency**: CAP's "C" means only linearizability — one specific consistency model out of a spectrum. Causal consistency, read-your-writes, and monotonic reads are all distinct, useful models that CAP ignores.
2. **Misleading partition/no-partition binary**: real networks degrade gradually — slow links, high latency, partial packet loss. The partition/no-partition binary is too coarse for operational decision-making.
3. **Ignores normal-operation trade-offs**: even without partitions, there is a latency/consistency trade-off (PACELC). This is where most operational tuning actually happens.
4. **Historically influential but limited scope**: CAP helped popularize the recognition that distributed systems cannot have everything, but PACELC is the more complete and actionable framework.
5. **Even CPU caches are non-linearizable**: for performance reasons, not fault tolerance. This shows linearizability is a more broadly relevant concern than just network partitions.

> **Contradiction:** [[sources/understanding-distributed-systems]] also critiques CAP but treats it as a useful first approximation worth understanding. Kleppmann is more dismissive. Both recommend PACELC as the better operational model.

## In Practice

The binary framing dissolves at the edges. Systems offer tunable consistency per-operation (DynamoDB's `ConsistentRead`, Cassandra's per-query consistency levels). The PACELC framing better matches operational experience. CAP is still worth knowing as historical context and as a conversation shorthand — just not as an analytical tool.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/understanding-distributed-systems]] | Useful first approximation; PACELC is more practical; CAP helps explain the fundamental trade-off |
| [[sources/designing-data-intensive-applications]] | "Best avoided" — too narrow, too coarse, PACELC is strictly better for reasoning about systems |

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 10) — CAP and PACELC covered together; PACELC presented as the more useful mental model.
- (→ [[sources/designing-data-intensive-applications]] ch. 9) — strongest critique of CAP theorem; introduces timeliness/integrity distinction as a better framework.

## Related Pages

- [[distributed/consistency-models]]
- [[distributed/replication]]
- [[distributed/distributed-transactions]]
- [[distributed/consensus-algorithms]]

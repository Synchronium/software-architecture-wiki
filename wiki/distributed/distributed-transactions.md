---
title: "Distributed Transactions"
type: concept
tags: [distributed-systems, transactions, consistency, atomicity, coordination]
sources: [understanding-distributed-systems, designing-data-intensive-applications, monolith-to-microservices]
created: 2026-05-13
updated: 2026-05-15
---

# Distributed Transactions

A distributed transaction spans multiple nodes or services and must satisfy ACID properties across all of them. The fundamental challenge: how to achieve atomicity (all-or-nothing) when each participant is independently fallible and there is no shared clock or memory.

## Local ACID Recap

Single-node ACID properties:

- **Atomicity**: transaction either commits fully or rolls back entirely (WAL enables this).
- **Consistency**: transaction moves the database from one valid state to another.
- **Isolation**: concurrent transactions don't interfere (implemented via locking or MVCC).
- **Durability**: committed data survives crashes (WAL + replication).

Isolation levels (weakest to strongest): Read Uncommitted → Read Committed → Repeatable Read → Serializable. Serializability prevents all anomalies: dirty writes, dirty reads, fuzzy reads, phantom reads.

Concurrency control mechanisms:
- **2PL** (Two-Phase Locking, pessimistic): acquire locks before reads/writes; hold until commit. Can deadlock.
- **OCC** (Optimistic Concurrency Control): work in local workspace; validate for conflicts at commit. Better for low-conflict workloads.
- **MVCC**: maintain multiple versions per row; readers never block writers. Read-only transactions never abort.

## Two-Phase Commit (2PC)

The standard protocol for distributed atomicity:

**Phase 1 — Prepare**: coordinator asks all participants "can you commit?". Each participant locks its resources and responds yes/no.

**Phase 2 — Commit/Abort**: if all said yes, coordinator broadcasts Commit. If any said no (or timed out), coordinator broadcasts Abort.

**Critical weakness**: if the coordinator crashes after Phase 1 but before Phase 2, participants are stuck holding locks indefinitely — they cannot proceed without the coordinator's decision. This is called the **blocking problem**.

**2PC is uniform consensus**: atomically committing a distributed transaction is a form of consensus — *uniform* consensus, where all processes (including faulty ones) must agree. This is strictly harder than standard consensus (where only non-faulty processes must agree). The practical consequence: no simple solution exists, which is why 2PC's blocking behaviour under failure is not an implementation bug but a fundamental property.

Mitigation: use a durable, replicated coordinator (e.g., a Paxos group). This is the Spanner approach.

## Spanner

Google's globally distributed ACID database:

- **2PC + 2PL** for transaction management within a Paxos group.
- **Paxos state machine replication** within each shard for durability and fault tolerance.
- **TrueTime**: GPS + atomic clocks provide bounded uncertainty intervals `[t_earliest, t_latest]`. Each transaction is assigned the `t_latest` timestamp of the interval. Before committing, Spanner **waits out the uncertainty period** (`t_latest − t_earliest`) to ensure any transaction that starts after this one committed will see its changes. This gives external consistency (strict serializability globally) without a centralised clock — at the cost of commit latency proportional to clock uncertainty. Spanner keeps uncertainty small (~7 ms) by deploying GPS and atomic clocks in every data center.

**CockroachDB** takes a different approach: instead of GPS/atomic clocks, it uses **hybrid-logical clocks** composed of a physical timestamp plus a logical counter. This sidesteps the infrastructure requirement of TrueTime while providing similar ordering guarantees.

Spanner shows that global ACID is achievable with sufficient infrastructure investment; CockroachDB shows it can be approximated without specialised hardware.

## Asynchronous Distributed Transactions

When synchronous coordination (2PC) is too expensive or unavailable, two patterns provide eventual atomicity:

### Outbox Pattern
Achieves atomic write + publish without 2PC:
1. Write state change AND a message record to the same local DB in one ACID transaction.
2. A relay process reads the outbox table and forwards to the message broker.
3. Idempotency key on the message handles at-least-once delivery.

The local ACID transaction ensures write and publish are either both committed or both rolled back. (→ [[patterns/outbox-pattern]])

### Saga Pattern
Replaces a distributed ACID transaction with a sequence of local transactions:

```
T₁ → T₂ → T₃ → ... → Tₙ
```

Each Tᵢ has a compensating transaction Cᵢ that undoes its effects. On failure at Tᵢ, the saga runs Cᵢ₋₁ → Cᵢ₋₂ → ... → C₁ to roll back.

**Key limitation**: no isolation. Between T₁ committing and T₂ committing, other transactions can see the intermediate state. Mitigation: semantic locks or designing around the lack of isolation. (→ [[patterns/saga]])

## Trade-offs Summary

| Approach | Atomicity | Isolation | Availability | Complexity |
|----------|-----------|-----------|--------------|------------|
| 2PC | Strong | Full | Blocking on coordinator fail | Medium |
| Spanner | Strong | Full | High (Paxos coordinator) | Very high |
| Outbox + Saga | Eventual | None | High | Medium |

## XA Transactions

XA (eXtended Architecture) is a C standard API for heterogeneous 2PC — coordinating a transaction across different resource managers (PostgreSQL, MySQL, ActiveMQ, IBM MQ, etc.) from a single application-level coordinator.

**Problems with XA** (→ [[sources/designing-data-intensive-applications]] ch. 9):
- **Coordinator SPOF**: if the coordinator crashes after phase 1, participants hold locks indefinitely. The coordinator must be replicated (and most XA implementations are not).
- **Performance**: MySQL XA transactions are ~10× slower than local transactions — 2PC overhead plus cross-system coordination.
- **Cross-system deadlocks**: XA cannot detect deadlocks that span systems; operators must manually resolve.
- **Incompatible with SSI**: XA requires the coordinator to survive crashes, but SSI (Serializable Snapshot Isolation) depends on transaction ID ordering within a single database.

XA is used in Java EE application servers (JTA) for coordinating database + JMS operations. It works well when the coordinator is reliable and the performance penalty is acceptable — which is not always the case.

## Coordination-Avoiding Correctness (DDIA Ch. 12)

Kleppmann's thesis: many applications that seem to require distributed transactions can achieve equivalent correctness without them, using end-to-end operation IDs + idempotency + deterministic derivation.

**The key insight**: separate timeliness from integrity (→ [[distributed/consistency-models]]). Distributed transactions provide both (linearizability = timeliness; atomicity = integrity). But integrity can be maintained without linearizability.

**Mechanism**:
1. Client generates a unique operation ID (UUID) and passes it through all hops.
2. Each downstream service deduplicates on the operation ID (idempotent writes).
3. Multi-partition operations: write the entire request as a single event (one atomic single-object write to a log); derive sub-operations deterministically from that single event; each sub-operation is deduplicated by the operation ID.

This avoids 2PC by never requiring atomic commit across multiple partitions — only single-object writes, which are atomic in virtually all storage systems. The log partitioned by request ID provides a total order for conflict resolution.

**Loosely interpreted constraints**: many business constraints (uniqueness, inventory, booking) can tolerate temporary violations that are fixed via compensating transactions — reducing the need for synchronous coordination. Airlines overbook; banks allow overdrafts (with fees); both have compensation processes regardless. The question is not "do we need constraints?" but "do we need *synchronous* enforcement before the write?"

> **Contrast:** [[sources/understanding-distributed-systems]] recommends managing distributed transactions with a replicated coordinator (Spanner model). Kleppmann recommends avoiding them entirely where possible. Both positions are valid at different scales and contexts.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/understanding-distributed-systems]] | Covers 2PC mechanism, Spanner (2PC + Paxos + TrueTime), Outbox and Saga as async alternatives |
| [[sources/designing-data-intensive-applications]] | Most complete treatment — covers XA limitations, isolation level internals (SSI), and the coordination-avoiding correctness approach as a modern alternative (ch. 7, 9, 12) |
| [[sources/monolith-to-microservices]] | Migration-focused: splitting a database means losing ACID guarantees; Newman's default recommendation is "just say no" to 2PC in a microservice context because distributed locks, latency, and failure modes (blocking problem under coordinator failure) make it more trouble than it is worth. The first question is not "how do we transact across services?" but "do we need to split this data at all?" If the answer is yes, sagas are the default (ch. 4). |

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 12) — ACID, 2PL, OCC, MVCC, 2PC, Spanner.
- (→ [[sources/understanding-distributed-systems]] ch. 13) — Outbox pattern, Saga pattern.
- (→ [[sources/designing-data-intensive-applications]] ch. 7) — isolation levels in depth, SSI, write skew, phantoms.
- (→ [[sources/designing-data-intensive-applications]] ch. 9) — 2PC blocking problem, XA, fault-tolerant consensus as alternative coordinator.
- (→ [[sources/designing-data-intensive-applications]] ch. 12) — coordination-avoiding correctness, end-to-end operation IDs, loosely interpreted constraints.

## Related Pages

- [[distributed/consistency-models]]
- [[distributed/replication]]
- [[distributed/idempotency]]
- [[distributed/consensus-algorithms]]
- [[databases/transactions]]
- [[patterns/outbox-pattern]]
- [[patterns/saga]]

---
title: "Transactions"
type: database
tags: [databases, transactions, acid, isolation, concurrency, serializability, mvcc]
sources: [designing-data-intensive-applications, understanding-distributed-systems, patterns-of-enterprise-application-architecture]
created: 2026-05-13
updated: 2026-05-29
---

# Transactions

A transaction groups a set of reads and writes into a logical unit that either commits entirely or aborts entirely. Transactions simplify the error-handling model: instead of reasoning about every possible partial failure in concurrent execution, application code handles two outcomes — commit or abort — and the database handles everything else. However, the degree of protection provided depends heavily on the **isolation level** chosen, and most databases deliver weaker guarantees than their documentation claims.

## Key Claims

- **ACID is precise but often misread.** Atomicity = commit-or-rollback, not concurrency. Consistency = application invariant, not DB property. Isolation = concurrent transactions don't interfere. Durability = committed data survives crash. The C "was tossed in to make the acronym work" (Hellerstein) and has nothing to do with distributed consistency models.
- **Isolation levels are defined by which anomalies they prevent.** Dirty read, read skew, lost update, write skew, phantom — each prevented at a progressively stronger level. Picking the right level requires knowing which anomalies your workload actually exposes.
- **Most "Serializable" databases aren't.** Vendors ship Snapshot Isolation (MVCC) under various marketing names — Oracle's "Serializable," PostgreSQL/MySQL "Repeatable Read." Write skew is possible. PostgreSQL SERIALIZABLE has been true SSI since v9.1; most others haven't caught up.
- **Write skew is the most underrated anomaly.** Two transactions read overlapping state, both decide to write based on what they read, the combined writes violate an invariant. On-call scheduling, room booking, username claiming are all examples. Only true serialisability prevents it.
- **Three roads to serialisability.** Actual serial execution (VoltDB, Redis Lua, Datomic — works if dataset fits in memory and transactions are short); 2PL (the traditional path, slow under contention); SSI (Serializable Snapshot Isolation — optimistic, the modern default for PostgreSQL and CockroachDB).
- **Business transactions span system transactions, requiring offline concurrency.** Multi-page edit workflows can't hold a DB transaction open; the application manages concurrency across the gaps. Optimistic Offline Lock (version field) is the default; add Pessimistic only where conflict cost justifies it.

## ACID Properties

ACID is often cited but poorly defined. Kleppmann's precise reading (→ [[sources/designing-data-intensive-applications]] ch. 7):

- **Atomicity**: all writes in a transaction either commit together or are rolled back together. Implemented via a Write-Ahead Log (WAL). This is *not* about concurrent atomicity (that's isolation).
- **Consistency**: the database is in a valid application-defined state before and after the transaction. This is an application responsibility — the DB enforces it only if you define constraints. "Garbage in, garbage out." Note: Joe Hellerstein has observed that the "C" in ACID "was tossed in to make the acronym work" — it has nothing to do with the consistency models used in distributed systems (linearizability, causal consistency, etc.). (→ [[sources/understanding-distributed-systems]] ch. 12)
- **Isolation**: concurrently executing transactions don't interfere with each other. The strongest form is serializability — transactions appear to execute one at a time.
- **Durability**: committed data survives crashes. Implemented via WAL flushed to disk and replication to other nodes.

## Isolation Levels and Concurrency Anomalies

Isolation levels are defined by which **anomalies** they prevent. Weaker levels permit some anomalies in exchange for higher performance.

### Dirty Reads
Reading data written by a transaction that has not yet committed. Prevented by **Read Committed** and above.

*Example*: User sees a balance that will be rolled back.

### Dirty Writes
Overwriting data written by a transaction that has not yet committed. Prevented by **all practical isolation levels** — enforced by row-level locking on writes.

### Read Skew (Non-Repeatable Read)
The same query within a transaction returns different results at different times because another transaction committed a write in between.

*Example*: Transferring $100 from account A to B. Query A before the transfer ($500) and B after ($500). Total appears to be $1000 instead of $1000. Consistent point-in-time read is needed.

Prevented by **Snapshot Isolation** (Repeatable Read and above).

### Lost Updates

Two transactions both read a value, compute a new value based on it, and write back — the second write clobbers the first.

*Examples*: two requests incrementing a counter; two users editing the same wiki page; two threads appending to the same list.

Prevention strategies (→ [[sources/designing-data-intensive-applications]] ch. 7):
- **Atomic operations**: `UPDATE counter SET value = value + 1` — the DB serialises the read-modify-write internally. Works for simple transformations.
- **Explicit locking**: `SELECT ... FOR UPDATE` — no other transaction can read or modify the locked rows until the lock is released.
- **Automatic lost update detection**: the database detects a lost update pattern and aborts one transaction. PostgreSQL, Oracle, and SQL Server do this; **MySQL/InnoDB does not** — a significant limitation.
- **Compare-and-set**: only update if the value hasn't changed since last read — `UPDATE ... WHERE value = $old_value`. Fails silently if reading from a snapshot rather than the latest value.

### Write Skew
Two transactions both read an overlapping set of objects, both decide to write based on what they read, and the resulting state violates an application invariant — even though no individual write conflicts.

*Classic example*: On-call scheduling. Two doctors both see "two doctors on call." Both decide to go off-call. After both commit, nobody is on call — violating the invariant "at least one doctor must be on call." Each write (updating own record) is based on a now-stale read of the shared state.

Other examples: room booking, username claiming, multiplayer game moves, meeting scheduling.

**Not prevented by Snapshot Isolation** — requires **Serializable** isolation.

**Write skew pattern** (recognition heuristic): if your code follows the shape `SELECT check → application decision → write that changes the precondition`, you have a potential write skew. The written object doesn't need to overlap with the read objects — what matters is the write invalidates the premise of the decision. Materializing conflicts (creating explicit lock rows for resources that don't exist yet but will be checked) can prevent some phantoms, but serializable isolation is the general solution.

### Phantom Reads
A transaction reads a set of rows matching a condition. Another transaction inserts new rows matching that condition. The first transaction re-reads and sees new rows that weren't there before.

*Example*: Check for double-booking — query returns empty (room is free), proceed to insert booking. Concurrent transaction did the same thing. Both insert. Now double-booked.

Prevented by predicate locks or next-key locks in **Serializable** isolation.

### Isolation Level Summary

| Level | Dirty Read | Read Skew | Write Skew | Phantom |
|-------|-----------|-----------|------------|---------|
| Read Uncommitted | ✓ possible | ✓ | ✓ | ✓ |
| Read Committed | ✗ prevented | ✓ | ✓ | ✓ |
| Snapshot Isolation | ✗ | ✗ prevented | ✓ | ✓ |
| Serializable | ✗ | ✗ | ✗ prevented | ✗ prevented |

> **Important**: Most databases marketed as "Repeatable Read" or even "Serializable" actually implement Snapshot Isolation (MVCC). Write skew is possible. The SQL standard's definition of isolation levels is ambiguous enough that vendors interpret it differently: Oracle calls Snapshot Isolation "Serializable"; PostgreSQL and MySQL call it "Repeatable Read"; IBM DB2 uses "Repeatable Read" to mean what others call "Serializable." The SQL standard does not even define the write skew anomaly. PostgreSQL's SERIALIZABLE has been true SSI since v9.1; Oracle's has not.

## Snapshot Isolation (MVCC)

Snapshot Isolation is the most widely deployed strong isolation mechanism. Every transaction reads from a **consistent snapshot** of the database — it sees all data committed before the transaction started, and nothing committed after.

Implementation via **Multi-Version Concurrency Control (MVCC)**:
- Every row has a `created_by` and `deleted_by` transaction ID.
- Writes create new row versions; never overwrite in-place.
- Readers find the row version visible at their snapshot timestamp.
- Writers never block readers; readers never block writers.
- Read-only transactions never need to abort.

Garbage collection periodically removes old row versions no longer needed by any active transaction.

**Write conflicts**: two transactions writing the same row — the first-committer-wins rule applies. The second transaction's write is detected and the transaction is aborted.

## Serializability and Strict Serializability

**Serializability**: concurrent transactions behave as if they ran in *some* serial order. The order can differ from real-time — a transaction that commits later may still be serialised before one that committed earlier.

**Strict serializability**: serializability + the real-time guarantee of linearizability. When a transaction completes, its side effects become immediately visible to all future transactions. This is the strongest isolation level. Vitillo (→ [[sources/understanding-distributed-systems]] ch. 12) calls this the level to default to when in doubt, even though it is slow — it combines serializability (prevents all anomalies) with linearizability (real-time ordering).

PostgreSQL's default isolation is **Read Committed** — weaker than serializable. Explicit `SERIALIZABLE` is required for full protection.

Three approaches to achieving serializability:

### Actual Serial Execution

Execute all transactions sequentially on a single thread. Surprisingly effective for modern in-memory databases. The key realization (~2007) was that RAM is now cheap enough to hold entire working datasets, and OLTP transactions are typically short and touch only a few rows:
- No locking overhead, no deadlocks.
- Works when the dataset fits in memory and transactions are short.
- **Stored procedures**: eliminate network round-trips within a transaction — the entire transaction logic runs in the DB. VoltDB uses Java/Groovy stored procedures; Datomic uses Java/Clojure; Redis uses Lua. This avoids the "interactive transaction" problem (multiple round trips that each lock resources).
- **Partitioning**: scale-out by partitioning data; single-threaded per partition (cross-partition transactions require coordination and coordination overhead). VoltDB can do ~1000 cross-partition writes/sec; single-partition transactions scale linearly with CPU cores.

Used in: VoltDB, H-Store, Redis (Lua scripts + MULTI/EXEC), Datomic.

### Two-Phase Locking (2PL)

The traditional approach in relational databases:
- **Shared lock** for reads; **exclusive lock** for writes.
- Transactions acquire locks before accessing objects and hold them until commit.
- **Two phases**: acquiring phase (no locks released), releasing phase (no new locks acquired).
- **Predicate locks**: lock all objects matching a search condition (prevents phantoms).
- **Index-range locks**: practical approximation of predicate locks — lock on an index entry covering a range.

**Deadlocks**: when transactions wait for each other's locks. Detected via a wait-for graph; one transaction is aborted to break the cycle.

**Performance**: significant overhead. Long-held locks reduce concurrency. Predicate locks are expensive. 2PL can be 10× slower than snapshot isolation for read-heavy workloads.

### Serializable Snapshot Isolation (SSI)

SSI (Cahill et al., 2008) achieves true serializability with **optimistic concurrency**:

1. Proceed without blocking — all reads and writes happen normally on an MVCC snapshot.
2. Track which rows each transaction has read.
3. At commit time, detect whether any transaction that committed since this transaction's snapshot has written to rows this transaction read (stale MVCC read). If so, abort and retry.

Two detection mechanisms (→ [[sources/designing-data-intensive-applications]] ch. 7):
- **Stale MVCC reads**: if transaction T1 read a value that was written by an uncommitted transaction T2 at the time of T1's read, and T2 later commits — T1's read was based on potentially stale data → abort T1.
- **Writes to recently read rows**: if transaction T2 commits a write to rows that T1 has already read (a "tripwire" notification) → T1's decision may be based on stale data → abort T1 at commit time.

FoundationDB distributes conflict detection across nodes, making SSI viable in a distributed database.

**Properties**:
- Writers don't block readers; readers don't block writers (same as Snapshot Isolation).
- Lower abort rate than pure OCC (Optimistic Concurrency Control) under high contention.
- Much less blocking than 2PL.
- Overhead: tracking read/write dependencies; false positives cause unnecessary aborts.
- Read-only transactions can run on a consistent snapshot with no risk of abort.

Used in: PostgreSQL SERIALIZABLE (since v9.1), FoundationDB, CockroachDB.

## Offline Concurrency (Business Transactions)

A **business transaction** is a multi-step interaction that users perceive as a unit (e.g., a multi-page insurance policy edit). A **system transaction** maps to a single database transaction. The mismatch: business transactions span multiple HTTP requests, but long-running system transactions hurt scalability. The result is **offline concurrency** — the application must manage concurrency across the gaps between system transactions.

(→ [[sources/patterns-of-enterprise-application-architecture]] ch. 5)

**Session state** is data held during a business transaction that isn't yet committed to the database. It has ACID-like properties within its scope: consistency may temporarily be invalid (mid-edit); isolation must be maintained from other sessions; atomicity is achieved by committing all changes in a single system transaction at the end.

### Offline Concurrency Patterns

**Optimistic Offline Lock** — apply optimistic concurrency control across business transactions. Each record carries a version number. At commit time, include the version in every UPDATE/DELETE WHERE clause: `UPDATE ... WHERE id = ? AND version = ?` — zero rows updated means conflict. Increment the version on success. Validation + update must occur in one system transaction. The default strategy: use for all business transactions; add Pessimistic only where needed.

**Pessimistic Offline Lock** — acquire an application-managed lock on data before editing it (distinct from DB-level locks — these span multiple system transactions). Lock types: exclusive read (no one else reads or writes), exclusive write (others may read, not write), read/write (shared read, exclusive write). Acquire before using, release at session end; handle timeouts and crash cleanup. Conflict discovered early (before the user invests effort). Use only where conflict cost is unacceptable regardless of probability; complement Optimistic for the rest.

**Coarse-Grained Lock** — lock the aggregate root to lock all its parts. Two approaches: (1) shared `Version` object/table that all aggregate members reference — any member update increments the shared version; (2) group lock on the root. Satisfies business requirements about aggregate integrity (editing a lease should lock all its assets); also reduces lock management overhead. Default: use Optimistic Offline Lock as the shared version.

**Implicit Lock** — the framework acquires and releases locks automatically via decorator pattern on mapper classes. `LockingMapper` wraps `Mapper`, acquires a lock before `find()`. **Use everywhere** — a single forgotten lock is too high a risk to rely on developer discipline.

**Selection**: prefer Optimistic Offline Lock for all business transactions. Add Pessimistic only where conflict consequences are severe (lost user effort, critical or low-conflict-tolerance data). Add Coarse-Grained Lock to lock aggregates as a unit. Always wrap in Implicit Lock via the framework.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Most rigorous treatment — defines anomalies precisely, exposes the gap between marketed and actual isolation levels, introduces SSI as the modern solution (ch. 7) |
| [[sources/understanding-distributed-systems]] | Covers isolation levels as part of the distributed transactions chapter; introduces 2PL, OCC, MVCC at a high level; treats Spanner's approach (2PC + Paxos) as the gold standard for distributed ACID |
| [[sources/patterns-of-enterprise-application-architecture]] | Distinguishes system transactions from business transactions; introduces offline concurrency as the core problem for multi-page enterprise interactions; provides four offline concurrency patterns (Optimistic Offline Lock, Pessimistic Offline Lock, Coarse-Grained Lock, Implicit Lock) (ch. 5) |

> **Contradiction:** [[sources/understanding-distributed-systems]] recommends managed distributed transactions (Spanner, CockroachDB) as the right solution for cross-service consistency. [[sources/designing-data-intensive-applications]] ch. 12 argues that coordination-avoiding approaches (end-to-end operation IDs + idempotency) can achieve integrity without distributed transactions at lower cost. Both are valid at different scales.

## Related Concepts

- [[databases/storage-engines]] — WAL and MVCC versions are storage engine features
- [[distributed/distributed-transactions]] — 2PC and saga patterns for cross-service atomicity
- [[distributed/consistency-models]] — isolation levels are the transaction-scoped view of consistency
- [[distributed/idempotency]] — key to avoiding distributed transactions in many cases
- [[databases/object-relational-mapping]] — Unit of Work and Offline Concurrency patterns are behavioural ORM patterns; Data Mapper manages entity persistence

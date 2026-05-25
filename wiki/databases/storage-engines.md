---
title: "Storage Engines"
type: database
tags: [databases, storage, internals, performance, oltp, olap]
sources: [designing-data-intensive-applications]
created: 2026-05-13
updated: 2026-05-14
---

# Storage Engines

A storage engine determines how a database stores data on disk and how it retrieves it. The design choices are driven by fundamental physical constraints: sequential disk I/O is orders of magnitude faster than random I/O; memory is orders of magnitude faster than disk; SSDs close the gap for reads but not for writes. Understanding these constraints explains why different engines make different trade-offs.

## Hash Indexes

The simplest possible index: an in-memory hash map from key to byte offset in an append-only log file.

**Writes**: append the new key-value pair to the end of the file; update the in-memory map.
**Reads**: look up the byte offset in the hash map, then seek to that position in the file.

**Compaction and merging**: the log grows unboundedly unless compacted. Compaction discards duplicate keys, keeping only the most recent value. Multiple segments can be merged by iterating through them in sorted order.

**Limitations**:
- All keys must fit in memory — no disk-based hash map is practical.
- Range queries are inefficient (no sorted order).

**Crash recovery**: snapshot hash maps periodically to disk; replay the log to reconstruct since last snapshot. **Tombstones**: deleted keys are appended as a special deletion record; compaction skips tombstoned keys.

Used in: Bitcask (Riak's default storage engine).

## SSTables and LSM-Trees

**SSTables** (Sorted String Tables) impose a key constraint on log segments: keys within each segment must be sorted. This one change unlocks significant improvements.

**LSM-Trees** (Log-Structured Merge-Trees) build on SSTables with a write-optimised architecture:

1. Incoming writes accumulate in an in-memory **memtable** (a balanced tree, e.g. red-black tree — maintains sorted order).
2. When the memtable reaches a size threshold, it is flushed to disk as an SSTable segment.
3. Background **compaction** periodically merges SSTable files, discarding overwritten or deleted values. Two strategies:
   - **Size-tiered**: newer, smaller SSTables merged into older, larger ones (Cassandra default, HBase).
   - **Leveled**: segments organised by level; each level is 10× larger than the previous (LevelDB, RocksDB, Cassandra option). Better for read performance and space amplification.

**Reads**: check memtable first, then SSTables from newest to oldest. **Bloom filters** (probabilistic data structure) short-circuit lookups for non-existent keys — avoids reading any SSTable on a miss.

**Trade-offs**:
- Write throughput is high because all writes are sequential (memtable flush + sequential compaction I/O).
- Read amplification: may need to check multiple SSTables for a single key.
- Compaction bandwidth can compete with write throughput — important at high write rates.
- Write amplification: a single logical write may result in multiple physical writes (original + compaction rewrites).

**Used in**: LevelDB, RocksDB, Cassandra, HBase, Lucene (for term dictionaries).

## B-Trees

B-Trees are the dominant structure in relational databases. They store data in **fixed-size pages** (typically 4KB), organised as a balanced tree:

- **Leaf pages** hold key-value pairs directly (or pointers to values).
- **Interior pages** hold keys and child page references.
- The **branching factor** (typically several hundred) makes the tree shallow — 4 levels handles up to 256TB of data.

**Reads**: traverse from root to leaf — O(log n) page reads.
**Writes**: find the leaf page, update in-place. If the page is full, split it into two pages and update the parent.

**Crash safety**: a **Write-Ahead Log (WAL)** records every modification before it is applied to the tree pages. On crash recovery, the WAL replays uncommitted operations.

**Concurrency**: latches (lightweight locks) protect pages during updates. Some implementations use **copy-on-write** instead of in-place update — produces a new version of the page tree, leaving the old version intact for readers.

**Trade-offs**:
- Read latency is low: a single tree traversal locates any key.
- Write amplification exists but is bounded by tree height.
- Predictable latency: no compaction pauses (unlike LSM-Trees).
- More fragmentation and wasted space than LSM-Trees.

**Used in**: PostgreSQL, MySQL (InnoDB), Oracle, SQL Server — essentially all relational databases.

## In-Memory Databases

Disk's awkwardness is not just speed — it's the overhead of encoding in-memory data structures into a disk-compatible form. As RAM becomes cheaper and datasets remain small enough to fit in memory, in-memory databases become viable.

**Durability strategies** for in-memory databases:
- Battery-powered RAM (hardware approach)
- Write an append-only log to disk on every write (disk is used only for durability, reads are always from RAM)
- Periodic snapshots to disk + log replay
- Replication to other machines

Despite writing to disk, these are still "in-memory" databases — the disk is purely for durability, not performance.

**Performance advantage**: counterintuitively, the gain is *not* from avoiding disk reads (the OS page cache already serves hot data from RAM for disk-based engines). The advantage is avoiding the overhead of encoding in-memory data structures in a form that can be written to disk.

**Products**:
- **Memcached**: cache only — data lost on restart (intentional, for cache use case)
- **Redis, Couchbase**: weak durability via asynchronous disk writes
- **VoltDB, MemSQL, Oracle TimesTen**: in-memory relational databases with full ACID; vendors claim large performance improvements from removing on-disk data structure management overhead
- **RAMCloud**: open source, in-memory KV store with durability (log-structured both in RAM and on disk)

**Additional capability**: in-memory databases can support data models impossible with disk-based engines. Redis offers priority queues, sets, sorted sets — simple to implement because all data is in RAM and there are no disk layout constraints.

**Anti-caching**: extends in-memory databases beyond available memory by evicting LRU records to disk and reloading on access. Works at record granularity (unlike OS virtual memory which evicts whole pages). Requires indexes to still fit entirely in memory.

## LSM-Tree vs B-Tree Comparison

| Property | LSM-Tree | B-Tree |
|----------|----------|--------|
| Write throughput | Higher (sequential I/O) | Lower (random I/O) |
| Read latency | Higher (multi-SSTable check) | Lower (single tree traversal) |
| Space amplification | Lower (compaction removes duplication) | Higher (fragmentation) |
| Compression ratio | Better (sequential layout compresses well) | Worse |
| Write amplification | Can be high during compaction | Bounded but present |
| Latency predictability | Compaction pauses can cause spikes | Predictable |
| Key lookup for range queries | Both support, B-Tree often faster | Both support |

**Rule of thumb**: LSM-Trees are better for write-heavy workloads; B-Trees are better for read-heavy workloads with mixed operations. High write amplification in LSM-Trees can exceed B-Tree costs under some compaction strategies — benchmarking under realistic workloads is essential.

## OLTP vs OLAP

Storage engine design diverges sharply based on the access pattern:

| Property | OLTP | OLAP |
|----------|------|------|
| Read pattern | Small number of rows, by key | Aggregate over many rows |
| Write pattern | Low-latency individual writes | Bulk load (ETL) |
| Dataset size | GB to TB | TB to PB |
| Primary users | End users via application | Business analysts |
| Query type | Short transactions, point lookups | Long-running aggregation queries |

OLAP workloads are typically served from a **data warehouse**: a separate read-optimised copy of operational data, loaded via ETL. Star schema (fact table + dimension tables) or snowflake schema are common data warehouse layouts.

## Column-Oriented Storage

Row-oriented storage stores all values for a row together — good for OLTP (retrieve one row at a time). Column-oriented storage stores all values for a column together — good for OLAP (aggregate over a few columns across many rows).

**Benefits**:
- **Read fewer columns**: analytic queries reference a small fraction of columns. Column storage reads only the needed columns, drastically reducing I/O.
- **High compression**: a column contains values of the same type from the same domain. Run-length encoding and bitmap encoding achieve very high compression ratios.
- **Vectorised processing**: compressed column data can be processed with CPU SIMD instructions — tight loop over contiguous memory.

**Sort order**: rows in a column store can be sorted by a chosen key column. The first sort column compresses best (long runs of repeated values). Multiple sort orders can be maintained as separate **column families** or **projections** — different queries use the most beneficial sort order.

**Materialized aggregates**: precompute common aggregations (COUNT, SUM, AVG) and cache as a **data cube** (OLAP cube). Extremely fast for queries that fit the cube dimensions; inflexible for other queries.

**Used in**: Redshift, BigQuery, Snowflake, Vertica, Parquet (file format), ORC.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Definitive mechanistic treatment — explains the physical constraints driving each design choice from first principles (ch. 3) |
| [[sources/understanding-distributed-systems]] | Treats storage as background context; focuses on replication and consistency properties rather than engine internals |

## Related Concepts

- [[databases/transactions]] — isolation and crash recovery are implemented by the storage engine
- [[databases/data-models]] — data model determines what the storage engine must store
- [[databases/encoding-and-evolution]] — on-disk encoding format choices
- [[distributed/replication]] — replication operates on top of the storage engine's write log
- [[streams/event-sourcing-cqrs]] — the append-only log as a storage primitive connects storage engines to event sourcing

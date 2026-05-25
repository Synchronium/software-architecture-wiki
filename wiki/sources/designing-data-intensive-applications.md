---
title: "Designing Data-Intensive Applications"
type: source
tags: [databases, distributed-systems, storage, streaming]
sources: [designing-data-intensive-applications]
created: 2026-05-13
updated: 2026-05-14
---

# Designing Data-Intensive Applications

**Author:** [[authors/martin-kleppmann]]
**Published:** 2017 (O'Reilly)
**Slug:** `designing-data-intensive-applications`

## Overview

DDIA is the definitive systems-level treatment of modern data infrastructure. Where most architecture books discuss *what* to use (which database, which broker, which pattern), Kleppmann explains *why* each design choice exists — from the physics of disk access that explain LSM-Trees vs B-Trees, to the mathematics of consensus that explain why 2PC is blocking. The book's thesis is that data-intensive applications are built from composable primitives: storage engines, replication protocols, transaction mechanisms, and stream processors. Understanding these primitives — not just their interfaces but their internals — is what enables engineers to make well-reasoned architectural decisions under real constraints.

The book is structured in three parts. Part I (Chapters 1–4) covers the foundations: reliability/scalability/maintainability, data models, storage engines, and encoding. Part II (Chapters 5–9) covers distributed data: replication, partitioning, transactions, and the distributed systems problems (clocks, Byzantine faults, consensus). Part III (Chapters 10–12) covers derived data: batch processing, stream processing, and the future of data systems (unbundling databases, correctness, ethics).

Kleppmann is unusual in the genre for intellectual honesty about trade-offs. He critiques CAP theorem as misleading, calls out databases that lie about their isolation guarantees, and ends the book with a sustained ethical argument about data collection and surveillance. The result is the book most recommended across the entire software architecture reading list — Vitillo cites it as a companion for [[sources/understanding-distributed-systems]]; FOSA treats it as background knowledge.

## Key Claims

- The log (append-only, ordered, immutable) is the unifying data structure across storage engines, replication, messaging, and batch/stream processing. "The truth is the log. The database is a cache of the log."
- LSM-Trees optimise for write throughput (sequential I/O); B-Trees optimise for read latency (single tree traversal). Neither is universally better — workload determines choice.
- Most databases marketed as "Serializable" actually implement Snapshot Isolation (MVCC), which permits write skew anomalies. True serializability requires SSI or actual serial execution.
- CAP theorem should be "best avoided": it covers only linearizability + network partitions, ignores the latency/consistency tradeoff in normal operation, and conflates many distinct consistency models under a single "C". (→ ch. 9)
- Causal consistency is the strongest consistency model compatible with availability + partition tolerance — stronger than eventual, weaker than linearizability. (→ ch. 9)
- 2PC is a blocking atomic commit protocol: coordinator failure leaves participants holding locks indefinitely. Fault-tolerant consensus (Raft, Paxos) does not have this property. (→ ch. 9)
- Linearizable CAS ≡ total order broadcast ≡ fault-tolerant consensus ≡ distributed locks ≡ uniqueness constraints: all are equivalent and all require consensus. (→ ch. 9)
- Batch jobs (MapReduce, Spark) are distinguished from online services by immutable inputs and deterministic, side-effect-free execution — which makes retry, replay, and human error recovery tractable. (→ ch. 10)
- The unified batch+stream model (Apache Flink, Apache Beam) supersedes the lambda architecture (duplicate logic in batch + stream layers). (→ ch. 12)
- Timeliness (up-to-date reads) and integrity (no data loss, no contradictions) are distinct properties. Integrity is much more important. Coordination-avoiding systems can provide strong integrity with weak timeliness. (→ ch. 12)
- The end-to-end argument (Saltzer, Reed & Clark 1984): database-level guarantees (transactions, exactly-once delivery) are insufficient for application correctness. End-to-end operation IDs are required.
- Data collection at scale is surveillance; engineers bear ethical responsibility for how their systems affect people.

## Chapter Notes

### Chapter 1 — Reliable, Scalable, and Maintainable Applications

Defines the three core concerns:
- **Reliability**: continuing to work correctly even when things go wrong. Fault ≠ failure: a fault is one component deviating from spec; a failure is when the system stops providing service. Hardware faults (random, independent — handled by redundancy). Software faults (systematic, correlated across nodes — much harder; no quick fix: careful assumptions, testing, process isolation, crash-and-restart). Human errors (dominant cause of outages — sandboxes, rollback tooling, monitoring, gradual rollout). Chaos testing (deliberately trigger faults to exercise fault-tolerance machinery — Netflix Chaos Monkey).
- **Scalability**: ability to cope with increased load. Load parameters describe the current load (requests/sec, DB read/write ratio, active users, cache hit rate). **Twitter fan-out example**: reading timelines (300k req/sec) vs posting tweets (4.6k req/sec average, 12k peak). Approach 1: global tweet collection + JOIN at read time. Approach 2 (adopted): precompute per-user timeline mailbox at write time (avg tweet → 75 followers = 345k writes/sec; celebrity with 30M followers → 30M writes per tweet). Twitter uses a hybrid: fan-out for most users, celebrity tweets fetched separately at read time. Performance: throughput (batch) vs **response time** (what the client sees: service time + network + queueing delays). **Latency** ≠ response time: latency = time a request is waiting to be handled. Use **percentiles** (p50, p95, p99, p999) not mean — the mean doesn't tell you how many users were affected. **Tail latency amplification**: if an end-user request requires multiple backend calls in parallel, it only takes one slow call to slow the entire request — the probability of hitting a slow call grows with the number of parallel calls. Averaging percentiles across time windows is mathematically meaningless; add the histograms (forward decay, t-digest, HdrHistogram). Scaling up (vertical) vs scaling out (horizontal, shared-nothing, elastic).
- **Maintainability**: operability (easy to run — "good operations can often work around limitations of bad software, but good software cannot run reliably with bad operations"), simplicity (easy to understand — avoid **accidental complexity**: complexity not inherent in the problem but arising from implementation, Moseley & Marks; abstraction reduces it), evolvability (easy to change — the data-system equivalent of Agile's ethos).

### Chapter 2 — Data Models and Query Languages

Data models are the most important part of developing software — they constrain not just storage but how we think about the problem. Applications layer data models: real-world objects → general-purpose model (relational/document/graph) → bytes on disk → hardware. Each layer hides the complexity of the one below.

**Historical progression**: hierarchical model → network model (CODASYL, 1970s: explicit access paths, application code must navigate) → relational model (Codd 1970: hid access path behind a declarative interface). Relational dominated by mid-1980s and has lasted 25–30 years. **NoSQL** was coined as a Twitter hashtag for a 2009 meetup; retroactively reinterpreted as "Not Only SQL." Drivers: scalability needs, open-source preference, specialised queries, schema flexibility. **Polyglot persistence**: relational + non-relational stores coexist in one system.

**Object-relational impedance mismatch**: OOP object graphs don't map cleanly to tables; ORMs reduce but don't eliminate the translation. Document models reduce impedance for tree-structured data (one-to-many fits naturally). **Normalization vs denormalization**: IDs don't change even when the human-readable name does; normalisation stores facts once; denormalization duplicates and risks update anomalies. Many-to-one and many-to-many relationships are relational's sweet spot; document databases struggle with them (either denormalize → duplication, or use application-level joins → slow).

**Graph models** suit highly connected data with complex many-to-many relationships. Examples: social graphs (people → friends), web graph (pages → links), road networks (junctions → roads). **Property graphs** (Neo4j): each vertex/edge has a unique ID, labels, and key-value properties; no schema restriction on which vertices can be connected. Can be represented as two relational tables (vertices, edges). **Cypher**: declarative pattern-matching query language for Neo4j — `(person) -[:BORN_IN]-> ()` pattern syntax; arrow notation. **Triple-stores/RDF** (Datomic, AllegroGraph): everything is (subject, predicate, object); SPARQL queries triple patterns. **Datalog**: older recursive rule language, foundation of Datomic's query language, handles recursive queries naturally. Graphs are especially good for evolvability — add new edge types without migration. See [[databases/data-models]].

### Chapter 3 — Storage and Retrieval

Starts from a two-function bash key-value store to build up to production storage engines from first principles. An index speeds up reads but slows down writes — every index must be updated on every write. Databases require you to choose indexes manually.

**Hash indexes** (Bitcask/Riak): in-memory hash map from key → byte offset in append-only log. Compaction discards superseded keys. Simple, fast for high-update-rate workloads, but limited: all keys must fit in RAM, no range queries. Crash recovery: snapshot hash maps periodically to disk. **Tombstones** mark deleted keys for compaction to skip.

**SSTables/LSM-Trees**: impose sorted order on segments, enabling sparse in-memory index and range queries. Writes go to in-memory **memtable** (red-black tree), flushed to disk as SSTable when full. **Bloom filters** (probabilistic) avoid reading SSTables for keys that don't exist. Compaction: **size-tiered** (Cassandra default, HBase — newer smaller SSTables merged into larger) vs **leveled** (LevelDB, RocksDB, Cassandra option — each level 10× larger, better read performance and space amplification).

**B-Trees**: fixed-size pages (typically 4KB), branching factor of ~several hundred → 4 levels handles 256TB. Write-ahead log (WAL) for crash recovery. **Copy-on-write** variant (LMDB): produce new version of page tree, leaving old intact for readers (also useful for snapshots). Latency is predictable; no compaction pauses.

**In-memory databases**: disk awkwardness is structural — not just speed but encoding overhead. As RAM becomes cheaper, many datasets fit in memory. **Memcached**: cache only, data lost on restart. **Durable in-memory**: battery-powered RAM, write log to disk, periodic snapshots, or replication. **VoltDB, MemSQL, Oracle TimesTen**: in-memory relational DBs. **RAMCloud**: log-structured in-memory KV store with durability. **Redis/Couchbase**: weak durability (async disk write). **Performance advantage**: not avoiding disk reads (OS page cache already does this for hot data) — rather, avoiding the overhead of encoding in-memory data structures for disk. Redis enables data models impossible with disk-based indexes (priority queues, sets). **Anti-caching**: evict LRU records to disk, reload on access — works at record granularity unlike OS virtual memory pages, but still requires indexes in RAM.

**OLAP/column-oriented storage**: OLAP scans many rows, few columns per query → column storage reads only needed columns, achieves very high compression (run-length encoding, bitmap encoding), enables vectorised CPU SIMD processing. Multiple sort orders (projections) can be maintained. Materialized views / data cubes precompute aggregates for fast query execution. See [[databases/storage-engines]].

### Chapter 4 — Encoding and Evolution

Data outlives code: server-side code can be replaced in minutes; database records from five years ago encoded with long-gone code still need to be readable. Rolling deployments mean old and new code run simultaneously — both forward compatibility (old code reads new data) and backward compatibility (new code reads old data) are required simultaneously.

**Language-specific serialisation** (Java Serializable, Ruby Marshal, Python pickle): tied to a single language, security vulnerabilities (arbitrary class instantiation on decode), versioning afterthoughts, poor performance. Never use for cross-system or long-lived data.

**JSON/XML/CSV**: human-readable, language-agnostic. Problems: number type ambiguity (JSON no integer/float distinction, no precision — numbers > 2⁵³ lose precision in JavaScript; Twitter IDs sent twice: as number + as string), no binary string support (base64 adds 33%), optional schemas (many JSON tools don't bother). CSV: no types, ambiguous escaping. Despite these issues, good enough for many internal APIs.

**Apache Thrift** (Facebook): field tags in binary. BinaryProtocol, CompactProtocol (variable-length integers), DenseProtocol. IDL with code generation. **Protocol Buffers** (Google): field tags, similar to Thrift CompactProtocol, more widely adopted, gRPC wire format. Evolution rule: never change a field tag; new fields must be optional; never reuse tag numbers of removed fields; avoid required fields (can never be safely removed). **Apache Avro**: no field tags in the encoded data — just values in writer's schema order. Schema resolution matches writer's schema against reader's schema at decode time. Most compact; schema registry stores versions (fingerprint as version ID). Field additions get defaults from reader schema; removals ignored. Avro is the natural choice for Kafka + Confluent Schema Registry.

**REST vs SOAP**: REST is a design philosophy (not a protocol) building on HTTP — simple formats, URLs as resource identifiers, HTTP features for caching/auth/content negotiation. Associated with microservices. SOAP is an XML-based protocol (XML-based request format, WSDL for description, WS-* standards for features) designed to be independent of HTTP — complex tooling required, poor interoperability across vendors, falling out of favour. **RPC fundamental flaw**: RPC tries to make a network call look like a local function call (location transparency) — but network calls are unpredictable (timeout?, partial failure?), require idempotency for safe retry, return values must be encodable/decodable, can't pass large objects by reference, must handle different language types. Modern RPC frameworks (gRPC, Thrift, Finagle) acknowledge these differences rather than hiding them. **Message-passing dataflow**: events in brokers (Kafka) may be consumed long after production — encoding must survive schema evolution over years, making Avro + schema registry the natural fit.

See [[databases/encoding-and-evolution]].

### Chapter 5 — Replication

Replication keeps copies of data on multiple nodes. Single-leader: all writes go to leader, replicated to followers synchronously or asynchronously. Async followers can lag → read-your-writes inconsistency, monotonic reads violations, consistent prefix read violations — all forms of replication lag. Multi-leader (active-active): multiple nodes accept writes; conflict resolution is unavoidable (LWW, version vectors, CRDTs). Leaderless (Dynamo-style, Cassandra, Riak): quorum writes (W) + quorum reads (R) with W+R>N; sloppy quorums for availability; read repair and anti-entropy for convergence. Adds significant DDIA detail to [[distributed/replication]].

### Chapter 6 — Partitioning

Partitioning (sharding) splits data across nodes. Key range partitioning: sorted, enables range queries, risk of hot spots. Hash partitioning: distributes uniformly, no range queries, consistent hashing with virtual nodes. Secondary indexes: local (scatter-gather reads) vs global/term-based (writes update multiple partitions, reads hit one). Rebalancing: fixed partition count (Elasticsearch), dynamic splitting (HBase, MongoDB), proportional to nodes (Cassandra). Request routing: gossip (Cassandra), ZooKeeper for partition assignment (HBase, Kafka), client-side cache. See [[distributed/partitioning]].

### Chapter 7 — Transactions

ACID: Atomicity (WAL-based all-or-nothing), Consistency (application invariant — not a DB property), Isolation (concurrent transactions don't interfere), Durability (WAL + replication). Isolation levels — dirty reads (read uncommitted data), read skew (non-repeatable reads), write skew (both transactions read overlapping set, both decide to write, invariant violated — classic: on-call doctors), phantoms (new rows inserted match predicate of earlier read). Snapshot Isolation (MVCC): reads from consistent snapshot, writers never block readers. SSI (Serializable Snapshot Isolation): detect conflicts at commit via tracking which reads were subsequently modified — achieves serializability without locking. Actual serial execution (VoltDB, H-Store): single thread, stored procedures, partitioned. 2PL (Two-Phase Locking): shared/exclusive, predicate locks for phantoms. See [[databases/transactions]].

### Chapter 8 — The Trouble with Distributed Systems

Distributed systems are fundamentally unreliable in ways that single-node systems are not. Network delays are unbounded (partially synchronous model). Clocks drift; NTP is imprecise; wall clocks can jump backward; monotonic clocks are node-local. Process pauses (GC, VM migration, disk thrashing) can stop a process for arbitrarily long. Byzantine faults (nodes that lie): relevant for aerospace and blockchains, generally impractical for datacenter systems. System models: synchronous (unrealistic), partially synchronous (realistic), asynchronous (too restrictive). Node failure models: crash-stop, crash-recovery (most realistic), Byzantine. Safety properties (nothing bad happens — can point to violation) vs liveness properties (something good eventually happens — require conditions).

### Chapter 9 — Consistency and Consensus

Linearizability: system appears to have one copy of data with atomic operations. A recency guarantee (not transaction isolation). Uses: lock/leader election, uniqueness constraints, cross-channel timing. CAP: Kleppmann dismisses as "best avoided" — historically influential but too narrow and misleading. Causal consistency: strongest model not impacted by partitions; does not trigger CAP. Lamport timestamps: (counter, nodeID), max counter propagated, provides total order consistent with causality — but cannot determine if ordering is final. Total order broadcast: reliable + totally ordered delivery ≡ consensus ≡ linearizable CAS. FLP result: no deterministic algorithm always reaches consensus in asynchronous model. Fault-tolerant consensus (Raft, Paxos, Zab): epoch numbers, two rounds of voting, overlapping quorums. ZooKeeper/etcd as consensus primitives. Full equivalence theorem: see [[distributed/consensus-algorithms]].

### Chapter 10 — Batch Processing

Unix philosophy: one thing well, compose via stdin/stdout, immutable inputs, transparent intermediate state. MapReduce: mapper emits (key, value) pairs, shuffle sorts and copies to reducers, reducer aggregates. Joins: sort-merge (reduce-side, handles large datasets), broadcast hash (small side in memory → load into every mapper), partitioned hash (both inputs same-partitioned → each mapper loads one partition). Hot key handling: skewed join via sampling, sharded join, two-stage grouping. Hadoop vs MPP: Hadoop is schema-on-read, arbitrary code, file-level fault tolerance; MPP is schema-on-write, SQL, query-level abort. Dataflow engines (Spark, Flink, Tez): whole workflow as one job, operators not map/reduce, pipelined execution, lineage-based fault tolerance (Spark) or checkpointing (Flink). Graph processing: Pregel/BSP model (Giraph, GraphX, Gelly). See [[streams/batch-processing]].

### Chapter 11 — Stream Processing

Events: immutable, small, self-contained, timestamped, grouped into topics. AMQP/JMS (RabbitMQ): message deleted after ack, redelivery can reorder. Log-based brokers (Kafka, Kinesis): append-only partitioned log, consumer tracks offset, messages retained, sequential per partition, fan-out trivial. Change Data Capture (CDC): observe DB changes as stream, replicate to search index/caches/warehouses, log-compacted topic enables DB bootstrap, tools: Debezium, Maxwell. Stream processing uses: CEP (queries stored, events flow past), analytics (windowed aggregations), materialized view maintenance, search on streams (Elasticsearch percolator). Windowing: tumbling, hopping, sliding, session. Event time vs processing time: use event timestamps; handle stragglers. Stream joins: stream-stream (window join), stream-table (enrichment via CDC), table-table (materialized view). Fault tolerance: microbatching (Spark Streaming), checkpointing (Flink), exactly-once via atomic commit or idempotency. See [[streams/stream-processing]] and [[streams/event-sourcing-cqrs]].

### Chapter 12 — The Future of Data Systems

No single tool satisfies all needs: compose specialised systems via derived data. Unbundling databases: federated reads (polystore), unified writes via event log (CDC → log). Lambda architecture (batch + stream in parallel): criticized for duplicate logic — unified batch+stream (Flink, Beam) is better. Write path (eager, precomputed) vs read path (lazy, on demand); derived dataset is where they meet. Timeliness (up-to-date reads) ≠ integrity (no data loss, no contradictions). Integrity is more important; violations of timeliness are "eventual consistency," violations of integrity are "perpetual inconsistency." End-to-end argument: TCP duplicate suppression + DB transactions are insufficient — operation IDs must flow end-to-end. Enforcing uniqueness via log-based partitioning: partition by hash of constrained value, stream processor enforces sequentially. Coordination-avoiding data systems: strong integrity without linearizability or atomic commit, using deterministic derivation + end-to-end IDs + idempotency. Trust but verify: culture of verification; HDFS/S3 continually read-check files; event sourcing enables auditability via deterministic replay. Ethics: predictive analytics → algorithmic prison, feedback loops, bias amplification; data collection = surveillance; data as toxic asset; engineers have responsibility.

> **Contradiction:** Kleppmann dismisses CAP theorem as "best avoided" — a stronger position than [[sources/understanding-distributed-systems]], which also critiques it but treats it as a useful first approximation. Kleppmann's PACELC framing (latency/consistency tradeoff in normal operation) is the more complete picture.

> **Open question:** Kleppmann's coordination-avoiding correctness model (integrity without distributed transactions via end-to-end IDs) is compelling but still nascent. What production systems have successfully adopted it at scale?

## Notable Quotes

> "The truth is the log. The database is a cache of the log." (ch. 11)

> "An index on a field speeds up reads but slows down writes. This is an important trade-off in storage systems: you generally have to choose between fast reads and fast writes." (ch. 3)

> "The CAP theorem is best avoided... it is not useful as a tool for reasoning about systems." (ch. 9)

> "Serializable isolation and atomic commit don't solve the problem of end-to-end correctness, because they don't know about the end-user client." (ch. 12)

> "Violations of timeliness are 'eventual consistency,' whereas violations of integrity are 'perpetual inconsistency.'" (ch. 12)

> "As a thought experiment, try replacing the word 'data' with 'surveillance,' and observe if common phrases still sound so good." (ch. 12)

> "We should try to make them proud." (closing line — about how our grandchildren will judge how we handled data collection)

## Related Pages

- [[databases/storage-engines]]
- [[databases/data-models]]
- [[databases/encoding-and-evolution]]
- [[databases/transactions]]
- [[streams/batch-processing]]
- [[streams/stream-processing]]
- [[streams/event-sourcing-cqrs]]
- [[distributed/partitioning]]
- [[distributed/consensus-algorithms]]
- [[distributed/replication]]
- [[distributed/consistency-models]]
- [[distributed/cap-theorem]]
- [[distributed/distributed-transactions]]
- [[comparisons/architecture-styles-comparison]]

---
title: "Foundations of Scalable Systems"
type: source
tags: [scalability, distributed-systems, performance, databases]
sources: [foundations-of-scalable-systems]
created: 2026-05-19
updated: 2026-05-21
---

# Foundations of Scalable Systems

**Authors:** [[authors/ian-gorton]]
**Published:** 2022
**Slug:** `foundations-of-scalable-systems`

## Overview

Ian Gorton's practical guide to building large-scale distributed systems targets engineers who understand the basics of software development but need to reason rigorously about capacity, throughput, and the trade-offs that emerge when systems grow. Where Kleppmann's *Designing Data-Intensive Applications* focuses on data systems, Gorton's scope is broader — services, caching, messaging, microservices, and databases are all treated as first-class scalability concerns.

The book's thesis is that scalability must be designed in from the start: systems not built on scalable foundations cannot cheaply be made scalable later, just as a suburban home cannot be upgraded to a skyscraper. Gorton's two fundamental scaling strategies — replication and optimisation — recur throughout, and he grounds every architectural recommendation in concrete measurement and experimentation.

The book is a useful complement to [[sources/understanding-distributed-systems]] (more theoretical) and [[sources/designing-data-intensive-applications]] (more data-focused), offering a practitioner-friendly tour of scalability techniques with concrete numbers.

## Key Claims

- Scalability must be treated as a first-class architectural concern from the start; retrofitting it is expensive (→ ch. 1)
- Two universal scaling strategies: **replication** (add capacity) and **optimisation** (use existing capacity more efficiently) (→ ch. 1)
- **Hyperscale** systems exhibit exponential growth in computational capability while costs grow only linearly (→ ch. 1)
- Scalability and other quality attributes (performance, availability, security, manageability) are inextricably linked and require deliberate trade-offs (→ ch. 1)
- Effective horizontal scaling requires **stateless services** — any session state must be stored externally (→ ch. 2)
- Distributed caching is the highest-leverage scalability technique for read-heavy workloads — if 80%+ of reads hit the cache, the database sees a fraction of traffic (→ ch. 2)
- Amdahl's Law: with 50% serial code, adding beyond 8 CPUs yields no further benefit; parallel code is essential for scalability (→ ch. 2)
- Async queueing decouples write latency from response latency wherever results are not immediately needed (→ ch. 2)
- Full messaging data safety requires all three: publisher confirms + persistent queues + manual consumer ACKs — any one omitted leaves a durability gap (→ ch. 7)
- Competing consumers is the primary horizontal scale-out mechanism for queue-based systems (→ ch. 7)
- Serverless default autoscaling configurations are rarely optimal; empirical parameter studies consistently find cheaper or faster alternatives (→ ch. 8)
- Cold start latency varies dramatically by runtime: Go <1s vs JVM 1–3s — a practical concern for low-traffic serverless deployments (→ ch. 8)
- Cascading failures in microservices are triggered by slow responses, not hard errors — back pressure fills thread pools silently before anything crashes (→ ch. 9)
- Immediate retries on failure amplify load on an overloaded downstream and make recovery worse; use exponential backoff or circuit breakers (→ ch. 9)
- NoSQL data modeling inverts the relational paradigm: model around access patterns (solution domain), not around the problem domain — denormalization replaces joins (→ ch. 10)
- Read replicas (primary writes + async secondaries) are the first scaling step for read-heavy workloads; stale reads are the accepted trade-off (→ ch. 10)
- Inconsistency window in eventually consistent systems has no known upper bound — it depends on load, replica count, and network latency (→ ch. 11)
- Last writer wins silently discards concurrent writes; safe only when objects are immutable + uniquely keyed (→ ch. 11)
- Strong consistency = serializability + linearizability; requires consensus algorithms (Raft/Multi-Paxos) for fault tolerance (→ ch. 12)
- 2PC coordinator failure blocks all participants and holds their locks; in heavily loaded systems this triggers cascading failures (→ ch. 12)
- Cloud Spanner's TrueTime (GPS + atomic clocks, ~7ms skew) enables global linearizability with commit wait to guarantee real-time ordering (→ ch. 12)
- Redis Cluster uses 16,384 hash slots with gossip protocol and MOVED redirections; the 1000-node maximum and custom election (accepting data loss) are intentional design trade-offs for performance over durability (→ ch. 13)
- MongoDB became a fully ACID-capable database in v4.0 via multi-document transactions using 2PC + snapshot isolation — a significant evolution from its eventual-consistency origins (→ ch. 13)
- DynamoDB's hotkey problem is a hard physical limit: max 3,000 RCU/1,000 WCU per partition; global tables use LWW for conflict resolution and ACID transactions are scoped to a single region (→ ch. 13)
- Kafka's "dumb broker/smart clients" design concentrates ordering and offset management in the client, enabling replay and independent consumer progress at the cost of increased consumer complexity (→ ch. 14)
- Producer durability in Kafka requires three settings working together: `acks=all`, `enable.idempotence=true`, and `min.insync.replicas ≥ 2` — any one omitted leaves a durability gap (→ ch. 14)
- Semantic partitioning (routing by message key) is the primary mechanism for achieving per-key ordering in Kafka; partition count can be increased but never decreased without disrupting key-to-partition assignments (→ ch. 14)
- Lambda architecture (batch + speed + serving layers) is now largely superseded by the simpler Kappa architecture — a single immutable log processed as a continuous stream (→ ch. 15)
- Flink's stream barrier mechanism ensures globally consistent checkpoints across a distributed DAG without stopping the stream; recovery restores state and replays only from the last barrier offset (→ ch. 15)
- Observability, automation/DevOps, container-based deployment, and data lake infrastructure are preconditions for production-grade scalable systems — not optional additions (→ ch. 16)

## Chapter Notes

### Chapter 6 — Distributed Caching

**Application caching (cache-aside):** Service checks cache on request; on cache hit, returns cached value; on miss, calls database/downstream service, writes result to cache with TTL, returns result. Key construction: typically a namespaced identifier (e.g., `"liftwaittimes:" + resort`). After TTL, eviction occurs; next request is a miss and repopulates the cache.

**Caching pattern taxonomy:** Cache-aside vs read-through, write-through, write-behind. Cache-aside is dominant in massively scalable systems due to: (1) resilience to cache failure (miss → graceful fallback to DB), (2) simple horizontal scalability (Redis/memcached are hash tables) (→ [[distributed/caching]]).

**Web caching layers:** browser cache (private) → org/ISP proxy cache (shared) → CDN edge cache (geographically distributed). HTTP directives: `Cache-Control` (no-store, no-cache, private, public, max-age), `Expires`, `Last-Modified`, `ETag`/`If-None-Match` revalidation (304 Not Modified). CDNs: Akamai has 2,000+ locations, 30% of global internet traffic.

**Key insight:** Effective caching maximises hit rate; items with high read:write ratio are ideal cache candidates. When update frequency is high, cache invalidation cost can negate caching benefit — measure hit/miss rates in production.

### Chapter 5 — Application Services

**API design fundamentals:** HTTP CRUD pattern (POST/GET/PUT/DELETE) on resources identified by URIs. OpenAPI/Swagger for API specification. Chatty API antipattern: fine-grained getters/setters as HTTP APIs create multiple round trips per logical operation. HTTP compression (gzip via `Accept-Encoding`/`Content-Encoding`) reduces bandwidth and latency by 50%+.

**State management:** HTTP is nominally stateless; services that maintain per-session conversational state are **stateful**. Stateful services create: memory pressure (per-session state scales with concurrent users), session timeout management complexity, sticky session requirement (load imbalance, failure complexity). **Stateless services store all session state externally** (Redis/memcached) — each request is self-contained; any replica can handle any request.

**Application server anatomy (Tomcat):** Listener threads → socket backlog (OS default 100) → HTTP connector → thread pool (default min 25, max 200, idle kill at 60s) → database connection pool (smaller than thread pool; threads block when connections exhausted). High utilization → queue growth → context switching degradation → resource exhaustion → crash. Systems degrade before 100% utilization; set utilization targets (CPU, memory, queue depth). Monitor via JMX.

**Horizontal scaling:** Stateless replicas + load balancer = capacity proportional to replica count. Single point of failure eliminated. Scale limited by downstream services/databases — the "one-lane road" at the end of eight lanes of highway.

**Load balancing (applied):** L4 ~20% higher throughput than L7 at moderate load (empirical AWS ELB comparison). Distribution policies: round robin, least connections, HTTP header/verb routing, weighted services. **Sticky sessions → load imbalance** over time because session durations vary; stateful services are problematic at scale.

**Elasticity:** AWS Auto Scaling groups; schedule-based or metric-based (CPU%, queue depth); warmup period before new instances receive traffic (→ [[distributed/load-balancing]]).

### Chapter 4 — An Overview of Concurrent Systems

Concurrency primer in Java, with architectural takeaways for distributed systems design.

**Why concurrency:** CPU waits on I/O; multi-core processors benefit from parallel threads. Single-threaded code wastes cores. This directly connects to Amdahl's Law — code must be parallelizable to benefit from additional hardware (→ [[distributed/scalability]]).

**Concurrency models overview:** Java (shared mutable state + locks), Go (CSP/goroutines/channels), Erlang (actor model — no shared state, async message passing), Node.js (single-threaded event loop — great for I/O, poor for CPU-intensive tasks).

**Race conditions:** Non-atomic operations at the machine level (load/modify/store is three instructions) can interleave incorrectly. Critical sections must be protected with synchronised blocks. Keep critical sections minimal — they are the "serial fraction" in Amdahl's Law.

**Deadlocks:** Circular waiting when threads acquire locks in different orders. Dining philosophers problem as canonical example. Fix: impose a global resource acquisition ordering.

**Thread pools:** Pre-allocated thread collections bound resource usage. Each thread consumes ~1 MB stack. Undisciplined thread creation causes memory exhaustion. `ExecutorService` manages pools with queuing and clean shutdown. Tuning pool size is a scalability lever.

**Producer-consumer pattern:** Threads producing work write to a shared bounded buffer (BlockingQueue); consumer threads drain it. This is the in-process equivalent of async message queues (→ [[concepts/messaging]]). Blocked threads consume no CPU — more efficient than polling.

**Barrier synchronization:** CountDownLatch/CyclicBarrier patterns for waiting until all threads reach a phase boundary before proceeding.

**Thread-safe collections:** Coarse-grained locking (synchronised wrapper) serialises all access. Fine-grained locking (ConcurrentHashMap with per-shard locks) allows concurrent writes to different shards — higher throughput, lower Amdahl serial fraction.

### Chapter 3 — Distributed Systems Essentials

**Communications hardware:** LAN (data center scale, 10–100 Gbps, sub-ms); WAN (fiber optic, ~70 Tbps per cable, latency set by speed of light): NY→SF 21ms, NY→London 28ms, NY→Sydney 80ms. WiFi (802.11ac ~5.4 Gbps), 4G (~10 Mbps, 20–40ms), 5G (~10x bandwidth, 1–2ms, ~500m range).

**IP protocol suite:** Four layers — data link, internet (IP), transport (TCP/UDP), application (HTTP). IP: best-effort, packet switching, unreliable. DNS: hierarchically distributed address book.

**TCP vs UDP:** TCP: connection-oriented, stream-oriented, reliable (3-way handshake, sequence numbers, cumulative ACKs, retransmission, flow control); heavyweight. UDP: connectionless, unreliable, fast; appropriate for streaming/gaming where occasional loss is tolerable.

**RPC/RMI:** Abstracts TCP into method calls (stub/skeleton, marshalling/unmarshalling). Progression: DCE → CORBA → Java RMI → XML web services → gRPC. Location transparency via registry. Most modern systems use HTTP+JSON instead (REST).

**Partial failures:** Six failure scenarios; only DNS failure and fast error are immediately detectable — the rest (server crashed before/during processing, slow server, lost response) all produce the same client experience: timeout. Client cannot distinguish them → retry risk without idempotency (→ [[distributed/idempotency]], [[distributed/system-models]]).

**Delivery semantics:** At-most-once (UDP, fire-and-forget) → At-least-once (TCP, retransmit on timeout) → Exactly-once (application-level idempotency key + transactional atomicity).

**Two Generals' Problem → FLP Impossibility:** No protocol can guarantee consensus on an async network in the presence of crash faults within bounded time. In practice solvable because real networks have practical (not infinite) bounds on delays.

**Byzantine faults:** Malicious or arbitrary behaviour. Excluded from typical enterprise systems (nodes behind secure networks). Blockchain is the canonical non-excluded use case.

**Time:** Clocks drift 10–20 sec/day. NTP synchronises to ~millisecond on LAN. Time-of-day clock (resettable by NTP, can jump) vs monotonic clock (always forward, no shared epoch across nodes). Cross-node timestamp comparisons are unreliable → use logical clocks for ordering (→ [[distributed/logical-clocks]]).

### Chapter 2 — Distributed Systems Architectures: An Introduction

Architecture evolution path for scaling: monolith → scale up → scale out (horizontal replication with load balancer) → add caching layer → distribute the database → multiple tiers → async queuing.

**Scale out requires stateless services.** A load balancer cannot route consecutive requests from the same client to different instances unless those instances share no per-session state. Session state (e.g., shopping cart) must live in an external store (Redis, memcached).

**Distributed caching** (Redis/memcached): check cache first; on miss, query DB and populate cache. Effective for data that changes rarely and is read frequently — inventory catalogs, weather forecasts, contact data. A well-tuned cache handling 80%+ of reads dramatically extends database capacity.

**Distributed databases:** two categories — distributed SQL (scale out SQL via sharding/replication, or NewSQL "born distributed") and NoSQL stores (Cassandra, MongoDB, Neo4j). Data location transparent to application.

**BFF (Backend for Frontend):** separate load-balanced services for web and mobile clients, each scaling independently. Referenced by Sam Newman (→ [[sources/monolith-to-microservices]]).

**Async queueing for responsiveness:** producer writes to queue (fast), consumer reads and writes to DB. Decouples the user's perceived response time from the cost of DB persistence. Works only when results are not immediately needed.

**Amdahl's Law:** serial code fractions set a hard ceiling on parallelism benefit. 50% serial → max benefit from 8 cores. 5% serial → max benefit from ~2,048 cores.

> **Contradiction:** Gorton's observation that load balancers "need to be extremely low latency to minimise the overheads they introduce" slightly understates the role of connection management. [[sources/understanding-distributed-systems]] discusses Layer 4 vs Layer 7 load balancing with more nuance about connection pooling benefits.

### Chapter 12 — Strong Consistency

**Strong consistency = serializability + linearizability** (called "external consistency" in the Spanner paper): serializability means concurrent transactions appear to execute in some serial order; linearizability means that order reflects real-time wall clock ordering. Combining both eliminates both transaction isolation anomalies and stale reads.

**Distributed consensus algorithms:** The foundation of strong consistency in distributed databases. Atomic broadcast / total order broadcast algorithms deliver updates to all replicas in the same order. 2PC is not fault-tolerant (coordinator failure blocks). Raft and Multi-Paxos are fault-tolerant.

**Raft deep-dive:** Leader-based; odd cluster size (3 or 5); election terms (monotonically increasing logical clocks); AppendEntries() for both heartbeats and log replication; heartbeats every 300–500ms; randomized election timers minimise simultaneous elections; candidacy requires: increment term, vote for self, send RequestVote to all; elected when received majority of votes and candidate's log is at least as up-to-date as voters'. Implemented in: Neo4j, YugabyteDB, etcd, Hazelcast.

**2PC failure modes — cascade risk:** Coordinator failure after the prepare phase leaves participants in doubt — they hold their locks and cannot proceed. In heavily loaded systems, held locks block other concurrent transactions, which time out, which may trigger circuit breakers and cause cascading failures. Mitigation: replicate the coordinator itself using a consensus group (Paxos/Raft) so a new coordinator can be elected and complete the transaction without manual intervention.

**VoltDB:** NewSQL in-memory database; shared-nothing; tables sharded and replicated. Single Partition Initiator (SPI): each partition is associated with a single CPU core; all requests are processed serially by that core. Serial execution eliminates locking overhead entirely. Single-partition transactions: no 2PC required — SPIs receive the same transaction in the same order; they commit independently. Multi-partition transactions: cluster-wide Multi-Partition Initiator (MPI) drives 2PC; higher overhead and lower throughput. Durability: command log (configurable flush interval, seconds scale) + partition snapshots; recovery replays command log from latest snapshot. Linearizable since v6.4 (reads strictly ordered with writes).

**Google Cloud Spanner:** Globally distributed SQL DBaaS. Tables partitioned into splits (contiguous key ranges); splits replicated across availability zones. Multi-Paxos with long-lived leaders for replica consistency. 2PC for multi-split transactions — but the 2PC coordinator itself replicates via Paxos, so coordinator failure doesn't block participants. Single-split transactions: Paxos leader acquires locks, communicates mutations to replicas, commits when majority vote. **TrueTime:** GPS receivers + atomic clocks in every Google data center; provides wall-clock time with a known, bounded error (~7ms). Commit wait: after choosing a commit timestamp, the coordinator waits for the TrueTime error window before releasing locks — guarantees any later transaction gets a strictly higher timestamp, enabling real-time linearizability. Strongly consistent reads: replicas check with their Paxos leader that they have the latest value before responding. Open-source inspired implementations (CockroachDB, YugabyteDB) approximate this without TrueTime hardware using NTP-style clocks at the cost of lower consistency guarantees (→ [[distributed/consensus-algorithms]]).

### Chapter 11 — Eventual Consistency

**Inconsistency window:** The time between an update being written to the coordinator and that update reaching all replicas. Affected by: number of replicas, operational load on nodes (higher load → longer propagation delays), and geographic distance (LAN sub-ms; intercontinental 20–80ms). The window duration has no known upper bound — it depends entirely on the operational environment.

**Read your own writes (RYOWs):** Guarantee that a client that writes a value will subsequently read that value (not an older version) from any replica. Addresses the case where a write completes on one replica and a subsequent read hits a replica that hasn't received the update yet. Implementation: in leader-follower systems, route subsequent reads to the leader; MongoDB: default (reads from master); Neo4j: write returns a bookmark (logical clock token); subsequent reads pass the bookmark and the cluster routes to a replica that has applied the bookmarked transaction.

**Tunable consistency (N, W, R):**
- N = total replicas; W = replicas that must acknowledge a write; R = replicas that must be read before returning a result
- W = N, R = 1: write-optimised consistency; all replicas updated before confirming; slow writes; stale reads impossible once write completes (but possible during update propagation → "immediate consistency" not "strong consistency")
- W = 1, R = N: write-optimised availability; writes succeed immediately; reads see latest value by reading all replicas; slow reads
- Quorum (W = R = (N/2)+1): balanced; R + W > N guarantees overlap between write and read sets → latest value always visible
- Sloppy quorum: if home nodes unavailable, accept writes to any W reachable nodes; hinted handoff to home nodes on recovery; increases write availability at cost of stale reads until handoff completes
- "Immediate consistency" (W=N) ≠ strong consistency: stale reads still possible if reads occur concurrently with ongoing replica updates

**Replica repair:** Two strategies to combat replica drift from network failures, node stalls, and bugs:
- *Read repair (active)*: coordinator reads from multiple replicas on each request; compares values; sends latest to stale replicas. Digest reads (hash comparison first) reduce network overhead (used by ScyllaDB, Cassandra). Blocking mode waits for repair before returning; non-blocking updates stale replicas async.
- *Anti-entropy repair (passive)*: background process using Merkle trees — binary hash trees where leaf nodes are hashes of individual data objects; each parent is a hash of its children; root represents entire collection. Two nodes exchange root hashes; if equal, collections are consistent; if not, traverse to find divergent subtrees. CPU/memory intensive → scheduled during low-load periods (Cassandra, Riak).

**Conflict resolution:**
- *Last writer wins (LWW)*: use timestamps to decide final value; fast but silently discards concurrent writes due to clock drift making ordering unreliable. Safe ONLY when writes use unique keys + objects are immutable after write.
- *Version vectors*: per-replica version numbers form a vector; coordinator increments its own clock and sends vector to other replicas; replicas compare vectors to detect whether updates are causally ordered or concurrent. Concurrent writes are stored as siblings (Riak); client resolves on read. Enables conflict detection without relying on wall-clock timestamps (→ [[distributed/replication]]).
- *CRDTs*: conflict-free replicated data types; automatic conflict resolution via mathematical merge semantics; counters, sets, lists. Removes application-level merge burden (→ [[distributed/crdts]]).

**In the wild:**
- Netflix Cassandra: 6+ petabytes, tens of thousands of instances, 100M+ subscribers; tunable consistency for write-heavy use cases (9:1 write:read ratio); benchmark: 1M writes/sec at 6ms avg / P95 17ms with 285 nodes
- bet365: Riak KV for odds calculation, betting, account management; globally distributed clusters with tunable consistency; >1 GB/sec data generation

### Chapter 10 — Scalable Database Fundamentals

**Scaling relational databases:** Scale up (more powerful single machine) then scale out via read replicas (primary handles all writes; secondaries are async-replicated read-only replicas for read-heavy workloads). Stale reads are a consequence of async replication — the lag window is typically milliseconds in normal operation but must be considered in the application design.

**Distributed joins:** The core difficulty of partitioning relational tables is that SQL joins become cross-partition operations. Strategies: replicate small reference tables to all nodes; use partition key indexes for co-located joins; apply selective filters to reduce data movement. Large-data join operations on both sides of a partition require data shuffling — expensive and hard to scale. Google Cloud Spanner advises specifying join algorithms explicitly for critical queries.

**Oracle RAC (shared-everything):** Up to 100 Oracle database nodes sharing a single SAN storage pool via Cache Fusion (inter-node cache coherence). Application-transparent but requires expensive proprietary hardware and licensing. Represents the shared-everything approach — all nodes share the same storage, eliminating partitioning complexity but introducing an SAN bottleneck.

**NoSQL movement drivers:** Commodity hardware, unstructured data, internet-scale applications requiring relaxed consistency for performance, need for schema flexibility. Not a single model — four distinct NoSQL data models: key-value (Redis), document (MongoDB, Couchbase), wide column (Cassandra, Bigtable), graph (Neo4j, Neptune). NoSQL databases are largely schemaless (schema-on-read vs. schema-on-write).

**Solution domain modeling:** The key NoSQL design insight: model data around *access patterns*, not around the problem domain. Instead of normalising to eliminate redundancy, denormalize to place all data needed for a query together. "Table per use case" — each major access pattern gets its own data structure. Trade-off: reads are fast; writes are slower; update propagation for duplicated data requires application management. Join-like operations are performed at write time, not query time (→ [[databases/data-models]]).

**Sharding strategies:** Hash key (modulus or consistent hashing), value-based (partition by field value, e.g., country), range-based (partition by value range, e.g., zip code). Sharding enables horizontal scaling. Sharding + replication (typically 3 replicas per partition) provides both scalability and availability.

**Leader-follower vs leaderless replication:** Leader-follower: one replica holds the authoritative value; all writes go to it; followers are read-only. Leaderless: any replica can handle writes; the coordinator propagates to others — better for write-heavy workloads. Replica consistency (strong vs eventual) is the core trade-off of all distributed database designs (→ [[distributed/replication]]).

**CAP theorem:** Under network partition, a distributed database can be either CP (return error when consistency cannot be guaranteed) or AP (accept the write to visible replicas, accept temporary inconsistency). Most databases expose tunable parameters that allow the application to select the CP or AP operating mode.

### Chapter 9 — Microservices

**Monolith scale-out challenge:** Scaling a monolith requires replicating the entire application on every new node. You cannot independently scale a single capability — adding capacity for AdvisorChat means provisioning a full application stack capable of running all services. Microservices solve this by enabling per-service independent scale-out, each behind its own load balancer.

**Decomposition via DDD:** Bounded contexts provide a starting point for service boundaries. Domain model purity may need to be adjusted to avoid excessive inter-service communication overhead — coupling of Faculty and Funding data, for example, may justify merging services or duplicating data locally. Data duplication across microservices reduces distributed calls but requires consistency management by the application.

**API gateway pattern:** Single entry point for all client requests. Insulates clients from backend refactoring (service merging, platform migration, endpoint changes). Functions: proxy/routing, authentication and authorisation, throttling (request-rate caps), response caching, monitoring integration. AWS API Gateway: 10K rps default limit with 5K burst; Kong is stateless → horizontally scalable behind a load balancer.

**Newman's seven microservices principles** (cited): modeled around a business domain; highly observable; hide implementation details; decentralize all the things (orchestration vs. choreography); isolate failure; deploy independently; culture of automation.

**Cascading failures mechanism:** A chain A → B → C: slow responses from C back-pressure B's threads; all B threads eventually blocked; B's response time to A grows; all A threads blocked. Thread pools in application servers are fixed-size. Fixed thread pool + sustained downstream slowdown = thread starvation = cascading failure. Immediate retries on failure worsen the problem by maintaining load on the overloaded service.

**Fail fast strategies:**
1. *TCP read timeout*: configure timeout at the P99 response time (e.g., 3s for a service where P99=3s). After timeout, release the thread. In Java: `java.net.SocketTimeoutException`.
2. *HTTP 503 throttling*: load balancer or API gateway rejects requests when capacity is exceeded, immediately returning 503. In-service: track in-flight request count or sliding-window P99; reject when threshold is breached.
3. *Graceful degradation*: return a cached or default response when the downstream fails (e.g., "shows you might like" instead of the personalised watchlist). Masks transient failures from end users.

**Circuit breaker:** CLOSED → (failure threshold exceeded) → OPEN (fail fast, no calls to downstream) → (cooldown expires) → HALF_OPEN (probe call) → CLOSED or OPEN. Relieves load on overloaded downstream during recovery. Essential pattern for any microservices system with service dependencies (→ [[patterns/circuit-breaker]]).

**Bulkhead pattern:** Reserve separate thread pools per API endpoint within a microservice. Example: reserve 150 of 200 threads for `newOrder` endpoint, leaving 50 for `orderStatus`. When a new-order burst occurs, status requests still receive resources. Resilience4j `BulkheadConfig.maxConcurrentCalls` and `maxWaitDuration` for Java; Spring Boot provides annotation-based configuration via `@Bulkhead` (→ [[patterns/bulkhead]]).

**Long-tail response time and percentiles:** Real workloads exhibit long-tail response time distributions. Averages are misleading — a small number of slow requests skews them. Use P50/P95/P99 for sizing and SLA decisions. Example: P50=200ms, P95=1,200ms, P99=3,000ms for a service handling 200M requests/day → 2M requests take >3s. BBC: 10% fewer users per additional second of load time.

### Chapter 8 — Serverless Processing Systems

**Serverless model:** The cloud provider owns hardware provisioning, OS, runtime, and autoscaling. The developer deploys code only. Billing is per-invocation — no cost when idle. The opposite of IaaS where you pay for reserved capacity 24/7. Cloud overspend is endemic: surveys show 69% of organisations overspend their cloud budget by >25%.

**Google App Engine (GAE) standard environment:** A serverless container platform managing instance lifecycle automatically. Key autoscaling parameters:
- `target_cpu_utilization` — scale-out threshold (default 0.6); lower → more instances for the same load
- `max_concurrent_requests` — max simultaneous requests per instance; influences how many instances are needed
- `target_throughput_utilization` — scale-out threshold when `max_concurrent_requests` is set
- `max-pending-latency` — maximum time a request can wait before a new instance is started
- `min_instances` / `max_instances` — pool size bounds; `min_instances` eliminates cold starts at the cost of a standing baseline

**Cold start:** When no instance is warm, the first request must wait for the runtime to initialise. Language matters: compiled runtimes (Go) cold-start in <1 second; JVM (Java, Kotlin) cold-start in 1–3 seconds. Google App Engine and AWS Lambda both exhibit cold starts.

**AWS Lambda:** Function-as-a-service model with freeze/thaw semantics: Lambda freezes the execution environment between invocations and thaws it on the next call. Key operational parameters:
- **Provisioned concurrency**: keeps N instances warm, eliminating cold starts for predictable traffic
- **Reserved concurrency**: caps max concurrent executions for a function; prevents one function consuming the full account limit
- **Burst limits**: 3,000 initial burst in US West; 1,000 in EU Frankfurt; 500 in other regions. After burst: +500 new instances/minute scale-out rate. Exceeding the concurrency limit returns HTTP 429 throttle error.
- **Memory-vCPU proportionality**: 1,769 MB RAM = 1 vCPU. Below this, code runs on fractional CPUs — CPU-intensive tasks benefit from higher memory allocation even if they don't need the memory.

**Parameter study methodology:** Serverless performance/cost is highly sensitive to autoscaling configuration, and defaults are rarely optimal. Gorton's approach: define a configuration space (e.g., 12 combinations of `target_cpu_utilization` × `max_concurrent_requests`), run load tests at a representative level, and plot throughput and cost for each combination. Key finding from GAE case study: the default configuration ({CPU60, max10}) was neither the cheapest nor the fastest option. {CPU80, max10} achieved +3% throughput at the same cost. {CPU70, max80} achieved 96% of peak throughput at 55% of the cost. Without experimentation, these differences are invisible.

**Vendor lock-in:** Serverless functions typically use cloud-provider-specific SDKs, making migrations expensive. Alternatives: **Apache OpenWhisk** (open-source serverless platform, deployable on any infrastructure), **Serverless Framework** (open-source abstraction layer with multi-provider deployment, though functions often retain provider-specific code) (→ [[distributed/serverless]]).

### Chapter 7 — Asynchronous Messaging

**Queue model:** A producer writes to a queue managed by a message broker; a consumer reads from it. The broker decouples the two: neither needs to know the other's address, and either can be temporarily unavailable without losing messages.

**Push vs pull:** Pull consumers actively poll for messages; push brokers notify consumers when messages arrive. Push is preferred at scale: the consumer controls its own processing rate by adjusting thread pool size, not by altering poll frequency. RabbitMQ uses push with flow control.

**Message persistence:** In-memory queues are fast but volatile — broker restart loses all messages. Persistent queues write to disk before acknowledging. The trade-off is throughput (disk I/O) vs durability.

**Pub-sub and topics:** A topic is a named stream; producers publish to a topic; all subscribed consumers receive a copy. Used for broadcast, fanout, and event-driven decoupling. Leader-follower replication provides topic HA.

**RabbitMQ implementation details:**
- *Exchanges*: the routing layer. Direct exchange routes by exact routing key; topic exchange routes by pattern; fanout exchange broadcasts to all queues.
- *Connections vs channels*: TCP connections are expensive (resource per connection); channels are lightweight logical sessions within a single TCP connection. Thread-safe Java app servers should use a **channel pool** — one channel per thread, pool allocated at startup — rather than a channel per message.
- *Broker internals*: RabbitMQ uses one thread per queue. High queue counts linearly scale memory and CPU. When memory exceeds 40% of available RAM, the broker halts all producers.

**Data safety trade-off:** Three independently configurable guarantees; all three must be enabled for complete data safety at the cost of throughput:
1. *Publisher confirms*: broker ACKs the producer only after the message is persisted.
2. *Persistent queues + persistent delivery mode*: message survives broker restart.
3. *Manual consumer ACKs*: consumer ACKs only after processing is complete; broker retains and redelivers on consumer crash.

**Availability trade-off:** *Quorum queues* replicate to a majority of nodes using RAFT; survive minority-node failures; preferred for HA+durability. *Mirrored queues* (legacy) synchronise to all nodes; offer stronger consistency but higher write amplification.

**Competing consumers:** Multiple consumers reading from the same queue; the broker delivers each message to exactly one consumer. Natural load balancing and horizontal scale-out — add consumers to increase throughput without changing producers.

**Exactly-once processing:** Brokers can deduplicate at the producer side using a *producer idempotency key* (broker discards duplicate sends within a window). Consumers must deduplicate using an *idempotency key cache* — consumer checks whether the message ID was already processed, skips if found. Together these simulate exactly-once semantics.

**Poison messages and dead-letter queues:** A message that repeatedly causes the consumer to crash is a poison message. AWS SQS tracks `ReceiveCount`; when it exceeds `maxReceiveCount`, the message is moved to a **Dead Letter Queue (DLQ)** for human inspection and reprocessing. RabbitMQ supports the same via dead-letter exchanges (→ [[concepts/messaging]]).

### Chapter 16 — Final Tips for Success

A closing chapter noting four foundational elements of scalable systems not covered in the main chapters — Gorton's acknowledgement of scope limits rather than new technical content.

**Automation / DevOps:** Continuous delivery practices, automated toolchains for test/deploy/monitor; teams own design, development, and operation of their own microservices; on-call rotation; reduces coordination overhead and enables fast release cycles. Reference: Bass et al. *DevOps: A Software Architect's Perspective*.

**Observability:** "You can't manage what you can't measure." Instrumented systems emit metrics and logs from OS, platforms (messaging, databases), and application code. OpenTelemetry for vendor-agnostic instrumentation; Prometheus, Grafana, Graphite for monitoring and exploration. Both real-time alerting and historical diagnosis are essential (→ [[operations/observability]], [[operations/monitoring]]).

**Deployment platforms:** Containers (Docker) package code and dependencies into a deployable unit; run as isolated processes sharing the host OS — more efficient than VMs. Kubernetes/Apache Mesos for orchestration: autoscaling, container placement, multi-node management. Infrastructure as Code (IaC) as an essential DevOps ingredient (→ [[concepts/deployment-pipelines]]).

**Data lakes:** Historical data management at petabyte scale. Data lakes store heterogeneous formats (blobs, JSON, relational extracts) in low-cost object storage (Hadoop, S3, Azure Data Lake). Flexible query engines support analysis and transformation. Storage classes (tiered retrieval times) optimise cost for rarely-accessed historical data. Distinguished from data warehouses (schema-on-write, structured) and data marts (narrower scope).

### Chapter 15 — Stream Processing Systems

**Batch vs stream processing:**
- Batch: accumulate data → ETL job → database insert → query; latency minutes to hours; suitable when data freshness is not critical; unlimited dataset size
- Stream (data-in-motion/real-time analytics): process events as they arrive; sub-second to seconds latency; stateless (transform individual events) or stateful (maintain context across events); inherently bounded dataset per window

**Lambda architecture (2011):** Hybrid of batch and stream. Three layers: (1) batch layer (Hadoop) processes large volumes periodically and writes to the serving layer; (2) speed layer (Storm) processes events as they arrive to compensate for batch lag; (3) serving layer holds results from both layers and handles queries. **Now less prominent** — superseded by Kappa architecture.

**Kappa architecture:** Events stored in an immutable log (Kafka); consumed and processed as a continuous stream without a separate batch layer. Simpler operationally — one processing paradigm instead of two.

**Apache Storm:** Earlier stream processing platform; explicit topology definition: spouts (data sources) + bolts (processing nodes) + groupings (routing). `fieldsGrouping` routes by key field to the same bolt instance (per-key state); `globalGrouping` fans all outputs into a single bolt. Replaced by Flink/Spark for most production workloads.

**Apache Flink deep-dive:**
- **DataStream API**: `DataStream<T>` as the primary abstraction; functional operators: map, filter, keyBy, sum, window. Lazy execution: nothing runs until `env.execute()`.
- **Windowing**: sliding windows (10-minute window size / 5-minute slide = overlapping; useful for weighted averages) vs tumbling windows (non-overlapping; each event belongs to exactly one window).
- **Scalability**: logical DAG compiled from program; mapped to physical cluster resources. `setParallelism(N)` per operator or `env.setParallelism(N)` as default. Task managers are JVMs; each holds N task slots (`taskmanager.numberOfTaskSlots`); one slot runs one operator thread. Operator chaining collocates multiple operators in a single task slot to minimise inter-operator communication.
- **Job manager**: cluster resource management, job scheduling, failure monitoring, recovery. Leader-follower HA configuration for the job manager itself.
- **Data safety (stream barriers)**: Flink job manager periodically injects barrier events into the source stream; barriers flow in-order with data. When a stateful operator receives a barrier on **all its input streams**, it writes its state to persistent storage (RocksDB backend by default) and echoes the barrier downstream. Once the barrier reaches all sinks, the checkpoint is complete. Checkpoint identifies position N in the source (e.g., Kafka offset N). **Recovery**: restart entire application → restore state from last complete checkpoint → resume source from offset N+1. Trade-off: large state → expensive checkpointing → throughput impact. `min-time-between-checkpoints` config prevents overlapping checkpoint cycles.

(→ [[streams/stream-processing]], [[streams/batch-processing]])

### Chapter 14 — Scalable Event-Driven Processing

**Event log vs FIFO queues:** Kafka's event log is append-only, non-destructive, and replayable — fundamentally different from traditional FIFO message queues that delete messages on consumption. Replaying an event log allows new consumers to rebuild state from any point in history. ZooKeeper manages cluster metadata (topic configuration, partition leaders, consumer group coordination) independently of the message data path.

**"Dumb broker/smart clients":** Kafka offloads offset tracking, consumer group coordination, and partition assignment to consumers. The broker stores data sequentially on disk and serves it without understanding message semantics. This design maximises broker throughput while giving consumers full control over their progress.

**Topics:** Persistent by default (7-day TTL configurable). **Compacted topics** retain only the latest value per key — equivalent to a materialised key-value snapshot. Tombstone records (null value with a key) trigger deletion of a key from compacted topics, enabling GDPR-compliant removal without log surgery. Kafka Connect (source/sink connectors) and Kafka Streams (stateful stream processing library) complete the ecosystem.

**Producers — async batching:**
- `batch.size`: maximum bytes per batch; larger batches improve throughput at the cost of latency
- `linger.ms`: wait duration before sending a partial batch; creates intentional delay to allow more messages to accumulate
- `acks=0`: fire-and-forget (no acknowledgment); highest throughput, data loss on broker failure
- `acks=1`: leader acknowledges; data loss if leader fails before follower sync
- `acks=all`: all in-sync replicas (ISR) must acknowledge; highest durability
- `enable.idempotence=true`: producer assigns sequence numbers; broker deduplicates retries; makes `acks=all` exactly-once from the producer perspective

**Consumers — delivery semantics via commit timing:**
- `poll()` long-polls for messages (configurable timeout); returns a batch
- **At-most-once**: call `commitSync()` before processing — if processing fails, message is lost
- **At-least-once**: call `commitSync()` after processing — if consumer crashes, message is redelivered (consumer must be idempotent)
- `consumer.seek(partition, offset)`: manually reset to any offset; enables replay or skip of specific messages

**Semantic partitioning:** Null key → round-robin across partitions; non-null key → hash(key) % partitions → same key always routes to same partition. Guarantees per-key ordering within a partition. No total ordering across partitions. Partition count can be increased (changing key-to-partition mapping for new data) but **never decreased** without creating a new topic and migrating consumers.

**Consumer groups:** Group of consumers that collectively consume all partitions of a topic — each partition assigned to exactly one consumer per group. Max useful consumers per group = partition count (extra consumers are idle). **Group coordinator** (a Kafka broker) tracks group membership; **group leader** (the first consumer to join) runs partition assignment. **CooperativeStickyAssignor** rebalances by revoking only the minimum partitions needed to achieve balance — avoids stop-the-world global rebalances.

**Durability — ISR and min.insync.replicas:**
- **ISR (In-Sync Replicas)**: set of replicas that are caught up to the leader within a configurable lag threshold. Replicas falling behind are removed from the ISR.
- `acks=all` requires all ISR members to acknowledge before the leader responds to the producer.
- `min.insync.replicas=2`: producer write fails if ISR size drops below 2 — prevents silent data loss when only the leader is alive.
- Trade-off: higher `min.insync.replicas` → stronger durability, lower availability during partial broker failures.

**Production scale:** Slack uses Kafka for 1B+ messages/day with 16 brokers and 32 partitions per topic (→ [[streams/stream-processing]]).

### Chapter 13 — Distributed Database Implementations

**Redis:**
- **Architecture**: in-memory key-value store; **single-threaded event loop** — all operations are atomic and lock-free by design; throughput limited by single CPU core but avoids any synchronization overhead.
- **Persistence**: AOF (Append-Only File) — writes every operation to an append-only log on disk; snapshotting (RDB) for compaction; configurable `appendfsync` policy (always / everysec / no) governs durability vs throughput.
- **Redis Cluster**: shards data across multiple nodes using 16,384 hash slots; each node owns a subset of slots. **Gossip protocol** for cluster state propagation — each node pings random peers. **MOVED** redirect — when a client queries the wrong node, the node returns a MOVED response with the correct node address; clients cache the slot-to-node map to avoid repeated redirections. **Hash tags** (`{tag}` in key names) force multiple keys to the same slot — essential for multi-key operations. Async replication (WAIT command for synchronous replication to N replicas on demand). Maximum cluster size: 1,000 nodes. Custom election allows data loss for speed — Redis prioritises availability over durability in partition scenarios.
- **Transactions**: Redis MULTI/EXEC executes a batch of commands atomically but is NOT ACID-compliant — no isolation during queueing, no rollback on individual command failure.

**MongoDB:**
- **Storage engine (WiredTiger)**: document-level locking with OCC; journaling (write-ahead log) for crash recovery; compression.
- **Data model**: BSON (binary JSON); schema-on-read (no enforced schema by default); flexible nested document structure eliminates many relational joins.
- **ACID transactions**: available since v4.0 for multi-document transactions using 2PC + snapshot isolation. Significant performance overhead vs single-document operations — designed as an escape hatch, not the primary access pattern.
- **Sharding**: hash-based (uniform distribution, no range queries) and range-based (range queries, risk of hotspots) sharding strategies. Unit of movement is a 64MB **chunk** (contiguous range of shard key values). **Mongos** (query router) processes client requests and routes to correct shards. **Config servers** (3-node replica set) store cluster metadata. **Balancer** process migrates chunks to achieve even distribution. Three `mongos` deployment patterns: co-located with app server, standalone dedicated, or embedded.
- **Replication**: Raft-based replica sets (primary + secondaries). Tunable **write concerns** (`w:1`, `w:majority`, `w:N`) and **read preferences** (`primary`, `primaryPreferred`, `secondary`, `nearest`). **Causal consistency sessions** for read-your-own-writes. **Linearizable reads** possible with `readConcern: linearizable` (issues a read + quorum check) at significant latency cost.

**DynamoDB:**
- **Managed service**: AWS handles all provisioning, replication, failover, and maintenance. Two capacity modes: **on-demand** (pay per request, automatic scaling) and **provisioned** (pre-allocated RCU/WCU with auto-scaling).
- **Hotkey problem**: each partition has a hard limit of **3,000 RCU** and **1,000 WCU**. High-traffic keys (e.g., popular product pages, celebrity user profiles) can saturate a partition. Mitigation: add random suffix to partition key, read-through caching via **DAX** (DynamoDB Accelerator — in-memory cache, microsecond reads).
- **Global tables**: multi-region active-active replication. Conflicts resolved via **LWW** (last-writer-wins by timestamp). Achieves 99.999% SLA.
- **Transactions**: ACID transactions scoped to a **single region** only — global table transactions do not span regions. Uses 2PC internally.
- **Limits**: 400KB item size limit; indexes (local secondary indexes must be created at table creation; global secondary indexes can be created later).
- **Query**: PartiQL (SQL-compatible query language) for familiar query syntax. Primary access via partition key + optional sort key.

(→ [[databases/data-models]], [[distributed/replication]])

### Chapter 1 — Introduction to Scalable Systems

Scalability defined as the ability to handle growing load in some dimension: throughput (requests/sec), data volume, analytics capacity, or stable response time under load.

Two fundamental scaling strategies: **replication** (add resources to increase capacity — equivalent to adding lanes to a bridge) and **optimisation** (use existing resources more efficiently — equivalent to Sydney Harbour Bridge variable-direction lanes).

Scalability and cost: systems not architected to scale can face enormous retrofit costs. HealthCare.gov required $2B+ to fix; Oregon's health exchange failed at $303M. The foundations of scale must be built in.

**Hyperscale:** exponential capability growth with linear cost growth. Netflix's diurnal load pattern (peak at 9pm, trough at 5am) is a canonical example of elastic scale-down.

**Quality attribute trade-offs with scalability:**

| Trade-off | Tension |
|-----------|---------|
| Performance | In-memory state improves individual request latency but reduces system capacity (more memory per request = fewer concurrent requests) |
| Availability | Replication aids both — but replicated state requires consistency management (→ [[distributed/consistency-models]]) |
| Security | TLS, authentication, encryption all impose CPU overhead; reduces effective throughput; CIA triad availability dimension → DDoS concern |
| Manageability | More components = more to monitor; offset only through automation and DevOps practices |

> **Open question:** How early should scalability be a design concern? Gorton notes that introducing distributed technologies before a clear requirement "can be deleterious to a project." This echoes evolutionary architecture principles (→ [[sources/building-evolutionary-architectures]]) but sets up a tension: if you defer too long, the retrofit cost may be prohibitive.

## Notable Quotes

> "If a system is not designed intrinsically to scale, then the downstream costs and resources of increasing its capacity to meet requirements may be massive." (ch. 1)

> "In modern applications, most of the code executed is not written by your organisation. It is part of the containers, databases, messaging systems, and other components that you compose into your application through API calls and build directives. This makes the selection and use of these components at least as important as the design and development of your own business logic." (ch. 2)

## Related Pages

- [[distributed/scalability]]
- [[distributed/load-balancing]]
- [[distributed/caching]]
- [[distributed/replication]]
- [[concepts/architecture-characteristics]]
- [[operations/availability]]
- [[operations/monitoring]]
- [[authors/ian-gorton]]

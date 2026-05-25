---
title: "Understanding Distributed Systems"
type: source
tags: [distributed-systems, networking, consensus, scalability, resiliency, observability]
sources: [understanding-distributed-systems]
created: 2026-05-13
updated: 2026-05-13
---

# Understanding Distributed Systems

**Author:** [[authors/roberto-vitillo]]
**Published:** 2nd edition (complete rewrite of 1st)
**Slug:** `understanding-distributed-systems`

## Overview

A breadth-first guide to distributed systems aimed at backend developers who want a structured mental model rather than depth in any one area. Vitillo bridges theory (formal models, Raft, CRDTs, CAP theorem) and practice (cloud services, CDNs, load balancers, messaging) in a single coherent journey. The book walks through building a scalable CRUD app ("Cruder") from scratch as a concrete thread for the scalability section.

Two core insights thread through the whole book:
1. **Failures are unavoidable** — design around failure, not around its absence.
2. **Coordination is expensive** — minimise it ruthlessly; off the critical path when possible.

Vitillo recommends [[sources/designing-data-intensive-applications]] as the essential companion read for depth.

## Structure

Five parts:
- **I: Communication** — TCP, TLS, DNS, HTTP/REST
- **II: Coordination** — System models, failure detection, clocks, leader election, replication, consistency, transactions
- **III: Scalability** — Caching, CDN, partitioning, load balancing, data stores, microservices, messaging
- **IV: Resiliency** — Failure causes, redundancy, fault isolation, circuit breakers, rate limiting
- **V: Maintainability** — Testing, CD pipelines, monitoring, observability, manageability

## Key Claims

- Network abstractions leak; you must understand TCP, TLS, and DNS to debug production issues. (→ ch. 2–4)
- Perfect failure detection is impossible — timeouts are always a guess. (→ ch. 7)
- Physical clocks cannot reliably order events across nodes; logical clocks (Lamport, vector) are required. (→ ch. 8)
- CAP theorem: during a network partition you choose consistency or availability. In practice this is a spectrum, and the PACELC extension captures the latency/consistency tradeoff even in normal operation. (→ ch. 10)
- Coordination (consensus) is the scalability bottleneck; CRDTs and monotonic programs can avoid it entirely. (→ ch. 11)
- The three scalability patterns are functional decomposition, partitioning, and replication — everything else is a combination of these. (→ ch. 14–23 summary)
- Failures are inevitable; the goal is to reduce blast radius and stop propagation. (→ Part IV)
- Configuration changes are one of the leading causes of catastrophic production failures. (→ ch. 24)
- Observability is a superset of monitoring — metrics detect symptoms; logs and traces explain causes. (→ ch. 32)

## Chapter Notes

### Part I — Communication

#### Ch 2: Reliable links (TCP)
TCP builds reliability on top of unreliable IP via sequence numbers, acknowledgments, retransmissions, and checksums. Three-way handshake has a full-RTT cold start cost; keep connections alive. Flow control (receive buffer) and congestion control (congestion window) mean bandwidth = WinSize/RTT — lower RTT → better throughput. UDP drops all this for use cases where freshness beats completeness (gaming, custom protocols, HTTP/3).

#### Ch 3: Secure links (TLS)
TLS adds encryption (asymmetric key exchange → symmetric session), authentication (certificate chains rooted in trusted CAs), and integrity (HMAC). Every connection costs extra round trips; TLS 1.3 reduces to 1 RTT. Certificate expiry is a common SPOF — automate renewal.

#### Ch 4: Discovery (DNS)
DNS is a distributed, hierarchical, eventually consistent key-value store. TTL controls cache freshness vs. propagation time. DNS can be a SPOF; name servers that serve stale entries when unreachable ("static stability") are more resilient than ones that return errors.

#### Ch 5: APIs
REST over HTTP: stateless, cacheable, resource-based URLs. Idempotency via idempotency keys is essential for retry safety — POST is not inherently idempotent; make it so by storing request IDs. API versioning (e.g., `/v1/`) is required for breaking changes. OpenAPI for IDL → code generation.

### Part II — Coordination

#### Ch 6: System models
Formal framework: process models (Byzantine/arbitrary-fault, crash-recovery, crash-stop), link models (fair-loss, reliable, authenticated-reliable), timing models (synchronous, asynchronous, partially synchronous). Book assumes crash-recovery + fair-loss links + partial synchrony throughout.

#### Ch 7: Failure detection
Impossible to build a perfect failure detector — timeouts are probabilistic. Pings (sender → receiver) and heartbeats (receiver → sender) allow proactive tracking. Timeout duration: base on desired false-positive rate vs. P99.9 of downstream latency.

#### Ch 8: Time and order
Physical clocks drift; NTP corrects but imprecisely; monotonic clocks only work per-node. **Lamport clocks**: counter-based, guarantee happened-before → lower timestamp, but not the inverse. **Vector clocks**: per-process counter array, fully capture causality (if V1 < V2 → V1 happened-before V2); storage grows with process count.

#### Ch 9: Leader election
Raft: three states (follower, candidate, leader). Randomized election timeouts avoid split votes. Leader identified by heartbeats. In practice: acquire a lease in an external linearizable KV store (etcd, ZooKeeper) using TTL + compare-and-swap. Leader introduces scalability bottleneck and SPOF; minimise work it performs and tolerate occasional dual-leaders with idempotent operations.

#### Ch 10: Replication
**State machine replication (Raft)**: leader appends to log → replicates to quorum → commits → applies. Only committed entries survive leader failure. **Consistency models**: strong (linearizability — reads through leader confirmed by quorum), sequential (same order, no real-time guarantee), eventual (divergence allowed temporarily). **CAP theorem**: partition forces choice between availability and strong consistency — in practice a spectrum. **PACELC**: adds latency/consistency tradeoff during normal operation. **Chain replication**: writes traverse chain head→tail, reads at tail; splits data-plane throughput from leader; stronger simplicity guarantees, but slower write latency (all nodes in chain), weaker availability (single failure stalls until control plane reconfigures).

#### Ch 11: Coordination avoidance
Broadcast protocols: best-effort, reliable (eager or gossip), total-order (requires consensus). **CRDTs**: convergent replicated data types — if merge is idempotent/commutative/associative, replicas converge without consensus. LWW register (greatest-timestamp wins) and MV register (keep all concurrent values). **Dynamo-style stores**: any replica accepts reads/writes; W+R>N intersects quorums. Anti-entropy via read-repair and replica synchronization (Merkle tree hashes). **CALM theorem**: a program is coordination-free iff it is monotonic (new inputs only refine output, never retract). **Causal consistency** (COPS): stronger than eventual, weaker than linearizability; provably the strongest consistency model compatible with availability + partition tolerance.

#### Ch 12: Transactions
**ACID**: Atomicity (all-or-nothing), Consistency (invariants), Isolation (no races), Durability (WAL + replication). Isolation levels: dirty write < dirty read < fuzzy read < phantom read; serializability prevents all. **2PL** (pessimistic): read/write locks, deadlock possible. **OCC** (optimistic): local workspace, validate at commit; better for low-conflict workloads. **MVCC**: maintains multiple versions; read-only transactions never block or abort. **2PC** (Two-phase commit): prepare → commit; blocking if coordinator fails; participants can't make progress without coordinator. **Spanner**: 2PC + 2PL + Paxos state machine replication + TrueTime (uncertainty intervals) for globally distributed ACID transactions.

#### Ch 13: Asynchronous transactions
**Outbox pattern**: write message to an outbox table in same local ACID transaction as the state change; relay process forwards to message broker; idempotency key deduplicates. Conceptually equivalent to state machine replication. **Saga**: distributed transaction = sequence of local transactions T₁…Tₙ, each with compensating transaction Cᵢ. Coordinator (orchestrator) manages execution. No isolation (unlike 2PC) — tolerate with semantic locks if needed.

### Part III — Scalability

#### Ch 14: HTTP caching
Static resources: Cache-Control + ETag headers; treat as immutable (max-age=1yr), give new URL per version → atomic multi-resource updates. CQRS pattern: differentiate read path (cacheable) from write path. Reverse proxy (NGINX, HAProxy) as shared server-side cache.

#### Ch 15: CDNs
Overlay network + edge clusters near users. Benefits: geographic proximity (lower RTT), persistent connection pools, optimised routing. Multi-tier caching (edge → intermediary → origin). Global DNS load balancing directs clients to nearest cluster. Also shields origin from DDoS.

#### Ch 16: Partitioning
**Range partitioning**: sorted by key; good for scans; risk of hotspots (e.g., time-series partitioned by date). Static vs. dynamic partitioning (split/merge on demand). **Hash partitioning**: uniform distribution; loses sort order. Modulo routing is problematic on resize. **Consistent hashing**: hash ring minimises key movement when adding/removing nodes (only K/N keys move).

#### Ch 17: File storage (Azure Blob Storage)
Three layers: stream layer (chain replication, append-only), partition layer (range-partitioned index of files), front-end (stateless reverse proxy + auth). Stream manager and partition manager are control planes. AS was designed for strong consistency from day 1 (S3 added it in 2021).

#### Ch 18: Load balancing
**DNS load balancing**: simple but poor failure handling; useful for global (multi-region) routing. **L4 (TCP)**: fast, connection-based, consistent hashing per connection tuple; supports direct server return. **L7 (HTTP)**: smarter (TLS termination, sticky sessions, rate limiting, request routing); lower throughput than L4. **Sidecar/service mesh**: client-side L7 load balancing removes centralised bottleneck; requires a control plane to manage sidecars (Envoy, NGINX, HAProxy).

#### Ch 19: Data storage
**DB replication**: leader-follower; async replication → fast but can lose data; sync → durable but slow. Semi-sync (one synchronous follower) is practical compromise. Managed services (RDS, Azure SQL) automate failover. Replication scales reads only. **NoSQL**: Dynamo (Cassandra, Riak), Bigtable (HBase) designed for horizontal scale from scratch; eventually consistent; no joins; model data around access patterns upfront. DynamoDB: partition key + sort key; 3 replicas per partition with Raft. **NewSQL**: Spanner, CockroachDB — NoSQL scalability with ACID guarantees.

#### Ch 20: Caching
Hit ratio is the key metric. **Local cache**: fast, no network; each client caches independently (data duplication); thundering herd on restart. **External cache**: shared (Redis, Memcached); partitioned and replicated; higher latency; if it fails, origin may be overwhelmed — keep local fallback. Cache is an optimisation; origin must survive without it.

#### Ch 21: Microservices
Decompose when team size and deployment velocity demands it — not before. Each service: own team, own data store, own release schedule. Downsides: remote calls (expensive, non-deterministic), coupling risks (distributed monolith), resource provisioning overhead, testing complexity, eventual consistency required. API gateway: routing, composition, translation, auth, rate limiting. Start monolith; peel off services one at a time.

#### Ch 22: Control planes and data planes
Data plane: critical path, must be highly available and fast, prefers availability over consistency. Control plane: metadata/configuration management, not on critical path, prefers consistency. Static stability: data plane must operate with stale config if control plane is unavailable. Propagation architectures: periodic file dump to S3 (simple, robust), push-based deltas from control plane (lower latency). Constant work pattern: control plane dumps full state periodically regardless of what changed → predictable, self-healing, testable.

#### Ch 23: Messaging
Message channel decouples producer from consumer (temporal and load decoupling). **One-way**: fire-and-forget with persistence. **Request-response**: response channel per producer. **Pub-sub**: broadcast to all consumers. Brokers (Kafka, SQS): ordering requires coordination; Kafka partitions by key → per-partition ordering, single consumer per partition. Exactly-once delivery is impossible; simulate with idempotent messages + delete-after-process. Dead letter channel for poison messages. Backlog is bimodal and hard to drain. Fault isolation: route bad-actor messages to slow lane.

### Part IV — Resiliency

#### Ch 24: Failure causes
Hardware faults, incorrect error handling (majority of catastrophic failures per 2014 study), configuration changes (delayed detection), SPOFs (DNS, TLS certs, humans), gray failures (slow network calls), resource leaks (memory, threads, sockets), load pressure, cascading failures (metastable). Risk = probability × impact.

#### Ch 25: Redundancy
Prerequisites: added complexity must not exceed availability gained; health detection; degraded-mode operation; return to full redundancy. Failures must be uncorrelated. Availability Zones (AZs): low-latency, different power/network, support synchronous replication. Regions: high latency, use async replication; needed for legal compliance more than failure tolerance.

#### Ch 26: Fault isolation
**Bulkhead pattern**: partition instances by user/tenant; blast radius ∝ 1/partitions. **Shuffle sharding**: virtual partitions as random subsets of instances; C(N,k) possible partitions — dramatically reduces probability two users share the same virtual partition. **Cellular architecture**: partition entire stack including dependencies; each cell has max capacity; scale out by adding cells, not growing cells.

#### Ch 27: Downstream resiliency
**Timeout**: always set; base on P99.9 of downstream latency. Many languages/libraries have no default timeout (Python requests, Go HTTP, JS XMLHttpRequest). **Retry**: only for transient failures; exponential backoff with jitter (`delay = random(0, min(cap, initial * 2^attempt))`); retry amplification in deep chains → retry at one layer only. **Circuit breaker**: state machine (closed → open → half-open); open = fail fast; graceful degradation when non-critical dependency is down; configurable threshold and half-open probe interval.

#### Ch 28: Upstream resiliency
**Load shedding**: measure concurrent requests; reject with 503 when over threshold; can prioritise requests (low-priority first). **Load leveling**: message channel smooths spikes; not suitable for latency-sensitive paths. **Rate limiting**: per API key/IP/user; return 429 with Retry-After; distributed implementation uses sliding window buckets + async flush to shared store + local fallback if store unavailable. **Constant work**: perform same amount of work per unit time regardless of load — avoids multi-modal behaviour, self-heals from corruption, simplifies reasoning.

### Part V — Maintainability

#### Ch 29: Testing
Test pyramid: many unit < integration < few E2E. Test size: small (single process, no I/O), intermediate (single node, local I/O), large (multi-node). Test doubles: fake > stub > mock (in order of resemblance to real). Contract tests + mocks for integration. **TLA+**: formal specification language for model-checking distributed algorithms; used at Amazon (S3) and Microsoft (Cosmos DB).

#### Ch 30: Continuous delivery
CD pipeline: PR review → build → pre-production (smoke tests + end-to-end) → production (incremental rollout, bake time, health gates). Configuration and infrastructure (IaC/Terraform) go through same pipeline as code. Backward-compatible changes: prepare (consumer supports both) → activate (producer switches) → cleanup (old format removed). Upgrade-downgrade tests in pre-production.

#### Ch 31: Monitoring
**Metrics**: time series; pre-aggregate client- and server-side. **SLIs**: ratio of good/total events (availability, response-time percentile). **SLOs**: acceptable range for SLI + error budget over rolling window. **Alerts**: base on burn rate (rate of error budget consumption) not raw threshold. **Dashboards**: audience-specific (SLO, public API, service). Chaos testing: inject controlled failures to prevent over-reliance.

#### Ch 32: Observability
Observability ⊃ monitoring. **Logs**: structured events per work unit; one event per request with all relevant data; sampling and log levels to control cost. **Traces**: trace ID propagated across services; spans represent work units; assembled by collector (Zipkin, AWS X-Ray). Metrics = aggregated views of events; traces = causally ordered views of events.

#### Ch 33: Manageability
Dynamic configuration: read from store (AWS AppConfig, Azure App Configuration) periodically at runtime. Feature flags: release with feature disabled → enable for fraction of instances → full rollout. Enables A/B testing.

## Notable Quotes

> "A distributed system is one in which the failure of a computer you didn't even know existed can render your own computer unusable." — Leslie Lamport (ch. 1)

> "The fastest, safest, most secure, and reliable network call is the one you don't have to make." (ch. 5)

> "Treat servers like cattle, not pets." — Bill Baker (Part III intro)

> "Failures are unavoidable in distributed systems, and coordination is expensive." (Part II summary)

> "Anything that can go wrong will go wrong." — Murphy's law (Part IV intro)

## Related Pages

- [[authors/roberto-vitillo]]
- [[distributed/consistency-models]]
- [[distributed/cap-theorem]]
- [[distributed/replication]]
- [[distributed/idempotency]]
- [[distributed/distributed-transactions]]
- [[distributed/crdts]]
- [[patterns/circuit-breaker]]
- [[patterns/saga]]
- [[patterns/outbox-pattern]]
- [[patterns/bulkhead]]
- [[patterns/sidecar-service-mesh]]
- [[sources/designing-data-intensive-applications]] *(recommended by Vitillo as companion read)*

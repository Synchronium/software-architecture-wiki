---
title: "Space-Based Architecture"
type: style
tags: [architecture, distributed, in-memory, high-performance, elasticity]
sources: [fundamentals-of-software-architecture, software-architecture-patterns]
created: 2026-05-13
updated: 2026-05-14
---

# Space-Based Architecture

## Definition

Space-based architecture (SBA) eliminates the central database as the scalability bottleneck by distributing data across in-memory replicated caches that each processing unit carries. Multiple instances of a processing unit run simultaneously, each with a full copy of the shared data in memory. Requests are routed to any available processing unit, which reads from and writes to its local cache; asynchronous data writers persist changes to the database in the background.

The name comes from *tuple space* — a shared distributed memory model from parallel computing. Also called *cloud architecture pattern*, though Richards prefers "space-based" because processing units do not need to run on cloud infrastructure — they can reside on local servers.

**The problem it solves:** conventional web applications form a triangle-shaped scaling topology — web servers are easiest and cheapest to scale (the wide base), application servers are harder (the middle), and the database is the narrowest and hardest to scale (the apex). Scaling out the web layer just pushes the bottleneck to the app layer; scaling the app layer pushes it to the database. SBA dissolves the database from the hot path entirely, eliminating the apex of the triangle.

## Topology

```
┌──────────────────────────────────────────────────────┐
│                  Virtualized Middleware              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Messaging    │  │  Data Grid   │  │ Processing │  │
│  │   Grid       │  │ (replicated  │  │   Grid     │  │
│  │ (routing)    │  │   caches)    │  │ (instances)│  │
│  └──────────────┘  └──────────────┘  └────────────┘  │
│  ┌──────────────────────────────────────────────────┐│
│  │            Deployment Manager                    ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
  [Data Writers]             [Data Readers]
         │                          │
         ▼                          ▼
     [Database]               [Database]
```

**Four components of virtualised middleware:**

1. **Messaging grid**: routes incoming requests to an available processing unit; manages load balancing.
2. **Data grid** (replicated cache): maintains synchronisation of in-memory data across all processing unit instances. When one instance updates its cache, the data grid replicates the update to all other instances.
3. **Processing grid**: manages parallel request processing across multiple processing unit instances.
4. **Deployment manager**: spins up or shuts down processing unit instances based on load — the elasticity mechanism.

**Processing units**: the actual application logic, paired with an in-memory data cache.

**Data writers**: asynchronously flush updated cache entries to the database. Non-critical-path for request processing.

**Data readers**: load data into a processing unit's cache on startup or after a crash (cold cache warm-up).

## Data Pumps, Writers, and Readers

**Data pumps** are always asynchronous (messaging, FIFO-guaranteed). The processing unit that handles an update becomes the *owner of the update* and is responsible for sending it through the data pump. Data pumps carry contracts (add/delete/update action + only the changed fields, not the full record).

**Data writers** accept messages from data pumps and persist to the database. Two models: *domain-based* (one writer handles all updates for a domain, regardless of data pump granularity) vs *dedicated* (one writer per data pump — more components but better scalability and agility alignment). Implementation: service, application, or data hub (e.g., Ab Initio).

**Data readers** read from the database and deliver data to processing units via a reverse data pump. Invoked only in three specific situations: (1) crash of *all* instances of a named cache, (2) full redeployment of all processing units in a named cache, (3) retrieval of archive data not in the cache. Normally, when a new instance starts, it syncs directly from an existing live instance — no database involved.

**Third-party products**: GemFire, JavaSpaces, GigaSpaces, IBM Object Grid, nCache, Oracle Coherence. These vary significantly in cost and replication performance — establish specific goals before selecting a product.

**Data abstraction vs data access layer:** if cache schema matches the DB schema, it's a data access layer (coupling to table structure). If writers/readers contain transformation logic (buffering column type changes, dropped tables, restructured schemas), it's a **data abstraction layer** — preferred, because incremental DB changes don't require processing unit changes.

## Replicated vs Distributed Cache

- **Replicated cache**: every processing unit instance has a full copy of the data. A cache update is replicated to all instances. Fast reads from local memory; high fault tolerance (no single point of failure). Works well when data is relatively static and cache size is under ~100 MB.
- **Distributed cache**: data lives on a central external cache server. Processing units access it remotely. Better consistency (single source of truth) but higher latency and fault tolerance risk (central server failure renders all processing units non-operational; mirroring helps but adds complexity).

Neither model solves every problem. Use both within the same application based on data characteristics — replicated for reference/relatively static data, distributed for highly dynamic/consistency-critical data (e.g., inventory counts).

**Near-cache** (hybrid: distributed backing cache as "full cache" + in-memory front cache per processing unit): *not recommended* for space-based architecture. Front caches across instances diverge (each holds different data subsets), causing inconsistent responsiveness between processing units sharing the same data context.

**Data collisions**: when two processing unit instances update the same cache entry simultaneously (before replication completes), the last-write-wins, losing the other update. Collision rate formula:

```
CollisionRate = N × (UR² / S) × RL
```

Where: N = number of instances, UR = update rate (updates/ms, squared), S = cache size (rows), RL = replication latency (ms). Factors: N and RL are directly proportional; S is inversely proportional (smaller cache = more collisions). Key insight: reducing RL from 100ms to 1ms drops collision rate by 100×. Use 100ms as planning baseline; measure actual values in production.

## Cloud vs On-Premises

A distinctive feature of space-based architecture is the ability to split deployment: processing units and virtualized middleware in cloud (elastic, managed); databases on-prem (secure, compliant, physically controlled). The async data pump model makes cloud-to-on-prem data synchronisation effective. This hybrid topology is not practical in most other styles.

## When to Use

- Extreme scalability and elasticity requirements — the highest-rated style for these characteristics alongside EDA.
- Variable, high-spike workloads (concert ticket sales, online auction bidding, product launch flash sales). The deployment manager can pre-start instances before a known spike.
- Domain/architecture isomorphism: the problem is "a very large number of parallel processing units" (e.g., genome analysis, financial simulations).
- When the database is the known scalability bottleneck and cannot feasibly be scaled further.

**Implementation examples:** online concert ticketing (deployment manager pre-starts processing units before ticket sale begins; in-memory seat availability replicated across all instances) and online auction (per-auction processing units; async data pumps forward bid events to history/analytics services without affecting bidding latency).

**Not well suited for:** traditional large-scale relational database applications with large amounts of operational data — the in-memory footprint becomes impractical and the async persistence model conflicts with complex relational transaction requirements (→ [[sources/software-architecture-patterns]]).

## Architecture Characteristics Ratings

| Characteristic | Rating | Notes |
|----------------|--------|-------|
| Deployability | ★★★☆☆ | Processing units deploy independently; middleware is complex |
| Elasticity | ★★★★★ | Deployment manager auto-scales processing units on demand |
| Evolutionary | ★★☆☆☆ | Cache schema and replication topology are hard to change |
| Fault tolerance | ★★★☆☆ | Replication ensures no single unit is a single point of failure; complex failure modes |
| Modularity | ★★☆☆☆ | Processing units are large; shared cache data creates coupling |
| Overall cost | ★☆☆☆☆ | Most expensive style — in-memory grid infrastructure, licensing costs |
| Performance | ★★★★★ | All reads from in-memory cache; no database on the hot path |
| Reliability | ★★★☆☆ | Data writer failures can cause persistence lag |
| Scalability | ★★★★★ | Near-linear horizontal scaling via processing unit instances |
| Simplicity | ★☆☆☆☆ | Extremely complex — cache synchronisation, collision handling, data writer design |
| Testability | ★☆☆☆☆ | Very hard to test — distributed in-memory state, complex failure modes |

## Trade-offs

**Strengths:**
- Highest performance and scalability of any style — database is off the hot path.
- True elastic scaling: processing units can be added or removed in seconds.
- No single point of failure in the processing layer.

**Weaknesses:**
- The most expensive and complex architecture style.
- Testability is extremely poor — in-memory distributed state is difficult to reproduce and verify.
- Cache collision management adds significant design complexity.
- Data durability depends on the async data writer — a crash between a cache update and database flush can cause data loss.
- Not suitable for domains with complex transactional requirements across many entities.

## Quanta

Delineated through the association between user interfaces and processing units. Processing units that synchronously communicate with each other (or via the processing grid) are in the same quantum. The database is excluded from the quantum equation because processing units do not communicate with it synchronously — it is written to asynchronously via data pumps.

## Partitioning

**Both domain and technically partitioned.** Domain: processing units correspond to business domains. Technical: the processing unit / data pump / data reader / data writer / database layers form a technical stack analogous to n-tier, structured around caching vs persistence separation.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Covers all four middleware components; distinguishes replicated vs distributed cache; warns heavily on cost, complexity, and testability |
| [[sources/software-architecture-patterns]] | Earlier (2015) treatment — introduces the triangle-shaped scaling problem framing and names SBA's alternative label ("cloud architecture pattern"); characteristic ratings (agility/deployability/performance/scalability: high; testability/ease of development: low) are directionally consistent with FOSA; content superseded and expanded by FOSA |

## Related Pages

- [[distributed/replication]] — the cache replication model in SBA parallels database replication strategies
- [[styles/event-driven-architecture]] — shares extreme scalability/elasticity ratings; complementary for event processing
- [[comparisons/architecture-styles-comparison]] — side-by-side ratings
- [[styles/architecture-styles]] — overview and decision guide for all architecture styles

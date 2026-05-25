---
title: "Scalability"
type: concept
tags: [scalability, distributed-systems, architecture, performance, quality-attributes]
sources: [foundations-of-scalable-systems]
created: 2026-05-19
updated: 2026-05-19
---

# Scalability

## Definition

Scalability is the ability of a system to handle growth in some operational dimension — typically throughput (requests per unit time), data volume, stable response time under increasing load, or the capacity for analytics over growing datasets. A scalable system can accommodate growth by adding resources, and ideally can also scale *down* to reduce costs during low-demand periods.

## Why It Matters

Systems that are not architecturally designed to scale face exponential retrofit costs when scale is eventually needed. The foundations of scalability — stateless services, replication-friendly data designs, async decoupling — cannot easily be bolted on. Early decisions (framework choice, state management, data model) create strong path dependencies (→ [[sources/foundations-of-scalable-systems]] ch. 1).

## Two Universal Scaling Strategies

| Strategy | Mechanism | Example |
|----------|-----------|---------|
| **Replication** | Add instances of a resource to increase capacity | Add web server replicas behind a load balancer |
| **Optimisation** | Use existing resources more efficiently | Add a database index; rewrite hot path in a faster language; use caching |

Both strategies recur at every layer: service tier, caching tier, data tier, network (→ [[sources/foundations-of-scalable-systems]] ch. 1).

## Scale Up vs Scale Out

**Scale up (vertical scaling):** replace a resource with a more powerful one. Simple, no code changes, but has a hard upper bound and single point of failure. Good first step; carries a system surprisingly far.

**Scale out (horizontal scaling):** run multiple replicas of a resource. Requires stateless designs so any replica can serve any request. No theoretical upper bound on capacity additions. Failure of one replica degrades capacity but not availability (→ [[distributed/load-balancing]], [[sources/foundations-of-scalable-systems]] ch. 2).

## Stateless Services as an Enabling Condition

Scale-out only works if services are stateless: no per-session state lives in the service process. Any session state (shopping cart, auth token, user preference) must be externalised to a shared store (e.g., Redis). Without this, a load balancer must route all requests in a session to the same replica — sticky sessions — which eliminates the availability benefits of replication and complicates failure handling.

## Amdahl's Law

Serial code fractions set a hard ceiling on how much parallelism can help:

- 50% serial code → adding beyond ~8 CPU cores yields no further speedup
- 5% serial code → adding beyond ~2,048 CPU cores yields no further speedup

Implication: **multithreaded, parallel code is not a performance optimisation but a prerequisite for scalability.** Poorly threaded code cannot be made scalable by hardware alone (→ [[sources/foundations-of-scalable-systems]] ch. 2).

The same logic applies at the code level: **synchronised critical sections are the "serial fraction."** Keeping them as short as possible directly improves scalable throughput. This means: hold locks only for the minimum time necessary; prefer concurrent data structures (e.g., `ConcurrentHashMap` with per-shard locking) over coarse-grained locks that serialise the entire collection (→ [[sources/foundations-of-scalable-systems]] ch. 4).

**Thread pools** are the server-side mechanism for controlling parallelism: a fixed-size pool bounds the number of concurrent requests, preventing resource exhaustion (memory/CPU) while maximising utilization. Tuning pool size is a scalability lever. Underthreading leaves CPU idle; overthreading causes memory exhaustion and context-switch overhead (→ [[sources/foundations-of-scalable-systems]] ch. 4).

## Hyperscale

Hyperscale systems achieve exponential growth in computational and storage capabilities while costs grow only *linearly*. The canonical property is elastic scale-down as well as scale-up: Netflix scales down compute at 5am and up at 9pm. Physical infrastructure cannot do this; cloud software can (→ [[sources/foundations-of-scalable-systems]] ch. 1).

## Scalability Trade-Offs with Other Characteristics

Scalability cannot be optimised in isolation — it requires deliberate trade-offs with other quality attributes:

| Trade-off | Tension |
|-----------|---------|
| **Performance** | In-memory state caching speeds individual requests but consumes more memory per request, reducing the number of concurrent requests the system can handle |
| **Availability** | Replication for scalability also improves availability — but replicated *state* requires consistency management, which adds complexity and latency (→ [[distributed/consistency-models]], [[distributed/replication]]) |
| **Security** | TLS connection setup, encryption overhead, and auth checks reduce effective throughput; CIA triad's availability dimension creates DDoS exposure (→ [[distributed/tls]]) |
| **Manageability** | More components = more monitoring surface area; the only mitigation is automation and DevOps practices (→ [[operations/observability]]) |

> **Open question:** When should scalability be introduced? Gorton cautions that introducing distributed infrastructure before there is a clear requirement can create development inertia. This is consistent with evolutionary architecture — treat scalability as a just-in-time concern where fitness functions flag the tipping point before it becomes a crisis (→ [[sources/building-evolutionary-architectures]], [[concepts/fitness-functions]]).

## Architecture Evolution Pattern

Systems typically scale in a predictable sequence (→ [[sources/foundations-of-scalable-systems]] ch. 2):

1. **Monolith** — single app + DB; fine under light load
2. **Scale up** — larger hardware; simple, limited ceiling
3. **Scale out** — stateless replicas + load balancer + external session store
4. **Caching layer** — distributed cache (Redis/memcached) absorbs read traffic (→ [[distributed/caching]])
5. **Distributed database** — data tier splits horizontally (→ [[distributed/partitioning]], [[distributed/replication]])
6. **Multiple independent tiers** — each service scaled independently; BFF pattern for client-specific frontends
7. **Async decoupling** — queue-based write path wherever immediate persistence is not required (→ [[concepts/messaging]])

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/foundations-of-scalable-systems]] | Comprehensive practitioner treatment; replication + optimisation as universal strategies; Amdahl's Law; hyperscale; quality attribute trade-off framework |
| [[sources/fundamentals-of-software-architecture]] | Scalability and elasticity listed as distinct architecture characteristics; notes conflict with cost |
| [[sources/designing-data-intensive-applications]] | Focuses on scalability of data systems specifically: partitioning, replication, and the consistency trade-offs that follow |
| [[sources/understanding-distributed-systems]] | Treats scalability through replication and partitioning; strong emphasis on the consistency implications |

## Related Concepts

- [[distributed/load-balancing]] — mechanism for distributing load across replicas
- [[distributed/caching]] — primary optimisation strategy for read-heavy workloads
- [[distributed/replication]] — data-tier scalability; the consistency trade-off
- [[distributed/partitioning]] — data-tier scalability; sharding to distribute load
- [[concepts/architecture-characteristics]] — scalability in the quality attribute taxonomy
- [[distributed/consistency-models]] — what replication for scalability costs
- [[concepts/messaging]] — async queueing as a scalability pattern
- [[operations/observability]] — required to identify bottlenecks and guide scaling decisions
- [[distributed/serverless]] — managed auto-scaling model where the cloud provider handles scale-out

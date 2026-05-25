---
title: "Caching"
type: concept
tags: [scalability, performance, http, consistency, distributed-systems]
sources: [understanding-distributed-systems, foundations-of-scalable-systems]
created: 2026-05-14
updated: 2026-05-19
---

# Caching

Caching stores the result of an expensive operation (network call, database query, computation) closer to the consumer so that subsequent requests can be served without repeating the work. It is the single highest-leverage scalability technique for read-heavy workloads.

## HTTP Caching

HTTP caching applies to **safe methods** (GET, HEAD) — methods that don't alter server state. Unsafe methods (POST, PUT, DELETE) cannot be cached because the request *is* the side effect.

### Server → Cache Contract (Response Headers)

| Header | Purpose |
|--------|---------|
| `Cache-Control: max-age=N` | Cache this response for N seconds (TTL) |
| `Cache-Control: immutable` | Never revalidate — the content will never change at this URL |
| `Cache-Control: no-store` | Do not cache at all |
| `ETag: "version-id"` | Version identifier for conditional requests |

### Cache Lifecycle: Fresh vs Stale

1. **First request**: cache misses, fetches from origin, stores response + headers.
2. **Within TTL (fresh)**: cache returns the stored response immediately — no network call.
3. **After TTL (stale)**: cache sends a conditional GET to the origin with `If-None-Match: "version-id"`.
   - Origin returns **304 Not Modified** if unchanged → cache extends TTL, serves stored response.
   - Origin returns **200 OK + new content** if updated → cache stores new response.

### Immutable Static Resources

Static resources (JavaScript bundles, CSS, images) change rarely. Best practice:

- Set `Cache-Control: max-age=31536000, immutable` (1-year TTL, the HTTP spec maximum).
- When the resource changes, **change its URL** — embed a content hash in the filename (e.g., `app.a3c4f2.js`). Clients are forced to fetch it as a new resource.
- **Atomic updates**: the HTML index file references the new hashed URLs. A client either sees the old index (→ old JS/CSS URLs) or the new index (→ new JS/CSS URLs), but never a mix. This makes multi-file deployments atomic without any additional infrastructure.

This is a practical instance of the **CQRS** pattern (→ [[streams/event-sourcing-cqrs]]): the read path (GET) and write path (POST/PUT/DELETE) are treated differently. Reads are served from cache; writes go to origin and invalidate or version the cached resource.

### Consistency Trade-off

HTTP caching trades consistency for performance. A client may serve a stale version for up to the TTL period even if the origin has updated. For static resources with URL versioning, staleness is bounded; for dynamic resources, it depends on the chosen TTL.

## Reverse Proxies (Server-Side HTTP Cache)

A **reverse proxy** is a server-side intermediary that intercepts all client-to-server traffic. Clients cannot distinguish the proxy from the origin server.

As a cache, a reverse proxy is **shared across all clients** — far more effective than client-side caches, which are private per user.

Additional capabilities of a reverse proxy:
- **Authentication**: verify credentials before forwarding to backend
- **Compression**: compress responses to reduce transfer time
- **Rate limiting**: protect the origin from traffic spikes
- **Load balancing**: distribute requests across multiple backend instances

Common implementations: NGINX, HAProxy. In practice, most of these use cases have been commoditized by managed CDN services (→ [[distributed/cdn]]).

## Application-Layer Caching

Application-layer caching sits between the application and the data store. A cache is a high-speed storage layer (typically in-memory) that buffers responses from an origin so that future requests can be served without repeating the work. It provides only best-effort guarantees — its state is disposable and can be rebuilt from the origin.

### When Caching Helps

Hit ratio is the fraction of requests served directly from the cache. It depends on:
- **Universe of cacheable objects**: fewer distinct objects → higher hit ratio.
- **Access locality**: how often the same objects are re-requested.
- **Cache size**: larger cache accommodates more hot objects.

Rule of thumb (→ [[sources/foundations-of-scalable-systems]] ch. 2): handling **80%+ of reads from cache** extends database capacity dramatically — the database never sees the majority of traffic. This is the threshold worth designing toward for read-heavy workloads.

**Caching is an optimisation, not a scalability substitute.** The origin (data store) must survive at full traffic without the cache — just more slowly. If the cache becomes unavailable and the origin falls over, the system is fragile by design.

Rule of thumb: the higher in the call stack that caching is applied, the more downstream resources are saved. Client-side HTTP caching (→ above) saves the most; application-layer caching in front of a database is next.

### Caching Pattern Taxonomy

| Pattern | Reads | Writes | Failure behaviour |
|---------|-------|--------|-------------------|
| **Cache-aside** | App checks cache; on miss, fetches from DB and populates cache | App writes directly to DB; cache entry invalidated or allowed to expire | Cache failure → graceful degradation; all requests go to origin |
| **Read-through** | App reads from cache only; cache fetches from DB on miss via a loader | App writes directly to DB | Cache failure → origin unreachable (tight coupling) |
| **Write-through** | App reads from cache | App writes to cache; cache synchronously writes to DB | Low risk of data loss; write latency = DB write latency |
| **Write-behind** (write-back) | App reads from cache | App writes to cache; cache asynchronously writes to DB | Possible data loss if cache crashes before DB write completes |

**Cache-aside is the primary pattern in massively scalable systems** because it is resilient to cache failure (a cache miss is handled gracefully without the cache being available), and it scales easily (Redis/memcached are simple distributed hash tables with no write-path coupling). Read-through/write-through simplify application logic but couple the write path to the cache (→ [[sources/foundations-of-scalable-systems]] ch. 6).

### Side Cache vs Inline Cache

| Type | Mechanism | Example |
|------|-----------|---------|
| **Side cache** (cache-aside) | Application fetches from cache; on miss, fetches from origin and populates cache | Redis accessed explicitly by application code |
| **Inline cache** | Cache intercepts requests transparently; fetches from origin on miss without application involvement | HTTP caching, CDN |

### Eviction and Expiration

**Eviction policy**: when the cache is full, entries must be removed. Least Recently Used (LRU) is the most common — evict the entry that hasn't been accessed in the longest time.

**TTL-based expiration**: each cached object has a time-to-live. After the TTL, the object is stale. Trade-off: longer TTL → higher hit ratio but greater staleness risk.

**Deferred expiry**: rather than evicting an object the moment its TTL expires, the cache can serve the stale object and defer fetching a fresh one until the next request. If the origin is temporarily unavailable, this is more resilient than returning an error.

**Cache invalidation is hard.** TTL is a workaround, not a solution. To invalidate a query result precisely, every data change that could affect that query must trigger invalidation — which can span thousands of records. In practice, TTL is accepted as the trade-off.

### Local (In-Process) Cache

A local cache is co-located with the application process — typically an in-memory hash table.

**Advantages**: no network call; lowest possible latency.

**Disadvantages**:
- Duplicated across processes — N application instances each hold their own copy; total cache size doesn't grow with N.
- Inconsistency: two instances may hold different versions of the same object simultaneously.
- **Thundering herd**: when a cache is cold (process restart, new popular object), all instances simultaneously miss on the same key and hammer the origin. Mitigation: **request coalescing** — at any given time, at most one outstanding request per object per process. Subsequent requests for the same key wait for the first to complete and share the result.

### External (Out-of-Process) Cache

An external cache is a dedicated, shared caching service — typically in-memory.

**Advantages**:
- Shared across all application instances — a single version of each object; fewer origin requests regardless of how many clients exist.
- Scalable: can be scaled via replication (leader-follower) and partitioning (consistent hashing). When the cache is rebalanced (node added/removed), consistent hashing minimises the number of keys that must move.

**Disadvantages**:
- Network call required — higher latency than a local cache.
- Operational overhead: another service to deploy, monitor, and maintain.
- **Cascading failure risk**: if the external cache becomes unavailable, all clients simultaneously fall back to the origin. An origin sized for cached-hit traffic can be overwhelmed. Defence: keep a local in-process cache as a fallback layer; ensure the origin has load-shedding in place.

Common implementations: **Redis** (supports partitioning and replication), **Memcached** (simpler, no replication). Both are available as managed services on AWS and Azure.

## Related Pages

- [[distributed/cdn]] — CDN extends HTTP caching to a geographically distributed overlay network
- [[distributed/http]] — HTTP/2 and HTTP/3 affect caching efficiency (connection reuse, multiplexing)
- [[distributed/consistency-models]] — caching sacrifices consistency for performance
- [[streams/event-sourcing-cqrs]] — CQRS: read and write paths treated differently
- [[distributed/idempotency]] — idempotent reads are safe to cache; non-idempotent writes are not
- [[reference/technology-glossary]] — NGINX, CDN, Redis entries
- [[distributed/load-balancing]] — reverse proxies also serve as L7 load balancers; same infrastructure

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 14) — HTTP caching headers, fresh/stale lifecycle, immutable static resources, CQRS connection, reverse proxies.
- (→ [[sources/understanding-distributed-systems]] ch. 20) — application-layer caching: hit ratio, side vs inline cache, eviction, TTL, local vs external cache, thundering herd, cascading failure.
- (→ [[sources/foundations-of-scalable-systems]] ch. 2) — distributed caching (Redis/memcached) as the primary scale-out technique for database relief; 80% read hit ratio as the scalability threshold; cache-aside as the standard pattern in a tiered service architecture.

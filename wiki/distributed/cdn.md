---
title: "Content Delivery Networks (CDNs)"
type: concept
tags: [scalability, networking, caching, performance, distributed-systems]
sources: [understanding-distributed-systems]
created: 2026-05-14
updated: 2026-05-14
---

# Content Delivery Networks (CDNs)

A CDN is an overlay network of geographically distributed caching servers (reverse proxies) that reduces response time for clients and load on origin servers. Its primary benefit is **the network itself**, not just the cache. (→ [[sources/understanding-distributed-systems]])

## The Underlying Problem: BGP's Limitations

The internet's core routing protocol, BGP, was designed for **correctness** (reliable path discovery), not **performance**. BGP routes primarily on **hop count**, ignoring latency and congestion. This means the path BGP selects between two endpoints is often not the lowest-latency or highest-bandwidth path. (→ [[sources/understanding-distributed-systems]])

Additionally, physical network latency is bounded below by the speed of light: a client on one side of the world talking to an origin on the other will see >100 ms of latency no matter how fast the machines are. This is irreducible without moving computation closer to the client.

## The CDN Solution: Overlay Network

A CDN builds an **overlay network** on top of the internet — its own routing layer with different path-selection algorithms:

- **Latency/congestion-aware routing**: CDN backbone links are monitored continuously; traffic is routed around congestion and high-latency paths.
- **TCP optimizations**: persistent connection pools between CDN servers eliminate per-connection setup overhead; TCP window sizes are tuned for maximum bandwidth.
- **Internet Exchange Point (IXP) placement**: CDN servers are co-located at IXPs, where ISPs interconnect. Traffic from origin to client flows almost entirely over CDN-controlled links; only the last mile uses the public internet.

## Client Routing: Global DNS Load Balancing

When a client resolves a CDN URL, the DNS response returns the address of the **closest CDN cluster**, taking into account:
- Client IP geolocation
- Current cluster health
- Network congestion toward each cluster

This is called **global DNS load balancing** — an extension to standard DNS that makes routing decisions based on real-time network state.

## Caching Architecture

CDN caching is typically hierarchical:

```
Client → Edge cluster (geographically near client)
              ↓ (on miss)
         Intermediary caching cluster (regional)
              ↓ (on miss)
         Origin server
```

**Edge clusters** are deployed in many geographic locations. High coverage = more clients served locally, but more clusters = lower **cache hit ratio** (each cluster caches a smaller fraction of total content).

**Intermediary clusters** exist at fewer locations and cache more of the total content. They absorb misses from multiple edge clusters, reducing origin load significantly.

**Within a cluster**: content is partitioned (sharded) across multiple servers — no single server can hold all content.

Cache expiry follows the same HTTP semantics as client-side caching: `Cache-Control`, `ETag`, `If-None-Match` (→ [[distributed/caching]]).

## Dynamic Content and DDoS Shielding

CDNs are not limited to static content. Even for **dynamic content that cannot be cached**, the CDN overlay network reduces latency by routing requests efficiently to the origin.

In this mode, the CDN acts as a **DDoS shield**: volumetric attack traffic hits the CDN's distributed edge capacity (spread across hundreds of PoPs) rather than the origin. The CDN absorbs or filters the traffic before it reaches the backend.

## Trade-offs

| Concern | Implication |
|---------|-------------|
| Cache hit ratio vs. coverage | More edge clusters = better geographic coverage but lower hit ratio; intermediary clusters help |
| Content freshness | CDN respects TTLs, but cache purges (on deploy) must be explicitly triggered |
| Cost | CDN traffic is metered; high-volume static assets are cheap per GB; origin-touching dynamic traffic is more expensive |
| Consistency | CDN edge caches may serve stale content up to TTL; combine with URL versioning for correctness |

## Well-Known CDNs

- **AWS CloudFront** — tightly integrated with AWS origin services
- **Akamai** — oldest and most widely deployed; historically dominant for media delivery
- **Cloudflare** — strong DDoS mitigation and DNS integration; also functions as a reverse proxy

(→ [[reference/technology-glossary]] for brief entries on each)

## Related Pages

- [[distributed/caching]] — HTTP caching mechanics that CDN edge servers implement
- [[distributed/dns]] — global DNS load balancing routes clients to the nearest CDN cluster
- [[distributed/http]] — CDN benefits from HTTP/2 multiplexing and persistent connections
- [[operations/availability]] — CDN improves availability via geographic redundancy and DDoS absorption

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 15) — overlay network, BGP limitations, global DNS load balancing, IXP placement, caching layers, dynamic content/DDoS shield, cache hit ratio vs. coverage trade-off.

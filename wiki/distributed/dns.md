---
title: "DNS (Domain Name System)"
type: concept
tags: [networking, distributed-systems, discovery, consistency, availability]
sources: [understanding-distributed-systems]
created: 2026-05-14
updated: 2026-05-14
---

# DNS (Domain Name System)

## Definition

DNS is a **distributed, hierarchical, and eventually consistent key-value store** that maps human-readable hostnames to IP addresses. It is how processes discover each other's network location — the "phone book of the internet." (→ [[sources/understanding-distributed-systems]] ch. 4)

## Why It Matters

Before any TCP connection can be opened, the client must resolve the target hostname to an IP address. DNS is therefore on the critical path of every networked request. Its availability, consistency model, and caching behaviour have direct consequences for system resilience and latency.

## Resolution Process

DNS resolution is iterative, not recursive at the client:

1. **Browser cache** — the browser checks whether it has recently resolved this hostname.
2. **OS / ISP resolver** — if not cached, the query goes to a DNS resolver (typically provided by the ISP). The resolver checks its own cache.
3. **Root name server (root NS)** — maps the top-level domain (TLD) to the address of the TLD name server. The address of root name servers is all that's needed to bootstrap resolution.
4. **TLD name server** — maps the domain (e.g., `example.com`) to the address of the authoritative name server for that domain.
5. **Authoritative name server** — maps the full hostname (e.g., `www.example.com`) to an IP address.

If the query contains a subdomain, the authoritative name server returns the address of a sub-domain name server and an additional request is required.

The beauty of this design: only the addresses of root name servers need to be hard-coded. Everything else is discovered by iterative delegation.

## Caching and TTL

Because the resolution process involves multiple round trips, caching is essential. Browsers, operating systems, and resolvers all cache DNS results. Every DNS record has a **TTL (time to live)** that specifies how long caches should treat the entry as valid.

**TTL is a trade-off:**

| Short TTL | Long TTL |
|-----------|----------|
| Faster propagation of changes | Changes propagate slowly |
| Higher load on name servers | Lower resolver load |
| More latency on cache misses | Lower average response time |
| More clients impacted if NS goes down | Fewer clients impacted per NS failure |

There is no guarantee clients will respect the TTL — some clients serve stale entries long after expiry. After changing a DNS record, expect a small tail of clients using the old address.

## DNS as a Single Point of Failure

If the authoritative name server is unavailable and the TTL has expired, clients cannot resolve the hostname and cannot connect to the application — a complete outage.

**Static stability** is the mitigation: caches should serve stale DNS entries when they cannot reach the name server, rather than refusing resolution entirely. Since DNS entries rarely change, a stale IP is almost always better than no IP. (→ [[sources/understanding-distributed-systems]] ch. 4; the static stability principle is explored further in the resiliency section of the book.)

## Eventual Consistency

DNS is **eventually consistent**. When you update a DNS record, different clients and resolvers will see the change at different times depending on their cached TTL and when they next query. This is a deliberate design choice — DNS prioritises availability and partition tolerance over consistency. It is arguably the most widely used eventually-consistent distributed system in existence.

## Security: DNS over TLS

The original DNS protocol transmitted plain-text messages over UDP. Anyone monitoring the network could observe which hostnames a client was resolving. The industry has largely moved to **DNS over TLS (DoT)** and **DNS over HTTPS (DoH)** for encrypted hostname resolution. (→ [[sources/understanding-distributed-systems]] ch. 4)

## Practical Implications for System Design

- **Lowering TTL before a migration**: reduce TTL days in advance so clients will pick up the change quickly when you cut over.
- **Automation for name server resilience**: use multiple geographically distributed authoritative name servers with anycast routing to avoid DNS becoming a SPOF.
- **Service discovery in microservices**: Kubernetes and similar platforms run internal DNS resolvers (e.g., CoreDNS) that map service names to cluster-internal IPs, applying the same model at the infrastructure layer. (→ [[styles/microservices-architecture]])

## Related Concepts

- [[distributed/tls]] — DNS over TLS secures the resolution process
- [[distributed/http]] — HTTP connections depend on prior DNS resolution
- [[distributed/consistency-models]] — DNS is a canonical example of eventual consistency in production
- [[operations/availability]] — DNS availability directly determines whether clients can reach any service
- [[patterns/circuit-breaker]] — DNS failure is one scenario where circuit breakers need to handle connection refusals

## Key Quotes

> "DNS could be a lot more robust to failures if DNS caches would serve stale entries when they can't reach a name server, rather than treating TTLs as time bombs." (→ [[sources/understanding-distributed-systems]] ch. 4)

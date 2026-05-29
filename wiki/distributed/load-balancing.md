---
title: "Load Balancing"
type: concept
tags: [distributed-systems, scalability, availability, networking, load-balancing]
sources: [understanding-distributed-systems, foundations-of-scalable-systems, site-reliability-engineering]
created: 2026-05-14
updated: 2026-05-29
---

# Load Balancing

A load balancer distributes requests across a pool of servers to increase capacity and availability. Clients interact with the load balancer's address; individual servers are invisible to them. This decoupling enables horizontal scaling (add more servers) and automatic failure handling (remove failed servers from the pool).

## Key Claims

- **The nines add up for independent servers.** Two 99% servers behind a balancer give 99.99% (1 − 0.01²). The maths is theoretical — correlated failures and slow failure detection erode the gain — but the principle drives every redundancy decision.
- **L4 vs L7 is a capability-vs-overhead trade.** L4 (TCP-level, VIP + consistent hash) is fast but can't see HTTP; L7 (reverse proxy) terminates TLS, routes on headers, rate limits, but adds latency. Typical production stack: L4 in front to absorb DDoS, L7 behind for application routing.
- **Power of two choices beats actual load tracking.** Polling backend load introduces oscillation (fresh server reports 0, gets hammered, reports overloaded, gets nothing). Picking two backends at random and routing to the less loaded is near-optimal with no coordination.
- **Sticky sessions create hotspots.** Sessions vary in cost; consistent hashing on session ID concentrates the expensive ones on individual backends. Externalise session state instead.
- **Health checks have failure modes.** Mass-failure of health endpoints (misconfigured `/health`) makes a naive balancer empty the pool entirely. Detect mass failure as "checks unreliable" rather than as "everything down."
- **Lame duck state is the graceful-shutdown discipline.** Backend signals "draining" via the health endpoint, completes in-flight requests, then exits. Zero-downtime rolling deploys without blue-green infrastructure.
- **DNS load balancing is for geographic steering, not failure handling.** TTL caching and 512-byte reply limits prevent failure-aware fine-grained routing. EDNS0 client subnet extension reveals the actual client location to authoritative resolvers.

## Availability Benefit

With N independent servers behind a load balancer, the application is unavailable only when all servers are unavailable simultaneously. The probability of that is the product of each server's failure rate. As a rule of thumb: **the nines of independent servers add up**.

Example: two servers each with 99% availability (two nines):
```
1 − (0.01 × 0.01) = 0.9999  →  99.99% (four nines)
```

Caveat: this is theoretical. In practice the load balancer doesn't remove failed servers instantly, failure rates may be correlated (e.g., a shared dependency fails), and surviving servers may not absorb the traffic spike when one is removed.

## DNS Load Balancing

The simplest approach: add multiple server IP addresses to a DNS A record. Clients pick one when resolving the hostname.

**Limitations**:
- Failures are not handled — the DNS server keeps serving failed IPs until the record is manually updated.
- Even after a DNS update, changes take time to propagate due to TTL caching (→ [[distributed/dns]]).
- DNS replies must fit within 512 bytes (RFC 1035), limiting the number of addresses per reply.
- Recursive resolvers sit between clients and authoritative nameservers: the authoritative server sees the resolver's IP, not the client's, so geographic optimisation targets the resolver's location rather than the user's. The EDNS0 client subnet extension (supported by major resolvers) includes the client's subnet in the query to enable true client-side optimisation.
- Recursive resolvers cache responses up to the TTL, so a single authoritative reply may be forwarded to thousands of users. This makes it impossible to control exactly how many users receive each reply. (→ [[sources/site-reliability-engineering]] ch. 19)

**Practical use**: global traffic steering to different data centres or CDN clusters (global DNS load balancing). Not suitable for fine-grained, failure-aware routing within a data centre. Large-scale DNS load balancers integrate with global control systems to track capacity, health, and geographic distribution per resolver.

## L4 Load Balancing (Transport Layer)

A Layer 4 load balancer operates at the TCP level. Clients open a TCP connection to the load balancer's **virtual IP (VIP)**; the load balancer forwards the packets to a backend server transparently via address translation.

A VIP is not assigned to a specific network interface — it is shared across many load balancer instances. From the user's perspective it is a single stable IP regardless of how many backends sit behind it.

**Connection assignment**: consistent hashing on the connection 4-tuple (source IP/port, destination IP/port) ensures all packets in a connection go to the same server. Minimises disruption when servers are added or removed. The simpler `id(packet) mod N` formula causes almost all connections to remap when N changes (one backend added or removed) — consistent hashing avoids this. (→ [[sources/site-reliability-engineering]] ch. 19)

**Direct server return (DSR)**: because outbound traffic (responses) is typically larger than inbound, servers can be configured to reply directly to the client rather than through the load balancer, significantly reducing load balancer throughput requirements. DSR is stateless at the load balancer.

**GRE encapsulation**: DSR using layer-2 (MAC address rewriting) requires all load balancers and backends to be in the same broadcast domain — a constraint that becomes impractical at scale. Using GRE (Generic Routing Encapsulation) wraps the forwarded packet in a new IP packet addressed to the backend. Backends strip the outer IP+GRE layer and process the inner packet normally. The load balancer and backends can now be in different network segments or even different regions. Overhead: 24 bytes per packet (IPv4+GRE), which may require a larger internal MTU or fragmentation. (→ [[sources/site-reliability-engineering]] ch. 19)

**Horizontal scaling**: L4 load balancers can be scaled out using **Anycast + ECMP** (Equal-Cost Multi-Path). Multiple load balancer instances announce the same Anycast IP address to edge routers. Routers distribute packets across instances using equal-cost multi-path consistent hashing, keeping packets of a single connection on the same load balancer instance.

**Limitation**: operates at the byte level — no visibility into HTTP semantics. Cannot terminate TLS, route based on request headers, or rate-limit individual requests.

Managed: AWS Network Load Balancer, Azure Load Balancer.

## L7 Load Balancing (Application Layer)

A Layer 7 load balancer is an HTTP reverse proxy. It maintains two TCP connections — one with the client and one with a backend server — and routes individual HTTP requests between them.

**Capabilities**:
- **TLS termination**: clients connect with TLS; the load balancer decrypts and forwards as plain HTTP (or re-encrypts). Backends don't need to manage certificates.
- **Sticky sessions**: use a cookie to identify a logical session and route it consistently to the same backend via consistent hashing. Allows backends to cache session state in memory.
- **Per-request routing**: route based on URL path, headers, or method (e.g., send `/api/*` to backend A, `/static/*` to CDN).
- **Rate limiting**: enforce per-client or per-endpoint request caps before requests reach the backend.
- **HTTP/2 multiplexing**: de-multiplex concurrent streams that share a single TCP connection; route each stream independently.

**Sticky session caveat**: sessions vary widely in cost. Stickiness concentrates expensive sessions on individual backends, creating hotspots.

**Deployment pattern**: L7 load balancers are typically deployed behind an L4 load balancer for internet-facing traffic. The L4 layer absorbs volumetric DDoS attacks (e.g., SYN floods) before traffic reaches the L7 layer.

Common implementations: NGINX, HAProxy, Envoy.

## Elasticity (Autoscaling)

Elasticity is the capability to dynamically provision new capacity as load grows and decommission it as load drops. It requires the load balancer to be integrated with application monitoring:

- **Scale-out trigger**: policy fires when a metric (e.g., average CPU > 70%) is exceeded across all instances — new replicas are started and added to the pool after a warmup period.
- **Scale-in trigger**: policy fires when metric drops below a threshold (e.g., CPU < 40%) — idle replicas are stopped.
- **Schedule-based scaling**: for predictable diurnal patterns, scale at fixed times (e.g., up at 6pm Thursday, down at noon Sunday for a weekend events guide).

AWS Auto Scaling Groups provide a canonical implementation: minimum and maximum instance counts bound the pool size; the load balancer maintains the minimum and never exceeds the maximum. A warmup period prevents new instances from being sent traffic before they are ready.

(→ [[sources/foundations-of-scalable-systems]] ch. 5)

## Service Discovery

A load balancer needs to know which backend servers are available. Static configuration files are brittle. The standard approach:

1. A fault-tolerant coordination service (etcd, ZooKeeper) maintains the live server list.
2. When a server comes online, it registers itself with a **TTL**.
3. When the server shuts down gracefully, it deregisters. If it crashes, the TTL expires and the coordination service removes it automatically.

This mechanism underpins **autoscaling**: cloud providers provision new servers in response to load, which register themselves dynamically, and the load balancer discovers them without manual intervention.

## Health Checks

**Passive health check**: the load balancer infers health from real traffic. If a request times out or returns a non-retriable error (e.g., 503), the server is marked unhealthy and temporarily removed from the pool. No extra overhead — health detection piggybacks on real requests.

**Active health check**: servers expose a dedicated `/health` endpoint. The load balancer polls it periodically. The endpoint returns 200 OK if healthy, 5xx or timeout if not.

**Graceful rolling deploys**: a server signals unavailability before restart by returning 5xx from the health endpoint. The load balancer drains in-flight requests, then stops sending new ones. After restart, the server signals readiness and rejoins the pool. Zero-downtime deploys without a blue-green environment.

**Watchdog pattern**: a background thread within each server monitors local resource metrics (available memory, CPU, request queue depth). When a metric breaches a threshold, the watchdog deliberately crashes or restarts the server. This self-healing approach handles rare degraded states (e.g., slow memory leaks) without complex recovery logic in the main application.

**Health check failure cascade**: if a misconfigured health endpoint causes all servers to fail checks simultaneously, a naive load balancer empties the pool and takes the application down. A robust load balancer detects the mass-failure signal, treats the health checks as unreliable, and keeps routing traffic to the pool rather than removing all servers.

## Lame Duck State

Rather than stopping immediately when shutting down, a backend should enter **lame duck state**: it continues to accept connections and complete in-flight requests, but signals all connected clients to stop sending new requests. Inactive clients also receive the signal via periodic UDP health checks.

Benefits: (1) avoids serving errors to requests that were in-flight when shutdown began; (2) enables clean rolling deploys without user-visible errors; (3) allows backends in warm-up phase (e.g., JIT compilation) to delay receiving traffic until performance is nominal. (→ [[sources/site-reliability-engineering]] ch. 20)

Shutdown sequence: receive SIGTERM → enter lame duck state → broadcast to clients → drain in-flight requests → exit cleanly.

## Subsetting

In large systems, each client process maintains long-lived connections to a subset of backends (typically 20–100 rather than all). Benefits: bounds memory and CPU overhead for connection maintenance; reduces health-check traffic.

**Random subsetting fails at scale**: at a 10% subset size, the most loaded backend receives ~150% of the average and the least receives ~50%. To achieve uniform distribution with random subsetting, subset sizes of ~75% are needed — defeating the purpose.

**Deterministic subsetting**: divide client tasks into "rounds"; within each round, each backend is assigned to exactly one client. Different rounds use different random shuffles (so a failing backend's load spreads across different backend subsets, not the same N backends). Result: nearly perfectly uniform connection distribution, with at most a difference of 1 connection per backend.

The subset size depends on: ratio of clients to backends; burst behaviour (clients with frequent large fan-outs need larger subsets). (→ [[sources/site-reliability-engineering]] ch. 20)

## Load Balancing Algorithms

| Algorithm | How it works | Best for |
|-----------|-------------|----------|
| Round-robin | Rotate through servers in order | Uniform request cost |
| Least-connections | Route to server with fewest active connections | Variable request cost |
| Consistent hashing | Hash of request attribute → fixed server | Session stickiness, cache affinity |
| **Power of two choices** | Pick two servers at random; route to the less loaded one | Load-aware routing without oscillation |
| **Weighted round robin** | Backends report QPS, error rate, and CPU utilisation in response/health-check headers; clients adjust per-backend capability scores and route proportionally | Large services with machine diversity and variable query cost; reduces spread from ~2× to near-uniform |

**Power of two choices** deserves emphasis. Tracking actual server load via polling introduces delay — a freshly joined server reports load 0 and gets hammered until the next poll; then it reports overloaded and receives nothing. The system oscillates. Randomly picking two servers and routing to the lesser-loaded one avoids this entirely: it requires no polling, naturally distributes load, and is mathematically near-optimal for most distributions. (→ [[sources/understanding-distributed-systems]] ch. 18)

**Least-connections sinkhole pitfall**: a fast-failing unhealthy backend appears to have few active requests (errors are cheap to return). The load balancer interprets this as "lightly loaded" and floods it with new requests, which also fail quickly, making the problem worse. Fix: count recent errors as active requests in the routing decision — a backend that is fast-failing will accumulate a high effective load and be bypassed. (→ [[sources/site-reliability-engineering]] ch. 20)

## Client-Side Load Balancing (Sidecar)

When clients are internal (service-to-service calls), a dedicated load balancer is not required. Instead, each client runs a **sidecar proxy** that acts as a local L7 load balancer. The sidecar discovers available servers via the coordination service and routes outbound requests across them.

Advantages: eliminates the load balancer as a single point of failure; removes the centralised bottleneck; polyglot — works regardless of service language.

Disadvantages: every client needs a sidecar and the collection requires a control plane to manage configuration. This is the service mesh model. (→ [[patterns/sidecar-service-mesh]])

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/understanding-distributed-systems]] | DNS LB, L4 and L7 mechanics, service discovery via coordination service, health checks, watchdog, power of two choices, sidecar as client-side LB (ch. 18) |
| [[sources/foundations-of-scalable-systems]] | Load balancer as the enabling mechanism for scale-out; stateless services as the prerequisite — any per-session state must be stored externally so the load balancer can route freely; scale-out as the transition from the monolith bottleneck once vertical scaling is exhausted (ch. 2) |
| [[sources/site-reliability-engineering]] | Multi-level approach: DNS geographic steering → VIP → datacenter internal. DNS: recursive resolver hides client IP; EDNS0 extension; TTL floor; 512-byte limit. VIP: consistent hashing; GRE encapsulation for cross-segment DSR (ch. 19). Datacenter: lame duck state for graceful shutdown; deterministic subsetting for uniform connection distribution; weighted round robin; least-connected sinkhole pitfall (ch. 20) |

## Related Concepts

- [[distributed/dns]] — DNS LB limitations; TTL propagation as the failure-detection barrier
- [[distributed/cdn]] — CDNs use global DNS LB for geographic traffic steering
- [[distributed/partitioning]] — consistent hashing used both for partition assignment and connection routing in L4 LBs
- [[operations/availability]] — availability improvement formula; the nines add up
- [[distributed/failure-detection]] — health checks are an application of failure detection
- [[patterns/sidecar-service-mesh]] — client-side L7 load balancing via sidecar proxy
- [[patterns/circuit-breaker]] — complementary pattern to load balancing for downstream resiliency

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 18) — DNS LB, L4, L7, service discovery, health checks, power of two choices.
- (→ [[sources/foundations-of-scalable-systems]] ch. 2) — load balancer as the stateless scale-out enabler; stateless services requirement; session state externalisation.
- (→ [[sources/site-reliability-engineering]] ch. 19) — multi-level LB architecture; DNS limitations and EDNS0; VIP consistent hashing; GRE encapsulation.

---
title: "Fallacies of Distributed Computing"
type: concept
tags: [distributed-systems, networking, microservices]
sources: [fundamentals-of-software-architecture]
created: 2026-05-14
updated: 2026-05-14
---

# Fallacies of Distributed Computing

## Definition

The eight fallacies of distributed computing are false assumptions that developers and architects commonly make about distributed systems. They were first articulated by L. Peter Deutsch and colleagues at Sun Microsystems in 1994. Each fallacy describes something that seems true (or is hoped to be true) but is reliably not.

Understanding the fallacies is a prerequisite for any distributed architecture decision. They represent fixed structural costs that cannot be engineered away — only designed around. Every additional service call in a distributed architecture incurs these costs; monolithic architectures avoid most of them at the cost of other trade-offs.

(→ [[sources/fundamentals-of-software-architecture]] Ch 9)

## The Eight Fallacies

### Fallacy 1: The Network Is Reliable

Networks fail. They fail in obvious ways (service unreachable) and subtle ways (request sent, no response received — was it processed?). The more a system relies on the network — the more services it makes calls to — the more it is exposed to network failures. This is why circuit breakers, timeouts, and retry logic exist between services.

The consequence: latency and reliability assumptions must be explicit, not implicit. Every synchronous service call is a potential failure point.

### Fallacy 2: Latency Is Zero

Local calls are measured in nanoseconds or microseconds. Remote calls over REST, messaging, or RPC are measured in milliseconds. The gap is orders of magnitude.

**What architects must know:**
- The average round-trip latency for RESTful calls in production (e.g., 60ms? 500ms?)
- The p95 and p99 latency — the "long tail" matters more than the average. An average of 60ms with a p99 of 400ms will cause perceived unreliability.
- Chained calls multiply latency: 10 sequential service calls at 100ms each = 1,000ms added to the request.

This fallacy is especially severe for microservices, where fine-grained services may chain many calls to fulfil a single business operation. Architects must measure and budget latency explicitly before committing to a distributed style.

### Fallacy 3: Bandwidth Is Infinite

In a monolith, all data processing happens in the same process — bandwidth is not a concern. In distributed architectures, every inter-service call consumes bandwidth. The two problems:

1. **Stamp coupling:** services send more data in a call than the consumer needs. A wish-list service calls a customer profile service that returns 45 fields (500 KB) when only the customer's name (200 bytes) is needed. At 2,000 requests/second, this single inter-service call consumes 1 GB of bandwidth.

2. **Aggregate bandwidth:** hundreds of inter-service calls in a busy system can saturate network bandwidth, slowing all services simultaneously.

**Stamp coupling remediation techniques:**
- Create private RESTful API endpoints returning only required fields
- Use field selectors in the contract
- Use GraphQL to decouple data-fetching contracts
- Use consumer-driven contracts (CDCs) to specify exactly what each consumer needs
- Use internal messaging endpoints

### Fallacy 4: The Network Is Secure

The attack surface in distributed architectures is dramatically larger than in monoliths: every service endpoint is a potential attack vector. VPNs, trusted networks, and firewalls create a false sense of security. Each service must secure its own endpoints — even for inter-service calls — because any compromised internal service becomes an insider threat to all others.

The consequence: encryption overhead is a real performance cost (Fallacy 1 and 2 compound here), and security becomes an architectural concern rather than a perimeter concern.

### Fallacy 5: The Topology Never Changes

Network topology includes all routers, hubs, switches, firewalls, and appliances. It changes: network upgrades, rerouting, new firewall rules, AZ migrations. A "minor" network upgrade at 2am can invalidate all latency assumptions and trigger cascading timeouts across the system.

Architects must maintain continuous communication with network and operations teams. Topology changes are operational events that have architectural consequences.

### Fallacy 6: There Is Only One Administrator

Large organisations have dozens of network administrators. When latency changes unexpectedly or a topology problem emerges, knowing which administrator to contact — and coordinating across multiple administrators simultaneously — is a non-trivial operational challenge. This fallacy points to the coordination cost of distributed architecture that has no equivalent in monolithic systems.

### Fallacy 7: Transport Cost Is Zero

Transport cost does not mean latency (Fallacy 2) — it means actual monetary cost. Distributed architectures require significant additional infrastructure: servers, load balancers, API gateways, firewalls, subnets, proxies, service meshes, monitoring tooling. Making a "simple RESTful call" requires all this infrastructure to exist and be maintained.

Before choosing a distributed architecture, architects should analyse current server and network topology with regard to capacity, bandwidth, latency, and security zones to budget the real cost of going distributed.

### Fallacy 8: The Network Is Homogeneous

Most companies use hardware from multiple network vendors. These vendors do not always interoperate perfectly. Network packets can be lost at the boundary between heterogeneous hardware, particularly under unusual load or edge-case scenarios. This affects reliability (Fallacy 1), latency (Fallacy 2), and bandwidth (Fallacy 3) simultaneously.

## Other Distributed Challenges

Beyond the eight fallacies, distributed architectures introduce structural challenges not present in monoliths:

**Distributed logging:** a monolith has one log; a distributed system has dozens to hundreds of separate logs in different locations and formats. Root-cause analysis — tracing why a specific order was dropped — requires correlating across all these logs. Tools like Splunk and distributed tracing systems (Zipkin, Jaeger) partially address this but do not eliminate the complexity. (See [[operations/observability]].)

**Distributed transactions:** ACID transactions within a single database are straightforward. Across distributed services, ACID is not available. Distributed systems use:
- *Eventual consistency*: data will become consistent at an unspecified future time
- *Transactional sagas*: manage distributed state through local transactions with compensating actions (event sourcing for compensation, or finite state machines for state tracking)
- *BASE transactions*: Basic availability, Soft state (data in transit between source and target), Eventual consistency

See [[patterns/saga]] and [[distributed/distributed-transactions]].

**Contract maintenance and versioning:** services are owned by different teams with different release cadences. Any service changing its API contract must manage backward compatibility for all consumers simultaneously. Versioning strategies (URL versioning, header versioning, consumer-driven contracts) introduce operational complexity that has no equivalent in monolithic systems.

## Implications for Architecture Decisions

The fallacies represent the fixed overhead of going distributed. They must be explicitly justified against the benefits a distributed architecture provides. Questions to ask:

- Is the latency budget (Fallacy 2) feasible for the required user-facing performance?
- Has the bandwidth consumption (Fallacy 3) been measured and budgeted?
- Is the security surface (Fallacy 4) manageable given the organisation's security posture?
- Is the operational cost (Fallacies 5, 6, 7) justified by the scalability or deployment independence gains?

These costs compound with the number of services. A microservices architecture that makes many fine-grained calls is more exposed to the fallacies than a service-based architecture with coarser-grained services. (See [[comparisons/architecture-styles-comparison]] for trade-offs across styles.)

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Presents the 8 fallacies as the foundational cost model for any distributed architecture; stamp coupling as a concrete Fallacy 3 manifestation; introduces other distributed challenges (logging, transactions, contracts) |
| [[sources/understanding-distributed-systems]] | Addresses the same underlying problems (network failures, latency, consistency) through practical distributed systems design rather than the fallacy framing |
| [[sources/designing-data-intensive-applications]] | Deep treatment of distributed transactions, consistency, and replication — the consequences of Fallacies 1 and 3 at the data layer |

## Related Concepts

- [[concepts/architecture-quantum]] — quantum analysis determines whether the fallacy costs are justified
- [[distributed/consistency-models]] — the consistency trade-offs introduced by Fallacy 1 (reliability) and Fallacy 3 (bandwidth)
- [[operations/observability]] — tooling for distributed logging (the observability response to distributed logging complexity)
- [[patterns/circuit-breaker]] — the pattern response to Fallacy 1 (network is reliable)
- [[patterns/saga]] — the pattern response to distributed transactions
- [[distributed/distributed-transactions]] — ACID vs BASE vs saga approaches
- [[comparisons/architecture-styles-comparison]] — how different styles trade off against these costs

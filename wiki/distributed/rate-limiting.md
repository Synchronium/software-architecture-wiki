---
title: "Rate Limiting and Upstream Resiliency"
type: concept
tags: [resiliency, rate-limiting, load-shedding, upstream, distributed-systems, scalability]
sources: [understanding-distributed-systems, release-it, site-reliability-engineering]
created: 2026-05-14
updated: 2026-05-29
---

# Rate Limiting and Upstream Resiliency

Upstream resiliency patterns protect a service from being overwhelmed by its own callers — whether due to traffic spikes, misbehaving clients, or adversarial load. The four mechanisms form a layered defence: load shedding (local, reactive), load leveling (async decoupling), rate limiting (global, quota-based), and the constant work pattern (structural predictability). (→ [[sources/understanding-distributed-systems]] ch. 28)

## Key Claims

- **Three complementary techniques at different boundaries.** Load shedding (reject at the edge with 503), load levelling (queue + auto-scale consumers), rate limiting (per-client caps with sliding-window buckets). Use all three; they solve different problems.
- **Shed load at the edge as early as possible.** Rejecting fast preserves CPU for requests that can succeed. Slow rejection ties up resources at both ends — worse than refusal.
- **Bounded queues are not optional.** Unbounded queues mask backlog and produce unbounded latency (Little's Law). Every queue in the system needs a hard cap; what happens at the cap (block, reject, fail-fast) is a design choice but the cap itself isn't.
- **Sliding-window buckets handle distributed rate limiting.** Atomic counter increment in Redis-style stores; fail-open if the rate limiter itself is unavailable (you'd rather over-serve than be down). Per-client and per-endpoint keys.
- **Constant work is antifragile.** Periodic full-state dump (e.g., AWS Route 53 health checker dumps the entire health state every 2.5s) means failure of any individual node doesn't propagate. Self-healing by design.
- **The Governor pattern rate-limits automation, not callers.** Automation can act faster than humans can intervene; cap the rate of change asymmetrically (slow for large changes, fast for alerts). Reddit's ZooKeeper-induced fleet shutdown is the cautionary tale.

## Load Shedding

When a server is at capacity, it should reject excess requests immediately rather than queueing them — queued requests under overload only delay the inevitable and consume resources needed to serve the requests already in-flight.

**Implementation**: maintain a counter of concurrent requests currently being processed. When the counter exceeds a configured threshold (approximating the server's capacity), return HTTP 503 (Service Unavailable) immediately without processing the request.

**Priority ordering**: rather than rejecting arbitrary requests, prefer to reject:
- **Low-priority requests first**: if requests have assigned priorities, drop the cheapest ones to preserve capacity for important work.
- **Oldest requests first**: requests that have been waiting longest are the most likely to have already timed out on the caller's side — completing them wastes resources on a result that will be discarded.

**Limitation**: load shedding is not free. Even a rejected request may require a TLS handshake and partial header parsing before it can be refused. Under extreme load, the cost of rejecting requests can itself become the bottleneck.

## Load Leveling

Load leveling introduces a messaging channel between clients and the service to absorb burst traffic. The channel acts as a buffer: producers write into it at whatever rate they arrive; the consumer reads from it at its own sustainable pace.

```
[Clients] → [Message Channel / Queue] → [Service]
                 (smooths spikes)
```

This is well-suited to workloads where clients do not require a prompt response (batch processing, async workflows, background jobs). If the service falls behind consistently, the backlog grows — leading to the problems described in [[concepts/messaging]]. Load leveling is typically combined with auto-scaling: when the backlog grows, new instances are added to drain it.

Load leveling is not a substitute for rate limiting; it shifts when the work is done, not whether it is done.

## Rate Limiting

Rate limiting (throttling) enforces quotas on how much of a resource a given caller can consume within a time interval. Common quota dimensions: requests per second, bytes per minute, concurrent connections. Quotas are typically scoped to an API key, user ID, or IP address.

When a request exceeds the quota, return **HTTP 429 (Too Many Requests)** with:
- A `Retry-After` header indicating when the quota resets.
- A response body identifying which quota was exceeded and by how much.

Rate limiting protects against:
- Non-malicious overconsumption by buggy or aggressive clients.
- Pricing tier enforcement (charge proportional to usage).
- Partial DDoS mitigation (reduces impact, but economies of scale are the only full defence — a shared gateway absorbs attacks across all services behind it).

**Rate limiting ≠ load shedding**: load shedding is based on the *local* state of one process (concurrent requests in this instance); rate limiting is based on the *global* state of the system (total requests per API key across all instances). Global state requires coordination between instances.

### Sliding Window Algorithm (Single Process)

A naive implementation (per-request timestamp list) has unbounded memory. A practical approximation: divide time into fixed-duration buckets; store a counter per bucket per API key.

```
Time →  [12:00 bucket: 7] [12:01 bucket: 3]
                    ↑
         sliding window (1 min)
```

To check the quota for a given moment, compute a weighted sum of the counters of all buckets that overlap the sliding window, where each bucket's weight is proportional to its overlap fraction. This approximation becomes more accurate with smaller bucket granularity.

Storage requirement: only the buckets that the window can currently overlap — typically 2 counters per API key for a 1-minute window with 1-minute buckets.

### Distributed Implementation

With multiple service instances, each process cannot rely on its own local bucket counters — quotas must be enforced globally. Approaches:

1. **Shared data store**: each request increments the bucket counter in a shared store (Redis) using an atomic get-and-increment (or compare-and-swap). Avoids lost updates without full transactions.
2. **Batched flushing**: each process accumulates updates in memory and flushes to the shared store asynchronously at intervals. Reduces load on the store at the cost of reduced accuracy (some over-quota requests may slip through between flushes).
3. **Fail open on store unavailability**: if the rate-limiting store is unreachable, continue serving requests based on the last known state rather than blocking all traffic. Temporarily breaching a quota is a better outcome than a service-wide outage.

## Constant Work Pattern

The constant work pattern eliminates multi-modal behaviour by ensuring that the system performs the same amount of work per time unit regardless of current load, configuration changes, or fault conditions.

**Problem it solves**: when the amount of work is proportional to what changed (e.g., push one update message per changed configuration setting), a batch update affecting many settings simultaneously creates a spike of update messages that can overwhelm the data plane. Rare large-batch events exercise code paths that are rarely tested and can trigger bugs.

**Solution**: instead of pushing individual deltas, the control plane periodically dumps the *full* state to a file in a scalable store (S3, Azure Blob Storage). The data plane periodically reads the full dump, regardless of whether anything changed.

```
Control plane: → [full config dump] → [file store] → (every N seconds)
Data plane:    reads full dump every N seconds (same work, always)
```

Benefits:
- **Predictable performance**: the data plane does the same work under high load as under average load.
- **Self-healing**: if a configuration dump is corrupted, the next cycle overwrites it. If a bad config is pushed, reverting is as simple as writing a corrected dump.
- **Testable at maximum load**: pre-allocate slots for the maximum number of users; the system's maximum-load behaviour can be tested and benchmarked in advance.
- **Antifragile**: a system following this pattern performs the same or better under stress than under normal conditions — the opposite of a system that degrades gracefully.

The tradeoff: constant work is more expensive than minimal work (always reading/writing the full state). It is worth the cost in data planes where reliability and predictability are paramount.

The pattern is closely related to static stability (→ [[distributed/control-plane-data-plane]]): the data plane continues operating even when the control plane is unavailable, using the last full dump.

## Client-Side Adaptive Throttling

When a backend starts rejecting quota-exceeded requests, even rejections consume backend resources. If enough requests are being rejected, the backend can become overloaded processing rejections alone. Client-side throttling solves this by making the client self-regulate before requests even reach the network. (→ [[sources/site-reliability-engineering]] ch. 21)

Each client tracks two values over a trailing window (e.g., two minutes):
- `requests`: all attempts by the application layer
- `accepts`: requests actually accepted by the backend

Under normal operation, `requests ≈ accepts`. As the backend starts rejecting, `accepts` falls. The client self-throttles by rejecting requests locally with probability:

```
max(0, (requests - K × accepts) / (requests + 1))
```

where K=2 by default. Locally rejected requests still increment `requests`, which increases the throttling probability over time. The system reaches equilibrium at roughly one rejection per accepted request at the backend. Setting K lower (e.g., 1.1) makes the client more aggressive; higher values are more permissive. The decision is entirely local — no coordination required.

**vs load shedding**: load shedding is server-side; adaptive throttling is client-side. They complement each other: adaptive throttling prevents backends from drowning in rejected work; load shedding protects against requests that slip through.

## Request Criticality

When a system must shed load, not all requests are equally important. Assigning criticality levels allows overloaded services to reject unimportant traffic first, preserving capacity for the highest-value requests. (→ [[sources/site-reliability-engineering]] ch. 21)

Google's four-level model (from highest to lowest):

| Level | Use | Rejection precedence |
|-------|-----|---------------------|
| CRITICAL_PLUS | Most critical — serious user-visible impact if it fails | Last to be rejected |
| CRITICAL | Default for production jobs — user impact, but less severe | Second to last |
| SHEDDABLE_PLUS | Batch jobs — partial unavailability expected; can retry minutes/hours later | Second to reject |
| SHEDDABLE | Frequent unavailability acceptable | First to reject |

Key properties:
- **Propagates automatically**: when a backend receives request A and makes downstream requests B and C, B and C inherit A's criticality by default. Set criticality as close to the user-facing layer as possible.
- **Orthogonal to latency**: a sheddable request may have stringent latency requirements (e.g., inline search suggestions — fine to drop if overloaded, but must be fast when not dropped).
- **Per-customer quotas by criticality**: quota limits can be set per criticality level, not just per customer.

> **Open question**: four levels is Google's answer to the trade-off between expressive power and operational complexity. Fewer levels is simpler; more levels adds precision at the cost of harder-to-reason-about interactions.

## Back Pressure

Back pressure is the **intra-system** counterpart to Shed Load — see [[distributed/backpressure]] for the full treatment. Within a service (across components that share a deployment boundary), use **bounded queues** to create natural flow control. When a queue is full, the producer blocks — this is the signal to slow production, not to drop messages. (→ [[sources/release-it]] ch. 5)

Unbounded queues mask backlog: they accept work indefinitely, but response time grows without bound. Little's Law: `L = λW` — if arrival rate (λ) exceeds processing rate, average response time (W) grows without limit (see [[distributed/queueing-theory]]). A bounded queue makes this visible immediately.

Distinction: **Back pressure applies within a system boundary** (between internal components); **Shed Load applies at the system boundary** (to callers crossing the network edge).

## Governor (Automation Rate Limiting)

Nygard's Governor pattern extends rate limiting from external API callers to **internal automation** — autoscalers, deployment systems, configuration management, service discovery. (→ [[sources/release-it]] ch. 5)

Automation can observe partial or incorrect state and take drastic action faster than humans can respond. The Reddit ZooKeeper incident (ch. 4) is the canonical example: an autoscaler read partial ZooKeeper data, concluded too many servers were running, and shut them all down.

A Governor:
- Is **stateful and time-aware**: it limits the *rate* of change, not just the magnitude per action.
- Is **asymmetric**: fast to make small, safe changes; slow (and human-confirmable) for large changes.
- Has a **U-shaped response curve**: act confidently in the normal operating range; trigger alerts and require confirmation as the magnitude of proposed changes grows.
- Creates an **opportunity for human intervention** before an automated action becomes a catastrophe.

The Governor does not prevent automation — it prevents automation from acting at machine speed on potentially incorrect observations.

## Related Concepts

- [[patterns/circuit-breaker]] — downstream resiliency counterpart (timeout, retry, circuit breaker)
- [[patterns/bulkhead]] — fault isolation by user/tenant partitioning
- [[distributed/backpressure]] — intra-system flow control; bounded queues, credit-based protocols
- [[distributed/queueing-theory]] — Little's Law, utilisation curves, why unbounded queues fail
- [[distributed/control-plane-data-plane]] — constant work as a control plane propagation strategy; static stability
- [[concepts/messaging]] — load leveling relies on a message channel; backlog risk
- [[concepts/stability-patterns]] — rate limiting and shed load in the full stability pattern set
- [[comparisons/stability-pattern-selection]] — rate limiting's role in the layered defence
- [[comparisons/performance-and-capacity]] — rate limiting as the response to queue depth growth
- [[concepts/api-gateway]] — rate limiting is typically implemented at the gateway for north–south traffic
- [[operations/common-failure-causes]] — load pressure and cascading/metastable failures that these patterns prevent

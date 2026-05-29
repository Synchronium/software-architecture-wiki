---
title: "Stability Pattern Selection"
type: comparison
tags: [stability, resilience, patterns, decision-guide, failure-modes, composition]
sources: [release-it, understanding-distributed-systems, foundations-of-scalable-systems, site-reliability-engineering, chaos-engineering]
created: 2026-05-29
updated: 2026-05-29
---

# Stability Pattern Selection

## Key Claims

- **Stability patterns compose at different boundaries.** Timeout on the outgoing call, circuit breaker on sustained failure, retry on transient failure, bulkhead on resource isolation, fail fast on incoming requests when downstream is broken, handshaking with the load balancer, shed load at the edge, backpressure internally. A production-grade integration point uses all of them.
- **Each pattern defends against specific antipatterns.** Choose patterns by which antipattern they prevent, not by which patterns are fashionable. The full pattern-vs-antipattern mapping is the design tool.
- **Pattern order matters.** Timeouts come first — without them, every other pattern fails or behaves wrongly. Then bulkheads (so one failing dependency doesn't starve others). Then circuit breaker + retry. Then backpressure and load shedding at the edges.
- **One layer is not enough.** Applying stability patterns only at the application layer leaves cascading failures across services. Applying them only at the infrastructure layer (mesh, gateway) leaves them at the application layer. Defence is layered.
- **The patterns serve different goals.** Failure-arresting (catch the cascade) — timeout, circuit breaker, bulkhead. Load-shaping (manage the input) — shed load, backpressure, handshaking. Defensive (prepare for failure) — fail fast, let it crash, steady state, retry. Architectural (avoid the failure mode) — decoupling middleware, test harnesses, governor.
- **Patterns can interfere.** Aggressive retries defeat backpressure. Long timeouts defeat circuit breakers. Bulkheads with shared underlying resources don't actually isolate. Composition needs deliberate design.

## Why This Page

[[concepts/stability-patterns]] is the navigation hub for the full pattern set. Each pattern has its own page with implementation detail. This page answers the *selection* question: given a specific situation, which patterns apply, in what order, and how do they compose?

## The Selection Decision Tree

Read top to bottom; each question's answer dictates which patterns apply.

### Q1: Is this an outgoing call to a dependency?

If **yes**:
- **Always**: [[patterns/timeout]] — bound the wait at the dependency's P99.9 latency or below. Without this, no other pattern works correctly.
- **Always**: [[patterns/retry]] with exponential backoff and jitter, but only for transient failures (network glitches, 503s with `Retry-After`, timeouts). Never blind retry on 4xx.
- **If the dependency can fail sustainably**: [[patterns/circuit-breaker]] — stop calling when fault density crosses threshold. Track faults via leaky bucket, not absolute count.
- **If multiple dependencies share resources** (thread pool, connection pool, sidecar): [[patterns/bulkhead]] — partition resources per dependency. One failing dependency cannot starve others.

### Q2: Is this an incoming request?

If **yes**:
- **If downstream dependencies are broken or breakers are open**: Fail Fast — check resource availability before starting work; return 503 immediately without consuming resources. Distinguish system failure (503) from application failure (400).
- **If the service is over capacity**: Shed Load — return 503 at the edge; signal to the load balancer via health check. Cost of shedding is far lower than cost of degraded service for all concurrent requests.
- **If the inputs come from internal producers and rate exceeds capacity**: [[distributed/backpressure]] — bounded queues with blocking producers, credit-based protocols, or pull-based consumption.

### Q3: Is this an internal pipeline / producer-consumer pair?

If **yes**:
- **Always**: bounded queue with [[distributed/backpressure]]. Unbounded queues produce unbounded latency (Little's Law — see [[distributed/queueing-theory]]).
- **If producer must continue regardless**: durable queue + auto-scaled consumer (load levelling, see [[distributed/rate-limiting]]).
- **If consumer can be variable speed**: pull-based consumption (Kafka-style); consumer lag becomes observable signal.

### Q4: Is this at the system edge?

If **yes**:
- **Shed load** at the edge — reject fast with 503; preserve CPU for requests that can succeed.
- **Rate limit** per client (see [[distributed/rate-limiting]]) — sliding-window buckets, fail-open if the limiter itself is unavailable.
- **Handshaking** with the load balancer — return 503 from health check when over capacity; the LB drains traffic from this instance.

### Q5: Is this an automation system (autoscaler, deploy bot, config push)?

If **yes**:
- **Governor pattern** — rate-limit the *automation* asymmetrically. Slow for large changes, fast for alerts. Reddit's ZooKeeper-induced fleet shutdown is the cautionary tale.
- **Confirmation thresholds** above which automation requires human approval.

### Q6: Is this resource pooling (threads, connections, memory)?

If **yes**:
- **Steady State** — pair every state-accumulating mechanism with a recycling mechanism. Logs rotate; caches expire; in-memory state has TTLs. No "fiddling with production" to clear it.
- **Bounded everything** — never use defaults like `LinkedBlockingQueue` with no capacity. The default is wrong almost everywhere.

## Pattern × Antipattern Matrix

The patterns map directly to the [[operations/common-failure-causes|antipatterns]] they defend against:

| Antipattern | Primary defence | Secondary defence |
|---|---|---|
| Integration Points fail unexpectedly | [[patterns/timeout]] + [[patterns/circuit-breaker]] | Test harnesses (simulate failure modes) |
| Chain Reactions (defect across replicas) | [[patterns/bulkhead]] | Partition load across cells |
| Cascading Failures (failure across layers) | [[patterns/circuit-breaker]] + [[patterns/timeout]] | Decoupling middleware (async between layers) |
| Blocked Threads | [[patterns/timeout]] on every blocking call | Proven concurrency primitives; immutable domain objects |
| Self-Denial Attacks (marketing campaigns) | Pre-autoscale; CDN warmup | Mass emails in waves; no deep links bypassing CDN |
| Scaling Effects (O(n²) communication) | Replace P2P with pub/sub | Cellular architecture |
| Unbalanced Capacities | [[patterns/bulkhead]] + Handshaking | Stress-test both sides at 10× expected peak |
| Dogpile (synchronised cache expiry) | Clock slew; TTL jitter | Increasing backoff after restarts |
| Slow Responses | Fail Fast on response-time threshold | Self-monitoring with moving average |
| Unbounded Result Sets | Pagination; LIMIT clauses | Test with production-sized data |

If you can identify the antipattern, the defence is mechanical.

## Composition Order: Build the Defence in This Sequence

When implementing stability patterns on a new service, apply them in this order. Each layer depends on the one before it:

1. **[[patterns/timeout]] on every blocking call.** Without this, every other pattern has corrupt inputs. This is the foundation.
2. **Bounded queues everywhere.** Without these, [[distributed/backpressure]] cannot propagate. Pick capacity from `(max_wait / mean_processing) × thread_count × 1.5` (Nygard's heuristic).
3. **[[patterns/bulkhead]] to isolate failure domains.** Per-dependency thread pool, per-tenant resource quota, per-rack failure domain. So that a problem with one doesn't starve the rest.
4. **[[patterns/circuit-breaker]] on sustained failures.** Once dependencies have bounded resource usage, breakers detect sustained problems and stop calling.
5. **[[patterns/retry]] for transient failures.** Exponential backoff with jitter; never blind-retry; obey `Retry-After`.
6. **Fail Fast at the entry point** when the breaker is open or pool is exhausted. Return 503 immediately; don't start work you can't finish.
7. **Shed load at the system edge** when capacity is exceeded. Fast rejection beats slow degradation.
8. **[[distributed/backpressure]] internally** to slow producers when consumers fall behind.
9. **Handshaking with the load balancer** via health checks. Lame duck on shutdown.
10. **Steady State** — automate state recycling so humans never SSH in to "clean things up."
11. **Test Harnesses** for simulating out-of-spec failures. Real integration tests verify expected behaviour; harnesses verify behaviour under conditions that real integration cannot provoke.
12. **Governor** on any automation that can act faster than humans. Reddit's ZooKeeper outage is the standard caution.

Skipping a step doesn't disable the later steps — but it means the later patterns operate on degraded inputs. A circuit breaker without timeouts is decorative; backpressure without bounded queues is invisible.

## Composition Anti-Patterns

These are pattern *combinations* that look reasonable but break.

**Aggressive retry + backpressure.** A client that retries immediately on rejection turns load shedding into amplification. Always pair retries with exponential backoff + jitter, and respect `Retry-After` headers.

**Long timeout + circuit breaker.** If the timeout is longer than the breaker's measurement window, the breaker never sees enough faults to trip — every call is "still pending" when the next measurement starts. Size the timeout shorter than the fault-counting window.

**Bulkheads sharing underlying resources.** Per-dependency thread pools that all check out from the same connection pool are not bulkheads — they're decorative. The bulkhead must be at the actual contended resource (connections, sockets, memory, CPU cores).

**Retries that hide circuit-breaker state.** Retrying through a circuit breaker that's open is just slow failure. Either fail fast on open, or retry at a layer that can fall back (cache, default value, alternative service).

**Backpressure that reaches the user.** If backpressure ultimately blocks an HTTP request thread, the user sees a slow page. Backpressure between async stages is fine; at the user boundary, prefer load shedding.

**Circuit breaker scope errors.** Per-instance breakers don't share state — when one instance opens, others continue calling. Per-cluster breakers share state but become a coordination problem. Pick deliberately; the choice affects how quickly the breaker reacts and how it recovers.

**Fail Fast that returns wrong status codes.** 503 (system overload) vs 500 (application error) vs 400 (bad input) — they trigger different client behaviour. Treating overload as 500 means clients don't back off; treating bad input as 503 means clients retry inappropriately.

## Layered Defence Across the Stack

Stability patterns operate at different layers; a single layer is rarely enough.

| Layer | Patterns |
|---|---|
| Application code | [[patterns/timeout]], [[patterns/circuit-breaker]], [[patterns/retry]], Fail Fast |
| Process / runtime | [[patterns/bulkhead]] (thread pools), bounded queues, Steady State |
| Sidecar / service mesh | [[patterns/timeout]], retry policy, circuit breaker, [[patterns/bulkhead]] (connection pool isolation), mTLS |
| API gateway | Rate limiting, [[distributed/rate-limiting|load shedding]], request validation, threat mitigation |
| Load balancer | Health checks, handshaking, lame duck draining, graceful rolling deploys |
| Infrastructure | Bulkheads via availability zones; cellular architecture; partition isolation |
| Operations | Governor on automation; chaos engineering to verify the patterns work |

A defence applied only at one layer has known failure modes at the others. The mesh handles east-west; the gateway handles north-south; application patterns handle business-logic-specific failure modes; infrastructure handles correlated failures.

## When to Skip Stability Patterns

Stability patterns are not free. Each adds latency, complexity, and operational surface.

**Single-process internal calls** rarely need [[patterns/circuit-breaker]] — there's no network or independent process to fail. But they do need [[patterns/timeout]] on any blocking operation (lock acquisition, queue checkout).

**Idempotent read-only operations** can skip [[distributed/idempotency]] discipline, but still need timeout + retry.

**Strongly internal services with no external traffic** can skip rate limiting and load shedding at the edge — but still need backpressure and bulkheads internally.

**Pre-production environments** can run with relaxed patterns to surface failures faster. Production needs the full set.

## Verifying the Patterns

Implementing stability patterns is not the same as having them work. [[operations/chaos-engineering]] is how you check — controlled fault injection to verify each pattern fires when it should.

- **Test harness** simulates out-of-spec downstream behaviour (slow, garbled, RST mid-stream) that mocks can't.
- **Latency injection** verifies timeouts trigger at the right boundary.
- **Instance termination** verifies bulkheads contain failure and other instances absorb load.
- **Status code injection** (FIT-style) verifies circuit breakers trip and recover.
- **Steady-state hypothesis** verifies the system continues to meet its SLI under each fault.

A stability pattern that hasn't been exercised hasn't been verified.

## How Different Sources Treat It

| Source | Angle |
|--------|-------|
| [[sources/release-it]] | Canonical pattern catalogue and antipatterns (chs. 4–5); composition guidance; the "crack propagation" framing. |
| [[sources/understanding-distributed-systems]] | Distributed-systems subset: timeout, retry, circuit breaker, bulkhead, idempotency. Practical, mechanism-focused. |
| [[sources/foundations-of-scalable-systems]] | Queueing-theoretic lens on the same patterns: utilisation curves, blocked threads, producer-consumer with bounded buffers. |
| [[sources/site-reliability-engineering]] | Operational discipline around the patterns: error budgets gate aggressive retries; lame duck for graceful shutdown; load shedding at 503 thresholds. |
| [[sources/chaos-engineering]] | The verification side: how to test that the patterns actually work under production conditions. |

## Related Concepts

- [[concepts/stability-patterns]] — the pattern set as a coherent whole
- [[operations/common-failure-causes]] — the antipatterns these patterns defend against
- [[distributed/backpressure]] — flow control as a stability pattern
- [[distributed/queueing-theory]] — why unbounded queues and high utilisation break stability
- [[distributed/rate-limiting]] — load shedding and constant work as upstream resiliency
- [[patterns/circuit-breaker]], [[patterns/timeout]], [[patterns/retry]], [[patterns/bulkhead]] — the individual patterns
- [[operations/chaos-engineering]] — verifying the patterns work
- [[operations/availability]] — what stability patterns serve
- [[comparisons/sync-vs-async-communication]] — decoupling middleware as a stability decision
- [[concepts/cost-as-architectural-force]] — the patterns are not free; cost-justify the investment

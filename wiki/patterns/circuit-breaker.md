---
title: "Circuit Breaker"
type: pattern
tags: [resiliency, distributed-systems, fault-tolerance, downstream-dependencies, microservices, stability]
sources: [understanding-distributed-systems, release-it, foundations-of-scalable-systems]
created: 2026-05-13
updated: 2026-05-28
---

# Circuit Breaker

A state machine that wraps calls to a downstream dependency, automatically stopping requests when the dependency is failing and resuming when it recovers. Named after the electrical circuit breaker that trips to protect a circuit from overload.

## States

```
            failure threshold exceeded
CLOSED ──────────────────────────────► OPEN
  ▲                                      │
  │         probe succeeds               │ after cooldown period
  └────────────────────── HALF-OPEN ◄───┘
                              │
                              │ probe fails
                              └──────────► OPEN
```

- **CLOSED**: normal operation; calls pass through; failures are counted.
- **OPEN**: dependency is unavailable; calls fail immediately without hitting the dependency ("fail fast"); error budget not burned waiting for timeouts.
- **HALF-OPEN**: cooldown elapsed; a single probe request is allowed through. If it succeeds, transition to CLOSED; if it fails, return to OPEN.

## Configuration Parameters

- **Failure threshold**: number or percentage of failures to trip the breaker (e.g., 5 failures in 10 seconds, or 50% error rate).
- **Cooldown / reset timeout**: how long to stay OPEN before probing (e.g., 30s).
- **Half-open probe count**: how many requests to allow through before declaring recovery.

Thresholds should be tuned to the dependency's expected P99.9 latency and acceptable error rate.

## Why It Works

Without a circuit breaker:
- A slow/failed downstream service causes every caller to block for the full timeout duration.
- Thread pools fill up waiting; the caller service cascades into failure.
- The downstream service gets hammered with retries during recovery, preventing recovery.

With a circuit breaker:
- Calls fail fast (microseconds) during OPEN, freeing threads.
- The caller can implement graceful degradation (return cached data, return a default, show a degraded UI).
- The downstream service gets relief during recovery (no retry storm).

## Graceful Degradation

The circuit breaker only adds resilience if the caller handles the open state gracefully. For non-critical dependencies, the caller should:
1. Catch the circuit-breaker exception.
2. Return a fallback value (stale cache, empty list, default).
3. Log the degradation.

For critical dependencies, the caller should still return an error — but fast, preserving resources for other requests.

## Timeouts

Always configure a timeout on every network call. A call without a timeout can hang indefinitely, consuming a thread (or goroutine/connection) for as long as the downstream is unresponsive — this leads to the resource leak pattern described in [[operations/common-failure-causes]].

**Sizing**: base the timeout on the desired false-timeout rate. For a 0.1% false-timeout rate, set the timeout at P99.9 of the downstream service's response time. Monitor the full call lifecycle (duration, status code, timeout flag) at integration points. (→ [[sources/understanding-distributed-systems]] ch. 27)

**Gotcha**: many popular libraries have no default timeout — Python `requests`, Go's `net/http`, and JavaScript's `XMLHttpRequest` (default = 0, meaning no timeout). Always set explicitly, or wrap calls in a library that enforces them. A sidecar proxy (→ [[patterns/sidecar-service-mesh]]) can enforce timeouts transparently.

## Retries

Retries recover from transient failures where the next call is likely to succeed. They complement circuit breakers: retries address short-lived faults; circuit breakers address sustained ones.

**Exponential backoff with jitter**:
```
delay = random(0, min(cap, initial_backoff × 2^attempt))
```
The `random()` jitter spreads retries across time, preventing multiple clients whose requests all failed simultaneously from all retrying at the same moment (the "retry storm"). Without jitter, synchronised retries can amplify load and further degrade a struggling downstream.

**Only retry transient failures**: authorization errors, validation failures, and other permanent errors should fail fast — retrying a 403 wastes resources. Understand idempotency before retrying: retrying a non-idempotent call can cause duplicated side effects. (→ [[distributed/idempotency]])

**Retry amplification in service chains**: in a chain A → B → C, if B retries calls to C and A retries calls to B, the total number of requests arriving at C can multiply. As the chain deepens, the load amplification worsens. Mitigation: retry at one level of the chain only; all other layers fail fast. (→ [[sources/understanding-distributed-systems]] ch. 27)

**Retry queues**: for batch applications where prompt response is not required, failed requests can be written to a retry queue and processed later, decoupling the retry from the request lifecycle.

## Relationship to Timeouts and Retries

Circuit breakers work alongside (not instead of) timeouts and retries:

1. **Timeout**: always set; prevents indefinite blocking on a single call.
2. **Retry with backoff + jitter**: handles transient failures without creating retry storms.
3. **Circuit breaker**: handles sustained failures; stops sending requests entirely when the downstream is reliably failing.

Use retries when the expectation is that the next call will succeed; use a circuit breaker when the expectation is that the next call will fail. (→ [[sources/understanding-distributed-systems]] ch. 27)

## Implementation Notes

- State must be **per process**. Nygard (→ [[sources/release-it]] ch. 5) explicitly argues against sharing circuit breaker state across instances — each process independently tracks its own fault density. Distributed circuit breaker state in Redis introduces coupling and a new failure point.
- Track fault **density** (faults per time window) using a **leaky bucket**, not a simple fault count. A leaky bucket drains over time; a burst of faults that clears doesn't leave stale fault counts that could trip the breaker indefinitely. This makes the circuit breaker adaptive to burstiness without over-sensitivity.
- **State changes must be logged and visible to Ops** — a breaker silently tripping to OPEN is an operational event that on-call must know about. Surface state transitions as metrics and log entries, not just internal state.
- **Fallback strategies require business input.** Engineering can implement "return an error when OPEN", but whether to return stale cached data, an empty list, a degraded response, or a hard error is a product decision. Design fallbacks explicitly, not as an afterthought.
- Many libraries provide implementations: Hystrix (Java, now in maintenance), Resilience4j (Java), Polly (.NET), py-breaker (Python).
- Service meshes (Envoy, Istio) implement circuit breaking at the network proxy layer, transparently to the application code. (→ [[patterns/sidecar-service-mesh]])

## The Antipatterns Circuit Breaker Addresses

Nygard (→ [[sources/release-it]] ch. 4) names the antipatterns that Circuit Breaker is designed to counter:

- **Integration Points**: every integration point will eventually fail — refused connections, hangs, slow responses, protocol violations. Circuit Breaker stops calls to failing integration points instead of letting every caller pile up blocked threads.
- **Cascading Failures**: failure "jumps the gap" between layers via resource pools exhausted by blocked threads. Circuit Breaker breaks the transmission mechanism by failing fast before the pool is exhausted.
- **Slow Responses**: worse than refusing a connection — slow responses consume threads at both ends. When a moving average of response times exceeds the SLA, Circuit Breaker (combined with self-monitoring) can switch to OPEN and start failing fast rather than delivering slow service.
- **Unbalanced Capacities**: a front-end with 3,000 threads can overwhelm a back-end sized for 75. Circuit Breaker on the caller side relieves pressure when the back-end starts to slow or reject connections.

> **Contradiction (Vitillo vs Nygard)**: [[sources/understanding-distributed-systems]] ch. 27 treats Circuit Breaker primarily as a configuration and tuning problem (threshold, cooldown, probe count). [[sources/release-it]] ch. 4 treats the same pattern as the cornerstone of a stability architecture — the primary defence against cascading failures — and motivates it with detailed real-world failure chains. The patterns are compatible; Nygard's framing is richer on *when* to use it and *why*.

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 27) — circuit breaker state machine, configuration, relationship to timeouts/retries.
- (→ [[sources/release-it]] ch. 4) — Circuit Breaker as defence against Integration Points, Cascading Failures, Slow Responses, and Unbalanced Capacities antipatterns; motivation from real failure chains.
- (→ [[sources/foundations-of-scalable-systems]] ch. 9) — Circuit Breaker in microservices context: relieves load on overloaded downstream during OPEN state; complements fail-fast timeout strategy; Resilience4j Python `@circuit` decorator as implementation example (failure_threshold, recovery_timeout).

## Related Pages

- [[patterns/timeout]] — prerequisite to circuit breaker; every call needs a timeout before a breaker makes sense
- [[patterns/retry]] — handles transient failures; circuit breaker handles sustained ones; the two compose
- [[patterns/bulkhead]]
- [[patterns/sidecar-service-mesh]]
- [[distributed/consistency-models]]
- [[concepts/stability-patterns]] — Nygard's full pattern set; circuit breaker as one of the failure-arresting patterns
- [[distributed/backpressure]] — what to do when the downstream is slow but not failing
- [[concepts/feature-flags]] — flag-driven graceful degradation when a breaker opens

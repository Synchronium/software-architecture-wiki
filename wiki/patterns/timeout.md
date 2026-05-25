---
title: "Timeout"
type: pattern
tags: [resiliency, stability, distributed-systems, fault-tolerance, integration-points]
sources: [release-it, understanding-distributed-systems, foundations-of-scalable-systems]
created: 2026-05-18
updated: 2026-05-18
---

# Timeout

A timeout is a bound on how long a caller will wait for an operation to complete. When the bound is exceeded, the caller abandons the operation and takes a defined action — returning an error, returning a fallback value, or retrying.

Timeouts are the most fundamental resiliency pattern. They are a prerequisite for all other stability patterns: without timeouts, a single slow downstream dependency can exhaust a thread pool and cascade to a full service failure.

## The Core Problem

Without a timeout, a blocked call can hold a thread indefinitely. Threads are finite. A downstream service that hangs — not crashes, hangs — will silently consume caller threads one at a time until the pool is exhausted. At that point, the caller service stops responding to new requests entirely, even though its own code is correct. This is the root cause of most cascading failures (→ [[operations/common-failure-causes]]).

> "Slow responses are worse than refused connections." — Nygard (→ [[sources/release-it]] ch. 4)

A refused connection fails fast and returns a thread immediately. A slow response holds the thread for the full timeout duration. This makes slow dependencies more dangerous than crashed ones.

## Where to Apply Timeouts

Timeouts apply to every operation that can block:

- **Outbound network calls**: HTTP requests, gRPC calls, database queries, cache lookups
- **Resource pool checkout**: `getConnection()` from a JDBC or HTTP connection pool must have a timeout; a pool exhausted by blocked threads will block subsequent checkouts indefinitely
- **Mutex and lock acquisition**: acquiring a lock held by a crashed or deadlocked process will block forever without a timeout
- **Message broker operations**: producing or consuming from a queue when the broker is unresponsive

Every integration point (→ [[sources/release-it]] ch. 4) must have a timeout. No exceptions.

## Sizing Timeouts

Set the timeout based on the dependency's latency distribution, not an arbitrary round number:

```
timeout = P99.9 of the dependency's response time
```

A timeout at P99.9 means 1 in 1,000 requests will hit the timeout even when the dependency is healthy (false timeouts). This is typically acceptable; the trade-off is explicit. Setting a timeout below P99 creates excessive false timeouts that degrade availability; setting it too high defeats the purpose.

The P99.9 value must be measured in production, not estimated. Latency distributions are often long-tailed — what appears to be P100 in QA may be P99 under production load (→ [[sources/understanding-distributed-systems]] ch. 27).

For dependencies with variable latency (e.g., a bulk query that scales with result set size), consider per-operation timeouts rather than a single global timeout.

## What to Do When a Timeout Fires

**A timeout alone does nothing.** The caller must handle it explicitly:

1. **Return an error** (for critical dependencies): propagate a 503 to the upstream caller; don't convert a downstream timeout into a 500 on the caller side — the distinction matters for monitoring and retry logic.
2. **Return a fallback** (for non-critical dependencies): serve cached data, an empty list, or a default value; degrade gracefully rather than failing hard.
3. **Record a fault and feed the [[patterns/circuit-breaker]]**: circuit breakers track fault density across calls; timeouts are faults. A sustained stream of timeouts from one dependency should trip the breaker and stop calls entirely.
4. **Do not retry immediately**: a timeout indicates the downstream is slow or overwhelmed; immediate retry adds load. Retry only with exponential backoff + jitter, and only for idempotent operations (→ [[patterns/retry]]).

## The Absent Timeout: A Common Gotcha

Many widely-used HTTP client libraries default to no timeout:

- Python `requests`: no timeout by default (will block indefinitely)
- Go `net/http`: default `http.Client` has no timeout
- JavaScript `XMLHttpRequest`: timeout defaults to 0 (no timeout)

Always set timeouts explicitly. Never assume a library default is safe.

A sidecar proxy (→ [[patterns/sidecar-service-mesh]]) can enforce timeouts at the network layer, independently of application code — useful for catching integration points that developers forgot to configure.

## Timeouts and Connection Validation

A connection pool may hold connections that became stale after a database or service failover. The pool is unaware of the failover; connections appear healthy by internal state. When a request tries to use a stale connection, it may block or fail only when actual I/O occurs — not at checkout.

Defense: configure the pool to validate connections at checkout (send a lightweight ping before returning the connection to the caller). This adds a small latency cost but prevents the resource exhaustion pattern described in the airline case study (→ [[sources/release-it]] ch. 2).

## Relationship to Other Patterns

Timeouts, circuit breakers, and retries are a trio that work together — not independently:

```
Timeout         → bounds a single call; returns a thread when the call is slow
Retry           → handles transient failures by repeating; requires idempotency
Circuit Breaker → handles sustained failures; stops calls entirely after repeated faults
```

The correct application order for a given call:

1. **Set a timeout** on the call.
2. **Retry with backoff + jitter** if the error is transient (and the operation is idempotent).
3. **Record the fault** in the circuit breaker regardless.
4. **Circuit breaker opens** if faults accumulate, stopping further calls.

Using retries without a circuit breaker causes a retry storm during sustained failures. Using a circuit breaker without timeouts means faults are only counted when threads eventually return — too slowly to protect the thread pool.

## Fail Fast and Timeouts

Nygard distinguishes two complementary patterns (→ [[sources/release-it]] ch. 5):

- **Timeout** applies to *outgoing* calls: bound how long you wait for a response.
- **Fail Fast** applies to *incoming* requests: if a required resource (pool, circuit breaker, downstream) is already known unavailable, refuse the request immediately before doing any work. Timeouts discover new failures; Fail Fast prevents work on known failures.

## Related Pages

- [[patterns/circuit-breaker]] — timeouts feed fault counts; circuit breaker stops calls when faults accumulate
- [[patterns/retry]] — what to do when a call fails transiently; must be paired with timeouts
- [[patterns/bulkhead]] — limits the blast radius when timeout-bound calls accumulate
- [[distributed/idempotency]] — prerequisite for safely retrying timed-out calls
- [[operations/common-failure-causes]] — blocked threads from missing timeouts; airline case study
- [[operations/availability]] — timeouts are a direct mechanism for preserving availability under downstream failure

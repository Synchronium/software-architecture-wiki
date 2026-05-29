---
title: "Retry"
type: pattern
tags: [resiliency, stability, distributed-systems, fault-tolerance, transient-failures, microservices]
sources: [understanding-distributed-systems, release-it, foundations-of-scalable-systems, site-reliability-engineering]
created: 2026-05-18
updated: 2026-05-29
---

# Retry

Retry is the practice of re-issuing a failed request after a brief delay, on the expectation that the failure is transient and the next attempt is likely to succeed.

Retry is one half of a pair: **retry** handles short-lived faults; **[[patterns/circuit-breaker]]** handles sustained ones. Used alone and without care, retry can amplify load and transform a partial outage into a full one.

## When to Retry

**Retry transient failures only.** The key distinction:

| Failure type | Retry? | Reason |
|---|---|---|
| Network timeout or reset | Yes, with backoff | The downstream may have been momentarily overloaded or the connection dropped transiently |
| 503 Service Unavailable | Yes, with backoff | The service is alive but temporarily unable to handle the request |
| 429 Too Many Requests | Yes, with backoff + respect `Retry-After` header | Rate limit hit; backing off is both correct and courteous |
| 500 Internal Server Error | Rarely | Depends on whether the error is transient; treat as non-retryable by default |
| 400 Bad Request | Never | The request is malformed; retrying will produce the same error |
| 401 / 403 | Never | Auth failure; retrying wastes resources |
| 404 Not Found | Never | The resource doesn't exist; retrying will produce the same error |

The safe default: retry on network-level failures and 5xx errors where you have evidence or reason to believe the next attempt will succeed. Fail fast on all 4xx errors and on 5xx errors that indicate a non-transient condition.

## Idempotency Is a Prerequisite

**Only retry idempotent operations.** A retry of a non-idempotent call (e.g., POST to create a resource) can cause duplicated side effects — two orders placed, two charges, two emails sent.

Before retrying, confirm one of:
- The operation is naturally idempotent (GET, PUT, DELETE with the same body)
- The server implements idempotency keys — the client sends a unique key; the server deduplicates (→ [[distributed/idempotency]])
- The business consequence of a duplicate is acceptable (rare)

If neither holds, don't retry — fail fast and return an error to the caller.

## Exponential Backoff with Jitter

Never retry immediately or on a fixed interval. Both cause retry storms: multiple clients whose requests all failed at the same instant all retry at the same instant, creating a synchronised burst that amplifies load on an already-struggling downstream.

**Exponential backoff with full jitter** (recommended):

```
delay = random(0, min(cap, base × 2^attempt))
```

Where `base` is the initial delay, `cap` is the maximum delay, and `random` draws uniformly. Example values: base = 100ms, cap = 10s. The randomisation desynchronises clients; the exponential growth limits retry frequency as failures persist.

**Decorrelated jitter** (alternative, slightly better distribution):

```
delay = random(base, min(cap, previous_delay × 3))
```

The cap prevents delays from growing unboundedly; without it, long-running retry loops can produce delays of hours after many failed attempts.

## Retry Amplification in Service Chains

In a chain A → B → C, if both A and B retry independently, the total number of requests reaching C multiplies:

```
A ──(3 retries)──► B ──(3 retries)──► C
                                       = 9 requests at C per 1 request at A
```

As the chain deepens, amplification compounds exponentially. This can turn a partial failure at C into a full overload — the retry behaviour intended to help causes more harm than the original failure.

**Mitigation**: retry at one level of the chain only — the layer immediately above the one that is rejecting. All other layers should propagate the error without retrying. When a backend determines a request cannot be served and retrying is futile, it should return an explicit "overloaded; don't retry" signal rather than a generic error, preventing higher layers from unnecessarily retrying. (→ [[sources/understanding-distributed-systems]] ch. 27; → [[sources/site-reliability-engineering]] ch. 21)

## Maximum Retry Budget

Set an explicit maximum retry count. Unlimited retries are not a strategy — they guarantee that a sustained failure becomes a resource leak (threads, connections, memory) accumulating retry work.

Typical values: 2–4 attempts total (1 original + 1–3 retries). Beyond 3 retries, you are usually better served by a circuit breaker opening than by continuing to hammer a struggling downstream.

**Per-client retry budget**: in addition to a per-request budget, maintain a ratio limit across all requests. Google's RPC framework limits retries to 10% of total attempts per client. Combined with a per-request budget of 3 attempts, this caps total request amplification at ~1.1× in the general case, rather than ~3× from the per-request limit alone. (→ [[sources/site-reliability-engineering]] ch. 21)

**Retry metadata**: include a retry counter in request metadata. Backends accumulate histograms of retry counts in recent traffic. When the histogram shows significant retries (indicating datacenter-wide overload rather than single-task overload), the backend returns "overloaded; don't retry" to suppress further retries higher in the stack.

When the retry budget is exhausted, the circuit breaker's fault accumulation should trip — stopping further calls entirely until the downstream recovers (→ [[patterns/circuit-breaker]]).

## Retry Queues

For operations where prompt response is not required (batch jobs, async notifications, background sync), decouple the retry from the request lifecycle by writing failed requests to a **retry queue**. A separate worker processes the queue with its own backoff strategy.

Advantages:
- The original caller is not blocked for the retry duration
- Retries can be persistent (survive process restarts)
- Rate of retry is independently controllable

Retry queues are appropriate for:
- Background data sync jobs
- Outbound notification delivery (email, webhook, SMS)
- Idempotent write operations that must eventually succeed

Not appropriate for:
- Synchronous request-response paths where the caller is waiting for a result
- Operations where latency of the retry matters to the user

The [[patterns/outbox-pattern]] implements a reliable variant of this: the operation and its outbox message are written atomically; the relay process handles delivery with retries.

## Relationship to Other Patterns

```
Timeout         → bounds a single call; triggers the retry decision point
Retry           → re-issues the call after transient failure
Circuit Breaker → tracks fault density; opens to stop calls during sustained failure
```

The three patterns are designed to compose. A correctly implemented integration point:
1. Sets a **timeout** on every call
2. On timeout or transient error, **retries** with exponential backoff + jitter, up to a budget
3. Records every fault (whether retried or not) in the **circuit breaker**
4. When the circuit breaker opens, stops retrying entirely until it closes

Implementing retry without circuit breaker means retries continue indefinitely during a sustained outage. Implementing circuit breaker without retry means every transient failure surfaces immediately as an error to the caller.

## Related Pages

- [[patterns/circuit-breaker]] — handles sustained failures after retry budget is exhausted
- [[patterns/timeout]] — what triggers the retry; must be set before retrying is meaningful
- [[distributed/idempotency]] — prerequisite for retry safety; idempotency key design
- [[patterns/outbox-pattern]] — retry via durable queue for async operations
- [[operations/common-failure-causes]] — retry storms as a failure amplification mechanism
- [[concepts/stability-patterns]] — retry within Nygard's stability pattern set; composition with timeout/circuit breaker
- [[comparisons/stability-pattern-selection]] — retry composition rules; how to avoid retry-defeats-backpressure
- [[distributed/backpressure]] — retries that don't back off defeat backpressure

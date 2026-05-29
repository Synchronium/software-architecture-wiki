---
title: "Backpressure"
type: concept
tags: [backpressure, flow-control, stability, queueing, distributed-systems]
sources: [release-it, foundations-of-scalable-systems, understanding-distributed-systems, designing-data-intensive-applications]
created: 2026-05-28
updated: 2026-05-29
---

# Backpressure

## Definition

Backpressure is a flow-control mechanism in which a downstream component signals to an upstream producer that it cannot keep up, causing the producer to slow down rather than continue submitting work at its current rate. The signal can be explicit (a protocol message, a returned status) or implicit (a bounded queue refusing new entries). The defining property: load adjustment happens *upstream of* the bottleneck rather than at the bottleneck itself.

## Why It Matters

A system without backpressure has only two states under overload: accept everything until something breaks, or reject at the boundary (load shedding). Backpressure adds a third option — propagate the slowdown upstream so producers experience the bottleneck before downstream components are overwhelmed. Without it, queues grow without bound, response times grow without bound (by Little's Law: L = λW, see [[distributed/queueing-theory]]), and the failure mode is typically a cascading collapse rather than graceful degradation (→ [[operations/common-failure-causes]]).

Nygard's framing in [[sources/release-it]]: "Every failing system starts with a queue backing up somewhere." Backpressure is the architectural response to that observation.

## Backpressure vs Load Shedding

These are often conflated but solve different problems and apply at different boundaries.

| | Backpressure | Load Shedding |
|--|--|--|
| Boundary | **Within** a system (between coupled components sharing a deployment boundary) | **At** the system edge (rejecting external traffic) |
| Mechanism | Bounded queues, blocking producers, credit-based protocols | Return 503/429, drop requests at load balancer |
| Effect on producer | Producer slows down (blocks or yields) | Producer's request fails immediately |
| When to use | Between trusted components where slowing is acceptable | At trust boundaries where requests can be dropped |
| Risk | Producer's upstream may also block (propagation) | Lost requests may need replay/retry from client |

From [[sources/release-it]] ch. 5: "Back pressure applies within a system boundary; Shed Load applies at the boundary." Both belong in a complete stability strategy.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/release-it]] | Defines "Create Back Pressure" as a stability pattern: bounded queues create natural flow control; when a queue is full, the producer blocks — this is the signal to slow down. Unbounded queues mask the backlog. Distinguishes backpressure (internal) from shed load (boundary). |
| [[sources/foundations-of-scalable-systems]] | Gorton documents the back-pressure mechanism in cascading failures: a slow downstream service back-pressures upstream threads via blocked I/O; in the absence of timeouts, the cascade propagates layer by layer. In-process equivalent: bounded BlockingQueue between producer threads and consumer threads. |
| [[sources/understanding-distributed-systems]] | Vitillo frames backpressure as part of rate limiting and load levelling: the async-channel pattern (producer → durable queue → auto-scaled consumers) lets producers submit at their natural rate without overwhelming consumers — the queue absorbs bursts, consumers scale to drain it. |
| [[sources/designing-data-intensive-applications]] | Kleppmann's stream processing chapters treat backpressure as a property of log-based brokers (Kafka): consumers track offsets and read at their own pace; the broker retains messages so a slow consumer doesn't lose data. Contrasts with AMQP/JMS where slow consumers cause broker memory pressure. |

## Mechanisms

### Bounded queues with blocking producers

The canonical in-process pattern. Producer threads write to a `BlockingQueue`; when the queue is at capacity, the producer's `put()` call blocks until a consumer drains an element (→ [[sources/foundations-of-scalable-systems]] ch. 4). The architectural effect: producer throughput is bounded by consumer throughput, never exceeding it.

**Critical constraint:** the queue *must be bounded*. An unbounded queue accepts work indefinitely while response time grows without bound. From [[sources/release-it]]: "Unbounded queues mask the backlog: they accept work indefinitely, but response time grows without bound." This is Little's Law in action — see [[distributed/queueing-theory]].

### Credit-based flow control

The producer is granted a finite number of *credits* by the consumer; each submitted item consumes a credit; the consumer issues new credits as it drains work. TCP's sliding window is the classic example. Reactive Streams (Akka Streams, Project Reactor, RxJava) formalised this for application-level stream processing: subscribers signal demand to publishers via `request(n)`.

### Blocking I/O as implicit backpressure

In synchronous request-response systems, a slow downstream service causes the caller's I/O to block. From [[sources/release-it]] ch. 4 and [[sources/foundations-of-scalable-systems]] ch. 11: this is the *cause* of cascading failures, but it is also a form of backpressure — the slow service is signalling overload to the caller. The problem is that the signal arrives via thread blocking, which has terrible failure characteristics (no timeout, no graceful degradation). Replace with explicit signals + [[patterns/timeout]] + [[patterns/circuit-breaker]].

### Pull-based stream processing

Kafka-style log brokers retain messages on the broker side; consumers read at their own pace via offset tracking (→ [[streams/stream-processing]]). The broker doesn't need to push messages or buffer them in memory per-consumer. Consumer slowness manifests as consumer lag — observable, bounded by retention, and not a threat to broker stability.

### Async channel + auto-scaling

Producer submits to a durable queue; a consumer pool auto-scales based on queue depth. Producer never blocks; consumer pool adjusts to match producer rate (→ [[sources/understanding-distributed-systems]] ch. on rate limiting). The queue depth is the backpressure signal — visible to the auto-scaler, not to the producer.

## When Backpressure Is Not Available

When propagating backpressure isn't possible (the upstream is an uncontrolled client, the protocol doesn't support it, the slowdown would itself be a failure), the alternatives degrade in this order:

1. **Backpressure** — slow down the upstream
2. **Load shedding** — reject at the boundary with 503/429 (→ [[distributed/rate-limiting]])
3. **Bulkhead** — partition resources so failure is contained (→ [[patterns/bulkhead]])
4. **Circuit breaker** — stop calling a failing dependency entirely (→ [[patterns/circuit-breaker]])

These are complementary, not alternative. A complete stability strategy uses all four at different boundaries.

## Anti-patterns

**Unbounded queues.** The most common backpressure mistake. Java's `LinkedBlockingQueue` defaults to `Integer.MAX_VALUE` — effectively unbounded. Memory grows; response time grows; the system appears healthy until it doesn't. Always set an explicit capacity.

**Backpressure that propagates to the user.** If backpressure ultimately blocks an end-user-facing request, the user experiences it as a slow page. Backpressure between async stages is fine; backpressure between sync request-handling threads and a queue means the user waits. Use load shedding at the user-facing edge instead.

**Retries that defeat backpressure.** A client that retries immediately on rejection turns load shedding into amplification: the rejected request comes back as additional load. Exponential backoff with jitter is the standard mitigation (→ [[patterns/retry]]).

**Backpressure without observability.** Queue depth is a leading indicator of capacity exhaustion. From [[sources/release-it]] ch. 17: "watch queue depth as first indicator of performance degradation." If queue depth isn't monitored, backpressure is silent until it isn't.

## Backpressure and Architecture Style

Backpressure assumes upstream components can slow down. In synchronous architectures (REST chains, RPC), this means blocking — which is what causes cascading failures. In asynchronous architectures (event-driven, log-based messaging), it means producers continue at their natural rate and consumer lag accumulates as a tractable, observable quantity.

This is one of several structural reasons why [[styles/event-driven-architecture]] and [[streams/stream-processing]] handle variable load more gracefully than synchronous chains: backpressure is built into the substrate rather than retrofitted via stability patterns (→ [[comparisons/sync-vs-async-communication]]).

## Related Concepts

- [[distributed/queueing-theory]] — Little's Law, utilisation curves, why unbounded queues are pathological
- [[distributed/rate-limiting]] — the load-shedding side of the same problem
- [[patterns/bulkhead]] — isolating resources so backpressure in one partition doesn't affect another
- [[patterns/circuit-breaker]] — refusing to call a slow downstream that isn't responding to backpressure
- [[patterns/timeout]] — bounding how long you wait for backpressure to resolve
- [[operations/common-failure-causes]] — cascading failures as the failure mode backpressure prevents
- [[concepts/messaging]] — message-based architectures naturally support backpressure
- [[streams/stream-processing]] — pull-based consumption as the canonical backpressure pattern
- [[comparisons/sync-vs-async-communication]] — architectural decision that determines backpressure semantics
- [[comparisons/stability-pattern-selection]] — backpressure's role in the full stability pattern set
- [[comparisons/performance-and-capacity]] — backpressure as the answer to "queue depth growing without bound"

## Key Quotes

> "Every failing system starts with a queue backing up somewhere." — Nygard, [[sources/release-it]] ch. 8

> "Unbounded queues mask the backlog: they accept work indefinitely, but response time grows without bound." — [[sources/release-it]] ch. 5

> "Back pressure applies within a system boundary; Shed Load applies at the boundary." — [[sources/release-it]] ch. 5

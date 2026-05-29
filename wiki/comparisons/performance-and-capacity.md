---
title: "Performance and Capacity Decision Guide"
type: comparison
tags: [performance, capacity, queueing, tail-latency, scalability, decision-guide, slo]
sources: [foundations-of-scalable-systems, designing-data-intensive-applications, release-it, site-reliability-engineering, understanding-distributed-systems]
created: 2026-05-29
updated: 2026-05-29
---

# Performance and Capacity Decision Guide

## Key Claims

- **Most performance failures are queueing failures.** "Slow database" is a queue at the connection pool. "Cascading failure" is a queue at every blocked thread. "Tail latency amplification" is statistical consequence of queues in series. Diagnose at the queueing layer first.
- **Three results dominate the analysis.** Little's Law (`L = λW`) sizes capacity. Utilisation curve (`W = S/(1−ρ)`) explains why response time bends hyperbolically past 70% utilisation. Percentile arithmetic explains why averages lie and why P99 of fan-out approaches P99.9 of one call.
- **Measure percentiles, not averages.** P50, P95, P99, P99.9 with histogram-based aggregation (HdrHistogram, t-digest). Averaging percentiles across time windows is mathematically meaningless.
- **Set utilisation targets well below 100%.** 60-80% for application servers; lower for shared infra. This is the `W = S/(1−ρ)` curve, not a safety margin.
- **The bottleneck is downstream, not at the door.** Connection pools, downstream services, shared infra — the real ceiling. Sizing the front tier larger than the bottleneck just moves the queue upward.
- **Tail latency amplifies in fan-out.** N parallel backend calls inflate user-visible latency to the P99.9 of a single call. Either reduce N (BFF aggregation, denormalisation) or attack the per-call tail.

## Why This Page

[[distributed/queueing-theory]] is the formal foundation. [[distributed/backpressure]] is the architectural response. [[distributed/rate-limiting]] is the boundary defence. This page is the *playbook* — given a symptom, which lens to use and what to do.

## Symptom → Diagnosis → Action

The most common performance failures, mapped to the analytical lens that explains them.

### Symptom: P99 spiking under load

**Probable cause:** utilisation curve. Response time `W = S/(1−ρ)` bends hyperbolically past 70%. At ρ=0.9, W is 10× service time; at ρ=0.99, 100×. The spike is the curve, not a bug.

**Diagnose:**
- Plot utilisation per resource (CPU, memory, thread pool, connection pool, queue depth).
- Identify which resource hits high utilisation first under load.
- That's the bottleneck.

**Act:**
- Reduce utilisation target (autoscale earlier; add capacity).
- Reduce per-request work (caching, pagination, async offload).
- Switch to a less-contended resource (offload from DB connections to cache).
- See [[distributed/scalability]] for scale-out as the architectural fix.

### Symptom: average is fine, users complain

**Probable cause:** tail latency. Right-skewed distributions hide bad outliers behind a "healthy" mean.

**Diagnose:**
- Plot P50, P95, P99, P99.9. If P50 looks fine but P99 is 10×, you have a tail problem.
- Measure where the time is spent — instrument every blocking call.

**Act:**
- Reduce tail amplification: cut fan-out, parallelise less, hedge requests (issue the same call twice, take the first response).
- Attack the per-call tail: optimise the slow path, tune GC, increase per-instance capacity so individual calls don't queue.
- Set SLO on P99 or P99.9 (see [[operations/monitoring]]), not on mean.

### Symptom: cascading failure under load

**Probable cause:** queues in series + missing timeouts + missing backpressure. Slow downstream blocks calling threads; pool exhaustion propagates upstream.

**Diagnose:**
- Trace the request through every layer. Find the first thread pool that starts blocking.
- Check whether each blocking call has a timeout (it should).
- Check whether queues between stages are bounded (they should be).

**Act:**
- Add [[patterns/timeout]] on every blocking call (sized at dependency P99.9).
- Bound every queue. Default `LinkedBlockingQueue` capacity is wrong almost everywhere.
- Add [[patterns/circuit-breaker]] for sustained downstream failure.
- Add [[distributed/backpressure]] between async stages.
- See [[comparisons/stability-pattern-selection]] for the full pattern composition.

### Symptom: queue depth growing without bound

**Probable cause:** arrival rate exceeds service rate. Little's Law: `L = λW`; if λ > 1/S sustained, L grows linearly with time.

**Diagnose:**
- Plot arrival rate vs service rate over time. Is arrival sustainably higher?
- Plot queue depth over time. Linear growth = sustained overload.

**Act:**
- Increase consumer capacity (scale-out, optimise).
- Shed load at the producer: return 503; cost of rejection beats cost of unbounded latency (see [[distributed/rate-limiting]]).
- Reject quickly at the queue boundary; never let it grow unbounded.

### Symptom: thundering herd / dogpile

**Probable cause:** synchronised demand from cache expiry, simultaneous restart, or cron-on-the-hour.

**Diagnose:**
- Check restart logs, cache TTLs, cron schedules for synchronisation.
- Plot request rate per second around incident time — look for sharp spikes.

**Act:**
- Random clock slew on cron jobs.
- TTL jitter on caches (`TTL ± random(20%)`).
- Exponential backoff on restart retries.
- Pre-warm caches before they expire (probabilistic early renewal).
- Constant work pattern: don't react to demand, just produce output continuously (see [[distributed/rate-limiting]]).

### Symptom: works in QA, fails in production

**Probable cause:** scaling effects, O(n²) communication, or load behaviour absent at small scale.

**Diagnose:**
- Count point-to-point connections at production scale; if O(n²), expect cliff failures.
- Measure thread pools, connection pools at production load — do they saturate?
- Are queues that look fine in QA actually filling under real load?

**Act:**
- Replace P2P communication with pub/sub or message bus.
- Test at 10× expected peak load, not nominal.
- Use canary deployment ([[patterns/progressive-delivery]]) to surface scaling effects before full rollout.
- Run chaos experiments at production load ([[operations/chaos-engineering]]).

### Symptom: slow during deploy / health-check storm

**Probable cause:** instances marked unhealthy by health checks, taken out of pool, surviving instances overwhelmed.

**Diagnose:**
- Check whether health check thresholds are too sensitive.
- Check whether all instances fail health checks simultaneously (mass-failure cascade).
- Check whether the load balancer drains gracefully.

**Act:**
- Implement lame duck state — backend signals draining before shutdown.
- Mass-failure detection at the LB: if all instances fail, assume health check is broken; keep routing.
- Slow rolling deploy; one instance at a time; verify health before continuing.

## The Three Analytical Lenses

### Lens 1: Little's Law

`L = λW` — average number in system = arrival rate × average time in system.

**Use it to:**
- Size thread pools, connection pools, Lambda concurrency. Given target throughput λ and acceptable W, you need L concurrent in-flight requests' worth of capacity.
- Diagnose unbounded queues. If λ exceeds service rate even briefly, L grows without bound; since L = λW with λ fixed, W grows without bound.
- Size listen queues: Nygard's heuristic `(max_wait_time / mean_processing_time + 1) × thread_count × 1.5`.

### Lens 2: Utilisation curve

`W = S / (1−ρ)` — response time as a hyperbolic function of utilisation.

**Use it to:**
- Set utilisation targets. At ρ=0.7, W is 3.3× service time; this is usually where to set the autoscale trigger.
- Explain to non-engineers why "use the servers we already have, push them harder" doesn't work. Response time triples between 50% and 75% utilisation; it doubles again between 75% and 87.5%.
- Pick warmup periods on auto-scaled fleets. New instances at ρ=0 attract too much traffic and oscillate.

### Lens 3: Percentile arithmetic

Right-skewed distributions; averages lie; percentiles tell the truth; can't average percentiles.

**Use it to:**
- Define SLIs/SLOs on percentiles, not means (see [[operations/monitoring]]).
- Predict fan-out tail amplification: N parallel calls have request-level P99 = single-call P99.9 (approximately).
- Aggregate metrics correctly: use sketch data structures (HdrHistogram, t-digest, forward decay) that preserve the distribution.

## Capacity Planning Workflow

A repeatable process for sizing systems.

1. **Define SLO.** Target latency at P99 (or P99.9 if user-facing); target availability; acceptable error rate.
2. **Measure service time S** under low load (no queueing). This is the floor — you can't go below it.
3. **Project arrival rate λ.** Use historical data + growth + seasonality. Plan for peak, not average.
4. **Pick utilisation target ρ.** 60-80% for stateless application servers; 50-70% for stateful systems; lower for shared infra. The hyperbolic curve is your guide.
5. **Compute concurrent in-flight L = λW** at the target utilisation. Size pools accordingly.
6. **Add headroom for tail amplification.** If the request fans out to N backends, the effective per-instance load is higher than λ suggests.
7. **Stress test at 10× expected peak.** Find the actual breaking point. Set the alerting threshold below it.
8. **Run chaos experiments** (see [[operations/chaos-engineering]]) to verify the system behaves under failure, not just under load.

## Avoid These Capacity Antipatterns

**Sizing for average, not peak.** Sizing for average means the system fails at peak. Almost all systems are oversubscribed at peak.

**Linear scaling assumptions.** Coordination costs (locking, consensus, cache coherency) become bottlenecks at scale (Amdahl's Law). Past a certain point, adding nodes makes things slower.

**Running at high utilisation "for efficiency."** Efficient throughput is not the same as high utilisation. Past 70%, response time bends hyperbolically — the cost is latency, paid by every user.

**Unbounded queues "in case of bursts."** Bursts are temporary; queues that grow during bursts produce latency that takes far longer to recover than the burst itself.

**Per-service capacity planning without coordination.** Each service sized to handle peak, but the *system* never sees peak in every service simultaneously. Cell-based architecture (one cell handles a slice of traffic) avoids the worst of this.

**Adding capacity to fix a queueing problem.** If the bottleneck is downstream, adding upstream capacity moves the queue, doesn't shrink it. Find the actual bottleneck first.

**Mean-based SLOs.** A service with P50=200ms and P99=3000ms has a healthy mean and an unhealthy user experience. Define SLOs at the percentile that matters.

## When Performance Tuning Doesn't Apply

Performance tuning has scope. When the problem is elsewhere, tuning is wasted.

**Architecture-bound performance:** distributed monolith with synchronous chains, shared database with lock contention, fan-out into too many small services. The fix is architectural ([[styles/microservices-architecture]] critique; [[styles/event-driven-architecture]]; [[concepts/architecture-quantum]]), not parameter tuning.

**Algorithm-bound performance:** O(n²) query or worse. The fix is algorithmic; doubling hardware buys one more level of `n`.

**Workload-bound performance:** if the *demanded* throughput exceeds what's physically possible at any cost, the fix is workload reshaping — batching, deferral, partial results, async confirmation. See [[comparisons/sync-vs-async-communication]].

**Cost-bound performance:** you could solve it with money, but the business won't fund the solution. The fix is documenting the trade-off (see [[concepts/cost-as-architectural-force]]) and getting decision authority to accept the consequence.

## How Different Sources Treat It

| Source | Angle |
|--------|-------|
| [[sources/foundations-of-scalable-systems]] | The practitioner's guide to queueing in distributed systems — utilisation, queue depth, blocked threads, producer-consumer, application-server anatomy. |
| [[sources/designing-data-intensive-applications]] | Canonical treatment of percentile arithmetic, tail latency amplification, the maths of why averages lie, sketch data structures for aggregation. |
| [[sources/release-it]] | The failure mechanism — every failing system starts with a queue backing up somewhere. Sizing heuristics; bounded queues; the cost of "design for QA." |
| [[sources/site-reliability-engineering]] | SLI/SLO discipline; percentile-based alerting; load shedding at 503 thresholds; "high-variance services are user-unfriendly even when fast on average." |
| [[sources/understanding-distributed-systems]] | Connects queueing to load levelling: durable queue + auto-scaled consumers absorbs producer bursts without overwhelming consumers. |

## Related Concepts

- [[distributed/queueing-theory]] — Little's Law, utilisation curve, percentile arithmetic
- [[distributed/backpressure]] — flow control as the architectural response
- [[distributed/rate-limiting]] — load shedding and load levelling at boundaries
- [[distributed/scalability]] — scale-out as the architectural performance lever
- [[concepts/stability-patterns]] — timeouts, circuit breakers, bulkheads as performance protectors
- [[comparisons/stability-pattern-selection]] — selection guide for the patterns
- [[operations/monitoring]] — percentile-based SLIs; burn-rate alerting
- [[operations/common-failure-causes]] — cascading failures from queueing collapse
- [[operations/chaos-engineering]] — verifying the system performs under failure
- [[patterns/timeout]], [[patterns/circuit-breaker]], [[patterns/bulkhead]] — the protector patterns
- [[concepts/cost-as-architectural-force]] — performance is purchased with money; the trade-off is real

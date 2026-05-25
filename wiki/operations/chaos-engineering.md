---
title: "Chaos Engineering"
type: concept
tags: [chaos-engineering, resiliency, fault-injection, testing, reliability, availability]
sources: [release-it]
created: 2026-05-19
updated: 2026-05-19
---

# Chaos Engineering

## Definition

Chaos engineering is "the discipline of experimenting on a distributed system in order to build confidence in the system's capability to withstand turbulent conditions in production." (→ [[sources/release-it]] ch. 17, citing principlesofchaos.org)

It is empirical, not formal: experiments are run against the real system to learn what it *does*, not models to verify what it *should* do.

## Why Production, Not Staging

Staging environments are never full-size replicas of production; their economics make that impossible. Certain system properties only emerge at production scale:

- Cascading failures and retry storms (triggered by specific load/component ratios)
- Dogpile effects (synchronised cache expiry under load)
- Single points of failure that have never failed in controlled environments
- Network congestion behaviour (congested networks are qualitatively different from uncongested ones)

More importantly: **safety is not a composable property**. Two services that are individually safe may not be safe in composition. Example: client enforces a 50 ms timeout; each of two providers has P99.9 latency of 30 ms — each call is individually safe, but a sequential call to both will breach the timeout for a meaningful percentage of requests. This emergent failure mode is invisible from component-level testing.

## Theoretical Foundations

**Drift into failure** (Dekker, *Drift into Failure*): economic pressure continuously pushes systems toward safety boundaries. Highly optimised, highly efficient systems handle disruption badly — they break catastrophically rather than gracefully. Chaos engineering creates a countervailing force that optimises for availability and disruption tolerance, not just throughput.

**Fundamental regulator paradox** (Weinberg, *General Principles of Systems Design*): the better a regulator suppresses variation, the less information it generates about its own quality. "You don't know how much you depend on your IT staff until they go on vacation." The same applies to stability mechanisms that are never exercised.

**Volkswagen microbus paradox**: you learn to fix what breaks often; what rarely breaks stays mysterious — and when it does break, the situation is worse because no one knows how to fix it. Controlled low-level breakage prevents expertise atrophy.

**Antifragility** (Taleb, *Antifragile*): some systems gain strength from stressors. Distributed software doesn't do this naturally. Chaos engineering simulates stressors to build strength, the way a weightlifter uses iron.

## Prerequisites

Before running chaos in production:

1. **Irreplaceable-request check**: if every request is irreplaceable (financial transactions with no idempotency), chaos engineering may not be appropriate. You must be able to break the system without breaking the business.
2. **Blast radius control**: identify how to limit the fraction of users or requests affected (e.g., every 10,000th request fails; criteria-based victim selection rather than pure randomness).
3. **Distributed tracing**: trace each request through the system to determine whether it ultimately succeeded or failed, despite injected faults. Both outcomes are informative.
4. **Meaningful monitoring**: you must be able to detect when failure rates shift by small amounts. "If you have a wall full of green dashboards, that means your monitoring tools aren't good enough" (Charity Majors). Monitoring infrastructure must be independent of production traffic paths.
5. **Recovery plan**: the system may not auto-recover when the chaos test ends. Know what to restart, disconnect, or clean up.

## Designing the Experiment

1. **Form a hypothesis**: expressed as an invariant the system should maintain under turbulent conditions. Focus on externally observable behaviour, not internals. Example: "Clustered services should remain functional when any single instance is terminated."
2. **Define steady state**: verify you can currently measure whether the steady state holds. Identify monitoring blind spots before injecting chaos.
3. **Define rejection criteria**: what evidence would falsify the hypothesis? Account for baseline noise (mobile aborts, expected failure rates under normal operation). Statistical rigor prevents false conclusions.
4. **Inject fault**: apply one of the injection types below.
5. **Observe**: compare experimental group vs control group.

## Injection Types

| Injection | Tool | What it finds |
|-----------|------|--------------|
| Instance termination | Chaos Monkey | Missing autoscaling; configuration problems; implicit singleton roles |
| Latency injection | Latency Monkey | Missing timeouts; race conditions exposed by out-of-order responses |
| Service-to-service call failure | FIT (Netflix) | Missing fallbacks; cascading failure paths; over-reliance on non-critical services |
| Region termination | Chaos Kong | Cross-region resilience; DNS failover correctness |

**FIT (Failure Injection Testing)**: tag a request at the API gateway with a cookie specifying "when G calls H, fail this call." At the call site, the framework reads the cookie and reports failure without making the network call. Enables precise, controllable testing of deep call trees without infrastructure disruption.

## Targeting Strategy

**Start with randomness**: most immature systems have so many problems that random injection (random cluster, random instance) will uncover something significant immediately.

**Progress to targeted injection**: as easy problems are fixed, the search space becomes sparse but non-uniform. Apply knowledge of the call tree: a top-level request generates a tree of supporting calls; removing one node either succeeds (revealing redundancy) or fails (revealing a crucial dependency). Both outcomes are valuable.

**Learn from non-failures**: cases where a fault was injected but the request succeeded reveal redundancy paths. These are as important as failure cases — they document where safety exists, so it isn't accidentally removed.

**Cunning malevolent intelligence** (Peter Alvaro, UC Santa Cruz): collect traces of normal workload; build a graph of service dependencies; use graph algorithms to find crucial links to cut; automatically learn about redundancy from successful injections. Dramatically narrows the search space as the system matures.

## Opt-In vs Opt-Out

- **Opt-out** (Netflix model): all services are subject to Chaos Monkey by default; exemptions require explicit sign-off and carry engineering-management review. Higher coverage, higher reliability improvement.
- **Opt-in**: lower resistance, easier to start, but adoption rates are much lower.

Recommended strategy: start opt-in to build success stories and organizational confidence, then migrate to opt-out as the culture matures.

## Automation and Moderation

Once a vulnerability class is found, automate the injection. Apply constraints to prevent the automation from being destructive:
- Never kill the last instance in a cluster.
- Don't simultaneously fail all fallbacks for a service.
- Gate side effects (emails, payments) — especially important during any kind of reprocessing.

A **chaos automation platform** (e.g., Netflix's ChAP) manages what injections to apply, to whom, and when, while enforcing safety constraints and reporting test events to monitoring systems for correlation with production behaviour.

## Disaster Simulations (Human Side)

Chaos engineering applies to the human side of systems too. Organisations have SPOFs in key personnel: specific people hold crucial knowledge, access, or roles.

**Zombie simulation**: randomly designate a percentage of staff as "unavailable for the day" (they cannot respond to communications or perform work tasks). Observe what breaks. Review issues in a postmortem format; resolve through documentation, role distribution, or automation.

Apply incrementally: confirm you can operate at normal load with 20% zombie rate before introducing concurrent system fault injection.

## Related Concepts

- [[operations/monitoring]] — prerequisite: monitoring must detect small changes in failure rates; chaos tests are annotated as events on dashboards
- [[operations/availability]] — chaos engineering operationally validates SLO targets and resiliency mechanisms
- [[operations/common-failure-causes]] — drift into failure; cascading failures and composability of safety
- [[concepts/fitness-functions]] — chaos tests are a category of holistic fitness function; some teams run chaos in CI pipelines
- [[patterns/circuit-breaker]] — chaos is the empirical test of whether circuit breakers are correctly placed and configured
- [[patterns/bulkhead]] — instance termination tests whether bulkheads actually isolate blast radius
- [[operations/observability]] — distributed tracing is a prerequisite for chaos experiments

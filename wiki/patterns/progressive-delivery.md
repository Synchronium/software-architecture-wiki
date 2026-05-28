---
title: "Progressive Delivery"
type: pattern
tags: [progressive-delivery, deployment, release, canary, feature-flags, risk-management]
sources: [site-reliability-engineering, release-it, mastering-api-architecture, building-evolutionary-architectures, monolith-to-microservices, accelerate]
created: 2026-05-28
updated: 2026-05-28
---

# Progressive Delivery

## Definition

Progressive delivery is the practice of releasing changes to production in stages, where each stage exposes the change to a controlled subset of traffic or users before the next stage. The defining property is that **deployment is decoupled from release**: code is shipped to production servers without being immediately visible to all users; visibility ramps up over time as confidence grows. Variants include canary release, blue-green deployment, ring deployment, dark launching, and feature-flagged rollouts.

## Why It Matters

The risk of any change is unknown until that change runs under real production load on real production data with real users. Pre-production testing reduces risk but cannot eliminate it (→ [[operations/testing-for-reliability]]). Progressive delivery makes the production environment itself the final test bench, limiting blast radius to a controllable fraction of traffic and providing fast rollback when an issue is detected. From [[sources/site-reliability-engineering]] ch. 36: "Canary rigorously even for 'low-risk' changes — the combination of a change with an unlikely configuration keyword triggered the crash-loop outage."

The economic argument is in [[sources/release-it]] ch. 1: routine, low-risk deployment via progressive delivery transforms release from a $100K event (40-person deployment armies, midnight UAT, all-hands rollback) into a one-button operation that's safe enough to do during business hours.

## The Core Decoupling: Deployment vs Release

This distinction is the cognitive shift that makes progressive delivery possible.

- **Deployment:** placing built artefacts on production infrastructure. Routine, scriptable, low-stakes.
- **Release:** exposing the deployed code to traffic. Reversible, observable, controlled.

Without this decoupling, every deployment is a release and every release is a binary risk event. With it, a deployed-but-not-released change can be observed in production (via shadow traffic, internal users, feature flags) and released gradually. From [[sources/building-evolutionary-architectures]]: feature toggles make deployment "boring" by removing the all-or-nothing characteristic.

## Mechanisms

### Canary Release

A small fraction of traffic is routed to the new version while the rest continues to the old version. Metrics are compared; if the canary holds (error rate, latency percentiles, business KPIs within bounds), traffic is incrementally shifted toward the new version.

From [[sources/site-reliability-engineering]] ch. 17: "Canary tests... expose new version to live traffic; exponential rollout with order-of-fault estimation (U=1: scales linearly with traffic; U=2: randomly damages data a future user will see; U=3: damaged data is also a valid identifier; most bugs are U=1)." The order-of-fault model justifies exponential rollout: U=1 bugs are found cheaply at small canary fractions, so most bugs are caught before broad exposure.

**Operational requirements:**
- Identical observability for canary and baseline (same dashboards, same alerts)
- Comparable workload routing (random sample, not "European traffic only")
- Automated abort on metric deviation (see [[operations/chaos-engineering]]'s ChAP for an extreme case)
- Sufficient canary traffic to achieve statistical power within the rollout window

### Blue-Green Deployment

Two identical production environments (blue = current, green = new). Deploy to green; smoke-test; switch the router to point at green. Old environment remains as instant rollback target.

**Trade-offs vs canary:**
- Faster cutover, simpler routing logic
- Either-or; no gradual ramp
- Requires double the production capacity during the switch
- Database/state migrations are harder (both environments may share the DB)
- Cleaner for stateless tiers; canary is usually better for stateful systems

Hybrid pattern: blue-green for the infrastructure, canary for the routing once green is live.

### Ring / Geographic Deployment

A progression of deployment targets ordered by risk tolerance: internal users → beta users → small region → larger region → global. Standard practice at Google and Microsoft. From [[sources/site-reliability-engineering]]: "*Progressive rollouts*: staged, supervised, across geographies; roll back first, diagnose second."

The "roll back first, diagnose second" rule is the key cultural property: rollback is a routine response to deviation, not a defeat. Diagnosis happens once the production fire is out.

### Dark Launching

Deploy the change and route real traffic to it, but discard the result and serve users from the old path. The new code path runs in production under real load before any user depends on it. Used heavily for performance validation, cache warming, and verifying that downstream dependencies can absorb the new traffic.

Distinct from canary: in dark launching, *no users see the new behaviour*; the goal is performance/load characterisation.

### Parallel Run

Both old and new code run on every request; results are compared; one result is returned. The other is logged for offline correctness analysis. See [[patterns/parallel-run]] for the full pattern — particularly useful for refactoring or platform migration where correctness equivalence is the primary risk.

GitHub's Scientist library is the canonical implementation. Distinct from canary (correctness comparison, not load-based metrics) and from dark launching (both paths execute and are compared, vs old serving and new being discarded).

### Feature Flags

The release control lives in application code: a flag determines whether the new behaviour is visible to a given request. Allows runtime control, per-user/per-cohort targeting, and instant disable without redeployment. See [[concepts/feature-flags]] for the full treatment. From [[sources/building-evolutionary-architectures]]: feature toggles decouple deployment from release at the application layer rather than the infrastructure layer.

## The Pattern Spectrum

| Pattern | Granularity of control | Rollback speed | Capacity overhead | Stateful-system fit |
|--------|----|-----|----|---|
| Blue-green | Binary (all or none) | Instant (router flip) | 2× during switch | Difficult |
| Canary | Traffic fraction | Fast (rebalance traffic) | Marginal | Good |
| Ring | User cohort | Per-ring | Marginal | Good |
| Dark launch | None (no users see) | N/A | 2× per-request | N/A |
| Parallel run | Per-request comparison | Instant (drop new) | 2× per-request | Good (read-only) |
| Feature flag | Per-user / per-cohort | Instant (flag flip) | None | Good |

Real organisations combine multiple: infrastructure-level canary deployment with application-level feature flags is common.

## Prerequisites

Progressive delivery rests on a stack of preceding capabilities. From [[sources/accelerate]]'s [[concepts/continuous-delivery-practices]]:

1. **Trunk-based development** — long-lived branches make progressive delivery harder, not easier
2. **Automated deployment pipeline** — manual deployment is incompatible with frequent staged rollout (→ [[concepts/deployment-pipelines]])
3. **Comprehensive automated tests** — pre-canary tests reduce the rate of canary aborts
4. **Production observability** — without metrics comparable across versions, "did the canary hold?" is unanswerable (→ [[operations/observability]])
5. **Loose architectural coupling** — services that can be released independently (→ [[concepts/architecture-quantum]])
6. **Database schema evolution practices** — expand/contract, dual-write, never-rename (→ [[concepts/evolutionary-database-design]])

## Anti-patterns

**Canary without comparable observability.** If the new version has different telemetry than the baseline, deviation detection is unreliable. Decision quality is bounded by metric quality.

**Stale-flag accumulation.** Feature flags that were never removed after rollout become dead conditionals. From [[sources/building-evolutionary-architectures]]: feature flags are technical debt with a use-by date. See [[concepts/feature-flags]] for the lifecycle discipline.

**Rollback fear.** If teams treat rollback as failure, they will hesitate, diagnose first, and let the incident grow. The SRE principle is "roll back first, diagnose second" — rollback must be a low-status routine action.

**Schema changes that can't be progressively delivered.** A breaking database migration cannot be canaried — old code can't read new schema. Use expand/contract patterns (→ [[concepts/evolutionary-database-design]]) so the schema accommodates both versions during the rollout window.

**Insufficient canary traffic for signal.** A 1% canary on a low-traffic service may never generate enough samples to detect a P99 regression within the rollout window. Either scale up the canary fraction, lengthen the window, or accept that low-traffic services need different deployment patterns.

**Coupled rollback.** If the new version writes data the old version can't read, rolling back the code is not enough — you have to roll back data too. Design rollback paths during feature design, not during the incident.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/site-reliability-engineering]] | Canary as a structured user-acceptance test, not a "test" in the conventional sense; exponential rollout justified by order-of-fault analysis; "roll back first, diagnose second"; progressive rollouts as the geographical analogue. |
| [[sources/release-it]] | The economic case: progressive delivery transforms release from a six-figure event into a one-button operation; coupling of deployment friction and operational cost; "design for production." |
| [[sources/building-evolutionary-architectures]] | Feature toggles as the decoupling mechanism that makes evolution safe; toggles as technical debt with a use-by date; deployment ≠ release. |
| [[sources/mastering-api-architecture]] | API-level progressive delivery: traffic splitting at the gateway, versioned routing, parallel run for API migration. |
| [[sources/monolith-to-microservices]] | Strangler fig as a long-running progressive delivery from old to new architecture; parallel run for correctness validation during migration. |
| [[sources/accelerate]] | Empirical evidence: high-performing organisations release more frequently, with lower change-failure rate, faster MTTR — all enabled by the progressive-delivery toolchain. |

## Related Concepts

- [[concepts/feature-flags]] — application-layer release control
- [[concepts/deployment-pipelines]] — the automation substrate
- [[concepts/continuous-delivery-practices]] — the broader capability set
- [[patterns/parallel-run]] — correctness-comparison variant
- [[patterns/strangler-fig]] — long-running architectural progressive delivery
- [[concepts/evolutionary-database-design]] — schema patterns that survive partial rollout
- [[operations/observability]] — prerequisite for canary decisions
- [[operations/chaos-engineering]] — ChAP as automated canary + experiment combined
- [[operations/error-budgets]] — budget exhaustion as a release-rate brake
- [[concepts/four-key-metrics]] — deployment frequency, change failure rate, MTTR all influenced by progressive delivery

## Key Quotes

> "Canary rigorously even for 'low-risk' changes." — [[sources/site-reliability-engineering]] ch. 17

> "Roll back first, diagnose second." — [[sources/site-reliability-engineering]]

> "$50,000 invested in a zero-downtime deployment pipeline returns 18× over five years." — [[sources/release-it]] ch. 1

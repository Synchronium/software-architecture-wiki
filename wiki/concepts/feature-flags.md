---
title: "Feature Flags"
type: concept
tags: [feature-flags, feature-toggles, deployment, release, progressive-delivery, technical-debt]
sources: [building-evolutionary-architectures, understanding-distributed-systems, accelerate, monolith-to-microservices, release-it]
created: 2026-05-28
updated: 2026-05-28
---

# Feature Flags

## Definition

A feature flag (or feature toggle) is a runtime conditional in application code that determines whether a given code path is active for a given request. The flag's state is controlled by configuration external to the deployment, so the same deployed artefact can present different behaviour to different users without redeployment. Variants include release toggles, experiment toggles, ops toggles, and permission toggles — each with different lifecycles and audiences.

## Why It Matters

Feature flags are the application-layer mechanism that makes [[patterns/progressive-delivery]] possible without infrastructure changes. They decouple **deployment** (placing code in production) from **release** (exposing it to users), enabling:

- **Trunk-based development of large changes:** ship incomplete code behind a flag rather than maintaining a long-lived branch (→ [[concepts/continuous-delivery-practices]])
- **Targeted rollouts:** enable for internal users, then 1% of traffic, then a cohort, then everyone
- **Kill switches:** instant disable of a misbehaving feature without rollback
- **A/B testing and experimentation:** route different cohorts to different code paths and measure
- **Operational levers:** disable expensive features under load shedding (→ [[distributed/rate-limiting]])

The cost is that every flag is a runtime branch with two behaviours that must be maintained, tested, and eventually removed. Flags accumulate as technical debt with a use-by date.

## Toggle Categories

Pete Hodgson's taxonomy (referenced in [[sources/building-evolutionary-architectures]]) distinguishes four kinds, each with different lifecycle expectations:

| Type | Purpose | Audience | Expected lifetime |
|------|---------|----------|---------|
| **Release toggle** | Hide unfinished features in trunk | Developers, then users | Short (days to weeks); remove on launch |
| **Experiment toggle** | A/B test variants | Users (cohort-based) | Medium (weeks); remove on decision |
| **Ops toggle** | Operational control under load | Operators | Long-lived; documented as ops lever |
| **Permission toggle** | Premium/entitlement gating | Users (entitlement-based) | Permanent (becomes a feature of the product) |

Conflating these categories is the most common source of feature-flag mess. A "temporary release toggle" that quietly becomes a permission toggle becomes a permanent runtime conditional with no owner. The taxonomy is partly a discipline for forcing the question: *which kind of toggle is this, and what's the removal trigger?*

## Lifecycle Discipline

Flags are technical debt that pays back only if it is repaid. The lifecycle:

1. **Introduce** — wrap the new code path in a flag; flag defaults to off
2. **Test** — internal users / dev environment with flag on
3. **Roll out** — enable for cohorts of increasing size; observe (→ [[patterns/progressive-delivery]])
4. **Stabilise** — flag is on for 100% of traffic; old path is unused
5. **Remove** — delete the flag, delete the old code path, simplify the conditional

Step 5 is the most commonly skipped. The remedy is process discipline:
- Every flag has an owner and an expected removal date in its config
- Stale-flag dashboards flag toggles past their expected removal
- "Toggle debt" is a backlog item, not a "nice to have"

From [[sources/building-evolutionary-architectures]]: feature toggles are tracked as technical debt; teams that accumulate dozens of permanent "temporary" flags develop runtime behaviour they no longer understand.

## Architectural Implications

### Flags as configuration, not deployment

The flag store is a configuration system — runtime-mutable, low-latency, available even when the deployment pipeline is not. From [[sources/understanding-distributed-systems]]: feature flags belong to the [[operations/manageability]] triad — dynamic configuration that can be changed without redeploying. The config store itself must be designed for availability; a flag store outage that defaults closed turns a routine config issue into an outage.

### Default behaviour matters

Every flag has a default-when-the-config-system-is-unreachable. "Default off" is conservative (new feature stays off if config is unavailable). "Default on" is required for ops toggles whose default state is the steady-state behaviour. Make the default explicit in code, not implicit in the config store's behaviour.

### Cohort routing

User-targeted flags need a stable bucketing function — typically a hash of `(user_id, flag_name)` modulo the rollout percentage. Stability matters: a user who sees the new behaviour at 5% should still see it at 10%, not be re-shuffled into the old behaviour. Hash-based bucketing handles this; random per-request bucketing doesn't.

### Multi-flag interactions

Two flags that are each safe alone may interact unexpectedly. The combinatorial space is N² for N flags. Mitigations: limit the set of simultaneously rolling-out flags; document known interactions; treat the cross-product space the way [[operations/chaos-engineering]] treats combined-failure experiments.

### Flags and architectural coupling

A flag-heavy codebase has a high "static coupling" cost: code paths that may or may not execute at runtime are harder to reason about than code paths that are simply present or absent. Use flags where the runtime control is genuinely needed; prefer build-time exclusion (compile-time feature toggles, branch-based) when runtime control is not needed.

## Feature Flags vs Other Release Mechanisms

| Mechanism | Granularity | Runtime control | Lifecycle |
|----|----|----|----|
| Feature flags | Per-user/per-request | Yes (instant) | Short → permanent (4 toggle types) |
| Canary deployment | Traffic fraction | Via routing | Single release |
| Blue-green | All/nothing | Via routing | Single release |
| Branch-by-abstraction | Code level | No | During migration |
| Parallel run | All requests | Via routing | During verification |

Feature flags are the *finest-grained* of these tools and the only one with per-user targeting. They are also the only one with significant ongoing maintenance cost — the others end when the release ends.

## Operational Patterns

### Kill switches

Every newly launched feature should have an ops-toggle kill switch that disables it instantly. This is distinct from a release toggle: a release toggle is removed when rollout completes; a kill switch is kept indefinitely as an operational lever. The cost of a permanent kill switch is one runtime conditional; the benefit is sub-minute MTTR for feature-induced incidents (→ [[operations/availability]]).

### Circuit-breaker-driven flags

Connect flag state to circuit-breaker state: when a downstream dependency's circuit opens, automatically disable features that depend on it. The flag becomes the application's response to the breaker, gracefully degrading rather than failing (→ [[patterns/circuit-breaker]], [[operations/common-failure-causes]]).

### Load-shedding flags

Expensive features (search, recommendations, personalisation) can be flagged off under load shedding — the system degrades to the cheap baseline rather than failing entirely (→ [[distributed/rate-limiting]]).

## Anti-patterns

**Permanent "temporary" flags.** The flag was added for a 2-week rollout three years ago. The team that owned it doesn't exist. Removing it is risky because no one knows what depends on the off-path. Prevention: every flag has an owner and an expected removal date.

**Flag-driven branching that should be subtyping.** A flag becomes a permanent toggle because the two behaviours are genuinely different products. Move to a real subtype/strategy pattern; reserve flags for *transient* behaviour differences.

**Configuration coupled across services.** A flag that controls behaviour in multiple services creates implicit coordination requirements. Either the flag becomes a release-coordination point (defeating independent deployment) or services drift out of sync. Prefer per-service flags whose interaction is explicit.

**Untested off-path / on-path.** If the test suite only exercises one flag state, regressions can hide in the unexercised path. Test both paths; if testing both is too expensive, that's evidence the flag should be removed.

**Flag state as security boundary.** A permission toggle that's the only thing standing between a user and a premium feature can be bypassed by a client that controls the flag check. Permission decisions belong server-side, not in a UI-visible flag.

**Flag thrashing during incidents.** Flipping a flag back and forth during an incident creates a moving target for diagnosis. Stabilise (on or off) and observe; flip once.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/building-evolutionary-architectures]] | Feature toggles as the mechanism that makes deployment ≠ release possible; explicit recognition as technical debt with a use-by date; key enabler for trunk-based development of large changes. |
| [[sources/understanding-distributed-systems]] | Feature flags as part of the [[operations/manageability]] triad: dynamic configuration that can be changed at runtime; kill switches; A/B test routing. |
| [[sources/accelerate]] | Empirical evidence: trunk-based development + feature flags correlate with higher [[concepts/four-key-metrics]] performance. The mechanism by which CD practices are realised in code with incomplete features. |
| [[sources/monolith-to-microservices]] | Toggles support strangler migrations: route a fraction of traffic to the new service; route specific user cohorts; instant rollback if a migration step misbehaves. |
| [[sources/release-it]] | Ops toggles as resilience tools: kill switches, load-shedding flags, dependency-failure graceful-degradation flags. Feature flags as part of the "design for production" toolkit. |

## Related Concepts

- [[patterns/progressive-delivery]] — the broader release pattern feature flags enable
- [[operations/manageability]] — flags as dynamic configuration
- [[concepts/continuous-delivery-practices]] — flags as a prerequisite for trunk-based dev
- [[concepts/four-key-metrics]] — flags improve deployment frequency and reduce change-failure rate
- [[patterns/strangler-fig]] — flags as the routing mechanism for incremental migration
- [[patterns/parallel-run]] — flags for routing between old and new implementations
- [[patterns/circuit-breaker]] — flags as automatic responses to breaker state
- [[operations/error-budgets]] — flag-driven feature disable as a budget-preservation tool

## Key Quotes

> "Feature toggles allow developers to deploy code to production that isn't yet active for users — but each toggle is technical debt with a use-by date." — [[sources/building-evolutionary-architectures]]

> "Deployment ≠ release." — [[sources/building-evolutionary-architectures]]

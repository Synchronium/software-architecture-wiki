---
title: "Parallel Run"
type: pattern
tags: [migration, testing, verification, deployment, microservices, canary]
sources: [monolith-to-microservices]
created: 2026-05-15
updated: 2026-05-28
---

# Parallel Run

## Definition

**Parallel Run** is a verification technique where both an existing implementation and a new replacement implementation are called simultaneously for the same request. Their results are compared. The old implementation remains the source of truth until the new one is proven; only then is the switchover completed. (→ [[sources/monolith-to-microservices]])

The pattern is distinct from [[patterns/branch-by-abstraction]] (which provides the structural mechanism for coexistence) — parallel run is the *verification strategy* applied during the coexistence phase.

## Structure

```
Request →  ┌────────────────────┐
           │  Parallel Router   │
           └──────┬──────┬──────┘
                  │      │
          Old     │      │  New
          Impl    │      │  Impl
                  │      │
                  └──────┘
                  Compare results
                  Log mismatches
                  Return OLD result to caller
```

The old implementation's result is always returned to the caller — the new implementation's result is used only for comparison, not served to the user. This makes the pattern safe: bugs in the new implementation cannot affect user experience.

## Key Concepts

**Spies**: test-double style wrappers around the new implementation that record its responses without exposing them to callers. The spy allows the comparison logic to inspect the new implementation's output independently of the control flow that returns the old result.

**GitHub Scientist library**: a library (originally from GitHub's Ruby codebase, ported to many languages) that operationalises the parallel run pattern (→ [[sources/monolith-to-microservices]]). It handles: running both implementations, measuring latency, catching exceptions from the new implementation, comparing results, and publishing mismatch metrics — with the experiment result always determined by the old ("control") implementation.

**Mismatch rate as the rollout signal**: the percentage of requests where old and new disagree is the primary rollout metric. When the mismatch rate reaches zero across a representative sample, confidence is sufficient to complete the switchover.

## Deployment Terminology

Newman draws explicit distinctions between deployment, dark launching, canary releasing, and parallel run — terms often conflated in practice (→ [[sources/monolith-to-microservices]]):

| Term | Description |
|------|-------------|
| **Dark launching** | New implementation is deployed and receives *real* production traffic but its results are discarded; used to test performance and side effects without impacting users |
| **Canary releasing** | A small percentage of *users* are routed to the new implementation; they see the new implementation's results; used for gradual rollout |
| **Parallel run** | *Both* implementations receive every request; old result is served; new result is compared; used for correctness verification |

A parallel run provides the strongest correctness verification because every request exercises both implementations and the results are compared. A canary release provides the strongest real-world validation because real users see the new implementation's results.

## Progressive Delivery (James Governor)

Progressive delivery is the umbrella term (coined by James Governor) for the family of techniques — canary releases, feature flags, A/B tests, dark launching — that allow software to be released gradually rather than all-at-once. Parallel run sits within this family as the verification-focused member. See [[patterns/progressive-delivery]] for the full pattern taxonomy and decision guide.

The progressive delivery model enables:
- Gradual exposure: increase traffic or user cohort one step at a time
- Metrics-gated advancement: only expand to the next cohort when quality metrics are met
- Instant rollback: redirect all traffic back to the old implementation without a code change or deployment

## When to Use

- The new implementation's correctness is difficult to verify with pre-production tests alone (complex business logic, large edge-case space)
- The team needs high confidence before directing production traffic to a new service
- The switchover is irreversible once done (e.g., a database migration that cannot be rolled back), making pre-switchover verification especially valuable

## Limitations

- Performance overhead: both implementations run for every request
- Not appropriate for write operations with side effects (both implementations would execute the write) — or, if used with writes, the new implementation's writes must be carefully isolated or idempotent
- Adds operational complexity: the comparison logic and mismatch tracking need to be monitored

## Related Patterns

- [[patterns/branch-by-abstraction]] — provides the structural mechanism for running two implementations side by side
- [[patterns/strangler-fig]] — the broader extraction pattern; parallel run is a verification tool during the redirect phase
- [[patterns/progressive-delivery]] — the umbrella pattern family of which parallel run is the correctness-comparison member
- [[concepts/feature-flags]] — the routing mechanism that determines which result is served
- [[concepts/evolutionary-architecture]] — progressive delivery and parallel run as enabling practices for guided, incremental change

---
title: "Branch by Abstraction"
type: pattern
tags: [migration, decomposition, monolith, microservices, refactoring, incremental]
sources: [monolith-to-microservices]
created: 2026-05-15
updated: 2026-05-29
---

# Branch by Abstraction

## Definition

**Branch by Abstraction** is a migration technique for replacing a deeply embedded component that cannot be intercepted at an external seam. Rather than using a proxy (as in [[patterns/strangler-fig]]), an abstraction layer is created inside the codebase, allowing the old and new implementations to coexist until the new one is proven and the old can be removed. (→ [[sources/monolith-to-microservices]])

The technique works where the strangler fig does not: when the capability to be migrated is not called from outside the monolith but from many places *within* it.

## The Five Steps

1. **Create an abstraction** — introduce an interface or abstract class that defines the capability being migrated. All callers within the monolith are updated to call through this abstraction rather than directly into the existing implementation.

2. **Use the abstraction** — once all callers use the abstraction, the existing implementation sits behind it. At this point the codebase compiles and behaves exactly as before — the abstraction is a pure refactor.

3. **New implementation** — build the new implementation (typically a new service) alongside the existing one. The abstraction now has two concrete implementations: the old one and the new one.

4. **Switch** — update the abstraction to route calls to the new implementation. This is where traffic is redirected. The switch can be controlled by a **feature toggle** so it can be flipped at runtime without a deployment. Both implementations remain in place during this phase.

5. **Clean up** — once the new implementation is stable and proven, remove the old implementation and delete the feature toggle.

## Feature Toggles

A feature toggle (feature flag) allows the switch in step 4 to be applied gradually and safely:
- Start with 1% of traffic; ramp up as confidence grows
- Roll back instantly by flipping the toggle without a code change or deployment
- Use per-cohort toggles (e.g., internal users first, beta users second) to control blast radius

Feature toggles during migration are temporary infrastructure — remove them as part of the clean-up step. Accumulated feature toggles become a maintenance burden. See [[concepts/feature-flags]] for Hodgson's toggle taxonomy and lifecycle discipline (the migration-toggle case is a "release toggle" with a short expected lifetime).

## Verify Variant (Steve Smith)

The **verify variant** approach is an extension for high-risk switches (→ [[sources/monolith-to-microservices]]): both implementations run simultaneously for the same request; their outputs are compared; mismatches are logged for investigation.

Key behaviour: the system always returns the **old implementation's result** to the caller while the new implementation runs in parallel. If they agree, the result is the same. If they disagree, the mismatch is logged but the old result is still returned — the system does not fail.

This is automatic fallback by construction: even if the new implementation crashes or returns wrong results, the user experience is unaffected. Confidence grows as the mismatch rate approaches zero.

The verify variant is related to the [[patterns/parallel-run]] pattern but operates at the in-process abstraction layer rather than at the service call boundary.

## When to Use

- The capability is deeply embedded inside the monolith with many internal callers and no clean external boundary
- A [[patterns/strangler-fig]] proxy cannot be applied because the entry point is internal, not at an HTTP or message boundary
- The team wants to keep the migration as a series of safe, reversible steps inside the existing codebase before introducing service infrastructure

## When to Prefer Strangler Fig Instead

- There is a clean external seam (HTTP endpoint, message queue, FTP boundary) where traffic can be intercepted without touching the monolith's internals
- The monolith cannot be safely modified to introduce an abstraction without high risk

## Relationship to Parallel Run

Branch by Abstraction provides the *mechanism* (the abstraction layer and the two implementations); [[patterns/parallel-run]] provides the *verification strategy* (running both and comparing results). They are frequently combined: use branch by abstraction to create the coexistence structure, and the verify variant / parallel run approach to build confidence before completing the switch.

## Related Patterns

- [[patterns/strangler-fig]] — the alternative for extracting capabilities at an external seam; simpler when applicable
- [[patterns/parallel-run]] — running both implementations simultaneously to verify the new one before committing
- [[patterns/progressive-delivery]] — broader pattern family covering the staged-rollout mechanics
- [[concepts/feature-flags]] — release toggles as the migration switch's runtime control
- [[concepts/evolutionary-architecture]] — branch by abstraction as an enabling technique for incremental, safe architectural change
- [[styles/microservices-architecture]] — the target state after the migration is complete
- [[comparisons/migration-pattern-selection]] — decision guide for when to choose branch by abstraction vs other migration patterns

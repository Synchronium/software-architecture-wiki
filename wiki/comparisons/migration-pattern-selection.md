---
title: "Migration Pattern Selection"
type: comparison
tags: [migration, refactoring, decision-guide, strangler-fig, branch-by-abstraction, parallel-run, feature-flags]
sources: [monolith-to-microservices, building-evolutionary-architectures, mastering-api-architecture, release-it]
created: 2026-05-29
updated: 2026-05-29
---

# Migration Pattern Selection

## Key Claims

- **Five primary migration patterns.** Strangler Fig (external seam), Branch by Abstraction (embedded capability with no seam), Parallel Run (correctness verification), Feature Flag (application-layer routing), Progressive Delivery (staged rollout). Each fits a different combination of seam availability, risk tolerance, and verification need.
- **Big-bang rewrites have a high failure rate.** The characteristic outcome is two systems in production simultaneously, both half-maintained. Migration must be incremental, with each step independently deployable and reversible.
- **Pattern selection follows a decision tree.** Can you intercept at an external seam? → Strangler. Is the capability deeply embedded? → Branch by Abstraction. Is correctness the dominant risk? → Parallel Run. Need per-user control of rollout? → Feature Flag. All of the above usually compose.
- **Database decomposition is the hard part.** Service migration patterns are well-understood; data migration is where most projects get stuck. Newman's ~12 decomposition patterns (database view, wrapping service, tracer write, synchronise-in-application) are the toolkit.
- **Deployment ≠ release is the load-bearing principle.** Code reaches production before users see it. Feature flags and routing make this real; without it, every deployment is a release and every release is binary.
- **Rollback is a feature, not a defeat.** SRE's "roll back first, diagnose second" applies to migrations as much as releases. A migration without a rollback path is a one-way door — usually wrong.

## Why This Page

The individual patterns ([[patterns/strangler-fig]], [[patterns/branch-by-abstraction]], [[patterns/parallel-run]], [[concepts/feature-flags]], [[patterns/progressive-delivery]]) each have deep treatment. This page is the *selection* question: given a specific migration, which patterns apply, how do they compose, and what does the sequence look like?

## The Selection Decision Tree

### Q1: Where is the seam?

A seam is a place where you can intercept calls without modifying the called code. Seams determine which patterns are available.

| Seam type | Pattern |
|---|---|
| HTTP, message queue, file transfer | [[patterns/strangler-fig]] — intercept and redirect at the seam |
| Function call within a process | [[patterns/branch-by-abstraction]] — introduce an abstraction at the call site |
| Database read | Read replica, CQRS, CDC-driven projection ([[streams/change-data-capture]]) |
| Database write | Dual-write via app code, outbox + CDC, or tracer-write (Newman) |
| UI route | UI composition (page, widget, micro-frontend) |
| Configuration / feature decision | [[concepts/feature-flags]] |

**If no seam exists**, create one first. Often this means introducing an abstraction layer (Branch by Abstraction's first step) or routing layer (a proxy, gateway, or service mesh). Migrating without a seam means modifying every caller atomically — the antipattern.

### Q2: Is correctness the dominant risk?

If you can deploy the new implementation but aren't sure it produces the right answers:

- [[patterns/parallel-run]] — run both implementations on every request; return the old result; compare the new result out-of-band. GitHub Scientist is the canonical implementation.
- Best for: refactors of complex business logic, platform migrations (libgit2 replacing shell-script git), algorithm changes.
- Not appropriate for: write operations with side effects (both implementations would execute the write). Either isolate the new path's writes or skip parallel run for that path.

### Q3: How fine-grained does the rollout need to be?

| Granularity | Mechanism |
|---|---|
| All-or-nothing instant cutover | Blue-green deployment |
| Fraction of traffic | Canary release |
| Per-user / per-cohort | [[concepts/feature-flags]] |
| Per-region | Ring deployment (Microsoft model) |
| Compare both versions per request | [[patterns/parallel-run]] |
| Send traffic to new, discard result | Dark launch / shadow traffic |

These are all variants of [[patterns/progressive-delivery]]. Combine them when needed: deploy via canary (infrastructure-level), gate by feature flag (application-layer), verify correctness with parallel run.

### Q4: How long will old and new coexist?

| Duration | Approach |
|---|---|
| Hours (release of one feature) | Feature flag, removed after rollout |
| Days (canary period) | Canary + feature flag |
| Weeks (correctness verification) | [[patterns/parallel-run]] |
| Months (gradual extraction) | [[patterns/strangler-fig]] |
| Years (long-lived migration) | [[patterns/strangler-fig]] + [[patterns/branch-by-abstraction]] + organised technical debt |

Long-lived coexistence is where most projects accumulate debt. Be explicit about the end state and the deprecation date; treat the migration as a finite project, not an ongoing condition.

### Q5: Can you afford to run both implementations?

| Cost / risk | Pattern |
|---|---|
| Cheap (both implementations are stateless, idempotent reads) | [[patterns/parallel-run]] |
| Expensive (write operations with real side effects) | Canary, not parallel run |
| Free at infrastructure level (mesh-based traffic mirroring) | Dark launch |
| Per-user toggle is the only feasible split | [[concepts/feature-flags]] |
| Performance overhead matters | Avoid parallel run; use canary with metric comparison |

## Database Decomposition Decision

The hardest migrations involve splitting a shared database. Newman's taxonomy of ~12 database decomposition patterns (→ [[concepts/evolutionary-database-design]]):

| Pattern | When to use |
|---|---|
| **Database view** | Read-only access pattern; expose a view as an interim API. Cheap to start. |
| **Wrapping service** | A service in front of the legacy DB owns the access pattern; other services call it. |
| **Tracer write** | Dual-write to both old and new schema; gradually migrate readers; eventually drop the old. |
| **Synchronise in application** | Application code keeps two stores in sync during transition. Risky; use briefly. |
| **Split the database** | Hard cutover for tables clearly owned by one service. Use schema migrations. |
| **Move the foreign key relationship into code** | Drop DB-level FK; enforce in application. Often a prerequisite to extracting a service. |
| **Static reference data** | Replicate to each consuming service; it doesn't change. |
| **Repository per bounded context** | One service per BC; multiple repos in one DB before extraction. |
| **Change Data Capture** | Stream changes from the source of truth to derived stores. [[streams/change-data-capture]]. |
| **Outbox pattern** | Application writes business state + outbox event atomically; CDC propagates events. [[patterns/outbox-pattern]]. |

**Avoid 2PC and distributed transactions.** Newman: "just say no" to 2PC during migration. It creates blocking failure modes that turn migration setbacks into outages. Use [[patterns/saga]] or eventual consistency instead.

## Composition: How Patterns Combine

Real migrations rarely use just one pattern. The common compositions:

### Service extraction
1. Identify external seam (API call, message receiver).
2. Build new service with the same interface (interim parity).
3. [[patterns/strangler-fig]]: route through a proxy; start with 1% of traffic.
4. [[concepts/feature-flags]] gate the routing for emergency rollback.
5. Increment traffic share; monitor with [[operations/monitoring]].
6. When at 100%, decommission the old path. Remove the proxy. Remove the flag.

### Embedded capability extraction
1. Identify the embedded capability (e.g., billing logic inside a monolithic service).
2. [[patterns/branch-by-abstraction]]: introduce an interface; original implementation behind it.
3. Build new implementation behind the same interface.
4. Toggle via [[concepts/feature-flags]]; route fraction of requests to new implementation.
5. (Optional) [[patterns/parallel-run]] to verify correctness if business-critical.
6. When confident, remove old implementation. Optionally extract to its own service.

### Database split
1. Identify clear data ownership boundaries (per [[concepts/bounded-contexts]]).
2. Add [[streams/change-data-capture]] from the source of truth.
3. New services build their own read models from CDC stream.
4. Switch reads to new services (gradual, [[patterns/progressive-delivery]]).
5. Migrate writes: tracer write to both old and new; verify both stay in sync.
6. Switch writes to new; old becomes read-only.
7. Remove old code paths; eventually drop old tables.

### Platform / framework migration (e.g., framework upgrade, runtime change)
1. New code runs in parallel runtime/framework.
2. [[patterns/parallel-run]] every request through both; compare outputs out-of-band (GitHub Scientist).
3. After N days with zero mismatches, switch traffic to new path.
4. Old path becomes the comparator for new bugs; eventually remove.

## Anti-Patterns

**Big-bang rewrite.** Months of development; new system replaces old in one event. Almost always produces two systems in production both half-maintained. The default failure mode of ambitious migrations.

**No rollback path.** Migration steps that can't be reversed turn every setback into an outage. Always design rollback before designing the migration step.

**Lock-step deploys of consumer and producer.** "We'll deploy both at the same time" defeats independent deployability. The whole point of these patterns is *not* to coordinate the deploy.

**Schema changes that break old code.** A breaking migration can't be canaried — old code can't read new schema. Use expand/contract ([[concepts/evolutionary-database-design]]) so both versions work during the rollout window.

**Permanent feature flags.** A "temporary" flag added for a 2-week rollout, still in the code three years later, with no owner. See [[concepts/feature-flags]] for lifecycle discipline. Every flag has an owner and a removal date.

**Parallel run for write operations without isolation.** Both implementations execute the write; user sees the action twice or in conflicting forms. Either isolate the new path's writes (separate DB, dry-run mode) or skip parallel run for writes.

**Strangler with no end date.** The proxy and routing layer become permanent infrastructure. The migration is "in progress" forever. Set an explicit end date; treat residual old paths as bugs to fix.

**Dual writes without atomicity.** Application-level dual write to two stores without transaction guarantee. One write succeeds, other fails, divergence. Use [[patterns/outbox-pattern]] + [[streams/change-data-capture]] instead.

**Feature flag as kill switch only.** Flag exists for rollback but never used during normal operations. Defeats progressive rollout. Use the flag during the rollout, not just at the cliff.

## Prerequisites for Safe Migration

Migration patterns assume capabilities that must exist before the migration starts.

- **[[concepts/deployment-pipelines]]** — automated deploys, fitness functions as gates. Manual deploys make incremental migration prohibitively expensive.
- **[[operations/monitoring]]** — percentile-based SLIs to detect when the new path is worse than the old. Without comparable observability, canary decisions are guesswork.
- **[[operations/observability]]** — distributed tracing to verify requests are going where they should and finishing correctly. Especially during dual-write or parallel run.
- **[[concepts/feature-flags]]** — application-layer routing for instant rollback without redeployment.
- **[[concepts/evolutionary-database-design]]** — expand/contract discipline so schema changes survive partial rollout.
- **[[concepts/architecture-quantum]] understanding** — knowing which components are independently deployable. Coupled components can't be migrated independently.

If these aren't in place, the migration's first sprint is building them.

## Risk Management During Migration

Migrations are inherently risky — two systems in transition, possible inconsistencies, possible regressions. The discipline:

**[[operations/error-budgets]]** — migrations spend the error budget. If the budget is near exhaustion, pause migration work until reliability recovers. Aggressive migration during budget exhaustion is how migrations cause outages.

**[[operations/chaos-engineering]]** — verify the migration doesn't introduce new failure modes. Inject failures during the migration period; the dual-running phase often surfaces new bugs.

**[[concepts/adrs]]** — document the migration decision and the rollback plan. Reviewers ask "how do we undo this?" — and the answer should be in the ADR, not lost in Slack.

**Migration as a fitness function** — automated checks that the migration is making progress. Tracer-write divergence rate, traffic split percentage, deprecated-path call count. Surface these as dashboards.

## How Different Sources Treat It

| Source | Angle |
|--------|-------|
| [[sources/monolith-to-microservices]] | Canonical treatment of migration patterns. Strangler fig (HTTP, FTP, message variants), branch by abstraction, parallel run, verify variant, ~12 database decomposition patterns, dual-write taxonomy. The discipline of incremental change. |
| [[sources/building-evolutionary-architectures]] | Feature toggles as the decoupling mechanism that makes evolutionary change safe; deployment pipelines as the substrate; toggles as technical debt with a use-by date. |
| [[sources/mastering-api-architecture]] | API-level migration: traffic splitting at the gateway, versioned routing, parallel run for API migration, lifecycle management. |
| [[sources/release-it]] | Stability patterns during migration; the economic case for zero-downtime deployment; "design for production" applied to migrations. |

## Related Concepts

- [[patterns/strangler-fig]] — external-seam migration
- [[patterns/branch-by-abstraction]] — internal-seam migration
- [[patterns/parallel-run]] — correctness verification during migration
- [[patterns/progressive-delivery]] — staged rollout patterns
- [[concepts/feature-flags]] — application-layer routing
- [[concepts/evolutionary-architecture]] — the discipline migration patterns serve
- [[concepts/evolutionary-database-design]] — expand/contract and the database decomposition patterns
- [[streams/change-data-capture]] — data-tier migration mechanism
- [[patterns/outbox-pattern]] — atomic write + event publish during dual-write phases
- [[concepts/deployment-pipelines]] — the automation substrate
- [[concepts/architecture-quantum]] — what can be migrated independently
- [[operations/error-budgets]] — gating migration aggressiveness on reliability
- [[comparisons/decomposition-strategy]] — how far to decompose (related, broader decision)

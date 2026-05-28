---
title: "Deployment Pipelines"
type: concept
tags: [continuous-delivery, deployment, fitness-functions, automation, ci-cd, devops, testing, evolutionary-architecture]
sources: [building-evolutionary-architectures, understanding-distributed-systems, mastering-api-architecture, building-event-driven-microservices, release-it, software-architecture-metrics]
created: 2026-05-13
updated: 2026-05-19
---

# Deployment Pipelines

## Definition

A deployment pipeline is the automation mechanism that carries a commit from source control through a series of staged gates — build, test, integration, staging, production — promoting the artifact only when all gates pass. In the context of evolutionary architecture, deployment pipelines are the primary mechanism for **automating fitness functions**: each pipeline stage applies a set of fitness functions; failure stops promotion (→ [[sources/building-evolutionary-architectures]] Ch 3).

## Pipeline vs CI Server

These terms are frequently conflated but are distinct:

| | CI Server | Deployment Pipeline |
|--|-----------|---------------------|
| **Scope** | Commit → test result | Commit → production |
| **Purpose** | Detect integration failures | Orchestrate the full release journey |
| **Gates** | Build + unit tests | Fitness function stages at every step |
| **Output** | Pass/fail signal | Release candidate promoted through environments |

A CI server is a component *within* a deployment pipeline (typically the first stage). The pipeline extends past CI into integration environments, staging, performance checks, and production deployment.

## Stage Structure

Fitness functions are ordered by scope and cost: fast, cheap, atomic functions run early (developers run these dozens of times per day); slow, expensive, holistic functions run later (triggered on merge or nightly):

```
[Commit]
   │
   ├─ Stage 1: Build + unit tests          ← fast atomic fitness functions
   │
   ├─ Stage 2: Component / functional       ← service-level fitness functions
   │
   ├─ Stage 3: Integration tests            ← cross-service; contract tests
   │
   ├─ Stage 4: Performance / security       ← holistic fitness functions
   │
   ├─ Stage 5: Staging environment          ← production-like; exploratory testing
   │
   └─ Stage 6: Production                   ← CD (manual pull) or CDP (automated)
```

**Fan-out**: within a stage, multiple fitness functions execute in parallel.
**Fan-in**: all must pass before the next stage begins.

For multi-service architectures, fan-out/fan-in also applies across services: a holistic fitness function triggers parallel runs across services and waits for all before promoting any.

## Continuous Delivery vs Continuous Deployment

- **Continuous Delivery (CD)**: the pipeline guarantees the artifact *is* production-ready; a human decides *when* to release (at least one manual pull). Release is decoupled from deployment.
- **Continuous Deployment (CDP)**: every stage automatically promotes on success; the pipeline fully controls release timing.

CD is the baseline target for most organisations. CDP requires high test confidence and engineering maturity but makes cycle time a pure technical metric and enables hypothesis-driven development at scale.

## Cycle Time as a Business Metric

Cycle time — commit to production — is directly proportional to evolution speed: **v ∝ c** (→ [[sources/building-evolutionary-architectures]] Ch 3).

In competitive markets, cycle time becomes a business differentiator. A system with a 3-hour cycle time can respond to market changes an order of magnitude faster than one with a 3-week cycle time. This reframes deployment pipeline investment from engineering overhead to business capability.

> "Because cycle time has become a business differentiator in some markets... AcmeWidgets has an advantage they can exploit." (→ [[sources/building-evolutionary-architectures]] Ch 8)

## Enterprise Pipeline Templates

In a microservices or service-based architecture, each service owns its own pipeline. Enterprise architects can provide a shared pipeline *template* that all services inherit, with enterprise-wide fitness functions pre-inserted (→ [[sources/building-evolutionary-architectures]] Ch 8):

- Security: no hardcoded secrets, dependency vulnerability scans
- Compliance: license legality monitors, GDPR/PCI audit controls
- Observability: all services must emit RED metrics and structured logs

Individual teams add service-specific fitness functions on top of this baseline. The result unifies enterprise governance with team autonomy: enterprise architects own the shared constraints; teams own the implementation.

## Fitness Function Placement by Priority

Priority tiers determine where in the pipeline a fitness function runs (→ [[concepts/fitness-functions]]):

| Priority | Pipeline behaviour |
|----------|------------------|
| **Key** | Runs at every stage; blocks promotion on failure |
| **Relevant** | Runs and is tracked; does not block promotion |
| **Not relevant** | Excluded from pipeline |

This prevents slow fitness functions from blocking the fast-feedback stages developers depend on.

## CD Pipeline Structure (Practitioner View)

Vitillo describes a four-stage pipeline that emphasises operational safety over fitness function governance (→ [[sources/understanding-distributed-systems]] ch. 30):

```
[PR Submitted]
   │
   ├─ Stage 1: Review + Build
   │    PR checklist + compile + unit/integration tests (single node)
   │
   ├─ Stage 2: Pre-production
   │    Deploy to synthetic env; smoke tests + E2E tests; same health signals as prod
   │
   ├─ Stage 3: Production — early stages
   │    Low-traffic region first; small fraction of fleet; bake time
   │
   └─ Stage 4: Production — incremental rollout
        Sequential region stages; bake time decreases as confidence builds
```

**PR review checklist**: before a change can merge, reviewers should verify:
- Tests added (unit, integration, E2E as needed)?
- Observability added (metrics, logs, traces)?
- Backward compatible — no breaking schema or API changes?
- Rollback-safe — can this be reverted without a forward-roll?

**Configuration and IaC go through the same pipeline as code.** Configuration changes are one of the leading causes of production failures (→ [[operations/common-failure-causes]]). Infrastructure dependencies (VMs, datastores, load balancers) should be declared as code (Terraform, Pulumi) and promoted through the same review and release stages.

**Bake time**: the pipeline pauses between production stages to observe health signals before proceeding. Bake time can be gated on request count (ensuring the API surface has been exercised) rather than wall-clock time alone. As each stage succeeds, bake time can decrease — confidence is cumulative.

**Health monitoring scope**: the pipeline should monitor not just the deployed service but also its upstream and downstream dependencies. A rollout that degrades a downstream service may not be visible in the deployed service's own metrics.

## Rollbacks and Backward Compatibility

**Rollback preference**: always prefer rolling back over rolling forward. Rolling forward (releasing a hotfix artifact) is riskier — the fix may itself introduce a regression. A release should be designed to be safely reversible.

**Backward-incompatible changes cannot be rolled back safely in a single deployment.** Break them into three sequential backward-compatible changes:

1. **Prepare**: the consumer is updated to support both the old and new format simultaneously.
2. **Activate**: the producer switches to the new format. At this point both formats are in use; the consumer handles both.
3. **Cleanup**: the consumer drops support for the old format. This stage is only released once there is high confidence the activate change is stable and will not be rolled back.

An automated upgrade-downgrade test in the pre-production stage validates that a change is actually safe to roll back before it reaches production.

The most common source of backward incompatibility is changing the serialisation format used for persistence or inter-process communication — protocol buffers, JSON schemas, database schemas.

## Deployment ≠ Release: API Lifecycle and Release Strategies

Deployment pipelines operationalise the decoupling of deployment from release. Code reaches production (deployed) but may not be visible to users (not released) until a feature flag is toggled or a canary is expanded. (→ [[sources/mastering-api-architecture]] Ch 5)

### API Lifecycle

An API version progresses through defined lifecycle stages. Consumers only need to track **major** version changes — minor and patch are backward-compatible and received silently (→ [[concepts/api-design]]):

| Stage | Description |
|-------|-------------|
| **Planned** | API is designed and advertised; consumers give early feedback; no compatibility guarantees yet |
| **Beta** | API is released for integration; producer reserves the right to break compatibility; rapid feedback loop before v1 |
| **Live** | API is versioned and stable; only one live version at a time; the current major.minor |
| **Deprecated** | Superseded by a newer live version; still accessible; consumers must migrate; tracked with usage metrics |
| **Retired** | API is removed from production |

When a **major** version goes live, the previous live version becomes deprecated and runs concurrently for weeks or months while consumers migrate. When a **minor** version goes live, the previous minor retires quickly (backward-compatible; no consumer code change needed).

### Release Strategies

Three traffic-management-based release strategies, each suited to different scenarios (→ [[sources/mastering-api-architecture]] Ch 5):

**Canary release**: deploy the new version alongside the current; shift a small percentage (1–5%) of traffic to it; monitor SLIs; expand or roll back. Advantages: only one new instance required (not a full duplicate environment); blast radius is tiny. Requires good monitoring in place to detect problems automatically. Canary percentage is controlled by the API gateway or service mesh (weight-based routing), not by pod count alone.

**Traffic mirroring / dark launch**: duplicate production traffic to the new version out-of-band; responses are not returned to users. Useful for observing operational behaviour (latency, CPU) without any user impact. Cannot measure business KPI impact (since users are unaffected). Often described as a specialised canary.

**Blue-green**: run two complete environments (blue = current live; green = next version); switch gateway routing at release time; old environment stays alive for immediate rollback. Advantages: instant cutover, instant rollback, simple to reason about. Costs: double the infrastructure. Well-suited to tightly coupled producer/consumer pairs that must be released together.

| Strategy | New instances needed | Rollback speed | User impact during release | Best for |
|----------|---------------------|---------------|--------------------------|----------|
| Canary | 1 | Fast (re-route) | Fraction of users | Typical API changes |
| Traffic mirror | 1 | N/A (users unaffected) | None | Observability experiments |
| Blue-green | Full second stack | Instant | None | Tightly coupled releases |

### RED Metrics and Four Golden Signals

Two frameworks for API operational metrics (→ [[sources/mastering-api-architecture]] Ch 5):

**RED metrics** (Tom Wilkie): Rate (requests/sec), Error (rate), Duration (latency). Designed for traffic-based microservices; maps directly to API SLIs.

**Four Golden Signals** (Google SRE): Latency, Traffic, Errors, Saturation. Adds saturation (resource utilisation approaching limits), which RED omits.

Context matters for errors: a spike in **4xx** errors is not the same as **5xx**. A sequence of 403 Forbidden errors could indicate a compromised token or a malicious actor probing the API — not a service failure. A 500 Internal Server Error on a payment endpoint is ambiguous: did the payment go through? Status codes and error logs must be read together.

### Application-Level Release Considerations

**Response caching gotcha**: during a canary release, caching proxies (CDN, gateway, local HTTP cache) may serve stale responses from v1 to requests meant to probe v2. A cached result masks failures in the new version — the canary appears healthy when it isn't. Set `Cache-Control: no-cache, no-store` on the client side during canary evaluation, or use cache-busting strategies.

**Header propagation**: services that terminate an inbound request and issue a new outbound request must copy observability headers (trace IDs, request IDs) from the incoming to the outgoing request for distributed tracing to work. For auth headers: an **OAuth2 bearer token** is safe to forward downstream (the downstream service validates scope and expiry independently). Raw authentication credentials or session tokens must **not** be forwarded — they would allow the downstream service to impersonate the original caller.

**Logging types** (journal vs diagnostics): structure logs into two categories:
- **Journal**: key transactions and their outcomes (e.g., "payment accepted", "message received"). Emitted sparingly; forms the audit trail.
- **Diagnostics**: unexpected errors and failures outside normal processing. Emitted when something goes wrong.

Adding a `log_type` field to structured logs allows operators to filter to just journals (audit) or just diagnostics (debugging) without reading everything.

### Opinionated Platforms

As distributed architectures grow, development teams make inconsistent decisions on observability, header propagation, caching, and release mechanics. An **opinionated platform** (also called a "paved path" or "golden path to production") encodes these decisions centrally:

- Platform team owns the defaults: tracing library, structured log format, header propagation, canary rollout tooling
- Developer teams consume the platform as a product; new services get correct defaults out of the box
- Platform features should be as transparent as possible to application developers

Trade-off: opinions create constraints. Some teams will be constrained by choices that don't fit their exact use case. The platform must be designed with developer input and must evolve to avoid becoming a blocker.

## Deploying Event-Driven Microservices (Bellemare)

EDM deployments carry additional complexity because stateful services may need to rebuild state stores and reprocess event streams — both of which affect dependent downstream services (→ [[sources/building-event-driven-microservices]] ch. 16).

### Deployment Principles

**Team autonomy**: each team controls its own CI/CD pipeline and deployment timing. If deployments routinely require synchronisation with other services, that is an architectural smell: bounded contexts are ill-defined and should be revisited.

**Standardised process**: every new microservice gets a CI pipeline via the streamlined creation process (see [[concepts/contracts]] for the schema validation step); no team builds from scratch.

**Consider reprocessing impacts**: a deployment that resets consumer offsets triggers a high volume of output events downstream; concurrent large-scale event production can degrade downstream consumers and violate SLAs. Gate side effects (emails, payments) during reprocessing.

**Negotiate breaking changes**: schema changes to output event streams require renegotiating the data contract with downstream consumers before deployment. Breaking changes that were not communicated are among the most disruptive failure modes in EDM systems.

### Basic Full-Stop Deployment (5 Steps)

1. Commit code → trigger CI pipeline
2. Execute automated unit and integration tests (in ephemeral environment)
3. Pre-deployment validation: verify input/output event stream existence + ACL permissions; validate schema evolution compatibility
4. Deploy: stop existing instances → reset state stores and consumer offsets if required → deploy new container → start instances → wait for readiness
5. Post-deployment validation: monitor consumer lag, log errors, endpoint health

### Rolling Update Pattern

Prerequisites (all must hold):
- No breaking changes to internal state store schemas
- No breaking changes to internal microservice topology
- No breaking changes to internal event schemas

When prerequisites are met: stop and restart one instance at a time; a brief period of mixed old-and-new logic runs in parallel. Reduced downtime but disallowed for any structural change to the topology.

### Breaking Schema Change Patterns

**Eventual migration (two streams)**: producer writes events to both old and new streams simultaneously; old stream marked as deprecated; consumers migrate in their own time. Risk: migration may never complete; new services may inadvertently register on the deprecated stream. Keep migration windows short; use metadata deprecation tags.

**Synchronised migration (single stream)**: producer stops writing to old stream and writes only to new format; consumers must migrate before the cutover. Rarer in practice; requires intensive cross-team coordination; used when the domain has changed so significantly that the two formats cannot coexist.

**Entity stream re-creation**: entity changes require re-creating the entire entity stream under the new schema. Two options: (1) same producer handles both old and new (encapsulated, simpler); (2) new producer created alongside existing one (old stream continues; no disruption to existing consumers until cutover).

### Blue-Green Deployment

**Works for**: event-consuming microservices (consumers only, no event production to shared output streams).

**Does NOT work for**: event-producing microservices — both the blue and green instances would consume from the same input streams and write to the same output streams, causing entity stream overwrites or event stream duplicates. Use rolling update or basic full-stop instead.

Blue-green deployments do work when the microservice converts inbound requests directly to events (event-first pattern) rather than reacting to an input event stream.

## Zero-Downtime Deployment (Nygard)

Nygard (→ [[sources/release-it]] ch. 13) frames zero-downtime deployment as a design feature, not an operational afterthought: "We treat deployment as a feature." The four microscopic phases below should be designed into the application and the deployment tooling from the start.

### Four Deployment Phases

For each instance in a rolling rollout:

1. **Prepare** — copy new artifact or container image to the instance without touching the currently running version.
2. **Drain** — stop the instance accepting new requests; wait for in-flight requests to complete (grace period + hard cutoff).
3. **Apply** — perform the cutover: symlink swap, container restart, or schema migration step. Should be near-instantaneous.
4. **Start** — boot new version with an "accepting work" flag set to false; wait for health check to go green before notifying the load balancer to resume routing traffic to this instance.

The accepting-work flag prevents the race where health checks pass before the application is truly ready.

### Relational DB: Expand/Contract Pattern

Backward-incompatible schema changes cannot be applied atomically in zero-downtime deployments. Use three phases:

| Phase | Actions | When to run |
|-------|---------|-------------|
| **Expansion** | Add tables, views, nullable columns, aliases, stored procedures, triggers; copy data to new columns | Before code deployment — safe even when old code is live |
| **Shims** | DB triggers that sync old → new tables during the mixed-version window | Installed with the expansion; removed in cleanup |
| **Contraction/cleanup** | Drop old tables, columns, views; apply NOT NULL and FK constraints | After full rollout and confidence confirmed |

This is the database counterpart of the prepare/activate/cleanup backward-compatibility protocol (→ [[sources/understanding-distributed-systems]] ch. 30).

### Schemaless DB: Trickle-then-Batch Migration

Three approaches for migrating documents/records in schemaless stores:

1. **Version pipeline**: read at any historical version, translate up through a chain. Complete but expensive to maintain.
2. **Full batch migration**: migrate all records before deployment. Works for small datasets; takes too long at scale.
3. **Trickle, then batch** (preferred): migrate documents on read during normal traffic; run a batch sweep on untouched documents after deployment settles; remove migration code in the next deployment.

### Web Asset Cache Busting

Embed a commit SHA or content hash in the URL *path* (not query string) — some CDNs and proxies strip query parameters when caching. Deploy assets to all hosts before deploying the code changes that reference them, or enforce session affinity to prevent a user from being served mismatched HTML and assets.

### Canary Group Evaluation

The first batch in a rolling deployment is the canary group. Pause after the canary to evaluate SLIs (error rate, latency, memory) before continuing. Use health-check-based graceful drain (phase 2 above) rather than abruptly removing the instance from the pool, which would kill in-flight requests.

## Hermetic Builds

A hermetic build is deterministic and environment-independent: two engineers building the same source revision on different machines must get identical outputs. (→ [[sources/site-reliability-engineering]] ch. 8)

Properties of a hermetic build:
- **Known tool versions**: depends on specified versions of compilers, linkers, and build tools — not whatever is installed on the build machine.
- **Vendored or pinned dependencies**: libraries are fetched at known versions; no live fetches from the internet during a build.
- **Self-contained**: the build process does not call external services.
- **Reproducible at any revision**: rebuilding at an older revision (e.g., to cherry-pick a fix) uses the original compiler and dependency versions, not the latest.

Hermetic builds enable: cherry-pick-based hotfix workflows (the release branch can be rebuilt at the same tools version as the original), artifact signing and chain of custody, and confidence that the artifact in production matches the tested artifact.

> **Contradiction:** Hermetic builds are aspirational for most organisations. Common failure modes include build steps that curl dependencies from the internet, build scripts that use installed system tools, and Docker images that use `FROM ubuntu:latest` (mutable tag). These all produce "mostly hermetic" builds that are hermetic enough in practice but can diverge across environments.

## Immutable and Disposable Infrastructure

Nygard (→ [[sources/release-it]] ch. 8) makes a strong case for immutable infrastructure over mutable configuration management (Chef, Puppet, Ansible).

Mutable configuration management produces "layers of stucco" — the machine's state is the history of all applied recipes, including side effects not described by any recipe (e.g., post-install scripts that set TCP parameters that a later RPM only partially reverses). Machines in partially-applied or failed states are common and hard to reason about.

**Immutable infrastructure**: always start from a known base image; apply a fixed set of changes; never patch in place. When change is needed, create a new image. Containers embody this fully — the container filesystem is a binary image from a repository. Disposability > persistence: the ability to throw away and recreate the environment is more valuable than the environment itself.

**Supply chain security in builds**: production artifacts must have a verifiable chain of custody. Only CI servers write to the package repository. Developer machines are not clean build environments. Third-party dependencies should be proxied through a private repository with verified digital signatures — not downloaded directly from the Internet on each build. Build-system plugins are also an attack vector.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/accelerate]] | CD as the primary driver of delivery performance and culture; five principles (build quality in, small batches, automate repetitive work, relentless improvement, everyone responsible); trunk-based development; test automation must be developer-owned; config-in-version-control more predictive than app-code-in-VCS; deployment pain as a quality proxy |
| [[sources/building-evolutionary-architectures]] | Deployment pipelines as fitness function automation infrastructure; cycle time as business differentiator; enterprise pipeline templates |
| [[sources/understanding-distributed-systems]] | Four-stage operational pipeline; backward-incompatible change protocol (prepare/activate/cleanup); bake time |
| [[sources/mastering-api-architecture]] | API lifecycle (planned → beta → live → deprecated → retired); canary, blue-green, traffic mirror release strategies |
| [[sources/building-event-driven-microservices]] | EDM-specific: stateful deployment constraints, reprocessing impacts, rolling update prerequisites, breaking schema change patterns, blue-green applicability limits |
| [[sources/release-it]] | Immutable infrastructure > mutable configuration management; supply chain security; zero-downtime deployment as a first-class feature; four deploy phases (prepare/drain/apply/start); expand/contract relational schema pattern; trickle-then-batch schemaless migration; canary group evaluation |
| [[sources/site-reliability-engineering]] | Hermetic builds (same revision = identical output, environment-independent); branch + cherry-pick (never merge release branch back to mainline); risk-profiled deployment cadence (dev → hourly auto; large user-facing → exponential; sensitive infra → multi-day across regions); "Push on Green"; four configuration management models |

## Related Concepts

- [[concepts/continuous-delivery-practices]] — the eight CD capabilities and empirical findings (trunk-based dev, developer-owned tests, shift-left security, lightweight change approval) that make pipelines valuable
- [[concepts/fitness-functions]] — the fitness functions that pipeline stages execute
- [[concepts/evolutionary-architecture]] — the three-step process (identify dimensions, define fitness functions, automate in pipelines)
- [[concepts/conways-law]] — enterprise pipeline templates require Conway-aligned team boundaries to avoid cross-team pipeline coupling
- [[concepts/api-testing]] — test pyramid maps to pipeline stages; contract tests are a key fitness function at the integration stage
- [[concepts/contracts]] — schema evolution validation in CI pipelines; breaking change negotiation
- [[reference/technology-glossary]] — tool entries for Argo Rollouts, LaunchDarkly (progressive delivery tooling)
- [[concepts/api-design]] — API lifecycle (planned → beta → live → deprecated → retired) governs when a version can be retired
- [[operations/monitoring]] — SLOs and burn rate alerting are the signals that drive canary promotion or rollback decisions
- [[operations/testing-for-reliability]] — hermetic builds, canary tests, production probes, and configuration testing are the reliability testing layer within pipelines
- [[operations/manageability]] — feature flags are the code-level mechanism for deployment ≠ release
- [[patterns/sidecar-service-mesh]] — traffic splitting for canary and mirroring is implemented in the service mesh data plane

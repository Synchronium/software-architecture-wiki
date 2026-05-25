---
title: "Four Key Metrics (DORA)"
type: concept
tags: [metrics, devops, dora, deployment, delivery-performance, evolutionary-architecture]
sources: [accelerate, software-architecture-metrics]
created: 2026-05-21
updated: 2026-05-18
---

# Four Key Metrics (DORA)

The four key metrics (from *Accelerate*, Forsgren, Humble & Kim; validated by DORA — DevOps Research and Assessment) are the standard framework for measuring software delivery performance. They are process fitness functions (→ [[concepts/fitness-functions]]) that assess an architecture's deployability, testability, and overall health as a delivery system.

## Origin and Empirical Basis

Defined and validated by Forsgren, Humble, and Kim over four years of research (2014–2017) in the State of DevOps Report programme (→ [[sources/accelerate]]). 23,000+ survey responses; 2,000+ organisations across industries (regulated and unregulated), sizes (startup to enterprise), and technology stacks (mainframe to greenfield). Cluster analysis across all four years consistently found three distinct performance clusters (high, medium, low) — statistically significantly different across all four dimensions. This is not anecdote; it is one of the most rigorously constructed empirical studies in the field.

**The foundational finding:** high performers are better on *all four metrics simultaneously*. Speed and stability are positively correlated, not in tension. This directly refutes the bimodal IT hypothesis and much industry dogma. (→ [[sources/accelerate]] ch. 2)

**Lean conceptual basis:** the metrics were chosen from Lean manufacturing theory. Lead time is a key element of Lean (time from customer request to fulfilment). Deployment frequency is a proxy for batch size — smaller batches reduce cycle time, variability, risk, and overhead (Reinertsen 2009). The metrics thus represent the Lean ideal applied to the software delivery value stream.

**CABs finding:** Change Approval Boards are negatively correlated with both tempo and stability. Heavyweight approval processes do not improve safety; they degrade performance without compensating gains. (→ [[sources/accelerate]] ch. 2)

**Culture warning (Deming):** "Whenever there is fear, you get the wrong numbers." In organisations with pathological or bureaucratic cultures, these metrics will be gamed or hidden. The metrics require a generative culture (→ [[concepts/westrum-culture|Westrum model]], [[sources/accelerate]] ch. 3) to function as designed. Deploying measurement without cultural readiness produces bad data and worse outcomes.

## The Four Metrics

Two pairs, each measuring a different dimension of delivery performance:

### Throughput Metrics

**Deployment frequency**: how often changes successfully reach production.
- Calculation: count of successful deployments per day; report as 31-day rolling mean of daily totals
- Elite level (DORA): multiple times per day
- Proxy: can count deployments to the highest pre-production environment when production deployment is not yet practiced

**Lead time for changes**: how long a single change takes to travel from commit to production.
- Calculation: elapsed time per successful deployment from commit timestamp to deployment timestamp; report as 31-day mean of daily means
- Elite level (DORA): less than one hour
- Commitment semantics: Accelerate recommends starting the clock at any commit, not just merge to main (branching strategies inflate lead time)

### Stability Metrics

**Change failure rate**: what proportion of deployments cause a production failure.
- Calculation: (failures resolved in period) / (total deployments in same period); 31-day rolling window; only resolved failures counted
- Elite level (DORA): 0–15%
- "Failure" definition: anything that prevents users from completing their task; cosmetic defects excluded; a slow-but-running system can qualify

**Time to restore service**: how quickly the team detects and resolves a production failure.
- Calculation: mean or median of failure resolution durations (ticket open → ticket close); 120-day rolling window
- Elite level (DORA): less than one hour
- Clock stops when service is restored to users — not when root cause is fully addressed

## Why Track All Four Together

The metrics are designed to be tracked as a set. Improving one at the expense of another indicates an unbalanced transformation:
- Deploying more often without improving stability = chaos
- Improving stability by deploying less often = stagnation

The combination makes the metrics resistant to gaming: a team cannot appear to perform well by manipulating deployment frequency while failures mount, because both stability metrics will degrade visibly.

## Instrumentation

Four raw data points feed all calculations:

| Data point | Source |
|-----------|--------|
| Commit timestamp | CI pipeline trigger event |
| Deployment timestamp | Production deploy pipeline completion |
| Failure ticket open time | Incident management system (manual or automated) |
| Failure ticket close time | Incident management system |

**Pipeline model variants** (matching instrumentation to your delivery topology):
1. **Single end-to-end pipeline** (monolith → production): trivially instrumented
2. **Multiple independent pipelines** (one per microservice/artifact): ideal model; sum deployment counts across all pipelines
3. **Subpipeline chain** (build → test env → production): link commit to deploy across pipeline stages via change-set identifier
4. **Fan-in model** (multiple repos → shared pipeline → production): trace each commit through to its final deployment; most complex to instrument

Only count successful builds that result in a production (or highest-environment) deployment. Failed builds that never deployed should not contribute to lead time calculations.

## Minimal Viable Dashboard (MVD)

The recommended starting point is a simple wiki page containing:
- Current calculated values for all four metrics
- Definitions and time periods used for each metric
- Historical trend data
- Links to raw data sources

Automation (Google Four Keys, Thoughtworks Metrik, Azure DevOps extensions) can be added once the manual baseline is established. Primary audience is the development teams themselves — not management. Read-only rollup views for senior stakeholders are acceptable but secondary.

## How Metrics Drive Architectural Change

The most valuable outcome of the four key metrics is not the numbers — it is the weekly team conversations they catalyse. Teams that understand the mental model and see their own data:
1. First request process improvements: release cadence, branching strategy
2. Then request quality improvements: shift testing left, more automation
3. Then request structural improvements: cross-functional teams, looser coupling, better observability
4. Finally surface architectural problems: coupling that limits deployability, service boundaries that cause coordination overhead, infrastructure that resists testability

An architect using the four key metrics can transition from dictating architectural decisions to facilitating team-driven improvement — the metrics generate the shared understanding that makes architectural conversations productive.

> "That's what places the four key metrics among the most valuable architectural metrics out there." — Andrew Harmel-Law (→ [[sources/software-architecture-metrics]] ch. 1)

## Relationship to Fitness Functions

The four key metrics are process fitness functions (in the classification from [[sources/building-evolutionary-architectures]]): they measure team practice (deployment practices, incident response) rather than code structure or runtime behaviour. They sit naturally in the bottom-to-middle layer of the fitness function testing pyramid (→ [[concepts/fitness-functions]]):
- Deployment frequency and lead time for changes → triggered, continuous measurement of pipeline data
- Change failure rate and time to restore → triggered, derived from incident ticket data

## Complementary Metrics (Rosa, SAM ch. 6)

The four key metrics are leading indicators at the technical level. Rosa (→ [[sources/software-architecture-metrics]] ch. 6) recommends supplementing them with:

- **Throughput** (Lean): baseline of a team's capacity to deliver batches of work; root concept from Toyota Production System
- **Employee Net Promoter Score (eNPS)**: measures employee happiness; proxy for cognitive load, sustainability, and risk of attrition
- **Mean time to discover (MTTD)**: time between incident occurrence and detection; requires observability infrastructure; rising MTTD = observability not keeping pace with complexity

**Metric trend diagnosis:** Rising MTTD combined with rising change failure rate is a signal that architectural complexity is increasing faster than the system's ability to detect its own failures.

**Goodhart's Law warning:** "When a measure becomes a target, it ceases to be a good measure." Using DORA metrics to rank or compare teams is counterproductive — teams operate in radically different contexts (mainframes vs serverless, different regulatory environments). The metrics are guides for team self-improvement, not performance benchmarks.

**Context dependency example:** Deployment frequency conventionally "should be increased," but mobile apps that trigger update notifications with every deploy can decrease customer Net Promoter Score. One team solved this with deployment rings (alpha/beta/production) — deploying to alpha on every commit, without forcing user-facing updates. Appropriate metrics depend on context.

## Related Concepts

- [[concepts/fitness-functions]] — the four key metrics are process fitness functions
- [[concepts/deployment-pipelines]] — the delivery mechanism whose health the metrics reflect
- [[concepts/evolutionary-architecture]] — metrics-driven delivery is a prerequisite for evolutionary change
- [[operations/observability]] — monitoring integration is required for accurate failure detection timestamps
- [[concepts/continuous-delivery-practices]] — the eight technical capabilities that drive the four metrics; what teams must implement to improve their scores

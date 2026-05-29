---
title: "Cost vs Availability Decision Guide"
type: comparison
tags: [cost, availability, slo, decision-guide, finance, error-budget, redundancy]
sources: [release-it, site-reliability-engineering, understanding-distributed-systems, foundations-of-scalable-systems, software-architecture-metrics]
created: 2026-05-29
updated: 2026-05-29
---

# Cost vs Availability Decision Guide

## Key Claims

- **Availability is paid for in money; the bill is non-negotiable.** Each additional nine of availability is roughly 10× the engineering cost. Five nines is not a target you reach with effort; it's a target you reach with budget.
- **100% is always the wrong target** (SRE). Past user-perceptible thresholds, additional nines consume engineering capacity that could buy features. The target is set by user impact, not technical aspiration.
- **Downtime cost is the conversion rate** between availability and money. A high-traffic e-commerce site loses $3K/minute at peak. Five minutes of monthly downtime over five years = $900K. A $50K investment that prevents it returns 18×.
- **Dependencies multiply availability cost.** Each dependency degrades the upper bound: five services at 99.9% give 99.5% in series. To reach high availability with many dependencies, reduce dependency depth, isolate fault domains, or accept degraded responses.
- **MTTR matters more than MTBF at scale.** At hyperscale, failure is constant. Recovery speed is the lever. Allspaw's argument; SRE operationalises it.
- **Tyranny of the nines is the dominant antipattern.** Specifying availability without specifying what for. Negotiate per-feature: does the *entire* system need five nines, or only the transaction core?

## Why This Page

[[operations/availability]] covers the mechanics. [[concepts/cost-as-architectural-force]] covers the economics. This page is the *decision* — given a desired availability, what's the cost? Given a budget, what availability is realistic? When does each technique earn its cost?

## The Nines Table (with money attached)

The standard nines table, extended with cost framing:

| Availability | Downtime/year | Downtime/day | Typical practitioner cost profile |
|---|---|---|---|
| 90.0% (one nine) | 36 days 12 hr | 2.4 hr | Hobby project; one server; no on-call |
| 99.0% (two nines) | 87 hr 46 min | 14 min | Single-region, managed services; business-hours on-call |
| 99.9% (three nines) | 8 hr 46 min | 86 sec | Multi-AZ; 24×7 on-call; automated failover |
| 99.99% (four nines) | 52 min 33 sec | 7 sec | Multi-region; chaos engineering; sub-minute MTTR target |
| 99.999% (five nines) | 5 min 35 sec | 1 sec | Designed redundancy at every layer; SRE discipline; significant engineering investment |
| 99.9999% (six nines) | 31.5 sec | 86 ms | Specialised hardware; deep formal verification; rare outside life-critical systems |

Each additional nine is roughly 10× the engineering cost. **The question is never "can we reach five nines?" but "what does five nines cost, and is it worth it?"**

## The Conversion: Downtime Cost

Availability becomes financial when you multiply downtime by cost-per-minute-of-downtime.

```
Annual downtime cost = (1 − SLO) × hours_in_year × cost_per_hour_of_downtime
```

**Estimating cost-per-hour-of-downtime:**

| Business type | Typical cost-per-hour-of-downtime |
|---|---|
| High-traffic e-commerce at peak | $100K – $1M |
| Mid-market SaaS | $5K – $50K |
| Internal tool | $500 – $5K |
| Background processing (no SLO violation) | ~$0 |
| Life-critical (medical, aviation) | Effectively unbounded |

**The investment threshold.** If a one-time investment of $X eliminates Y hours of downtime per year over a 5-year asset life:

```
ROI = (Y × hours/year × cost_per_hour × 5 years) / X
```

[[sources/release-it]] ch. 1's canonical example: $50K invested in zero-downtime deployment vs $900K downtime cost over 5 years = 18× ROI. The maths makes the case.

## The Decision Tree

### Q1: What does the user actually need?

The first question is almost always under-asked. "Five nines" specified without justification is the dominant antipattern.

- What user activities matter? (login, purchase, view, edit)
- What's the user's tolerance threshold? (annoyed at 1s, leaves at 3s, complains at downtime > 5 min, files support ticket at downtime > 1 hr)
- Is the system used continuously, or in bursts? (5 min downtime at 3am vs 5 min downtime during Black Friday)
- Is there a fallback? (cached data, queue, retry-later) — fallback availability adds to the user-visible nines.

The honest answer is often "99% is fine for this feature; 99.9% for the transaction core." That's *two* SLOs, not one — see Q4.

### Q2: What does downtime cost us?

For each minute of downtime:
- **Direct revenue lost** (transactions not completed).
- **Customer trust degraded** (churn risk, NPS hit).
- **SLA penalties** (contractual credits, refunds).
- **Engineering response cost** (incident response, postmortems, remediation work).
- **Opportunity cost** (features not built while firefighting).

Sum these per minute of downtime. Multiply by minutes of downtime per year at each candidate SLO. The differences between SLO levels are real money.

### Q3: What does the *investment* cost?

For each additional nine, what investments are required?

| Going from | Required investments |
|---|---|
| 99% → 99.9% | Multi-AZ deployment; automated failover; basic monitoring/alerting; 24×7 on-call |
| 99.9% → 99.99% | Multi-region; chaos engineering ([[operations/chaos-engineering]]); circuit breakers + bulkheads ([[concepts/stability-patterns]]); sub-minute MTTR target |
| 99.99% → 99.999% | Cellular architecture; per-cell capacity isolation; automated remediation; SRE org structure ([[operations/site-reliability-engineering]]); error budget discipline |
| 99.999% → 99.9999% | Specialised hardware; formal verification (TLA+); rigorous change management |

Each step is a discrete investment. Total cost: engineering time, infrastructure cost, operational overhead, organisational discipline. These compound — the operational overhead of a five-nines system is not 10× a four-nines system; it's qualitatively different.

### Q4: Can you set different SLOs for different features?

This is usually the right answer. The same system rarely needs the same availability everywhere.

**Common pattern:**
- **Transaction core** (checkout, payment, account changes): five nines. High investment justified by direct revenue impact.
- **Read paths** (browse, search, view): four nines. Important but degradation possible.
- **Discovery / recommendations**: three nines. Falls back to cached or simpler results.
- **Analytics, reporting, admin**: two nines or less. Background work; degradation acceptable.

The architectural implication: feature-level isolation. Bulkheads ([[patterns/bulkhead]]), cellular architecture, graceful degradation under load. The five-nines core is small enough to be designed for it; the rest of the system trades off cost for the bulk of features.

## Where Each Nine Is Earned

The big chunks of availability investment, ordered by typical ROI.

### High ROI: 90% → 99% → 99.9%

**Cheapest investments:**
- Multi-AZ deployment (often a flag on a managed service).
- Health checks and automated load-balancer removal of failed instances ([[distributed/load-balancing]]).
- [[patterns/timeout]] on every external call.
- Basic [[operations/monitoring]] and alerting on user-visible SLIs.
- Automated deployment pipelines ([[concepts/deployment-pipelines]]) so deploy time doesn't dominate downtime.
- [[patterns/progressive-delivery]] to limit blast radius of bad releases.

Most teams have done these but treat them as one-time setup. Continuous attention (updates, dashboards, runbook freshness) keeps them earning.

### Medium ROI: 99.9% → 99.99%

- Multi-region deployment (active-active or active-passive).
- [[patterns/circuit-breaker]], [[patterns/bulkhead]], [[patterns/retry]] applied at every integration point ([[comparisons/stability-pattern-selection]]).
- [[operations/chaos-engineering]] to verify failure modes work as designed.
- [[operations/error-budgets]] to gate aggressive change against reliability impact.
- Investment in MTTR: better tooling, better runbooks, on-call training.
- Backups + restore drills ([[operations/data-integrity]]).

The transition from three nines to four is mostly about *reducing MTTR* rather than reducing MTBF. The cost is real but bounded.

### Diminishing ROI: 99.99% → 99.999%

- Cellular / cell-based architecture (each cell isolated; failure of one cell affects 1/N of users).
- Per-cell capacity and operational isolation.
- Automated remediation (not just alerts → runbook, but alerts → automated action).
- Dedicated SRE organisation with operational authority.
- Capacity for rapid rollback at every layer (database, code, schema).

Past this point, the system organisation, not just the architecture, has to be designed for it.

### Very Diminishing ROI: 99.999% → 99.9999%

- Specialised hardware (redundant network paths, hot-spare data centres).
- Formal verification of critical components (TLA+ on consensus, migration procedures).
- Rigorous change management; long bake periods; multiple approval gates.
- The organisation becomes risk-averse to features in service of availability.

Rare outside life-critical systems. For most businesses, the user impact of moving from five nines to six nines is invisible while the cost is large.

## When Each Investment Earns Its Cost

A few rules of thumb for evaluating specific availability investments.

**Multi-AZ deployment** almost always justifies itself for any business-critical service. The cost is modest (some additional infrastructure spend, cross-AZ traffic cost); the benefit is taking AZ failures off the table.

**Multi-region** is harder to justify. The cost is high (data replication across regions, cross-region traffic, additional operational complexity). The benefit is taking regional failures off the table. Most businesses don't experience regional failures often enough for this to clear ROI unless availability requirements are very high.

**Chaos engineering** ([[operations/chaos-engineering]]) earns its cost by surfacing problems before they cause incidents. Its ROI is hard to measure directly ("the incident that didn't happen") but Kirkpatrick-Level-2 metrics like "vulnerabilities discovered before user impact" support the case.

**Zero-downtime deployment** ([[sources/release-it]] ch. 1's canonical example): 18× ROI over 5 years for typical e-commerce. Almost always justifies itself if you deploy more than monthly.

**Investment in MTTR** ([[operations/incident-management]]) typically out-earns investment in MTBF (preventing failure) at scale. Where MTBF approaches zero anyway, MTTR is the active lever.

**Backups and restore drills** ([[operations/data-integrity]]) have very high ROI because the failure mode they prevent (data loss) is unbounded. Test the restore; an untested backup is no backup.

## Anti-Patterns

**Specifying availability without specifying scope.** "The system needs five nines" without saying *which features need five nines* is the most expensive failure mode. The default cost is to make the *entire* system five nines, which is usually overkill and often not feasible.

**Treating availability as a technical decision.** Availability targets are business decisions. The conversion to money (Q2 above) makes the trade-off real. Engineers should not unilaterally accept availability targets without business sign-off on the cost.

**100% as a target.** SRE's central argument: 100% is always wrong. Users have tolerance thresholds; past those, additional availability is invisible. Push the target to "what users can tell the difference at" and stop.

**Tyranny of the nines.** Targeting four nines because four nines sounds better than three. The right level is the lowest level that meets user need; one nine higher costs 10× more.

**MTBF investment without MTTR investment.** Preventing failure is harder and more expensive than detecting + recovering from it. Both matter; in mature systems, MTTR is usually the dominant lever.

**Redundancy without isolation.** Two database replicas behind a shared load balancer are not redundant from the load-balancer's perspective. Redundancy must extend to every shared dependency; otherwise the unshared component is the SPOF.

**Adding investment without removing risk.** A new auto-scaler, a new fallback path, a new monitoring system — each one adds complexity, and complexity itself reduces reliability. Counter-intuitively, removing complexity often increases availability more than adding redundancy does (see [[operations/chaos-engineering]]'s "three counter-intuitive rules").

**SLA penalties as the only motivation.** SLAs are external contracts; SLOs are internal targets. Targeting "just above the SLA" makes the SLA the operating point, which means every minor incident risks breaching it. Set SLOs comfortably above SLAs.

## The Architectural Implications

High availability isn't just operational discipline; it's an architectural property. Some architectures make high availability cheap; others make it expensive.

**Cheaper to achieve high availability:**
- Stateless services ([[distributed/scalability]]) — failed instances replaceable without coordination.
- Bulkhead architecture ([[patterns/bulkhead]]) — partition-level failures don't propagate.
- Asynchronous communication ([[comparisons/sync-vs-async-communication]]) — no temporal coupling between availability of services.
- Cellular architecture — cell-level isolation contains failures.
- Read replicas + eventual consistency ([[distributed/consistency-models]]) — reads survive write-tier failures.

**Expensive to achieve high availability:**
- Distributed transactions (2PC) — coordinator failure blocks. See [[distributed/distributed-transactions]].
- Synchronous service chains — availability multiplies down the chain.
- Shared databases — SPOF; coupling all callers' availability to one component.
- Strong consistency across regions — requires consensus, which has hard latency and availability trade-offs ([[distributed/consensus-algorithms]]).

**The architectural choice precedes the availability investment.** A distributed monolith will never reach five nines cheaply. The investment goes into changing the architecture, not into adding redundancy to a fragile one.

## How Different Sources Treat It

| Source | Angle |
|--------|-------|
| [[sources/release-it]] | The canonical "design decisions are financial decisions" framing. ROI calculations for stability investments; "deployment army" opportunity-cost analysis; downtime cost as the link between availability and money. |
| [[sources/site-reliability-engineering]] | The discipline of error budgets, SLO-driven engineering, MTTR > MTBF at scale, the 100%-is-wrong argument. |
| [[sources/understanding-distributed-systems]] | Multi-AZ and multi-region patterns; the nines arithmetic; dependency-chaining effects on composite availability. |
| [[sources/foundations-of-scalable-systems]] | Cost-as-tuneable-property of elastic systems; the parameter studies showing non-intuitive cost/availability/throughput trade-offs. |
| [[sources/software-architecture-metrics]] | Availability measurement framework (MTBF/MTTR/RPO/RTO); quality attribute measurement as a discipline (Woods, ch. 7). |

## Related Concepts

- [[operations/availability]] — the mechanics of availability
- [[concepts/cost-as-architectural-force]] — cost as a first-class quality attribute
- [[operations/error-budgets]] — operational mechanism for negotiating reliability vs change
- [[operations/site-reliability-engineering]] — the discipline behind these decisions
- [[concepts/stability-patterns]] — the pattern set that earns the nines
- [[comparisons/stability-pattern-selection]] — selecting and composing those patterns
- [[comparisons/performance-and-capacity]] — performance investment with similar ROI logic
- [[patterns/progressive-delivery]] — limiting blast radius of releases
- [[operations/chaos-engineering]] — verifying availability investments actually work
- [[operations/data-integrity]] — availability vs data integrity (orthogonal concerns)
- [[operations/monitoring]] — SLI/SLO definition and burn-rate alerting
- [[operations/incident-management]] — MTTR as the active lever
- [[concepts/architecture-characteristics]] — availability in the trade-off framework
- [[styles/architecture-styles]] — style choice as availability ceiling

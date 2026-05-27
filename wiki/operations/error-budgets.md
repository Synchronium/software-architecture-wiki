---
title: "Error Budgets"
type: concept
tags: [reliability, sre, slos, availability, operations, risk]
sources: [site-reliability-engineering, understanding-distributed-systems]
created: 2026-05-27
updated: 2026-05-27
---

# Error Budgets

## Definition

An error budget is the acceptable amount of unreliability for a service over a given time window. It is derived directly from the SLO:

```
error budget = 1 − SLO target
```

A service with a 99.9% availability SLO has a 0.1% error budget — it may be unavailable for up to 0.1% of requests (or time) in the window before the SLO is breached. (→ [[sources/site-reliability-engineering]] ch. 1)

## Why It Matters

The error budget resolves the structural tension between development teams (who want to ship features quickly) and operations teams (who want stability). Without a shared metric, the two teams optimise for incompatible goals and resort to procedural conflict — launch gates, flag flips, and friction. The error budget converts this into a shared variable both teams want to manage well:

- If budget is plentiful, the development team can take risks, ship faster, and experiment with riskier rollout strategies.
- If budget is nearly exhausted, the team must slow down and prioritise reliability work — not because an ops team said so, but because the shared agreement demands it.

> "An outage is no longer a 'bad' thing — it is an expected part of the process of innovation, and an occurrence that both development and SRE teams manage rather than fear." (→ [[sources/site-reliability-engineering]] ch. 1)

## Reliability as a Continuum

SRE conceptualises risk and reliability as a continuum, not a binary property. The cost of an incremental reliability improvement is non-linear — each additional nine may cost an order of magnitude more than the previous one, in two forms:

- **Redundancy cost**: hardware, compute, and infrastructure to support failover.
- **Opportunity cost**: engineering resources spent on reliability rather than features.

The goal is to place a service at the right point on that continuum — explicitly, based on business risk tolerance — rather than to default to "as reliable as possible." An SLO should therefore be treated as both a floor (minimum) and a ceiling (maximum): exceeding the target wastes capacity that could have funded features or debt reduction. (→ [[sources/site-reliability-engineering]] ch. 3)

## 100% Is Always the Wrong Target

The SRE book argues that 100% availability is the wrong target for almost any system:

1. Users cannot perceive the difference between 100% and 99.999% — other components in the path (ISP, home network, user device) collectively fall short of 99.999% anyway.
2. The engineering cost of each additional nine increases roughly by an order of magnitude.
3. Targeting 100% prevents the team from ever deploying risky changes, stifling the feature development that creates business value.

**ISP noise floor**: The typical background error rate across ISPs is 0.01%–1%. Once a service's error rate falls below this floor, users cannot distinguish service errors from normal connection noise. Driving reliability beyond this floor yields no user-visible benefit. (→ [[sources/site-reliability-engineering]] ch. 3)

Setting an SLO of, say, 99.9% explicitly acknowledges that 0.1% failure is acceptable — and then treats that budget as a resource to spend on risk-taking, not a limit to be avoided at all costs. (→ [[sources/site-reliability-engineering]] ch. 1, 3)

## Forming an Error Budget

The standard Google process for quarterly error budgets (→ [[sources/site-reliability-engineering]] ch. 3):

1. **Product Management** defines the SLO — the availability target for the quarter.
2. The **monitoring system** is the neutral third party that measures actual uptime.
3. The difference between target and actual is the remaining budget available for risk-taking.
4. As long as budget remains, releases can proceed. When budget is exhausted, releases halt and reliability investment takes priority.

**Cost/benefit framing**: For any proposed improvement in reliability, the question is whether the revenue value of the additional uptime exceeds the engineering cost. Example: improving from 99.9% → 99.99% on a $1M/year revenue service adds 0.09% × $1M = $900 of value. If the engineering investment exceeds $900, it is not economically justified. (→ [[sources/site-reliability-engineering]] ch. 3)

## Tiered Service Levels for Infrastructure

Consumer services have clear product owners to define SLOs. Infrastructure services (storage, proxies, load balancers) serve multiple clients with divergent needs — some require low latency and high reliability; others care about throughput. Attempting to engineer all infrastructure to the highest tier is prohibitively expensive.

The SRE solution: offer infrastructure at explicitly delineated service tiers. Clients choose the tier that fits their risk tolerance and pay the corresponding cost. Example — Bigtable low-latency clusters (high redundancy, slack capacity, isolation) vs throughput clusters (run hot, reduced redundancy) at 10–50% of the cost. This externalises the cost of reliability and motivates clients to choose the lowest tier that meets their needs. (→ [[sources/site-reliability-engineering]] ch. 3)

## How Budgets Are Spent

The error budget can be consumed by anything that degrades the SLI: planned deployments, A/B experiments, canary rollouts, hardware failures, software bugs, or dependency outages. This means the development team has a strong incentive to:

- Keep deployments safe (progressive rollouts, fast rollback)
- Invest in testing and staging environments
- Maintain spare error budget before large launches

## Budget Exhaustion

When the error budget is exhausted — i.e., the SLO has been violated — the recommended response is to halt feature releases for the remainder of the SLO window and focus entirely on reliability improvements. This is not a penalty; it is a natural consequence of having spent the shared resource. Because both development and SRE teams agreed to the SLO, the decision to stop releases is not an ops team imposing friction — it is the contract activating. (→ [[sources/site-reliability-engineering]] ch. 1)

## Burn Rate Alerting

Rather than alerting when the SLO is breached (too late), burn rate alerting fires when the error budget is being consumed faster than sustainable. The burn rate expresses how quickly the budget is depleting relative to the SLO window:

```
burn rate = (% budget consumed) / (% of SLO window elapsed)
```

- Burn rate = 1: budget will last exactly until the end of the window.
- Burn rate = 10: budget will be exhausted in 10% of the window.

Multiple thresholds create tiered response: a low burn rate triggers a ticket; a high burn rate pages immediately. (→ [[operations/monitoring]])

## Relationship to SLOs and SLIs

Error budgets, SLOs, and SLIs form a hierarchy:

| Term | What it is |
|------|-----------|
| **SLI** | The measured metric (e.g., fraction of successful requests) |
| **SLO** | The target for the SLI (e.g., 99.9% of requests succeed) |
| **Error budget** | The complement of the SLO target; what can be spent on risk |
| **SLA** | The contractual commitment to customers, with consequences for breach |

The SLO is an internal agreement; the SLA is an external contract. Error budgets are typically set on SLOs, not SLAs — you want to exhaust the SLO budget before approaching SLA violation.

## Related Concepts

- [[operations/site-reliability-engineering]] — the broader discipline in which error budgets originate
- [[operations/monitoring]] — burn rate alerting makes error budget consumption visible
- [[operations/availability]] — error budgets operationalise availability targets
- [[concepts/deployment-pipelines]] — deployment pipelines implement the progressive rollout strategies that preserve error budget

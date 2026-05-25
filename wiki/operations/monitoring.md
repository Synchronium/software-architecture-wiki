---
title: "Monitoring"
type: concept
tags: [monitoring, sli, slos, alerting, dashboards, observability, reliability, on-call]
sources: [understanding-distributed-systems, release-it]
created: 2026-05-14
updated: 2026-05-19
---

# Monitoring

## Definition

Monitoring is the practice of continuously tracking a system's health in production, primarily to detect failures that impact users and to trigger alerts to human operators. A secondary use is providing dashboards that give a high-level view of system health.

## Black-Box vs White-Box Monitoring

**Black-box monitoring** observes a system from the outside without knowledge of its internals — e.g., periodically sending test requests from synthetic scripts (synthetics) to external API endpoints and recording latency and success. Deployed in the same regions as users. Catches issues invisible from within the service (DNS failures, connectivity problems, infrequently-exercised API paths).

**White-box monitoring** instruments the application itself to report on its internal behaviour — cache hit rates, repository response times, handler durations. Introduced by Etsy's statsd. Complements black-box monitoring: black-box catches symptoms, white-box helps identify root cause.

## Metrics

A metric is a time series of raw measurements (samples), each a floating-point number with a timestamp. Metrics can be tagged with key-value labels (region, cluster, node), enabling slicing without pre-creating separate metrics — but every distinct label combination is a distinct metric, creating dimensionality challenges.

**Pre-aggregation**: time-series data is expensive to store and query at event granularity. Metrics are pre-aggregated at fixed periods (1 min, 5 min, 1 hour) into summary statistics (sum, average, percentiles). This can happen client-side (telemetry agent), server-side (telemetry service), or both. Trade-off: client-side pre-aggregation reduces cost dramatically but loses the ability to re-aggregate at finer granularity later.

Metrics are stored in time-series data stores optimised for high-throughput, low-dimensional data (e.g., CloudWatch, Druid). They are the primary telemetry for alerting and dashboards; for debugging, see [[operations/observability]].

## Service-Level Indicators (SLIs)

An SLI measures one aspect of the level of service provided to users. Defined as a ratio:

```
SLI = good events / total events
```

A ratio of 0 means completely broken; 1 means the measured dimension is working perfectly. Common SLIs:

- **Availability**: successful requests / total requests.
- **Response time**: fraction of requests completing faster than a given threshold.

**Where to measure**: measure where it best represents the user experience. Client-side latency (accounting for full network path) is more meaningful than service-internal latency. If client-side collection is too costly, work inward to the next best proxy.

**Percentiles over averages**: response times are right-skewed and long-tailed. Averages hide the distribution and are easily distorted by outliers. Percentiles (P99, P99.9) are a better representation. Long-tail latencies disproportionately affect high-value users (those making the most requests), and their business impact is measurable — a 100 ms increase in load time can reduce conversion by 7%.

**Little's Law and tail latency**: if 1% of requests suddenly take 20s instead of 200ms, the thread pool must double just to handle that 1%. Tail latency degrades the average case and can cascade into resource exhaustion.

## Service-Level Objectives (SLOs)

An SLO defines the acceptable range for an SLI — the performance the service's users should expect when the service is functioning correctly. (→ [[sources/understanding-distributed-systems]] ch. 31)

```
Example: 99% of requests to endpoint X complete in < 200 ms
         over a rolling 7-day window.
```

The complement of the SLO target is the **error budget**: the number of failures that can be tolerated. In the example above, up to 1% of requests may exceed 200 ms. The error budget gives teams a principled way to balance reliability work against feature development.

**Multiple window sizes**: short windows (hours/days) force rapid incident response; long windows (weeks/months) inform investment decisions about which reliability projects to fund.

**Setting targets**:
- Work backward from what users care about, not from what the service currently achieves.
- Start with comfortable targets; tighten as confidence grows.
- Don't pick today's performance as the target — load may increase it beyond reach.
- Above 3 nines (99.9%) is very costly and yields diminishing user-facing returns. 100% is impossible because factors outside the service (last-mile connectivity) prevent a 100% user experience even with a 100% reliable service.
- Targets must be agreed on by engineers (achievable without excessive toil) and product managers (sufficient for a good user experience). "If you can't win a conversation about priorities by quoting a particular SLO, it's probably not worth having." (→ Google SRE book)

**Priority signalling**: when an error budget is exhausted, repair items take priority over features. Incident severity is measurable as the fraction of error budget burned.

**Chaos testing**: periodically inject controlled failures into production to prevent dependencies from over-relying on behaviour that exceeds the documented SLA, and to validate that resiliency mechanisms work. (→ [[operations/chaos-engineering]], [[operations/common-failure-causes]], [[patterns/circuit-breaker]])

## Alerts

Alerts are triggered when a monitored condition is met and route to automation (e.g., automated restart) or a human operator on call.

**SLO-based alerting is preferred**: CPU spikes are not actionable; an SLO breach is — it directly quantifies user impact.

**Precision vs recall**: precision = fraction of alerts that are real issues; recall = fraction of real issues that generate alerts. Improving one typically degrades the other.

**Burn rate alerting** resolves the precision/recall dilemma. The burn rate is the rate at which the error budget is being consumed:

```
burn rate = (% error budget consumed) / (% of SLO time window elapsed)
```

- Burn rate = 1: budget will be exhausted exactly at the end of the SLO window.
- Burn rate = 10: budget will be exhausted in 10% of the SLO window (roughly 3 days for a 30-day SLO).

Multiple burn rate thresholds create tiered alerts: low burn rate → low-severity (investigate during business hours); high burn rate → page on-call immediately.

**Alert runbooks**: every alert should link to the relevant dashboards and a runbook listing what the operator should do. This reduces MTTM (mean time to mitigate).

## Dashboards

Three dashboard types, each with a different audience:

| Dashboard | Audience | Content |
|-----------|----------|---------|
| **SLO dashboard** | All stakeholders | SLI ratios vs targets; error budget remaining; incident impact quantification |
| **Public API dashboard** | Operators during incidents | Per-endpoint request counts, latency, error counts, auth failures, response sizes |
| **Service dashboard** | Service team | Service internals + upstream (load balancers, queues) + downstream (data stores) dependencies |

**Best practices** (→ [[sources/understanding-distributed-systems]] ch. 31):
- Define dashboards in code (DSL) and version-control them alongside the service — avoids manual drift across environments.
- Most important charts at the top (dashboards render top-to-bottom).
- All charts in the same dashboard use the same time resolution and range for visual correlation.
- Use UTC timezone for all charts.
- Annotate charts with: alert thresholds (horizontal lines), deployment events (vertical lines), runbook links.
- For metrics that are absent when no error occurs, emit 0 (not absence) — gaps confuse operators.
- Keep metrics per chart to a minimum; split metrics with very different ranges into separate charts.

## Economic Value Framing (Nygard)

Nygard (→ [[sources/release-it]] ch. 10) reframes the purpose of monitoring: the two fundamental questions for system-wide transparency are not "Is everything running?" but:
1. **Are users receiving a good experience?**
2. **Is the system creating the economic value we want?**

"Is everything running?" is irrelevant — partially broken is the normal state at scale.

**Top line (revenue)**: watch each step of a business process for conversion drop-offs; track queue depth as the first indicator of performance degradation (non-zero queue depth means increased response times for every transaction going through it); log exceptions in revenue-generating flows (they probably reduce the top line).

**Bottom line (costs)**: infrastructure costs (unchecked autoscaling = surprise bills); operational labour costs (every incident is unplanned work that could have gone to raising the top line); runtime footprint (language/runtime choice affects cost per handled request).

**What to expose in metrics** — categories Nygard consistently finds useful:
- **Traffic indicators**: page requests, concurrent sessions (see note below), transaction counts
- **Business transactions per type**: count, count aborted, dollar value, transaction aging, conversion rate, completion rate
- **Resource pool health**: enabled state, total resources, resources checked out, high-water mark, resources created/destroyed, threads blocked waiting
- **Database connection health**: SQLExceptions thrown, query count, average response time
- **Integration point health**: circuit breaker state, timeouts, requests, average response time, error counts by type (network/protocol/application), actual IP of remote endpoint, concurrent requests, high-water mark
- **Cache health**: items, memory, hit rate, GC flushes, configured limit

**Sessions ≠ users** (→ [[sources/release-it]] ch. 15): session count always overestimates actual concurrent users. A session is kept alive by a server-side timeout after the last request — the user may have left long before the session expires. Counting active sessions is the most important metric for app server health (it predicts RAM and CPU load), but it must not be confused with actual user count. Bots, scrapers, and cookieless clients also create sessions; their traffic is invisible to happy-path load tests.

The economic framing makes it easy to decide what to monitor: if it doesn't affect user experience or economic value, it's lower priority.

## On-Call

A healthy on-call rotation requires that developers are responsible for operating what they build — they have the context, and the incentive to reduce operational burden.

**Key principles**:
- On-call should be compensated; no expectation of feature progress while on call.
- Alerts must be actionable. If an alert requires exploring dashboards to understand whether it matters, it's not actionable.
- First step on an alert: **mitigate**, not investigate. Roll back a bad deployment; scale out an overloaded service.
- After mitigation: root cause analysis, repair items, postmortem. Severity is proportional to error budget consumed.
- If error budget is exhausted or alert volume is out of control: the whole team stops feature work until a healthy rotation is restored.
- All incident actions should be communicated to a shared channel to enable handover and cross-team visibility.

## Related Concepts

- [[operations/observability]] — observability extends monitoring with logs and traces for root cause diagnosis
- [[operations/availability]] — SLOs operationalise availability targets
- [[operations/common-failure-causes]] — postmortem categories; what burns error budgets
- [[distributed/rate-limiting]] — upstream resiliency prevents load from burning error budgets
- [[patterns/circuit-breaker]] — downstream resiliency; prevents cascading failure from burning error budgets
- [[concepts/deployment-pipelines]] — health signals drive bake time gating; deployment events annotate dashboards

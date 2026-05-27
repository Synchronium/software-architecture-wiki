---
title: "Monitoring"
type: concept
tags: [monitoring, sli, slos, alerting, dashboards, observability, reliability, on-call]
sources: [understanding-distributed-systems, release-it, site-reliability-engineering]
created: 2026-05-14
updated: 2026-05-27
---

# Monitoring

## Definition

Monitoring is the practice of continuously tracking a system's health in production, primarily to detect failures that impact users and to trigger alerts to human operators. A secondary use is providing dashboards that give a high-level view of system health.

## Counters vs Gauges

Two fundamental metric types (→ [[sources/site-reliability-engineering]] ch. 10):

- **Counter**: a monotonically increasing value (never decreases). Measures total events since process start — total requests served, total errors, total bytes written. Rate computation (`rate()`) is safe even across missed collection intervals, because the counter difference is still correct if a collection is skipped.
- **Gauge**: a value that can go up or down — current queue depth, active connections, memory usage. Prone to missed events: if a queue empties and refills between two collection intervals, the gauge appears unchanged even though work was done.

Prefer counters where possible. Alert on rates derived from counters rather than on gauge values directly.

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

**SLI categories by service type** (→ [[sources/site-reliability-engineering]] ch. 4):
- **User-facing serving systems**: availability, latency, throughput
- **Storage systems**: latency, availability, durability
- **Big data pipelines**: throughput, end-to-end latency
- **All systems**: correctness (was the right answer returned?)

**Where to measure**: measure where it best represents the user experience. Client-side latency (accounting for full network path) is more meaningful than service-internal latency. If client-side collection is too costly, work inward to the next best proxy.

**Standardise definitions**: define reusable SLI templates specifying aggregation interval (e.g. "averaged over 1 minute"), aggregation region, measurement frequency, which requests are included, how data is acquired, and latency basis (e.g. "time to last byte"). Templates prevent reasoning from first principles for every SLI.

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

**As few SLOs as possible**: choose just enough to give good coverage. If an SLO cannot win a priority conversation — if quoting it never changes what gets worked on — it is not worth having. (→ [[sources/site-reliability-engineering]] ch. 4)

**Don't overachieve**: users build on the actual performance they observe, not the stated SLO. A service that consistently exceeds its SLO causes users to over-depend on that level of reliability. When the service eventually regresses to its stated target, those users break. Google's Chubby lock service became so reliable that dependent teams assumed it would never fail; when it did, they had no fallback. SRE's fix: synthesize planned outages if Chubby has not naturally hit its SLO target in a quarter. This flushes out over-dependencies before they become production liabilities. The broader principle: operate close to your stated SLO, not far above it. (→ [[sources/site-reliability-engineering]] ch. 4)

**Internal vs external SLO**: maintain a tighter internal target than the published SLA. This safety margin allows response to chronic problems before external breach, and accommodates reimplementations that trade performance for maintainability.

**Chaos testing**: periodically inject controlled failures into production to prevent dependencies from over-relying on behaviour that exceeds the documented SLA, and to validate that resiliency mechanisms work. (→ [[operations/chaos-engineering]], [[operations/common-failure-causes]], [[patterns/circuit-breaker]])

## The Four Golden Signals

The SRE book's canonical monitoring framework for user-facing systems (→ [[sources/site-reliability-engineering]] ch. 6): if you can only measure four metrics, measure these:

| Signal | What it measures | Notes |
|--------|----------------|-------|
| **Latency** | Time to service a request | Track error latency separately — a fast error is still an error, but a slow error is worse than both |
| **Traffic** | Demand on the system | Requests/sec, sessions, transactions/sec — chosen to match the system's primary activity |
| **Errors** | Rate of failed requests | Explicit (HTTP 5xx), implicit (200 with wrong content), or by policy (response > SLO threshold) |
| **Saturation** | How "full" the system is | The most constrained resource (CPU, memory, I/O); latency increases are often a leading indicator |

Saturation differs from the others: it is about predicting impending failure, not measuring current failure. A utilisation target is essential because many systems degrade before reaching 100% utilisation.

## Symptoms vs Causes

Alert on **symptoms** (what's broken from the user's perspective), not causes (why it's broken). Cause-based alerts generate noise — a CPU spike isn't actionable; a user-visible error rate is. (→ [[sources/site-reliability-engineering]] ch. 6)

Causes are for debugging after an alert fires. White-box monitoring provides the cause-level detail needed to diagnose; black-box monitoring provides the symptom-level signal needed to alert.

> **One person's cause is another person's symptom**: slow database reads are a symptom for the database SRE but a cause for the frontend SRE observing slow page loads. The distinction depends on which layer you're examining.

## Alert Quality Criteria

Every alert that pages a human must satisfy these criteria (→ [[sources/site-reliability-engineering]] ch. 6):

1. **Actionable** — the on-call engineer can do something in response right now.
2. **Requires intelligence** — the response is not a rote script or fixed procedure. If it is, automate it.
3. **Urgent or imminent** — the problem is already affecting users, or will shortly.
4. **Novel** — alerts that fire repeatedly for the same known condition should be resolved at the root cause or automated.

Pages that fail these criteria cause fatigue, cause engineers to ignore pages, and mask real incidents. Alert volume is a proxy for operational health — rising alert counts should trigger investigation of root causes, not just faster response.

## Monitoring Output Taxonomy (SRE)

The SRE book defines three — and only three — valid categories of monitoring output (→ [[sources/site-reliability-engineering]] ch. 1):

| Output | Meaning | Required response |
|--------|---------|------------------|
| **Alert** | Something is happening or about to happen that requires immediate human action | Page on-call now |
| **Ticket** | Action is needed, but not urgently — the system cannot self-resolve, but a few days' delay causes no harm | Create a ticket for the next working day |
| **Log** | Recorded for diagnostic or forensic purposes; no one reads it unless prompted by another signal | None |

If a monitoring signal does not clearly fit one of these categories, it should not exist. Monitoring that requires a human to interpret whether it matters is "fundamentally flawed" — the software should do the interpreting. (→ [[sources/site-reliability-engineering]] ch. 1)

> **Contradiction:** This taxonomy implies that dashboards are not monitoring output — they are tools for investigation *after* an alert fires. Nygard's economic framing below treats dashboards as first-class operational instruments. The SRE view is that proactive dashboard-watching is a form of toil; the Nygard view is that business-process dashboards have independent value for detecting degradation that SLOs may miss.

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

**SRE on-call capacity rules** (→ [[sources/site-reliability-engineering]] ch. 11):
- At most 25% of time on-call (a sub-rule of the overall 50% ops cap); at least 50% must be engineering.
- Maximum ~2 paging incidents per 12-hour shift (each incident = ~6 hours of work). A component that pages daily has an unsustainable failure rate.
- Minimum team size for 24/7 single-site coverage: 8 engineers (primary + secondary, honouring 25% rule).
- For multi-site "follow the sun" coverage: ≥6 engineers per site; avoids night shifts and their health consequences.
- Operational underload (never on-call) is also harmful: engineers lose production intuition; minimum once or twice per quarter.
- **"Give back the pager"**: if a service generates unsustainable operational load, SRE can return on-call responsibility to the developer team until the service meets standards. Alert flap prevention: minimum duration (≥2 evaluation cycles) before an alert fires prevents transient collection failures from paging.

**Incident psychology**: stress hormones impair deliberate, rational cognition and promote habitual responses — exactly the wrong mode for complex incident handling. Reducing on-call stress through clear escalation paths, runbooks, and blameless postmortem culture enables the deliberate thinking complex incidents require. (→ [[sources/site-reliability-engineering]] ch. 11)

## Related Concepts

- [[operations/observability]] — observability extends monitoring with logs and traces for root cause diagnosis
- [[operations/availability]] — SLOs operationalise availability targets
- [[operations/common-failure-causes]] — postmortem categories; what burns error budgets
- [[distributed/rate-limiting]] — upstream resiliency prevents load from burning error budgets
- [[patterns/circuit-breaker]] — downstream resiliency; prevents cascading failure from burning error budgets
- [[concepts/deployment-pipelines]] — health signals drive bake time gating; deployment events annotate dashboards

---
title: "Availability"
type: concept
tags: [distributed-systems, reliability, resiliency, slos, operations, measurement]
sources: [understanding-distributed-systems, release-it, software-architecture-metrics]
created: 2026-05-14
updated: 2026-05-22
---

# Availability

## Definition

**Availability** is the percentage of time a system is operational and able to serve requests. It is defined as:

```
Availability = Uptime / (Uptime + Downtime)
```

**Uptime** is the time the system can serve requests; **downtime** is the time it cannot. (→ [[sources/understanding-distributed-systems]] ch. 1)

## Why It Matters

At scale, failures are inevitable. Every component — nodes, disks, network links, third-party services — has a non-zero probability of failing. The more components a system has, and the more operations it performs, the more frequently failures occur. Availability is the metric that captures how well a system absorbs these failures without impacting users.

## The Nines

Availability is conventionally expressed in "nines" — the number of nines in the percentage:

| Availability | Shorthand | Downtime per day | Downtime per year |
|-------------|-----------|-----------------|-------------------|
| 90% | "one nine" | 2.40 hours | 36.5 days |
| 99% | "two nines" | 14.40 minutes | 3.65 days |
| 99.9% | "three nines" | 1.44 minutes | 8.77 hours |
| 99.99% | "four nines" | 8.64 seconds | 52.6 minutes |
| 99.999% | "five nines" | 864 milliseconds | 5.26 minutes |

Three nines (99.9%) is typically considered acceptable to users. Four nines and above is considered **highly available**. Each additional nine reduces allowable downtime by roughly 10×.

Note that these are aggregate figures — meeting five nines means the system can be down for at most 5 minutes over an entire year, including all planned maintenance.

## Availability vs Reliability vs Resiliency

These terms are related but distinct:

- **Availability**: the percentage of time the system serves requests (a metric).
- **Reliability**: the probability a system functions correctly for a given period without failure (a property).
- **Resiliency**: the ability to continue functioning in the presence of failures, and to recover quickly (a design quality).

Resiliency is the primary means of achieving high availability. A resilient system degrades gracefully when components fail, rather than going completely down.

## Techniques for High Availability

- **Redundancy**: replicate components so a single failure doesn't create a SPOF (→ [[distributed/replication]]).
- **Fault isolation**: contain failures so they don't cascade (→ [[patterns/bulkhead]], [[patterns/circuit-breaker]]).
- **Self-healing**: detect and recover from failures automatically (health checks, auto-restart, leader election).
- **Static stability**: continue operating with degraded data (e.g., serving stale DNS entries) rather than failing hard when a dependency is unavailable (→ [[distributed/dns]]).
- **Graceful degradation**: return a reduced response rather than an error when a downstream is impaired.

## Availability and Dependencies

A system's availability is bounded by its dependencies. If service A depends on service B, and B has 99.9% availability, A can be at most 99.9% available — even if A itself never fails. For a chain of N services each with 99.9% availability:

```
Effective availability = 0.999^N
```

With N = 10: 0.999^10 ≈ 99%. This is why minimising synchronous dependencies and applying patterns like circuit breakers and bulkheads is critical in microservices architectures.

## Redundancy

Redundancy — replicating functionality or state across multiple nodes — is the primary mechanism for eliminating single points of failure. When one node fails, the others absorb the load.

**Four prerequisites for redundancy to actually improve availability** (Marc Brooker):
1. The complexity added by introducing redundancy must not cost more availability than it adds (the redundancy mechanism itself can fail).
2. The system must reliably detect which redundant components are healthy and which are not (health checks).
3. The system must be able to run in degraded mode (fewer nodes, more load per node).
4. The system must be able to return to fully redundant mode (adding replacement nodes).

**Correlation is the critical constraint**: redundancy only improves availability when redundant components cannot fail for the same reason at the same time. If servers share a power feed, a rack, or a data centre, correlated failures eliminate the benefit of redundancy.

**Availability Zones (AZs)**: cloud providers replicate infrastructure across multiple independent data centres within a region, cross-connected with high-speed links. AZs are far enough apart to minimise correlated failure risk, but close enough that **synchronous replication protocols (Raft, chain replication) work without significant latency penalties**. Deploying stateless services across multiple AZs is the baseline for high availability.

**Multi-region**: to survive a full region failure, replicate across regions. Cross-region latency is high enough that **only asynchronous replication** is practical. Multi-region deployments are also driven by legal compliance requirements (data residency laws) more often than by failure probability. The effort is substantial — consider carefully whether the failure scenario justifies it.

## MTBF, MTTR, RPO, and RTO

Eoin Woods (→ [[sources/software-architecture-metrics]] ch. 7) provides a complementary measurement framework for availability:

**MTBF (Mean Time Between Failures)**: measures how often the system fails (reliability). Hard to measure accurately — only estimable after many real failures have occurred. Alternative: collect failure data from similar systems in the same organisation and use as a proxy. Can only be estimated via reliability models (which are not very useful for software failures) until you have production data.

**MTTR (Mean Time to Recover)**: measures how long recovery from a failure takes. Allspaw (2010): MTTR is more important than MTBF for most system types — a system that recovers quickly can tolerate more frequent failures than one that fails rarely but takes hours to restore. **Key advantage**: MTTR can be designed for, estimated, and tested during development — unlike MTBF, you can measure it before the first real failure.

**RPO (Recovery Point Objective)**: the maximum acceptable data loss, measured in time or transactions ("no more than 10 minutes of updates" or "no more than 100 transactions"). Trades off against MTTR — if you can accept all data loss (RPO = infinity), recovery can be nearly instantaneous.

**RTO (Recovery Time Objective)**: the maximum acceptable recovery duration. Differs from MTTR: a system may restore service with partial data (shorter MTTR), but the full dataset may take longer (longer RTO). RPO and RTO are usually inversely related — accepting higher data loss enables faster recovery.

> **Tyranny of the nines antipattern:** A single availability percentage is too simplistic — mode and timing of failure matter as much as frequency. "5 nines" (99.999% = 1 second/day) is so close to 100% as to be nearly meaningless as a design target. Instead, use failure scenarios to understand what business continuity actually requires, then set RPO and RTO targets per failure type and calculate the resulting availability.

## Planned vs Unplanned Downtime

Both count toward downtime:
- **Planned**: deployments, maintenance windows, schema migrations.
- **Unplanned**: crashes, network partitions, cascading failures.

**Continuous deployment** (deploy without downtime via rolling updates, blue/green, canary) is the primary technique for eliminating planned downtime. (→ [[concepts/deployment-pipelines]])

## SLAs, SLOs, SLIs

- **SLI (Service Level Indicator)**: the measured metric (e.g., request success rate).
- **SLO (Service Level Objective)**: the target (e.g., 99.9% of requests succeed).
- **SLA (Service Level Agreement)**: the contract with consequences for breach (e.g., credits if SLO is missed).

Availability is the most common SLI. SLOs should be set based on what users actually need, not what sounds impressive — a tighter SLO means more investment in redundancy and on-call response.

## Related Concepts

- [[distributed/replication]] — primary mechanism for eliminating SPOFs and achieving redundancy
- [[patterns/circuit-breaker]] — prevents cascading failures from degrading availability
- [[patterns/timeout]] — bounding wait time on every downstream call; prevents thread exhaustion under slow dependencies
- [[patterns/bulkhead]] — isolates failures to preserve availability in remaining partitions
- [[distributed/dns]] — DNS availability is a prerequisite for client-service connectivity; DNS SPOF
- [[concepts/deployment-pipelines]] — continuous deployment reduces planned downtime
- [[distributed/consistency-models]] — CAP theorem trades availability against consistency under partition
- [[distributed/cap-theorem]] — formal model of the availability/consistency trade-off
- [[distributed/rate-limiting]] — load shedding and rate limiting preserve availability under excess load

## Design for Production

Nygard (→ [[sources/release-it]] ch. 1) adds a perspective complementary to the technical treatment above: availability is not primarily a technical goal but a **financial and organisational** one.

**Availability decisions are financial decisions**: a 5-minute release window once a month for 5 years costs roughly $900,000 (300 minutes × $3,000/minute typical e-commerce loss). A $50,000 investment in a zero-downtime deployment pipeline returns 18× with no optimistic assumptions. Most engineers optimise development cost; the organisation's interests demand optimising operational cost over the system's lifespan.

**"Design for QA" vs "design for production"**: systems designed to pass QA are optimised for the test environment — a clean, controlled world of preconditions. Production is hostile: user behaviour is unpredictable, dependencies fail in partial or slow ways, configuration changes have delayed effects, and load spikes arrive without warning. Passing QA tells you almost nothing about how a system will behave after 12 months of production operation.

**The integration of availability concerns into design** (not just operations): the connection pool exhaustion in the airline case study (→ [[sources/release-it]] ch. 2) was an availability failure that could only be fixed at design time — by choosing a pool implementation that validates connections, adding timeouts, and using deep health checks. Operations could mitigate incidents; the design determined the blast radius and recovery complexity.

## Key Quotes

> "Three nines are typically considered acceptable by users, and anything above four is considered to be highly available." (→ [[sources/understanding-distributed-systems]] ch. 1)

> "Software delivers its value in production. The development project, testing, integration, and planning...everything before production is prelude." (→ [[sources/release-it]] ch. 1)

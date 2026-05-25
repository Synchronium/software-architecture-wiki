---
title: "Common Failure Causes"
type: concept
tags: [distributed-systems, reliability, resiliency, fault-tolerance, operations]
sources: [understanding-distributed-systems, release-it]
created: 2026-05-14
updated: 2026-05-19
---

# Common Failure Causes

A **fault** is a failure of an internal component or external dependency. A **failure** is when the system no longer provides a service meeting its specification. Some faults are tolerated with no user-visible impact; others lead to user-visible failures.

Understanding failure causes is a prerequisite for building fault-tolerant systems. The causes below are ordered roughly from the less surprising to the more counter-intuitive.

## Hardware Faults

HDDs, SSDs, memory modules, NICs, power supplies, CPUs can all fail. Hardware faults can also cause silent data corruption. Entire data centres can fail due to power cuts or natural disasters.

Counter-intuitively, hardware faults are not the dominant cause of failures in distributed applications. The more mundane causes below are responsible for the majority of incidents.

## Incorrect Error Handling

A 2014 study of user-reported failures across five popular distributed data stores found that **the majority of catastrophic failures resulted from incorrect handling of non-fatal errors**. Most of these bugs could have been caught with simple tests:

- Error handlers that silently ignored errors.
- Handlers that caught overly generic exceptions (e.g., `Exception` in Java) and aborted the entire process for no good reason.
- Partially implemented handlers containing `FIXME` or `TODO` comments.

Error handling is typically an afterthought — developers write it quickly, test it rarely, and review it less carefully than business logic. Treating error paths as first-class code, with dedicated tests, is one of the highest-leverage reliability investments.

## Configuration Changes

Configuration changes are one of the **leading root causes of catastrophic failures**. This includes both misconfigured values and valid configuration changes that enable rarely-used code paths which haven't been properly tested.

What makes configuration particularly dangerous: **delayed effects**. If an application reads a configuration value only when a specific code path executes, an invalid value may take effect hours or days after the change — long after the change has been forgotten, making root cause analysis difficult.

Configuration changes should be:
- **Version-controlled** (same history and rollback capability as code).
- **Tested** (validated against the running system, not just syntactically).
- **Released incrementally** (canary configurations, not fleet-wide instant changes).
- **Validated eagerly** — configuration should be read and validated at startup, not lazily at point of use.

## Single Points of Failure (SPOFs)

A **single point of failure** is any component whose failure takes the entire system down. Systems commonly have multiple SPOFs that haven't been identified.

**Humans are great SPOFs**: manual operational procedures that require a sequence of steps executed in the right order, without errors, are fragile. Automation eliminates human SPOFs.

Common infrastructure SPOFs:
- **DNS**: if clients can't resolve the domain, they can't connect. Domain names expire; root-level domains have gone down. (→ [[distributed/dns]])
- **TLS certificates**: if the certificate expires, secure connections fail. Automated certificate rotation (Let's Encrypt, ACM) eliminates this SPOF. (→ [[distributed/tls]])
- **Centralised databases or services**: a single database, message broker, or config service with no redundancy.

SPOFs should be identified at design time by examining each component and asking: "what happens if this fails?" Some can be eliminated by introducing redundancy; others can only have their blast radius reduced.

## Network Faults

Network calls can fail in many ways: packet loss, congestion, routing changes, NIC failures. The dangerous case is not hard failure (which is detected quickly) but **slow or partial failure**.

**Gray failures**: a failure so subtle it can't be detected quickly or accurately. A server that is alive but very slow is almost as useless as one that is down — but its presence in the load balancer pool continues to receive traffic that times out. Gray failures are the silent killers of distributed systems; they can bring a system to its knees while being extremely hard to diagnose.

Timeouts are the primary defence against gray failures, but timeout values are difficult to tune correctly (→ [[distributed/failure-detection]]). Setting them too tight creates false positives; too loose means accepting long periods of unavailability.

## Resource Leaks

A very slow process looks like a down process from the outside — neither can do useful work. Resource leaks are a common cause of progressive degradation.

**Memory leaks**: even garbage-collected languages leak — any reference to an unneeded object prevents collection. As memory depletes, the OS swaps pages to disk aggressively and the GC runs more frequently; CPU usage rises, response times increase, until memory exhaustion causes allocation failures.

**Thread pool exhaustion**: a thread making a synchronous blocking call without a timeout will never return to the pool. With a pool of fixed size, threads drain until none are left.

**Socket pool exhaustion**: HTTP clients typically reuse connections from a pool. A request made without a timeout holds a socket indefinitely. As the pool fills with stuck connections, new requests cannot be dispatched.

Third-party libraries your code depends on are subject to the same leaks — their resource consumption is not isolated from yours.

The watchdog pattern is a practical mitigation: a background thread monitors resource metrics (available memory, active thread count) and deliberately restarts the process when thresholds are breached, rather than waiting for a complete failure (→ [[distributed/load-balancing]]).

## Load Pressure

Every system has a capacity ceiling. Two types of load pressure:

- **Organic growth**: gradual increase that gives autoscaling time to respond. Manageable.
- **Sudden surges**: spikes from diurnal patterns, viral events, scrapers/bots, or DDoS attacks. Cannot always be absorbed by autoscaling alone — require **load shedding** (deliberately rejecting requests to protect the system from collapse).

## Cascading Failures

A cascading failure occurs when a fault in one component increases the failure probability in other components, causing the fault to spread virally.

**Example**: two database replicas behind a load balancer, each handling 50 req/s. Replica B fails. The load balancer removes it, forcing Replica A to absorb 100 req/s. A becomes overloaded; clients begin timing out and retrying, adding more load. Eventually A fails, leaving no replicas in the pool.

When B recovers and rejoins the pool, it receives all traffic, overloads, and fails again. The system enters a **metastable failure**: a self-reinforcing feedback loop that persists even after the original fault is gone.

Breaking a metastable failure typically requires a large corrective action — such as temporarily blocking all traffic to allow replicas to recover — rather than just fixing the original fault. These failures are very hard to mitigate once started; the best strategy is to prevent fault propagation in the first place via isolation patterns (→ [[patterns/circuit-breaker]], [[patterns/bulkhead]]).

## Risk Management

Not every potential fault requires mitigation. Prioritise by:

```
risk score = probability × impact
```

High probability + high impact: address immediately.
Low probability + low impact: accept and monitor.
High impact + low probability: invest in blast-radius reduction even if probability seems negligible.

This framing also determines the right mitigation strategy: reduce probability (preventive), reduce impact (palliative), or both.

## Building for Tests, Not for Production

Nygard's "Trampled" case study (→ [[sources/release-it]] ch. 15) identifies a systemic failure mode: teams optimise the system to pass QA, not to survive production.

**Symptoms**:
- Configuration files written for the test environment topology (hostnames, ports, DB passwords, firewall assumptions) that must be manually corrected for production — and often aren't.
- Testing with "polite" load scripts that follow valid navigation paths and obey cookies, missing the real-world noise: bots, scrapers, cookieless clients, 404-generating redirects, repeated URL hammering.
- No safety devices (circuit breakers, shed-load mechanisms, thread-pool timeouts) because tests don't trigger the failure modes they protect against.

**Consequences**: even after three months of intensive load testing, the system crashed within 30 minutes of launch because the real world sent noise the tests never modeled. "Add noise, create chaos" — load tests should include sessions from cookieless clients, invalid URL floods, and bot-like repetitive requests.

**Mitigation**:
- Separate configuration override structure from the codebase — each environment-varying property defined in exactly one place; production credentials not accessible in QA or source control.
- Noise testing as a first-class load test scenario alongside the happy path.
- Safety devices that cut off bad situations regardless of how the request arrived (→ [[patterns/circuit-breaker]], [[distributed/rate-limiting]]).

**"Nothing is as permanent as a temporary fix"**: emergency workarounds built under launch-day pressure often outlive their creators; some lasted a decade. The true cost of not building for production is a year of remediation rather than feature development, and lost revenue from every throttled user.

## Related Concepts

- [[operations/availability]] — redundancy, the primary mitigation for hardware faults and SPOFs
- [[distributed/failure-detection]] — timeouts and heartbeats: the tools for detecting gray failures
- [[distributed/dns]] — DNS as a common SPOF
- [[distributed/tls]] — certificate expiry as a SPOF
- [[patterns/circuit-breaker]] — prevents cascading failures by stopping traffic to failing services
- [[patterns/timeout]] — bounds how long a blocking call can hold a thread; missing timeouts are the root cause of most resource exhaustion incidents
- [[patterns/retry]] — safe retry strategy after transient failures; exponential backoff prevents retry storms
- [[patterns/bulkhead]] — resource isolation to limit blast radius
- [[distributed/load-balancing]] — health checks detect gray failures; watchdog pattern

## The Airline Cascade: A Real Resource-Exhaustion Incident

Nygard's case study (→ [[sources/release-it]] ch. 2) illustrates all of the above failure types interacting:

1. **Configuration / planned change**: a database failover invalidated all JDBC connections in the pool. The connections were never removed because the pool had no heartbeat check.
2. **Incorrect error handling in cleanup code**: `Statement.close()` throws `SQLException` after the failover (Oracle JDBC driver attempts network I/O to release server resources). The `finally` block's exception from `stmt.close()` short-circuited before `conn.close()`, leaking the connection back into the pool as permanently stuck.
3. **Resource pool exhaustion**: after 40 calls, all 40 slots in the connection pool were exhausted. Subsequent `getConnection()` calls blocked forever with no timeout.
4. **Cascade**: CF application servers hung → downstream kiosk servers and IVR servers (which called CF via EJB/RMI) exhausted their own thread pools waiting for CF responses that never came.
5. **Misleading health monitoring**: CF's HTTP status endpoint was served by a separate thread pool from the EJB pool. It continued to respond "healthy" throughout the entire outage. Only deep health checks — checks that exercise the real code path — would have detected the failure.

**The root fix required at multiple layers**: validate connections on checkout (or background heartbeat); add timeouts on `getConnection()`; handle exceptions in `finally` blocks correctly; use deep health checks; isolate CF's thread pool so its failure cannot exhaust kiosk/IVR thread pools.

## The Black Friday Cascade: Unbalanced Capacities in Production

Nygard's second case study (→ [[sources/release-it]] ch. 6) illustrates Unbalanced Capacities and resource pool exhaustion at a different scale:

1. **Self-Denial Attack**: marketing published a newspaper insert offering "free home delivery" on Black Friday — a traffic-pattern change the engineering team did not know about, which multiplied calls to the scheduling subsystem.
2. **Unbalanced Capacities**: 3,000 front-end threads calling 450 order management threads calling a scheduling server with capacity for ~25 concurrent requests (3 of 4 scheduling servers were offline for holiday maintenance).
3. **Resource pool exhaustion without timeout**: front-end connection pools to order management had `checkoutBlockTime` not configured — no timeout. All 3,000 threads blocked waiting for pool slots that never freed. Low CPU usage everywhere was the diagnostic signature.
4. **Alert fatigue**: the scheduling server's on-call team had been desensitized by chronic false-positive CPU alerts and did not respond to the real signal.
5. **The accidental Bulkhead**: the front-end had a separate connection pool just for scheduling (Conway's Law artifact). By dynamically setting that pool's max to zero and recycling the service via live admin scripts, scheduling was disabled without requiring a full server restart. Recovery took 90 seconds rather than the 6+ hours a full restart would have required.

**Key lesson**: operational tooling (custom monitoring scripts, admin API access) built before the incident was the survival factor. The team survived a novel failure because they had real-time visibility into thread state across 100 servers.

## Sources

- (→ [[sources/understanding-distributed-systems]] ch. 24) — failure taxonomy: hardware, error handling, configuration, SPOFs, network/gray failures, resource leaks, load pressure, cascading/metastable failures, risk matrix.
- (→ [[sources/release-it]] ch. 2) — airline case study: JDBC connection pool exhaustion after database failover cascades to enterprise-wide outage.
- (→ [[sources/release-it]] ch. 6) — Black Friday case study: Unbalanced Capacities, resource pool exhaustion without timeouts, alert fatigue, and the accidental Bulkhead that enabled recovery.
- (→ [[sources/release-it]] ch. 15) — "Trampled" case study: building for tests vs production; noise testing gap; sessions ≠ users; session-bloat failure mode; temporary fixes that last decades.

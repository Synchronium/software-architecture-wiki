---
title: "Testing for Reliability"
type: concept
tags: [testing, reliability, sre, ci-cd, canary, chaos-engineering, mttr, production-testing]
sources: [site-reliability-engineering]
created: 2026-05-27
updated: 2026-05-27
---

# Testing for Reliability

## Definition

Testing for reliability is the practice of using software tests to quantify confidence in a system's future behaviour. Confidence has two sources: historical monitoring data, and predictions derived from demonstrating equivalence across changes. Each test that passes both before and after a change reduces uncertainty about whether the change has degraded reliability. (→ [[sources/site-reliability-engineering]] ch. 17)

## Testing and MTTR

A test that blocks a failing push catches a bug with **zero MTTR** — the bug never reaches production. Monitoring that catches the same bug in production has non-zero MTTR (detection latency + mitigation latency). More zero-MTTR catches → higher MTBF experienced by users, which in turn encourages faster iteration (higher release velocity). The relationship is self-reinforcing: better test coverage → fewer production incidents → more confidence to release faster → more opportunities to add coverage.

## Traditional Test Hierarchy

```
Unit tests          → milliseconds; cheapest; test a single function/class in isolation
Integration tests   → seconds to minutes; test assembled components; dependency injection for mocks
System tests        → minutes to hours; test end-to-end assembled system
  └── Smoke tests       → critical-path sanity; short-circuit expensive testing if basics fail
  └── Performance tests → detect O(n) resource growth over the lifecycle of a component
  └── Regression tests  → prevent known bugs from re-entering the codebase
```

Cost increases dramatically up the stack. Test cost (time and compute) must be managed deliberately — test coverage is not just a correctness investment but also a developer-productivity investment.

## Production Tests

Production tests operate against a live system rather than a hermetic environment. They complement traditional tests by covering what cannot be verified offline.

### Configuration Tests

Verify that a binary's live configuration matches its checked-in source file. Configuration tests are inherently non-hermetic — they reach into production state. They are particularly valuable as distributed monitoring: the pattern of pass/fail across a fleet identifies rollout paths that produce invalid configuration combinations before those paths affect users.

A configuration test is versioned alongside its config file. Comparing which test version is passing against the target version indicates how far production currently lags behind the latest engineering work.

### Stress Tests

Identify the limits of a component before it catastrophically fails. Most components degrade non-gracefully at some threshold rather than gracefully degrading. Knowing the threshold enables capacity planning and SLO-setting with real data rather than estimates.

### Canary Tests

The canary is **not technically a test** — the SRE book explicitly notes it is "conspicuously absent from the list of production tests." A canary is structured user acceptance: a subset of servers receives the new version and is left in an incubation period ("baking the binary") before the rollout proceeds.

Unlike deterministic tests, canaries expose code to unpredictable live traffic. They detect fault orders:

| Order | Meaning |
|-------|---------|
| U=1 | Fault scales linearly with traffic — user's request hit broken code |
| U=2 | Fault randomly damages data that a future user's request will see |
| U=3 | The damaged data is also a valid identifier to a previous request |

Most bugs are U=1 and can be caught by converting anomalous request logs into regression tests. Higher-order bugs require order-of-magnitude more exposure to detect and cannot be caught by simply replaying the same requests.

**Exponential rollout rule of thumb**: start at 0.1% of traffic; scale by an order of magnitude every 24 hours while varying geographic location (day 2: 1%, day 3: 10%, day 4: 100%).

## Production Probes

Monitoring probes that replay known-good and known-bad requests against live production. These differ from release tests because they use the real frontend and backend — not fake or hermetic equivalents.

All four combinations of old/new probe against old/new application are continuously generated during rollouts. A probe failure indicates an API incompatibility between production and release environments. The production updater can detect probe failures and halt or roll back the rollout before user traffic is routed to the broken version.

## Zero MTTR and the Testing-Reliability Loop

```
Better test coverage
  → more bugs caught pre-production (zero MTTR)
  → higher MTBF observed by users
  → greater confidence to release more frequently
  → more versions pass through CI, each well-understood
  → bugs mapped unambiguously to their introducing commit
  → more opportunities to catch regressions
```

The feedback loop is bidirectional: if release cadence is increased without improving test coverage, MTBF drops and users see more failures, which creates pressure to slow releases.

## Configuration Files as a Reliability Risk

Configuration files present a distinct reliability challenge because they change frequently but are often not tested with the same rigour as code.

**Two categories**:
1. **MTTR-purpose configs** — changed only during incidents; release cadence slower than MTBF. A moderate level of uncertainty is tolerable because changes are rare.
2. **Frequently-changed configs** (e.g., release state, feature flags) — must be treated as application releases with equivalent testing discipline. If not, they dominate site reliability negatively.

**Break-glass mechanism**: an emergency override that allows pushing a config before testing completes. Should be auditable, noisy (file a bug automatically), and should run tests asynchronously, back-annotating the push with any failures so the next action can be better informed.

**Config syntax and schema**: configuration written as an interpreted language (Python) has no upper bound on loading time and can execute arbitrary code. Protocol buffers define schema statically and are checked at load time with bounded runtime — the preferred approach for safety-critical config.

## Testing SRE Tools

Automation tools that operate outside the mainstream API have a subtly different risk profile from ordinary software. They can alter system state in ways that are invisible to the regular API. Two properties distinguish SRE tools:

- **SRE operational tools**: side effects remain within the mainstream API; isolated from user-facing production by release barriers
- **Automation tools**: the actual operation targets a robust, predictable API; the purpose is a side effect invisible to other API clients

**Barrier defence pattern** for risky software: (1) use a separate tool to place a barrier that causes the replica to fail its health check; (2) configure risky software to only operate on unhealthy replicas; (3) use the black-box health monitor to remove the barrier and return the replica to service. This prevents maintenance software from accidentally operating on user-facing replicas.

## Statistical Testing

Techniques such as Chaos Monkey, Jepsen, and fuzzing are not repeatable — rerunning with a new seed doesn't prove the original bug is fixed. Useful practices:

- Log the random number seed (or full action sequence) immediately on failure
- Replay the sequence several times before starting the bug report to characterise the fault's reproducibility
- Multiple replay runs may reveal more severe manifestations of the same fault, warranting a severity escalation

These techniques are especially useful for finding **higher-order bugs** (U≥2) that cannot be caught by deterministic replay.

## Testing Culture

Building a testing culture requires structural reinforcement:

- **Document all bugs as test cases**: every bug is converted into a failing test first, then fixed. This builds regression coverage organically.
- **Continuous build system**: every commit triggers a build and test run; engineers are notified immediately when a change breaks something.
- **Broken build = highest priority**: engineers must treat a broken build as the most urgent issue and drop all other work. Reasons: (1) the bug is harder to fix the more commits accumulate; (2) the team works around the breakage at increasing cost; (3) release cadences lose their value; (4) emergency release capability is impaired.
- **Explicit coverage goals**: treat test coverage as an engineering project with stated targets and deadlines, not a philosophical stance.

## Related Concepts

- [[operations/chaos-engineering]] — Chaos Monkey and Jepsen are statistical testing tools for distributed system reliability
- [[operations/monitoring]] — black-box monitoring and production probes serve complementary roles to testing
- [[operations/automation]] — automation tools have a distinct testing risk profile (barrier defence pattern)
- [[concepts/deployment-pipelines]] — hermetic builds, canary deployments, and CI/CD are the structural context for reliability testing
- [[operations/incident-management]] — zero-MTTR testing minimises the incidents that trigger incident management

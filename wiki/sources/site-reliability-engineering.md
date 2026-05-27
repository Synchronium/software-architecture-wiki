---
title: "Site Reliability Engineering"
type: source
tags: [reliability, operations, sre, monitoring, slos, availability, on-call, postmortems]
sources: [site-reliability-engineering]
created: 2026-05-27
updated: 2026-05-27
---

# Site Reliability Engineering

**Editors:** [[authors/betsy-beyer]], [[authors/chris-jones]], [[authors/jennifer-petoff]], [[authors/niall-richard-murphy]]
**Published:** 2016
**Slug:** `site-reliability-engineering`

## Overview

Site Reliability Engineering documents how Google designs, operates, and improves its production systems at internet scale. Edited by four senior Google SREs and comprising essays from across the organisation, it defines SRE as a distinct engineering discipline: the application of software engineering practices to operations problems. The book covers everything from foundational philosophy (error budgets, SLOs) to concrete practices (on-call, incident management, postmortems) to management (how to build and evolve an SRE team).

Its central argument is that the traditional dev/ops split creates a structural conflict of incentives that reliability-as-code and error budgets resolve. Rather than treating reliability as an ops concern and features as a dev concern, SRE gives both teams a shared currency — the error budget — that aligns their incentives.

As a collection of essays, the book varies in style and specificity. The chapters on principles (Parts I–II) are widely applicable; many of the later chapters (Parts III–IV) are deeply Google-specific and should be read for insight rather than direct emulation.

## Key Claims

- SRE is "what happens when you ask a software engineer to design an operations team" — Ben Treynor Sloss (→ ch. 1)
- 100% is the wrong reliability target for almost everything: users cannot distinguish 100% from 99.999%, and marginal gains beyond that threshold cost disproportionately more (→ ch. 3)
- The error budget — one minus the availability target — is the mechanism that resolves the structural conflict between development velocity and operational stability (→ ch. 1, 3)
- SLOs must be set by asking what users actually need, not by what sounds impressive or what the system currently achieves (→ ch. 4)
- Toil — repetitive, automatable operational work with no enduring value — should be capped at 50% of SRE time; exceeding it degrades both quality and morale (→ ch. 5)
- Roughly 70% of outages are caused by changes in a live system (→ ch. 1)
- Monitoring should never require a human to interpret whether action is needed — only actionable alerts should page (→ ch. 1, 6)
- A playbook-armed on-call engineer achieves roughly 3× better MTTR than one "winging it" (→ ch. 1)
- Postmortems must be blameless: the goal is to expose systemic faults and fix them, not to assign personal responsibility (→ ch. 15)

## Chapter Notes

### Chapter 1 — Introduction

Benjamin Treynor Sloss defines SRE as the discipline that results when software engineers run operations. Key ideas: the dev/ops conflict arises from incompatible incentive structures; error budgets resolve it by giving both teams a shared variable to optimise. Monitoring taxonomy: alerts (immediate action required), tickets (action needed but not immediately), logging (no action, forensic only). Introduces the 50% ops cap, postmortem culture, capacity planning, and the MTTF/MTTR framing of reliability.

### Chapter 2 — The Production Environment at Google

Describes Google's production infrastructure. Primarily Google-specific; most useful as context for later chapters. Key transferable concepts: Borg (cluster operating system, direct ancestor of Kubernetes) abstracts machines from tasks and allocates resources with failure-domain awareness — tasks are reached via BNS (Borg Naming Service) rather than direct IP:port. The N+2 capacity planning heuristic (two spare tasks beyond peak-QPS requirement) accounts for rolling updates (−1) and coincident machine failure (−1). GSLB provides load balancing at three levels: DNS, service, and RPC. Chubby is the distributed lock service used for leader election and consistent key-value storage; it uses Paxos for consensus. Protocol buffers (protobufs) are Google's serialisation format — 3–10× smaller and 20–100× faster than XML; gRPC (open-source Stubby) carries all inter-service communication.

### Chapter 3 — Embracing Risk

Central SRE philosophy chapter. Reliability is a continuum, not a binary property. An incremental improvement in reliability may cost 100× more than the previous increment (non-linear cost curve), so every service needs an explicitly scoped target that is both a minimum and a maximum — exceeding it wastes the opportunity to ship features, pay down technical debt, or reduce costs.

**Risk measurement**: Google prefers request-success-rate availability (`successful requests / total requests`) over time-based uptime for globally distributed services, because partial availability (serving some traffic somewhere) means time-based uptime is almost always 100%.

**Risk tolerance assessment**: Consumer services (Search, Gmail) have clear product owners who can articulate business goals; infrastructure services (Bigtable, frontend proxies) have multiple clients with divergent needs and require segmented service tiers (e.g., Bigtable low-latency vs throughput clusters, provisioned differently to avoid charging all clients for the highest tier).

**Cost/benefit example**: Improving from 99.9% → 99.99% on a $1M revenue service adds ~$900 of value (0.09% × $1M). If the engineering cost exceeds $900, the investment is not justified.

**ISP noise floor**: The typical background error rate measured across ISPs is 0.01%–1%. Driving a service's error rate below that floor provides no user-visible benefit — failures disappear into the noise of the user's own connection.

**Error budget formation**: Product Management defines the quarterly SLO; the monitoring system is the neutral arbiter of actual uptime; the difference between target and actual is the budget available to spend on risk-taking.

### Chapter 4 — Service Level Objectives

Disentangles SLI (measured metric), SLO (target), and SLA (contract with consequences). Key insight: most people mean SLO when they say "SLA violation" — a real SLA violation might trigger legal consequences.

SLI selection by service category: user-facing services → availability, latency, throughput; storage → latency, availability, durability; big data pipelines → throughput, end-to-end latency; all systems → correctness. Collect where it best represents user experience: client-side latency is more meaningful than server-side, but more expensive to instrument.

Percentiles over averages: distributions are right-skewed; averages obscure tail behaviour. P99/P99.9 represent realistic worst-case; even P50 matters because high-variance services are preferred less by users than slightly slower but consistent ones.

SLO-setting principles: don't anchor to current performance (locks you into it); as few SLOs as possible (defend each one by quoting it in priority conversations); don't set absolutes; leave room to tighten over time.

**The Chubby planned outage**: Chubby (Google's lock service) became so reliable that teams began assuming it would never fail. When it did, those teams had no fallback. SRE's response: synthesize planned outages if Chubby has not naturally fallen below its SLO in a given quarter, to flush out over-dependencies. This is the canonical example of "don't overachieve" — users build on actual performance, not stated SLO.

Internal vs external SLO: maintain a tighter internal SLO than the published SLA to create a safety buffer for responding to chronic problems before external breach.

### Chapter 5 — Eliminating Toil

Precise definition of toil: work tied to running a production service that is manual, repetitive, automatable, tactical, devoid of enduring value, and scales O(n) with service growth. Toil is not overhead (meetings, goal-setting, HR) and not all grungy work (a one-time cleanup that produces permanent improvement is engineering, not toil).

The 50% toil cap: SREs spend at most 50% of time on toil; the rest must be engineering work (software or systems engineering that produces a permanent improvement). In practice Google's average is ~33% toil.

On-call creates a structural toil floor: a 6-person rotation commits 2/6 weeks to on-call = 33% minimum; an 8-person rotation = 25%. This limits how low toil can actually go.

Toil becomes toxic at high volumes: career stagnation, low morale, sets precedent for devs to offload more work, causes attrition of the best engineers, breaches the promise made to SRE hires.

### Chapter 6 — Monitoring Distributed Systems

Canonical chapter on SRE monitoring philosophy. Core framework: monitor for **symptoms** (what's broken), not causes (why). Causes are for debugging after a page fires. Paging on causes produces noise; paging on symptoms keeps alerts actionable.

**Four Golden Signals**: latency, traffic, errors, saturation — the four metrics that, if measured and alerted on, provide decent monitoring coverage of any user-facing system.

**Alert quality criteria**: every page must be (1) actionable, (2) require human intelligence (not rote response), (3) be about an urgent condition the system cannot self-resolve, (4) be novel or non-trivially automatable. Pages with rote responses should be automated or resolved at the root cause.

Two case studies: Bigtable over-alerting (too many low-quality alerts → SRE temporarily reduced SLO target to create breathing room; then fixed root causes); Gmail scripted response (alerts with scripted handling → debate over automation vs permanent fix; conclusion: automate, but track the underlying problem).

**Long-term perspective**: every page today delays improvement of the system for tomorrow. A controlled short-term decrease in availability to fix root causes is preferable to perpetual high-toil fire-fighting.

### Chapter 7 — The Evolution of Automation at Google

**Automation hierarchy** (5 levels from manual to autonomous):
1. No automation — operator manually performs the procedure
2. Externally maintained system-specific automation — an SRE has a script in their home directory
3. Externally maintained generic automation — the script is generalised and shared
4. Internally maintained system-specific automation — the system ships with its own automation
5. Autonomous systems — the system detects and resolves its own problems without human intervention

**Autonomous > automated**: the ideal is not automation (a human triggers a script) but autonomy (the system handles problems itself). External automation suffers from bit rot — it drifts away from the system it manages because it's maintained separately and rarely tested.

**Key benefits**: consistency (humans are not repeatable), platform extensibility, faster MTTR, faster action than humans in time-critical scenarios, time savings that scale across everyone who runs the automation.

**Failure at scale (Diskerase)**: automation that amplifies manual procedures can amplify mistakes catastrophically. Rate limiting and idempotency are essential safety properties of automation operating at scale.

**Organisational incentives**: teams that don't own their automation have no incentive to build systems that are easy to automate. The most functional tools are written by those who use them — the same argument that motivates developer ownership of production.

**MySQL on Borg**: automating failover (Decider) reduced toil by 95%, cut hardware usage by 60%, and made it possible to meet error budgets that required sub-30-second failover — impossible for a human-dependent process.

### Chapter 8 — Release Engineering

Release engineering as a distinct discipline: building and delivering software repeatably. Core philosophy: four principles.

**Self-service model**: release processes are owned by product teams, not a central release team. Individual teams decide when and how often to release.

**Hermetic builds**: builds must be deterministic and environment-independent. Two engineers building the same revision on different machines must get identical outputs. Builds depend on known versions of compilers and libraries (not whatever is installed), are self-contained (no external network calls during build), and can be reproduced later at the same revision. Cherry-picking is possible precisely because the build environment is fully specified.

**High velocity**: frequent small releases rather than infrequent large ones. "Push on Green" — auto-deploy every build that passes tests — is the extreme of this. Hourly builds + human selection of which to promote is a common middle ground.

**Risk-profiled deployment cadence**: the rollout process should fit the risk profile of the service. Dev/pre-prod → hourly auto-deploy. Large user-facing service → exponential expansion across clusters. Sensitive infrastructure → days-long rollout interleaved across regions.

**Configuration management approaches** (four models): (1) config in mainline (simple but creates skew between checked-in and running); (2) config bundled with binary (tightly coupled, simplest to deploy); (3) config as separate package (retains ability to update config without rebuilding binary); (4) config in external store (Chubby/Bigtable for dynamic, runtime-changing config). All require code review.

**Start release engineering at the beginning**: it is cheaper to design release processes early than to retrofit them into a mature system.

### Chapter 9 — Simplicity

Simplicity is a reliability prerequisite. Complex systems fail in complex ways; simple systems fail in understandable ways.

**Essential vs accidental complexity** (Fred Brooks): essential complexity is inherent in the problem (cannot be removed); accidental complexity is introduced by the implementation choices (can be resolved with engineering effort). SRE teams should push back on and actively eliminate accidental complexity.

**Every line of code is a liability**: each new line creates potential for defects. The "negative lines of code" metric captures value in deletion. Software bloat degrades understandability, testability, and reliability.

**Dead code is dangerous**: commented-out code, feature-gated disabled code, and unused code paths are time bombs. Knight Capital's 2012 $440M loss was caused by a disabled-but-not-deleted code path that was inadvertently re-enabled. Delete unused code; source control preserves history.

**Minimal APIs**: fewer methods and arguments = easier to understand, more effort concentrated on quality. Small, simple APIs are a hallmark of a well-understood problem.

**Modularity and loose coupling**: the ability to change parts of a system in isolation is essential for maintainability. API versioning allows independent evolution of producer and consumer. Well-scoped components with clear responsibility are preferable to "util" binaries.

**Release simplicity**: small batches are easier to understand and debug than large batches. Releasing 100 unrelated changes simultaneously makes it hard to attribute performance changes to specific commits.

### Chapter 10 — Practical Alerting from Time-Series Data

Describes Borgmon, Google's internal monitoring system — the direct ancestor of Prometheus (open source; same principles and a similar rule language). Key architectural ideas:

**Pull-based scraping**: every monitored binary exposes a `/varz` HTTP endpoint listing metrics in plain text. Borgmon polls all targets at regular intervals; the standardised format enables mass collection with low overhead.

**Labels as dimensions**: time-series are identified by sets of key=value labels (variable name, job, instance, zone). Removing labels from a query returns all matching series; this enables aggregation without pre-defining every rollup dimension.

**Counters vs gauges**: counters only increase (rate computation across missed collections is safe); gauges can take any value (prone to missed events between collections). Prefer counters.

**Aggregation hierarchy**: per-task scraper Borgmon → per-datacenter Borgmon → global Borgmon. Each level aggregates and discards detail; only relevant aggregated series are streamed upward.

**Config as code**: Borgmon rules are defined in files, templated for reuse, and tested with synthetic time-series data. A CI system validates and ships configuration to all Borgmon in production.

**Alert flap prevention**: an alerting rule must be true for a minimum duration (at least two evaluation cycles) before the alert fires, to prevent transient collection failures from triggering pages.

**Black-box complement (Prober)**: white-box monitoring observes internals; Prober validates user-visible behaviour from outside. Necessary for detecting DNS failures, connectivity issues, and problems that never reach the server.

### Chapter 11 — Being On-Call

Detailed on-call management practices. Key constraints:

**25% on-call rule**: of the non-engineering time (≤50% of total time), at most 25% may be spent on-call. The remainder (25%) is for other non-project operational work.

**Minimum team sizes**: a single-site team needs ≥8 engineers to sustain 24/7 on-call with primary and secondary coverage while honouring the 25% rule. Multi-site "follow the sun" (avoids night shifts) needs ≥6 engineers per site.

**Operational underload**: rarely on-call → loss of production intuition and knowledge gaps discovered only during incidents. Engineers should be on-call at least once or twice per quarter. "Wheel of Misfortune" exercises compensate for quiet rotations.

**Max incidents per shift**: ~2 per 12-hour shift (each incident = 6 hours of work: root-cause analysis, remediation, postmortem). If any component generates median > 0 paging incidents/day, the component is unsustainable.

**Psychology of incident handling**: stress hormones (cortisol) impair deliberate cognitive functions and promote habitual/intuitive responses. Reducing on-call stress (clear escalation paths, good runbooks, blameless culture) enables the deliberate, rational approach that complex incidents require.

**"Give back the pager"**: if a developer team's service generates unsustainable operational load, SRE can return on-call responsibility to the developer team until the service meets SRE standards. This is not a penalty but a natural consequence of the reliability contract.

**Response time vs SLO**: for four nines of availability (13 minutes allowed downtime/quarter), on-call response must be in single-digit minutes. For relaxed SLOs, tens of minutes.

### Chapter 12 — Effective Troubleshooting

Formal model: troubleshooting as the hypothetico-deductive method — observe, hypothesise, test, eliminate, conclude. Steps: Triage → Examine → Diagnose → Test and Treat → Cure.

**Triage before investigating**: first priority is to keep the system working ("fly the airplane"). Mitigate by diverting traffic, dropping load, or disabling subsystems before hunting the root cause. Stopping the bleeding takes precedence over understanding what went wrong.

**Common pitfalls**: latching on to past causes (confirmation bias); spurious correlations (packet loss and disk failure both caused by a power outage — neither caused the other); improbable theories when simpler ones exist (horses, not zebras).

**"What touched it last"**: recent configuration changes or deployments are a productive starting point. Systems have inertia; failures usually follow a perturbation.

**Divide and conquer / bisection**: for multilayer systems, examine components systematically from one end; or bisect and narrow down the failing component.

**Negative results are magic**: document what you ruled out. Negative results are conclusive, prevent others from repeating the same investigation, and contribute to a data-driven culture.

**Active tests have side effects**: turning on verbose logging may worsen the latency problem you're investigating; changing resource allocation may mask race conditions. Document every change during debugging.

**Make troubleshooting easier by design**: observability (metrics + structured logs) built into each component; well-defined interfaces; request tracing (correlation IDs / trace IDs) across components.

### Chapter 13 — Emergency Response

Three case studies (test-induced, change-induced, process-induced) illustrating recurring emergency response patterns:

- Don't panic; pull in more people immediately if needed
- Mitigate first (divert traffic, restore access) — don't investigate while the system is down
- Rollback the triggering change as soon as it's suspected — the person who made the change has the most context; involve them immediately
- Keep communication flowing via out-of-band channels (backup systems) — your own tools may be affected by the incident
- Alert storm during large incidents overwhelms on-call; silence duplicate alerts to focus responders
- Test rollback procedures before they are needed; untested rollback adds time to outages
- Canary rigorously even for "low-risk" changes — the combination of a change with an unlikely configuration keyword triggered the crash-loop outage

**All problems have solutions**: even catastrophic failures (wiping all CDN machines) can be recovered from. The ceiling on impact is bounded by good capacity planning and traffic diversion.

### Chapter 14 — Managing Incidents

ICS-based (Incident Command System) incident management. Key insight: clear role separation gives individuals more autonomy — they don't need to second-guess colleagues because responsibilities are well-defined.

**Roles**: Incident Commander (high-level state, assigns work, removes blockers), Ops Lead (the only group modifying the system during an incident), Communications Lead (stakeholder updates, live incident document), Planning Lead (longer-term issues: bugs, handoffs, dinner).

**Only the Ops team modifies the system during an incident.** "Freelancing" — engineers making changes without coordination — is a primary cause of incidents spiralling out of control.

**Live incident document**: the commander's most important tool. Should be editable concurrently. Most important information at the top. Retained for postmortem and meta-analysis.

**Handoff protocol**: explicit verbal confirmation ("you're now the incident commander, okay?") and acknowledgment. Never leave a handoff ambiguous.

**When to declare an incident**: (1) need a second team; (2) issue is customer-visible; (3) unresolved after one hour of concentrated analysis. Declare early — spin-up cost of the framework is low; the cost of not declaring when you should have is high.

**Best practices**: Prioritize (stop the bleeding) → Prepare (procedures in advance) → Trust (full autonomy in role) → Introspect (if feeling panicked, get support) → Consider alternatives → Practice routinely → Rotate roles.

### Chapter 15 — Postmortem Culture: Learning from Failure

A postmortem is a written record of an incident, its impact, the actions taken, the root cause(s), and follow-up actions to prevent recurrence.

**Blameless postmortems**: the postmortem assumes everyone had good intentions and the best information available. Blame-based cultures suppress reporting of issues, reducing learning and leaving root causes unaddressed. Originated in healthcare and aviation.

**Blameless ≠ accountability-free**: the postmortem calls out where and how services can be improved; the individual is not indicted, but the systemic failure is.

**Postmortem triggers**: user-visible downtime beyond threshold; any data loss; on-call intervention (rollback, rerouting); resolution time above threshold; monitoring failure (implies manual detection).

**Review process**: draft internally → senior engineer review (completeness, root-cause depth, action plan appropriateness, stakeholder notification) → broad sharing with widest audience that benefits.

**Culture building**: postmortem of the month (newsletter); reading clubs; "Wheel of Misfortune" (reenact past incidents with new engineers); public recognition for good incident handling.

**"No postmortem left unreviewed"**: an unreviewed postmortem might as well not exist.

### Chapter 20 — Load Balancing in the Datacenter

In-datacenter load balancing: how client tasks route requests to backend tasks.

**The cost of poor distribution**: if the most-loaded task hits its capacity limit, no more traffic can be sent to the datacenter — even though every other task may have spare capacity. A 2× spread from least to most loaded effectively wastes 50% of reserved capacity.

**Lame duck state**: a backend that is shutting down should not just stop accepting connections — it should enter lame duck state, signalling all clients (including inactive UDP health-check clients) to stop sending new requests while completing in-flight ones. Steps: SIGTERM → lame duck signal → drain active requests → exit/kill. Also used for warm-up: new tasks stay in lame duck state until JIT optimisation is complete, then signal ready.

**Subsetting**: instead of connecting to all backends, each client maintains connections to a subset (typically 20–100 backends). This bounds memory and CPU costs for connection maintenance. Problem: random subsetting creates severe load imbalances at small subset sizes (50%–150% spread at 10% size). Solution: **deterministic subsetting** — divide clients into rounds, with each backend assigned to exactly one client per round; different rounds use different shuffles. Result: almost perfectly uniform connection distribution.

**Load balancing policies**:
- **Round Robin**: simple; but creates up to 2× CPU spread due to varying query costs, machine diversity, task restarts, and antagonistic neighbours (±20% performance from shared cache/network contention)
- **Least-Loaded Round Robin**: route to the backend with fewest active requests; degrades to similar spread as Round Robin at scale. Danger: a fast-failing unhealthy backend appears "lightly loaded" — must count recent errors as active requests to prevent it sinkholing traffic
- **Weighted Round Robin**: backends include current QPS, error rate, and CPU utilisation in health check/response headers; clients adjust capability scores over time; requests routed proportionally. Works well; eliminates most spread

### Chapter 21 — Handling Overload

**QPS is a bad capacity metric**: query cost can vary 1000× for the same endpoint; as software changes, the QPS-to-resource ratio changes unpredictably. Better metric: CPU directly. Memory pressure translates into CPU consumption in GC platforms; other resources can be over-provisioned to keep CPU as the binding constraint.

**Per-customer quotas**: backends define per-customer CPU budgets (in CPU seconds/second). Quotas may sum to more than total allocated capacity, relying on the low probability of all customers hitting limits simultaneously. Global quota state is aggregated in real time and pushed to individual backend tasks.

**Client-side adaptive throttling**: when a backend starts rejecting requests, the rejections consume resources too. Client-side throttling prevents the backend from drowning in rejected work. Each client tracks `requests` (attempts) and `accepts` (accepted by backend) over the last two minutes. It begins self-throttling with probability:

```
max(0, (requests - K×accepts) / (requests + 1))
```

where K=2 by default. Rejected requests (locally) still increment `requests`, which increases throttling probability over time. Entirely client-local; no additional coordination overhead.

**Request criticality** (four levels): CRITICAL_PLUS (most critical, will result in serious user-visible impact) → CRITICAL (default for production jobs) → SHEDDABLE_PLUS (partial unavailability acceptable; default for batch) → SHEDDABLE (frequent unavailability acceptable). Propagates automatically through the RPC chain. Overloaded backends reject lower criticalities first. Criticality is orthogonal to latency requirements.

**Retry strategy under overload**:
- Retry only at the layer immediately above the failing layer (prevents combinatorial retry explosion in deep stacks)
- Per-request retry budget: max 3 attempts
- Per-client retry budget: retries must remain below 10% of total attempts (caps total request amplification at ~1.1× rather than ~3×)
- Backends include retry-count histograms; if many retries seen (indicating datacenter-wide overload), return "overloaded; don't retry" error

**Connection load**: connections themselves cost CPU/memory. Idle connections should switch from TCP to UDP health checking. Burst connection events (large batch job starting with many new workers) can overload backends via connection negotiation overhead — solution: proxy layer between batch clients and production backends.

### Chapter 18 — Software Engineering in SRE

SREs are uniquely positioned to develop internal production tooling: they have firsthand production experience, they understand the use cases deeply, and they serve as both creator and customer. Critically, SRE developers must remain embedded in production (on-call, design reviews) even during development work — losing that connection produces tools that don't fit the real problem.

**Intent-based capacity planning** (the Auxon case study): traditional capacity planning encodes concrete resource requests ("50 cores in clusters X, Y, Z"). This is brittle — any change (delayed delivery, increased demand) cascades through all subsequent quarters. The intent-based approach instead encodes *why* a service needs resources:

| Level | What is expressed |
|-------|-------------------|
| 1 | "I want 50 cores in clusters X, Y, Z" |
| 2 | "I want 50 cores in any 3 clusters in region YYY" |
| 3 | "I want N+2 redundancy per continent" |
| 4 | "I want 5 nines of reliability" |

Level 3 is the practical sweet spot: enough degrees of freedom for optimisation, and the tradeoffs are expressed in understandable terms. Level 4 is aspirational. The system (Auxon) solves the bin packing as a linear program, re-running automatically when inputs change.

**Three precursors to intent**: (1) dependencies (service A requires service B within 30ms network latency); (2) performance metrics (for every N requests to A, how many cores does B need?); (3) prioritisation (when resources are scarce, which requirement is sacrificed?).

**Approximation and launch-and-iterate**: when the problem space is uncertain, build a simplified solver first (the "Stupid Solver"). Abstract the solver behind a stable interface so it can be replaced later. Fuzzy requirements are an incentive to design for generality and modularity rather than a reason to wait.

**Product development practices for internal tools**: target customers with the most pain and no existing solution; build a long-term roadmap alongside short-term wins; provide documentation and early-adopter support ("white glove"); quantify savings with case studies; don't over-customise for early users ("agnosticism" — come as you are, we'll work with what you've got).

**Team structure**: seed team of generalists + specialists; dedicated project time aggressively defended from interrupts; SREs must not become full-time developers.

### Chapter 19 — Load Balancing at the Frontend

Multi-level load balancing for internet-scale systems. The chapter focuses on the layers between users and datacenters.

**Why not one big machine**: speed of light constrains fiber optic latency; a single machine is a single point of failure; network bandwidth is bounded.

**Multi-level approach**: DNS load balancing (geographic steering) → VIP + network load balancer (datacenter entry) → datacenter internal (next chapter). Different traffic types need different routing: latency-sensitive requests go to the nearest datacenter; throughput-sensitive requests (video upload) may go to an underutilized link.

**DNS load balancing**:
- Simple form: return multiple A records; client picks one randomly
- Better: anycast for authoritative nameservers + EDNS0 client subnet extension (client's subnet sent with recursive query so authoritative server can return geographically optimal reply)
- Hard constraints: (1) recursive resolvers hide the client IP — you're optimising for the resolver's location, not the user's; (2) TTL caching sets a lower bound on propagation speed; (3) DNS replies must fit in 512 bytes (RFC 1035) — limits the number of IPs that can be returned
- Google's approach: maintain a map of all known resolvers → estimated user base size and geographic distribution → route each resolver to the best datacenter

**VIP (Virtual IP) load balancing**:
- VIP is not assigned to a specific network interface; it is shared across many devices. Users see one IP; implementation details are hidden.
- Backend selection: `id(packet) mod N` breaks when N changes (backend added or removed) — almost all connections remap. Consistent hashing solves this: minimises disruption to existing connections when the pool changes.
- **Direct Server Response (DSR)**: backend sends reply directly to the client rather than routing response back through the load balancer. Big savings when responses are large and requests are small (HTTP traffic). Requires no state on the load balancer.
- **GRE encapsulation**: Google's VIP implementation wraps forwarded packets in GRE over IP so load balancer and backends don't need to be in the same broadcast domain (Google outgrew the layer-2 DSR constraint). Overhead: 24 bytes per packet (IPv4+GRE), which can cause fragmentation or require a larger internal MTU.

### Chapter 16 — Tracking Outages

Outage tracking as systematic, long-term learning beyond individual postmortems. Postmortems cover high-impact incidents; outage tracking captures the high-frequency, low-impact issues that individually don't warrant a postmortem but collectively reveal systemic problems.

**Escalator**: Google's central alert notification tracker — monitors whether a human has acknowledged each alert within a configured interval and escalates to the next contact if not.

**Outalator**: layered atop Escalator. Three capabilities: (1) *aggregation* — multiple alerts from a single event are grouped into one incident entity, separating "alerts per day" from "incidents per day"; (2) *tagging* — free-form hierarchical tags (e.g., "cause:network:switch") applied by the team at any granularity; tags drive both human annotation and automated analysis; (3) *analysis* — from basic counts → comparison across teams/services over time → semantic root-cause analysis (e.g., identifying that 40% of incidents share the same infrastructure component).

**Cross-team visibility**: seeing that another team has NOT been alerted for what appears to be their component's fault is as useful as seeing that they have been. Early cross-team coordination accelerates diagnosis.

**Dummy escalator configs**: "system of record" use — logging privileged account access, periodic job runs, schema migration events — without any human receiving those notifications. Provides an auditable history alongside real incidents.

**Key insight**: postmortems provide deep insight per incident; outage tracking provides breadth across all incidents. Both are necessary.

### Chapter 17 — Testing for Reliability

Testing as the mechanism for quantifying confidence in a system's future reliability. Two sources of confidence: (1) monitoring historic behaviour; (2) testing-based predictions — valid only if the system is unchanged, or if every change is fully described and its uncertainty analysed.

**Testing and MTTR**: tests that block a push catch bugs with *zero MTTR* — the bug never reaches production. More zero-MTTR catches → higher MTBF experienced by users. Monitoring catches bugs with non-zero MTTR (detection + mitigation time).

**Traditional test hierarchy**: unit tests (milliseconds, cheap) → integration tests (component assembly; dependency injection for mocks) → system tests: smoke (critical-path sanity), performance (regression in response time or resource usage), regression (prevent known bugs re-entering). Cost increases dramatically up the stack; mindfulness of test cost is essential.

**Production tests**:
- *Configuration tests*: verify that a binary's live configuration matches the checked-in config file; inherently non-hermetic; valuable as distributed monitoring for validating rollouts
- *Stress tests*: find component limits before catastrophic failure; answers "how full can this get?"
- *Canary tests*: not a true test — "conspicuously absent from the list" — more like structured user acceptance; exposes new version to live traffic; exponential rollout with order-of-fault estimation (U=1: scales linearly with traffic; U=2: randomly damages data a future user will see; U=3: damaged data is also a valid identifier; most bugs are U=1)

**Hermetic vs production environment**: production is intentionally non-hermetic because rollouts change it in small steps; config tests bridge this gap by probing the live configuration state.

**Build systems**: Bazel-style dependency graphs rebuild and retest only what changed → reproducible builds → faster feedback loops.

**Testing culture**: document all bugs as test cases; continuous build system breaks must be treated as highest priority by all engineers; four reasons: harder to fix when stale, slows the whole team, release cadences lose value, emergency releases become complex.

**Production probes**: replay known-good and known-bad requests against live production as monitoring probes. These are different from release tests because they use the real frontend/backend combination. When probes fail, the frontend or backend API is not equivalent between release and production environments. The production updater checks probe health before routing traffic to a new version — failing probes block the rollout indefinitely without user impact.

**Configuration file risk management**: (1) MTTR-purpose configs — changed only on failure; release cadence slower than MTBF; (2) frequently-changed configs — must be treated as application releases with equivalent testing; if not, they dominate site reliability negatively. Break-glass mechanism should be auditable and should asynchronously run the release tests, back-annotating the push with any failures.

**SRE tools testing**: automation tools operate outside the mainstream API and have a different risk profile. "Barrier defense" pattern: mark a replica as unhealthy (barrier) before running risky maintenance software; only unhealthy replicas are accessible to the tool; remove barrier via health-check tool to release back into production.

**Statistical testing** (Chaos Monkey, Jepsen, fuzzing): not repeatable, but useful for finding higher-order bugs. Log the random seed or action sequence immediately; replay to characterise the fault before claiming it's fixed.

### Chapter 22 — Addressing Cascading Failures

Cascading failure occurs when a component fault increases load on surviving components, causing them to fail too — creating a positive feedback loop that can collapse the whole system. It is distinct from a single-component failure: the failure mechanism is self-reinforcing.

**Resource exhaustion cascade mechanisms**: overloaded servers take longer to process requests → in-flight requests consume more RAM → cache hit rate falls → more requests reach the backend → backend becomes more overloaded. GC languages exhibit the GC death spiral: CPU exhaustion → longer GC pauses → slower throughput → more RAM used → more frequent GC. Service unavailability snowball: if 10% of servers fail, survivors handle 11% more load; this may tip them over their limit, causing more failures, until even dropping back to 90% load doesn't help because only 10% of capacity remains.

**Queue management**: short queues are better — they reduce average response time, which reduces resource consumption during overload. Under sustained overload, use LIFO or CoDel (Controlled Delay) queue discipline rather than FIFO. FIFO is the worst choice under overload: the front of the queue contains requests that have been waiting longest and have most likely timed out on the client side — completing them wastes resources on results that will be discarded.

**Load shedding**: when concurrently in-flight requests exceed a threshold (approximating server capacity), return HTTP 503 immediately. No queueing, no backpressure — rejecting quickly preserves CPU for requests that can succeed.

**Graceful degradation**: instead of failing completely, return a reduced-quality response (omit non-critical features, serve stale data). Different from load shedding — load shedding drops requests; graceful degradation serves degraded results to more requests.

**Deadline propagation**: the client sets a deadline representing the time by which the response is needed. At each RPC hop, the elapsed time is subtracted from the remaining deadline. A backend receiving a request with 2ms remaining deadline should not attempt to process it — it will certainly miss the deadline and waste resources. Deadlines should be within an order of magnitude of the mean response latency; very long deadlines allow thread pool exhaustion from a small fraction of slow requests (bimodal latency problem: 5% of requests taking 100s can exhaust all threads, producing 80%+ error rate from a 5% root cause).

**Latency cache vs capacity cache**:
- *Latency cache*: the system can sustain its full load without the cache (cache reduces latency/cost, not feasibility)
- *Capacity cache*: the system cannot serve its full load without the cache (cache enables operation at scale)

Capacity caches are hard dependencies. Cold cache scenarios (new cluster, maintenance return, rolling restarts) require special handling: restart in stages, rejecting traffic until the cache is warm; gate rollouts on cache fill percentage; avoid simultaneous restarts.

**"Always go downward in the stack"**: communication should only flow from higher-level services to lower-level dependencies, never laterally between services at the same tier. Intra-tier calls create hidden dependency cycles that can produce distributed deadlocks.

**Testing for cascading failures**: test *past* the breaking point, not just up to capacity. Test both gradual load increases and impulse loads (sudden large spikes). Without impulse testing, you don't know how the system behaves when it first tips over.

**Immediate mitigation steps**: (1) add capacity/replicas; (2) stop health-check-driven kills if they're removing servers faster than the cascade requires; (3) drop traffic to ~1% to let the system stabilise, then ramp up gradually; (4) use server-wide retry budget to suppress retry storms.

### Chapter 23 — Reliable Product Launches at Scale (Distributed Consensus)

The chapter presents distributed consensus as the foundation of reliable coordination, via three case studies of ad hoc coordination failures before surveying the correct approach.

**Case studies of ad hoc coordination failure**:
1. **STONITH + heartbeat timeout**: primary and replica used a shared-nothing failover. On a network partition, each node decided the other was dead, and both either shut down (split-brain, nothing serving) or both became primary (conflicting writes). The heartbeat timeout was not well-calibrated.
2. **Human-intervened failover**: manually triggered failover doesn't scale — humans are overwhelmed exactly when most needed, and the delay (MTTR) is unbounded. The failure mode is operational overload.
3. **Gossip-based cluster membership**: on a network partition, each half elected its own master, leading to split-brain. Gossip can detect failures but cannot reach agreement on who the authoritative leader is.

**Replicated State Machine (RSM)**: the fundamental building block of reliable coordination. A consensus algorithm (Paxos, Raft) provides a totally ordered log; the RSM executes operations in that order; the result is that any deterministic state machine can be made highly available. The RSM abstraction is what turns "runs on one machine" into "runs reliably across many".

**Components built correctly on consensus**: datastores (Chubby, etcd, ZooKeeper), leader election (one master at a time), distributed locks (**use leases, not indefinite locks** — leases expire automatically if the holder crashes; indefinite locks require explicit release which may never happen), task queues (claim tasks with leases, not deletions — if the worker crashes, the lease expires and the task is re-claimable), pub/sub systems (atomic broadcast is equivalent to consensus).

**Replica count**: 2f+1 nodes to tolerate f failures. Minimum viable: 3 nodes (tolerates 1 failure). Best practice: 5 nodes (tolerates 2 simultaneous failures — e.g., a planned maintenance and a concurrent hardware failure). Running fewer than 5 means planned maintenance leaves no tolerance for concurrent failures.

**Multi-Paxos**: in steady state with a stable leader, only 1 round-trip is needed per consensus operation. Duelling proposers (two nodes trying to be leader simultaneously) cause livelock → mitigated by randomised backoff. Performance: batching (accumulate multiple operations into one consensus round) and pipelining (multiple consensus rounds in flight simultaneously). Disk write latency (~1–10ms) limits throughput to ~100 ops/s in serial mode; pipelining breaks this constraint.

**Quorum leases**: to reduce read latency, grant leases to quorum members allowing them to serve strongly consistent reads locally without a consensus round. The master withholds renewing leases when it needs to make a change, ensuring no stale reads during the lease window.

**Replica placement**: minimise failure domain overlap (different racks, switches, power domains). Trade-off: geographically distributed replicas increase fault tolerance but increase consensus latency. Hierarchical quorums (9-replica cross-region deployment) can reduce latency vs. flat quorums.

**Linchpin replica problem**: if a 5-replica deployment has one replica at the centre of the network topology, losing that replica may effectively partition the cluster — even though majority quorums technically still exist. Placement must account for network topology, not just count.

**Monitoring for consensus systems**: member count and health; number of lagging replicas (count + bytes behind); whether a leader currently exists; leader change rate (instability signal); consensus transaction number (must increase monotonically — a non-increasing transaction number is a bug); proposal counts; throughput and latency.

### Chapter 24 — Distributed Periodic Scheduling with Cron

Classical cron runs on a single machine: a crond daemon loads the crontab schedule and fires jobs. Its reliability is bounded by the machine it runs on — a single hardware failure takes the entire cron service down.

**Distributed cron design**: decouple the cron service from individual machines by running it on multiple replicas inside a datacenter scheduler (Borg). Use Paxos to maintain consistent state across replicas. A single leader is the only replica allowed to launch jobs and modify shared state; followers track all state changes and are ready to become leader.

**Idempotency and the "fail closed" principle**: cron jobs vary enormously in their tolerance for duplicate or skipped launches. A garbage collection job can run twice safely; a payroll job or newsletter mailing cannot. When in doubt, prefer *skipping* a launch over risking a *double launch* — recovering from a skip is feasible; recovering from a double launch may be impossible. This "fail closed" orientation is built into the architecture.

**Two synchronisation points per launch**: before the launch begins, the leader writes to Paxos that the launch is starting; after it completes (success or failure), the leader writes that it ended. These two checkpoints allow a new leader after failover to determine exactly which launches were completed vs in-flight vs not yet started.

**Partial failure recovery**: if the leader dies between the two sync points, the new leader must determine whether the RPC to the datacenter scheduler was actually sent. The solution: precompute idempotent job names (incorporating the scheduled launch time as a disambiguator) and distribute those names to all replicas before launching. The new leader looks up the precomputed names in the datacenter scheduler to determine their state — no guessing needed.

**State storage trade-offs**: Paxos logs stored on local disk of each replica (3 replicas = 3 copies); snapshots stored on local disk *and* backed up to a distributed filesystem. Logs are acceptable to lose (bounded, bounded-in-time loss); snapshots are critical (losing all snapshots means starting from zero). New replicas fetch state from a running replica over the network, making rescheduling to a new machine trivial.

**Thundering herd mitigation**: when many teams schedule daily jobs at midnight, the datacenter faces simultaneous resource spikes. The crontab format is extended with a `?` wildcard: "run at any value in this range." The cron service hashes the job's configuration to deterministically pick a value within the range, distributing launches more evenly across the time window.

**Leader failover time**: must converge faster than one minute (the smallest cron interval) to avoid missing or double-launching a job.

### Chapter 25 — Data Processing Pipelines

Data pipelines transform an input dataset to an output dataset, typically via a chain of programs whose outputs feed the next stage (pipeline depth = number of chained programs). Initially reliable when well-tuned; fragile as organic growth changes input volumes and execution patterns.

**Hanging chunk problem**: "embarrassingly parallel" algorithms partition input into chunks. When a chunk requires disproportionate resources (e.g., a very large customer in a customer-partitioned workload), the entire pipeline is blocked on the worst-case chunk. The naive response — kill and restart the job — discards all completed work because periodic pipelines typically lack checkpointing.

**Thundering herd in batch scheduling**: a large periodic pipeline can simultaneously start thousands of workers. Misconfigured retry logic compounds the problem: failed workers retry immediately, multiplying load on cluster services. Adding more workers (the intuitive response) makes it worse.

**Moiré load pattern**: two or more pipelines running on similar intervals whose executions occasionally overlap, causing simultaneous spikes on a shared resource. Observable as interference patterns in resource usage graphs. Harder to diagnose than a single thundering herd because no single pipeline looks problematic in isolation.

**Monitoring gap**: periodic pipelines typically report metrics only on completion. If the job fails mid-run, no metrics are produced. Real-time operational visibility requires continuously running pipelines or proactive instrumentation.

**Workflow (Google's continuous pipeline system)**: a leader-follower system with four correctness guarantees: (1) configuration tasks act as barriers — workers must complete the previous configuration's tasks before proceeding; (2) each work unit carries a unique lease — only the lease holder may commit; (3) worker output files are uniquely named — orphaned workers cannot overwrite valid work; (4) each task carries a server token — prevents a misconfigured Task Master from corrupting the pipeline.

Workers are entirely stateless (can be killed at any time); the Task Master holds pointers to work units in memory with synchronous journalling to disk. For business continuity across datacenter failures, each local Workflow uses Chubby for leader election and journals to Spanner as a globally consistent (low-throughput) log; reference tasks in a global Workflow track in-flight work across sites.

**Key recommendation**: if a data processing problem is inherently continuous or will grow to become continuous, do not use a periodic pipeline. The transition cost later is high and usually forced at the worst time. Design for continuous processing from the start.

### Chapter 26 — Data Integrity: What You Read Is What You Wrote

Data integrity means that users can access their data and that the data is correct. These are two distinct properties: data can be perfectly preserved but inaccessible, or corrupted but accessible. Both are failures from the user's perspective.

**Replication is not recoverability.** Replication propagates corruption to all replicas before the problem is detected. If a bug deletes 10 rows per minute and replication is synchronous, all replicas have lost the same data within seconds. Backups are the defence that replication cannot provide.

**The failure mode matrix**: data integrity failures occur across three dimensions — *root cause* (user action, operator error, application bug, infrastructure bug, hardware fault, site catastrophe), *scope* (widespread vs. narrow), and *rate* (big-bang vs. creeping). Google's study of 19 recovery events found that software bugs causing deletion or referential integrity loss were the most common cause; the most insidious were low-grade, creeping losses discovered weeks to months after the bug shipped.

**Three layers of defence in depth**:
1. *Soft deletion*: deleted data is marked inactive but not immediately destroyed; admins can undelete within the window (typically 30–60 days). *Lazy deletion* (cloud-API variant): the storage provider preserves deleted data for weeks before destruction, invisible to the application. Primary defence against user error and developer error in batch deletion pipelines.
2. *Tiered backups*: Tier 1 — frequent, fast-restore, co-located with live data (minutes to restore); Tier 2 — daily, local distributed storage (hours to restore); Tier 3+ — nearline/offline, different media type, protects against site-level failure. Storage media diversity is essential: a bug in a filesystem driver may affect all replicas but not tape.
3. *Out-of-band data validation*: periodic batch jobs that check invariants across datastores (e.g., Gmail validates that email metadata references match stored emails daily). Catches referential integrity breaks and low-grade corruption before they propagate. Must only check catastrophic invariants — validators that are too strict get abandoned; too loose and they miss real issues.

**"Backups don't matter; recovery does."** The scenarios in which you need to recover drive backup decisions, not the other way around. Continuously test the full end-to-end restore process — a broken restore process discovered during an actual data loss emergency is devastating. If recovery tests are manual, they won't be performed frequently enough.

**Point-in-time recovery** ("time-travel"): for creeping corruption bugs, recovering to a single snapshot is insufficient — different subsets of data may need to be recovered to different timestamps. This is the most complex and expensive recovery scenario; deep backup retention (30–90 days at Google) is needed to make it feasible.

**At exabyte scale**: iterating over petabytes of data to validate or copy takes decades serially. The approach: establish *trust points* (immutable data segments whose content is verified and frozen by age); make incremental backups of only data changed since the last backup; parallelise validation and copying by sharding across many tasks with independent data ranges.

**Google Music case study**: a refactored data deletion pipeline introduced a race condition between pipeline stages. The bug ran silently for a month, deleting ~600K audio references. Recovery required recalling 5,337 backup tapes from offsite storage — 1.5 petabytes, 7 days of recovery work. Root cause: pipeline stages designed to run in strict succession began taking longer as data volume grew, invalidating the simplifying timing assumptions.

### Chapter 27 — Reliable Product Launches at Scale

**Launch Coordination Engineers (LCE)**: a dedicated consulting team within SRE specialising in the technical side of product launches. Draw on cross-product experience from hundreds of launches. Role: audit services, act as liaison between teams, drive technical momentum, gatekeep launches deemed unsafe, educate on best practices.

**Launch checklist principles**: every question must be substantiated by a prior launch disaster; every instruction must be concrete and actionable. LCEs curate the checklist continuously; adding a question once required VP approval. Checklist themes: architecture & dependencies, integration, capacity planning, failure modes, client behaviour, processes & automation, development process, external dependencies, rollout planning.

**Convergence on common infrastructure**: the checklist drives teams toward shared rate-limiting, binary release, and data-push infrastructure — a line saying "use system X" replaces an entire checklist section.

**Launch spikes are non-linear**: many services have a window of linear CPU-to-load scaling, then a non-linear regime as they approach overload — some lock up completely. Always load-test past the expected peak, not just up to it.

**Abusive client behaviour**: clients with scheduled background operations (sync, heartbeat, update check) must inject randomness into all timing — without jitter, every instance fires at once (thundering herd). Exponential backoff on retry must also be jittered to prevent synchronised retry bursts after a brief outage.

**Feature flag frameworks**: roll out features to a fraction of traffic while the rest sees the old behaviour; requirements: parallel experiments, gradual percentage increase, automatic failure isolation, instant revert capability, A/B measurement. Two classes: UI rewriters (simpler, stateless) and request routers (stateful, supports arbitrary business logic). Dormant code paths can be shipped ahead of activation, simplifying rollback.

**Three things LCE couldn't solve**: (1) architectural rearchitecting required when a service scales by more than 100×; (2) operational load accumulation over time; (3) infrastructure churn — migration debt when infrastructure APIs break backward compatibility. These require company-wide engineering efforts beyond a consulting team.

### Chapter 28 — Accelerating SREs to On-Call and Beyond

Training SREs for on-call requires structure, not chaos. The "trial by fire" model (assigning all incoming tickets to new hires so they learn by reacting) produces operations-focused engineers rather than SREs, and likely alienates capable engineers along the way.

**Anti-pattern vs. recommended practices**:

| Anti-pattern | Recommended |
|---|---|
| Deluging newbies with menial work | Sequential, cumulative learning path |
| Checklists and playbooks only | Reverse engineering and statistical thinking |
| First hands-on experience comes after going on-call | Contained, realistic breakages before on-call |
| Experts' knowledge is compartmentalised | Disaster role-playing intermingles approaches |
| Push students into primary on-call before readiness | Shadow on-call early and often |

**Wheel of Misfortune**: a weekly tabletop exercise in which two team members are designated primary and secondary on-call; the "game master" presents a real or hypothetical outage scenario, answers questions about what observability would show, and guides the group through root-cause investigation. Keeps senior SREs current on stack changes while building new hires' mental models.

**On-call learning checklist**: a structured reading and comprehension list ordered by system (e.g., from how a query enters the system → frontend → mid-tier → infrastructure → cross-cutting). Each section lists expert contacts, key documentation, required knowledge, and comprehension questions. Students pass section-by-section; passing unlocks deeper production access ("powerups"). The checklist is a living document — new hires are tasked with updating the most outdated sections, turning onboarding into documentation apprenticeship.

**Shadow on-call**: configure alerts to copy incoming pages to the new SRE (initially business hours only). They observe an outage as it unfolds rather than reconstructing it afterward. The experienced on-caller reviews reasoning post-incident. Final step: reverse shadow — new SRE becomes primary while the senior lurks and intervenes only if needed.

**"Scale your humans faster than you scale your machines."**

### Chapter 29 — Dealing with Interrupts

Operational load falls into three categories: *pages* (production alerts, response in minutes), *tickets* (customer requests, response in hours/days), and *ongoing operational responsibilities* (rollouts, ad hoc queries).

**Cognitive flow state**: engineers produce their best work when in a state of deep focus — time distortion, clear goals, immediate feedback. Interrupts break this state. A 20-minute interrupt entails two context switches and realistically costs several hours of productive work.

**Polarise time**: when an engineer arrives, they should know whether the day is project-work or interrupt-handling — not a mixture of both. The two modes are incompatible. The minimum useful granularity is a day; a week is better. An SRE on on-call should treat the week as entirely written off for project work. If a project is too important to lose a week, assign someone else to the on-call shift.

**"Do one thing well"**:
- On-call: primary on-caller handles all pages; secondary backs them up. No project work expected from the primary.
- Tickets: assign tickets to one or two dedicated engineers, not randomly across the team. Random assignment is "disrespectful of your team's time" — it maximises context switching for everyone.
- Ongoing responsibilities: define handover procedures so any team member can take up a rollout or task; the person who started it does not need to shepherd it for its full lifetime.

**Reduce interrupt load at the root**: teams that rotate through interrupt duty without analysing what caused the tickets repeat the same gauntlet every rotation. Conduct regular scrubs to identify classes of tickets with fixable root causes. Silence the alert until the fix is complete; this both relieves the current handler and creates a deadline for the fix.

**Do not be on interrupts unless assigned to it.** Engineers who pick up tickets when not assigned inadvertently mask the true interrupt volume, which prevents the team from making the staffing adjustments needed to make the load manageable.

### Chapter 32 — The Evolving SRE Engagement Model

SRE engagement with a service has evolved through three distinct models, each addressing the previous model's scaling limitations.

**Simple PRR (Production Readiness Review) model**: the default engagement path for services already in production. A PRR follows five phases — Engagement (scoping, SLO agreement), Analysis (checklist-driven review against SRE standards), Improvements/Refactoring (prioritised fixes, jointly executed), Training (SRE team onboarding to the service), and Onboarding (progressive transfer of production responsibility). Areas examined: system architecture and dependencies, instrumentation and monitoring, emergency response, capacity planning, change management, performance (availability/latency/efficiency).

PRRs are resource-intensive: typically 2–3 SREs for 2–3 quarters. This creates a serialisation bottleneck — not all services can be onboarded, and lead times are measured in quarters.

**Early Engagement model**: moves SRE involvement to the Design phase, before code is committed. Candidates: services adding significant new functionality to an SRE-managed system; rewrites of existing SRE-managed services; services whose development teams proactively sought SRE input. Key benefit: the cost of fixing a design decision scales sharply with how late in the lifecycle it is discovered. The SRE team can take ownership as early as the Build phase. Also reduces friction at launch: by the time the service is live, the SRE team has operational experience with it.

**Frameworks and SRE Platform**: the most scalable model. Core idea: codify best practices in reusable framework modules, and provide a common production platform and control surface. Framework modules cover instrumentation/metrics, request logging, traffic and load management, and configuration standards. Dev teams build on the framework; SRE maintains the framework.

Benefits of the frameworks approach:
- *Universal support by design*: services that cannot receive dedicated SRE support can still benefit from SRE-maintained production infrastructure
- *Faster PRRs*: framework-built services require single-SRE review, often in one quarter (vs. 2–3 SREs over 2–3 quarters)
- *Shared responsibility model*: SRE owns the production platform; the dev team owns business-logic reliability. This breaks the original binary (full SRE support vs. nothing)
- *Automatic improvement propagation*: improvements to framework modules benefit all services using the framework without individual service work

The frameworks model resolves the fundamental SRE staffing constraint: the number of services requiring SRE expertise can grow without requiring a proportional growth in SRE headcount.

### Chapter 33 — Lessons Learned from Other Industries

A comparative survey of SRE principles across high-reliability industries: nuclear (US Navy, UK civil nuclear), aviation/air traffic control, telecommunications/E911, medical devices (LASIK), diamond manufacturing, and proprietary trading.

**Four SRE principles across all industries**:

1. *Preparedness and disaster testing*: all high-reliability industries have forms of disaster testing, scaled to the stakes. Aviation uses realistic simulators rather than live tests (lives at risk). Nuclear Navy conducts live drills "every week, two to three days per week." Telecom maintains swing capacity (mobile switch units). Lifeguarding uses incognito "mystery shopper" mock drowning scenarios. In contrast to Google's DiRT exercises, most industries cannot afford to test by actually breaking production.

2. *Postmortem culture*: industries with lives at stake are required by regulators (FCC, FAA, OSHA, FDA) to conduct root cause analysis. Manufacturing and chemical industries extend this to near-miss analysis — events where harm *could* have occurred but didn't. Near misses are treated as preemptive postmortems: an opportunity to learn before the failure kills someone. The UK CHIRP programme (aviation/maritime) provides a confidential near-miss reporting service that publishes anonymised analyses.

3. *Automation*: views diverge sharply by industry risk profile. Nuclear Navy: minimal automation — a human decision chain is required for critical operations; computers can commit irreparable mistakes too quickly. UK civil nuclear: automation is *required* if a response must happen in under 30 minutes. Proprietary trading: became more cautious after Knight Capital's $440M 2012 loss and the 2010 Flash Crash. Manufacturing: automation embraced for consistency, efficiency, and error reduction. LASIK: automating iris-matching for patient identification eliminated an entire class of medical errors.

4. *Structured and rational decision making*: data-driven decisions over opinion, including "HiPPO" (Highest Paid Person's Opinion) bias. Some industries use "if it works, don't change it" conservatism (telecom 1980s switches still in use, nuclear slow-change doctrine). Others (manufacturing/chemical) use formal hypothesis testing with controlled experiments before implementing changes. Proprietary trading: separate enforcement team from traders; enforcement can halt trading instantly ("if we aren't trading, we aren't losing money").

**Key distinction**: Google has a higher velocity appetite than almost any other high-reliability industry. Most industries surveyed accept much slower rates of change because the consequences of failure include loss of life. Google's error budget mechanism — explicitly scoping "how unreliable is acceptable" — is a direct response to this: it allows calculated risk-taking at high velocity while maintaining accountability. Error budgets are Google's adaptation of well-known reliability principles to a context where lives are not directly at stake and velocity has competitive value.

### Chapter 30 — Embedding an SRE to Recover from Operational Overload

When a dev team is stuck in pure ops mode — every engineer consumed by alert-handling and ticket-triage — the SRE engagement model shifts from standard service ownership to a temporary embedded model: one SRE joins the team to drive structural improvement, not to clear tickets.

**Ops mode vs nonlinear scaling**: a team in ops mode is a team whose operational load grows linearly with user count. This means headcount must scale with users — the opposite of SRE's mandate. The embedded SRE's job is to break that linear dependency.

**Three phases**:
1. *Learn*: understand the product, the architecture, the team's history, and the existing operational load without yet changing anything. Resist the urge to fix.
2. *Share context*: communicate what was learned. Identify the highest-leverage problems. Be specific about *why* each item matters and what the path forward looks like. Resist fixing things yourself.
3. *Drive change*: guide the team to make the fixes. The goal is not a clean dashboard; it is a team that can sustain a clean dashboard after the embedded SRE leaves.

**Kindling identification** — early warning signs of accumulated operational debt:
- Alerts that are routinely silenced or acknowledged without action
- Services without defined SLOs
- On-call engineers spending time on tickets instead of emergencies
- Capacity planning done by gut feeling rather than data
- Postmortem action items that all say "improve rollback" without specifying how

**SLO is the single most important lever**: an SLO gives the team a shared objective definition of "working well enough." Without it, every ticket is a crisis and every metric spike demands a response. With it, the team can triage against a concrete standard and push back on unreasonable demands.

**Don't fix things yourself**: an embedded SRE who resolves issues directly may improve the dashboard temporarily but leaves the team no more capable. Explaining the reasoning behind a fix is as important as the fix itself. Teach the team to fish.

**Bad Apple Theory is false**: the embedded SRE will encounter team members who appear to be the cause of many problems. In almost every case, investigation reveals systemic causes: unclear processes, lack of tooling, inadequate training. The systemic view is always more productive than the individual-blame view.

### Chapter 31 — Communication and Collaboration in SRE

**Production meetings**: the primary recurring communication mechanism between SRE teams and their partner dev teams. Key properties:
- *Frequency*: weekly; duration 30–60 minutes
- *Orientation*: service-oriented, not team-oriented — covers the health of specific systems
- *Rotating chair*: prevents the meeting from becoming one person's domain; builds shared understanding across the team
- *Attendance*: compulsory for both SRE and partner dev team engineers

**Standard agenda** (in order):
1. Upcoming production changes that may affect availability — scheduled downtime, flagged high-risk changes
2. Metrics updates — how are SLIs tracking against SLOs?
3. Outages since the last meeting — any postmortems?
4. Paging events (urgent, required human response): for each: what triggered it, how it was handled
5. Non-paging events: informational alerts, user-reported issues, automated remediation — three categories:
   - Alerts that fired but required no action (candidates for tuning)
   - Alerts that correctly detected something that was subsequently fixed
   - Alerts that fired and the engineer decided to fix the root cause rather than responding to the alert
6. Prior action items — status and owners

**Collaborative doc pattern**: maintain a single shared running document for the service that is updated week-by-week. The document accumulates history and is searchable; it replaces both meeting notes and the institutional memory otherwise held by the longest-tenured team member.

**Viceroy case study**: multiple SRE teams independently built custom monitoring dashboards for their services, duplicating work and producing inconsistent UX. One team's Viceroy framework solved the problem elegantly. Rather than mandating it top-down, the SRE teams who adopted it early invited others to contribute — the framework converged through collaboration, not edict. Key principle: demonstrate value first; adoption follows.

**Cross-site collaboration** (for SRE teams split across multiple geographic sites):
- Divide service components into single-site subteams — each site owns a specific part of the service; all sites share full documentation
- Establish documented standards (coding style, escalation procedures, alerting thresholds) so decisions made at one site are legible to the other
- Time-box debates: pick a deadline for contentious decisions. Unresolved debates after the deadline are decided by a designated tie-breaker

**SRE-Dev collaboration is most effective at the design phase**, before any code has been committed. Retrofitting SRE requirements (observability, load-shedding, graceful degradation, SLO alignment) into an existing system is significantly harder than designing for them. The SRE consulting model (LCE, design review participation) is structurally designed to create this early contact.

**DFP → F1 migration case study**: the Double Filtering Pipeline (DFP) was a batch-processing service that reached the limits of its architecture as query volume grew. Rather than patching it, the team designed F1 (Flexible Filtering) — a continuous, event-driven replacement with fundamentally different performance characteristics. The migration required cross-team coordination (SRE + multiple dev teams sharing the infrastructure), explicit SLOs for the transition period, and a multi-stage cutover plan. The key lesson: cross-team migrations of this scale succeed only when roles are clearly defined, when each team's changes are independently deployable, and when the SLO for the system is explicit enough to measure whether the migration is going well.

### Chapter 34 — Conclusion

Benjamin Lutch (VP, Site Reliability Engineering) synthesises SRE's evolution through an aviation analogy.

**The 747 analogy**: a hundred years ago, a small plane had a single engine, fragile systems, and a pilot who also served as mechanic. Today, a 747 carries hundreds of passengers and tons of cargo across 6,000 miles, but still has just two pilots. Every other dimension — safety, capacity, speed, reliability — has scaled enormously. How? The interface to the underlying systems was designed by people who understood complex systems and how to present them to humans in a way that is both consumable and scalable. The underlying systems have all the same properties the book has described: availability, performance optimisation, change management, monitoring and alerting, capacity planning, emergency response.

**SRE's goal** mirrors this: an SRE team should be as compact as possible, operating at a high level of abstraction, relying on backup systems and thoughtful APIs. Simultaneously, SREs must have comprehensive, hands-on knowledge of how systems operate, fail, and should be responded to — knowledge that only comes from running them day-to-day.

**Two consistent dynamics**: (1) SRE's primary concerns are stable even as systems grow 1000× larger — reliability, flexibility, manageability, monitoring, capacity planning remain the key axes. (2) The specific activities that address those concerns evolve. "Build a dashboard for 20 machines" becomes "automate discovery, dashboard building, and alerting over tens of thousands of machines."

**Appendix B — Best Practices for Production Services** (Ben Treynor Sloss): a crisp canonical summary:
- *Fail sanely*: validate syntax and semantics of configuration inputs; on bad input, continue with the previous state and alert
- *Progressive rollouts*: staged, supervised, across geographies; roll back first, diagnose second
- *Define SLOs like a user*: measure at the client, not the server (Gmail's availability improved from ~99% to >99.9% after switching to client-side measurement)
- *Error budgets*: 1 minus SLO; while budget remains, development can launch; when exhausted, freeze changes until budget is recovered or the month resets
- *Monitoring outputs*: only three: pages (act now), tickets (act within days), logs (no immediate action) — everything else is noise
- *Overloads*: graceful degradation first; load shedding second; every client must implement exponential backoff with jitter
- *SRE teams*: at most 50% toil; at least 8 engineers for sustainable on-call; at most 2 paging events per 12-hour shift; weekly production meetings

## Notable Quotes

> "Hope is not a strategy." (traditional SRE saying, ch. 1 epigraph)

> "SRE is what happens when you ask a software engineer to design an operations team." (ch. 1)

> "An outage is no longer a 'bad' thing — it is an expected part of the process of innovation, and an occurrence that both development and SRE teams manage rather than fear." (ch. 1)

> "A system that requires a human to read an email and decide whether or not some type of action needs to be taken in response is fundamentally flawed." (ch. 1)

## Related Pages

- [[operations/error-budgets]]
- [[operations/site-reliability-engineering]]
- [[operations/monitoring]]
- [[operations/availability]]
- [[operations/chaos-engineering]]
- [[operations/automation]]
- [[operations/incident-management]]
- [[operations/testing-for-reliability]]

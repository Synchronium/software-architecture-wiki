---
title: "Chaos Engineering: System Resiliency in Practice"
type: source
tags: [chaos-engineering, resiliency, distributed-systems, reliability, testing, complexity, sociotechnical]
sources: [chaos-engineering]
created: 2026-05-28
updated: 2026-05-28
---

# Chaos Engineering: System Resiliency in Practice

**Authors:** [[authors/casey-rosenthal]], [[authors/nora-jones]]
**Published:** 2020 (O'Reilly)
**Slug:** `chaos-engineering`

## Overview

This book is the definitive treatment of Chaos Engineering as a discipline — covering its origins at Netflix, its theoretical foundations in complexity theory and safety science, concrete implementations across the industry, and its evolution into sociotechnical and cyber-physical domains. Rosenthal built and managed Netflix's Chaos Engineering team; Jones joined as an engineer and technical leader. The book compiles their experience alongside fourteen contributing authors, making it a compendium of the field's cutting-edge practice as of 2020.

The central thesis is that distributed software systems are inherently *complex* (nonlinear, incomprehensible in full by any single person), that complexity cannot be sustainably reduced, and that Chaos Engineering is the discipline for building confidence in such systems by empirically experimenting on them to uncover weaknesses before they manifest as incidents.

The book grounds the discipline in safety science (Dekker, Hollnagel, Perrow) and systems thinking, connecting it to resilience engineering and Human and Organisational Performance (HOP) theory. It is both theoretical and practical: it presents the Principles of Chaos Engineering, a Chaos Maturity Model, multi-company case studies (Netflix, Slack, Google, Microsoft, LinkedIn, Capital One), and addresses emerging frontiers including security chaos engineering, database chaos, and continuous verification.

## Key Claims

- Complex software systems are nonlinear: no single person can hold a complete mental model; failures arise from unanticipated emergent interactions, not individual mistakes (→ ch. 1)
- Complexity cannot be sustainably reduced — accidental complexity accumulates as a byproduct of all work; essential complexity grows with every new feature or safety property (→ ch. 1)
- Chaos Engineering is empirical, not formal: it experiments on the real system to learn what it *does*, not what it *should* do (→ ch. 3)
- Safety is not a composable property: two individually safe components may not be safe in composition — emergent failure modes are invisible from component-level testing (→ ch. 2)
- The purpose of Chaos Engineering is to build *confidence* — if you have other reliable means of building confidence, chaos may not be necessary (→ introduction)
- Chaos Engineering is a science (Popperian falsifiability), not a techne: experiments form and test hypotheses (→ ch. 3)
- Chaos Monkey is a management principle instantiated in code: it forces all engineers toward a shared goal (resilience to vanishing instances) while remaining loosely coupled as to *how* each team solves it (→ introduction)
- The Chaos Maturity Model provides a staged progression from ad-hoc fault injection to sophisticated, automated, continuous verification (→ ch. 15)
- Chaos Engineering applies to the human and organisational side of systems, not just the technical side (→ ch. 10, 11, 18)
- Automation of experiment *selection* is possible and desirable via lineage-driven fault injection (LDFI) using distributed traces; automation of human *judgement* about confidence is not (→ ch. 12)
- ROI of Chaos Engineering is structurally difficult to measure: successful programmes are self-limiting (better availability unlocks faster feature development, raising complexity again) (→ ch. 13)
- Continuous Verification (CV) is the natural successor to CI/CD: proactive experimentation verifying business-visible system output continuously in production (→ ch. 16)
- Redundancy does not make a system safer in isolation; efficiency makes systems brittle; removing complexity from a stable system can reduce its safety (→ ch. 21)
- Security controls drift from Day 0; without continuous feedback loops, security drifts into unknown failure states as the system evolves around static controls (→ ch. 20)

## Chapter Notes

### Chapter 0 — Preamble / Introduction: Birth of Chaos

History of the discipline at Netflix. A 2008 database corruption event led Netflix to move to the cloud, but cloud instances vanished unpredictably. Chaos Monkey was created to address this: a simple app that terminated random instances daily during business hours, forcing all teams to make their services resilient to this failure mode. It is characterised as "a management principle instantiated in running code" — it aligns the organisation toward a shared goal without mandating how individual teams achieve it.

The 2012 Christmas Eve AWS ELB outage led to Chaos Kong — a regional failover simulation. Regional failover was eventually reduced from 50 minutes to 6 minutes by increasing experiment frequency, which raised organisational expectations and motivated automation.

Bruce Wong created a formal Chaos Engineering team at Netflix in 2015. Casey Rosenthal formalised the discipline via the *Principles of Chaos Engineering*, which define it as "the discipline of experimenting on a distributed system in order to build confidence in the system's capability to withstand turbulent conditions in production." The five advanced practices: build a hypothesis around steady-state behaviour; vary real-world events; run experiments in production; automate experiments continuously; minimise blast radius.

Community growth: Chaos Community Day (2015, ~40 attendees) → (2017, 150+ attendees) → Nora Jones keynote at AWS re:Invent 2017 to 40,000+ attendees.

### Chapter 1 — Encountering Complex Systems

Formal definitions of simple vs complex systems:
- **Simple**: linear, predictable output, one person can build a complete mental model
- **Complex**: nonlinear, unpredictable output, impossible to build a complete mental model

The *Law of Requisite Variety* (Ashby): any control system must be at least as complex as the system it controls. Since most software involves writing control systems, complexity grows as a natural consequence.

Three case studies of failures that no reasonable engineering team could have anticipated:

1. **Business logic / application logic mismatch**: A cache (T) fails; the persistent store (S) is overwhelmed; a storage service (Q) returns a 404 as its Cassandra default; an upstream service (P) has no handler for a 404 (impossible by business logic — entities are never deleted) and crashes. Each component made rational design decisions and had fallbacks; the emergent interaction defeated them all.

2. **Customer-induced retry storm**: A customer on a train drops their laptop, hits refresh 100× just as the network reconnects. Consistent hashing directs all 100 requests to one storage node. The node switches to cache (low disk I/O/CPU), triggering autoscaling policies to shut it down and hand off data. The cache miss from the handoff causes a 404 fallback response; the customer retries; the storm propagates to adjacent nodes in sequence, eventually bringing down the service.

3. **Holiday code freeze**: A vertically scaled API gateway (F) takes 40 minutes to provision. Over-provisioned with 50% capacity headroom. A memory leak in a dependency library scales linearly with requests served — but instances previously cycled so frequently (due to continuous deployment) that the leak never had time to manifest. A holiday code freeze pauses deployments; after two weeks, the leak accumulates to cause instance failures across the whole cluster.

Key insight: in all three cases, no individual was at fault. The failures emerged from the complex interaction of reasonable design decisions. Brooks' distinction between *accidental complexity* (byproduct of work, always accumulating, not sustainably reducible) and *essential complexity* (required by new features and safety properties) shows that eliminating complexity from complex systems is not possible.

## Notable Quotes

> "Chaos Engineering is the discipline of experimenting on a distributed system in order to build confidence in the system's capability to withstand turbulent conditions in production." (introduction, citing principlesofchaos.org)

> "Chaos Engineering is about making the chaos inherent in the system visible." (introduction)

> "Chaos Monkey is a management principle instantiated in running code." (introduction)

> "In complex systems, we acknowledge that one person can't hold all of the pieces in their head." (ch. 1)

> "Adding new features to software (or safety properties like availability and security) requires the addition of complexity." (ch. 1)

### Chapter 2 — Navigating Complex Systems

Two foundational models for working *with* complexity rather than fighting it:

**Dynamic Safety Model** (Rasmussen): engineers operate within three rubber-band constraints — Economics, Workload, Safety. Engineers naturally develop intuitions for the first two; Safety remains opaque, which is why incidents are almost always surprises. The dangerous gradient: because Economics and Workload are visible, engineers drift toward them — and away from Safety — as a silent byproduct of success. Chaos Engineering develops safety intuition by providing empirical feedback about the safety boundary.

**Economic Pillars of Complexity** (Beck / Zaninotto): four pillars — State, Relationships, Environment, Reversibility. Software is structurally disadvantaged on State (proliferates with features), Relationships (multiply with abstraction layers and microservices), and Environment (only the largest companies can affect this). **Reversibility** is where software uniquely excels: version control, CI/CD, feature flags, blue–green deployments, short iterations are all investments in Reversibility. Chaos Engineering acts as a floodlight revealing brittleness — places where efficiency was optimised at the expense of Reversibility.

> **Synthesis**: Dynamic Safety Model = behavioural value (safety intuition); Economic Pillars = architectural value (Reversibility targets). Together they ground chaos as a systemic discipline, not a fault-injection toolkit.

### Chapter 3 — Overview of Principles

Formalises what Chaos Engineering is and is not.

**Experimentation vs Testing**: testing verifies *known* properties (assertion → true/false); experimentation creates *new* knowledge. In complex systems, humans cannot enumerate all properties to assert. Chaos experiments discover what was unknown; newly discovered properties can then be encoded as regression tests.

**Verification vs Validation**: verification examines system output at a boundary (does it work?); validation inspects internals (how does it work?). Chaos Engineering is strongly biased toward verification — it cares whether something works, not whether the implementation matches a mental model.

**Not "breaking stuff"**: better characterised as "fixing stuff in production" — the hard work is blast radius control, reasoning about what is worth investigating, and making existing chaos *visible*.

**Not Antifragility**: Taleb's framework proposes adding chaos to strengthen the system; Resilience Engineering (chaos engineering's scholarly basis) diverges on several points — studying what goes right is more informative than hunting weaknesses; redundancy can cause failures as easily as prevent them.

**Five Advanced Principles**:
1. Build a hypothesis around steady-state behaviour (focus on KPIs, verification over validation)
2. Vary real-world events — latency injection and status code changes are the most informative; CPU/memory/disk exhaustion all look like instance termination
3. Run experiments in production
4. Automate experiments to run continuously
5. Minimise blast radius

### Chapter 4 — Slack's Disasterpiece Theater (Richard Crowley)

How to apply chaos engineering to legacy systems not designed with fault tolerance in mind. The core technique is **Disasterpiece Theater**: a structured, planned, human-led Game Day exercise — distinct from automation-first approaches — that works for systems too old or risky to instrument for automated fault injection.

**Prerequisites before chaos**: spare capacity; automated instance removal and replacement (replacement must complete in less than mean time between failures); automated failover for leader/follower systems; correct timeout and retry policies with exponential backoff and jitter.

**Disasterpiece Theater process**:
1. *Preparation*: choose failure mode and simulation strategy; survey dev and prod; identify expected alerts/dashboards/metrics; identify redundancies and runbooks; invite all relevant engineers.
2. *Exercise*: dev run first, then prod if dev succeeds; go/no-go gate between environments; designated note taker with timestamped channel; abort threshold defined in advance.
3. *Debriefing*: time-to-detect and time-to-recover; what humans did that computers should have done; where monitoring is blind; assumptions invalidated; what on-call would do if unplanned.

**Key finding**: exercises repeatedly validated assumptions from long ago that had become stale as systems evolved. Complex system complexity exceeds any individual's model — regular validation is the only defence against silent invalidation of embedded assumptions.

**Anti-goals**: Disasterpiece Theater does not plan on human intervention being required; it is not exploratory (requires detailed prior hypothesis); data durability is a hard constraint (never acceptable to irrecoverably lose customer data).

**Failure technique taxonomy**: process stop → instance termination → iptables network disconnect (manifests as timeouts, not ECONNREFUSED) → partial/asymmetric network partition. Failure modes reduce to two system-level effects: latency and response type (status codes). Pegging CPU/RAM/disk teaches nothing beyond what a termination reveals.

### Chapter 5 — Google DiRT: Disaster Recovery Testing (Jason Cahoon)

Google's Disaster Recovery Testing programme, founded by SREs in 2006. Key motto: **"Hope is not a strategy."** At Google's scale, one-in-a-million events happen several times per second.

**Five rules of engagement**:
1. No SLO-breaking impact on external systems or users — SLO is the test's safety boundary; have a "big red button" rollback.
2. Production emergencies always take precedence over DiRT emergencies — halt and postpone if a real incident occurs.
3. Transparency — all DiRT communications use a "DiRT DiRT DiRT" prefix; outlandish themes (zombie attacks, alien invasions) make exercise artefacts visually distinctive and prevent confusion with real incidents.
4. Minimise cost, maximise value — don't disaster-test known-broken systems (fix them first); don't re-measure well-understood failure modes.
5. Treat DiRT tests as actual outages — "escalate as normal"; artificial laxity wastes the learning opportunity.

**Test categories**: run at service levels (Hyrum's Law: actual SLO performance becomes implicit contract regardless of specs); run without soft dependencies; people outages (lottery factor); release and rollback; incident management procedures; datacenter operations; capacity management; business continuity; data integrity (backups only valid if tested with actual restores); networks; monitoring and alerting; telecom and IT; medical/security; full cold restart.

**Borg Eviction SLO case study**: Borg users were surprised when eviction rates approached published SLOs (which never happened under normal operation). SRE team built a programme to deliberately force evictions at SLO rates, rotating through all Borg cells. Users could safe-list themselves; those who did were required to document why and commit to action items. Safe-listing itself became a diagnostic — teams that requested it revealed misconfiguration before it manifested in production.

**Hyrum's Law** (coined at Google): "With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviours of your system will be depended on by somebody." Applies to reliability and latency characteristics, not just data contracts.

**Woods's Theorem**: "As the complexity of a system increases, the accuracy of any single agent's own model of that system decreases rapidly." Cited from the STELLA Report (SNAFUcatchers Workshop on Coping with Complexity).

### Chapter 6 — Microsoft Variation and Prioritisation of Experiments (Oleg Surmachev)

Three categories of experiment outcomes:
1. **Known events / expected consequences**: experiment plays out as planned. Most progress made here; build coverage and comfort with tooling.
2. **Known events / unexpected consequences**: the fault was controlled but the outcome was not. Execute the abort plan, record, follow up. High learning value about failure and recovery behaviour.
3. **Unknown events / unexpected consequences**: failures compounding beyond control. Engage human attention and failover/recovery plans. Highest long-term learning value (reveals blind spots).

**Prioritisation framework** — three properties:
- *How often does this happen?*: prioritise high-frequency events (deployments, credential rotations, DST changes, security patches). Do them *more often than required* — "we get good at things we do often." The inverse is also true.
- *How likely are you to handle it gracefully?*: identify failure modes that exceed acceptable tolerance. Focus experiments on events you must survive, not ones you accept as total loss.
- *How imminent is this threat?*: scheduled one-off events (elections, peak traffic days) or known security vulnerabilities — once imminent, elevate to top priority regardless of normal cadence.

**Failure variation taxonomy**:
- *Isolated* (single component/setting): clear cause-and-effect; lower blast radius.
- *Combined* (multiple components fail simultaneously): more realistic; harder to diagnose; greater potential for cascading.
- *Compounded* (failures caused upstream or downstream): the most dangerous; blast radius can expand beyond safety assumptions; plan and test recovery before executing.

**Key insight**: "We get good at things we do often." Anything that happens monthly should be practised weekly; anything weekly, daily. Credentials rotation, certificate renewal, OS patching — if you haven't exercised the rotation story in six months, you cannot trust it to work when needed.

### Chapter 8 — Capital One: Adoption and Evolution of Chaos Engineering (Ravi Chockaiyan)

Applying chaos engineering in a regulated financial services context. Capital One began "Blind Resiliency Testing" in 2013, well before "chaos engineering" was a named discipline — a **disruption group** introduced failures while a **response group** operated unaware that disruption was intentional, replicating a real incident's surprise.

**Regulatory constraints** shape the entire practice: observability and audit trail are as important as the ability to design customised experiments. In banking, every action must be attributable; this rules out third-party chaos tooling (which has limited compliance support) and demands in-house platforms with full audit logging. Compliance requirements also turned out to be an **evangelism lever** — linking chaos engineering to regulatory and audit obligations persuaded leadership far more effectively than pure reliability arguments.

**Transition to cloud (2018)**: moving from on-premises to AWS shifted the failure model significantly; cloud instances are ephemeral in ways physical hardware is not. Running chaos in the CI/CD pipeline — as a gate before traffic cutover — proved the most effective maturity step: a failing chaos test blocks the deployment, eliminating the need to schedule separate experiment days.

**Team model**: a core Chaos Engineering team (platform + methodology expertise) combined with **embedded application engineers** (co-creation model) — application engineers own their services but are temporarily partnered with the chaos team to design and run experiments. Prevents the chaos team from becoming a siloed "chaos taxi."

**ROI metric**: reduction in call volume to customer support (convertible to dollar value). Receiving an alert = failing the experiment. The discipline of defining success metrics before running experiments forces teams to clarify what "working correctly" means.

**Community of practice** was the organisational mechanism for scaling expertise — regular meetups, shared runbooks, cross-team learning. Treated chaos as a craft to be built, not a tool to be installed.

### Chapter 7 — LinkedIn Being Mindful of Members (Logan Rosen)

LinkedIn's LinkedOut framework (part of Project Waterbear): request-level failure injection built into the Rest.li filter chain, targeting blast radius minimisation as the primary engineering goal.

**LinkedOut failure modes** (three only, by design):
1. **Error** — injects a generic RestliResponseException, optionally after a configured delay
2. **Delay** — adds latency before forwarding downstream; exposes cascade risks in SOA
3. **Timeout** — holds the request until the configured timeout fires

Deliberately *excluded* response body modification (wrong response codes, malformed content) — known properties testable via integration tests; also presents a security risk.

**Targeting mechanisms**:
- *LiX integration* (A/B testing framework): targets segment of member population; "big red button" in UI; deliberately limited to employees only in the UI to prevent wide member impact.
- *Browser extension*: injects failures via cookie for immediate single-session experimentation; blast radius is essentially nonexistent (only affects the engineer's own session).
- *Automated experimentation*: runs experiments against a synthetic service account; discovers call tree for the URL dynamically (graph changes over time); produces reports with screenshots of degraded experience; schedulable on regular cadence.

**Key principle**: experiments should impact as few people as possible until confidence is established. Start with your own session (browser extension) → employees only → controlled member percentages via A/B framework.

**UI design lesson**: The Hawaii missile alert false alarm (2018) — real and test alert links in the same dropdown. Chaos Engineering UIs must make catastrophic actions visually distinct and require deliberate confirmation. Clarity in UX is a safety property.

### Chapter 21 — Conclusion (Rosenthal & Jones)

Three counter-intuitive rules that are true despite appearing false:

1. **Redundancy does not make a system safer** (Challenger O-ring): the secondary O-ring caused engineers to normalise primary O-ring failures, allowing the Shuttle to operate outside specification over time. Redundancy without discipline creates complacency.
2. **Removing complexity from a stable system can make it less safe**: functionality that makes the system safe is embedded in the complexity. You cannot surgically remove "accidental complexity" without also removing some safety properties.
3. **Efficiency makes a system more brittle**: allowance for inefficiency enables the system to absorb shock and allows people to make creative decisions. Highly optimised systems fail catastrophically rather than gracefully.

**Above the line vs below the line**: tools are "below the line." People, organisation, and human interaction are "above the line." Software engineers are drawn to below-the-line solutions — it is psychologically satisfying to reduce an incident to a single line of code and fix it. The conclusion explicitly resists this: the most productive investments are above the line. Better alignment around how to react to hazards often produces more reliability improvement than writing more code.

**Rasmussen's conclusion** (cited directly): "The most promising general approach to improved risk management appears to be an explicit identification of the boundaries of safe operation together with efforts to make these boundaries visible to the actors and to give them an opportunity to learn to cope with the boundaries." — This is exactly what Chaos Engineering does.

**Final claim**: "Tools don't create resilience. People do. But tools can help. Chaos Engineering is an essential tool in our pursuit of resilient systems."

### Chapter 20 — The Case for Security Chaos Engineering (Aaron Rinehart)

**Security Chaos Engineering (SCE)** defined: "The identification of security control failures through proactive experimentation to build confidence in the system's ability to defend against malicious conditions in production." Developed by Rinehart at UnitedHealth Group; released as open-source tooling (ChaoSlingr).

**The core argument**: security incident root causes are predominantly "human factors" and "system glitches" — not sophisticated attackers. Most malicious code exploits low-hanging fruit: weak passwords, outdated software, misconfigured controls, human unawareness. The current RCA-and-blame model entrenches these failures rather than eliminating them. Hindsight bias confuses our personal narrative with truth; true attribution is never fully knowable.

**Security feedback loops are missing**: security controls are designed for Day 0 of production. The system around them changes continuously via CI/CD. Red and Purple Team exercises are run infrequently (monthly/annually) and produce artifacts (reports, alerts) that rapidly become stale. The system may fundamentally change between exercises. SCE runs continuously and keeps pace with the rate of change.

**SCE vs Red/Purple Teaming**:
- Red Teaming problems: results are reports; incentivises outfoxing the Blue Team rather than shared understanding; focuses on malicious attack chains rather than systemic vulnerabilities.
- Purple Teaming problems: highly resource-intensive; only covers a small percentage of the portfolio; no regression mechanism to reapply past findings.
- SCE advantage: holistic system focus (not adversarial); isolated and controlled simple experiments (not complex attack chains); continuous and automated; collaborative learning culture; reproducible.

**Security Game Days**: introduce controlled security failure modes to measure: how effectively detection tools, techniques, and processes detected the failure; which tools provided signal; how useful that data was; whether the system operated as intended.

**ChaoSlingr** (UnitedHealth Group, open source): framework for security chaos experiments on AWS. Components: Generatr (identifies the injection target and calls Slingr), Slingr (injects the failure), Trackr (logs experiment details). Lambda function-based, auto-configuration via Terraform, configurable frequency. Key finding: a misconfigured port was correctly blocked by firewall only 50% of the time; a commodity cloud configuration tool *always* caught it but logged it in a form inaccessible to the security team. Neither team had known this gap existed.

**Core principle**: "Do Less, Better" (Charles Nwatu, Netflix security engineer). Build fewer security controls, but verify that they actually work. Without feedback loops, security drifts into unknown failure states, just as systems without development feedback loops drift into unreliable operational readiness.

### Chapter 19 — Chaos Engineering on a Database (Liu Tang and Hao Weng)

The most technically detailed chapter: applying Chaos Engineering to TiDB (PingCAP's open-source distributed HTAP database). The database context imposes a stronger correctness requirement than availability services: data loss is unacceptable. 100% unit test coverage does not equal a fault-tolerant system.

**Motivating failure**: a snapshot corruption bug in TiDB's Raft-based replication. The follower received a snapshot with corrupted size metadata because Linux's page cache flushing failed silently (SLUB memory allocation error). This class of failure is only observable in the full production environment and cannot be reproduced via unit or integration tests — it requires chaos.

**TiDB's 5-step Chaos Engineering methodology**:
1. Define steady state via Prometheus metrics: QPS, P99/P95 latency, CPU, memory.
2. List hypotheses for specific failure scenarios (e.g., "isolating a TiKV node from a 3-replica cluster: QPS drops then recovers; 40,000 regions on a single node: CPU/memory remain stable").
3. Pick a hypothesis.
4. Inject fault, monitor, verify. QPS not recovering → either leader re-election failed or client routing is broken → bug found.
5. Automate via Schrodinger; repeat.

**Fault injection taxonomy**:
- *Application level*: SIGKILL/SIGTERM random process kills; SIGSTOP/SIGCONT; renice for priority; `pthread_setaffinity_np` for concurrency bugs.
- *CPU/memory*: while-true loop (100% CPU saturation); cgroup resource limiting.
- *Network*: three network partition types (complete/partial/simplex); `tc` for latency injection and packet reordering; bandwidth saturation; iptables connection restriction. 80% of 136 network-partition failures in 25 famous open-source systems were catastrophic; data loss was the most common (27%).
- *Filesystem*: FUSE-mounted directory with rule-based fault injection (e.g., /a/b/c → 20 ms read/write delay; /a/b/d → NoSpace write error). The injector intercepts I/O operations via hook, applies rules per path, and passes non-matching operations through to the real directory.

**Schrodinger platform**: Kubernetes-based automated chaos experimentation. Components: *Cat* (TiDB cluster under test); *Box* (experiment template/configuration); *Nemesis* (fault injectors); *Test Case* (procedure, inputs, expected outputs). Runs 7 clusters simultaneously, 24/7 without stopping. With Schrodinger, a multi-step experiment that previously required manual cluster deployment, configuration, fault injection, and failure detection runs automatically at a few clicks.

**Key claim**: even a distributed database with 20 million unit test cases and comprehensive integration tests cannot capture failures that emerge from production-specific system interactions. Chaos Engineering is the necessary complement.

### Chapter 18 — HOP Meets Chaos Engineering (Bob Edwards)

**Human and Organisational Performance (HOP)**: an approach from manufacturing for improving organisational structures and processes to optimise for safety. Rooted in the same "new view" safety philosophy (Dekker et al.) as Chaos Engineering. Not a prescriptive process — flexible and arts-based. The five HOP principles, which align directly with Chaos Engineering's underlying philosophy:

1. **Error is normal**: humans make mistakes; the goal is not zero errors but building the capacity to fail safely (crumple zones, not just brake assist). Build both prevention *and* recovery.
2. **Blame fixes nothing**: blame drives important information underground. Accountability means focusing on learning and improving, not finding someone to punish.
3. **Context drives behavior**: the systems surrounding work (safety metrics, production targets, observation programs) drive behaviour — often in ways misaligned with the actual goal. What behaviour is your metric system incentivising?
4. **Learning and improving is vital**: learning must be usable by practitioners in practice, not just theory. The "Learning Team" model. Chaos Engineering verifies that improvements made actually produce the desired system output.
5. **Intentional response matters**: when incidents happen, how the organisation responds — at all levels — sets the tone. Intentional learning-focused responses prevent the blame reflex.

**HOP + Chaos Engineering in practice**: in manufacturing, simulation training rooms model the control room but usually model the *ideal* state. In a real plant, valve 3 has been hanging and only closes 80%. The Chaos Engineering approach: modify the simulator to represent the actual degraded state of the site. New operators must now respond to a valve that appears to close but doesn't fully divert flow — real-time problem solving under the actual chaos of operations. A "decay algorithm" randomising component degradation across simulation runs could approximate production entropy.

**Key synthesis**: HOP is about building confidence in organisational improvements through verification. Chaos Engineering is about building confidence in technical systems through verification. Both are empirical: they want to see the system operating under turbulent conditions, not just test known requirements.

### Chapter 17 — Let's Get Cyber-Physical (Nathan Aschbacher)

Extends Chaos Engineering to **cyber-physical systems (CPSs)** — embedded, hardware-software systems deployed into and interacting with the physical world (autonomous vehicles, industrial control systems, avionics). Consequences of failure can be life-threatening.

**Failure Mode and Effects Analysis (FMEA)**: the established Functional Safety practice (required by standards like ISO 26262, DO-178C, IEC 61508) for assessing risk. Process: enumerate functions → enumerate all possible failures → rank severity/likelihood/detectability → compute risk priority numbers. FMEA puts engineers in a failure-first mindset and, with experienced cross-disciplinary teams, extracts significant uncertainty. But FMEA is limited: it treats one failure at a time (not simultaneous multipoint failures), relies on human imagination to enumerate failure modes, and documents imagined effects rather than empirically measuring real ones.

**Where Chaos Engineering extends FMEA**: chaos experiments can validate or invalidate every FMEA assumption — inject failures enumerated in the FMEA and measure real effects; inject out-of-scope failures to see whether they should have been in-scope; use multiple independent expert teams to perform FMEA and compare discrepancies; feed findings back into the FMEA document.

**The multipoint failure problem**: traditional FMEA assumes single-point failures, which was reasonable when multi-point independent failures in electro-mechanical systems were extremely unlikely. Software changes this — a single software bug replicates identically everywhere it is called; a bad function creates simultaneous correlated failures across an entire system. Standard FMEA constraints break down in software-intensive CPSs.

**Experiment target priority for CPSs**: start with the things you trust most (your critical assumptions), not the obvious black boxes. The parts of a system most trusted and most widely depended on become the largest risk vectors if they fail, precisely because nothing has been designed to tolerate their failure. For CPSs specifically: **start with timing constraints**. Embedded engineers trust local clocks absolutely; in interconnected software-intensive systems, timing assumptions cascade catastrophically. Distributed systems engineers have learned to distrust wall clocks; embedded engineers are becoming distributed systems engineers.

**Probe effect**: in CPSs, instrumenting the system to run chaos experiments or take measurements can itself alter system behaviour (probe resistance/capacitance in electrical systems; branch prediction effects, cache pollution, and timing perturbation in software). Mitigations: (a) characterise the probe's footprint independently before injecting chaos; (b) use dummy probes (same resource profile but no fault injection) to calibrate baseline probe effect; (c) select experimental targets insensitive to the probe's side effects.

**Long-term vision**: Aschbacher argues Chaos Engineering can create the "material properties" of software — context-independent, empirically measured characteristics (like tensile strength in materials science) that allow engineers to reason about complex software-intensive systems without building every prototype. This would let design-time analysis (analogous to Finite Element Analysis in mechanical engineering) catch failure modes before production.

### Chapter 16 — Continuous Verification (Casey Rosenthal)

Introduces **Continuous Verification (CV)** as the next evolution after CI/CD: a discipline of proactive experimentation implemented as tooling that verifies system behaviours against expectations.

**CI/CD/CV as a progression**:
- CI catches expectations gaps between engineers' code as quickly as possible by running integration tests on every commit.
- CD automates the path from passing CI build to production, enabling frequent low-risk deployments.
- CV adds proactive experimentation in production: verifying that the *output* of complex systems meets expectations, rather than validating that the *internals* work as designed.

**Why CV is necessary**: complex systems are open-ended and in constant flux. Validation (do internal parts match spec?) cannot keep pace with the rate of change. Verification (does output meet expectation?) is more pragmatic. CV addresses systemic properties — availability, resilience — that cannot be captured in pre-production tests.

**Types of CV systems**: at one end, sophisticated chaos automation platforms running explicit experiments with control and variable groups. At the other, holistic system visualisations (Vizceral at Netflix) that allow humans to glance at the global state of a complex system and develop intuition. Automated canaries sit in between — the "variable" is a new code branch, and the CD pipeline promotes code only if the canary hypothesis holds.

**ChAP as the canonical CV example**: Chaos Automation Platform at Netflix. Monocle introspects microservice dependencies, integrates telemetry, tracing, and configuration data (timeout values, Hystrix commands), and determines which services are "safe to fail." ChAP spins up two instances (control + variable) per experiment, routes a small fraction of production traffic to each, and runs for 45 minutes. If the KPI (SPS) deviates between groups, the experiment is immediately shut down and the owning team notified. All five advanced Chaos Engineering principles are implemented in ChAP.

**Future CV directions**: performance testing at subsystem granularity; data artifact verification (Jepsen-style continuous database consistency checks); correctness verification at infrastructure, application, and business logic layers. Business logic is the hardest to verify because it is innovative and changes rapidly; mismatches between layers are an inevitable source of incidents.

### Chapter 15 — Chaos Maturity Model

The Chaos Maturity Model (CMM) provides two orthogonal axes for evaluating an organisation's Chaos Engineering practice: **Adoption** and **Sophistication**. Both develop together under normal conditions; tension prevents either axis from racing too far ahead of the other.

**Adoption axis** — four considerations:
1. *Who bought in*: typically bottom-up (engineers closest to incidents → SRE/DevOps/incident management → management → top-down edict from SVP/CIO). "Never let a good crisis go to waste" — post-incident alignment is the most common adoption inflection point.
2. *How much of the organisation participates*: individual contributor on one team → multiple teams → dedicated central team → responsibility of all individual contributors (the DevOps-style end state).
3. *Prerequisites*: monitoring sufficient to detect degraded state (not just offline); social awareness that experiments are happening; expectation that the hypothesis *should* hold (don't experiment on known-broken systems); organisational alignment to act on findings.
4. *Obstacles*: business risk of production experiments; compliance constraints; existing instability making new instability unproductive; ROI measurement difficulty.

**Sophistication axis** — five stages:
1. *Game Days*: manual, human-intensive, high-value for the first few repetitions; does not scale.
2. *Fault injection consultation*: reusable fault injection framework, facilitator runs experiments alongside teams; cross-functional knowledge transfer begins.
3. *Fault injection self-service tools*: teams operate the framework independently; facilitator shifts to setup and results interpretation.
4. *Experimentation platforms*: control group + variable group; request stickiness; subsample traffic; multiple simultaneous experiments in production.
5. *Automation of the platforms*: dead robot's switch (KPI-triggered automatic abort); automatic service detection; experiment prioritisation heuristics; fully automated create/prioritise/execute/terminate cycle.

**Experiment layer progression**: Infrastructure (VM termination, region failover) → Application (inter-service IPC injection) → Business Logic (plausible but unexpected responses). Most organisations begin at infrastructure; maturing teams move up.

**The antipattern**: developing multiple ways to kill an instance (CPU peg, disk fill, OOM). All of these produce the same observable effects as a simple instance termination — nothing new is learned. The two primitives that matter are latency and status code.

**Key claim**: "Highly sophisticated, pervasive Chaos Engineering is the best proactive method for improving availability and security in the software industry." Chaos Engineering swaps uncontrolled risk for controlled risk.

### Chapter 14 — Open Minds, Open Science, and Open Chaos (Russ Miles)

A chapter on organisational dynamics and the conditions for Chaos Engineering to flourish.

**The adversarial vs collaborative mindset**: a chaos team that does experiments *to* other teams (surfacing their failures and leaving them to fix the results) creates a conflict-style relationship that mirrors the worst QA-vs-Dev dynamic — eventually chaos becomes "yet another thing to circumvent." A team that works *with* other teams (co-owning the exploration, sharing the tooling) builds the trust needed to scale the practice. Co-ownership is a prerequisite, not a nicety.

**Open Science applied to Chaos Engineering**: science requires openness — open data, open methodology, open peer review — to reach its potential. Chaos Engineering has the same requirement: if experiment designs, execution records, and findings are locked in proprietary systems, the collaborative learning that generates value cannot happen. The Open Chaos Initiative formalises an experiment definition schema: Experiment Description (with Contributions, Steady-State Hypothesis, Method, Rollbacks). The Steady-State Hypothesis is assessed *twice* — before the method executes (confirming normal pre-conditions) and after (confirming survival or recording deviation).

**Key organisational insight**: reliability should not be a competitive differentiator. Sharing Chaos Engineering experiments and findings across organisations strengthens the whole industry. The discipline is at its most valuable when the community can learn from each other's experiments.

### Chapter 13 — ROI of Chaos Engineering

The central challenge: "No one tells the story of the incident that didn't happen." Attribution is structurally difficult — many factors change concurrently with a new chaos programme. Worse, successful chaos programmes are self-limiting: improved availability typically triggers faster feature release, which increases complexity, which makes maintaining availability harder. The ROI may be invisible; the signal erases itself.

**Kirkpatrick Model** (originally from educational training evaluation, applied here to chaos engineering):
- **Level 1 — Reaction**: did participants feel they learned something? Survey/questionnaire. Sufficient justification for lightweight, low-cost programmes. If stakeholders don't value the programme, it will not produce learning.
- **Level 2 — Learning**: can you enumerate what was actually learned? Facilitator-captured discoveries, recorded disproved hypotheses. More rigorous than reaction alone.
- **Level 3 — Transfer**: did learning change behaviour? Engineers fixing vulnerabilities, allocating more resources to safety, building more robustly. Harder to observe and record.
- **Level 4 — Results**: can learning be correlated with a business outcome? Reduced downtime, fewer security incidents, reduced degraded time. Most difficult but most convincing.

**ChAP ROI case study (Netflix)**: For each disproved hypothesis, ChAP recorded the delta in SPS (starts per second) between variable and control group. Each disproved hypothesis was bucketed against the probability distribution of actual incident durations and SPS impact. Summing "SPS saved" — the hypothetical loss prevented by finding the vulnerability in ChAP rather than in a production incident — produced a chart increasing over time. This achieved **Level 2** (demonstrable learning) in the Kirkpatrick framework, which was sufficient for Netflix's internal justification.

**Collateral ROI**: value accrued that is different from the primary goal. Two examples:
1. *Scenario design*: before any experiment runs, stakeholders are assembled and asked "what do you think will happen?" Isolated pockets of knowledge surface; cross-team dependencies become visible; high-probability-of-failure scenarios are identified and fixed before the Game Day runs. This is valuable even if the experiment never executes.
2. *Team formation*: the exercise brings together people who have never worked together. This social knowledge — how to communicate under pressure, individual idiosyncrasies — pays dividends during real incidents, when there is no time to make introductions.

**Key claim**: "You will feel the value of experiments almost immediately, before you can articulate that value." If feeling the value is sufficient, do not spend engineering effort on formal ROI measurement. Only invest in formal measurement (Kirkpatrick Levels 3–4) if an objective justification is required by stakeholders.

### Chapter 12 — The Experiment Selection Problem (and a Solution) (Peter Alvaro)

The experiment selection problem: for a distributed system with 20 services, there are 2²⁰ (over a million) distinct combinations of node crashes alone. An exhaustive search is computationally intractable. The chapter frames two current approaches and proposes a third.

**Random search** (Chaos Monkey): uniform random sampling over the fault space. Simple, requires no domain knowledge, but performs poorly — unlikely to surface bugs requiring concurrent multi-fault conditions; provides no coverage metric; cannot terminate when "enough" has been tested.

**Expert-guided selection**: the current state of the art. Expensive; requires expertise that takes years to develop; dependent on the communicability of human intuition — which is limited. An expert's job is not just choosing which experiments to run, but identifying which to *skip* (either because we already know an experiment will trigger a bug, or because a soft dependency means a downstream fault cannot propagate to user-visible failure). Ordering matters: testing X thoroughly before Y can rule out many Y-experiments based on what X-experiments revealed.

**The communicability problem**: human intuition is powerful but opaque — experts trained via the "pain suit" (Rosenthal et al., Netflix Tech Blog 2015, where system alerts are converted to physical sensations on the wearer's skin) develop instinct, not knowledge. Knowledge implies communicability; instinct cannot be trained into others, cannot be documented, cannot be automated.

**Lineage-Driven Fault Injection (LDFI)** (Alvaro, Disorderly Labs): automation of end-to-end experiment selection using distributed tracing infrastructure:
1. Collect traces of successful system executions — these reveal the redundancy structure (failovers, retries, fallbacks, replicated paths) that allowed computation to succeed.
2. Model these traces as Boolean formulae representing "sufficient conditions for success."
3. Submit the formula to a SAT solver: which faults, if injected simultaneously, would eliminate all currently known paths to success? The solution is the highest-value next experiment.
4. Incorporate prioritisation (likelihood of fault, topological graph metrics) via integer linear programming to rank experiments.

**Key insight**: fault tolerance *is* redundancy. A fault-tolerant system is one with enough alternative computation paths that partial failure cannot prevent success. Tracing exposes those paths. LDFI finds the minimal set of simultaneous faults that would eliminate all known paths — i.e., the highest-probability way to disprove the hypothesis.

Deployed with industrial collaborators at Netflix, Huawei, and eBay. Requires a mature distributed tracing infrastructure. The integration work (extracting data from specific tracing deployments, mapping to specific fault injection frameworks) is non-trivial but formulaic.

**Contra Allspaw (ch. 11)**: deliberately positions automation as complementary to human expertise, not as replacement for human judgement. The goal is to automate the *selection* step so humans can focus on what they do uniquely: interpreting surprising results, providing explanations, and repairing bugs.

### Chapter 11 — People in the Loop (John Allspaw)

A philosophical counterargument to automation-first approaches to Chaos Engineering. Allspaw (CTO of Etsy, MSc in Human Factors and Systems Safety from Lund University) argues that Chaos Engineering's power comes precisely from the human cognitive activities it generates — and that automating those away is self-defeating.

**The Substitution Myth** (Hollnagel): the belief that automation can be substituted for human action without changing the rest of the system — that work can be decomposed into tasks that are allocated to humans or machines according to their respective strengths. This is a myth: "capitalising on some strength of computers does not replace a human weakness. It creates new human strengths and weaknesses — often in unanticipated ways." Tasks in real complex systems are highly interdependent; substitution changes the system fundamentally.

**Function allocation / HABA-MABA** (Fitts List, 1951): original framework prescribing which tasks should be allocated to humans vs machines. Allspaw presents this as a useful historical frame — but notes it has been extensively critiqued by Cognitive Systems Engineering for ignoring systemic interdependence.

**Ironies of Automation** (Bainbridge): two key ironies:
1. Designer errors in automation are a major source of operating problems — automation is not bug-free; it requires expertise to maintain.
2. The designer who tries to eliminate the operator still leaves the operator to do the tasks the designer cannot think how to automate.

Applied to chaos experiment selection automation: while automated tooling (see ch. 12) can help generate candidate experiments, it introduces new tasks (maintaining the automation, deciding when to run it, pausing it during incidents) that may exceed the work it eliminates.

**Confidence-building as a human cognitive activity**: the process of forming hypotheses, defining steady state, and interpreting results is valuable *because* it forces engineers to articulate their mental models, expose disagreements, and update their understanding. These are "generative dialogues" — the artifact of the process (the experiment) is less important than the process itself. Automating the process away removes the learning.

**Timing of experiments**: real-world practice is highly context-dependent — experiments are delayed for partner-team deployments, paused during incidents (to avoid ambiguity), or triggered by surprising production behaviour. These contextual judgements require human situational awareness and cannot be reduced to rules.

**People cannot be "out of the loop"**: "People are responsible, and software cannot be. An essential part of being human is the ability to enter into commitments and to be responsible for the courses of action they anticipate. A computer can never enter into a commitment." (Winograd and Flores) — therefore Chaos Engineering ultimately serves to help people fulfil their irreducible responsibility to design and operate complex systems.

### Chapter 10 — Humanistic Chaos (Andy Fleener)

Applies chaos engineering principles to *human and organisational systems*. At SportsEngine, Fleener ran three case studies treating the organisation as a complex system and applying the Principles of Chaos Engineering to its sociotechnical side.

**Core thesis**: organisations are systems of systems. Some are explicit (vacation policy, on-call rota); others are tribal knowledge (only communicate with George via Slack). Tribal knowledge systems are inherently less reliable; poorly mapped explicit systems are worse still. The gap between **work-as-imagined** and **work-as-done** is the primary source of organisational latent risk ("dark debt," from the SNAFUcatchers STELLA report).

**Weak signals**: in technical systems, USE metrics (Utilisation/Saturation/Errors) monitor key bottlenecks before failure becomes loud. The organisational equivalent: "we need to talk to Emma" signals a single point of failure; on-call shifts ending on Monday being more tiring than Friday is a signal approaching a capacity boundary. Dr. Todd Conklin: "You'll never hear a weak signal in failure — the signal in failure is loud." Safety signals must be read during success, not failure.

**Cook's principles of complex systems**: organisations are hazardous (latent failures everywhere); well-defended (catastrophe requires a sequence); and humans play a dual role as both defenders and producers of failure.

**Three case studies**:
1. *Gaming Game Days*: ran incident response Game Days with a deliberately removed subject-matter expert ("X is on vacation today"). Surfaced single points of failure in incident response knowledge. Outcome: engineers who went on long vacations without being paged — the success metric.
2. *Connecting the Dots*: inspired by Etsy's bootcamp concept (every new hire spends time on a different team before joining their team). Implemented a rotation: one engineer from each product team spent a sprint on the Platform Ops team. Also created "Operations Advocate" roles — dedicated Ops engineers assigned to product teams. Both initiatives deliberately injected friction to widen communication pathways. Blast radius from the rotation: production pressure occasionally pulled engineers back; the experiment was eventually ended when margins disappeared.
3. *Changing a Basic Assumption* (Goldratt): employee-driven initiatives — a mentorship programme and Spotify-style team health checks — that started as individual engineer experiments. Both grew into cultural pillars. The key: explicitly stating "I want to try something" and framing it as an experiment with a rollback plan.

**Westrum's organisational typology**: pathological (novelty crushed) → bureaucratic (novelty causes problems) → generative (novelty is implemented). Chaos Engineering experiments on human systems require a generative organisation. Use Westrum's model as a readiness sniff test before attempting larger experiments.

**Leadership as an emergent property** (Barker): leadership is "a phenomenon that moves the organisation forward" — decision-making within bounded context, pushing accountability to the sharp end (practitioners). Local rationality applies.

**Altitude and direction**: every experiment needs margin to avoid catastrophic failure and a stated direction (explicit unacceptable outcome). When rip cords become commonplace, rethink the experiment.

### Chapter 9 — Creating Foresight (Nora Jones)

The most underappreciated chapter in the book: reframes Game Day as a *cognitive exercise* for building resilience culture, not a checklist for finding bugs.

**Three-phase model**: Before / During / After. The industry chronically underinvests in Before (preparation, alignment, framing) and After (debrief, synthesis, follow-up). The During phase is the visible part; Before and After are where the actual learning transfer happens.

**Goal is not finding vulnerabilities**: the primary goal of a Game Day is *distilling expertise from humans* — surfacing the mental models of senior engineers and making them legible and transferable. If no vulnerabilities are found, the exercise still succeeded if mental models were refined. (→ directly contradicts the common framing of "we run chaos to break things and fix them")

**Law of Fluency** (David Woods): *expert performance becomes fluent to the degree that it is opaque to the performer.* Experts cannot perceive their own expertise — they have automatised skills to the point that introspection misrepresents what they actually do. This is why external facilitators and cognitive interviews are essential: the expert cannot self-report what makes them effective.

**Cognitive interviews** (adapted from aviation, medicine, maritime): structured interview technique designed to elicit implicit knowledge from domain experts. Used in the Before phase to extract mental models from the people who know the system best, before the exercise surfaces gaps between what experts assume and what the system actually does.

**Resilience = positive adaptive capacity** (Sidney Dekker): resilience is not the absence of errors or minimising negative outcomes — it is the *enhancement of positive adaptive capabilities*. This distinguishes resilience engineering from traditional reliability engineering. Game Days succeed by measuring whether adaptive capacity grew, not merely whether bugs were found.

**Five Game Day roles**: Designer/Facilitator (third party, not the system expert — ensures objectivity and learning focus); Commander (has authority to abort); Scribe (timestamped record); Observer (watches what humans do, not just what systems do); Correspondent (communicates status externally).

**ChAP experience at Netflix**: Netflix's Chaos Automation Platform ran automated experiments at scale, but the team discovered that mostly only Chaos Engineers ran experiments — not service teams. Automation alone did not solve adoption. The *process* of automating — the dashboard, the surfacing of system behaviour through metrics — created enormous organisational value by making tacit system knowledge legible. The lesson: the artifact of automation is sometimes less valuable than the act of automating.

**Gary Klein — expert vs novice mental models**: experienced engineers use pattern-matching from prior incidents to navigate novel situations; novices follow procedure. Building resilient organisations requires mechanisms to transfer expert pattern libraries — not just procedures — across teams and tenure levels. Game Days are an experiential mechanism for that transfer.

**Automation ironies**: as automation handles normal operations, humans lose the practice needed to handle abnormal operations — precisely the scenarios where automation hands back control. Regular Game Days counteract this by deliberately creating abnormal scenarios that humans must navigate without automation assistance.

## Related Pages

- [[operations/chaos-engineering]] — primary concept page, fully expanded from this source
- [[operations/common-failure-causes]] — cascading failures and emergent failure modes from complex system interactions
- [[operations/availability]] — availability as the business goal chaos engineering serves
- [[operations/testing-for-reliability]] — chaos as the empirical complement to formal testing
- [[concepts/fitness-functions]] — chaos tests as holistic fitness functions
- [[concepts/software-complexity]] — accidental vs essential complexity
- [[operations/observability]] — prerequisite for LDFI and all advanced chaos tooling
- [[patterns/circuit-breaker]] — chaos empirically tests circuit breaker placement and configuration
- [[patterns/bulkhead]] — instance termination tests whether bulkheads isolate blast radius

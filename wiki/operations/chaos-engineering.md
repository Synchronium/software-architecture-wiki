---
title: "Chaos Engineering"
type: concept
tags: [chaos-engineering, resiliency, fault-injection, testing, reliability, availability, complexity, sociotechnical]
sources: [release-it, chaos-engineering]
created: 2026-05-19
updated: 2026-05-28
---

# Chaos Engineering

## Definition

Chaos engineering is "the discipline of experimenting on a distributed system in order to build confidence in the system's capability to withstand turbulent conditions in production." (→ [[sources/release-it]] ch. 17, citing principlesofchaos.org; also [[sources/chaos-engineering]] introduction)

It is empirical, not formal: experiments are run against the real system to learn what it *does*, not models to verify what it *should* do. The purpose is to build *confidence* — if you have other reliable means of building confidence, chaos may not be necessary. (→ [[sources/chaos-engineering]] introduction)

The discipline originated at Netflix in 2011–2015. Chaos Monkey — which randomly terminated one instance per cluster per day during business hours — was created to force all teams to make their services resilient to vanishing instances. Critically, it is "a management principle instantiated in running code": it aligns the organisation toward a shared goal while remaining *loosely coupled* as to how each team achieves resilience. Regional failover simulation (Chaos Kong) followed the 2012 Christmas Eve AWS outage. The formal Principles of Chaos Engineering were published in 2015. (→ [[sources/chaos-engineering]] introduction)

## Why Complex Systems Require Chaos Engineering

Distributed systems are *complex* in the technical sense: nonlinear, unpredictable in output, and impossible for any single person to hold a complete mental model of. (→ [[sources/chaos-engineering]] ch. 1)

| Simple systems | Complex systems |
|---|---|
| Linear | Nonlinear |
| Predictable output | Unpredictable behaviour |
| One person can model in full | Impossible to build a complete mental model |

The *Law of Requisite Variety* (Ashby): any control system must be at least as complex as the system it controls. Since most software involves writing control systems, complexity grows as a natural consequence of building software.

Complexity cannot be sustainably reduced:
- **Accidental complexity** (Brooks): accumulates as a byproduct of every compromise made during development. Refactoring can reduce it temporarily, but the refactor itself introduces new accidental complexity; the reduction is not sustainable.
- **Essential complexity** (Brooks): required by new features and safety properties. Making a system more available, more secure, or more observable necessarily adds complexity. You cannot reduce complexity and add features simultaneously.

The practical implication: emergent failures arise from unanticipated interactions between individually well-designed components — failures no single engineer could have foreseen. Traditional testing verifies individual components; chaos engineering tests the emergent behaviour of the composition. (→ [[sources/chaos-engineering]] ch. 1)

> **Contradiction with traditional QA thinking**: Test-driven development and pre-production testing verify that individual components behave correctly. Chaos engineering addresses the gap between correct components and correct composition. Safety is not a composable property — see below.

## Why Production, Not Staging

Staging environments are never full-size replicas of production; their economics make that impossible. Certain system properties only emerge at production scale:

- Cascading failures and retry storms (triggered by specific load/component ratios)
- Dogpile effects (synchronised cache expiry under load)
- Single points of failure that have never failed in controlled environments
- Network congestion behaviour (congested networks are qualitatively different from uncongested ones)

More importantly: **safety is not a composable property**. Two services that are individually safe may not be safe in composition. Example: client enforces a 50 ms timeout; each of two providers has P99.9 latency of 30 ms — each call is individually safe, but a sequential call to both will breach the timeout for a meaningful percentage of requests. This emergent failure mode is invisible from component-level testing. (→ [[sources/chaos-engineering]] ch. 2)

## Dynamic Safety Model

Adapted from Jens Rasmussen's Dynamic Safety Model (resilience engineering). Three properties constrain every engineer: **Economics**, **Workload**, and **Safety**. Engineers naturally develop intuitions for Economics and Workload, but rarely for Safety — incidents almost always come as surprises because engineers lack the feedback signals needed to sense when they are drifting toward the safety boundary. (→ [[sources/chaos-engineering]] ch. 2)

This optimisation gradient is dangerous: because Economics and Workload are visible, engineers drift *toward* those poles — and thereby *away* from Safety, silently, as the system "improves."

Chaos Engineering provides empirical feedback about the Safety boundary. Once engineers develop an intuition for it, they implicitly modify their behaviour to maintain a safety margin — without being told to, and without imposing process. This is the model's primary explanation for why Chaos Engineering changes organisational behaviour, not just fixes bugs.

## Economic Pillars of Complexity

Adapted from Kent Beck (informed by Enrico Zaninotto). Four pillars determine how well an organisation can navigate complexity: **State**, **Relationships**, **Environment**, and **Reversibility**. (→ [[sources/chaos-engineering]] ch. 2)

Software engineering is structurally disadvantaged on the first three pillars:
- **State** proliferates as a byproduct of adding features and persisting data — cannot be reduced without reducing utility.
- **Relationships** multiply as software adds layers of abstraction; microservices and remote teams deliberately increase them.
- **Environment** can only be influenced by the very largest organisations.

**Reversibility** is where software uniquely excels. Version control, blue–green deployment, feature flags, canaries, CI/CD, and short iteration cycles all improve Reversibility. The Agile/XP movement was fundamentally a movement to improve Reversibility: short iterations make it affordable to reverse design decisions.

Chaos Engineering acts as a floodlight identifying brittleness — places where efficiency has been optimised at the expense of Reversibility. Surfacing that brittleness allows teams to choose: un-optimise for efficiency, or invest in Reversibility so the rest of the system can improvise when that piece breaks.

> **Synthesis**: The Dynamic Safety Model explains the *behavioural* value of chaos engineering (develops safety intuition). The Economic Pillars model explains the *architectural* value (identifies targets for Reversibility improvement). Together they ground chaos engineering as a systemic discipline, not a collection of fault injection scripts.

## Experimentation vs Testing

A critical distinction from ch. 3: Chaos Engineering is *experimentation*, not *testing*. (→ [[sources/chaos-engineering]] ch. 3)

- **Testing** verifies *known* properties: a test is an assertion based on existing knowledge; running it collapses a known question to true/false. Testing does not create new knowledge.
- **Experimentation** creates *new* knowledge: a hypothesis is proposed; a disproved hypothesis reveals something previously unknown about the system. In complex systems, the reason a hypothesis fails is often itself non-obvious.

It follows that "integration tests to find the same things" cannot substitute for chaos experiments — the human writing the test must already know the property to assert. Chaos experiments discover properties nobody knew to look for.

**Verification over validation**: Chaos Engineering cares whether something works, not *how*. Verification examines output at a system boundary (does clean water come out of the tap?). Validation inspects internal parts and builds mental models (are all the pipes in order?). In complex systems, all components can pass validation while still producing bad output due to unanticipated interactions.

**Not "breaking stuff"**: Chaos Engineering is better characterised as *fixing stuff in production*. Breaking is trivial; the difficult work is mitigating blast radius, reasoning about what is worth investigating, and making the chaos inherent in the system *visible* rather than hiding it.

**Not Antifragility**: Taleb's Antifragility proposes adding chaos so the system grows stronger in response. Resilience Engineering (the scholarly basis of Chaos Engineering) diverges: studying *what goes right* is more informative than hunting weaknesses; redundancy can cause failure as easily as prevent it. The two frameworks are fundamentally different pursuits. (→ [[sources/chaos-engineering]] ch. 3)

## The Five Advanced Principles

The Principles of Chaos Engineering define the gold standard for the practice. (→ [[sources/chaos-engineering]] ch. 3; also [[sources/release-it]] ch. 17)

1. **Build a hypothesis around steady-state behaviour**: define the system's normal measurable output first; then form the hypothesis that this steady state will hold under turbulent conditions. Focuses on KPIs and business-visible outputs — not internal implementation. Favours verification over validation.

2. **Vary real-world events**: choose variables that reflect actual failure modes, not what is easy to do. Terminating an instance, pegging CPU, filling RAM, and filling disk all look the same to the system — learning nothing beyond what a simple instance termination reveals. Most interesting availability experiments reduce to *latency injection* and *status code changes*; these require real engineering investment in IPC layers (sidecars, service meshes, client wrappers) but produce the most signal.

3. **Run experiments in production**: experimentation teaches about the system under study. Staging environments differ from production in ways humans cannot fully predict. Building confidence in staging builds confidence in staging. The advanced principle runs experiments in production, with blast radius controls.

4. **Automate experiments to run continuously**: (a) the solution space of complex-system vulnerabilities is unknowable and too large for manual exploration; (b) dependencies change over time in ways the primary team cannot track. Continuous automation catches regressions and teaches operators how their own system is evolving.

5. **Minimise blast radius**: use control vs experimental group design, shadow traffic, session stickiness, high-value-request exclusions, or automated retry to limit the customer impact of a disproved hypothesis. Minimising blast radius also sharpens signal — a small variable group stands out sharply against a small control group.

## Theoretical Foundations

**Drift into failure** (Dekker, *Drift into Failure*): economic pressure continuously pushes systems toward safety boundaries. Highly optimised, highly efficient systems handle disruption badly — they break catastrophically rather than gracefully. Chaos engineering creates a countervailing force that optimises for availability and disruption tolerance, not just throughput.

**Fundamental regulator paradox** (Weinberg, *General Principles of Systems Design*): the better a regulator suppresses variation, the less information it generates about its own quality. "You don't know how much you depend on your IT staff until they go on vacation." The same applies to stability mechanisms that are never exercised.

**Volkswagen microbus paradox**: you learn to fix what breaks often; what rarely breaks stays mysterious — and when it does break, the situation is worse because no one knows how to fix it. Controlled low-level breakage prevents expertise atrophy.

**Antifragility** (Taleb, *Antifragile*): Rosenthal & Jones argue chaos engineering is *not* antifragility — see Experimentation vs Testing section above. (→ [[sources/chaos-engineering]] ch. 3)

## Game Days and Structured Exercises

For legacy systems not designed for fault tolerance, or for any team starting out, structured **Game Day** exercises are a practical alternative to automated chaos tooling. (→ [[sources/chaos-engineering]] ch. 4 — Slack Disasterpiece Theater)

**Prerequisites before running any chaos** (automated or manual):
- Spare capacity online — at least one extra node above expected load
- Automated instance removal on health failure
- Automated instance replacement (replacement must complete within mean time between failures)
- Automated failover for leader/follower data systems
- Correct timeout and retry policies (exponential backoff + jitter) in all dependent services

**Disasterpiece Theater process** (Slack's Game Day model):
1. *Preparation*: choose failure mode and simulation strategy; survey dev and prod environments; identify alerts, dashboards, metrics expected to fire; identify redundancies and runbooks; invite all relevant engineers.
2. *Exercise*: dev run first; go/no-go gate before moving to prod; designated note taker with timestamped records; explicit abort threshold defined in advance.
3. *Debriefing*: time-to-detect, time-to-recover; what humans did that computers should have done; where monitoring is blind; assumptions invalidated; what on-call would need to do in an unplanned incident.

**Failure technique progression**: process stop → instance termination → iptables network disconnect (manifests as timeouts, not connection refused) → partial/asymmetric network partition. Most interesting availability experiments reduce to *latency injection* and *status code changes* — pegging CPU/RAM/disk teaches nothing beyond what an instance termination reveals.

**DiRT rules of engagement** (Google, since 2006): (→ [[sources/chaos-engineering]] ch. 5)
1. No SLO-breaking impact on external users — SLO is the safety boundary; have a "big red button" rollback.
2. Real production emergencies always take precedence — halt and postpone if a real incident occurs.
3. Transparency — all DiRT test communications marked explicitly; distinctive themes prevent confusion with real incidents.
4. Minimise cost, maximise value — known-broken systems need engineering, not disaster tests; retest only when failure modes are genuinely unknown.
5. Treat DiRT as actual outages — "escalate as normal"; laxity because "it's just a test" wastes the learning opportunity.

**Hyrum's Law** (coined at Google): "With a sufficient number of users of an API, it does not matter what you promise in the contract: all observable behaviours of your system will be depended on by somebody." Applies to reliability and latency characteristics as much as data contracts — systems that consistently exceed their SLO create an implicit contract at *observed* performance, not at *specified* performance. Running at published SLO levels is itself a form of chaos test.

## Prerequisites

Before running chaos in production:

1. **Irreplaceable-request check**: if every request is irreplaceable (financial transactions with no idempotency), chaos engineering may not be appropriate. You must be able to break the system without breaking the business.
2. **Blast radius control**: identify how to limit the fraction of users or requests affected (e.g., every 10,000th request fails; criteria-based victim selection rather than pure randomness).
3. **Distributed tracing**: trace each request through the system to determine whether it ultimately succeeded or failed, despite injected faults. Both outcomes are informative.
4. **Meaningful monitoring**: you must be able to detect when failure rates shift by small amounts. "If you have a wall full of green dashboards, that means your monitoring tools aren't good enough" (Charity Majors). Monitoring infrastructure must be independent of production traffic paths.
5. **Recovery plan**: the system may not auto-recover when the chaos test ends. Know what to restart, disconnect, or clean up.

## Designing the Experiment

1. **Form a hypothesis**: expressed as an invariant the system should maintain under turbulent conditions. Focus on externally observable behaviour, not internals. Example: "Clustered services should remain functional when any single instance is terminated."
2. **Define steady state**: verify you can currently measure whether the steady state holds. Identify monitoring blind spots before injecting chaos.
3. **Define rejection criteria**: what evidence would falsify the hypothesis? Account for baseline noise (mobile aborts, expected failure rates under normal operation). Statistical rigor prevents false conclusions.
4. **Inject fault**: apply one of the injection types below.
5. **Observe**: compare experimental group vs control group.

**Big red button**: every experiment — automated or manual — must have an immediate abort mechanism that returns the system to steady state with a single action. The 2018 Hawaii missile false alarm is an instructive analogy: real and test actions placed in the same dropdown caused catastrophic confusion. Chaos engineering UIs must make abort unambiguous and one-click. (→ [[sources/chaos-engineering]] ch. 7)

**Blast radius progression** (LinkedIn's model): self-browser only (no member impact) → employees only → controlled member percentages via A/B framework → wider production. Never skip levels; each validates confidence before widening exposure. (→ [[sources/chaos-engineering]] ch. 7)

## Injection Types

| Injection | Tool | What it finds |
|-----------|------|--------------|
| Instance termination | Chaos Monkey | Missing autoscaling; configuration problems; implicit singleton roles |
| Latency injection | Latency Monkey | Missing timeouts; race conditions exposed by out-of-order responses |
| Service-to-service call failure | FIT (Netflix) | Missing fallbacks; cascading failure paths; over-reliance on non-critical services |
| Region termination | Chaos Kong | Cross-region resilience; DNS failover correctness |

**FIT (Failure Injection Testing)**: tag a request at the API gateway with a cookie specifying "when G calls H, fail this call." At the call site, the framework reads the cookie and reports failure without making the network call. Enables precise, controllable testing of deep call trees without infrastructure disruption.

## Experiment Prioritisation

No team can cover all possible failure modes — experiment selection has an outsized impact on value returned. Prioritise by three properties: (→ [[sources/chaos-engineering]] ch. 6)

1. **Frequency**: what events will definitely happen? Deployments, credential rotations, certificate renewals, DST changes, OS patches. Practise these *more often than required* — "we get good at things we do often." If credentials rotation hasn't been exercised in six months, it cannot be trusted when needed.
2. **Graceful tolerance**: what failures must the system survive vs which are accepted as total loss? Focus experiments on the former; there is no value in repeatedly confirming a system cannot survive a global natural disaster.
3. **Imminence**: known upcoming threats (peak traffic events, imminent security vulnerabilities, planned dependency migrations) should be elevated to top priority once imminent, regardless of normal cadence.

**Outcome categories** (Microsoft):
- *Known event / expected consequence*: steady-state. Build coverage and comfort with tooling.
- *Known event / unexpected consequence*: controlled fault, unplanned outcome. Abort, record, follow up. High learning value.
- *Unknown event / unexpected consequence*: compounding failures beyond anticipated scope. Engage human response. Highest long-term learning value — reveals blind spots.

**Failure variation spectrum**:
- **Isolated**: single component; clear cause-and-effect; low blast radius; start here.
- **Combined**: multiple simultaneous failures; more realistic; harder to diagnose; higher risk of cascade.
- **Compounded**: failures propagating upstream or downstream beyond the experiment boundary; plan and test the recovery procedure *before* executing; can expand blast radius beyond safety assumptions.

## Targeting Strategy

**Start with randomness**: most immature systems have so many problems that random injection (random cluster, random instance) will uncover something significant immediately.

**Progress to targeted injection**: as easy problems are fixed, the search space becomes sparse but non-uniform. Apply knowledge of the call tree: a top-level request generates a tree of supporting calls; removing one node either succeeds (revealing redundancy) or fails (revealing a crucial dependency). Both outcomes are valuable.

**Learn from non-failures**: cases where a fault was injected but the request succeeded reveal redundancy paths. These are as important as failure cases — they document where safety exists, so it isn't accidentally removed.

**Cunning malevolent intelligence** (Peter Alvaro, UC Santa Cruz): collect traces of normal workload; build a graph of service dependencies; use graph algorithms to find crucial links to cut; automatically learn about redundancy from successful injections. Dramatically narrows the search space as the system matures.

## Opt-In vs Opt-Out

- **Opt-out** (Netflix model): all services are subject to Chaos Monkey by default; exemptions require explicit sign-off and carry engineering-management review. Higher coverage, higher reliability improvement.
- **Opt-in**: lower resistance, easier to start, but adoption rates are much lower.

Recommended strategy: start opt-in to build success stories and organizational confidence, then migrate to opt-out as the culture matures.

## Automation and Moderation

Once a vulnerability class is found, automate the injection. Apply constraints to prevent the automation from being destructive:
- Never kill the last instance in a cluster.
- Don't simultaneously fail all fallbacks for a service.
- Gate side effects (emails, payments) — especially important during any kind of reprocessing.

A **chaos automation platform** (e.g., Netflix's ChAP) manages what injections to apply, to whom, and when, while enforcing safety constraints and reporting test events to monitoring systems for correlation with production behaviour.

## Game Days as Cognitive Exercises

The most underappreciated purpose of a Game Day is *distilling expertise from humans*, not finding bugs. If no vulnerabilities are found but senior engineers articulate mental models that junior engineers absorb — the exercise succeeded. (→ [[sources/chaos-engineering]] ch. 9)

**The Law of Fluency** (David Woods): expert performance becomes opaque to the expert. Automatised skills cannot be accurately self-reported. An external facilitator and structured cognitive interviews are required to surface the implicit knowledge that makes experienced engineers effective. Self-documentation by the expert misrepresents what they actually do.

**Resilience as positive adaptive capacity** (Dekker): resilience is not minimising errors — it is enhancing the organisation's capacity to adapt successfully to disruption. Game Days succeed when adaptive capacity grows, not merely when bugs are patched.

**Five Game Day roles**: Designer/Facilitator (third party, not the system expert — preserves objectivity and learning focus); Commander (authority to abort); Scribe (timestamped log); Observer (watches what humans do, not just what systems do); Correspondent (external communication).

**Cognitive interviews** (adapted from aviation, medicine, maritime): structured Before-phase technique to elicit implicit knowledge from domain experts before the exercise surfaces the gap between what experts assume and what the system actually does.

**Three-phase model**: Before / During / After. The industry chronically underinvests in Before and After — the phases where mental model transfer actually occurs. (→ [[sources/chaos-engineering]] ch. 9)

**Automation ironies**: as automation handles normal operations, humans lose the practice needed for abnormal operations — exactly when automation hands control back to humans. Regular Game Days counteract expertise atrophy by creating deliberate abnormal scenarios. (→ [[sources/chaos-engineering]] ch. 9)

**ChAP at Netflix**: automation alone did not drive adoption — mostly only Chaos Engineers ran experiments, not service teams. The *process* of automating, and the dashboards it produced, created organisational value by making tacit system behaviour legible. The artifact of automation is sometimes less valuable than the act of automating.

## Regulated Environments and Financial Services

In regulated industries (banking, healthcare), chaos engineering requires adaptations: (→ [[sources/chaos-engineering]] ch. 8)

- **Audit trail is non-negotiable**: every chaos action must be attributable and logged. This typically rules out third-party tools with limited compliance support; in-house platforms are preferred.
- **Compliance as evangelism lever**: linking chaos engineering to regulatory obligations and audit requirements is often more persuasive to leadership than reliability arguments alone.
- **Chaos in CI/CD**: running chaos tests as a gate before traffic cutover eliminates the scheduling overhead of separate experiment days and ensures coverage tracks deployments.
- **Co-creation team model**: a core chaos engineering team pairs with embedded application engineers who own their services. Prevents the chaos team from becoming a siloed "chaos taxi" disconnected from service context.
- **ROI via call volume reduction**: support call volume is convertible to dollar value and satisfies finance stakeholders. Receiving an alert during an experiment = failing the experiment. Defining success metrics in advance forces clarity about what "correctly functioning" means.

## Disaster Simulations (Human Side)

Chaos engineering applies to the human side of systems too. Organisations are complex systems — some structures are explicit (on-call rota, vacation policy), others are tribal knowledge ("only contact George via Slack"). The gap between **work-as-imagined** and **work-as-done** is the primary source of organisational latent risk — called "dark debt" in the SNAFUcatchers STELLA report. (→ [[sources/chaos-engineering]] ch. 10)

**Weak signals**: in technical systems, USE metrics monitor bottlenecks before failure becomes loud. Organisationally: "we need to talk to Emma" signals a single point of failure; an on-call shift ending Monday being more tiring than Friday is a signal approaching a capacity boundary. Read weak signals during success, not failure — by the time failure arrives, the signal is too loud to be useful. (→ [[sources/chaos-engineering]] ch. 10)

**Zombie simulation**: randomly designate a percentage of staff as "unavailable for the day" (they cannot respond to communications or perform work tasks). Observe what breaks. Review issues in a postmortem format; resolve through documentation, role distribution, or automation.

**Expert single-point-of-failure Game Day**: run a Game Day and declare the subject-matter expert "on vacation." Observe how the incident response degrades. Outcome metric: engineers who take long vacations without being paged. (→ [[sources/chaos-engineering]] ch. 10)

**Communication as network latency**: cross-team communication is the latency of the organisational distributed system. Frameworks like Scrum and Kanban work well under low latency; they degrade when communication must cross team or department boundaries. Deliberate rotation programmes (engineers spending sprints on other teams) create new trusted relationships — mesh connections that survive the departure of any individual node. (→ [[sources/chaos-engineering]] ch. 10)

**Westrum's organisational typology**: pathological (novelty crushed) → bureaucratic (novelty causes problems) → generative (novelty is implemented). Chaos experiments on human systems require at minimum a generative environment. Use Westrum's model as a readiness sniff test before attempting significant organisational experiments. (→ [[sources/chaos-engineering]] ch. 10)

Apply incrementally: confirm you can operate at normal load with 20% zombie rate before introducing concurrent system fault injection.

## Continuous Verification

**Continuous Verification (CV)** is the natural extension of CI/CD: a discipline of proactive experimentation implemented as tooling that verifies system behaviours against business-visible expectations in production. (→ [[sources/chaos-engineering]] ch. 16)

| Practice | What it checks | Reactive/Proactive |
|---|---|---|
| Continuous Integration | Internal code integration | Reactive (on commit) |
| Continuous Delivery | Deployment pipeline | Reactive (on build) |
| Continuous Verification | System output vs expectations | Proactive (ongoing) |

**Why CV**: complex systems are open-ended and in constant flux. Validation (do internals match spec?) cannot keep pace. Verification (does output meet expectation?) is more pragmatic and focuses on business outcomes rather than implementation correctness. CV specifically addresses systemic properties — availability, resilience — that pre-production testing cannot cover.

**CV spectrum**:
- *Automated canaries*: variable group receives new code branch; control group runs current code; CD promotes only if hypothesis holds. Chaos Engineering applied to deployments.
- *Chaos automation platforms* (ChAP at Netflix): continuously running experiments, fully automated create/prioritise/execute/terminate cycle.
- *Holistic visualisation tools* (Vizceral at Netflix): allow a human to glance at the global state of a complex system and develop intuition without inspecting individual metrics.

**CI/CD/CV integration**: with minor modification, a chaos automation platform can be inserted as a stage in the CD pipeline — a gate that must pass before production traffic is fully shifted to new code. This is the most mature form of chaos engineering adoption.

## Chaos Maturity Model

A two-axis framework for assessing and developing a Chaos Engineering programme. (→ [[sources/chaos-engineering]] ch. 15)

**Adoption axis** — how widely the practice has spread:
- Individual contributor on a single team
- Multiple application teams; early SRE/DevOps champions
- Dedicated Chaos Engineering team (centralised, cross-functional)
- Responsibility of all individual contributors organisation-wide (the DevOps end-state)

Prerequisites before beginning: monitoring capable of detecting degraded state (not merely offline); social awareness that experiments are happening; honest expectation the hypothesis should hold before running it; organisational alignment to act on findings.

**Sophistication axis** — how mature the tooling and process are:
1. **Game Days**: manual, high-value initially, human-intensive, does not scale.
2. **Fault injection consultation**: shared fault injection framework; facilitator runs experiments alongside teams; cross-team knowledge transfer begins.
3. **Self-service tools**: teams operate the framework independently; facilitator provides setup and interpretation guidance.
4. **Experimentation platform**: control group + variable group; request stickiness; subsample traffic; multiple simultaneous production experiments.
5. **Automation**: KPI-triggered abort (dead robot's switch); automatic service detection; prioritisation heuristics; fully automated create/prioritise/execute/terminate cycle.

**Experiment layer progression**: Infrastructure (instance/region termination) → Application (IPC injection between services) → Business Logic (plausible unexpected responses). Most teams start at infrastructure; maturity moves up the stack.

**Adoption drivers**: post-incident momentum is the most common inflection point ("Never let a good crisis go to waste"). Top-down adoption (CISO/CIO mandate) follows bottom-up advocacy from teams carrying pagers.

## ROI and Business Justification

The attribution challenge: chaos engineering operates by preventing incidents that never occur. "No one tells the story of the incident that didn't happen." Successful programmes are self-limiting: improved availability releases business pressure to ship features faster, which increases complexity, which may offset the gains. The signal erases itself. (→ [[sources/chaos-engineering]] ch. 13)

**Kirkpatrick Model** for evaluating ROI (from educational training):
- **Level 1 — Reaction**: survey participants — did they learn something? Sufficient for lightweight programmes.
- **Level 2 — Learning**: enumerate what was discovered — record disproved hypotheses, capture facilitator notes. ChAP at Netflix operated at this level: "SPS saved" (starts-per-second that would have been lost if the discovered vulnerability had manifested in production) was computed per disproved hypothesis, summed over time, and presented as a chart going up-and-to-the-right each month.
- **Level 3 — Transfer**: observe behaviour changes — engineers fixing vulnerabilities, building more robustly, allocating more to safety.
- **Level 4 — Results**: correlate with business outcomes — reduced downtime, fewer incidents, less degraded operation time. Most difficult; only necessary if a strong formal case is required.

**Collateral ROI**: value accrued outside the primary goal. The stakeholder assembly and scenario design before a Game Day surfaces knowledge silos and high-probability failures — this is valuable even if the experiment never runs. The team formation effect (people who have never worked together learning each other's communication style) pays dividends during real incidents.

## Automated Experiment Selection

The combinatorial explosion problem: a 20-service distributed system has over one million distinct combinations of node crashes alone. Random selection is computationally tractable but cannot cover multi-fault interactions. Expert-guided selection is powerful but expensive and depends on intuition that is difficult to communicate and transfer. (→ [[sources/chaos-engineering]] ch. 12)

**Lineage-Driven Fault Injection (LDFI)** (Alvaro, Disorderly Labs): uses distributed tracing to automate experiment selection:
1. Collect traces of successful executions — these expose the redundancy structure (failovers, retries, replicas) that allowed computation to succeed.
2. Model traces as Boolean formulae: "sufficient conditions for success."
3. Submit to a SAT solver: which minimal set of simultaneous faults eliminates all known success paths? That set is the highest-value next experiment.
4. Prioritise by fault likelihood and topological metrics via integer linear programming.

Fault tolerance *is* redundancy: a system is fault-tolerant precisely if it provides enough alternative computation paths that partial failure cannot prevent success. Tracing makes those paths legible; LDFI systematically finds the experiments most likely to find the gaps. Requires mature distributed tracing infrastructure; has been deployed at Netflix, Huawei, and eBay.

Appropriately calibrated, LDFI does not replace human judgement — it automates the *selection* step so humans can focus on interpreting surprising results, providing explanations, and repairing bugs.

## Automation and Human Judgement

Proposals to "automate Chaos Engineering" run into a fundamental tension: the discipline's value comes from the human cognitive activities it generates, not just the experiments it runs. (→ [[sources/chaos-engineering]] ch. 11 — Allspaw)

**The Substitution Myth** (Hollnagel, via Allspaw): automation cannot be substituted for human action without changing the system. "Capitalising on some strength of computers does not replace a human weakness — it creates new human strengths and weaknesses, often in unanticipated ways." Tasks in complex systems are highly interdependent; any automation changes the system in ways the automation's designer cannot fully predict.

**Ironies of Automation** (Bainbridge): designer errors in automation become operating problems; automation intended to reduce human workload typically adds new tasks (maintenance, oversight, deciding when to pause it) that may exceed the work it eliminates.

**Confidence as generative dialogue**: forming hypotheses, defining steady state, and interpreting results forces engineers to articulate mental models and expose disagreements. These dialogues are where much of the value lies. Automating the process away removes the learning, even if the experiments continue to run. Automated tooling is most valuable for *generating candidate experiments* for human review — not for replacing the human judgement involved in selecting, timing, and interpreting them.

**Context-sensitive timing**: experiments are delayed for partner deployments, paused during incidents to avoid ambiguity, triggered by surprising production behaviour. These judgements require situational awareness that cannot be reduced to rules. People cannot be "out of the loop" — they are the ones responsible, and software cannot be. (→ [[sources/chaos-engineering]] ch. 11)

## Security Chaos Engineering

**Security Chaos Engineering (SCE)**: "The identification of security control failures through proactive experimentation to build confidence in the system's ability to defend against malicious conditions in production." (→ [[sources/chaos-engineering]] ch. 20)

Most security incidents are caused by misconfiguration, human error, and "system glitches" — not sophisticated attackers. The traditional root-cause-and-blame model entrenches these failures rather than eliminating them, and produces point-in-time assessments that become stale as the surrounding system changes.

**Security controls drift after Day 0**: controls are designed for the initial production state. The system around them changes continuously via CI/CD. Security must have continuous feedback loops to detect when controls have drifted into unknown failure states.

**SCE vs Red/Purple Teaming**: Red/Purple Team exercises are run infrequently, produce reports that quickly become stale, and incentivise adversarial dynamics over shared learning. SCE is continuous, isolated, controlled, and collaborative. It focuses on systemic vulnerabilities rather than attack chain exploits.

**Security Game Days**: introduce controlled security failure conditions to measure: how effectively detection tools identified the failure; which tools provided actionable signal; whether the system operated as intended. Identical mechanics to availability Game Days.

**"Do Less, Better"** (Nwatu, Netflix): build fewer security controls, but verify empirically that they work. Without feedback loops, security controls that were effective on Day 0 silently drift into ineffectiveness as the system evolves around them.

**Antipattern**: root-cause analysis in security produces the same dysfunction as in availability — blame and isolation rather than systemic learning. "What you call root cause is simply the place where you stop looking any further." (Dekker)

## Related Concepts

- [[operations/monitoring]] — prerequisite: monitoring must detect small changes in failure rates; chaos tests are annotated as events on dashboards
- [[operations/availability]] — chaos engineering operationally validates SLO targets and resiliency mechanisms
- [[operations/testing-for-reliability]] — Chaos Monkey and Jepsen are statistical testing tools; statistical test techniques (seed logging, replay) covered there
- [[operations/common-failure-causes]] — drift into failure; cascading failures and composability of safety; emergent failures from complex system interactions
- [[concepts/fitness-functions]] — chaos tests are a category of holistic fitness function; some teams run chaos in CI pipelines
- [[concepts/software-complexity]] — accidental vs essential complexity; why complexity cannot be sustainably reduced and chaos experiments are therefore permanently necessary
- [[patterns/circuit-breaker]] — chaos is the empirical test of whether circuit breakers are correctly placed and configured
- [[patterns/bulkhead]] — instance termination tests whether bulkheads actually isolate blast radius
- [[operations/observability]] — distributed tracing is a prerequisite for chaos experiments

---
title: "Software Architecture Metrics"
type: source
tags: [architecture, metrics, fitness-functions, modularity, evolutionary-architecture, devops, ddd]
sources: [software-architecture-metrics]
created: 2026-05-21
updated: 2026-05-22
---

# Software Architecture Metrics

**Editor:** [[authors/christian-ciceri]]
**Contributing authors:** [[authors/andrew-harmel-law]] (ch. 1), [[authors/rene-weiss]] (ch. 2), [[authors/dave-farley]] (ch. 3), [[authors/carola-lilienthal]] (ch. 4), [[authors/christian-ciceri]] (ch. 5), [[authors/joao-rosa]] (ch. 6), [[authors/eoin-woods]] (ch. 7), [[authors/neal-ford]] (ch. 8), [[authors/alexander-von-zitzewitz]] (ch. 9), [[authors/michael-keeling]] (ch. 10)
**Published:** 2022 (O'Reilly)
**Slug:** `software-architecture-metrics`

## Overview

*Software Architecture Metrics* is an edited collection of ten chapters by different practitioners, each addressing a specific dimension of making architecture decisions measurable. The unifying thesis is that software architecture quality is not a matter of taste or experience alone — it can be observed, quantified, and governed through empirical feedback loops.

The book spans three levels of abstraction. At the delivery level (Harmel-Law, Farley, Ciceri), it connects architecture to the four DORA metrics, continuous delivery practices, and trunk stability. At the structural level (Lilienthal, von Zitzewitz), it provides cognitive-science-grounded and graph-theoretic metrics for measuring modularity and architectural erosion. At the strategic level (Rosa, Keeling, Weiss, Woods, Ford), it addresses how measurement should be goal-directed, stakeholder-aligned, and automated into fitness functions.

The book does not propose a unified measurement framework — each chapter reflects its author's independent practice. Its value lies in the breadth of lenses it provides, and in repeatedly demonstrating that measurement is not a reporting exercise but an architectural and organisational feedback mechanism.

## Key Claims

- Metrics are only useful when tied to explicit goals; untargeted measurement is noise (→ ch. 10)
- The four DORA key metrics are among the most valuable architectural metrics because they generate authentic team conversations and expose architectural constraints on delivery (→ ch. 1)
- Testability is the most reliable driver of all five sustainable design attributes; designing for testability produces the same structural outcomes as applying design principles directly (→ ch. 3)
- Without a metrics-based feedback loop, 80% of nontrivial systems exceeding 100,000 lines of code become Big Balls of Mud (→ ch. 9)
- Software architecture is sociotechnical: Conway's Law determines structure without intentional direction; KPIs must bridge organisational goals and technical metrics (→ ch. 6)
- Trunk stability is a prerequisite for meaningful architectural metrics — a broken trunk corrupts all quality signals (→ ch. 5)
- Fitness functions transform metrics into governance: the same transformation CI did for code integration (→ ch. 8)

## Chapter Notes

### Chapter 1 — Four Key Metrics Unleashed (Andrew Harmel-Law)

The four DORA metrics — deployment frequency, lead time for changes, change failure rate, time to restore service — are reframed as architectural tools. High performers in all four simultaneously have fewer architectural constraints on delivery. Harmel-Law describes four pipeline topology variants (single, multiple end-to-end, subpipeline chain, fan-in), concrete instrumentation points (commit timestamp, deploy timestamp, failure ticket open/close), and a minimal viable dashboard. Key argument: the metrics are not gameable, and their real value is the team conversations and self-directed improvements they generate, not the numbers themselves.

> "That's what places the four key metrics among the most valuable architectural metrics out there." — Harmel-Law

See [[concepts/four-key-metrics]] for the full treatment.

### Chapter 2 — Fitness Function Testing Pyramid (René Weiss)

Extends the evolutionary architecture fitness function taxonomy with a seven-step development process (stakeholder quality goals → draft → prioritise → finalise → automate → visualise → iterate) and anchors each fitness function to ISO 25010 quality attributes. The fitness function testing pyramid provides three layers — triggered atomic (code coverage, static analysis, simple perf) at the base; triggered holistic or continuous atomic (integration tests, production monitoring) in the middle; continuous holistic or triggered holistic in production (chaos engineering, business KPIs, zero-downtime tests) at the top — balancing cost and confidence.

See [[concepts/fitness-functions]] for the full taxonomy.

### Chapter 3 — Evolutionary Architecture: Guiding Architecture with Testability and Deployability (Dave Farley)

Argues that testability, not design principles applied directly, is the most reliable driver of the five sustainable design attributes: modularity, cohesion, separation of concerns, abstraction/information hiding, and low coupling. Code designed to be testable is inherently well-structured. TDD provides real-time architectural feedback before implementation locks in bad decisions. Deployability is an architectural property — the scope of a deployment pipeline equals the scope of an independently deployable unit. Architectural descriptions should be "tourist maps": highlight landmarks, suppress irrelevant detail; over-specified diagrams become outdated immediately.

See [[concepts/evolutionary-architecture]] and [[concepts/deployment-pipelines]].

### Chapter 4 — Improve Your Architecture with the Modularity Maturity Index (Carola Lilienthal)

The Modularity Maturity Index (MMI) is a 0–10 empirical score developed from 300+ architecture reviews, grounded in cognitive science rather than formal theory. Three weighted principles: modularity/chunking (45%), hierarchy (30%), pattern consistency/schema theory (25%). Decision thresholds: MMI < 4 → consider replacement; 4–8 → refactor; > 8 → low debt. Architecture erosion is the default outcome without continuous improvement cycles — each change slows as debt compounds. Two debt types: implementation debt (measurable by tools, cheap to fix) vs design/architecture debt (requires structured review, expensive because it demands structural change). Tools include Lattix, Sotograph/SotoArc, Sonargraph, Structure101, TeamScale.

See [[concepts/modularity]] for the full MMI treatment.

### Chapter 5 — Private Builds and Metrics: Tools for Surviving DevOps Transitions (Christian Ciceri)

Identifies the *ownership shift antipattern*: DevOps becomes a separate automations team, development loses pipeline ownership, and trunk becomes unstable. The fix is the *private build* — an integration build in a local or dedicated environment before committing to mainline. Three transition metrics track progress: Time to Feedback (qualitative, indirect — warns of long cycles), Evitable Integration Issues per Iteration (quantitative, indirect — measures private build discipline), Time Spent Restoring Trunk Stability per Iteration (quantitative, direct — cost of regressions entering mainline). Key framing: trunk stability must be established before any architectural quality metrics become meaningful.

### Chapter 6 — Scaling an Organisation: The Central Role of Software Architecture (João Rosa)

Architecture is sociotechnical: without intentional direction guided by business KPIs, Conway's Law drives monoliths into Distributed Big Balls of Mud. Rosa's primary tools: **Big Picture EventStorming** (maps software components onto emergent business domains, reveals ownership mismatches and cognitive load hotspots, surfaces domain KPIs) and **Process Modeling EventStorming** (operational value stream detail: KPIs, hotspots, Lean waste). The **KPI Value Tree** connects organisational KPIs (lagging) → domain KPIs (lagging) → technical metrics (leading + lagging, including the DORA four). Additional metrics: throughput (Lean), eNPS, mean time to discover (MTTD). Central warning: Goodhart's Law — when a measure becomes a target, it ceases to be a good measure.

See [[concepts/eventstorming]] and [[concepts/four-key-metrics]].

### Chapter 7 — The Role of Measurement in Software Architecture (Eoin Woods)

A four-quadrant measurement taxonomy: **artifact vs operational** × **external vs internal**. External artifact (design compliance — judgment-based, early in lifecycle) → internal artifact (code metrics — cheap, after code written) → external operational (response time, throughput, recovery — requires running system) → internal operational (memory, DB growth — predictive, running system required). Quality attribute specifics: performance (latency + throughput inversely proportional; measure response time distribution; pitfalls: test vs reality, workload fidelity); scalability (linear scaling ideal; watch for nonlinear behaviour); availability (MTTR more important than MTBF — Allspaw 2010; RPO + RTO more actionable than "the nines"; tyranny of the nines antipattern); security (static analysis + dynamic testing; weight by risk). Fitness functions don't make measurement easier — they help use measurements effectively.

See [[operations/availability]] for the MTTR/RPO/RTO treatment.

### Chapter 8 — Progressing from Metrics to Engineering (Neal Ford)

Metrics become engineering when continuously applied with objective, automated thresholds — the same transformation CI did to code integration. Practical tools: **ArchUnit** (Java) and **NetArchTest** (.NET) for compile-time governance (cycle checks, layer enforcement). Distributed architectures require custom fitness functions (e.g., parse service logs to verify orchestrator communication patterns). **Zero-day enterprise security pattern**: security team owns a pipeline "slot" in all projects; injects a version-check fitness function org-wide when a CVE is announced — motivated by the Equifax 2017 Struts breach, missed for four months because not all systems had active pipelines. Fitness functions reframed as executable checklists (Gawande's *Checklist Manifesto*): complex systems have too many simultaneous concerns to rely on memory; automation prevents important principles being skipped under deadline pressure.

See [[concepts/fitness-functions]].

### Chapter 9 — Using Software Metrics to Ensure Maintainability (Alexander von Zitzewitz)

The central claim: 80% of nontrivial systems exceeding 100K LoC become Big Balls of Mud without an active metrics-based feedback loop — structural erosion is the default outcome. A suite of CI-enforceable structural metrics:

- **ACD/CCD/Propagation Cost**: average and cumulative component dependency; Propagation Cost (CCD/n²) normalised to system size. Thresholds: > 20% for 500–5,000 components; > 10% for 5,000+
- **Relative Cyclicity** (100 × √(Σcyclicity)/n): fitness function thresholds ≤ 4% for components, 0% for packages — cyclic dependencies at the package level must be eliminated with zero tolerance
- **Structural Debt Index (SDI)**: 10 × linksToBreak + weightOfLinks; target: low hundreds
- **Maintainability Level (ML1/ML2/ML3)**: target ≥ 75%
- **Change history metrics**: Number of Changes, Code Churn, Number of Authors — identify refactoring hotspots where structural investment yields the highest return
- **Component Rank** (PageRank for classes): aids onboarding by identifying the most-referenced entry points
- **LCOM4**: disconnected subgraphs in the method–field graph; value > 1 signals a splittable class

**Six golden rules**: formal architectural model; no namespace/package cycles; source-file cycles ≤ 5 elements; no duplication; LoC ≤ 800 per file; max indentation 4 and Modified Cyclomatic Complexity ≤ 15.

Tools: Sonargraph-Explorer (free), NDepend, Understand, SonarQube, Source Monitor.

See [[concepts/modularity]] for the full structural metrics treatment.

### Chapter 10 — Measure the Unknown with the Goal-Question-Metric Approach (Michael Keeling)

GQM (Basili & Weiss, 1984) is a hierarchical framework: goal → questions → metrics → data. Every data point collected must link upward to a goal; metrics without a traceable goal are candidates for retirement. Goal statement structure: purpose + object + issue/topic + viewpoint. Metric selection criteria: strong unambiguous signal preferred; inexpensive preferred; metrics that answer multiple questions more efficient than single-purpose ones. Nine-step workshop: intro → write goal → gather questions → brainstorm metrics → sanity-check goal → identify data sources → prioritise → open reflection → document and share.

**Foo Service case study**: recurring Monday rate-limit breach → postmortem → GQM tree → heartbeat component + fail-fast ADR (jobs fail fast, work queue retries) → 9 months later, same service goes down for 14 hours; team alerted in 10 minutes before any user impact. GQM functions simultaneously as a measurement framework, a coaching tool, and a stakeholder alignment mechanism.

> "A metric by itself can only tell you something is wrong. It can't tell you what to do about it." — team leader, Foo Service case study

See [[concepts/goal-question-metric]].

## Notable Quotes

> "That's what places the four key metrics among the most valuable architectural metrics out there." — Andrew Harmel-Law (ch. 1)

> "A metric by itself can only tell you something is wrong. It can't tell you what to do about it." — team leader, Foo Service case study (ch. 10)

## Related Pages

- [[concepts/four-key-metrics]] — Harmel-Law (ch. 1) and Rosa (ch. 6)
- [[concepts/fitness-functions]] — Weiss (ch. 2) and Ford (ch. 8)
- [[concepts/evolutionary-architecture]] — Farley (ch. 3)
- [[concepts/modularity]] — Lilienthal (ch. 4) and von Zitzewitz (ch. 9)
- [[concepts/eventstorming]] — Rosa (ch. 6)
- [[operations/availability]] — Woods (ch. 7)
- [[concepts/goal-question-metric]] — Keeling (ch. 10)
- [[concepts/deployment-pipelines]] — Harmel-Law (ch. 1), Farley (ch. 3)
- [[concepts/conways-law]] — Rosa (ch. 6)

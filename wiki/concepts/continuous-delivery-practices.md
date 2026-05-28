---
title: "Continuous Delivery Practices"
type: concept
tags: [devops, continuous-delivery, ci-cd, trunk-based-development, test-automation, shift-left-security, accelerate, dora]
sources: [accelerate, building-evolutionary-architectures]
created: 2026-05-19
updated: 2026-05-28
---

# Continuous Delivery Practices

## Definition

Continuous delivery (CD) is the discipline of keeping software in a releasable state at all times — getting changes of all kinds into production safely, quickly, and sustainably. CD is not a single practice; it is a cluster of eight technical capabilities that, taken together, enable the four DORA delivery performance metrics (→ [[concepts/four-key-metrics]]).

The research basis: *Accelerate* (Forsgren, Humble, Kim, 2018) empirically validated, across four years and 23,000+ respondents, which practices predict high delivery performance. This page captures those findings and the non-obvious implications the data surfaced.

## Five Principles of Continuous Delivery

From Deming's quality management philosophy, applied to software delivery (→ [[sources/accelerate]] ch. 4):

1. **Build quality in** (Deming's Point 3): cease dependence on inspection to achieve quality. Find and fix problems when they are cheapest to address — at the point of creation, not after handoff to a separate QA phase.
2. **Work in small batches**: reduce batch size to reduce cycle time, variability, risk, and overhead. Small deployments are easier to verify, easier to roll back, and cheaper to fix when they fail.
3. **Computers perform repetitive tasks; people solve problems**: automate regression testing and deployment. Reserve human attention for judgement — reviewing code, triaging incidents, designing solutions.
4. **Relentlessly pursue continuous improvement**: improvement is never finished. High performers distinguish themselves not by having fewer problems but by finding and fixing them faster.
5. **Everyone is responsible**: system-level outcomes (delivery performance, quality, security) require collaboration across development, operations, and security. Siloed ownership of any concern undermines the rest.

## The Eight CD Capabilities

Accelerate identified eight technical capabilities as the primary drivers of continuous delivery performance (→ [[sources/accelerate]] Appendix A):

| Capability | Key requirement |
|------------|----------------|
| **Version control** | All production artefacts: app code, system config, app config, build scripts |
| **Deployment automation** | Zero manual steps to deploy |
| **Continuous integration** | Short-lived branches (< 1 day), trigger build + unit tests on every commit |
| **Trunk-based development** | Fewer than 3 active branches; no code freeze periods |
| **Test automation** | Developer-created and maintained; reliable enough to act on |
| **Test data management** | Test data available on demand; data doesn't limit test scope |
| **Shift-left security** | Infosec embedded in design, automated testing, and preapproved libraries |
| **Continuous delivery** | Software always in a deployable state; fast feedback from production |

## Key Empirical Findings

### Configuration in Version Control Is More Predictive Than Code

One of Accelerate's more surprising findings: storing system configuration and application configuration in version control is *more highly correlated* with delivery performance than storing application code (→ ch. 4). Reasons:
- Configuration changes are a leading cause of production failures (→ [[operations/common-failure-causes]])
- Configuration drift between environments ("works on my machine") is a primary cause of failed deployments
- Auditability of configuration changes is as important as auditability of code changes

Practical implication: version control adoption is not done when the code repository is set up. It is done when every environment-specific configuration file, infrastructure declaration, and build script is also tracked.

### Developer-Owned Test Automation

Tests predict IT performance only when developers (not a separate QA team or an outsourced contractor) create and maintain them (→ ch. 4). Two reasons:

1. **Testability is designed in when developers write tests.** Code written without tests is rarely testable after the fact. Developers who own the tests design systems with seams, interfaces, and dependency injection that enable testing.
2. **Developers maintain tests they own.** Tests created by a separate QA function are routinely allowed to rot — the team that could fix them is not the team responsible for them. Brittle, ignored tests are worse than no tests (they provide false confidence and are eventually disabled entirely).

The corollary: **test automation coverage is meaningless if the tests are not trusted.** A reliable suite of 200 tests that the team acts on is more valuable than 2,000 tests that regularly produce false positives and are routinely overridden.

### Trunk-Based Development

Trunk-based development is defined empirically in Accelerate as: fewer than three active branches in the repository, branch lifetime shorter than one day, no code freeze periods (→ ch. 4). GitHub Flow (short-lived feature branches merging frequently to main) qualifies if branch lifetimes are kept short.

The alternative — long-lived feature branches — creates integration debt. The longer a branch lives, the larger the merge conflict when it lands. Delayed integration delays feedback on whether the change actually works with the rest of the codebase.

Trunk-based development enables CI: you cannot continuously integrate if integration only happens when feature branches are complete.

### Loosely Coupled Architecture Is the Biggest CD Lever

In the 2017 Accelerate data, loosely coupled, well-encapsulated architecture was the **single largest contributor to continuous delivery** — larger than test automation, deployment automation, or any individual technical practice (→ ch. 5).

Six measurable characteristics of a loosely coupled architecture:
- Can make large-scale design changes without permission from outside the team
- Can make large-scale design changes without creating work for other teams
- Can complete work without coordinating with people outside the team
- Can deploy/release on demand regardless of other services
- Can test on demand without an integrated test environment
- Can deploy during normal business hours with negligible downtime

The implication: investing in test automation on a tightly coupled architecture yields diminishing returns. The coupling is the primary bottleneck. See [[concepts/bounded-contexts]] and [[comparisons/decomposition-strategy]] for decomposition strategies that create loosely coupled boundaries.

## Shift-Left Security (DevSecOps)

"Shifting left" on security means integrating security into the delivery lifecycle from design onward, rather than treating it as a downstream gate (→ [[sources/accelerate]] ch. 6).

Three elements of shift-left security:
1. **Security reviews for all major features** — conducted *during* development, not before release
2. **Infosec experts embedded in design, demos, and test automation** — not a separate approvals committee
3. **Preapproved, easy-to-consume libraries, packages, toolchains, and processes** — developers can build security in without specialist involvement for every change

**The efficiency argument**: high performers spend 50% less time remediating security issues than low performers. Security work done at design time is an order of magnitude cheaper than security work done post-production.

**The capacity argument**: the ratio in large companies is approximately 1 security engineer per 10 infrastructure engineers per 100 developers. At this ratio, manual security review of every deployment is structurally impossible when deployments are frequent. The only scalable model is to give developers the means to build security in — preapproved libraries, automated scanning in the pipeline, threat modelling as a design practice.

**Shift-left security does not slow delivery.** The Accelerate data found no tradeoff: high performers deploy more frequently *and* have fewer security incidents. See also [[concepts/threat-modeling]] for threat modelling practices.

## Lightweight Change Approval

Accelerate's finding on change management is one of the most counterintuitive in the research: Change Approval Boards (CABs) are negatively correlated with tempo *and* stability — they make delivery slower without improving the change failure rate (→ ch. 2, ch. 7).

**Why CABs fail**: external reviewers lack the intimate knowledge of the system required to accurately assess the impact of complex changes. CAB review is "risk management theatre" — checking boxes so that when something fails, there is a documented process trail.

**The high-performing alternative**: peer review (pair programming or code review) combined with a fully automated deployment pipeline. The pipeline records what changed, from where, what tests ran, and who approved — satisfying audit requirements. A human expert who knows the code reviews the change itself.

For regulated environments where change approval must be evidenced: record peer review approvals in the version control system (GitHub PR approvals) and treat the automated pipeline as the only mechanism for applying changes to production. The audit trail is the pipeline run.

## Relationship to Culture and People

Continuous delivery is not only a technical investment — it is an investment in people and culture (→ [[sources/accelerate]] ch. 4, ch. 9, ch. 10):

**Burnout**: deployment pain (fear and anxiety when pushing code to production) is one of the five strongest predictors of burnout. CD reduces deployment pain by making releases routine rather than high-stakes events. High performers deploy more frequently *and* experience less deployment pain — frequency builds confidence.

**Job satisfaction**: automation of rote work (repetitive deployment tasks, manual regression testing) frees engineers for judgement-based work. Survey data shows DevOps technical practices are predictors of job satisfaction.

**Culture**: CD predicts more generative Westrum culture (→ [[concepts/westrum-culture]]). The causal mechanism: blameless postmortems are easier when deployment frequency is high and batch sizes are small — each failure is smaller in scope, easier to diagnose, and less consequential to attribute openly.

**eNPS**: high performers are 2.2× more likely to recommend their organisation as a great place to work. Delivery performance, Westrum culture, and Lean management together predict employee Net Promoter Score.

**Virtuous cycle**: CD → better products → higher job satisfaction + stronger org identity → generative culture → org performance → better hiring and retention.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/accelerate]] | Primary source: empirical evidence for which specific practices predict delivery performance; trunk-based development and developer-owned tests as the non-obvious findings; config-in-VCS as more predictive than code-in-VCS; loosely coupled architecture as the single largest CD lever; shift-left security; CABs negatively correlated with both tempo and stability |
| [[sources/building-evolutionary-architectures]] | Deployment pipelines as fitness function automation infrastructure; CD as the operational foundation of evolutionary architecture; cycle time as a business differentiator; enterprise pipeline templates |

## Related Concepts

- [[concepts/four-key-metrics]] — the four DORA metrics are what CD practices improve; delivery frequency and lead time are direct CD measures
- [[concepts/deployment-pipelines]] — the mechanical implementation of CD: pipeline stages, fitness function placement, zero-downtime deployment, release strategies
- [[concepts/westrum-culture]] — CD is both a predictor of generative culture and predicted by it; the virtuous cycle
- [[concepts/fitness-functions]] — automated quality gates within the deployment pipeline; the mechanism that makes CD safe
- [[concepts/bounded-contexts]] — loosely coupled architecture (the largest CD lever) is achieved through well-designed bounded contexts
- [[concepts/feature-flags]] — application-layer mechanism for trunk-based development of large changes
- [[patterns/progressive-delivery]] — staged-rollout patterns that CD pipelines deliver into
- [[comparisons/decomposition-strategy]] — architectural decomposition decisions directly affect the testability and deployability that make CD possible
- [[concepts/threat-modeling]] — shift-left security at the design level; complements automated security scanning in pipelines
- [[concepts/api-testing]] — test pyramid, consumer-driven contracts, test data management; maps to the pipeline stage structure

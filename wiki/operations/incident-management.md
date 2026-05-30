---
title: "Incident Management"
type: concept
tags: [incident-management, on-call, postmortems, reliability, operations, sre, machine-learning]
sources: [site-reliability-engineering, reliable-machine-learning]
created: 2026-05-27
updated: 2026-05-30
---

# Incident Management

## Definition

Incident management is the structured process for responding to production problems — detecting, containing, investigating, and learning from events that impair service reliability. Effective incident management limits the duration and blast radius of incidents and converts failures into organisational knowledge. (→ [[sources/site-reliability-engineering]] ch. 12–15)

## Troubleshooting: The Hypothetico-Deductive Method

Troubleshooting is a learnable, teachable skill — not an innate talent. The formal model is the hypothetico-deductive method: given observations, form hypotheses about the cause, test them, and eliminate until one remains.

**Steps**: Triage → Examine → Diagnose → Test and Treat → Cure.

**Triage first**: in a major incident, the first instinct is to find the root cause. Resist it. Stop the bleeding first — divert traffic, reduce load, disable subsystems. "Fly the airplane" before troubleshooting. You are not helping users if the system dies while you investigate. (→ [[sources/site-reliability-engineering]] ch. 12)

**Common pitfalls**:
- Latching on to past causes (confirmation bias — "it was this last time")
- Spurious correlations (two things correlating by coincidence or shared cause)
- Improbable theories — prefer simpler explanations (Occam's Razor); think horses, not zebras

**Diagnostic techniques**:
- **"What touched it last"**: recent changes (deployments, config changes) are the most productive starting point; systems have inertia
- **Divide and conquer / bisection**: examine components systematically from one end; or bisect to identify the failing half
- **What, where, why**: ask what the system is doing, where it's spending resources, why it's doing that — repeat until you reach the root cause

**Negative results are magic**: document what you ruled out. Negative results are conclusive, prevent others from repeating the same investigation, and contribute to a data-driven culture.

**Make troubleshooting easier by design**: observability (white-box metrics + structured logs) built into each component from the start; well-defined interfaces between components; request tracing (correlation IDs / trace IDs) across the entire stack.

## Incident Command Structure

Google's incident management is based on the Incident Command System (ICS) — a scalable, clear system from emergency services. Key insight: clear role separation gives individuals more autonomy, because they don't need to second-guess colleagues whose responsibilities are well-defined.

### Roles

| Role | Responsibility |
|------|---------------|
| **Incident Commander** | Holds high-level incident state; assigns and delegates responsibilities; removes blockers; holds all unassigned roles by default |
| **Ops Lead** | Applies operational tools to the incident; **the only group permitted to modify the system during an incident** |
| **Communications Lead** | Issues periodic stakeholder updates; maintains the live incident document; public face of the response |
| **Planning Lead** | Handles longer-term logistics: filing bugs, arranging handoffs, tracking system divergence from normal state |

### Only Ops Modifies the System

"Freelancing" — well-intentioned engineers making independent changes to the system during an incident without coordination — is a primary cause of incidents spiralling out of control. During a managed incident, all system modifications must go through the Ops lead. (→ [[sources/site-reliability-engineering]] ch. 14)

### Live Incident Document

The incident commander's most important tool. Properties:
- Concurrently editable (not a single-writer document)
- Most critical information at the top (rendered in reading order)
- Captures: incident state, hypotheses tested, changes made, stakeholder updates, handoff times
- Retained for postmortem and meta-analysis

### Handoff Protocol

When the incident commander hands off to another engineer: explicit verbal confirmation ("You're now the incident commander, okay?") and explicit acknowledgment. The handoff is communicated to the rest of the team. The outgoing commander does not leave the call until acknowledgment is received.

### When to Declare an Incident

Declare early — the cost of spinning up the framework is low; the cost of not declaring when you should have is high. Declare if any of the following is true:

- A second team needs to be involved
- The issue is customer-visible
- The issue is unresolved after one hour of concentrated analysis

### Best Practices

**Prioritize**: stop the bleeding, restore service, preserve evidence for root-causing.  
**Prepare**: develop and document procedures before incidents occur.  
**Trust**: give full autonomy within each role; do not micromanage.  
**Introspect**: if feeling panicked or overwhelmed, request more support.  
**Consider alternatives**: periodically re-evaluate whether the current approach is right.  
**Practice**: use the framework routinely (e.g. for complex planned changes) so it is second nature during real incidents.  
**Rotate roles**: ensure every team member is familiar with each role.

## Postmortem Culture

A postmortem is a written record of an incident: its impact, actions taken to mitigate and resolve it, contributing root causes, and follow-up actions to prevent recurrence.

### Blameless Postmortems

A blameless postmortem assumes everyone had good intentions and did the right thing with the information they had. It focuses on systemic causes — incomplete information, inadequate tooling, design limitations — rather than individual error. (→ [[sources/site-reliability-engineering]] ch. 15)

Rationale: blame-based cultures suppress reporting and leave root causes unaddressed. You cannot "fix" people, but you can fix systems and processes.

**Blameless ≠ accountability-free**: the postmortem explicitly identifies where and how services and processes can be improved. The individual is not indicted; the systemic failure is.

Blameless culture originated in healthcare and aviation, where systematic analysis of accidents (rather than blame) dramatically improved safety outcomes.

### Postmortem Triggers

Define triggers before incidents occur so there is no ambiguity about when a postmortem is required:

- User-visible downtime or degradation beyond a defined threshold
- Any data loss
- On-call intervention (rollback, traffic rerouting)
- Resolution time above a defined threshold
- Monitoring failure (implies the incident was detected manually, not automatically)

Any stakeholder may additionally request a postmortem.

### Review Process

1. **Draft**: written collaboratively, ideally starting during incident resolution
2. **Internal review**: senior engineers assess completeness, root-cause depth, action plan appropriateness, and whether relevant stakeholders were notified
3. **Broad sharing**: published to the widest audience that benefits

> **"No postmortem left unreviewed"**: an unreviewed postmortem might as well not exist.

Action items from postmortems must be tracked and prioritised — an unactioned postmortem is a prediction of a future incident.

### Postmortem as Culture

Culture-building activities that sustain postmortem practice:

- **Postmortem of the month**: an interesting, well-written postmortem shared widely in a regular newsletter
- **Reading clubs**: team discussion of past postmortems, including incidents from months or years ago
- **Wheel of Misfortune**: reenact a past incident with new engineers playing the roles; the original incident commander provides context

Visibly reward good incident handling — quick rollback decisions, clear communication, transparent escalation. Recognition from peers and leadership reinforces the behaviours that reduce incident impact.

## Outage Tracking

Postmortems (→ above) cover individual high-impact incidents in depth. Outage tracking systems address a complementary gap: **high-frequency, low-severity events** that individually don't warrant a postmortem but collectively reveal systemic weaknesses.

Google's system ("Outalator") passively receives all alerts and supports: (→ [[sources/site-reliability-engineering]] ch. 16)

**Aggregation**: Multiple alerts from a single event are grouped into one incident entity. A network failure triggering alerts across ten teams is one incident, not ten. This separation of "alerts per day" from "incidents per day" is analytically critical — one measures monitoring noise; the other measures actual service disruption.

**Tagging**: Free-form hierarchical tags (`cause:network:switch`, `customer:132456`, `bogus`) applied at any level. Teams develop their own tag vocabularies through use rather than having a predetermined list imposed. Tags that encode `cause:` and `action:` namespaces are particularly useful for systematic analysis.

**Analysis layers**:
1. Basic counts — incidents/week, alerts/incident
2. Trend comparison — across teams and over time; establishes what is "normal"
3. Semantic analysis — which infrastructure component causes the most incidents? What is the cost/benefit of fixing it versus the horizontal impact across all affected teams?

**Cross-team visibility**: Seeing that the relevant team has *not* been alerted about an apparent failure in their component is as operationally useful as seeing that they have been. Cross-team awareness accelerates diagnosis and coordination.

**System-of-record use**: Dummy escalator configurations (no human recipient) provide an auditable log of privileged account access, periodic job runs, or schema migrations — visible alongside real incidents in the outage tracker.

> **Postmortems vs outage tracking**: postmortems provide deep insight per incident; outage tracking provides breadth across all incidents, including those too small for a postmortem. Both are necessary; neither substitutes for the other.

## ML Incident Response

ML incidents use the same command structure and phases as standard incidents, but differ significantly in three dimensions. (→ [[sources/reliable-machine-learning]] ch. 11)

### ML-Specific Differences

**Detection is harder.** ML failures manifest as silent quality degradation — `predict()` returns successfully with wrong answers. Infrastructure monitoring never fires. The detection signal comes from quality metrics (click-through rate, revenue per recommendation, customer complaints about "weird results"). By the time user-facing metrics degrade visibly, the underlying failure may be weeks old.

**Broader organisational scope.** ML outages routinely involve finance, product, legal, and partner teams — not just engineering. The shared economic impact of ML systems creates shared incident responsibility.

**Fuzzy timeline and resolution.** "When did the outage start?" is often unanswerable precisely. "Is it resolved?" means returning to approximately previous quality on a model now weeks behind the world, not restoring a prior state.

### Three Guiding Principles

1. **Public** — ML quality failures often first appear as user complaints or business metric drops, not as alert pages. These signals are noisy but early and should not be dismissed.
2. **Fuzzy** — the boundary between "broken" and "not yet good enough" is not always clear for ML systems. Declare incidents based on measurable business or quality metric thresholds agreed upon before incidents occur.
3. **Unbounded** — troubleshooting an ML outage routinely requires coordinating across ML engineers, data engineers, product managers, and business leaders. Plan for this scope before incidents occur.

### ML Troubleshooting Approach

**Start from the model's output, not the data.** The question to ask is: "What is the model predicting, and why is that wrong?" Working backward from the wrong output to the cause is far more tractable than searching forward through data pipelines.

**Look at the whole system.** ML outages are often caused on one side of the system (training pipeline, feature store, upstream data schema change) but detected on the other side (serving, business metrics). Step back early and consider system-wide explanations before narrowing to specific components.

**Business leaders at the boundary.** Many ML incidents require a mitigation decision with significant revenue consequences. Production engineers must be prepared to escalate quickly, and business leaders must be available for consultation even during off-hours. Pre-negotiating escalation paths before incidents is as important as pre-negotiating SLOs.

### Privacy-Preserving Incident Response

Under pressure to resolve an ML outage, engineers may access raw user data (query logs, personal information, purchase history) without appropriate controls. This is an ethical violation with legal consequences in many jurisdictions. The constraints:

- Raw query logs correlating to individual users are PII in most jurisdictions.
- Access to customer financial data (investment decisions, purchase history) during incident response constitutes insider knowledge under some legal frameworks.
- Incident pressure does not suspend privacy obligations.

Recommended mitigations: access-controlled data access with justification logging; dual-key oversight (no single engineer has unmonitored raw data access); pre-authorised anonymised test datasets specifically for debugging; audit trails reviewed in postmortems.

### RPO and RTO for ML Systems

Most ML systems have no meaningful recovery point objective (RPO). They exist to adapt to the current state of the world — there is no prior state to restore to. The "resolution" of an ML incident means returning to approximately previous quality on a model that has since fallen behind the world, not true rollback.

Recovery time objective (RTO) for ML includes model retraining time — often hours to days — not just detection and fix time. SLO modelling must account for this.

## Related Concepts

- [[operations/monitoring]] — SLOs and burn rate alerting detect incidents; alert quality determines on-call effectiveness; ML monitoring taxonomy
- [[operations/site-reliability-engineering]] — the broader discipline; error budgets quantify incident impact
- [[operations/error-budgets]] — incident severity is expressed as error budget consumed
- [[operations/observability]] — logs and traces enable effective examination and diagnosis during incidents
- [[operations/chaos-engineering]] — deliberate failure injection to surface incident response gaps before real incidents
- [[operations/automation]] — automating common incident responses (failover, rollback) reduces MTTR
- [[concepts/ml-systems-design]] — ML-specific failure modes and silent failure characteristics that make ML incident detection hard

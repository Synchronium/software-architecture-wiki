---
title: "Risk Storming"
type: concept
tags: [risk, governance, collaboration]
sources: [fundamentals-of-software-architecture]
created: 2026-05-13
updated: 2026-05-14
---

# Risk Storming

## Definition

Risk storming is a collaborative, structured technique for identifying and mitigating architectural risk within a specific dimension (e.g., availability, performance, security, scalability). It combines individual independent assessment with group consensus to surface blind spots that any single architect would miss. (→ [[sources/fundamentals-of-software-architecture]])

## Why It Matters

No architect has complete knowledge of every part of a system. Risk storming forces explicit, shared risk assessment before problems reach production — and surfaces domain expertise (from developers and other stakeholders) that an architect working alone would overlook. It also produces risk assessments that can be used in stakeholder negotiations: associating risk with cost and likelihood makes conversations concrete.

## The Risk Matrix

The risk matrix is the tool used during risk identification. It has two dimensions:
- **Overall impact** (if this risk materialises): low (1), medium (2), high (3)
- **Likelihood** (that it will occur): low (1), medium (2), high (3)

Risk score = impact × likelihood. Interpretation:
- 1–2: **Low risk** (green) — acceptable
- 3–4: **Medium risk** (yellow) — monitor, consider mitigating
- 6–9: **High risk** (red) — mitigate before production

**Special rule:** Unknown or unproven technologies always receive the highest risk score (9), because the risk matrix cannot be applied to what is not understood.

## Risk Assessments

A risk assessment is a summarised report of the overall risk across domain areas (e.g., customer registration, order fulfilment) and risk dimensions (e.g., data integrity, availability). Scores can be accumulated by row (domain area) and by column (risk dimension) to identify the highest-risk areas.

**Direction of risk:** track whether risk is improving or worsening over successive iterations. Two options:
- *+/− signs* (preferred): + in green = improving toward lower risk; − in red = deteriorating toward higher risk. No sign = stable. Avoids the ambiguity of arrows (surveys show roughly 50% of people interpret ↑ as "getting better" and 50% as "getting worse").
- *Arrow + target number*: e.g., "↑4" means risk is worsening toward 4. Self-explanatory — needs no key.

Direction is determined by continuous measurement via [[concepts/fitness-functions]] tracking each risk dimension over time.

## The Three Activities

**1. Identification (individual, non-collaborative)**
Each participant independently assigns risk scores to areas of the architecture. Independence is essential: if done collaboratively, participants influence each other and miss risks. Participants use the risk matrix and write scores on colour-coded Post-it notes (green/yellow/red).

**2. Consensus (collaborative)**
All participants place their Post-it notes on a shared architecture diagram. Areas of disagreement (different scores from different participants) are discussed to reach consensus. Single-participant risk identifications (where only one person saw the risk) are scrutinised — often these surface the most valuable insights, including domain knowledge the architect didn't have.

**3. Mitigation (collaborative)**
Participants collectively design changes to reduce or eliminate identified high and medium risks. Mitigation usually involves architectural changes (splitting a database, adding queuing, separating API gateways by user role). The cost of mitigation is weighed against the risk score — this creates a structured basis for stakeholder negotiation.

## Risk Dimensions

Common dimensions for separate storming sessions:
- Availability (single points of failure, SLAs of dependencies)
- Scalability / Elasticity (variable load, throughput ceilings)
- Performance (latency bottlenecks, third-party limits)
- Security (HIPAA, PCI, authentication surface area)
- Data integrity / Data loss (write durability, backup recoverability)
- Unproven technology (unknown libraries, new platforms)

Restrict each session to one dimension for focus; multi-dimension sessions cause confusion.

## Worked Example — Nurse Diagnostics System

A call-center diagnostics system (250 nurses + unlimited self-service patients, HIPAA compliance, 500 req/sec diagnostics engine ceiling). Three separate risk storming sessions demonstrated the power of the practice (→ [[sources/fundamentals-of-software-architecture]]):

**Availability session:**
- *Central database* → high risk (6): high impact (3) × medium likelihood (2). Mitigation: split into two physical databases — nurse profiles (clustered, critical for call routing) and case notes (single instance, nurses can write manually if unavailable).
- *Diagnostics engine* → high risk (9): impact (3) × unknown likelihood (3). Mitigation: research the SLA. SLA (contractual, legally binding) vs SLO (not binding). Architects should document external dependencies' SLAs on the architecture diagram.
- *Medical records exchange* → low risk (2): not required for the system to function.

**Elasticity session:**
- *Diagnostics engine interface* → high risk (9) at 500 req/sec ceiling under outbreak or flu-season load.
- Mitigation 1: async queues for back-pressure (limits queue build-up).
- Mitigation 2: **Ambulance Pattern** — two separate message channels give nurses higher priority over self-service patients (time-sensitive call routing vs general queries).
- Mitigation 3: *Outbreak cache* — cache diagnostics questions related to known outbreaks and flu season, removing the dominant request class from the diagnostics engine entirely.

**Security session:**
- *Single shared API gateway* → high risk (6): high impact (3) × medium likelihood (2). All three user types (nurses, admin staff, self-service patients) share one gateway, making it possible for non-nurse requests to reach the medical records exchange.
- Mitigation: three separate API gateways (one per user type). Physical separation prevents admin or self-service paths from ever routing to medical records — HIPAA compliance is structural, not just configured.

The final architecture after all three sessions had significantly more components than the original but was genuinely robust across availability, elasticity, and security.

## Agile Story Risk Analysis

Risk storming is not limited to architecture. It can be applied to **user story risk** during sprint grooming. The two risk dimensions become:
- *Impact*: what is the impact if this story is not completed within the iteration?
- *Likelihood*: how likely is it that the story will not be completed?

This uses the same 1–9 matrix. High-risk stories are tracked carefully and prioritised for early completion within the sprint. Risk assessments across stories reveal overall iteration risk — useful for project manager conversations.

## Risk Storming is Continuous

Risk storming is not a one-time event. It should be repeated after major feature additions, architectural refactoring, or at the end of every significant iteration. The risk assessment report provides a baseline; subsequent sessions track direction (improving or degrading).

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Introduces risk storming as a first-class architectural practice; provides the risk matrix, risk assessment format, and three-activity process; includes a detailed worked example (nurse diagnostics system) |

## Related Concepts

- [[concepts/adrs]] — risk findings should be captured and addressed in ADRs
- [[concepts/fitness-functions]] — fitness functions can automate the tracking of risk dimensions identified in risk storming
- [[concepts/architecture-characteristics]] — the dimensions of risk map directly to architecture characteristics

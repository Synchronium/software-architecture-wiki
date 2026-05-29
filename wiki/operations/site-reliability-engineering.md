---
title: "Site Reliability Engineering"
type: concept
tags: [sre, reliability, operations, devops, toil, on-call]
sources: [site-reliability-engineering]
created: 2026-05-27
updated: 2026-05-29
---

# Site Reliability Engineering

## Definition

Site Reliability Engineering (SRE) is the discipline of applying software engineering practices to operations problems. Originating at Google, it is defined by its creator Ben Treynor Sloss as "what happens when you ask a software engineer to design an operations team." (→ [[sources/site-reliability-engineering]] ch. 1)

SREs are engineers first: they write the software that makes systems run themselves, rather than manually operating those systems. The goal is automation that eliminates the need for operations, not automation that makes operations faster.

## The Dev/Ops Conflict

Traditional organisations split software engineers (who want to ship features) from operations teams (who want stability). This split creates a structural conflict:

- Dev teams are incentivised to deploy frequently; ops teams are incentivised to prevent change.
- Both teams nominally want reliability and velocity, but their day-to-day incentives diverge.
- Conflict manifests as launch gates, friction, "flag flips" to dodge process, and mutual distrust.

SRE resolves this by replacing the conflict with a shared metric: the [[operations/error-budgets|error budget]]. Both teams aim to spend the error budget on feature velocity; both teams lose when it is exhausted. The structural conflict of incentives disappears because the incentive is now aligned.

## SRE vs DevOps

DevOps (emerged ~2008) and SRE share core principles: close collaboration between development and operations, automation over manual work, treating infrastructure as code. The SRE book describes the relationship as:

- DevOps is a **generalisation** of SRE principles to any organisation and management structure.
- SRE is a **specific implementation** of DevOps with Google's particular extensions (error budgets, toil cap, SLO-based alerting).

The critical distinction is that SRE places **reliability as the primary focus**, whereas DevOps is more broadly concerned with delivery speed and collaboration. An organisation can adopt DevOps culture without the specific SRE mechanisms; Google's SRE practices are not universally transferable.

## Reliability as Risk Management

A central SRE insight is that reliability is not a property to maximise but a point on a risk continuum to choose deliberately. (→ [[sources/site-reliability-engineering]] ch. 3)

Every increment of reliability beyond "reliable enough" has two costs:

1. **Redundancy cost** — additional hardware, infrastructure, and failover complexity.
2. **Opportunity cost** — engineering time diverted from features, debt reduction, or cost optimisation.

The right reliability target is the point where users cannot notice further improvement (their experience is dominated by less reliable components — ISP, device, network) and where the business risk is fully mitigated. Exceeding that target is a waste: it stifles feature velocity and increases cost without improving the user experience.

This framing makes the SLO both a floor (minimum acceptable reliability) and a ceiling (maximum investment-justified reliability): running significantly above the SLO is as problematic as running below it.

## Core Tenets

### Engineering focus (toil cap)

SREs cap operational work at 50% of their time. The rest must be spent on engineering — writing software that eliminates the manual work. If the ops load exceeds 50%, work is redirected back to product development teams. This creates a feedback loop: product teams that build systems requiring excessive operational support absorb the cost of that support.

**Toil defined** (→ [[sources/site-reliability-engineering]] ch. 5): toil is work tied to running a production service that is manual, repetitive, automatable, tactical, devoid of enduring value, and scales O(n) with service growth. Not all grungy work is toil — a one-time cleanup that permanently improves the service is engineering. Overhead (meetings, goal-setting, HR) is also not toil.

**SRE work taxonomy**:
- **Software engineering**: writing or modifying code, automation scripts, reliability features
- **Systems engineering**: configuring production systems, monitoring setup, architecture consulting — produces lasting improvement from one-time effort
- **Toil**: the capped operational work defined above
- **Overhead**: administrative work not tied to running a service

**On-call creates a structural toil floor**: a 6-person rotation commits ~33% of time to on-call; an 8-person rotation ~25%. This sets the practical minimum for how low toil can go regardless of automation.

The ideal state is a service that "basically runs and repairs itself" — automatic, not just automated. (→ [[sources/site-reliability-engineering]] ch. 1, 5)

### Error budgets

Setting availability targets below 100% creates an explicit budget for risk. Development and SRE teams jointly manage this budget; exhausting it halts feature releases until reliability is restored. (→ [[operations/error-budgets]])

### SLO-driven monitoring and alerting

Monitoring should only alert when user experience is impacted — that is, when an SLO is at risk. Alerts that require human interpretation of whether they matter are flawed by design. (→ [[operations/monitoring]])

### Blameless postmortems

When things go wrong, the goal is to understand systemic causes and improve the system — not to assign personal blame. Blame-based cultures suppress reporting, reduce learning, and leave root causes unaddressed. (→ [[sources/site-reliability-engineering]] ch. 15)

### Capacity planning

SRE teams own provisioning because availability depends on capacity. Capacity planning accounts for both organic growth (natural adoption) and inorganic growth (feature launches, campaigns). Regular load testing validates that raw resource numbers translate to actual service capacity.

## Responsibilities of an SRE Team

Per the SRE book, an SRE team is responsible for: availability, latency, performance, efficiency, change management, monitoring, emergency response, and capacity planning.

## Applicability Outside Google

Many SRE practices are directly applicable at smaller scale; some are not:

| Practice | Transferability |
|----------|----------------|
| Error budgets and SLOs | High — the framework applies at any scale |
| Blameless postmortems | High — cultural, not technical |
| Toil cap (50% rule) | High — the principle matters; the number is illustrative |
| On-call playbooks | High — reduces MTTR dramatically |
| SLO-based alerting | High — reduces alert fatigue |
| Google-specific tooling (Borg, Chubby, etc.) | Low — implementation detail |
| 50%+ software engineering hiring bar | Medium — principle (engineers who automate) applies; exact bar varies |

> **Open question:** The SRE model requires strong management support and a culture willing to halt feature releases when error budgets are exhausted. In organisations where shipping velocity is the overriding priority, the error budget mechanism may be adopted in name only. How much of SRE's value depends on the enforcement of consequences?

## Related Concepts

- [[operations/error-budgets]] — the central mechanism aligning dev and ops incentives
- [[operations/monitoring]] — SLO-based alerting and burn rate alerting
- [[operations/availability]] — what SLOs are measuring
- [[operations/incident-management]] — blameless postmortems, ICS roles, and outage tracking
- [[operations/automation]] — the primary mechanism for eliminating toil and achieving sublinear scaling
- [[operations/testing-for-reliability]] — zero-MTTR testing and the release/reliability feedback loop
- [[operations/data-integrity]] — data integrity as an orthogonal requirement to uptime
- [[operations/chaos-engineering]] — controlled failure injection to validate reliability
- [[operations/common-failure-causes]] — what burns error budgets
- [[comparisons/cost-vs-availability]] — the cost framing for SLO target selection

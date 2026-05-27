---
title: "Automation"
type: concept
tags: [automation, operations, sre, toil, reliability, resilience]
sources: [site-reliability-engineering]
created: 2026-05-27
updated: 2026-05-27
---

# Automation

## Definition

Automation is meta-software — software that acts on software or infrastructure to replace manual operational procedures. In SRE, it is the primary mechanism for reducing [[operations/site-reliability-engineering|toil]] and achieving sublinear scaling of operational work relative to service growth. (→ [[sources/site-reliability-engineering]] ch. 7)

## Automation vs Autonomy

Automation replaces a manual procedure with a script or tool that a human triggers. Autonomy goes further: the system detects its own problems and resolves them without human initiation. SRE's goal is not automation but autonomy — a system that requires neither manual operation nor external automation because it has been designed to handle failures internally.

> "Reliability is the fundamental feature, and autonomous, resilient behaviour is one useful way to get that." (→ [[sources/site-reliability-engineering]] ch. 7)

## The Automation Hierarchy

Five levels of maturity, from least to most autonomous (→ [[sources/site-reliability-engineering]] ch. 7):

| Level | Description | Example |
|-------|-------------|---------|
| 1. No automation | Operator manually performs the procedure each time | Database failover executed by hand, taking 30–90 minutes |
| 2. System-specific external automation | An SRE writes a script in their home directory | A personal failover script used by one team member |
| 3. Generic external automation | The script is generalised and shared across teams | A shared "generic failover" script that handles multiple databases |
| 4. System-specific internal automation | The system ships with its own automation | The database includes a failover tool as part of its distribution |
| 5. Autonomous systems | The system detects and resolves its own problems | Database automatically detects master failure and elects a new master |

Level 5 — autonomy — is the target. Levels 2 and 3 suffer from bit rot: externally maintained automation drifts away from the systems it manages because it is maintained by a different team with different incentives and tested infrequently.

## Benefits of Automation

- **Consistency**: humans performing the same procedure many times will inevitably diverge; automation does not.
- **Platform extensibility**: a bug fixed in automation is fixed everywhere; new use cases can be added without retraining humans.
- **Faster MTTR**: automation that handles common faults reduces mean time to repair for those faults.
- **Faster action**: in time-critical scenarios (failover, traffic switching), automation reacts faster than humans.
- **Time savings that compound**: once encapsulated, any engineer can execute the task; the saving applies to everyone.

## Safety Properties of Automation

Automation operating at scale can amplify mistakes catastrophically. The Diskerase incident at Google — where decommission automation interpreted an empty machine set as "all machines" and wiped the disks of every CDN machine in every colo — illustrates the failure mode. Required safety properties:

- **Rate limiting**: automation should refuse to act on more than N resources at once, regardless of what the input set says.
- **Idempotency**: running automation multiple times should produce the same result as running it once; avoids double-application bugs on retry.
- **Sanity checks**: validate that the scope of the operation makes sense before executing (e.g., "this set of machines to erase is unexpectedly large — confirm?").
- **Audit trails**: all automated actions should be logged with the initiator, parameters, and outcome.

## Organisational Incentives

The most functional automation is written by those who use it. When a specialist "turnup team" is responsible for automation that service teams depend on:

- The turnup team has no incentive to reduce technical debt for the services they support.
- Service teams have no incentive to build systems that are easy to automate.
- Product managers have no incentive to prioritise simplicity over features, because they don't bear the cost of complex automation.

The SRE model corrects this: service teams own their automation. The same argument motivates product developers retaining operational awareness — they bear the cost of systems that are hard to operate automatically.

## Case Study: MySQL on Borg

Google's Ads database ran on MySQL. When migrated to Borg, tasks moved frequently — requiring failovers more than once per week per shard. Manual failover took 30–90 minutes; meeting error budgets required sub-30-second failover. The only solution was to automate failover entirely (the "Decider" daemon). Outcomes:

- Toil reduced by ~95%
- Hardware utilisation improved; ~60% of hardware freed by bin-packing
- Error budgets achievable; on-call load dramatically reduced

This is the canonical example of automation making the error budget possible, rather than just making existing operations faster.

## Related Concepts

- [[operations/site-reliability-engineering]] — the engineering discipline in which automation is a first-class obligation
- [[operations/error-budgets]] — automation is often the only path to meeting error budgets at scale
- [[operations/monitoring]] — monitoring triggers automation; automation quality is measurable via its own metrics
- [[concepts/deployment-pipelines]] — deployment pipelines are a specific form of automation for software delivery

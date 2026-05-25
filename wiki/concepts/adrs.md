---
title: "Architecture Decision Records (ADRs)"
type: concept
tags: [decisions, documentation, governance, architecture-process, evolutionary-architecture]
sources: [fundamentals-of-software-architecture]
created: 2026-05-13
updated: 2026-05-14
---

# Architecture Decision Records (ADRs)

## Definition

An Architecture Decision Record (ADR) is a short document (typically one to two pages) capturing a single, architecturally significant decision: the context that forced it, the decision itself with full justification, and its consequences. ADRs provide a persistent, queryable history of *why* a system is built the way it is.

The concept was popularised by Michael Nygard and adopted by ThoughtWorks (marked "Adopt" on their Technology Radar).

## Why It Matters

Architectural decisions degrade in two ways: they get re-litigated endlessly because no one knows why the original decision was made (the Groundhog Day anti-pattern), or they simply get lost because they were communicated in email threads (the Email-Driven Architecture anti-pattern). ADRs solve both problems by creating a single, durable source of truth for each decision.

The *why* is the most valuable content in an ADR. Anyone can understand *how* something works by reading the code; understanding *why* it was built that way — and what alternatives were rejected — requires documentation.

> "Understanding why a decision was made is far more important than understanding how something works." (→ [[sources/fundamentals-of-software-architecture]], Ch 19)

## Structure

**Title**: Short, numbered, descriptive. E.g., "42. Use Asynchronous Messaging Between Order and Payment Services."

**Status**: One of:
- *Proposed* — awaiting approval (high cost, cross-team impact, or security implications → cannot self-approve)
- *RFC (Request for Comments)* — draft circulated for input, with a deadline to prevent analysis paralysis
- *Accepted* — approved and ready for implementation
- *Superseded* — replaced by a newer ADR (never deleted — preserves history)

**Context**: The forces at play. "What situation is forcing this decision?" Describes the problem, the constraints, and the alternative options considered.

**Decision**: The decision itself, stated in an affirmative, commanding voice: "We will use asynchronous messaging between the order and payment services." Includes the full justification — both technical *and* business justification. If a decision has no business value, it should be reconsidered. The *why* is the most valuable content — not the *how*. **The gRPC example:** an architect chose gRPC for low latency. Years later, another architect refactored to messaging "for decoupling," not knowing about the latency requirement. Upstream timeouts resulted. Knowing the why would have prevented the mistake.

**Consequences**: The trade-offs. Both the positive outcomes and the negative impacts. Documenting trade-offs here makes the ADR double as architecture documentation.

**Compliance** *(added by Richards & Ford)*: How the decision will be measured and enforced. Can it be automated via a [[concepts/fitness-functions|fitness function]]? If so, specify the test. This section forces architects to make decisions governable.

**Notes** *(added by Richards & Ford)*: Metadata — original author, approval date, approver, superseded date, modification history.

## Three Anti-Patterns ADRs Address

**Covering Your Assets**: Avoiding decisions from fear of being wrong. Fix: wait until the last responsible moment (enough information to justify, not so late as to block development). Collaborate with development teams to validate the decision is implementable.

**Groundhog Day**: Decisions re-litigated because the justification was never documented or was incomplete. Fix: always include both technical and business justification in the Decision section.

**Email-Driven Architecture**: Decisions buried in email threads with no single source of truth. Fix: never put the decision itself in the email body — email only the context and a link to the ADR.

## What Counts as Architecturally Significant

Nygard's five criteria (any one qualifies a decision):
1. **Structure** — affects patterns or styles used.
2. **Nonfunctional characteristics** — impacts a critical "-ility".
3. **Dependencies** — creates or removes coupling between components/services.
4. **Interfaces** — affects how services/components are accessed (contracts, versioning).
5. **Construction techniques** — platform, framework, or process choices that impact architecture.

## Self-Approval Criteria

Architects must define explicitly when they can approve their own ADRs vs when approval from a higher-level architect or Architecture Review Board (ARB) is required. Three common criteria (any one triggering ARB review):

1. **Cost** — estimate the cost of implementing the decision (hours × company FTE rate). If above a defined threshold, ARB approval required.
2. **Cross-team impact** — if the decision affects other teams or systems, it cannot be self-approved.
3. **Security** — any security implication requires higher-level approval.

Documenting these criteria prevents architects from either over-escalating trivial decisions or under-escalating consequential ones.

## Tooling

**ADR-tools** by Nat Pryce (co-author of *Growing Object-Oriented Software Guided by Tests*): a command-line interface tool for managing ADRs — handles numbering schemes, file locations, and the superseded link logic. Available as open source.

## Storing ADRs

Richards & Ford recommend a wiki or shared directory (not a per-application Git repo, because cross-application and enterprise-level ADRs need to be accessible without repository access). Suggested hierarchy: Application (per-app decisions) → Integration (cross-system decisions) → Enterprise (global decisions).

The "All access to a system database only from the owning system" is a canonical example of an enterprise ADR — it applies globally and would be inaccessible to many stakeholders if buried in a single team's repo.

## The ADR Guideline Format (api-arch)

*Mastering API Architecture* uses a structured decision guideline format throughout each chapter rather than formal ADRs in the Nygard sense (→ [[sources/mastering-api-architecture]]). Each guideline follows a two-part structure:

**Discussion Points** — the forces at play, the alternatives, and the trade-offs. Written in a neutral framing that presents multiple valid positions.

**Recommendations** — the authors' preferred position given the general case, with explicit caveats about when the recommendation should be overridden.

This format is more prescriptive than a neutral ADR but shares the same goal: making the reasoning explicit and portable. It works well for platform-level decisions (gateway selection, service mesh adoption, exchange format) where the team needs opinionated guidance rather than a blank decision template.

The two formats are complementary: the api-arch Guideline format can be the basis for a Discussion section in a formal ADR, with the team's actual decision recorded in the ADR Decision section.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Introduces ADRs with the three anti-patterns as motivation; adds Compliance and Notes sections beyond Nygard's original; links to fitness functions for governance |
| [[sources/mastering-api-architecture]] | Uses a Discussion Points + Recommendations format for architectural guidelines throughout each chapter. Less formal than a full ADR but makes reasoning explicit. Notes that API gateway selection, service mesh adoption, and exchange format are Type 1 (irreversible) decisions that warrant formal ADRs. |

## Related Concepts

- [[concepts/fitness-functions]] — referenced in the ADR Compliance section to automate governance of the decision
- [[concepts/risk-storming]] — identifies risks that should be captured and addressed in ADRs

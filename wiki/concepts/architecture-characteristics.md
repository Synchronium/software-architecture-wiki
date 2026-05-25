---
title: "Architecture Characteristics"
type: concept
tags: [architecture, characteristics, ilities, quality-attributes]
sources: [fundamentals-of-software-architecture]
created: 2026-05-13
updated: 2026-05-14
---

# Architecture Characteristics

## Definition

Architecture characteristics (also called "-ilities" or non-functional requirements) are the structural and operational qualities a system must support beyond its domain functionality. They are the criteria by which architecture styles are selected and the targets that [[concepts/fitness-functions]] enforce.

A quality attribute must meet three criteria to count as an architecture characteristic:
1. It specifies a non-domain design consideration (not a business feature).
2. It influences a structural design decision.
3. It is critical to the success of the application.

## Categories

**Operational characteristics** — runtime and infrastructure behaviour:
- Availability (uptime SLA)
- Continuity (disaster recovery)
- Performance (response time, throughput)
- Recoverability (MTTR after failure)
- Reliability/Safety (correctness under load)
- Robustness (handling network/hardware failures)
- Scalability (handle growing concurrent load)
- Elasticity (respond to sudden spikes)

**Structural characteristics** — code quality and deployment:
- Agility (how fast can the architecture change)
- Deployability (ease, frequency, risk of deployments)
- Testability (how easily code can be verified)
- Modularity (separation and isolation of components)
- Configurability (runtime behaviour changes without redeploy)
- Installability (ease of on-environment installation)

**Cross-cutting characteristics** — enterprise and legal concerns:
- Security (authentication, authorisation, data protection)
- Accessibility (compliance with accessibility standards)
- Legal (regulatory and contractual requirements)
- Supportability (logging, diagnostics, monitoring)
- Usability/Achievability

## Implicit vs Explicit

**Explicit** characteristics are stated in requirements or by stakeholders ("the system must handle 10,000 concurrent users"). **Implicit** characteristics are baseline assumptions that are never stated but are still required — availability, security, and reliability often fall here. Architects must identify both.

**Italy-ility** — a named illustration of how unique organisational history can produce custom architecture characteristics. A client's architecture team, after a freak communication outage had severed headquarters from Italian branches years earlier, insisted at every design review: "But what if we lose Italy?" The team eventually formalised this as *Italy-ility* — a compound of availability, recoverability, and resilience specific to this organisation. No standard list of architecture characteristics is ever complete; real architectures accumulate domain-specific "-ilities" that only make sense in context (→ [[sources/fundamentals-of-software-architecture]] Ch 4).

## How Many to Support — Least Worst Architecture

Architects should limit characteristics to the fewest that matter most. There are two reasons: (1) every additional characteristic adds design constraints and complexity, and (2) characteristics frequently conflict — security degrades performance (encryption adds overhead), high deployability conflicts with simplicity (pipeline infrastructure has a cost), scalability conflicts with cost.

> "Never shoot for the best architecture, but rather the least worst architecture." (→ [[sources/fundamentals-of-software-architecture]] Ch 4)

Too many characteristics produce a generic solution optimised for everything and therefore for nothing. Richards & Ford suggest treating ~7 as an informal ceiling. This principle pairs with the First Law: since everything is a trade-off, optimising for all characteristics simultaneously means accepting the worst of all trade-offs rather than deliberately choosing which trade-offs to make.

**Scalability vs elasticity** are a commonly conflated pair: *scalability* is the ability to handle growing sustained concurrent load; *elasticity* is the ability to respond to sudden burst spikes. A financial reporting system needs scalability at month-end; a ticketing platform for a concert announcement needs elasticity. They are different constraints requiring different architectural approaches.

## Selecting Characteristics

**Vasa anti-pattern:** designing an architecture that supports every possible characteristic produces a generic solution optimised for nothing. The Vasa was a 17th-century Swedish warship that sank on its maiden voyage because excessive armament made it unstable. The architectural equivalent is an over-specified system that satisfies every "-ility" in theory but performs poorly in practice. Solution: select the fewest characteristics that matter most.

**Stakeholder collaboration technique:** present domain stakeholders with the full list of characteristics and ask them to *select* the top 3 — not rank all of them. Selection forces genuine prioritisation and surfaces hidden disagreements between business and technical stakeholders. The "eliminate the least important" framing (ask what can be dropped rather than what is most important) is sometimes more productive.

**Domain concern → architecture characteristic translation:**

| Domain concern | Architecture characteristics |
|---|---|
| Mergers/acquisitions | Interoperability, scalability, adaptability, extensibility |
| Time to market | Agility + testability + deployability (not just agility) |
| User satisfaction | Performance, availability, fault tolerance, testability, deployability, agility, security |
| Competitive advantage | Agility, testability, deployability, scalability, availability, fault tolerance |
| Time and budget | Simplicity, feasibility |

A common mistranslation: "time to market" → "agility." Agility alone is insufficient; testability and deployability are equally required. An agile codebase that cannot be tested or deployed quickly does not reduce time to market.

**Litmus test — architecture vs domain characteristic:** does the requirement need domain knowledge to implement, or can it be discussed in the abstract regardless of application type? *Elasticity* is abstract — the same concern applies to banking, catalogue sites, and streaming video. A "reputation index" is not abstract — it requires a domain expert to explain. Abstract requirements → architecture characteristics. Domain-specific requirements → design decisions in the domain layer.

Extraction process:
1. Read domain requirements and domain context documents.
2. Listen for domain-concern phrases: "we're expecting rapid growth" → scalability/elasticity; "we can't afford downtime" → availability; "mergers likely" → interoperability/modularity.
3. Identify implicit characteristics (security, reliability, etc.).
4. Translate business concerns into architecture "-ilities" using the domain concern table above (time-to-market → agility + testability + deployability; cost reduction → simplicity/testability).

## Governance

Once characteristics are identified, they must be measured and protected. Measurement options:
- **Cyclomatic complexity** (structural): McCabe's CC, threshold ≤ 10 per method.
- **Afferent/efferent coupling** (structural): fan-in/fan-out per component.
- **Fitness functions** (automated governance): see [[concepts/fitness-functions]].
- **Process measures**: cycle time, test coverage, deployment frequency.

> **Open question:** The ISO defines formal vocabulary for quality attributes (ISO 25010). FOSA uses its own informal list. Cross-referencing these would clarify which ISO attributes map to FOSA categories and which are omitted.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Provides explicit taxonomy (operational/structural/cross-cutting); introduces selection and governance techniques; treats as primary input for style selection |
| [[sources/understanding-distributed-systems]] | Treats non-functional requirements implicitly through the lens of specific problems (consistency, availability, fault tolerance) rather than as a formal taxonomy |

## Related Concepts

- [[concepts/architecture-quantum]] — scopes which set of characteristics applies to which part of the system
- [[concepts/fitness-functions]] — the mechanism for governing characteristics over time
- [[distributed/cap-theorem]] — the fundamental consistency vs. availability trade-off under partitions
- [[distributed/consistency-models]] — the spectrum of consistency characteristics
- [[comparisons/architecture-styles-comparison]] — characteristics ratings for all 8 styles

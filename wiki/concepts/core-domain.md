---
title: "Core Domain and Strategic Distillation"
type: concept
tags: [ddd, strategic-design, core-domain, distillation, bounded-contexts, subdomains]
sources: [domain-driven-design]
created: 2026-05-14
updated: 2026-05-14
---

# Core Domain and Strategic Distillation

## Definition

The CORE DOMAIN is the distinctive part of the model, central to the users' goals, that differentiates the application and makes it valuable. Distillation is the process of separating this core from the mass of supporting complexity to make it visible, to direct resources toward it, and to make the design easier to work with (→ [[sources/domain-driven-design]] ch. 15).

> "The harsh reality is that not all parts of the design are going to be equally refined. Priorities must be set." (Evans, ch. 15)

## The Motivating Problem

In large systems, the element that creates the most business value — the CORE DOMAIN — tends to be the part that receives the least engineering attention. Strong developers gravitate to technically interesting infrastructure problems or neatly defined supporting problems. The domain-specific differentiating logic ends up with less-skilled developers who turn it into a data schema and feature-by-feature additions with no conceptual model. The result: technically excellent infrastructure, mediocre core.

Strategic distillation is the discipline that counteracts this gravity.

## What the CORE DOMAIN Is

The CORE DOMAIN is context-dependent. A money model is generic for most applications but is CORE for a currency trading platform. The same concept (e.g., "scheduling") may be CORE in one business and supporting in another. Identification evolves with domain understanding — what appears central at first may turn out to be supporting; what seemed peripheral may prove essential.

The CORE DOMAIN is what should be:
- Kept secret as a competitive advantage
- Assigned the best developers
- Given the deepest models and most supple designs
- The first target of refactoring when resources are constrained

## The Escalation of Distillation Techniques

Evans describes a range of techniques ordered from minimum investment to maximum investment:

### DOMAIN VISION STATEMENT (lightest)
A one-page description of the CORE DOMAIN and the value it brings — the "value proposition." Ignores aspects that don't distinguish this domain model from others. Written early, revised as insight deepens. Shared across technical and non-technical team members. Serves as a guidepost for resource allocation and modeling choices throughout development. Distinguished from a typical vision statement by focusing on the *nature of the domain model*, not the system's features.

Useful content: what the model represents, what interests it balances, what makes it valuable. Non-useful content: UI requirements, technology choices, performance targets.

### HIGHLIGHTED CORE
Two forms:
- *Distillation document*: 3–7 sparse pages describing the CORE and primary interactions among CORE elements. Minimalist — describes entry points, not complete design. When a change requires updating the distillation document, the whole team must be notified (it signals a meaningful CORE change).
- *Flagged CORE*: annotate elements directly in the primary model repository (UML stereotypes, comments, JavaDoc) to mark whether each element is inside or outside the CORE. Low overhead; makes "what is CORE" effortless to answer.

Both techniques require no structural change to the design.

### GENERIC SUBDOMAINS (first structural change)
Identify cohesive subdomains that are *not* the motivation for the project. Factor them out into separate MODULES. Leave no trace of your specialties in them. Four implementation options, roughly ordered by overhead:
1. Off-the-shelf solution (mature, externally maintained, but may not integrate well)
2. Published design or model (Fowler's Analysis Patterns; accounting standards; physics formulas)
3. Outsourced implementation (core team stays focused; forces interface-oriented design; reintegration overhead)
4. In-house implementation (easy integration; get exactly what you need; maintenance burden)

**Generic doesn't mean reusable**: don't design GENERIC SUBDOMAINS for reusability. Design for what you need. Model reuse (reusing published domain models) often yields more value than code reuse.

**Project risk management**: the first iteration of a system should be based on a part of the CORE DOMAIN, not on supporting GENERIC SUBDOMAINS. Domain modelling risk is often underestimated.

### COHESIVE MECHANISMS (encapsulate computation)
When complex algorithms bloat the domain model, extract a conceptually coherent computation into a separate lightweight framework. Expose it through an INTENTION-REVEALING INTERFACE. The model states the problem ("what"); the COHESIVE MECHANISM solves it ("how"). Example: a graph traversal framework for an organisational hierarchy model.

*GENERIC SUBDOMAIN vs COHESIVE MECHANISM*: a GENERIC SUBDOMAIN models a part of the domain using an expressive model (concepts from the world). A COHESIVE MECHANISM solves a computational problem — it doesn't represent the domain, it serves it. "A model proposes; a COHESIVE MECHANISM disposes."

A MECHANISM is only part of the CORE DOMAIN when the algorithm itself is proprietary and differentiating (e.g., a proprietary risk-rating algorithm at an investment bank).

### SEGREGATED CORE (structural separation)
Refactor the model to separate CORE concepts from supporting elements. Move CORE classes into explicitly named MODULES, sever non-core data and functionality, reduce and clarify connections to supporting MODULES. Steps: identify a CORE subdomain → move to new MODULE → sever non-core → refactor for cohesion and minimised coupling → repeat.

Cost: potentially wide-impact changes across the system. Benefit: the CORE DOMAIN becomes directly visible in the code. Team decision required — everyone must agree on what is CORE.

### ABSTRACT CORE (most ambitious)
Identify the most fundamental concepts and factor them into distinct abstract classes or interfaces. Place this abstract model in its own MODULE. Specialised implementation classes remain in their own subdomain MODULES. The ABSTRACT CORE provides a succinct view of the main concepts and their interactions without the implementation details.

Only viable when interactions between subdomains can be expressed at the level of polymorphic interfaces that correspond to genuine domain concepts. The end result resembles a formalised version of the distillation document.

## Choosing Refactoring Targets

When a large system is poorly factored and resources are limited:
- In a pain-driven situation: check if the root of the pain is in the CORE DOMAIN or in the CORE-to-supporting relationship. If so, fix it first.
- When refactoring freely: focus first on better factoring of the CORE DOMAIN, improving the segregation of the CORE, and purifying supporting subdomains to be GENERIC.

This produces "the most bang for your refactoring buck."

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/domain-driven-design]] | Originating treatment (ch. 15): core domain, generic subdomains, the full escalation of distillation techniques; domain vision statement; highlighted core; cohesive mechanisms; segregated core; abstract core |
| [[sources/learning-domain-driven-design]] | Khononov uses "core subdomain" (Khononov's taxonomy: core/generic/supporting) as the equivalent concept; more explicit classification criteria; explicitly links subdomain type to implementation strategy (ch. 1) |

## Related Concepts

- [[concepts/bounded-contexts]] — the CORE DOMAIN often spans one or more BOUNDED CONTEXTS; distillation and context boundaries inform each other
- [[concepts/model-driven-design]] — the CORE DOMAIN is where supple design and deep modelling pay off most; a breakthrough in the CORE changes the trajectory of an entire project
- [[concepts/supple-design]] — deep models in the CORE DOMAIN yield supple designs that enable declarative client code
- [[concepts/large-scale-structure]] — large-scale structure clarifies the relationships within the CORE DOMAIN and between GENERIC SUBDOMAINS; the structure itself may be CORE
- [[patterns/context-map]] — the CORE DOMAIN typically appears in one or two BOUNDED CONTEXTS on the CONTEXT MAP; its integration patterns with supporting contexts require careful attention

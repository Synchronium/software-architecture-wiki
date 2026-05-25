---
title: "Bounded Contexts and Domain-Driven Design"
type: concept
tags: [ddd, bounded-contexts, domain, subdomains, microservices, coupling, conways-law, ubiquitous-language]
sources: [domain-driven-design, building-event-driven-microservices, learning-domain-driven-design, monolith-to-microservices]
created: 2026-05-14
updated: 2026-05-15
---

# Bounded Contexts and Domain-Driven Design

## DDD Foundations

Domain-driven design (Eric Evans, 2003) provides the conceptual vocabulary for aligning software boundaries with business boundaries. The key terms:

**Domain**: the problem space a business occupies and provides solutions to. Exists independently of any specific implementation — it's the business reality, not the software.

**Subdomain**: a fine-grained area of business activity. All subdomains together form the business domain. Subdomains are themselves domains — the decomposition can recurse as granularity requires.

**Domain (or subdomain) model**: an abstraction of the domain useful for business purposes. Models belong to the solution space; they are constructs built to solve problems in the domain.

**Bounded context**: the logical boundary — including inputs, outputs, events, processes, requirements, and data models — relevant to a subdomain. A bounded context is the unit of implementation ownership in microservice architectures. While ideally a bounded context aligns perfectly with its subdomain, legacy systems and technical debt create exceptions (→ [[sources/building-event-driven-microservices]] ch. 1).

## Subdomain Taxonomy

Khononov (→ [[sources/learning-domain-driven-design]] ch. 1) provides the definitive taxonomy of subdomain types. The type determines implementation strategy:

| Type | Competitive advantage | Complexity | Volatility | Implementation | Problem type |
|------|-----------------------|------------|------------|----------------|--------------|
| **Core** | Yes | High | High | In-house (best engineers) | Interesting |
| **Generic** | No | High | Low | Buy/adopt off-the-shelf | Solved |
| **Supporting** | No | Low | Low | In-house or outsource | Obvious |

**Core subdomains** are what a company does *differently* from its competitors. Must be hard to copy — competitive advantage requires high entry barriers. Because they are emergent (never finished, continuously evolving), they need the most advanced engineering techniques and the organisation's best talent. Core subdomains are not necessarily technical: a jewellery designer's competitive advantage is the design, not the online shop.

**Generic subdomains** are complex but already-solved problems (authentication, encryption, accounting, billing). Use existing solutions rather than implementing from scratch — the existing solution is likely more reliable, more secure, and cheaper than a bespoke one.

**Supporting subdomains** have simple business logic (CRUD interfaces, ETL transformations) that supports the core but provides no competitive advantage. Simple enough to outsource or assign to junior engineers. No ready-made solutions exist (otherwise they'd be generic), but the simplicity means the cost of building them is low.

**Identifying boundaries**: start with departments/organisational units (coarse-grained), then drill down. Use "coherent use cases" as the stopping criterion — a set of interrelated use cases operating on the same actors and data is a subdomain boundary. For core subdomains, distil as far as possible to extract generic and supporting concerns. For generic/supporting, stop when further distillation yields no new strategic insight.

**Heuristics**:
- "Would someone pay for this on its own?" → core
- "Is it simpler to hack a quick implementation than to integrate an external solution?" → supporting (not generic)
- "Does this logic resemble complex algorithms and business rules, or CRUD interfaces?" → former is core; latter is supporting

## What Is a Bounded Context?

A bounded context is the consistency boundary of a ubiquitous language. Within a bounded context, a model is consistent, precise, and unambiguous. The same term can mean something entirely different in a different bounded context — this is intentional, not a problem (→ [[sources/learning-domain-driven-design]] ch. 3).

**The motivating problem**: different domain experts hold inconsistent models of the same entity. In a telemarketing company, "lead" means a contact event in the marketing department but a full lifecycle process in the sales department. A single enterprise-wide model produces an enormous ERD that is the "jack of all trades, master of none" — overcomplicated everywhere, useful nowhere.

The solution: divide the [[concepts/ubiquitous-language]] into multiple fine-grained languages, each with an explicit applicability context.

> "A model cannot exist without a boundary; it will expand to become a copy of the real world." (→ [[sources/learning-domain-driven-design]] ch. 3)

**Scope**: bounded context size is not dictated by a rule — it depends on the problem domain. Too wide: hard to keep the language consistent. Too narrow: excessive integration overhead. Reasons to split a context further include: constituting new engineering teams, needing different scaling characteristics, or needing independent deployment lifecycles. Avoid splitting coherent use cases (same actors, same data) — that forces simultaneous deployment and defeats the purpose.

## Subdomains vs Bounded Contexts

This is the most important distinction in strategic DDD:

| | Subdomains | Bounded Contexts |
|-|------------|------------------|
| Origin | Discovered (defined by business strategy) | Designed (strategic engineering decisions) |
| Who defines | The business; software engineers analyse | Software architects and engineers |
| Nature | Problem space | Solution space |
| Relationship | Often 1:1 with bounded contexts, but not required | Can span multiple subdomains, or subdivide one |

The design decision of how many bounded contexts to create, and where their boundaries fall, is the architect's choice. One bounded context per subdomain is common and reasonable. Using multiple bounded contexts for one subdomain is valid when different parts need different models. A single bounded context spanning multiple subdomains is valid for small systems. (→ [[sources/learning-domain-driven-design]] ch. 3)

## Physical and Ownership Boundaries

**Physical boundaries**: each bounded context should be implemented as an independent service or project — independently developed, versioned, and deployed. This allows each bounded context to use the technology stack that best fits its needs. When a bounded context contains multiple subdomains, the bounded context is the physical boundary and each subdomain is a logical boundary (namespace, module, package).

**Ownership boundaries**: exactly one team owns each bounded context. Two teams cannot work on the same bounded context — that would recreate the implicit assumptions that bounded contexts are designed to eliminate. One team can own multiple bounded contexts; the constraint is unidirectional. (→ [[sources/learning-domain-driven-design]] ch. 3)

## Bounded Context Sizing Heuristic

> "Treat the bounded context's size as a function of the model it encompasses." — Nick Tune (cited in → [[sources/learning-domain-driven-design]] ch. 10)

A common mistake is optimising for *small* bounded contexts. Size is one of the least useful heuristics. The correct approach is the inverse: let the model determine the size.

**When to start wide**: cross-context changes require inter-team coordination and are expensive. If bounded context boundaries turn out to be wrong (especially likely during early implementation of a core subdomain), refactoring *logical* boundaries (within a wide context) is much cheaper than refactoring *physical* boundaries (separate services, separate deployments). For core subdomains — which are volatile and uncertain by definition — start with a wide bounded context. Include other subdomains that the core interacts with most heavily.

**When to split**: decompose only when you have enough domain knowledge to do it correctly. Triggers: gaining domain expertise that reveals distinct models; adding new engineering teams that need ownership boundaries; requiring different scaling or deployment lifecycles per module. Avoid splitting use cases that are coherent (same actors, same data) — forced coordination defeats the purpose.

**Implication**: microservices are bounded contexts at their natural granularity, but starting with a monolith or a wide bounded context is the safer default during the uncertain early phases of a core subdomain. Decompose as knowledge stabilises. (→ [[sources/learning-domain-driven-design]] ch. 10, ch. 14)

## Subdomain Type Evolution

Subdomain types are not fixed — they evolve as business strategy and competitive landscape change. All six transitions are possible (→ [[sources/learning-domain-driven-design]] ch. 11):

| Transition | Cause |
|------------|-------|
| Core → Generic | A competitor or SaaS provider commoditises what was previously a differentiator |
| Generic → Core | The organisation decides to invest in a bespoke implementation for strategic advantage (Amazon AWS example) |
| Supporting → Generic | An open-source or off-the-shelf solution becomes available for what was a bespoke CRUD system |
| Supporting → Core | Business logic grows in complexity in a way that creates competitive advantage |
| Core → Supporting | The previously complex logic is simplified; investment no longer justified |
| Generic → Supporting | Integration cost of an external solution exceeds building a simple in-house version |

**Strategic design consequences**: a change in subdomain type directly affects integration patterns and implementation strategy:
- A core subdomain gains separate ways and loses the conformist pattern
- A generic subdomain loses the need for anticorruption layers and in-house investment
- Duplication (separate ways) is only appropriate for generic and supporting subdomains; if a subdomain turns core, the separated implementations must be integrated

**Tactical design signal**: the primary indicator of a subdomain type change is when the existing technical design can no longer support business needs. A supporting subdomain using transaction script that accumulates complex rules and invariants is a sign of core subdomain emergence. Use the "pain" of maintaining the existing design as a trigger to reassess subdomain classification.

## Growth Management

As a project grows, design boundaries accumulate accidental complexity. Three levels to monitor (→ [[sources/learning-domain-driven-design]] ch. 11):

**Subdomains**: revisit boundaries using the coherent-use-cases heuristic. If a subdomain has grown to contain distinct sets of use cases with different actors and data, split it. Especially important for core subdomains — distil out generic and supporting concerns so that engineering investment focuses where it matters.

**Bounded contexts**: bounded contexts that lose focus and accumulate unrelated logic are accumulating accidental complexity. Signs: a bounded context becomes "chatty" and cannot complete operations without calling multiple other contexts — redesign boundaries for greater autonomy. Always look to extract laser-focused bounded contexts.

**Aggregates**: aggregates that grow beyond their original consistency boundary are accumulating accidental complexity. When an aggregate includes data not required to be strongly consistent with its core logic, extract it. Extracted aggregates often reveal hidden models that warrant their own bounded contexts.

The guiding principle: **eliminate accidental complexity; manage essential complexity** using DDD tools.

## Properties of Well-Designed Bounded Contexts

**High cohesion**: internal operations should be intensive and closely related. Most communication should happen *within* the context, not across its boundaries. High cohesion reduces design scope and simplifies implementation.

**Loose coupling**: changes made within one bounded context should minimise or eliminate impact on neighbouring contexts. Loose coupling prevents requirement changes in one context from cascading through the system.

**Business-requirement alignment**: bounded contexts should be designed around business requirements, not technical requirements. Business requirements change; implementation technology changes more rarely and independently. Aligning on business requirements allows teams to make changes in a loosely coupled, highly cohesive way with minimal inter-team dependencies.

**Anti-pattern — technical alignment**: organising bounded contexts by technical layer (frontend team, backend team, DBA team) distributes business responsibility across multiple contexts. A single business requirement change requires coordination across all teams touching that technical layer. No single team can deliver a feature end-to-end. This pattern is frequently seen in decomposed monoliths that retained their technical layering.

## Three Communication Structures

Bellemare identifies three communication structures in any organisation (→ [[sources/building-event-driven-microservices]] ch. 1). Understanding their interaction explains why data access is hard in traditional architectures:

**Business communication structure**: how teams and departments communicate with one another to fulfil goals. Dictates ownership and responsibility assignment. Changes over time as organisations grow and restructure.

**Implementation communication structure**: the data and logic pertaining to subdomain models. Formalises business processes and data structures. The quintessential example is the monolithic database application — data and logic are held together and accessed internally. Implementation structures excel at serving their own bounded context but are poor at sharing data across context boundaries.

**Data communication structure**: the mechanism by which data flows across business contexts and between implementations. Historically absent or ad hoc in most organisations. When missing, the implementation communication structure plays double duty — leaking internal data models, creating point-to-point couplings, and accumulating tribal knowledge. This is the structural root cause of most distributed systems complexity.

**EDM's contribution**: event-driven microservices formalise the data communication structure. Event streams become the canonical mechanism by which any team can access domain data from any other team, without coupling to that team's implementation. Producers publish to event streams; consumers read independently. The event broker is the data communication layer (→ [[styles/event-driven-architecture]]).

## Conway's Law Implications

Conway's Law (→ [[concepts/conways-law]]) predicts that software structure mirrors team communication structure. This applies directly to bounded contexts:
- Teams organised around technical layers → technically partitioned architectures → implementation communication structure plays double duty → data silos
- Teams organised around bounded contexts → domain-partitioned architectures → independent ownership of data and logic → event streams enable decoupled data sharing

The Inverse Conway Maneuver (restructuring teams to produce the desired architecture) requires aligning team boundaries with bounded context boundaries first. The event stream then provides the data communication layer that previously required point-to-point couplings or shared databases.

## Relationship to Microservice Sizing

A bounded context is the natural unit of microservice granularity — one team, one bounded context, one (or a small set of) microservices. A "small" microservice is typically scoped to something that:
- Can be mentally modeled by one person
- Takes no more than ~two weeks to rewrite
- Maps cleanly to a single business responsibility within a bounded context

Service granularity below the bounded context level introduces excessive inter-service coordination for what would otherwise be internal calls (→ [[concepts/service-granularity]]).

## Evans' Originating Treatment

Evans introduced BOUNDED CONTEXT in ch. 14 (→ [[sources/domain-driven-design]]) as the primary tool for maintaining model integrity in systems that necessarily contain multiple models.

**The core motivation**: large systems inevitably contain more than one model. Without explicit boundaries, models blur — terms that seem the same actually mean different things (false cognates), or the same concept is tracked in duplicate and diverges over time (duplicate concepts). The BOUNDED CONTEXT makes the boundary explicit so each model can be kept internally consistent.

**Continuous Integration within a context**: Evans pairs BOUNDED CONTEXT with CONTINUOUS INTEGRATION as the mechanism that keeps a context unified: frequent code merges prevent divergence; exercises of the UBIQUITOUS LANGUAGE in conversation prevent conceptual drift. Together they are the maintenance practice for a healthy context.

**The CONTEXT MAP**: Evans' term for the high-level diagram of all contexts and their integration relationships. The map names enter the UBIQUITOUS LANGUAGE; it must reflect current reality, not aspirational structure. Evans describes specific integration patterns (SHARED KERNEL, CUSTOMER/SUPPLIER, CONFORMIST, ANTICORRUPTION LAYER, SEPARATE WAYS, OPEN HOST SERVICE, PUBLISHED LANGUAGE) as the vocabulary for annotating the map.

**Context sizing**: Evans frames the tension as a trade-off between larger contexts (smoother flow, shared language, simpler model) and smaller contexts (smaller teams, easier CI, specialised vocabularies). His rule of thumb: one team per context; one team can own multiple contexts but multiple teams cannot share one effectively.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/domain-driven-design]] | Originating treatment (ch. 14): BOUNDED CONTEXT as model integrity tool; CONTINUOUS INTEGRATION as the maintenance practice; CONTEXT MAP as the global diagram; full integration pattern vocabulary |
| [[sources/learning-domain-driven-design]] | The definitive treatment: full subdomain taxonomy (core/generic/supporting), bounded context definition, ubiquitous language, integration patterns, tactical patterns — DDD as a complete methodology |
| [[sources/building-event-driven-microservices]] | Focuses on the three communication structures; bounded context alignment on business vs technical requirements; event streams as the data communication layer |
| [[sources/fundamentals-of-software-architecture]] | Mentions bounded contexts as the design principle behind technical vs domain partitioning; used to justify microservices and service-based architecture boundaries |
| [[sources/software-architecture-the-hard-parts]] | Applies bounded context thinking to data ownership — each domain service owns its data; cross-domain data access requires explicit patterns (→ [[concepts/data-decomposition]]) |
| [[sources/monolith-to-microservices]] | Migration-focused treatment: bounded contexts are the *primary unit of decomposition* in a microservice migration. Start by mapping BCs from domain modelling (EventStorming); each BC is a candidate service. Use inbound/outbound dependency counts between BCs to prioritise extraction order — low inbound dependencies = easier to extract without touching the monolith. Split on aggregate boundaries only when team size or loose aggregate coupling justifies it. |

## Related Concepts

- [[concepts/ubiquitous-language]] — each bounded context has its own ubiquitous language; the two concepts are mutually defining
- [[concepts/technical-vs-domain-partitioning]] — bounded context alignment predicts architectural partitioning style
- [[concepts/conways-law]] — team communication structure mirrors bounded context structure; one team per bounded context is the ownership rule
- [[concepts/service-granularity]] — bounded context as the natural sizing unit for microservices
- [[styles/event-driven-architecture]] — EDM provides the data communication layer that formalises cross-context data sharing
- [[concepts/data-decomposition]] — data ownership within and across bounded contexts
- [[concepts/modularity]] — cohesion and coupling metrics operationalise bounded context design quality
- [[patterns/context-map]] — graphical notation for plotting integration between bounded contexts
- [[patterns/anti-corruption-layer]] — the mechanism for protecting a downstream bounded context's model from an upstream's language
- [[comparisons/build-vs-buy]] — subdomain taxonomy (core/generic/supporting) is the primary framework for the build-vs-buy decision

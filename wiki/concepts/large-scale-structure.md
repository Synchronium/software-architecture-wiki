---
title: "Large-Scale Structure"
type: concept
tags: [ddd, domain-driven-design, strategic-design, architecture-patterns, responsibility-layers]
sources: [domain-driven-design]
created: 2026-05-14
updated: 2026-05-14
---

# Large-Scale Structure

## Definition

A large-scale structure is a language that lets you discuss and understand a system in broad strokes. A set of high-level concepts or rules — or both — establishes a pattern of design for an entire system, allowing the role of each individual part to be understood without detailed knowledge of the whole (→ [[sources/domain-driven-design]] ch. 16).

## Why It Matters

BOUNDED CONTEXTS prevent corruption but do not themselves make a system comprehensible as a whole. Distillation focuses attention on the CORE DOMAIN but doesn't explain how supporting elements relate to each other or to the CORE. On large projects, without an overarching principle developers cannot make design decisions that are consistent with each other; specialists in different modules cannot help each other; Continuous Integration breaks down.

A large-scale structure is optional — it should only be imposed when costs and benefits favour it, and when a fitting structure can actually be found. An ill-fitting structure is worse than none.

## Evolving Order

The primary rule: **let the structure evolve with the application**. Up-front architectural impositions become straitjackets. Developers dumb down the application to fit the structure, or subvert it, producing no structure at all.

The structure must be:
- Applicable across BOUNDED CONTEXTS (it provides a unifying vocabulary for the whole project)
- Loose enough to accommodate practical constraints (legacy systems, external subsystems)
- Minimal — address the most serious concerns, leave the rest case-by-case
- Allowed to change completely as understanding deepens

"Large-scale structure should be applied when a structure can be found that greatly clarifies the system without forcing unnatural constraints on model development. Less is more."

## The Four Patterns

### SYSTEM METAPHOR
A concrete analogy that captures team imagination and leads thinking in a useful direction. The classic example: "firewall" in networking. When a metaphor fits, it shapes design decisions consistently across teams and BOUNDED CONTEXTS; it becomes a reference point in discussions more concrete than the model itself.

Use when a genuine metaphor presents itself. Don't force one — XP's "naive metaphor" (using the domain model itself as the system metaphor) conflates the concept and should be retired. If no metaphor presents itself, the UBIQUITOUS LANGUAGE is sufficient.

Risk: all metaphors carry baggage; overextended metaphors lead the design astray.

### RESPONSIBILITY LAYERS
Partition the domain model by broad responsibility categories that correspond to natural domain strata. Objects, AGGREGATES, and MODULES are assigned so each fits within exactly one layer. Layer dependencies flow downward: upper layers depend on lower; lower layers are independent of upper.

Characteristics of good layers:
- *Storytelling*: layers communicate the domain's priorities and realities, not just technical concerns
- *Conceptual dependency*: upper-layer concepts have meaning against the backdrop of lower-layer concepts; lower-layer concepts are meaningful standing alone
- *CONCEPTUAL CONTOURS*: different rates of change or different sources of change are accommodated by layer boundaries

Common layer vocabulary in enterprise systems:
- **Potential (Capability)**: what the organisation *can* do — resources, people, contracts, infrastructure
- **Operations**: what the organisation *is doing* — active activities, current state, operational plans
- **Decision Support**: what action *should* be taken — analysis, automated decision making, recommendations
- **Policy**: what the *rules and goals* are — constraints and targets that govern other layers (often passive; may be implemented in a rules engine while sharing the domain model)
- **Commitment**: what the organisation *has promised* — combines policy-like goal-setting with operations-like emergence from ongoing activity

Keep layering to 4–5 layers maximum. More layers recreate the complexity the structure was meant to solve.

**Effect on design decisions**: once layers are adopted, design choices that violate the layering must be refactored. Example: an attribute encoding a decision-making policy on a Capability-layer entity violates the structure; it must be extracted into the Decision Support layer as an explicit Policy object.

### KNOWLEDGE LEVEL
A group of objects that describes how another group of objects should behave. Separates the *meta level* (Knowledge Level: rules, types, long-standing policies) from the *operations level* (base level: day-to-day operational objects). Based on the REFLECTION pattern from POSA (Buschmann et al. 1996), applied to the domain layer rather than the technical infrastructure.

Used when roles and relationships between ENTITIES must be customised at installation or runtime. The operations-level objects reference knowledge-level objects for their rules; the knowledge-level objects describe the structure and constraints of the operations level.

Unlike RESPONSIBILITY LAYERS, dependencies in KNOWLEDGE LEVEL run *bidirectionally* between levels. It can coexist with most other large-scale structures as an additional dimension of organisation.

Employee payroll example: EmployeeType (Knowledge Level) constrains Employee (Operations Level) by associating it with a Retirement Plan and a Payroll. A superuser configures the Knowledge Level; ordinary users work with the Operations Level. This separation allows policy to be explicit without overconstrained or underconstrained base objects.

Use sparingly — it adds indirection and makes system behaviour harder to understand if the Knowledge Level itself becomes complex.

### PLUGGABLE COMPONENT FRAMEWORK (most mature)
Distill an ABSTRACT CORE of interfaces and interactions; create a framework that allows diverse implementations to be freely substituted. Any application uses those components strictly through the ABSTRACT CORE's interfaces. The central hub operates within a SHARED KERNEL; individual components may be in separate BOUNDED CONTEXTS.

Requires precision in interface design and a deep model to capture the necessary behaviour in the ABSTRACT CORE. Only viable after multiple applications have already been implemented in the same domain. Downside: freezes CORE refactoring — the ABSTRACT CORE cannot be changed without changing all components' protocols.

SEMATECH CIM Framework example: defined abstract interfaces for semiconductor MES domain (Process Machine, Lot Movement); required all applications to implement a hosting protocol. Allowed thousands of developers to build interoperable components independently.

## How Restrictive Should a Structure Be?

Ranges from loose (SYSTEM METAPHOR) to restrictive (PLUGGABLE COMPONENT FRAMEWORK). The most important contribution is conceptual coherence and insight into the domain. Resist the temptation to build frameworks that regiment the implementation of the structure. "Each structural rule should make development easier."

## Refactoring Toward a Fitting Structure

- **Minimalism**: keep simple and lightweight; don't attempt to be comprehensive
- **Communication and self-discipline**: the structure's terminology must enter the UBIQUITOUS LANGUAGE; the entire team must follow it
- **Restructuring yields supple design**: models that have been structurally transformed repeatedly become easier to transform again — like a leather jacket that softens with wear
- **Distillation lightens the load**: removing GENERIC SUBDOMAINS and COHESIVE MECHANISMS from the CORE leaves less to restructure; supporting elements should be designed to fit cleanly within the structure

## Who Sets the Structure?

Two patterns Evans observed:
1. *Emergent structure*: self-disciplined teams with good communication; informal leaders (often the coach); organic order from EVOLVING ORDER
2. *Customer-focused architecture team*: collaborating peer teams, not ivory tower; team members rotate through application teams; decisions absorb feedback from hands-on development

Six essentials for strategic design decision making: decisions reach everyone → process absorbs feedback → plan allows evolution → architecture teams don't siphon the best talent → minimalism and humility → developers are generalists, objects are specialists.

**Beware the Master Plan** (Christopher Alexander's critique): master plans create totalitarian, not organic, order. They are too rigid and too imprecise at the same time. The analogy to software: a set of principles for piecemeal growth produces order that adapts to circumstances; a master plan produces order that constrains them.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/domain-driven-design]] | Originating treatment (ch. 16–17): large-scale structure as optional complement to bounded contexts and distillation; four patterns (System Metaphor, Responsibility Layers, Knowledge Level, Pluggable Component Framework); Evolving Order; who sets strategy; six essentials |

## Related Concepts

- [[concepts/core-domain]] — large-scale structure clarifies the CORE DOMAIN's position in the whole; the structure itself may be part of the CORE
- [[concepts/bounded-contexts]] — large-scale structure typically spans multiple BOUNDED CONTEXTS; one structure can organise the entire CONTEXT MAP
- [[concepts/supple-design]] — CONCEPTUAL CONTOURS from supple design guide where to draw layer boundaries; repeatedly restructured designs become supple
- [[concepts/model-driven-design]] — large-scale structure is a strategic complement to the tactical MODEL-DRIVEN DESIGN; must not prevent model-code alignment
- [[patterns/context-map]] — a large-scale structure organises the CONTEXT MAP when it spans multiple BOUNDED CONTEXTS

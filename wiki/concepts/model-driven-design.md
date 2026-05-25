---
title: "Model-Driven Design"
type: concept
tags: [ddd, domain-driven-design, modeling, implementation, architecture]
sources: [domain-driven-design]
created: 2026-05-14
updated: 2026-05-14
---

# Model-Driven Design

## Definition

**Model-Driven Design** (Evans, 2003) is the practice of tightly binding the domain model to the software implementation such that the code is a direct expression of the model. There is one model — not a separate analysis model and a separate design — and changing the code is changing the model, with effects that ripple through all project activities (→ [[sources/domain-driven-design]] ch. 3).

## The Problem It Addresses

The dominant alternative to MODEL-DRIVEN DESIGN is a two-phase approach:
1. Business analysts build an **analysis model** (conceptually correct, no implementation concerns)
2. Developers create a **design** with a loose correspondence to the analysis model

This fails for several compounding reasons:
- Crucial discoveries always emerge during implementation — the analysis model is built before these discoveries can be made
- The analysis model goes deep on irrelevant subjects and overlooks important implementation-driven insights
- Once model and code diverge, maintaining the mapping is impractical, and the model is abandoned
- Knowledge crunching in the analysis phase is wasted when developers must re-derive abstractions during coding

The result is: software that functions but cannot explain its purpose; an increasingly irrelevant model that becomes misleading documentation; and no shared language between the people who understand the domain and the people who write the code.

## The Practice

**One model, two jobs**: the domain model must be practical as both an analytical tool and as the foundation of the design. When a model doesn't express domain insight, find a new one. When a model can't be implemented practically, find a new one. Never accept the trade-off of a rich analysis model that doesn't implement, or a clean implementation that doesn't model.

**Code as the model's expression**: class names, method names, and module boundaries should be the model. The model is not a diagram or a document — those are communication aids. The code is the authoritative expression.

**The iterative loop**: modelling and implementation are a single activity. A model insight drives a code change; a coding challenge drives a model revision. Development becomes iterative refinement of model, design, and code together.

## Hands-On Modellers

Separating modelling from programming roles is directly incompatible with MODEL-DRIVEN DESIGN (→ [[sources/domain-driven-design]] ch. 3):

- Programmers are modellers whether anyone likes it or not. Every refactoring either strengthens or weakens the model. If developers don't know they're modelling, they'll weaken it without realising it.
- Modellers separated from implementation lose touch with constraints. Without feedback from code, model decisions can be wildly impractical — and by the time the damage surfaces, it's too late.
- Knowledge and skill transfer requires direct collaboration. The subtleties of a MODEL-DRIVEN DESIGN can't be conveyed through UML diagrams and design documentation alone.

**What this means in practice**: any technical person contributing to the model must write some code. Anyone who writes code must be involved in model discussions and must have access to domain experts. The sharp organisational separation of "architect" from "developer" undermines model-driven design.

## Letting the Bones Show

When the user model and the implementation model differ, users are misled. The IE Favorites example from Evans: Favorites are stored as files, but the UI presents them as a named list. When the file-naming rules leak through (illegal characters, confusing error messages), users are confused because they have no mental model of the underlying mechanism. Either expose the implementation model cleanly, or ensure the illusion is perfect — partial abstraction is the worst of both worlds.

More generally: a design based on a model that reflects user and domain concerns can reveal its structure to users, giving them consistent and predictable behaviour. Users benefit from understanding the model. Hiding it behind a different UI model adds cognitive overhead and creates opportunities for confusion.

## Relationship to Ubiquitous Language

MODEL-DRIVEN DESIGN and [[concepts/ubiquitous-language]] are mutually reinforcing:
- The UL gives the model its vocabulary; the vocabulary must appear in the code
- The model's structure gives the UL its grammar — the rules by which concepts relate and combine
- A change in the UL is a change to the model; a change to the model is a change to the code

Neither practice works without the other. A UL without a model-driven implementation is documentation without teeth. A model-driven implementation without a UL is code that can't be discussed with domain experts.

## Relationship to Layered Architecture

MODEL-DRIVEN DESIGN requires that the domain layer be **isolated** from infrastructure, UI, and application concerns (→ [[styles/layered-architecture]], [[sources/domain-driven-design]] ch. 4). Domain objects free from persistence and presentation responsibilities can be focused on expressing the model. When domain logic is mixed throughout the code, the model becomes invisible, fragile, and unmaintainable.

## Breakthroughs

Deep models rarely emerge linearly. More often, a sequence of small refinements prepares the way for a sudden breakthrough — a moment when the team realises that the model contains an inappropriate constraint, a missing concept, or a badly named abstraction that has been producing compounding complexity.

The breakthrough arrives as a new framing that is simultaneously simpler and more expressive. Domain experts who previously found diagrams "too technical" immediately recognise the new model. Persistent bugs disappear. Complexity evaporates.

Evans' syndicated loan story (→ [[sources/domain-driven-design]] ch. 8): four months of incremental refinement, escalating rounding errors, and unexplained complexity — then the realisation that Loan shares and Facility shares are independent. The missing abstraction, Share Pie, unified the model, eliminated a spurious class, and became the ubiquitous language of the whole application.

Breakthroughs cannot be manufactured but can be cultivated: knowledge crunching, explicit domain concepts, supple design, model distillation. When one appears, seize it — even if the required refactoring is large and the timing is painful. And expect one breakthrough to lead to another.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/domain-driven-design]] | Originating treatment: one model for analysis and design; iterative loop of model/code refinement; hands-on modellers; bones-showing; tied to layered architecture as structural prerequisite |
| [[sources/learning-domain-driven-design]] | Does not use "MODEL-DRIVEN DESIGN" as an explicit term, but assumes its principles throughout: all tactical patterns (aggregates, value objects, domain events) are implementations of the model; the domain model is the source of truth |

## Related Concepts

- [[concepts/ubiquitous-language]] — the shared vocabulary that the model uses and that must appear in the code
- [[styles/layered-architecture]] — structural prerequisite: the domain layer must be isolated for MODEL-DRIVEN DESIGN to be viable
- [[patterns/domain-model]] — the tactical building blocks (entities, value objects, aggregates) that implement the model in code
- [[concepts/bounded-contexts]] — scope within which a single model applies; multiple bounded contexts have multiple models
- [[concepts/evolutionary-architecture]] — MODEL-DRIVEN DESIGN enables evolutionary change: when the model improves, the code can reflect it; a model-free codebase resists change

---
title: "Supple Design"
type: concept
tags: [ddd, design-quality, value-object, side-effects]
sources: [domain-driven-design]
created: 2026-05-14
updated: 2026-05-14
---

# Supple Design

## Definition

Supple design is design that is a pleasure to work with and inviting to change. Where a deep model provides the conceptual raw material, supple design shapes that material into software that developers can use and extend without cognitive overload (→ [[sources/domain-driven-design]] ch. 10).

> "To have a project accelerate as development proceeds — rather than get weighed down by its own legacy — demands a design that is a pleasure to work with, inviting to change." (Evans, ch. 10)

## Why It Matters

Without supple design, a ceiling forms on achievable richness. Developers dread changing code they can't predict. Duplication spreads as copying is safer than reuse. Refactoring stops because no one can trace the consequences. A MODEL-DRIVEN DESIGN depends on the ability to keep model and code in lockstep through continuous refactoring; supple design is what makes that practical.

## The Six Patterns

### 1. Intention-Revealing Interfaces

Name classes and operations to describe their **effect and purpose**, not their mechanism. Every public element is an opportunity to communicate intent. Write a test for a behaviour before creating it — this forces the designer into client-developer mode, exposing whether the interface makes sense from the outside.

Names should conform to the [[concepts/ubiquitous-language]] so team members can infer meaning from context.

> Don't name it `paint(Paint p)` — name it `mixIn(Paint other)`. The name reveals what happens from the client's perspective.

### 2. Side-Effect-Free Functions

Strictly segregate **commands** (operations that change observable state) from **queries** (operations that return results without side effects). Commands should be as simple as possible and return nothing. Queries can be freely called and composed without worrying about hidden state changes.

The best way to eliminate side effects from complex logic is to move it into a VALUE OBJECT. Because value objects are immutable, all their operations are automatically side-effect-free.

```java
// Command: simple, obvious, no return value
void applyPrincipalPayment(SharePie paymentShares) {
    setShares(shares.minus(paymentShares));
}

// Query: complex logic, but no side effects — returns new value
SharePie calculatePrincipalPaymentDistribution(double amount) {
    return shares.prorated(amount);
}
```

### 3. Assertions

State **post-conditions** of operations and **invariants** of classes and aggregates. If the language doesn't support assertions directly, use automated unit tests. Class invariants help characterise the meaning of a class; post-conditions state what will be true after a command executes.

Without assertions, the side effects of commands are only known by reading implementations. With assertions, the developer using a command can trust its contract without piercing the abstraction.

### 4. Conceptual Contours

Decompose design elements along **natural joints of the domain**, not arbitrary size or technical convenience. Ask: "does this split echo a contour of the underlying domain, or is it an expedient?" 

When successive refactorings tend to be localised (small changes in a few places), the decomposition matches the domain's contours. When a change ripples widely, the model is misaligned with the domain.

> Half a uranium atom is not uranium. Don't decompose below the conceptual unit of the domain.

### 5. Standalone Classes

Reduce dependencies between classes to zero where possible. Every dependency — explicit reference or implicit concept — adds to cognitive load. The developer holding a class in mind must also hold everything it depends on. A standalone class can be understood, tested, and used entirely by itself.

The path to standalone classes is usually through VALUE OBJECTS: complex calculations factored into an immutable VALUE OBJECT naturally shed their dependencies on entities.

### 6. Closure of Operations

Define operations whose **return type is the same as the type of the argument or receiver**. Closed operations introduce no new concepts — you operate within the same set. The result can be passed back to another operation of the same type, enabling natural chaining.

```java
// All operations on SharePie return SharePie
SharePie shares = facilityShares.prorated(loanAmount);
SharePie deviation = actual.minus(shares);
SharePie combined = drawdown.plus(existingLoan);
```

Most natural on VALUE OBJECTS. Entities are rarely useful as computation results because their lifecycle has domain significance.

## The Interplay of the Patterns

The patterns build on each other:
- INTENTION-REVEALING INTERFACES make abstractions usable without understanding internals
- SIDE-EFFECT-FREE FUNCTIONS make abstractions safe to combine
- ASSERTIONS make commands trustworthy
- CONCEPTUAL CONTOURS ensure the right units exist to combine
- STANDALONE CLASSES reduce mental overhead
- CLOSURE OF OPERATIONS enables combinable, declarative expressions

Together they produce a design where client code can be written in a **declarative style**: expressing *what* the business logic means, not *how* it is computed. The SharePie example shows this: `shares.minus(payment)` reads as a statement of financial reality, not as a computation.

## Declarative Design

A design with these properties naturally edges toward declarative style. Fully declarative design (code generation, rule engines) is harder than it appears:
- Declaration languages are often not expressive enough for edge cases
- Code-generation approaches can corrupt the iterative cycle
- Sweeping frameworks constrain domain design; narrowly scoped frameworks (persistence, mapping) tend to deliver value

The practical goal is not full declarative design but a *declarative style* in the domain layer, achieved through the patterns above.

## Supple Design and Deep Models

Supple design requires deep modelling to work: a design can only be supple along the domain's natural contours if the model has found those contours. At the same time, supple design feeds back into the model: a design with easy composition and transparent effects enables a developer to experiment, explore, and discover deeper insights that would be invisible in a tangled codebase.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/domain-driven-design]] | Originating treatment: six patterns as tools for achieving suppleness; extended Shares Math example; declarative style as an outcome; connection between supple design and model breakthrough (ch. 10) |

## Related Concepts

- [[concepts/model-driven-design]] — supple design is the design complement to deep modelling; one without the other fails
- [[concepts/ubiquitous-language]] — intention-revealing interfaces must speak the UL; the model's vocabulary must appear in names
- [[patterns/domain-model]] — VALUE OBJECTS are the natural home for side-effect-free functions and closure of operations
- [[patterns/specification]] — composite Specification with AND/OR/NOT is an example of closure of operations enabling declarative style

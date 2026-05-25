---
title: "Modular Monolith Architecture"
type: style
tags: [monolith, modularity, evolutionary-architecture, coupling]
sources: [building-evolutionary-architectures, fundamentals-of-software-architecture]
created: 2026-05-14
updated: 2026-05-14
---

# Modular Monolith Architecture

## Definition

A modular monolith is a single deployable unit (one [[concepts/architecture-quantum]]) that achieves strong internal modularity through disciplined coupling control and explicit domain partitioning within the codebase. It delivers many of the cohesion and isolation benefits of microservices without the operational complexity of a distributed system (→ [[sources/building-evolutionary-architectures]] Ch 4).

## Why It Matters

> "Many of the benefits architects tout about microservices — isolation, independence, small unit of change — can be achieved in monolithic architectures…if developers are extremely disciplined about coupling." (Ch 4)

The modular monolith is a pragmatic alternative to premature migration to microservices. It is also the recommended intermediate step when migrating a layered monolith toward a distributed architecture — it imposes domain discipline and uncovers coupling problems before the operational complexity of distributed services is introduced.

> "If you can't build a monolith, what makes you think microservices are the answer?" — Simon Brown (cited Ch 4)

## Characteristics

| Property | Value |
|----------|-------|
| Partitioning | Domain (logical separation with physical packaging) |
| Quantum size | 1 (single deployment unit) |
| Deployability | Low (whole system deployed together) |
| Internal modularity | High (if discipline is maintained) |
| Operational complexity | Low |
| Testing fitness functions | Medium — modularity enables isolation; single deployment simplifies setup |

## Structure

Modules are logically partitioned by domain (not by technical layer), with explicit visibility rules enforced between them. Each module owns its domain logic; cross-module calls occur only via well-defined interfaces. Shared utilities exist but are tightly scoped.

Modern languages support this through explicit visibility modifiers, module systems (Java modules, Rust crates, Go packages), or architectural test rules:

```java
// ArchUnit fitness function: Checkout module must not reach into Payments internals
@Test
void checkoutMustNotAccessPaymentsInternals() {
    noClasses()
        .that().resideInPackage("..checkout..")
        .should().accessClassesThat()
        .resideInPackage("..payments.internal..")
        .check(classes);
}
```

Fitness functions enforcing module boundaries are essential — modern IDEs actively encourage imports that violate module discipline, so coding standards alone are insufficient (→ [[concepts/fitness-functions]]).

## Evolvability Assessment

Evaluated against the three evolutionary architecture criteria (→ [[sources/building-evolutionary-architectures]] Ch 4):

**Incremental change**: *Medium.* Modularity makes most changes local, but deployability is still whole-system. A change to any module requires redeploying the entire application. The degree of deployability improvement comes from how well modules can be independently compiled and tested.

**Fitness functions**: *Medium-High.* Module isolation makes unit testing and architectural tests easier than in an unstructured monolith. Fitness functions can verify module boundaries, coupling metrics, and internal architectural constraints. The single deployment unit simplifies test environment setup.

**Appropriate coupling**: *High (when discipline holds).* A well-designed modular monolith is a positive example of appropriate coupling — each module is functionally cohesive, interfaces are well-defined, and coupling between modules is deliberately minimised. The risk is that without automated enforcement, the discipline degrades and the architecture slides toward a Big Ball of Mud.

## When to Use

- Team is building a new system and not yet at the operational maturity needed for microservices
- Existing layered monolith is being improved before a larger migration
- Domain is well understood enough to partition by bounded context, but service deployment overhead is not yet justified
- ACID transactions are required across multiple domain concepts (impossible in microservices without saga complexity)

## Relationship to Other Styles

The modular monolith sits between the layered monolith and service-based/microservices architectures on the evolvability spectrum:

```
Layered monolith → Modular monolith → Service-based → Microservices
  (technical        (domain-logical     (domain-physical   (domain-physical
   partitioning)     partitioning,        partitioning,      partitioning,
                     single deploy)       shared DB)         independent DBs)
```

The modular monolith is the recommended intermediate migration step: impose domain discipline first (identify bounded contexts, enforce module boundaries with fitness functions), *then* extract services — because the coupling problems that make extraction hard are revealed during modularisation (→ [[concepts/evolutionary-architecture]], Strangler Fig Pattern).

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/building-evolutionary-architectures]] | Treats modular monolith as a positive pattern — achieves appropriate coupling within a single quantum; recommends it as an intermediate migration step |
| [[sources/fundamentals-of-software-architecture]] | Mentions modular monolith implicitly in discussions of monolith-to-distributed migration paths |

## Related Concepts

- [[concepts/architecture-quantum]] — modular monolith has a single quantum; module boundaries are not quantum boundaries
- [[concepts/modularity]] — connascence and coupling metrics that define module health
- [[concepts/fitness-functions]] — essential for enforcing module discipline (ArchUnit, JDepend)
- [[concepts/evolutionary-architecture]] — modular monolith as intermediate migration step
- [[styles/layered-architecture]] — the typical starting point before modularisation
- [[styles/service-based-architecture]] — the next step after modular monolith in the migration path
- [[styles/architecture-styles]] — overview and decision guide for all architecture styles
- [[comparisons/architecture-styles-comparison]] — side-by-side ratings
- [[comparisons/decomposition-strategy]] — full decision guide: when to decompose and how far

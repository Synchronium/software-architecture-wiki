---
title: "Ports and Adapters (Hexagonal Architecture)"
type: style
tags: [architecture, ddd, hexagonal, onion, clean-architecture, ports-adapters, domain-model, dependency-inversion]
sources: [learning-domain-driven-design]
created: 2026-05-14
updated: 2026-05-14
---

# Ports and Adapters (Hexagonal Architecture)

## Definition

The ports and adapters pattern (also known as *hexagonal architecture*, *onion architecture*, and *clean architecture* — three independent formulations of the same core principle) organises a system so that **the business logic sits at the centre** and all infrastructure concerns (databases, message brokers, UI, external APIs) are peripheral.

The key mechanism is the **Dependency Inversion Principle**: instead of business logic depending on infrastructure (as in layered architecture), infrastructure depends on business logic.

(→ [[sources/learning-domain-driven-design]] ch. 8)

---

## Structure

```
┌──────────────────────────────────────────────────────┐
│                  Infrastructure Layer                 │
│  ┌────────────────────────────────────────────────┐  │
│  │              Application Layer                  │  │
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │           Business Logic Layer            │  │  │
│  │  │   (Aggregates, Domain Events, Services)   │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

Three concentric rings (outside in):

**Business logic layer (core)**: domain model, domain events, domain services, value objects. No infrastructure dependencies whatsoever — these are plain objects. The only "framework" is the ubiquitous language.

**Application layer**: orchestrates commands (load → execute → persist → publish). Thin by definition — it delegates all work to the business logic layer. Depends on the business logic layer.

**Infrastructure layer**: concrete adapters for all external systems — databases, message brokers, HTTP controllers, CLI runners. Implements the ports defined in the business logic layer. Depends inward on the application and business logic layers.

---

## Ports and Adapters

**Ports**: interfaces defined *inside* the business logic layer that specify what the layer needs from the outside world. Examples: `IOrderRepository`, `INotificationService`. The business logic layer knows only the interface, not the implementation.

**Adapters**: concrete implementations of ports in the infrastructure layer. Examples: `SqlOrderRepository`, `EmailNotificationService`. Each adapter translates between the infrastructure technology and the interface the business logic expects.

This is the Dependency Inversion Principle applied architecturally:
- High-level modules (BL) do not depend on low-level modules (infrastructure).
- Both depend on abstractions (ports).
- Abstractions are owned by the high-level module (defined inside the BL layer).

---

## Comparison with Layered Architecture

| Dimension | Layered | Ports and Adapters |
|-----------|---------|-------------------|
| Dependency direction | Top-down (BL depends on DAL) | Inward (infrastructure depends on BL) |
| Business logic coupling | Coupled to DB/persistence | Completely infrastructure-agnostic |
| Testing | Requires mocking all the way down | Business logic testable in isolation (no mocks needed for DL) |
| Subdomain fit | Transaction script, active record | Domain model, event-sourced domain model |
| Where logic lives | Scattered across layers | Concentrated in the business logic layer |

Layered architecture works well for simpler business logic (transaction script, active record) because those patterns don't require infrastructure isolation. For complex business logic (domain model), ports and adapters is the right structural choice — the domain model must be free of infrastructure concerns to remain testable and evolvable. (→ [[patterns/business-logic-patterns]])

---

## Three Formulations

All three represent the same architectural principle; the naming differences are cosmetic:

| Name | Coined by | Key framing |
|------|-----------|-------------|
| Hexagonal Architecture | Alistair Cockburn | "Allow an application to equally be driven by users, programs, automated test or batch scripts, and to be developed and tested in isolation from its eventual run-time devices and databases" |
| Onion Architecture | Jeffrey Palermo | Explicitly concentric rings; innermost is the domain model |
| Clean Architecture | Robert C. Martin | Strict dependency rule: source code dependencies only point inward toward higher-level policies |

All share: domain model at centre, DIP-inverted dependencies, infrastructure isolated in the outermost ring.

---

## Architectural Slices

A critical nuance: architectural patterns are applied **per bounded context module**, not at the bounded context level. A single bounded context may use layered architecture for its simple supporting subdomain modules and ports and adapters for its core subdomain modules.

This is the "architectural slices" principle — each slice (module) chooses the appropriate pattern for its business logic complexity. Do not apply a single architectural pattern uniformly across an entire bounded context.

---

## When to Use

- Core subdomains with complex business logic using the **domain model** pattern (→ [[patterns/domain-model]])
- Event-sourced domain models (→ [[streams/event-sourcing-cqrs]])
- Any bounded context where testability of business logic without infrastructure is a priority
- Systems requiring frequent changes to infrastructure (swap database, add new adapter) without touching business logic

**Not needed** for supporting subdomains using transaction script or active record — those patterns have minimal business logic, so infrastructure isolation delivers little value at added complexity cost.

---

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/learning-domain-driven-design]] | Frames ports and adapters as the natural architectural complement to the domain model tactical pattern; contrasts with layered architecture by subdomain type; introduces the architectural slices principle (one pattern per module, not one per bounded context) (ch. 8) |

---

## Related Concepts

- [[patterns/domain-model]] — the tactical pattern that ports and adapters is designed to house; requires infrastructure isolation
- [[patterns/business-logic-patterns]] — four-pattern spectrum; ports and adapters is matched to the domain model and event-sourced domain model
- [[styles/layered-architecture]] — the simpler alternative; appropriate for transaction script and active record
- [[streams/event-sourcing-cqrs]] — event-sourced domain model requires ports and adapters for the same reasons as domain model
- [[concepts/bounded-contexts]] — architectural patterns apply per bounded context; architectural slices apply per module within a bounded context
- [[concepts/technical-vs-domain-partitioning]] — ports and adapters is the domain-partitioned architectural organisation within a single bounded context
- [[styles/architecture-styles]] — overview and decision guide for all architecture styles
- [[comparisons/architecture-styles-comparison]] — side-by-side ratings

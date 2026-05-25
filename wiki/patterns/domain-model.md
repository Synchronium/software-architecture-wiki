---
title: "Domain Model Pattern"
type: pattern
tags: [ddd, domain-model, aggregate, value-object, domain-events, domain-services, tactical-design, business-logic]
sources: [learning-domain-driven-design, domain-driven-design, patterns-of-enterprise-application-architecture]
created: 2026-05-14
updated: 2026-05-18
---

# Domain Model Pattern

## Definition

The domain model pattern implements business logic as an object model that incorporates both behaviour and data. It is oriented toward complex business logic — entangled rules, state transitions, invariants that must be protected at all times. The code should speak the bounded context's [[concepts/ubiquitous-language]].

> Use when the business logic involves complex algorithms and business processes orchestrated by complex rules and invariants — not CRUD interfaces. (→ [[sources/learning-domain-driven-design]] ch. 6)

Objects in the domain model are **plain old objects** — no infrastructure or technological concerns (no database calls, no framework coupling). This restriction keeps the model clean and testable.

## Building Blocks

### Value Object

An object identified by the **composition of its values**, not by an ID. Two value objects with identical field values are equal. Implemented as **immutable** — changing any field conceptually creates a new value.

*Why value objects*: prevents "primitive obsession" — using raw strings and ints to represent domain concepts. Value objects centralise validation, encapsulate business logic, and make the type system speak the domain language.

```
// Primitive obsession:
Person(phone: string, email: string, country: string)

// Value objects:
Person(phone: PhoneNumber, email: EmailAddress, country: CountryCode)
```

Value objects enforce their own invariants (PhoneNumber.Parse validates format), are safe to share (immutable = no side effects, thread-safe), and express domain concepts explicitly. Use them for any domain element that describes a property of another object — IDs, money, measurements, status values.

Fowler (→ [[sources/patterns-of-enterprise-application-architecture]] ch. 18) stresses immutability as non-negotiable: a mutable Value Object that is aliased (referenced from multiple places) causes subtle bugs — changing one apparent copy changes all alias holders. Immutability makes aliasing harmless. For persistence, always use Embedded Value — a Value Object has no identity and should never be stored as its own table row. The canonical example is `Money`: currency + amount as a pair, with currency-aware arithmetic, allocation methods to distribute sums without losing remainder pennies, and a `convert()` method backed by a converter object rather than simple multiplication. Naming collision: the J2EE community used "Value Object" to mean DTO; these are entirely different patterns.

### Entity

An object that requires an **explicit identification field** to distinguish instances. Two entities with the same values but different IDs are different entities. Mutable — expected to change over its lifecycle (unlike value objects). The ID must remain immutable throughout the lifecycle.

Entities are not used as an independent building block — only as components within an aggregate.

### Aggregate

An aggregate is an entity, but it is much more: it is the **consistency enforcement boundary** of the domain model.

**Core rule**: only the aggregate's own business logic may modify its state. External processes can only read state and invoke commands (the aggregate's public interface methods). This strict boundary ensures all business logic is implemented in one place and all invariants are always enforced.

**Transaction boundary**: one aggregate instance per database transaction. A change to an aggregate must be committed as a single atomic operation. The need to modify multiple aggregates in one transaction is a design signal: the aggregate boundaries are wrong.

**Hierarchy of entities**: an aggregate contains a hierarchy of entities and value objects, all sharing transactional consistency. Only data that requires strong consistency should be inside the aggregate boundary. Data that can be eventually consistent lives outside.

**Aggregate root**: when an aggregate contains a hierarchy, one entity is the **aggregate root** — the single public interface for all external interactions. External code can only call commands on the root; internal entities are accessed only through it.

**Concurrency**: aggregates hold a version field incremented on each update. Before committing, the database must confirm the version matches the one read before applying changes — optimistic concurrency control. Multi-process concurrent updates are rejected; the second process retries.

**Referencing other aggregates**: aggregates reference other aggregates only by ID — never by object reference. This makes the transactional boundary explicit and ensures each aggregate's transactions are independent.

**Sizing**: keep aggregates as small as possible. Only include entities that genuinely require strong consistency with each other. Larger aggregates → worse concurrency (more contention on the same transaction boundary).

### Domain Events

Domain events are **past-tense messages** describing significant business happenings:
- Ticket Escalated
- Order Placed
- Payment Confirmed

Events are part of the aggregate's public interface. The aggregate appends domain events to its internal collection when business logic causes a state change. After the aggregate's command is committed, domain events are published to interested subscribers (other aggregates, external systems).

Events describe *what happened* and supply all necessary data about that happening. They are named in the past tense because they describe facts, not intentions.

Domain events connect the aggregate to choreographed event-driven flows (→ [[styles/event-driven-architecture]]). In the event-sourced domain model (→ [[streams/event-sourcing-cqrs]]), domain events also become the source of truth for aggregate state.

### Domain Services

Stateless objects implementing business logic that **doesn't belong to any single aggregate or value object** — typically logic that coordinates multiple aggregates or requires reading data from multiple sources.

*Characteristics*:
- Stateless
- Named after business domain concepts, not technical concerns
- Not microservices — they are objects within a bounded context

Domain services do not bypass the one-aggregate-per-transaction rule. They are for *reading* multiple aggregates and performing calculations; they cannot commit changes to multiple aggregates atomically.

## Application Layer

The application layer (the layer orchestrating operations on aggregates) is thin: load aggregate → execute command → persist aggregate → return result. The aggregate handles all business logic; the application layer just coordinates infrastructure.

```
Load aggregate state
→ Execute command (business logic inside aggregate)
→ Persist (with version check)
→ Publish domain events
```

## Domain Model vs. Transaction Script

The difference is not lines of code but structural discipline:

| | Transaction Script | Domain Model |
|---|---|---|
| Business logic location | Scattered in procedures | Encapsulated in aggregates |
| Invariant enforcement | Must be manually repeated in each script | Always enforced by aggregate |
| Duplicated logic | Common as complexity grows | Prevented by aggregate boundary |
| Suits | Supporting subdomains (simple) | Core subdomains (complex) |

## When to Use

Use when the subdomain contains complex business rules, invariants, and state transitions — the domain model is the natural fit for **core subdomains**. Supporting subdomains with simple CRUD logic should use transaction script or active record instead (→ [[patterns/business-logic-patterns]]).

## Evans' Elaborations on the Building Blocks

Evans' treatment in [[sources/domain-driven-design]] (ch. 5–6) adds several important nuances not in Khononov's more systematic account:

**Associations**: every bidirectional association is a maintenance burden. Default to unidirectional; add qualifiers to reduce multiplicity; eliminate non-essential associations. Bidirectional associations between value objects make no sense — if neither object has identity, the traversal direction is meaningless.

**Entity identity**: the question is not "does this object have an ID field" but "does it need to be found or tracked over time?" Two customers with the same name are still two different customers. Identity operations (sameness tests, lookups) must be explicit and domain-meaningful. Entities contain the smallest possible set of attributes required for identity and lifecycle continuity — other attributes belong on value objects.

**Value objects — context-dependence**: whether something is an entity or value object depends on the context, not the thing itself. An address is a value object for a mail-order company (a description of where to ship) but may be an entity for a postal delivery service (a node in a network that needs to be tracked). The decision should be explicit and documented.

**Value objects — copying vs sharing**: because value objects are immutable, copying is always safe. Sharing is safe when the VO is truly immutable and the shared reference is never dereferenced after the source changes. When in doubt, copy.

**Services — three-layer partitioning**: services are not just "stateless domain logic" — they partition across all three non-database layers: *application services* coordinate tasks without containing business rules; *domain services* contain business logic that spans aggregate boundaries; *infrastructure services* provide technical capabilities. Mixing them (e.g., putting infrastructure concerns in a domain service) violates layer isolation.

**Modules as model elements**: module names enter the [[concepts/ubiquitous-language]]. A module named `beans/` or `dao/` is a technical filing decision, not a domain concept — it scatters cohesive domain logic and produces an anemic model. Module names like `Loan`, `Policy`, `Underwriting` are domain statements.

**Aggregate invariant rules (complete set from Evans)**:
1. Root has global identity; internal entities have local identity only.
2. External objects hold references only to the root.
3. Only the root is directly queryable from the database.
4. Objects inside may hold references to other aggregate roots.
5. A delete removes everything inside the boundary.
6. Committing a change must satisfy all invariants of the whole aggregate.
7. All state modifications flow through the root.

The purchase order example: PO line items cannot be individually locked and modified because the invariant (total ≤ approved limit) spans all items. Individually-locked items allow concurrent modifications that each appear valid but violate the aggregate invariant together.

**Factories vs repositories**: Evans draws a sharp distinction. A factory creates *new* objects — it handles complex construction and ensures the produced object is complete and valid from birth. A repository finds *existing* objects — it provides the illusion of an in-memory collection and handles reconstitution from persistent storage. Reconstitution from the database is a factory responsibility invoked *by* the repository: the repository fetches raw data; a factory (or factory method) assembles the object without assigning a new identity.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/learning-domain-driven-design]] | Defining treatment: full building-block set (value objects, entities, aggregates, domain events, domain services); aggregate as consistency boundary; one-aggregate-per-transaction rule; application layer as thin orchestrator (ch. 6) |
| [[sources/domain-driven-design]] | Originating treatment: richer on nuance — association direction, value object context-dependence, services partitioned across layers, modules as model elements, complete aggregate invariant rules, factory/repository complementarity (ch. 5–6) |
| [[sources/patterns-of-enterprise-application-architecture]] | Fowler's treatment emphasises Value Object immutability as the solution to aliasing bugs; defines Money as the canonical Value Object; introduces Special Case (ch. 18) as the general form of Null Object — return a subclass that handles the exceptional case polymorphically rather than proliferating null checks. |

## Related Concepts

- [[concepts/bounded-contexts]] — each aggregate belongs to a single bounded context; the domain model speaks the bounded context's ubiquitous language
- [[concepts/ubiquitous-language]] — aggregate names, commands, events must all reflect the ubiquitous language
- [[patterns/business-logic-patterns]] — domain model is the complex-business-logic tier in the four-pattern spectrum
- [[patterns/repository]] — Evans' pattern for providing in-memory collection illusion over aggregate roots
- [[streams/event-sourcing-cqrs]] — event-sourced domain model uses these same building blocks but persists domain events as source of truth
- [[patterns/context-map]] — aggregates within different bounded contexts integrate via the integration patterns
- [[patterns/saga]] — sagas coordinate cross-aggregate workflows that can't share a transaction boundary
- [[distributed/idempotency]] — domain events published to message brokers require idempotent consumers
- [[databases/object-relational-mapping]] — Data Mapper is the ORM pattern for persisting domain model objects; Unit of Work tracks aggregate changes per request

---
title: "Repository Pattern"
type: pattern
tags: [ddd, domain-driven-design, persistence, aggregate, tactical-design]
sources: [domain-driven-design, patterns-of-enterprise-application-architecture]
created: 2026-05-14
updated: 2026-05-18
---

# Repository Pattern

## Definition

A repository provides the illusion of an in-memory collection of all objects of a given type, hiding all persistence mechanics behind a collection-like interface. Clients query repositories as if they were querying an in-memory set; the repository translates those queries into whatever persistence technology is in use (→ [[sources/domain-driven-design]] ch. 6).

## Why It Matters

Without repositories, domain logic leaks persistence concerns. Client code either embeds raw database queries (violating layer isolation) or directly manipulates an ORM session (coupling domain objects to infrastructure). The repository restores the clean separation: the domain layer depends on a repository *interface*; the infrastructure layer provides the *implementation*.

Repositories also enforce the aggregate boundary rule: only aggregate roots get repositories. Fetching an object directly from the database that is an internal entity of an aggregate bypasses the root, potentially violating invariants. If you find yourself wanting a repository for a non-root, that is a signal to reconsider your aggregate boundaries.

## Responsibilities

- Provide query methods that return aggregate roots: simple finds by ID, hard-coded criteria queries, or Specification-based queries for flexible criteria
- Encapsulate all persistence technology details (SQL, ORM, document store) behind the interface
- Delegate reconstitution of stored data into domain objects to a factory (or factory method) — the repository fetches raw data; a factory assembles the object without assigning new identity

## What Repositories Do NOT Do

- **Transaction control**: transaction boundaries are the client's responsibility — repositories do not commit. This keeps them composable and avoids hidden side-effects.
- **Create new objects**: that is a [[patterns/domain-model#Evans'-Elaborations-on-the-Building-Blocks|factory's]] job. Repositories find *existing* objects; factories create *new* ones.
- **Expose persistence internals**: clients must not need to know whether the backing store is a relational database, a document store, or an in-memory map.

## Design Considerations

**Developer must understand the implementation**: Evans warns that although the client ignores implementation details, the developer must not. A Specification-based query might be expressed in domain terms but silently translated into a table scan. The developer must understand the performance characteristics of the implementation to write efficient queries and select appropriate indexes.

**One repository per aggregate root that needs it**: not every aggregate root requires a repository. A root that is always accessed through its parent aggregate does not need direct querying. Evaluate on a case-by-case basis — adding a repository where none is needed increases surface area and can encourage bypassing aggregate boundaries.

**Stateless implementation**: repositories are infrastructure services — no state between calls. Each query is independent.

## Relationship to Factories

Factories and repositories are complementary, not overlapping:

| | Factory | Repository |
|--|---------|------------|
| Purpose | Creates new objects | Finds existing objects |
| Identity | Assigns new identity (or accepts provided ID for reconstitution) | Uses stored identity |
| Input | Construction parameters | Query criteria or ID |
| Output | New, valid, complete domain object | Reconstituted domain object |

When a repository loads an aggregate from persistent storage, it typically invokes a factory (or reconstitution constructor) to assemble the object. The factory handles the structural assembly; the repository handles the storage retrieval.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/domain-driven-design]] | Originating treatment: in-memory collection illusion; aggregate roots only; query methods; developer must understand implementation; transaction control left to client; factory/repository complementarity (ch. 6) |
| [[sources/learning-domain-driven-design]] | Treats repositories as part of the infrastructure layer; emphasises the interface/implementation split (domain defines the interface; infrastructure provides the implementation); the application layer orchestrates repository calls (ch. 6) |
| [[sources/patterns-of-enterprise-application-architecture]] | Fowler's treatment (chs. 3, 13 — by Edward Hieatt and Rob Mee): Repository as the top layer of a data access stack — built on Metadata Mapping + Query Object. Clients construct Specification criteria objects and call `repository.matching(criteria)` — no SQL in client code. Repository uses a strategy object to select the querying implementation, enabling swap of an in-memory repository for unit tests (no DB, dramatically faster test suites). Most valuable in systems with many domain object types and many query types. Fowler notes this "largely hides the database from view" and pairs well with rich Domain Model systems. |

## Related Pages

- [[patterns/domain-model]] — aggregates are the objects that repositories manage; the repository boundary rule enforces aggregate design
- [[concepts/bounded-contexts]] — repositories are scoped to a bounded context; a repository never spans bounded contexts
- [[concepts/ubiquitous-language]] — repository method names should speak the ubiquitous language (e.g., `findAllActiveLoans()`, not `selectFromLoanWhereStatus=ACTIVE`)
- [[styles/layered-architecture]] — the repository interface lives in the domain layer; the implementation lives in the infrastructure layer
- [[styles/ports-and-adapters]] — the repository interface is a port; the storage implementation is an adapter

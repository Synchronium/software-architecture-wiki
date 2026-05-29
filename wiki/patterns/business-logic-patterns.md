---
title: "Business Logic Implementation Patterns"
type: pattern
tags: [ddd, business-logic, transaction-script, active-record, domain-model, tactical-design]
sources: [learning-domain-driven-design, patterns-of-enterprise-application-architecture]
created: 2026-05-14
updated: 2026-05-29
---

# Business Logic Implementation Patterns

## Key Claims

- **Match the pattern to the subdomain type.** Transaction script and active record for supporting subdomains; domain model for core; event-sourced domain model for core subdomains needing audit, time travel, or behavioural analysis.
- **The pattern selection is a cascade.** Business logic pattern determines architectural pattern (event-sourced → CQRS, domain model → ports & adapters, active record → layered + service layer, transaction script → minimal layered) determines testing strategy (pyramid for rich models, diamond for active record, reversed pyramid for transaction script).
- **Transaction Script's defining requirement is transactional integrity.** Three common failure modes break it: missing DB transaction; distributed DB+message-bus write (solved by [[patterns/outbox-pattern]]); implicit distributed transaction via void method (solved by idempotency).
- **Active record is not "anaemic domain model" as an insult.** It's a valid choice for simple business logic with complex data structures. Forcing a domain model on simple logic adds accidental complexity.
- **Subdomain type can be wrong.** If a "core" subdomain works fine as a transaction script, it's probably supporting. If a "supporting" subdomain has accumulated rules and invariants, it has become core. Use pattern fit as a check on classification.
- **Service Layer (Fowler) belongs over Domain Model, not under it.** Thin facade for cross-cutting concerns (transactions, security); application logic above, domain logic below. Avoid the controller-entity anti-pattern that puts use-case logic in services.

## Overview

DDD's tactical design provides four patterns for implementing business logic, chosen based on the **complexity of the business logic** and the **subdomain type**:

| Pattern | Business logic complexity | Subdomain fit |
|---------|--------------------------|---------------|
| Transaction Script | Simple (ETL, procedural) | Supporting, adapters for generic |
| Active Record | Simple, but complex data structures | Supporting |
| Domain Model | Complex (rules, invariants, business processes) | Core |
| Event-Sourced Domain Model | Complex + time/audit dimension | Core (event-driven contexts) |

This page covers the two simpler patterns. For the domain model, see [[patterns/domain-model]]. For the event-sourced domain model, see [[streams/event-sourcing-cqrs]].

(→ [[sources/learning-domain-driven-design]] chs. 5–7)

---

## Transaction Script

> "Organises business logic by procedures where each procedure handles a single request from the presentation." — Martin Fowler

**Structure**: each business operation is a procedure. The system's public interface is a collection of business transactions. Each procedure may use thin abstractions for data access but is otherwise straightforward.

**The one requirement**: transactional behaviour — every operation must either succeed completely or fail completely, leaving the system in a consistent state. This is the pattern's defining constraint, and it's easier to violate than it appears.

### Three Common Failure Modes

**1. Lack of a transaction**: multiple DB writes not wrapped in a single transaction. If the second write fails, the first is committed but the second is not — inconsistent state. Fix: wrap in a single DB transaction.

**2. Distributed transaction (DB + message bus)**: after updating the DB, publishing to a message bus in the same operation. A failure between the two leaves the DB updated but the message unpublished. Fix: use the [[patterns/outbox-pattern]] to publish reliably after the DB commit.

**3. Implicit distributed transaction**: a void method that updates the DB communicates its result to the caller via exception/success. If the update succeeds but the communication fails (network, process crash), the caller retries and the operation executes twice. Fix: make the operation **idempotent** (caller passes the target value, not a delta) or use optimistic concurrency control (update only if the value matches what the caller read).

### When to Use

- Supporting subdomains: simple ETL/CRUD operations
- Adapters for external integration (generic subdomains, anticorruption layers)
- **Not for core subdomains**: complex business logic leads to duplicated logic across transactions, which diverges over time → big ball of mud

---

## Active Record

> "An object that wraps a row in a database table or view, encapsulates the database access, and adds domain logic on that data." — Martin Fowler

**Structure**: the data structure is encapsulated in an object (the "active record") that also implements CRUD methods. Business logic is still organised in transaction scripts, but they operate on active records rather than the raw DB.

**Purpose**: reduces repetitive data mapping code when the business logic is simple but the data structures are complex (object trees, hierarchies, one-to-many and many-to-many relationships).

Active records have public getters/setters; external procedures modify their state. They can contain validation and simple business logic, but the defining feature is that data access is coupled to the data structure.

Also known as the "anemic domain model" — Khononov avoids this framing as pejorative. It is a valid tool for simple business logic; using a domain model for simple logic introduces unnecessary accidental complexity.

### When to Use

- Same contexts as transaction script, when data structures are complex enough to justify the abstraction
- Still not appropriate for core subdomains

---

## Pattern Selection Heuristic

*Does the business logic resemble CRUD interfaces and ETL transformations?* → Transaction Script or Active Record.

*Does it involve complex business rules, invariants, and long-running processes?* → Domain Model (see [[patterns/domain-model]]).

The distinction is driven by subdomain type: supporting subdomains almost always use transaction script or active record; core subdomains almost always need a domain model.

## Tactical Design Decision Tree

Khononov's Ch 10 provides a unified heuristic decision tree connecting subdomain type → business logic pattern → architectural pattern → testing strategy (→ [[sources/learning-domain-driven-design]] ch. 10):

### Step 1 — Business Logic Pattern Selection

Ask in order:

1. Does the subdomain require monetary transaction tracking, a consistent audit log, or deep behavioural analysis? → **Event-sourced domain model**
2. Is the business logic complex (non-trivial rules, invariants, multi-step processes)? → **Domain model**
3. Are the data structures complex enough to justify abstraction from the database? → **Active record**
4. Otherwise → **Transaction script**

**Validation heuristic**: if a subdomain you believe is core is best served by transaction script or active record, revisit whether it is truly core. If a supporting subdomain needs a domain model, revisit whether it has become core.

**Ubiquitous language as a complexity signal**: if the ubiquitous language describes mainly CRUD operations → simple business logic. If it describes complex business processes, rules, and invariants → complex business logic.

### Step 2 — Architectural Pattern Selection

Follows directly from the business logic pattern:

| Business logic pattern | Architectural pattern | Reason |
|------------------------|-----------------------|--------|
| Event-sourced domain model | CQRS (required) | Without CQRS, querying is limited to fetching single instances by ID |
| Domain model | Ports & adapters (required) | Layered architecture makes aggregates and value objects infrastructure-aware |
| Active record | Layered + service layer | The service layer controls the active records; infrastructure coupling is acceptable |
| Transaction script | Minimal layered (3 layers) | Simple logic; infrastructure coupling cost is low |
| Any pattern | CQRS (optional) | Also valid when multiple persistent read models are needed, regardless of business logic complexity |

See [[styles/ports-and-adapters]] and [[styles/layered-architecture]].

### Step 3 — Testing Strategy Selection

| Business logic pattern | Testing strategy | Rationale |
|------------------------|--------------------|-----------|
| Domain model / Event-sourced domain model | **Testing pyramid** (unit > integration > E2E) | Aggregates and value objects are the ideal unit; business logic is concentrated and testable in isolation |
| Active record | **Testing diamond** (integration-heavy) | Business logic is spread across service and data layers; integration tests verify their interaction |
| Transaction script | **Reversed testing pyramid** (E2E > integration > unit) | Business logic is simple; end-to-end tests verify the workflow with minimal overhead |

---

## Migration Paths Between Patterns

As subdomain types evolve (→ [[concepts/bounded-contexts]], subdomain type evolution), the business logic pattern must evolve with them. Khononov provides incremental migration paths (→ [[sources/learning-domain-driven-design]] ch. 11):

### Transaction Script → Active Record

Identify complex data structures and encapsulate them in active record objects. Replace direct DB access with active record CRUD methods. The business logic structure (procedural scripts) remains unchanged; only data access is abstracted.

### Active Record → Domain Model

1. Make all active record setters private — compilation errors reveal where external code modifies state
2. Move state-modifying logic inside the active record's boundaries
3. Identify transactional boundaries: which data must be strongly consistent together? → aggregate candidates
4. Decompose hierarchies along those consistency boundaries; enforce aggregate root access
5. Reference other aggregates by ID only
6. Extract logic that doesn't fit any aggregate into domain services

### Domain Model → Event-Sourced Domain Model

Model all domain events needed to represent the aggregate's lifecycle. The key challenge is migrating existing aggregate state (no event history exists). Two approaches:

**Generating past transitions**: infer probable past events from current state and generate them. The event stream can be projected back to the current state. *Limitation*: intermediate state (e.g., how many times a contact was attempted) is lost.

**Migration events**: define an explicit `migrated-from-legacy` event containing the full current state. All projections must handle this event type. *Advantage*: the lack of historical data is made explicit; no one mistakenly assumes the event stream is complete. *Disadvantage*: traces of the legacy system remain in the event store permanently.

---

## Table Module (PEAA)

A fourth pattern from Fowler's PEAA that Khononov omits: one class instance per database *table* (not per row). A client first issues a database query to get a Record Set (like ADO.NET's DataSet), passes it to the Table Module constructor, then calls methods on it (passing an ID when addressing a specific row).

**Trade-off vs Domain Model**: less OO power (no inheritance or strategies on per-row instances), but excellent fit in environments where Record Set is a first-class platform citizen (.NET/COM). Fowler: "I don't see a reason to use Transaction Script in a .NET environment" when Table Module is available.

(→ [[sources/patterns-of-enterprise-application-architecture]] ch. 2)

## Service Layer (PEAA)

An API facade placed over the domain layer (Domain Model or Table Module). Provides a coarse-grained interface oriented around use cases. Good location for cross-cutting concerns: transaction control, security checks.

**Domain logic vs application logic** (Randy Stafford, ch. 9): domain logic has to do purely with the problem domain (e.g., rules for calculating revenue recognition); application logic has to do with application responsibilities (e.g., notifying administrators, publishing to middleware). Domain objects should not implement application-specific logic — it reduces reusability across applications and makes it harder to later replace the logic with a workflow engine. The Service Layer is where application logic lives; it delegates to domain objects for domain logic.

**Two implementation approaches**:
- **Domain facade**: thin wrappers over a Domain Model; no logic in the service layer itself. The Domain Model implements everything; the facades establish the boundary.
- **Operation script**: thicker service classes that implement application logic directly and delegate to domain objects for domain logic. Service class names typically end in "Service" (e.g., `RecognitionService`).

**Canonical example** (`RecognitionService.calculateRevenueRecognitions()`): calls `contract.calculateRecognitions()` (domain logic), then sends email notification and publishes to middleware (application logic). All three responses are transacted atomically — service method is the transaction boundary.

**Remotability**: start with a locally invocable Service Layer whose signatures deal in domain objects. Add Remote Facades and DTOs only when remote invocation is actually needed. The cost of distributing a Service Layer is second only to O/R mapping in complexity.

Fowler's strong preference: keep it **as thin as possible** — a forwarding facade where all real behaviour lives in domain objects.

**Controller-entity anti-pattern**: placing use-case-specific logic in "controller" transaction scripts inside the Service Layer, with domain objects holding only shared logic. Fowler explicitly dislikes this — use-case controllers encourage duplication.

**When to use**: any application with more than one type of client (UI, API, integration gateway) or use cases that involve multiple transactional resources. Unnecessary when the application has only a single client type and responses involve only one transactional resource — Page Controllers can manage transactions directly.

(→ [[sources/patterns-of-enterprise-application-architecture]] chs. 2, 9)

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/learning-domain-driven-design]] | Defines the four-pattern spectrum; transaction script and active record as the simple end; explicit subdomain-to-pattern mapping (chs. 5–7) |
| [[sources/patterns-of-enterprise-application-architecture]] | Fowler's originating treatment of Transaction Script, Domain Model, and Table Module; introduces Service Layer; emphasises that the right choice depends on domain complexity, not ideology; adds Table Module as a third option not covered by Khononov (ch. 2) |

## Related Concepts

- [[concepts/bounded-contexts]] — tactical patterns are applied within a bounded context; pattern choice depends on subdomain type
- [[patterns/outbox-pattern]] — solves the distributed transaction problem that transaction scripts commonly encounter
- [[distributed/idempotency]] — solution to the implicit distributed transaction problem in transaction scripts
- [[patterns/domain-model]] — the next pattern in the spectrum, for core subdomains with complex business logic
- [[streams/event-sourcing-cqrs]] — event-sourced domain model for contexts needing time/audit dimension

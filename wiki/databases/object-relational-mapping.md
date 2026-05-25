---
title: "Object-Relational Mapping Patterns"
type: database
tags: [orm, persistence, relational, domain-model, databases, ddd, enterprise]
sources: [patterns-of-enterprise-application-architecture]
created: 2026-05-17
updated: 2026-05-17
---

# Object-Relational Mapping Patterns

## The Problem

Objects and relational tables are structurally different: objects use references and collections; tables use foreign keys and joins. Objects can inherit; tables cannot. Fowler calls this the **impedance mismatch**. Bridging this gap consumes roughly a third of enterprise application development effort (PEAA ch. 3).

(→ [[sources/patterns-of-enterprise-application-architecture]])

---

## Architectural Patterns (Data Source Layer)

These determine how domain objects interact with the database. Pick one as the primary persistence mechanism — mixing them gets messy.

| Pattern | Best fit | Summary |
|---------|----------|---------|
| **Table Data Gateway** | Transaction Script, Table Module | One class per table; finder methods return a Record Set; SQL hidden from domain |
| **Row Data Gateway** | Transaction Script | One instance per database row; SQL hidden from domain; starts like Active Record without business logic |
| **Active Record** | Simple Domain Model | Domain object that also loads/saves itself; one domain class ≈ one table; tight coupling between domain and schema |
| **Data Mapper** | Complex Domain Model | Separate mapper layer; domain objects know nothing about the database; maximum isolation; highest complexity |

**Selection heuristic**:
- Transaction Script / Table Module → **Table Data Gateway** (pairs well with Record Set)
- Simple domain model where classes map 1-to-1 with tables → **Active Record**
- Rich domain model where domain shape diverges from schema → **Data Mapper**

**Table Data Gateway return-type options**: returning a raw `ResultSet`/`DataReader` keeps things simple but leaks the SQL interface. Returning a `DataSet` (Record Set) works well in .NET environments. Returning a DTO avoids both problems but costs an extra class. Returning domain objects creates a bidirectional dependency (TDG ↔ domain) — Fowler is reluctant to do this.

**Row Data Gateway detail**: separate finder classes (e.g., `PersonFinder`) keep queries testable and allow polymorphic substitution. Static find methods on the gateway class are simpler but prevent substitution. If business logic starts accumulating in the Row Data Gateway, it's becoming an Active Record — let it.

**Active Record trade-off**: primary advantage is simplicity; it avoids an entire mapping layer. Primary problem is coupling the object design to the database schema — both become harder to refactor independently. Works well for simple CRUD and validation on a single record.

**Data Mapper: empty object pattern**: instead of building an object with a rich constructor (which triggers cyclic loads — object A loads object B, which tries to load object A), create an empty object, insert it immediately into the Identity Map, then populate its fields. The Identity Map returns the partial object if a cycle is encountered, breaking the infinite recursion. Use a `dbLoad`-specific setter (named differently from regular setters) with a status guard to prevent accidental misuse.

**Data Mapper: Separated Interface for finders**: domain code that needs to invoke find methods should not see the mapper layer. Use a Separated Interface (finder interface declared in the domain package, implemented by the mapper) to avoid the dependency. A Registry in the domain layer holds the active mapper instances.

**Data Mapper: buy, don't build**: a full-featured mapping layer is expensive to build. Fowler's advice: use a commercial ORM tool (Hibernate, etc.) rather than building your own unless the mapping requirements are unusually simple or unusual.

---

## Behavioural Patterns

These solve the "keep it consistent" problems that arise when multiple objects are loaded and modified.

### Unit of Work

Registers all objects read from the database; tracks which were modified (new, dirty, removed); on commit, sequences all INSERT/UPDATE/DELETE in the right order. The developer calls `commit()` rather than explicit `save()` on each object.

**Three registration approaches**:
1. *Caller registration*: the caller explicitly registers changed objects. Flexible but error-prone — a forgotten registration means the change isn't persisted.
2. *Object registration*: setters and constructors in domain objects call `markNew()`/`markDirty()`/`markRemoved()` on the thread-scoped Unit of Work. Less error-prone but requires every domain setter to remember the call; good target for AOP or bytecode post-processing.
3. *UoW controller* (TOPLink approach): the Unit of Work handles all reads from the database, takes a copy of each object at read time, and compares at commit. No registration calls needed; supports selective column update; higher commit overhead. A hybrid takes copies only of objects that self-report as changed.

**Thread scoping**: associate the Unit of Work with the current thread via `ThreadLocal`. Better to use an existing session object as the host. Never share a Unit of Work across threads.

**Commit ordering for referential integrity**: the Unit of Work is the natural place to sort writes so that FK-dependent tables are written in the correct order. For small schemas, hardcode the order; for large ones, use a topological sort over the FK graph.

**Deadlock reduction**: if every transaction writes tables in the same sequence, the risk of deadlocks is significantly reduced. The Unit of Work enforces this consistently.

**Batch updates**: batching multiple SQL statements in a single call reduces network round-trips. JDBC's batching facility or a multi-statement string approach both work; check that batching doesn't interfere with prepared statement precompilation.

### Identity Map

Keeps a record of every database row loaded in the current session (keyed by primary key). Before loading a row, check here first. Ensures that the same database row is never represented by two different in-memory objects — two in-memory objects for the same row means conflicting updates are possible. Primary purpose: **correctness**; caching is a side effect.

**Explicit vs generic**: an explicit Identity Map has type-specific methods (`findPerson(id)`) — better for compile-time type checking and discoverability. A generic map uses a single method with a type discriminator — simpler to maintain but loses type safety. Prefer explicit; only use generic if all domain objects share the same key type.

**Per-class vs per-session**: use one map per class when class and table schemas match well. Use a single session-scoped map only when all keys are globally unique across all classes (surrogate keys make this feasible).

**Session-scoped vs process-scoped**: updatable objects must use session-scoped maps (never share a writable object across sessions). Truly read-only objects can safely use process-scoped maps, avoiding repeated DB loads for reference data.

**Placement**: put Identity Maps inside the Unit of Work if one exists. Otherwise, a session-scoped Registry.

### Lazy Load

A placeholder stands in for a linked object. The real object is fetched only when actually used. Prevents loading entire object graphs when only a subset is needed.

**Four implementations**:
1. *Lazy initialization*: null-check in the getter — `if (products == null) products = Product.findForSupplier(id)`. Simplest but adds a database dependency to the domain object. Best fit for Active Record, Row Data Gateway.
2. *Virtual proxy*: an object that looks like the real object, but loads on first method call. Good for collections (where identity doesn't matter); problematic for individual objects (equality and identity issues in statically typed languages).
3. *Value holder*: a generic wrapper object that loads its value on first `getValue()` call. Domain class knows about the holder but clients don't. Avoids identity issues but changes the domain class's field types.
4. *Ghost*: the real object created in a partial (empty) state; first field access triggers a full load. Inserted immediately into the Identity Map, so cyclic loading is handled automatically. Most sophisticated; aspect-oriented programming or bytecode post-processing can make it transparent.

**Ripple loading** (N+1 problem): loading a collection lazily and then iterating causes one DB call per element instead of one for the whole collection. Mitigation: make the *collection itself* a single lazy load — when triggered, load all elements at once. In practice, only two degrees of laziness are needed: full load (everything) and identification load (ID + display fields for list views).

---

## Structural Mapping Patterns

Used by Data Mapper (and sometimes Row Data Gateway) to translate between object structure and table structure.

**Identity Field** — stores the database primary key in the domain object. Used to convert between in-memory object references and relational foreign keys.

**Foreign Key Mapping** — maps a single-valued object reference to a foreign key in a table. When saving, write the target object's ID; when loading, look up via Identity Map or lazy-load.

**Association Table Mapping** — handles many-to-many relationships. Creates a separate "link table" containing foreign keys to both sides.

**Embedded Value** — small Value Objects (money, date range, address) have their fields embedded directly into the owning table's row. No separate table; no need for Identity Map entries.

**Dependent Mapping** — the owner class performs database mapping for a child class that is never accessed outside the owner's context. No separate mapper, no Identity Map entry for the child. Use when children are loaded/saved exclusively through the parent (e.g., album tracks). Simplifies the mapping layer at the cost of independent addressability.

**Serialised LOB** — stores an entire cluster of objects as a single BLOB/CLOB in one column (commonly XML). Best for hierarchical structures (org charts, bills of materials) accessed as a unit. Avoid if objects outside the LOB reference objects inside it. Downside: SQL cannot query inside the serialised structure; prefer Embedded Value when SQL queries against the dependent values are needed.

---

## Inheritance Mapping

SQL has no inheritance. Three strategies, each a trade-off between simplicity and performance:

| Strategy | Description | Pros | Cons |
|----------|-------------|------|------|
| **Single Table Inheritance** | One table for the whole hierarchy; subtype columns are null for irrelevant rows | Simplest; easiest to refactor hierarchy | Wasted columns; table can become bottleneck |
| **Class Table Inheritance** | One table per class; joined to reconstruct full object | Clean mapping; DRY schema | Multiple joins to load one object |
| **Concrete Table Inheritance** | One table per concrete class; duplicates superclass columns | Avoids joins; no null columns | Brittle to superclass changes; no superclass table for foreign keys |

Fowler's default: **Single Table Inheritance** first. Move to others when null columns become a problem or query performance demands it. Strategies can be mixed within a hierarchy — a common split is Single Table for the upper hierarchy (shared fields, easy to refactor) and Concrete Table for leaf subclasses with heavy type-specific data.

---

## Metadata Mapping and Repository

Once you have a complete Data Mapper, you can eliminate repetitive mapping code by describing the mapping in metadata (a config file or annotations). A **Query Object** then lets you express queries in terms of domain objects rather than SQL. Stack them and you get a **Repository** that hides the database entirely: callers query the Repository using domain terms; the Repository uses the Query Object and Metadata Mapping to generate SQL.

See: [[patterns/repository]]

---

## Connection Management

- Tie connections to transactions: open when a transaction begins, close on commit/rollback.
- Use connection pools; treat pool acquisition as "open" and pool return as "close."
- Unit of Work is the natural owner of both the transaction and the connection.
- Never rely on garbage collection to close connections.

---

## Related Pages

- [[patterns/business-logic-patterns]] — Active Record is one of the four business logic patterns; choice of business logic pattern drives choice of O/R mapping strategy
- [[patterns/repository]] — built on Metadata Mapping + Query Object; hides the database from the domain
- [[databases/transactions]] — isolation and concurrency concerns that arise during O/R mapping operations
- [[styles/layered-architecture]] — the data source layer houses O/R mapping code
- [[styles/ports-and-adapters]] — Data Mapper is the implementation technique for repository ports

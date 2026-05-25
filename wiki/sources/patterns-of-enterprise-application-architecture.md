---
title: "Patterns of Enterprise Application Architecture"
type: source
tags: [architecture, patterns, enterprise, oop, persistence, web]
sources: [patterns-of-enterprise-application-architecture]
created: 2026-05-17
updated: 2026-05-18

---

# Patterns of Enterprise Application Architecture

**Authors:** [[authors/martin-fowler]], David Rice, Matthew Foemmel, Edward Hieatt, Robert Mee, Randy Stafford
**Published:** 2002
**Slug:** `patterns-of-enterprise-application-architecture`

## Overview

Martin Fowler's PEAA is the definitive catalogue of enterprise application patterns at the layer and data-access level. Published in 2002, it distills patterns for organising business logic, mapping objects to relational databases, building web presentation layers, handling concurrency, and managing sessions. It is the source of patterns that have become vocabulary for the entire industry: Transaction Script, Domain Model, Active Record, Data Mapper, Repository, Service Layer, and many others.

The book divides into two parts. Part 1 (Chapters 1–8) is a narrative discussion of the major architectural challenges in enterprise applications — how to layer a system, how to organise domain logic, how to bridge the object/relational paradigm gap, how to handle web presentation, concurrency, session state, and distribution. Part 2 (Chapters 9–18) is the reference catalogue describing each pattern in detail.

The intended audience is object-oriented developers and architects building multi-tier enterprise applications. While the code examples are in Java and C#, the patterns are language-agnostic.

## Key Claims

- Three principal layers — Presentation, Domain, Data Source — are the correct level of abstraction for enterprise applications (ch. 1)
- Domain logic should never depend on presentation; the domain layer is where the real value is (ch. 1)
- The right domain logic pattern (Transaction Script, Table Module, or Domain Model) depends on the complexity of the business domain (ch. 2)
- The Service Layer should be as thin as possible — a facade over the domain model, not a place for business logic (ch. 2)
- Object/relational mapping is the central technical challenge of enterprise applications; multiple patterns exist to solve it at different cost/complexity points (chs. 3, 11–13)
- Distribution across processes is a "complexity booster" to be avoided unless strictly necessary (ch. 1)

## Chapter Notes

### Chapter 1 — Layering

The foundational chapter. Layering decomposes a system into planes where each layer uses services from the layer below and is unaware of layers above.

**Benefits**: substitutability (swap a layer without touching others), minimised cross-layer dependencies, standardisation opportunities, reuse.

**Downsides**: cascading changes when adding fields that span all layers; performance overhead of layer traversal; deciding layer responsibilities is the hardest part.

**The three principal layers** for enterprise applications:
- *Presentation*: display and user interaction
- *Domain*: business logic — "the real point of the system"
- *Data Source*: database, messaging systems, external packages

**Key dependency rule**: domain and data source must never depend on presentation. This is inviolable; it enables swapping or adding presentation channels.

**Layer vs Tier**: layer is logical; tier implies physical deployment. You can have three logical layers on one machine (not a three-tier system).

**Hexagonal Architecture** (Alistair Cockburn) is mentioned as an alternative: treats all external systems symmetrically as "outside interfaces." Fowler prefers the asymmetric view because he considers presentation (a service you provide to others) different from data source (a service provided to you).

**Distribution**: run all layers in one process unless you absolutely must distribute. Distribution adds Remote Facades and Data Transfer Objects, degrades performance, and adds significant complexity. Explicitly listed as a "complexity booster" alongside: explicit multithreading, object/relational paradigm chasm, multiplatform development, extreme performance requirements.

### Chapter 2 — Organising Domain Logic

Three patterns for structuring domain logic:

**Transaction Script**: one procedure per user action. Simple procedural model; works with Row Data Gateway or Table Data Gateway; easy transaction boundaries. Degrades with complexity — logic duplicates across scripts; no OO structuring techniques available.

**Domain Model**: OO model organised around domain nouns; logic distributed into objects; uses strategies, inheritance, and other OO patterns. Handles complexity well once team is accustomed to it. Data source mapping is complex — typically requires Data Mapper. Significant initial learning curve.

**Table Module**: one class instance per database table (not per row). Works with Record Set (think ADO.NET DataSet). Middle ground — more structure than Transaction Script, less OO power than Domain Model. Strong fit for .NET/COM environments built around Record Sets.

**Selection heuristic**: complexity of domain logic drives the choice. Transaction Script for simple domains; Domain Model for complex; Table Module for .NET/COM Record Set environments.

**Service Layer**: an API facade over the domain layer (Domain Model or Table Module). Good location for transaction control and security. Fowler's strong preference: keep it as thin as possible — a forwarding facade. Warns against the "controller-entity" style (use-case-specific transaction scripts as controllers) because it encourages duplication.

> **Open question:** Fowler is explicitly reluctant to be "overly dogmatic" — a product colour-highlighting example shows how a tiny presentation/domain boundary leak can be "the first step on a slippery slope" or "a perfectly reasonable thing." The tension between pragmatism and purity here is unresolved in the book.

### Chapter 3 — Mapping to Relational Databases

The central technical challenge of enterprise OO applications. Four architectural patterns for the data source layer, selected based on domain complexity:

- **Table Data Gateway / Row Data Gateway**: SQL hidden from domain; returns Record Set; fits Transaction Script and Table Module
- **Active Record**: domain object + persistence in one class; fits simple domain model; stepping stone from Row Data Gateway
- **Data Mapper**: complete isolation between domain objects and database; fits rich Domain Model; most complex

**Behavioural patterns**: Unit of Work (tracks changes, sequences writes, owns the transaction/connection), Identity Map (ensures one in-memory object per database row — correctness first, caching second), Lazy Load (deferred loading of linked objects).

**Structural patterns**: Identity Field (key in object), Foreign Key Mapping (object reference → FK), Association Table Mapping (many-to-many), Embedded Value (Value Objects as columns), Serialised LOB (object clusters as BLOB/CLOB).

**Inheritance mapping**: Single Table (Fowler's default — easiest refactoring), Class Table (cleanest schema; more joins), Concrete Table (no joins; brittle to superclass changes).

**Repository**: built on Metadata Mapping + Query Object; hides database from domain entirely; developers query in object terms.

Build iteratively: don't build a six-month database-free model then persist it. Integrate persistence each iteration (max 6 weeks) to get performance feedback continuously.

### Chapter 4 — Web Presentation

MVC is the governing pattern: Input Controller handles HTTP, Model handles domain logic, View formats the response. The primary purpose is clean separation of model from presentation.

**Input controllers**: Page Controller (one per page/action; simple), Front Controller (one for entire site; centralises URL dispatch and cross-cutting logic).

**Views**: Template View (HTML + embedded scriptlets; keep logic out of templates), Transform View (XSLT-style transformation; good for XML domain data), Two Step View (domain data → logical screen → HTML; enables global layout changes and multi-brand rendering).

**Application Controller**: optional layer for complex screen flow (wizard-style navigation); unnecessary when users freely control navigation.

### Chapter 5 — Concurrency

Concurrency control for enterprise applications has two main arenas: (1) **offline concurrency** — data shared across multiple system transactions during a business transaction; (2) **application server concurrency** — thread safety in multi-threaded servers.

Core problems: **lost updates** (second writer overwrites first's change) and **inconsistent reads** (reading data that was never consistent at any point in time). Trade-off: **correctness** (safety) vs **liveness** (throughput).

Two approaches:
- **Isolation**: partition data so only one agent can access a piece at a time
- **Immutability**: read-only data needs no locking

**Optimistic vs Pessimistic locking**: optimistic = conflict detection at commit (version numbers/timestamps); pessimistic = conflict prevention via upfront locks. Optimistic preferred for better liveness; pessimistic needed when late conflict discovery is unacceptably painful.

**Deadlocks** (pessimistic only): prevention via upfront lock acquisition, lock ordering, or automatic victimisation; detection via cycle detection or timeout. Prefer simple conservative schemes.

**System vs Business transactions**: system transactions are DB-scoped; business transactions span multiple requests. Can't use long system transactions (scalability). **Offline concurrency** must be managed by the application:
- **Optimistic Offline Lock**: OCC across business transactions; best liveness; first choice
- **Pessimistic Offline Lock**: application-managed session locks; early conflict detection; higher complexity
- **Coarse-Grained Lock**: lock at cluster level (aggregate root), not per object
- **Implicit Lock**: framework manages locks automatically; prevents developer errors

Application server: prefer **process-per-request** (better isolation, fewer bugs) over **thread-per-request** (more efficient but requires careful synchronisation). In thread-per-request: create fresh objects per request; avoid static/singleton shared state; use thread-scoped Registry.

### Chapter 6 — Session State

**Session state** = data held within a business transaction not yet committed to permanent storage (record data). Has ACID-like properties: isolation is the hardest (can't let other sessions see partial edits); consistency is temporarily suspended during editing (valid only at commit).

**Stateless vs stateful servers**: stateless allows pooling (fewer objects serve more users); stateful requires one object per session. Statelessness is preferable but unavoidable when business interactions are inherently multi-step.

Three storage options:
- **Client Session State** (URL, cookies, hidden fields): no server resources; good for small data and session IDs; bandwidth and security concerns
- **Server Session State** (in-memory memento or serialised blob): best performance for complex data; session migration challenges; Fowler's preference with remote storage for crash recovery
- **Database Session State** (DB tables): clustering/failover friendly; isolation complexity; development overhead

Session migration (move session between servers) vs server affinity (pin session to one server): affinity simpler but can cause load skew (e.g., many users behind the same proxy IP).

### Chapter 7 — Distribution Strategies

The most emphatic chapter in the book. **First Law of Distributed Object Design: Don't distribute your objects.**

The core argument: in-process method calls are orders of magnitude faster than inter-process calls. A fine-grained local interface (many small methods like `getCity()`, `setState()`) is the right OO design. A remote interface must be coarse-grained (one call for get-address-details, not three). You can't have both for the same object — if an object might be remote, it must always have the coarse-grained interface, paying a programming-model cost everywhere.

**Solution: cluster, don't distribute.** Run multiple copies of the same process on multiple nodes. Each process uses fast local calls internally. Distribution at process level (client/server, app server/DB, vendor packages) is unavoidable — minimise it aggressively.

When you must cross a distribution boundary:
- **Remote Facade**: a coarse-grained wrapper on the fine-grained domain/application objects. Its only job is to minimise remote calls; it contains no logic.
- **Data Transfer Object (DTO)**: bundles data for transport. Cannot reference objects that don't cross the wire; typically references only other DTOs and primitive types.

**Web Services**: use as Remote Facades for cross-system integration, not for decomposing a single application internally. Do not let XML/REST hype override the First Law. Fowler's personal preference: asynchronous message-based interfaces over synchronous RPC.

> **Foreshadowing**: Fowler notes in 2002 that "I haven't seen any patterns for that here" regarding async messaging, and expresses hope for a future book — that book is [[sources/enterprise-integration-patterns]], Hohpe & Woolf, published one year later.

### Chapter 8 — Putting It All Together

Synthesis chapter. The central decision — domain logic pattern — determines everything downstream.

**Decision tree**:

| Domain logic | Data source | Notes |
|---|---|---|
| Transaction Script | Row or Table Data Gateway | Keep in single transaction if possible; Optimistic Offline Lock for edit-then-save |
| Table Module | Table Data Gateway + Record Set | Tight fit; best in .NET |
| Simple Domain Model | Active Record | OK when classes ≈ tables |
| Complex Domain Model | Data Mapper + Unit of Work | Use a tool; all O/R patterns needed |

Presentation is largely independent of domain choice. HTML preferred over rich client. MVC always. Page Controller for document-oriented; Front Controller for complex navigation. Template View the pragmatic default; Two Step View for multi-look-and-feel.

Keep all layers in one process unless forced to distribute. If forced: Remote Facade + DTO.

Stored procedures: acceptable as performance optimisation on specific hot paths; avoid for business logic structure (vendor lock-in, poor modularity).

**Layering scheme comparison**: Fowler maps his three-layer model to Brown (5 layers), Core J2EE (5 layers), Microsoft DNA (3 layers), Marinescu (5 layers), Nilsson (7 layers). All are variations on the same three themes; mediating layers (Application Controller, Data Mapper, Service Layer) appear as optional extras rather than mandatory structure.

## Part 2 — Pattern Catalogue

### Chapter 18 — Base Patterns

The foundational infrastructure patterns referenced throughout the catalogue.

**Gateway** (p. 466): wraps an external system or resource (tax service, payment processor, messaging system) behind a simple interface that hides all third-party API details. The rest of the system talks to the Gateway, not to the external API. The Gateway is the natural placement for a Service Stub (p. 504) in testing. Can be designed as two objects: a back-end Gateway that wraps the external service, and a front-end Gateway that provides the internal API — the two-object form is useful when the wrapping is complex. Keep minimal: don't add non-essential functionality.

**Mapper** (p. 473): an insulating layer between two independent subsystems that must remain unaware of each other. Neither subsystem knows the Mapper exists. Use Mapper (not Gateway) when both subsystems must remain unaware — Gateway is appropriate when only one side needs to be shielded. More complex and rarer than Gateway; prefer Gateway unless the mutual-independence requirement is strict.

**Layer Supertype** (p. 475): a common superclass for all objects in a layer. Centralises behaviour that every object in that layer needs — e.g., `DomainObject` holds the ID field and common save/load protocol; `AbstractMapper` holds the generic load/find logic and Identity Map reference. Reduces duplication in large systems; worth creating as soon as the same methods appear in several mapper classes.

**Registry** (p. 480): a global-looking object that provides well-known access points to objects or services. Interface is static (class methods or a singleton accessor) so callers don't need a Registry reference. Implementation is *scoped*: process-scoped (class variable — only for immutable or read-only data); thread-scoped (ThreadLocal, one instance per thread — for mutable per-request data); session-scoped (map keyed by session ID — for session-level state). Fowler recommends avoiding Registry if possible — it makes dependencies implicit and testing harder. If you must use one, use ThreadLocal-scoped for request handling servers; never store updatable objects in a process-scoped Registry.

**Value Object** (p. 486): a small object whose equality is defined by field values, not identity. Two `Money(100, USD)` instances are equal regardless of reference. Must be **immutable** — if a Value Object is mutable and shared (aliased), changing one copy changes all alias holders, producing subtle bugs. Immutability ensures aliasing is harmless. Persist via Embedded Value — not as a table with its own row. Naming collision: the J2EE community used "Value Object" to mean what PEAA calls a DTO; these are entirely different patterns. See also: [[databases/object-relational-mapping]].

**Money** (p. 488): a Value Object for monetary amounts. Never store monetary values in floating-point (binary rounding errors are subtle and accumulate). Use integral (cents/minor units) or fixed-decimal types. The core problems Money solves: (1) **currency mismatch** — Money throws an exception on arithmetic across currencies, or uses a "money bag" (mixed-currency object); (2) **rounding errors during allocation** — Foemmel's Conundrum: allocating 5 cents 70/30 produces 3.5 and 1.5 — no uniform rounding avoids losing or gaining a penny. Fowler's preferred solution: an `allocate([7,3])` method that distributes the remainder one cent at a time, guaranteeing no pennies are lost. Use Money for all monetary calculation; the performance overhead is negligible and the correctness benefit is significant.

**Special Case** (p. 496): a subclass that handles exceptional or null situations with normal-looking polymorphic behaviour. Instead of returning null and requiring callers to null-check, return a Special Case instance that overrides methods with appropriate defaults (e.g., `NullEmployee.GrossToDate` returns 0; `NullEmployee.Contract` returns `Contract.NULL` — the special case chains). Null Object is a specific Special Case. Use when multiple call sites check for the same condition and take the same action. Often implemented as a flyweight since there's no reason to distinguish instances.

**Plugin** (p. 499, by David Rice and Matt Foemmel): resolves Separated Interface implementations at runtime via a central configuration file rather than scattered factory conditionals. The Plugin factory reads a properties file mapping interface names to implementation class names and uses reflection to instantiate the correct class. Supports multiple deployment configurations (test, staging, production) without code changes or rebuilds. Use when behaviours require different implementations based on runtime environment (test vs production key generators, tax service stubs vs real services, in-memory vs DB transaction managers).

**Service Stub** (p. 504, by David Rice): replaces a problematic external service during testing with a local, fast, in-memory implementation. The stack is: Gateway (Separated Interface) → loaded via Plugin → Service Stub implementation (or real service in production). Keep stubs as simple as possible — complexity defeats the purpose. Minimum viable stub: a flat-rate implementation (2–3 lines). Dynamic stub: a list of exemptions that test cases populate before running. If the stub needs test-specific setup methods, add them to the Gateway interface (real service implementation throws assertion failure on those methods). Fowler notes that "Mock Object" (XP term) is essentially Service Stub — the name difference is historical.

**Record Set** (p. 508): an in-memory representation of tabular data that looks exactly like the result of an SQL query. Platform-provided (ADO.NET `DataSet`, JDBC `RowSet`). Key property: disconnectable — pass around the network without an open DB connection; serialise as DTO. Increasingly supports Unit of Work behaviour (track changes, commit back to DB with Optimistic Offline Lock conflict detection). Implicit interface (string-keyed column access) vs explicit/strongly-typed interface (ADO.NET typed DataSets — prefer these in production). Best with Table Module: fetch a Record Set from DB → pass to Table Module for computation → pass to data-aware UI → pass back to Table Module for validation → commit.

### Chapter 17 — Session State Patterns

Catalogue entries for the three session state storage options. See [[databases/transactions]] for context.

**Client Session State** (p. 456): store state in the client (URL parameters, cookies, hidden fields). Enables stateless servers; maximum clustering and failover resiliency; client failure loses state (usually acceptable). Scales poorly with data size — bandwidth and rendering cost. Security risk: any client-held data must be encrypted and fully revalidated on return (cannot trust what comes back). The session ID is always stored client-side; use platform-generated random IDs to prevent session stealing.

**Server Session State** (p. 458): serialise session state and hold it in server-side memory (HTTP session object) or persist it to a database as a serialised BLOB. Simplest to implement — often zero programming in basic form. If clustering/failover is needed, serialising to a database table is often much less effort than converting session objects to tabular form. Fowler's preference: server memory with remote database backup for crash recovery.

**Database Session State** (p. 462): store active session data as regular database rows. Each request reads necessary state, does work, writes back. Stateless server objects (pooling and clustering straightforward). Performance cost: DB read+write per request (caching can reduce reads). Best when: no session data (trivial case), or easy conversion to tabular form; clustering/failover requirements that Database Session State handles more naturally than Server Session State.

### Chapter 16 — Offline Concurrency Patterns

Catalogue entries for the four offline concurrency patterns (business transactions spanning multiple system transactions). See [[databases/transactions]] for the overview.

**Optimistic Offline Lock** (p. 416, by David Rice): version field on each domain object and table row. At commit time, include the version in the WHERE clause of every UPDATE/DELETE: `UPDATE ... WHERE id = ? AND version = ?` — if zero rows are affected, a conflict is detected. Increment the version on success. The validation + update must occur in one system transaction. Implement as a shared `Version` class/table when using Coarse-Grained Lock. **Default strategy**: use for all business transactions; add Pessimistic only where truly needed.

**Pessimistic Offline Lock** (p. 426, by David Rice): application-managed lock manager (not DB-level locks). Lock types: exclusive read (no other session may read or write), exclusive write (other sessions may read but not write), read/write (shared read, exclusive write). Acquire before using an object; release when the session ends (handle timeouts and crash cleanup). Implementation: `LockManager` with acquire/release/releaseAll methods; lock table in DB; lock ownership by session ID. Use only where conflict cost is unacceptable regardless of probability.

**Coarse-Grained Lock** (p. 483): lock the aggregate root to lock all its parts. Two approaches: (1) shared version — a `Version` object/table record that all aggregate members reference; any member's update increments the shared version; (2) group lock — lock the root to block access to all members. Satisfies business requirements about aggregate integrity (e.g., editing a lease should lock all its assets); also reduces lock management complexity. Don't create unnatural object relationships just to enable coarse-grained locking.

**Implicit Lock** (p. 499): framework acquires/releases locks automatically — application developers never call lock management code explicitly. Implementation: decorate mapper classes with locking behaviour (`LockingMapper` wraps `Mapper`, acquires lock before `find()`). **Use everywhere**: the risk of a single forgotten lock is too high to rely on developer discipline.

### Chapter 15 — Distribution Patterns

**Remote Facade** (p. 388): coarse-grained wrapper that minimises remote calls to a fine-grained domain/application object graph. Contains no business logic — its only job is to reduce the number of round trips. Natural place for security checks and logging. Most common scenario: presentation and Domain Model running in different processes (Swing UI + server domain model; servlets + remote EJBs). Not needed for in-process communication. Implies synchronous/RPC-style distribution — Fowler again recommends async messaging as an often superior alternative.

**Data Transfer Object** (p. 401): bundles data for transfer across a process boundary. Must reference only other DTOs and primitive types (nothing that doesn't cross the wire). Assembler objects move data between domain objects and DTOs. Secondary use: DTO as shared data carrier passed between layers (the .NET `DataSet` / ADO Record Set is an example). Async use: return a Lazy Load of a DTO from an async call — caller blocks only when it actually reads from the DTO.

> **Naming collision**: The J2EE community uses "Value Object" to mean what PEAA calls a DTO. Fowler's own "Value Object" pattern (p. 486) is entirely different — it's an immutable small object (Money, DateRange) with no identity. Be careful with terminology when working with J2EE references.

### Chapter 14 — Web Presentation Patterns

Detailed catalogue entries for MVC, Page Controller, Front Controller, Template View, Transform View, Two Step View, Application Controller. See [[patterns/mvc-web-presentation]] for the full treatment.

**MVC** (p. 330): separation of presentation and model is one of the most important design principles in software. The view/controller separation is less important — recommended in web environments but rarely needed in rich clients. The primary value is that domain logic has no dependency on how it is presented.

**Page Controller** (p. 333): simplest and most familiar; one module per action. Can be a server page (combines Page Controller and Template View) or a separate script. Avoid logic-heavy scriptlets in server pages — use helper objects. Mix Page Controller for simple URLs with Front Controller for complex ones.

**Front Controller** (p. 344): one dispatcher; command objects for actions. Key advantages: single web-server registration; cross-cutting behaviour via decorators (authentication, encoding, i18n); new commands don't require web-server reconfiguration; thread safety from per-request command instantiation.

**Template View** (p. 350): HTML + embedded scriptlets. Easiest for designer/programmer collaboration. Risk: logic leaks in; hard to test without a server. Discipline required to keep logic in helpers.

**Transform View** (p. 361): XSLT-style transformation. Easier to test offline; easier to keep display-focused. XSLT portability across platforms. Downsides: steep XSLT learning curve; weak tooling.

**Two Step View** (p. 365): domain data → logical screen → final HTML. One second-stage for the whole application. Best value: global appearance changes in one place; multi-brand rendering with separate second stages.

**Application Controller** (p. 379): manages screen flow as a state machine. Holds domain commands + views to display. Must not depend on UI machinery (otherwise untestable). Use only for wizard-style controlled navigation; skip when users navigate freely.

### Chapter 13 — Object-Relational Metadata Mapping Patterns

**Metadata Mapping** (p. 306): stores field-to-column correspondence as metadata (config file, annotations, or code) rather than hard-coded in mappers. Two implementation approaches: *code generation* (cleaner for debugging and refactoring tools, but generated files must never be hand-edited) and *reflective programming* (more dynamic, but can interfere with automated refactoring tools that don't read strings in config files). Commercial ORM tools all use Metadata Mapping — the setup cost is justified when selling a reusable tool. If building your own, weigh against a well-factored Layer Supertype that handles common behaviour in handcoded mappers.

**Query Object** (p. 316): an object that represents a database query in terms of domain objects — the Specification pattern applied to queries. Clients construct a criteria object (`criteria.equals(Person.LAST_NAME, "Fowler")`) and pass it to the Query Object, which generates SQL. Only worthwhile with Domain Model + Data Mapper + Metadata Mapping. Most teams should buy a tool rather than build one. A limited Query Object built to cover only actual use cases can be practical on a project that doesn't justify a full implementation.

**Repository** (p. 317, by Edward Hieatt and Rob Mee): mediates between domain and data mapping layers using a collection-like interface. Clients construct Specification criteria and call `repository.matching(criteria)` — no SQL appears in client code. Repository promotes the Specification pattern, removes all the specific finder methods from Data Mapper, and allows different querying strategies via a strategy object (swap in-memory repository for unit tests — test suites with no DB access run significantly faster). Also useful when domain objects come from multiple sources (XML feeds, in-memory objects, etc.). Most valuable in systems with many domain object types and many different query types.

### Chapter 12 — Object-Relational Structural Patterns

**Identity Field** (p. 216): store the DB primary key in the object. Key guidance: prefer meaningless (surrogate) keys over meaningful keys (SSNs, codes) — meaningful keys fail uniqueness and immutability in practice. Prefer simple (single-column) keys over compound keys for uniformity — compound keys require special handling in concrete mappers. Use `long` as the default key type. Key generation options: (a) database auto-increment (convenient but hard to read back the generated value before commit — breaks connected inserts); (b) database sequence/counter (Oracle-style — readable, separate transaction, best when available); (c) GUID (universally unique but large and slow); (d) key table (portable — dedicated table with name/nextID rows, accessed in a separate transaction to minimise lock duration, grab multiple IDs per call to reduce contention). Best to encapsulate key generation in its own class for easy substitution.

**Foreign Key Mapping** (p. 236): maps a single-valued object reference to a foreign key. Use Association Table Mapping for many-to-many. If the related object is a Value Object, use Embedded Value instead.

**Association Table Mapping** (p. 248): link table for many-to-many. Also useful for any association where you want to add attributes to the relationship itself.

**Dependent Mapping** (p. 262): one class performs DB mapping for a child class. The dependent has no mapper; its owner's mapper handles loading and saving. Use when a child is never accessed outside the context of its parent (e.g., album tracks), has no other references to it, and the simplification outweighs the loss of independent addressability. No Identity Map entry needed for the dependent.

**Embedded Value** (p. 268): all Value Objects (Money, DateRange, Address) should always be stored as Embedded Value — they have no identity, so no separate table or Identity Map entry is needed. Also applicable to reference objects with one-to-one associations when: (a) you only access the dependent through the parent; (b) you want to query the dependent's values from SQL (the key advantage over Serialised LOB). Only works for simple dependents (1:1 or a few fixed-count dependents).

**Serialised LOB** (p. 272): store a cluster of objects as a BLOB/CLOB/XML. Best for object subgraphs that are never queried from SQL (otherwise Embedded Value). Works poorly when objects outside the LOB reference objects buried inside it. XML format makes it readable and partially queryable with XPath extensions.

**Inheritance mapping strategies** (pp. 278–293):

| Strategy | Strengths | Weaknesses |
|----------|-----------|------------|
| Single Table | No joins, easy hierarchy refactoring | Many nulls, field namespace collisions, potential lock bottleneck |
| Class Table | No nulls, clean schema | Joins on every load, supertype table bottleneck, hard for ad hoc queries |
| Concrete Table | No joins, load spread across tables | No FK to abstract supertype, superclass changes cascade, superclass queries scan all tables |

Strategies can be mixed within a single hierarchy. A natural split: Single Table for the top of the hierarchy (where fields are mostly shared), Concrete Table for leaf subclasses with a lot of type-specific data.

### Chapter 10 — Data Source Architectural Patterns

Detailed catalogue entries for the four architectural data source patterns, with Java/C# examples.

**Table Data Gateway** (p. 144): stateless wrapper around all SQL for one table. Return type options: (a) raw `ResultSet`/`DataReader` (cursor-based — less memory overhead for large results); (b) ADO.NET `DataSet` (in-memory mirror image — richer but heavier); (c) DTO (explicit interface, reusable elsewhere); (d) domain objects (creates bidirectional TDG↔domain dependency — Fowler is reluctant). TDG + Record Set is the natural pairing for Table Module. Also works as a database-facing interface for Data Mapper when metadata handles the table-level access while hand-coded mappers handle domain object construction.

**Row Data Gateway** (p. 152): one object per database row; no domain logic. Separate `PersonFinder` class holds static/instance query methods; `PersonGateway` holds the row data and update/insert methods. Better than static find methods on the gateway for testability. Gradual accumulation of business logic in a Row Data Gateway naturally evolves it into an Active Record — let it.

**Active Record** (p. 160): same structure as Row Data Gateway but adds domain logic. Static find methods on the Person class; `load()` and `find()` use an Identity Map (Registry) to prevent duplicate loading. Primary advantage: simplicity. Primary disadvantage: coupling — object design and database design must evolve together. Good stepping stone from Row Data Gateway; migrate to Data Mapper when domain complexity diverges from schema.

**Data Mapper** (p. 165): complete isolation. Domain objects have no SQL code. `PersonMapper.find()` → check Identity Map → query DB → `load()` → insert into Identity Map. Identity Map checked in both `abstractFind` (for performance — skip DB if already loaded) and `load` (for correctness — multi-row queries may hit already-loaded objects). Empty object pattern: create object → insert into Identity Map → populate fields (avoids cyclic reference stack overflow). `StatementSource` interface for reusable multi-row queries. For finders domain objects need to invoke: use Separated Interface (declare interface in domain package, implement in mapper). Buy, don't build — use a commercial ORM.

### Chapter 11 — Object-Relational Behavioural Patterns

Catalogue entries for Unit of Work, Identity Map, and Lazy Load with Java (UoW, Identity Map) and C# (Lazy Load ghost) examples.

**Unit of Work** (p. 184): three lists (new, dirty, removed). `registerNew/registerDirty/registerRemoved/registerClean` methods enforce invariants (can't be both new and removed, etc.). `commit()` calls `insertNew()`, `updateDirty()`, `deleteRemoved()`, each finding the appropriate mapper via a `MapperRegistry`. Thread-scoped via `ThreadLocal.current`. Implicit management: wrap a `UnitOfWorkServlet.doGet()` to create and commit the UoW around every request. Handles referential integrity write ordering (topological sort) and deadlock risk reduction (consistent table order).

**Identity Map** (p. 195): explicit maps preferred (`addPerson/getPerson` methods) over generic for compile-time type safety. `registerClean()` can place loaded objects into the map; `registerNew()` adds newly created objects; `registerRemoved()` evicts deleted objects. Best placed inside the Unit of Work. Read-only objects can use process-scoped maps (shared across sessions); updatable objects must use session-scoped maps.

**Lazy Load** (p. 200): four implementations. Lazy initialization: field-level null check in getter — simplest but adds DB dependency to domain class. Virtual proxy: looks like real object but loads on first method call — works cleanly for collections, identity problems for single domain objects. Value holder: typed wrapper around the value; domain class field becomes `ValueHolder` type; loading injected via `ValueLoader` interface at mapper time. Ghost: real object in `GHOST` state; every property getter calls `Load()`; `AbstractFind` creates and returns a ghost (inserted into Identity Map before loading) then actual SQL runs only on first property access. Ghost list (`DomainList`) avoids ripple loading for collections.

### Chapter 9 — Domain Logic Patterns

The pattern catalogue entries for the four domain logic patterns, illustrated with the same **revenue recognition** example (word processors/spreadsheets/databases each with different recognition rules).

**Transaction Script** (p. 110): One procedure per user action. The revenue recognition example uses a `RecognitionService` with two methods — one to calculate recognitions, one to sum them. A `Gateway` wraps all SQL. The branching logic (product type S/W/D) lives directly in the script. Key tension: as rules grow more complex, this logic duplicates across scripts and becomes hard to maintain. Fowler explicitly warns that factoring helps but cannot fully solve the problem — complex domains need Domain Model.

**Domain Model** (p. 116): OO web of objects where each class combines data and behaviour. The same revenue recognition example is structured as a `Contract` → `Product` → `RecognitionStrategy` hierarchy. The runtime calculation has **no conditionals** — the branching was resolved when products were constructed with the appropriate `CompleteRecognitionStrategy` or `ThreeWayRecognitionStrategy` instance. Domain Model moves complexity out of algorithms and into the object structure. Domain objects deliberately hide the database — `Contract.calculateRecognitions()` delegates via `product.calculateRevenueRecognitions(this)` with no SQL visible. POJO domain models are preferable to entity beans for rich domain models; entity beans are appropriate only when domain logic is modest and classes closely mirror tables.

**Table Module** (p. 126): One class instance handles all rows for a table. The C# example passes a `DataSet` to the module constructor; the module's `CalculateRecognitions` method takes a `contractID` and updates the recognition table. An `allocate()` helper handles the rounding problem. Contrast with Domain Model: Table Module uses `prod.GetProductType(prodID)` with a conditional, not polymorphism. Table Module can't support Strategy-style extension — you must edit the conditional. But it works naturally with ADO.NET's `DataTable.Compute()` aggregate functions. Best fit when the Record Set is the first-class data vehicle in the platform.

**Service Layer** (p. 133, by Randy Stafford): The expanded Service Layer example adds application logic on top of the Domain Model example: after calculating recognitions, the service must send an email notification and publish to message-oriented middleware. `RecognitionService.calculateRevenueRecognitions()` calls `contract.calculateRecognitions()` (domain logic), then `getEmailGateway().sendEmailMessage(...)` and `getIntegrationGateway().publishRevenueRecognitionCalculation(contract)` (application logic). All three responses must be transacted atomically. Two implementation variations: **domain facade** (thin wrappers, all logic in Domain Model) vs **operation script** (thicker service classes that implement application logic and delegate to domain objects). Stafford's preference for EJB 2.0: stateless session beans with local interfaces — gets container-managed distributed transactions without the performance penalty of remote invocation.

## Related Pages

- [[styles/layered-architecture]] — Fowler defines the three-layer model
- [[patterns/business-logic-patterns]] — Transaction Script, Domain Model, Table Module, Service Layer
- [[patterns/repository]] — Fowler coined the Repository pattern; covered in Part 2
- [[concepts/coupling]] — distribution as coupling amplifier; layer dependencies
- [[authors/martin-fowler]]

---
title: "Data Decomposition"
type: concept
tags: [data, databases, distributed-systems, decomposition, bounded-contexts]
sources: [software-architecture-the-hard-parts]
created: 2026-05-14
updated: 2026-05-29
---

# Data Decomposition

## Key Claims

- **Disintegrators and integrators give a structured way to decide.** Six disintegrators (change control, connection management, scalability, fault tolerance, quantum, DB-type optimisation) argue for splitting; two integrators (data relationships, transactions) argue for keeping data together. Score them per data domain.
- **Data ownership has three modes.** Single ownership (one service writes), common ownership (many services write — usually wrong; back to shared database), joint ownership (a small set co-owns a domain). The decision shapes every other consistency concern.
- **Eventual consistency has three implementation patterns.** Background sync (least preferred, polling), orchestrated request-based (synchronous coordination, partial-failure-prone), event-based (preferred — async, decoupled, recoverable). Default to event-based unless there's a specific reason.
- **Distributed data access has four patterns.** Interservice communication (sync calls), column schema replication (CDC-driven local replicas), replicated caching (broadcast immutable lookup data), data domain (move both services into a shared bounded context). Choose by access frequency, latency tolerance, and data volatility.
- **Database type selection is a quantum decision.** Polyglot persistence — each service picks the database that fits its access pattern — but the operational cost of multiple databases compounds. The "single database for all services" antipattern recreates the shared-DB monolith with extra steps.
- **Connection management constrains scale-out.** Most relational databases cap concurrent connections in the low hundreds. A microservices fleet sharing one database hits the connection cap before any other limit. Decomposing data is partly a connection-management exercise.

## Definition

Data decomposition is the process of breaking apart a monolithic database into separate data domains — each owned by a bounded set of services — to match the service decomposition of a distributed architecture. It is harder than service decomposition because data is typically the most important asset in an organisation, is highly coupled through relational artifacts (foreign keys, views, triggers, stored procedures), and carries the highest risk of disruption.

> "Breaking apart a database is hard — much harder, in fact, than breaking apart application functionality." (→ [[sources/software-architecture-the-hard-parts]] ch. 6)

## Why It Matters

In distributed architectures, a single shared database creates a single [[concepts/architecture-quantum]] regardless of how many separate services exist. It also creates problems with change control (schema changes cascade), connection management (distributed services multiply connection usage dramatically), fault tolerance (database SPOF for all services), and scalability (all services compete for the same database resources).

Data decomposition is not always required — service-based architecture deliberately keeps a shared database to avoid distributed transaction complexity. The decision to decompose data involves balancing disintegrators against integrators.

## Data Disintegrators

Six drivers that argue for breaking data apart (→ [[sources/software-architecture-the-hard-parts]] ch. 6):

### 1. Change Control
Breaking (non-additive) schema changes — dropping columns, renaming tables, changing types — require all services using that schema to be simultaneously updated, tested, and deployed. As the number of services grows, this coordination becomes unmanageable.

**Bounded context abstraction**: when data is separated, Service C requesting data from Service D receives a JSON/XML contract that may differ from Database D's schema. Service C is abstracted from Database D's breaking changes — the contract only changes when Service D chooses to change it.

### 2. Connection Management
Distributed services each maintain their own connection pool. What was 200 connections in a monolith can become 1,000+ connections across 50 services even before scaling begins. When services scale to multiple instances, connection saturation compounds.

**Connection quota management**: assign each service a maximum connection quota to govern distribution. Two strategies:
- *Even distribution*: same quota per service (simple starting point)
- *Variable distribution*: different quotas based on functionality and scalability needs; adjusted over time via fitness functions measuring concurrent connection usage

### 3. Scalability
Shared databases become bottlenecks as services scale. The number of concurrent connections, throughput, and database capacity all degrade when many services compete for the same database.

### 4. Fault Tolerance
A shared database is a SPOF for all services that depend on it. Breaking apart the database allows different parts of the system to remain operational when one database fails. This creates true domain-level fault tolerance.

### 5. Architectural Quantum
A shared database is part of the static coupling in a system and forces all services into a single [[concepts/architecture-quantum]]. If services need different architectural characteristics (e.g., different SLAs), they cannot form separate quanta while sharing a database.

### 6. Database Type Optimisation
Not all data is best served by the same database type. Monolithic databases force all data into one model. Breaking apart data allows each domain to adopt the most appropriate database type (relational, document, graph, key-value, column family, NewSQL, time-series).

## Data Integrators

Two drivers that argue for keeping data together (→ [[sources/software-architecture-the-hard-parts]] ch. 6):

### 1. Data Relationships
Relational databases are coupled through foreign keys, triggers, views, and stored procedures. These artifacts cannot cross [[concepts/bounded-contexts|bounded context]] boundaries — they must be removed or moved to the service layer before data can be separated. High coupling between tables (many foreign keys crossing domain lines) is a strong argument for keeping data together.

### 2. Database Transactions
ACID transactions cannot span service boundaries without distributed transaction mechanisms (sagas). If an operation requires all-or-nothing consistency across multiple tables, keeping those tables in the same database/schema preserves that guarantee.

See [[distributed/distributed-transactions]], [[patterns/saga]].

## Five-Step Data Decomposition Process

An iterative, evolutionary approach to breaking apart a monolithic database (→ [[sources/software-architecture-the-hard-parts]] ch. 6):

### Step 1: Analyse Database and Create Data Domains
Identify logical groupings of related tables that belong together within a bounded context. A **data domain** is a collection of coupled database artifacts (tables, views, foreign keys, triggers) related to a particular domain and frequently used together.

### Step 2: Assign Tables to Schemas
Move tables into schemas corresponding to their data domains. Cross-domain foreign keys and views can be temporarily handled using **synonyms** (database constructs similar to symlinks) to allow gradual migration without immediately breaking existing queries. Synonyms are a transition mechanism — they must eventually be removed and replaced by inter-service calls.

### Step 3: Separate Database Connections
Refactor service connection logic so each service connects only to its own schema and has read/write access only to tables in its data domain. All cross-schema access is resolved at the service layer (by calling the service that owns the data) rather than directly in the database. Remove all synonyms.

This step achieves **data sovereignty per service** — the state where each service owns its own data — which SATH calls "the nirvana state for distributed architectures."

**Benefits of data sovereignty**: teams can change schema without impacting other domains; each domain can use the most appropriate database type.
**Shortcomings**: performance issues for large cross-domain data access; referential integrity moves to the application layer; stored procedures crossing domains must be rewritten as service calls.

### Step 4: Move Schemas to Separate Database Servers
Migrate each schema to its own physical database server. Two options:
- *Backup and restore*: back up each schema, set up new servers, restore — requires downtime
- *Replication*: replicate schemas to new servers, switch connections, then remove from original — avoids downtime but requires more coordination

### Step 5: Switch Over to Independent Database Servers
Complete the migration by removing connections to the original database servers and decommissioning the original schemas. Each domain now runs on its own independent database server that can be optimised separately for availability and scalability.

## Database Type Selection

Ch 6 introduces a seven-characteristic star rating framework for selecting among eight database types. The principle: match the database type to the access pattern and data structure of the bounded context.

| Database type | Key strengths | Key weaknesses | Best for |
|---------------|--------------|----------------|---------|
| **Relational** | ACID, SQL flexibility, mature tooling | Vertical scaling only; ORM impedance mismatch | Transactional business data with relational structure |
| **Key-Value** | Fast lookups by key, easy horizontal scaling | Query only by key; no joins | Session storage, caches, user preferences |
| **Document** | Flexible schema, aggregate-oriented, secondary indexes | Complex indexing reduces scalability; no cross-document transactions in all cases | Hierarchical/variable-structure data (e.g., customer surveys, product catalogs) |
| **Column Family** | Extremely high write throughput, horizontal scaling, handles sparse data | Steep learning curve; write-optimised access patterns | High-volume time-series, IoT, analytics writes |
| **Graph** | Fast relationship traversal; explicit relationship types | Hard to shard; steep learning curve; expensive to change relationship types | Connected data: social graphs, recommendation engines, knowledge graphs |
| **NewSQL** | SQL + ACID + horizontal scaling | Newer, less operational experience; some DBaaS only | High-scale transactional workloads needing SQL familiarity |
| **Cloud Native** | Managed operations; automatic scaling | Higher learning curve for unfamiliar models (e.g., Datomic); vendor lock-in | Cloud-first teams wanting reduced operational burden |
| **Time-Series** | Append-only optimised; timestamp-first queries | Not general-purpose; changing relationship types expensive | IoT, observability metrics, audit trails, monitoring |

**Aggregate orientation** (from DDD, Eric Evans): non-relational databases (Key-Value, Document, Column Family) favour data structures that group related objects together as a single retrievable unit. Aggregate design must be done carefully — changing aggregate boundaries is expensive.

**"Schema-less" is a misnomer**: NoSQL databases do not eliminate schema — the schema is implicit in the application code or defined elsewhere. The application must handle multiple schema versions returned by the database.

**Polyglot persistence**: using different database types for different bounded contexts within the same system. This is the natural outcome of data domain decomposition and good database type selection.

## Data Ownership

Once data is decomposed into separate domains, each piece of data must have a clear owner — the service that has write authority over it. *Software Architecture: The Hard Parts* (→ [[sources/software-architecture-the-hard-parts]] ch. 9) identifies three ownership patterns:

### Single Ownership

One service holds write authority; all others access the data by calling that service's API. The cleanest pattern: data sovereignty is unambiguous, schema changes are controlled by one team, and consumers are abstracted from the schema via the API contract.

### Common Ownership

Multiple services need to write to the same data. This is resolved by creating a **dedicated data domain service** that owns the data and exposes CRUD operations. Other services that need to write to this data call the data domain service rather than writing directly.

To avoid tight runtime coupling, writes from multiple services can be routed through an **async queue**: producers publish write requests; the data domain service consumes and processes them, maintaining its own pace and availability. This prevents writers from blocking each other.

### Joint Ownership

Multiple services legitimately share responsibility for different parts of the same table — for example, a Customer table where the Order service writes order-related fields and the Account service writes account-related fields. Four techniques to resolve this:

**1. Table split**: divide the table columns into separate tables, one per owning service. Each service writes to its own table. Requires either an explicit join at query time (via inter-service call) or accepting some data duplication.

**2. Data domain technique**: create a shared data domain schema that both services access directly, reverting to a limited form of shared database for this specific data. Sacrifices data sovereignty for simplicity; keeps joint ownership contained to one schema rather than spreading it across services.

**3. Delegate technique**: assign primary ownership to one service; the other service delegates writes through the primary owner. Two sub-variants:
- *Primary domain priority*: assign ownership to the service whose bounded context is most closely related to the data (domain-based assignment).
- *Operational characteristics priority*: assign ownership to the service with the more demanding availability or throughput requirements (operations-based assignment). If the Account service has higher SLAs, it becomes the owner even if the data is closer to the Order domain.

**4. Service consolidation**: merge the two services into one, eliminating the joint ownership problem entirely. Appropriate when the joint ownership is symptomatic of over-decomposition — the services should not have been separated in the first place.

## Eventual Consistency Patterns

When data operations span service boundaries, synchronous ACID transactions are unavailable. Three patterns for achieving eventual consistency (→ [[sources/software-architecture-the-hard-parts]] ch. 9):

### Background Synchronization

A separate background process or batch job periodically reads from one service's data and writes to another's to keep them in sync.

- **Pros**: simple; decoupled from the request path; no inter-service coupling at runtime.
- **Cons**: **breaks bounded context** — the synchronizer process must know about both services' data models and business rules, creating a hidden coupling point outside any service boundary. Latency between source and target can be high (minutes to hours depending on batch frequency). Not suitable for data that drives real-time decisions.
- **Use cases**: reporting, analytics, data warehouses — contexts where some staleness is acceptable.

### Orchestrated Request-Based

The requesting service (or an orchestrator) synchronously calls other services to propagate data changes during request processing.

- **Pros**: tighter consistency than background sync; changes propagate within the request lifecycle.
- **Cons**: increases request latency; tight synchronous coupling between services; requires complex compensating transactions on failure; the orchestrator must know about all downstream data dependencies.
- **Use cases**: when consistency within a request is required but true ACID cannot be achieved.

### Event-Based (Preferred)

Services publish domain events when their data changes; other services subscribe and update their own data stores accordingly.

- **Pros**: fully async; no runtime coupling between producer and consumer; each service can process events at its own pace; decoupled failure domains; scales naturally.
- **Cons**: eventual (not immediate) consistency; consumers may see stale data during the propagation window; event schema versioning must be managed carefully.
- **Use cases**: the natural default for distributed architectures. Aligns with event-driven architecture principles.

See [[patterns/saga]] for distributed workflow coordination that uses event-based consistency.

## Distributed Data Access Patterns

When a service needs data owned by another service, four patterns govern how to access it (→ [[sources/software-architecture-the-hard-parts]] ch. 10):

### 1. Interservice Communication

Service A calls Service B's API at runtime to retrieve the data it needs.

- **Trade-offs**: simplest; no data duplication; introduces inter-service coupling, latency on every request, and a fault tolerance dependency (if B is down, A's requests that need B's data fail).
- **Best for**: low-frequency access, or when the data is highly volatile and must always be current.

### 2. Column Schema Replication

Replicate only the specific columns needed from one service's database to another's, using change data capture (CDC) or event-driven replication.

- **Trade-offs**: removes the inter-service call at read time; eventual consistency (replication lag); no runtime dependency on the source service; introduces data duplication with associated consistency overhead. Requires a replication mechanism (CDC pipeline, event subscription).
- **Best for**: read-heavy scenarios where the replicated columns are relatively stable and read latency matters more than perfect freshness.

### 3. Replicated Caching

Use a distributed in-memory cache (Hazelcast, Apache Ignite, Oracle Coherence) as a shared data layer that multiple services can read from. One service (the owner) writes to the cache; all services read from it.

- **Trade-offs**: fast reads — no network call to another service; removes inter-service coupling at read time. Significant constraints: startup dependency (the cache must be populated before any service that depends on it can start), practical data volume limit (~500MB — beyond this, the data domain pattern is more appropriate), not suitable for high update rates (cache invalidation overhead), and complex configuration in cloud environments (multicast-based cluster formation often disabled in cloud VPCs).
- **Best for**: relatively stable reference data that many services need to read with low latency; on-premises or hybrid environments where multicast is available.

### 4. Data Domain

Both services access the same physical schema (a shared data domain), effectively returning to a mini-shared database for that specific dataset.

- **Trade-offs**: eliminates all inter-service call overhead; no replication lag; loses data sovereignty for the shared domain — schema changes affect all services accessing the shared schema; creates a deployment coupling for schema migrations.
- **Best for**: high-volume, high-frequency shared data access where performance requirements cannot be met by any of the other patterns. Should be minimised — each use of this pattern represents a partial retreat from the distributed architecture model.

### Choosing Between Patterns

| Pattern | Coupling | Data Freshness | Performance | Complexity |
|---------|---------|----------------|-------------|-----------|
| Interservice communication | Runtime API | Always current | Adds latency per call | Low |
| Column schema replication | CDC pipeline | Eventual (lag) | Fast reads | Medium |
| Replicated caching | Cache invalidation | Near-real-time | Fastest reads | High |
| Data domain | Schema (deployment) | Always current | Fastest reads | Low (once set up) |

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/software-architecture-the-hard-parts]] | Primary source; introduces the data disintegrator/integrator framework, five-step process, data sovereignty, connection quota management, database type selection guide, data ownership patterns (single/common/joint), eventual consistency patterns, and distributed data access patterns (ch. 6, 9, 10; co-authored by Pramod Sadalage, a data architecture specialist) |
| [[sources/designing-data-intensive-applications]] | Covers storage engines, data models, replication, and partitioning in depth; the theoretical foundation for database type trade-offs |
| [[sources/understanding-distributed-systems]] | Covers distributed transaction patterns (saga, outbox) that handle cross-domain data operations once decomposition is done |
| [[sources/building-evolutionary-architectures]] | Covers the expand/contract pattern for zero-downtime schema migrations; see [[concepts/evolutionary-database-design]] |

## Related Concepts

- [[concepts/architectural-decomposition]] — service decomposition; data decomposition follows from it
- [[concepts/service-granularity]] — service granularity and data granularity are co-dependent decisions
- [[concepts/architecture-quantum]] — data decomposition is required to form multiple quanta; a shared database forces a single quantum
- [[distributed/distributed-transactions]] — ACID vs BASE; the transaction trade-off that constrains when to decompose
- [[patterns/saga]] — the distributed workflow mechanism used when operations span multiple data domains; event-based eventual consistency pattern
- [[concepts/evolutionary-database-design]] — expand/contract pattern for safe incremental schema migration
- [[databases/data-models]] — relational, document, graph model trade-offs (theoretical foundation)
- [[databases/storage-engines]] — storage internals for LSM-trees (column family, key-value) and B-trees (relational)
- [[patterns/outbox-pattern]] — atomic write+publish mechanism used when a service publishes events on data changes across domain boundaries
- [[streams/change-data-capture]] — CDC as the propagation mechanism for column-replication and event-driven cross-domain data flows
- [[concepts/reuse-patterns]] — shared service and data domain patterns interact with the distributed data access choices

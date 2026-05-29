---
title: "Data Models"
type: database
tags: [databases, data-models, relational, document, graph, query-languages]
sources: [designing-data-intensive-applications, understanding-distributed-systems, foundations-of-scalable-systems]
created: 2026-05-13
updated: 2026-05-29
---

# Data Models

A data model determines how data is organised, how it can be queried, and what kind of relationships it can represent efficiently. The history of data models is a history of abstraction: each generation hides complexity behind a cleaner interface while trading off something else. The dominant models today are relational, document, and graph — each suited to different relationship structures.

## Key Claims

- **Three dominant data models match three relationship structures.** Relational for many-to-many (joins), document for one-to-many trees (nested entities), graph for arbitrary highly-connected data. Picking the wrong model creates expensive workarounds.
- **Relational won by hiding access paths.** Codd's 1970 insight: programmers declare *what* they want; the optimiser decides *how* to retrieve it. CODASYL's manual graph navigation lost because schema changes meant rewriting application code.
- **NoSQL is more tightly coupled to access patterns than relational, not less.** Without joins, data must be pre-joined at write time for expected reads. Changing the access pattern can require rebuilding the data model from scratch.
- **Single-table design** (DynamoDB) deliberately denormalises by overloading partition+sort keys as type discriminators. One query retrieves a customer and their orders without joins — but the schema only fits the planned access patterns.
- **Schema-on-read is not schemaless.** The schema is implicit in application code rather than enforced in the database. The trade-off is migration cost (DB alter vs application interpretation) vs validation guarantees.
- **Polyglot persistence is the modern reality.** No single store fits every workload. Use relational for transactional core, document for content, graph for relationships, columnar for analytics — each where it fits.

## Historical Progression

**Hierarchical model** (1960s–70s): tree-structured records. One-to-many relationships were natural; many-to-many required duplication. Navigated by application code.

**Network model / CODASYL** (1970s): generalised hierarchical to allow records to have multiple parents. Relationships were implemented as explicit access paths (pointers). Programmers had to navigate the graph manually — changing the data model required changing application code.

**Relational model** (E.F. Codd, 1970): hid access path decisions behind a declarative query language. The optimizer chooses how to navigate the data; the programmer declares what they want. Won decisively by the mid-1980s and has dominated for 25–30 years.

**NoSQL** (2009–): not a specific technology. The name originated as a Twitter hashtag for a 2009 open-source database meetup; retroactively reinterpreted as "Not Only SQL." Driven by: need for greater scalability, open-source preference, specialised query needs, desire for more dynamic schemas. **Polyglot persistence**: relational and non-relational stores coexist within one application, each used where it fits best.

## Relational Model

**Origin**: E.F. Codd, 1970. Beat the network model (CODASYL) by hiding access path decisions behind a declarative query language.

**Structure**: data organised into **relations** (tables) of **tuples** (rows) with a fixed schema. Relationships are expressed via foreign keys — references between rows in different tables. Joins reconstruct related data at query time.

**Strengths**:
- Excellent for many-to-many relationships (explicit join semantics).
- Normalization eliminates data duplication — a fact is stored once, referenced everywhere.
- Query optimiser chooses the execution plan — the programmer declares *what*, not *how*.
- Strong consistency guarantees via ACID transactions.

**Weaknesses**:
- **Impedance mismatch**: OOP object graphs don't map cleanly to tables. ORMs reduce but don't eliminate the translation overhead.
- Schema-on-write: migrations required to change structure, which can be slow and risky on large tables.
- Joins are expensive at scale; join-heavy queries limit horizontal sharding.

**Normalization rationale**: store human-meaningful information (e.g., city names, industry names) in one place and reference it by ID. IDs never need to change even when the thing they refer to changes; duplicated text creates update anomalies. IDs have no meaning to humans and thus never need to change — only the display name does.

**Used in**: PostgreSQL, MySQL, Oracle, SQL Server, SQLite.

## Document Model

**Structure**: self-contained JSON or XML documents. A document typically stores a complete entity with all its related data nested — avoiding joins for the common case.

**Strengths**:
- Excellent for one-to-many tree structures (a blog post and its comments; a résumé and its work history).
- Schema flexibility (schema-on-read): different documents in the same collection can have different fields.
- Data locality: all data for a document is stored together — one read retrieves the whole entity.
- Good fit for heterogeneous or rapidly-evolving data.

**Weaknesses**:
- Many-to-many relationships are awkward: storing denormalized data leads to duplication and update anomalies; storing IDs and doing application-level joins is slow and error-prone.
- No join support in early document databases — MongoDB added lookup ($lookup) later.
- No cross-document transactions in many implementations.
- Nesting depth limitations (update whole document even for small field change).

**Used in**: MongoDB, CouchDB, Firestore, DynamoDB (with document-style items).

> **Open question:** The relational vs. document debate has softened — PostgreSQL supports JSONB natively, and MongoDB added multi-document transactions. The boundary is increasingly a spectrum.

### NoSQL Data Modeling: Access-Pattern-Driven Design

A critical misconception: NoSQL is often described as "more flexible" because it has no enforced schema. In practice, NoSQL stores are **more tightly coupled to access patterns than relational databases**, not less. Because NoSQL stores avoid joins, data must be pre-joined (denormalized) at write time for the expected read patterns. If the access pattern changes, the data model may need to be rebuilt from scratch.

**DynamoDB as a concrete example** (→ [[sources/understanding-distributed-systems]] ch. 19):

DynamoDB's primary abstraction is a table with items. Each item has a **partition key** (determines which partition/node holds the item) and an optional **sort key** (determines ordering within a partition, enabling range queries within the partition). The partition key defines the unit of scalability; the sort key defines the unit of queryability within a partition.

Key modeling technique — **single-table design**: store multiple entity types in one table using the partition+sort key pair as a type discriminator. Example (orders + customers):

| Partition Key | Sort Key    | Attributes |
|---------------|-------------|------------|
| `jonsnow`     | `2021-07-13` | OrderID: 1452, Status: Shipped |
| `jonsnow`     | `jonsnow`   | FullName: Jon Snow, Address: ... |

Because the customer and their orders share the same partition key, a single query retrieves both — no join required. This replaces a two-table join at query time with a deliberate write-time denormalization.

**Secondary indexes in DynamoDB**:
- **Local secondary index (LSI)**: alternate sort key within the same partition. Consistent reads.
- **Global secondary index (GSI)**: different partition key and sort key. Reads are eventually consistent (index updates are asynchronous).

**Note**: DynamoDB's internal architecture (Raft-based, 3 replicas per partition, write acked at 2/3) is entirely different from the 1997 Dynamo paper (leaderless quorum). The name is historical, not architectural.

The key takeaway: **NoSQL requires identifying access patterns upfront and modeling data around them**. Retrofitting different access patterns to an existing NoSQL schema is expensive.

## Graph Model

**Structure**: vertices (nodes, entities) and edges (relationships, arcs) — both with arbitrary properties.

**Two main variants**:
- **Property graphs** (Neo4j, Titan, Amazon Neptune): vertices and edges each have arbitrary key-value properties; edges have a direction, type, and endpoints.
- **Triple-stores / RDF** (SPARQL, Datomic): everything is a (subject, predicate, object) triple; subject and object are vertices, predicate is an edge with a name.

**Strengths**:
- Optimised for highly connected data with arbitrary, complex relationships.
- Traversal queries (find all friends-of-friends, shortest path, subgraph patterns) are natural.
- No need to pre-define a schema of relationships — add new edge types without migration.
- Recursive queries (variable-depth traversal) are first-class, not bolted on.

**Strengths**:
- Optimised for highly connected data with arbitrary, complex relationships.
- Traversal queries (find all friends-of-friends, shortest path, subgraph patterns) are natural.
- No need to pre-define a schema of relationships — add new edge types without migration.
- Recursive queries (variable-depth traversal) are first-class, not bolted on.
- **Evolvability**: graphs accommodate changes in data structure far more easily than rigid schemas — adding a new edge type requires no migration.

**Weaknesses**:
- Higher per-vertex/edge overhead than relational rows.
- Full aggregation queries (count, sum) are awkward.
- Fewer tooling and operational options than relational.

**Query languages**: Cypher (Neo4j, declarative pattern matching), SPARQL (RDF, triple-pattern queries), Gremlin (Apache TinkerPop, imperative traversal), Datalog (recursive rules, subset of Prolog).

**Used in**: Neo4j (social networks, fraud detection, knowledge graphs), Amazon Neptune, Datomic (triple-store with immutable history).

## Network Model (Historical)

CODASYL (1970s) used a network model: records linked via explicit access paths (pointers). Programmers had to navigate the graph manually — changing the data model required changing application code. Relational won because it decoupled the query from the access path.

## Schema-on-Write vs Schema-on-Read

| Property | Schema-on-Write (relational) | Schema-on-Read (document) |
|----------|------------------------------|---------------------------|
| When validated | At write time — rejected if wrong | At read time — application interprets |
| Migration | ALTER TABLE required (often slow) | Add new field; old documents get null/default on read |
| Best for | Stable, well-understood schema | Heterogeneous or rapidly evolving data |
| Analogy | Statically typed language | Dynamically typed language |

Schema-on-read is not "schemaless" — there is an implicit schema assumed by the application. The schema is just not enforced by the database.

## Query Languages

| Language | Model | Style | Notes |
|----------|-------|-------|-------|
| SQL | Relational | Declarative | Optimizer picks execution plan; enables index selection, join reordering |
| MapReduce | Any | Functional imperative | User writes map + reduce functions; flexible but verbose |
| Cypher | Property graph | Declarative pattern matching | Concise for graph traversal |
| SPARQL | RDF triple-store | Declarative pattern matching | Verbose, powerful, used in semantic web |
| Datalog | Triple-store | Recursive rules | Foundation of Datomic query language; handles recursive queries naturally |
| MongoDB Aggregation | Document | Pipeline stages | SQL-like but document-oriented |

**Declarative vs imperative**: declarative queries (SQL, Cypher) tell the DB *what* data you want; the optimizer decides *how* to retrieve it. This enables indexing, parallel execution, and plan changes without touching application code. Imperative queries (MapReduce) give more control but forgo these optimizations.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/designing-data-intensive-applications]] | Most thorough treatment of all three models, historical context (CODASYL), query language comparison, schema-on-read/write distinction (ch. 2) |
| [[sources/fundamentals-of-software-architecture]] | Treats data model as a downstream consequence of technical vs domain partitioning — layered architecture leads to shared data model; microservices leads to per-service data model |
| [[sources/foundations-of-scalable-systems]] | Frames the NoSQL modeling shift as **solution domain modeling vs. problem domain modeling**: relational normalisation models the *problem domain* (eliminate redundancy, support any query); NoSQL models the *solution domain* (optimise for actual access patterns, denormalise for reads). "Table per use case" is the practical heuristic. Trade-off: reads are fast; writes are slower; updates to duplicated data require application-level management. Also covers four NoSQL model types (key-value, document, wide column, graph) and notes that graph databases are the exception — inherently difficult to partition horizontally. (ch. 10) |

## Related Concepts

- [[databases/storage-engines]] — data model determines how the engine must store and index data
- [[databases/transactions]] — ACID guarantees apply at the data model boundary
- [[databases/encoding-and-evolution]] — how data models evolve over time and how changes are encoded
- [[concepts/technical-vs-domain-partitioning]] — data model choice interacts with partitioning strategy
- [[concepts/evolutionary-database-design]] — how to evolve schemas safely over time

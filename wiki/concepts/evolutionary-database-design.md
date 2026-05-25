---
title: "Evolutionary Database Design"
type: concept
tags: [databases, schema-evolution, data, evolutionary-architecture, coupling]
sources: [building-evolutionary-architectures, monolith-to-microservices]
created: 2026-05-13
updated: 2026-05-15
---

# Evolutionary Database Design

## Definition

Evolutionary database design treats schemas as evolvable artifacts — changed incrementally and safely over time using version-controlled migration scripts, without requiring downtime or coordinated consumer changes. It is the data complement to evolutionary architecture: just as [[concepts/fitness-functions]] govern code quality continuously, migration tools govern schema drift as part of the [[concepts/deployment-pipelines|deployment pipeline]].

## Why It Matters

Databases are often the hardest coupling point in a distributed system. A shared schema couples every consumer to the same data model; any field change requires coordinated deployment of all consumers. Without an explicit evolutionary approach, schemas calcify: developers fear touching them, legacy columns accumulate, and data inconsistencies compound over time (→ [[sources/building-evolutionary-architectures]] Ch 5).

## Inappropriate Data Coupling

Three forms of data coupling that resist evolution:

**Shared schema coupling**: multiple services read and write the same tables without schema ownership. A field rename requires simultaneous deployment of all consumers. Solution: each service owns its schema; shared data flows through service APIs, not direct database connections.

**Age and quality of legacy data**: historical schemas encode past business logic in null patterns, inconsistent formats, and deprecated fields. Consumer logic couples to these historical decisions and must be updated in lockstep. Solution: clean data quality before or during migration, not after.

**Vendor coupling**: proprietary SQL syntax (stored procedures, vendor-specific functions, non-standard types) couples the schema to a specific database vendor. Solution: use standard SQL; treat the database vendor as a replaceable implementation detail.

## The Expand/Contract Pattern

The expand/contract (or parallel change) pattern enables zero-downtime schema evolution (→ [[sources/building-evolutionary-architectures]] Ch 5):

**Phase 1 — Expand**: add the new column, table, or structure alongside the old. New writes populate both; reads continue from the old structure. No consumer is broken.

**Phase 2 — Migrate**: update consumers to read from the new structure. Backfill historical data from old to new. Run dual-writes (writing to both) during the transition window.

**Phase 3 — Contract**: once all consumers read from the new structure and all historical data is migrated, remove the old structure.

At every phase, both old and new structures coexist. No individual step breaks any consumer. The pattern applies to columns, tables, foreign keys, indexes, and denormalisation changes.

Concrete column-rename example:

```sql
-- Phase 1: Expand — add new column alongside old
ALTER TABLE users ADD COLUMN display_name VARCHAR(255);
UPDATE users SET display_name = first_name || ' ' || last_name;
-- Application writes to BOTH first_name/last_name and display_name

-- Phase 2: Consumers migrate to read display_name
-- (Done service-by-service at each team's own pace)

-- Phase 3: Contract — remove old columns once all consumers are migrated
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
```

## Migration Tools

Version-controlled SQL migration scripts applied sequentially in the deployment pipeline:

- **Flyway**: migration scripts numbered sequentially; applied in order on deploy; scripts are immutable once applied (no rollback by default)
- **Liquibase**: change sets defined in XML/YAML/JSON; supports rollback definitions alongside forward migrations; change sets are checksummed for integrity

Both tools maintain a schema version table. The pipeline applies pending migrations automatically on each deploy, making schema evolution part of CI/CD rather than a manual DBA operation.

## Shared Database Decomposition

When decomposing a monolith, the shared database must be split alongside the code. Three scenarios with different migration complexity (→ [[sources/building-evolutionary-architectures]] Ch 5):

**Option 1 — No integration points, no legacy data**: clean split. Each service claims its tables; no external consumer reads them directly. Straightforward: move tables, update connection strings, deploy.

**Option 2 — Legacy data, no integration points**: data migration required but no external coordination. Use expand/contract to move data to new schema. No other services are affected, so migration can proceed at the owning team's pace.

**Option 3 — Legacy data with integration points**: most complex. External consumers (other services, reporting systems) hold direct database connections. Steps:
1. Introduce a service API as the stable seam in front of the shared tables
2. Migrate consumers to use the API rather than direct DB connections
3. Apply expand/contract to the schema behind the API
4. Once all consumers use the API, the schema is fully internal to the service and can be evolved freely

During the migration window in Scenario 3, **database triggers** serve as a temporary dual-write mechanism: an INSERT/UPDATE trigger on the old table populates the new schema automatically, keeping both in sync without changing consumer code. Remove the triggers once migration is complete.

```sql
-- Trigger keeps new schema populated during consumer migration window
CREATE TRIGGER sync_new_schema
AFTER INSERT OR UPDATE ON orders_legacy
FOR EACH ROW
  INSERT INTO orders_v2 (id, customer_id, total, placed_at)
  VALUES (NEW.order_id, NEW.cust_fk, NEW.amount, NEW.created);
```

## Schema as Code

Database schemas should be treated like code: version-controlled, tested, and applied automatically in the deployment pipeline (→ [[sources/building-evolutionary-architectures]] Ch 5). Migrations are never run manually by a DBA — they are part of the build.

Properties of well-managed schema evolution:
- **Version-controlled**: migration scripts live in the same repository as the code that uses them; they are reviewed in the same PR
- **Tested**: migrations are run in CI against a real database (not mocked); forward and backward paths are verified where rollback is defined
- **Incremental**: each migration does one thing; large schema changes are broken into multiple steps (each a single expand or contract)
- **Immutable once applied**: migration scripts are never edited after being applied to any environment; corrections are new migrations

Flyway and Liquibase both maintain a schema version table (`flyway_schema_history`, `databasechangelog`) that tracks which migrations have been applied. The pipeline checks this table on each deploy and applies any pending migrations.

## The Reporting Antipattern

OLTP (operational transaction processing) and OLAP (analytical query processing) have fundamentally different requirements:

| | OLTP | OLAP |
|--|------|------|
| Query pattern | Short, row-level | Long-running, aggregate |
| Data model | Normalised | Denormalised / dimensional |
| Latency requirement | Sub-millisecond | Seconds to minutes |
| Concurrent operations | Many writers | Few readers |

Placing both in the same service and database creates inadvertent coupling: long-running analytical queries contend with transactional operations; schema changes for operational needs break analytical queries; analysts couple directly to operational data models.

Solution: separate OLTP and OLAP into distinct services with distinct data stores. Analytical data flows to a reporting service via CDC, event streams, or scheduled exports — never via direct operational database reads.

> **Contradiction note:** [[sources/fundamentals-of-software-architecture]] notes that service-based architectures may share a database legitimately if services own separate *schemas* within it. Evo-arch's treatment is stricter — even schema-level sharing creates coupling that resists evolution. The difference is one of degree: intentional, bounded schema sharing (FOSA) vs. schema ownership as an inviolable rule (evo-arch).

## Database Decomposition Patterns (Newman)

Newman's *Monolith to Microservices* (ch. 4) provides the most complete practitioner catalogue of patterns for splitting a shared database during a migration. These patterns address both the read/write problem (how to access data while splitting) and the ownership problem (which service is the source of truth). (→ [[sources/monolith-to-microservices]])

**Coping patterns** (bridge strategies while the split is not yet possible):

| Pattern | Mechanism | Limitation |
|---------|-----------|-----------|
| *Database View* | Expose a projection of the shared schema as a read-only view | Read-only; cannot write; schema change still propagates if not in view |
| *Database Wrapping Service* | Wrap the database behind a thin service API; all callers migrate to the API | Transitional — the database is still shared until callers are all migrated |
| *Database-as-a-Service Interface* | Dedicated read-only endpoint; mapping engine (CDC/batch/events) populates a read model | Produces an eventually consistent copy; not suitable for operations requiring freshest data |
| *Aggregate Exposing Monolith* | Expose an aggregate as a monolith endpoint before extracting it | New services call the monolith; the monolith still owns the data |

**Active decomposition patterns** (transfer data ownership to the new service):

| Pattern | Mechanism | Use When |
|---------|-----------|---------|
| *Change Data Ownership* | Move data to new service; monolith calls the service API | Monolith can be modified; data has a clear single owner |
| *Synchronise Data in Application* | 3-phase: bulk sync → write both/read old → write both/read new | Zero-downtime migration between incompatible stores (e.g., MySQL → Riak) |
| *Tracer Write* | Incrementally migrate source of truth; tolerate two sources of truth during transition | Large data volumes; need to migrate over months without downtime |

**Schema boundary patterns**:

- *Repository per Bounded Context*: colocate database mapping code (ORM models, repository classes) with the bounded context that owns the data. Never share repository classes across contexts. Use SchemaSpy to visualise cross-context FK relationships — each cross-context FK is a coupling point to resolve.
- *Database per Bounded Context*: even within a monolith, use separate logical schemas per bounded context (PostgreSQL schema-per-BC, MySQL database-per-BC). The ThoughtWorks Revenue service example is a modular monolith: one deployment unit, multiple bounded contexts, separate schemas. Ready for physical separation later.
- *Multischema Storage*: new service owns its schema for new data; still reads legacy data from the old source during transition.

**Table-level patterns**:

- *Split Table*: tables that cross bounded context boundaries are split; each column is assigned to the context that owns it; columns owned by the other context become API calls.
- *Move Foreign-Key Relationship to Code*: remove the database FK across context boundaries; enforce the relationship via service calls. Three deletion strategies: (1) check before delete via service call — avoid, creates temporal coupling; (2) handle gracefully — detect missing entity and deal with it in the consumer; (3) don't allow deletion — enforce at the service level.

**Static reference data**: four options for data that is read-only and shared across contexts: (1) duplicate into each service; (2) dedicated shared schema (read-only); (3) shared library with the data bundled (Stitch Fix pattern); (4) dedicated reference data service (FaaS-friendly).

**Split sequencing trade-offs** (schema first vs code first vs both at once):
- *Schema first*: safe, maintains the ability to roll back code changes; but delivers no visible benefit until the code follows.
- *Code first*: most common; new service uses new schema immediately, but the risk is that the team stops before the database is split, leaving the shared database permanently.
- *Both at once*: avoid — the blast radius of a failed migration is maximised.

Newman's overall advice: physical database separation is a goal, not a prerequisite. Start with logical separation (repository and schema per BC) and move to physical separation (separate database servers) only when independent scaling or failure isolation is needed.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/building-evolutionary-architectures]] | Dedicated chapter; expand/contract pattern, migration tools, three decomposition scenarios, reporting antipattern |
| [[sources/monolith-to-microservices]] | Most complete practitioner catalogue: ~12 patterns for database decomposition during migration; split sequencing trade-offs; repository per BC, database per BC, static reference data patterns, table splitting, FK to code; sagas for cross-boundary transactions (ch. 4) |
| [[sources/fundamentals-of-software-architecture]] | Mentions database coupling in the context of service-based architecture; permits shared databases with separate schemas as a pragmatic trade-off |
| [[sources/understanding-distributed-systems]] | Focuses on data consistency and replication at the service layer rather than schema evolution practices |

## Related Concepts

- [[concepts/evolutionary-architecture]] — database evolution is one key dimension of evolutionary architecture
- [[distributed/distributed-transactions]] — decomposing a shared database creates distributed transaction challenges; [[patterns/saga]] and [[patterns/outbox-pattern]] address these
- [[patterns/outbox-pattern]] — enables atomic write + event emission without shared database coupling across services
- [[concepts/fitness-functions]] — migration scripts as fitness functions: the pipeline applies and verifies schema migrations on every deploy
- [[concepts/deployment-pipelines]] — the mechanism that applies schema migrations automatically as part of each release

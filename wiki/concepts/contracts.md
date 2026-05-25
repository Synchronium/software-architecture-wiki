---
title: "Contracts in Distributed Architecture"
type: concept
tags: [contracts, coupling, microservices, api, integration, events, schema-evolution]
sources: [software-architecture-the-hard-parts, mastering-api-architecture, building-event-driven-microservices, monolith-to-microservices, enterprise-integration-patterns]
created: 2026-05-14
updated: 2026-05-15
---

# Contracts in Distributed Architecture

## Definition

A contract is the format used by parts of an architecture to convey information or dependencies (→ [[sources/software-architecture-the-hard-parts]] ch. 13). This definition is intentionally broad: it covers API protocols (REST, gRPC, GraphQL), shared library interfaces, message schemas, integration event formats, framework transitive dependencies, and any other mechanism that "wires together" parts of a system.

Contracts cut across all three dynamic coupling dimensions (communication × consistency × coordination — see [[patterns/saga]]) and also affect static quantum coupling. They are one of the most pervasive sources of coupling in distributed architectures.

## Strict vs Loose Contracts

Contracts exist on a spectrum from strict to loose (→ [[sources/software-architecture-the-hard-parts]] ch. 13):

**Strict contracts** require exact adherence to names, types, ordering, and all other details. Examples: RMI (remote method invocation), gRPC (which defaults to Protobuf schemas), JSON with JSON Schema enforcement. Strict contracts mimic method-call semantics across a network.

**Loose contracts** provide minimal or no schema enforcement. Examples: plain JSON name-value pairs, YAML, REST resources (adding fields doesn't break consumers), GraphQL (consumers specify exactly what they need).

### Strict Contracts: Trade-offs

| Advantage | Disadvantage |
|-----------|-------------|
| Guaranteed contract fidelity | Tight coupling |
| Easier to verify at build time | Versioning management overhead |
| Better documentation | Breaking changes cascade across all consumers |
| Explicit versioning | — |

### Loose Contracts: Trade-offs

| Advantage | Disadvantage |
|-----------|-------------|
| Highly decoupled | No built-in schema enforcement |
| Easier to evolve | Contract management (misspellings, missing fields) |
| — | Requires fitness functions or consumer-driven contracts |

## Consumer-Driven Contracts

Consumer-driven contracts solve the dual problem of loose coupling and contract fidelity (→ [[sources/software-architecture-the-hard-parts]] ch. 13):

In a standard contract model, the provider decides what to emit (**push model**). Consumer-driven contracts invert this to a **pull model**: each consumer specifies the contract it needs from the provider. The provider includes all consumer contracts as pipeline tests and maintains them as green at all times.

```
Consumer A → [specifies contract A] → Provider
Consumer B → [specifies contract B] → Provider  ← runs all contracts as CI gates
Consumer C → [specifies contract C] → Provider
```

**Advantages**: allows loose implementation coupling while guaranteeing contract fidelity; each consumer specifies exactly what it needs (no over-specification); each team can evolve independently as long as their consumer contract passes; supports polyglot service teams.

**Disadvantages**: requires engineering maturity — if teams skip contract tests or allow failures, integration points silently break; requires two mechanisms (loose contract format + consumer-driven contract test runner) rather than one.

**Implementation**: the Pact framework is the canonical implementation — see [[concepts/api-testing]] for the testing mechanics.

> Consumer-driven contracts are architecture fitness functions (→ [[sources/software-architecture-the-hard-parts]] ch. 13; [[sources/building-evolutionary-architectures]] ch. 8): they are atomic + triggered governance mechanisms for integration protocol compliance.

## Stamp Coupling

Stamp coupling describes passing a large data structure between services where each service uses only a small part of it (→ [[sources/software-architecture-the-hard-parts]] ch. 13).

**Stamp coupling as anti-pattern**: if Service A needs only the `name` field from Service B's `Profile` object, but the contract passes the entire `Profile` schema (including all fields the consumer will never use), this is over-specification. Every change to `Profile` — even fields the consumer doesn't use — breaks the contract and requires coordination. The rule: keep contracts at a "need-to-know" level.

**Bandwidth consideration**: at high request volumes, over-specified contracts multiply bandwidth costs dramatically. If each payload is 500KB instead of 200 bytes, 2,000 requests/second consumes 1,000,000 KB/s vs 400 KB/s.

**Stamp coupling for workflow management (legitimate use)**: when using choreography for distributed workflows, stamp coupling can be used deliberately to carry workflow state in each message (→ [[sources/software-architecture-the-hard-parts]] ch. 13; also discussed in [[patterns/saga]]). Each service receives the full workflow state, updates its portion, and passes the updated state forward. This resolves the choreography state-tracking problem at the cost of increased message size.

**Stamp coupling trade-offs:**

| Advantage | Disadvantage |
|-----------|-------------|
| Enables complex workflows in choreographed designs | Creates (sometimes artificially) high coupling |
| Carries workflow state without external state store | Can create bandwidth issues at high scale |
| Simplifies choreography state management | Every field change in the stamp affects all participants |

## Choosing Contract Strictness

| Scenario | Recommended approach |
|----------|---------------------|
| Services requiring high fidelity, changing together, same tech stack | Strict (gRPC/Protobuf) |
| Services that should evolve independently, different teams | Loose (JSON) + consumer-driven contract |
| External/public APIs where consumers cannot be coordinated | Versioned REST (additive changes, deprecation policy) |
| Mobile apps via app store (slow deployment) | Loose — store approval delays prevent tight contract coordination |
| Workflow state in choreography | Stamp coupling with loose contracts |

## Event Data Contracts (Bellemare)

Bellemare extends the contracts concept into the event streaming domain, where contracts govern asynchronous event schemas rather than synchronous API calls (→ [[sources/building-event-driven-microservices]] ch. 3).

**Data contract structure**: an event data contract has two components — the **data definition** (fields, types, structures) and the **triggering logic** (the specific business event that caused the event's emission). Changing the triggering logic is more dangerous than changing the data definition because it alters the semantic meaning of the event, not just its format.

**Schema evolution compatibility types** (see also [[databases/encoding-and-evolution]]):
- **Forward compatibility**: data produced with a newer schema can be read by a consumer using an older schema. Common pattern in EDM — producer updates first, consumers catch up in their own time.
- **Backward compatibility**: data produced with an older schema can be read by a consumer using a newer schema. Enables consumers to update before producers, and allows reprocessing of old events with new logic.
- **Full compatibility**: the union of forward and backward. Use by default. You can always loosen compatibility requirements later; tightening them is hard.

**Schema registry**: a centralised store for schema definitions and their evolution rules. Producers and consumers look up schema versions at runtime. Kafka and Pulsar support Avro, Protobuf, and JSON Schema through a registry (Confluent Schema Registry is the canonical Kafka implementation).

**Schema registry workflow** (→ [[sources/building-event-driven-microservices]] ch. 14): (1) producer serialises event → registers schema → gets back a schema ID → appends the compact ID to the serialised event payload (not the full schema, saving significant bandwidth) → caches the ID locally. (2) consumer receives event → reads schema ID → checks local cache → if not cached, fetches schema from registry → deserializes event → caches schema. The Confluent implementation stores schemas in a dedicated broker topic, providing durable storage without a separate database.

**Schema change notifications**: when a producer evolves a schema, downstream consumers need to know. ACLs identify which consumers read which streams; cross-referencing ACLs with schema change events automatically identifies affected teams. A notification system routes alerts via the microservice-to-team ownership registry — no manual tracking required.

**ACLs as contract enforcement**: access control lists enforced at the broker level are the operational mechanism for the single writer principle (→ [[sources/building-event-driven-microservices]] ch. 14). Each microservice is granted WRITE permission only to its own output streams; no other service can write them. Typical permission set:

| Stream type | Permissions |
|-------------|-------------|
| Input event streams | READ |
| Output event streams | CREATE, WRITE |
| Internal/changelog streams | CREATE, WRITE, READ |

Enable ACLs from day one — retrofitting requires auditing every existing connection. Grant/revoke events should be stored as events themselves (immutable audit log of who accessed what). ACLs also enable **orphan detection**: streams with no registered READ consumers can be flagged for deletion.

**Recommended formats**: Avro and Protobuf provide full-compatibility schema evolution frameworks and code generator support (generating typed classes in the target language). Plain JSON does not provide full-compatibility evolution and forces consumers to interpret the data themselves — an implicit contract that becomes tribal knowledge. Do not use JSON for inter-service event contracts.

**Event design principles** (anti-patterns):
- *Type discriminator fields*: a `productType: Book/Movie` field in a single event schema is the event equivalent of stamp coupling. As business requirements diverge, the schema accumulates nullable fields that apply only to specific types, and schema evolution becomes impossible cleanly. Solution: separate event definitions per business action.
- *Events as semaphores*: an event that only signals "work is done" without carrying the result creates a second source of truth and forces consumers to fetch data from elsewhere.

**Breaking changes**: for entity schemas, the producer is responsible for re-creating all entities under the new schema (not leaving it to consumers). Keep the old stream for forensics; produce new entities to a new stream. For event schemas, create a new stream; old consumers migrate in their own time.

## Breaking Contract Changes in Practice (Newman)

Newman's treatment focuses on the operational management of contract changes during a microservice migration (→ [[sources/monolith-to-microservices]] ch. 5).

**Two types of breaking change**: *structural* (a field is renamed, removed, or its type changes — caught by schema comparison tools) and *semantic* (the same field name now means something different — only caught by testing). Both are dangerous; semantic breaks are harder to detect.

**Detection mechanisms**:
- **Explicit schemas** make structural changes harder to make accidentally — the developer must modify the schema by hand, creating a pause for thought. Tool: `protolock` prohibits incompatible changes to Protocol Buffers definitions at CI time.
- **Schema-less JSON** is the default for many teams, but it provides no structural contract protection. Developers who start with JSON "curse the constraints of formal schemas initially — after they've had to deal with breaking changes across services, they'll change their minds."
- **Consumer-driven contracts** (Pact) detect semantic breakages in addition to structural ones, because consumer contract tests define expected behaviour not just shape.

**Expansion changes (additive)**: prefer adding new endpoints, fields, or methods without removing the old. Support old and new simultaneously. "If you decide to break a contract, it's on you to handle the implications of that."

**Managing necessary breaking changes**: two approaches —
1. *Run two service versions simultaneously*: old version and new version both deployed. Consumers choose which to call. Extra infrastructure cost; data compatibility must be maintained across both; bug fixes may need to be applied to both. Only viable for short coexistence periods.
2. *One service exposing two contracts* (preferred): same service process exposes old and new contracts on different ports or paths. Adds complexity to the implementation but avoids dual-infrastructure. Teams have accumulated 3+ old contracts this way — painful but better than forced lock-step.

Within a single team, lock-step release (deploy consumer and provider together) is acceptable occasionally but should not become a habit.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/software-architecture-the-hard-parts]] | Primary source for contracts taxonomy: strict/loose spectrum, stamp coupling, consumer-driven contracts as fitness functions (ch. 13) |
| [[sources/mastering-api-architecture]] | API contract tooling (OpenAPI Specification, gRPC/Protobuf); versioning strategies; API-first design as upfront contract specification |
| [[sources/building-evolutionary-architectures]] | Consumer-driven contracts as atomic integration fitness functions (ch. 8); Pact framework as the implementation |
| [[sources/building-event-driven-microservices]] | Event data contracts: data definition + triggering logic; schema evolution compatibility types; schema registry workflow (ID-based, bandwidth-efficient); schema change notifications; ACLs as single-writer enforcement (ch. 3, 14) |
| [[sources/monolith-to-microservices]] | Migration-focused treatment: structural vs semantic breaking changes; explicit schema detection (protolock); expansion changes as the default; two management strategies (dual versions vs dual contracts in one service); consumer-driven contracts (Pact) as the testing solution for cross-service contracts (ch. 5) |
| [[sources/enterprise-integration-patterns]] | *Format Indicator* pattern: messages carry an indicator of their data format to allow multiple format versions to coexist on the same channel. Three implementations: (1) Version Number — compact agreed string; (2) Foreign Key — URL/key to shared schema repo; (3) Format Document — embedded schema in message body (self-contained but adds payload overhead). Stored in header for version/key, body for embedded schema. The Canonical Data Model is also a contract mechanism — a shared format all applications translate to/from (ch. 1, 5). |

## Related Concepts

- [[concepts/api-design]] — REST, gRPC, GraphQL are contract implementation formats
- [[concepts/api-testing]] — consumer-driven contracts (Pact) as testing mechanism
- [[concepts/fitness-functions]] — consumer-driven contracts as atomic integration fitness functions
- [[patterns/saga]] — stamp coupling for workflow management; semantic vs implementation coupling
- [[concepts/architecture-quantum]] — contracts define static quantum coupling; loose contracts reduce static coupling
- [[concepts/reuse-patterns]] — shared library contracts; versioning discipline applies to both shared libraries and APIs

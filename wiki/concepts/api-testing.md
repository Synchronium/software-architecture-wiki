---
title: "API Testing"
type: concept
tags: [testing, contract-testing, api, quality, distributed-systems]
sources: [mastering-api-architecture, understanding-distributed-systems, building-event-driven-microservices]
created: 2026-05-13
updated: 2026-05-14
---

# API Testing

## Definition

API testing is the set of practices for verifying that APIs behave correctly: that they honour their contracts, handle failure cases, perform adequately under load, and integrate correctly with their consumers. In a distributed system, testing is more complex than in a monolith because failures happen across service boundaries that cannot be controlled by a single test.

## The Test Quadrant

The Marick/Crispin test quadrant organises tests along two axes: technology-facing vs business-facing, and automated vs exploratory (→ [[sources/mastering-api-architecture]] Ch 2):

|  | Automated | Exploratory / Manual |
|--|-----------|---------------------|
| **Business-facing** | Q2: Acceptance tests, BDD scenarios | Q3: Exploratory testing, usability |
| **Technology-facing** | Q1: Unit tests, contract tests | Q4: Performance, security, penetration |

All four quadrants are needed. Q1 and Q2 should be automated. Q3 and Q4 involve human judgment but should be tool-assisted.

## The Test Pyramid

```
        ┌──────────────┐
        │  End-to-End  │  ← fewest; most expensive; most brittle
        ├──────────────┤
        │   Service /  │
        │   Contract   │  ← moderate number
        ├──────────────┤
        │    Unit      │  ← most; cheapest; fastest
        └──────────────┘
```

Inverting the pyramid (many E2E, few unit tests) creates an "ice-cream cone" anti-pattern: slow, brittle test suites that run infrequently and provide poor signal.

## Contract Testing

Contract testing is the most important testing investment for API-driven distributed systems. A contract defines a valid interaction between a consumer and a producer: the request shape, the response shape, and the expected status codes.

**Why it matters**: Integration failures typically manifest not as wrong logic but as contract violations — a field is renamed, a response body changes shape, a status code changes. Unit tests catch none of this; end-to-end tests catch it too late and too expensively.

**Two approaches**:

**Producer contracts** (provider-defined): The producer defines the contract; consumers must adapt. Better for external public APIs where the producer cannot track all consumers.

**Consumer-driven contracts (CDC)**: Each consumer defines the interactions it needs from the producer. The producer runs all consumer contracts as part of its test suite and must not break any of them. Better for internal APIs: consumers have leverage, and the producer gets immediate feedback when a change would break a consumer.

CDC is the preferred approach for internal service-to-service APIs. The Pact framework is the de facto CDC tool: consumers write Pact tests that generate a pact file (the interaction definition); the pact file is published to a Pact Broker; the producer verifies against all published pacts.

**CDC as a social process**: consumer-driven contracts work best when producers and consumers are within reach of each other (same org, same Slack). The process is:
1. Consumer submits a new or changed contract (e.g., via PR to the producer's repo).
2. A discussion occurs — the producer may push back on the shape or suggest a better interaction.
3. Once agreed, the producer accepts the contract and implements to satisfy it.
4. Both sides now have a verified, agreed-upon interaction as an executable test.

This discussion is where much of the value lives — the contract formalises an agreement that was previously only in a Confluence doc or Slack thread.

**Pact vs Spring Cloud Contracts**: Pact enforces CDC: the consumer writes the test, which generates a language-agnostic JSON intermediate representation that is portable across all supported languages. Spring Cloud Contracts takes no stance on CDC vs producer contracts; contracts are written by hand (Groovy or YAML) rather than generated from tests. Spring Cloud Contracts integrates more naturally with the Spring/JVM ecosystem; Pact is the better choice for polyglot service estates.

**Contract storage options** (in order of recommendation):
1. **Pact Broker** (or PactFlow): centralised store with versioning, network visualisation, `can-i-deploy` safety checks, and webhook-triggered CI runs. The strongest solution.
2. **Centralised Git repository**: visible, but without tooling it becomes a dumping ground — producers can have contracts pushed to them that they never agreed to.
3. **Alongside the producer code**: simple to start; the producer controls which contracts it accepts; harder to discover from outside the repo.

## Component Testing

Component tests exercise multiple units together within a single service, without crossing service boundaries. They verify:
- Correct status codes for valid and invalid inputs
- Correct response body structure and content
- Authentication and authorization responses (403 vs 401 vs 200)
- Correct handling of empty datasets (200 with empty list vs 404)

Component tests use stubs or mocks for external dependencies (databases, downstream services). They are faster and more isolated than integration tests but more comprehensive than unit tests.

## Integration Testing

Integration tests verify behaviour across service boundaries. Two approaches:

**Stub servers**: pre-configured servers that return canned responses. Can be hand-rolled or generated from the OAS contract. Fast to run; may not match real service behaviour precisely.

**Real dependencies**: run actual dependency instances using containerization (e.g., Testcontainers in CI). Slower to start but provides higher confidence that the integration is correct. Preferred when the real behaviour of the dependency is difficult to simulate accurately.

For external third-party dependencies (outside your organisation's domain), it is acceptable to stub these in integration and end-to-end tests.

## End-to-End Testing

End-to-end tests exercise complete user journeys across multiple real services. Key principles:

- **Use realistic payloads**: tests that use small, artificial payloads miss failures caused by buffer limits or field validation on realistic data.
- **Define scope carefully**: acceptable to stub external third-party systems that are outside your control; include all services your organisation owns.
- **Test core user journeys only**: not edge cases or exhaustive error paths — those belong lower in the pyramid.
- **Performance E2E tests** require production-like environments; tools include Gatling, JMeter, Locust, K6.
- **Security should be on**: TLS and authentication must be active in E2E tests; turning them off makes the tests unrepresentative.

End-to-end tests are the most expensive to create and maintain but provide the only evidence that all services integrate correctly from the user's perspective.

## Testing in Production

Chapter 5 of [[sources/mastering-api-architecture]] extends the testing model into production via observability and progressive release strategies:
- **Canary releases**: route 1–5% of traffic to new version; monitor SLIs; expand or rollback.
- **Traffic mirroring / dark launch**: duplicate production traffic to new version; compare responses out-of-band.
- These are not replacements for pre-production testing — they are an additional safety net.

## Test Scope, Size, and Doubles (Distributed Systems Perspective)

Vitillo distinguishes two orthogonal dimensions that are often conflated (→ [[sources/understanding-distributed-systems]] ch. 29):

**Scope** (what the test validates):
- **Unit**: a single class or function; tests should use only public interfaces, verify state changes (not sequences of calls), and test behaviours given a specific input + state.
- **Narrow integration**: exercises only the code paths that communicate with one specific external dependency (an adapter and its supporting classes).
- **End-to-end**: validates behaviour spanning multiple live services — slow, brittle, but necessary for user-facing correctness.

**Size** (how much compute the test requires):
- **Small**: single process, no I/O. Fastest; near-zero intermittent failures.
- **Intermediate**: single node, local I/O (disk or localhost network). Moderate delay and non-determinism.
- **Large**: multiple nodes. Significant delay and flakiness risk.

Scope and size are correlated but not the same — an integration test against a local in-memory fake is narrow in scope but small in size. Always write the smallest possible test for the desired scope.

**Test double preference order** (highest to lowest fidelity):
1. **Real implementation** — if it's fast, deterministic, and has few dependencies, prefer it.
2. **Official fake** — a lightweight in-memory implementation maintained by the dependency team (e.g., an in-memory database).
3. **Stub** — always returns the same value; fast but brittle to behaviour changes.
4. **Mock** — has expectations on how it's called; use as a last resort because it tests interactions, not outcomes.

Stubs and mocks offer the weakest resemblance to real behaviour. Tests built on them can pass while the real integration is broken. Contract tests (described above) are the recommended way to add confidence when using mocks for integration tests.

**User journey tests**: frame end-to-end tests as multi-step user scenarios (e.g., create order → modify → cancel) rather than isolated API calls. Fewer tests cover more surface area; a single journey test is typically faster than the equivalent individual tests split apart.

## Formal Verification

Software tests can only cover failures developers can imagine. Formal specification languages allow properties to be verified algorithmically across all possible system states — including combinations of rare events that no human would test for.

**TLA+** is the most widely used formal specification language for distributed systems. Amazon uses it for S3 and DynamoDB; Microsoft uses it for Cosmos DB. A specification describes a system as a set of behaviours (sequences of states); the model checker exhaustively explores all reachable states and reports any violation with a full error trace. (→ [[sources/understanding-distributed-systems]] ch. 29)

Two property types:
- **Safety**: something is always true (an invariant across all states).
- **Liveness**: something eventually happens.

**Example — dual-write migration bug**: migrating from store X to store Y via a dual-write approach (write to both, read from X, then switch to Y) seems correct. TLA+ reveals two problems: (1) a crash between the two writes leaves stores inconsistent (liveness violation); (2) even with atomic dual-writes, concurrent writers can see writes in different orders, leaving stores in different states. The model checker returns the exact state sequence that produces each violation. Formal modeling catches this before a line of production code is written.

Formal specification is not an alternative to testing — it's most valuable for the parts of the system most likely to have subtle correctness bugs that traditional tests cannot reach: consensus protocols, distributed transactions, migration procedures.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/mastering-api-architecture]] | Comprehensive treatment of API-specific testing. Introduces the Pact framework and consumer-driven contracts as the primary investment for distributed systems. |
| [[sources/understanding-distributed-systems]] | Frames testing around scope × size orthogonality, test double fidelity hierarchy, and formal verification (TLA+) for distributed correctness. Introduces user journey tests as an E2E minimisation strategy. |
| [[sources/fundamentals-of-software-architecture]] | Mentions fitness functions (ArchUnit, Chaos Monkey) as a mechanism for automated architecture governance; doesn't address API contract testing specifically. |

## Testing Event-Driven Microservices (Bellemare)

Event-driven microservices are modular and relatively easy to test because their I/O is well-defined: input comes from event streams or request-response APIs; output is written to output event streams or external state stores (→ [[sources/building-event-driven-microservices]] ch. 15).

### Unit Testing Topology Functions

**Stateless functions** (filter, map, custom transformers): no persistent state required; test independently with boundary conditions (null, max values, edge cases). These are the easiest and most valuable unit tests to write.

**Stateful functions**: require a state store for the duration of the test — either a mock (fast, isolated) or a local implementation (higher fidelity, closer to integration testing). Mock when the store behaviour is simple and well-understood; use a real local store when the function depends on store-specific semantics (e.g., TTL, compaction).

**Topology testing**: frameworks provide topology-level test drivers that exercise the full processing pipeline without a live event broker. These allow injecting events with specific values, timestamps, or ordering (including out-of-order events) and asserting on output streams. Examples: Kafka Streams' `TopologyTestDriver`, Spark's `MemoryStream`, Apache Flink and Beam built-in topology test utilities.

**Schema evolution testing**: pull the current and previous schema versions from the schema registry and run compatibility checks as part of the CI pipeline. Some setups generate schemas from code at compile time and compare them against the registry version automatically.

### Integration Testing for EDM

**Local integration testing** — embed or containerize all dependencies:
- *Embedded (JVM-only)*: start broker, schema registry, and microservice topology instances within the same JVM test runtime; fully controllable programmatically. Allows inducing broker outages, out-of-order events, partition reassignments.
- *Containerized*: package all dependencies (broker, schema registry, state stores, frameworks) in a shareable container; application connects to them from outside. Polyglot-compatible; recommended for most teams.

**Event data strategies for integration tests**:

| Strategy | Accuracy | Cost | Risk |
|----------|----------|------|------|
| Production data | High | High (copy overhead, security risk) | Exposes sensitive events; may affect prod performance |
| Curated datasets | Controlled | Medium | Becomes stale; maintenance overhead; schema changes require updates |
| Schema-generated mock events | Low-to-medium | Low | Relationships between events must be carefully constructed; may not reflect production key distributions |

**Shared testing environment** (anti-pattern): single broker shared by all teams; leads to a "tragedy of the commons" — abandoned event streams accumulate, data quality degrades, simultaneous load tests interfere with each other. Avoid as the primary strategy; use disposable environments instead.

**Disposable environments**: programmatically create an isolated cluster per microservice test run; populate with event data; run tests; tear down. Requires significant tooling investment (multicluster provisioning, event copying) but provides full isolation and exercises disaster recovery tooling as a side effect.

**Production environment testing**: run a new microservice instance against production streams with its own consumer group and output event streams. Good for smoke testing; risky for load/performance testing; requires strict cleanup of testing artifacts.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/mastering-api-architecture]] | Contract testing (Pact), test pyramid, testing in production (canary, traffic mirror) |
| [[sources/understanding-distributed-systems]] | Scope × size orthogonality, test double fidelity hierarchy, formal verification (TLA+), user journey tests |
| [[sources/building-event-driven-microservices]] | EDM-specific: topology unit testing, stateful test strategies, local vs remote integration testing, event data sourcing strategies, shared-env anti-pattern |

## Related Concepts

- [[reference/technology-glossary]] — tool entries for Pact, Pact Broker, WireMock, Testcontainers, Gatling, K6
- [[concepts/api-design]] — the OAS contract that contract tests validate
- [[concepts/fitness-functions]] — fitness functions extend testing to architectural properties
- [[concepts/adrs]] — testing strategy decisions (whether to use E2E, contract testing) should be captured in ADRs
- [[streams/stream-processing]] — topology testing and schema evolution testing for stream processing applications

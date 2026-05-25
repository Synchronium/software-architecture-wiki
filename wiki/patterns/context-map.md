---
title: "Context Map and Bounded Context Integration Patterns"
type: pattern
tags: [ddd, bounded-contexts, integration, context-map, anticorruption-layer, open-host-service, partnership, shared-kernel]
sources: [domain-driven-design, learning-domain-driven-design]
created: 2026-05-14
updated: 2026-05-14
---

# Context Map and Bounded Context Integration Patterns

## Definition

Bounded contexts must integrate to form a working system. The manner of integration is driven by the relationship between the teams implementing those contexts. Domain-driven design defines six integration patterns, grouped by collaboration type, and the **context map** as the visualisation tool for plotting them.

(→ [[sources/learning-domain-driven-design]] ch. 4)

## Pattern Groups

### 1. Cooperation (well-established team communication)

**Partnership**
Teams integrate in an ad hoc, two-way manner. Either team can notify the other of API changes; both cooperate to resolve conflicts. No team dictates the contract. Requires: strong communication, frequent synchronisation, continuous integration. Not suitable for geographically distributed teams.

**Shared Kernel**
Two or more bounded contexts share a limited overlapping model. The shared model must be consistent across all contexts; any change to it must trigger integration tests for all affected contexts. Scope should be minimised to only the integration contracts and data structures that cross context boundaries.

*When to use*: when duplication cost > coordination cost. The more volatile the shared model, the higher the coordination cost — so shared kernels are most commonly applied to core subdomains, which change most often. Also used as a temporary step during gradual legacy decomposition.

*Trade-off*: violates the "one team per bounded context" principle. Justified as a pragmatic exception; scope discipline is essential.

### 2. Customer–Supplier (upstream–downstream, power imbalance)

**Conformist**
The downstream accepts the upstream's model without modification. Justified when: the upstream model is an industry standard, or it is good enough for the downstream's needs, and the downstream can trade some autonomy for simplicity.

**Anticorruption Layer (ACL)**
The downstream translates the upstream model into its own model via an ACL. The upstream has no interest in adapting to the downstream's needs (or can't). The ACL isolates the downstream from the upstream's concepts and protects its ubiquitous language.

*Use when*:
- The downstream contains a core subdomain (its model requires extra care)
- The upstream model is inefficient, messy, or legacy
- The upstream contract changes frequently and the downstream wants to be shielded

The ACL is the downstream's protection mechanism. See also the **Strangler Fig** pattern (→ [[concepts/evolutionary-architecture]]), which uses an ACL-like facade during migration.

**Open-Host Service**
The upstream decouples its internal implementation from a consumer-optimised public interface (the **published language**). Instead of each consumer building an ACL, the supplier does the translation once, for all consumers. The decoupling allows the upstream to evolve its implementation independently, and to simultaneously expose multiple published language versions during consumer migration.

*Relationship to ACL*: Open-Host Service is the supplier-side reversal of the consumer-side ACL. Both achieve the same goal (protecting models from each other); they differ in who does the translation.

### 3. Separate Ways (no collaboration)

Teams duplicate functionality rather than integrate. Justified when:
- Communication or political issues make collaboration impractical
- The duplicated subdomain is **generic** and easy to integrate locally (e.g., a logging framework — not worth exposing as a service)
- Model differences are so great that ACL cost exceeds duplication cost

**Never use for core subdomains** — duplication defeats the in-house, maximum-quality imperative for competitive functionality.

## Context Map

A context map is a visual diagram of the system's bounded contexts and the integration patterns between them. It reveals:

- **High-level design**: which contexts exist, what models they implement
- **Communication patterns**: which teams cooperate closely vs. which keep distance
- **Organisational signals**: if all consumers of an upstream implement ACLs, the upstream model has a problem; if "Separate Ways" clusters around one team, that team has a collaboration issue

**Maintenance**: introduce from the start of a project; update as contexts are added or modified. Best maintained as a shared artefact across teams. Can be managed as code using Context Mapper.

**Limitation**: one bounded context can have multiple integration patterns with another (e.g., partnership for some modules, ACL for others), making diagrams complex. Granularity is a judgement call.

## Model Translation: Implementation Patterns

The integration patterns above define *what* relationship exists between contexts. Model translation defines *how* that relationship is implemented in code. Two fundamental approaches (→ [[sources/learning-domain-driven-design]] ch. 9):

### Stateless Translation (Proxy)

The translation layer is a stateless proxy — it receives a request or event, translates it, and forwards the translated form. No state is accumulated between calls.

**Synchronous integration (OHS/ACL)**: implemented as an API gateway proxy or facade layer. Incoming requests from the upstream are translated into the downstream's model before passing to business logic. Outgoing requests to the upstream are translated from the downstream's model to the upstream's.

**Asynchronous integration**: implemented as a message proxy — a separate process subscribes to the upstream's events, translates each into the downstream's event schema, and publishes to a downstream-owned topic. This pattern also distinguishes between:
- **Private events**: domain events for internal use only, not published to upstream/downstream consumers. Contain internal implementation details.
- **Public events** (the published language): events explicitly designed for external consumers, defined in the Open-Host Service's published language. Schema-stable and consumer-friendly.

### Stateful Translation (Aggregation)

Some translations cannot be done event-by-event because the downstream model requires aggregating or joining data from multiple sources. Two approaches:

**Stream processing**: a stateful stream processing job (e.g., Kafka Streams, Flink) joins multiple upstream event streams and emits a translated, denormalised event stream. This is appropriate when the upstream publishes granular events and the downstream needs an entity view.

**Backend for Frontend (BFF)**: a dedicated aggregating service (the BFF) collects data from multiple upstream bounded contexts and serves a model tailored to a specific consumer's needs. The BFF owns the aggregation state and provides a single API surface for the consumer.

---

## Integration Pattern Decision Guide

| Situation | Recommended Pattern |
|-----------|---------------------|
| Same team or tightly collaborating teams | Partnership or Shared Kernel |
| Downstream can accept upstream's model | Conformist |
| Downstream needs to protect its core subdomain | Anticorruption Layer |
| Upstream wants to serve consumers well; has many consumers | Open-Host Service |
| Generic subdomain, duplication cheap | Separate Ways |
| Core subdomain | Never Separate Ways |

## Evans' Originating Integration Pattern Taxonomy

Evans (→ [[sources/domain-driven-design]] ch. 14) defines eight patterns covering the full range of inter-context relationships. These predate and underpin the six patterns in Khononov's treatment:

| Evans Pattern | Description |
|---------------|-------------|
| **Shared Kernel** | Explicit shared model subset; both teams must pass each other's tests before changing the shared code. Scope minimised to reduce coordination cost. |
| **Customer/Supplier Development Teams** | Formalised upstream–downstream; downstream plays customer in planning meetings; automated acceptance tests run in upstream's CI suite. |
| **Conformist** | Downstream slavishly adopts upstream model, no translation. Eliminates ACL cost. Underused — emotionally unappealing but genuinely appropriate when upstream model is adequate and the interface is large. Must be done wholeheartedly. |
| **Anticorruption Layer** | Downstream builds a FACADE+ADAPTER translation layer. FACADE belongs to the other system's context; ADAPTER speaks the ACL's language. Public interface is SERVICES. Can be bidirectional. Classic failure mode: hidden inside UI layer, invisible to architecture. |
| **Separate Ways** | No integration. Forecloses merging later. Only appropriate when integration cost genuinely exceeds value. |
| **Open Host Service** | Published protocol (not internal structure) for integrators. One-off translators for idiosyncratic consumers. Decouples internal evolution from external consumers. |
| **Published Language** | Well-documented, stable interchange language independent of either system's internal model. Analogous to a standard format (XML schema, industry standard). Unlocks ecosystem tooling (example: Chemical Markup Language enabling JUMBO Browser). |

Evans also distinguishes **CONTINUOUS INTEGRATION** as the within-context practice that keeps a BOUNDED CONTEXT from splintering — not an inter-context pattern but the companion discipline to all patterns above.

**Transformation paths** Evans describes concrete step-by-step recipes for changing context structure:
- Separate Ways → Shared Kernel: establish the process (weekly integration, test suite) before any shared code
- Shared Kernel → Continuous Integration: circulate team members; merge core domain quickly once started
- Phasing out a legacy: iterate unit-by-unit; ACL shrinks as legacy usage decreases
- Open Host Service → Published Language: if no industry standard exists, use the CORE DOMAIN as the basis

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/domain-driven-design]] | Originating treatment (ch. 14): eight integration patterns (incl. Conformist, Separate Ways, Published Language) as a vocabulary for the Context Map; concrete transformation recipes for changing context structure |
| [[sources/learning-domain-driven-design]] | Six integration patterns with team collaboration framing; context map as both visualisation and organisational diagnostic tool; stateless vs stateful translation implementation detail (ch. 4, ch. 9) |

## Related Concepts

- [[patterns/anti-corruption-layer]] — dedicated page for the ACL pattern: structure, when to use, vs Conformist, vs Open-Host Service, migration use
- [[concepts/bounded-contexts]] — integration patterns describe how bounded contexts relate to each other
- [[concepts/ubiquitous-language]] — different bounded contexts have different languages; integration patterns manage the boundary
- [[concepts/evolutionary-architecture]] — Strangler Fig pattern uses ACL-like facade for migration
- [[concepts/contracts]] — the integration contract is what the integration patterns negotiate
- [[concepts/api-design]] — Open-Host Service's published language is implemented as an API contract

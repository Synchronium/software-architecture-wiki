---
title: "Code Reuse Patterns"
type: concept
tags: [architecture, coupling, reuse, microservices, distributed-systems]
sources: [software-architecture-the-hard-parts]
created: 2026-05-14
updated: 2026-05-14
---

# Code Reuse Patterns

## Definition

Code reuse in distributed architectures is the practice of sharing functionality or data across multiple services. Unlike monolithic architectures — where all code shares the same process space — distributed architectures must choose an explicit mechanism for sharing, each with different coupling and operational trade-offs.

## The Core Reuse Tension

The fundamental reuse principle (→ [[sources/software-architecture-the-hard-parts]] ch. 8):

> **Reuse = abstraction + slow rate of change**

Sharing code that changes frequently is an anti-pattern: every change to shared code requires all consumers to update simultaneously, creating a tight release coupling. The higher the rate of change in shared code, the weaker the argument for sharing it. Code that is stable and well-abstracted is safe to share; volatile code should not be.

## The Four Reuse Techniques

### 1. Code Replication

Copy the code into each service that needs it.

**When appropriate**: small, stable utility code (date parsing, string formatting) where the code is unlikely to change and the cost of divergence is low.

**Problems**: divergence over time; bug fixes must be applied to all copies; difficult to audit which services have the latest version. Not appropriate for code that contains business logic or that changes with any regularity.

### 2. Shared Library

Extract shared code into a versioned library (JAR, npm package, NuGet package) that services declare as a dependency.

**Key principle**: **fine-grained libraries are preferred over coarse-grained ones**. A single monolithic "utility" library forces all services to take a dependency on everything, creating unnecessary coupling. Instead, decompose into fine-grained libraries by functional area (e.g., separate libraries for authentication helpers, domain validation, data formatting).

**Versioning requirements**:
- Every shared library must have a versioning strategy.
- **Never use LATEST** (or equivalent floating version pins) in a distributed architecture — it means a library upgrade is automatically deployed to all consumers simultaneously, bypassing each service's deployment pipeline. Any regression or breaking change becomes an incident before anyone can test it.
- Maintain explicit version pinning per service; each service upgrades on its own timeline.

**Deprecation strategy**: shared libraries require a **custom deprecation policy** separate from the typical "support the last two versions" convention:
- *Custom deprecation for general-purpose libraries*: teams choose when to upgrade; library maintainers provide migration guidance and maintain older versions for a negotiated period.
- *Global deprecation for framework or platform libraries*: all services must upgrade together (e.g., a security framework that has a CVE); requires coordination across teams.

**Operational risk**: a change to a shared library that all services depend on is a high-blast-radius change. A bug introduced into a widely-used shared library can break many services simultaneously.

**Best for**: stable, non-volatile domain code that multiple services share. Requires strong version discipline.

### 3. Shared Service

Extract shared functionality into a separate, independently deployed service that other services call at runtime.

**When appropriate**:
- Polyglot environments where a shared library cannot be adopted by all service languages.
- High-volatility code where frequent changes would create constant library upgrade churn across consumers.

**Trade-offs vs shared library**:

| Dimension | Shared Library | Shared Service |
|-----------|---------------|----------------|
| Change isolation | No — changes reach consumers at upgrade time | Yes — change is deployed to service without requiring consumer changes |
| Runtime fault tolerance | Good — library failure = service failure (in-process) | Poor — service outage makes shared functionality unavailable for all consumers |
| Scalability | Per-consumer (in-process) | Shared bottleneck — all consumers compete for the service's capacity |
| Performance | In-process (no network hop) | Network latency per call |
| Dependency management | Build-time versioning | Runtime coupling; all consumers always see the latest version |

A shared service introduces a runtime dependency: if the shared service is unavailable, all consumers are affected. This is the primary downside relative to a shared library.

### 4. Sidecar / Service Mesh

Deploy shared **operational concerns** (logging, monitoring, circuit-breaking, authentication) as a separate process co-located with each service rather than as a shared library.

**Key constraint**: sidecars should only handle **operational concerns** — they must not contain domain logic or business rules. This follows from the **hexagonal architecture** origin: operational concerns are orthogonal to business logic. Mixing them violates the separation of concerns that the sidecar pattern is designed to enforce.

**Orthogonal coupling**: operational concerns are orthogonal to the business domain — they are not part of the service's bounded context, but every service needs them. The sidecar addresses this by implementing these concerns as infrastructure rather than code, making them invisible to the service process. This is the key distinction from a shared library: a shared library becomes part of each service's dependency graph; a sidecar remains external.

For full treatment see [[patterns/sidecar-service-mesh]].

## Choosing the Right Technique

| Scenario | Recommended Technique |
|----------|-----------------------|
| Small, stable utility code | Code replication |
| Stable domain logic, single language | Shared library (fine-grained, versioned) |
| Volatile domain logic | Shared service |
| High-volume shared domain logic, polyglot | Shared service |
| Operational concerns (logging, auth, monitoring) | Sidecar / Service mesh |

The decision tree: start with replication if the code is small and stable. Move to a shared library as soon as the code needs to evolve or is used by many services. Move to a shared service when versioning discipline breaks down or when the code is so volatile that library upgrade churn becomes a problem. Use sidecars for operational concerns only.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/software-architecture-the-hard-parts]] | Primary source; introduces the four-technique taxonomy and the core reuse principle (reuse = abstraction + slow rate of change); versioning discipline and deprecation strategies for shared libraries |
| [[sources/mastering-api-architecture]] | Covers shared libraries and sidecars in the context of API consistency and service mesh adoption; aligns with SATH's view that sidecars should handle operational concerns only |
| [[sources/understanding-distributed-systems]] | Covers the sidecar pattern from an infrastructure perspective; see [[patterns/sidecar-service-mesh]] |

## Related Concepts

- [[patterns/sidecar-service-mesh]] — the operational-concerns reuse mechanism; full trade-off analysis
- [[concepts/service-granularity]] — reuse decisions interact with granularity decisions; shared code is a granularity integrator
- [[concepts/modularity]] — shared libraries create coupling; shared code must be measured and governed
- [[concepts/fitness-functions]] — shared library versioning and deprecation compliance can be automated as fitness functions
- [[concepts/architectural-decomposition]] — shared code decisions arise during decomposition; shared library coupling can impede decomposition feasibility

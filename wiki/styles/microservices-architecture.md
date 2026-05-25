---
title: "Microservices Architecture"
type: style
tags: [architecture, distributed, microservices, domain-partitioning, bounded-context, devops]
sources: [fundamentals-of-software-architecture, understanding-distributed-systems, software-architecture-patterns, learning-domain-driven-design, monolith-to-microservices, foundations-of-scalable-systems]
created: 2026-05-13
updated: 2026-05-15
---

# Microservices Architecture

## Definition

Microservices architecture decomposes a system into many fine-grained, independently deployable services, each owning a single [[concepts/bounded-contexts|bounded context]] of the domain and its own data store. Services communicate over lightweight protocols (HTTP/REST, gRPC, or messaging). The style prioritises extreme decoupling, independent deployability, and evolutionary change over operational simplicity and raw performance.

## History

Microservices is unusual: it was named *early*, in a March 2014 blog post by Martin Fowler and James Lewis, who recognised common characteristics forming in a new style and gave it a name before it became dominant. Most architecture styles are named retrospectively. The Fowler/Lewis post helped define the style and spread it widely.

## Core Philosophy

**[[concepts/bounded-contexts|Bounded context]]** (from DDD): each service should model a single, well-defined domain concept, including all the data and behaviour required to implement that concept end-to-end. Services should not share domain models or data stores. When two services need the same data, they each keep their own copy (with the associated synchronisation complexity).

**Extreme granularity as a goal**: the purpose of fine-grained services is maximum decoupling — so each service can change, deploy, scale, and fail independently of all others. The tradeoff is operational complexity and network overhead.

**DevOps prerequisite**: microservices are only viable with mature automation — containerisation (Docker), orchestration (Kubernetes), CI/CD pipelines, service discovery, distributed tracing, centralised logging. Without this foundation, the operational burden overwhelms the benefits.

## Topologies

Three common topologies (→ [[sources/software-architecture-patterns]] ch. 4):

| Topology | Description | Typical use |
|----------|-------------|-------------|
| **API REST-based** | Fine-grained services exposed via an API layer; clients call single-purpose endpoints | Cloud-style public APIs (Yahoo, Google, Amazon-era web services) |
| **Application REST-based** | Coarser-grained service components behind a separately deployed UI layer via REST | Small to medium business applications |
| **Centralised messaging** | Same as application REST-based but uses a lightweight message broker as transport instead of REST | Larger apps needing async messaging, advanced queuing, monitoring |

**Centralised messaging ≠ SOA**: the broker in this topology does *no orchestration, transformation, or complex routing* — it is purely a transport mechanism. SPOF concerns addressed via broker clustering and federation. Compare to SOA's ESB, which embeds business logic.

## Physical Topology

```
[UI] → [API Layer / Gateway] (proxy only — no orchestration)
                │
    ┌──────┬───┼──────┬──────┐
    ▼      ▼   ▼      ▼      ▼
 [SvcA] [SvcB] [SvcC] [SvcD] [SvcE]
    │      │   │      │      │
   [DB]  [DB] [DB]  [DB]  [DB]  (one data store per service)
```

**API layer**: a thin proxy gateway that routes requests to services. The API layer in microservices is explicitly *not* an orchestrator — no business logic lives there (contrast with SOA's ESB). Operational concerns (auth, rate limiting, monitoring) may be applied here. Commonly used to host service discovery, allowing user interfaces and calling systems to find and create services elastically.

**Sidecar pattern**: operational concerns (logging, tracing, mTLS, circuit breaking) are moved out of service code into a co-deployed sidecar proxy. Multiple sidecars connect to form a **service plane**, which forms the **service mesh** — a consistent operational interface across all microservices. See [[patterns/sidecar-service-mesh]].

**Frontends:** two patterns. *Monolithic frontend*: a single UI (desktop, mobile, or web framework) calls through the API layer. *Microfrontends*: each service emits its own UI component, which the frontend coordinates. Microfrontends extend bounded context all the way to the user interface, enabling a single team to own the domain end-to-end. The microfrontend pattern can be implemented with component-based frameworks (React) or dedicated open-source frameworks.

**Communication model — protocol-aware heterogeneous interoperability:** *Protocol-aware* — no centralised hub means each service must know (or discover) which protocol to use to call others; architects standardise on specific protocols (REST, gRPC, messaging). *Heterogeneous* — services may be written in different technology stacks; polyglot environments are fully supported. *Interoperability* — services call each other over the network to collaborate and exchange information.

**Enforced heterogeneity (notable approach):** one early microservices architect at a personal-information-manager startup mandated that each team use a *different* technology stack. If one team used Java and another .NET, accidental class sharing across boundaries was physically impossible. This was the polar opposite of enterprise governance's "standardise on one stack" instinct — and intentionally so.

## Granularity Guidelines

Service size is determined by domain need, not lines of code. Three granularity disintegrators (reasons to split):
1. **Purpose**: the service has more than one distinct domain responsibility.
2. **Transaction**: a single logical transaction spans multiple unrelated concerns.
3. **Choreography**: the service orchestrates other services (use choreography instead, or extract a mediator).

And integrators (reasons to merge):
1. **Database joins**: frequently joined data should live in one service.
2. **Performance**: chatty inter-service calls that add latency.
3. **Shared code exceeds 20% of codebase**: shared domain logic suggests the two services are actually one.

## Communication Patterns

**Domain/architecture isomorphism:** because microservices favours decoupling, the shape of the style resembles the broker EDA — making choreography and microservices naturally symbiotic patterns. A microservices architecture using choreography is following the structural logic of both styles simultaneously.

**Choreography** (preferred for decoupling): services react to events published by other services. No central orchestrator. Maximum decoupling; complex error handling.

**Orchestration** (mediator): a dedicated mediator service coordinates a workflow across other services. Centralises complexity; creates coupling to the mediator. Appropriate for complex, inherently coupled business workflows.

**Front controller anti-pattern:** in a complex choreographed workflow, the first service called begins accumulating coordination responsibility — it acts as a mediator while also having its own domain responsibilities. This is the front controller anti-pattern — a signal that the coordination concern should be extracted into an explicit mediator service.

**Note on orchestration vs performance:** microservices often prefer choreography over orchestration for a performance reason — less coupling means fewer bottlenecks and faster communication paths.

## Transactions

Microservices should not share databases or participate in distributed transactions. If a transaction is needed across services, the right solution is to **fix the service granularity** — the transaction boundary indicates the services should be one.

When cross-service transactions are truly necessary (different characteristics require separate services), use the [[patterns/saga]] pattern — with the explicit understanding that this adds significant complexity and should be used sparingly.

> "Don't do transactions in microservices — fix granularity instead!" (→ [[sources/fundamentals-of-software-architecture]], Ch 17)
> "A few transactions across services is sometimes necessary; if it's the dominant feature of the architecture, mistakes were made." (→ [[sources/fundamentals-of-software-architecture]], Ch 17)

## Architecture Characteristics Ratings

| Characteristic | Rating | Notes |
|----------------|--------|-------|
| Deployability | ★★★★★ | Each service deploys independently; fastest path from code to production |
| Elasticity | ★★★★★ | Fine-grained services can scale independently to the function level |
| Evolutionary | ★★★★★ | Extreme decoupling enables architectural change without system-wide risk |
| Fault tolerance | ★★★★☆ | Independent services contain failures (inter-service calls still carry risk) |
| Modularity | ★★★★★ | Maximum: one bounded context per service |
| Overall cost | ★★☆☆☆ | Very expensive — many services, complex infrastructure |
| Performance | ★★☆☆☆ | Network calls for every interaction; security checks per endpoint |
| Reliability | ★★★★☆ | High with proper service mesh and retry/circuit-breaker patterns |
| Scalability | ★★★★★ | Per-service scaling; some of the most scalable systems use this style |
| Simplicity | ★☆☆☆☆ | Most complex style to operate |
| Testability | ★★★★★ | Small, independent services with clear boundaries are the most testable |

## Trade-offs

**Strengths:**
- Maximum agility: each service can change, redeploy, and evolve independently.
- Operational isolation: failure in one service does not cascade.
- Enables large engineering organisations (many independent teams, each owning a service).
- The highest quanta count of any style — maximally aligned with the architecture quantum model.

**Weaknesses:**
- Performance: every operation involves network calls; latency compounds across service chains.
- Cost: large number of services requires significant infrastructure investment.
- Operational complexity: distributed tracing, service discovery, secret management, health checking.
- Data management: duplicate data across services + eventual consistency instead of ACID transactions.
- Stamp coupling risk: services may pass more data than necessary, wasting bandwidth.

## The "Micro" Misconception

> "The term 'microservice' is a label, not a description." — Martin Fowler (→ [[sources/fundamentals-of-software-architecture]], Ch 17)

The name was coined to contrast with SOA's "gigantic services" — not to prescribe small size. Many developers take "microservices" as a commandment and create services too fine-grained to do useful work independently, forcing them to build communication links back between services to compensate.

Size is not the goal. A service that doesn't encapsulate significant functionality only adds operational overhead without delivering the decoupling benefit. The right guideline: **small API surface area, significant encapsulated functionality**. The surface area determines coupling; the functionality determines whether the service is worth operating independently. (→ [[sources/understanding-distributed-systems]] ch. 21)

## Distributed Monolith Antipattern

A distributed monolith is the worst of both worlds: a set of separately deployed services that are so tightly coupled that they cannot be changed or deployed independently. All the complexity of distribution is added, while none of the decoupling benefit is realised.

Common causes of tight coupling that produce a distributed monolith:
- **Fragile APIs**: internal contracts that break with every change, forcing clients to update in lockstep.
- **Shared libraries**: cross-cutting business logic in libraries that must be updated in sync across services.
- **Static IP addressing**: services referencing each other by IP rather than via a service registry.
- **Shared databases**: multiple services reading from and writing to the same database tables.

Detection: if deploying one service requires coordinating changes across multiple other services, the services are a distributed monolith. (→ [[sources/understanding-distributed-systems]] ch. 21)

## Stamp Coupling

Stamp coupling occurs when a service sends more data in an API response than the consumer needs. In microservices, this consumes bandwidth at scale and creates implicit coupling (consumers depend on the full message schema, even fields they don't use). Solutions: field selectors, GraphQL, multiple fine-grained endpoints, or message schemas with only the required fields.

## Quanta

Maximum quanta — potentially one per service. This is the primary characteristic differentiating microservices from service-based architecture.

## Partitioning

Domain (bounded context per service). The most strictly domain-partitioned style.

## Cascading Failures and Scalability Resilience

The distributed nature of microservices introduces failure modes absent in monoliths. Under load, slow downstream responses are more dangerous than hard failures: a slow service returns results, but with increasing latency — every thread waiting for it is blocked. With fixed thread pools, sustained downstream slowness exhausts the caller's pool and cascades up the chain. (→ [[sources/foundations-of-scalable-systems]] ch. 9)

**Why immediate retries worsen the problem:** Retrying on failure maintains request pressure on an already-overloaded service. Use exponential backoff, or — once the downstream is reliably failing — a circuit breaker.

**Fail fast strategies** for controlling long-tail response times:
- *TCP read timeout at P99*: configure the network timeout at the service's P99 response time; release the thread immediately on timeout rather than blocking indefinitely.
- *Request throttling*: load balancer or API gateway returns HTTP 503 when capacity is exceeded, protecting the backend from overload.
- *Graceful degradation*: return a cached or default response when the downstream is unavailable — masking transient failures from end users (e.g., "shows you might like" instead of personalised recommendations).

**Response time percentiles:** Averages are misleading for long-tail workloads. A service with P50=200ms and P99=3,000ms has 1% of requests taking 15× the median. Use P50/P95/P99 for capacity planning and timeout sizing. BBC data: 10% fewer users per additional second of load time.

**Data duplication trade-off:** Where inter-service calls would create excessive latency or coupling, microservices sometimes duplicate data locally. This reduces distributed communication overhead but requires application-level consistency management. As systems scale, the cost of data duplication is typically smaller than the cost of a major refactoring.

## When Microservices Are the Wrong Choice

Newman identifies four conditions where microservices should not be adopted (→ [[sources/monolith-to-microservices]] ch. 2):

1. **Unclear domain**: wrong service boundaries are expensive to fix; the SnapCI team merged back to a monolith and re-decomposed a year later with much better results
2. **Startups**: microservices solve scale-up problems, not startup problems; Netflix and Airbnb moved to microservices *after* finding product/market fit
3. **Customer-installed software**: operational complexity cannot be pushed onto customers who may not have Kubernetes skills or platforms
4. **No clear reason**: "microservices because Netflix does" is not a reason

> **Open question:** At what organisational scale does the modular monolith stop being sufficient? Newman suggests the answer is context-dependent and most teams jump to microservices too early.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Detailed treatment of bounded context, granularity guidelines, choreography vs orchestration, saga usage, and ratings; positions as the highest agility/scalability style with the highest cost and complexity |
| [[sources/understanding-distributed-systems]] | Treats the underlying distributed systems challenges — replication, consistency, idempotency, saga, outbox — that microservices must solve; does not treat microservices as an architecture style per se |
| [[sources/software-architecture-patterns]] | Earlier (2015) Richards treatment — names three deployment topologies (API REST, Application REST, Centralised Messaging); establishes the granularity warning and DRY-tradeoff guidance; recommends shared database for inter-service data (superseded by FOSA's distributed-monolith anti-pattern analysis) |
| [[sources/learning-domain-driven-design]] | DDD-centric treatment. Core claim: "microservice" = a service with a micro-*public interface*, not a micro-codebase. Effective microservices are **deep modules** (Ousterhout): simple public interface over complex internal logic — wide top, deep body. Granularity sweet spot: bounded context = widest valid boundary (largest valid monolith protecting UL consistency); microservice threshold = narrowest valid boundary (below this, integration interfaces grow back up → distributed big ball of mud). **Asymmetric relationship**: all microservices are bounded contexts; not all bounded contexts are microservices. **Subdomain as safe granularity heuristic**: subdomains are naturally deep (function = "what"; logic = coherent use cases), making them the recommended service boundary. Aggregates are the *narrowest* valid boundary — use only when coupling to other aggregates in the subdomain is minimal. OHS compresses public interfaces by replacing implementation models with published languages; ACL-as-standalone-service offloads integration complexity from consuming services (ch. 14) |
| [[sources/monolith-to-microservices]] | Migration-focused treatment. Defines microservice as "an independently deployable service modelled around a business domain." Three load-bearing words: independently deployable (the operational property), service (the unit), business domain (the boundary criterion). **Independent deployability is the #1 principle** — no shared databases, outside-in interface design, and loose coupling all follow from it. Newman acknowledges monolith advantages (simpler deployment, developer workflow, code reuse) and argues microservices are appropriate only when those advantages are outweighed. Introduces a four-type coupling taxonomy (implementation, temporal, deployment, domain) and maps it to Parnas' information hiding as the key design technique. |
| [[sources/foundations-of-scalable-systems]] | Scalability framing. Core motivation: monolith can only scale the whole application — microservices enable per-service independent scale-out. Cascading failures under load as the key operational challenge: slow downstream responses fill thread pools silently, back-pressuring up the call chain. Fail fast via P99 TCP timeout + HTTP 503 throttling + graceful degradation with default responses. Long-tail percentiles (P50/P95/P99) as the right metric. Data duplication as an accepted scalability trade-off vs. cross-service round trips. API gateway as the facade pattern for microservices deployments. (ch. 9) |

## Related Pages

- [[patterns/sidecar-service-mesh]] — operational reuse pattern used in microservices
- [[patterns/saga]] — the distributed transaction pattern for cross-service operations
- [[patterns/outbox-pattern]] — reliable event publishing for microservices
- [[patterns/circuit-breaker]] — resiliency pattern for inter-service calls
- [[styles/event-driven-architecture]] — broker topology / choreography used for inter-service communication
- [[distributed/idempotency]] — required for at-least-once messaging in choreographed microservices
- [[styles/service-based-architecture]] — the pragmatic alternative with fewer quanta and shared databases
- [[styles/modular-monolith]] — often the right intermediate step before microservices (Newman's preference for startups)
- [[concepts/modularity]] — Newman's information hiding and four coupling types
- [[comparisons/architecture-styles-comparison]] — side-by-side ratings
- [[comparisons/decomposition-strategy]] — how far to decompose; five decision factors; recommended migration path
- [[styles/architecture-styles]] — overview and decision guide for all architecture styles

---
title: "Service Granularity"
type: concept
tags: [granularity, microservices, distributed-systems, service-design, coupling, decomposition]
sources: [software-architecture-the-hard-parts]
created: 2026-05-14
updated: 2026-05-14
---

# Service Granularity

## Definition

**Granularity** is the size of separately deployed services — what each service *does* and how much it does. It is distinct from [[concepts/architectural-decomposition|modularity]] (whether systems are broken into separate parts at all).

> "Most issues and challenges within distributed systems are typically not related to modularity, but rather granularity." (→ [[sources/software-architecture-the-hard-parts]] ch. 7)

Getting granularity wrong in either direction causes problems:
- Too coarse: large services are harder to test, deploy, and scale independently
- Too fine: services must communicate with each other to complete a single business transaction, creating latency, fault tolerance chains, and data consistency problems

## Why It Matters

Granularity decisions are among the hardest in distributed architecture because they are highly context-dependent and drive significant downstream consequences (deployment, scaling, transaction management, security). The subjective nature of "single responsibility" means granularity debates within development teams tend toward opinion rather than analysis.

The solution is to reason from objective *disintegrators* (reasons to split) and *integrators* (reasons to keep together) and to translate the resulting trade-offs into explicit business questions.

## Measuring Granularity

Two approximate metrics:
- **Statement count**: total source statements in a service; more objective than lines of code or class count because coding styles vary
- **Public operation count**: number of distinct public entry points the service exposes

Neither is perfect. Granularity is ultimately about what a service does, not how much code it contains.

## Granularity Disintegrators

Six drivers for breaking a service into smaller pieces (→ [[sources/software-architecture-the-hard-parts]] ch. 7):

### 1. Service Scope and Function
A service with weak cohesion — doing multiple unrelated things — is a candidate for splitting. A Notification Service that handles SMS, email, and postal letters has strong cohesion (all three relate to one thing: notifying a customer) and this driver alone does not justify splitting. A Customer Service that handles profile, preferences, and public comments has weaker cohesion (broader scope: "customer") and is a better splitting candidate.

The **naming test**: if you can't give a self-descriptive name to the "leftover" service after splitting, the remaining functions don't belong together and the split is probably wrong.

### 2. Code Volatility
Parts of a service that change at very different frequencies are candidates for isolation. Measuring change frequency from source control history provides an objective justification.

Example: a Notification Service where postal letter handling changes weekly but SMS and email change every six months. As a single service, the weekly postal-letter deployment forces redeployment and retesting of the stable SMS and email functionality. Splitting isolates the volatile part.

This is also called **volatility-based decomposition**.

### 3. Scalability and Throughput
Parts of a service with dramatically different throughput demands should scale independently.

Example: SMS notifications at 220,000/minute vs postal letters at 1/minute. As a single service, postal letter processing must scale unnecessarily with the SMS load, increasing cost and MTTS.

### 4. Fault Tolerance
If one part of a service is prone to fatal errors (e.g., out-of-memory conditions), isolating it prevents it from bringing down unrelated stable functionality.

**Caveat**: if the resulting separate services still call each other synchronously, fault tolerance is not improved. The functions must be genuinely independent for this driver to have value.

### 5. Security
Parts of a service with different security requirements (e.g., PCI data vs general profile data) can be isolated so that access control is enforced at the service boundary rather than only within the API request.

### 6. Extensibility
If the service context will continually expand with new variants (e.g., a Payment Service adding new payment methods over time), separating variants into individual services means new variants can be deployed and tested in isolation without redeploying existing ones.

**Guidance**: apply this driver only when continued expansion is expected or confirmed. Wait for a pattern to emerge before using extensibility as the primary split justification.

## Granularity Integrators

Four drivers for keeping services together (or consolidating fine-grained services) (→ [[sources/software-architecture-the-hard-parts]] ch. 7):

### 1. Database Transactions
If an operation requires a single ACID transaction across multiple functions, those functions should live in the same service. Splitting them requires distributed transactions (sagas), which are significantly more complex and cannot guarantee the same data integrity guarantees.

This is often the most decisive integrator: if "the business requires all-or-nothing," consolidate.

See [[distributed/distributed-transactions]] and [[patterns/saga]].

### 2. Workflow and Choreography
As services become finer-grained, they must communicate more with each other to complete a business transaction. This creates three problems:

- **Fault tolerance**: a chain of synchronous service calls means if any service in the chain fails, all callers fail. Breaking up a service for fault tolerance reasons achieves nothing if the resulting services are synchronously dependent.
- **Performance**: each inter-service hop adds network and security latency. Five hops × 300ms latency = 1,500ms added to a single business request.
- **Reliability/data integrity**: if services A, B, C have already committed their data but service D fails, data is inconsistent and requires compensating transactions.

**Rule of thumb**: if >70% of requests require multi-service workflows to complete, consider consolidation. If the remaining 30% of workflow-dependent requests include time-critical operations, consolidate regardless.

### 3. Shared Code
Frequently-changing shared domain functionality (not infrastructure utilities) across a set of services is an integrator. Each change to the shared library requires a coordinated upgrade of all dependent services.

Conditions where shared code argues for consolidation:
- Shared domain code constitutes a high percentage (e.g., >40%) of the collective codebase
- The shared code changes frequently
- Bugs in the shared code require simultaneous updates to all services (cannot be versioned around)

Note: infrastructure shared code (logging, authentication, monitoring) is NOT an integrator — all services use it, and it doesn't drive consolidation.

### 4. Data Relationships
If the data tables owned by different services have tight bounded-context dependencies (services must call each other on every operation to read data they don't own), the inter-service communication cost argues for consolidation.

This is the integrator with the fewest trade-offs — table relationships are a concrete structural constraint, not a preference.

See [[concepts/data-decomposition]].

## Finding the Right Balance

| Disintegrators | Reason |
|----------------|--------|
| Service scope (weak cohesion) | Single-purpose services |
| Code volatility | Reduce testing scope + deployment risk |
| Scalability/throughput | Lower cost; independent scaling |
| Fault tolerance | Better uptime for unrelated functionality |
| Security access | Enforce access control at service boundary |
| Extensibility | Agility for adding new variants |

| Integrators | Reason |
|-------------|--------|
| Database transactions | Data integrity and consistency |
| Workflow/choreography | Fault tolerance, performance, reliability |
| Shared code | Maintainability; avoid coordinated deploys |
| Data relationships | Data integrity; avoid circular inter-service calls |

The architect's method: identify which drivers apply, translate the trade-off into a business question, and present it to the product owner or sponsor for resolution. Architecture decisions without business input are opinions; decisions with explicit business input are accountable choices.

**Example trade-off statement**: "We want to break apart the service to isolate frequent code changes (better time-to-market), but in doing so we lose ACID transaction guarantees (data integrity risk). Which matters more given our business requirements?"

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/software-architecture-the-hard-parts]] | Primary source; introduces the disintegrator/integrator framework; the key insight that granularity (not modularity) is the source of most distributed architecture problems |
| [[sources/fundamentals-of-software-architecture]] | Covers microservices service granularity at a high level; does not provide the disintegrator/integrator taxonomy |
| [[sources/understanding-distributed-systems]] | Covers service communication patterns and distributed transaction complexity implicitly; granularity is treated as a consequence of other decisions |

## Related Concepts

- [[concepts/architectural-decomposition]] — the prerequisite: breaking the monolith; granularity addresses how fine-grained the resulting services should be
- [[concepts/data-decomposition]] — data granularity mirrors service granularity; they must be decided together
- [[concepts/architecture-quantum]] — granularity and quantum boundaries are related; a shared database always collapses multiple services into one quantum regardless of service size
- [[concepts/modularity]] — the theoretical foundation; cohesion and coupling metrics apply to service granularity analysis
- [[patterns/saga]] — the distributed transaction mechanism required when granularity splits operations that need to be coordinated
- [[distributed/distributed-transactions]] — ACID vs BASE; the transaction trade-off that most constrains granularity decisions
- [[styles/microservices-architecture]] — the architecture style most sensitive to granularity decisions
- [[styles/service-based-architecture]] — the coarser-grained alternative; avoids most granularity problems

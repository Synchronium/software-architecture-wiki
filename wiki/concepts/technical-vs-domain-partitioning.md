---
title: "Technical vs Domain Partitioning"
type: concept
tags: [architecture, components, partitioning, domain-driven-design]
sources: [fundamentals-of-software-architecture]
created: 2026-05-13
updated: 2026-05-13
---

# Technical vs Domain Partitioning

## Definition

Partitioning refers to how the top-level components of a system are organised. The two primary strategies are:

- **Technical partitioning**: components are grouped by technical role — presentation, business logic, persistence. Each layer cuts across all business domains.
- **Domain partitioning**: components are grouped by business capability or bounded context — each component owns its complete slice of behaviour (UI + logic + data) for a single domain.

## Technical Partitioning

Classic example: the n-tier layered architecture.

```
Presentation Layer    → all UI code
Business Layer        → all business logic
Persistence Layer     → all database access
```

**Advantages:**
- Familiar to most developers; easy to onboard.
- Technically homogeneous layers are easy to reason about independently.
- Conway's Law produces technically specialised teams (front-end, back-end, DBA) which mirrors this structure.

**Disadvantages:**
- A single business feature change touches all layers simultaneously.
- Each business domain's logic is scattered across layers → low functional cohesion at the domain level.
- Creates implicit coupling: the persistence layer becomes a shared dependency for every domain.
- Agility and deployability suffer because changes are cross-cutting by nature.
- The Entity Trap: architects create components mapped to database entities (Customer component, Order component) rather than domain workflows, producing an anemic domain model.

## Domain Partitioning

Organises around business capabilities, often aligned with DDD bounded contexts.

```
CatalogDomain         → all code (UI + logic + data) for product catalogue
OrderDomain           → all code for order placement and fulfilment
PaymentDomain         → all code for payment processing
NotificationDomain    → all code for notifications
```

**Advantages:**
- Each domain component can change independently with minimal coupling to other domains.
- High functional cohesion: all code for a business workflow lives together.
- Maps to Conway's Law with cross-functional teams (each team owns a domain end-to-end).
- Natural unit for service extraction: each domain component can become a service in a distributed architecture without restructuring.
- Supports evolutionary architecture — domains can be independently deployed, scaled, or migrated.

**Disadvantages:**
- Technical duplication is possible (each domain may have similar patterns for data access, logging, etc. — addressed via sidecars, shared libraries, or service mesh).
- Can be unfamiliar to teams accustomed to technical partitioning.

## Which to Choose

Richards & Ford strongly favour domain partitioning for top-level component design in most modern systems. Technical partitioning is acceptable for:
- Very small, simple applications where a domain split would add overhead without benefit.
- Applications where technical concerns genuinely dominate (low-level infrastructure, data processing pipelines).

> "Domain partitioning is almost always preferable for top-level component design." (→ [[sources/fundamentals-of-software-architecture]], Ch 8)

## Relationship to Architecture Styles

| Style | Partitioning |
|-------|-------------|
| [[styles/layered-architecture]] | Technical |
| [[styles/pipeline-architecture]] | Technical |
| [[styles/microkernel-architecture]] | Domain (plug-ins represent domain variations) |
| [[styles/service-based-architecture]] | Domain |
| [[styles/event-driven-architecture]] | Domain |
| [[styles/space-based-architecture]] | Domain (processing units are domain-specific) |
| [[styles/soa-architecture]] | Technical (service layers: business, enterprise, application) |
| [[styles/microservices-architecture]] | Domain (bounded context per service) |

## Conway's Law and Team Structure

Conway's Law (Melvin Conway, late 1960s):

> "Organisations which design systems … are constrained to produce designs which are copies of the communication structures of those organisations."

The layered monolith is the default architecture in many organisations precisely because teams are organised by technical specialisation (frontend dept, backend dept, DBA dept), and Conway's Law produces a technical partition that mirrors those boundaries.

**Inverse Conway Maneuver** (Jonny Leroy, ThoughtWorks): deliberately evolve team and organisational structure to promote the desired architecture rather than letting team structure dictate architecture. Domain-partitioned architectures require cross-functional teams owning a complete domain end-to-end (UI + logic + data). To get a domain-partitioned architecture, reorganise into domain-owning teams first.

## Component Identification Flow

Component design is an iterative cycle rather than a one-time exercise:

1. **Identify initial components** — based on top-level partitioning choice (technical or domain); the initial design is expected to be wrong
2. **Assign requirements/stories** — map each user story or requirement to a component to test fit; this may trigger creating, merging, or splitting components
3. **Analyse roles and responsibilities** — check that the granularity of components matches the granularity of roles and workflows described in requirements
4. **Analyse architecture characteristics** — if different requirements in the same component need meaningfully different characteristics (scalability, reliability), split the component; components with the same characteristics can remain together
5. **Restructure** — revise the design; repeat from step 2

The Going, Going, Gone auction example illustrates step 4: a single BidCapture component is split into BidCapture (for bidders) and AuctioneerCapture (for the auctioneer) because the auctioneer has higher reliability and availability requirements than the many-bidder stream.

## Component Discovery Techniques

| Technique | Origin | Best for |
|---|---|---|
| **Actor/Actions** | Rational Unified Process | Any system type; identifies actors and the actions they perform |
| **Event Storming** | DDD | Distributed, message-based systems; identifies events and builds components around event/message handlers |
| **Workflow approach** | General | Systems without explicit messaging constraints; identifies key roles and the workflows they engage in |

None is categorically better; choice depends on software development process and system type. Event Storming is ideal when the architecture will use events and messages (microservices, event-driven architecture) because it builds components around the eventual messaging design. Actor/Actions is the best general-purpose technique for teams without special constraints.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Introduces the explicit technical vs. domain distinction; advocates strongly for domain partitioning; links to bounded context and Conway's Law |
| [[sources/understanding-distributed-systems]] | Discusses service boundaries and data isolation implicitly from the distributed systems perspective, without using this terminology |

## Related Concepts

- [[concepts/modularity]] — domain partitioning produces higher functional cohesion
- [[concepts/architecture-quantum]] — domain-partitioned components map naturally to quantum boundaries
- [[styles/microservices-architecture]] — the extreme case of domain partitioning (one bounded context per service)
- [[styles/layered-architecture]] — the canonical technically-partitioned style

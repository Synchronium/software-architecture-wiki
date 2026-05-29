---
title: "Fracture Planes"
type: concept
tags: [decomposition, monolith, teams, boundaries, flow, microservices, migration]
sources: [team-topologies, monolith-to-microservices]
created: 2026-05-14
updated: 2026-05-29
---

# Fracture Planes

## Definition

A **fracture plane** is a natural seam in a software system that allows it to be split cleanly into two or more parts — analogous to the natural cleavage planes stonemasons exploit when splitting stone. Team Topologies uses the term to describe where to draw software responsibility boundaries that enable autonomous, cognitively bounded teams (→ [[sources/team-topologies]] ch. 6).

The primary goal: find splits that produce parts that can be *owned and evolved independently by a single team*, reducing inter-team dependencies and improving flow.

**Litmus test**: *Could we, as a team, effectively consume or provide this subsystem as a service?* If yes, it is a candidate fracture plane.

## Why It Matters

Most problems in delivering software arise from unclear or wrong responsibility boundaries between teams. Conway's Law predicts that poorly placed boundaries will produce tightly coupled systems. Fracture planes provide a vocabulary for deliberately choosing boundaries that align team cognitive load with software structure.

Crucially, fracture planes apply equally to initial system design and to splitting existing monoliths.

## Types of Monolith

Two complementary taxonomies describe what kind of coupling exists before you choose a fracture plane.

**Newman's deployment-oriented taxonomy** (→ [[sources/monolith-to-microservices]] ch. 1):

| Type | Description |
|------|-------------|
| **Single-process monolith** | All code deployed as one process; the simplest and most common form; often the right starting point |
| **Modular monolith** | Single deployment unit with internally well-defined module boundaries; viable long-term alternative if module contracts remain stable |
| **Distributed monolith** | Multiple separately deployed processes that cannot be changed or deployed independently; the worst of both worlds |

Newman emphasises that the modular monolith is an *underrated* architecture: if module boundaries are well-enforced, many of the benefits of microservices (independent development, cognitive partitioning) are achievable without the operational complexity of distribution.

**Team Topologies' broader taxonomy** (→ [[sources/team-topologies]] ch. 6): includes six forms of monolith, going beyond deployment to include build, release, model, thinking, and workplace:

| Type | Description |
|------|-------------|
| **Application monolith** | Single large application deployed as a unit; many dependencies and responsibilities |
| **Joined-at-the-database monolith** | Multiple services coupled through a shared database schema; changes require coordination via DBA team |
| **Monolithic build** | One CI build rebuilds the entire codebase even for small changes |
| **Monolithic release** | Services can be built independently but are only tested/deployed together as a batch |
| **Monolithic model** | A single domain model forced across many contexts, constraining architecture |
| **Monolithic thinking** | One-size-fits-all standardisation of technology and tooling; reduces team autonomy and experimentation |
| **Monolithic workplace** | Open-plan office without team-specific spaces; paradoxically reduces face-to-face interaction within teams while increasing noise |

> "If you have microservices but you wait and do end-to-end testing of a combination of them before a release, what you have is a distributed monolith." — Amy Phillips (→ [[sources/team-topologies]] ch. 6)

## The Eight Fracture Planes

### 1. Business Domain Bounded Context (primary)

Align software boundaries with [[concepts/bounded-contexts|bounded contexts]] — internally consistent business domain areas. This is the *preferred* fracture plane because it:
- Aligns technology with business language (ubiquitous language)
- Maps naturally to stream-aligned teams
- Reduces "lost in translation" friction between domain and implementation
- Supports DDD practices (event storming, domain modelling)

Most fracture planes should be of this type. Where business domain boundaries are unclear, DDD techniques help discover them.

### 2. Regulatory Compliance

Hard regulatory borders (PCI DSS for card data, GDPR for PII, HIPAA for health data) provide natural fracture planes. Isolating regulated subsystems:
- Limits the blast radius of compliance scope
- Enables the compliance team to be a focused, smaller group embedded with the subsystem
- Avoids forcing compliance overhead on unrelated parts of the system

### 3. Change Cadence

Parts of the system that need to change at very different frequencies should be separated. In a monolith, everything moves at the speed of the slowest part. Splitting by change cadence allows each part to evolve at the pace the business needs it to.

### 4. Team Location

Geographically distributed teams produce architecturally distributed systems (Conway's Law again). If teams are in different time zones or buildings, the software boundaries should reflect that to avoid communication bottlenecks. Choose between full colocation, remote-first, or split along geographic lines.

### 5. Risk

Different parts of a system carry different risk profiles (regulatory compliance is a specific case). High-risk areas (rapid innovation, new customers) and low-risk areas (stable revenue-generating features) can evolve at different cadences with different quality gates when separated.

### 6. Performance Isolation

Subsystems with extreme peak performance requirements (e.g., annual tax submission spikes) should be isolated so they can scale independently without dragging the entire system into a complex scaling exercise.

### 7. Technology (use sparingly)

Technology-driven splits (front-end/back-end/data tier) are historically the *most common* but also the *least desirable* fracture planes — they reduce team autonomy, introduce handoff points, and optimise for technical specialisation rather than business flow. Use only when:
- The technology gap is genuinely large (embedded firmware vs. cloud backend vs. mobile)
- Skill requirements, change cadence, and tooling are radically different enough that a single team cannot reasonably span them
- No better business-domain fracture plane is available

> **Contradiction:** Traditional "layer team" approaches (front-end, back-end, DBA) apply technology as the primary fracture plane. Team Topologies argues this is almost always wrong and produces the classic coupling and handoff bottlenecks. (→ [[sources/team-topologies]] ch. 6)

### 8. User Personas

When a system serves distinct user groups with substantially different feature sets (admin vs. user, enterprise vs. free tier, expert vs. novice), splitting along persona lines focuses teams on a coherent customer experience and simplifies support.

## Migration Prioritisation (Newman)

When decomposing an existing monolith, the domain model also reveals which bounded contexts are easier or harder to extract (→ [[sources/monolith-to-microservices]] ch. 2). Newman's two-axis prioritisation quadrant:

- **x-axis**: value delivered by extracting this context as a service (aligned to migration goals)
- **y-axis**: difficulty of extraction (number of inbound dependencies, degree of database entanglement)

**High value, low difficulty** → extract first. Functionality with no inbound dependencies (e.g., Invoicing in Newman's Music Corp example) can be proxied without modifying the monolith. **High difficulty, low value** → defer or avoid. Heavily coupled shared utilities (e.g., Notifications with many callers) should be extracted only after simpler wins build team capability.

The prioritisation model is a living document: revisit and replan after each extraction because what looks hard often becomes easier, and vice versa.

## Combining Fracture Planes

Real systems typically need a combination. The goal is not to find a single "correct" split but to identify fracture planes that together produce the most autonomous, cognitively bounded team structure. After splitting, check: are the resulting parts independently deployable? Does each part have a clear, single owning team? Is the cognitive load of each part within the capacity of one team?

## Relationship to Other Concepts

- [[concepts/bounded-contexts]] — the DDD concept that provides the primary fracture plane; bounded contexts are the natural split for stream-aligned teams
- [[concepts/cognitive-load]] — fracture planes are chosen to keep each resulting part within one team's cognitive load
- [[concepts/team-topologies-model]] — fracture planes produce the software boundaries that stream-aligned teams own
- [[concepts/architectural-decomposition]] — covers *how* to execute a split (strangler fig, branch by abstraction); fracture planes address *where* to split
- [[concepts/conways-law]] — Conway's Law predicts that team structure will converge on software structure; fracture planes make this deliberate
- [[styles/microservices-architecture]] — the distributed monolith is the failure mode when microservices are created without correct fracture planes

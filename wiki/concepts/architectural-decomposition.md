---
title: "Architectural Decomposition"
type: concept
tags: [architecture, decomposition, modularity, migration, monolith, microservices]
sources: [software-architecture-the-hard-parts]
created: 2026-05-14
updated: 2026-05-14
---

# Architectural Decomposition

## Definition

Architectural decomposition is the process of breaking apart a monolithic application into separately deployed services. It addresses the *how* of migration, following the *why* of [[concepts/architectural-decomposition#modularity-drivers|modularity drivers]]. The key challenge is that decomposition must be done in a controlled, incremental way that minimises risk.

## Modularity Drivers

Before breaking apart any system, architects need a business justification. SATH identifies five architectural characteristics that translate directly to business drivers (→ [[sources/software-architecture-the-hard-parts]] ch. 3):

| Characteristic | What it means | Business driver |
|----------------|--------------|----------------|
| **Maintainability** | Ease of adding, changing, removing features; measured by component coupling, cohesion, cyclomatic complexity, and component size | Speed-to-market |
| **Testability** | Ease and completeness of testing; modularity reduces testing scope per change | Fewer bugs; faster releases |
| **Deployability** | Frequency, ease, and risk of deployment; domain services can be deployed independently | Faster time-to-market; lower risk |
| **Scalability** | Ability to remain responsive as load grows gradually over time (long-horizon) | Competitive advantage, growth |
| **Availability/Fault tolerance** | Ability for parts of the system to remain operational when other parts fail; monoliths cannot achieve domain-level fault tolerance | Customer satisfaction; SLAs |

**Scalability vs Elasticity** — an important distinction:
- *Scalability*: responsiveness under gradually increasing load over time. A function of modularity — breaking systems into separate deployment units.
- *Elasticity*: responsiveness during sudden, erratic spikes in load. A function of granularity — the size of individual services. Relies on small **mean time to startup (MTTS)**; fine-grained services start faster and therefore scale out faster.

> A concert-ticketing system exemplifies the distinction: load is low between concerts (scalability concern) but spikes massively the moment tickets go on sale (elasticity concern).

Modularity does not always require a distributed architecture. Maintainability, testability, and deployability can also be improved through monolithic approaches such as the [[styles/modular-monolith]] or microkernel — these partition without distributing.

**Important caveat**: as services become finer-grained and communicate more with each other to complete a single business transaction, testability, deployability, scalability, and fault tolerance all *degrade* — the "big ball of distributed mud" anti-pattern. The benefits of decomposition are only realised when services are genuinely independent.

## Assessing Decomposability

Before choosing a decomposition approach, assess whether the codebase can be decomposed at all. The primary tools are Robert Martin's coupling metrics (→ [[concepts/modularity]]):

- **Abstractness (A)**: ratio of abstract types to total types
- **Instability (I)**: efferent coupling / (afferent + efferent coupling)
- **Distance from Main Sequence (D)**: |A + I − 1|

A codebase where many components fall into the **Zone of Pain** (D high, over-concrete and rigid) or **Zone of Uselessness** (D high, over-abstract and irrelevant) signals poor internal structure. If the structure is too degraded to repair incrementally, decomposition may require a rewrite rather than a refactoring.

**Big Ball of Mud Anti-Pattern** (Brian Foote, 1999): a codebase with no internal structure — event handlers wired directly to database calls, no component boundaries. These systems cannot be decomposed using component-based patterns; they require a different approach.

**Elephant Migration Anti-Pattern**: extracting services opportunistically "one bite at a time" without a holistic plan, resulting in an unstructured collection of tightly coupled services — a distributed monolith.

## Decomposition Approaches

Two approaches depending on how structured the existing codebase is (→ [[sources/software-architecture-the-hard-parts]] ch. 4):

### Component-Based Decomposition

Suited to codebases with observable component structure (namespaces/directories that reflect functional groupings). Applies a sequence of refactoring patterns to prepare components for extraction, then extracts them into domain services.

**Key principle**: build services from components, not individual classes. The stepping-stone strategy: target service-based architecture first (coarse-grained domain services, shared DB), then decide which domains require further granularity into microservices.

### Tactical Forking

Named by Fausto De La Torre. Suited to codebases that are big balls of mud with little discernible structure.

**Process**: clone the entire monolith; give each team a copy of the full codebase; teams delete code they don't need (rather than extracting code they do need). Deletion is easier than extraction in a highly coupled codebase because compilation/testing immediately validates what is safe to remove.

**Trade-offs:**

| | Benefits | Shortcomings |
|--|---------|-------------|
| Tactical Forking | Teams start immediately with no up-front analysis; deletion is easier than extraction in chaotic codebases | Resulting services contain significant latent dead code; code quality doesn't improve, just reduces in volume; shared code may diverge inconsistently between forks |
| Component-based decomposition | Structured result with clear component boundaries; less duplication; service definitions emerge naturally from domain groupings | Slower; requires significant up-front analysis; codebase must have some observable structure |

## Component-Based Decomposition Patterns

Six patterns applied sequentially (→ [[sources/software-architecture-the-hard-parts]] ch. 5):

### 1. Identify and Size Components
Catalogue all components (leaf-node namespaces containing source files). Calculate total statements per component. Components should fall within 1–2 standard deviations of the mean; statistical outliers are resizing candidates.

**Sizing metric**: total statements (not lines of code or file count — developers write classes and methods differently; statements provide a more objective measure of what a component is doing).

**Fitness function**: trigger in CI/CD to alert when any component exceeds a configured percentage of the total codebase (e.g., >10%) or exceeds N standard deviations from the mean.

### 2. Gather Common Domain Components
Identify domain logic (business processing — notification, formatting, validation) that is duplicated across components. Consolidate into a single shared component.

Distinguish from infrastructure functionality (logging, metrics, security) which is shared by all components and is not a consolidation candidate.

**Important check**: after consolidating, calculate the new afferent coupling level of the consolidated component. If consolidation would dramatically increase coupling (e.g., 12 components now depend on one shared service), reconsider.

**Fitness function**: detect common leaf-node names across namespaces (e.g., multiple `.audit` namespaces); detect shared source files used across components.

### 3. Flatten Components
Source code must reside only in leaf-node namespaces. A namespace that has been extended (e.g., `ss.survey` extended by `ss.survey.templates`) is a *root namespace* (subdomain), not a component. Source files in root namespaces are *orphaned classes* — they have no definable component.

**Resolution**: either collapse the sub-namespace into the root (flatten down), or move orphaned classes to new leaf nodes (flatten up). Shared code within a domain can be moved to a `.shared` or `.sharedcode` leaf node.

**Fitness function**: alert when source code exists in a non-leaf namespace node.

### 4. Determine Component Dependencies
Visualise afferent (CA) and efferent (CE) coupling between components using IDE plugins or JDepend. Answers three feasibility questions:
1. Is decomposition feasible at all?
2. What is the rough level of effort? (golf ball / basketball / airliner)
3. Rewrite or refactor?

**Effort sizing analogy**: golf ball → minimal dependencies, straightforward; basketball → high coupling, difficult; airliner → dependency matrix is a web, total rewrite required.

When a component has very high afferent coupling, consider splitting it: A₁ (the small, widely-needed part) and A₂ (the bulk). This may reduce coupling significantly.

**Fitness function (ArchUnit example)**: restrict specific component-to-component dependencies to prevent re-coupling during migration.

### 5. Create Component Domains
Group components into logical domains (e.g., Ticketing, Customer, Reporting, Admin, Shared). Domains are manifested through namespace prefixes. Collaborate with product owners to validate groupings.

After refactoring, every component's namespace should start with its domain prefix. This becomes the structural basis for the services that will be extracted.

**Fitness function (ArchUnit example)**: restrict namespaces within a domain service to those matching the domain prefix.

### 6. Create Domain Services
Extract domain component groups into separately deployed services — the result is a service-based architecture. This is the migration target (a stepping-stone; further granularity to microservices is addressed in Ch 7 via [[concepts/service-granularity]]).

**Timing advice**: do not begin extracting services until all domains have been identified and refactored. Premature extraction leads to components needing to be moved between already-deployed services.

## Architecture Stories

An *architecture story* is distinct from a user story and a technical debt story:
- **User story**: a feature to be implemented for an end user
- **Technical debt story**: code cleanup a developer needs to do later
- **Architecture story**: code refactoring that impacts the structural aspect of the application and satisfies a business driver (e.g., "As an architect, I need to decouple the payment service to support better extensibility for adding additional payment types")

Architecture stories are used throughout the decomposition process to assign structural refactoring to developers without conflating it with feature work or cleanup.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/software-architecture-the-hard-parts]] | Primary source; Ch 3–5 develop the full decomposition framework: business drivers, feasibility assessment, two approaches, six patterns, fitness functions, and architecture stories |
| [[sources/fundamentals-of-software-architecture]] | Covers coupling metrics and cohesion theory (the theoretical foundation); does not cover practical decomposition patterns |
| [[sources/building-evolutionary-architectures]] | Covers the strangler fig pattern and evolutionary migration; see [[concepts/evolutionary-architecture]] |

## Related Concepts

- [[concepts/modularity]] — coupling metrics used to assess decomposition feasibility
- [[concepts/service-granularity]] — what happens after decomposition: how fine-grained should services be?
- [[concepts/data-decomposition]] — the corresponding process for breaking apart the monolithic database
- [[concepts/architecture-quantum]] — shared database forces a single quantum; decomposition enables multiple quanta
- [[concepts/fitness-functions]] — automated governance for each decomposition pattern
- [[styles/service-based-architecture]] — the recommended stepping-stone target for decomposition
- [[styles/microservices-architecture]] — the eventual target for further granularity
- [[concepts/evolutionary-architecture]] — broader framework for architecture migration

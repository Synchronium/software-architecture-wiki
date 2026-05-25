---
title: "Microkernel Architecture"
type: style
tags: [architecture, monolith, plugins, extensibility, customisation]
sources: [fundamentals-of-software-architecture, software-architecture-patterns]
created: 2026-05-13
updated: 2026-05-14
---

# Microkernel Architecture

## Definition

The microkernel (plug-in) architecture consists of a minimal core system that provides base functionality and a registry of plug-in components that extend or customise that core. The core system handles only the common, stable behaviour; all variable or optional behaviour is pushed into plug-ins. (→ [[sources/fundamentals-of-software-architecture]])

Also known as: *plug-in architecture*.

## Topology

```
┌────────────────────────────────────────┐
│              Core System               │
│  ┌──────────────────────────────────┐  │
│  │  Plug-in Registry / Contracts   │  │
│  └──────────────────────────────────┘  │
└──────────────┬─────────────────────────┘
               │ (contract / API)
   ┌───────────┼────────────────┐
   ▼           ▼                ▼
[Plug-in A] [Plug-in B]  [Plug-in C]
```

**Core system**: two valid definitions — (1) the minimal functionality required to run the system (e.g., Eclipse core = basic text editor without plug-ins), or (2) the happy path through the application with little or no custom processing. The key goal is the same: move cyclomatic complexity out of the core into plug-in components. (→ [[sources/fundamentals-of-software-architecture]]) This reduces core CC, improves testability, and enables the core to invoke plug-ins generically rather than via long conditional chains. The core can itself be implemented as a layered architecture or a modular monolith internally.

**Plug-ins**: standalone, independent components. Must not depend on each other — inter-plug-in coupling is a design smell and should be mediated through the core. Each plug-in can own its own private data store (the core passes needed data in; plug-ins should not connect directly to the shared core database). Two deployment modes:
- *Compile-based*: simpler; plug-in is a shared library (JAR, DLL, Gem). Changing a plug-in requires redeploying the entire monolith.
- *Runtime-based*: plug-ins added/removed/modified at runtime without redeployment. Managed by OSGi, Penrose, or Jigsaw (Java) or Prism (.NET). More complex but enables hot-deploy.

**Remote plug-ins**: plug-ins can be deployed as standalone services accessed via REST or messaging — better decoupling and async support. Trade-off: the architecture becomes distributed in implementation but is still **a single quantum** because all requests must route through the monolithic core first. Also adds failure risk: if a remote plug-in is down, the request cannot complete (unlike a monolithic plug-in).

**Plug-in registry**: maps a feature key to the plug-in reference. Ranges from a simple HashMap within the core, to a configuration file, to a service-discovery tool (Apache ZooKeeper, Consul). Each entry contains the plug-in name, data contract, and access protocol details.

**Contracts and adapters**: plug-ins implement a standard interface defined by the core. Third-party plug-ins that don't conform to the standard contract are wrapped in an adapter — the core's plug-in invocation code remains clean and contract-consistent regardless of plug-in source.

## When to Use

- Systems requiring user- or tenant-level customisation (insurance products, white-label SaaS, IDE-like tools).
- Applications with a stable core and rapidly-evolving peripheral features.
- Domain/architecture isomorphism: the problem domain itself is "core + variations" — a strong signal to use microkernel. Examples: VS Code (stable editor, hundreds of language/tool plug-ins), Eclipse IDE, Jira, Jenkins, PMD, Chrome/Firefox (browser core + viewer plug-ins).
- Business applications with jurisdiction- or client-specific rules: insurance claims processing (per-state rules as plug-ins), US tax preparation (1040 form as core; each additional form/worksheet as a plug-in).
- Performance tuning: removing unused plug-ins makes the application run faster (e.g., Wildfly/JBoss with clustering, caching, messaging removed).

## Architecture Characteristics Ratings

| Characteristic | Rating | Notes |
|----------------|--------|-------|
| Deployability | ★★★☆☆ | Plug-ins can be deployed independently of the core |
| Elasticity | ★★☆☆☆ | Core scales as a unit; plug-ins do not scale independently |
| Evolutionary | ★★★☆☆ | Adding plug-ins without touching the core is low risk |
| Fault tolerance | ★★☆☆☆ | Core failure brings down everything |
| Modularity | ★★★☆☆ | Plug-in boundaries provide good isolation |
| Overall cost | ★★★☆☆ | Moderate — plug-in infrastructure adds overhead |
| Performance | ★★★☆☆ | Core is lean; plug-in invocation adds a call overhead |
| Reliability | ★★★☆☆ | Core is stable; plug-in quality varies |
| Scalability | ★★☆☆☆ | Single deployment unit; cannot scale per-plug-in |
| Simplicity | ★★★☆☆ | Well understood once the plug-in contract is defined |
| Testability | ★★★☆☆ | Plug-ins can be tested in isolation |

## Trade-offs

**Strengths:**
- Highest customisability of all monolithic styles — the right choice when the problem domain is "stable core, variable extensions."
- Plug-in independence allows teams to work in parallel on different plug-ins without coordinating.
- The core can remain small and stable while the system grows through plug-ins.

**Weaknesses:**
- Always a single quantum (the core ties everything together through synchronous connascence). (→ [[sources/fundamentals-of-software-architecture]])
- Cannot support differing operational characteristics across plug-ins (they all share the core's deployment boundary).
- Plug-in contract design is critical and hard to change once external plug-ins depend on it.
- If the core becomes too large, the architecture degrades toward a monolith.

## Quanta

Single quantum. The core system and all plug-ins share the same deployment boundary and operational characteristics.

## Partitioning

**Unique**: the only architecture style that can be **both technically and domain partitioned**. The core is often technically partitioned (layered internally); the plug-ins correspond to domain variations or product variants (per-jurisdiction insurance rules, per-tax-form worksheets). Which partitioning applies is determined by the specific design of core vs plug-ins.

## Domain/Architecture Isomorphism

This style is highly suited to problem domains that are inherently "core + plugins": browser extensions, VS Code, Eclipse, WordPress, insurance product configuration, ERP systems with client-specific extensions.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/fundamentals-of-software-architecture]] | Defines formally; highlights single-quantum constraint; illustrates BFF pattern as a microkernel variant; uses Silicon Sandwiches kata to show customisation-via-plug-in |
| [[sources/software-architecture-patterns]] | Earlier (2015) treatment — establishes plug-in registry concept (name, data contract, access protocol), adapter pattern for third-party plug-ins, and embeddability of microkernel within other styles; content superseded and expanded by FOSA |

## Related Pages

- [[concepts/architecture-quantum]] — always a single quantum; why this constrains scalability
- [[concepts/technical-vs-domain-partitioning]] — plug-ins are domain-partitioned even though the core may be technically structured
- [[comparisons/architecture-styles-comparison]] — side-by-side with all other styles
- [[styles/architecture-styles]] — overview and decision guide for all architecture styles

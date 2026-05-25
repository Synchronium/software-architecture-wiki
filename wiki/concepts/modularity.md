---
title: "Modularity"
type: concept
tags: [architecture, modularity, coupling, cohesion, connascence, mmi, technical-debt, deep-modules, information-hiding]
sources: [fundamentals-of-software-architecture, monolith-to-microservices, software-architecture-metrics, a-philosophy-of-software-design]
created: 2026-05-13
updated: 2026-05-18
---

# Modularity

## Definition

Modularity is the degree to which a system's components are divided into separate, well-bounded units that can be understood, changed, and replaced in isolation. It encompasses both *cohesion* (how well the internals of a component belong together) and *coupling* (the degree to which components depend on one another).

## Why It Matters

Modularity is the structural foundation of architecture. Low modularity makes systems brittle: a change in one place requires changes everywhere, deployment risk is high, and testability suffers. High modularity enables independent deployability, testability, and evolutionary change — all critical architecture characteristics.

Software systems tend toward entropy — disorder increases unless architects actively work against it, just as physical systems require energy input to maintain order. Good modularity does not happen by accident; it requires deliberate attention and continuous enforcement (via [[concepts/fitness-functions]] such as dependency cycle detection).

## Cohesion

Cohesion measures how well the responsibilities within a module belong together. Types from best (strongest cohesion) to worst:

1. **Functional** — every element contributes to a single, well-defined task. Best.
2. **Sequential** — output of one element is input to the next.
3. **Communicational** — elements operate on the same data.
4. **Procedural** — elements must execute in a particular order.
5. **Temporal** — elements are related only by when they execute (e.g., initialisation).
6. **Logical** — elements are categorised together but functionally unrelated (e.g., a "utilities" class).
7. **Coincidental** — elements share a module by accident. Worst.

**LCOM (Lack of Cohesion in Methods)**: a structural metric measuring the degree to which a class's methods do not share instance fields. High LCOM → poor cohesion → candidate for splitting. LCOM is particularly valuable when migrating or restructuring architectures: it exposes shared utility classes that are incidentally coupled — never a coherent unit — and should be split before the monolith is extracted into services. The metric can only detect *structural* lack of cohesion, not logical relationships; interpretation always requires human judgment.

## Deep vs. Shallow Modules (Ousterhout)

Ousterhout (→ [[sources/a-philosophy-of-software-design]] ch. 4) introduces a cost/benefit framing for module design:

- **Benefit** = the functionality a module provides to the rest of the system
- **Cost** = the interface complexity it imposes on the rest of the system

A **deep module** has a simple interface relative to its implementation — high benefit, low cost. The Unix I/O interface (five system calls: `open`, `read`, `write`, `lseek`, `close`) hides hundreds of thousands of lines of kernel implementation. A garbage collector is the extreme case: no interface at all, yet substantial hidden behaviour.

A **shallow module** has an interface nearly as complex as its implementation. It provides little leverage. An extreme example: a one-line wrapper method whose documentation would be longer than the code itself.

**Classitis** is the cultural anti-pattern of excessive small classes driven by the "classes should be small" dogma. Each additional class adds interface cost to the overall system. Java I/O is the canonical example: three wrapper objects (`FileInputStream` → `BufferedInputStream` → `ObjectInputStream`) required to simply read a file, where buffering — needed in nearly every case — should be the default. Compare Unix I/O, where sequential access is the default and random access requires explicit `lseek`.

**Design principle:** interfaces should be designed so that the common case is as simple as possible. Rarely-used features should require explicit opt-in; they should not appear in the interface unless the developer specifically seeks them out. Overexposing rarely-used features is a red flag (Overexposure red flag).

> **Alignment:** Ousterhout's deep/shallow distinction is the code-level counterpart to the cohesion hierarchy above. A shallow module often corresponds to coincidental or logical cohesion — elements grouped without a strong shared purpose. A deep module corresponds to functional cohesion — all internals serve a single coherent capability hidden behind a simple interface.

> **Alignment:** The cost/benefit framing aligns with Martin's abstractness/instability metrics: a stable, abstract module (I = 0, A = 1) is deep in Ousterhout's sense — it provides a stable interface hiding concrete implementation. A concrete, stable module with a complex interface is both in the Zone of Pain *and* shallow.

## Information Hiding (Parnas / Ousterhout)

Information hiding (David Parnas, 1972; cited by Ousterhout ch. 5 as the key technique for deep modules): each module encapsulates *design decisions* in its implementation that are invisible through its interface. Hidden information can be: data structures and algorithms, physical storage layouts, network protocol implementations, scheduling policies, encoding formats.

**Why it reduces complexity:**
1. Simpler interface → lower cognitive load on callers
2. No external dependencies on hidden information → implementation can evolve without changing the interface or requiring caller changes

**Critical distinction:** private fields ≠ information hiding. Getter and setter methods expose a private field just as effectively as public access — the variable's nature and usage become part of the interface. True information hiding means the information is genuinely irrelevant to callers.

**Information leakage** is the inverse: a design decision that appears in multiple modules, creating a hidden dependency. Leakage can be explicit (the same format appears in the interface of two classes) or backdoor (two classes both understand the same file format without it appearing in either interface). Backdoor leakage is more dangerous because it is invisible.

**Temporal decomposition** is the most common cause of leakage: structuring modules to mirror execution order rather than knowledge ownership. A read-then-parse design for HTTP requests requires both classes to understand the request format — the order of operations has been imposed on the module structure, forcing knowledge to live in two places. Fix: structure modules around *what knowledge they own*, not *when they execute*.

> **Alignment:** Ousterhout's information hiding and Newman's anti-patterns (implementation coupling, concept leakage) are the same idea at different scales. Newman (→ [[concepts/coupling]]) applies information hiding to service API design: no service should depend on another's internal implementation. Ousterhout applies it to class interface design: no caller should depend on the implementation choices inside a class. The principle is scale-invariant.

## General-Purpose Modules (Ousterhout)

Over-specialisation is identified as the single greatest cause of complexity (→ [[sources/a-philosophy-of-software-design]] ch. 6). A special-purpose API leaks the concerns of its callers down into the module — UI abstractions (cursors, selections) appear in a text class, making the text class shallower and tying it to its current use case.

**Sweet spot: "somewhat general-purpose"** — functionality for today's needs, but an interface not tied to today's specific use. General-purpose interfaces are simpler, deeper, produce less code overall, and result in better information hiding because upper-layer concerns stay in the upper layer.

**Push specialisation upwards or downwards** to keep lower layers general:
- Upward: UI/feature code at the top of the stack owns all special-purpose logic; modules below it remain general
- Downward: device driver model — a generic interface (`read block`, `write block`) hides device-specific logic in drivers; the OS core remains oblivious to specific devices

**Calibration questions for generality:**
1. What is the simplest interface that covers all my current needs? (fewer methods with same capability = more general)
2. How many situations will this method be used? (single-use method = red flag)
3. Is this API easy to use for current needs? (if you need lots of wrapper code, you've gone too far)

> **Alignment:** Ousterhout's specialisation critique is the code-level version of the service decomposition principle in [[concepts/architectural-decomposition]]: a service that exists only to satisfy one caller, and whose interface mirrors the caller's specific workflow, is a shallow service. The same information-hiding principle applies.

## Different Layer, Different Abstraction (Ousterhout)

A well-designed layered system changes abstraction with each layer. Adjacent layers with similar abstractions indicate decomposition problems (→ [[sources/a-philosophy-of-software-design]] ch. 7).

**Pass-through methods** — methods that do nothing except call another method with the same or similar signature — make classes shallower (add interface cost with no benefit) and create cross-layer dependencies. Red Flag: Pass-Through Method. Fix: expose the lower-level class directly, redistribute responsibilities, or merge classes. Exception: dispatchers and multiple implementations of the same interface are legitimate (same layer, distinct functionality, same signature).

**Decorators** encourage API duplication across layers and are often too shallow. Before creating a decorator: can the functionality be added to the underlying class directly? Can it be merged with an existing decorator? Can it be standalone? The Java I/O `BufferedInputStream` wrapper class should simply have been built into `FileInputStream`.

**Interface vs. implementation:** if a class's interface closely mirrors its implementation representation, the class is probably shallow. Example: a text class whose internal representation is lines of text but whose *interface* is character-oriented (`insert(position, string)`, `delete(start, end)`) encapsulates line splitting/joining complexity — the interface is genuinely different from, and simpler than, the implementation.

**Pass-through variables** — variables passed down through many methods that only the deepest method uses — force all intermediaries to know about the variable's existence. Solution: a **context object** stores all application-global state in one object, passed to constructors and held as an instance variable. One context per system instance enables multiple instances and simplifies testing; variables should be immutable to avoid thread-safety issues. The context object is far from ideal but is better than the alternatives (global variables, long parameter chains).

## Pull Complexity Downwards (Ousterhout)

When a module encounters unavoidable complexity, it should absorb it internally rather than exporting it to callers (→ [[sources/a-philosophy-of-software-design]] ch. 8). A module has more callers than developers; a simple interface matters more than a simple implementation.

**Anti-patterns that push complexity up:**
- Throwing exceptions for uncertain conditions rather than handling them
- Exporting configuration parameters to avoid making internal decisions; users often can't determine good values; the module can often compute a better value automatically

**When to pull down:** (a) the complexity is closely related to the module's core function; (b) pulling it down simplifies callers; (c) pulling it down simplifies the interface. If pulling something down just moves UI-specific concerns into a lower-level module, it creates information leakage without reducing overall complexity.

> **Alignment:** This is the code-level equivalent of the "smart endpoints, dumb pipes" principle in event-driven architecture: push complexity into the service (smart endpoint) rather than into the infrastructure (dumb pipe). At the service level, it also aligns with the information hiding principle — services should absorb complexity so that consumers don't need to understand it.

## Better Together or Better Apart? (Ousterhout)

The fundamental decomposition question at every level — functions, classes, services (→ [[sources/a-philosophy-of-software-design]] ch. 9). The goal is to reduce overall system complexity, not to minimise individual component size.

**Subdivision creates its own complexity:** more interfaces to learn; more management code; separation makes related things harder to see together; potential duplication.

**Indications that code belongs together:** it shares information; it is used together bidirectionally; the pieces overlap conceptually (belong to a common category); you can't understand one without the other.

**When to combine:** shared information (HTTP read+parse); simplifies the interface (merging removes intermediate exposures the caller didn't need); eliminates duplication.

**When to separate:** always separate general-purpose mechanism from special-purpose code. The general-purpose mechanism should know nothing about specific uses.

**Splitting methods:** length alone is rarely a good reason to split; developers split too much. A long method of sequential independent blocks may be fine. Two legitimate splits: (a) extracting a general-purpose subtask that can stand alone; (b) splitting into two distinct public methods when the original combined unrelated responsibilities. Red Flag: Conjoined Methods — if you must read both methods together to understand either one, the split was wrong.

**Explicit disagreement with Clean Code:** Robert Martin argues functions should be < 10 lines. Ousterhout: depth is more important than length; "don't sacrifice depth for length." More functions = more interfaces = more cognitive load.

## Coupling

**Afferent coupling (Ca)**: number of external components that depend on a given component (fan-in). High Ca → the component is widely used; changes are risky.

**Efferent coupling (Ce)**: number of external components a given component depends on (fan-out). High Ce → the component is fragile; it is affected by changes in many other places.

**Robert Martin's derived metrics** (package-level):
- *Abstractness (A)*: ratio of abstract types (interfaces, abstract classes) to total types. A = 0 → concrete; A = 1 → fully abstract.
- *Instability (I)*: Ce / (Ca + Ce). I = 0 → stable (hard to change); I = 1 → unstable (easy to change).
- *Distance from Main Sequence (D)*: |A + I − 1|. Ideal components live near the Main Sequence where abstractness and instability are balanced. High D → *Zone of Pain* (concrete and stable — hard to change) or *Zone of Uselessness* (abstract and unstable — nothing depends on it).

## Connascence

Connascence (Meilir Page-Jones) generalises coupling: two components are connascent if a change to one requires a change to the other to maintain correctness. The stronger the connascence, the tighter the coupling.

**Static connascence** (compile-time; weaker; preferred):
- *Name*: components share a name (method name, variable name). Weakest.
- *Type*: components agree on a type.
- *Meaning/Convention*: components agree on the meaning of a value (e.g., 0 = success).
- *Position*: components agree on parameter order.
- *Algorithm*: components share an algorithm (e.g., a shared hashing function).

**Dynamic connascence** (runtime; stronger; avoid where possible):
- *Execution*: components must execute in a specific order.
- *Timing*: race conditions; correctness depends on timing.
- *Values*: values in multiple components must agree (e.g., two services writing the same field differently). Strongest practical form.
- *Identity*: two components must reference the exact same object instance.

**Page-Jones's three guidelines:**
1. Minimise overall connascence by breaking the system into encapsulated elements.
2. Minimise any remaining connascence that crosses encapsulation boundaries.
3. Maximise the connascence within encapsulation boundaries.

**Jim Weirich's two rules** (who repopularised connascence):
- *Rule of Degree*: convert strong forms of connascence into weaker forms (e.g., refactor a magic constant into a named constant — CoM → CoN).
- *Rule of Locality*: as the distance between software elements increases, use weaker forms of connascence. Strong coupling that is fine within a class becomes a code smell between packages, and an architectural defect across service boundaries.

## Connascence and Architecture Quanta

The [[concepts/architecture-quantum]] concept builds directly on connascence: synchronous connascence defines quantum boundaries. Services with strong dynamic connascence (e.g., connascence of values across a distributed transaction) form a single quantum; services decoupled via asynchronous messaging can be separate quanta.

## Information Hiding and Service Coupling (Newman)

Newman (→ [[sources/monolith-to-microservices]] ch. 1) grounds microservice design in Parnas' 1971 information hiding principle: stable module *interfaces* hide volatile *internals*, so internal changes do not propagate to consumers. When applied to services, this produces the rule that no service should depend on another's internal implementation — only on its public API.

Newman introduces a four-type coupling taxonomy specific to distributed service boundaries:

| Coupling type | Description | Severity |
|---------------|-------------|----------|
| **Implementation coupling** | Service A depends on service B's internal structure (e.g., calls into B's DB directly) | Most dangerous; violates information hiding entirely |
| **Temporal coupling** | A can only function when B is available at the same time; synchronous calls introduce this | Reduces robustness and independent deployability |
| **Deployment coupling** | A and B must be deployed together; negates the core benefit of microservices | Eliminated by independent deployability |
| **Domain coupling** | A needs information from B's domain to do its work; unavoidable but should be minimised | Acceptable in small doses |

This taxonomy complements the structural coupling metrics (afferent/efferent, connascence) with operational coupling concerns that are invisible to static analysis tools. A service pair can have low structural coupling but high temporal coupling if they make synchronous calls.

> **Contradiction:** The FOSA connascence model and Martin metrics are static, compile-time measures. Newman's taxonomy adds runtime and deployment-time coupling dimensions that these metrics cannot capture.

## Modularity Maturity Index (MMI)

Dr. Carola Lilienthal (→ [[sources/software-architecture-metrics]] ch. 4) developed the MMI from 300+ architecture reviews as an empirical, 0-10 measure of architectural technical debt grounded in cognitive science rather than purely formal metrics.

**Three cognitive principles:**

| Principle | Basis | MMI weight |
|-----------|-------|-----------|
| **Modularity** | Chunking — humans hold ~7 chunks in working memory; well-bounded modules enable comprehension without overload | 45% |
| **Hierarchy** | Hierarchical structures are humans' most natural information-organisation schema | 30% |
| **Pattern consistency** | Schema theory — repeated structures reduce cognitive load; inconsistent patterns force readers to re-analyse each case | 25% |

**Decision thresholds:**

| MMI Score | Interpretation | Recommended action |
|-----------|---------------|-------------------|
| < 4 | Very high architectural debt | Consider replacement — refactoring cost likely exceeds rebuild cost |
| 4 – 8 | Moderate to high debt | Refactor — renewing is usually cheaper than replacing; targeted improvement cycles |
| > 8 | Low architectural debt | Maintain; focus on preventing erosion |

**Architecture erosion:** Without deliberate improvement cycles, architecture quality degrades over time. Each added feature without structural refactoring increases debt; accumulated debt makes each subsequent change slower and more expensive — a compounding effect.

**Two types of technical debt:**
- **Implementation debt** (code smells, duplicated code, complex methods): measurable by automated tools (SonarQube, Checkstyle); relatively cheap to address
- **Design/architecture debt** (wrong module boundaries, inappropriate layering, pattern violations): requires structured architecture review; cannot be "counted" by simple static analysis; far more expensive because it demands structural change, not just local refactoring

**Tools used in MMI reviews:** Lattix, Sotograph/SotoArc, Sonargraph, Structure101, TeamScale. Effective review combines automated tool output with manual inspection — tools detect coupling and structure violations, but reviewers must judge whether abstractions are appropriate and whether components represent coherent concepts.

> **Alignment:** Lilienthal's modularity principle (chunking, 45%) maps directly to the cohesion hierarchy and LCOM metric discussed above. The hierarchy principle maps to layering and component hierarchy concepts in [[concepts/architectural-decomposition]]. Farley (ch. 3 of same book) provides the complementary question: *how to build* for high MMI scores (design for testability → produces the five sustainable attributes that MMI measures).

## Advanced Structural Metrics (von Zitzewitz)

Alexander von Zitzewitz (→ [[sources/software-architecture-metrics]] ch. 9) provides a deeper layer of structural metrics that extend the basic coupling measures (Ca/Ce) to system-level propagation analysis. The central claim: without a metrics-based feedback loop, 80% of nontrivial systems exceeding 100K LoC end as Big Balls of Mud.

**ACD, CCD, and Propagation Cost:**
- **ACD (Average Component Dependency)**: average number of components a randomly chosen component transitively depends on (including itself); measures the mean blast radius of any change
- **CCD (Cumulative Component Dependency)**: system-level sum of all ACDs
- **Propagation Cost (PC)**: `PC = CCD / n²` — normalises CCD to system size; answers "what fraction of the codebase does any change propagate to on average?"
  - Threshold: > 20% for 500–5,000 components; > 10% for 5,000+ components

**Relative Cyclicity:**
- Formula: `100 × √(Σ cyclicity) / n`, where cyclicity for each component = size of its cycle group (0 if not in a cycle)
- Measures the proportion of code involved in cycles in a size-normalised way
- Fitness function thresholds: **≤ 4% at component level; 0% at package/namespace level** (package cycles are especially toxic — they make the entire package graph a BBM)

**Structural Debt Index (SDI):**
- `SDI = 10 × linksToBreak + weightOfLinks`
- Quantifies the minimum refactoring effort to eliminate all cycles; combines the count of dependency edges to remove with their weight (how many transitive paths they participate in)
- Target: SDI in the low hundreds; SDI in the thousands signals a deeply entangled codebase

**Maintainability Level (ML):**
- Composite 0-100 score incorporating structural metrics (cycles, coupling), complexity (Modified CC), and duplication, with a penalty for large cycle groups and a sliding minimum floor for small systems
- Three formula variants (ML1/ML2/ML3) of increasing sophistication
- Fitness function threshold: **ML ≥ 75%**

**LCOM4 (Lack of Cohesion of Methods, version 4):**
- Counts the number of disconnected subgraphs in a class's method-field dependency graph
- LCOM4 = 1 → methods and fields form a connected graph (single coherent responsibility)
- LCOM4 > 1 → class contains LCOM4 independent responsibility clusters; each cluster is a candidate for extraction into its own class
- More sensitive than earlier LCOM variants (LCOM, LCOM2, LCOM3)

**Change history metrics** (identify hotspots for structural investment):
- **Number of Changes**: frequency of modification; high-frequency components are highest-risk change targets
- **Code Churn**: lines added + deleted per period; indicates instability and potential design problems
- **Number of Authors**: many contributors to one component signals coordination overhead and inconsistent patterns; a proxy for cognitive load mismatch

**Component Rank:**
PageRank algorithm applied to the class dependency graph. Identifies the most-transitively-referenced classes — the "hubs" that new developers should understand first. Also identifies classes that are so central that any quality investment in them yields disproportionate returns.

**Six golden rules (fitness function targets):**
1. Maintain a formal architectural model documenting intended structure
2. **Zero namespace/package cycles** (absolute threshold)
3. Source-file cycles ≤ 5 elements per cycle group
4. No code duplication
5. Source files ≤ 800 LoC (soft limit)
6. Max indentation depth 4; Modified Cyclomatic Complexity ≤ 15

**Tooling:** Sonargraph-Explorer (free; Java/C#/Python/TypeScript), NDepend (.NET), Understand, SonarQube, Source Monitor.

> **Alignment:** These metrics provide the quantitative foundation that Lilienthal's MMI (above) uses in its tooling-driven assessment. The fitness function thresholds (ML ≥ 75%, Relative Cyclicity ≤ 4%/0%, SDI in low hundreds) make the MMI's scoring criteria explicit and CI-enforceable.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/a-philosophy-of-software-design]] | Ousterhout: deep vs shallow modules (cost/benefit framing); classitis anti-pattern; information hiding + general-purpose interfaces as the key techniques for depth; temporal decomposition as the primary cause of information leakage; different layer, different abstraction rule; pass-through methods as depth-destroyer; context objects for pass-through variables |
| [[sources/fundamentals-of-software-architecture]] | Detailed treatment of cohesion types, Martin metrics, and connascence as practical design tools for architects |
| [[sources/understanding-distributed-systems]] | Discusses coupling implicitly through topics like service granularity and transaction boundaries, but not the formal taxonomy |
| [[sources/software-architecture-the-hard-parts]] | Applies the coupling metrics (abstractness, instability, D) to decomposition feasibility assessment — components in the Zone of Pain or Zone of Uselessness signal a codebase that is hard to safely decompose; introduces architecture stories as a way to track structural refactoring distinct from feature work |
| [[sources/monolith-to-microservices]] | Grounds coupling in Parnas' 1971 information hiding principle; introduces four operational coupling types (implementation, temporal, deployment, domain) that extend structural coupling analysis to runtime and deployment concerns |
| [[sources/software-architecture-metrics]] | Lilienthal (ch. 4): Modularity Maturity Index — cognitive science grounding (chunking/hierarchy/schema); MMI 0-10 score; two debt types (implementation vs design); architecture erosion as a continuous risk; Farley (ch. 3): testability as the practical driver of all five design attributes; TDD as architectural feedback; von Zitzewitz (ch. 9): ACD/CCD/Propagation Cost, Relative Cyclicity, SDI, Maintainability Level, LCOM4, change history metrics — a complete CI-enforceable structural fitness function suite |

## Related Concepts

- [[concepts/software-complexity]] — Ousterhout's three complexity symptoms (change amplification, cognitive load, unknown unknowns) that deep modules and information hiding directly address
- [[concepts/architecture-quantum]] — quantum boundaries are determined by synchronous connascence
- [[concepts/architecture-characteristics]] — testability, deployability, and agility all depend on modularity
- [[concepts/technical-vs-domain-partitioning]] — partitioning strategy affects the cohesion type of top-level components
- [[concepts/fitness-functions]] — LCOM, afferent coupling, and dependency cycles can all be measured by fitness functions; the fitness function testing pyramid (SAM ch. 2) provides a framework for structuring architectural tests
- [[concepts/architectural-decomposition]] — practical application of modularity theory to monolith migration
- [[concepts/evolutionary-architecture]] — testability and deployability (Farley) are the operational drivers that produce the structural attributes MMI measures
- [[concepts/goal-question-metric]] — GQM provides the framework for deriving structural metric thresholds from architectural goals rather than arbitrary convention

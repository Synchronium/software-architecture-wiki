---
title: "Modularity"
type: concept
tags: [modularity, coupling, cohesion, connascence, mmi, technical-debt, deep-modules, information-hiding]
sources: [fundamentals-of-software-architecture, monolith-to-microservices, software-architecture-metrics, a-philosophy-of-software-design]
created: 2026-05-13
updated: 2026-05-29
---

# Modularity

## Key Claims

- **Modularity is cohesion plus coupling.** Cohesion (how well internals belong together) and coupling (how strongly components depend on one another) are the two structural properties. High cohesion + loose coupling enables every property architecture cares about: independent deployability, testability, evolvability.
- **Deep modules beat shallow ones.** A deep module has a small simple interface relative to its large complex implementation (Ousterhout). The Unix I/O interface hides hundreds of thousands of lines behind five system calls. Shallow modules add interface cost without simplification — `classitis` is the dominant cultural anti-pattern.
- **Information hiding is the technique.** Each module should encapsulate design decisions invisible through its interface. Getters and setters defeat hiding; private fields alone are not enough. Information leakage (the same fact lives in multiple modules) is the primary cause of complexity.
- **Connascence generalises coupling.** Static connascence (name, type, position, meaning) is weaker and preferred; dynamic connascence (execution, timing, values, identity) is stronger and should be avoided across encapsulation boundaries. Page-Jones's three rules: minimise overall connascence, minimise it across boundaries, maximise it within.
- **Coupling is also operational, not just structural.** Newman's taxonomy adds implementation, temporal, deployment, and domain coupling on top of the structural metrics (Ca/Ce, A/I/D). Two services with low structural coupling can still be temporally coupled if they call each other synchronously.
- **Modularity is measurable and erodes by default.** MMI (0–10, cognitive-science grounded), Propagation Cost, Relative Cyclicity, Maintainability Level — concrete metrics with concrete thresholds (e.g., zero package cycles, PC < 20%, ML ≥ 75%). Without an enforced metrics-based feedback loop, 80% of nontrivial systems over 100K LoC become Big Balls of Mud.

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

## Deep vs Shallow Modules

The dominant treatment of module design at the code level comes from Ousterhout (→ [[sources/a-philosophy-of-software-design]] chs. 4–9). The framing: every module has a **benefit** (functionality it provides) and a **cost** (interface complexity it imposes). A **deep module** has high benefit relative to its cost — a simple interface hiding a complex implementation. A **shallow module** has interface complexity comparable to its implementation; it adds friction without simplification.

The canonical deep module is Unix I/O — five system calls (`open`, `read`, `write`, `lseek`, `close`) hide hundreds of thousands of lines of kernel implementation. The canonical shallow design is Java I/O, where reading a file requires three wrapper objects (`FileInputStream` → `BufferedInputStream` → `ObjectInputStream`). Buffering is needed in nearly every case; making it explicit pushes complexity onto every caller. **Classitis** — the cultural reflex that "classes should be small" — produces shallow designs because each new class adds interface cost.

Design principle: interfaces should make the common case as simple as possible. Rarely-used features require explicit opt-in. Overexposure (a feature in the interface that callers rarely need) is a red flag.

> **Synthesis:** Deep/shallow is the code-level counterpart to the cohesion hierarchy. A shallow module often has coincidental or logical cohesion (elements grouped without shared purpose); a deep module has functional cohesion (all internals serve one coherent capability behind a simple interface). It also aligns with Martin's metrics: a stable abstract module (I=0, A=1) is deep — it provides a stable interface hiding concrete implementation.

## Information Hiding

Information hiding (Parnas, 1972) is the technique that produces deep modules: each module encapsulates **design decisions** in its implementation that are invisible through its interface. Hidden information includes data structures, storage layouts, network protocols, scheduling policies, encoding formats — anything callers shouldn't have to know.

**Two complexity reductions follow.** Simpler interface → lower cognitive load on callers. No external dependencies on hidden information → implementation evolves without breaking callers.

**Private fields are not enough.** Getter/setter methods expose the variable just as effectively as public access — the variable's nature and usage become part of the interface. True information hiding means the information is genuinely irrelevant to callers.

**Information leakage** is the inverse: a design decision appearing in multiple modules creates a hidden dependency. Explicit leakage (same format in two interfaces) is bad; **backdoor leakage** (two classes both understand the same file format without it appearing in either interface) is worse because it's invisible.

**Temporal decomposition** is the most common cause of leakage. Structuring modules to mirror execution order rather than knowledge ownership: a read-then-parse design for HTTP requests forces both classes to understand the request format. Fix: structure modules around *what knowledge they own*, not *when they execute*.

> **Synthesis:** Information hiding is scale-invariant. Newman (→ [[concepts/coupling]]) applies it to service API design — no service should depend on another's internal implementation. Ousterhout applies it to class interfaces. The principle is the same; only the boundary changes. A microservice with leaky internals (other services calling its database directly) is the same dysfunction as a class with leaky internals (callers manipulating its private state via getters).

## Designing the Interface

Several practical rules follow from the deep-modules / information-hiding framing (Ousterhout chs. 6–9).

**Push specialisation away from general-purpose modules.** Over-specialisation is the single greatest cause of complexity. UI abstractions (cursors, selections) leaking into a text class make the text class shallower and tied to its current use case. The sweet spot is "somewhat general-purpose" — functionality covering today's needs with an interface not tied to today's specific use. Push specialisation either *upward* (feature code owns all special-purpose logic) or *downward* (device drivers hide device-specific logic from a generic OS core).

**Different layer, different abstraction.** A well-designed layered system changes abstraction with each layer. Adjacent layers with similar abstractions are a decomposition problem. **Pass-through methods** (one method that just calls another with the same signature) make classes shallower and create cross-layer dependencies — a red flag. Decorators often fall into the same trap: before creating a decorator, ask whether the functionality could be added to the underlying class or made standalone.

**Pass-through variables** force every intermediary method to know about a variable only the deepest one uses. Solution: a **context object** holds application-global state in one object, passed to constructors. Imperfect but better than global variables or long parameter chains.

**Pull complexity downwards.** When a module encounters unavoidable complexity, absorb it internally rather than exporting to callers. A module has more callers than developers — a simple interface matters more than a simple implementation. Anti-patterns: throwing exceptions for conditions the module could handle; exporting configuration parameters callers can't reason about.

**Combine or split: which?** Subdivision creates its own complexity (more interfaces, more management code, separated things hard to see together). Code belongs together when it shares information, is used bidirectionally, overlaps conceptually, or can't be understood in isolation. Always separate general-purpose mechanism from special-purpose code; the mechanism should know nothing about specific uses. Length alone is rarely a reason to split a method — depth matters more. **Conjoined methods** (if you must read both to understand either, the split was wrong) are the red flag for over-splitting.

> **Synthesis (Ousterhout vs Clean Code):** Robert Martin argues functions should be < 10 lines. Ousterhout disagrees explicitly: "don't sacrifice depth for length." More functions = more interfaces = more cognitive load. The two rules conflict; the wiki sides with Ousterhout because the metric is shipped code complexity, not aesthetic minimalism per function.

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

## Coupling at the Service Boundary

The metrics above (Ca/Ce, A/I/D, connascence) measure structural coupling — what static analysis can see. Newman (→ [[sources/monolith-to-microservices]] ch. 1) adds four operational coupling types that static analysis misses:

| Coupling type | Description | Severity |
|---------------|-------------|----------|
| **Implementation** | Service A depends on service B's internals (e.g., calls B's DB directly) | Most dangerous; violates information hiding entirely |
| **Temporal** | A only functions when B is simultaneously available; synchronous calls create this | Reduces robustness and independent deployability |
| **Deployment** | A and B must be deployed together | Eliminated by independent deployability |
| **Domain** | A needs information from B's domain to do its work | Unavoidable but should be minimised |

Two services can score well on structural coupling and still be tightly temporally coupled if they synchronously call each other. The full picture requires both lenses.

> **Contradiction:** The FOSA connascence model and Martin metrics are compile-time measures. Newman's taxonomy adds runtime and deployment-time dimensions that structural metrics cannot capture. Both are needed.

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

## Key Takeaways

- **Aim for deep modules with simple interfaces hiding complex implementations.** The Unix I/O API is the lodestar; Java I/O wrapper chains are the warning.
- **Information hiding is the technique; getters and setters are not.** A field exposed through accessor methods is still part of the interface. Hide design decisions, not just data.
- **Push complexity downward, never upward.** A module has more callers than developers. Absorb avoidable complexity inside the module rather than exporting it to every caller.
- **Coupling has structural and operational dimensions.** Static metrics (Ca/Ce, A/I/D, connascence) miss temporal, deployment, and domain coupling. Use both lenses.
- **Modularity is measurable, and it erodes by default.** Enforce thresholds (zero package cycles, PC < 20%, ML ≥ 75%) as fitness functions in CI. Without active enforcement, 80% of nontrivial systems decay into Big Balls of Mud.

## Related Concepts

- [[concepts/software-complexity]] — Ousterhout's three complexity symptoms (change amplification, cognitive load, unknown unknowns) that deep modules and information hiding directly address
- [[concepts/architecture-quantum]] — quantum boundaries are determined by synchronous connascence
- [[concepts/architecture-characteristics]] — testability, deployability, and agility all depend on modularity
- [[concepts/technical-vs-domain-partitioning]] — partitioning strategy affects the cohesion type of top-level components
- [[concepts/fitness-functions]] — LCOM, afferent coupling, and dependency cycles can all be measured by fitness functions; the fitness function testing pyramid (SAM ch. 2) provides a framework for structuring architectural tests
- [[concepts/architectural-decomposition]] — practical application of modularity theory to monolith migration
- [[concepts/evolutionary-architecture]] — testability and deployability (Farley) are the operational drivers that produce the structural attributes MMI measures
- [[concepts/goal-question-metric]] — GQM provides the framework for deriving structural metric thresholds from architectural goals rather than arbitrary convention

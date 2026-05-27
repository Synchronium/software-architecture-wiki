---
title: "Software Complexity"
type: concept
tags: [complexity, modularity, cognitive-load, technical-debt, strategic-programming]
sources: [a-philosophy-of-software-design, site-reliability-engineering]
created: 2026-05-18
updated: 2026-05-27
---

# Software Complexity

## Essential vs Accidental Complexity

Fred Brooks ("No Silver Bullet", 1986) distinguishes two types of complexity:

- **Essential complexity**: inherent in the problem itself. It cannot be designed away — a web server serving pages quickly has essential complexity.
- **Accidental complexity**: introduced by implementation choices and can be resolved with engineering effort. Writing a web server in a GC language and fighting garbage collection pauses is accidental complexity.

SRE teams should actively eliminate accidental complexity in the systems they operate (→ [[sources/site-reliability-engineering]] ch. 9). Accidental complexity compounds reliability problems: complex systems fail in complex ways, and complex failure modes are harder to diagnose, mitigate, and prevent. Every layer of unnecessary complexity is a source of future incidents.

> "The price of reliability is the pursuit of the utmost simplicity." — C.A.R. Hoare (ch. 9 epigraph)

## Definition

Ousterhout (→ [[sources/a-philosophy-of-software-design]] ch. 2): **complexity is anything related to the structure of a software system that makes it hard to understand and modify.** It is defined from the developer's perspective — a system's complexity is what a developer experiences when trying to achieve a goal.

A crude mathematical model: the overall complexity of a system (C) is the sum of each part's complexity (cp) weighted by the fraction of time developers spend working on that part (tp):

```
C = Σ(cp × tp)
```

This has a practical implication: complexity concentrated in rarely-touched code contributes little to the overall burden. Isolating complexity where it will never be seen is almost as good as eliminating it entirely.

**Complexity is reader-perceived, not writer-perceived.** If you find your own code simple but others find it complex, it is complex. The developer's job is to produce code that *others* can work with easily, not just themselves.

## Three Symptoms of Complexity

### 1. Change Amplification

A seemingly simple change requires code modifications in many places. Classic example: background colour specified in every page of a website instead of a single central variable — changing the colour means touching every page. Good design reduces the amount of code affected by any single decision.

### 2. Cognitive Load

How much a developer must know to complete a task. Higher cognitive load → more time learning, higher risk of bugs from missing something. Arises from: APIs with many methods, global variables, inconsistencies, and dependencies between modules.

Lines of code is a poor proxy. Sometimes more lines of code is actually simpler, because it reduces cognitive load — a framework that writes the app in three lines but is impossible to reason about is not simple.

### 3. Unknown Unknowns

The worst symptom. It is not obvious what must be modified to complete a task, or what information a developer must have. The developer may not even realise something important needs to change. Unknown unknowns produce bugs that only appear after a change is made.

**Goal of good design: make systems *obvious*.** An obvious system is one where a developer can make a quick guess about what to do and be confident the guess is correct — the opposite of high cognitive load and unknown unknowns.

## Two Causes of Complexity

### Dependencies

A dependency exists when a piece of code cannot be understood or modified in isolation — it relates to other code that must also be considered or modified. Dependencies are unavoidable (every class creates dependencies around its API), but the goal of software design is to reduce their number and make those that remain **simple and obvious**.

Dependencies lead to change amplification and high cognitive load. The replacement of bad dependencies (non-obvious, hard to manage) with good ones (explicit, obvious, compiler-checked) is progress — it does not eliminate the dependency, but makes it tractable.

### Obscurity

Important information is not obvious. Causes include: overly generic variable names (e.g., `time` with no units), undocumented assumptions, hidden dependencies, inconsistency (same name used for two purposes). Obscurity often co-occurs with dependencies: a dependency is most dangerous when its existence is not obvious.

Obscurity creates unknown unknowns and contributes to cognitive load. The best remedy is simplifying the design. Extensive documentation is often a red flag that the design is not clean enough.

**Naming as an obscurity lever:** vague, overly generic names are a primary source of obscurity. The variable `block` used for both physical disk blocks and logical file blocks in the Sprite OS produced a data corruption bug that took six months to find (→ [[sources/a-philosophy-of-software-design]] ch. 14). Good names are precise (readers can guess meaning from the name alone) and consistent (same name always means the same thing). A name that is hard to find precisely is a signal the underlying entity lacks a clean definition.

> **Alignment:** Ousterhout's "dependencies" map closely to what Newman calls coupling types (→ [[concepts/coupling]]) and what Page-Jones formalises as connascence (→ [[concepts/modularity]]). Ousterhout's framing is at the code level (intra-service), but the principle is identical: dependencies must be explicit, obvious, and minimised.

## Complexity is Incremental

Complexity does not arrive in a single catastrophic event — it accumulates through hundreds or thousands of small dependencies and obscurities introduced over time. Each individual item seems acceptable; the aggregate becomes overwhelming.

This means fighting complexity requires a **"zero tolerance" philosophy** (→ [[sources/a-philosophy-of-software-design]] ch. 3). Once complexity accumulates, fixing a single dependency or obscurity does not make a meaningful difference.

## Strategic vs. Tactical Programming

The most important design factor is the developer's mindset (→ ch. 3).

**Tactical programming:** primary focus is getting something working as quickly as possible. Short-sighted — adds small complexities that accumulate. Produces the *tactical tornado* archetype: a developer who ships fast but leaves behind structural destruction that others must clean up. Management sometimes treats tactical tornadoes as heroes; the engineers who must work with their code rarely do.

**Strategic programming:** primary goal is a great design that also happens to work. Investment mindset. Design problems are fixed when discovered, not patched around.

**Investment level:** Ousterhout recommends 10–20% of total development time. Payback in 6–18 months (estimated; no controlled empirical data). After payback, future investment is funded by time saved — the investment becomes self-sustaining.

**Technical debt reframing:** tactical programming borrows time from the future. Unlike financial debt, most technical debt is never fully repaid — you pay and pay forever. Once a codebase becomes spaghetti, it is nearly impossible to fix.

**Startup case studies:**
- **Facebook ("Move fast and break things"):** tactical approach; code became unstable and hard to understand; eventually forced to change motto to "Move fast with solid infrastructure." Tactical code also damages recruiting — the best engineers care about good design.
- **Google and VMware:** strategic approach from the start; strong technical cultures enabled hiring top talent and building sophisticated reliable systems.

> **Open question:** Ousterhout recommends 10–20% investment but acknowledges no empirical data on the payback timeline. The DORA four key metrics (→ [[concepts/four-key-metrics]]) and deployment frequency provide indirect empirical evidence: teams with high deployment frequency (a proxy for low complexity and high testability) also show higher delivery performance, consistent with the strategic programming thesis.

## Exception Handling as Complexity Source

Exception handling is identified as one of the worst sources of complexity in software systems (→ [[sources/a-philosophy-of-software-design]] ch. 10). Exception handling code is harder to write than normal-case code, rarely exercised (making bugs hard to detect), verbose, and generates secondary exceptions during recovery. Empirical finding: >90% of catastrophic failures in distributed data-intensive systems caused by incorrect error handling (Yuan et al., 2014 USENIX OSDI).

Exceptions are part of a module's interface; classes with many exceptions are shallower.

**Four techniques for reducing exception complexity:**
1. **Define errors out of existence:** redefine semantics to eliminate the exceptional case. Unix `delete` (mark for deferred deletion; delete always succeeds). Tcl `unset` redefined as "ensure variable no longer exists."
2. **Mask exceptions:** handle at low level; higher levels are unaware. TCP retransmission masks packet loss. This is an instance of pulling complexity downward.
3. **Exception aggregation:** single top-level handler for many exception types. Web server: all `getParameter` exceptions propagate to one dispatcher handler. Replaces many special-purpose handlers with one general-purpose one.
4. **Just crash:** for unrecoverable errors where handling adds more complexity than it prevents. Application-dependent.

## How Different Sources Treat It

| Source | Perspective |
|--------|-------------|
| [[sources/a-philosophy-of-software-design]] | Ousterhout: complexity is the root cause of all software difficulty; defined by three symptoms and two causes; fought through strategic programming and design investment |
| [[sources/software-architecture-metrics]] | Lilienthal (ch. 4): Modularity Maturity Index as empirical measurement of structural complexity (→ [[concepts/modularity]]); architecture erosion as default outcome without active investment |
| [[sources/monolith-to-microservices]] | Newman: complexity shows up as coupling between services; information hiding reduces it by making dependencies explicit and stable |
| [[sources/building-evolutionary-architectures]] | Ford et al.: complexity is fought through fitness functions and incremental design; technical debt accumulates into *architectural debt* when coupling becomes structural |

## Related Concepts

- [[concepts/modularity]] — cohesion, coupling, connascence, and structural metrics as measures of code-level complexity
- [[concepts/coupling]] — Newman/Page-Jones formal taxonomy of the "dependencies" Ousterhout identifies as the primary cause of complexity
- [[concepts/cognitive-load]] — Sweller's cognitive load theory applied to team structure; Ousterhout applies it at the code level
- [[concepts/evolutionary-architecture]] — strategic programming at the architectural level; fitness functions as the enforcement mechanism
- [[concepts/fitness-functions]] — automated enforcement of zero-tolerance complexity policies

## Key Quotes

> "Complexity is anything related to the structure of a software system that makes it hard to understand and modify the system." (→ [[sources/a-philosophy-of-software-design]] ch. 2)

> "Of the three manifestations of complexity, unknown unknowns are the worst." (ch. 2)

> "It's not acceptable to introduce unnecessary complexities in order to finish your current task faster. The most important thing is the long-term structure of the system." (ch. 3)

> "Unlike financial debt, most technical debt is never fully repaid: you'll keep paying and paying forever." (ch. 3)

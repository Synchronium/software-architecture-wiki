---
title: "A Philosophy of Software Design"
type: source
tags: [software-design, complexity, modularity, information-hiding, deep-modules, code-quality]
sources: [a-philosophy-of-software-design]
created: 2026-05-18
updated: 2026-05-18
---

# A Philosophy of Software Design

**Authors:** [[authors/john-ousterhout]]
**Published:** 2018 (2nd ed. 2021)
**Slug:** `a-philosophy-of-software-design`

## Overview

Ousterhout's book addresses a gap he identifies in software education: we teach programming languages, algorithms, and processes, but not software design — specifically, how to manage complexity. The central thesis is that **complexity is the root cause of nearly all difficulty in software development**, and all good design decisions are best understood as ways to reduce or contain it.

The book operates at a lower level than typical architecture texts. Where works like *Fundamentals of Software Architecture* concern themselves with service boundaries and deployment topologies, Ousterhout works at the level of classes, methods, and modules within a single codebase. His audience is developers, not architects — though the principles extend to module/subsystem/service boundaries.

The book grew out of CS 190 at Stanford, where Ousterhout tested these ideas empirically with students writing real code. The principles are taught through code review — students write, get feedback, and rewrite, analogous to English composition. This grounds the book in practice rather than theory.

## Key Claims

- Complexity is the root cause of slow development, bugs, and high cost — not inadequate tools or processes (→ ch. 1)
- The most fundamental problem in computer science is problem decomposition (→ Preface)
- There are two approaches to fighting complexity: eliminate it (simpler code) and encapsulate it (modular design) (→ ch. 1)
- Design is continuous and incremental — not a phase that precedes implementation (→ ch. 1)
- Modules should be *deep*: simple interfaces hiding substantial implementation complexity; deep = high benefit/cost ratio where benefit is functionality and cost is interface (→ ch. 4)
- Classitis — excessive small classes from the "classes should be small" dogma — adds system-level complexity even when each class is individually simple (→ ch. 4)
- Information hiding (Parnas 1972) is the key technique for creating deep modules: embed design decisions in the implementation, invisible to the interface (→ ch. 5)
- Temporal decomposition (structuring modules by execution order rather than knowledge ownership) is a major cause of information leakage (→ ch. 5)
- Private fields ≠ information hiding; getter/setter methods expose information just as effectively as public access (→ ch. 5)
- General-purpose modules are deeper than special-purpose ones (→ ch. 6)
- Different layers should have different abstractions (→ ch. 7)
- Complexity should be pulled downward, into modules, rather than pushed upward to callers (→ ch. 8)
- Comments should describe things not obvious from the code — the *what* and *why*, not the *how* (→ ch. 13)
- Names and comments are part of the design — strategic investment, not afterthought (→ ch. 14–15)
- Consistency in coding conventions reduces cognitive load significantly (→ ch. 17)
- Obvious code costs nothing to understand; non-obvious code is a complexity tax (→ ch. 18)

## Chapter Notes

### Preface

Ousterhout's motivation: the most fundamental problem in computer science is problem decomposition, but no university class addresses it directly. He hypothesises that design skill is what separates great programmers from average ones — and that it can be taught. CS 190 at Stanford is the result. The book is explicitly an opinion piece; Ousterhout invites disagreement and experimentation.

Key framing: the goal is *reducing complexity*, which takes priority over any individual principle. If a principle doesn't reduce complexity in a given case, don't apply it.

### Chapter 1 — Introduction (It's All About Complexity)

The greatest limitation in writing software is human ability to understand the systems being created. Complexity accumulates inevitably over the life of a program — the larger the program and the more people working on it, the more difficult it becomes.

**Two approaches to fighting complexity:**
1. **Eliminate it** — make code simpler and more obvious (eliminate special cases, consistent naming)
2. **Encapsulate it** — modular design: divide the system into modules designed to be relatively independent, so a programmer can work on one without understanding the details of others

**Design is continuous:** Software is malleable, so design spans the entire lifecycle. The waterfall model fails because it is impossible to visualise the full implications of a large software design before building anything. Incremental/agile development spreads design across the lifecycle; each iteration exposes problems and fixes them while the system is small.

**Red flags** as a learning mechanism: observable symptoms of unnecessary complexity. The book accumulates red flags chapter by chapter; a list appears at the back. The practice: when you see a red flag, stop and look for a design alternative that eliminates it.

The two challenges Ousterhout sets for the book:
1. Describe the nature of software complexity — what it is, why it matters, how to recognise it
2. Present techniques to minimise complexity over the software development lifetime

> **Open question:** Ousterhout's "eliminate complexity" vs "encapsulate complexity" framing is at the code level. How does this map to architectural decisions where we cannot fully encapsulate — e.g., distributed transactions, shared databases? The architectural equivalents may be: eliminate coupling (service decomposition) vs encapsulate it (abstraction layers like API gateways, service meshes).

### Chapter 2 — The Nature of Complexity

**Definition:** complexity = anything making a system hard to understand and modify. Weighted by developer time spent: `C = Σ(cp × tp)`. Complexity concentrated in rarely-touched code is nearly harmless — isolate it there if you can't eliminate it.

**Three symptoms:**
- **Change amplification** — simple change requires many code modifications; good design reduces the amount of code affected by each decision
- **Cognitive load** — how much a developer must know to complete a task; causes: many-method APIs, global variables, inconsistencies, inter-module dependencies; lines of code is a poor proxy for simplicity
- **Unknown unknowns** — worst symptom; developer doesn't know what must change, or even that there's a problem; manifests as post-change bugs

**Two causes:**
- **Dependencies** — code that cannot be understood/modified in isolation; unavoidable but must be made as few, simple, and obvious as possible; good design replaces non-obvious hard-to-manage dependencies with explicit compiler-checked ones
- **Obscurity** — important information not obvious (generic names, undocumented units, inconsistency, hidden dependencies); extensive documentation is a red flag the design needs improvement

**Complexity is incremental:** not one catastrophic error — accumulation of hundreds of small dependencies and obscurities. Requires zero-tolerance philosophy.

### Chapter 3 — Working Code Isn't Enough (Strategic vs. Tactical)

**Tactical programming:** focus on working code as fast as possible; adds small complexities that accumulate; the *tactical tornado* ships fast but leaves structural destruction behind.

**Strategic programming:** primary goal is a great design that also happens to work; investment mindset; fix design problems when discovered, don't patch around them.

**Investment level:** 10–20% of total development time recommended. Estimated payback: 6–18 months (Ousterhout's opinion; no controlled data). After payback, future investment is funded by the time saved.

**Technical debt reframing:** tactical programming borrows time from the future; unlike financial debt, most technical debt is never fully repaid.

**Case studies:** Facebook ("Move fast and break things") → tactical; code degraded; eventually forced to shift culture. Google/VMware → strategic from the start; strong technical culture attracted top engineers.

## Notable Quotes

> "The most fundamental problem in computer science is problem decomposition: how to take a complex problem and divide it up into pieces that can be solved independently." (Preface)

> "This means that the greatest limitation in writing software is our ability to understand the systems we are creating." (ch. 1)

> "Complexity will still increase over time, in spite of our best efforts, but simpler designs allow us to build larger and more powerful systems before complexity becomes overwhelming." (ch. 1)

> "The overall goal is to reduce complexity; this is more important than any particular principle or idea you read here." (Preface)

### Chapter 4 — Modules Should Be Deep

**Modular design** decomposes a system into relatively independent modules, each with an interface and an implementation. Developers must know the interfaces of modules they call, but not their implementations. The goal: minimise dependencies between modules.

**Abstractions** are simplified views of entities that omit unimportant details. Two failure modes: (1) including unimportant details — increases cognitive load unnecessarily; (2) omitting important details — creates a *false abstraction* that looks simple but isn't. The key skill is identifying what is genuinely important.

**Deep modules** have simple interfaces hiding substantial implementation complexity. The Unix I/O interface (5 system calls — `open`, `read`, `write`, `lseek`, `close`) hides hundreds of thousands of lines of code. A garbage collector has no interface at all. Cost/benefit framing: *benefit* = functionality provided; *cost* = interface complexity imposed on the rest of the system.

**Shallow modules** have interfaces nearly as complex as their implementations. They provide little leverage against complexity. Example: a one-line `addNullValueForAttribute()` method imposes an interface cost with no offsetting benefit.

**Classitis**: the anti-pattern of excessive small classes driven by the conventional wisdom "classes should be small." Java I/O is a canonical example: three objects required to read a file (`FileInputStream` → `BufferedInputStream` → `ObjectInputStream`), where buffering should simply be the default. Contrast with Unix I/O: sequential access is the default; random access requires explicit `lseek`.

**Red Flags introduced:** Shallow Module.

> **Open question:** Ousterhout's classitis critique targets a specific Java cultural norm. Does it apply equally to functional programming styles where functions are the unit? The deep/shallow distinction translates directly — a function with a complex signature hiding little logic is shallow — but the cultural context differs.

### Chapter 5 — Information Hiding (and Leakage)

Information hiding (Parnas, 1972) is the key technique for creating deep modules. Each module encapsulates design decisions in its implementation that are invisible to its interface. Hidden information includes: data structures and algorithms, physical storage layouts, network protocol implementations, scheduling policies, encoding formats.

Information hiding reduces complexity two ways: (1) simpler interface → lower cognitive load; (2) no external dependencies on hidden information → design changes affect only the enclosing module.

**Important distinction:** private fields ≠ information hiding. Getter/setter methods expose private fields just as effectively as public access. True information hiding means the information is irrelevant to external callers.

**Information leakage** is the inverse: a design decision reflected in multiple modules, creating dependencies that force simultaneous changes. Leakage can be explicit (through interface signatures) or backdoor (two classes both understanding the same file format without exposing it). Backdoor leakage is more dangerous because it isn't obvious.

**Temporal decomposition** is a common cause of leakage: structuring modules to mirror execution order rather than knowledge ownership. Example: separate "read HTTP request" and "parse HTTP request" classes — both must know the HTTP format, so format knowledge is leaked. Fix: merge classes around knowledge ownership, not execution sequence. Rule: *focus on what knowledge is needed, not the order in which things happen.*

**Worked examples from the HTTP server case study:**
- `getParams()` returning a `Map<String,String>` is shallow and exposes internal representation; `getParameter(String name)` and `getIntParameter(String name)` are deeper and hide the representation
- HTTP response version and Date header should be defaulted automatically — the library should "do the right thing" without being asked; forcing callers to specify them is information leakage in the other direction (pushing knowledge up to callers)
- Defaults are a form of partial information hiding: common case is simple; rare overrides are accessible through explicit calls

**Red Flags introduced:** Information Leakage, Temporal Decomposition, Overexposure.

### Chapter 6 — General-Purpose Modules are Deeper

Over-specialization is identified as the single greatest cause of complexity. Specialisation forces abstractions related to one layer's concerns to leak into lower layers, producing information leakage and shallow modules.

**Sweet spot:** "somewhat general-purpose" — functionality reflects current needs, but the interface should be general enough to support multiple uses. The *implementation* is built for today; the *interface* is not tied to today's use cases.

**Worked example — text editor text class:**
- Special-purpose API: `backspace(Cursor)`, `delete(Cursor)`, `deleteSelection(Selection)` — leaks UI abstractions (Cursor, Selection) into the text class; each new UI operation requires a new text class method
- General-purpose API: `insert(Position, String)`, `delete(Position, Position)`, `changePosition(Position, int)` — UI concerns stay in the UI; the text class is independent
- The general-purpose version has *less code overall* despite being slightly more verbose at call sites
- `backspace()` was a false abstraction: it purported to hide information the UI actually needed to know; hiding it just created obscurity

**Push specialisation upwards or downwards:**
- Upward: UI/feature classes at the top of the stack own all special-purpose logic; lower layers are general-purpose
- Downward: OS device driver model — generic interface (`read block`, `write block`) hides device-specific logic in drivers; the OS core stays general

**Undo/redo design example:** Extract a general-purpose `History` class managing a list of `History.Action` objects. Special-purpose `UndoableInsert`, `UndoableDelete` etc. implement the interface. Policy (grouping actions with fences) lives in UI code. Three concerns separated: mechanism (History), specifics (Action subclasses), policy (UI).

**Eliminate special cases in code:** Represent "no selection" as an empty selection (start = end) rather than a state flag; the general case handles the edge case without branching. Eliminating special cases also makes code more efficient (ch. 20).

Three calibration questions for interface generality:
1. What is the simplest interface covering all current needs?
2. In how many situations will this method be used? (single-use = red flag)
3. Is this API easy to use for current needs? (too general = wrong)

### Chapter 7 — Different Layer, Different Abstraction

Each layer in a well-designed system provides a *different abstraction* from the layers above and below it. Adjacent layers with similar abstractions are a red flag indicating class decomposition problems.

**Pass-through methods**: methods that do nothing except invoke another method with the same or similar signature. They make classes shallower (add interface cost, contribute no functionality) and create dependencies between layers. Red flag: Pass-Through Method. Fix options: expose lower-level class directly to callers, redistribute responsibilities between classes, or merge the classes.

Exception: methods with the same signature are legitimate when each provides distinct and useful functionality — dispatchers (choosing which method to invoke), and multiple implementations of the same interface (e.g., disk drivers). These are the same layer, not pass-through between layers.

**Decorators**: the decorator pattern encourages API duplication across layers. Often too shallow. Before decorating, ask: can the functionality be added directly to the underlying class? Can it be merged with an existing decorator? Can it be standalone? The Java I/O `BufferedInputStream` should simply have been built into `FileInputStream`.

**Interface vs. implementation**: a class whose interface closely mirrors its implementation is probably shallow. Text class example: internal representation is lines; good interface is character-oriented (`insert(position, string)`, `delete(start, end)`); the interface encapsulates the complexity of line splitting and joining.

**Pass-through variables**: variables passed down a long chain of methods even though intermediate methods don't use them. They force all intermediaries to know about the variable's existence. Solutions: (1) store in an existing shared object; (2) global variable (avoid — breaks multiple-instance testing); (3) **context object** — stores all application-global state in one object per system instance; passed to constructors, held as instance variable; enables multiple instances; simplifies testing. Downside: can become a grab-bag if undisciplined; best when variables are immutable.

**Core principle:** Every design element added to a system must eliminate more complexity than it introduces. Pass-through methods and pass-through variables add complexity without contributing functionality.

### Chapter 8 — Pull Complexity Downwards

When a module encounters unavoidable complexity, it should absorb it internally rather than pushing it up to callers. Rationale: a module has far more callers than developers; a simple interface is more important than a simple implementation.

**Anti-patterns that push complexity upward:**
- Throwing exceptions for uncertain edge cases rather than handling them internally
- Exporting configuration parameters to avoid making decisions (the "easy excuse")

**Configuration parameters:** legitimate when different deployments genuinely have different needs, or when users know their workload better than the system can. But overused — in many cases the module can determine a better value automatically (e.g. a network protocol computing retry interval from observed latency rather than requiring explicit configuration). Rule: before exporting a parameter, ask "can the user determine a better value than we can?" Provide sensible defaults; each module should solve its problem completely.

**When to pull down:** (a) the complexity is closely related to the module's existing functionality, (b) pulling down simplifies elsewhere, (c) pulling down simplifies the interface. Don't pull down UI concerns into a text class just because it moves code somewhere — it creates information leakage without reducing overall complexity.

### Chapter 9 — Better Together or Better Apart?

The fundamental decomposition question at every level. The goal: reduce overall system complexity, not reduce the size of individual components.

**Subdivision creates its own complexity:** more interfaces to learn; more management code; separation makes it harder to see related things together; potential duplication.

**Indications code belongs together:** shares information; used together bidirectionally; overlapping conceptual category; can't understand one without the other.

**When to combine:**
1. Shared information — HTTP read+parse split: both need to understand the format; merge them
2. Simplifies the interface — Java I/O: merging `FileInputStream` + `BufferedInputStream` removes the burden of explicit buffering from callers; things that belong in the common case should be automatic
3. Eliminates duplication — factor repeated code if the snippet is long and the replacement signature is simple

**When to separate:** always separate general-purpose mechanism from special-purpose code. The general-purpose mechanism should know nothing about specific uses. (See ch. 6.)

**Counter-examples (separation is better):**
- Cursor + Selection: seemed related (cursor always at one end of selection), but combined object was harder to implement AND harder to use; separated into two objects using a general-purpose `Position` class
- `NetworkErrorLogger` with single-use, single-line logging methods: creates interface cost with no benefit; just inline the log statement

**Splitting methods:** length alone is rarely a good reason to split. Developers split too much. A long method containing sequential independent blocks may be fine; readers can read it block by block. Depth matters more than length. Two legitimate splits: (a) extracting a general-purpose subtask (the child can stand alone without knowledge of the parent); (b) splitting into two distinct public methods when the original had too complex an interface. Red Flag: Conjoined Methods — if you must read two methods together to understand either one, the split was wrong.

**Explicit disagreement with Clean Code (Robert Martin):** Martin argues functions should be extremely short (< 10 lines, indent ≤ 2). Ousterhout disagrees: "Depth is more important than length: first make functions deep, then try to make them short enough to be easily read. Don't sacrifice depth for length." More functions = more interfaces = more cognitive load; excessively small functions produce conjoined functions that must be read together.

**Decision rule:** "Pick the structure that results in the best information hiding, the fewest dependencies, and the deepest interfaces."

### Chapter 10 — Define Errors Out Of Existence

Exceptions are one of the worst sources of complexity. Exception handling code is harder to write than normal-case code, harder to test (exceptions rarely fire; "code that hasn't been executed doesn't work"), verbose, and exception-handling code generates its own secondary exceptions. Empirical finding: >90% of catastrophic failures in distributed data-intensive systems were caused by incorrect error handling (Yuan et al., 2014 USENIX OSDI).

Exceptions thrown by a class are part of its interface; classes with many exceptions are shallower.

**Four techniques for reducing exception handlers:**

1. **Define errors out of existence:** redefine semantics so the exceptional case doesn't exist. Tcl `unset`: instead of "delete variable" (throws if not found), redefine as "ensure variable no longer exists" (always succeeds). Unix file deletion: instead of erroring if file is open, mark for deferred deletion — delete returns success immediately, data freed when all openers close. Java `substring`: should clamp out-of-range indices rather than throw `IndexOutOfBoundsException`.

2. **Mask exceptions:** handle at a low level; higher levels are unaware. TCP masks packet loss with retransmission. NFS masks server crashes by hanging rather than propagating — counterintuitive but correct: propagating would cascade through all applications; hanging allows seamless resume.

3. **Exception aggregation:** handle many exceptions with a single high-level handler rather than many per-call handlers. Web server: let all `getParameter` exceptions propagate to a top-level dispatcher handler. RAMCloud promotes corrupted-object errors into server crashes to reuse the existing crash recovery mechanism — general-purpose mechanism instead of special-purpose corruption recovery. Aggregation is the opposite of masking: masking handles close to source; aggregation lets exceptions propagate up.

4. **Just crash:** for unrecoverable errors where handling adds complexity for little benefit. C OOM: a `ckalloc` wrapper that crashes on allocation failure is better than checking every `malloc` call. Application-dependent — a replicated storage system cannot crash on I/O error; it must recover.

Limit: information that callers genuinely need must be exposed. Exception hiding that denies callers essential information is a violation of information hiding in the wrong direction.

### Chapter 11 — Design It Twice

Software design is hard; first ideas are rarely best. "Design it twice": consider multiple alternatives for every major design decision before committing. Pick radically different alternatives — even if you're sure about one, sketch a second option. Evaluating two bad alternatives teaches you what makes designs good or bad.

Evaluation criteria: ease of use for higher-level software; interface simplicity; generality; implementation efficiency. Best choice may be one alternative or a synthesis of features from several.

Apply at all levels: interface, implementation, module decomposition. Time investment is small relative to implementation time. Design-it-twice also improves design skills over time — it is deliberate practice in design judgment.

**Smart people's trap:** habituated to "first quick idea is sufficient" from academic environments where problems are easy. This breaks down for genuinely hard problems. "It isn't that you aren't smart; it's that the problems are really hard."

### Chapter 12 — Why Write Comments? The Four Excuses

Comments are essential for abstractions. Without comments, the only abstraction of a method is its declaration — which is missing most of the essential information a caller needs. If users must read the code to use a module, there is no abstraction: all the complexity is exposed.

**Four excuses debunked:**
1. "Good code is self-documenting" — myth. Developers who subscribe to this end up with shallow methods (break everything into small pieces to make code readable). The informal aspects of an interface (high-level behaviour, constraints, rationale) can only be captured in comments, not code.
2. "No time to write comments" — comments add ~10% to development time at most. Investment mindset: good comments pay for themselves quickly.
3. "Comments go stale" — solvable; large documentation changes only accompany large code changes; code review catches stale comments.
4. "All the comments I've seen are worthless" — solvable; the next chapters show how.

**Benefits:** capture design information that can't be represented in code; reduce cognitive load; eliminate unknown unknowns; clarify dependencies; fill gaps to reduce obscurity.

**Explicit disagreement with Clean Code (Martin):** Martin argues comments are "always failures" and advocates replacing comments with extracted methods named to replace the comment. Ousterhout: this produces shallow code (methods broken into tiny pieces for readability) and long cryptic names like `isLeastRelevantMultipleOfNextLargerPrimeFactor`. Comments represent a fundamentally different kind of information than code; even if comments could be captured in code, it's unclear that would be better.

### Chapter 13 — Comments Should Describe Things That Aren't Obvious From the Code

**Guiding principle:** comments should describe things not obvious from the code — to someone reading the code for the first time.

**Comment categories:** interface (class/method abstraction), data structure member, implementation, cross-module. Interface and data structure member comments are most important; every class, variable, and method should have one.

**Don't repeat the code:** comments at the same level of detail as the code are worthless. A comment that could be written by looking at the code without understanding it adds no value. Red Flag: Comment Repeats Code.

**Lower-level comments add precision:** for variable declarations, add: units, boundary conditions (inclusive vs exclusive), null semantics, ownership of resources, invariants ("this list always contains at least one entry"). Precision fills in what names and types cannot express.

**Higher-level comments enhance intuition:** describe *what* a block of code does and *why* the code is there, not *how* it works. "How we get here" comments explain the conditions under which code is reached — particularly valuable for unusual code paths. Ask: "what is this code trying to do? What is the simplest thing I can say that explains everything?"

**Interface documentation:** interface comments describe what callers need to know to use a class/method (the abstraction); implementation comments describe how it works internally. If these are the same, the class is shallow — writing interface comments is a design quality signal. Interface comment for a method covers: behaviour, arguments, return value, side effects, exceptions, preconditions.

Red Flag: Implementation Documentation Contaminates Interface — interface comment describes implementation details not needed to use the module.

**Implementation comments (what and why, not how):** most short methods don't need implementation comments. For longer methods, add a comment before each major block describing what it does at a high level. Explain *why* for tricky code (hidden constraints, bug fix context). Focus on what variables *represent*, not how they're manipulated.

**Cross-module design decisions:** difficult because there's no obvious central place. Best option: a `designNotes` file with clearly labeled sections and short cross-reference comments at each relevant code location ("See 'Zombies' in designNotes").

### Chapter 14 — Choosing Names

Names are a form of abstraction and a form of documentation. Poor name choices create obscurity — one of the two causes of complexity. The Sprite OS distributed file system bug: the variable `block` used for both physical disk blocks and logical file blocks caused data corruption that took six months to track down.

**Good names have two properties: precision and consistency.**

**Precision:** choose names that allow readers to correctly guess the entity's meaning without seeing its declaration, documentation, or usage. Red Flag: Vague Name — if the name is broad enough to refer to many things, it conveys little information. Red Flag: Hard to Pick Name — if it's hard to find a precise name, the underlying entity may not have a clear design (use this as a signal to reconsider the design).

**Consistency:** once a name is established for a purpose, use it everywhere; never use it for anything else; ensure the purpose is narrow enough that all variables with that name have the same behaviour. Use distinguishing prefixes when multiple variables of the same type are needed (e.g., `srcFileBlock` and `dstFileBlock`).

**Avoid extra words:** no generic nouns (`fileObject` — `Object` adds nothing); no Hungarian Notation (type information in names); no class name repetition in instance variable names.

**Distance rule:** the greater the distance between a name's declaration and its use, the longer the name should be. Loop variables `i` and `j` are fine at short scope; at longer scope, use descriptive names.

**Disagreement with Go style:** Go advocates extremely short names (`b`, `i`, `n`); Ousterhout argues these create ambiguity and should be judged by readers, not writers. The more important Go insight: consistent usage is what makes short names workable, not the brevity itself.

### Chapter 15 — Write The Comments First

Write comments at the beginning of the design process, not at the end. Delayed comments are rarely written; when they are, the design rationale is forgotten and the comments just repeat the code.

**Ousterhout's comments-first approach:**
1. Write the class interface comment
2. Write interface comments and signatures for the most important public methods (bodies empty)
3. Iterate until the basic structure feels right
4. Write declarations and comments for key instance variables
5. Fill in method bodies; add implementation comments as needed
6. For each new method/variable discovered during implementation, comment immediately

**Three benefits:**
1. Better comments — design rationale is fresh; abstraction can be evaluated before implementation distracts
2. Better design — forces articulation of abstractions early; interface comments reveal design quality before implementation commits you to a bad design
3. More fun — the early design phase is the most creative part; comments-first makes it more so

**Comments are a design tool:** writing an interface comment forces you to identify the essence of a method — what callers need to know. This is design work, not documentation work. Comments are the only way to fully capture abstractions.

**Canary in the coal mine of complexity:** if a method's interface comment is long and complicated, the method has a complex interface (shallow module). Simple comment = good abstraction. If the interface comment must describe all the major features of the implementation, the method is shallow. Red Flag: Hard to Describe.

**Cost argument:** comments are only ~5% of total development time. Writing comments first doesn't meaningfully increase cost; it likely saves time by stabilising abstractions earlier and reducing code rework.

### Chapter 16 — Modifying Existing Code

A system's design is determined more by changes made during its evolution than by any initial conception. The "minimal change to fix the bug" mindset is tactical programming applied to modifications — each minimal change introduces a small complexity, and they accumulate.

**Stay strategic when modifying code.** Ideal standard: when a change is finished, the system should have the structure it would have had if it had been designed from scratch with that change in mind. If not, refactor. "If you're not making the design better, you are probably making it worse."

**Maintaining comments during code changes:**
- **Keep comments near the code** — the farther a comment is from its code, the less likely it gets updated; place interface comments in the code file, not just the header
- **Spread implementation comments through the method** — comment each major phase where the phase begins; comments at the top of a long method describe things that will change independently from each other
- **Comments belong in the code, not the commit log** — developers rarely browse commit history; if information is needed for future maintenance, it must be in the code itself
- **Avoid duplicating documentation** — document each design decision once in the most obvious place; add short cross-references elsewhere; `designNotes` for cross-module decisions
- **Pre-commit diff scan** — review all changes before committing; ensure each change is reflected in documentation
- **Higher-level comments are easier to maintain** — abstract comments aren't affected by minor code changes; only changes in overall behaviour require updating them

### Chapter 17 — Consistency

Consistency creates cognitive leverage: learn something once, apply that knowledge everywhere it appears. Consistent patterns are safe to rely on; inconsistent patterns force developers to learn each situation separately and create risk that similar-looking things behave differently.

**Applies at many levels:** naming (ch. 14), coding style, interfaces with multiple implementations, design patterns, invariants (properties always true of a variable or structure — reduce special cases).

**Ensuring consistency:**
- **Document** conventions in an accessible place (project wiki); invariants at the relevant point in code
- **Enforce with automated checkers** — pre-commit scripts that reject violations; especially effective for low-level syntactic conventions
- **"When in Rome"** — when working in an existing codebase, look for apparent conventions and follow them; when making a design decision, check how similar decisions were made elsewhere
- **Don't change existing conventions** unless (1) there is significant new information and (2) the improvement is large enough to justify updating all existing uses completely; incomplete transitions are worse than a suboptimal but consistent convention

**Limit:** don't force dissimilar things to appear similar. Consistency only provides benefit if developers can trust that "if it looks like an x, it really is an x."

### Chapter 18 — Code Should Be Obvious

Obscurity (one of the two causes of complexity) occurs when important information is not obvious to new developers. Obviousness is reader-perceived, not writer-perceived — code reviews are the best way to determine whether code is obvious.

**Things that make code more obvious:** precise names (ch. 14), consistency (ch. 17), judicious whitespace (blank lines between major phases; whitespace within statements), comments when unavoidable non-obvious code appears.

**Things that make code less obvious:**
- **Event-driven programming:** control flow is hard to follow because handlers are invoked indirectly; compensate with interface comments stating when the handler is invoked
- **Generic containers** (`Pair<Integer, Boolean>`): element names (`getKey()`, `getValue()`) are meaningless; define specific structures with meaningful names. General rule: "software should be designed for ease of reading, not ease of writing"
- **Type mismatch between declaration and allocation** (`List<Message>` declared, `new ArrayList<Message>()` allocated): performance and thread-safety properties of concrete type are invisible
- **Code that violates reader expectations** (constructor spawning background threads when main() exits): document the non-obvious behaviour

Red Flag: Nonobvious Code.

**Three ways to make information available to readers:** (1) reduce needed information through abstraction and eliminating special cases; (2) exploit knowledge readers already have (conventions, familiar patterns); (3) present information directly in names and comments.

### Chapter 19 — Software Trends

**OOP and inheritance:** Private methods and variables support information hiding. Interface inheritance is good — reuses the same interface for multiple implementations; more implementations = deeper interface. Implementation inheritance creates dependencies: parent instance variables are accessed by both parent and child; information leaks across the hierarchy; changes require examining all subclasses. Prefer composition over implementation inheritance. If you must use implementation inheritance, separate parent-managed state from subclass-managed state using information hiding within the hierarchy.

**Agile development:** Incremental development is right — good design can't be fully envisioned upfront. Risk: agile's feature focus encourages tactical programming and deferring design decisions. The increment should be an *abstraction*, not a *feature*. Once you need an abstraction, design it cleanly and completely.

**Unit tests:** Facilitate refactoring — without a test suite, developers avoid structural changes, complexity accumulates. Unit tests provide higher code coverage than system tests.

**TDD:** Ousterhout is a strong advocate for unit tests but not TDD. TDD is "tactical programming pure and simple" — focuses on making tests pass rather than finding the best design; creates abstractions in pieces rather than designing them completely. Exception: write the test first when fixing bugs (the failing test proves the bug existed and the passing test proves it's fixed).

**Design patterns:** Good when they fit; risk is over-application. Not every problem fits an existing pattern; forcing a pattern onto a problem that doesn't fit creates complexity.

**Getters and setters:** Expose instance variables, violating information hiding; are shallow methods; add interface clutter. Better to avoid exposing implementation data entirely. If exposure is necessary, getter/setter at least provides extensibility without changing the interface. The Java cultural norm of universal getter/setter usage is an example of a pattern taken too far.

### Chapter 20 — Designing for Performance

Clean design and high performance are compatible — the chapter demonstrates a refactoring of the RAMCloud Buffer class that achieved 2× speedup while reducing code by 20%.

**Strategy:** Develop awareness of fundamentally expensive operations (network round-trip: 10–50µs; disk I/O: 5–10ms; dynamic memory allocation; cache misses from DRAM). Choose designs that avoid these by default. Simpler code tends to run faster: no code for eliminated special cases; deep modules reduce layer crossings.

**Two anti-patterns to avoid:** premature micro-optimisation (slows development, adds complexity, rarely helps); completely ignoring performance ("death by a thousand cuts" — 5–10× slowdown with no single fix).

**When performance matters:** measure first (programmer intuitions are unreliable); identify the specific slow paths, not just overall performance; measure after changes to verify improvement — revert if no measurable gain.

**Design around the critical path:** identify the minimum code that must execute in the common case; eliminate special-case checks from the critical path (combine multiple conditions into a single test at the start); aim for fundamental fixes (caches, algorithms) before micro-optimisation. The ideal: single test at the start, then the critical path executes without further branching.

### Chapter 21 — Decide What Matters

The unifying principle behind everything in the book: structure software systems around the things that matter; hide and minimise things that don't.

**This is what abstractions do:** interface exposes what matters to callers; implementation hides what doesn't. Naming: choose words that convey the most information. Performance: design structure around the critical path.

**How to identify what matters:** look for leverage — one solution that solves many problems, one piece of information that makes many other things easy to understand. General-purpose interfaces provide more leverage than special-purpose ones.

**Minimise what matters:** reduce parameters; provide defaults; handle exceptions at low levels so they don't propagate; compute configuration automatically.

**Emphasise what matters:** prominence (interface documentation, names, method parameters); repetition (key ideas appear repeatedly); centrality (the things that matter most determine the structure of everything around them).

**Two mistakes:** (1) treating too many things as important — adds complexity and cognitive load; shallow classes result from over-exposure; (2) failing to recognise something important — hidden information that should be visible; unknown unknowns.

"Good taste" = the ability to distinguish what matters from what doesn't.

### Chapter 22 — Conclusion

> "This book is about one thing: complexity. Dealing with complexity is the most important challenge in software design."

The book's 16 design principles (from the end matter):
1. Complexity is incremental: sweat the small stuff
2. Working code isn't enough
3. Make continual small investments to improve system design
4. Modules should be deep
5. Interfaces should make the most common usage as simple as possible
6. It's more important for a module to have a simple interface than a simple implementation
7. General-purpose modules are deeper
8. Separate general-purpose and special-purpose code
9. Different layers should have different abstractions
10. Pull complexity downward
11. Define errors out of existence
12. Design it twice
13. Comments should describe things not obvious from the code
14. Software should be designed for ease of reading, not ease of writing
15. The increments of software development should be abstractions, not features
16. Separate what matters from what doesn't matter and emphasise the things that matter

The book's Red Flags (from the end matter): Shallow Module, Information Leakage, Temporal Decomposition, Overexposure, Pass-Through Method, Repetition, Special-General Mixture, Conjoined Methods, Comment Repeats Code, Implementation Documentation Contaminates Interface, Vague Name, Hard to Pick Name, Hard to Describe, Nonobvious Code.

## Related Pages

- [[concepts/software-complexity]] — Ousterhout's full complexity definition, symptoms, and causes (ch. 2)
- [[concepts/modularity]] — deep vs shallow modules, information hiding at the module level (ch. 4–5)
- [[concepts/cognitive-load]] — Ousterhout: cognitive load as a symptom of complexity; one of three complexity manifestations
- [[concepts/coupling]] — Ousterhout: dependencies as a cause of complexity; information hiding as the mitigation

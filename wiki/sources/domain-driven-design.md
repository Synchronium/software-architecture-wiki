---
title: "Domain-Driven Design: Tackling Complexity in the Heart of Software"
type: source
tags: [ddd, domain-model, ubiquitous-language, strategic-design, tactical-design]
sources: [domain-driven-design]
created: 2026-05-14
updated: 2026-05-14
---

# Domain-Driven Design: Tackling Complexity in the Heart of Software

**Author:** [[authors/eric-evans]]
**Published:** 2003
**Slug:** `domain-driven-design`

## Overview

Domain-Driven Design is the foundational text for a discipline that treats the domain model as the central artifact of software development. Evans argues that the real challenge in complex software is not technical but cognitive: developers must deeply understand the domain they are modelling, and that understanding must be expressed directly in the code, not in a separate layer of documentation. The book introduced the concepts of ubiquitous language, bounded contexts, aggregates, and strategic design that underpin most modern thinking about domain modelling and microservices.

The book is structured in four parts: Part I establishes the core thesis (model, language, implementation must be unified); Part II covers the building blocks of model-driven design (entities, value objects, aggregates, repositories, domain services); Part III addresses how to deepen a model through refactoring, analysis patterns, and design patterns; Part IV covers strategic design (bounded contexts, distillation, large-scale structure).

Where [[sources/learning-domain-driven-design]] (Khononov, 2021) provides a more systematic and accessible treatment aimed at practitioners, Evans' original is exploratory and narrative — it argues from first principles through extended examples, particularly a cargo shipping system that runs through much of the book.

## Key Claims

- The domain model and the implementation must be bound together; a model that does not directly shape code is not the model (→ ch. 1, ch. 3)
- Analysis models and design models are a failure mode: they diverge, and the knowledge encoded in the analysis model is lost when coding begins (→ ch. 3)
- Programmers are modellers whether anyone likes it or not; separating modelling and programming roles produces ivory-tower architects and model-ignorant code (→ ch. 3)
- Domain code must be isolated in its own layer; mixing it with UI, persistence, and infrastructure makes it invisible and unmaintainable (→ ch. 4)
- The Smart UI is a legitimate pattern for simple, low-complexity applications but is incompatible with DDD and has no migration path to layered architecture (→ ch. 4)
- A ubiquitous language, shared by developers and domain experts, must pervade all communication — code, tests, diagrams, and conversation; any divergence is a signal of model weakness (→ ch. 2)
- Knowledge crunching is a continuous, collaborative activity between developers and domain experts — not a one-time requirements-gathering phase (→ ch. 1)
- Useful models seldom lie on the surface; superficial noun-finding is the starting point, not the destination (→ ch. 1)
- A model is not a diagram; diagrams are communication tools, not specifications (→ ch. 2)
- Documents that are not expressed in the ubiquitous language are obsolete (→ ch. 2)
- Whether an object is an entity or a value object depends on context, not on the object itself — an address is a VO for a mail-order company, an entity for a postal service (→ ch. 5)
- Aggregates are the consistency boundary: all invariants of a cluster of objects must be enforced atomically; external objects hold references only to the aggregate root (→ ch. 6)
- Factories and repositories have complementary responsibilities: factories create new objects; repositories find and reconstitute existing ones (→ ch. 6)

## Chapter Notes

### Chapter 17 — Bringing the Strategy Together

The synthesis chapter ties together CONTEXT MAP, distillation (CORE DOMAIN), and large-scale structure as three complementary strategic tools.

**The three tools are not substitutes**: a CONTEXT MAP manages model integrity across bounded contexts; distillation focuses resources on the CORE; large-scale structure provides a comprehension vocabulary for the system as a whole. Each addresses a different dimension of complexity.

**Combining structures and context maps**: a large-scale structure can exist within one BOUNDED CONTEXT or span the entire CONTEXT MAP. The same layer terminology can be applied within a CONTEXT's model and across the global context map simultaneously. Legacy systems can be characterised by which layers their SERVICES cover rather than requiring structural change.

**Combining structures and distillation**: the large-scale structure helps show where the CORE DOMAIN and GENERIC SUBDOMAINS sit relative to each other. The structure may itself be part of the CORE DOMAIN — if the layering of potential, operations, policy, and decision support captures a fundamental insight about the business problem, that layering *is* domain knowledge.

**Assessment first**: before designing strategy, assess current reality: Can you draw a consistent CONTEXT MAP? Is the UL rich enough? Is the CORE DOMAIN identified? Does technology support MODEL-DRIVEN DESIGN? Do developers have necessary skills and domain interest?

**Who sets the strategy**: two patterns — (1) emergent structure from application development (XP model: informal leaders, piecemeal growth); (2) customer-focused architecture team (collaborating peer, not ivory tower, feedback-driven, hands-on). Six essentials: decisions reach everyone, process absorbs feedback, plan allows evolution, architecture teams don't siphon the best talent, minimalism and humility, developers are generalists.

**Beware the Master Plan**: Christopher Alexander's critique of master plans — too rigid for natural change, too imprecise about local connections. Applies to software: a set of principles for piecemeal growth produces organic order; a master plan produces totalitarian order.

**Epilogue and "Looking Forward"**: five project postmortems showing that supple design facilitates long-term evolution. Key observation: "The success of a design is not necessarily marked by its stasis. A deep model allows clear vision that can yield new insight, while a supple design facilitates ongoing change." The Evant case: four developers with a supple design delivered a major scaling capability that saved the company.

### Chapter 16 — Large-Scale Structure

The chapter introduces LARGE-SCALE STRUCTURE as an optional organising principle for systems too large to grasp from BOUNDED CONTEXTS and distillation alone. See [[concepts/large-scale-structure]] for detailed treatment.

**Motivating problem**: even well-modularised systems have many packages with unclear relationships. Individual developers make locally reasonable but globally inconsistent decisions. Specialists in different MODULES cannot help each other. CI breaks down.

**EVOLVING ORDER**: do not impose large-scale structure up-front. Let it evolve with the application. An ill-fitting structure is worse than none. Less is more.

**Four patterns**:
1. *SYSTEM METAPHOR*: a concrete analogy (e.g., "firewall") that shapes the entire design. Useful when a genuine metaphor presents itself; dangerous when forced. "Naive metaphor" (XP's alternate name for the domain model) should be retired.
2. *RESPONSIBILITY LAYERS*: partition domain objects by broad responsibility. Layers tell the story of domain priorities. Dependencies flow downward only. Common vocabulary: Potential/Capability → Operations → Decision Support → Policy → Commitment. Keep to 4–5 layers.
3. *KNOWLEDGE LEVEL*: a meta-level group of objects that constrains how operations-level objects may be configured. Application of REFLECTION pattern to the domain layer. Bidirectional dependencies between levels. Used for configurable behaviour (e.g., employee types and payroll plans). Use sparingly.
4. *PLUGGABLE COMPONENT FRAMEWORK*: distil ABSTRACT CORE interfaces; allow diverse implementations to substitute freely. Most mature and most restrictive pattern. Requires deep model and multiple prior applications. Downside: freezes CORE refactoring.

**Refactoring toward a fitting structure**: minimalism; communication and self-discipline (structure enters the UL); repeatedly restructured designs become supple ("leather jacket" analogy); distillation reduces the mass to restructure.

### Chapter 15 — Distillation

Distillation separates the CORE DOMAIN from the mass of supporting complexity. See [[concepts/core-domain]] for detailed treatment.

**CORE DOMAIN**: the distinctive part of the model that differentiates the application and justifies the investment. Must be kept small. Apply top talent. Assign the deepest models and most supple designs here.

**Who does the work**: long-term developers accumulating domain knowledge matched with domain experts who know the business deeply. External expertise in a teaching/mentoring role is valuable. The CORE DOMAIN cannot be purchased and can rarely be outsourced — it requires accumulated understanding.

**An escalation of distillation techniques** (lightest to most ambitious):
1. DOMAIN VISION STATEMENT — one-page description of CORE value; revised as insight deepens
2. HIGHLIGHTED CORE — distillation document (3–7 pages) or flagged CORE in the model repository
3. GENERIC SUBDOMAINS — factor out, lower priority, consider off-the-shelf/published/outsourced
4. COHESIVE MECHANISMS — extract conceptually coherent computation into lightweight frameworks; "A model proposes; a COHESIVE MECHANISM disposes"
5. SEGREGATED CORE — code-level separation: move CORE classes into named MODULES
6. ABSTRACT CORE — polymorphic interfaces for fundamental CORE concepts

**Generic subdomains**: four implementation options (off-the-shelf, published model, outsourced, in-house). Generic doesn't mean reusable. Start first iterations on CORE, not supporting subdomains.

**Choosing refactoring targets**: pain-driven? Check if root is in CORE or CORE-to-supporting relationship. Refactoring freely? Focus on CORE first.

### Chapter 14 — Maintaining Model Integrity

The chapter opens Part IV (Strategic Design) with the core problem: large systems inevitably contain multiple models, and without explicit mechanisms, they blur and corrupt each other. The answer is to make boundaries explicit and manage them deliberately.

**BOUNDED CONTEXT**: the scope within which a model is consistently defined. Every model applies within a specific context; the same term can legitimately mean different things in different contexts. Two problems when contexts blur: *duplicate concepts* (the same idea represented separately with no coordination — rounding error divergence) and *false cognates* (the same word meaning different things in different models — silent mismatch).

**CONTINUOUS INTEGRATION**: the practice that keeps a BOUNDED CONTEXT internally unified. Operates at two levels: (1) frequent merging and testing of code to prevent long-lived divergent branches; (2) exercising the UBIQUITOUS LANGUAGE in discussion, so conceptual divergence is noticed and corrected. "Continuously merge the code and often exercise the domain model to make sure the model concept is still interpreted consistently."

**CONTEXT MAP**: a global overview of all models in the system and their integration relationships. Serves two purposes: (1) shows developers exactly where they stand (which context am I in?); (2) exposes integration strategies at the team level. The map names enter the UBIQUITOUS LANGUAGE. Must be kept current and shared across all teams. Map current reality, not the aspirational future.

Integration patterns (all addressed individually in this chapter):

- **SHARED KERNEL**: two or more contexts share a subset of the model explicitly. Both teams must pass integration tests on the shared code before committing changes to it.
- **CUSTOMER/SUPPLIER DEVELOPMENT TEAMS**: explicit upstream–downstream relationship; downstream plays customer role in planning; automated acceptance tests run in the upstream's suite.
- **CONFORMIST**: downstream slavishly adopts upstream model; eliminates translation complexity. Underused — emotionally unappealing but genuinely appropriate when the cost of translation exceeds the benefit of model independence.
- **ANTICORRUPTION LAYER**: the downstream builds a translation layer using FACADE and ADAPTER patterns. The FACADE belongs to the other system's context; the ADAPTER speaks the ACL's language. Public interface is expressed as SERVICES. Can be bidirectional. Great Wall cautionary tale: the ACL was hidden inside the UI layer, invisible to the architecture; when the upstream model changed, the hidden coupling was exposed.
- **SEPARATE WAYS**: no integration. Ruthlessly scope requirements to eliminate the integration need. Forecloses future merging — use only when the cost of integration genuinely exceeds the value.
- **OPEN HOST SERVICE**: publish a protocol (not internal structure) for integrators to use. One-off translators for idiosyncratic consumers. Decouples internal evolution from external consumers.
- **PUBLISHED LANGUAGE**: a well-documented, stable interchange language independent of either system's internal model. Contemporary example: XML/DTD schemas. CML (Chemical Markup Language) as example of how a published language unlocks ecosystem tooling.

**Choosing your context strategy**: the key tension is between larger and smaller contexts. Larger: smoother integration, shared language, simpler mental model. Smaller: less CI overhead, smaller teams, specialised models. Generally one team per BOUNDED CONTEXT; one team can manage multiple contexts but multiple teams cannot effectively share one.

**Transformations** (step-by-step guides for changing context structure):
- *Separate Ways → Shared Kernel*: start with a small, non-critical shared subdomain; establish the process (at least weekly integration, test suite) before sharing any code; iterate.
- *Shared Kernel → Continuous Integration*: circulate team members, harmonise CI practices, distil each model first, then merge the core domain — quickly, as this phase has high overhead.
- *Phasing out a legacy system*: iteratively migrate functionality, unit-by-unit; maintain ACL during transition; shrink ACL as legacy usage reduces.
- *Open Host Service → Published Language*: if no industry standard exists, use the CORE DOMAIN as the basis for the interchange language.

**The elephant parable**: multiple groups (teams) touching an elephant (domain) from different sides may have different, partially valid models. Recognising you have different models — and drawing BOUNDED CONTEXT boundaries — is more valuable than pretending they are unified. Unification almost always requires a new model; minimalism (stripping incorrect features) matters more than comprehensiveness.

### Chapter 13 — Refactoring Toward Deeper Insight

The chapter addresses what enables breakthroughs (ch. 8): not heroic events but a continuous, disciplined orientation toward finding deeper models.

**Three practices for deepening the model**:

1. *Live in the domain*: continuous, sustained immersion. Maintain the UBIQUITOUS LANGUAGE in daily conversation, not just in design sessions. Domain experts should be in ongoing dialog, not consulted at the start of a project and then forgotten.

2. *Keep looking at things a different way*: don't become anchored to your existing model. Try different framings of the same problem. Challenge your own abstractions. The habit of looking from a different angle is more productive than trying to manufacture insights.

3. *Maintain an uninterrupted dialog with domain experts*: the developer must make domain expertise accessible. New domain terminology heard in conversation = potential model gap. Terms corrected diplomatically by an expert = signal of model misalignment.

**Exploration teams**: ad hoc 3–5 person sessions involving mixed developer-expert groups. Two to three short meetings (not long) spaced over days rather than one marathon. The goal is to exercise the UL, probe concepts, and test model options — not to produce a final design. These sessions are brainstorming: work in bursts.

**When to refactor**: refactor toward deeper insight when:
- The design does not express your current understanding of the domain
- A concept in domain discussion has no corresponding code element
- There is an opportunity for suppleness (patterns from ch. 10) that isn't being exploited
- Do not wait for complete justification — the cost of delay compounds

**Timing and difficulty**: the crisis that causes a refactoring is an opportunity, not a failure. Punctuated equilibrium model: most refactoring is incremental; breakthroughs produce large leaps but require the accumulated foundation of incremental work. The three-part skill: (1) recognise a significant design move; (2) commit the resources; (3) execute the refactoring without destabilising the project.

**Prior art**:
- *Domain literature*: books in the field contain distilled models. Reading even casually surfaces vocabulary and concepts that match domain expert experience.
- *Analysis patterns* (ch. 11): Fowler's patterns are a catalogue of recurring model structures from real-world projects.
- *GoF design patterns applied at the domain level* (ch. 12): STRATEGY as Policy, COMPOSITE for genuine part-whole hierarchies.
- *Formal systems*: existing formal notations for the domain can provide unambiguous vocabulary.

### Chapter 3 — Binding Model and Implementation

The chapter introduces **MODEL-DRIVEN DESIGN** as the central pattern of DDD: there is one model, and it is directly expressed in the code. The traditional alternative — an analysis model created before implementation, then translated into a design — fails for two reasons: (1) crucial discoveries always emerge during implementation, which the pure analysis phase misses; (2) once the model diverges from the code, maintaining any mapping between them becomes impractical, and the model is abandoned.

Evans opens with two cautionary tales: a project that had a detailed, domain-expert-approved model on the wall but an ad hoc implementation that bore no relationship to it; and a legacy rewrite that similarly ended up bloated and model-less despite different origins. The end products were indistinguishable.

**Model-Driven Design prescription**: design the software to reflect the domain model in a literal way. Revisit the model to make it more naturally implementable while also making it reflect deeper domain insight. One model serves both analytical and design purposes. Changing code changes the model — its effects must ripple through the project accordingly.

**Modelling paradigm matters**: OOP is the dominant paradigm that supports MODEL-DRIVEN DESIGN because objects directly correspond to domain concepts. Procedural languages like C can't support it at the same level because there is no conceptual mapping from procedures to domain ideas.

**PCB bus example**: a procedural script approach (parse files, sort by name convention, insert rules) encodes the concept of "bus" only implicitly, through naming conventions and sort order. A model-driven approach creates explicit `Bus` and `Net` objects with an `assignedRules()` method — the concept is in the code, not in the procedure.

**Letting the bones show**: the user model and the implementation model should be the same, or the user is misled. The IE Favorites example: Favorites are actually files, but the UI presents them as a named list — characters illegal in filenames produce confusing error messages about "filenames" the user doesn't know about. Eliminating the misleading UI model and exposing the file-based model would be cleaner and more powerful.

**Hands-On Modelers**: programmers are modelers whether anyone likes it or not. Separating the modeler role from the programmer role produces ivory-tower architects whose insights never fully translate into code. Modelers who don't write code lose touch with implementation constraints; programmers who don't model refactor in ways that weaken the model. Every technical person must be involved in the model at some level.

### Chapter 4 — Isolating the Domain

Introduces LAYERED ARCHITECTURE as the structural prerequisite for MODEL-DRIVEN DESIGN. The key insight: domain code constitutes a small proportion of a software system but is disproportionately important. Mixing domain logic with UI, persistence, and infrastructure makes it invisible and fragile.

**Four layers**:
1. **User Interface (Presentation)**: shows information, interprets commands
2. **Application**: thin layer; coordinates domain objects; no business rules; task-oriented
3. **Domain (Model)**: the heart of the software; business concepts, rules, and state; this is where the model lives
4. **Infrastructure**: technical capabilities (persistence, messaging, UI widgets); no knowledge of the domain it serves

Only the domain layer is mandatory for DDD; the exact structure of other layers can vary.

**Smart UI anti-pattern**: for simple applications with unsophisticated teams, deliberately embedding all business logic in the UI (Smart UI) can be practical — fast delivery, low overhead, simple maintenance. But it is incompatible with MODEL-DRIVEN DESIGN. There is no migration path from Smart UI to layered architecture — you must replace the application entirely. The choice must be made at the outset.

**Transaction Script** (Fowler): a middle path — separates UI from application but has no domain model. Limited complexity ceiling; not DDD, but not Smart UI either.

**Frameworks**: architectural frameworks should be used selectively to solve difficult problems; using all features of an intrusive framework can straitjacket domain design. Use the minimum framework needed to keep domain objects readable and expressive.

### Chapter 11 — Applying Analysis Patterns

Analysis patterns (Fowler 1997) are "groups of concepts that represent a common construction in business modelling." They are not off-the-shelf solutions — they provide starting points, vocabulary, and guidance on implementation consequences that would otherwise require expensive trial and error to discover.

**How to use them**: draw on analysis patterns as seeds for exploration, not as blueprints. Adapt liberally to your specific domain. Depart from the structural details when needed, but preserve the conceptual essence. Most importantly, preserve the *names* — if your model definitions evolve, update the names too, because the pattern vocabulary enriches the ubiquitous language.

**Example — Account model**: Fowler's Account pattern (Account → Entries → balance) applied to the interest-tracking application. Entries are immutable history records; balance is derived or cached. The pattern suggested separating accruals from payments cleanly, which became the breakthrough insight in ch. 9–10. The developers also explored Posting Rules (make cross-account dependencies explicit as named objects with defined firing modes — eager, account-based, posting-rule-based), which provided vocabulary for the nightly batch design. The final implementations departed from Fowler's details but preserved the essential concepts.

**Analysis patterns vs framework/component reuse**: analysis patterns are conceptual kits of model fragments, not code to copy. Their value is in the reasoning behind the model choices and the forewarning about downstream implementation consequences — experience carried from projects where the pattern was discovered the hard way.

### Chapter 12 — Relating Design Patterns to the Model

GoF design patterns (Gamma et al. 1995) are motivated by technical problems. Some of them also correspond to genuine domain concepts — in those cases, the pattern can be applied at two levels simultaneously: as a technical design and as a conceptual model. These become *domain patterns*.

**STRATEGY (a.k.a. Policy)**: when the varying part of a process corresponds to a real business strategy or policy, factor it into an explicit STRATEGY object. The Routing Service example: `LegMagnitudePolicy` makes the concept of a routing policy explicit, gives it a name in the ubiquitous language, and makes the Routing Service unconditionally apply the policy. New policies (fastest, cheapest, prefer own transports) can be added without touching the service. The key shift from the GoF framing: the motivation is to *express a concept* (a domain policy), not just to substitute algorithms.

**COMPOSITE**: appropriate in the domain only when the domain genuinely has a part-whole hierarchy where parts are conceptually the same kind of thing as the whole. The Route example: a route is a movement from point to point; legs are movements from point to point; sub-routes are movements from point to point. Each level is genuinely a Route, so COMPOSITE fits the domain, not just the code structure.

**FLYWEIGHT**: a purely technical implementation choice for VALUE OBJECTS when there are many identical instances. It has no correspondence to the domain model — it's about memory efficiency, not domain concepts. Contrast with COMPOSITE, which expresses a domain relationship.

**The test for applying a GoF pattern in the domain**: does this pattern say something about the conceptual domain, or only about the technical solution? If the former, apply it — and let it enrich both design and model. If only the latter, apply it in the implementation layer but don't let it shape the model.

### Chapter 9 — Making Implicit Concepts Explicit

The chapter asks: how do you actually find the deeper model? The answer is to recognise implicit concepts — ideas hinted at in discussion, lurking in awkward code, or buried in contradictions — and make them explicit in the model and design.

**Four discovery techniques:**
1. *Listen to language*: if domain experts use terms that don't appear in the code, those terms are missing model concepts. Terms corrected diplomatically by experts, or terms that produce visible relief when the developer uses them, are strong signals. This is not "nouns are objects" — it requires follow-up knowledge crunching.
2. *Scrutinise awkwardness*: the most complicated part of the design, the place where every new requirement adds complexity, is where a missing concept is hiding. The accrual example: the complex interest calculation cleared up when "accrual" was made explicit, decoupling accrual from payment and matching domain expert vocabulary.
3. *Contemplate contradictions*: two expert statements that seem inconsistent can reveal a deeper model. The Galileo/inertial-frame analogy: reconciling the contradiction reveals how nature works. Most domain contradictions aren't that profound, but the same pattern helps.
4. *Read the book*: domain literature contains distilled models. Even without a collaborative expert, reading an accounting textbook gave the developer the concept of "accrual basis accounting" — not an off-the-shelf solution, but a cleaner starting point.

**Three categories of implicit concepts to model explicitly:**

*Explicit constraints*: constraints often emerge as implicit guard clauses on entity methods. When a constraint requires data that doesn't fit the host object, appears in multiple objects, or is prominent in domain discussions but hidden in procedural code, factor it into a named method or a separate object. Example: OverbookingPolicy as an explicit object (from ch. 1), not a guard clause in application code.

*Processes as domain objects*: if a process is something domain experts talk about, it belongs in the model — as a SERVICE if there's one way to carry it out, or as a STRATEGY object if there are multiple algorithms. The routing process in the shipping model is a domain concept, not a technical mechanism.

*Specification*: see [[patterns/specification]]. A predicate VALUE OBJECT that tests whether another object satisfies stated criteria. Three uses: validation (test an individual object), selection/querying (filter a collection or generate a database query), building to order (specify what a generator must produce). Specification keeps rules in the domain layer and works with REPOSITORIES via the `selectSatisfying(InvoiceSpecification)` pattern.

### Chapter 10 — Supple Design

Supple design is design that is a pleasure to work with and inviting to change. It is the complement to deep modelling: a deep model provides the raw material; a supple design shapes it so clients can use it naturally and so it bends where it needs to bend.

Six patterns for supple design (see [[concepts/supple-design]]):

1. **Intention-Revealing Interfaces**: name classes and operations to describe effect and purpose, not mechanism. Write a test first to force client-developer thinking. Every public element is an opportunity to communicate intent.

2. **Side-Effect-Free Functions**: keep commands (state modifiers) and queries (computations) strictly segregated. Move complex logic into VALUE OBJECTS, whose immutability means all their operations are side-effect-free. Paint mixing example: extract `PigmentColor` VALUE OBJECT; `mixedWith()` returns a new colour without modifying anything.

3. **Assertions**: state post-conditions and invariants explicitly — in the language if supported, in unit tests otherwise. Makes side effects tractable without requiring developers to trace implementation.

4. **Conceptual Contours**: decompose along the natural joints of the domain, not arbitrary size or technical convenience. Ask "does this decomposition echo a contour of the underlying domain?" When successive refactorings are localized, the contours are right. When changes ripple widely, the model is misaligned.

5. **Standalone Classes**: eliminate every non-essential dependency. Every added dependency — explicit reference or implicit concept — increases cognitive load. The `PigmentColor` class can be understood entirely alone.

6. **Closure of Operations**: define operations whose return type matches the type of the receiver or argument. Closed operations introduce no new concepts. SharePie: `plus(SharePie)→SharePie`, `minus(SharePie)→SharePie`, `prorated(double)→SharePie`. Most natural on VALUE OBJECTS (entities are not usually results of computation).

**Shares Math** (extended example): applies all six patterns together. SharePie as an immutable VALUE OBJECT with closed operations allows complex loan distribution logic to be expressed declaratively. `shares.minus(payment)`, `shares.prorated(amount)` — code that reads like a conceptual definition of the transaction.

**Declarative style**: a design with intention-revealing interfaces, side-effect-free functions, and assertions naturally produces declarative client code. Full declarative design (code generation, rule engines) is harder — narrowly scoped frameworks that automate tedious parts (persistence, mapping) tend to deliver value; sweeping frameworks tend to constrain design.

**Extended Specification** (composite): Specifications can be combined with AND/OR/NOT to form complex rules from simple ones. Composite Specification closes the set of Specifications under logical operators. Subsumption (does Spec A imply Spec B?) enables requirements comparison — "which chemicals now have more stringent handling requirements?"

### Chapter 7 — Using the Language: An Extended Example

Walks through building a MODEL-DRIVEN DESIGN for a cargo shipping system, applying the Part II building blocks in combination. The primary value is seeing the design decisions in context rather than in isolation.

**Entity/VO classification applied**: Customer = Entity (existing ID from customer DB); Cargo = Entity (tracking ID auto-generated); HandlingEvent = Entity (identified by Cargo ID + completion time + type); Location = Entity (arbitrary internal ID); DeliveryHistory = Entity but identity derived from Cargo (owns it); DeliverySpecification = VO (hypothetical goal state, shareable); Role = VO (qualifies associations, no history).

**Association design**: constrain bidirectional associations to unidirectional where domain understanding supports it. Customer → Cargo direction dropped (cumbersome for repeat customers; use repository query instead). HandlingEvent → CarrierMovement retained (not the reverse, because business tracks cargo not carrier inventory). One circular reference (Cargo ↔ DeliveryHistory ↔ HandlingEvent) handled by replacing the collection with a database query — removes contention on the Cargo aggregate.

**Aggregate boundaries**: Customer, Location, CarrierMovement = roots of their own aggregates. Cargo = root with DeliveryHistory inside its boundary. HandlingEvent = root of its own aggregate (because it has meaning apart from any particular Cargo). No repository for HandlingEvent initially — added only when the application needs it.

**Repository selection by application requirement**: only aggregate roots that need direct application-level access get repositories. Four repositories initially: Customer, Location, CarrierMovement, Cargo. HandlingEvent repository added later when access pattern demands it.

**Anticorruption Layer (introduced)**: when integrating with the Sales Management System, Evans introduces the ACL pattern (covered in depth in ch. 14): create a class whose job is to translate between the external model and our domain. Named `AllocationChecker`, not `SalesManagementInterface` — the name reflects *our* domain responsibility. This prevents the external model from leaking into and corrupting our domain design.

**Enterprise Segment**: a VALUE OBJECT that models how the business categorises cargo for yield management. Illustrates that enriching the domain model can clean up an integration problem rather than hardcoding it in application logic.

**Modules**: shows the contrast between partitioning by pattern (aggregates module, services module, repositories module) versus partitioning by domain concept (customers, operations, billing). The former has high coupling, low cohesion, and tells the story of what the developer was reading — not the story of the business.

### Chapter 8 — Breakthrough

A first-person account of a breakthrough on a loan syndication system. The chapter's purpose is to describe what a breakthrough feels like, how to recognise it, and how to respond.

**The context**: a syndicated loan application, 4 months into development. The model assumed that each lender's share of a Loan was proportional to their share of the Facility. Complexity kept growing; subtle rounding errors couldn't be eliminated; requirements kept complicating the design.

**The breakthrough insight**: Loan shares and Facility shares are *independent*. They are both special cases of a general concept — **shares** — which can apply to any divisible value. The abstraction was named Share Pie. With this insight, the LoanAdjustment object became unnecessary; the LoanInvestment object (which domain experts never understood) disappeared; complex rounding logic stabilised; and domain experts immediately recognised the model.

**Aftermath**: the model had to be substantially refactored under time pressure. The project manager asked four questions (how long to rework? can we avoid it? will it slow future releases? do we think it's right?) and made the call to proceed. Three weeks of intensive work; then clarity.

**A cascade of insights**: a breakthrough typically leads to another. With the clearer model, a missing entity — a financial Transaction — became visible. The implicit concept was made explicit, and the model deepened further. Development accelerated.

**Guidance**:
- Breakthroughs are events, not techniques. You cannot plan for them.
- Set the stage: knowledge crunching, a robust UL, explicit domain concepts, supple design, model distillation.
- Don't be paralysed trying to manufacture a breakthrough. Make piecemeal improvements continuously.
- When a breakthrough appears, seize it — even if the timing is painful.

### Chapter 5 — A Model Expressed in Software

Covers the tactical building blocks for encoding a domain model in objects: associations, entities, value objects, services, and modules.

**Associations**: every association in the model is a traversal direction in the code. The default — bidirectional — creates maintenance burden. Three rules: (1) constrain traversal to one direction where understanding supports it; (2) add qualifiers to reduce multiplicity (Country→President becomes Country→currentPresident); (3) eliminate non-essential associations entirely. Bidirectional associations between value objects make no sense.

**Entities (Reference Objects)**: defined by identity continuity, not attributes. Two persons with the same name are not the same person. Identity operations (sameness, uniqueness) must be explicit and domain-meaningful — not technical surrogates. Key question: does this object need to be found, or tracked over time? If so, it's an Entity. Example: assigned seating (entities — specific seats matter) vs general admission (no identity needed).

**Value Objects**: objects that describe things but carry no conceptual identity. Two $5 bills are interchangeable. Value objects should be **immutable**; business operations return new value objects rather than mutating existing ones. Design question — copying vs sharing: if many objects share a reference to a value object and one 'changes' it (i.e., replaces its reference), does that affect the others? Immutability eliminates this concern entirely. Address example: is an address an entity or a value object? Depends on context — for a mail-order company it's a VO (attribute of a person); for a postal service tracking deliveries it's an entity.

**Services**: stateless domain operations that have no natural home in an entity or value object. Three characteristics: (1) the operation relates to a domain concept not natural to an entity or VO; (2) the interface is defined in terms of other domain model elements; (3) the operation is stateless. Services partition into three layers: *application services* (coordinate tasks, no domain rules), *domain services* (business logic crossing aggregate boundaries), *infrastructure services* (technical capabilities). Funds transfer example: a `transferFunds(amount, sourceAccount, destinationAccount)` operation doesn't belong to either account — it belongs to a `FundsTransferService`.

**Modules (Packages)**: cognitive chunking tools that are part of the model, not just a filing mechanism. Modules carry the same low-coupling/high-cohesion obligation as objects, but at the concept level — not just technical metrics. Module names enter the ubiquitous language. Infrastructure-driven packaging pitfalls: the J2EE 4-tier packaging convention (beans/, actions/, web/, dao/) splits a single domain concept (e.g., Loan) across four packages → anemic domain model, low cohesion.

### Chapter 6 — The Life Cycle of a Domain Object

**Aggregates**: a cluster of associated objects treated as a unit for data changes. Every aggregate has a root entity (the only member the outside world holds references to) and a boundary (what is inside). Seven implementation rules:
1. The root has global identity; internal entities have local identity (unique only within the aggregate).
2. External objects hold references only to the root.
3. Only the root can be fetched directly with a database query.
4. Objects inside may hold references to other aggregate roots.
5. A delete operation removes everything in the boundary.
6. When an object inside is changed, all invariants of the whole aggregate must be satisfied.
7. Objects can only be modified through the root — they are not accessible directly.

Purchase order locking example: if PO line items could be locked and modified independently, two users could each modify different items and simultaneously push the PO total over its approved limit. The invariant (total ≤ approved limit) can only be enforced by locking the whole aggregate, not individual items.

**Factories**: encapsulate complex object creation. A factory should: (1) be an atomic operation that produces a complete, consistent object; (2) abstract to the type being created (not the concrete implementation); (3) enforce all invariants during construction. Three placement options: factory method on an aggregate root (natural when creation belongs to the root's responsibility), standalone factory (when no natural host exists), reconstitution factory (restores stored objects — does NOT assign new identity, applies all invariants). Entity factory vs value object factory: entity factories need to handle identity (assign new, or use existing for reconstitution); VO factories just return the right value.

**Repositories**: provide the illusion of an in-memory collection of all objects of a given type. Only aggregate roots that need direct access should have repositories (not every entity). Two query approaches: hard-coded queries for common cases; Specification-based queries for flexible criteria. Key principles: client ignores implementation details (the repository handles the translation); but the developer must understand the implementation (to avoid writing inefficient queries the repository silently translates into table scans); transaction control is left to the client. Relationship to factories: a factory creates *new* objects; a repository finds *existing* objects. Reconstitution from the database is a factory responsibility delegated from the repository.

**Designing objects for relational databases**: keep the object model and the relational model as close as possible — the impedance mismatch is a real cost. Avoid the temptation to design the relational schema and the objects independently and then patch them together with a translation layer.

### Chapter 1 — Crunching Knowledge

The chapter opens with Evans' account of building a PCB design tool without prior domain knowledge, and uses this to illustrate knowledge crunching — the iterative, collaborative distillation of domain knowledge into a working model.

Five ingredients of effective modelling:
1. **Binding the model and the implementation**: an early prototype forges the essential link; the model and code co-evolve
2. **Cultivating a language based on the model**: domain experts and developers must share the same vocabulary derived from the model
3. **Developing a knowledge-rich model**: objects carry behaviour and enforce rules; the model is not a data schema
4. **Distilling the model**: concepts are added and dropped as understanding deepens; important but irrelevant concepts are cut
5. **Brainstorming and experimenting**: language combined with sketches turns discussions into model laboratories

The **waterfall failure**: knowledge trickles in one direction from business to analyst to developer; no feedback, no accumulation. The **iterative failure without abstraction**: features are built without understanding principles; the team never reaches the point where powerful new features emerge as corollaries to older ones.

**Deep models**: surface-level entities (nouns) are just the beginning. Business activities and rules are equally central. The overbooking example demonstrates this: a business policy buried as a guard clause in application code can be surfaced as an explicit `OverbookingPolicy` class. This makes the rule visible to domain experts, closes the feedback loop, and produces a more honest model.

**Continuous learning**: domains are complex; teams always know less than they should. Knowledge leaks when people leave. Explicit knowledge crunching and accumulated shared understanding counteract this.

### Chapter 2 — Communication and the Use of Language

The chapter defines and prescribes the [[concepts/ubiquitous-language]] in detail.

**The language problem on projects**: domain experts have their jargon; developers have their technical vocabulary; neither serves both needs. Without a common language, communication chains require translation at every step — and each translation is lossy. Schisms form silently as team members use the same terms differently without realising it.

**The ubiquitous language as the solution**: the domain model provides the backbone for a language that pervades all team communication. The vocabulary includes class and operation names, terms for explicit rules, names for context maps and large-scale structures, and pattern names. Model relationships form the combinatory grammar of the language.

**Modeling out loud**: spoken language is a powerful but underused tool for refining the model. Experimenting with spoken phrasing catches rough edges quickly. "A Routing Service finds an Itinerary that satisfies a Route Specification" — if you can say it this concisely and precisely, the model is probably good.

**One team, one language**: developers sometimes "shield" domain experts from the model ("too abstract for them"). This is wrong. If sophisticated domain experts can't understand the model, there is something wrong with the model. The linguistic division should be between developers' technical jargon and the UL — never between domain experts and developers.

**Documents and diagrams**:
- UML is useful for small, focused diagrams that anchor discussion; comprehensive object-model diagrams overwhelm and leave out behaviours and constraints
- The model is not the diagram; the diagram is a communication tool
- Documents should complement code and speech, not duplicate them
- A document not written in the current ubiquitous language is already obsolete; if UL terms from a document don't appear in conversation and code, archive it

**Explanatory models**: separate teaching aids for conveying domain context to newcomers. They are deliberately not UML (to avoid confusion with the design model) and are not the authoritative model. They can present the domain in ways that complement the design model without being bound by it.

## Notable Quotes

> "Knowledge crunching is not a solitary activity. A team of developers and domain experts collaborate." (ch. 1)

> "Highly productive teams grow their knowledge consciously, practicing continuous learning." (ch. 1)

> "A change in the UBIQUITOUS LANGUAGE is a change to the model." (ch. 2)

> "The model is not the diagram. The diagram's purpose is to help communicate and explain the model." (ch. 2)

> "If the terms explained in a design document don't start showing up in conversations and code, the document is not fulfilling its purpose." (ch. 2)

## Related Pages

- [[concepts/ubiquitous-language]] — the UL pattern, primary concept from ch. 2
- [[concepts/model-driven-design]] — the binding of model and implementation; one model for analysis and design (ch. 3)
- [[styles/layered-architecture]] — the structural prerequisite for DDD; isolating the domain layer (ch. 4)
- [[concepts/bounded-contexts]] — ch. 14 (strategic design); UL is scoped to a bounded context
- [[concepts/core-domain]] — ch. 15 distillation: CORE DOMAIN, generic subdomains, escalation of distillation techniques
- [[concepts/large-scale-structure]] — ch. 16–17: large-scale structure patterns and strategic synthesis
- [[patterns/domain-model]] — the tactical building blocks (entities, value objects, aggregates) from Part II
- [[patterns/repository]] — the REPOSITORY pattern (ch. 6)
- [[patterns/specification]] — the SPECIFICATION pattern (ch. 9–10)
- [[concepts/supple-design]] — the six supple design patterns (ch. 10)
- [[patterns/context-map]] — bounded context integration patterns (ch. 14)
- [[authors/eric-evans]]
- [[sources/learning-domain-driven-design]] — Khononov's 2021 treatment; more systematic; builds explicitly on Evans

# Activity Log

Append-only record of all wiki activity. Each entry begins with `## [YYYY-MM-DD]` for easy grepping.

## [2026-05-19] lint | Technology glossary expanded

Scanned all wiki pages for tool names not covered in the glossary. Added 23 entries across 6 new sections and 3 existing sections:

- **Observability**: Datadog
- **Databases**: Apache Cassandra, Google Spanner, CockroachDB, Flyway/Liquibase
- **Code Quality**: Context Mapper
- **Message Brokers and Streaming** (new): Apache Kafka, Kafka Streams, Apache Flink, Apache Spark, RabbitMQ, Debezium, Confluent Schema Registry
- **Infrastructure and Orchestration** (new): Docker, Kubernetes, Terraform/Pulumi, Chef/Puppet/Ansible, AWS Lambda
- **Coordination Services** (new): Apache ZooKeeper, etcd
- **Serialization Formats** (new): Protocol Buffers, Apache Avro, Apache Thrift

## [2026-05-19] query | Continuous delivery practices concept page written

Created `concepts/continuous-delivery-practices.md` to surface the Accelerate empirical findings that were only represented in the source page. Covers: five CD principles, the eight CD capabilities, and the non-obvious empirical findings (config-in-VCS more predictive than code, developer-owned tests, trunk-based development definition, loosely coupled architecture as the single largest CD lever). Dedicated section on shift-left security (DevSecOps) and lightweight change approval vs CABs. Wired into `sources/accelerate`, `concepts/four-key-metrics`, and `concepts/deployment-pipelines`.

## [2026-05-19] query | Sync vs async communication comparison + build-vs-buy concept written

Created two new pages to fill synthesis gaps identified after all 19 books were ingested.

**`comparisons/sync-vs-async-communication.md`** — decision guide for synchronous vs asynchronous communication. Frames the choice as a temporal coupling question (Newman). Covers availability chaining risk in sync chains, async concerns (idempotency, ordering, correlation, distributed tracing), the mixed model (sync north-south / async east-west), and a full decision guide. Wired into `concepts/coupling` and `concepts/integration-styles`.

**`concepts/build-vs-buy.md`** — build vs buy vs open-source as an architectural strategy decision. Primary framework is Khononov's subdomain taxonomy (core → build in-house; generic → buy or adopt; supporting → build simple or outsource). Covers hidden costs of buying, the ACL as vendor lock-in mitigant, the platform team as "build once internally" (Team Topologies), and sourcing reversals as subdomain types evolve. Wired into `concepts/bounded-contexts`.

## [2026-05-18] query | Anticorruption Layer pattern page written

Created `patterns/anti-corruption-layer.md`: Evans' FACADE+ADAPTER structure; when to use (core subdomain, messy/legacy upstream, frequent upstream changes); ACL vs Conformist trade-off table; ACL vs Open-Host Service (who carries the translation cost); synchronous vs asynchronous implementation approaches; migration use with Strangler Fig; what the ACL should not absorb (business logic, orchestration, error policy). Linked from context-map, bounded-contexts, and index.

## [2026-05-18] lint | Cross-reference pass — new pages wired in; 1 content gap identified

Findings:
- **4 orphan comparison pages** (zero inbound links from content pages): orchestration-vs-choreography, api-protocol-selection, decomposition-strategy, consistency-model-selection. All four written today and not yet linked from content.
- **timeout/retry low inbound links**: only circuit-breaker linked to them; release-it source and operations pages did not.
- **Content gap**: anti-corruption layer referenced in 4+ pages (bounded-contexts, business-logic-patterns, evolutionary-architecture, context-map) but has no dedicated page.
- **Everything else clean**: no other orphans; architecture-styles-comparison has 17 inbound links; author pages have expected 1-link count from source pages.

Fixes applied (9 files):
- `patterns/saga` → added link to comparisons/orchestration-vs-choreography
- `concepts/api-design` → added link to comparisons/api-protocol-selection
- `distributed/consistency-models` → added link to comparisons/consistency-model-selection
- `styles/microservices-architecture`, `styles/service-based-architecture`, `styles/modular-monolith` → added links to comparisons/decomposition-strategy
- `sources/release-it` → added links to patterns/timeout and patterns/retry
- `operations/availability` → added link to patterns/timeout
- `operations/common-failure-causes` → added links to patterns/timeout and patterns/retry

Remaining gap: anti-corruption layer page (needs user decision to write).

## [2026-05-18] query | Two pattern pages + one comparison page added

Created two missing stability pattern pages and one comparison page:

- `patterns/timeout.md` — every wait must have a limit; sizing by P99.9; absent-timeout gotchas in popular libraries; fail-fast vs timeout distinction; relationship to circuit breaker and retry trio.
- `patterns/retry.md` — transient vs permanent failure distinction; exponential backoff with jitter formula; retry amplification in service chains; idempotency prerequisite; retry queues for async; how timeout/retry/circuit breaker compose.
- `comparisons/consistency-model-selection.md` — decision guide by scenario (locks/uniqueness, financial balances, read-your-own-writes, feeds, shopping carts, counters, config, multi-region); timeliness vs integrity distinction as the first question; read routing as the practical consistency knob; CAP trap warning.

Added cross-references from circuit-breaker.md to timeout and retry. Updated index.md.

## [2026-05-18] query | Three comparison pages drafted

Created three new comparison pages synthesising existing wiki material:

- `comparisons/orchestration-vs-choreography.md` — decision guide covering 6 sources; surfaces Newman's team-ownership heuristic, Bellemare's God Orchestrator anti-pattern, SATH's 8-type taxonomy finding (choreography always adds complexity), and Khononov's saga vs process manager distinction.
- `comparisons/api-protocol-selection.md` — REST vs gRPC vs GraphQL decision table by traffic type; detailed trade-off analysis (caching, schema enforcement, streaming, browser support, evolution); mixing protocols; chatty API anti-pattern.
- `comparisons/decomposition-strategy.md` — how far to decompose; five decision factors; recommended modular monolith → service-based → microservices migration path; Ferrari anti-pattern; granularity disintegrators vs integrators; covers 6 sources.

Updated index.md to include all three pages.

## [2026-05-18] schema-update | British spellings throughout

Converted all US spellings to British across wiki/ (155 files) and overview.md/index.md. Changed: behaviour, organisation, serialise/serialisation, centralise, minimise, maximise, synchronise, optimise, prioritise, standardise, analyse, recognise, characterise, emphasise, generalise, normalise, specialise, utilise, catalogue, defence, favour, colour, neighbour, labour. Serialised LOB pattern name updated accordingly. Added British spellings rule to CLAUDE.md Content Quality Rules.

## [2026-05-18] lint | Cross-reference pass — 9 missing links added

Fixed 9 cross-reference gaps found by link-count audit:

1. `concepts/four-key-metrics.md`: changed plain text "Westrum model" to `[[concepts/westrum-culture|Westrum model]]`
2. `concepts/conways-law.md`: added `[[concepts/westrum-culture]]` to Related Concepts (bidirectional link gap)
3. `concepts/modularity.md`: added `[[concepts/software-complexity]]` to Related Concepts (Ousterhout's deep/shallow module theory discussed throughout but not linked)
4. `distributed/scalability.md`: added `[[distributed/serverless]]` to Related Concepts
5. `styles/layered-architecture.md`: added `[[patterns/mvc-web-presentation]]` and `[[styles/architecture-styles]]` to Related Pages
6. `databases/transactions.md`: added `[[databases/object-relational-mapping]]` to Related Concepts (Unit of Work / Offline Concurrency are ORM behavioural patterns)
7. `patterns/domain-model.md`: added `[[databases/object-relational-mapping]]` to Related Concepts (Data Mapper connection)
8. `distributed/replication.md`: added `[[distributed/control-plane-data-plane]]` wikilink at line 51 where data/control plane split is introduced
9. All 10 style pages: added `[[styles/architecture-styles]]` to Related Pages (navigation hub had no spoke links)

## [2026-05-18] ingest | Accelerate — Ch 13–16 + Appendices + Conclusion (complete)

**Ch. 13–15 (Research Methods):** Latent constructs for measuring unobservable things (culture, satisfaction) through multiple manifest variables; discriminant/convergent validity + internal consistency tests; proactive failure notification split from reactive — independently predictive of delivery performance. Why surveys: speed, breadth, measures things system data can't. Snowball sampling rationale.

**Ch. 16 (Bell & Bell — ING Netherlands):** Tribes/squads/chapters structure (independently arrived at, not copied). Obeya visual management rooms. Catchball communication rhythm (daily stand-ups + vertical/horizontal problem escalation = PDCA loop). Key: you can't implement culture change; must develop internal coaches; "Make it your own"; change behaviours first, culture follows.

**Conclusion + Appendix A:** 24 key capabilities in 5 categories fully listed (8 CD, 2 Architecture, 4 Product/Process, 5 Lean Management, 5 Cultural). "You can't buy or copy high performance."

**Book complete.** Accelerate fully ingested. Created: `wiki/sources/accelerate.md`, `wiki/concepts/westrum-culture.md`, `wiki/authors/nicole-forsgren.md`, `wiki/authors/jez-humble.md`, `wiki/authors/gene-kim.md`. Updated: `wiki/concepts/four-key-metrics.md` (Accelerate as primary source), `wiki/concepts/conways-law.md` (empirical validation), `wiki/concepts/deployment-pipelines.md` (Accelerate row). Index, README, CLAUDE.md updated.

## [2026-05-18] ingest | Accelerate — Ch 11–12

**Ch. 11 (Leaders and Managers):** Transformational leadership (5 dimensions: vision, inspirational communication, intellectual stimulation, supportive leadership, personal recognition) highly correlated with delivery performance and eNPS. Bottom-1/3 leaders → teams half as likely to be high performers. Critical nuance: top-10% leaders are NOT more likely to produce high performers — leadership enables practices, not substitutes. Leadership chain: leadership → practices → delivery performance → org performance. Manager actions: cross-functional trust, climate for learning (blameless postmortems, hack/yak days, 20% time), effective tools.

**Ch. 12 (Science Behind the Book):** Research is primary, quantitative, inferential predictive. Six analysis levels; book uses first three. When book says X "drives" Y = PLS regression / multiple regression on theory-based hypotheses, not mere correlation. Hierarchical clustering (not k-means) for performance group classification. Theory-driven hypotheses prevent spurious correlation fishing.

Updated: `wiki/sources/accelerate.md` (ch.11–12 notes).

## [2026-05-18] ingest | Accelerate — Ch 9–10

**Ch. 9 (Making Work Sustainable):** Deployment pain inversely correlated with delivery performance, org performance, culture. Three causes: non-deployable software, manual prod changes (config drift), siloed handoffs. Microsoft Bing: CD adoption raised work/life balance satisfaction 38%→75%. Burnout: Maslach's 6 risk factors. Five research-identified predictors: pathological culture, deployment pain, ineffective leaders, lack of DevOps investment, poor org performance. Values alignment: lived values matter; mismatch → burnout.

**Ch. 10 (Employee Satisfaction, Identity, Engagement):** eNPS: high performers 2.2× more likely to recommend org, 1.8× team. Identity construct predicts generative culture and org performance. Job satisfaction: right tools + makes use of skills + overall satisfaction; predicted by DevOps practices. Automation frees humans for judgment. Virtuous cycle confirmed: CD → better products → job satisfaction → org performance → better hiring/retention. Diversity: higher gender/minority diversity → better team performance and business outcomes; 91% male in 2017 data; diversity without inclusion is insufficient.

Updated: `wiki/sources/accelerate.md` (ch.9–10 notes).

## [2026-05-18] ingest | Accelerate — Ch 7–8

**Ch. 7 (Management Practices):** Lean management = WIP limits + visual displays + monitoring for business decisions; components individually weak, jointly strong. WIP limits must drive process improvement, not just throttle. CAB finding confirmed: external approval negatively correlated with lead time, deployment frequency, MTTR; no correlation with change fail rate. Peer review + pipeline is the recommended change management approach; satisfies SOD for regulated industries without CABs. Lean management → generative culture + lower burnout.

**Ch. 8 (Product Development):** Four Lean product development capabilities: small batches, flow visibility, customer feedback, team experimentation authority. Virtuous cycle confirmed: Lean product management → delivery performance, and delivery performance → Lean product management (both directions validated in different research years). Team experimentation authority predicts org performance.

Updated: `wiki/sources/accelerate.md` (ch.7–8 notes).

## [2026-05-18] ingest | Accelerate — Ch 5–6

**Ch. 5 (Architecture):** System type doesn't predict performance (mainframe, packaged, greenfield all equivalent) — architectural *characteristics* do. Two key characteristics: testability and deployability. Loosely coupled, well-encapsulated architecture is the #1 contributor to CD in 2017 — larger than test/deploy automation. Six-question survey instrument for measuring it. Inverse Conway Maneuver empirically validated. Scaling finding: high performers' deploys-per-developer increases as team grows; low performers' decreases. Tool choice (team autonomy) predicts CD performance.

**Ch. 6 (Infosec):** Shift-left security: embed infosec into design, demos, test automation. Provide preapproved easy-to-consume toolchains. High performers spend 50% less time on security remediation. Infosec-to-dev ratio (1:10:100) makes manual review at deployment scale impossible — must embed in developer workflow. DevSecOps / Rugged DevOps as terminology.

Updated: `wiki/sources/accelerate.md` (ch.5–6 notes), `wiki/concepts/conways-law.md` (Accelerate empirical validation added to sources table, frontmatter updated).

## [2026-05-18] ingest | Accelerate — Ch 3–4

**Ch. 3 (Measuring and Changing Culture):** Westrum typology (pathological/bureaucratic/generative) — adopted because well-defined, measurable, predictive. Culture predicts delivery performance, org performance, and job satisfaction. 3-metric construct nuance: only lead time + deployment frequency + MTTR form a valid psychometric construct; change failure rate is strongly correlated but used separately. 2016: 31% pathological, 48% bureaucratic, 21% generative. Behaviour changes culture — implement practices first, don't wait for culture. Continuous delivery and Lean management are the drivers. Google Project Aristotle alignment: team dynamics > individual skills; psychological safety = generative culture.

**Ch. 4 (Technical Practices / CD):** Five CD principles. Three CD foundations. Nine capabilities drive CD; 2017 added architecture and tool autonomy. Config-in-VCS more predictive than app-code-in-VCS. Developer-owned tests outperform QA/outsourced. Trunk-based dev (< 3 branches, < 1 day lifetime) → higher performance. High performers: 49% new work / 21% unplanned; low: 38% / 27%. CD reduces failure demand. CD is investment in people (less pain, less burnout) as well as systems.

Created: `wiki/concepts/westrum-culture.md`. Updated: `wiki/sources/accelerate.md` (ch.3–4 notes), `wiki/concepts/deployment-pipelines.md` (Accelerate row in sources table).

## [2026-05-18] ingest | Accelerate — Preface + Ch 1–2

**Preface:** 4-year research programme (2014–2017), 23,000+ responses, 2,000+ organisations, academic-grade cross-sectional study design and psychometric methods. Authors combine Forsgren's PhD statistical rigour with Humble's CI/CD expertise and Kim's DevOps research background.

**Ch. 1 (Accelerate):** Central thesis — 24 capabilities drive software delivery performance which drives organisational performance. Capabilities vs. maturity models: four reasons maturity models fail (static, lock-step, output-focused, non-adaptive). 2017 data: high vs. low performers — 46× deployment frequency, 440× lead time, 170× MTTR, 5× change failure rate. Things that do NOT predict performance: app age/tech, who deploys, CAB presence.

**Ch. 2 (Measuring Performance):** Flawed prior metrics (lines of code, velocity, utilisation — all output-focused or local). Four key metrics defined (lead time, deployment frequency, MTTR, change failure rate) — selected for global/outcome focus. Lean conceptual basis: lead time from Lean; deployment frequency as proxy for batch size. Cluster analysis yielded three groups. Key finding: no tradeoff — high performers win on all four simultaneously. High performers 2× as likely to exceed org performance goals. CABs negatively correlated with both tempo and stability. Deming warning on measurement in pathological cultures.

Created: `wiki/sources/accelerate.md`, `wiki/authors/nicole-forsgren.md`, `wiki/authors/jez-humble.md`, `wiki/authors/gene-kim.md`. Updated: `wiki/concepts/four-key-metrics.md` (added Accelerate as primary source, origin/empirical basis section, CABs finding, Deming/culture warning, Lean basis).

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 20–22 (complete)

**Chapter 20 — Designing for Performance:** Clean design and high performance are compatible; premature optimization creates unnecessary complexity. Four-step approach: measure first (find real bottleneck), design for performance on critical path, apply micro-optimizations only at end. Critical path design: combine operations to eliminate I/O, reduce network round-trips. RAMCloud Buffer example: redesign (not micro-optimization) achieved 2× speedup with 20% code reduction — eliminated two array copies in critical path. Special-case checks on the critical path are red flag.

**Chapter 21 — Decide What Matters:** Unifying principle of the book. Good design requires constant judgment about what is important. Two design instincts: minimize (what must I keep?) and emphasize (what must stand out?). Good taste = recognizing the leverage points; complexity accumulates through poor judgment about what to eliminate. Design mistakes: ignoring important things (random walk), caring too much about unimportant things (grinding).

**Chapter 22 — Conclusion and Appendices:** Closing argument: problem decomposition is the most fundamental skill; every design decision is a decomposition decision; good designers think more broadly. Full list of 16 Design Principles and 14 Red Flags (both captured in source page). No new concept pages — all content integrated into existing pages.

**Book complete.** APOSD fully ingested (preface + 22 chapters). Updated: `wiki/sources/a-philosophy-of-software-design.md` (ch. 20–22 notes + appendix principles/red flags), `wiki/concepts/software-complexity.md` (exception handling section, naming as obscurity lever), `wiki/concepts/modularity.md` (deep modules, information hiding, general-purpose modules, different layer/abstraction, pull complexity down, better-together heuristics), `wiki/concepts/coupling.md` (information hiding, temporal decomposition), `wiki/concepts/cognitive-load.md` (code-level cognitive load section).

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 18–19

**Chapter 18 — Code Should Be Obvious:** Obscurity = important information not obvious to new developers. Obviousness is reader-perceived; code reviews are the arbiter. Makes code more obvious: precise names, consistency, judicious whitespace, comments. Makes code less obvious: event-driven programming (handlers invoked indirectly; compensate with "when invoked" comments); generic containers (Pair — meaningless element names); type mismatch between declaration and allocation; code violating reader expectations. Red Flag: Nonobvious Code. Three ways to ensure readers have information: reduce needed information (abstraction), exploit existing knowledge (conventions), present in code (names, comments).

**Chapter 19 — Software Trends:** OOP: interface inheritance is good (deeper interface); implementation inheritance creates information leakage through shared parent state — prefer composition. Agile: incremental development is good; risk is tactical programming; increment on abstractions not features. Unit tests: facilitate refactoring; without them developers avoid structural changes. TDD: "tactical programming pure and simple" — focuses on making tests pass not best design; exception: test first for bug fixes. Design patterns: good when they fit; risk is over-application. Getters/setters: shallow, expose implementation, violate information hiding — avoid; the Java cultural norm is an example of a pattern taken too far.

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 16–17

**Chapter 16 — Modifying Existing Code:** Design is determined more by evolution than initial conception. "Minimal change" mindset is tactical programming applied to modifications. Ideal: when done, system should have the structure it would have had if designed from scratch with this change in mind. Comment maintenance: keep comments near code (in code file, not header); spread through method at phase level; comments in code not commit log; avoid duplicate documentation (single authoritative location + cross-references); pre-commit diff scan; higher-level comments easier to maintain.

**Chapter 17 — Consistency:** Consistency = cognitive leverage (learn once, apply everywhere) + safety (similar appearances can be trusted). Applies at: naming, coding style, interfaces with multiple implementations, design patterns, invariants. Ensuring consistency: document conventions (project wiki), enforce with automated pre-commit checks, "When in Rome" (follow apparent conventions), don't change existing conventions unless completely updating all uses. Limit: don't force dissimilar things to look the same. No new concept pages.

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 14–15

**Chapter 14 — Choosing Names:** Names are a form of abstraction and documentation. Vague names create obscurity (one of the two causes of complexity). Real bug: Sprite OS `block` variable used for both physical and logical blocks — 6-month debugging effort. Good names: precision (readable without declaration), consistency (same name always = same thing), no extra words, appropriate distance-based length. Red Flags: Vague Name, Hard to Pick Name (signals unclear underlying design). Disagreement with Go short-name philosophy. Updated: `wiki/concepts/software-complexity.md` (naming as obscurity lever added to Obscurity section).

**Chapter 15 — Write the Comments First:** Write comments at start of design, not end. Delayed comments never get written or repeat the code. Comments-first: class interface comment → method signatures + interface comments → iterate → instance variables → method bodies. Three benefits: better comments, better design, more fun. "Canary in the coal mine": long complex interface comment = shallow module. Red Flag: Hard to Describe. Comments are a design tool — the only way to fully capture abstractions; writing them first forces early design decisions. Cost: ~5% of development time; writing first likely saves net time by stabilising abstractions.

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 12–13

**Chapter 12 — Why Write Comments?** Comments are essential for abstractions — without them the only abstraction of a method is its declaration, which is insufficient. Four excuses debunked: "self-documenting code" (myth; leads to shallow methods); "no time" (10% overhead; investment mindset); "comments go stale" (solvable); "all comments worthless" (solvable — the next chapters show how). Benefits: capture information not representable in code; reduce cognitive load; eliminate unknown unknowns. Explicit disagreement with Clean Code (Martin): comments are not failures; they represent fundamentally different information than code; Martin's extracted-method approach produces shallow code and long cryptic names. Updated: `wiki/concepts/cognitive-load.md` (code-level cognitive load section added linking Ousterhout to Sweller and Team Topologies).

**Chapter 13 — Comments Should Describe Things That Aren't Obvious from the Code.** Guiding principle. Four comment categories: interface (most important), data structure member, implementation, cross-module. Don't repeat the code (Red Flag: Comment Repeats Code). Lower-level comments add precision (units, boundaries, nullability, ownership, invariants). Higher-level comments enhance intuition (what and why, not how; "how we get here" comments explain conditions). Interface documentation separates interface from implementation — if they're the same, the class is shallow; writing interface comments is a design quality signal. Red Flag: Implementation Documentation Contaminates Interface. Cross-module decisions: designNotes file with cross-reference comments. No new concept pages; source page updated.

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 10–11

**Chapter 10 — Define Errors Out Of Existence:** Exceptions are one of the worst sources of complexity. Harder to write, test, and maintain than normal-case code. >90% of distributed system catastrophic failures from incorrect error handling (Yuan et al. 2014). Four techniques: (1) define errors out of existence (redefine semantics — Tcl unset, Unix file delete, Java substring clamping); (2) mask exceptions at low level (TCP retransmission, NFS hanging); (3) exception aggregation (single top-level handler for many exceptions — web server dispatcher, RAMCloud promoting object corruption to server crash); (4) just crash for unrecoverable errors. Updated: `wiki/concepts/software-complexity.md` (Exception Handling section added).

**Chapter 11 — Design It Twice:** First design ideas rarely best. Consider multiple radically different alternatives for every major design decision. Evaluate on: ease of use for higher-level software, interface simplicity, generality, implementation efficiency. Apply at all levels (interface, implementation, decomposition). Time cost small vs. implementation time. Smart people's trap: habituated to "first idea sufficient" from academic contexts; hard problems require exploration. No new concept pages (design process principle, captured in source page).

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 8–9

**Chapter 8 — Pull Complexity Downwards:** Unavoidable complexity should be absorbed by the module internally, not pushed up to callers. Simple interface > simple implementation. Anti-patterns: throwing exceptions for uncertain cases; exporting configuration parameters. Config params are the "easy excuse" — users often can't determine good values, the system can often compute them (retry interval from observed latency). Three conditions for pulling down: related to module's function, simplifies callers, simplifies interface. Updated: `wiki/concepts/modularity.md` (Pull Complexity Downwards section added).

**Chapter 9 — Better Together or Better Apart?:** Fundamental decomposition question at all levels. Subdivision creates complexity (more interfaces, management code, separation, duplication). Combine when: sharing information, simplifies the interface, eliminates duplication. Separate general-purpose mechanism from special-purpose code. Counter-examples: cursor+selection better separate (combined more complex); NetworkErrorLogger single-use methods better inlined. Splitting methods: length alone rarely a good reason; two legitimate splits (extracting subtask vs splitting at responsibilities); Red Flag: Conjoined Methods. Explicit disagreement with Clean Code (Martin): depth > length; don't sacrifice depth for length. Updated: `wiki/concepts/modularity.md` (Better Together or Better Apart section added).

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 6–7

**Chapter 6 — General-Purpose Modules are Deeper:** Over-specialisation identified as the single greatest cause of complexity. Special-purpose APIs leak caller concerns down into modules. Sweet spot: "somewhat general-purpose" — functionality for today, interface not tied to today. Text editor example: special-purpose API (backspace/delete/deleteSelection with Cursor/Selection types) vs general-purpose (insert/delete/changePosition with Position). General-purpose produces less code and better information hiding. Push specialisation upward (UI code) or downward (device drivers). Undo/redo example: general-purpose History class + History.Action interface, special-purpose Action implementations, policy in UI. Eliminate special cases by designing normal case to handle edge cases (empty selection = start≡end, no flag). Updated: `wiki/concepts/modularity.md` (General-Purpose Modules section added).

**Chapter 7 — Different Layer, Different Abstraction:** Well-designed layered systems change abstraction at each layer. Adjacent layers with similar abstractions = red flag. Pass-through methods make classes shallower and create cross-layer dependencies; fix by exposing lower level directly, redistributing responsibility, or merging. Dispatcher and multiple-implementation exceptions. Decorator pattern critique: often too shallow; BufferedInputStream should have been built into FileInputStream. Interface vs implementation: text class internal representation is lines, interface is character-oriented — the difference is valuable depth. Pass-through variables: context object pattern (one per system instance, constructor injection, immutable fields) as the least-bad solution. Core principle: every design element must eliminate more complexity than it introduces. Updated: `wiki/concepts/modularity.md` (Different Layer, Different Abstraction section added).

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 4–5

**Chapter 4 — Modules Should Be Deep:** Modular design decomposes systems into modules with interfaces and implementations. Abstractions fail by including unimportant details or omitting important ones (false abstraction). Deep modules: simple interface hiding substantial implementation (Unix I/O — 5 calls hiding 100K+ lines; garbage collector — no interface at all). Shallow modules: interface nearly as complex as implementation; provide little leverage. Classitis anti-pattern: excessive small classes driven by "classes should be small" dogma (Java I/O as example vs Unix I/O defaults). Updated: `wiki/concepts/modularity.md` (Deep vs. Shallow Modules section added).

**Chapter 5 — Information Hiding (and Leakage):** Information hiding (Parnas 1972): each module encapsulates design decisions in its implementation, invisible through its interface. Reduces complexity by simplifying interface (lower cognitive load) and enabling independent evolution. Private fields ≠ information hiding — getters/setters expose the information just as effectively. Information leakage: design decision reflected in multiple modules; can be explicit (interface) or backdoor (two classes both knowing a file format). Temporal decomposition: structuring modules by execution order rather than knowledge ownership — the primary cause of leakage. Fix: focus on knowledge ownership, not execution sequence. Red flags introduced: Information Leakage, Temporal Decomposition, Overexposure. Updated: `wiki/concepts/modularity.md` (Information Hiding section), `wiki/concepts/coupling.md` (temporal decomposition added).

## [2026-05-18] ingest | A Philosophy of Software Design — Ch 2–3

**Chapter 2 — The Nature of Complexity:** Complexity defined as anything making a system hard to understand and modify (`C = Σ(cp × tp)`). Three symptoms: change amplification (simple change → many code modifications), cognitive load (too much a developer must know), unknown unknowns (worst — developer doesn't know what must change). Two causes: dependencies (code that can't be understood in isolation; must be made obvious and minimal) and obscurity (important information not visible: generic names, missing units, inconsistency, hidden dependencies). Complexity is incremental — requires zero-tolerance philosophy.

**Chapter 3 — Working Code Isn't Enough:** Tactical programming (finish fast, add complexity) vs. strategic programming (invest in good design, primary goal is long-term structure). Tactical tornado archetype. Investment: 10–20% of dev time; estimated payback 6–18 months. Technical debt = time borrowed from the future; unlike financial debt, usually never fully repaid. Facebook (tactical) vs. Google/VMware (strategic) as case studies.

**Pages created:**
`wiki/concepts/software-complexity.md` — definition, three symptoms, two causes, strategic vs tactical, cross-references to coupling/modularity/cognitive-load.

**Pages updated:**
`wiki/sources/a-philosophy-of-software-design.md` — added ch. 2–3 notes.
`index.md` — added software-complexity entry.

19 chapters remain.

## [2026-05-18] ingest | A Philosophy of Software Design — Preface + Ch 1

**Preface:** Ousterhout's motivation: problem decomposition is the most fundamental challenge in computer science, but no university course addresses it. Design skill separates great programmers from average ones; CS 190 at Stanford is the experiment. Book framed as an opinion piece — readers encouraged to disagree and report back. Overall goal: reduce complexity (takes priority over any individual principle).

**Chapter 1 — Introduction (It's All About Complexity):** Core thesis: complexity is the root cause of slow development and bugs. Two approaches: (1) eliminate complexity — simpler, more obvious code; (2) encapsulate it — modular design so programmers can work on modules independently. Design is continuous (not a waterfall phase); incremental/agile development exposes design problems while systems are still small. Red flags as the learning mechanism — visible symptoms of unnecessary complexity.

**Pages created:**
`wiki/sources/a-philosophy-of-software-design.md` — source page with overview, key claims, ch. 0–1 notes.
`wiki/authors/john-ousterhout.md` — Stanford professor, Tcl/Raft creator, CS 190 instructor.

**Pages updated:**
`index.md` — added source entry (in progress) and author entry.

21 chapters remain.

## [2026-05-17] lint | Full wiki health check

Ran systematic lint across all 152 wiki pages. Checks: broken wikilinks (grep all `[[...]]` targets against disk), orphan pages (zero inbound links), index consistency, frontmatter completeness, source slug validity. Findings: (1) `concepts/chaos-engineering` was the sole orphan — zero inbound links from wiki pages despite being a full, well-written page sourced from release-it ch. 17. (2) `overview.md` was stale: updated 2026-05-13, listed only 9 of 17 ingested sources, contained a stale "in progress" status for learning-domain-driven-design, referenced a non-existent book ("Fowler's Microservices in Production"), and listed only 11 of 31 authors.

Fixes applied: added `[[operations/chaos-engineering]]` to `concepts/monitoring.md` (chaos testing paragraph), `sources/release-it.md` (Related Pages section), and `concepts/fitness-functions.md` (definition paragraph). Rewrote `overview.md` to cover all 17 sources, added 8 new theme sections (scalability empirical, integration styles, domain logic patterns, team topologies model, architecture quality measurable, monolith decomposition, design for production, DDD language-before-architecture), updated Sources table (all 17 with dates), refreshed Open Questions (removed stale/invalid questions, added 7 substantive new ones), expanded Key Authors from 11 to 31 entries.

No broken wikilinks found. No other orphans. All frontmatter complete. Index consistent with disk.

## [2026-05-22] ingest | Software Architecture Metrics — Batch 5 (Ch 9–10) — FULLY INGESTED

**Chapter 9 — Using Software Metrics to Ensure Maintainability (Alexander von Zitzewitz):** Structural erosion is "code cancer" — 80% of nontrivial systems >100K LoC become Big Balls of Mud without an active metrics-based feedback loop. ACD (Average Component Dependency) and CCD (Cumulative Component Dependency) measure change propagation at component and system levels; Propagation Cost (CCD/n²) normalises to system size — thresholds: >20% for 500–5,000 components, >10% for 5,000+. Relative Cyclicity (100 × √(Σcyclicity)/n): fitness function thresholds ≤4% for components, 0% for packages. Structural Debt Index (SDI = 10×linksToBreak + weightOfLinks): target low hundreds. Maintainability Level (ML, three formula variants ML1/ML2/ML3): target ≥75%. Change history metrics (Number of Changes, Code Churn, Number of Authors) identify refactoring hotspots. Component Rank (PageRank for classes) aids onboarding. LCOM4 (disconnected subgraphs in method-field graph): value >1 signals splittable class. Six golden rules: formal architectural model, no namespace cycles, source-file cycles ≤5 elements, no duplication, LoC ≤800, max indentation 4 and Modified CC ≤15. Tools: Sonargraph-Explorer (free), NDepend, Understand, SonarQube, Source Monitor.

**Chapter 10 — Measure the Unknown with the Goal-Question-Metric Approach (Michael Keeling):** GQM (Basili & Weiss 1984): hierarchical goal → questions → metrics → data tree; creates measurement traceability so every collected data point links to a goal. Goal statement structure: purpose + object + issue/topic + viewpoint. Questions: operationally focused; "let go of what is practical." Metric selection: strong signal > weak, inexpensive > expensive, cross-question reuse. Data collection: instrumentation, surveys, task databases, static tools, manual experiments. 9-step workshop: intro → write goal → gather questions → brainstorm metrics → sanity-check goal → identify data → prioritise → open reflection → document and share. Case study "Foo Service": recurring Monday rate-limit breach → postmortem → GQM → heartbeat component + fail-fast ADR (jobs fail fast, work queue retries) → 9 months later same service goes down for 14 hours; team alerted in 10 minutes before any user impact. GQM as: measurement framework, coaching tool, stakeholder alignment mechanism.

Created: `wiki/authors/alexander-von-zitzewitz.md`; `wiki/authors/michael-keeling.md`; `wiki/concepts/goal-question-metric.md`. Updated: `wiki/sources/software-architecture-metrics.md` (authors line, key claims, Ch 9–10 notes, related pages); `wiki/concepts/modularity.md` (added "Advanced Structural Metrics" section with ACD/CCD/Propagation Cost, Relative Cyclicity, SDI, ML, LCOM4, change history metrics, Component Rank, six golden rules, six golden rules; updated sources table row; added goal-question-metric to related concepts); `index.md` (SAM fully ingested; added goal-question-metric concept entry; updated modularity entry; added alexander-von-zitzewitz and michael-keeling author entries); `README.md` (added SAM to sources table); `CLAUDE.md` (added software-architecture-metrics slug). Moved ch 9–10 and preamble to processed; removed processing/software-architecture-metrics/ directory.

## [2026-05-22] ingest | Software Architecture Metrics — Batch 4 (Ch 7–8)

**Chapter 7 — The Role of Measurement in Software Architecture (Eoin Woods):** Four-quadrant measurement taxonomy: artifact vs operational × external vs internal; each type available at different points in the delivery lifecycle and providing different insight. External artifact (design compliance, early, judgment-based) → internal artifact (code metrics, after code written, cheap) → external operational (response time, throughput, recovery — requires running system, user-visible) → internal operational (memory, DB growth — requires running system, predictive). Measurement approaches: runtime telemetry (logs/traces/metrics), static code analysis, design analysis, estimates/models, fitness functions. Quality attribute specifics: performance (latency + throughput inversely proportional; measure response time distribution; pitfalls: test-vs-reality, workload fidelity, intermittent phenomena); scalability (capacity at given resource level; linear scaling ideal; pitfalls: unexpected bottlenecks, nonlinear behavior, resource mix); availability (MTBF + MTTR; Allspaw 2010: MTTR more important; RPO + RTO; tyranny of the nines antipattern: high-nines targets too simple); security (static analysis, dynamic testing, infrastructure scanning; weight by risk; pitfalls: false positives, environment consistency, knowing when to stop). Six getting-started guidelines; six pitfalls.

**Chapter 8 — Progressing from Metrics to Engineering (Neal Ford):** Metrics become engineering via continuous automated application with objective thresholds — same transformation as CI did to code integration. ArchUnit (Java)/NetArchTest (.NET) for compile-time governance (cycle checks, layer enforcement); custom fitness functions required for distributed architectures (parse service logs to verify orchestrator communication). Zero-day enterprise security pattern: security team owns a pipeline "slot" in all projects; injects version-check fitness function org-wide when CVE announced; Equifax 2017 Struts breach as motivating case — missed 4 months because not all systems had active pipelines. Fidelity fitness function / GitHub Scientist (use clause returns to users; try clause runs experimentally; compares results; 10M experiments over 4 days). Fitness functions as executable checklist (Gawande Checklist Manifesto): complex systems have too many simultaneous concerns to rely on memory; checklist prevents important principles being skipped under deadline pressure.

Created: `wiki/authors/eoin-woods.md`. Updated: `wiki/authors/neal-ford.md` (added SAM source); `wiki/sources/software-architecture-metrics.md` (added Ch 7–8 notes and key claims); `wiki/concepts/fitness-functions.md` (updated sources table row for SAM with ch. 7 and 8 contributions); `wiki/concepts/availability.md` (added MTBF/MTTR/RPO/RTO section, tyranny of the nines antipattern; added software-architecture-metrics to sources); `index.md` updated; moved ch 7–8 to processed.

## [2026-05-22] ingest | Software Architecture Metrics — Batch 3 (Ch 5–6)

**Chapter 5 — Private Builds and Metrics: Tools for Surviving DevOps Transitions (Christian Ciceri):** Ownership shift antipattern: DevOps becomes a separate automations team → development team loses build pipeline ownership → trunk instability, delegated-but-unowned validations, environment mismatch. Fix: private build (integration build in local/dedicated environment before committing to mainline; may be manual initially). Three transition metrics: Time to Feedback (qualitative, indirect — warns of long cycles), Evitable Integration Issues per Iteration (quantitative, indirect — measures private build discipline maturity), Time Spent Restoring Trunk Stability per Iteration (quantitative, direct — cost of regressions entering mainline). Key: trunk stability must be established before architectural quality metrics are meaningful.

**Chapter 6 — Scaling an Organisation: The Central Role of Software Architecture (João Rosa):** Architecture is sociotechnical: Conway's Law determines structure without intentional direction; monolith → Distributed BBM without KPI-guided architecture. Discovery technique: Big Picture EventStorming (maps software components onto emergent domains, reveals ownership/cognitive load mismatches, surfaces domain KPIs) + Process Modeling EventStorming (operational value stream detail: KPIs, hotspots, Lean waste). KPI Value Tree: organisational KPIs (lagging) → domain KPIs (lagging) → technical metrics (leading + lagging, including DORA four key metrics). Additional metrics: throughput (Lean), eNPS, mean time to discover (MTTD). Goodhart's Law: when a measure becomes a target, it ceases to be a good measure. MTTD trend rising + change fail rate rising = architectural complexity outpacing observability. Mobile app deployment ring example: context-dependent metric interpretation.

Created: `wiki/authors/christian-ciceri.md`; `wiki/authors/joao-rosa.md`. Updated: `wiki/sources/software-architecture-metrics.md` (added Ch 5–6 notes and key claims); `wiki/concepts/four-key-metrics.md` (added complementary metrics section: throughput, eNPS, MTTD, Goodhart's Law warning, mobile context example); `wiki/concepts/eventstorming.md` (added Rosa/SAM row: Big Picture for KPI mapping + Process Modeling for value stream analysis, KPI Value Tree; added software-architecture-metrics to sources); `index.md` updated; moved ch 5–6 to processed.

## [2026-05-22] ingest | Software Architecture Metrics — Batch 2 (Ch 3–4)

**Chapter 3 — Evolutionary Architecture: Guiding Architecture with Testability and Deployability (Dave Farley):** Five attributes of sustainable design: modularity, cohesion, separation of concerns, abstraction/information hiding, coupling. Central thesis: testability is the most reliable driver of all five attributes — code that is testable is inherently modular, cohesive, loosely coupled, and well-abstracted; TDD amplifies this by providing architectural feedback before implementation. Deployability = deployment pipeline scope = independently deployable unit; continuous delivery is an architectural property, not just a tooling choice. Architectural descriptions as "tourist maps" — highlight landmarks, suppress irrelevant detail; over-specified documents become outdated. Do not over-engineer: keep options open through testability and short deploy cycles rather than speculative abstractions.

**Chapter 4 — Improve Your Architecture with the Modularity Maturity Index (Dr. Carola Lilienthal):** Modularity Maturity Index (MMI): empirical 0-10 score from 300+ reviews, grounded in cognitive science. Three weighted principles: modularity/chunking (45%), hierarchy (30%), pattern consistency/schema theory (25%). Decision thresholds: MMI < 4 = consider replacement; 4-8 = refactor (usually cheaper than replace); >8 = low debt. Architecture erosion: without deliberate improvement cycles, debt compounds — each change slower and more expensive. Two debt types: implementation debt (measurable by tools, cheap to fix) vs design/architecture debt (requires structured review, expensive because it demands structural change). Tools: Lattix, Sotograph/SotoArc, Sonargraph, Structure101, TeamScale. Effective reviews combine automated tool output with manual inspection.

Created: `wiki/authors/dave-farley.md`; `wiki/authors/carola-lilienthal.md`. Updated: `wiki/sources/software-architecture-metrics.md` (added Ch 3–4 notes and key claims); `wiki/concepts/evolutionary-architecture.md` (added Farley/SAM perspective row, added software-architecture-metrics to sources); `wiki/concepts/modularity.md` (added MMI section with three principles, decision thresholds, architecture erosion, two debt types; added software-architecture-metrics to sources); `index.md` updated; moved ch 3–4 to processed.

## [2026-05-21] ingest | Software Architecture Metrics — Batch 1 (Ch 1–2)

**Chapter 1 — Four Key Metrics Unleashed (Harmel-Law):** Four key metrics from *Accelerate* (Forsgren, Humble, Kim): deployment frequency + lead time for changes (throughput pair) + change failure rate + time to restore service (stability pair); all four must trend together; mental model = pipeline from commit to production; four pipeline topology variants (single, multiple end-to-end, subpipeline chain, fan-in); four instrumentation points (commit timestamp, deploy timestamp, failure ticket open/close); deployment frequency = 31-day mean of daily deployment counts; lead time = 31-day mean of daily means; change failure rate = resolved failures / deployments over 31 days; time to restore = mean or median of resolution times over 120 days; MVD (minimal viable dashboard) = wiki page; metrics not gameable → generate authentic team conversations → virtuous cycle of quality and architectural improvement.

**Chapter 2 — Fitness Function Testing Pyramid (Weiss):** Extends evo-arch fitness function taxonomy; six mandatory categories (atomic/holistic breadth, triggered/continuous trigger, execution location, metric type, automation, ISO 25010 quality attribute); four optional (temporary/permanent, static/dynamic, target audience, applicability); fitness function testing pyramid: bottom=triggered atomic (code coverage, static analysis, simple perf), middle=triggered holistic or continuous atomic (integration tests, production monitoring), top=continuous holistic or triggered holistic in production (chaos engineering, business KPIs, zero-downtime deployment tests); 7-step development process (stakeholder quality goals → draft → prioritize → finalize → automate → visualize → iterate).

Created: `wiki/sources/software-architecture-metrics.md`; `wiki/concepts/four-key-metrics.md`; `wiki/authors/andrew-harmel-law.md`; `wiki/authors/rene-weiss.md`. Updated: `wiki/concepts/fitness-functions.md` (added fitness function testing pyramid section, SAM source row); `wiki/concepts/deployment-pipelines.md` (added SAM to sources). `index.md` updated; moved ch 1–2 to processed.

## [2026-05-21] ingest | Foundations of Scalable Systems — Batch 8 (Ch 15–16) — COMPLETE

**Chapter 15 — Stream Processing Systems:** Batch vs stream comparison (latency, dataset size, analytics complexity); Lambda architecture (batch layer/speed layer/serving layer — Hadoop + Storm; now less prominent); Kappa architecture (single immutable log continuously processed — simpler, now dominant); Apache Storm (spout/bolt topology, fieldsGrouping for key routing, globalGrouping for fan-in); Apache Flink deep-dive: DataStream<T> API, functional operators (map/filter/keyBy/sum/window), lazy execution (env.execute()), sliding vs tumbling windows, parallelism configuration (setParallelism per operator or global), task managers (JVMs with task slots; taskmanager.numberOfTaskSlots), job manager (cluster management, HA via leader-follower), operator chaining (collocate operators in one task slot to reduce communication); data safety: RocksDB state backend, stream barriers (injected by job manager; stateful operators snapshot on barrier receipt across all inputs; barrier echoed downstream; checkpoint complete when barrier reaches sinks), recovery (restart app + restore from checkpoint + resume from source offset N+1), min-time-between-checkpoints config.

**Chapter 16 — Final Tips for Success:** Four essential elements not covered in main chapters: (1) Automation/DevOps — CD practices, automated toolchains, teams own operate; (2) Observability — metrics/logs from OS+platforms+app code, OpenTelemetry, Prometheus/Grafana/Graphite; (3) Deployment platforms — Docker containers + Kubernetes/Mesos orchestration, IaC; (4) Data lakes — petabyte historical data, heterogeneous formats, Hadoop/S3/Azure Data Lake, flexible query engines, tiered storage classes.

Updated: `wiki/sources/foundations-of-scalable-systems.md` (added Ch 15–16 notes, key claims; marked complete); `wiki/streams/stream-processing.md` (added Lambda/Kappa architecture section; enhanced Flink checkpointing detail; updated Gorton source row); `CLAUDE.md` (added foundations-of-scalable-systems slug); `README.md` (added book to sources table); `index.md` updated to fully ingested; moved ch 15–16 + preamble to processed; removed processing directory.

## [2026-05-21] ingest | Foundations of Scalable Systems — Batch 7 (Ch 13–14)

**Chapter 13 — Distributed Database Implementations:** Redis: in-memory KV; single-threaded event loop (lock-free, one CPU core); AOF + RDB persistence; Redis Cluster: 16,384 hash slots, gossip, MOVED redirections, hash tags (force keys to same slot), async replication + WAIT command, custom election (accepts data loss), 1000-node max; MULTI/EXEC is NOT ACID. MongoDB: WiredTiger (document-level OCC + journaling); BSON/schema-on-read; ACID multi-document since v4.0 via 2PC + snapshot isolation; hash+range sharding; 64MB chunks + balancer; mongos/config server architecture; Raft replica sets; tunable write concerns + read preferences; causal consistency sessions for RYOWs; linearizable reads via `readConcern: linearizable`. DynamoDB: managed; on-demand vs provisioned (3000 RCU/1000 WCU per partition hard cap); hotkey problem + DAX cache; global tables with LWW conflicts; ACID transactions scoped to single region; 400KB item limit; LSI+GSI secondary indexes; PartiQL.

**Chapter 14 — Scalable Event-Driven Processing:** Event log (append-only, non-destructive, replayable) vs FIFO queues; "dumb broker/smart clients" design; ZooKeeper for metadata; topics: persistent TTL + compacted topics (retain latest value per key) + tombstone records for GDPR deletion; Kafka Connect + Kafka Streams ecosystem; producers: async batching (batch.size + linger.ms), acks=0/1/all, enable.idempotence (sequence numbers + deduplication); consumers: poll() + at-most-once (commitSync before) vs at-least-once (commitSync after) + consumer.seek() for replay; semantic partitioning (null → round-robin; non-null → hash → same partition; partial ordering within partition; no total order across); partition count can increase but never decrease; consumer groups (max = partition count; idle consumers > partitions; group coordinator + group leader; CooperativeStickyAssignor for incremental rebalance); ISR + acks=all + min.insync.replicas for durability; Slack: 1B+ messages/day, 16 brokers, 32 partitions/topic.

Updated: `wiki/sources/foundations-of-scalable-systems.md` (added Ch 13–14 notes and key claims); `wiki/streams/stream-processing.md` (added Kafka Production Mechanics section and Gorton perspective row; added foundations-of-scalable-systems to frontmatter); `wiki/reference/technology-glossary.md` (added Redis Cluster, MongoDB, DynamoDB entries; added foundations-of-scalable-systems to sources); `index.md` updated to ch. 1–14; moved ch 13–14 txt files to processed.

## [2026-05-20] ingest | Foundations of Scalable Systems — Batch 6 (Ch 11–12)

**Chapter 11 — Eventual Consistency:** Inconsistency window (no upper bound; affected by replica count, node load, geographic distance); RYOWs consistency (leader reads; Neo4j bookmarks); tunable consistency (N/W/R parameters; W=N/R=1 vs W=1/R=N vs quorum W=R=(N/2)+1; immediate consistency ≠ strong consistency); sloppy quorums + hinted handoff (write availability under partition at cost of stale reads); replica repair: read repair (active, digest reads for efficiency, ScyllaDB/Cassandra) and anti-entropy Merkle tree (passive, binary hash tree, traverse from root to divergent leaves, CPU-intensive → scheduled during low load, Cassandra/Riak); conflict resolution: LWW (silently discards concurrent writes, safe only with unique-key immutable objects), version vectors (per-replica logical clocks; concurrent writes stored as siblings; client resolves), CRDTs (automatic merge); Netflix Cassandra (6+ PB; 1M writes/sec at 6ms avg / P95 17ms / 285 nodes); bet365 Riak KV.

**Chapter 12 — Strong Consistency:** Strong consistency = serializability + linearizability ("external consistency"); requires consensus (Raft/Multi-Paxos) not just 2PC; ACID transactions (atomicity/consistency/isolation via locks/durability); 2PC: prepare phase + resolve phase; 2PC failure modes: participant failure → coordinator resolves from log; coordinator failure → participants block with held locks → in loaded systems → cascading failures (lock contention → timeouts → circuit breakers → cascade); 3PC theoretically non-blocking but unrealistic. Raft election mechanics: monotonically increasing terms as logical clocks; AppendEntries() for heartbeats + log replication; 300-500ms heartbeat interval; randomized election timers; candidacy requires most up-to-date log; implementations: Neo4j, YugabyteDB, etcd, Hazelcast. VoltDB: in-memory NewSQL; single CPU core per partition (SPI); serial single-threaded execution eliminates locking; single-partition transactions: no 2PC needed; multi-partition: MPI + 2PC; command log + partition snapshots for durability; linearizable since v6.4. Cloud Spanner: globally distributed SQL DBaaS; Multi-Paxos for replica consistency; 2PC with Paxos-replicated coordinator (eliminates blocking on coordinator failure); TrueTime (GPS + atomic clocks, ~7ms bounded skew); commit wait period (hold locks for skew duration → guarantees real-time linearizability); strongly consistent reads via Paxos leader check; inspired CockroachDB, YugabyteDB.

Updated: `wiki/sources/foundations-of-scalable-systems.md` (added Ch 11–12 notes and key claims); `wiki/concepts/consistency-models.md` (added Gorton perspective row; added foundations-of-scalable-systems to frontmatter); `wiki/concepts/replication.md` (added Gorton perspective row; added to frontmatter); `wiki/concepts/consensus-algorithms.md` (added Gorton perspective row; added to frontmatter; noted Raft additional implementations: Hazelcast, Neo4j, YugabyteDB); `index.md` updated to ch. 1–12; moved ch 11–12 txt files to processed.

## [2026-05-20] ingest | Foundations of Scalable Systems — Batch 5 (Ch 9–10)

**Chapter 9 — Microservices:** Monolith scale-out challenge (replicate entire monolith; cannot scale individual capabilities independently); microservices = fine-grained services organized around business capabilities (DDD bounded contexts); two-pizza rule; independent scale-out per service; data duplication as distributed communication trade-off; API gateway as facade pattern (proxy, auth, throttling, caching, monitoring); AWS API Gateway 10K rps / 5K burst; Kong stateless → horizontally scalable; Newman's 7 principles (cited); orchestration vs. choreography; cascading failures mechanism (slow downstream → back pressure → thread pool exhaustion → chain collapse); immediate retries worsen overload; fail fast via TCP read timeout at P99 + HTTP 503 throttling + graceful degradation with default responses; circuit breaker state machine; bulkhead via per-endpoint thread pool reservation (Resilience4j, Spring Boot @Bulkhead); long-tail percentiles (P50/P95/P99 > averages); BBC: 10% fewer users per additional second.

**Chapter 10 — Scalable Database Fundamentals:** Read replicas (primary/secondaries, async replication, stale read window) as first scale-out step for read-heavy workloads; horizontal partitioning (sharding) by hash/value/range; vertical partitioning by column; distributed joins (reference table replication, partition-key joins, selective filters); Oracle RAC as shared-everything (SAN, Cache Fusion, Clusterware); NoSQL movement drivers (commodity hardware, unstructured data, relaxed consistency); four NoSQL data models (key-value/document/wide column/graph); schema-on-read vs schema-on-write; solution domain modeling (model access patterns, not problem domain — denormalise, "table per use case"); sharding + replication (3 replicas/partition); leader-follower vs leaderless replication; CAP theorem (CP vs AP under partition); Facebook MySQL (primary + async geo-distributed replicas, MyRocks storage engine); Baidu MongoDB (200B docs, 1PB, 600 nodes).

Updated: `wiki/sources/foundations-of-scalable-systems.md` (added Ch 9–10 notes and key claims); `wiki/styles/microservices-architecture.md` (added "Cascading Failures and Scalability Resilience" section; added Gorton to sources table); `wiki/patterns/circuit-breaker.md` (added Gorton sources row); `wiki/patterns/bulkhead.md` (added "Per-Endpoint Thread Pool Isolation" section with Resilience4j example; updated sources); `wiki/databases/data-models.md` (added Gorton to sources table — solution domain modeling framing); `index.md` updated; moved ch 9–10 txt files to processed.

## [2026-05-20] ingest | Foundations of Scalable Systems — Batch 4 (Ch 7–8)

**Chapter 7 — Asynchronous Messaging:** Queue model (producer/broker/consumer); push vs pull (push preferred — consumer controls rate via thread count); message persistence (memory vs disk); pub-sub and topics; leader-follower replication for broker HA; RabbitMQ internals (exchanges: direct/topic/fanout; connections vs channels; channel pool for thread-safe app servers; thread-per-queue broker model; 40% memory threshold halts producers); data safety three-lever trade-off (publisher confirms + persistent queues + manual consumer ACKs); quorum queues (RAFT-based) vs mirrored queues for availability; competing consumers for horizontal scale-out; exactly-once via producer idempotency key (broker dedup) + consumer idempotency key cache; poison messages and DLQ (maxReceiveCount/ReceiveCount).

**Chapter 8 — Serverless Processing Systems:** Serverless model (pay-per-invocation, no static provisioning, managed autoscaling); 69% of organisations overspend cloud budget by >25%; cold start by runtime (Go <1s, JVM 1–3s); GAE standard environment autoscaling parameters (target_cpu_utilization, max_concurrent_requests, target_throughput_utilization, max-pending-latency, min/max instances); AWS Lambda freeze/thaw lifecycle; provisioned/reserved concurrency; burst limits (3,000 US West, 1,000 EU Frankfurt, 500 elsewhere); 500 new instances/min scale rate; HTTP 429 throttle; memory-vCPU proportionality (1,769 MB = 1 vCPU); parameter study methodology (12-config GAE case study: default was neither cheapest nor fastest; {CPU80,max10} → +3% throughput at same cost; {CPU70,max80} → 96% throughput at 55% cost); vendor lock-in concern (Apache OpenWhisk, Serverless Framework as mitigations).

Updated: `wiki/sources/foundations-of-scalable-systems.md` (added Ch 7–8 notes and key claims); `wiki/concepts/messaging.md` (added Gorton perspective row to sources table; added foundations-of-scalable-systems to sources frontmatter); created `wiki/concepts/serverless.md` (new page — cold start, GAE/Lambda parameters, parameter study methodology, vendor lock-in); `index.md` (source entry updated to ch. 1–8, serverless added, messaging entry updated); moved ch 7–8 txt files to processed.

## [2026-05-19] ingest | Release It! — Batch 10 (Ch 17) — FULLY INGESTED

**Chapter 17 — Chaos Engineering:** Definition and empirical nature; safety not composable (sequential call composition failure example); theoretical foundations (Dekker's drift into failure, Weinberg's regulator paradox, Volkswagen microbus paradox, Taleb's antifragility); Netflix Simian Army (Chaos Monkey, Latency Monkey, Chaos Kong); opt-in vs opt-out adoption models; prerequisites (irreplaceable-request check, blast radius, distributed tracing, meaningful monitoring, recovery plan); experiment design (hypothesis → steady state → rejection criteria → inject → observe); injection types (instance termination, latency, FIT service-call failures); targeting strategy (random → targeted → cunning malevolent intelligence); automation and moderation (ChAP); disaster simulations (zombie simulation for human SPOFs).

Book fully ingested. Updated: `wiki/sources/release-it.md` (added Ch 17 section; all 17 chapters complete); created `wiki/concepts/chaos-engineering.md` (new page); `index.md` (updated release-it to fully ingested, added chaos-engineering, updated multiple concept entries); `README.md` (added Release It! to sources table); `CLAUDE.md` (added release-it slug to Book Slugs table); `_incoming/processing/release-it/` directory removed.

## [2026-05-19] ingest | Release It! — Batch 9 (Ch 16)

**Chapter 16 — Adaptation:** Decision loop speed (OODA) and competitive advantage; thrashing (pilot-induced oscillation — action rate exceeds feedback rate); platform team vs "DevOps team" antipattern; painless releases and service extinction (most important part of evolution); team-scale autonomy and two-pizza team; beware efficiency (utilization ≠ throughput; efficiency specializes); form follows failure (Petroski); bad layering as horizontal coupling obstacle; component-based decomposition; Baldwin & Clark's six modular operators (splitting, substituting, augmenting, excluding, inversion, porting); Fowler's four-way event taxonomy (notification/state-transfer/event-sourcing/CQRS); services control their identifiers; URL dualism; embrace plurality and federated zones of authority; concept leakage (price point example).

Updated: `wiki/sources/release-it.md` (added Ch 16 section); `wiki/concepts/evolutionary-architecture.md` (added "Form Follows Failure", "Bad Layering", "Decision Loop Speed and Thrashing" sections; updated sources table); `wiki/concepts/coupling.md` (added "Coupling Signals in Practice" section — coordinated deployments, concept leakage; updated sources table); `wiki/streams/event-sourcing-cqrs.md` (added "Fowler's Event Taxonomy" section; updated sources table).

## [2026-05-19] ingest | Release It! — Batch 8 (Ch 15)

**Chapter 15 — Case Study: Trampled by Your Own Customers:** Big-bang launch failure (250K sessions → crash in 30 min despite 3 months load testing); building for tests not production (config written for QA topology); sessions ≠ users distinction; four noise sources (old URL 404s, session IDs in URLs, shopbots, random traffic); the testing gap (polite scripts, no safety devices); rapid CDN mitigations (cookie detection, session throttle, IP block list, static home page); "nothing is as permanent as a temporary fix."

Updated: `wiki/sources/release-it.md` (added Ch 15 section); `wiki/concepts/common-failure-causes.md` (added "Building for Tests, Not for Production" section; updated sources); `wiki/concepts/monitoring.md` (added sessions ≠ users note in metrics section).

## [2026-05-19] ingest | Release It! — Batch 7 (Ch 13–14)

**Chapter 13 — Design for Deployment:** Zero-downtime deployment as a first-class feature; continuous deployment virtuous cycle ("if it hurts, do it more often"); four microscopic deployment phases (prepare/drain/apply/start); relational DB expand/contract pattern with shims; schemaless trickle-then-batch migration; web asset cache busting via URL path hash; canary group evaluation before rollout continues.

**Chapter 14 — Handling Versions:** Postel's Robustness Principle applied to API compatibility; taxonomy of safe vs breaking changes; implementation-as-de-facto-spec principle; URL versioning preference (loggable, routable by intermediaries, self-describing); bump-all-routes-together rule; version translation in controllers; inbound + outbound contract testing owned by consumers.

Updated: `wiki/sources/release-it.md` (added Ch 13–14 sections); `wiki/concepts/deployment-pipelines.md` (added Zero-Downtime Deployment section with four phases, expand/contract, trickle-then-batch, cache busting, canary group; updated sources table); `wiki/concepts/api-design.md` (added Non-Breaking vs Breaking Changes section with Postel's principle, safe/breaking change taxonomy, implementation-as-spec, version translation).

## [2026-05-17] ingest | Patterns of Enterprise Application Architecture — Batch 9 (Ch 16–17)

**Chapter 16 — Offline Concurrency Patterns:** Implementation detail for all four patterns. Optimistic Offline Lock: version column in WHERE clause of UPDATE/DELETE; zero-rows-affected = conflict; use as default. Pessimistic Offline Lock: application-managed lock manager; lock types (exclusive read/write, read-write); use as complement. Coarse-Grained Lock: shared Version object/table; two approaches (shared version vs group lock). Implicit Lock: decorator pattern on mappers; use everywhere.

**Chapter 17 — Session State Patterns:** Client Session State (stateless servers, security risk with sensitive data, always needed for session ID); Server Session State (simplest, serialize as BLOB; Fowler's preference); Database Session State (stateless server objects, clustering-friendly, per-request DB cost).

Updated: `wiki/sources/patterns-of-enterprise-application-architecture` (added Ch 16–17 sections); `wiki/databases/transactions` (enriched offline concurrency patterns with implementation detail, lock types, and decision guidance).

## [2026-05-17] ingest | Patterns of Enterprise Application Architecture — Batch 8 (Ch 14–15)

**Chapter 14 — Web Presentation Patterns:** Detailed catalog entries for MVC (view/controller separation less important than model/presentation separation), Page Controller (mix with Front Controller), Front Controller (decorator pattern for cross-cutting concerns), Template View (logic leakage risk, server-bound testing), Transform View (offline testing, XSLT portability, weak tooling), Two Step View (global appearance in one place, multi-brand), Application Controller (state machine, no UI dependency, wizard flows only).

**Chapter 15 — Distribution Patterns:** Remote Facade (coarse-grained wrapper, no logic, security/logging point, implies synchronous); Data Transfer Object (assembler pattern, multi-layer carrier, async use with Lazy Load); naming collision warning: J2EE "Value Object" = PEAA DTO (Fowler's "Value Object" pattern is different).

Updated: `wiki/sources/patterns-of-enterprise-application-architecture` (added Ch 14–15 sections); `wiki/patterns/mvc-web-presentation` (enhanced with trade-off detail from Ch 14 for all six patterns).

## [2026-05-17] ingest | Patterns of Enterprise Application Architecture — Batch 7 (Ch 12–13)

**Chapter 12 — Object-Relational Structural Patterns:** Key additions: Identity Field key generation strategies (auto-generate, GUID, key table — key table best portable option with separate transaction to minimize lock duration); Dependent Mapping (owner class handles child persistence when child is never independently addressed); Embedded Value (all Value Objects must use this) vs Serialized LOB (use when cluster isn't SQL-queryable from outside); inheritance strategy trade-offs tabulated (Single Table: no joins but null waste; Class Table: clean schema but joins; Concrete Table: no joins but FK constraints broken, superclass queries scan all tables) — strategies can mix within a hierarchy.

**Chapter 13 — Object-Relational Metadata Mapping Patterns:** Metadata Mapping (code generation vs reflection approaches; ORM tools use this); Query Object (Specification pattern applied to DB queries; buy don't build); Repository (by Hieatt & Mee — collection-like interface, Specification criteria, swap in-memory implementation for tests, strategy object enables multiple backends).

Updated: `wiki/sources/patterns-of-enterprise-application-architecture` (added Ch 12–13 sections); `wiki/databases/object-relational-mapping` (added Dependent Mapping, enhanced Serialized LOB, enhanced inheritance strategy guidance); `wiki/patterns/repository` (enhanced PEAA row with Specification pattern and in-memory test swapping detail).

## [2026-05-17] ingest | Patterns of Enterprise Application Architecture — Batch 6 (Ch 10–11)

**Chapter 10 — Data Source Architectural Patterns:** Detailed entries for TDG/RDG/Active Record/Data Mapper. Key additions: TDG return-type trade-offs (ResultSet vs DataSet vs DTO vs domain object); RDG separate Finder class for testability; Active Record coupling trade-off; Data Mapper empty-object pattern for cyclic reference handling; Separated Interface for domain-visible finders; buy-don't-build advice.

**Chapter 11 — Object-Relational Behavioral Patterns:** Detailed entries for Unit of Work, Identity Map, and Lazy Load. Key additions: UoW three registration approaches (caller, object, UoW-controller); ThreadLocal session scoping; topological sort for FK write ordering; deadlock reduction via consistent table order. Identity Map explicit vs generic; session-scoped vs process-scoped. Lazy Load four implementations (lazy initialization, virtual proxy, value holder, ghost); ripple loading / N+1 problem; ghost avoids cyclic loads by inserting into Identity Map before loading.

Updated: `wiki/sources/patterns-of-enterprise-application-architecture` (added Ch 10–11 sections); `wiki/databases/object-relational-mapping` (enriched all sections with pattern-level detail from Chs 10–11).

## [2026-05-17] ingest | Patterns of Enterprise Application Architecture — Batch 5 (Ch 9)

**Chapter 9 — Domain Logic Patterns (catalog):** Detailed pattern entries for Transaction Script, Domain Model, Table Module, and Service Layer illustrated with the revenue recognition example. Key insights: Domain Model's Strategy pattern eliminates runtime conditionals by encoding decisions into object structure; Table Module's C# ADO.NET example demonstrates `DataTable.Compute()` aggregate functions; Service Layer distinguishes domain logic (rules) from application logic (notifications, middleware publishing) — service layer owns the latter; operation script vs domain facade implementation approaches.

Updated: `wiki/sources/patterns-of-enterprise-application-architecture` (added Part 2 / Ch 9 section); `wiki/patterns/business-logic-patterns` (enhanced Service Layer with domain/application logic distinction, two implementation approaches, canonical example, remotability guidance).

## [2026-05-17] ingest | Patterns of Enterprise Application Architecture — Batch 4 (Ch 7–8)

**Chapter 7 — Distribution Strategies:** First Law of Distributed Object Design (don't distribute objects); fine-grained local vs coarse-grained remote interface distinction; clustering as the alternative; unavoidable distribution boundaries; Remote Facade + DTO as the canonical distribution boundary pattern; Web Services as Remote Facades for integration, not internal decomposition; preference for async message-based over synchronous RPC.

**Chapter 8 — Putting It All Together:** Complete decision tree mapping domain logic pattern → data source pattern; presentation layer choices; stored procedures as performance optimisation only; comparison of PEAA three-layer model vs Brown/Core J2EE/Microsoft DNA/Marinescu/Nilsson layering schemes.

**Pages updated:**

`wiki/sources/patterns-of-enterprise-application-architecture.md` — added ch. 7–8 notes.

`wiki/concepts/coupling.md` — added Fowler's First Law of Distributed Object Design section; added PEAA row to How Different Sources table; updated sources frontmatter.

`index.md` — updated PEAA source entry to ch. 1–8.

10 chapters remain (Part 2 pattern catalog: ch. 9–18).

## [2026-05-17] ingest | Patterns of Enterprise Application Architecture — Batch 3 (Ch 5–6)

**Chapter 5 — Concurrency:** Lost updates vs inconsistent reads; correctness vs liveness tension; isolation and immutability as the two solutions; optimistic (conflict detection at commit) vs pessimistic (conflict prevention via locks); deadlock prevention strategies; system vs business transactions; offline concurrency patterns (Optimistic Offline Lock, Pessimistic Offline Lock, Coarse-Grained Lock, Implicit Lock); application server concurrency (process-per-request vs thread-per-request).

**Chapter 6 — Session State:** Session state vs record data; stateless vs stateful servers and the pooling trade-off; three storage strategies (Client Session State, Server Session State, Database Session State); session migration vs server affinity; Fowler's preference for Server Session State with remote storage.

**Pages updated:**

`wiki/sources/patterns-of-enterprise-application-architecture.md` — added ch. 5–6 notes.

`wiki/databases/transactions.md` — added "Offline Concurrency" section covering business vs system transactions and all four offline concurrency patterns; added PEAA to sources frontmatter and How Different Sources table.

`index.md` — updated PEAA source entry to ch. 1–6.

12 chapters remain.

## [2026-05-17] ingest | Patterns of Enterprise Application Architecture — Batch 2 (Ch 3–4)

**Chapter 3 — Mapping to Relational Databases:** Four data source architectural patterns and their selection heuristic; behavioural patterns (Unit of Work, Identity Map, Lazy Load); structural mapping (Identity Field, Foreign Key Mapping, Association Table Mapping, Embedded Value, Serialized LOB); three inheritance mapping strategies (Single/Class/Concrete Table Inheritance, Fowler defaulting to Single); Repository built on Metadata Mapping + Query Object; iterative development advice (persist each iteration, max 6 weeks).

**Chapter 4 — Web Presentation:** MVC pattern (input controller / model / view); Page Controller vs Front Controller; Template View vs Transform View; Two Step View for global layout control; Application Controller for complex screen flow.

**Pages created:**

`wiki/databases/object-relational-mapping.md` — new page covering all O/R mapping architectural, behavioural, structural, and inheritance patterns from PEAA ch. 3.

`wiki/patterns/mvc-web-presentation.md` — new page for MVC and web presentation patterns from PEAA ch. 4.

**Pages updated:**

`wiki/sources/patterns-of-enterprise-application-architecture.md` — added ch. 3–4 notes.

`wiki/patterns/repository.md` — added PEAA row to How Different Sources table; updated sources frontmatter.

`index.md` — added new database and pattern page entries; updated PEAA source entry to ch. 1–4.

14 chapters remain.

## [2026-05-17] ingest | Patterns of Enterprise Application Architecture — Batch 1 (Ch 1–2)

First ingest of PEAA. Chose this book alongside Release It! (processed separately) as the next two sources.

**Chapter 1 — Layering:** Three-layer model (Presentation / Domain / Data Source); layer vs tier distinction; benefits and downsides of layering; inviolable rule: domain and data source must never depend on presentation; Hexagonal Architecture mentioned as symmetrical alternative; distribution as "complexity booster" — avoid unless essential; Remote Facades and DTOs as the cost of distributing layers.

**Chapter 2 — Organizing Domain Logic:** Transaction Script (procedure per action; simple; degrades with complexity); Domain Model (OO model around nouns; handles complexity; needs Data Mapper); Table Module (one instance per table; works with Record Set; .NET/COM fit); Service Layer (thin facade over domain model; transaction control + security; prefer thin; controller-entity anti-pattern).

**Pages created:**

`wiki/sources/patterns-of-enterprise-application-architecture.md` — new source page (ch. 1–2 notes).

`wiki/authors/martin-fowler.md` — new author page.

**Pages updated:**

`wiki/styles/layered-architecture.md` — added PEAA row to How Different Sources table; added PEAA to sources frontmatter.

`wiki/patterns/business-logic-patterns.md` — added Table Module and Service Layer sections (PEAA originating treatments); added PEAA row to How Different Sources table; updated sources frontmatter.

`index.md` — added PEAA source entry and Martin Fowler author entry.

16 chapters remain.

```bash
# Last 5 entries:
grep "^## \[" log.md | tail -5
```

---

## [2026-05-15] lint | Wiki health-check #2

Ran full broken-link scan across all 128 wiki pages.

**Fixed:**
- 4 broken links to non-existent `concepts/understanding-distributed-systems-transactions` → corrected to `concepts/distributed-transactions` in `data-decomposition.md`, `fallacies-of-distributed-computing.md`, `service-granularity.md`, `service-based-architecture.md`
- `patterns/eventstorming` → `concepts/eventstorming` in `concepts/ubiquitous-language.md`
- `concepts/domain-model` → `patterns/domain-model` in `concepts/model-driven-design.md`
- `type: pattern` → `type: reference` in `reference/technology-glossary.md`
- Argo Rollouts cross-reference `concepts/api-gateway` → `concepts/deployment-pipelines` in `reference/technology-glossary.md`

**Created:** `concepts/coupling.md` — synthesises structural coupling (Ca/Ce, A/I/D, connascence), Newman's operational coupling taxonomy (implementation/temporal/deployment/domain), contract coupling (strict/loose/stamp), integration-style coupling spectrum, quantum coupling model, and coupling management principles across all five sources.

**Updated:** `index.md` (coupling page added).

Zero orphan pages, zero remaining broken links.

## [2026-05-15] ingest | Enterprise Integration Patterns — Batch 7 (Ch 13–14) — COMPLETE

Read Ch 13 (Integration Patterns in Practice) and Ch 14 (Concluding Remarks) from `_incoming/processing/enterprise-integration-patterns/`.

Ch 13 is a case study — no new patterns. Bond Pricing System (Wall Street bank, Jonathan Simon): integration style chosen as Messaging over RPC to support multi-client server→client broadcast (Pub-Sub) and client→server processing (Point-to-Point). Messaging Bridge built from two Channel Adapters + CORBA to connect TIB and MQSeries. Channel structuring: per-bond channels on TIB (cheap, fine-grained); per-trader channels on JMS (fewer, aggregated). Aggregator (not Message Filter) chosen for flash-rate control to preserve data integrity across 50 partial-update fields. Client changed from Event-Driven to Polling Consumer to self-throttle update rate. Production crash caused by dead letter queue overflow from slow consumers on Pub-Sub — fixed by Message Dispatcher (Competing Consumers doesn't work on Pub-Sub).

Ch 14 — standards survey (BPEL, WS-Reliability, WS-I, W3C Choreography, JCP). No new patterns. Enduring thesis: patterns remain stable while implementation strategies evolve; standardisation increases pattern applicability by enabling higher abstraction levels.

Post-completion cleanup: preamble moved to processed, processing directory removed. `README.md` updated (EIP added to sources table). `enterprise-integration-patterns` slug added to `CLAUDE.md`.

Pages updated: `wiki/sources/enterprise-integration-patterns.md` (Ch 13 + Ch 14 chapter notes), `index.md` (source entry → fully ingested 2026-05-15).

Files moved: `13-integration-patterns-in-practice.txt`, `14-concluding-remarks.txt`, `00-preamble.txt` → `_incoming/processed/enterprise-integration-patterns/`. Processing directory removed.

*Enterprise Integration Patterns* fully ingested (Ch 1–14).

## [2026-05-15] ingest | Enterprise Integration Patterns — Batch 6 (Ch 11–12)

Read Ch 11 (System Management) and Ch 12 (Interlude: System Management Example) from `_incoming/processing/enterprise-integration-patterns/`.

Ch 11 introduces 8 system management patterns: Control Bus (separate management messaging layer; 5 message types: configuration/heartbeat/test/exceptions/statistics), Detour (Content-Based Router toggled via Control Bus; like debug-mode assert statements), Wire Tap (fixed 2-output Recipient List for passive observation; caveat: new message ID on republish), Message History (component IDs list in message header; enables path tracing + infinite-loop detection; hierarchical vs. list variants for aggregating components), Message Store (persistent central store via Wire Tap; header-only vs. full body; per-type vs. XML blob storage; needs purging), Smart Proxy (intercepts Request-Reply services with dynamic Return Address; stores Return Address; measures QoS; constructs own Correlation ID to handle multi-requestor reply channel), Test Message (active verification: Generator + Injector + Separator + Verifier; do not overload business fields as tags; Return Address as natural separator; stateful component caveat), Channel Purger (removes leftover messages; discard or store-for-replay; use cases: test reset, poison message removal).

Ch 12 is a code interlude — no new patterns. Applies Ch 11 patterns to MSMQ/C# Loan Broker from Ch 9: Smart Proxy for QoS measurement, Wire Tap + Message Store for credit bureau audit logging, Test Message for active credit bureau monitoring, Detour for failover routing, Control Bus for management console.

Pages updated: `wiki/sources/enterprise-integration-patterns.md` (Ch 11 + Ch 12 chapter notes), `wiki/concepts/messaging.md` (new System Management Patterns section — 8 patterns), `index.md` (source entry → ch. 1–12; messaging entry expanded).

Files moved: `11-system-management.txt`, `12-interlude-system-management-example.txt` → `_incoming/processed/enterprise-integration-patterns/`.

2 chapters remain (Ch 13–14).

## [2026-05-15] ingest | Enterprise Integration Patterns — Batch 5 (Ch 9–10)

Read Ch 9 (Interlude: Composed Messaging) and Ch 10 (Messaging Endpoints) from `_incoming/processing/enterprise-integration-patterns/`.

Ch 9 is a code interlude — no new patterns. Documents the Loan Broker example demonstrating pattern composition: Content Enricher + Scatter-Gather + Normalizer + Aggregator. Three implementations (sync Web Services, async MSMQ/Recipient List, async TIBCO/Pub-Sub/Process Manager) showing how abstract design choices (sequencing, addressing, aggregation, concurrency) produce radically different concrete implementations.

Ch 10 introduces 11 endpoint patterns: Messaging Gateway (blocking vs. event-driven; ACT pattern; Service Stub testing), Messaging Mapper (domain↔message separation; Observer trigger; vs. Translator), Transactional Client (four coordination scenarios; caveat re Event-Driven Consumers), Polling Consumer (synchronous receiver; throttling by thread count), Event-Driven Consumer (callback model; JMS transaction caveat), Competing Consumers (horizontal scaling; Point-to-Point only; transactional inefficiency risk), Message Dispatcher (Dispatcher + Performers; Reactor/POSA2 analogy; intra-process only), Selective Consumer (header-based filtering; dynamic; security caveat re ACLs), Durable Subscriber (three subscriber states; explicit unsubscribe required; Message Expiration for storage bounding), Idempotent Receiver (de-duplication via ID history vs. absolute-state semantics; avoid dual-semantics on business keys), Service Activator (messaging-to-service adapter; Half-Sync/Half-Async; Transactional Client if service is transactional).

Pages updated: `wiki/sources/enterprise-integration-patterns.md` (Ch 9 + Ch 10 chapter notes), `wiki/concepts/messaging.md` (new Messaging Endpoints section — 11 patterns), `index.md` (source entry → ch. 1–10; messaging entry expanded).

Files moved: `09-interlude-composed-messaging.txt`, `10-messaging-endpoints.txt` → `_incoming/processed/enterprise-integration-patterns/`.

4 chapters remain (Ch 11–14).

## [2026-05-13] schema-update | Initial setup

Created wiki structure and CLAUDE.md schema. Established directory layout:
`wiki/sources/`, `wiki/concepts/`, `wiki/patterns/`, `wiki/authors/`, `wiki/comparisons/`.
Created `index.md` and `log.md`. Created placeholder `overview.md`.
9 source EPUBs present in `raw/` — none ingested yet.

## [2026-05-13] ingest | Fundamentals of Software Architecture — Richards & Ford

Ingested `fosa` (Fundamentals of Software Architecture, 2020). Read full ~111k word EPUB
via pandoc extraction. Created:
- `wiki/sources/fundamentals-of-software-architecture.md` — full source page (3 parts, 24 chapters, key claims, quotes)
- `wiki/authors/mark-richards.md`
- `wiki/authors/neal-ford.md`
- `wiki/concepts/architecture-characteristics.md`
- `wiki/concepts/architecture-quantum.md`
- `wiki/concepts/fitness-functions.md`
- `wiki/concepts/modularity.md`
- `wiki/concepts/adrs.md`
- `wiki/concepts/risk-storming.md`
- `wiki/concepts/technical-vs-domain-partitioning.md`
- `wiki/patterns/layered-architecture.md`
- `wiki/patterns/pipeline-architecture.md`
- `wiki/patterns/microkernel-architecture.md`
- `wiki/patterns/service-based-architecture.md`
- `wiki/patterns/event-driven-architecture.md`
- `wiki/patterns/space-based-architecture.md`
- `wiki/patterns/soa-architecture.md`
- `wiki/patterns/microservices-architecture.md`
- `wiki/comparisons/architecture-styles-comparison.md`
Updated `wiki/patterns/saga.md` (added FOSA perspective + contradiction note).
Updated `overview.md`, `index.md`.

---

## [2026-05-13] ingest | Understanding Distributed Systems — Roberto Vitillo

Ingested `distributed` (Understanding Distributed Systems, 2nd ed.). Read full ~70k word EPUB
via pandoc extraction. Created:
- `wiki/sources/understanding-distributed-systems.md` — full source page (5 parts, 33 chapters, key claims, quotes)
- `wiki/authors/roberto-vitillo.md`
- `wiki/concepts/consistency-models.md`
- `wiki/concepts/cap-theorem.md`
- `wiki/concepts/replication.md`
- `wiki/concepts/idempotency.md`
- `wiki/concepts/distributed-transactions.md`
- `wiki/concepts/crdts.md`
- `wiki/patterns/circuit-breaker.md`
- `wiki/patterns/saga.md`
- `wiki/patterns/outbox-pattern.md`
- `wiki/patterns/bulkhead.md`
- `wiki/patterns/sidecar-service-mesh.md`
Updated `index.md`, `overview.md`.

---

## [2026-05-13] ingest | Mastering API Architecture — Gough, Bryant, Auburn

Ingested `api-arch` (Mastering API Architecture, 2022). Read full EPUB via pandoc extraction (~12,500 lines). All 10 chapters read across two sessions. Created:
- `wiki/sources/mastering-api-architecture.md` — full source page (10 chapters, key claims, notable quotes)
- `wiki/authors/james-gough.md`
- `wiki/authors/daniel-bryant.md`
- `wiki/authors/matthew-auburn.md`
- `wiki/concepts/api-design.md` — REST/gRPC/GraphQL, OAS, RMM, versioning, API-first
- `wiki/concepts/api-gateway.md` — taxonomy, history, six capabilities, four pitfalls
- `wiki/concepts/api-testing.md` — test pyramid, CDC, Pact, component/integration/E2E
- `wiki/concepts/threat-modeling.md` — STRIDE, DREAD, OWASP API Top 10, rate limiting
- `wiki/concepts/oauth2-and-authn.md` — OAuth2 roles, JWT, all grant types, OIDC, SAML
- `wiki/concepts/zero-trust.md` — zonal model, NCSC principles, implementation stack
- `wiki/concepts/evolutionary-architecture.md` — seams, strangler fig, six Rs, Type 1/2 decisions
- `wiki/patterns/technology-glossary.md` — short entries for ~30 tools across gateways, meshes, testing, observability, identity
Rewrote `wiki/patterns/sidecar-service-mesh.md` — consistent narrative incorporating both `distributed` and `api-arch`; evolution timeline (libraries → sidecars → eBPF); security (SPIFFE); antipatterns; "How Different Sources Treat It" comparison.
Updated `wiki/concepts/fitness-functions.md` — added api-arch seven fitness function categories.
Updated `wiki/concepts/adrs.md` — added api-arch Discussion Points + Recommendations guideline format; Type 1 decision note.
Updated `overview.md` — added north/south vs east/west, API-as-seam, zero trust, deploy≠release sections; updated sources table and author list.
Updated `index.md` — added api-arch source, 7 new concept pages, 2 new pattern pages, 3 new author pages.

---

## [2026-05-13] schema-update | Directory restructure and lint pass

**Restructure:**
- Created `wiki/styles/` directory; moved 8 architecture style pages out of `wiki/patterns/`:
  `layered-architecture`, `pipeline-architecture`, `microkernel-architecture`, `service-based-architecture`, `event-driven-architecture`, `space-based-architecture`, `soa-architecture`, `microservices-architecture`
- Created `wiki/reference/` directory; moved `technology-glossary` out of `wiki/patterns/`
- Created `wiki/styles/architecture-styles.md` — summary/navigation page for all 8 styles
- Updated all wikilinks across the wiki from `patterns/X` → `styles/X` and `patterns/technology-glossary` → `reference/technology-glossary`
- Updated frontmatter `type` in all 8 style pages from `pattern` to `style`
- Updated `CLAUDE.md`: new directory layout, `style` and `reference` types added, placement guidance for ingest
- Updated `index.md`: split Patterns section into Architecture Styles, Implementation Patterns, Reference

**Lint fixes:**
- Added inbound links to `styles/architecture-styles` from `comparisons/architecture-styles-comparison` and `overview.md`
- Added inbound links to `reference/technology-glossary` from `concepts/api-testing` and `concepts/fitness-functions`
- All pages now have ≥ 2 inbound links

---

## [2026-05-13] ingest | Building Evolutionary Architectures — Ford, Parsons, Kua

Ingested `evo-arch` (Building Evolutionary Architectures, 2017). Read full ~57k word EPUB via pandoc extraction (~8,184 lines). Created:
- `wiki/sources/building-evolutionary-architectures.md` — full source page (8 chapters, key claims, evolvability scorecard, antipatterns table)
- `wiki/authors/rebecca-parsons.md`
- `wiki/authors/patrick-kua.md`
- `wiki/concepts/conways-law.md` — Conway's Law, Inverse Conway Maneuver, n(n-1)/2 connection links, cross-functional teams
- `wiki/concepts/deployment-pipelines.md` — pipeline vs CI, stage structure, fan-in/fan-out, CD vs CDP, cycle time, enterprise templates
- `wiki/concepts/evolutionary-database-design.md` — expand/contract pattern, Flyway/Liquibase, three shared DB decomposition scenarios, reporting antipattern

Significantly updated:
- `wiki/concepts/fitness-functions.md` — rewrote as multi-source synthesis; added full evo-arch taxonomy (5 classification dimensions), priority tiers, key principles (intentional vs emergent, identify early, review cadence), enterprise fitness functions; evo-arch now primary source
- `wiki/concepts/evolutionary-architecture.md` — rewrote with evo-arch as primary source; added three pillars, evolvability-by-style table, guidelines table, antipatterns table; api-arch content (seams, strangler fig, six Rs) retained and reframed
- `wiki/concepts/architecture-quantum.md` — added bounded context as quantum boundary, sweet-spot cost curve, per-quantum style selection, transactions as strong nuclear force, updated sources
- `wiki/authors/neal-ford.md` — marked evo-arch as ingested; updated book section

Updated `overview.md` — expanded Governance section with evo-arch three-pillars framing; added Team Structure Is Architecture section (Conway's Law); updated sources table; updated open questions.
Updated `index.md` — added evo-arch source, 3 new concept pages, 2 new author pages; updated entries for fitness-functions, evolutionary-architecture, architecture-quantum.

---

## [2026-05-13] schema-update | Added databases/ and streams/ directories

Added two new top-level wiki directories in preparation for DDIA ingest:
- `wiki/databases/` — database internals: storage engines, data models, encoding, OLTP/OLAP (type: `database`)
- `wiki/streams/` — batch and stream processing: MapReduce, Kafka, event sourcing, CQRS (type: `stream`)

Updated `CLAUDE.md`: directory layout, directory guidance block, frontmatter type list, placement rules.
Updated `index.md`: added placeholder Databases and Streams sections.

---

## [2026-05-13] ingest | Designing Data-Intensive Applications — Martin Kleppmann

Ingested `ddia` (Designing Data-Intensive Applications, 2017). Read full ~230k word EPUB via pandoc extraction (~30,348 lines) across three sessions with context compaction. Created:
- `wiki/sources/designing-data-intensive-applications.md` — full source page (12 chapters across 3 parts, key claims, notable quotes, contradiction and open question notes)
- `wiki/authors/martin-kleppmann.md`

**New database pages:**
- `wiki/databases/storage-engines.md` — hash indexes, SSTables/LSM-Trees, B-Trees, OLTP vs OLAP, column-oriented storage, write amplification trade-offs
- `wiki/databases/data-models.md` — relational, document, graph models; schema-on-read/write; SQL, Cypher, SPARQL, Datalog query languages
- `wiki/databases/encoding-and-evolution.md` — JSON/XML, Thrift, Protobuf, Avro; field tags; schema evolution rules; dataflow modes (database, service, async messaging)
- `wiki/databases/transactions.md` — ACID, isolation levels (dirty read, read skew, write skew, phantom), MVCC snapshot isolation, SSI, actual serial execution, 2PL

**New stream pages:**
- `wiki/streams/batch-processing.md` — Unix philosophy, MapReduce phases and joins, Hadoop vs MPP, Spark/Flink/Tez dataflow engines, Pregel/BSP graph processing
- `wiki/streams/stream-processing.md` — AMQP/JMS vs log-based (Kafka), windowing types, event time vs processing time, stream-stream/stream-table/table-table joins, exactly-once fault tolerance
- `wiki/streams/event-sourcing-cqrs.md` — CDC vs event sourcing, CQRS write/read path separation, state = integral of event stream, immutability benefits and GDPR limits

**New concept pages:**
- `wiki/concepts/partitioning.md` — key range, hash, consistent hashing, virtual nodes, secondary index trade-offs (local scatter-gather vs global term-based), rebalancing strategies, request routing
- `wiki/concepts/consensus-algorithms.md` — FLP result, Raft, Paxos, Zab, VSR, ZooKeeper/etcd, epoch numbers, quorum overlap, equivalence theorem, 2PC vs fault-tolerant consensus, XA transactions

**Significantly updated:**
- `wiki/concepts/replication.md` — added replication lag anomalies (read-your-writes, monotonic reads, consistent prefix reads), multi-leader conflict resolution, DDIA cross-source comparison
- `wiki/concepts/consistency-models.md` — added precise linearizability definition, linearizability ≠ serializability clarification, timeliness vs integrity distinction, safety vs liveness, DDIA perspective
- `wiki/concepts/cap-theorem.md` — added Kleppmann's "best avoided" critique, five specific criticisms, DDIA vs distributed source comparison
- `wiki/concepts/distributed-transactions.md` — added XA transactions detail (coordinator SPOF, 10× slowdown), coordination-avoiding correctness model (Ch. 12), timeliness/integrity framing, DDIA vs distributed source comparison

Updated `overview.md` — added storage engines section (LSM-Trees vs B-Trees, log as unifying abstraction), timeliness/integrity distinction, batch/stream derived data framework, consensus is required for linearizability; updated sources table; updated open questions.
Updated `index.md` — populated Databases and Streams sections; added ddia to Sources; added partitioning and consensus-algorithms to Concepts; added martin-kleppmann to Authors; updated summaries for cap-theorem, consistency-models, distributed-transactions, replication.

---

## [2026-05-14] schema-update | Chapter-splitting workflow

New mechanism for managing large book ingestion:

- Created `processing/` and `processed/` directories for per-chapter txt files
- Created `split_epub.py` — splits a pandoc-extracted txt file into per-chapter files, auto-detecting headings (lines matching `^\d{1,2} [A-Z]` preceded by blank line, < 60 chars)
- Split *Understanding Distributed Systems* (Roberto Vitillo) into 35 files (1 preamble + 34 chapters) in `processing/distributed/`; all 34 chapters detected correctly
- Updated `CLAUDE.md`: new directory layout, chapter-splitting instructions, updated ingest workflow to reference chapter-by-chapter approach

---

## [2026-05-14] ingest | Understanding Distributed Systems — Chapters 1–5 (networking layer)

Read and processed `processing/distributed/` chapters 01–05. Created:
- `wiki/concepts/tls.md` — TLS encryption (asymmetric key exchange + symmetric data), authentication (digital signatures, certificate chain, root CA, Let's Encrypt), integrity (HMAC), handshake sequence, TLS 1.2 vs 1.3 round trips, certificate expiry as operational risk, mTLS
- `wiki/concepts/dns.md` — DNS as distributed/hierarchical/eventually consistent KV store, full resolution process (browser → resolver → root NS → TLD NS → authoritative NS), TTL trade-offs, DNS as SPOF, static stability principle, DNS over TLS
- `wiki/concepts/http.md` — HTTP/1.1 (text, persistent connections, HOL blocking), HTTP/2 (binary, multiplexing, HPACK, TCP HOL blocking remains), HTTP/3 (QUIC/UDP, per-stream loss, integrated TLS), connection management and cold-start costs
- `wiki/concepts/availability.md` — Uptime/downtime definition, nines table (90%–99.999%), availability vs reliability vs resiliency, dependency chaining formula, SLA/SLO/SLI framing, techniques (redundancy, fault isolation, static stability, graceful degradation)

Significantly updated:
- `wiki/concepts/api-design.md` — Added: URL resource modeling (hierarchy, nesting guidance), HTTP methods safe/idempotent table (GET/PUT/DELETE/POST/PATCH), status code taxonomy (2xx/3xx/4xx/5xx with key codes), content negotiation, REST stateless constraint framing; added `distributed` as source
- `wiki/concepts/idempotency.md` — Added atomicity requirement for idempotency key storage (key + operation in same transaction), principle of least astonishment (return same response as original), Stripe as canonical example, key retention/purge window

Updated `index.md` — added tls, dns, http, availability to Concepts; updated api-design and idempotency summaries.

Chapters 01–05 moved to `processed/distributed/`.

---

## [2026-05-14] ingest | Understanding Distributed Systems — Chapters 6–10 (coordination layer)

Read and processed `processing/distributed/` chapters 06–10. Created:
- `wiki/concepts/system-models.md` — link models (fair-loss/reliable/authenticated reliable), process failure models (Byzantine/crash-recovery/crash-stop, Byzantine tolerance bound), timing models (sync/async/partial sync); book's default assumptions; mapping to real protocols (TCP→reliable, TLS→authenticated, Raft→crash-recovery)
- `wiki/concepts/failure-detection.md` — fundamental impossibility of perfect failure detection; timeout trade-off (too short = false positives, too long = slow recovery); pings (pull) vs heartbeats (push); when to use active vs passive detection
- `wiki/concepts/logical-clocks.md` — physical clock failures (drift, NTP jumps, monotonic clock limitation); happened-before relation and causal bonds; Lamport clocks (rules, total order, does not imply causality); vector clocks (partial order, concurrent detection, O(n) storage)
- `wiki/concepts/leader-election.md` — safety + liveness properties; Raft state machine (follower/candidate/leader), election terms, majority vote, split vote recovery; CAS+lease practical implementation (etcd, ZooKeeper); lease mutual exclusion problem (clock skew + network delay); fencing tokens/version numbers as solution; leader as SPOF and scalability bottleneck; per-partition leaders

Significantly updated:
- `wiki/concepts/replication.md` — expanded chain replication: head/tail roles, write path (forward propagation), ack path (backward), three failure modes (head/tail/intermediate) with recovery actions, dirty flag read optimization for distributing reads while maintaining linearizability, data/control plane split pattern
- `wiki/concepts/consistency-models.md` — added "Replication Decisions Map to Consistency Models" section: concrete Raft-based table showing how read routing choice (leader-quorum / pinned-follower / any-follower) determines which model is achieved; note on why leader cannot serve reads from local state without quorum confirmation

Updated `index.md` — added system-models, failure-detection, logical-clocks, leader-election to Concepts; updated replication and consistency-models summaries.

Chapters 06–10 moved to `processed/distributed/`.

---

## [2026-05-14] ingest | Understanding Distributed Systems — Chapters 11–15 (coordination avoidance and scalability layer)

Read and processed `processing/distributed/` chapters 11–15. Created:
- `wiki/concepts/broadcast-protocols.md` — best-effort, reliable (eager), gossip, total order broadcast; O(N²) cost of eager reliable; consensus requirement for total order; equivalence to consensus; role of each protocol in CRDTs vs state machine replication
- `wiki/concepts/caching.md` — HTTP caching lifecycle (Cache-Control, ETag, fresh/stale, If-None-Match, 304); immutable static resources + URL versioning for atomic deploys; CQRS framing; reverse proxies (NGINX, HAProxy) and their capabilities
- `wiki/concepts/cdn.md` — CDN as overlay network; BGP limitations (hop-count routing, no latency awareness); global DNS LB; IXP co-location; TCP optimisation (persistent pools, window sizing); edge + intermediary caching layers; cache hit ratio vs. coverage tradeoff; DDoS shielding for dynamic content

Significantly updated:
- `wiki/concepts/crdts.md` — rewrote Core Insight as formal Formal Definition section (semilattice + LUB merge = strong eventual consistency); strengthened CALM section with Vitillo's counter example (write vs increment) and clarification that CALM's "consistent" ≠ linearizability (it is application-level output consistency); expanded Related Pages
- `wiki/concepts/consistency-models.md` — added Strong Eventual Consistency as explicit spectrum entry (between eventual and causal); added COPS causal+ implementation section (dependency dictionary, LWW register values, dependency-wait before apply, availability trade-off)
- `wiki/concepts/distributed-transactions.md` — added 2PC as uniform consensus (harder than standard consensus); expanded Spanner TrueTime detail (t_latest assignment, wait-out-uncertainty mechanism, ~7 ms uncertainty window); added CockroachDB hybrid-logical clocks
- `wiki/databases/transactions.md` — added Hellerstein "C in ACID" note (tossed in to make acronym work); added strict serializability definition (serializability + linearizability real-time order); noted PostgreSQL defaults to Read Committed
- `wiki/patterns/saga.md` — added "Apology Model" section (Vitillo's framing: Tᵢ is an optimistic guess; compensations are apologies); expanded orchestrator section with durable state machine checkpoints and idempotency requirement for participants
- `wiki/concepts/replication.md` — added W+R>N linearizability caveat (partial write failure leaves inconsistent state; need atomic transaction for true linearizability)

Updated `index.md` — added broadcast-protocols, caching, cdn to Concepts; updated crdts and consistency-models summaries.

Chapters 11–15 moved to `processed/distributed/`.

---

## [2026-05-14] ingest | Understanding Distributed Systems — Chapters 16–20 (scalability layer: partitioning, storage, load balancing, caching)

Read and processed `processing/distributed/` chapters 16–20. Created:
- `wiki/concepts/load-balancing.md` — DNS LB (global traffic steering only, TTL failure problem), L4 transport-layer LB (VIP, consistent hashing, direct server return, Anycast+ECMP horizontal scaling), L7 application-layer LB (TLS termination, sticky sessions, rate limiting, L4 stacked behind for DDoS); service discovery via etcd/ZK with TTL; health checks: passive vs active; watchdog pattern for gray failures; power of two random choices; availability math (nines add up)

Significantly updated:
- `wiki/concepts/caching.md` — expanded with full application-layer caching from ch. 20: hit ratio factors, caching-as-optimization principle (origin must survive without it), side vs inline cache, LRU eviction, TTL trade-off, deferred expiry for resilience, cache invalidation hardness; local cache (thundering herd, request coalescing); external cache (Redis, Memcached, consistent hashing on rebalance, cascading failure risk on cache failure)
- `wiki/concepts/partitioning.md` — updated `distributed` source row in comparison table; added `distributed` to frontmatter sources
- `wiki/concepts/replication.md` — added Azure Storage chain replication case study (stream layer, extent replication, stream manager control plane, 3-layer architecture); S3 strong consistency added only in 2021; added ch. 17 source citation
- `wiki/databases/data-models.md` — added NoSQL access-pattern-driven design section: DynamoDB single-table design (partition+sort key as entity discriminator, colocating customers+orders), LSI vs GSI trade-offs; misconception corrected: NoSQL requires MORE upfront data modeling not less; DynamoDB architecture ≠ Dynamo paper (uses Raft, not quorum); added `distributed` to frontmatter sources

Chapter 17 (Azure Storage) had no new concept pages warranting creation — its value was in illustrating chain replication and data/control plane separation in a real system; folded into replication.md.

Updated `index.md` — added load-balancing to Concepts; updated caching and partitioning summaries.

Chapters 16–20 moved to `processed/distributed/`.

---

## [2026-05-14] ingest | Understanding Distributed Systems — Chapters 21–25 (microservices, messaging, and start of resiliency)

Read and processed `processing/distributed/` chapters 21–25. Created:
- `wiki/concepts/control-plane-data-plane.md` — data plane (critical path, availability), control plane (off-path, consistency); system availability = product of hard dependencies; static stability; three solutions to scale imbalance (file store buffer, push deltas, hybrid); control theory framing (closed feedback loop: monitor + compare + act); real-world examples table (chain replication, Azure Storage, API gateway, service mesh, Kubernetes)
- `wiki/concepts/messaging.md` — commands vs events; one-way/req-resp/broadcast styles; point-to-point vs pub-sub; at-least-once delivery; visibility timeout; exactly-once delivery impossibility; simulated exactly-once via idempotency; dead letter channel; backlog bimodal failure mode; poison message isolation via secondary channel
- `wiki/concepts/common-failure-causes.md` — six-cause taxonomy: hardware, incorrect error handling (2014 study: most catastrophic failures), configuration changes (delayed effect danger), SPOFs (humans, DNS, TLS cert expiry), gray failures/resource leaks, load pressure, cascading/metastable failures; risk = probability × impact matrix

Significantly updated:
- `wiki/styles/microservices-architecture.md` — added "The Micro Misconception" (small surface area + significant functionality); added "Distributed Monolith" antipattern section (fragile APIs, shared libs, static IPs, shared DBs; detection: coordinated deployment = distributed monolith)
- `wiki/concepts/api-gateway.md` — added auth/authz split section (gateway authenticates, services authorise; opaque vs transparent token; JWT trade-offs; API keys); added composition availability caveat (composed_avail = product of upstream availabilities); updated `distributed` source row in comparison table; added `distributed` to frontmatter sources
- `wiki/concepts/availability.md` — added Redundancy section: Marc Brooker's four prerequisites; correlation as the key constraint; AZ architecture (synchronous replication viable within AZs); multi-region (async only, often driven by legal compliance not failure probability)

Chapter 25 (redundancy) folded into `concepts/availability.md` — content extends that page's techniques section directly.

Updated `index.md` — added control-plane-data-plane, messaging, common-failure-causes to Concepts.

Chapters 21–25 moved to `processed/distributed/`.

## [2026-05-14] schema-update | Rename source files to full book title slugs

Renamed all 5 source files from short slugs to full kebab-case book titles:
- `api-arch.md` → `mastering-api-architecture.md`
- `ddia.md` → `designing-data-intensive-applications.md`
- `distributed.md` → `understanding-distributed-systems.md`
- `evo-arch.md` → `building-evolutionary-architectures.md`
- `fosa.md` → `fundamentals-of-software-architecture.md`

Updated all wikilinks, frontmatter `sources:` arrays, `(informed by:)` index entries, and `**Slug:**` metadata fields across ~75 wiki pages using perl find-replace. Updated `CLAUDE.md` book slugs table to use full-title slugs for all books (including future uningested books).

## [2026-05-14] ingest | Understanding Distributed Systems — Chapters 26–30

Chapters: fault isolation, downstream resiliency, upstream resiliency, testing, continuous delivery.

**Ch 26 (Fault Isolation)**: Already fully captured in `patterns/bulkhead.md` (shuffle sharding, cellular architecture). No changes made.

**Ch 27 (Downstream Resiliency)**: Expanded `patterns/circuit-breaker.md` with two new sections — Timeouts (P99.9 sizing, library gotchas, sidecar proxy delegation) and Retries (exponential backoff formula, jitter, retry amplification in service chains, retry queues). The existing state machine and graceful degradation sections unchanged.

**Ch 28 (Upstream Resiliency)**: Created `concepts/rate-limiting.md` covering load shedding (503, priority/age ordering), load leveling (async channel + auto-scaling), rate limiting (sliding window bucket algorithm, distributed atomic increment + batch flushing, fail-open on store outage), and constant work pattern (periodic full-state dump, antifragile, self-healing).

**Ch 29 (Testing)**: Expanded `concepts/api-testing.md` with distributed perspective: scope × size orthogonality, test double fidelity hierarchy (real > official fake > stub > mock), user journey tests, and formal verification with TLA+ (safety + liveness properties, Amazon S3/Cosmos DB usage, dual-write migration bug example).

**Ch 30 (CD)**: Expanded `concepts/deployment-pipelines.md` with practitioner view: 4-stage pipeline diagram, PR review checklist (tests/observability/backward-compat/rollback-safe), bake time mechanics, health monitoring scope (service + upstream + downstream), and prepare/activate/cleanup pattern for backward-incompatible changes.

Updated `index.md` — added rate-limiting; updated api-testing and deployment-pipelines summaries.
Chapters 26–30 moved to `processed/distributed/`.

## [2026-05-14] ingest | Understanding Distributed Systems — Chapters 31–33 (maintainability: monitoring, observability, manageability)

Final ingest of *Understanding Distributed Systems* (chapters 31–33; ch 34 is motivational/bibliographic only).

**Ch 31 (Monitoring)**: Created `concepts/monitoring.md` — black-box vs white-box monitoring (synthetics); metrics (time series, labels, pre-aggregation trade-offs); SLIs (ratio definition, percentiles over averages, Little's Law tail-latency effect); SLOs (error budget, multiple windows, stakeholder alignment, 100% impossibility, ≤3 nines practical); burn rate alerting (rate of error budget exhaustion, tiered severity thresholds); three dashboard types (SLO, Public API, Service) with best practices (version-control dashboards as code, UTC, deploy/alert markers, emit zero not absence); chaos testing; on-call practices (mitigate first, postmortem, feature freeze when error budget exhausted).

**Ch 32 (Observability)**: Created `concepts/observability.md` — observability as superset of monitoring; three telemetry sources (metrics, event logs, traces) with their storage characteristics; relationship (metrics + traces as derived views of event logs); structured logging best practices (one event per work unit, request ID, PII sanitization, sampling strategy, rate-limit log collectors, async logging); distributed tracing (trace ID propagation via HTTP headers, spans, collector assembly, Zipkin/X-Ray); trace use cases (specific request debugging, bottleneck identification, resource attribution); retrofitting challenge; service mesh as propagation assist.

**Ch 33 (Manageability)**: Created `concepts/manageability.md` — dynamic configuration (dedicated config store vs env-var limitation, runtime re-read); feature flags (progressive rollout, A/B testing, kill switch, deployment-release decoupling, flag accumulation risk); operational triad (monitor → observe → manage).

**Glossary additions** in `reference/technology-glossary.md`: AWS X-Ray, ELK Stack, AWS CloudWatch, AWS AppConfig / Azure App Configuration.

Updated `index.md` — added monitoring, observability, manageability to Concepts.
All remaining processing files (31–34, preamble) moved to `processed/understanding-distributed-systems/`.
*Understanding Distributed Systems* fully ingested.

---

## [2026-05-14] ingest | Mastering API Architecture — Chapters 1–5

Chapter-by-chapter ingestion of `_incoming/processing/mastering-api-architecture/` files 01–05. Source page already existed from prior full-read ingest; this session added depth to five concept/pattern pages.

**Pages updated:**

`wiki/concepts/api-design.md` — Added: REST practical design guidelines (pagination anti-pattern, PII in URLs, error handling/stack trace warning); cross-spec pitfall (generating proto from OAS breaks binary field-number stability); recommendation to keep REST and gRPC interfaces designed independently.

`wiki/concepts/api-testing.md` — Added: CDC as a social/collaborative process (consumer submits PR, discussion, acceptance); Pact vs Spring Cloud Contracts comparison (generated intermediate representation vs hand-written, polyglot vs JVM bias); contract storage options ranked by recommendation (Pact Broker > centralized repo > alongside producer code).

`wiki/concepts/api-gateway.md` — Added: Full 10-stage API lifecycle management table (building → testing → publishing → securing → managing → onboarding → analyzing → promoting → monetizing → retirement); note on which gateway types support which stages.

`wiki/patterns/sidecar-service-mesh.md` — Added: The 8 Fallacies of Distributed Computing (Deutsch, 1990s) as the foundational motivation for service meshes; full proxy vs half proxy distinction; traffic shaping vs traffic policing definitions; resource cost figures at scale (~2GB/node for 100 Envoy proxies after optimization).

`wiki/concepts/deployment-pipelines.md` — Added major new section "Deployment ≠ Release: API Lifecycle and Release Strategies" covering: API lifecycle stages (planned/beta/live/deprecated/retired) with transition rules; release strategy comparison (canary/traffic mirroring/blue-green) with trade-off table; RED metrics and Four Golden Signals; 4xx vs 5xx context (403 clusters can indicate malicious actors); response caching gotcha during canary releases; header propagation rules (tracing headers must be copied; OAuth2 bearer token safe to forward, raw auth credentials must not); journal vs diagnostics logging distinction; opinionated platform / paved path concept.

Files moved to `_incoming/processed/mastering-api-architecture/`: 01–05.

---

## [2026-05-14] ingest | Mastering API Architecture — Chapters 6–10

Chapter-by-chapter ingestion of chapters 06–10. Source page chapter notes and primary concept pages were already comprehensive from the prior full-read ingest; this session added implementation depth.

**Pages updated:**

`wiki/concepts/threat-modeling.md` — Added: "Security Hardening at the Gateway" section (TLS 1.2+ requirement, CORS configuration, HTTP header allowlisting, trust-but-verify layering between gateway and service); "Friendly Fire DoS" section (accidental internal circular dependencies causing DoS); "DREAD and DREAD-D" section (DREAD-D drops Discoverability to avoid rewarding security through obscurity; CVSS as alternative standardised scoring).

`wiki/concepts/oauth2-and-authn.md` — Added: "API Keys" section covering security requirements (32 chars, 256-bit, cryptographically random), the don't-mix-keys-and-users anti-pattern (third party cannot assert user identity from key alone), and HTTP Basic warning (forces credential sharing). Added NIST guidance on long-lived token risk; added `sub` claim UUID note (use stable unique ID, not email).

`wiki/concepts/evolutionary-architecture.md` — Added: "Fitness Function Categories for API Systems" table (code quality, resiliency, observability, performance, compliance, security, operability) from ch. 8 API architecture perspective; "API Layer Cake (Antipattern)" section (Gartner Pace-Layered / SoE/SoD/SoR — avoid; same failure modes as layered monolith).

`wiki/reference/technology-glossary.md` — Added: AsyncAPI entry (open specification for async/event-driven APIs; fills same role as OpenAPI for REST; supports Kafka, AMQP, MQTT, WebSockets, STOMP).

Files moved to `_incoming/processed/mastering-api-architecture/`: 06, 07, 08, 09, 10, 00 (preamble).
*Mastering API Architecture* fully ingested.

---

## [2026-05-14] ingest | Building Evolutionary Architectures — Chapters 1–4 (re-ingest)

Chapter-by-chapter re-ingest of chapters 1–4. The source was previously ingested at lower fidelity (2026-05-13). This session read the EPUB chapters directly and added depth not captured in the original pass.

**Pages updated:**

`wiki/concepts/evolutionary-architecture.md` — Added: "Evolvability as a Meta-Characteristic" section (evolvability is a meta-ility wrapping all other characteristics; the bit-rot problem; why "evolutionary" over "adaptable/emergent"); "Hypothesis-Driven Development" section (experiments over requirements; A/B testing; mobile.de case study; architectural prerequisites).

`wiki/concepts/fitness-functions.md` — Added: "System-Wide Fitness Function" section (aggregate of all functions; trade-off framework; not a numeric score); "Combining Categories" section with four mashup patterns and GitHub Scientist as the holistic+continual exemplar; updated "Fitness Function Review" bullet with formal definition (annual cadence, stakeholder meeting, re-evaluation of priority tiers).

`wiki/styles/modular-monolith.md` — **New page.** Full style treatment: definition, evolvability assessment against three criteria, when to use, relationship to other styles, fitness function enforcement requirement.

`wiki/reference/technology-glossary.md` — Added: GitHub Scientist entry under Code Quality and Governance.

`wiki/sources/building-evolutionary-architectures.md` — Expanded chapter notes for chapters 1–4 with direct-read detail: meta-characteristic concept, system-wide fitness function, GitHub Scientist case study, hypothesis-driven development, modular monolith, serverless BaaS/FaaS, service templates.

`index.md` — Added `[[styles/modular-monolith]]` entry; updated source entry to note re-ingest.

Files moved to `_incoming/processed/building-evolutionary-architectures/`: 00, 01, 02, 03, 04.

---

## [2026-05-14] ingest | Building Evolutionary Architectures — Chapters 5–8 (re-ingest)

Chapter-by-chapter re-ingest of chapters 5–8. Final batch; *Building Evolutionary Architectures* now fully ingested at high fidelity.

**Pages updated:**

`wiki/sources/building-evolutionary-architectures.md` — Expanded chapter notes for chapters 5–8: expand/contract SQL detail, database trigger transition mechanism, three decomposition scenarios, schema-as-code, refactoring vs restructuring, Knight Capital incident, libraries vs frameworks (pull/push), anticorruption layer JIT (BackgrounDRb story), sacrificial architecture (Twitter/Fred Brooks), leftpad incident, Goldilocks Governance detail, cycle time as fitness function, reporting antipattern event-stream solution, code reuse inversion, planning horizons/irrational artifact attachment; Ch 8 organisational model (cross-functional teams, product vs project, two-pizza teams, consulting judo, enterprise fitness function injection, when/when-not-to-use, generative testing, AI fitness functions).

`wiki/concepts/evolutionary-database-design.md` — Added: SQL code example for expand/contract column rename; database trigger mechanism for Scenario 3 migration window (with SQL example); "Schema as Code" section (version-controlled, tested, incremental, immutable once applied; Flyway schema_history table).

`wiki/concepts/evolutionary-architecture.md` — Added: "Refactoring vs Restructuring" section (Fowler's refactoring preserves behaviour; restructuring changes architectural characteristics; fitness functions protect during restructuring); "Adaptation vs Evolution" section (adaptation layers behaviour alongside old, accumulates debt; evolution changes in-situ protected by fitness functions; feature flags as bounded intentional adaptation; Knight Capital as adaptation-gone-wrong); "When to Build Evolutionary Architecture (and When Not to)" section (scale, cycle time as competitive differentiator, advanced capabilities; counter-cases: Big Ball of Mud, LMAX-style domain-specific, sacrificial, short horizon).

`wiki/concepts/fitness-functions.md` — Added: "Cycle Time as a Fitness Function" section (Lack of Speed to Release pitfall; cycle time threshold as key process fitness function; v ∝ c business framing); "Consumer-Driven Contracts as Integration Fitness Functions" section (engineering safety net; provider runs all consumer suites); "Future Directions" section (generative testing: statistical analysis for unexpected edge cases; AI fitness functions: anomaly detection for architectural behaviour).

`wiki/concepts/conways-law.md` — Added: "Product over Project" section (project lifecycle vs product permanence; team quality accountability; Amazon two-pizza rule; you build it, you run it; 3 AM social accountability).

Files moved to `_incoming/processed/building-evolutionary-architectures/`: 05, 06, 07, 08.
Processing directory `_incoming/processing/building-evolutionary-architectures/` removed (empty).
*Building Evolutionary Architectures* fully ingested.

---

## [2026-05-14] ingest | Fundamentals of Software Architecture — Chapters 0–4 (re-ingest, batch 1/5)

Chapter-by-chapter re-ingest of preamble + chapters 1–4. First batch of a full re-ingest at higher fidelity.

**Pages updated:**

`wiki/sources/fundamentals-of-software-architecture.md` — Deepened chapter notes for chapters 1–4:
- Ch 1: Four-component architecture definition (structure/characteristics/decisions/design principles); decisions vs principles distinction (hard rules vs guidelines); variance/ARB mechanism for exceeding a decision; engineering practices vs process distinction; Pets.com failure and origin of elastic scale; "all architectures become iterative" quote; Gerald Weinberg dictum.
- Ch 2: Knowledge pyramid (stuff you know / know you don't know / don't know you don't know); technical breadth vs depth; the Frozen Caveman Anti-Pattern; the bottleneck trap; how architects stay hands-on (POC, tech debt, bug fixes, automation, code reviews); Rich Hickey quote; topic vs queue trade-off as canonical trade-off analysis example.
- Ch 3: Entropy metaphor; LCOM's specific value for migration analysis; Jim Weirich's Rule of Degree and Rule of Locality; connascence limitation for distributed systems.
- Ch 4: Italy-ility anecdote; least worst architecture principle; scalability vs elasticity distinction.
Added three notable quotes (Rich Hickey, "all architectures become iterative", "least worst architecture").

`wiki/concepts/modularity.md` — Added: entropy metaphor (architects must add energy to maintain order); expanded LCOM description (usefulness for migration analysis, limitation re: logical vs structural cohesion); replaced generic connascence rules with Page-Jones's three guidelines + Jim Weirich's Rule of Degree and Rule of Locality (both previously absent).

`wiki/concepts/architecture-characteristics.md` — Added: Italy-ility anecdote (custom named characteristic from organisational history; illustrates no standard list is complete); "least worst architecture" section (trade-off logic, ~7 ceiling, First Law connection); scalability vs elasticity distinction.

Files moved to `_incoming/processed/fundamentals-of-software-architecture/`: 00-preamble, 01-introduction, 02-architectural-thinking, 03-modularity, 04-architecture-characteristics-defined.

20 chapters remain. Run `/ingest` to continue.

---

## [2026-05-14] ingest | Fundamentals of Software Architecture — Chapters 5–9 (re-ingest, batch 2/5)

Chapter-by-chapter re-ingest of chapters 5–9. Second batch.

**Pages updated:**

`wiki/sources/fundamentals-of-software-architecture.md` — Deepened chapter notes for chapters 5–9:
- Ch 5: Vasa anti-pattern; stakeholder top-3 selection technique; domain concern → characteristic translation table; agility ≠ time-to-market alone; architecture katas (Ted Neward); Silicon Sandwiches kata worked through in full; Ivory Tower Architect anti-pattern; eliminate-the-least-important exercise; added Mark Richards quote.
- Ch 6: Three problems with characteristics (vague, inconsistent, composite); performance nuance (p99, K-weight budgets); Cyclomatic Complexity in full (McCabe 1976, formula, thresholds, Crap4J, TDD connection); process measures (testability/deployability metrics); fitness function framing ("new perspective, not new framework"); Netflix Simian Army (Conformity/Security/Janitor Monkey, Chaos Kong); Chaos Engineering origin; Checklist Manifesto framing; developer understanding principle.
- Ch 7: Origin of architecture quantum concept; synchronous vs asynchronous connascence extended to distributed systems; DDD bounded context; Going, Going, Gone kata with three quanta and their differing characteristics.
- Ch 8: Component as physical module manifestation; architect's role at component granularity; Conway's Law (Melvin Conway, late 1960s, formal quote); Inverse Conway Maneuver (Jonny Leroy, ThoughtWorks); component identification flow (5-step iterative cycle); Entity Trap anti-pattern (entity ≠ workflow); three component discovery techniques (Actor/Actions, Event Storming, Workflow); architecture style vs pattern distinction; quantum → monolith vs distributed decision.
- Ch 9: Architecture style as shorthand; Big Ball of Mud (Foote/Yoder 1997); historical patterns (unitary, 2-tier, 3-tier); Java serialization as artifact of 3-tier era; monolith vs distributed classification; all 8 Fallacies of Distributed Computing with detail (stamp coupling example: 500kb → 1Gb at 2000 req/s); other distributed challenges (logging, transactions, contracts).

`wiki/concepts/architecture-characteristics.md` — Added "Selecting Characteristics" expansion: Vasa anti-pattern, stakeholder top-3 selection technique, domain concern → characteristic translation table, agility ≠ time-to-market clarification, litmus test for architecture vs domain characteristics, eliminate-the-least-important exercise.

`wiki/concepts/fitness-functions.md` — Expanded "Classification by Mechanism (FOSA)" section: "not a new framework" framing; Cyclomatic Complexity full detail (McCabe formula, thresholds, Crap4J, TDD connection, distance-from-main-sequence); Simian Army specific monkeys (Conformity, Security, Janitor) with Chaos Kong; Chaos Engineering origin story; Checklist Manifesto framing; key developer understanding principle.

`wiki/concepts/architecture-quantum.md` — Added "Origin" section (why the concept was needed: code metrics can't capture external dependencies); expanded "Connascence and Quanta Boundaries" to include synchronous vs asynchronous connascence detail and the auction example; added "Case Study: Going, Going, Gone" section with three-quantum table.

`wiki/concepts/technical-vs-domain-partitioning.md` — Added "Conway's Law and Team Structure" section with formal Conway quote and Jonny Leroy / ThoughtWorks attribution for Inverse Conway Maneuver; added "Component Identification Flow" section (5-step iterative cycle with GGG example); added "Component Discovery Techniques" table (Actor/Actions, Event Storming, Workflow).

**New page created:**

`wiki/concepts/fallacies-of-distributed-computing.md` — Full treatment of all 8 Fallacies of Distributed Computing (Deutsch/Sun 1994) with explanatory detail; stamp coupling (definition, 500kb/200bytes/1Gb example, five remediation techniques); other distributed challenges (logging, transactions, BASE, sagas, contract maintenance); implications for architecture decisions; cross-references to related patterns.

`index.md` — Added fallacies-of-distributed-computing entry.

Files moved to `_incoming/processed/fundamentals-of-software-architecture/`: 05–09.

15 chapters remain. Run `/ingest` to continue.

---

## [2026-05-14] ingest | Fundamentals of Software Architecture — Chapters 10–14 (re-ingest, batch 3/5)

Chapter-by-chapter re-ingest of chapters 10–14 (the first five architecture styles).

**Source page updated:**

`wiki/sources/fundamentals-of-software-architecture.md` — Replaced the brief stub `Chs 10–17` list with detailed per-chapter notes for Ch 10–14:
- Ch 10 (Layered): architecture by implication/accidental architecture anti-patterns; Conway's Law connection; physical deployment variants; open/closed layers + layers of isolation; sinkhole anti-pattern 80/20 rule; fast-lane reader pattern; MTTR startup times.
- Ch 11 (Pipeline): Doug McIlroy story vs Donald Knuth Pascal program; stateless single-task filter principle; EDI/ETL/Apache Camel use cases; always-advertise extensibility property.
- Ch 12 (Microkernel): two core system definitions; cyclomatic complexity reduction via plug-ins; compile-based vs runtime-based plug-ins (OSGi/Jigsaw/Prism); registry implementations; adapter pattern for third-party plug-ins; remote plug-in access (still single quantum); plug-in private data stores; unique both-domain-and-technical partitioning property; real-world examples (Eclipse, Jira, Jenkins, Chrome, insurance claims, tax prep).
- Ch 13 (Service-Based): hybrid of microservices characterisation; EAR/WAR deployment (no containerization required); average 7 services; ACID vs BASE trade-off with order checkout example; database partitioning: single shared library (anti-pattern) vs federated libraries (preferred); topology variants; internal service design options; orchestration vs choreography definitions; electronics recycling example with quantum analysis; Ferrari analogy.
- Ch 14 (Event-Driven): request-based vs event-based model; broker topology (relay race analogy, always-advertise, trade-off table); mediator topology (commands not events, implementation choice guide, delegation model, trade-off table); responsiveness vs performance distinction (25ms ACK vs 3100ms synchronous wait); workflow event pattern for async error handling; three data loss points and mitigations (persisted queues/synchronous send, client acknowledge mode, LPS); request-reply messaging (correlation ID vs temporary queue); broadcast capabilities; competing consumers; quanta edge cases (shared DB = same quantum; request-reply blocking = same quantum); technically partitioned; hybrid architectures.

**Style pages updated:**

`wiki/styles/layered-architecture.md` — Added: Conway's Law as explanation of natural prevalence; architecture by implication + accidental architecture anti-patterns; Physical Deployment Variants section (3 variants); enriched open/closed layers + fast-lane reader pattern; sinkhole 80/20 rule; MTTR startup time detail; starting-point usage guidance.

`wiki/styles/pipeline-architecture.md` — Added: stateless/single-task filter property; McIlroy principle section; EDI use case; always-advertise extensibility property; MapReduce reference.

`wiki/styles/microkernel-architecture.md` — Expanded Topology section: two core system definitions, CC reduction rationale, core implementation variants, compile vs runtime plug-ins with frameworks, remote plug-ins (still single quantum), full registry and contracts/adapters detail, plug-in data stores; enriched When to Use with real-world examples; updated Partitioning to note unique dual-partitioning property.

`wiki/styles/service-based-architecture.md` — Updated definition (hybrid of microservices, EAR/WAR, average 7); expanded Topology with database entity object / shared library detail, internal service design options; added ACID vs BASE section with order checkout example; added Orchestration vs Choreography section; expanded When to Use; added Quanta in Practice section; fixed broken distributed-transactions link.

`wiki/styles/event-driven-architecture.md` — Added request-based vs event-based framing to definition; expanded broker topology (relay race, always-advertise, trade-off table); expanded mediator topology (commands vs events, implementation guide, delegation model, trade-off table); added Responsiveness vs Performance section; added Error Handling — Workflow Event Pattern section; expanded data loss prevention with three specific points and mitigations (LPS); added Request-Reply Messaging section; added Broadcast Capabilities section; enriched Quanta section (shared DB and request-reply edge cases); updated Partitioning to note technical (not domain) partitioning; added Competing Consumers section; added Hybrid Event-Driven Architectures section.

Files moved to `_incoming/processed/fundamentals-of-software-architecture/`: 10–14.

10 chapters remain. Run `/ingest` to continue.

## [2026-05-14] ingest | Fundamentals of Software Architecture — Batch 4 (Ch 15–19)

Ingested chapters 15–19 from `_incoming/processing/fundamentals-of-software-architecture/`. Re-ingest at higher fidelity than prior pass.

**Chapter content captured:**

- Ch 15 (Space-Based Architecture): data pump / data writer / data reader mechanics; data abstraction layer vs data access layer; near-cache (not recommended for SBA); replicated vs distributed cache decision criteria table; data collision formula (CollisionRate = N × UR²/S × RL); cloud/on-prem hybrid deployment option; implementation examples (concert ticketing, online auction); partitioning correction to both domain AND technically partitioned; quanta via UI/processing-unit association (DB excluded from quantum equation).
- Ch 16 (Orchestration-Driven SOA): historical context (late-1990s resource scarcity, OS/DB licensing); business services contained no code (defined by business users); litmus test "Are we in the business of…?"; Conway's Law prediction — ESB architects become political force / bureaucratic bottleneck; CatalogCheckout example (address line change → dozens of services, several tiers); single quantum analysis (shared DB + ESB both create coupling); SOA taught architects limits of distributed transactions and technical partitioning.
- Ch 17 (Microservices): named early by Fowler & Lewis (March 2014 blog post); protocol-aware heterogeneous interoperability breakdown; enforced heterogeneity story; microfrontends pattern; domain/architecture isomorphism with broker EDA; front controller anti-pattern; Martin Fowler quote "The term 'microservice' is a label, not a description."
- Ch 18 (Choosing Architecture Style): six factors driving architecture fashion shifts; five pre-decision inputs; three key determinations (monolith vs distributed → data → sync vs async); Silicon Sandwiches worked examples (modular monolith + BFF microkernel); GGG microservices case study (8 services, 5 quanta); "use synchronous by default, asynchronous when necessary."
- Ch 19 (Architecture Decisions): three anti-patterns (Covering Your Assets, Groundhog Day, Email-Driven Architecture); ADR structure with Compliance + Notes additions; self-approval criteria (cost/cross-team-impact/security); gRPC example illustrating why "why" matters; ADR-tools by Nat Pryce; ADRs for standards; storing ADRs (wiki recommended over Git repo).

**Pages updated:**

`wiki/sources/fundamentals-of-software-architecture.md` — Replaced Ch 15–17 stub with full per-chapter notes; expanded Ch 18 notes with six fashion-shift factors, five decision inputs, three determinations, Silicon Sandwiches and GGG case studies; expanded Ch 19 notes with self-approval criteria, gRPC example, ADR-tools, ADRs for standards.

`wiki/styles/space-based-architecture.md` — Added: Data Pumps/Writers/Readers section (domain-based vs dedicated; three data reader scenarios; data abstraction vs access layer); enriched replicated vs distributed cache (near-cache exclusion, decision criteria table); collision formula; Cloud vs On-Premises section; implementation examples in When to Use; corrected Partitioning to "both domain and technically partitioned"; improved Quanta explanation.

`wiki/styles/soa-architecture.md` — Added: Historical Context section; enriched four service types with business-services-have-no-code detail, litmus test; ESB/Conway's Law + bureaucratic bottleneck insight; CatalogCheckout example; enriched reuse trap section; added Quanta section (single quantum, two reasons); updated Historical Significance with SOA's lasting lesson.

`wiki/styles/microservices-architecture.md` — Added: History section (Fowler & Lewis 2014); enriched API layer with service discovery detail; added Frontends section (monolithic vs microfrontend); added protocol-aware heterogeneous interoperability and enforced heterogeneity to Topology; added domain/architecture isomorphism with EDA; enriched choreography section with front controller anti-pattern; enriched "Micro" Misconception with Fowler quote and origin story.

`wiki/concepts/adrs.md` — Added: gRPC example in Decision section; Self-Approval Criteria section (cost/cross-team/security); Tooling section (ADR-tools by Nat Pryce); expanded Storing ADRs with enterprise ADR example.

Files moved to `_incoming/processed/fundamentals-of-software-architecture/`: 15–19.

5 chapters remain. Run `/ingest` to continue.

---

## [2026-05-14] ingest | Fundamentals of Software Architecture — Batch 5 (Ch 20–24, final)

Final batch of the *Fundamentals of Software Architecture* re-ingest. All five chapters fully read and processed.

**Chapter content captured:**

- Ch 20 (Analyzing Architecture Risk): risk matrix detail (impact first, then likelihood; unknown technology = always 9); direction of risk (+/− preferred over arrows due to ambiguity; arrow + target number alternative); risk assessment filtering and tracking; nurse diagnostics worked example in full (availability: central DB split, SLA/SLO distinction for external dependencies; elasticity: Ambulance Pattern two-channel queuing + outbreak cache; security: three separate API gateways per user type); Agile story risk analysis extension.
- Ch 21 (Diagramming and Presenting Architecture): representational consistency; Irrational Artifact Attachment anti-pattern; tool features (layers, stencils, magnets); formal standards (UML/C4/ArchiMate) with limitations; diagram guidelines (solid/dotted lines convention); two-channel presentation model; Bullet-Riddled Corpse, Cookie-Cutter, Invisibility patterns; Infodecks vs presentations; incremental builds; manipulating time with transitions/animations.
- Ch 22 (Making Teams Effective): three architect personalities with root causes (control freak trap for new architects; armchair trap from being spread too thin; "architecture is easy to fake"); elastic leadership five-factor scoring model (counterintuitive: short projects need less control); three team warning signs (process loss/Brook's Law, pluralistic ignorance/"Emperor's New Clothes", diffusion of responsibility); checklist design principles (Hawthorne effect, law of diminishing returns); three key checklists; layered stack governance model; Scala/business-justification story.
- Ch 23 (Negotiation and Leadership Skills): negotiating with stakeholders (grammar/buzzwords technique, data gathering, nines table, cost/time as last resort, divide-and-conquer); negotiating with architects (demonstration defeats discussion, calm leadership); negotiating with developers (justification-first framing, developer-arrives-at-solution technique, Ivory Tower anti-pattern); 4 C's; essential vs accidental complexity; pragmatic vs visionary balance; leading by example (collaborative grammar, using names, turning requests into favours, brown-bag lunches, sitting with the team); meeting management (developer flow state, imposed-upon vs imposed-by meetings).
- Ch 24 (Developing a Career Path): 20-minute rule (first thing, before email); personal technology radar (ThoughtWorks TAB origin, four rings: Hold/Assess/Trial/Adopt, four quadrants); technology portfolio as financial portfolio (diversify; bubble living risk); social networks (strong/weak/potential links; McAfee: next job from weak link; social media for Assess ring); architecture katas (no answer key; topology without ADRs is only half the story).

**Pages updated:**

`wiki/sources/fundamentals-of-software-architecture.md` — Replaced brief stub notes for Ch 20–24 with full per-chapter notes covering all key concepts, techniques, worked examples, and quotes.

`wiki/concepts/risk-storming.md` — Added: direction of risk section (+/− signs and arrow+number alternatives, fitness function connection); nurse diagnostics worked example section (all three sessions — availability, elasticity, security — with Ambulance Pattern); Agile story risk analysis section.

**New page created:**

`wiki/concepts/architect-soft-skills.md` — Comprehensive treatment of Ch 21–24 soft skills: diagramming (representational consistency, Irrational Artifact Attachment, tool features, UML/C4/ArchiMate standards, diagram guidelines); presenting (two-channel model, Bullet-Riddled Corpse, Cookie-Cutter, Invisibility, infodecks vs presentations); making teams effective (three architect personalities, elastic leadership five-factor model, three team warning signs, checklists, layered stack governance); negotiation and leadership (stakeholder/architect/developer techniques, 4 C's, essential vs accidental complexity, pragmatic vs visionary, leading by example, meeting management); career development (20-minute rule, personal technology radar, technology portfolio diversification, social network links, architecture katas).

`index.md` — Added `[[concepts/architect-soft-skills]]` entry.

Files moved to `_incoming/processed/fundamentals-of-software-architecture/`: 20–24.
Processing directory `_incoming/processing/fundamentals-of-software-architecture/` removed (empty).
*Fundamentals of Software Architecture* fully ingested at high fidelity.

## [2026-05-14] ingest | Designing Data-Intensive Applications — Batch 1 (Ch 0–4)

Re-ingest of *Designing Data-Intensive Applications* (Martin Kleppmann) at high fidelity, chapter-by-chapter. Previously ingested 2026-05-13 in a single session. This batch covers the preamble and Chapters 1–4 (Part I: Foundations of Data Systems).

**Content captured:**

- **Preamble**: Book scope and structure (3 parts: Foundations, Distributed Data, Derived Data); audience; FOSS bias; preface context (NoSQL, Big Data, MapReduce etc. as buzzwords vs enduring principles).
- **Ch 1 (Reliable, Scalable, Maintainable)**: Fault vs failure distinction; three fault types (hardware/software/human) with hardware-random-independent vs software-systematic-correlated distinction; Chaos Monkey. Scalability via load parameters; Twitter fan-out example (approach 1 → global tweet collection + JOIN; approach 2 → timeline mailbox precomputed on write with 345k writes/sec; hybrid for celebrities). Response time vs latency distinction; percentile metrics (p50, p95, p99, p999); tail latency amplification (parallel backend calls); head-of-line blocking; mathematically invalid percentile averaging (add histograms instead: forward decay, t-digest, HdrHistogram). Maintainability: operability, accidental complexity (Moseley & Marks), evolvability.
- **Ch 2 (Data Models and Query Languages)**: Multi-layer abstraction model; historical progression (hierarchical → CODASYL/network → relational); NoSQL origin (2009 hashtag, retroactively "Not Only SQL"); polyglot persistence; impedance mismatch and normalization rationale (IDs don't change, text does); graph models for complex many-to-many (social graphs, web graph, road networks); property graphs (Neo4j); Cypher pattern-matching syntax; triple-stores/SPARQL; Datalog recursive rules; graph evolvability (new edge types without migration); MapReduce as neither declarative nor fully imperative — MongoDB reinvented SQL as aggregation pipeline.
- **Ch 3 (Storage and Retrieval)**: Append-only log starting point; hash index limitations (all keys in memory); tombstones for deletion; SSTables/LSM-Trees with memtable, Bloom filters, size-tiered vs leveled compaction; B-Tree branching factor (~several hundred) and 4 levels for 256TB; copy-on-write B-Tree variant (LMDB); in-memory databases (Memcached vs durable approaches — VoltDB/MemSQL/RAMCloud/Redis); performance advantage is not disk reads (OS page cache handles that) but avoiding encode/decode overhead; Redis advanced data models (priority queues, sets); anti-caching (LRU record eviction at record granularity).
- **Ch 4 (Encoding and Evolution)**: Language-specific serialization problems (language-locked, security risk via arbitrary class instantiation, versioning afterthoughts, poor performance); JSON/XML/CSV limitations (number ambiguity, no binary, optional schemas); Thrift (BinaryProtocol/CompactProtocol/DenseProtocol); Protobuf field tags; Avro no-field-tags approach with writer/reader schema resolution; field tag evolution rules; REST vs SOAP philosophical contrast; RPC fundamental flaw (location transparency fails for networks: timeouts, partial failures, idempotency needed, encoding required).

**Pages updated:**

`wiki/sources/designing-data-intensive-applications.md` — Updated re-ingest date; replaced brief chapter stubs for Ch 1–4 with comprehensive per-chapter notes including Twitter fan-out numbers, tail latency amplification, in-memory database nuances, language-specific serialization risks, REST/SOAP/RPC comparison.

`wiki/databases/storage-engines.md` — Added: tombstones and crash recovery to hash index section; in-memory databases section (Memcached vs durable vs weak-durability; performance advantage explanation; anti-caching approach).

`wiki/databases/data-models.md` — Added: Historical Progression section (hierarchical → network/CODASYL → relational → NoSQL); NoSQL origin and polyglot persistence; normalization rationale (IDs vs text); graph model strengths (evolvability, variable-depth traversal).

`wiki/databases/encoding-and-evolution.md` — Added: language-specific serialization section (problems and rule); REST vs SOAP vs RPC section (REST philosophy; SOAP complexity; RPC fundamental flaw with specific failure modes).

`index.md` — Updated DDIA entry with re-ingest date.

Files moved to `_incoming/processed/designing-data-intensive-applications/`: 00–04.
8 chapters remain. Run `/ingest` to continue.

## [2026-05-14] ingest | Designing Data-Intensive Applications — Batch 2 (Ch 5–9)

Re-ingest of *Designing Data-Intensive Applications* (Martin Kleppmann). This batch covers Chapters 5–9 (Part II: Distributed Data). Chapters read in full; wiki pages updated with high-fidelity content from each chapter.

**Content captured:**

- **Ch 5 (Replication)**: Replication log formats (statement-based: nondeterminism problems; WAL shipping: version-coupled, blocks zero-downtime upgrades; logical/row-based: CDC-capable; trigger-based: highest overhead). Sync/semi-sync/async modes. Failover problems: unreplicated writes, split brain, GitHub MySQL/Redis autoincrement incident. Replication lag anomalies: read-your-writes (route user's reads to leader or track write timestamp), monotonic reads (route user to same replica), consistent prefix reads (causal writes to same partition). Multi-leader use cases (multi-DC, offline clients, collaborative editing). Conflict resolution: LWW (data loss risk), on-write handlers (Bucardo), on-read (CouchDB siblings), CRDTs. Multi-leader topologies: circular (MySQL default, ring breaks on failure), star (SPOF center), all-to-all (most resilient, but causality violations from out-of-order network paths). Leaderless (Dynamo): W+R>N quorums; sloppy quorums + hinted handoff; anti-entropy (Voldemort lacks it). Version vectors vs vector clocks distinction (version vectors compare replica state, not distributed event causality).

- **Ch 6 (Partitioning)**: Terminology: shard, region, tablet, vnode, vBucket. Key-range: sorted, range queries, hot spots (timestamp prefix fix). Hash: hash mod N anti-pattern (moves most keys on N change); "consistent hashing" term should be avoided. Cassandra compound key: hash first column for partition, sort by remaining within partition — elegant one-to-many. Hot key mitigation: 2-digit random prefix → 100 sub-partitions, reads merge. Secondary indexes: local/document-partitioned (writes single partition, reads scatter-gather, tail latency risk) vs global/term-partitioned (reads single partition, writes multiple, often async → DynamoDB GSI lag). Rebalancing: fixed partitions (~1000 for 10-node Riak/ES), dynamic splitting (HBase at 10GB, MongoDB), proportional to nodes (Cassandra 256 per node, random split). Fully automatic rebalancing risk: slow node → rebalance → overload → cascade failure. Request routing: any-node forwarding; routing tier; client-aware with ZooKeeper tracking (HBase, Kafka, SolrCloud); Cassandra/Riak use gossip to avoid ZooKeeper dependency.

- **Ch 7 (Transactions)**: ACID precise reading (Atomicity = abortability; Consistency = app property "doesn't belong in ACID" per Hellerstein; Isolation = serializability goal; Durability = WAL + replication + SSD caveats). Lost updates: atomic operations (UPDATE value = value+1), FOR UPDATE lock, automatic detection (PostgreSQL/Oracle/SQL Server detect; MySQL/InnoDB does NOT), compare-and-set. Write skew pattern: SELECT check → decide → write that changes the precondition. Phantom + materializing conflicts. Isolation level naming confusion: Oracle "Serializable" = SI; PostgreSQL/MySQL "Repeatable Read" = SI; IBM DB2 "Repeatable Read" = Serializable; SQL standard ambiguous and doesn't define write skew. Actual serial execution (~2007 realization): VoltDB stored procedures (Java/Groovy), Datomic (Java/Clojure), Redis Lua; ~1000 cross-partition writes/sec in VoltDB. SSI two detection mechanisms: stale MVCC reads (uncommitted write later committed) and write tripwires (committed write to already-read rows). FoundationDB distributes SSI conflict detection.

- **Ch 8 (The Trouble with Distributed Systems)**: Partial failures nondeterministic (defining characteristic). Asynchronous networks: 6 failure scenarios. 12 network faults/month in medium datacenter. Unbounded packet delay sources. Phi Accrual failure detector (Akka, Cassandra). Synchronous networks (telephone): bounded delay, reserved bandwidth vs packet switching: dynamic sharing, variable delay. Clock types: time-of-day (NTP, can jump) vs monotonic (local interval measurement only). Clock drift 200ppm = 6ms per 30sec. LWW danger: clock skew → silent data loss. Spanner TrueTime: [earliest, latest] confidence interval (~7ms), deliberately waits before commit. Process pauses: GC stop-the-world (minutes), VM suspension, SIGSTOP. Fencing tokens: monotonically increasing from lock service; storage service rejects lower tokens. Byzantine faults and system models.

- **Ch 9 (Consistency and Consensus)**: Linearizability = behave as single copy with atomic operations; recency guarantee (not transaction isolation). Strict serializability = linearizability + serializability (2PL/serial execution achieve it; SSI does not — reads from past snapshot). Linearizable replication: single-leader potentially; consensus algorithms yes; multi-leader no; leaderless no. CAP: "best avoided" — too narrow (only linearizability + partitions), misleading. Causal consistency: partial order; strongest model not impacted by partitions. Lamport timestamps: (counter, nodeID), total order consistent with causality, but insufficient for uniqueness (cannot know if order is final → need total order broadcast → need consensus). TOB ≡ consensus ≡ linearizable CAS (equivalence theorem). FLP result: unsolvable in purely async model; solvable with partial synchrony (timeouts) or randomization. 2PC: 6-step protocol, two points of no return (participant votes yes → surrenders abort right; coordinator writes decision → irrevocable), blocking if coordinator fails, in-doubt transactions hold locks indefinitely, manual admin resolution or heuristic decisions. XA: C API standard, MySQL distributed XA 10× slower, coordinator SPOF, breaks stateless model, incompatible with SSI, no cross-system deadlock detection. 3PC: requires bounded delays — not practical. Fault-tolerant consensus (Raft/Paxos/Zab/VSR): epoch numbers, two overlapping quorum rounds. ZooKeeper/etcd: small data in memory, TOB-replicated, modeled after Chubby; features: linearizable CAS, total ordering (zxid/cversion as fencing tokens), ephemeral nodes for failure detection, change notifications. Full equivalence: linearizable CAS = atomic commit = TOB = locks/leases = membership service = uniqueness constraints.

**Pages updated:**

`wiki/concepts/replication.md` — Added: Replication Log Formats table (statement-based/WAL/logical/trigger-based with strengths/weaknesses); Failover Problems section (unreplicated writes, split brain, GitHub incident, timeout tuning); Sloppy Quorums and Hinted Handoff section; Version Vectors section with version vectors ≠ vector clocks clarification; Multi-leader Conflict Resolution expanded (on-write handlers, on-read siblings); Multi-leader Topologies table (circular/star/all-to-all with fault tolerance and failure modes).

`wiki/concepts/partitioning.md` — Added: hash mod N anti-pattern note; consistent hashing terminology caution (avoid the term); Cassandra rebalancing (256 per node, random split); HBase/MongoDB dynamic split thresholds; fully automatic rebalancing risk section.

`wiki/databases/transactions.md` — Added: Lost Updates section (atomic operations, FOR UPDATE, automatic detection gap in MySQL/InnoDB, compare-and-set); Write Skew Pattern recognition heuristic; isolation level naming confusion detail (Oracle/PostgreSQL/MySQL/IBM DB2 discrepancies); actual serial execution expanded (stored procedure languages, 1000 cross-partition writes/sec); SSI two detection mechanisms (stale MVCC reads + write tripwires; FoundationDB distributed detection).

`wiki/concepts/consensus-algorithms.md` — Replaced brief 2PC section with full 6-step protocol description, two points of no return, blocking/in-doubt problem detail, heuristic decisions escape hatch, XA limitations detail (performance, SPOF, stateful model, lowest common denominator, failure amplification), 3PC impossibility reason.

`wiki/concepts/logical-clocks.md` — Added DDIA as source; added section on Lamport timestamp insufficiency for uniqueness constraints (need total order broadcast → consensus).

Files moved to `_incoming/processed/designing-data-intensive-applications/`: 05–09.
3 chapters remain (10–12). Run `/ingest` to continue with batch processing, stream processing, and the future of data systems.

## [2026-05-14] ingest | Designing Data-Intensive Applications — Batch 3 (Ch 10–12)

Final batch of the DDIA re-ingest. Chapters 10, 11, and 12 read in full. Source page already had complete chapter notes from the prior session. Wiki pages were largely complete; targeted additions made.

**Content captured:**

- **Ch 10 (Batch Processing)**: Unix philosophy as template for MapReduce; mapper/shuffle/reduce mechanics; join algorithms (sort-merge, broadcast hash, partitioned hash); hot key/skew handling; batch output philosophy (immutable files, atomic index swap, offline KV store bulk-load); Hadoop vs MPP comparison; dataflow engines (Spark RDD lineage, Flink barrier checkpointing); Pregel/BSP graph model; intermediate materialization as the key MapReduce inefficiency that dataflow engines solve.

- **Ch 11 (Stream Processing)**: AMQP/JMS vs log-based broker taxonomy; Kafka append-only log, consumer offsets, fan-out, log compaction; CDC mechanism (WAL/binlog) and tooling; dual write problem; event sourcing vs CDC distinction (application-level vs database-level); stream processing uses (CEP, analytics, materialized views, percolator); windowing types; event time vs processing time (always prefer event time); three-timestamp approach for mobile; straggler handling (ignore with metric, publish correction); stream-stream/stream-table/table-table joins; slowly changing dimensions; fault tolerance (microbatching, barrier checkpointing, idempotent exactly-once); state rebuilding options.

- **Ch 12 (The Future of Data Systems)**: Unbundled databases (federated reads via PostgreSQL foreign data wrappers; unified writes via event log); Lambda architecture critique (duplicate logic) → unified batch+stream (Flink, Beam); write path (eager, precomputed) vs read path (lazy, on-demand) — shifting the boundary is the fundamental caching/materialization decision; end-to-end argument (Saltzer, Reed & Clark 1984 — TCP/transactions/stream processor exactly-once insufficient without end-to-end operation IDs); uniqueness via log-based partitioning (no distributed transactions); multi-partition request processing (3-step: log intent → derive instructions → deduplicate); timeliness vs integrity distinction (timeliness = eventual consistency, integrity = perpetual inconsistency; integrity far more important); coordination-avoiding data systems; trust-but-verify culture; ethics (algorithmic bias amplification, data as toxic asset, surveillance framing).

**Pages updated:**

`wiki/streams/event-sourcing-cqrs.md` — Added "Correctness Without Coordination" section: end-to-end argument (Saltzer et al.), uniqueness via log-based partitioning, multi-partition requests without distributed transactions, timeliness vs integrity distinction with key quote. Source table entry expanded to cover Ch 12. `updated` date set to 2026-05-14.

`index.md` — Updated `event-sourcing-cqrs` entry summary to reflect new section.

Files moved to `_incoming/processed/designing-data-intensive-applications/`: 10–12.
Processing directory removed. DDIA re-ingest complete.

## [2026-05-14] ingest | Software Architecture Patterns — Batch 1 (Preamble, Ch 1–4)

Ingested *Software Architecture Patterns* (Mark Richards, 2015, O'Reilly). This is a concise ~60-page work covering 5 architecture patterns. Preamble and first 4 chapters ingested in this batch; Chapter 5 (Space-Based) remains.

**Content captured:**

- **Preamble/Introduction**: Book's framing — architecture patterns define operational characteristics; without formal architecture, teams produce the big ball of mud via accidental layered architecture. Establishes characteristic-rating framework (agility, deployability, testability, performance, scalability, ease of development) used throughout.

- **Ch 1 (Layered Architecture)**: Closed vs open layers; layers of isolation concept (the core reason closed layers exist — changes don't cascade); architecture sinkhole anti-pattern with 80/20 heuristic. Content already well-covered in existing page from FOSA (same author, 5 years later). Source table entry added.

- **Ch 2 (Event-Driven Architecture)**: Mediator vs broker topologies; mediator implementation ladder (Camel/Mule/Spring Integration → BPEL/Apache ODE → jBPM); no-atomic-transactions limitation named explicitly; contract governance as the primary ongoing challenge. Content already well-covered in existing page from FOSA. Source table entry added.

- **Ch 3 (Microkernel Architecture)**: Plug-in registry (name, data contract, access protocol); adapter pattern for third-party plug-ins with non-standard contracts; embeddability within other patterns; first-choice for product-based applications. Content already well-covered in existing page from FOSA. Source table entry added.

- **Ch 4 (Microservices Architecture)**: Three deployment topologies (API REST-based, Application REST-based, Centralized Messaging); service component concept with variable granularity; granularity warning (too fine-grained → orchestration → SOA complexity); DRY tradeoff (copy small utility logic rather than extract shared service); 2015-era shared database guidance (now superseded by FOSA's distributed-monolith analysis).

**Pages created:**

`wiki/sources/software-architecture-patterns.md` — Full source page: overview, key claims, chapter notes for Ch 1–4, contradiction note on shared database advice evolution.

**Pages updated:**

`wiki/styles/microservices-architecture.md` — Added "Topologies" section with three SAP topology types (API REST, Application REST, Centralized Messaging) and Centralized Messaging ≠ SOA note. Source table entry added.

`wiki/styles/layered-architecture.md` — Source table entry added (SAP as earlier, superseded treatment).

`wiki/styles/event-driven-architecture.md` — Source table entry added (SAP mediator implementation ladder, no-atomic-transactions).

`wiki/styles/microkernel-architecture.md` — Source table entry added (SAP plug-in registry, adapter, embeddability).

`wiki/authors/mark-richards.md` — Updated to include SAP as ingested; updated SAP book description; corrected other-works slug to `microservices-antipatterns-and-pitfalls`.

`index.md` — SAP source page added.

1 chapter remains (Ch 5: Space-Based Architecture). Run `/ingest` to continue.

---

## [2026-05-14] ingest | Software Architecture Patterns — Ch 5 (FINAL)

Ingested Chapter 5 (Space-Based Architecture) of *Software Architecture Patterns* by Mark Richards. SAP's 2015 treatment is an earlier, lighter version of FOSA's comprehensive coverage; the existing wiki page (from FOSA) was already detailed. Additions from SAP:

- Triangle-shaped scaling problem framing (web servers easiest → app servers harder → database hardest to scale) — added to definition
- Alternative name "cloud architecture pattern" and note that it doesn't require cloud hosting — added to definition
- Third-party product names (GemFire, JavaSpaces, GigaSpaces, IBM Object Grid, nCache, Oracle Coherence) — added to Data Pumps section
- Explicit contraindication: "not well suited for traditional large-scale relational database apps with large amounts of operational data" — added to When to Use

**Pages updated:**

`wiki/styles/space-based-architecture.md` — triangle framing added to definition, alternative name, third-party products, large-data contraindication, SAP source table entry.

`wiki/sources/software-architecture-patterns.md` — Ch 5 notes added. Book fully ingested.

Book fully ingested. Processing directory removed.

---

## [2026-05-14] ingest | Software Architecture: The Hard Parts — Preamble + Ch 1–2

Ingested preamble, Ch 1 (What Happens When There Are No "Best Practices"?), and Ch 2 (Discerning Coupling in Software Architecture) of *Software Architecture: The Hard Parts* by Ford, Richards, Sadalage, Dehghani (2022). Fictional Sysops Squad narrative ignored per instructions.

**Key content:**

Ch 1 establishes the epistemological foundation: architecture problems are unique; the goal is "least worst combination of trade-offs." Introduces fitness function governance with JDepend, ArchUnit, NetArchTest examples and the Equifax breach as enterprise motivation. Defines operational vs analytical data distinction.

Ch 2 is the most conceptually significant: expands the architecture quantum definition with an explicit static/dynamic coupling distinction; establishes quantum count rules per architecture style (shared DB = single quantum regardless of service topology); introduces micro-frontends as a quantum-preserving UI pattern; defines the 3D dynamic coupling space (communication × consistency × coordination → 8 named saga types). The saga taxonomy significantly extends our existing saga page.

**Pages created:**

`wiki/sources/software-architecture-the-hard-parts.md` — full source page.

`wiki/authors/pramod-sadalage.md` — new author page.

`wiki/authors/zhamak-dehghani.md` — new author page.

**Pages updated:**

`wiki/concepts/architecture-quantum.md` — expanded definition with static/dynamic coupling distinction; quantum count table; micro-frontends; dynamic coupling 3D space; SATH source table entry.

`wiki/patterns/saga.md` — added "Saga Types Taxonomy (SATH)" section with 8-type matrix and vocabulary note; SATH source table entry.

`wiki/concepts/fitness-functions.md` — SATH source table entry (JDepend, ArchUnit, Equifax case).

`wiki/authors/neal-ford.md` — fixed wrong slug (hard-parts → software-architecture-the-hard-parts); updated "Books in this wiki"; replaced "not yet ingested" entry with book description.

`wiki/authors/mark-richards.md` — added SATH to "Books in this wiki"; added SATH book entry.

`index.md` — SATH source entry; updated architecture-quantum summary; added Sadalage and Dehghani author entries; updated Neal Ford and Mark Richards entries.

13 chapters remain (Ch 3–15). Run `/ingest` to continue.

## [2026-05-14] ingest | Software Architecture: The Hard Parts — Batch 2 (Ch 3–7)

Ingested chapters 3–7 of *Software Architecture: The Hard Parts* (Ford, Richards, Sadalage, Dehghani, 2022).

**Key content:**

Ch 3 — Architectural Modularity: business drivers for decomposition (availability, scalability, deployability, testability, maintainability); scalability vs elasticity distinction (MTTS); architecture stories as a distinct task type; the water-glass analogy for stakeholder communication; big ball of distributed mud anti-pattern.

Ch 4 — Architectural Decomposition: feasibility assessment using abstractness/instability/distance from main sequence; Big Ball of Mud anti-pattern (Foote 1999); Elephant Migration anti-pattern; component-based decomposition vs tactical forking (Fausto De La Torre); stepping-stone principle (service-based architecture first).

Ch 5 — Component-Based Decomposition Patterns: six sequential patterns (Identify and Size, Gather Common Domain, Flatten, Determine Dependencies, Create Component Domains, Create Domain Services); each includes automated fitness functions for CI/CD governance; ArchUnit examples for dependency governance.

Ch 6 — Pulling Apart Operational Data: six data disintegrators (change control, connection management, scalability, fault tolerance, architectural quantum, DB type optimisation); two data integrators (data relationships, DB transactions); five-step decomposition process; data sovereignty per service; connection quota management; database type selection guide covering 8 types (relational, key-value, document, column family, graph, NewSQL, cloud native, time-series).

Ch 7 — Service Granularity: modularity vs granularity distinction; six granularity disintegrators (scope, code volatility, scalability, fault tolerance, security, extensibility); four granularity integrators (DB transactions, workflow, shared code, data relationships); MTTS; volatility-based decomposition; trade-off-to-business-question method.

**Pages created:**

`wiki/concepts/architectural-decomposition.md` — new concept page covering Ch 3–5.

`wiki/concepts/service-granularity.md` — new concept page covering Ch 7.

`wiki/concepts/data-decomposition.md` — new concept page covering Ch 6.

**Pages updated:**

`wiki/sources/software-architecture-the-hard-parts.md` — Ch 3–7 chapter notes appended.

`wiki/concepts/modularity.md` — SATH source table row; link to architectural-decomposition.

`wiki/concepts/fitness-functions.md` — new "Decomposition Governance Fitness Functions (SATH)" section with 7 concrete fitness functions from Ch 5; updated SATH source table row.

`index.md` — SATH source entry updated to ch 1–7; three new concept pages added; modularity entry updated.

8 chapters remain (Ch 8–15). Run `/ingest` to continue.

## [2026-05-14] ingest | Software Architecture: The Hard Parts — Batch 2 (Ch 8–12)

Ingested chapters 8–12 of *Software Architecture: The Hard Parts* (Ford, Richards, Sadalage, Dehghani).

**Chapter coverage:**

Ch 8 — Reuse Patterns: four reuse techniques (code replication, shared library, shared service, sidecar); core reuse principle (reuse = abstraction + slow rate of change); LATEST anti-pattern; fine-grained library preference; custom vs global deprecation strategy; orthogonal coupling and hexagonal architecture origin for sidecars.

Ch 9 — Data Ownership and Distributed Transactions: three ownership patterns (single, common, joint); four joint ownership resolution techniques (table split, data domain, delegate, service consolidation); delegate technique variants (primary domain priority vs operational characteristics priority); three eventual consistency patterns (background synchronization, orchestrated request-based, event-based/preferred).

Ch 10 — Distributed Data Access: four distributed data access patterns (interservice communication, column schema replication, replicated caching, data domain); replicated caching constraints (~500MB limit, startup dependency, high-update-rate limitation, cloud multicast issues); data domain as partial retreat from data sovereignty.

Ch 11 — Managing Distributed Workflows: semantic coupling (domain-mandated, irreducible) vs implementation coupling (architect choices); orchestration vs choreography extended trade-off analysis; three workflow state management options for choreography (front controller, stateless choreography, stamp coupling).

Ch 12 — Transactional Sagas: full trade-off ratings for all 8 saga types across coupling, complexity, responsiveness, scale; recommended patterns (Fairy Tale, Parallel Saga); patterns to avoid (Fantasy Fiction, Horror Story — async + atomic); Epic Saga pitfalls (no isolation, side effects during compensation, compensation failures); saga finite state machine approach; saga annotation/attribute technique for Java/C#.

**Pages created:**

`wiki/concepts/reuse-patterns.md` — new concept page covering the four reuse techniques and the core reuse principle.

**Pages updated:**

`wiki/sources/software-architecture-the-hard-parts.md` — Ch 8–12 chapter notes appended; structure note updated to ch 1–12.

`wiki/concepts/data-decomposition.md` — three major sections added: Data Ownership (single/common/joint with four joint techniques), Eventual Consistency Patterns (three patterns), Distributed Data Access Patterns (four patterns with selection table). Fixed stale wikilink (`understanding-distributed-systems-transactions` → `distributed-transactions`).

`wiki/patterns/saga.md` — major expansion: semantic vs implementation coupling section; extended orchestration vs choreography trade-offs; three workflow state management options; full 8-type saga rating table with complexity/responsiveness/scale columns; Recommended/avoid guidance; Epic Saga pitfalls section; saga state machine section; saga annotation technique section. Updated How Different Sources Treat It and Related Pages.

`wiki/patterns/sidecar-service-mesh.md` — added SATH perspective section on sidecar as reuse mechanism; hexagonal architecture origin; operational-concerns-only constraint; orthogonal coupling concept. Updated sources frontmatter and Related Concepts.

`index.md` — SATH source entry updated to ch 1–12; data-decomposition entry expanded; new reuse-patterns entry added; saga and sidecar entries updated; fixed `understanding-distributed-systems-transactions` → `distributed-transactions` wikilink.

3 chapters remain (Ch 13–15). Run `/ingest` to continue.

## [2026-05-14] ingest | Software Architecture: The Hard Parts — Batch 3 (Ch 13–15) — FINAL

Ingested final chapters 13–15 of *Software Architecture: The Hard Parts* (Ford, Richards, Sadalage, Dehghani). Book now fully ingested.

**Chapter coverage:**

Ch 13 — Contracts: strict vs loose contract spectrum (gRPC/RMI at strict end, JSON name-value pairs at loose end); strict contract trade-offs (fidelity + documentation vs tight coupling + versioning overhead); loose contract trade-offs (decoupled + evolvable vs contract management issues); consumer-driven contracts (invert push→pull; consumer specifies what it needs; provider runs consumer tests as CI gates; requires engineering maturity); stamp coupling (large data structure passed where only small part used — anti-pattern when over-specified, legitimate for workflow state management in choreography; bandwidth considerations at scale).

Ch 14 — Managing Analytical Data: Data Warehouse pattern (ETL, star schema, centralised; fails due to integration brittleness, domain knowledge fragmentation, and complexity); Data Lake pattern (load-and-transform/reactive; better for ML; still technically partitioned; PII risks; staleness); Data Mesh (Dehghani — domain-owned analytical data; four principles: domain ownership, data as product, self-serve platform, computational federated governance); Data Product Quantum (DPQ) as the core architectural unit (three types: source-aligned, aggregate, fit-for-purpose; cooperative quantum with its service; always async+eventual — Parallel or Anthology Saga; governance sidecar from platform team).

Ch 15 — Build Your Own Trade-Off Analysis: three-step process (find entangled dimensions → analyze coupling → assess trade-offs); qualitative vs quantitative analysis; MECE lists; out-of-context trap; model relevant domain scenarios; prefer bottom-line summaries for stakeholders.

**Pages created:**

`wiki/concepts/contracts.md` — new concept page covering strict/loose spectrum, consumer-driven contracts, stamp coupling.

`wiki/concepts/data-mesh.md` — new concept page covering Data Warehouse, Data Lake, Data Mesh, DPQ, cooperative quantum.

**Pages updated:**

`wiki/sources/software-architecture-the-hard-parts.md` — Ch 13–15 chapter notes appended; structure note updated to "fully ingested"; related pages updated.

`index.md` — SATH source entry updated to "fully ingested"; two new concept pages added (contracts, data-mesh).

SATH ingestion complete. All 15 chapters (+ preamble) fully processed.

## [2026-05-14] ingest | Building Event-Driven Microservices — Batch 1 (Ch 0–4)

Started ingestion of *Building Event-Driven Microservices* by Adam Bellemare (O'Reilly, 2020). Slug: `building-event-driven-microservices`. Added to CLAUDE.md slug table.

**Chapters ingested:** preamble, Ch 1 (Why Event-Driven Microservices), Ch 2 (EDM Fundamentals), Ch 3 (Communication and Data Contracts), Ch 4 (Integrating with Existing Systems).

**Key concepts extracted:**
- Three communication structures: business, implementation, data — the data structure is the historically missing layer that EDM formalises
- Event types: unkeyed, entity (keyed on unique ID), keyed (non-entity)
- Table-stream duality: materializing tables from event streams and vice versa; tombstones; log compaction
- Event broker vs message broker distinction: indefinite retention, per-consumer offsets, replayability
- Microservice single writer principle; microservice tax
- Sync vs async microservices trade-offs; hybrid architectures as the norm
- Data contract = data definition + triggering logic; explicit schemas (Avro, Protobuf) required
- Schema evolution: forward/backward/full compatibility; schema registry; breaking change protocols
- Event design anti-patterns: type discriminator fields, events as semaphores
- Data liberation patterns: query-based, CDC log (Debezium), outbox table
- Eventification: denormalising internal streams into public entity events
- Serialization-before-vs-after-commit trade-off for outbox
- CDC frameworks as bootstrap tools, not final destination

**Pages created:**

`wiki/sources/building-event-driven-microservices.md` — source page, ch. 0–4 notes.

`wiki/authors/adam-bellemare.md` — author page.

`wiki/concepts/bounded-contexts.md` — new concept page: DDD foundations (domain/subdomain/bounded context), three communication structures, business vs technical alignment, Conway's Law connection.

**Pages updated:**

`wiki/styles/event-driven-architecture.md` — major expansion: event types, table-stream duality, event broker vs message broker, broker requirements, microservice single writer principle, sync vs async comparison table, microservice tax, data liberation pointer.

`wiki/patterns/outbox-pattern.md` — added data liberation patterns section: query-based, CDC log, outbox comparison; serialization timing trade-off; eventification; CDC framework anti-pattern.

`wiki/concepts/contracts.md` — added event data contracts section: data definition + triggering logic, schema evolution compatibility types, schema registry, event design anti-patterns.

`wiki/concepts/conways-law.md` — added BEDM perspective on three communication structures to "How Different Sources Treat It".

`index.md` — new source, author, and bounded-contexts entries; updated contracts, event-driven-architecture, and outbox entries.

13 chapters remain (Ch 5–17).

## [2026-05-14] ingest | Building Event-Driven Microservices — Ch 5–6

**Chapters ingested:** Ch 5 (Event-Driven Processing Basics), Ch 6 (Deterministic Stream Processing)

**Pages updated:**

`wiki/sources/building-event-driven-microservices.md` — added chapter notes for Ch 5 and Ch 6.

`wiki/streams/stream-processing.md` — major expansion: added stateless processing topology primitives section (consume-process-emit loop, filter/map/mapValue/custom transforms, branching/merging, repartitioning, copartitioning, partition assignment strategies); added late event handling strategies (drop/wait/grace period); expanded event time section with NTP synchronisation details, event scheduling, watermark propagation mechanics, stream time (Kafka Streams approach as alternative to watermarks); added reprocessing section; added BEDM to "How Different Sources Treat It".

`index.md` — updated source progress (ch. 0–4 → ch. 0–6); updated stream-processing entry.

11 chapters remain (Ch 7–17).

## [2026-05-14] ingest | Building Event-Driven Microservices — Ch 7–8

**Chapters ingested:** Ch 7 (Stateful Streaming), Ch 8 (Building Workflows with Microservices)

**Pages updated:**

`wiki/sources/building-event-driven-microservices.md` — added chapter notes for Ch 7 and Ch 8.

`wiki/streams/stream-processing.md` — added Stateful State Management section: internal vs external state stores, RocksDB performance benchmarks (65μs/15.4k req/s vs 939 req/s with 1ms network latency), changelog recovery, hot replicas, global state stores, effectively once processing (broker transactions, deduplication, state store transactions), rebuilding vs migrating state.

`wiki/patterns/saga.md` — added Compensation Workflows section (business-level remedies as alternative to technical rollback); added BEDM perspective to "How Different Sources Treat It" (God orchestrator anti-pattern, choreography limitations, orchestrated vs choreographed sagas guidance); added BEDM to sources.

`index.md` — updated source progress (ch. 0–6 → ch. 0–8); updated stream-processing and saga entries.

9 chapters remain (Ch 9–17).

## [2026-05-14] ingest | Building Event-Driven Microservices — Ch 9–10

**Chapters ingested:** Ch 9 (Microservices Using Function-as-a-Service), Ch 10 (Basic Producer and Consumer Microservices)

**Pages updated:**

`wiki/sources/building-event-driven-microservices.md` — added chapter notes for Ch 9 and Ch 10.

`wiki/patterns/sidecar-service-mesh.md` — added Data-Sinking Sidecar section (EDM legacy integration use case: co-deployed BPC sinks event stream data into legacy data store without modifying legacy codebase); added BEDM to sources.

`index.md` — updated source progress (ch. 0–8 → ch. 0–10); updated sidecar entry.

7 chapters remain (Ch 11–17).

## [2026-05-14] ingest | Building Event-Driven Microservices — Ch 11–12

**Chapters ingested:** Ch 11 (Heavyweight Framework Microservices), Ch 12 (Lightweight Framework Microservices)

**Pages updated:**

`wiki/sources/building-event-driven-microservices.md` — added chapter notes for Ch 11 and Ch 12.

`wiki/streams/stream-processing.md` — added Heavyweight vs Lightweight Stream Processing Frameworks section: heavyweight characteristics (dedicated cluster, ZooKeeper, checkpoints to HDFS, cluster-internal shuffle); deployment options (hosted, full cluster, CMS-integrated); Spark ESS for dynamic scaling; lightweight characteristics (no cluster, changelogs in broker, internal event streams for shuffle); Kafka Streams + Samza embedded mode; full comparison table; updated BEDM "How Different Sources" entry.

`index.md` — updated source progress (ch. 0–10 → ch. 0–12); updated stream-processing entry.

5 chapters remain (Ch 13–17).

## [2026-05-14] ingest | Building Event-Driven Microservices — Ch 13–14

**Chapters ingested:** Ch 13 (Integrating Event-Driven and Request-Response Microservices), Ch 14 (Supportive Tooling)

**Pages updated:**

`wiki/sources/building-event-driven-microservices.md` — added chapter notes for Ch 13 (external event types, serving state via REST API — internal/external state store patterns + all-in-one vs separate microservice, event-first request handling, async UI, approval pattern, microfrontends) and Ch 14 (microservice-to-team assignment, event stream metadata tagging, quotas, schema registry workflow, schema change notifications, ACLs, offset management, state reset, consumer lag monitoring, streamlined creation process, dependency tracking + topology visualisation).

`wiki/concepts/api-design.md` — added "Serving State from Event-Driven Microservices" section (internal state routing via partitioner + smart LB, external state store with all-in-one vs separate microservice sub-patterns) and "Event-First Request Handling" section (durable record, eventually consistent read-after-write, async UI); added building-event-driven-microservices to sources.

`wiki/concepts/contracts.md` — expanded schema registry section with detailed workflow (producer → register → ID → append; consumer → lookup → cache; Confluent stores schemas as broker topics); added schema change notification mechanism (ACL-derived consumer identification); added ACLs as single-writer contract enforcement (permission table, enable from day one, orphan detection); updated BEDM row in How Different Sources table.

`wiki/concepts/architecture-quantum.md` — expanded micro-frontends paragraph with EDM pairing rationale (both composition-based; each bounded context materializes its own state from event streams; design requirements for consistency); added building-event-driven-microservices to sources.

`index.md` — updated source progress (ch. 0–12 → ch. 0–14); updated api-design and architecture-quantum entries.

3 chapters remain (Ch 15–17).

## [2026-05-14] ingest | Building Event-Driven Microservices — Ch 15–16

**Chapters ingested:** Ch 15 (Testing Event-Driven Microservices), Ch 16 (Deploying Event-Driven Microservices)

**Pages updated:**

`wiki/sources/building-event-driven-microservices.md` — added chapter notes for Ch 15 (topology unit testing, stateful testing, topology test drivers, schema evolution testing, local/remote integration testing, event data strategies, shared-env anti-pattern, disposable environments, production testing) and Ch 16 (deployment principles, full-stop pattern, rolling update prerequisites, breaking schema change patterns — eventual vs synchronized migration, blue-green constraints for event producers).

`wiki/concepts/api-testing.md` — added "Testing Event-Driven Microservices" section (unit testing stateless/stateful/topology functions, schema evolution testing, local integration — embedded vs containerized, event data sourcing strategies, shared-env anti-pattern, disposable environments, production testing); added "How Different Sources Treat It" comparison table; updated frontmatter sources; updated Related Concepts.

`wiki/concepts/deployment-pipelines.md` — added "Deploying Event-Driven Microservices" section (deployment principles, basic full-stop 5-step pattern, rolling update prerequisites, breaking schema change patterns — eventual migration + synchronized migration + entity stream re-creation, blue-green applicability constraints); added "How Different Sources Treat It" table; updated frontmatter sources; updated Related Concepts.

`index.md` — updated source progress (ch. 0–14 → ch. 0–16); updated api-testing and deployment-pipelines entries.

1 chapter remains (Ch 17).

## [2026-05-14] ingest | Building Event-Driven Microservices — Ch 17 (complete)

**Chapter ingested:** Ch 17 (Conclusion)

**Pages updated:**

`wiki/sources/building-event-driven-microservices.md` — added chapter notes for Ch 17 (microservice tax 5 components: event broker, schema registry + data exploration, container management, CI/CD, monitoring + logging; not-all-micro guidance; data communication layer as the essential architectural contribution of EDM).

`wiki/authors/adam-bellemare.md` — expanded Background section with explicit professional history from colophon: Staff Engineer at Shopify (data platform, 2020–), Staff Engineer at Flipp (2014–2020), Software Developer at BlackBerry (first event-driven systems work); expertise areas (Kafka, Spark, Mesos, Kubernetes, Elasticsearch, Java/Scala/Beam/Flink).

`overview.md` — updated sources count to 9; added new major theme "The Data Communication Layer Is the Missing Piece" (three communication structures, EDM's contribution, microservice tax requirement); updated Sources in This Wiki table to include SATH, Software Architecture Patterns, and BEDM; added Bellemare to Key Authors.

`index.md` — updated BEDM source entry to "fully ingested 2026-05-14".

`README.md` — added Building Event-Driven Microservices to Sources ingested table.

Book fully ingested. All 17 chapters (+ preamble) moved to `_incoming/processed/building-event-driven-microservices/`. Processing directory removed.

## [2026-05-14] lint | Wiki health-check

**Issues found and fixed:**

1. `overview.md` — corrected source count from 9 to 8; removed erroneous "microservices antipatterns and pitfalls" from the ingested list (that book has not been ingested).
2. `overview.md` — removed now-answered open question about what SATH adds to decomposition/data management (SATH is fully ingested).
3. `overview.md` — updated stale open question about "microservices books (Richards, Fowler)" to note Richards is ingested and Fowler's *Microservices in Production* is not yet ingested.
4. `comparisons/architecture-styles-comparison.md` — fixed broken wikilink `[[sources/hard-parts]]` → `[[sources/software-architecture-the-hard-parts]]`; resolved stale open question "worth comparing when ingested" with an actual finding from SATH (six decomposition patterns, Ch 4; five-step data decomposition, Ch 6).
5. `concepts/conways-law.md` — added `[[concepts/bounded-contexts]]` link to unlinked "bounded contexts" mention.
6. `concepts/data-decomposition.md` — added `[[concepts/bounded-contexts]]` link to first unlinked "bounded context" mention.
7. `styles/microservices-architecture.md` — added `[[concepts/bounded-contexts]]` links to two unlinked "bounded context" mentions in Definition and Core Philosophy sections.
8. `concepts/architectural-decomposition.md` — added `[[styles/modular-monolith]]` link to unlinked "modular monolith" mention.
9. `concepts/api-gateway.md` — added `[[distributed/rate-limiting]]` link to unlinked "rate limiting" mention in Definition.
10. `concepts/consensus-algorithms.md` — added `[[distributed/broadcast-protocols]]` to Related Concepts (TOB equivalence).
11. `concepts/availability.md` — added `[[distributed/rate-limiting]]` to Related Concepts.
12. `concepts/evolutionary-architecture.md` — added `[[styles/modular-monolith]]` to Related Concepts.

## [2026-05-14] ingest | Learning Domain-Driven Design — Preamble + Ch 1

**Chapters ingested:** Preamble (book setup, WolfDesk example, structure overview), Ch 1 (Analyzing Business Domains)

**Pages created:**

`wiki/sources/learning-domain-driven-design.md` — new source page with overview, key claims, preamble + Ch 1 notes.

`wiki/authors/vlad-khononov.md` — new author page: 20+ year practitioner, lives in Northern Israel, 10 years teaching DDD, English is his third language; core positions on subdomain-driven implementation strategy and ubiquitous language.

**Pages updated:**

`wiki/concepts/bounded-contexts.md` — added full Subdomain Taxonomy section from LDDD ch. 1: core/generic/supporting table, implementation strategy guidance per type, identification heuristics, distillation guidance. Updated frontmatter tags and sources. Added LDDD row to "How Different Sources Treat It" table.

`overview.md` — source count updated 8→9; LDDD added to Sources table (in progress); Khononov added to Key Authors.

`index.md` — added LDDD source entry and Khononov author entry.

`CLAUDE.md` — added `learning-domain-driven-design` slug to the Book Slugs table.

## [2026-05-14] ingest | Learning Domain-Driven Design — Ch 2 + Ch 3

**Chapters ingested:** Ch 2 (Discovering Domain Knowledge / Ubiquitous Language), Ch 3 (Managing Domain Complexity / Bounded Contexts)

**Pages created:**

`wiki/concepts/ubiquitous-language.md` — new page: DDD cornerstone practice; the telephone-game translation problem; properties (business language, precise/consistent, no ambiguous/synonymous terms); a model not a copy; bounded to its context; continuous cultivation; tools (wiki glossary, Gherkin, NDepend); Brandolini and Dijkstra quotes.

**Pages updated:**

`wiki/concepts/bounded-contexts.md` — major update: added "What Is a Bounded Context?" section (the motivating inconsistent-models problem, bounded context as solution, scope guidance); added "Subdomains vs Bounded Contexts" table (discovered vs designed, problem vs solution space); added "Physical and Ownership Boundaries" section (one service per BC, one team per BC); added ubiquitous-language and context-map links to Related Concepts; updated frontmatter tags.

`wiki/sources/learning-domain-driven-design.md` — added Ch 2 and Ch 3 notes.

`overview.md` — added "Domain-Driven Design: Aligning Software with Business Strategy" major theme: subdomain taxonomy → implementation decisions; bounded contexts as designed vs subdomains as discovered; ubiquitous language scoped to bounded context.

`index.md` — expanded bounded-contexts entry; added ubiquitous-language entry.

## [2026-05-14] ingest | Learning Domain-Driven Design — Ch 4 + Ch 5

**Chapters ingested:** Ch 4 (Integrating Bounded Contexts), Ch 5 (Implementing Simple Business Logic)

**Pages created:**

`wiki/patterns/context-map.md` — new page: six bounded context integration patterns (partnership, shared kernel, conformist, anticorruption layer, open-host service, separate ways); team collaboration framing; context map notation and maintenance; pattern decision guide; never separate ways for core subdomains.

`wiki/patterns/business-logic-patterns.md` — new page: four-pattern spectrum overview; transaction script (definition, three failure modes: no transaction/distributed/implicit, idempotency/OCC fixes, when to use); active record (definition, vs. transaction script, "anemic domain model" framing rejected); pattern selection heuristic; links to domain model and event sourcing pages.

**Pages updated:**

`wiki/sources/learning-domain-driven-design.md` — added Ch 4 and Ch 5 notes.

`index.md` — added context-map and business-logic-patterns entries.

## [2026-05-14] ingest | Learning Domain-Driven Design — Ch 6 + Ch 7

**Chapters ingested:** Ch 6 (Tackling Complex Business Logic / Domain Model), Ch 7 (Modeling the Dimension of Time / Event-Sourced Domain Model)

**Pages created:**

`wiki/patterns/domain-model.md` — new page: DDD tactical pattern for core subdomains; full building-block set (value objects — immutable, identified by values, prevent primitive obsession; entities — require ID, only used in aggregates; aggregates — consistency enforcement boundary, one-per-transaction cardinal rule, OCC with version field, aggregate root, reference other aggregates by ID only, keep small; domain events — past-tense, published after commits; domain services — stateless, multi-aggregate logic, no transaction bypass); application layer as thin orchestrator; comparison to transaction script.

**Pages updated:**

`wiki/streams/event-sourcing-cqrs.md` — added "Event-Sourced Domain Model (DDD Perspective)" section: LDDD's framing as fourth tactical pattern; four-step operation cycle (load → rehydrate → execute → append); event store interface; snapshot pattern; forgettable payload (GDPR); advantages and disadvantages; added LDDD to sources and How Different Sources table; added domain-model link to Related Concepts.

`wiki/patterns/business-logic-patterns.md` — fixed domain-model link.

`wiki/sources/learning-domain-driven-design.md` — added Ch 6 and Ch 7 notes.

`index.md` — added domain-model entry.

## [2026-05-14] ingest | Learning Domain-Driven Design — Ch 8 + Ch 9

**Chapters ingested:** Ch 8 (Architectural Patterns), Ch 9 (Communication Patterns)

**Pages created:**

`wiki/styles/ports-and-adapters.md` — new page: hexagonal/onion/clean architecture; ports (interfaces defined in BL layer) vs adapters (infrastructure implementations); comparison to layered architecture; DIP inversion; three formulations (Cockburn, Palermo, Martin); DDD fit: domain model and event-sourced domain model; architectural slices principle (patterns apply per module, not per bounded context).

**Pages updated:**

`wiki/styles/layered-architecture.md` — added LDDD's DDD perspective (layer vs tier distinction; fit with transaction script/active record; contrast with ports and adapters); updated Related Pages.

`wiki/streams/event-sourcing-cqrs.md` — added "CQRS in the DDD Context" section: synchronous projection (catch-up subscription, checkpoint column) vs asynchronous projection (message bus subscription); commands may return data from strongly consistent model; architectural slices principle.

`wiki/patterns/outbox-pattern.md` — added "Outbox Pattern in the DDD Context" section: two wrong approaches (publish before commit; publish after commit but before crash); correct atomically-committed outbox; NoSQL embedding; pull vs push relay; added LDDD row to How Different Sources table.

`wiki/patterns/saga.md` — added "Saga and Process Manager (DDD Perspective)" section: saga as event-driven coordinator (stateless or stateful); process manager as saga with conditional branching (always has state, always an aggregate); trip booking example; warning against using sagas to compensate for wrong aggregate boundaries; added LDDD row to sources table and How Different Sources table; updated frontmatter.

`wiki/patterns/context-map.md` — added "Model Translation: Implementation Patterns" section: stateless translation (proxy, API gateway, message proxy; private vs public events); stateful translation (stream processing, BFF pattern).

`wiki/sources/learning-domain-driven-design.md` — added Ch 8 and Ch 9 notes.

`index.md` — added ports-and-adapters entry; updated event-sourcing-cqrs, layered-architecture, context-map, outbox-pattern, and saga entries.

## [2026-05-14] ingest | Learning Domain-Driven Design — Ch 10 + Ch 11

**Chapters ingested:** Ch 10 (Design Heuristics), Ch 11 (Evolving Design Decisions)

**Pages updated:**

`wiki/concepts/bounded-contexts.md` — added three new sections:
(1) "Bounded Context Sizing Heuristic": size is a function of the model (not the other way around); start wide for core subdomains; decompose as domain knowledge stabilises; triggers for splitting.
(2) "Subdomain Type Evolution": all 6 transitions (core↔generic, core↔supporting, generic↔supporting); strategic and tactical consequences; pain as the signal for type change.
(3) "Growth Management": revisit subdomain/bounded context/aggregate boundaries; eliminate accidental complexity; chatty contexts as a signal.

`wiki/patterns/business-logic-patterns.md` — added two new sections:
(1) "Tactical Design Decision Tree": three-step heuristic (business logic pattern → architectural pattern → testing strategy); ubiquitous language as a complexity proxy; testing pyramid/diamond/reversed-pyramid mapped to patterns.
(2) "Migration Paths Between Patterns": transaction script→active record, active record→domain model (make setters private, let compilation errors guide), domain model→event-sourced (generating past transitions vs migration events).

`wiki/streams/event-sourcing-cqrs.md` — added "Migrating from Domain Model to Event-Sourced Domain Model" subsection inside Event-Sourced Domain Model (DDD Perspective): generating past transitions vs modeling migration events; epistemic honesty argument for migration event approach.

`wiki/sources/learning-domain-driven-design.md` — added Ch 10 and Ch 11 notes.

`index.md` — updated bounded-contexts and business-logic-patterns entries.

## [2026-05-14] ingest | Learning Domain-Driven Design — Ch 12 + Ch 13

**Chapters ingested:** Ch 12 (EventStorming), Ch 13 (Domain-Driven Design in the Real World)

**Pages created:**

`wiki/concepts/eventstorming.md` — new page: EventStorming 10-step process (unstructured exploration, timelines, pain points, pivotal events, commands, policies, read models, external systems, aggregates, bounded contexts); when to use; two-phase facilitation (big picture first, then per-process); remote EventStorming; key insight that the process value exceeds the model output.

**Pages updated:**

`wiki/concepts/evolutionary-architecture.md` — added LDDD perspective to How Different Sources table: DDD-centric brownfield modernisation (strategic analysis, strangler pattern with ACL/OHS layer + shared database exception, incremental tactical refactoring, pragmatic/undercover DDD); updated frontmatter sources.

`wiki/sources/learning-domain-driven-design.md` — added Ch 12 and Ch 13 notes.

`index.md` — added eventstorming entry; updated evolutionary-architecture entry.

## [2026-05-14] ingest | Learning Domain-Driven Design — Ch 14 + Ch 15 + Ch 16

**Chapters ingested:** Ch 14 (Microservices), Ch 15 (Event-Driven Architecture), Ch 16 (Data Mesh). Final batch — book fully ingested.

**Pages updated:**

`wiki/styles/microservices-architecture.md` — added LDDD perspective: microservice = micro-public interface (not micro-codebase); deep module heuristic (Ousterhout); BC = widest valid boundary, microservice threshold = narrowest valid boundary; asymmetric relationship (all microservices are BCs; not all BCs are microservices); subdomain as safe granularity heuristic; OHS/ACL for deeper interfaces; added LDDD to sources.

`wiki/styles/event-driven-architecture.md` — added LDDD perspective: EDA ≠ event sourcing distinction; three event types (event notification, ECST, domain event) with comparison; distributed big ball of mud anti-pattern (implementation + functional + temporal coupling); design heuristics (assume the worst, private vs public events, consistency-driven event type selection); added LDDD to sources.

`wiki/concepts/data-mesh.md` — added LDDD perspective: OLTP vs OLAP modeling; fact tables (business activities, append-only); dimension tables; star vs snowflake schema; data warehouse and data lake challenges; data mesh four principles (decompose around domains, data as product, enable autonomy, ecosystem); DDD/Data Mesh alignment (UL, OHS as published language, CQRS for projections, BC integration patterns for analytical models); added LDDD to sources.

`wiki/sources/learning-domain-driven-design.md` — added Ch 14, 15, 16 notes; expanded Related Pages to full list of 14 linked pages.

`README.md` — added Learning Domain-Driven Design to Sources ingested table.

`overview.md` — updated status to "9 sources fully ingested."

`index.md` — updated sources, microservices-architecture, event-driven-architecture, and data-mesh entries.

## [2026-05-14] ingest | Team Topologies — Batch 1 (Ch 1–2)

Began ingestion of *Team Topologies* by Matthew Skelton & Manuel Pais. Manually split EPUB into 10 files (preamble + 8 chapters + conclusion). Ingested chapters 1 and 2.

`wiki/sources/team-topologies.md` — Created. Overview, key claims, ch. 1–2 notes.

`wiki/concepts/team-topologies-model.md` — Created. Four team types (stream-aligned, platform, enabling, complicated-subsystem), three interaction modes (collaboration, X-as-a-Service, facilitating), cognitive load as architectural constraint, evolution of interaction modes.

`wiki/concepts/conways-law.md` — Updated. Added Team Topologies treatment: Pflaeging's three organisational structures, tool choices as communication drivers, unexpected communication as diagnostic signal, organisation design as technical work, Ruth Malan's modern formulation, Nygard's "team assignments are the first draft of the architecture." Added to sources frontmatter and How Different Sources table.

`wiki/authors/matthew-skelton.md` — Created.
`wiki/authors/manuel-pais.md` — Created.

`index.md` — Added source, team-topologies-model, and author entries; updated conways-law entry.

## [2026-05-14] ingest | Team Topologies — Batch 2 (Ch 3–4)

`wiki/concepts/cognitive-load.md` — Created. Sweller's three cognitive load types (intrinsic/extraneous/germane), team cognitive capacity as software boundary constraint, domain complexity heuristics (simple/complicated/complex), levers for reducing load, relationship to architecture decisions.

`wiki/concepts/team-topologies-model.md` — Updated. Added: Dunbar-compatible team sizing table, stability/flow-to-teams principle, one-owner-per-component rule, Team API definition (code+versioning+docs+practices+comms+work info), Spotify model (squads/tribes/chapters/guilds) as example, team anti-patterns (ad hoc design, shuffling team members), DevOps team anti-pattern.

`wiki/sources/team-topologies.md` — Updated. Added ch. 3 and ch. 4 notes.

`index.md` — Updated team-topologies-model entry; added cognitive-load entry.

## [2026-05-14] ingest | Domain-Driven Design (Evans) — Batch 6 (Ch 11–12)

Ingested Ch 11 (Applying Analysis Patterns) and Ch 12 (Relating Design Patterns to the Model).

`wiki/sources/domain-driven-design.md` — Updated. Added Ch 11 notes (analysis patterns as conceptual starting points; Account/Entry/Posting Rule examples; preserve names/concepts while adapting details; analysis patterns vs framework reuse) and Ch 12 notes (GoF patterns as domain patterns when corresponding to genuine domain concepts; STRATEGY/Policy for explicit business policies; COMPOSITE for genuine part-whole hierarchies; FLYWEIGHT as purely technical; the domain pattern test).

No new concept/pattern pages created — these chapters are guidance on applying external resources rather than introducing new patterns.

## [2026-05-14] ingest | Domain-Driven Design (Evans) — Batch 5 (Ch 9–10)

Ingested Ch 9 (Making Implicit Concepts Explicit) and Ch 10 (Supple Design).

`wiki/sources/domain-driven-design.md` — Updated. Added Ch 9 notes (four discovery techniques, three implicit concept categories: explicit constraints, processes as domain objects, Specification pattern) and Ch 10 notes (six supple design patterns, Shares Math extended example, declarative style, composite Specification with AND/OR/NOT/subsumption).

`wiki/patterns/specification.md` — Created. New pattern page: SPECIFICATION predicate VALUE OBJECT; three uses (validation, selection, building to order); composite with AND/OR/NOT; subsumption; repository integration; design notes.

`wiki/concepts/supple-design.md` — Created. New concept page: Evans' six supple design patterns and how they interplay; declarative style as outcome; connection to deep modelling.

`index.md` — Added specification pattern entry; added supple-design concept entry.

## [2026-05-14] ingest | Domain-Driven Design (Evans) — Batch 4 (Ch 7–8)

Ingested Ch 7 (Using the Language: An Extended Example) and Ch 8 (Breakthrough).

`wiki/sources/domain-driven-design.md` — Updated. Added Ch 7 and Ch 8 chapter notes. Ch 7: cargo shipping walkthrough (entity/VO classification, association direction, aggregate boundaries, repository selection, anticorruption layer introduction, Enterprise Segment, module design). Ch 8: breakthrough story — loan syndication, Share Pie insight, cascade of insights, guidance for recognising and responding to breakthroughs.

`wiki/concepts/model-driven-design.md` — Updated. Added Breakthroughs section: non-linear returns from refactoring; the Share Pie story; cultivating conditions; seizing the moment; cascade of insights.

`index.md` — Updated model-driven-design entry to note breakthrough concept.

## [2026-05-14] ingest | Domain-Driven Design (Evans) — Batch 3 (Ch 5–6)

Ingested Ch 5 (A Model Expressed in Software) and Ch 6 (The Life Cycle of a Domain Object).

`wiki/sources/domain-driven-design.md` — Updated. Added Ch 5 and Ch 6 chapter notes. Added three new key claims (entity/VO context-dependence; aggregates as consistency boundary; factory/repository complementarity).

`wiki/patterns/domain-model.md` — Updated. Added Evans' elaborations section covering: association direction constraints, entity identity nuance (context question), value object copying/sharing, services three-layer partitioning, modules as model elements and UL participants, complete aggregate invariant rules (7 rules), purchase order locking example, factory vs repository distinctions. Added Evans row to How Different Sources table. Added `[[patterns/repository]]` to related concepts.

`wiki/patterns/repository.md` — Created. New pattern page: REPOSITORY pattern (Evans): in-memory collection illusion; aggregate roots only; query methods; developer must understand implementation; transaction control at client; factory/repository complementarity; relational design considerations.

`index.md` — Updated domain-model entry with Evans additions; added repository pattern entry.

## [2026-05-14] ingest | Domain-Driven Design (Evans) — Batch 2 (Ch 3–4)

`wiki/sources/domain-driven-design.md` — Updated. Added ch. 3 notes (MODEL-DRIVEN DESIGN: one model for analysis and design; analysis model failure modes; hands-on modellers; bones-showing with IE Favorites example) and ch. 4 notes (layered architecture: four layers, domain layer is mandatory for DDD; Smart UI anti-pattern: valid for simple apps, incompatible with DDD, no migration path; Transaction Script as middle ground). Added four key claims.

`wiki/concepts/model-driven-design.md` — Created. Definition; the analysis/design dichotomy failure; hands-on modellers; bones-showing; relationship to ubiquitous language; relationship to layered architecture.

`wiki/styles/layered-architecture.md` — Updated. Added Evans row to How Different Sources table (domain isolation as primary goal; Smart UI; framework minimalism). Added model-driven-design link to Related Pages. Updated sources frontmatter to include domain-driven-design.

`index.md` — Added model-driven-design concept entry; updated layered-architecture entry.

## [2026-05-14] ingest | Domain-Driven Design (Evans) — Batch 1 (Ch 1–2)

EPUB extracted via pandoc (19,064 lines); split into 18 files (preamble + 17 chapters) using sed after manual boundary detection. Script detected no headings; chapters split manually on "Chapter One", "Chapter Two", etc.

`wiki/sources/domain-driven-design.md` — Created. Overview (foundational DDD text, 2003, four-part structure), key claims, ch. 1 and ch. 2 notes (knowledge crunching, five ingredients of effective modelling, overbooking example, ubiquitous language, modeling out loud, document liveness test, UML limitations, explanatory models).

`wiki/concepts/ubiquitous-language.md` — Updated. Added Evans' original formulation section: UL must appear in the code; modeling out loud as refinement tool; document liveness test (archive if UL terms stop appearing in code/conversation); UML limitations; explanatory models as separate teaching tools. Added Evans row to How Different Sources table. Updated sources frontmatter.

`wiki/authors/eric-evans.md` — Created.

`index.md` — Added domain-driven-design source entry; updated ubiquitous-language entry; added eric-evans author entry.

## [2026-05-14] ingest | Team Topologies — Batch 4 (Ch 7–8) + Finalisation

`wiki/concepts/team-topologies-model.md` — Updated. Added: interaction mode constraints per mode; interaction mode matrix (Typical/Occasional by team type); awkward interactions as diagnostic signal; promise theory and SemVer as team promise (Burgess); intermittent collaboration research (Bernstein et al.); discovery-to-establish pattern (collaboration → XaaS); three triggers for topology evolution (software too large, cadence slowing, platformize); organisational sensing section (stable teams = sensory apparatus; cybernetic feedback loop; Stafford Beer citation; DevOps Three Ways); BAU/maintenance team anti-pattern; Team Topologies necessary-but-not-sufficient caveat (culture, engineering, financial, vision).

`wiki/sources/team-topologies.md` — Updated. Added ch. 7 and ch. 8 notes; added two key claims (awkward interactions as diagnostic signal; BAU/maintenance anti-pattern; stable teams as sensory apparatus). Source status: fully ingested.

`index.md` — Updated team-topologies-model entry; updated team-topologies source entry (marked fully ingested).

`CLAUDE.md` — Added `team-topologies` slug to book slug table.

`README.md` — Added Team Topologies to Sources ingested table.

Chapter files moved to processed: `07-team-interaction-modes.txt`, `08-evolve-team-structures.txt`, `09-conclusion.txt` (book index only — no substantive content), `00-preamble.txt`. Processing directory cleaned.

## [2026-05-14] ingest | Team Topologies — Batch 3 (Ch 5–6)

`wiki/concepts/fracture-planes.md` — Created. Eight fracture plane types (business domain/regulatory/change cadence/team location/risk/performance/technology/user personas); six forms of monolith; litmus test; distributed monolith anti-pattern.

`wiki/concepts/team-topologies-model.md` — Updated. Added: Platform as product (TVP, DevEx, fractal platforms, self-service goal); team-type conversion guide (infrastructure→platform, component→various, DBA→enabling/platform, architecture→part-time enabling); 6:1–9:1 ratio guidance; fracture-planes link in related concepts.

`wiki/sources/team-topologies.md` — Updated. Added ch. 5 and ch. 6 notes.

`index.md` — Added fracture-planes entry; updated team-topologies-model entry.

## [2026-05-14] ingest | Domain-Driven Design (Evans) — Batch 8 (Ch 15–17) + Finalisation

Ingested Ch 15 (Distillation), Ch 16 (Large-Scale Structure), Ch 17 (Bringing the Strategy Together).

`wiki/sources/domain-driven-design.md` — Updated. Added Ch 15 notes (CORE DOMAIN, escalation of distillation — Domain Vision Statement, Highlighted Core, Generic Subdomains, Cohesive Mechanisms, Segregated Core, Abstract Core; four generic subdomain implementation options; project risk management: start on CORE), Ch 16 notes (large-scale structure; Evolving Order; four patterns — System Metaphor, Responsibility Layers, Knowledge Level, Pluggable Component Framework; layer vocabulary — Potential/Operations/Decision Support/Policy/Commitment; leather jacket analogy), Ch 17 notes (synthesis: combining structures, bounded contexts, distillation; assessment first; who sets strategy; six essentials; Beware the Master Plan; epilogue — supple design enables long-term evolution). Updated Related Pages section. Source status: fully ingested.

`wiki/concepts/core-domain.md` — Created. CORE DOMAIN definition; motivating problem (talented developers gravitate to technical problems, CORE is neglected); escalation of distillation techniques (Domain Vision Statement, Highlighted Core, Generic Subdomains — four options, Cohesive Mechanisms, Segregated Core, Abstract Core); choosing refactoring targets; comparison with Khononov's subdomain taxonomy.

`wiki/concepts/large-scale-structure.md` — Created. Definition; Evolving Order; four patterns (System Metaphor, Responsibility Layers, Knowledge Level, Pluggable Component Framework); layer vocabulary; how restrictive; refactoring toward fitting structure; who sets the structure (emergent vs customer-focused team); six essentials; Beware the Master Plan (Christopher Alexander).

`CLAUDE.md` — Added `domain-driven-design` slug to book slug table.

`README.md` — Added Domain-Driven Design to Sources ingested table.

`index.md` — Updated domain-driven-design source entry (marked fully ingested); added core-domain entry; added large-scale-structure entry.

Chapter files moved to processed: `15-distillation.txt`, `16-large-scale-structure.txt`, `17-bringing-the-strategy-together.txt`, `00-preamble.txt`. Processing directory cleaned.

## [2026-05-14] ingest | Domain-Driven Design (Evans) — Batch 7 (Ch 13–14)

Ingested Ch 13 (Refactoring Toward Deeper Insight) and Ch 14 (Maintaining Model Integrity).

`wiki/sources/domain-driven-design.md` — Updated. Added Ch 13 notes (three practices for deepening the model: live in the domain, look differently, maintain dialog with experts; exploration teams; when to refactor; punctuated equilibrium; prior art — domain literature, analysis patterns, GoF, formal systems) and Ch 14 notes (BOUNDED CONTEXT definition and two problems — duplicate concepts vs false cognates; CONTINUOUS INTEGRATION at two levels; CONTEXT MAP; complete integration pattern taxonomy — SHARED KERNEL, CUSTOMER/SUPPLIER, CONFORMIST, ANTICORRUPTION LAYER, SEPARATE WAYS, OPEN HOST SERVICE, PUBLISHED LANGUAGE; context strategy guidelines — larger vs smaller BC trade-offs, one team per context; transformation step-by-step recipes; the elephant parable).

`wiki/concepts/bounded-contexts.md` — Updated. Added "Evans' Originating Treatment" section with the originating motivation (model integrity), the CONTINUOUS INTEGRATION pairing, the CONTEXT MAP as global diagram, and context sizing trade-offs. Added `domain-driven-design` to sources frontmatter. Updated index entry.

`wiki/patterns/context-map.md` — Updated. Added "Evans' Originating Integration Pattern Taxonomy" section with the full eight-pattern table and transformation path recipes. Added `domain-driven-design` to sources frontmatter. Updated "How Different Sources" table with Evans row. Updated index entry.

`index.md` — Updated bounded-contexts and context-map entries to reflect Evans' originating treatment.

Chapter files moved to processed: `13-refactoring-toward-deeper-insight.txt`, `14-maintaining-model-integrity.txt`.

## [2026-05-15] ingest | Monolith to Microservices (Newman) — Batch 1 (Ch 1–2)

EPUB extracted via pandoc; split into 7 files (preamble + 6 chapters) using `split_epub.py`. This batch covers Chapters 1–2.

**Pages created:**

`wiki/sources/monolith-to-microservices.md` — New source page: overview (migration handbook, practitioner-focused), key claims, ch. 1 notes (microservice definition, independent deployability as #1 principle, three monolith types, four coupling types, information hiding, Just Enough DDD, monolith advantages, James Lewis quote), ch. 2 notes (microservices are not the goal, three key questions, six migration drivers with alternatives, reuse as poor goal, when not to use microservices, reversible/irreversible decisions, incremental migration, domain model for prioritisation, Event Storming, two-axis quadrant, Kotter's 8 steps, quantitative + qualitative measures, sunk cost fallacy).

`wiki/authors/sam-newman.md` — New author page: background, core positions, book notes.

**Pages updated:**

`wiki/styles/microservices-architecture.md` — Added "When Microservices Are the Wrong Choice" section (four conditions: unclear domain, startups, customer-installed software, no clear reason). Added Newman row to How Different Sources table (independent deployability as #1 principle, four coupling types, monolith advantages). Added modular-monolith and modularity links to Related Pages.

`wiki/concepts/modularity.md` — Added "Information Hiding and Service Coupling (Newman)" section: Parnas' 1971 information hiding as the grounding principle; four-type coupling taxonomy (implementation/temporal/deployment/domain) with severity table; contradiction note (structural coupling vs operational coupling dimensions).

`wiki/concepts/fracture-planes.md` — Updated "Types of Monolith" section: added Newman's deployment-oriented taxonomy (single-process, modular, distributed) alongside Team Topologies' six-form taxonomy, with note on modular monolith as underrated option.  Added "Migration Prioritisation (Newman)" section: two-axis quadrant (value vs difficulty), inbound dependency count as difficulty proxy, iterative replanning.

`wiki/concepts/eventstorming.md` — Added Newman row to How Different Sources table: near-essential migration planning tool, bottom-up (events → aggregates → BCs), shared understanding as primary output, not an architectural commitment.

`wiki/concepts/bounded-contexts.md` — Added Newman row to How Different Sources table: BCs as primary unit of decomposition; use inbound dependency counts for extraction ordering; split on aggregates only when justified.

`index.md` — Added monolith-to-microservices source entry; added sam-newman author entry.

Chapter files moved to processed: `01-just-enough-microservices.txt`, `02-planning-a-migration.txt`. 5 files remain in processing directory.

## [2026-05-15] ingest | Monolith to Microservices (Newman) — Batch 2 (Ch 3–4)

This batch covers Chapter 3 (Splitting the Monolith) and Chapter 4 (Decomposing the Database).

**Pages created:**

`wiki/patterns/strangler-fig.md` — New pattern page: three-step process (identify/implement/redirect); HTTP reverse proxy as primary mechanism; FTP variant (Homegate example); message interception via content-based router or selective consumption; UI composition (page composition, widget/micro frontends, Spotify server-side mobile config); deployment ≠ release principle; feature freeze caution; reversibility via proxy; limitations.

`wiki/patterns/branch-by-abstraction.md` — New pattern page: five-step process (create abstraction, use abstraction, new implementation, switch, clean up); feature toggles; verify variant (Steve Smith) with automatic fallback (run both, compare, always return old result); when to use vs strangler fig.

`wiki/patterns/parallel-run.md` — New pattern page: both implementations receive every request; old result returned; spies; GitHub Scientist library; terminology clarification (dark launching vs canary releasing vs parallel run); progressive delivery (James Governor); when to use; limitations.

**Pages updated:**

`wiki/sources/monolith-to-microservices.md` — Added Ch 3 notes (strangler fig, UI composition, branch by abstraction, parallel run, decorating collaborator, change data capture) and Ch 4 notes (shared database problem, all coping patterns, all active decomposition patterns, schema boundary patterns, table-level patterns, static reference data, ACID/2PC/saga treatment). Added new related pages.

`wiki/patterns/saga.md` — Added Newman row to How Different Sources table: backward vs forward recovery; semantic rollbacks; step reordering to minimise compensations; team ownership as coordination selector; correlation IDs for choreographed sagas. Updated sources frontmatter.

`wiki/concepts/evolutionary-database-design.md` — Added "Database Decomposition Patterns (Newman)" section: full catalogue of coping patterns (database view, wrapping service, DB-as-a-service interface, aggregate exposing monolith), active decomposition patterns (change data ownership, synchronize in application, tracer write), schema boundary patterns (repository per BC, database per BC, multischema storage), table-level patterns (split table, move FK to code), static reference data options, split sequencing trade-offs. Updated How Different Sources table. Updated sources frontmatter.

`wiki/concepts/distributed-transactions.md` — Added Newman row to How Different Sources table: migration context, "just say no" to 2PC reasoning (distributed locks, latency, blocking problem), sagas as default. Updated sources frontmatter.

`wiki/concepts/evolutionary-architecture.md` — Added Newman row to How Different Sources table: strangler fig as primary extraction pattern, branch by abstraction, parallel run/verify variant, progressive delivery. Added strangler-fig, branch-by-abstraction, parallel-run to Related Concepts.

`index.md` — Updated source entry (ch. 1–4 ingested); updated distributed-transactions, evolutionary-architecture, evolutionary-database-design entries; updated saga entry; added strangler-fig, branch-by-abstraction, parallel-run pattern entries.

Chapter files moved to processed: `03-splitting-the-monolith.txt`, `04-decomposing-the-database.txt`. 3 files remain in processing directory.

## [2026-05-15] ingest | Monolith to Microservices (Newman) — Batch 3 (Ch 5–6) + Finalisation

This batch covers Chapter 5 (Growing Pains) and Chapter 6 (Closing Words). Chapter 6 is a brief summary + appendices with no new technical content. This completes the full book ingestion.

**Pages updated:**

`wiki/sources/monolith-to-microservices.md` — Added Ch 5 notes: ownership at scale (strong/weak/collective model; strong ownership universal at 100+ developers; colander architecture anti-pattern); breaking changes (structural vs semantic; protolock; expansion changes; dual-version vs dual-contract strategies); reporting (dedicated reporting database, CDC); monitoring/troubleshooting (log aggregation as #1 priority; correlation IDs; Jaeger; synthetic transactions; observability as open-ended questioning); local developer experience (stub services, Telepresence, serverless-first); end-to-end testing (limit scope, consumer-driven contracts, automated release remediation, progressive delivery); global vs local optimization (cross-team technical group, Monzo proposals system); robustness (circuit breakers, async communication, document incidents); orphaned services (service registry, Biz Ops). Added Ch 6 notes. Added contracts and observability to Related Pages.

`wiki/concepts/observability.md` — Added "Observability in Microservice Migration (Newman)" section: log aggregation first as organisational readiness signal; correlation IDs as foundation for all tracing; distributed tracing (Jaeger) for latency; synthetic transactions for production testing; observability as open-ended questioning. Updated sources frontmatter.

`wiki/concepts/contracts.md` — Added "Breaking Contract Changes in Practice (Newman)" section: structural vs semantic breaking changes; explicit schema detection (protolock); expansion changes as default strategy; dual-version vs dual-contract management; consumer-driven contracts (Pact) as testing solution. Added Newman row to How Different Sources table. Updated sources frontmatter.

`README.md` — Added *Monolith to Microservices* to Sources ingested table.

`CLAUDE.md` — Added `monolith-to-microservices` to Book Slugs table.

`index.md` — Updated source entry (fully ingested); updated contracts and observability entries.

**Book fully ingested.** All chapter files moved to processed; processing directory cleaned up.

## [2026-05-15] ingest | Enterprise Integration Patterns (Hohpe & Woolf) — Batch 1 (Ch 1–2)

Chapter 1 (Solving Integration Problems Using Patterns) and Chapter 2 (Integration Styles).

Chapter 1 frames the problem space, defines six integration scenarios (information portals, data replication, shared business functions, SOA, distributed business processes, B2B), and walks through ~25 patterns via the WGRUS worked example: Channel Adapter, Message Translator, Canonical Data Model, Point-to-Point Channel, Publish-Subscribe Channel, Aggregator, Content-Based Router, Splitter, Composed Message Processor, Content Enricher, Message Store, Claim Check, Wire Tap, Process Manager, Return Address, Smart Proxy, Message Filter, Recipient List, Dynamic Router, Test Message, Control Bus, Invalid Message Channel, Datatype Channel, Command/Document Message types.

Chapter 2 formally defines the four integration styles (File Transfer, Shared Database, Remote Procedure Invocation, Messaging) with decision criteria, trade-offs, and the case for Messaging as the book's focus.

**Pages created:**

`wiki/sources/enterprise-integration-patterns.md` — New source page with overview, key claims, Ch 1 and Ch 2 notes.

`wiki/concepts/integration-styles.md` — New concept page: all four integration styles with trade-offs, eight decision criteria, decision table, cross-source comparison.

`wiki/authors/gregor-hohpe.md` — New author page.

`wiki/authors/bobby-woolf.md` — New author page.

**Pages updated:**

`wiki/concepts/messaging.md` — Added EIP section: messaging as preferred integration style (why vs File Transfer/Shared DB/RPI); six-category pattern taxonomy overview; Canonical Data Model; updated sources frontmatter. Added EIP row to How Different Sources table.

`wiki/styles/soa-architecture.md` — Added EIP row to How Different Sources table: SOA as desirable integration scenario (service directory, discovery, negotiation, Return Address, Smart Proxy for legacy wrapping). Added perspective contrast note.

`index.md` — Added source entry (in progress, ch. 1–2); new concepts/integration-styles entry; updated messaging entry; added two author entries.

12 chapters remain.

## [2026-05-15] ingest | Enterprise Integration Patterns — Batch 2 (Ch 3–4)

Chapters 3 (Messaging Systems) and 4 (Messaging Channels) from Hohpe & Woolf.

**Chapter 3 — Messaging Systems:** Message Channel (logical address, fixed at deployment except reply channels); Message (header + body, marshal/unmarshal across processes, JMS type system); Pipes and Filters (composition pattern: testability, pipeline concurrency, parallel processing with stateless filters via Competing Consumers, constraint on stateful filters); Message Router (content-based, context-based, stateless/stateful, dynamic via Control Bus; does NOT modify message body; excessive routers hurt observability → use Message History); Message Translator (four translation layers: data structure, data type, data representation, transport; GoF Adapter pattern for messaging; specialisations: Envelope Wrapper, Content Enricher, Content Filter, Claim Check, Normalizer, Canonical Data Model); Message Endpoint (bridge between application and messaging system; foundational to Channel Adapter).

**Chapter 4 — Messaging Channels:** Point-to-Point Channel (exactly one receiver; Competing Consumers for load balancing; JMS Queue); Publish-Subscribe Channel (copy to all subscribers; Observer pattern; durable vs non-durable; eavesdropping risk); Datatype Channel (one type per channel; QoS Channel variant; Content-Based Router for demux, Selective Consumer for mux); Invalid Message Channel vs Dead Letter Channel distinction (receiver-determined vs system-determined; messaging errors only, not application errors); Guaranteed Delivery (hop-by-hop disk persistence; send doesn't complete until stored; JMS PERSISTENT); Channel Adapter (UI, Business Logic, Database integration layers; needs Message Translator for canonical format; Metadata Adapter variant); Messaging Bridge (two messaging systems; Channel Adapter pair); Message Bus (three elements: common infrastructure + adapters + common command structure; enables SOA; ESB was its over-engineered realisation).

**Pages updated:**

`wiki/sources/enterprise-integration-patterns.md` — Added Ch 3 and Ch 4 chapter notes in full.

`wiki/concepts/messaging.md` — Added: Datatype Channel and pub-sub durable/non-durable detail to Channel Types section; Guaranteed Delivery section; Invalid Message Channel vs Dead Letter Channel distinction table; Messaging Infrastructure Patterns section (Messaging Bridge, Message Bus); Processing Patterns section (Pipes and Filters, Message Router, Message Translator).

`wiki/styles/pipeline-architecture.md` — Added EIP row to How Different Sources table; updated sources frontmatter.

`index.md` — Updated source entry (ch. 1–4 ingested); updated messaging and pipeline-architecture entries.

10 chapters remain.

## [2026-05-16] ingest | Enterprise Integration Patterns — Batch 4 (Ch 7–8)

Chapter 7 (Message Routing) and Chapter 8 (Message Transformation).

**Chapter 7 — Message Routing:** The largest chapter. Content-Based Router, Message Filter, Dynamic Router, Recipient List, Splitter (already noted in prior batch); Aggregator (stateful; three design decisions: correlation/completeness/algorithm; completeness strategies: Wait for All / Timeout / First Best / Timeout with Override / External Event; self-starting vs initialized; closed aggregate tracking); Resequencer (stateful; separate sequence numbers from message IDs; buffer management; TCP sliding window analogy; buffer overrun mitigation); Composed Message Processor (Splitter + Content-Based Router + Aggregator composite; single filter abstraction); Scatter-Gather (broadcast via Recipient List or Pub-Sub + Aggregator; harder to size completeness condition); Routing Slip (route precomputed upfront, attached to message header; each component reads next step; central control + efficiency; limitation: linear, fixed path); Process Manager (hub-and-spoke; maintains state per process instance; definition vs instance; branching/forking/joining; Correlation Identifier for instance routing; observability advantage; BPEL4WS standard; comparison table vs Routing Slip vs Pipes and Filters); Message Broker (architectural pattern, not design pattern; solves integration spaghetti; uses Canonical Data Model internally; broker hierarchy for scale).

**Chapter 8 — Message Transformation:** Envelope Wrapper (wrap for infrastructure compliance; chained wrappers = layered protocol; field promotion; SOAP/TCP-IP examples); Content Enricher (add missing data from computation/environment/external system; inherently synchronous interaction with data source; reference resolution pattern); Content Filter (remove unneeded/sensitive data; flatten hierarchies; multiple filters = static Splitter; security use case); Claim Check (store large/sensitive data by key; reduce bandwidth; three key strategies; lifecycle management; security use: block invalid/expired keys; Process Manager as natural Claim Check); Normalizer (Content-Based Router + per-format Message Translators; format detection strategies); Canonical Data Model (2N vs N×(N-1) translators; double translation overhead; scope to messaging-only data; private vs public message distinction; political/semantic value).

**Pages updated:**

`wiki/sources/enterprise-integration-patterns.md` — Added Ch 7 and Ch 8 chapter notes in full. Updated coverage to ch. 1–8.

`wiki/concepts/messaging.md` — Added: "Composed Routing Patterns (Ch 7)" section covering Aggregator, Resequencer, Composed Message Processor, Scatter-Gather, Routing Slip, Process Manager, Message Broker (architectural); "Message Transformation Patterns (Ch 8)" section covering Envelope Wrapper, Content Enricher, Content Filter, Claim Check, Normalizer, Canonical Data Model.

`index.md` — Updated source entry (ch. 1–8); updated messaging concept entry.

6 chapters remain (Ch 9–14).

## [2026-05-15] ingest | Enterprise Integration Patterns — Batch 3 (Ch 5–6)

Chapter 5 (Message Construction) and Chapter 6 (Interlude: Simple Messaging).

**Chapter 5 — Message Construction:** Command Message (GoF Command pattern → async procedure invocation; SOAP RPC-style request; P2P Channel); Document Message (data transfer without specifying receiver behavior; content over timing; usually P2P; SOAP reply); Event Message (Observer pattern announcement; timing over content; body may be empty; usually P/S; non-durable subscribers OK; expiration useful); Request-Reply (two-channel pattern; reply channel almost always P2P; synchronous block vs asynchronous callback for requestor; three scenarios: Messaging RPC, Messaging Query, Notify/Acknowledge); Return Address (reply channel in request header; JMSReplyTo, ResponseQueue; decouples replier from channel knowledge); Correlation Identifier (reply carries token matching it to request; three implementation approaches: message ID, business object ID, map; JMSCorrelationID, CorrelationId; stored in header); Message Sequence (large data chunked with three fields: sequence ID, position ID, size/end indicator; Transactional Client for atomic send/receive; incompatible with Competing Consumers; alternative: Claim Check); Message Expiration (TTL; broker routes unconsumed expired messages to Dead Letter Channel; receiver routes received-but-expired to Invalid Message Channel; JMS MessageProducer.setTimeToLive()); Format Indicator (schema evolution: Version Number vs Foreign Key vs Format Document; stored in header or body).

**Chapter 6 — Interlude: Simple Messaging:** Code walkthrough in JMS (Java) and MSMQ (.NET). No new patterns. Key conceptual contributions: (1) detailed JMS implementation of Request-Reply showing Return Address and Correlation Identifier in code; (2) Publish-Subscribe Channel as distributed Observer — advantages over RPC-based Observer (simplified Notify/attach/detach/threading/remote access; increased reliability; Durable Subscribers); push vs pull model comparison (push simpler; pull requires 3 messages and temporary channels); channel design for pub-sub (channel explosion problem; Datatype Channel vs consolidated type + Selective Consumer trade-off).

**Pages updated:**

`wiki/sources/enterprise-integration-patterns.md` — Added Ch 5 and Ch 6 chapter notes in full.

`wiki/concepts/messaging.md` — Added: Message Types section (Command/Document/Event; Document vs Event distinction); expanded Request-response section (EIP's two implementation styles; Return Address; Correlation Identifier); Publish-Subscribe as Distributed Observer section (advantages over RPC; push vs pull model; channel design/explosion strategy).

`wiki/concepts/contracts.md` — Added EIP row to How Different Sources table: Format Indicator (version number vs foreign key vs embedded schema), Canonical Data Model as contract mechanism. Updated sources frontmatter.

`index.md` — Updated source entry (ch. 1–6 ingested); updated contracts, messaging entries.

8 chapters remain.

## [2026-05-18] ingest | Patterns of Enterprise Application Architecture — Batch 10 (Ch 18, final)

Chapter 18 (Base Patterns). **PEAA fully ingested.**

**Chapter 18 — Base Patterns:** Gateway (external system wrapper; two-object form for complex wrapping; keep minimal; test seam for Service Stub); Mapper (insulating layer between two mutually unaware subsystems; prefer Gateway unless both sides must be shielded); Layer Supertype (common superclass for all objects in a layer — DomainObject, AbstractMapper); Registry (global access point with scoped implementation: process/thread/session; prefer ThreadLocal for mutable request-scoped state; avoid if possible; last resort pattern); Value Object (equality by field values; immutability mandatory to prevent aliasing bugs; persist via Embedded Value); Money (canonical Value Object: integral/fixed-decimal amounts; currency-aware arithmetic; Foemmel's Conundrum — allocate() method distributes remainder without losing pennies; avoid floating point; converter object for currency conversion); Special Case (subclass for exceptional/null cases; overrides methods with harmless defaults; chains — NullEmployee.Contract returns Contract.NULL; Null Object is a special case; use when multiple call sites share same null-handling behavior; flyweight OK); Plugin (centralized runtime configuration file maps Separated Interfaces to implementations; reflection-based factory; supports multiple deployment configurations without rebuild; solves scattered factory conditional problem); Service Stub (local/fast/in-memory replacement for problematic external services in testing; Gateway → Plugin → stub; keep stubs minimal; dynamic stubs add test-setup methods to interface; production implementation throws assertion failure on those methods; same as XP "Mock Object"); Record Set (in-memory tabular data — ADO.NET DataSet, JDBC RowSet; looks like SQL result; disconnectable = pass as DTO; increasingly supports UoW behavior with OOL; implicit vs explicit interface — prefer explicit/strongly-typed; pairs with Table Module).

**Pages updated:**

`wiki/sources/patterns-of-enterprise-application-architecture.md` — Added Chapter 18 Base Patterns catalog entries (Gateway, Mapper, Layer Supertype, Registry, Value Object, Money, Special Case, Plugin, Service Stub, Record Set). Updated frontmatter to fully ingested.

`wiki/patterns/domain-model.md` — Extended Value Object section with PEAA perspective: immutability as aliasing solution, Money as canonical example, Embedded Value for persistence, naming collision note. Added PEAA row to How Different Sources table. Updated sources frontmatter.

`CLAUDE.md` — Added `patterns-of-enterprise-application-architecture` to Book Slugs table.

`README.md` — Added PEAA to Sources ingested table.

`index.md` — Marked PEAA as fully ingested 2026-05-18.

## [2026-05-18] ingest | Release It! — Batch 1 (Ch 1–2)

**Chapter 1 — Living in Production:** Foundational thesis. "Feature complete" ≠ "production ready" — QA tests what systems should do; production tests what they should not. Architectural decisions are financial decisions: operational cost accumulates over the system lifespan; example: $50k zero-downtime pipeline investment avoids $900k in downtime cost over 5 years (18× ROI). Early decisions disproportionately shape the system (Conway's Law: team assignments are the first draft of architecture) yet are made with the least information. Pragmatic architect vs ivory-tower architect: pragmatic architect thinks about deployment dynamics, metrics, change management; ivory-tower architect aims for end-state perfection with irreversible mandates. Core claim: bugs cannot be eliminated; systems must be designed to survive them.

**Chapter 2 — Case Study: The Exception That Grounded an Airline:** Anatomy of a cascade failure. Root cause: Oracle JDBC `Statement.close()` throws `SQLException` after a database failover (driver attempts network I/O to release server resources). The `finally` block's exception from `stmt.close()` short-circuits before `conn.close()`, so the connection is never returned to the pool. After 40 such calls, all pool slots are exhausted; `getConnection()` blocks forever. Cascade: CF (Central Facilities) application servers fully blocked → downstream kiosks + IVR exhaust their own thread pools → airline cannot check in passengers → national news coverage → CEO financial penalty. Key lessons: (1) validate connections at checkout/heartbeat; (2) timeout on `getConnection()`; (3) exceptions in `finally` cleanup blocks must be handled explicitly; (4) deep health checks required — status URL probed the HTTP thread pool, not the EJB pool that was actually hung; (5) failure in one system propagates without isolation patterns.

**Pages created:**

`wiki/sources/release-it.md` — New source page with overview, key claims, chapter notes for Ch 1–2.

`wiki/authors/michael-nygard.md` — New author page.

**Pages updated:**

`wiki/concepts/availability.md` — Added "Design for Production" section: financial ROI of availability investment (Nygard Ch. 1), "design for QA" vs "design for production" distinction, connection to airline case study. Added release-it to sources.

`wiki/concepts/common-failure-causes.md` — Added "Airline Cascade" section as a concrete multi-failure-cause incident (configuration change → stale connection pool → incorrect error handling in finally block → resource pool exhaustion → cascade). Added release-it to sources.

`index.md` — Added release-it source entry (ch. 1–2 in progress), michael-nygard author entry, updated availability and common-failure-causes entries.

15 chapters remain in Release It!.

## [2026-05-18] ingest | Release It! — Batch 2 (Ch 3–4)

**Chapter 3 — Stabilize Your System:** Definitions: transaction (abstract unit of work), system (complete interdependent hardware+software), impulse (rapid shock), stress (sustained force), strain (effect of stress on distant components), longevity (running between deployments without degrading). Longevity bugs (memory leaks, data growth) are invisible in development (short cycles) and QA — require dedicated longevity tests (low-rate continuous load for days/weeks). Key vocabulary: fault (incorrect internal state) → error (visible incorrect behavior) → failure (system doesn't respond). Tight coupling makes events non-independent — failure increases probability of subsequent failures. "Let it crash" vs fault-tolerant debate: both camps agree faults are unavoidable and must be stopped from becoming failures.

**Chapter 4 — Stability Antipatterns:** Ten antipatterns that create, accelerate, or multiply cracks: (1) **Integration Points** — every integration point will fail; use Circuit Breaker, Timeouts, test harnesses; (2) **Chain Reactions** — load-related defect in homogeneous layer; one failure increases surviving nodes' load; accelerating collapse; Bulkheads partition into independent reactions; (3) **Cascading Failures** — failure jumps gap between layers via blocked threads and resource pool exhaustion; Circuit Breaker + Timeouts; (4) **Blocked Threads** — proximate cause of most failures; not a crash but a hang; happens near connection pools, caches, integration points; defend with Timeouts, proven primitives, immutable domain objects, external synthetic monitors; (5) **Self-Denial Attacks** — internal marketing/ops causing flash mobs; CDN bypass via deep links; waves of emails, static landing pages, no embedded session IDs; (6) **Scaling Effects** — P2P communication scales O(n^2); shared resources become bottlenecks; must be designed out; (7) **Unbalanced Capacities** — front end can overwhelm back end (3000:75 threads); Circuit Breaker + Handshaking + Backpressure + Bulkheads; (8) **Dogpile** — synchronized restart/cron/cache-expiry demand bursts; random jitter + increasing backoff; Force Multiplier: automation acting on incorrect beliefs amplifies failures (Reddit ZooKeeper incident); safeguards: hysteresis, rate limiting, confirmation on large deltas; (9) **Slow Responses** — worse than errors; cascades upward; causes user reload storms; self-monitoring + Fail Fast; (10) **Unbounded Result Sets** — memory exhaustion from unexpectedly large queries; always paginate, use LIMIT, test with production data; Black Monday example (10M rows in a table sized for 1K).

**Pages updated:**

`wiki/sources/release-it.md` — Added Chapter 3 and Chapter 4 notes covering all ten stability antipatterns and their mitigations.

`wiki/patterns/circuit-breaker.md` — Added "Antipatterns Circuit Breaker Addresses" section (Integration Points, Cascading Failures, Slow Responses, Unbalanced Capacities). Added Contradiction blockquote vs understanding-distributed-systems. Added release-it to sources.

`wiki/patterns/bulkhead.md` — Added "Chain Reactions and Why Bulkheads Matter" section (Chain Reaction antipattern, accelerating collapse pattern, Unbalanced Capacities). Added release-it to sources.

`index.md` — Updated release-it source entry to ch. 1–4.

13 chapters remain in Release It!.

## [2026-05-19] ingest | Release It! — Batch 3 (Ch 5–6)

**Chapter 5 — Stability Patterns:** Twelve crackstoppers — (1) **Timeouts** — every wait has a limit; applies to integration calls, pool checkout, mutex; isolates faults; combine with Circuit Breaker; derive from P99.9 latency; (2) **Circuit Breaker** — track fault density via leaky bucket (not count); state changes MUST be logged for Ops visibility; scope = per process, NOT shared; fallback strategy is a business decision; (3) **Bulkheads** — physical isolation; reserve admin/monitoring thread pool; cloud AZs as built-in bulkhead; CPU binding; (4) **Steady State** — avoid human fiddling; pair every accumulating mechanism with a recycler; purge data with app logic; rotate/ship logs; bound caches with LRU or TTL; (5) **Fail Fast** — check resource availability before starting work ("mise en place"); distinguish system failures (503) from application failures (4xx); applies to incoming requests; Timeouts apply to outgoing; (6) **Let It Crash** — cleanest state = post-startup; requires small granularity (actor/microservice, not JavaEE app server), fast replacement, supervision trees, managed reintegration; (7) **Handshaking** — server signals readiness; HTTP 503 to load balancer; underused; Circuit Breaker is stopgap when unavailable; (8) **Test Harnesses** — separate server simulating out-of-spec failures; port-based behavior modes; foundation for chaos engineering; (9) **Decoupling Middleware** — synchronous amplifies cascading failures; async decouples in space and time; architectural decision with high switching cost; (10) **Shed Load** — refuse new requests at service boundary when overloaded; 503 to load balancer; (11) **Create Back Pressure** — bounded queues as flow control within system boundary; unbounded queues mask backlog (Little's Law); (12) **Governor** — rate-limit automation actions; stateful, time-aware, asymmetric; U-shaped response curve; creates window for human intervention.

**Chapter 6 — Case Study: Phenomenal Cosmic Powers, Itty-Bitty Living Space:** Black Friday incident. Three-tier Unbalanced Capacities cascade (3,000 : 450 : 25 threads) triggered by marketing Self-Denial Attack (free-home-delivery newspaper insert). Resource pool exhaustion without timeout (checkoutBlockTime unset) caused all front-end threads to block. Alert fatigue desensitized scheduling team to real CPU signal. Recovery via accidental Bulkhead: a separate connection pool for scheduling (Conway's Law artifact) became the throttle. Dynamic reconfiguration via admin scripts took 90 seconds vs 6+ hours for full restart — validates Recovery-Oriented Computing principle (target component restart, not server restart).

**Pages updated:**

`wiki/sources/release-it.md` — Added Chapter 5 (all 12 patterns) and Chapter 6 (Black Friday case study) notes. Updated related pages.

`wiki/patterns/circuit-breaker.md` — Expanded Implementation Notes: leaky bucket for fault density, per-process scope (not shared), ops visibility requirement for state transitions, business-owned fallback strategies.

`wiki/patterns/bulkhead.md` — Added "Capacity Reservation" section: reserve thread pool for critical/admin callers; cloud AZs as infrastructure bulkhead; CPU binding.

`wiki/concepts/rate-limiting.md` — Added "Back Pressure" and "Governor" sections from Nygard ch. 5; added release-it to sources.

`wiki/concepts/messaging.md` — Added "Decoupling Middleware and Stability" section: sync/async choice as a stability decision; propagation of back pressure via synchronous calls; async decoupling in space and time; added release-it to sources.

`wiki/concepts/common-failure-causes.md` — Added "Black Friday Cascade" case study section (ch. 6): Unbalanced Capacities, Self-Denial Attack, alert fatigue, accidental Bulkhead as recovery lever.

`index.md` — Updated release-it entry to ch. 1–6; updated common-failure-causes entry.

11 chapters remain in Release It!.

## [2026-05-19] ingest | Release It! — Batch 4 (Ch 7–8)

**Chapter 7 — Foundations:** Infrastructure layer covering networking, physical hosts, VMs, and containers. Key points: (1) Multihomed servers — production/backup/admin on separate NICs; applications must bind to specific interfaces; (2) Physical hosts: commodity expendable hardware, horizontal scale, specialized exceptions (GPU, high-RAM); (3) VMs: performance unpredictable from oversubscription; VM clocks not monotonic (suspension, migration); use NTP not OS clock; (4) Containers: short-lived identities, no local storage, networking the hard problem (VLAN/VXLAN/overlay); orchestration (Kubernetes, Mesos); no credentials or hostnames in image; target 1-second startup; (5) 12-Factor App (Heroku): checklist for cloud-native deployable apps — config in environment, stateless processes, disposability, dev/prod parity, logs as event streams; (6) Cloud VMs: ephemeral identity, worse availability than physical (more moving parts), must volunteer for work via competing consumers / autoscaling.

**Chapter 8 — Processes on Machines:** Instance-level design for production. (1) Terminology: Service/Instance/Executable/Process/Installation/Deployment — precise vocab matters in operations; (2) Supply chain security: CI-only production builds, private dependency repo with verified digital signatures, build-system plugins as attack vectors; (3) Immutable infrastructure: mutable config management produces "layers of stucco" from history of changes; always start from known base image, never patch in place; (4) Configuration: per-env config outside deployment dir; never commit credentials to VCS; inject at startup or config service (ZK/etcd — high operational cost, only at scale); name properties by function not type; (5) Transparency: must be designed in; system-level > per-instance visibility; monitoring as exoskeleton not woven in; (6) Logging: ERROR = requires operator action; no debug in production; voodoo operations from ambiguous log messages (weekly DB failovers triggered by encryption-rotation debug message); trace IDs in every message; (7) Health checks: expose host IP, runtime version, app version, accepting-work status, connection pool / cache / circuit breaker status; used for load-balancer go-live transition.

**Pages updated:**

`wiki/sources/release-it.md` — Added Chapter 7 and Chapter 8 notes.

`wiki/concepts/observability.md` — Added "Transparency (Nygard's Framing)" section (transparency as broader than observability; system-level vs per-instance; monitoring as exoskeleton), "Logging Best Practices (Nygard)" section (log level discipline; voodoo operations; trace IDs), "Health Check Design" section (expected contents; go-live transition; link to Handshaking pattern). Added release-it to sources.

`wiki/concepts/deployment-pipelines.md` — Added "Immutable and Disposable Infrastructure" section (mutable CM produces stucco; always from base image; supply chain security). Added release-it to sources and How Different Sources table.

`index.md` — Updated release-it entry to ch. 1–8.

9 chapters remain in Release It!.

## [2026-05-19] ingest | Release It! — Batch 5 (Ch 9–10)

**Chapter 9 — Interconnect:** Load balancing, DNS, demand control, routing, and service discovery. Key points: (1) DNS: use for stable environments; avoid round-robin (no health awareness, Java caches first address); GSLB for geographic routing via health-aware DNS; use logical service names not physical hostnames; (2) Load balancing: software (reverse proxy, layer 7) vs hardware (layers 4–7, much higher throughput); VIPs map to pools; configure health checks, stickiness, content-based routing; (3) Demand control: "every failing system starts with a queue backing up somewhere"; resources form queues (listen queue, thread queue, I/O buffers); going nonlinear = positive feedback between load and capacity consumption; shed load at the edge with 503 before resources are consumed; keep listen queues short; (4) Service discovery: Consul (AP) vs ZooKeeper/etcd (CP); don't roll your own; clients must cache results; (5) Migratory virtual IPs: ARP-based failover; callers use DNS name not physical hostname; must handle IOExceptions and retry.

**Chapter 10 — Control Plane:** (1) Mechanical advantage: AWS S3 outage (Feb 28, 2017) — a mistyped command removed too many servers because the tool had no minimum capacity safeguard; not "human error" but system failure; automation goes wrong very quickly; (2) System-wide transparency: two questions: are users receiving a good experience? is the system creating economic value? "is everything running?" is irrelevant; (3) Economic value framing: top line (revenue — conversion rates, queue depth, exceptions in revenue flows); bottom line (infrastructure + operational labor costs); (4) What to expose: traffic, business transactions, users, resource pool health, DB connection health, data consumption, integration point health (circuit breaker state, timeouts, response times, error counts by type), cache health; (5) Configuration services (ZooKeeper/etcd): not elastic; instances must start and operate without config service; partitioned node must not shut down the world; replicate geographically; (6) Command and control: reset circuit breakers, adjust pool sizes, disable integrations, reload config, start/stop load, feature toggles; don't build cache-flush or data-delete controls into production; CLI > GUI for operations; command queue for fleet-scale commands (add jitter to prevent dogpile); (7) Development is production: treat dev/CI/QA with production SLAs.

**Pages updated:**

`wiki/sources/release-it.md` — Added Chapter 9 (Interconnect) and Chapter 10 (Control Plane) notes.

`wiki/concepts/monitoring.md` — Added "Economic Value Framing (Nygard)" section: two fundamental questions; top/bottom line monitoring; full taxonomy of what to expose (traffic, business transactions, resource pool health, integration point health, cache health, etc.). Added release-it to sources.

`wiki/concepts/manageability.md` — Added "Command and Control (Nygard)" section: specific checklist of controls to expose; what NOT to build (cache flush, delete-all); admin API + CLI over GUI design; command queue with jitter for fleet-scale operations. Added release-it to sources.

`index.md` — Updated release-it entry to ch. 1–10.

7 chapters remain in Release It!.

## [2026-05-19] ingest | Release It! — Batch 6 (Ch 11–12)

**Chapter 11 — Security:** OWASP Top 10 (2017) with architectural emphasis: (1) Injection — parameterized queries, disable XXE in XML parsers; (2) Broken Auth/Session — PRNG session IDs, cookies not URLs, fresh ID on auth, hash+salt passwords; (3) XSS — escape all output, don't build structured data by string concatenation; (4) Broken Access Control — no sequential DB IDs in URLs; authorize on every request; identical 404 for "doesn't exist" and "not authorized" (don't leak resource existence); (5) Security Misconfiguration — default credentials (MongoDB ransomware incident), servers listening too broadly, sample apps in production; (6) Sensitive Data Exposure — don't store what you don't need; "pie crust" defense antipattern (authenticate at perimeter, trust internally); TLS everywhere including internal; HSTS; (7) Insufficient Attack Protection — log bad requests; API gateway rate limiting; layer-7 firewalls; (8) CSRF — CSRF tokens, SameSite cookie attribute; (9) Components with Known Vulnerabilities — Equifax breach (Struts 2 CVE); automate CVE checking in build; treat container images as perishable; (10) Underprotected APIs — authorize on way out AND way in; fuzz testing parsers. Principle of Least Privilege: no root processes; per-app OS users; containers as isolation. Secret management: separate files; read-only permissions; KMS/Vault; no credentials in VCS or process memory. Security is an ongoing cross-cutting architectural concern.

**Chapter 12 — Case Study: Waiting for Godot:** A failed deployment case study motivating automated pipelines. 40+ people on a 24-hour conference bridge, $100K per deployment event, 4-6 events/year. Deployment failed UAT because QA data didn't match production (third-party JavaScript widget incompatible with new page structure). Contrast: Etsy's "deployinator" (one-button, routine). Motivates chapters 13-14 on deployability. Reinforces ch. 1 ROI argument: deployment armies have a calculable cost that dwarfs the investment in better tooling.

**Pages updated:**

`wiki/sources/release-it.md` — Added Chapter 11 (Security) and Chapter 12 (Waiting for Godot case study) notes.

`wiki/concepts/threat-modeling.md` — Added "OWASP Top 10 for Web Applications (Nygard)" section: resource existence leakage via 404/403, pie crust antipattern (→ zero-trust), Equifax CVE as component vulnerability example, session fixation prevention. Added release-it to sources.

`index.md` — Updated release-it entry to ch. 1–12.

5 chapters remain in Release It!.

## [2026-05-19] ingest | Foundations of Scalable Systems — Batch 1 (Ch 1–2)

**Chapter 1 — Introduction to Scalable Systems:** Scalability defined as the ability to handle growing load (throughput, data volume, analytics, stable response time). Two universal strategies: replication (add capacity) and optimization (use existing capacity more efficiently). Scale up vs scale out distinction. Hyperscale: exponential capability growth with linear cost growth — Netflix elastic scale-down as canonical example. Quality attribute trade-offs: performance (in-memory optimization trades per-request speed for system capacity), availability (replication aids both, but replicated state → consistency cost), security (TLS/auth overhead reduces throughput; CIA triad availability dimension = DDoS risk), manageability (more components = more monitoring surface; offset only through automation/DevOps). Key caution: introducing distributed technology before clear requirement creates development inertia.

**Chapter 2 — Distributed Systems Architectures: An Introduction:** Architecture evolution path: monolith → scale up → scale out (stateless replicas + load balancer + external session store) → caching layer → distributed database → multiple tiers → async queueing. Stateless services are the prerequisite for effective scale-out. Distributed caching (Redis/memcached): cache-aside pattern, 80%+ read hit rate as the scalability threshold. Distributed databases: SQL (sharded/NewSQL) and NoSQL categories. BFF pattern: separate services for web vs mobile clients. Async queueing for responsiveness: producer writes to queue (fast); consumer writes to DB — decouples perceived response time from persistence cost. Amdahl's Law: 50% serial code → max benefit from ~8 cores; 5% serial → ~2,048 cores; parallel code is a scalability prerequisite, not an optimisation.

**Pages created:**

`wiki/sources/foundations-of-scalable-systems.md` — Source page (ch. 1–2 coverage).
`wiki/concepts/scalability.md` — New concept page: definition, replication vs optimization strategies, scale up/out, stateless requirement, Amdahl's Law, hyperscale, trade-off table, architecture evolution sequence, multi-source comparison table.
`wiki/authors/ian-gorton.md` — Author page.

**Pages updated:**

`wiki/concepts/caching.md` — Added 80% read hit rate as scalability threshold (Gorton ch. 2); added foundations-of-scalable-systems to sources.
`wiki/concepts/load-balancing.md` — Added Gorton's framing: load balancer as stateless scale-out enabler; stateless services as prerequisite; added foundations-of-scalable-systems to sources.
`index.md` — Added foundations-of-scalable-systems entry (in progress: ch. 1–2); added scalability concept; updated caching, load-balancing, and authors entries.

14 chapters remain in Foundations of Scalable Systems.

## [2026-05-19] ingest | Foundations of Scalable Systems — Batch 2 (Ch 3–4)

**Chapter 3 — Distributed Systems Essentials:** Network hardware overview: LAN (10-100 Gbps, sub-ms), WAN (fiber, 70+ Tbps, latency = distance/light speed: NY→Sydney 80ms). IP protocol suite (4 layers: data link, internet/IP, transport/TCP+UDP, application). TCP: connection-oriented, reliable, sequence numbers, cumulative ACKs, flow control. UDP: connectionless, unreliable, fast. RPC/RMI: progression from DCE/CORBA to gRPC; marshalling/unmarshalling; modern systems prefer HTTP+JSON. Partial failures: six failure scenarios — only DNS failure and fast error are detectable; server crash, slow server, and lost response all look identical to client (timeout). Delivery semantics spectrum: at-most-once (UDP) → at-least-once (TCP) → exactly-once (application-level idempotency + transactional atomicity). Two Generals' Problem as intuition for FLP Impossibility: no bounded-time consensus on async network with crash faults. Byzantine faults excluded from typical enterprise systems. Time: NTP synchronizes to ~ms on LAN; time-of-day clock resettable by NTP, can jump backward; monotonic clock only forward but no shared epoch; don't compare timestamps across nodes.

**Chapter 4 — An Overview of Concurrent Systems:** Concurrency primer with architectural relevance. Why concurrency: I/O wait wastes CPU cycles; multi-core needs parallelism. Concurrency models: Java shared-state+locks, Go CSP/channels, Erlang actors (no shared state), Node.js event loop. Race conditions: non-atomic operations interleave; fix with critical sections (synchronized). Amdahl's Law connection: synchronized blocks = serial fraction; minimize them. Deadlocks: circular waiting; fix via global resource acquisition ordering (dining philosophers). Thread pools: bound memory/CPU; tuning pool size is a scalability lever. Producer-consumer: BlockingQueue is the in-process equivalent of async message queues; blocked threads consume no CPU. Thread-safe collections: fine-grained locking (ConcurrentHashMap shards) >> coarse-grained synchronized wrappers for throughput.

**Pages updated:**

`wiki/sources/foundations-of-scalable-systems.md` — Added Chapter 3 and Chapter 4 notes.
`wiki/concepts/idempotency.md` — Added delivery semantics spectrum table (at-most-once/at-least-once/exactly-once) and transactional atomicity requirement; added foundations-of-scalable-systems to sources.
`wiki/concepts/consensus-algorithms.md` — Added Two Generals' Problem framing as intuition for FLP Impossibility.
`wiki/concepts/system-models.md` — Added Gorton's 6 partial failure scenario taxonomy table; added foundations-of-scalable-systems to sources.
`wiki/concepts/scalability.md` — Added critical sections as Amdahl serial fraction; thread pool tuning as scalability lever.

12 chapters remain in Foundations of Scalable Systems.

## [2026-05-19] ingest | Foundations of Scalable Systems — Batch 3 (Ch 5–6)

**Chapter 5 — Application Services:** HTTP CRUD pattern; OpenAPI/Swagger. Chatty API antipattern (fine-grained getters as HTTP ops = multiple round trips). HTTP compression (gzip, 50%+ reduction). Stateful vs stateless services: stateful services require sticky sessions → load imbalance + failure complexity; stateless services store all session state externally (Redis/memcached). Application server anatomy (Tomcat): listener threads → socket backlog → HTTP connector → thread pool (min 25, max 200) → database connection pool; systems degrade before 100% utilization. Horizontal scaling: stateless + LB = capacity proportional to replicas; SPoF eliminated. L4 vs L7 load balancer empirical comparison (~20% L4 advantage at moderate load). Sticky sessions create load imbalance. Elasticity: AWS Auto Scaling groups, schedule-based + metric-based, warmup periods.

**Chapter 6 — Distributed Caching:** Cache-aside pattern: check cache → hit/miss → on miss populate from DB + set TTL. Cache pattern taxonomy: cache-aside vs read-through, write-through, write-behind. Cache-aside dominant in massively scalable systems (resilient to cache failure; simpler to scale). Web caching layers: browser → proxy → CDN. HTTP caching directives: Cache-Control (no-store, no-cache, private, public, max-age), Expires, Last-Modified, ETag/If-None-Match revalidation (304 Not Modified). Akamai: 2000+ locations, 30% of internet traffic. Design principle: maximize hit rate; high read:write ratio = ideal cache candidate; monitor hit/miss rates in production.

**Pages updated:**

`wiki/sources/foundations-of-scalable-systems.md` — Added Chapter 5 and Chapter 6 notes.
`wiki/concepts/caching.md` — Added caching pattern taxonomy table (cache-aside vs read-through, write-through, write-behind) with resilience comparison; explained why cache-aside dominates at scale.
`wiki/concepts/api-design.md` — Added chatty API antipattern and payload compression notes (Gorton ch. 5).
`wiki/concepts/load-balancing.md` — Added Elasticity (autoscaling) section: scale-out/in triggers, schedule vs metric, warmup period, AWS Auto Scaling Groups.

10 chapters remain in Foundations of Scalable Systems.

## [2026-05-18] lint | Full wiki health check

Ran automated lint sweep across all 160 wiki pages. Findings and fixes:

**Fixed:**
- `index.md` — removed duplicate `[[authors/john-ousterhout]]` entry (lines 206 and 210 were both present with slightly different descriptions); merged into single entry including Raft authorship.
- `wiki/databases.md` — deleted empty 0-byte orphan stub file; never linked, never developed.
- Stale `updated:` frontmatter dates corrected on 8 pages: `concepts/consensus-algorithms.md`, `concepts/consistency-models.md`, `concepts/fitness-functions.md`, `concepts/replication.md`, `databases/data-models.md`, `databases/transactions.md`, `patterns/repository.md`, `reference/technology-glossary.md`.
- `overview.md` — added `accelerate` and `a-philosophy-of-software-design` to frontmatter `sources:` list; updated source count from 17 to 19; added two new narrative sections ("Complexity Is the Enemy of Maintainability" and "Delivery Performance Has Four Leading Indicators"); added both books to the sources table; added Ousterhout, Forsgren, Humble, Kim to Key Authors section.

**Clean (no action needed):**
- All wikilinks resolve (no broken links, excluding `[[overview]]` which is an intentional root-level reference).
- No missing concept or pattern pages — all 71 referenced concepts and 14 patterns exist.
- All 19 source pages have author attribution and Related Pages sections.
- No orphan concept/pattern/style pages.

## [2026-05-18] lint | Added inline citations to 11 pages

Addressed the remaining lint finding: 11 pages had source declarations in frontmatter but no `(→ [[sources/...]])` inline citations in their body text.

**Pages updated:**
- `concepts/broadcast-protocols.md` — 2 inline citations added (→ understanding-distributed-systems)
- `concepts/cdn.md` — 2 inline citations added (→ understanding-distributed-systems)
- `concepts/risk-storming.md` — 2 inline citations added (→ fundamentals-of-software-architecture)
- `patterns/branch-by-abstraction.md` — 2 inline citations added (→ monolith-to-microservices)
- `patterns/parallel-run.md` — 3 inline citations added (→ monolith-to-microservices)
- `patterns/strangler-fig.md` — 2 inline citations added (→ monolith-to-microservices)
- `styles/layered-architecture.md` — 3 inline citations added (→ fundamentals-of-software-architecture, software-architecture-patterns)
- `styles/microkernel-architecture.md` — 3 inline citations added (→ fundamentals-of-software-architecture)
- `styles/pipeline-architecture.md` — 3 inline citations added (→ fundamentals-of-software-architecture)
- `styles/service-based-architecture.md` — 3 inline citations added (→ fundamentals-of-software-architecture)
- `styles/soa-architecture.md` — 3 inline citations added (→ fundamentals-of-software-architecture)

## [2026-05-18] schema-update | Restructured wiki: extracted distributed/ and operations/ directories

Reorganised the wiki to address `concepts/` growing to 71 pages. Created two new top-level directories:

- `wiki/distributed/` — 24 pages moved from `concepts/`: broadcast-protocols, caching, cap-theorem, cdn, consensus-algorithms, consistency-models, control-plane-data-plane, crdts, distributed-transactions, dns, failure-detection, fallacies-of-distributed-computing, http, idempotency, leader-election, load-balancing, logical-clocks, partitioning, rate-limiting, replication, scalability, serverless, system-models, tls.
- `wiki/operations/` — 6 pages moved from `concepts/`: availability, chaos-engineering, common-failure-causes, manageability, monitoring, observability.

All wikilinks updated via sed across the entire wiki. `CLAUDE.md` updated with new directory layout, guidance section, and placement rules. `index.md` rewritten with: new `## Architecture Styles` section (moved ahead of concepts), `## Distributed Systems` and `## Operations` sections, and `## Concepts` reorganised into four sub-groups (DDD / Domain Design, Architecture Practice, API & Integration, Data). `concepts/` reduced from 71 to 41 pages.

## [2026-05-25] schema-update | Correction: all books fully ingested

Correction to earlier log entry which stated "10 chapters remain in Foundations of Scalable Systems." Verified 2026-05-25: `_incoming/processing/` is empty. All 19 books in the wiki are fully ingested with no outstanding chapters.

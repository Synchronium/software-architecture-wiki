---
title: "Accelerate: The Science of Lean Software and DevOps"
type: source
tags: [devops, delivery-performance, metrics, culture, lean, continuous-delivery, organizational-performance]
sources: [accelerate]
created: 2026-05-18
updated: 2026-05-18
---

# Accelerate: The Science of Lean Software and DevOps

**Authors:** [[authors/nicole-forsgren]], [[authors/jez-humble]], [[authors/gene-kim]]
**Published:** 2018
**Slug:** `accelerate`

## Overview

*Accelerate* presents four years of rigorous academic research (2014–2017) into what makes technology organisations high-performing. Using cross-sectional surveys of over 23,000 respondents across 2,000+ organisations worldwide — combining Forsgren's PhD-level psychometric and statistical methods with Humble and Kim's practical DevOps expertise — the book establishes causal (not merely correlational) links between specific technical, cultural, and managerial capabilities and measurable business outcomes.

The central finding: **software delivery performance directly drives organisational performance** — profitability, productivity, market share, and (for non-commercial organisations) efficiency and mission achievement. High performers consistently outperform low performers on speed *and* stability simultaneously, refuting the widely held belief that you must choose between the two.

The book is structured in three parts: Part I (What We Found) covers 16 chapters of findings across technical practices, culture, management, architecture, security, and product development; Part II (The Research) explains the scientific methods; Part III (Transformation) presents a leadership case study.

## Key Claims

- High performers deploy 46× more frequently, have 440× faster lead time, restore service 170× faster, and have a 5× lower change failure rate than low performers (2017 data) (→ ch. 1)
- Speed and stability are not in tension — high performers are better on *all four* metrics simultaneously (→ ch. 2)
- Software delivery performance causally predicts organisational performance (→ ch. 2)
- Change Approval Boards (CABs) are negatively correlated with both tempo and stability (→ ch. 2)
- Westrum generative culture predicts software delivery performance, which in turn predicts organisational performance (→ ch. 3)
- Continuous delivery (CD) predicts both better delivery performance and better team culture (→ ch. 4)
- Loosely-coupled, well-encapsulated architectures enable teams to deliver independently at speed (→ ch. 5)
- Integrating security into the delivery lifecycle (DevSecOps) improves delivery performance and does not slow it down (→ ch. 6)
- Lean management practices — visual management, WIP limits, lightweight change approval — improve culture and delivery performance (→ ch. 7)
- Lean product management (working in small batches, teams empowered to experiment) predicts delivery performance (→ ch. 8)
- Deployment pain and rework are inversely correlated with delivery performance — less pain for high performers (→ ch. 9)
- Employee Net Promoter Score (eNPS) is strongly predicted by delivery performance, Westrum culture, and Lean management (→ ch. 10)
- Transformational leadership is the strongest predictor of adoption of DevOps practices (→ ch. 11)

## Chapter Notes

### Preface — The Research

Four-year research programme (2014–2017). 23,000+ survey responses; 2,000+ unique organisations from startups to large enterprises, across regulated and unregulated industries, greenfield and legacy codebases. Uses cross-sectional study design (same methods as healthcare and workplace research). Survey data analysed with academic-grade statistical methods, published in peer-reviewed journals. Authors combine Forsgren's academic rigour (PhD, MIS) with Humble's CI/CD expertise (coauthor of *Continuous Delivery*) and Kim's DevOps research (founder of Tripwire, coauthor of *The Phoenix Project*).

Research questions evolved year by year:
- 2014: Can software delivery be measured? Does it impact organisations?
- 2015: Do technical practices and Lean management drive delivery? Do they affect burnout?
- 2016: Does integrating security help or hurt? Does trunk-based development help?
- 2017: How does architecture affect delivery? What is the role of transformational leadership?

### Chapter 1 — Accelerate

Core argument: software is the key differentiator for organisations in every industry. DevOps emerged from organisations facing the problem of building secure, resilient, rapidly evolving distributed systems at scale. The book's programme identified 24 key capabilities across five categories that drive improvement in software delivery performance.

**Capabilities vs. maturity models:** maturity models are the wrong tool. Four reasons:
1. They encourage "arriving" at a mature state and declaring done — incompatible with continuous improvement
2. They are lock-step/linear — same level looks the same for all teams, ignoring context
3. They focus on outputs (tooling installed) not outcomes (delivery performance)
4. They define static levels — don't adapt to the changing business and technology landscape

**2017 performance gap** (high vs. low performers):
- 46× more frequent code deployments
- 440× faster lead time from commit to deploy
- 170× faster mean time to recover from downtime
- 5× lower change failure rate

Things that do *not* predict performance: application age/technology (mainframe vs. greenfield), who performs deployments (dev or ops), whether a CAB is implemented.

### Chapter 2 — Measuring Performance

**Flaws in prior metrics:**
- *Lines of code*: rewards bloat; wrong direction (prefer 10-line solution to 1,000-line solution)
- *Velocity*: relative, team-dependent; when used as a productivity metric, teams game it (inflate estimates, avoid cross-team collaboration)
- *Utilisation*: good up to a point; beyond it, no slack for unplanned work; queue theory — as utilisation → 100%, lead time → ∞

**The four metrics:** delivery lead time, deployment frequency, time to restore service, change failure rate. Selected because they: (a) focus on global/system-level outcomes (not local/individual), (b) measure outcomes not outputs, and (c) require collaboration across functions to improve.

Lead time = the *delivery* portion of the product value stream (commit to production), not the "fuzzy front end" (design/validation). Deployment frequency used as a proxy for batch size (Lean principle: reduce batch size to reduce cycle time, variability, risk).

**Cluster analysis** across all four years found three distinct performance clusters: high, medium, low. All four metrics were good classifiers — groups were statistically significantly different across all four dimensions.

**Key finding: no tradeoff.** High performers are better on all four metrics simultaneously. Speed and stability are positively correlated, not in tension. This directly refutes the bimodal IT hypothesis.

**Organisational impact:** high performers 2× as likely to exceed profitability, productivity, and market share goals. In 2017 (non-commercial measures added): also 2× as likely to exceed objectives in quantity, operating efficiency, customer satisfaction, quality, and mission achievement.

**CABs:** change approval boards are negatively correlated with both tempo and stability.

**Culture warning (Deming):** "Whenever there is fear, you get the wrong numbers." In pathological organisations, measurement becomes control and people hide bad data. Must develop culture before deploying measurement. (→ ch. 3)

### Chapters 13–15 — Research Methods

**Ch. 13 (Psychometrics):** Latent constructs measure things that can't be observed directly (culture, job satisfaction) through multiple manifest variables (survey items). Benefits: forces careful definition, provides multiple views into data, protects against rogue measures. Statistical tests before any analysis: discriminant validity (unrelated items stay unrelated), convergent validity (related items cluster together), internal consistency (items interpreted similarly by respondents). Key example: "failure notification" initially tested as one construct; on larger dataset, split into two — customer/NOC notifications vs. proactive system monitoring. The latter (proactive failure notification) is independently predictive of delivery performance. All measures — even system data — are proxies.

**Ch. 14 (Why Use Surveys):** Survey advantages over system data: speed (weeks vs. months), breadth (cross-org boundaries), ability to measure latent constructs (culture, values, satisfaction) not visible in telemetry, completeness of the delivery stack. Trust is established through psychometric validation, not survey design alone.

**Ch. 15 (Data for the Project):** Snowball sampling methodology. 23,000+ responses collected annually via mailing lists and social media, targeting software development and delivery professionals. Survey design evolved year over year: 2014 (foundation), 2015 (revalidation + Lean), 2016 (trunk-based dev, security, product management), 2017 (architecture, leadership, non-commercial orgs).

### Chapter 16 — High-Performance Leadership and Management (Bell & Bell)

ING Netherlands case study — a large bank that pioneered "tribes and squads" structure (predating the Spotify model naming, independently arrived at). Key design: squads (cross-functional, product-owner-led, Two Pizza Rule), tribes (lines of business), chapters (discipline-based learning communities), centers of expertise.

**Obeya rooms** (visual management): strategic objectives, performance monitoring, portfolio roadmap, leadership actions — visualized at tribe and squad level; red/green coding makes problems instantly visible. All squad members can see status; leadership can visit the squad room and understand context immediately.

**Catchball communication rhythm:** daily stand-ups (15 min, WIP/obstacles/done); problems escalated vertically and resolved laterally with outcomes fed back; creates continuous PDCA loop at all levels.

**Key cultural lessons from ING:**
- "You have to understand why, not just copy the behaviours."
- "When we were not able to learn as management, we were not able to help the teams to learn."
- "When you change the way you work, you change the routines, you create a different culture." (Validates ch.3: behaviour precedes belief)
- "You can't implement culture change" — must develop internal coaches; cannot contract it out.
- Standard work is developed internally by experimentation, not copied from a book.

### Conclusion and Appendix A — The 24 Capabilities

**Conclusion:** Every organisation depends on software. Delivery performance is a key value driver for all organisations regardless of size or industry. "You can't buy or copy high performance."

**The 24 key capabilities** (five categories):

**Continuous delivery (8):**
1. Version control for all production artefacts (app code, system config, app config, build scripts)
2. Deployment automation
3. Continuous integration (short-lived branches, trigger build+test on every commit)
4. Trunk-based development (< 3 branches, < 1 day lifetime, no code freeze)
5. Test automation (developer-created and maintained; reliable suites)
6. Test data management (adequate data on demand; data doesn't limit test scope)
7. Shift left on security (infosec in design, demos, automated testing; preapproved libraries)
8. Continuous delivery (software always in deployable state; fast feedback)

**Architecture (2):**
9. Loosely coupled architecture (can test and deploy independently; no orchestration needed)
10. Architect for empowered teams (teams choose their own tools)

**Product and process (4):**
11. Gather and implement customer feedback
12. Make flow of work visible through the value stream
13. Work in small batches (< 1 week; MVPs for validated learning)
14. Foster team experimentation (change specs without external approval)

**Lean management and monitoring (5):**
15. Lightweight change approval (peer review + pipeline; not external CAB)
16. Monitor application and infrastructure to inform business decisions
17. Check system health proactively (threshold and rate-of-change warnings)
18. WIP limits to drive process improvement
19. Visualise work to monitor quality and communicate

**Cultural (5):**
20. Generative culture (Westrum)
21. Learning culture (learning as investment, not cost)
22. Cross-team collaboration (dev, ops, security)
23. Meaningful work and the right tools (judgment and skills applied to challenging work)
24. Transformational leadership (vision, intellectual stimulation, inspirational communication, supportive leadership, personal recognition)

### Chapter 11 — Leaders and Managers

**Transformational leadership** (Rafferty and Griffin 2004 model — 5 dimensions): vision (clear understanding of direction), inspirational communication (motivates through uncertainty), intellectual stimulation (challenges old thinking), supportive leadership (considers personal needs), personal recognition (praises achievement).

Transformational leadership is highly correlated with delivery performance and eNPS. Teams with leaders in the bottom 1/3 of leadership strength are only *half* as likely to be high performers.

**Critical nuance:** leaders alone cannot achieve high DevOps outcomes. Teams with the top 10% of transformational leaders are no more likely to be high performers than the average. Leadership enables practices — it does not substitute for them. The chain: transformational leadership → technical and Lean practices → delivery performance → org performance.

Manager actions that drive performance:
- Cross-functional collaboration (build trust between teams, encourage lateral moves between departments)
- Climate for learning (training budget, safe to fail, blameless postmortems, hack days, 20% time, demo days)
- Effective tools (teams choose their own tools; monitoring as a priority)

Investment in DevOps: training budgets, hack days, yak days (technical debt sprints), internal DevOpsDays-format mini-conferences, 20% time for experimentation.

### Chapter 12 — The Science Behind This Book

Research type: **primary** (data collected by the authors), **quantitative** (Likert-scale surveys), **inferential predictive** (theory-driven hypotheses tested with PLS regression / multiple linear regression).

Six analysis levels (Leek): descriptive → exploratory → inferential predictive → predictive → causal → mechanistic. Book uses first three:
- Descriptive: demographic summaries
- Exploratory: correlations (Pearson r)
- Inferential predictive: when the book says X "drives" Y, this means hypothesis testing with PLS-SEM — not mere correlation

**Correlation ≠ causation:** exploratory findings are explicitly not causal. The theory-driven hypothesis testing in inferential predictive design controls for spurious correlation by requiring hypotheses grounded in existing theory before analysis. This is different from random data fishing.

Classification analysis: hierarchical clustering (not k-means — no prior expectation of number of groups) applied to the four delivery metrics to identify the high/medium/low performance clusters.

**Why surveys?** (explained more in ch. 14): best way to collect large-scale data from thousands of organisations in a short time; Likert scales allow nuanced measurement vs binary yes/no; can measure constructs (latent variables) not directly observable in system data.

### Chapter 9 — Making Work Sustainable

**Deployment pain**: fear and anxiety when pushing code to production. Inversely correlated with delivery performance, organisational performance, and culture. Three causes: (1) software not designed for deployability; (2) manual changes to production environments (configuration drift); (3) multiple handoffs between siloed teams.

Microsoft Bing case: before CD, work/life balance satisfaction score 38%. After implementing CD, 75%. Teams unaware of what deployments are like have another problem — developers isolated from downstream consequences of their work.

**Burnout**: physical, mental, or emotional exhaustion — more than just overwork. Maslach's 6 organisational risk factors: work overload, lack of control, insufficient rewards, breakdown of community, absence of fairness, value conflicts. Most organisations try to fix the person; fixing the environment is more effective.

Five predictors of burnout (from research, in order of correlation strength):
1. Pathological culture
2. Deployment pain
3. Ineffective team leaders
4. Lack of organisational investment in DevOps
5. Poor organisational performance

**Values alignment:** mismatch between individual and organisational values predicts burnout. Alignment reduces it. The lived, everyday values matter — not the mission statement on the wall.

CD and Lean management practices reduce both deployment pain and burnout. Investments in technology are investments in people.

### Chapter 10 — Employee Satisfaction, Identity, and Engagement

**eNPS**: high performers are 2.2× more likely to recommend their organisation as a great place to work, 1.8× more likely to recommend their team. Employee engagement drives business outcomes; companies with highly engaged workers grew revenues 2.5× faster.

**Identity**: extent to which employees identify with org values and goals. Predicts: generative culture, org performance (productivity, market share, profitability). CD and team experimentation authority → stronger org identity. Identity reduces burnout by aligning personal and org values.

**Job satisfaction**: right tools + work makes good use of skills + overall satisfaction. Predicted by DevOps technical practices. Automation drives satisfaction by freeing humans from rote tasks for judgment-based work (weighing evidence, making decisions).

Virtuous cycle: CD → better products → higher job satisfaction + stronger org identity → generative culture → org performance → better hiring and retention.

**Diversity finding (2017):** teams with more gender/minority diversity are smarter, achieve better team performance, and achieve better business outcomes. Tech is severely underrepresented: 91% male, 6% female, 3% non-binary; 33% of respondents working on teams with no women at all. Diversity alone is insufficient — organisations must also be inclusive (all members feel welcome and valued).

### Chapter 7 — Management Practices for Software

Lean management applied to software delivery — three components:
1. **WIP limits**: not just having them, but using them to make obstacles visible and drive process improvement (WIP limits alone don't predict performance; must be combined with other elements)
2. **Visual displays**: dashboards showing key quality/productivity metrics and work status, accessible to both engineers and leaders, aligned with operational goals
3. **Monitoring for business decisions**: using application performance and infrastructure monitoring data to make daily business decisions

When all three components are used together, effect on delivery performance is strongly positive — individually, effects are weaker.

**Lean management impacts:** higher delivery performance + more generative culture + decreased burnout.

**Lightweight change management finding:** peer review (pair programming, code review) + deployment pipeline achieves higher delivery performance than external approval. External approval (CAB) is negatively correlated with lead time, deployment frequency, and restore time, and has *no* correlation with change fail rate. It is worse than having no change approval process.

Framing: external approval is "risk management theatre" — checking boxes so when things go wrong someone can say the process was followed. External reviewers lack the intimate knowledge of the system to accurately assess the impact of complex changes.

Alternative for regulated industries: (1) peer review with approval recorded in VCS (GitHub PR approval), plus (2) fully automated deployment pipeline as the only mechanism for applying changes to production. The pipeline provides an audit trail (what changed, from where, what tests ran, who approved) that satisfies SOD requirements.

### Chapter 8 — Product Development

Lean product development — four capabilities:
1. Small batches: features completable in < 1 week, released frequently; MVPs as validated learning
2. Flow visibility: understanding how work flows from business through to customers; visibility into status
3. Customer feedback: actively and regularly sought and incorporated into design
4. Team experimentation authority: can create and change specifications without external approval

**Virtuous cycle:** Lean product management → delivery performance → Lean product management. In 2016, found that Lean product management practices predict delivery performance. In 2017, flipped the model and confirmed delivery performance also predicts Lean product management. Each enables the other. The virtuous cycle drives organisational performance (profitability, productivity, market share).

**Team experimentation finding:** authority to try new ideas and update specifications without external approval predicts organisational performance. "Faux Agile" treats customer feedback as an afterthought and prohibits teams from acting on it — capturing some Agile practices without the underlying philosophy.

### Chapter 5 — Architecture

**Key finding:** high performance is possible with all kinds of systems (mainframe, packaged software, embedded, greenfield) — system type does not predict performance. Exception: low performers are more likely using custom software from outsourcing partners or working on mainframe systems. The lesson: focus on architectural *characteristics*, not technology choices.

**Two key architectural characteristics** that predict high performance:
1. **Testability**: can do most testing without an integrated environment
2. **Deployability**: can deploy or release independently of other services

In the 2017 analysis, loosely coupled, well-encapsulated architecture was the **single biggest contributor to CD** — larger than test and deployment automation. Six questions measuring it:
- Can make large-scale design changes without permission from outside the team
- Can make large-scale design changes without depending on or creating work for other teams
- Can complete work without coordinating with people outside the team
- Can deploy/release on demand regardless of other services
- Can test on demand without an integrated test environment
- Can deploy during normal business hours with negligible downtime

**Scaling finding:** as developer count increases — low performers deploy with decreasing frequency per developer; medium performers constant; high performers deploy with increasing frequency per developer. Loosely coupled architecture is the mechanism that enables superlinear scaling.

**Inverse Conway Maneuver** empirically validated: organisations should evolve team/org structure to achieve the desired architecture. Architectural approaches: bounded contexts, APIs, test doubles and virtualisation. Service-oriented architectures that don't permit independent testing and deployment fail to deliver the intended benefits.

**Tool choice:** allowing teams to choose their own tools predicts CD performance and, in turn, organisational performance. Standardisation has value at the infrastructure level but not at the feature-team tool level. The right approach: provide great tools as an internal platform; let teams adopt them voluntarily.

**Architects should focus on** engineers and outcomes, not tools or technologies. The goal: enable teams to make changes without depending on other teams or systems.

### Chapter 6 — Integrating Infosec into the Delivery Lifecycle

"Shifting left" on security: integrate infosec into the delivery lifecycle from design through operations, rather than as a downstream phase. Three elements:
1. Security reviews for all major features — conducted without slowing development
2. Infosec experts embedded in design, demos, and test automation
3. Preapproved, easy-to-consume libraries, packages, toolchains, and processes for developers

**Finding:** high performers spend 50% less time remediating security issues than low performers. Building security in during development is far cheaper than retrofitting it.

Ratio context (Wickett 2014): 1 infosec person per 10 infrastructure per 100 developers in large companies — infosec cannot manually review every deployment when deployments are frequent. The only scalable model is to give developers the means to build security in.

DevSecOps / Rugged DevOps as alternative terminology for this approach.

### Chapter 3 — Measuring and Changing Culture

Westrum's typology (1988/2014) — pathological (power-oriented), bureaucratic (rule-oriented), generative (performance-oriented) — was adopted because it: (a) is well-defined in scientific literature, (b) can be measured via Likert-type questions, and (c) has predictive power in technology domains. (→ [[concepts/westrum-culture]])

Culture operates at three levels (Schein 1985): basic assumptions (least visible), values, and artefacts. The Westrum model operates at the values level — visible enough to discuss and measure, but reflecting deep organisational norms.

**Key Westrum characteristics across types:**
- Pathological: low cooperation, messengers shot, failures scapegoated, novelty crushed
- Bureaucratic: modest cooperation, narrow responsibilities, novelty leads to problems
- Generative: high cooperation, risks shared, failures lead to inquiry, novelty implemented

Culture predicts: software delivery performance, organisational performance, and job satisfaction. Culture is the mechanism that makes information flow effective.

**Technical nuance on the construct:** Only 3 of the 4 key metrics form a statistically valid/reliable construct (lead time, deployment frequency, MTTR). Change failure rate doesn't pass all psychometric tests but is strongly correlated. When Accelerate says "software delivery performance predicts X", it means the 3-metric construct. Change failure rate follows in practice.

**2016 culture distribution:** 31% pathological, 48% bureaucratic, 21% generative.

**How to improve culture:** implement CD and Lean management practices. "You can act your way to a better culture." Behaviour precedes belief. This parallels John Shook's Lean manufacturing experience at the NUMMI plant: changing how people work changes how they think.

### Chapter 4 — Technical Practices (Continuous Delivery)

CD definition: getting changes of all kinds into production or to users safely, quickly, and sustainably.

**Five principles of CD:**
1. Build quality in (Deming's Point 3 — cease dependence on inspection)
2. Work in small batches (reduce cycle time, variability, risk, and overhead)
3. Computers perform repetitive tasks; people solve problems (automate regression testing and deployment)
4. Relentlessly pursue continuous improvement
5. Everyone is responsible (system-level outcomes require collaboration)

**Three CD foundations:** comprehensive configuration management (version control for app code, system config, app config, build scripts), CI (short-lived branches < 1 day, merge frequently, build+unit test on every commit), continuous testing (automated acceptance tests at every commit; no "dev complete" without passing tests).

**Key capabilities driving CD:** version control (all four types), test automation, deployment automation, CI, security shift-left, trunk-based development, test data management. Added in 2017: loosely coupled/well-encapsulated architecture, team tool autonomy.

**Version control finding:** system and application configuration in version control is *more* highly correlated with delivery performance than application code itself. Configuration is a primary cause of production failures.

**Test automation nuance:** tests created and maintained by developers (not QA or outsourced) predict IT performance. Reason: (a) testability is designed in when developers write tests, (b) developers invest more in maintaining tests they own.

**Trunk-based development:** fewer than 3 active branches, branch lifetime < 1 day, no code freeze periods → higher delivery performance. GitHub Flow (feature branches) can work if branches are short-lived.

**Quality finding:** high performers spend 49% time on new work / 21% unplanned; low performers spend 38% / 27%. CD reduces failure demand (Seddon).

**CD impacts:** higher delivery performance, lower change failure rate, generative culture, stronger org identity, less deployment pain, less burnout. CD is also an investment in people, not just systems.

## Notable Quotes

> "High performers do better at all of these measures. This is precisely what the Agile and Lean movements predict, but much dogma in our industry still rests on the false assumption that moving faster means trading off against other performance goals, rather than enabling and reinforcing them." (ch. 2)

> "The gap between high and low performers continues to grow." (ch. 1)

> "Whenever there is fear, you get the wrong numbers." — Deming, cited in ch. 2

> "Maturity models focus on helping an organisation 'arrive' at a mature state and then declare themselves done with their journey." (ch. 1)

## Related Pages

- [[concepts/four-key-metrics]] — the four DORA metrics are the primary measurement framework of this book
- [[concepts/continuous-delivery-practices]] — the eight CD capabilities and empirical findings from Part I; trunk-based development, developer-owned tests, shift-left security, lightweight change approval
- [[concepts/deployment-pipelines]] — continuous delivery practices central to Part I
- [[concepts/software-complexity]] — DORA metrics provide empirical grounding for strategic programming thesis (→ referenced in [[concepts/software-complexity]])
- [[operations/availability]] — MTTR and change failure rate connect directly to availability measurement

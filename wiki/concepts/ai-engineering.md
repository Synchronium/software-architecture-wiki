---
title: "AI Engineering"
type: concept
tags: [ai, llm, machine-learning, engineering, mlops, foundation-models, evaluation]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# AI Engineering

## Definition

AI engineering is the discipline of building applications on top of foundation models. It is distinct from traditional ML engineering (which builds models) in that it adapts and orchestrates models that already exist, made available via APIs. (→ [[sources/ai-engineering]] ch. 1)

The term encompasses the full lifecycle: model selection and evaluation, prompt engineering, retrieval-augmented generation (RAG), finetuning, dataset engineering, inference optimisation, and feedback loop design.

## Why It Matters

Three forces created AI engineering as a fast-growing discipline:

1. **General-purpose capabilities.** Foundation models can do more tasks than any previous generation of ML models, dramatically widening the set of useful applications.
2. **Increased investment.** ChatGPT's success triggered a sharp rise in enterprise and VC investment. Goldman Sachs estimated global AI investment approaching $200 billion by 2025.
3. **Low entry barrier.** Model-as-a-service APIs (OpenAI, Anthropic, Google) allow anyone to build AI applications without investing in model training infrastructure.

The low entry barrier cuts both ways: if it is easy to build, it is easy for competitors to replicate. AI product defensibility rests on three moats: **technology** (rare), **data** (usage data to improve the model over time — "data flywheel"), and **distribution** (reaching users). With commoditised models, data and distribution are typically the defensible advantages.

## The Three-Layer AI Stack

(→ [[sources/ai-engineering]] ch. 1)

```
┌─────────────────────────────────┐
│      Application Development    │  ← evaluation, prompt engineering, AI interface
├─────────────────────────────────┤
│       Model Development         │  ← modelling/training, dataset engineering,
│                                 │    inference optimisation
├─────────────────────────────────┤
│          Infrastructure         │  ← model serving, compute, data management,
│                                 │    monitoring
└─────────────────────────────────┘
```

Most organisations building AI applications operate primarily in the **application development layer**. The lower layers are relevant when:
- Teams need to reduce inference cost or latency (inference optimisation).
- Off-the-shelf models cannot achieve required quality (finetuning, dataset engineering).
- Hosting models internally (infrastructure).

## AI Engineering vs ML Engineering

| Dimension | ML Engineering | AI Engineering |
|-----------|---------------|----------------|
| Core activity | Build models | Adapt existing models |
| ML knowledge | Required | Nice-to-have |
| Evaluation | Important | More important (open-ended outputs) |
| Inference cost | Important | More important (large models) |
| Dataset work | Feature engineering (tabular) | Deduplication, tokenisation, context retrieval, quality control |
| Interface design | Less important | Important (standalone AI products) |

The biggest shift is in **evaluation**: classical ML tasks have expected ground truths to compare against; foundation model outputs are open-ended, making evaluation much harder and requiring explicit investment. (→ [[sources/ai-engineering]] ch. 3–4)

A corollary of the AI engineering emphasis on application development is that it resembles full-stack development more than traditional ML engineering. Python-centric tooling is being complemented by JavaScript/TypeScript APIs (LangChain.js, Transformers.js, OpenAI's Node SDK, Vercel AI SDK).

## Planning an AI Application

### Use Case Evaluation

Before building, three questions:

1. **Why build this?** Ordered by urgency: (a) existential threat — AI can make you obsolete; (b) opportunity — AI can boost profits/productivity; (c) strategic curiosity — invest to understand an emerging technology without being left behind.
2. **Build or buy?** If AI is a competitive core, build in-house. If it augments general operations, a bought solution may be faster and better.
3. **What role does AI play?** Critical vs complementary; reactive vs proactive; dynamic vs static. The more critical AI is to the application, the higher the quality bar.

### The Last-Mile Challenge

A key planning trap: demo success is misleading. LinkedIn found it took one month to reach 80% of the desired experience, then four more months to cross 95%. Many teams grossly underestimate the gap between a working demo and a production product.

Huyen's framework for milestone planning: evaluate off-the-shelf model first, measure baseline, set a usefulness threshold (quality, latency, cost), only invest in adaptation if the baseline falls short.

### Human-in-the-Loop

The role of humans in AI decisions can evolve as quality improves:
- **Crawl:** human involvement mandatory.
- **Walk:** AI interacts with internal employees.
- **Run:** increased automation, including direct AI interactions with external users.

## Application Use Cases

Eight patterns observed across consumer and enterprise AI applications (→ [[sources/ai-engineering]] ch. 1):

1. **Coding** — the most popular use case; GitHub Copilot crossed $100M ARR within two years.
2. **Image and video production** — creative tasks where probabilistic output is an asset.
3. **Writing** — email, marketing copy, documentation; ChatGPT exposure reduced task time by 40% (MIT study).
4. **Education** — personalised tutoring, quiz generation, adaptive materials.
5. **Conversational bots** — customer support, product copilots, AI companions.
6. **Information aggregation** — summarisation, talk-to-your-docs, market research.
7. **Data organisation** — image search, unstructured data extraction, structured information retrieval.
8. **Workflow automation** — agents that plan and use tools to complete multi-step tasks.

Enterprises prefer internal-facing applications first (lower risk) and close-ended tasks (easier to evaluate) before moving to open-ended, customer-facing use cases.

## Key Takeaways

- AI engineering is distinguished from ML engineering primarily by adaptation over training, and by the elevated importance of evaluation and application-layer work.
- The three-layer stack (application dev, model dev, infrastructure) structures how teams should think about where to invest.
- Low entry barrier means most AI product moats depend on data (usage flywheel) and distribution rather than technology.
- The last-mile challenge is real: 80% of product quality can be reached quickly; the final 20% is disproportionately expensive.
- Human-in-the-loop design should be explicit — start conservatively and automate as quality improves.

## Related Concepts

- [[concepts/foundation-models]] — the models AI engineering builds upon
- [[concepts/llm-sampling]] — probabilistic output generation and its implications
- [[concepts/prompt-engineering]] — the primary adaptation technique
- [[concepts/rag]] — retrieval augmentation for grounding model outputs
- [[concepts/deployment-pipelines]] — CI/CD practices applicable to AI systems
- [[operations/monitoring]] — observability concerns translate directly to AI systems

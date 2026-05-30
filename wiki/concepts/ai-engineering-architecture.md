---
title: "AI Engineering Architecture"
type: concept
tags: [ai, llm, architecture, guardrails, routing, caching, observability, feedback, orchestration, monitoring]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# AI Engineering Architecture

## Definition

AI engineering architecture is the layered design of production AI applications — the infrastructure, policies, and feedback loops that sit around a foundation model to make it reliable, safe, cost-effective, and continuously improving. (→ [[sources/ai-engineering]] ch. 10)

## The Five-Step Progressive Architecture

Applications can be built incrementally, adding each layer when warranted. Later steps presuppose the earlier ones.

### Step 1 — Enhance Context

The first improvement is always giving the model better information: retrieval-augmented generation, tool calls, and injecting user state into the prompt.

See [[concepts/rag]] and [[concepts/ai-agents]] for detail.

### Step 2 — Guardrails

Guardrails are policies applied to inputs and outputs to enforce safety, quality, and compliance constraints.

**Input guardrails:**
- PII detection: identify and mask sensitive fields before sending to the model.
- PII reverse dictionary: store the mapping `placeholder → original value` so the response can be unmasked before returning to the user.
- Sensitive topic filters: block or reroute requests outside policy scope.
- Prompt injection detection: heuristic or model-based classifiers.

**Output guardrails:**
- Format validation: check that structured output (JSON, code) is well-formed.
- Factual consistency: verify claims against retrieved context or a knowledge base.
- Toxicity and brand-risk detection.
- Policy compliance classifiers.

**Retry logic:** when an output guardrail fails, retry the generation (optionally in parallel to hide latency). Set a maximum retry count and fall back to a human or a canned response when exhausted.

**Human fallback:** for high-stakes or repeated guardrail failures, escalate to a human reviewer rather than returning a potentially harmful response.

### Step 3 — Model Router and Gateway

**Router:** an intent classifier that dispatches requests to different models or pipelines.
- Fast/cheap models handle simple, high-volume requests.
- Expensive/capable models handle complex requests.
- Routers should themselves be fast and cheap: GPT-2, BERT, or a small Llama variant.
- The router marks requests it cannot classify as out-of-scope and routes them to a fallback.
- Pattern: routing → retrieval → generation → scoring.

**Model gateway:** a unified API layer in front of all model providers.
- Abstracts provider-specific APIs; swap models without changing application code.
- Enforces access control (which teams/services can call which models).
- Implements fallback policies (primary model unavailable → secondary model).
- Centralises logging for cost and usage attribution.
- Examples: Portkey, MLflow AI Gateway, Kong, Cloudflare AI Gateway.

### Step 4 — Caching

Caching avoids redundant model calls for repeated or near-identical requests.

**Exact caching:**
- Hash the request; serve a cached response for identical inputs.
- Eviction policies: LRU (least recently used), LFU (least frequently used), FIFO.
- **Data-leak risk:** personalised responses cached per user must never be served to a different user. Shared caches must only cache responses that are safe to share.

**Semantic caching:**
- Embed the request; retrieve the closest cached response using vector similarity.
- Apply a similarity threshold to decide whether to serve the cached response.
- **Caution:** semantic caching is harder to implement correctly and has more failure modes than exact caching. The book is sceptical of its practical value — a false positive (serving a cached response to a semantically-similar but distinct query) is worse than a cache miss.

> **Open question:** Whether semantic caching provides net positive value in production remains contested. The similarity threshold tuning problem is non-trivial.

**Prompt caching** (model-provider-level): see [[concepts/inference-optimization]] — distinct from application-level caching.

### Step 5 — Agent Patterns

At the top of the architecture, multi-step agentic workflows are introduced. Guardrails, routers, and gateways from earlier steps apply to every model call within an agent loop.

See [[concepts/ai-agents]] for planning strategies, tool use, and failure modes.

## Monitoring and Observability

### Key Metrics

| Metric | Definition |
|--------|-----------|
| **MTTD** | Mean time to detect — how long before an incident is noticed |
| **MTTR** | Mean time to recover — how long before the system is restored |
| **CFR** | Change failure rate — proportion of deployments that cause incidents |

AI-specific metric: **per-model cost and latency attribution** — essential for understanding which models are driving bill and latency.

### Model Drift

LLM behaviour can drift without any change to the application:

- **System prompt changes** — even minor rephrasing changes model behaviour.
- **User behaviour changes** — the distribution of incoming requests shifts over time.
- **Underlying model changes** — providers update models without announcing it. Chen et al. (2023) documented notable performance differences between GPT-4 (March 2023) vs GPT-4 (June 2023) on coding and safety tasks. Voiceflow observed a 10% performance drop across GPT-3.5 versions.

**Mitigation:** version-pin model endpoints where providers allow it; continuously run evaluation benchmarks on live traffic; monitor output distribution statistics.

### Observability Checklist

- Log all inputs, outputs, latencies, and costs per request and per model call.
- Monitor inter-annotator agreement to detect annotation drift.
- Track output quality metrics (automated evals, user satisfaction proxies) over time.
- Alert on sudden distribution shifts in output length, format failure rate, or user complaint rate.

## Pipeline Orchestration

Orchestration frameworks manage multi-step AI pipelines (retrieval → reranking → generation → scoring).

Common frameworks: **LangChain**, **LlamaIndex**, **Flowise**, **Langflow**, **Haystack**.

**When to use:** when the pipeline has multiple stages with conditional logic, retries, and parallel branches that would be tedious to wire manually.

**When not to use:** for simple single-call or two-step pipelines, direct API calls are simpler, easier to debug, and avoid framework abstraction overhead. Start without an orchestrator; add one when complexity justifies it.

**Framework evaluation criteria:** integration breadth (models, vector DBs, tools), support for complex pipelines (branching, parallel calls, retry), ease of debugging, performance and scalability, community size.

## User Feedback Systems

User feedback is the training signal for continuous model improvement — the **data flywheel** that makes your application data (from [[concepts/dataset-engineering]]) more valuable than any public dataset.

### Feedback Types

**Explicit feedback:** users directly rate the system.
- Thumbs up/down — binary, low friction, high volume.
- Star ratings — more granular but harder to aggregate.
- Comment/text — richest signal; hardest to process at scale.

**Implicit feedback:** inferred from user behaviour.
- Conversational signals: early conversation termination, error correction by user, user complaints, sentiment analysis, request for regeneration, conversation length and diversity.
- User edits of model output: the original output is the "losing" response; the edited output is the "winning" response — a direct preference pair for [[concepts/finetuning]] (DPO/RLHF data).
- Feature-specific: Midjourney's 4-image grid (variation = "these tokens are good", upscale = "this image is the best", regenerate = "nothing was good"); GitHub Copilot (Tab = accept, continue typing = reject).

### Feedback Collection Design

- **Non-intrusive:** collect feedback through the natural interaction, not interruptions.
- **Low friction:** binary signals (thumbs, Tab key) produce far more volume than free-text.
- **Contextual:** attach feedback to the specific model call, not the session, for cleaner training signal.
- **Action-correlated:** actions (share, copy, export) are stronger preference signals than ratings.

### Feedback Biases

| Bias | Description |
|------|-------------|
| **Leniency bias** | Users rate positively to avoid conflict; Uber drivers average 4.8, and <4.6 risks deactivation |
| **Randomness** | Mood, fatigue, and context variation add noise to ratings |
| **Position bias** | Users prefer the first or last option in a comparison |
| **Preference bias** | Users prefer longer, more flattering responses independent of quality |
| **Recency bias** | Later responses in a conversation are rated more positively |

### Degenerate Feedback Loops

A degenerate feedback loop occurs when a model trained on biased feedback produces outputs that reinforce that bias, which then gets more positive feedback, compounding the problem.

- **Exposure bias:** the model only learns from feedback on outputs it generates; it never explores alternatives that might be better.
- **Sycophancy (Sharma et al., 2023):** RLHF-trained models learn to favour the user's stated views over factual accuracy; users give higher ratings to responses that agree with them.

**Mitigation:** periodic injection of diverse outputs for human evaluation; blind comparison studies; monitoring for distribution shift in output style (increasing agreement, increasing length).

## Key Takeaways

- Build progressively: context enhancement first, then guardrails, router, caching, agents. Each layer earns its complexity.
- Model gateways are underused; they provide vendor independence and centralised governance at low cost.
- Semantic caching is attractive in theory but failure-prone in practice; exact caching with proper isolation is safer.
- Model drift from provider-side updates is a real and underappreciated production risk; pin versions and run continuous evals.
- User edits are the highest-quality implicit feedback signal — they are direct preference pairs with no additional annotation required.
- Sycophancy and degenerate feedback loops are structural risks in any RLHF-trained feedback system; measure output diversity to detect them.

## Related Concepts

- [[concepts/rag]] — Step 1 of the progressive architecture; the primary context-enhancement mechanism
- [[concepts/ai-agents]] — Step 5 of the progressive architecture; adds planning and tool use
- [[concepts/inference-optimization]] — reducing cost and latency of individual model calls within this architecture
- [[concepts/ai-evals]] — continuous evaluation is the backbone of the monitoring layer
- [[concepts/finetuning]] — user feedback (especially edits) generates preference data for RLHF/DPO finetuning
- [[concepts/dataset-engineering]] — the data flywheel converts user feedback into training datasets

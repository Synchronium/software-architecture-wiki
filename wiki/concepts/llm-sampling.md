---
title: "LLM Sampling and Probabilistic Outputs"
type: concept
tags: [ai, llm, sampling, hallucination, temperature, probabilistic, structured-outputs]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# LLM Sampling and Probabilistic Outputs

## Definition

Language models generate output tokens by sampling from a probability distribution over their vocabulary. This sampling-based generation is the source of both the creativity and the unreliability of LLM outputs — hallucination, inconsistency, and the non-deterministic character of AI responses are all consequences of this mechanism. (→ [[sources/ai-engineering]] ch. 2)

## Why It Matters

Understanding sampling is essential for AI engineers because:
- Sampling variables (temperature, top-k, top-p) are the most accessible levers for controlling model behaviour without changing the model itself.
- The probabilistic nature of outputs is the root cause of hallucination and inconsistency — understanding the cause leads directly to mitigation strategies.
- Test-time compute (generating multiple outputs) can substitute for larger model size — a significant leverage point for quality improvement.

## How Sampling Works

Given an input, the model computes a **logit vector** — one logit per vocabulary token. These are converted to probabilities via softmax. The model then samples the next token from this distribution.

**Greedy sampling** always picks the most probable token. For classification tasks this is appropriate, but for text generation it produces repetitive, predictable outputs.

**Probabilistic sampling** instead draws from the distribution: if "green" has 50% probability and "red" has 30%, "green" is chosen 50% of the time. This is what makes AI creative — and inconsistent.

## Sampling Strategies

### Temperature

Temperature scales logits before softmax by dividing by a constant T:

- **T < 1:** Concentrates probability mass on high-probability tokens → more predictable, less creative.
- **T > 1:** Spreads probability mass → more creative, less coherent.
- **T = 0:** Effectively greedy (picks the max-logit token, no sampling).

Common practice: T ≈ 0.7 for creative tasks; T = 0 for tasks requiring consistency (e.g. structured output generation, classification).

### Top-k

After computing logits, keep only the top-k and perform softmax over that subset. Reduces computation without sacrificing much diversity. k typically ranges from 50 to 500.

Limitation: a fixed k is inappropriate when the natural set of valid continuations is very small (e.g. yes/no questions) or very large.

### Top-p (Nucleus Sampling)

Keep the smallest set of tokens whose cumulative probability exceeds p. Dynamic — the number of candidates adapts to the distribution's entropy. Common values: 0.9–0.95.

If top-p is 0.9, only the tokens whose cumulative probability exceeds 90% are considered. This ensures the model focuses on the most contextually relevant tokens regardless of how many exist.

## Test-Time Compute

Rather than generating one response per query, generate multiple and select the best. This is an explicit trade-off: more compute at inference time for higher quality output.

Selection methods:
- **Highest average log probability** — pick the output with the highest per-token log probability across the sequence.
- **Reward model scoring** — use a reward model to score each candidate; Stitch Fix and Grab use this approach.
- **Majority voting** — for tasks with deterministic answers (maths, multiple choice), pick the most frequent output. Google used CoT@32 (32 samples) to boost Gemini's MMLU benchmark score.
- **Application-specific heuristics** — pick the shortest valid output, the first valid SQL query, etc.

DeepMind (Snell et al., 2024) argues that scaling test-time compute can be more efficient than scaling model parameters. OpenAI showed that using a verifier to select among multiple outputs achieved the same performance boost as a 30× model size increase.

Practical caveat: generating 400+ samples per query (as in some research) is economically infeasible in production. The benefit plateaus and can reverse if adversarial outputs that fool the verifier appear.

## Structured Outputs

When model outputs must follow a specific format (JSON, YAML, SQL, regex), several techniques are available:

| Technique | Reliability | Cost | Notes |
|-----------|------------|------|-------|
| Prompting | Low | Negligible | First line of defence; unreliable for strict format requirements |
| Post-processing | Medium | Low | Works well for small, consistent errors; LinkedIn improved JSON validity from 90% to 99.99% with a defensive YAML parser |
| Test-time compute | Medium | High | Keep generating until a valid output appears |
| Constrained sampling | High | Medium | Filters logits to only valid tokens per a grammar; requires grammar per format |
| Finetuning | Highest | High | Most reliable; works for any format; see [[concepts/foundation-models]] |

Constrained sampling works by filtering the logit vector at each step to exclude tokens that violate the output format grammar, then sampling from the valid subset. This guarantees structurally valid outputs but requires grammar specifications per format and adds latency.

As models improve at instruction-following, the need for constrained sampling is expected to decrease.

## Hallucination

Hallucination is when a model generates factually incorrect or fabricated content. It is a consequence of the probabilistic generation process, but the root cause is more nuanced than randomness alone.

**Two hypotheses:**

1. **Self-delusion (DeepMind, Ortega et al., 2021):** The model treats its own generated tokens as ground truth, conditioning subsequent generation on them. A slight error in early tokens can compound — "snowballing hallucinations". The model cannot distinguish between user-provided facts and its own outputs.

2. **Training–knowledge mismatch (Leo Gao, OpenAI):** SFT labellers write responses using knowledge the model doesn't have. This teaches the model to fill knowledge gaps with plausible-sounding content — effectively training it to hallucinate. Labellers cannot practically include all knowledge sources they use.

These two hypotheses are complementary: self-delusion explains pre-training hallucination; the knowledge mismatch explains hallucination introduced by SFT.

**Mitigation strategies:**
- Lower temperature (less randomness).
- Shorter response instructions (fewer tokens = fewer opportunities for errors to compound).
- RAG — grounding responses in retrieved documents. (→ [[concepts/rag]])
- Prompting the model to express uncertainty ("if you're unsure, say so").
- Verification: ask the model to cite sources; use a separate model to validate factual claims.
- RLHF can worsen hallucination in some dimensions (InstructGPT showed this) even as it improves overall user preference.

## Inconsistency

Inconsistency — the same prompt yielding different outputs — arises from the stochastic sampling process. Mitigations:

- **Fix sampling variables:** lock temperature, top-k, top-p, and random seed.
- **Cache answers:** return the same response for identical queries.
- **Prompt carefully:** well-crafted prompts reduce variance (→ [[concepts/prompt-engineering]]).

Note: even with fixed sampling variables, hardware differences across inference servers can introduce variation. API providers may not guarantee reproducibility.

## Key Takeaways

- Sampling is the root of both LLM creativity and unreliability — the same mechanism that enables open-ended generation causes hallucination and inconsistency.
- Temperature, top-k, and top-p are the primary levers; understand them before reaching for more expensive adaptations.
- Test-time compute (multiple samples + selection) is an underused lever — can substitute for a 30× model size increase in some tasks.
- Structured output techniques span a reliability-cost spectrum; constrained sampling gives the strongest guarantees but requires per-format grammar specifications.
- Hallucination has two independent causes (self-delusion and knowledge mismatch); mitigation strategies target both.

## Related Concepts

- [[concepts/foundation-models]] — the architecture that produces these probability distributions
- [[concepts/ai-engineering]] — the discipline that must engineer around probabilistic outputs
- [[concepts/prompt-engineering]] — reducing variance through careful input design
- [[concepts/rag]] — grounding outputs in retrieved facts to reduce hallucination

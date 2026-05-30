---
title: "Foundation Models"
type: concept
tags: [ai, llm, foundation-models, machine-learning, transformer, scaling, post-training, alignment]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# Foundation Models

## Definition

A foundation model is a large AI model trained on broad data at scale, capable of a wide range of tasks, and designed to be adapted for specific applications. The term encompasses large language models (LLMs) and large multimodal models (LMMs) — models that process text combined with images, audio, or other modalities. (→ [[sources/ai-engineering]] ch. 1–2)

The word *foundation* signals two things: these models are foundational to a new generation of AI applications, and they can be built upon for different needs — via prompt engineering, RAG, or finetuning.

## Why It Matters

Foundation models mark the transition from task-specific AI (a model per task) to general-purpose AI (one model that can be adapted for many tasks). This has three architectural consequences:

1. **Lower entry barrier.** An organisation no longer needs to train its own model to build AI-powered features. A model API call replaces months of data collection and training.
2. **Adaptation replaces training.** The engineering work shifts from building models to adapting them — via prompts, retrieval, and finetuning. (→ [[concepts/ai-engineering]])
3. **Evaluation becomes critical.** General-purpose models produce open-ended outputs that cannot be validated against a fixed ground truth. Evaluation must be designed explicitly. (→ [[sources/ai-engineering]] ch. 3–4)

## How Foundation Models Are Built

### Training Data

Foundation models require massive training datasets. The dominant source is Common Crawl (a periodic web crawl), often supplemented with books, code repositories, academic papers, and proprietary data. Common Crawl's quality is uneven — it contains misinformation, propaganda, and low-quality content alongside high-quality text.

Training data distribution shapes capabilities and limitations:
- English accounts for ~46% of Common Crawl. High-population languages such as Punjabi, Urdu, and Bengali are under-represented by 50–200×.
- Under-represented languages perform poorly: GPT-4 achieves much lower scores in Telugu or Burmese than in English.
- Tokenisation efficiency varies by language: Burmese requires ~10× more tokens than English to represent the same content, making inference slower and more expensive.

### Architecture

The dominant architecture is the **transformer** (Vaswani et al., 2017), built on the attention mechanism. The attention mechanism allows the model to attend to any prior token when generating each output, addressing the limitations of earlier sequential architectures (RNNs, seq2seq).

**Inference has two distinct phases:**
- **Prefill:** all input tokens are processed in parallel (fast).
- **Decode:** output tokens are generated one at a time (sequential bottleneck).

This asymmetry motivates many inference optimisation techniques, including KV caching (storing computed key and value vectors to avoid recomputation).

The **KV cache** is central to transformer efficiency: at each decode step, the model needs the key and value vectors for every prior token. Caching these avoids recomputing them. Longer contexts require larger KV caches, which is why extending context length is expensive.

**Alternative architectures gaining traction:**
- **RWKV:** RNN-based but parallelisable for training; theoretically unbounded context length.
- **SSMs / Mamba:** State space models with linear scaling in sequence length (vs quadratic for transformers); Mamba-3B matches transformers twice its size on language benchmarks.
- **Jamba:** Hybrid transformer/Mamba architecture; 52B total parameters, 12B active, fits in a single 80 GB GPU.

None of these alternatives has yet displaced the transformer in practice.

**Mixture-of-experts (MoE):** A sparse model variant where only a subset of parameter groups (experts) is activated per token. Mixtral 8×7B has 46.7B total parameters but activates only 12.9B per token — the inference cost matches a 12.9B dense model. MoE allows larger total model capacity without proportional inference cost.

### Model Scale

Three numbers characterise a model's scale:
- **Parameters:** proxy for learning capacity. Inference memory ≈ 2 bytes × number of parameters (in 16-bit precision).
- **Training tokens:** proxy for knowledge acquired. Llama 3 trained on 15 trillion tokens.
- **FLOPs:** proxy for training cost.

**Scaling law (Chinchilla, DeepMind 2022):** For compute-optimal training, the number of training tokens should be approximately 20× the number of parameters. Model size and dataset size should scale together — doubling one requires doubling the other. Meta's Llama deliberately chose smaller-than-optimal models to improve inference economics and adoptability.

**Scaling bottlenecks:**
- Publicly available training data may be exhausted within a few years — the rate of dataset growth already exceeds the rate of new human-generated content.
- Data centres consumed 1–2% of global electricity as of 2024, projected to reach 4–20% by 2030. This energy constraint bounds how many more orders of magnitude of scaling are feasible.

### Post-Training

Pre-training via self-supervision produces a model optimised for text completion, not conversation. It may also generate harmful or inappropriate content. Post-training addresses both problems with two steps, using only ~2% of pre-training compute:

**1. Supervised Finetuning (SFT):** Train on demonstration data — (prompt, response) pairs — to shift from completion to conversation. Quality of labellers matters: OpenAI required college-educated labellers for InstructGPT, at a cost of ~$130,000 for 13,000 pairs.

**2. Preference Finetuning:** Align the model with human preferences. Two dominant approaches:

- **RLHF (Reinforcement Learning from Human Feedback):** Train a reward model on comparison data (prompt, winning response, losing response), then use PPO to optimise the foundation model against the reward model's scores. Used by GPT-3.5 and Llama 2.
- **DPO (Direct Preference Optimisation):** A simpler alternative that avoids the separate RL training loop. Llama 3 switched from RLHF to DPO to reduce complexity.

Post-training can be understood as unlocking capabilities the pre-trained model already has but that are inaccessible through prompting alone.

## Adaptation Techniques

Foundation models can be adapted for specific tasks without changing the model. Three primary techniques, ordered by increasing resource requirement:

| Technique | Weights changed? | Data needed | Complexity |
|-----------|-----------------|-------------|------------|
| [[concepts/prompt-engineering]] | No | None (or few examples) | Low |
| [[concepts/rag]] | No | External retrieval corpus | Medium |
| Finetuning | Yes | Labelled examples | High |

For most applications, prompt engineering should be tried first. Finetuning is reserved for cases where prompt engineering cannot achieve the required quality, latency, or cost.

## Key Takeaways

- Foundation models are general-purpose models adaptable to specific tasks — a paradigm shift from task-specific AI.
- Training data distribution determines capability boundaries; language and domain gaps are significant and measurable.
- The transformer's prefill/decode asymmetry and KV cache are central to understanding inference cost and optimisation.
- The Chinchilla scaling law provides a principled framework for compute-optimal training; inference cost considerations often push teams toward smaller-than-optimal models.
- Post-training (SFT + preference finetuning) uses 2% of pre-training compute but dramatically improves usability and safety.

## Related Concepts

- [[concepts/ai-engineering]] — the discipline built on top of foundation models
- [[concepts/llm-sampling]] — how models generate outputs and why they are probabilistic
- [[concepts/prompt-engineering]] — the primary adaptation technique (no weight updates)
- [[concepts/rag]] — retrieval-augmented generation as a context injection strategy

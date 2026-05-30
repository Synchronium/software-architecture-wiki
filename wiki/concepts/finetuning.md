---
title: "Finetuning"
type: concept
tags: [ai, llm, finetuning, peft, lora, quantization, transfer-learning, model-merging]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# Finetuning

## Definition

Finetuning is the process of adapting a pre-trained model to a specific task by further training all or part of the model's weights. It is one form of transfer learning — the technique of transferring knowledge gained on a data-rich task to accelerate learning on a data-scarce one. (→ [[sources/ai-engineering]] ch. 7)

## When to Finetune

The model adaptation decision tree, from cheapest to most expensive: prompt engineering → few-shot prompting → RAG → finetuning → train from scratch.

**Reasons to finetune:**
- The model's outputs are behaviourally wrong — wrong format, wrong style, wrong level of specificity — rather than informationally wrong.
- Domain-specific output syntax (rare SQL dialects, DSLs, complex schemas) not sufficiently covered in pre-training.
- Need to distil a large model's behaviour into a smaller model for cost/latency reasons.
- Bias mitigation — exposing the model to carefully curated counter-examples.

**Reasons not to finetune:**
- Finetuning on task A can degrade performance on tasks B and C (sometimes called the alignment tax).
- Requires ML expertise, annotated data, and continual maintenance; base models improve faster than most teams can iterate on finetuned models.
- Many improvements achievable by finetuning can also be achieved by prompt engineering or RAG.

**The RAG vs finetuning heuristic:** "Finetuning is for form, RAG is for facts." (Ovadia et al., 2024 demonstrated that RAG outperforms finetuning on current-event question answering for Mistral 7B, Llama 2-7B, and Orca 2-7B.)

## Memory Bottleneck

Finetuning is significantly more memory-intensive than inference because the backward pass requires storing gradients and optimiser states.

**Memory for inference:** `N × M × 1.2` where N = parameter count, M = bytes per parameter (1.2 accounts for activations and KV cache). A 13B model at 2 bytes/param ≈ 31 GB.

**Memory for training:** model weights + activations + gradients + optimiser states. With Adam (two states per trainable parameter), each trainable parameter requires 3× memory beyond its weight. For a 13B model, full finetuning with Adam ≈ 56 GB (weights) + activation memory — far beyond most consumer GPUs (12–48 GB).

**Activation memory** can dwarf weight memory if activations are stored for gradient computation. **Gradient checkpointing** (recomputing activations on demand rather than storing them) reduces memory at the cost of increased computation time.

## Numerical Representations and Quantisation

| Format | Bits | Bytes | Notes |
|--------|------|-------|-------|
| FP64 | 64 | 8 | Rarely used in neural networks |
| FP32 | 32 | 4 | Standard training precision |
| TF32 | 19 | — | NVIDIA GPU optimised; named for FP32 compatibility |
| BF16 | 16 | 2 | Wide range, less precision; designed for TPUs; Llama 2's native format |
| FP16 | 16 | 2 | Half precision; higher precision, narrower range than BF16 |
| INT8 | 8 | 1 | Integer quantisation |
| INT4 / FP4 | 4 | 0.5 | Extreme quantisation |

**Quantisation** converts weights (and optionally activations) to a lower-precision format. It reduces memory footprint and can improve throughput, but small value changes can compound into quality degradation.

- **Post-training quantisation (PTQ):** quantise after training; the most common approach.
- **Quantisation-aware training (QAT):** simulate low-precision during training so the model learns to compensate; does not reduce training cost.
- BitNet b1.58 (Ma et al., 2024) achieves performance comparable to 16-bit Llama 2 at only 1.58 bits per parameter up to 3.9B parameters.

> **Warning:** Loading a model in the wrong numerical format causes silent quality degradation. Llama 2 is BF16; many teams initially loaded it as FP16 and experienced unexpectedly poor results.

## Parameter-Efficient Finetuning (PEFT)

PEFT techniques achieve performance close to full finetuning while training only a small fraction of the model's parameters. Fewer trainable parameters means lower gradient and optimiser-state memory.

**Full finetuning:** all parameters are trainable; requires the most memory and data.

**Partial finetuning:** freeze early layers, update only later layers. Houlsby et al. (2019) showed that with BERT large, updating 25% of parameters is needed to match full finetuning on GLUE — not parameter-efficient.

### Adapter-Based Methods

Insert small trainable modules into frozen layers. The original Houlsby et al. (2019) approach inserts two adapters per transformer block; performance within 0.4% of full finetuning using only 3% of trainable parameters. **Downside:** adds inference latency.

**LoRA (Low-Rank Adaptation)** — Hu et al. (2021); the dominant PEFT technique.

For a weight matrix W (n × m), LoRA:
1. Decomposes W into two smaller matrices A (n × r) and B (r × m) where r is the LoRA rank.
2. Updates W′ = W + (α/r) × AB, where α scales the contribution.
3. Only A and B are trained; W remains frozen.

On GPT-3, LoRA achieves comparable or better performance to full finetuning using only 4.7M trainable parameters (0.0027% of full finetuning). **No inference latency overhead** — A and B can be merged back into W before serving.

**Why LoRA works:** Pre-training implicitly minimises a model's intrinsic dimension. Larger, better-trained models have lower intrinsic dimensions — making them easier to adapt with fewer parameters.

**LoRA configurations:**
- Rank r: typically 4–64; increasing r beyond a certain value yields no discernible improvement and may overfit.
- Apply to: attention matrices W_q, W_k, W_v, W_o; Databricks found the biggest gain from applying to feedforward layers as well.
- α: controls contribution scaling; α:r ratio typically 1:8 to 8:1.

**Multi-LoRA serving:** keep W, A, B separate so multiple task-specific adapters share one base model. For 100 customers with LoRA rank 8 on a 4096×4096 matrix: merged option requires 1.68B parameters; separate adapters require only 23.3M.

**QLoRA (Dettmers et al., 2023):** store base model weights in 4-bit NF4; dequantise to BF16 for forward/backward pass. Enables finetuning a 65B-parameter model on a single 48 GB GPU. Adds quantisation/dequantisation overhead.

### Soft Prompt-Based Methods

Instead of adding adapter modules, prepend trainable continuous vectors (soft prompts) to the input. Unlike hard prompts (human-readable, static), soft prompts are optimised via backpropagation. Variants differ in where soft tokens are inserted:
- **Prefix tuning** (Li & Liang, 2021): prepend at every transformer layer.
- **Prompt tuning** (Lester et al., 2021): prepend only to the embedded input.

Much less common than LoRA in practice (huggingface/peft GitHub issue analysis, Oct 2024).

## Model Merging

Model merging combines multiple models (often finetuned models) into a single model. Can be done without GPUs if no further finetuning is needed.

**Multi-task finetuning approaches:**
- **Simultaneous:** train on all task data at once; harder to learn multiple skills simultaneously.
- **Sequential:** train on tasks one after another; risks catastrophic forgetting (model forgets earlier tasks).
- **Model merging:** finetune on each task independently in parallel, then merge; avoids catastrophic forgetting.

**Task vectors** (delta parameters) = finetuned model − base model. Task arithmetic (Ilharco et al., 2022) lets you add or subtract capabilities.

**Three merging approaches:**

1. **Summing:** average or weighted-average of weight matrices. *Linear combination* (simple, often effective; "model soups"). *SLERP* (spherical linear interpolation; defined only for two vectors; more geometrically principled).
   - TIES (Yadav et al., 2023) and DARE (Yu et al., 2023) first prune redundant task vector parameters before merging; reduces interference between tasks.

2. **Layer stacking (frankenmerging):** take layers from different models and stack them; typically requires further finetuning. Used to create MoE models from dense checkpoints (Komatsuzaki et al., 2022). Goliath-120B merged two Llama 2-70B models using 72/80 layers each.

3. **Concatenation:** concatenate adapters; increases parameter count proportionally; not recommended as it defeats the memory savings.

**On-device use case:** merging multiple task-specific adapters into one reduces on-device memory footprint. Apple merged multiple LoRA adapters into a 3B-parameter base model for iPhone features.

## Finetuning Tactics

**Development paths:**

*Progression path:* test code with cheapest model → validate data with mid-size model → push performance with best model → map price/performance frontier across model sizes.

*Distillation path:* strong model + small dataset → generate synthetic training data → train smaller model.

**Key hyperparameters:**
- **Learning rate:** experiment in range 1e-7 to 1e-3; start from end of pre-training LR × (0.1–1). Use learning rate schedules.
- **Batch size:** larger = more stable; constrained by hardware memory. Use gradient accumulation to simulate larger batches.
- **Number of epochs:** 1–2 for millions of examples; 4–10 for thousands. Monitor training/validation loss divergence for overfitting.
- **Prompt loss weight:** for instruction finetuning, prompts should contribute less to loss than responses. Default ~10% for prompt, 100% for response.

## Key Takeaways

- Finetune only after exhausting prompt engineering; finetuning and prompting are complementary.
- **RAG is for facts; finetuning is for form.**
- Memory is the primary finetuning bottleneck; PEFT and quantisation make finetuning accessible on consumer hardware.
- LoRA is the dominant PEFT technique — parameter-efficient, data-efficient, and inference-latency-neutral.
- Model merging enables multi-task capability without catastrophic forgetting; task arithmetic allows surgical capability addition and removal.
- A small dataset of 50–100 examples should show measurable improvement if finetuning will help at all.

## Related Concepts

- [[concepts/ai-agents]] — finetuning can teach tool-use behaviour via synthesised trajectory data
- [[concepts/rag]] — the complementary approach to finetuning; prefer RAG for information-based failures
- [[concepts/foundation-models]] — the starting point for finetuning; post-training (SFT, RLHF, DPO) is finetuning at the model development layer
- [[concepts/dataset-engineering]] — acquiring and synthesising finetuning data
- [[concepts/prompt-engineering]] — the first adaptation technique to exhaust before reaching for finetuning

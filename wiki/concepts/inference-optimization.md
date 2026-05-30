---
title: "Inference Optimization"
type: concept
tags: [ai, llm, inference, performance, latency, throughput, gpu, quantization, speculative-decoding, kv-cache, batching]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# Inference Optimization

## Definition

Inference optimization is the engineering discipline of reducing the cost, latency, and memory usage of serving large language model predictions in production, without materially degrading model quality. (→ [[sources/ai-engineering]] ch. 9)

## Performance Metrics

| Metric | Definition |
|--------|-----------|
| **TTFT** | Time to first token — latency from request to first generated token |
| **TPOT** | Time per output token — average latency of each generated token |
| **Total latency** | TTFT + (TPOT × output_token_count) |
| **Throughput** | Tokens generated per second across all concurrent requests |
| **Goodput** | Requests per second that satisfy the latency SLO |

**MFU (Model FLOP/s Utilization):** ratio of actual throughput to theoretical peak FLOP/s of the hardware. A well-tuned system reaches 30–60% MFU.

**MBU (Model Bandwidth Utilization):** `(parameter_count × bytes/param × tokens/s) / theoretical_peak_bandwidth`. Memory bandwidth is the binding constraint during decode.

## Two Bottlenecks

LLM inference has two distinct computational phases with different bottlenecks:

- **Prefill (compute-bound):** process the prompt — many matrix multiplications; GPU compute is the limit.
- **Decode (memory bandwidth-bound):** generate output tokens one by one; the weights must be loaded from GPU memory for each token step; data movement is the limit.

**Memory hierarchy:**
- CPU DRAM: 25–50 GB/s bandwidth, large capacity
- GPU HBM (high-bandwidth memory): 256 GB/s – 1.5 TB/s, moderate capacity
- GPU SRAM (on-chip): >10 TB/s, tiny capacity

Matrix multiplication exceeds 90% of neural network FLOPs; the gap between compute and memory bandwidth determines which phase is the bottleneck.

**Deployment economics:** Online APIs optimise for latency (stream tokens to user); batch APIs optimise for throughput/cost (Google and OpenAI offer ~50% cost discount with hours-long turnaround, suitable for offline processing).

## Model-Level Optimisation

### Quantisation

Reduce the numerical precision of weights (and optionally activations). Most popular inference optimisation technique.

- **Post-training quantisation (PTQ):** quantise after training; low overhead.
- **Quantisation-aware training (QAT):** simulate low precision during training; better quality but doesn't reduce training cost.
- Common targets: FP16/BF16 → INT8 → INT4. Performance degrades more at very low precision.

See [[concepts/finetuning]] for numerical format details.

### Distillation and Pruning

**Distillation:** train a smaller student model on teacher outputs; see [[concepts/dataset-engineering]].

**Pruning:** remove weights with small magnitudes to create sparse models. Reduces parameter count but requires hardware that natively supports sparse matrix operations to realise speed gains — sparse models can perform *slower* on hardware without sparsity support.

### Speculative Decoding

The decode phase is sequential (each token depends on the previous). Speculative decoding breaks this bottleneck:

1. A small, fast **draft model** generates K candidate tokens sequentially.
2. The large **target model** verifies all K tokens in parallel (verification is a prefill-style operation).
3. Accept tokens up to the first disagreement; the target model fills in from there.

**Benefit:** when draft tokens are accepted, the target model generates K tokens per forward pass instead of 1. DeepMind used a 4B-parameter draft model for a Chinchilla-70B target and achieved >50% latency reduction.

**Inference with reference (context-based drafting):** instead of a separate draft model, propose draft tokens directly from the input context (e.g., copy-paste from retrieved documents). Effective for retrieval, multi-turn conversation, and code completion; achieves approximately 2× speedup without a separate draft model.

### Parallel Decoding

Techniques that avoid strict sequential generation:

- **Lookahead decoding:** uses the Jacobi iteration method to generate multiple candidate continuations simultaneously.
- **Medusa:** adds multiple decoding heads to the base model; each head proposes future tokens; verified in parallel. Achieves ~1.9× speedup on Llama 3.1 with no external draft model.

### KV Cache Optimisation

The KV (key-value) cache stores intermediate attention states to avoid recomputing them on each decode step.

**KV cache size formula:**

```
size = 2 × B × S × L × H × M
```

Where: B = batch size, S = sequence length, L = number of layers, H = number of attention heads, M = bytes per element. Grows linearly with sequence length.

**Llama 2 13B example:** batch=32, seq=2048 → ~54 GB KV cache, exceeding the model weights.

**Attention variants that reduce KV cache size:**

| Variant | Description |
|---------|-------------|
| Multi-head attention (MHA) | Full KV cache per head (baseline) |
| Multi-query attention (MQA) | All heads share one K and V; large reduction |
| Grouped-query attention (GQA) | Groups of heads share K and V; generalises MHA and MQA |
| Cross-layer attention | Layers share KV cache across the layer axis |
| Local/windowed attention | Each token attends to a fixed window; avoids O(n²) growth |

Character.AI achieved >20× KV cache reduction through aggressive attention optimisation.

**PagedAttention (vLLM):** inspired by OS virtual memory, stores KV cache in non-contiguous blocks. Eliminates internal fragmentation; multiple sequences can share physical blocks (useful for parallel beam search or shared system prompts).

**FlashAttention:** a hardware-aware kernel that fuses attention operations to minimise HBM round-trips. Operates in GPU SRAM for the inner loop; avoids materialising the full attention matrix. Hardware-specific; significant practical speedup.

## Service-Level Optimisation

### Batching Strategies

Processing multiple requests together amortises the cost of loading model weights into SRAM.

| Strategy | Description | Trade-off |
|----------|-------------|-----------|
| **Static batching** | Wait until a full batch is assembled | Simple; wastes GPU if batch takes long to fill |
| **Dynamic batching** | Assemble within a time window | More practical; still padded to max length |
| **Continuous (in-flight) batching** | Per-step scheduling (Orca paper); new requests inserted as slots free | Eliminates padding waste; short responses return immediately without waiting for long ones |

Continuous batching is the state-of-the-art for production LLM serving.

### Prefill–Decode Decoupling

Separate GPU instances handle prefill and decode phases:

- Prefill is compute-bound → needs compute-optimised hardware.
- Decode is memory-bound → needs memory-bandwidth-optimised hardware.

Running them together means neither phase can use hardware optimally. Splitting them improves both throughput and latency.

**Typical ratio:** 2:1 to 4:1 decode-to-prefill instances for long-input workloads. Communication overhead (transferring KV cache via NVLink or similar) is acceptable relative to the gain.

### Prompt Caching

System prompts are often identical across requests. Prompt caching processes the system prompt once and reuses the KV cache states.

- **Anthropic:** up to 90% cost reduction, 75% latency reduction for cache hits.
- **Google Gemini:** 75% cost discount on cached tokens + a small cache storage fee.

Best suited for long system prompts or shared context that changes rarely.

### Parallelism Strategies

For models too large to fit on a single device:

| Strategy | Description |
|----------|-------------|
| **Tensor parallelism** | Split individual weight matrices across devices; high bandwidth required |
| **Pipeline parallelism** | Assign layers to devices sequentially; bubble overhead during decode |
| **Data parallelism** | Replicate full model; each device serves different requests |
| **Sequence parallelism** | Split long sequences across devices during prefill |

Most large-scale deployments combine tensor and pipeline parallelism.

## Key Takeaways

- Prefill is compute-bound; decode is memory bandwidth-bound — they require different optimisation strategies and can benefit from being run on separate hardware.
- Quantisation is the most universally applicable model-level optimisation; INT8 is often lossless, INT4 requires more care.
- Speculative decoding offers substantial latency reduction (>50%) when a fast draft model with high acceptance rate is available; inference with reference is a simpler alternative for retrieval/coding tasks.
- Continuous batching is the baseline for production serving — it eliminates head-of-line blocking and improves GPU utilisation.
- KV cache management dominates memory at large batch sizes/sequence lengths; PagedAttention and attention variants (GQA, MQA) are the primary mitigations.
- Prompt caching yields the largest practical cost savings for applications with long, stable system prompts.

## Related Concepts

- [[concepts/finetuning]] — quantisation appears in both training and inference; QLoRA bridges them
- [[concepts/foundation-models]] — model architecture choices (MQA, GQA, MoE) directly affect inference cost
- [[concepts/ai-engineering-architecture]] — inference optimisation is one layer of the broader AI application architecture
- [[concepts/dataset-engineering]] — distillation produces smaller models optimised for inference cost

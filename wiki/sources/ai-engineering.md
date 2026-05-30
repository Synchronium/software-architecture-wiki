---
title: "AI Engineering"
type: source
tags: [ai, llm, foundation-models, machine-learning, inference, rag, agents, prompt-engineering, finetuning]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# AI Engineering

**Authors:** [[authors/chip-huyen]]
**Published:** 2024
**Slug:** `ai-engineering`

## Overview

AI Engineering, by Chip Huyen, is a comprehensive guide to building production applications on top of foundation models (large language models and multimodal models). It distinguishes AI engineering from traditional ML engineering: where ML engineering builds models, AI engineering adapts and orchestrates existing ones. The book argues that the availability of powerful foundation models via APIs has dramatically lowered the barrier to building AI applications, creating a fast-growing engineering discipline.

The book is structured around the full AI engineering lifecycle: understanding how models work, evaluating them systematically, adapting them via prompt engineering and RAG, finetuning them for specific tasks, engineering training datasets, optimising inference, and designing feedback loops. It emphasises evaluation as a first-class concern and treats the probabilistic, non-deterministic nature of LLMs as the central challenge that every technique must address.

The intended audience is engineers building AI applications — particularly those coming from software engineering or ML backgrounds who want a systematic framework rather than ad-hoc experimentation.

## Key Claims

- AI engineering = building applications on top of foundation models; it differs from ML engineering chiefly in that it adapts models rather than building them (→ ch. 1)
- Foundation models are general-purpose; task-specific adaptation is cheaper than building models from scratch (→ ch. 1)
- Evaluation is the most important and underrated activity in AI engineering — open-ended outputs make it much harder than in classical ML (→ ch. 1, 3)
- The probabilistic, sampling-based nature of LLMs is the root cause of hallucination and inconsistency (→ ch. 2)
- Scaling law (Chinchilla): for compute-optimal training, training tokens should be ~20× the number of parameters (→ ch. 2)
- Post-training (SFT + preference finetuning) uses only ~2% of the compute of pre-training but dramatically improves usability and alignment (→ ch. 2)
- Sampling variables (temperature, top-k, top-p) are underappreciated levers that significantly affect model behaviour (→ ch. 2)
- Test-time compute — generating multiple outputs and selecting the best — can substitute for larger model size (→ ch. 2)

## Chapter Notes

### Chapter 1 — Introduction to Building AI Applications with Foundation Models

Traces the evolution from language models → LLMs → foundation models (multimodal). Defines AI engineering and distinguishes it from traditional ML engineering. Three factors driving its growth: general-purpose capabilities, increased investment, and low entry barrier via model-as-a-service APIs.

Surveys use cases across eight categories: coding, image/video production, writing, education, conversational bots, information aggregation, data organisation, workflow automation. Notes the enterprise preference for internal-facing applications first, and for close-ended (classification) tasks over open-ended ones, as they are easier to evaluate.

Introduces planning considerations: use case evaluation, AI product defensibility (technology, data, distribution moats), the last-mile challenge (demo → production gap), and maintenance challenges including rapid pace of change, regulations, and IP uncertainty.

Describes the three-layer AI engineering stack: application development (evaluation, prompt engineering, AI interface), model development (modelling/training, dataset engineering, inference optimisation), and infrastructure (serving, data, compute, monitoring). Notes that the application development layer is the most differentiated for most organisations — it is where competitive advantage is created when models are commodities.

### Chapter 2 — Understanding Foundation Models

Covers training data, model architecture, model scale, post-training, sampling, and the probabilistic nature of AI.

**Training data:** Common Crawl is the dominant source, but its quality is poor and its language distribution is heavily English-biased. English accounts for ~46% of Common Crawl; many high-population languages (Punjabi, Swahili, Urdu, Bengali) are under-represented by 50–200×. This creates meaningful performance gaps: GPT-4 performs much better in English than in Telugu or Burmese. Under-representation also makes inference more expensive for under-resourced languages (Burmese requires ~10× the tokens of English for the same content).

**Transformer architecture:** Addresses seq2seq's limitations — slow sequential processing and relying only on the final hidden state. Introduces the attention mechanism (Q/K/V vectors), which allows the model to attend to any prior token when generating each output. Inference has two phases: prefill (parallel input processing) and decode (sequential token generation). This asymmetry motivates many inference optimisation techniques. The KV cache (storing key and value vectors across decoding steps) is central to inference efficiency.

**Model architecture alternatives:** RWKV (RNN-based, parallelisable for training), SSMs (state space models, better long-range memory), Mamba (SSM scaled to 3B params, linear scaling with sequence length), Jamba (hybrid transformer/Mamba). None have yet displaced the transformer in practice.

**Model scale:** Three proxy metrics: number of parameters (learning capacity), number of training tokens (knowledge acquired), and FLOPs (training cost). Mixture-of-experts (MoE) models (e.g. Mixtral 8×7B) have large total parameter counts but activate only a fraction per token, making them cheaper to run than their parameter count suggests. Scaling bottlenecks: publicly available training data may be exhausted within a few years; data centres already consuming 1–2% of global electricity, projected to reach 4–20% by 2030.

**Scaling law (Chinchilla):** For compute-optimal training, training tokens ≈ 20× number of parameters. Both model size and dataset size should be scaled equally. Meta's Llama opted for smaller models (better inference economics) at the cost of slightly suboptimal training performance. For production, inference cost matters as much as training-time optimality.

**Post-training:** Two steps: (1) Supervised finetuning (SFT) on demonstration data (prompt, response) pairs to shift from completion to conversation. (2) Preference finetuning to align with human preference. RLHF trains a reward model on comparison data (winning vs losing responses) then uses PPO to maximise reward model scores. DPO is a simpler alternative (Llama 3 switched from RLHF to DPO). Post-training uses only ~2% of pre-training compute.

**Sampling:** Each output token is sampled from a probability distribution over the vocabulary. Temperature scales logits before softmax — higher temperature increases diversity but reduces coherence. Top-k restricts sampling to the k most likely tokens. Top-p (nucleus sampling) restricts to the smallest set whose cumulative probability exceeds p. Test-time compute generates multiple outputs and selects the best via reward model, highest average logprob, or majority voting.

**Structured outputs:** Techniques to force outputs to follow a specific format: prompting (unreliable), post-processing (cheap, works for small corrections), constrained sampling (filters logits to valid tokens per grammar), finetuning (most reliable). LinkedIn's defensive YAML parser improved correct output rate from 90% to 99.99%.

**Probabilistic nature:** Inconsistency (same prompt → different outputs) and hallucination are both consequences of sampling. Two hypotheses for hallucination: (1) self-delusion — the model conditions on its own generated text as if it were ground truth, allowing errors to snowball; (2) training–knowledge mismatch — SFT labellers include knowledge the model doesn't have, teaching it to fill gaps with plausible-sounding but false content.

### Chapter 3 — Evaluation Methodology

Covers the theory and metrics underlying AI evaluation, establishing why evaluation is uniquely difficult for foundation models and what measurement tools exist.

**Why evaluation is hard:** Four factors — multi-dimensional intelligence (no single metric captures capability), open-ended outputs (no fixed ground truth), black-box models (API-only access, no interpretability), and benchmark saturation (models trained on test data inflate scores; ceilings make discrimination hard).

**Language modelling metrics:** Entropy measures predictability of a distribution; cross entropy H(P,Q) = H(P) + KL(P‖Q) is the training objective and equals entropy only when model Q = true distribution P. Perplexity (PPL = 2^H or e^H) is the exponentiated average cross entropy per token — PPL = K means the model chooses uniformly among K tokens. Used for model comparison, data contamination detection, and deduplication; not a proxy for output quality. BPC/BPB normalise by character/byte to allow cross-tokeniser comparison.

**Functional correctness:** For code generation: pass@k = probability that at least 1 of k samples passes all tests. Unbiased estimator: 1 − C(n−c, k)/C(n, k). Common settings: pass@1 (production quality), pass@10 or pass@100 (capability ceiling).

**Similarity measurements:** Exact match, lexical similarity (BLEU, ROUGE with n-gram overlap), semantic similarity (embedding cosine similarity). BLEU measures n-gram precision (machine translation); ROUGE measures recall. Both weakly correlate with human preference for open-ended tasks.

**Embeddings:** Dense vectors placing semantically similar content close together. Key models: BERT (contextualised text), Sentence Transformers (sentence-level), CLIP (text+image shared space), ULIP/ImageBind (broader multimodal). Cosine similarity is the standard distance metric.

**AI as a judge:** LLM-based evaluation. Speed/cost advantage over human judges; GPT-4 agrees with humans ~85% of the time. Key biases: self-bias (models prefer their own outputs), first-position bias (preference for whichever candidate appears first), verbosity bias (preference for longer answers). Specialised judges: reward models (trained on win/loss triples, output scalar score), reference-based judges (fact-checking against known answer), preference models (win probability for pairwise comparison).

**Comparative evaluation:** Pairwise comparisons ranked by Elo, Bradley-Terry (more principled), or TrueSkill (Bayesian). LMSYS Chatbot Arena is the de facto public leaderboard using Bradley-Terry on volunteer pairwise ratings. Challenges: O(n²) scaling, quality control, transitivity assumption violations, gap between pairwise winner and best on specific tasks.

### Chapter 4 — Evaluate AI Systems

Applies the theoretical evaluation tools from Chapter 3 to real application development. Introduces **evaluation-driven development**: define evaluation criteria before building — applications without a clear evaluation pipeline are worse than undeployed applications (they consume maintenance cost with no visibility into whether they work).

**Evaluation criteria taxonomy:** Four buckets — domain-specific capability (can the model do the task?), generation capability (factual consistency, safety, fluency), instruction-following capability (does output match requested format/constraints?), and cost/latency (time to first token, total query time, TPM, cost per token).

**Factual consistency:** Two settings — local (against provided context; used in RAG, summarisation) and global (against world knowledge; used in chatbots). Evaluation ladder: AI judge → SelfCheckGPT (self-verification by sampling N outputs and checking consistency) → SAFE (Google DeepMind: decompose → make statements self-contained → search-augment → judge). Can also frame as textual entailment (entailment/contradiction/neutral). TruthfulQA benchmark: 817 questions covering 38 categories; human experts 94%, GPT-3 ~58%.

**Safety:** Six categories (inappropriate language, harmful recommendations, hate speech, violence, stereotypes, political bias). General-purpose judges or specialised classifiers (Perspective API, Facebook hate-speech model). Benchmarks: RealToxicityPrompts (100K prompts), BOLD. Note: GPT-4 leans left-wing/libertarian, Llama leans authoritarian (Feng et al., 2023; Motoki et al., 2023).

**Instruction-following:** IFEval (25 auto-verifiable instruction types: keyword inclusion, length constraints, JSON format, bullet count) and INFOBench (broader: content constraints, linguistic style, tone; verified by AI judge yes/no questions per criterion). Recommendation: build a custom instruction benchmark specific to your application's needs.

**Model selection workflow:** Four steps: (1) filter by hard attributes (licence, data privacy, on-device, latency); (2) screen with public benchmarks; (3) run private evaluation pipeline; (4) monitor in production. Iterative — decisions from early steps can be reversed by later information.

**Open source vs model API (seven axes):** data privacy, data lineage/copyright, performance (proprietary will likely remain ahead — incentives favour keeping best models behind APIs), functionality (APIs: better scaling/function-calling/structured outputs; self-hosted: logprob access, finetuning flexibility), cost (API: per-token; self-host: high fixed engineering cost), control/access/transparency (API risk: opaque versioning, rate limits, loss of access; self-host risk: operational burden), on-device deployment.

**Public benchmark navigation:** thousands of benchmarks but all have issues — data contamination (detectable via n-gram overlap or perplexity), saturation (benchmarks designed pre-frontier become ceilings), selection ambiguity (HuggingFace LLM Leaderboard and HELM share only 2 of 10 benchmarks), correlation problem (WinoGrande/MMLU/ARC-C highly correlated; inflates that dimension). Use public leaderboards to filter; run private evaluation to select.

**Designing a private evaluation pipeline (four steps):** (1) evaluate all components — end-to-end AND each intermediate stage; per-turn AND per-task; (2) create evaluation guideline — define good and bad, scoring rubrics with examples, validate with humans, tie to business metrics (map factual consistency % to automation %; set usefulness threshold); (3) define evaluation methods and data — mix cheap classifiers on 100% data with expensive AI judges on 1%; slice data by user tier/failure mode/out-of-scope; bootstrap to test reliability; sample size: ~100 examples to detect 10% difference at 95% confidence, ~1,000 for 3%, ~10,000 for 1%; (4) evaluate the evaluation pipeline — check reproducibility, metric correlation, cost/latency overhead, and whether better model outputs actually score higher.

### Chapter 5 — Prompt Engineering

Covers both how to write effective prompts and how to defend applications against prompt attacks.

**Prompt anatomy:** task description, examples (shots), the task, and context. System prompt vs user prompt — both concatenated under the hood; system prompt advantage comes from position (first) and post-training to prioritise it. Chat templates differ across model families and versions; wrong template causes silent failure.

**In-context learning:** few-shot learning demonstrated in GPT-3 paper (Brown et al. 2020). Zero-shot vs few-shot vs k-shot. François Chollet: a foundation model is a library of programs activated by prompts. ICL as continual learning — context can override training cut-off date.

**Best practices:** write clear explicit instructions (specify output format, persona, what to do with edge cases); provide context; use compact example formats to save tokens; use end-of-prompt markers for structured outputs. Break complex tasks into subtask chains (prompt decomposition) for monitoring, debugging, parallelisation, and cost optimisation. Give the model time to think via chain-of-thought (Wei et al. 2022): "think step by step" reduces hallucination (LinkedIn), costs more tokens. Self-critique (self-eval). Iterate systematically with versioned prompts, experiment tracking, and full-pipeline evaluation.

**Prompt tooling:** DSPy, OpenPrompt, Promptbreeder (evolutionary mutation), TextGrad. Cautions: hidden API calls multiply costs; tool bugs are common (wrong templates, typos, token concatenation). Principle: write prompts manually first; inspect all tool-generated prompts.

**Defensive prompt engineering:** three attack categories — (1) prompt extraction: reverse prompt engineering by tricking model into repeating system prompt; (2) jailbreaking/injection: direct manual attacks (obfuscation, output formatting manipulation, roleplaying/DAN), automated attacks (PAIR: AI attacker generates prompts iteratively, <20 queries to jailbreak), indirect prompt injection (malicious instructions in tool outputs — web pages, emails, database records); (3) information extraction: training data extraction (Nasr et al. 2023; ~1% memorisation rate; repeated token attack), copyright regurgitation, PII probing.

**Defences:** model level (instruction hierarchy: system > user > model output > tool output; OpenAI's approach, 63% robustness improvement); prompt level (explicit prohibitions, repeat system prompt, warn about specific attacks); system level (code sandbox isolation, human approval for DB mutations, topic filters, output guardrails). Two key security metrics: violation rate and false refusal rate.

### Chapter 6 — RAG and Agents

Covers context construction patterns: RAG for retrieval and agents for broader tool use.

**RAG motivation:** long contexts don't eliminate RAG because data grows without bound, models perform poorly in the middle of very long contexts (Liu et al. 2023), and per-token cost/latency matters. Anthropic: if knowledge base < 200,000 tokens, include everything directly.

**Retrieval algorithms:** term-based (TF-IDF, BM25, Elasticsearch inverted index — fast, cheap, strong baseline) vs embedding-based (semantic — FAISS/HNSW/Annoy/IVF; cosine similarity; more powerful but 20–50% of model API spend in vector DB alone). Hybrid search (sequential cascade or parallel RRF) is the production norm.

**Retrieval optimisation:** chunking strategy (unit, size, overlap; recursive splitting; overlap prevents boundary cuts); reranking (cascade: cheap filter then expensive rerank; recency boost for time-sensitive apps); query rewriting (rewrite ambiguous follow-ups into standalone queries using another model); contextual retrieval (Anthropic: prepend 50–100 token AI-generated context summary to each chunk before indexing).

**Evaluation:** context precision (retrieved docs that are relevant) and context recall (relevant docs that are retrieved); NDCG/MAP/MRR for ranking; MTEB for embedding quality; end-to-end factual consistency.

**Beyond text:** multimodal RAG (CLIP for cross-modal embedding search); tabular RAG (text-to-SQL → SQL execution → generation).

**Agents:** defined by environment + tool inventory + planning capability. Three tool categories: knowledge augmentation (retrieval, web search, SQL), capability extension (calculator, code interpreter, image captioner), write actions (email send, DB mutations — require explicit human approval). Function calling is the API mechanism for tool use.

**Planning:** plan generation (prompt with CoT + few-shot examples); validate plans before execution; natural language plans (more robust to tool API changes); control flows (sequential, parallel, if-statement, for-loop); ReAct framework (Yao et al. 2022: thought/act/observation interleaved); Reflexion (Shinn et al. 2023: dedicated evaluator + self-reflection module to propose new trajectories). Multi-agent: planner, evaluator, executor, intent classifier as separate components.

**Agent failure modes:** invalid tool, invalid parameters, incorrect parameter values, goal failure (wrong constraint), reflection error (agent incorrectly believes task is done); tool failures (wrong outputs, translation errors); efficiency failures (excessive steps/cost).

**Memory:** internal knowledge (weights) + short-term memory (context) + long-term memory (external storage via retrieval). Management: FIFO, summarisation, reflection-based (insert/merge/replace). Memory management is essential for agents to handle information overflow within and across sessions.

**LLM planning debate:** Yann LeCun / Kambhampati: autoregressive LLMs cannot plan; counter: LLMs encode world models (Hao et al. 2023) and can backtrack by replanning; FM agents and RL agents expected to converge.

### Chapter 7 — Finetuning

Covers when and how to finetune foundation models. Frames finetuning as one point in the model adaptation ladder: prompt engineering → few-shot → RAG → finetuning → train from scratch.

**When to finetune:** for behavioural failures (wrong format, wrong style, wrong specificity); not for information failures (use RAG). "Finetuning is for form, RAG is for facts." (Ovadia et al., 2024). Core tension: finetuning on task A can degrade performance on tasks B and C.

**Memory bottleneck:** inference memory = N × M × 1.2 (parameters + activations + KV cache). Training memory additionally includes gradients and optimiser states; Adam requires 3× memory per trainable parameter beyond weight storage. A 13B model: ~31 GB for inference, ~56 GB+ for full finetuning. Gradient checkpointing trades compute for memory.

**Numerical representations:** FP32 (standard training), FP16/BF16 (16-bit; different range/precision trade-offs; Llama 2 is BF16 — loading in FP16 causes silent quality degradation), TF32 (NVIDIA GPU optimised), INT8/INT4 (extreme quantisation). BitNet b1.58: 1.58 bits/parameter, performance comparable to 16-bit Llama 2 up to 3.9B params.

**Quantisation:** PTQ (post-training quantisation) is the norm; QAT (quantisation-aware training) produces better inference quality but doesn't reduce training cost. Reduced precision reduces memory and can improve throughput.

**PEFT (parameter-efficient finetuning):** Houlsby et al. (2019) — within 0.4% of full finetuning at 3% of trainable parameters. Two families: adapter-based (add modules; LoRA dominates) and soft prompt-based (trainable continuous tokens; less popular).

**LoRA:** Decomposes weight matrix W (n×m) into A (n×r) × B (r×m); W′ = W + (α/r)AB; only A and B are trained. GPT-3: comparable performance with 0.0027% of full finetuning trainable parameters. Rank r: 4–64 typically sufficient; increasing r rarely helps. Apply to attention matrices W_q, W_k, W_v, W_o; feedforward layers also valuable. Multi-LoRA serving keeps adapters separate from base model — 100 customers: 23.3M params vs 1.68B for merged option. QLoRA stores base in 4-bit NF4, enabling 65B finetuning on a single 48 GB GPU.

**Model merging:** combine multiple finetuned models into one. Approaches: summing (linear combination / model soups; SLERP; TIES/DARE prune redundant task vector parameters first), layer stacking (frankenmerging; used to build MoEs from dense checkpoints; Goliath-120B from two 70B models), concatenation (not recommended — no memory saving). Task arithmetic: add/subtract task vectors (delta = finetuned − base) to add/remove capabilities.

**Practical tactics:** development paths — progression (cheapest→strongest, map price/performance frontier) and distillation (strongest model→synthetic data→smaller model). Key hyperparameters: learning rate (1e-7 to 1e-3), batch size (larger = more stable; gradient accumulation for constrained hardware), epochs (1–2 for millions; 4–10 for thousands), prompt loss weight (~10% default — model learns mostly from responses).

### Chapter 8 — Dataset Engineering

Covers the data lifecycle for finetuning: curation, acquisition, synthesis, and processing.

**Data-centric AI:** the shift from model-centric (better architectures) to data-centric (better datasets for same model). Llama 3's improvements over Llama 2 are primarily from data quality and diversity improvements, not architecture changes.

**Three core criteria:** (1) Quality — six dimensions: relevant, aligned, consistent, correctly formatted, sufficiently unique, compliant. 10K carefully crafted instructions > 100K noisy ones (Yi model); 1,000 LIMA examples match GPT-4 in 43% of comparisons. (2) Coverage — domain, task, linguistic, format diversity; performance gains plateau around 282 finetuning tasks but remain positive. (3) Quantity — full finetuning: tens of thousands to millions; PEFT: hundreds to thousands; stronger base models need fewer examples; use 50-example pilot before committing to large dataset.

**Data acquisition:** Own application data is highest priority (matches production distribution, enables data flywheel). Public datasets (Hugging Face, Kaggle, data.gov). Annotation guidelines are as hard to create as annotations themselves.

**Data synthesis:** augmentation (derives from real data) vs synthesis (generates from scratch). Traditional methods: rule-based templates (Faker); image augmentation (rotate/crop/flip/perturb); simulation (CARLA for autonomous driving; self-play for game agents — OpenAI Dota 2: 180 years of games per day). AI-powered: paraphrasing/translation (MetaMath: 15K → 400K examples; outperforms larger models); instruction synthesis (Self-Instruct seed → Alpaca's 52K examples); reverse instruction (take long content → generate the prompt that would elicit it — avoids AI hallucinations in responses); model bootstrapping (Li et al. 2023: weak model → generate instructions for high-quality content → finetune → repeat).

**Llama 3 synthesis pipeline:** generate problem descriptions → generate solutions → AI unit tests → AI self-correction → code translation + filtering → code back-translation + filtering → 2.7M synthetic coding examples.

**Limitations of synthetic data:** quality control (can't always verify); superficial imitation (Gudibande et al. 2023: style without factual accuracy); model collapse (Shumailov et al. 2023: recursive AI-generated training causes irreversible quality degradation; mix with real data to mitigate); obscure data lineage (inherited copyright/contamination from teacher models).

**Model distillation:** train small student on large teacher's outputs. DistilBERT: 40% smaller, 97% capability, 60% faster. Distillation requires checking teacher model's licence.

**Data processing pipeline:** inspect (statistics, manual review, inter-annotator disagreement), deduplicate (MinHash/Bloom filter/semantic similarity; 0.1% data repeated 100× degrades 800M model to 400M performance), clean and filter (HTML removal → +20% accuracy at Databricks; PII/toxicity removal), format (apply correct chat template — wrong template causes silent bugs; finetuned model prompts can be much shorter than prompt-engineered equivalents).

### Chapter 9 — Inference Optimization

Covers the computational bottlenecks of LLM serving and how to address them at the model, hardware, and service levels.

**Two bottlenecks:** prefill (process prompt) is compute-bound; decode (generate tokens one by one) is memory bandwidth-bound. They have fundamentally different optimisation profiles. The key metrics are TTFT, TPOT, total latency, throughput, goodput, MFU (FLOP/s utilisation), and MBU (memory bandwidth utilisation).

**GPU memory hierarchy:** CPU DRAM (25–50 GB/s) → GPU HBM (256 GB/s – 1.5 TB/s) → GPU SRAM (>10 TB/s). Matrix multiplication >90% of neural network FLOPs; memory bandwidth is the binding constraint during decode.

**Model-level techniques:**
- **Quantisation** (most popular): PTQ after training; QAT during training. INT8 generally lossless; INT4 requires more care.
- **Pruning:** removes small-magnitude weights; requires hardware sparse matrix support to realise gains.
- **Speculative decoding:** fast draft model generates K tokens → target model verifies in parallel (same compute profile as prefill). DeepMind 4B draft for Chinchilla-70B: >50% latency reduction. *Inference with reference*: draft tokens from input context (not a separate model) — ~2× speedup for retrieval/coding/multi-turn.
- **Parallel decoding:** Lookahead (Jacobi method); Medusa (multiple decoding heads; ~1.9× speedup on Llama 3.1).

**KV cache:** size formula `2 × B × S × L × H × M`; grows linearly with sequence length. Llama 2 13B at batch=32, seq=2048: ~54 GB. Variants to reduce it: MQA, GQA (generalises MQA), cross-layer attention, windowed attention. Character.AI: >20× reduction. PagedAttention (vLLM): non-contiguous blocks, eliminates fragmentation. FlashAttention: hardware-aware fused kernel that avoids materialising the full attention matrix.

**Service-level techniques:**
- **Batching:** static → dynamic (time window) → continuous/in-flight (Orca paper — per-step scheduling, no head-of-line blocking). Continuous batching is the production standard.
- **Prefill/decode decoupling:** separate GPU instances per phase; ratio 2:1 to 4:1 for long inputs.
- **Prompt caching:** reuse KV cache for identical system prompts. Anthropic: 90% cost reduction, 75% latency reduction. Google Gemini: 75% cost discount + storage fee.
- **Deployment economics:** online APIs (latency-optimised) vs batch APIs (50% cost discount, hours turnaround).

### Chapter 10 — AI Engineering Architecture and User Feedback

Covers the five-step progressive architecture for production AI applications and the feedback systems that enable continuous improvement.

**Five-step progressive architecture:**
1. Enhance context (RAG, tools)
2. Guardrails (input: PII masking + reverse dictionary; output: format, factual consistency, toxicity, brand-risk; retry logic; human fallback)
3. Model router (intent classifier → specialised models; fast/cheap: GPT-2/BERT/Llama 7B) + model gateway (unified API; access control; fallback policies; logging — examples: Portkey, MLflow AI Gateway, Kong, Cloudflare)
4. Caching (exact: LRU/LFU/FIFO; semantic: embedding + threshold — higher failure risk; data-leak risk for personalised responses shared across users)
5. Agent patterns

**Monitoring:**
- Key incident metrics: MTTD, MTTR, CFR.
- **Model drift** is the critical AI-specific risk: system prompt changes, user behaviour shifts, and provider-side model updates all change behaviour silently. Chen et al. (2023): notable GPT-4 March vs June 2023 differences. Voiceflow: 10% drop across GPT-3.5 versions. Mitigation: version pinning, continuous evals on live traffic.

**Orchestration frameworks:** LangChain, LlamaIndex, Flowise, Langflow, Haystack. Start without one; add when complexity justifies it.

**User feedback:** the data flywheel. Explicit (thumbs, stars, comments) vs implicit (early termination, error correction, complaints, regeneration request, conversation length/diversity). User edits = direct DPO preference pairs (original = loser, edit = winner).

**Feedback design:** non-intrusive collection; action-correlated signals (Midjourney grid; GitHub Copilot Tab=accept, continue=reject). Biases: leniency (Uber average 4.8; <4.6 risks deactivation), randomness, position, preference (length/flattery), recency.

**Degenerate feedback loops:** exposure bias amplifies distribution; sycophancy (Sharma et al. 2023 — RLHF models favour users' stated views). Mitigate with blind comparison studies and output diversity monitoring.

## Notable Quotes

> "AI engineering—the process of building applications on top of readily available models—[has become] one of the fastest-growing engineering disciplines." (ch. 1)

> "The journey from 0 to 60 is easy, whereas progressing from 60 to 100 becomes exceedingly challenging." (ch. 1, citing Ding et al., 2023)

> "In AI, there are generally three types of competitive advantages: technology, data, and distribution." (ch. 1)

> "Foundation models are aggregations of the opinions of the masses, containing within them, literally, a world of possibilities. Anything with a non-zero probability, no matter how far-fetched or wrong, can be generated by AI." (ch. 2)

## Related Pages

- [[concepts/foundation-models]] — what foundation models are and how they work
- [[concepts/ai-engineering]] — AI engineering as a discipline
- [[concepts/llm-sampling]] — sampling strategies and the probabilistic nature of LLMs
- [[concepts/prompt-engineering]] — ch. 5
- [[concepts/rag]] — ch. 6

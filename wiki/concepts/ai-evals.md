---
title: "AI Evaluation"
type: concept
tags: [ai, llm, evaluation, evals, benchmarks, embeddings, perplexity, hallucination, metrics]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# AI Evaluation

## Definition

AI evaluation is the discipline of measuring the quality of AI system outputs — covering both the underlying foundation model and the end-to-end application built on top of it. Because foundation model outputs are open-ended rather than a fixed label, evaluation is substantially harder than in classical ML and requires explicit investment. (→ [[sources/ai-engineering]] ch. 3–4)

## Why Evaluation Is Hard

Four properties of foundation models make them difficult to evaluate:

1. **Intelligence is multi-dimensional.** There is no single agreed metric for general-purpose capability — models can excel on some benchmarks while failing on others.
2. **Open-ended outputs.** Classical ML has a ground truth label per input; foundation model outputs are free-form text, images, or code. Correctness is often a matter of degree, not kind.
3. **Black-box models.** Many frontier models are accessible only via API; their internals are unavailable. Researchers cannot inspect weight distributions or attributions.
4. **Benchmark saturation.** Models can be deliberately or inadvertently trained on benchmark data (data contamination), inflating reported scores. Even valid benchmarks often cluster models at ceiling, making discrimination difficult.

## Language Modelling Metrics

These metrics measure how well a model fits a reference distribution. They are used for model comparison, data contamination detection, deduplication, and anomaly detection — not for evaluating whether specific outputs are good.

### Entropy and Cross Entropy

- **Entropy H(P):** average bits needed to encode a symbol from distribution P using an optimal code. Low entropy = predictable distribution.
- **Cross entropy H(P,Q):** average bits needed to encode samples from P using a code optimised for Q. Decomposes as: **H(P,Q) = H(P) + KL(P‖Q)**. The KL divergence term is zero only when P = Q, so cross entropy is always ≥ entropy. During training, minimising cross entropy between the data distribution and the model is equivalent to minimising KL divergence.

### Perplexity

Perplexity (PPL) is the exponentiated average cross entropy per token:

- **PPL = 2^H** (log base 2) or **PPL = e^H** (natural log), depending on convention.

Interpretation:
- PPL = 1 → perfect prediction (model assigns all probability to the correct next token).
- PPL = K → the model is effectively choosing uniformly among K candidates at each step.
- Lower perplexity = better fit to the reference distribution.

**Perplexity is useful for:** comparing models on the same held-out dataset; detecting data contamination (suspiciously low perplexity on a benchmark suggests training overlap); deduplication (high similarity between training and test data).

**Limitations:** perplexity does not measure whether outputs are helpful, accurate, or safe — a model can have low perplexity while hallucinating. It is also not comparable across different tokenisers.

### Bits per Character / Bits per Byte

BPC and BPB normalise perplexity by character or byte count rather than token count, making it comparable across models with different tokenisers. Useful for multilingual comparisons where tokenisation efficiency varies significantly.

## Exact Evaluation Methods

### Functional Correctness

Used primarily for code generation. A generated program is correct if it passes a test suite. The **pass@k** metric is the probability that at least one of k generated samples passes all tests:

**pass@k = 1 − C(n−c, k) / C(n, k)**

where n is the number of samples generated, c is the number that pass. Direct computation is high-variance; the formula above is an unbiased estimator. Common choices: pass@1 (production quality), pass@10 or pass@100 (ceiling capability).

### Similarity Measurements

When a reference answer exists, generated outputs can be compared against it:

| Method | Approach | Limitation |
|--------|----------|------------|
| Exact match | Binary string equality | Too strict; misses paraphrase |
| Lexical similarity (BLEU, ROUGE) | N-gram overlap | Misses semantic equivalence; rewards surface patterns |
| Semantic similarity | Embedding cosine similarity | Requires a good embedding model; can conflate near-synonyms |

**BLEU** was designed for machine translation; it measures n-gram precision (with a brevity penalty). **ROUGE** measures n-gram recall; ROUGE-L additionally uses longest common subsequence. Both are standard in NLP benchmarks but correlate poorly with human preferences for open-ended generation.

## Embeddings

An embedding is a dense real-valued vector representing a piece of content (text, image, audio). Well-trained embeddings place semantically similar content close together in the vector space.

Key embedding models:
- **BERT** — bidirectional transformer encoder; produces contextualised text embeddings.
- **Sentence Transformers** — fine-tuned BERT variants optimised for sentence-level similarity.
- **CLIP** — multimodal; maps text and images into a shared embedding space, enabling cross-modal similarity search.
- **ULIP / ImageBind** — multimodal embeddings covering text, image, audio, video, depth, and other modalities.

**Cosine similarity** is the standard distance measure for embeddings: **cos(u, v) = (u·v) / (‖u‖ ‖v‖)**. Values range from −1 (opposite) to +1 (identical direction). Cosine similarity is preferred over Euclidean distance for high-dimensional sparse embeddings.

Embeddings are used for: semantic similarity evaluation, RAG retrieval (→ [[concepts/rag]]), classification, clustering, de-duplication of training data, and anomaly detection.

## AI as a Judge

Rather than relying on human evaluation (slow, expensive) or lexical metrics (shallow), an LLM can act as an evaluator — judging whether another model's output is good.

**Advantages:**
- Orders of magnitude faster and cheaper than human evaluation.
- Can apply nuanced criteria specified in natural language.
- GPT-4 agreement with human labels reaches ~85% in published studies.

**Limitations:**
- Inconsistency: the same prompt can produce different judgements across runs.
- Criteria ambiguity: abstract rubrics (e.g. "helpfulness") lead to variable interpretation.
- Additional cost and latency in the evaluation pipeline.

**Known biases:**
- **Self-bias (self-enhancement bias):** models prefer their own outputs when acting as judges.
- **First-position bias:** models tend to prefer the first candidate in a pairwise comparison.
- **Verbosity bias:** models favour longer, more detailed responses regardless of accuracy.

Mitigation: randomise candidate ordering; run multiple evaluations with different orderings; use specialised judge models (reward models) trained explicitly for evaluation rather than general-purpose LLMs.

### Specialised Judge Types

| Judge type | Trained on | Output | Use case |
|------------|-----------|--------|----------|
| Reward model | (prompt, winner, loser) triples | Scalar score | RLHF training signal; response ranking |
| Reference-based judge | Examples with reference answers | Correctness judgement | Fact-checking, summarisation quality |
| Preference model | Human pairwise preferences | Win probability | Arena-style comparisons |

## Comparative Evaluation

Rather than scoring outputs in isolation (pointwise), comparative evaluation ranks candidates against each other (pairwise), which is often more reliable — humans find relative judgements easier to make consistently than absolute scores.

### Pairwise Comparisons

Present two model outputs for the same prompt; ask which is better. Repeat across many (prompt, model-A, model-B) triples. Aggregate using a rating algorithm:

- **Elo:** standard chess rating; updated after each game; simple but assumes transitivity and equilibrium.
- **Bradley-Terry:** probabilistic pairwise model; more statistically principled than Elo.
- **TrueSkill:** Bayesian rating that handles uncertainty; better for sparse comparison graphs.

### LMSYS Chatbot Arena

A large-scale public leaderboard that gathers pairwise human preferences via a chat interface. Users rate pairs of anonymised model responses; votes feed a Bradley-Terry ranker. As of 2024, it is the most widely cited comparative evaluation platform for open-ended chat.

**Challenges:**
- **Scalability:** pairwise comparisons scale as O(n²) in the number of models.
- **Quality control:** volunteer raters vary in quality and may be gamed.
- **Transitivity assumption:** if A > B and B > C, it does not follow that A > C in all respects.
- **Pointwise–comparative gap:** a model rated best in pairwise comparison is not necessarily best on all tasks.

## Evaluation Criteria for Applications

Chapter 4 (Huyen) introduces **evaluation-driven development**: define evaluation criteria before building — analogous to test-driven development. Applications with unclear evaluation criteria are, paradoxically, worse than undeployed applications: they consume maintenance cost with no insight into whether they are working.

Four evaluation criterion buckets:

1. **Domain-specific capability** — can the model do the underlying task (code, math, legal reasoning)?
2. **Generation capability** — factual consistency, safety, fluency, coherence.
3. **Instruction-following capability** — does the model produce outputs that match the requested format and constraints?
4. **Cost and latency** — time to first token, time per total query, cost per output token, tokens per minute (scale).

### Factual Consistency

Two settings:
- **Local** — output evaluated against explicitly provided context (summarisation, RAG). Easier: context is given.
- **Global** — output evaluated against open world knowledge (general chatbots, fact-checking). Harder: requires first retrieving relevant facts.

Evaluation methods in ascending sophistication:
- **AI as a judge** with a factual consistency prompt (GPT-4 outperforms prior specialised metrics in studies).
- **Self-verification (SelfCheckGPT)** — generate N alternative outputs; if they disagree with the original, the original is likely hallucinated. Expensive.
- **Knowledge-augmented verification (SAFE, Google DeepMind)** — decompose output into statements → make each self-contained → issue search queries → judge consistency against search results.
- **Textual entailment** — frame factual consistency as a classification task (entailment / contradiction / neutral). Specialised models (e.g. DeBERTa-v3-base-mnli-fever-anli, 184 M parameters) can be fine-tuned for this.

Benchmark: **TruthfulQA** — 817 questions spanning 38 domains that humans commonly answer incorrectly. Comes with GPT-judge, a finetuned evaluator. GPT-3 achieves ~58%; human experts ~94%.

### Safety

Six categories of unsafe outputs: inappropriate language, harmful recommendations, hate speech, violence, stereotypes, political/religious bias. Multiple studies (Feng, Motoki, Hartman 2023) show that models carry measurable political biases baked in from post-training.

Evaluation options: general-purpose AI judges (Claude, GPT-4) with appropriate prompts; specialised classifiers trained on toxicity detection (Facebook hate speech, Perspective API, Skolkovo toxicity); benchmarks RealToxicityPrompts (100K naturally occurring prompts) and BOLD.

### Instruction-Following

Instruction-following capability is whether the model follows the format/constraint constraints given, independent of whether it understands the content. Key distinction: a model can understand sentiment but output "HAPPY" instead of "POSITIVE" — poor instruction following, adequate capability.

Benchmarks:
- **IFEval** (Google) — 25 automatically verifiable instruction types (keyword presence, length constraints, JSON format, bullet counts, etc.). Score = fraction of instructions followed.
- **INFOBench** — broader notion: adds content constraints, linguistic guidelines, and style rules. Verification is done via AI judge answering per-criterion yes/no questions. GPT-4 is more reliable than MTurk annotators on this benchmark.

Practical advice: curate your own benchmark for your specific instructions. Public benchmarks miss the instructions that matter for your application.

## Model Selection Workflow

A four-step iterative process: (1) hard-attribute filtering, (2) public benchmark screening, (3) private evaluation pipeline, (4) production monitoring.

**Hard attributes** (things you cannot or will not change): licence type, data privacy constraints, on-device requirement, latency hard limits. These can dramatically reduce the candidate pool before any experimentation begins.

**Soft attributes** (improvable): accuracy, toxicity level, factual consistency — these can change with prompting or finetuning.

### Open Source vs Model API

Seven decision axes:

| Axis | Model API | Self-hosted |
|------|-----------|-------------|
| Data privacy | Must send data externally; risk of provider policy changes | Data stays local |
| Data lineage/copyright | Commercial contracts may offer protection | Less legal recourse; more exposure |
| Performance | Best proprietary models ahead of best open source (likely indefinitely, given incentive structure) | Open source models closing gap but will likely lag |
| Functionality | Better scaling, function calling, structured outputs; logprobs often hidden | Full logprob access; finetuning flexibility |
| Cost | Per-token; no fixed overhead | High fixed engineering/infrastructure cost |
| Control | Rate limits; risk of losing access; opaque versioning | Freeze models; inspect changes |
| On-device | Impossible | Possible |

Key observations:
- Best models will stay behind APIs — model providers have no incentive to open source their strongest models.
- Open source models lack feedback loops from production usage, compounding the performance gap.
- Proprietary models are more likely to over-censor — important for applications that need to generate real faces, simulate physical AI characters, etc.

### Public Benchmarks

Thousands of benchmarks exist (BIG-bench has 214; lm-evaluation-harness supports 400+). Key problems:

1. **Data contamination** — benchmarks published before a model's training cutoff are likely in the training data. Even 13-token n-gram overlap is detectable. Perplexity screening is cheaper but less accurate. OpenAI found 13 benchmarks with ≥40% contamination in GPT-3's training data.
2. **Benchmark saturation** — models train on public benchmarks until ceiling is hit; new harder benchmarks must be continuously introduced.
3. **Selection ambiguity** — no principled method for choosing which benchmarks to aggregate; leaderboards often differ significantly (HuggingFace LLM Leaderboard vs Stanford HELM share only 2 of 10 benchmarks).
4. **Correlation problem** — benchmarks testing similar things (e.g. WinoGrande + MMLU + ARC-C all highly correlated) over-weight that dimension in aggregated rankings.

Public leaderboards use simple averaging (HuggingFace) or mean win rate (HELM) — both are proxies with significant flaws. Use public benchmarks to filter, not to select.

## Designing an Evaluation Pipeline

A four-step process for custom application evaluation:

### Step 1 — Evaluate all components
Evaluate both end-to-end output and each intermediate component separately. Evaluate per-turn (quality of each response) and per-task (did the system complete the goal?). Task-based evaluation is more important — what users care about is goal completion.

### Step 2 — Create an evaluation guideline
Define what "good" means before you start evaluating. Include both positive criteria and out-of-scope handling (what should the application refuse or redirect?). LinkedIn found that first hurdle in deploying generative AI was creating a clear evaluation guideline — a correct response is not always a good response (e.g. "You are a terrible fit" is correct but unhelpful for a job assessment tool).

**Scoring rubrics:** choose a scale (binary 0/1, ternary -1/0/1, or 1–5) and create rubric examples for each value. Validate rubrics with human annotators. Use 2–3 evaluation criteria on average (LangChain's State of AI 2023).

**Tie to business metrics:** define the usefulness threshold (minimum acceptable score) and map evaluation metric values to business outcomes (e.g. factual consistency 80% → 30% of support requests automated; 98% → 90% automated).

### Step 3 — Define evaluation methods and data
Mix evaluation methods: cheap classifier on 100% of data + expensive AI judge on 1% of data. When logprobs are available, use them for confidence-sensitive evaluation (classification confidence, perplexity estimation).

**Annotated evaluation data:** use production data where possible. Slice data by: user tier, traffic source, known failure modes, out-of-scope inputs. Slicing avoids Simpson's paradox (model A outperforms model B on every slice but loses on aggregated data due to slice size differences).

**Sample size guidance (from OpenAI):** to detect a 10% score difference at 95% confidence, ~100 examples are needed; for 3%, ~1,000; for 1%, ~10,000. The median benchmark in lm-evaluation-harness has 1,000 examples.

### Step 4 — Evaluate the evaluation pipeline itself
Questions to ask: Do better responses actually get higher scores? Is the pipeline reproducible (same result twice)? Are metrics correlated (if so, some are redundant)? Does the pipeline add acceptable latency/cost?

Track all variables across evaluation runs: evaluation data version, rubric version, AI judge prompt, and sampling configuration (temperature = 0 for AI judges to maximise reproducibility).

## Key Takeaways

- Foundation model evaluation is inherently harder than classical ML: outputs are open-ended, models are black-boxes, and benchmark saturation is common.
- Perplexity measures distribution fit, not output quality — it is useful for contamination detection and model comparison, not for end-to-end application evaluation.
- Pass@k is the standard metric for functional correctness in code generation; it requires running generated code against a test suite.
- Lexical similarity metrics (BLEU, ROUGE) are widely used but weakly correlated with human preferences for open-ended tasks.
- AI-as-a-judge offers speed and cost advantages but carries systematic biases (self-bias, position bias, verbosity bias) that must be mitigated.
- Comparative evaluation (pairwise + Elo/Bradley-Terry) is more reliable than pointwise scoring for open-ended tasks but scales quadratically.
- Evaluation-driven development: define criteria before building. Applications with no evaluation pipeline are worse than undeployed applications.
- Public benchmarks filter out bad models; private evaluation pipelines select among good ones. Public benchmarks are nearly always contaminated.
- Model API vs self-hosting is a seven-axis decision; the performance gap between proprietary and open source models is likely to persist due to incentive structures.

## Related Concepts

- [[concepts/llm-sampling]] — sampling parameters that affect output diversity and consistency
- [[concepts/foundation-models]] — the models being evaluated
- [[concepts/ai-engineering]] — evaluation as a core discipline within AI engineering
- [[concepts/rag]] — retrieval augmentation to ground outputs (reduces hallucination, changes what evaluation must cover)
- [[concepts/prompt-engineering]] — prompts used to elicit outputs that are then evaluated

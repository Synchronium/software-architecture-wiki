---
title: "Dataset Engineering"
type: concept
tags: [ai, llm, data, dataset, data-quality, data-synthesis, annotation, distillation]
sources: [ai-engineering, designing-machine-learning-systems]
created: 2026-05-30
updated: 2026-05-30
---

# Dataset Engineering

## Definition

Dataset engineering is the discipline of creating training datasets that allow models to be trained to the desired level of performance within a given budget. As fewer organisations train models from scratch, data has become the primary differentiator for AI performance. (→ [[sources/ai-engineering]] ch. 8)

The shift from model-centric AI (design better architectures) to **data-centric AI** (design better datasets for the same model) defines the current era. Llama 3's performance gains over Llama 2 are "primarily driven by improvements in data quality and diversity as well as by increased training scale" — with no significant architecture changes.

## Three Core Data Criteria

### 1. Data Quality

Six quality characteristics for finetuning data:
1. **Relevant** — examples match the task you are training the model to do.
2. **Aligned with task requirements** — annotations match what the task needs (factual accuracy, conciseness, creativity, etc.) — not always the same as "correct."
3. **Consistent** — two annotators should reach similar conclusions on the same example; inconsistency confuses the model.
4. **Correctly formatted** — clean of extraneous HTML, trailing whitespace, inconsistent casing, wrong numerical formats. Databricks found that removing extraneous Markdown/HTML tokens improved accuracy by 20% and reduced input tokens by 60%.
5. **Sufficiently unique** — duplications bias the distribution and waste compute. Anthropic found that repeating 0.1% of data 100 times degraded an 800M-parameter model to perform like a 400M model.
6. **Compliant** — no PII, copyrighted material, or policy-violating content.

A small amount of high-quality data can outperform a large amount of noisy data. The Yi model family found 10K carefully crafted instructions outperform hundreds of thousands of noisy ones. LIMA (Zhou et al., 2023) showed a 65B Llama model finetuned on 1,000 curated examples matched or exceeded GPT-4 quality in 43% of pairwise comparisons as judged by humans.

> **Open question:** High quality matters, but LIMA's model was less robust than production-grade models — quality alone does not substitute for coverage.

### 2. Data Coverage

Training data must cover the range of problems the model will face in production. Key dimensions of diversity:
- **Domain diversity** — topics, subjects, knowledge areas.
- **Linguistic diversity** — languages, registers, speaking styles, typo inclusion.
- **Task diversity** — Chung et al. (2022) showed performance improved greatly as finetuning tasks increased from 9 to 282; gains plateaued beyond 282 but continued positively up to 1,836 tasks.
- **Format diversity** — instruction length (short vs. detailed), output length, output format (JSON, plain text, yes/no).

Llama 3 data mixes by training phase:

| Domain | Pre-training | SFT | Preference FT |
|--------|-------------|-----|--------------|
| General knowledge (English) | 50% | 52.66% | 81.99% |
| Math and reasoning | 25% | 21.19% | 5.89% |
| Coding | 17% | 14.89% | 6.93% |
| Multilingual | 8% | 3.01% | 5.19% |

Math and code are over-represented relative to their share of internet data because they are high-signal for reasoning capability (annealing on small amounts of high-quality code/math boosts benchmark performance).

### 3. Data Quantity

There is no universal answer. Factors:
- **Finetuning technique:** full finetuning needs tens of thousands to millions of examples; PEFT (LoRA) can show strong performance with a few hundred to a few thousand.
- **Task complexity:** sentiment classification needs far less data than multi-step financial question answering.
- **Base model quality:** stronger base models need fewer examples to reach target performance. With 100 examples, advanced models outperform weaker ones. With 550,000 examples, all models converge to similar performance (OpenAI guide).
- **Ossification:** for very large datasets, pre-training can ossify weights so they resist finetuning data; smaller models are more susceptible.

**Practical approach:** start with 50 examples. If no improvement is visible, additional data rarely helps — investigate hyperparameters, data quality, or prompt design first. If improvement is visible, plot performance vs. dataset size at 25/50/100% to estimate the returns from more data.

## Data Acquisition and Annotation

Priority order of data sources:
1. **Your own application data** — perfectly relevant; matches production distribution; enables the data flywheel (user interactions improve the model, which improves user interactions). Discussed further in Ch. 10 (user feedback systems).
2. **Public datasets** — Hugging Face, Kaggle, data.gov, Google Dataset Search, UC Irvine ML Repository. Always check licence; open licences may still contain data from restricted sources.
3. **Purchased proprietary data.**
4. **Synthesised data.**

**Annotation guideline quality is critical.** LinkedIn reported annotation guidelines as one of the hardest parts of their AI engineering pipeline. The same guidelines used for evaluation data (→ [[concepts/ai-evals]]) can serve as the foundation for annotation guidelines — another argument for investing in evaluation infrastructure early.

**Single-turn vs multi-turn data:** single-turn is simpler to obtain; multi-turn is required to teach models to handle clarification, corrections, and multi-step interactions.

**Specialist data challenges:**
- CoT data requires step-by-step explanations, which are slow and expensive to annotate manually — CoT datasets are therefore rare.
- Tool use data may need simulation rather than human annotation because human tool preferences differ from AI tool preferences.

### Handling the Lack of Labels

(→ [[sources/designing-machine-learning-systems]] ch. 4)

When ground truth labels are unavailable or expensive, four techniques:

**Weak supervision (Snorkel):** encode expert heuristics as labelling functions (LFs) — keyword checks, regex, DB lookups, outputs from other models. LFs produce noisy labels that are combined, denoised, and reweighted. No ground truth required; privacy-preserving (only cleared data subset needs to be seen). Versioned, reusable, adaptable without relabelling. Stanford Medicine study: 8 hours of LF writing ≈ nearly one year of hand labelling, with LFs reused across tasks.

**Semi-supervision:** a small set of seed labels + structural assumptions generates more labels. Self-training: train model on labelled data → high-confidence predictions become new labels → repeat. Perturbation-based: small perturbations to a sample shouldn't change its label; perturbed copies inherit original labels.

**Transfer learning:** pretrained base model (from a data-rich task like language modelling) is fine-tuned on a downstream task with far fewer labels. Larger pretrained models achieve better downstream performance. (→ [[concepts/finetuning]])

**Active learning:** model selects the samples most informative for learning rather than labelling at random. Uncertainty sampling (label examples model is least confident about); query-by-committee (label examples multiple candidate models disagree on). Achieves higher accuracy with fewer labels; especially powerful for systems with real-time incoming data.

### Natural Labels and Feedback Loops

Tasks where labels can be automatically inferred from system behaviour:
- Recommender systems: click / no-click after a time window.
- ETA prediction: actual trip duration vs predicted.
- Ad click-through rate: actual clicks vs predicted.
- Stock price prediction: actual price after prediction horizon.

63% of companies work with tasks with natural labels (Huyen, 2022 survey). **Feedback loop length:** time from prediction to label. Short (minutes) for recommendation clicks; long (months) for fraud dispute windows. Long feedback loops delay model improvement; premature window closure creates false negatives (Twitter Ads: some ad clicks arrive hours after impression).

**Implicit vs explicit labels:** implicit (no-click after window = negative) vs explicit (user downvote). Implicit labels have higher volume but weaker signal. Choice of feedback signal type and window length is a business decision requiring stakeholder alignment.

## Data Synthesis

Data synthesis generates new data programmatically to increase quantity, coverage, or quality. Two types:
- **Augmentation:** derives new examples from existing real data (a flipped cat image is still a cat; a synonym-swapped sentence retains its meaning).
- **Synthesis:** generates data from scratch to mimic real data properties.

### Traditional Techniques

**Rule-based / template-based:** populate structured templates with random values (e.g., fraud transaction templates using Faker). Used to generate invoices, contracts, math equations. DeepMind's AlphaGeometry was trained on 100 million synthetic geometry examples generated this way (Trinh et al., 2024).

**Image augmentation:** rotate, crop, scale, flip, add noise. AlexNet (2012) demonstrated the value. Perturbation can improve robustness against adversarial attacks.

**Text augmentation:** synonym replacement (using dictionary or embedding proximity). Gendered word swap to mitigate demographic bias.

**Simulation:** model the real environment virtually (CARLA for autonomous driving, physics engines for robotics). Enables generating data for rare or dangerous events. Self-play for game agents (OpenAI Dota 2: ~180 years of games per day; AlphaGo).

### AI-Powered Synthesis

**Paraphrasing and translation:** given a query, generate multiple phrasings. MetaMath (Yu et al., 2023) rewrote MATH and GSM-8K 15,000 examples into ~400,000 examples; models trained on MetaMath outperformed larger models on related benchmarks.

**Back-translation for quality verification:** translate to target language Y, then translate back to source X′; if X′ ≈ X, translation Y is likely good.

**Instruction data synthesis (Self-Instruct / Alpaca pattern):** start with a seed of diverse (instruction, response) examples → use a strong model to generate thousands of similar examples (Alpaca used 175 seed examples to generate 52,000 pairs via GPT-3).

**Reverse instruction:** for tasks with hard-to-generate long responses, start with existing high-quality long content → use AI to generate the instruction that would elicit it. Avoids hallucinated AI responses; produces higher-quality instruction data. Enables bootstrapping without manually annotated data:
1. Train weak model on seed examples.
2. Weak model generates instructions for high-quality content.
3. Finetune weak model on resulting high-quality pairs.
4. Repeat.

**Llama 3 synthesis pipeline (code example):**
1. Generate programming problem descriptions with AI.
2. Generate solutions per problem + language.
3. AI-generated unit tests validate solutions.
4. AI self-corrects failing solutions.
5. Code translation across languages; filter by test passage.
6. Code back-translation for documentation; filter by back-translation fidelity.
→ 2.7 million synthetic coding examples generated.

### Limitations of AI-Generated Data

1. **Quality control:** garbage in, garbage out; verification is hard and often the bottleneck.
2. **Superficial imitation:** "The False Promise of Imitating Proprietary LLMs" (Gudibande et al., 2023) — imitation models learn style but not factual accuracy or generalisation; can teach the student to hallucinate.
3. **Model collapse:** Shumailov et al. (2023) — training recursively on AI-generated data causes irreversible quality degradation. Probable events become over-represented; rare events are forgotten. Mixing synthetic and real data mitigates collapse (Gerstgrasser et al., 2024; Bertrand et al., 2023).
4. **Obscure data lineage:** AI-generated data can inherit copyright violations or benchmark contamination from the teacher model's training data, making commercial viability and benchmark validity hard to assess.

> **Contradiction:** NVIDIA's Nemotron-4 340B used 98% synthetic data during instruction and preference finetuning and exceeded the teacher model's performance — suggesting model collapse can be avoided with quality verification and a single iteration. Shumailov et al.'s collapse phenomenon appears over multiple recursive iterations.

### Model Distillation

Distillation trains a small student model on outputs generated by a large teacher model. Goals: smaller, cheaper, faster model with comparable performance. DistilBERT: 40% smaller than BERT, 97% of language comprehension, 60% faster.

**Distillation ≠ all synthetic data training.** A student can be larger than the teacher (Nemotron-4 340B distilled from 56B Mixtral; student outperformed teacher).

**Licence constraint:** many model providers prohibit using outputs to train competing models; check licence before distilling.

## Data Processing Pipeline

1. **Inspect** — statistics, token distributions, input/output length distributions, topic distributions, inter-annotator disagreement. Manual inspection of 15 minutes often reveals patterns that save hours. Greg Brockman: "Manual inspection of data has probably the highest value-to-prestige ratio of any activity in machine learning."

2. **Deduplicate** — whole-document, intra-document, cross-document. Methods: pairwise similarity (exact/n-gram/semantic), hashing (MinHash, Bloom filter), dimensionality reduction + nearest-neighbour search. Anthropic study: 0.1% of data repeated 100× degraded 800M model to 400M performance.

3. **Clean and filter** — remove HTML/Markdown tokens, PII, copyrighted content, toxic content. Heuristic filters (remove empty, too-short, too-long; keyword filters; date filters). Active learning and importance sampling for budget-constrained dataset selection.

4. **Format** — apply the model's chat template and tokeniser (wrong template causes silent bugs). Instruction finetuning format: (instruction, response). During finetuning, prompt can often be stripped to zero-shot since the model learns from examples directly — this dramatically shortens inference-time prompts.

**Processing order:** do cheaper steps first to minimise wasted work on low-quality data that will later be discarded.

## Key Takeaways

- Data-centric AI — improving datasets rather than models — is the primary lever for AI performance improvement.
- The golden trio: quality > coverage > quantity. A small dataset with high quality and good coverage often outperforms a large noisy dataset.
- Your own application data is the most valuable source; invest in a data flywheel early.
- Annotation guidelines are as important as the annotations themselves; they are the same artefact as evaluation guidelines.
- Synthetic data is powerful but not a replacement for human data: quality verification, model collapse risk, and data lineage obscurity are real constraints.
- Deduplicate aggressively; even small duplication rates can dramatically degrade model performance.
- People synthesise the data they can verify; coding is the dominant synthetic data domain precisely because it can be verified by code execution.

## Related Concepts

- [[concepts/finetuning]] — dataset engineering produces the training data that finetuning consumes
- [[concepts/ai-evals]] — evaluation guidelines and annotation guidelines are the same artefact; evaluation data can seed synthesis
- [[concepts/foundation-models]] — pre-training data decisions shape what finetuning data needs to supplement
- [[concepts/prompt-engineering]] — finetuning replaces prompt examples with training examples; fewer examples are needed in inference-time prompts after finetuning

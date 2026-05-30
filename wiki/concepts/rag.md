---
title: "Retrieval-Augmented Generation (RAG)"
type: concept
tags: [ai, llm, rag, retrieval, vector-database, embeddings, information-retrieval, context]
sources: [ai-engineering]
created: 2026-05-30
updated: 2026-05-30
---

# Retrieval-Augmented Generation (RAG)

## Definition

Retrieval-Augmented Generation (RAG) is a technique that enhances a model's generation by retrieving relevant information from external memory sources and injecting it into the model's context. The pattern separates a system's instruction (common to all queries) from its context (specific to each query). (→ [[sources/ai-engineering]] ch. 6)

Coined in Lewis et al. (2020), RAG addresses knowledge-intensive tasks where all available knowledge cannot fit in the model's context. The relevant subset is retrieved on-demand for each query.

## Why RAG Persists Despite Long Contexts

Expanding context length does not eliminate the need for RAG:
1. **Data always grows** — the total amount of available data exceeds any fixed context limit, regardless of how large that limit becomes.
2. **"Lost in the middle" effect** — models process tokens at the beginning and end of long contexts better than the middle (Liu et al. 2023). Retrieving only the most relevant chunks avoids burying key information in the middle.
3. **Cost and latency** — every input token incurs cost and latency. RAG selects only the relevant tokens, reducing both.

Anthropic's guidance: for knowledge bases under 200,000 tokens (~500 pages), include the entire knowledge base in the context directly. RAG becomes beneficial beyond that scale.

## Architecture

A RAG system has two components:

- **Retriever** — processes and indexes external data; retrieves the most relevant chunks for each query.
- **Generator** — a foundation model that uses the retrieved context and the original query to generate a response.

The retriever's quality is the dominant determinant of overall RAG system quality.

## Retrieval Algorithms

### Term-Based Retrieval

Relevance is computed via lexical overlap — matching query terms to document terms.

**TF-IDF:** score(D, Q) = Σ IDF(t) × f(t, D), where IDF(t) = log(N / C(t)). Term frequency (TF) measures how often a term appears in a document; IDF down-weights common terms.

**BM25 (Okapi BM25):** a TF-IDF refinement that normalises term frequency by document length. The standard baseline for information retrieval; still widely competitive against modern approaches.

**Implementation:** Elasticsearch (built on Lucene's inverted index) and BM25 are the dominant production solutions.

**Strengths:** fast to index and query; works well out of the box; interpretable.

**Weaknesses:** lexical, not semantic — "transformer architecture" may return results about electric devices or films; cannot be improved as much through finetuning.

### Embedding-Based (Semantic) Retrieval

Relevance is computed by semantic similarity in vector space.

**Indexing:** each data chunk is converted to an embedding using an embedding model (BERT, Sentence Transformers, CLIP for multimodal). Embeddings are stored in a **vector database**.

**Querying:** the query is embedded with the same model; the vector database retrieves the k nearest neighbours by cosine similarity.

**ANN algorithms** for vector search at scale:
- **LSH** (Locality-Sensitive Hashing) — hashes similar vectors into buckets; trades accuracy for speed. Used in FAISS and Annoy.
- **HNSW** (Hierarchical Navigable Small World) — multi-layer graph; high accuracy and fast queries; expensive to build.
- **Product Quantization** — decomposes vectors into lower-dimensional subvectors; enables fast approximate distance computation. Core of FAISS.
- **IVF** (Inverted File Index) — K-means clustering + centroid search. Combined with PQ forms FAISS's backbone.
- **Annoy** — tree-based; multiple random binary trees; Spotify's open-source implementation.

**Strengths:** semantic understanding; can be fine-tuned end-to-end; adapts to natural language queries.

**Weaknesses:** slow (embedding generation + vector search); expensive (embedding cost, vector storage, search); obscures specific keywords (error codes, product names) — use contextual retrieval to mitigate.

### Hybrid Search

Production systems combine term-based and embedding-based retrieval:
- **Sequential (cascade):** cheap term-based retriever fetches candidates → expensive embedding-based reranker selects the best.
- **Parallel (ensemble):** multiple retrievers run simultaneously; results merged via **Reciprocal Rank Fusion (RRF)**. Score(D) = Σ 1/(k + r_i(D)) where k=60 is a smoothing constant.

## Retrieval Optimisation Techniques

### Chunking Strategy

Documents are split into chunks before indexing. Key decisions:
- **Unit:** characters, words, sentences, paragraphs, or tokens.
- **Overlap:** overlapping chunks prevent important context from being split across boundary. Common: 10–20% overlap.
- **Recursive splitting:** start with sections; if too large, split into paragraphs; if still too large, sentences.
- **Size trade-off:** smaller chunks → more diverse information, but risk losing cross-chunk context; larger chunks → more context, but fewer can fit in the model context window.

Chunk size must not exceed the embedding model's or the generator model's context limit.

### Reranking

After initial retrieval, rerank candidates using a more precise but more expensive mechanism:
- Use a cross-encoder (a model that jointly encodes query + document) to score each (query, document) pair.
- Rank by recency for time-sensitive applications.
- Position matters: because of the lost-in-the-middle effect, place the highest-scoring documents at the beginning or end of the context, not the middle.

### Query Rewriting (Reformulation)

Ambiguous follow-up questions (e.g. "How about Emily Doe?") need to be rewritten into standalone queries before retrieval. Rewriting can be done by another LLM: "Given this conversation, rewrite the last user input to be fully self-contained."

### Contextual Retrieval (Anthropic, 2024)

Augment each chunk with 50–100 tokens of AI-generated context that explains the chunk's relationship to the original document before indexing. This addresses the problem of orphaned chunks that lack surrounding context. Prompt: "Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval."

## Evaluation Metrics

**Retriever metrics:**
- **Context precision** (a.k.a. context relevance) — of documents retrieved, what fraction are relevant? Computable without annotating the full database; AI judges can evaluate pairwise (query, retrieved doc).
- **Context recall** — of all relevant documents, what fraction is retrieved? Requires annotating all documents for each query — expensive; often omitted in production.
- **NDCG, MAP, MRR** — ranking-aware metrics when document order matters.

**Embedding quality:** MTEB benchmark (Muennighoff et al. 2023) evaluates embeddings across retrieval, classification, and clustering tasks.

**End-to-end:** evaluate whether the final generated response is high quality (factual consistency, relevance). Retriever quality only matters insofar as it improves the generator's output.

## RAG Beyond Text

**Multimodal RAG:** use a shared embedding space (CLIP) to index both text and images; retrieve both modalities for a given query; pass to a multimodal generator.

**Tabular data (Text-to-SQL):** for structured databases, the RAG analogue is: (1) text-to-SQL — convert the natural language query to a SQL query; (2) SQL execution; (3) generation — respond based on the SQL result. An intermediate step may select which tables to query when many tables exist.

## Memory Model for Agents

Three memory types an AI model uses:
- **Internal knowledge** — encoded in model weights during training; shared across all queries; updated only by retraining.
- **Short-term memory** — the model's context window; fast access; limited capacity; lost between sessions.
- **Long-term memory** — external storage accessed via retrieval (RAG); persists across sessions; can be updated without retraining.

**Memory management strategies:**
- **FIFO** — discard the oldest context when the limit is reached. Simple but loses potentially critical early messages.
- **Summarisation** — replace conversation history with a generated summary. Reduces tokens while preserving key information.
- **Reflection-based** — after each step, the agent evaluates whether new information should be inserted, merged with, or used to replace existing memory (Liu et al. 2023).

## Key Takeaways

- RAG is a context construction technique, not just a long-context workaround; it remains relevant even with very long context windows because data grows without bound and token cost/quality concerns persist.
- Term-based retrieval (BM25/Elasticsearch) is the right starting point: fast, cheap, and competitive.
- Embedding-based retrieval improves with finetuning but is significantly more expensive to operate; vector database cost can reach 20–50% of model API spend.
- Hybrid search (cascade or ensemble + RRF) is the production norm.
- Chunking and contextual retrieval decisions have outsized impact on retrieval quality.
- Evaluate retrieval and generation quality separately (context precision, end-to-end factual consistency) and together.

## Related Concepts

- [[concepts/ai-evals]] — factual consistency evaluation is particularly important for RAG outputs
- [[concepts/prompt-engineering]] — context construction is complementary to instruction crafting
- [[concepts/foundation-models]] — the generator models RAG augments
- [[concepts/llm-sampling]] — hallucination is reduced by grounding outputs in retrieved context

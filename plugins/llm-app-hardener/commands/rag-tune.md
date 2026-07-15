---
description: Audit a RAG pipeline for retrieval quality and cost, and emit prioritized concrete fixes
argument-hint: [pipeline-dir]
model: inherit
---

Audit the RAG (retrieval-augmented generation) pipeline at `$ARGUMENTS` (default: directories that look like a pipeline, `rag/`, `ingest/`, `retrieval/`, `embeddings/`, or files importing a vector store) for both answer quality and cost, and output prioritized, concrete fixes. Most RAG quality problems are retrieval problems, not model problems: the right chunk never reaches the context, or the wrong chunks crowd it out. This is a **static** read of the pipeline code and config, no index rebuild or query run required.

## Process

### Step 1: Detect the stack
Identify the framework and vector store from imports and config:

| Layer | Signal |
|---|---|
| Framework | `langchain`, `llama-index`, `haystack`, or hand-rolled retrieval |
| Vector store | `pinecone`, `weaviate`, `qdrant`, `chroma`, `pgvector`, `faiss`, `milvus` |
| Embeddings | embedding model name/dimension in config or client calls |
| Reranker | `cohere.rerank`, `rerank`, cross-encoder, `bge-reranker`, or none |

### Step 2: Audit each stage
Walk the pipeline stage by stage and flag issues with the `file:line` where each is configured:

| Stage | What to check |
|---|---|
| Chunking | Strategy (fixed vs. recursive vs. semantic), size, and overlap; whether chunks split mid-sentence/mid-table and whether structure (headings, code, tables) is preserved |
| Embedding model | Fit for domain and language; dimension vs. store config; query/document asymmetry; staleness vs. current models |
| Retrieval | `top_k`, similarity metric, metadata/namespace filtering, hybrid (dense + keyword/BM25) vs. pure vector |
| Reranking | Presence of a reranker; over-fetch-then-rerank (retrieve N, rerank to k); model choice |
| Context assembly | Ordering (lost-in-the-middle: strongest evidence at the ends), dedup, token budget, and whether low-score chunks are padding the prompt |
| Grounding / citations | Whether the prompt demands source-grounded answers and returns citations; guard against answering from unretrieved knowledge |

### Step 3: Output
- `## Findings`: a table: `Stage | Issue (file:line) | Impact (quality/cost) | Fix`, ordered by impact.
- `## Top 3 Fixes`: the highest-leverage changes, each with the concrete parameter/code change and the expected effect.
- `## How to verify`: the retrieval-quality checks to run after (recall@k, groundedness), pointing at `/eval-scaffold` to wire them into the eval suite.

## Important Notes
- Base every finding on real pipeline code/config, cite `file:line`. Never fabricate an index size, a recall number, or an embedding dimension you cannot read from the code.
- Distinguish quality fixes (chunking, reranking, ordering) from cost fixes (over-large `top_k`, oversized chunks, redundant context) and label which each finding is.
- Prefer the smallest change with the largest effect: adding a reranker over-fetch step and fixing chunk boundaries usually beats swapping the whole framework.
- Retrieval changes need retrieval evals, not vibes, always tie the fixes back to a measurable check.

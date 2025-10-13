/**
 * RAG Service - Answer with citations and provenance
 */

import { vector_search, VectorSearchResult } from './store';
import { get_cached, set_cached } from '../semantic_cache/cache';

export interface RAGResponse {
  answer: string | null;
  citations: string[];
  provenance: {
    rag: VectorSearchResult[];
  };
  policy?: string;
  meta?: {
    cached?: boolean;
  };
}

/**
 * Answer a query using RAG with citations and provenance tracking
 * @param query - User query
 * @param k - Number of documents to retrieve (default: 6)
 * @returns Response with answer, citations, and provenance
 */
export async function answer_with_citations(
  query: string,
  k: number = 6
): Promise<RAGResponse> {
  // Generate cache key
  const key = `rag:${hashQuery(query)}`;
  
  // Check semantic cache first
  const cached = await get_cached(key);
  if (cached) {
    cached.meta = cached.meta || {};
    cached.meta.cached = true;
    return cached as RAGResponse;
  }
  
  // Perform vector search
  const hits = await vector_search(query, k);
  
  // Check if we have insufficient context and retrieval is required
  const factualRequiresRetrieval = 
    process.env.FACTUAL_REQUIRES_RETRIEVAL?.toLowerCase() === 'true';
  
  if (!hits.length && factualRequiresRetrieval) {
    return {
      answer: null,
      citations: [],
      provenance: { rag: [] },
      policy: 'insufficient_context'
    };
  }
  
  // TODO: Compose prompt with hits and call LLM model
  // For now, return a stub response
  const result: RAGResponse = {
    answer: hits.length > 0 
      ? `Based on ${hits.length} relevant documents...` 
      : 'No relevant context found',
    citations: hits.map(h => h.doc_id),
    provenance: { rag: hits }
  };
  
  // Cache the result
  await set_cached(key, result);
  
  return result;
}

/**
 * Simple hash function for query caching
 */
function hashQuery(query: string): string {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

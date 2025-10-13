/**
 * Tests for RAG API routes
 */

import { describe, it, expect } from 'vitest';

describe('RAG Routes', () => {
  it('should export registerRagRoutes function', async () => {
    const module = await import('../rag_routes');
    expect(module.registerRagRoutes).toBeDefined();
    expect(typeof module.registerRagRoutes).toBe('function');
  });
});

describe('RAG Service', () => {
  it('should export answer_with_citations function', async () => {
    const module = await import('../../services/rag/service');
    expect(module.answer_with_citations).toBeDefined();
    expect(typeof module.answer_with_citations).toBe('function');
  });

  it('should return proper response structure', async () => {
    const { answer_with_citations } = await import('../../services/rag/service');
    const result = await answer_with_citations('test query', 3);
    
    expect(result).toHaveProperty('answer');
    expect(result).toHaveProperty('citations');
    expect(result).toHaveProperty('provenance');
    expect(Array.isArray(result.citations)).toBe(true);
    expect(result.provenance).toHaveProperty('rag');
  });
});

describe('Embeddings Pipeline', () => {
  it('should chunk document correctly', async () => {
    const { chunk_document } = await import('../../services/embeddings/pipeline');
    const content = 'A'.repeat(2500);
    const chunks = chunk_document(content, 'test_doc', 1000);
    
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toHaveProperty('doc_id', 'test_doc');
    expect(chunks[0]).toHaveProperty('content');
    expect(chunks[0]).toHaveProperty('chunk_id');
  });
});

describe('Metrics Exporter', () => {
  it('should track metrics correctly', async () => {
    const { metricsExporter } = await import('../../services/metrics/exporter');
    
    metricsExporter.reset();
    metricsExporter.trackTokens(100);
    metricsExporter.trackRetrieval();
    metricsExporter.trackCacheHit();
    metricsExporter.trackLatency(150);
    
    const metrics = metricsExporter.getMetrics();
    expect(metrics.tokens_used).toBe(100);
    expect(metrics.retrieval_ops).toBe(1);
    expect(metrics.cache_hits).toBe(1);
    expect(metrics.total_requests).toBe(1);
    expect(metrics.avg_latency_ms).toBe(150);
  });
});

/**
 * Metrics exporter for observability
 * Tracks tokens, retrieval operations, cache hit-rate, and latency
 */

export interface MetricsData {
  tokens_used: number;
  retrieval_ops: number;
  cache_hits: number;
  cache_misses: number;
  total_requests: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
}

class MetricsExporter {
  private metrics: MetricsData = {
    tokens_used: 0,
    retrieval_ops: 0,
    cache_hits: 0,
    cache_misses: 0,
    total_requests: 0,
    avg_latency_ms: 0,
    p95_latency_ms: 0
  };
  
  private latencies: number[] = [];
  
  /**
   * Track token usage
   */
  trackTokens(count: number): void {
    this.metrics.tokens_used += count;
  }
  
  /**
   * Track retrieval operation
   */
  trackRetrieval(): void {
    this.metrics.retrieval_ops += 1;
  }
  
  /**
   * Track cache hit
   */
  trackCacheHit(): void {
    this.metrics.cache_hits += 1;
  }
  
  /**
   * Track cache miss
   */
  trackCacheMiss(): void {
    this.metrics.cache_misses += 1;
  }
  
  /**
   * Track request latency
   */
  trackLatency(latency_ms: number): void {
    this.metrics.total_requests += 1;
    this.latencies.push(latency_ms);
    
    // Update average
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    this.metrics.avg_latency_ms = sum / this.latencies.length;
    
    // Update p95
    if (this.latencies.length > 0) {
      const sorted = [...this.latencies].sort((a, b) => a - b);
      const index = Math.ceil(0.95 * sorted.length) - 1;
      this.metrics.p95_latency_ms = sorted[Math.max(0, index)];
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): MetricsData & { cache_hit_rate: number } {
    const total_cache_ops = this.metrics.cache_hits + this.metrics.cache_misses;
    const cache_hit_rate = total_cache_ops > 0 
      ? this.metrics.cache_hits / total_cache_ops 
      : 0;
    
    return {
      ...this.metrics,
      cache_hit_rate
    };
  }
  
  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      tokens_used: 0,
      retrieval_ops: 0,
      cache_hits: 0,
      cache_misses: 0,
      total_requests: 0,
      avg_latency_ms: 0,
      p95_latency_ms: 0
    };
    this.latencies = [];
  }
  
  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }
  
  /**
   * Log current metrics
   */
  log(): void {
    const metrics = this.getMetrics();
    console.log('\n📊 Metrics Summary:');
    console.log(`   Tokens used: ${metrics.tokens_used}`);
    console.log(`   Retrieval ops: ${metrics.retrieval_ops}`);
    console.log(`   Total requests: ${metrics.total_requests}`);
    console.log(`   Cache hits: ${metrics.cache_hits}`);
    console.log(`   Cache misses: ${metrics.cache_misses}`);
    console.log(`   Cache hit rate: ${(metrics.cache_hit_rate * 100).toFixed(2)}%`);
    console.log(`   Avg latency: ${metrics.avg_latency_ms.toFixed(2)}ms`);
    console.log(`   P95 latency: ${metrics.p95_latency_ms.toFixed(2)}ms`);
  }
}

// Singleton instance
export const metricsExporter = new MetricsExporter();

/**
 * Budget alert thresholds
 */
export const BUDGET_THRESHOLDS = {
  weekly_token_limit: 1_000_000,
  weekly_cost_limit_usd: 100
};

/**
 * Check if budget alert should be triggered
 */
export function checkBudgetAlerts(): { triggered: boolean; message?: string } {
  const metrics = metricsExporter.getMetrics();
  
  // Simple check based on token usage
  // TODO: Add time-based tracking for weekly limits
  if (metrics.tokens_used > BUDGET_THRESHOLDS.weekly_token_limit) {
    return {
      triggered: true,
      message: `⚠️  Token usage (${metrics.tokens_used}) exceeds weekly limit (${BUDGET_THRESHOLDS.weekly_token_limit})`
    };
  }
  
  return { triggered: false };
}

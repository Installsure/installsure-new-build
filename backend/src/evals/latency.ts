/**
 * Latency evaluation - measure RAG API performance
 */

import { answer_with_citations } from '../services/rag/service';

export interface LatencyTestCase {
  query: string;
  name: string;
}

export interface LatencyResult {
  total_tests: number;
  avg_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  max_latency_ms: number;
  min_latency_ms: number;
  test_results: {
    name: string;
    query: string;
    latency_ms: number;
  }[];
}

/**
 * Calculate percentile from sorted array
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Run latency evaluation
 * @param test_cases - Array of test cases
 * @param iterations - Number of iterations per test case
 * @returns Evaluation results
 */
export async function evaluate_latency(
  test_cases: LatencyTestCase[],
  iterations: number = 5
): Promise<LatencyResult> {
  const latencies: number[] = [];
  const test_results: LatencyResult['test_results'] = [];
  
  for (const test_case of test_cases) {
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await answer_with_citations(test_case.query);
      const end = Date.now();
      
      const latency = end - start;
      latencies.push(latency);
      
      test_results.push({
        name: `${test_case.name} (iter ${i + 1})`,
        query: test_case.query,
        latency_ms: latency
      });
    }
  }
  
  const result: LatencyResult = {
    total_tests: latencies.length,
    avg_latency_ms: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    p50_latency_ms: percentile(latencies, 50),
    p95_latency_ms: percentile(latencies, 95),
    p99_latency_ms: percentile(latencies, 99),
    max_latency_ms: Math.max(...latencies),
    min_latency_ms: Math.min(...latencies),
    test_results
  };
  
  return result;
}

/**
 * Default test cases for latency evaluation
 */
export const DEFAULT_LATENCY_TESTS: LatencyTestCase[] = [
  {
    name: "Simple query",
    query: "What is the project status?"
  },
  {
    name: "Complex query",
    query: "Provide a detailed breakdown of all safety requirements and compliance measures for this construction project"
  },
  {
    name: "Specific query",
    query: "Who is the project manager?"
  }
];

/**
 * Run latency evaluation with default test cases
 * @param slo_p95_ms - SLO for p95 latency in milliseconds (default: 2500)
 */
export async function run_latency_eval(slo_p95_ms: number = 2500): Promise<LatencyResult> {
  console.log('⏱️  Running latency evaluation...');
  const result = await evaluate_latency(DEFAULT_LATENCY_TESTS);
  
  console.log(`\n📊 Latency Results:`);
  console.log(`   Total tests: ${result.total_tests}`);
  console.log(`   Avg latency: ${result.avg_latency_ms.toFixed(2)}ms`);
  console.log(`   P50 latency: ${result.p50_latency_ms.toFixed(2)}ms`);
  console.log(`   P95 latency: ${result.p95_latency_ms.toFixed(2)}ms`);
  console.log(`   P99 latency: ${result.p99_latency_ms.toFixed(2)}ms`);
  console.log(`   Min latency: ${result.min_latency_ms.toFixed(2)}ms`);
  console.log(`   Max latency: ${result.max_latency_ms.toFixed(2)}ms`);
  
  if (result.p95_latency_ms > slo_p95_ms) {
    console.warn(`⚠️  Warning: P95 latency ${result.p95_latency_ms.toFixed(2)}ms exceeds SLO of ${slo_p95_ms}ms`);
  } else {
    console.log(`✅ P95 latency within SLO (${slo_p95_ms}ms)`);
  }
  
  return result;
}

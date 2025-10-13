/**
 * Groundedness evaluation - measure RAG retrieval quality
 */

import { answer_with_citations } from '../services/rag/service';

export interface GroundednessTestCase {
  query: string;
  expected_retrieval: boolean;
  min_citations?: number;
}

export interface GroundednessResult {
  total_tests: number;
  passed: number;
  failed: number;
  hit_rate: number;
  test_results: {
    query: string;
    passed: boolean;
    citations_count: number;
    has_answer: boolean;
  }[];
}

/**
 * Run groundedness evaluation
 * @param test_cases - Array of test cases
 * @returns Evaluation results
 */
export async function evaluate_groundedness(
  test_cases: GroundednessTestCase[]
): Promise<GroundednessResult> {
  const results: GroundednessResult = {
    total_tests: test_cases.length,
    passed: 0,
    failed: 0,
    hit_rate: 0,
    test_results: []
  };
  
  for (const test_case of test_cases) {
    const response = await answer_with_citations(test_case.query);
    
    const has_citations = response.citations.length > 0;
    const has_answer = response.answer !== null && response.answer !== '';
    const meets_min_citations = !test_case.min_citations || 
      response.citations.length >= test_case.min_citations;
    
    const passed = test_case.expected_retrieval 
      ? (has_citations && has_answer && meets_min_citations)
      : true; // If no retrieval expected, we just check it doesn't crash
    
    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    results.test_results.push({
      query: test_case.query,
      passed,
      citations_count: response.citations.length,
      has_answer
    });
  }
  
  results.hit_rate = results.total_tests > 0 
    ? results.passed / results.total_tests 
    : 0;
  
  return results;
}

/**
 * Default test cases for groundedness evaluation
 */
export const DEFAULT_TEST_CASES: GroundednessTestCase[] = [
  {
    query: "What are the safety requirements for this project?",
    expected_retrieval: true,
    min_citations: 2
  },
  {
    query: "What is the project timeline?",
    expected_retrieval: true,
    min_citations: 1
  },
  {
    query: "List the main project stakeholders",
    expected_retrieval: true,
    min_citations: 1
  }
];

/**
 * Run groundedness evaluation with default test cases
 */
export async function run_groundedness_eval(): Promise<GroundednessResult> {
  console.log('🧪 Running groundedness evaluation...');
  const result = await evaluate_groundedness(DEFAULT_TEST_CASES);
  
  console.log(`\n📊 Groundedness Results:`);
  console.log(`   Total tests: ${result.total_tests}`);
  console.log(`   Passed: ${result.passed}`);
  console.log(`   Failed: ${result.failed}`);
  console.log(`   Hit rate: ${(result.hit_rate * 100).toFixed(2)}%`);
  
  if (result.hit_rate < 0.85) {
    console.warn(`⚠️  Warning: Hit rate ${(result.hit_rate * 100).toFixed(2)}% is below 85% threshold`);
  } else {
    console.log(`✅ Hit rate meets ≥85% threshold`);
  }
  
  return result;
}

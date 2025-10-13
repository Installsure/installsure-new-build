/**
 * Run all evaluations
 * Usage: npx tsx src/evals/run-all.ts
 */

import { run_groundedness_eval } from './groundedness';
import { run_latency_eval } from './latency';

async function main() {
  console.log('🚀 Running all RAG evaluations...\n');
  
  let failed = false;
  
  // Run groundedness evaluation
  try {
    console.log('═══════════════════════════════════════════');
    console.log('1️⃣  GROUNDEDNESS EVALUATION');
    console.log('═══════════════════════════════════════════');
    
    const groundednessResult = await run_groundedness_eval();
    
    if (groundednessResult.hit_rate < 0.85) {
      console.error(`\n❌ FAIL: Groundedness below threshold (${(groundednessResult.hit_rate * 100).toFixed(2)}% < 85%)`);
      failed = true;
    } else {
      console.log(`\n✅ PASS: Groundedness meets threshold (${(groundednessResult.hit_rate * 100).toFixed(2)}% ≥ 85%)`);
    }
  } catch (error) {
    console.error('\n❌ FAIL: Groundedness evaluation error:', error);
    failed = true;
  }
  
  console.log('\n');
  
  // Run latency evaluation
  try {
    console.log('═══════════════════════════════════════════');
    console.log('2️⃣  LATENCY EVALUATION');
    console.log('═══════════════════════════════════════════');
    
    const slo_p95_ms = parseInt(process.env.RAG_LATENCY_SLO_MS || '2500', 10);
    const latencyResult = await run_latency_eval(slo_p95_ms);
    
    if (latencyResult.p95_latency_ms > slo_p95_ms) {
      console.error(`\n❌ FAIL: Latency exceeds SLO (${latencyResult.p95_latency_ms.toFixed(2)}ms > ${slo_p95_ms}ms)`);
      failed = true;
    } else {
      console.log(`\n✅ PASS: Latency meets SLO (${latencyResult.p95_latency_ms.toFixed(2)}ms ≤ ${slo_p95_ms}ms)`);
    }
  } catch (error) {
    console.error('\n❌ FAIL: Latency evaluation error:', error);
    failed = true;
  }
  
  // Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════');
  console.log('📊 EVALUATION SUMMARY');
  console.log('═══════════════════════════════════════════');
  
  if (failed) {
    console.error('❌ Some evaluations failed. See details above.');
    process.exit(1);
  } else {
    console.log('✅ All evaluations passed!');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as runAllEvaluations };

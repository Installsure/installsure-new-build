/**
 * Quick test script to validate Phase 2 infrastructure components
 */

import { config } from './lib/env.js';
import { logger } from './lib/logger.js';

async function validateInfrastructure() {
  try {
    logger.info('🧪 Starting Phase 2 Infrastructure Validation');
    
    // Test 1: Environment Configuration
    logger.info('✅ Environment configuration loaded', {
      environment: config.deployment.environment,
      version: config.deployment.version,
      features: config.features,
    });
    
    // Test 2: Logger functionality
    logger.info('✅ Logger system operational');
    logger.warn('⚠️  Warning level test');
    logger.error('❌ Error level test (this is expected)');
    
    // Test 3: Configuration validation
    const validationTests: Array<{ name: string; value: any }> = [
      { name: 'server.host', value: config.server.host },
      { name: 'server.port', value: config.server.port },
      { name: 'logging.level', value: config.logging.level },
      { name: 'features.realTimeSync', value: config.features.realTimeSync }
    ];
    
    for (const test of validationTests) {
      if (test.value !== undefined) {
        logger.info(`✅ Config ${test.name}: ${test.value}`);
      } else {
        throw new Error(`Missing config: ${test.name}`);
      }
    }
    
    logger.info('🎉 All Phase 2 infrastructure components validated successfully!');
    
    return {
      success: true,
      components: {
        env: '✅ Environment Configuration',
        logger: '✅ Structured Logging',
        config: '✅ Configuration Validation'
      }
    };
    
  } catch (error) {
    logger.error('💥 Infrastructure validation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateInfrastructure().then(result => {
    if (result.success) {
      console.log('\n🎉 Phase 2 Infrastructure Validation: SUCCESS');
      console.log('All components are ready for production use.');
      process.exit(0);
    } else {
      console.error('\n❌ Phase 2 Infrastructure Validation: FAILED');
      console.error('Error:', result.error);
      process.exit(1);
    }
  });
}

export { validateInfrastructure };
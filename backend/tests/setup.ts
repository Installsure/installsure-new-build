import { beforeAll } from 'vitest';
import { config as dotenvConfig } from 'dotenv';

beforeAll(() => {
  // Load test environment variables
  dotenvConfig({ path: '.env.test' });
});
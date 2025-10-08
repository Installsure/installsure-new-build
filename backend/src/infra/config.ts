import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8000),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional(),
  FORGE_CLIENT_ID: z.string().optional(),
  FORGE_CLIENT_SECRET: z.string().optional(),
  FORGE_BASE_URL: z.string().default('https://developer.api.autodesk.com'),
  FORGE_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  FILES_LOCAL_DIR: z.string().default('./uploads'),
  REDIS_URL: z.string().optional(),
  FEATURE_SENTRY: z.boolean().default(false),
  FEATURE_QB: z.boolean().default(false),
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  // Circuit breaker
  CIRCUIT_BREAKER_ERROR_THRESHOLD: z.coerce.number().default(5),
  CIRCUIT_BREAKER_TIMEOUT: z.coerce.number().default(10000),
  CIRCUIT_BREAKER_RESET_TIMEOUT: z.coerce.number().default(30000),
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // Sentry
  SENTRY_DSN: z.string().optional(),
  // QuickBooks
  QB_CLIENT_ID: z.string().optional(),
  QB_CLIENT_SECRET: z.string().optional(),
  // Authentication
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
});

// Parse environment variables
const env = process.env;

// Parse CORS_ORIGINS as comma-separated string
const corsOrigins = env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()) || [
  'http://localhost:3000',
];

const config = {
  ...configSchema.parse(env),
  CORS_ORIGINS: corsOrigins,
};

export { config };

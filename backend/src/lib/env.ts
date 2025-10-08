/**
 * Environment Configuration Module
 * Centralized environment variable management with validation and type safety
 * Production Hardening - Phase 2
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment files in priority order
const envFiles = [
  '.env.local',
  '.env.production',
  '.env.development', 
  '.env'
];

for (const file of envFiles) {
  dotenv.config({ path: path.resolve(process.cwd(), file) });
}

// Environment validation schema
const envSchema = z.object({
  // Core Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8000),
  HOST: z.string().default('localhost'),
  
  // API Configuration
  API_SECRET: z.string().min(32, 'API secret must be at least 32 characters'),
  API_CORS_ORIGIN: z.string().default('http://localhost:3000'),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  API_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Database Configuration
  DATABASE_URL: z.string().optional(),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('installsure'),
  POSTGRES_USER: z.string().default('installsure'),
  POSTGRES_PASSWORD: z.string().min(8, 'Database password must be at least 8 characters').optional(),
  
  // Redis Configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_MAX_CONNECTIONS: z.coerce.number().default(10),
  REDIS_RETRY_ATTEMPTS: z.coerce.number().default(3),
  REDIS_RETRY_DELAY: z.coerce.number().default(1000),
  
  // Security Settings
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // File Upload Settings
  UPLOAD_MAX_SIZE: z.coerce.number().default(10485760), // 10MB
  UPLOAD_ALLOWED_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf,text/plain'),
  UPLOAD_DIR: z.string().default('./uploads'),
  UPLOAD_TEMP_DIR: z.string().default('./temp'),
  
  // Logging Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_FORMAT: z.enum(['combined', 'common', 'dev', 'short', 'tiny']).default('combined'),
  LOG_DIR: z.string().default('./logs'),
  LOG_MAX_SIZE: z.string().default('10m'),
  LOG_MAX_FILES: z.string().default('14d'),
  
  // Monitoring & Health
  HEALTH_CHECK_INTERVAL: z.coerce.number().default(30000),
  HEALTH_CHECK_TIMEOUT: z.coerce.number().default(5000),
  HEALTH_CHECK_RETRIES: z.coerce.number().default(3),
  METRICS_ENABLED: z.coerce.boolean().default(true),
  METRICS_PORT: z.coerce.number().default(9090),
  
  // Feature Flags
  FEATURE_ADVANCED_UPLOAD: z.coerce.boolean().default(true),
  FEATURE_REAL_TIME_SYNC: z.coerce.boolean().default(true),
  FEATURE_OFFLINE_MODE: z.coerce.boolean().default(false),
  FEATURE_NOTIFICATIONS: z.coerce.boolean().default(true),
  
  // External Services
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  
  // Third-party Integrations
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('production'),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  
  // Forge/AutoCAD Integration
  FORGE_CLIENT_ID: z.string().optional(),
  FORGE_CLIENT_SECRET: z.string().optional(),
  FORGE_BASE_URL: z.string().default('https://developer.api.autodesk.com'),
  FORGE_BUCKET: z.string().optional(),
  
  // Deployment
  DEPLOYMENT_ENVIRONMENT: z.string().default('production'),
  DEPLOYMENT_VERSION: z.string().default('1.0.0'),
  DEPLOYMENT_BUILD_DATE: z.string().optional(),
  DEPLOYMENT_COMMIT_SHA: z.string().optional(),
});

// Validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach(err => {
      console.error(`  • ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Derived configurations
export const config = {
  // Core
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
  
  // Server
  server: {
    host: env.HOST,
    port: env.PORT,
    cors: {
      origin: env.API_CORS_ORIGIN.split(',').map(url => url.trim()),
      credentials: true,
    },
    rateLimit: {
      windowMs: env.API_RATE_LIMIT_WINDOW_MS,
      max: env.API_RATE_LIMIT_MAX_REQUESTS,
    },
  },
  
  // Database
  database: {
    url: env.DATABASE_URL,
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DB,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
  },
  
  // Redis
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    maxConnections: env.REDIS_MAX_CONNECTIONS,
    retryAttempts: env.REDIS_RETRY_ATTEMPTS,
    retryDelay: env.REDIS_RETRY_DELAY,
  },
  
  // Security
  security: {
    apiSecret: env.API_SECRET,
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
  },
  
  // File Upload
  upload: {
    maxSize: env.UPLOAD_MAX_SIZE,
    allowedTypes: env.UPLOAD_ALLOWED_TYPES.split(',').map(type => type.trim()),
    directory: path.resolve(env.UPLOAD_DIR),
    tempDirectory: path.resolve(env.UPLOAD_TEMP_DIR),
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
    directory: path.resolve(env.LOG_DIR),
    maxSize: env.LOG_MAX_SIZE,
    maxFiles: env.LOG_MAX_FILES,
  },
  
  // Monitoring
  monitoring: {
    healthCheck: {
      interval: env.HEALTH_CHECK_INTERVAL,
      timeout: env.HEALTH_CHECK_TIMEOUT,
      retries: env.HEALTH_CHECK_RETRIES,
    },
    metrics: {
      enabled: env.METRICS_ENABLED,
      port: env.METRICS_PORT,
    },
  },
  
  // Features
  features: {
    advancedUpload: env.FEATURE_ADVANCED_UPLOAD,
    realTimeSync: env.FEATURE_REAL_TIME_SYNC,
    offlineMode: env.FEATURE_OFFLINE_MODE,
    notifications: env.FEATURE_NOTIFICATIONS,
  },
  
  // External Services
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER && env.SMTP_PASS ? {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      } : undefined,
    },
    from: env.SMTP_FROM,
  },
  
  // Third-party
  integrations: {
    sentry: {
      dsn: env.SENTRY_DSN,
      environment: env.SENTRY_ENVIRONMENT,
    },
    analytics: {
      googleAnalyticsId: env.GOOGLE_ANALYTICS_ID,
    },
  },
  
  // Forge/AutoCAD
  forge: {
    clientId: env.FORGE_CLIENT_ID,
    clientSecret: env.FORGE_CLIENT_SECRET,
    baseUrl: env.FORGE_BASE_URL,
    bucket: env.FORGE_BUCKET,
  },
  
  // Deployment
  deployment: {
    environment: env.DEPLOYMENT_ENVIRONMENT,
    version: env.DEPLOYMENT_VERSION,
    buildDate: env.DEPLOYMENT_BUILD_DATE,
    commitSha: env.DEPLOYMENT_COMMIT_SHA,
  },
} as const;

// Environment validation helper
export function validateRequiredEnvVars(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`  • ${varName}`);
    });
    process.exit(1);
  }
}

// Environment info for debugging
export function getEnvironmentInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: env.NODE_ENV,
    version: config.deployment.version,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
}

export default config;
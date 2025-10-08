import dotenv from 'dotenv';

dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '8000'),
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  DATABASE_URL: process.env.DATABASE_URL || '',
  FORGE_CLIENT_ID: process.env.FORGE_CLIENT_ID || '',
  FORGE_CLIENT_SECRET: process.env.FORGE_CLIENT_SECRET || '',
  FORGE_BASE_URL: process.env.FORGE_BASE_URL || 'https://developer.api.autodesk.com',
  FORGE_BUCKET: process.env.FORGE_BUCKET || 'installsure-dev',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  QB_CLIENT_ID: process.env.QB_CLIENT_ID || '',
  QB_CLIENT_SECRET: process.env.QB_CLIENT_SECRET || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

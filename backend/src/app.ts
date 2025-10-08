import express from 'express';
import { requestIdMiddleware } from './api/middleware/requestId.js';
import { securityMiddleware } from './api/middleware/security.js';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler.js';
import { initSentry } from './infra/sentry.js';
import { logger } from './infra/logger.js';

// Import routes
import healthRoutes from './api/routes/health.js';
import authRoutes from './api/routes/auth.js';
import projectRoutes from './api/routes/projects.js';
import fileRoutes from './api/routes/files.js';
import forgeRoutes from './api/routes/forge.js';
import qbRoutes from './api/routes/qb.js';

export const createApp = (): express.Application => {
  const app = express();

  // Initialize Sentry early
  initSentry();

  // Request ID middleware (must be first)
  app.use(requestIdMiddleware);

  // Security middleware
  securityMiddleware(app);

  // API routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/autocad', forgeRoutes);
  app.use('/api/qb', qbRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};

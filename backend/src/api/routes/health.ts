import { Router, Request, Response } from 'express';
import { livenessHandler } from '../../health/liveness.js';
import { readinessHandler } from '../../health/readiness.js';
import { config } from '../../infra/config.js';
import { logger } from '../../infra/logger.js';

const router = Router();

// Health check endpoint
router.get('/', (req: Request, res: Response) => {
  const requestLogger = req.logger || logger;

  requestLogger.debug('Health check requested');

  res.json({
    ok: true,
    uptime: process.uptime(),
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Liveness probe
router.get('/live', livenessHandler);

// Readiness probe
router.get('/ready', readinessHandler);

export default router;

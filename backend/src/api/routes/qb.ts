import { Router, Request, Response } from 'express';
import { config } from '../../infra/config.js';
import { logger } from '../../infra/logger.js';

const router = Router();

// GET /api/qb/health - QuickBooks health check
router.get('/health', (req: Request, res: Response) => {
  const requestLogger = req.logger || logger;

  requestLogger.debug('QuickBooks health check requested');

  res.json({
    ok: true,
    connected: config.FEATURE_QB && !!(config.QB_CLIENT_ID && config.QB_CLIENT_SECRET),
    message: config.FEATURE_QB
      ? 'QuickBooks integration enabled'
      : 'QuickBooks integration disabled',
    configured: !!(config.QB_CLIENT_ID && config.QB_CLIENT_SECRET),
  });
});

export default router;

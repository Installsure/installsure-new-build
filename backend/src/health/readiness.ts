import { Request, Response } from 'express';
import { db } from '../data/db.js';
import { isQueueHealthy } from '../infra/queue.js';
import { config } from '../infra/config.js';
import { logger } from '../infra/logger.js';

export const readinessHandler = async (req: Request, res: Response) => {
  const requestLogger = req.logger || logger;

  try {
    requestLogger.debug('Performing readiness check');

    const checks: PromiseSettledResult<boolean>[] = await Promise.allSettled([
      db.healthCheck(),
      isQueueHealthy(),
    ]);

    const [dbCheck, queueCheck] = checks;

    const isDbHealthy = dbCheck.status === 'fulfilled' && dbCheck.value === true;
    const isQueueHealthyResult = queueCheck.status === 'fulfilled' && queueCheck.value === true;

    const isReady = isDbHealthy && isQueueHealthyResult;

    const status = {
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: isDbHealthy ? 'healthy' : 'unhealthy',
          error: dbCheck.status === 'rejected' ? dbCheck.reason?.message : undefined,
        },
        queue: {
          status: isQueueHealthyResult ? 'healthy' : 'unhealthy',
          error: queueCheck.status === 'rejected' ? queueCheck.reason?.message : undefined,
        },
      },
    };

    if (isReady) {
      requestLogger.debug('Readiness check passed');
      res.status(200).json(status);
    } else {
      requestLogger.warn({ checks: status.checks }, 'Readiness check failed');
      res.status(503).json(status);
    }
  } catch (error) {
    requestLogger.error({ error: (error as Error).message }, 'Readiness check error');

    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed',
    });
  }
};

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { createRequestLogger } from '../../infra/logger.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      logger: ReturnType<typeof createRequestLogger>;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate or extract request ID
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  // Attach to request
  req.requestId = requestId;
  req.logger = createRequestLogger(requestId, req.method, req.url);

  // Add to response headers
  res.set('X-Request-ID', requestId);

  next();
};

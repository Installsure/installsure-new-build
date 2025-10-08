import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { captureException } from '../../infra/sentry.js';
import { logger } from '../../infra/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class OperationalError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new OperationalError(message, statusCode);
  return error;
};

export const errorHandler = (error: AppError, req: Request, res: Response, next: NextFunction) => {
  const requestLogger = req.logger || logger;

  // Log the error
  requestLogger.error(
    {
      error: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
    },
    'Request error',
  );

  // Capture in Sentry if it's an operational error or unexpected error
  if (error.isOperational || !error.statusCode) {
    captureException(error, {
      requestId: req.requestId,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  }

  // Determine status code
  let statusCode = error.statusCode || 500;
  let message = error.message;

  // Handle specific error types
  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
  }

  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response: any = {
    error: message,
    requestId: req.requestId,
  };

  // Add additional details in development
  if (isDevelopment) {
    response.stack = error.stack;
    response.details = error instanceof ZodError ? error.errors : undefined;
  }

  // Add retry information for rate limiting
  if (statusCode === 429) {
    const retryAfter = req.headers['retry-after'];
    if (retryAfter) {
      response.retryAfter = retryAfter;
    }
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from '../../infra/config.js';
import { logger } from '../../infra/logger.js';

export const securityMiddleware = (app: express.Application) => {
  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: [
            "'self'",
            'https://developer.api.autodesk.com',
            'https://quickbooks.api.intuit.com',
            'https://api.sentry.io',
          ],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for file uploads
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (config.CORS_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn({ origin }, 'CORS blocked request from origin');
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      exposedHeaders: ['X-Request-ID'],
    }),
  );

  // Body parsing with limits
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        // Store raw body for webhook verification if needed
        (req as any).rawBody = buf;
      },
    }),
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: '10mb',
    }),
  );

  // Request logging
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        },
      },
    }),
  );

  // Global rate limiting
  const globalRateLimit = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(
        {
          ip: req.ip,
          requestId: req.requestId,
        },
        'Rate limit exceeded',
      );

      res.status(429).json({
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000),
      });
    },
  });

  app.use(globalRateLimit);

  // File upload rate limiting (more restrictive)
  const fileUploadRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // 15 uploads per 15 minutes per IP
    message: {
      error: 'Too many file uploads, please try again later.',
      retryAfter: 900,
    },
    skipSuccessfulRequests: true,
  });

  // This will be applied to file upload routes specifically
  app.use('/api/files/upload', fileUploadRateLimit);
};

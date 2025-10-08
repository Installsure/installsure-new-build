import { config } from './config.js';
import { logger } from './logger.js';

// Sentry would be imported here when the feature flag is enabled
// import * as Sentry from '@sentry/node';

export const initSentry = () => {
  if (!config.FEATURE_SENTRY || !config.SENTRY_DSN) {
    logger.info('Sentry disabled or DSN not configured');
    return;
  }

  logger.info('Initializing Sentry...');

  // Sentry initialization would go here
  // Sentry.init({
  //   dsn: config.SENTRY_DSN,
  //   environment: config.NODE_ENV,
  //   tracesSampleRate: config.NODE_ENV === 'production' ? 0.1 : 1.0,
  // });

  logger.info('Sentry initialized');
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (!config.FEATURE_SENTRY) {
    logger.error({ error: error.message, ...context }, 'Exception captured (Sentry disabled)');
    return;
  }

  // Sentry.captureException(error, { extra: context });
  logger.error({ error: error.message, ...context }, 'Exception captured');
};

export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>,
) => {
  if (!config.FEATURE_SENTRY) {
    if (level === 'warning') {
      logger.warn({ ...context }, message);
    } else {
      logger[level]({ ...context }, message);
    }
    return;
  }

  // Sentry.captureMessage(message, level, { extra: context });
  if (level === 'warning') {
    logger.warn({ ...context }, message);
  } else {
    logger[level]({ ...context }, message);
  }
};

export const addBreadcrumb = (
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>,
) => {
  if (!config.FEATURE_SENTRY) {
    logger.debug({ category, ...data }, `Breadcrumb: ${message}`);
    return;
  }

  // Sentry.addBreadcrumb({
  //   message,
  //   category,
  //   level,
  //   data,
  // });
  logger.debug({ category, ...data }, `Breadcrumb: ${message}`);
};

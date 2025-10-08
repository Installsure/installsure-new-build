import pino from 'pino';
import { config } from './config.js';

const baseLogger = pino({
  level: config.LOG_LEVEL,
  ...(config.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

export const logger = baseLogger;

export const createChildLogger = (context: Record<string, any> = {}) => {
  return baseLogger.child(context);
};

export const createRequestLogger = (requestId: string, method: string, url: string) => {
  return baseLogger.child({
    requestId,
    method,
    url,
    type: 'request',
  });
};

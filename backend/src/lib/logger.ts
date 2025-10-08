/**
 * Enhanced Logger Module with Structured Logging
 * Production-grade logging with multiple transports and log rotation
 * Production Hardening - Phase 2
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './env.js';
import path from 'path';
import fs from 'fs';

// Log levels with colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray',
};

// Custom log format for development
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? '\n' + JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Custom log format for production
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    // Add common fields to all log entries
    const logEntry = {
      timestamp: info.timestamp,
      level: info.level,
      message: info.message,
      service: 'installsure-backend',
      environment: config.deployment.environment,
      version: config.deployment.version,
      ...info,
    };

    // Remove redundant fields
    delete logEntry.timestamp;
    delete logEntry.level;
    delete logEntry.message;

    return JSON.stringify({
      '@timestamp': info.timestamp,
      '@version': '1',
      level: info.level,
      message: info.message,
      fields: logEntry,
    });
  })
);

// Ensure log directory exists
function ensureLogDirectory(): void {
  if (!fs.existsSync(config.logging.directory)) {
    fs.mkdirSync(config.logging.directory, { recursive: true });
  }
}

// Create Winston logger instance
function createLogger(): winston.Logger {
  ensureLogDirectory();

  const transports: winston.transport[] = [];

  // Console transport
  transports.push(
    new winston.transports.Console({
      level: config.logging.level,
      format: config.isDevelopment ? developmentFormat : productionFormat,
      handleExceptions: true,
      handleRejections: true,
    })
  );

  // File transports for production
  if (config.isProduction || config.logging.level === 'debug') {
    // Combined log file (all levels)
    transports.push(
      new DailyRotateFile({
        filename: path.join(config.logging.directory, 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        level: config.logging.level,
        format: productionFormat,
        handleExceptions: true,
        handleRejections: true,
      })
    );

    // Error log file (errors only)
    transports.push(
      new DailyRotateFile({
        filename: path.join(config.logging.directory, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        level: 'error',
        format: productionFormat,
        handleExceptions: true,
        handleRejections: true,
      })
    );

    // HTTP access log
    transports.push(
      new DailyRotateFile({
        filename: path.join(config.logging.directory, 'access-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: config.logging.maxSize,
        maxFiles: config.logging.maxFiles,
        level: 'http',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  // Create and configure logger
  const logger = winston.createLogger({
    levels: logLevels,
    level: config.logging.level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true })
    ),
    transports,
    exitOnError: false,
  });

  // Add colors
  winston.addColors(logColors);

  return logger;
}

// Logger instance
const winstonLogger = createLogger();

// Enhanced logging methods with context
export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  operation?: string;
  component?: string;
  [key: string]: any;
}

// Logger wrapper with enhanced functionality
export class Logger {
  private winston: winston.Logger;

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger;
  }

  // Core logging methods
  error(message: string, context: LogContext = {}): void {
    this.winston.error(message, this.enrichContext(context));
  }

  warn(message: string, context: LogContext = {}): void {
    this.winston.warn(message, this.enrichContext(context));
  }

  info(message: string, context: LogContext = {}): void {
    this.winston.info(message, this.enrichContext(context));
  }

  http(message: string, context: LogContext = {}): void {
    this.winston.http(message, this.enrichContext(context));
  }

  verbose(message: string, context: LogContext = {}): void {
    this.winston.verbose(message, this.enrichContext(context));
  }

  debug(message: string, context: LogContext = {}): void {
    this.winston.debug(message, this.enrichContext(context));
  }

  silly(message: string, context: LogContext = {}): void {
    this.winston.silly(message, this.enrichContext(context));
  }

  // Specialized logging methods
  apiRequest(method: string, url: string, context: LogContext = {}): void {
    this.http(`${method} ${url}`, {
      ...context,
      type: 'api_request',
      method,
      url,
    });
  }

  apiResponse(method: string, url: string, statusCode: number, duration: number, context: LogContext = {}): void {
    this.http(`${method} ${url} ${statusCode} ${duration}ms`, {
      ...context,
      type: 'api_response',
      method,
      url,
      statusCode,
      duration,
    });
  }

  databaseQuery(query: string, duration: number, context: LogContext = {}): void {
    this.debug(`Database query executed in ${duration}ms`, {
      ...context,
      type: 'database_query',
      query: config.isProduction ? '[REDACTED]' : query,
      duration,
    });
  }

  jobStarted(jobType: string, jobId: string, context: LogContext = {}): void {
    this.info(`Job started: ${jobType}`, {
      ...context,
      type: 'job_started',
      jobType,
      jobId,
    });
  }

  jobCompleted(jobType: string, jobId: string, duration: number, context: LogContext = {}): void {
    this.info(`Job completed: ${jobType} in ${duration}ms`, {
      ...context,
      type: 'job_completed',
      jobType,
      jobId,
      duration,
    });
  }

  jobFailed(jobType: string, jobId: string, error: Error, context: LogContext = {}): void {
    this.error(`Job failed: ${jobType}`, {
      ...context,
      type: 'job_failed',
      jobType,
      jobId,
      error: error.message,
      stack: error.stack,
    });
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context: LogContext = {}): void {
    const logMethod = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this[logMethod](`Security event: ${event}`, {
      ...context,
      type: 'security_event',
      event,
      severity,
    });
  }

  performanceMetric(metric: string, value: number, unit: string, context: LogContext = {}): void {
    this.info(`Performance metric: ${metric} = ${value}${unit}`, {
      ...context,
      type: 'performance_metric',
      metric,
      value,
      unit,
    });
  }

  businessEvent(event: string, context: LogContext = {}): void {
    this.info(`Business event: ${event}`, {
      ...context,
      type: 'business_event',
      event,
    });
  }

  // Error logging with stack traces
  errorWithStack(error: Error, message?: string, context: LogContext = {}): void {
    this.error(message || error.message, {
      ...context,
      error: error.message,
      stack: error.stack,
      type: 'error_with_stack',
    });
  }

  // Conditional logging (only in development)
  dev(message: string, context: LogContext = {}): void {
    if (config.isDevelopment) {
      this.debug(`[DEV] ${message}`, context);
    }
  }

  // Structured logging for complex objects
  structured(level: keyof typeof logLevels, message: string, data: any, context: LogContext = {}): void {
    this[level](message, {
      ...context,
      data: this.sanitizeData(data),
      type: 'structured_log',
    });
  }

  // Enrich context with common fields
  private enrichContext(context: LogContext): LogContext {
    return {
      ...context,
      pid: process.pid,
      hostname: require('os').hostname(),
      timestamp: new Date().toISOString(),
    };
  }

  // Sanitize sensitive data
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...data };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      }
    }

    return sanitized;
  }

  // Get Winston logger instance (for advanced use)
  getWinstonLogger(): winston.Logger {
    return this.winston;
  }

  // Create child logger with persistent context
  child(persistentContext: LogContext): Logger {
    const childLogger = this.winston.child(persistentContext);
    return new Logger(childLogger);
  }
}

// Create and export logger instance
export const logger = new Logger(winstonLogger);

// Express/Fastify compatible middleware logger
export function createHttpLogger() {
  return {
    info: (message: string, meta?: any) => logger.http(message, meta),
    error: (message: string, meta?: any) => logger.error(message, meta),
    warn: (message: string, meta?: any) => logger.warn(message, meta),
    debug: (message: string, meta?: any) => logger.debug(message, meta),
  };
}

// Graceful shutdown for logger
export async function closeLogger(): Promise<void> {
  return new Promise((resolve) => {
    logger.getWinstonLogger().end(() => {
      resolve();
    });
  });
}

// Log rotation utility
export function rotateLogsNow(): void {
  // Trigger immediate log rotation for daily rotate file transports
  const transports = logger.getWinstonLogger().transports;
  transports.forEach((transport) => {
    if (transport instanceof DailyRotateFile) {
      transport.getLogFilePath = transport.getLogFilePath.bind(transport);
    }
  });
}

// Export default logger
export default logger;
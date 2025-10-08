/**
 * Enhanced HTTP Server Factory with Fastify
 * Production-grade server with security middleware, monitoring, and graceful shutdown
 * Production Hardening - Phase 2
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config, getEnvironmentInfo } from './env.js';
import { getRedisClient } from './redis.js';
import { getQueueManager } from './queue.js';
import { logger } from './logger.js';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import compress from '@fastify/compress';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

// Server configuration interface
export interface ServerConfig {
  host?: string;
  port?: number;
  logger?: boolean;
  trustProxy?: boolean;
  requestTimeout?: number;
  bodyLimit?: number;
  keepAliveTimeout?: number;
  maxParamLength?: number;
}

// Plugin registration options
export interface PluginOptions {
  cors?: boolean;
  helmet?: boolean;
  rateLimit?: boolean;
  compression?: boolean;
  multipart?: boolean;
  websocket?: boolean;
  swagger?: boolean;
  monitoring?: boolean;
}

// Request context interface
export interface RequestContext {
  requestId: string;
  startTime: number;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  tracing?: {
    traceId: string;
    spanId: string;
  };
}

// Declare Fastify instance with custom properties
declare module 'fastify' {
  interface FastifyRequest {
    ctx: RequestContext;
  }
}

// Custom error class for HTTP errors
export class HTTPError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'HTTPError';
  }
}

// Server factory class
export class ServerFactory {
  private server: FastifyInstance | null = null;
  private isShuttingDown = false;
  private shutdownTimeout = 10000; // 10 seconds

  constructor(private serverConfig: ServerConfig = {}) {}

  // Create and configure Fastify server
  async createServer(pluginOptions: PluginOptions = {}): Promise<FastifyInstance> {
    const server = Fastify({
      logger: {
        level: config.logging.level,
        transport: config.isDevelopment ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        } : undefined,
      },
      trustProxy: this.serverConfig.trustProxy ?? true,
      requestTimeout: this.serverConfig.requestTimeout ?? 30000,
      bodyLimit: this.serverConfig.bodyLimit ?? config.upload.maxSize,
      keepAliveTimeout: this.serverConfig.keepAliveTimeout ?? 5000,
      maxParamLength: this.serverConfig.maxParamLength ?? 100,
      disableRequestLogging: config.isProduction,
      ...this.serverConfig,
    });

    // Register core plugins
    await this.registerCorePlugins(server, pluginOptions);

    // Add hooks
    this.registerHooks(server);

    // Add error handler
    this.registerErrorHandler(server);

    // Add health check routes
    this.registerHealthRoutes(server);

    // Add monitoring routes (if enabled)
    if (pluginOptions.monitoring !== false) {
      this.registerMonitoringRoutes(server);
    }

    this.server = server;
    return server;
  }

  // Register core plugins
  private async registerCorePlugins(
    server: FastifyInstance,
    options: PluginOptions
  ): Promise<void> {
    // Sensible defaults and utilities
    await server.register(sensible);

    // Security headers
    if (options.helmet !== false) {
      await server.register(helmet, {
        contentSecurityPolicy: config.isProduction ? {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        } : false,
      });
    }

    // CORS configuration
    if (options.cors !== false) {
      await server.register(cors, {
        origin: config.server.cors.origin,
        credentials: config.server.cors.credentials,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      });
    }

    // Rate limiting
    if (options.rateLimit !== false) {
      await server.register(rateLimit, {
        max: config.server.rateLimit.max,
        timeWindow: config.server.rateLimit.windowMs,
        cache: 10000,
        allowList: ['127.0.0.1', '::1'],
        redis: getRedisClient().raw,
        keyGenerator: (request: FastifyRequest) => {
          return request.ip;
        },
        errorResponseBuilder: () => ({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded, retry later',
          statusCode: 429,
        }),
      });
    }

    // Compression
    if (options.compression !== false) {
      await server.register(compress, {
        global: true,
        threshold: 1024,
        encodings: ['gzip', 'deflate'],
      });
    }

    // File upload support
    if (options.multipart !== false) {
      await server.register(multipart, {
        limits: {
          fileSize: config.upload.maxSize,
          files: 10,
        },
        attachFieldsToBody: true,
      });
    }

    // WebSocket support
    if (options.websocket === true) {
      await server.register(websocket, {
        options: {
          maxPayload: 1048576, // 1MB
          verifyClient: (info) => {
            // Add custom WebSocket verification logic here
            return true;
          },
        },
      });
    }

    // API documentation
    if (options.swagger === true && config.isDevelopment) {
      await server.register(swagger, {
        swagger: {
          info: {
            title: 'InstallSure API',
            description: 'Construction Management Platform API',
            version: config.deployment.version,
          },
          host: `${config.server.host}:${config.server.port}`,
          schemes: ['http', 'https'],
          consumes: ['application/json', 'multipart/form-data'],
          produces: ['application/json'],
          securityDefinitions: {
            Bearer: {
              type: 'apiKey',
              name: 'Authorization',
              in: 'header',
            },
          },
        },
      });

      await server.register(swaggerUI, {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'full',
          deepLinking: false,
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
      });
    }
  }

  // Register hooks for request lifecycle
  private registerHooks(server: FastifyInstance): void {
    // Request ID and context
    server.addHook('onRequest', async (request, reply) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      request.ctx = {
        requestId,
        startTime: Date.now(),
        tracing: {
          traceId: request.headers['x-trace-id'] as string || requestId,
          spanId: Math.random().toString(36).substr(2, 9),
        },
      };

      // Add request ID to response headers
      reply.header('X-Request-ID', requestId);
      
      // Log request start
      logger.info('📥 Request started', {
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });
    });

    // Authentication context (if JWT token provided)
    server.addHook('preHandler', async (request, reply) => {
      const authHeader = request.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          // Add JWT verification logic here
          // For now, just extract user info if available
          const token = authHeader.substring(7);
          // request.ctx.user = await verifyJWT(token);
        } catch (error) {
          // Don't fail request, just log the error
          logger.warn('🔐 JWT verification failed', {
            requestId: request.ctx.requestId,
            error: error.message,
          });
        }
      }
    });

    // Response logging
    server.addHook('onSend', async (request, reply, payload) => {
      const duration = Date.now() - request.ctx.startTime;
      
      logger.info('📤 Request completed', {
        requestId: request.ctx.requestId,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration,
        contentLength: payload ? Buffer.byteLength(payload.toString()) : 0,
      });

      // Add performance headers
      reply.header('X-Response-Time', `${duration}ms`);
      
      return payload;
    });

    // Error logging
    server.addHook('onError', async (request, reply, error) => {
      logger.error('💥 Request error', {
        requestId: request.ctx?.requestId,
        method: request.method,
        url: request.url,
        error: error.message,
        stack: error.stack,
      });
    });
  }

  // Register error handler
  private registerErrorHandler(server: FastifyInstance): void {
    server.setErrorHandler(async (error, request, reply) => {
      const requestId = request.ctx?.requestId || 'unknown';
      
      // Handle different error types
      if (error instanceof HTTPError) {
        return reply.status(error.statusCode).send({
          error: {
            code: error.code,
            message: error.message,
            requestId,
          },
        });
      }

      // Validation errors
      if (error.validation) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: error.validation,
            requestId,
          },
        });
      }

      // Rate limit errors
      if (error.statusCode === 429) {
        return reply.status(429).send({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later',
            requestId,
          },
        });
      }

      // Default server error
      const statusCode = error.statusCode || 500;
      const message = config.isProduction 
        ? 'Internal server error' 
        : error.message;

      logger.error('🚨 Unhandled server error', {
        requestId,
        error: error.message,
        stack: error.stack,
        statusCode,
      });

      return reply.status(statusCode).send({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message,
          requestId,
        },
      });
    });
  }

  // Register health check routes
  private registerHealthRoutes(server: FastifyInstance): void {
    // Basic health check
    server.get('/health', async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: config.deployment.version,
        environment: config.deployment.environment,
        requestId: request.ctx.requestId,
      };
    });

    // Detailed health check
    server.get('/health/detailed', async (request, reply) => {
      try {
        const [redisHealth, queueHealth] = await Promise.all([
          getRedisClient().healthCheck(),
          getQueueManager().healthCheck(),
        ]);

        const envInfo = getEnvironmentInfo();

        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: config.deployment.version,
          environment: config.deployment.environment,
          services: {
            redis: redisHealth,
            queues: queueHealth,
          },
          system: envInfo,
          requestId: request.ctx.requestId,
        };
      } catch (error) {
        reply.status(503);
        return {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
          requestId: request.ctx.requestId,
        };
      }
    });

    // Readiness check
    server.get('/ready', async (request, reply) => {
      try {
        await getRedisClient().ping();
        return { status: 'ready', requestId: request.ctx.requestId };
      } catch (error) {
        reply.status(503);
        return { 
          status: 'not ready', 
          error: error.message,
          requestId: request.ctx.requestId,
        };
      }
    });

    // Liveness check
    server.get('/live', async (request, reply) => {
      return { 
        status: 'alive', 
        uptime: process.uptime(),
        requestId: request.ctx.requestId,
      };
    });
  }

  // Register monitoring routes
  private registerMonitoringRoutes(server: FastifyInstance): void {
    // Metrics endpoint
    server.get('/metrics', async (request, reply) => {
      if (!config.monitoring.metrics.enabled) {
        return reply.status(404).send({ error: 'Metrics disabled' });
      }

      try {
        const queueStats = await getQueueManager().getAllQueueStats();
        const envInfo = getEnvironmentInfo();

        return {
          timestamp: new Date().toISOString(),
          application: {
            name: 'installsure-backend',
            version: config.deployment.version,
            environment: config.deployment.environment,
          },
          system: envInfo,
          queues: queueStats,
          requestId: request.ctx.requestId,
        };
      } catch (error) {
        reply.status(503);
        return { error: error.message, requestId: request.ctx.requestId };
      }
    });

    // Server info
    server.get('/info', async (request, reply) => {
      return {
        application: {
          name: 'InstallSure Backend',
          version: config.deployment.version,
          environment: config.deployment.environment,
          buildDate: config.deployment.buildDate,
          commitSha: config.deployment.commitSha,
        },
        server: {
          host: config.server.host,
          port: config.server.port,
          uptime: process.uptime(),
        },
        features: config.features,
        requestId: request.ctx.requestId,
      };
    });
  }

  // Start server
  async start(): Promise<void> {
    if (!this.server) {
      throw new Error('Server not created. Call createServer() first.');
    }

    try {
      const address = await this.server.listen({
        host: this.serverConfig.host || config.server.host,
        port: this.serverConfig.port || config.server.port,
      });

      logger.info('🚀 Server started successfully', {
        address,
        environment: config.deployment.environment,
        version: config.deployment.version,
      });

      // Register graceful shutdown handlers
      this.registerShutdownHandlers();

    } catch (error) {
      logger.error('💥 Failed to start server', { error: error.message });
      throw error;
    }
  }

  // Register graceful shutdown handlers
  private registerShutdownHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }

      this.isShuttingDown = true;
      logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);

      const shutdownTimer = setTimeout(() => {
        logger.error('⏰ Graceful shutdown timeout, forcing exit');
        process.exit(1);
      }, this.shutdownTimeout);

      try {
        if (this.server) {
          await this.server.close();
          logger.info('✅ Server closed gracefully');
        }

        clearTimeout(shutdownTimer);
        process.exit(0);
      } catch (error) {
        logger.error('💥 Error during graceful shutdown', { error: error.message });
        clearTimeout(shutdownTimer);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled rejection', { reason, promise });
      process.exit(1);
    });
  }

  // Stop server
  async stop(): Promise<void> {
    if (this.server) {
      await this.server.close();
      this.server = null;
      logger.info('🛑 Server stopped');
    }
  }

  // Get server instance
  getServer(): FastifyInstance | null {
    return this.server;
  }
}

// Convenience functions
export function createServer(
  serverConfig: ServerConfig = {},
  pluginOptions: PluginOptions = {}
): Promise<FastifyInstance> {
  const factory = new ServerFactory(serverConfig);
  return factory.createServer(pluginOptions);
}

export function createServerFactory(config: ServerConfig = {}): ServerFactory {
  return new ServerFactory(config);
}

// Default export
export default {
  ServerFactory,
  createServer,
  createServerFactory,
  HTTPError,
};
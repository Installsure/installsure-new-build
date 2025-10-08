/**
 * Enhanced InstallSure Backend Server
 * Production-grade server with enhanced infrastructure components
 * Production Hardening - Phase 2
 */

import { config, validateRequiredEnvVars } from './lib/env.js';
import { createRedisClient, closeRedisConnection } from './lib/redis.js';
import { createQueueManager, shutdownQueueManager } from './lib/queue.js';
import { createServerFactory } from './lib/http.js';
import { logger, closeLogger } from './lib/logger.js';
import { FastifyInstance } from 'fastify';

// Import job processors
import './processors/fileProcessors.js';
import './processors/emailProcessors.js';
import './processors/notificationProcessors.js';

// Validate required environment variables
validateRequiredEnvVars([
  'API_SECRET',
  'JWT_SECRET'
]);

class InstallSureServer {
  private server: FastifyInstance | null = null;
  private isShuttingDown = false;

  async initialize(): Promise<void> {
    try {
      logger.info('🚀 Initializing InstallSure Backend Server', {
        version: config.deployment.version,
        environment: config.deployment.environment,
        nodeVersion: process.version,
      });

      // Initialize Redis connection
      logger.info('🔗 Connecting to Redis...');
      const redisClient = createRedisClient();
      await redisClient.connect();
      logger.info('✅ Redis connected successfully');

      // Initialize Queue Manager
      logger.info('📋 Initializing Queue Manager...');
      const queueManager = createQueueManager();
      logger.info('✅ Queue Manager initialized');

      // Create and configure Fastify server
      logger.info('⚙️ Creating HTTP server...');
      const serverFactory = createServerFactory({
        host: config.server.host,
        port: config.server.port,
      });

      this.server = await serverFactory.createServer({
        cors: true,
        helmet: true,
        rateLimit: true,
        compression: true,
        multipart: true,
        websocket: config.features.realTimeSync,
        swagger: config.isDevelopment,
        monitoring: true,
      });

      // Register API routes
      await this.registerRoutes();

      logger.info('✅ Server configuration complete');

    } catch (error) {
      logger.error('💥 Failed to initialize server', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async registerRoutes(): Promise<void> {
    if (!this.server) {
      throw new Error('Server not initialized');
    }

    // API v1 routes
    await this.server.register(async (fastify) => {
      // Health endpoints
      fastify.get('/api/health', async (request, reply) => {
        logger.apiRequest('GET', '/api/health', { requestId: request.ctx.requestId });
        
        const startTime = Date.now();
        
        try {
          const healthData = {
            ok: true,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: config.deployment.version,
            environment: config.deployment.environment,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
          };

          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/health', 200, duration, { 
            requestId: request.ctx.requestId 
          });

          return healthData;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/health', 500, duration, { 
            requestId: request.ctx.requestId,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      });

      fastify.get('/livez', async (request, reply) => {
        return { status: 'alive' };
      });

      fastify.get('/readyz', async (request, reply) => {
        // Check critical dependencies
        try {
          const redisClient = createRedisClient();
          await redisClient.ping();
          return { status: 'ready' };
        } catch (error) {
          reply.status(503);
          return { status: 'not ready', error: 'Redis connection failed' };
        }
      });

      // Projects API
      fastify.get('/api/projects', async (request, reply) => {
        logger.apiRequest('GET', '/api/projects', { requestId: request.ctx.requestId });
        
        const startTime = Date.now();
        
        try {
          // Mock data for now - replace with actual database queries
          const projects = [
            {
              id: '1',
              name: 'Downtown Office Complex',
              status: 'active',
              progress: 65,
              budget: 2500000,
              startDate: '2024-01-15',
              endDate: '2024-12-31',
              description: 'A modern office complex in the downtown area',
              contractor: 'BuildTech Solutions',
              location: '123 Main St, Downtown',
              files: []
            },
            {
              id: '2', 
              name: 'Residential Tower Phase II',
              status: 'planning',
              progress: 25,
              budget: 5000000,
              startDate: '2024-06-01',
              endDate: '2025-08-15',
              description: 'Second phase of residential tower development',
              contractor: 'Metro Construction',
              location: '456 Oak Ave, Midtown',
              files: []
            }
          ];

          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/projects', 200, duration, { 
            requestId: request.ctx.requestId,
            projectCount: projects.length 
          });

          return { success: true, data: projects };
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/projects', 500, duration, { 
            requestId: request.ctx.requestId,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      });

      // Project by ID
      fastify.get('/api/projects/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        logger.apiRequest('GET', `/api/projects/${id}`, { requestId: request.ctx.requestId });

        const startTime = Date.now();

        try {
          // Mock project data
          const project = {
            id,
            name: 'Downtown Office Complex',
            status: 'active',
            progress: 65,
            budget: 2500000,
            startDate: '2024-01-15',
            endDate: '2024-12-31',
            files: [],
            description: 'A modern office complex in the downtown area',
            contractor: 'BuildTech Solutions',
            location: '123 Main St, Downtown',
            tasks: [
              { id: '1', name: 'Foundation work', status: 'completed', progress: 100 },
              { id: '2', name: 'Steel framework', status: 'in-progress', progress: 75 },
              { id: '3', name: 'Electrical installation', status: 'pending', progress: 0 }
            ]
          };

          const duration = Date.now() - startTime;
          logger.apiResponse('GET', `/api/projects/${id}`, 200, duration, { 
            requestId: request.ctx.requestId,
            projectId: id 
          });

          return { success: true, data: project };
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.apiResponse('GET', `/api/projects/${id}`, 500, duration, { 
            requestId: request.ctx.requestId,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      });

      // Create new project
      fastify.post('/api/projects', {
        schema: {
          body: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string', minLength: 1 },
              description: { type: 'string' },
              budget: { type: 'number', minimum: 0 },
              startDate: { type: 'string', format: 'date' },
              endDate: { type: 'string', format: 'date' },
              contractor: { type: 'string' },
              location: { type: 'string' }
            }
          }
        }
      }, async (request, reply) => {
        logger.apiRequest('POST', '/api/projects', { requestId: request.ctx.requestId });

        const startTime = Date.now();

        try {
          const projectData = request.body as any;
          
          const project = {
            id: Date.now().toString(),
            ...projectData,
            status: 'planning',
            progress: 0,
            files: [],
            created_at: new Date().toISOString(),
          };

          const duration = Date.now() - startTime;
          logger.apiResponse('POST', '/api/projects', 201, duration, { 
            requestId: request.ctx.requestId,
            projectId: project.id 
          });

          reply.status(201);
          return { success: true, data: project };
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.apiResponse('POST', '/api/projects', 500, duration, { 
            requestId: request.ctx.requestId,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      });

      // File stats API
      fastify.get('/api/files/stats', async (request, reply) => {
        logger.apiRequest('GET', '/api/files/stats', { requestId: request.ctx.requestId });

        const startTime = Date.now();

        try {
          const stats = {
            totalFiles: 1247,
            totalSize: 15728640, // 15MB in bytes
            byType: {
              images: 856,
              documents: 312,
              videos: 45,
              cad: 78,
              other: 34
            },
            recentUploads: 23,
            storageUsed: '15.0 MB',
            storageLimit: '1.0 GB',
            processingQueue: 5
          };

          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/files/stats', 200, duration, { 
            requestId: request.ctx.requestId,
            totalFiles: stats.totalFiles 
          });

          return { success: true, data: stats };
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/files/stats', 500, duration, { 
            requestId: request.ctx.requestId,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      });

      // File upload endpoint
      fastify.post('/api/files/upload', async (request, reply) => {
        logger.apiRequest('POST', '/api/files/upload', { requestId: request.ctx.requestId });

        const startTime = Date.now();

        try {
          if (!request.isMultipart()) {
            reply.status(400);
            return { 
              success: false, 
              error: 'Request must be multipart/form-data' 
            };
          }

          const parts = request.parts();
          const uploadedFiles = [];

          for await (const part of parts) {
            if (part.type === 'file') {
              const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              // Validate file type
              const allowedTypes = ['.ifc', '.dwg', '.rvt', '.step', '.obj', '.gltf', '.glb', '.pdf', '.jpg', '.jpeg', '.png'];
              const ext = part.filename ? part.filename.toLowerCase().substring(part.filename.lastIndexOf('.')) : '';
              
              if (!allowedTypes.includes(ext)) {
                throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
              }
              
              // Add file processing job to queue
              const queueManager = (await import('./lib/queue.js')).getQueueManager();
              await queueManager.addJob('file-upload', {
                fileId,
                originalName: part.filename || 'unknown',
                mimeType: part.mimetype || 'application/octet-stream',
                size: 0, // Would be calculated during processing
                userId: request.ctx.user?.id,
              });

              uploadedFiles.push({
                id: fileId,
                originalName: part.filename,
                mimeType: part.mimetype,
                status: 'processing',
                uploadedAt: new Date().toISOString()
              });

              logger.businessEvent('file_upload_initiated', {
                requestId: request.ctx.requestId,
                fileId,
                fileName: part.filename,
                mimeType: part.mimetype,
                userId: request.ctx.user?.id,
              });
            }
          }

          const duration = Date.now() - startTime;
          logger.apiResponse('POST', '/api/files/upload', 200, duration, { 
            requestId: request.ctx.requestId,
            fileCount: uploadedFiles.length 
          });

          return { 
            success: true, 
            data: { 
              files: uploadedFiles,
              message: `${uploadedFiles.length} file(s) uploaded successfully` 
            } 
          };
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.apiResponse('POST', '/api/files/upload', 500, duration, { 
            requestId: request.ctx.requestId,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      });

      // Queue status endpoint
      fastify.get('/api/queue/status', async (request, reply) => {
        logger.apiRequest('GET', '/api/queue/status', { requestId: request.ctx.requestId });

        const startTime = Date.now();

        try {
          const queueManager = (await import('./lib/queue.js')).getQueueManager();
          const stats = await queueManager.getAllQueueStats();

          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/queue/status', 200, duration, { 
            requestId: request.ctx.requestId 
          });

          return { success: true, data: stats };
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.apiResponse('GET', '/api/queue/status', 500, duration, { 
            requestId: request.ctx.requestId,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }
      });

      // Forge/AutoCAD endpoints (maintained from original)
      fastify.post('/api/autocad/auth', async (request, reply) => {
        if (!config.forge.clientId || !config.forge.clientSecret) {
          reply.status(400);
          return {
            success: false,
            error: 'FORGE_CLIENT_ID/SECRET missing',
            message: 'Configure Forge credentials to enable this feature',
          };
        }
        return { 
          success: true, 
          data: { 
            token: 'mock-token', 
            expires_in: 3600 
          } 
        };
      });

      fastify.post('/api/autocad/upload', async (request, reply) => {
        if (!config.forge.clientId || !config.forge.clientSecret) {
          reply.status(400);
          return {
            success: false,
            error: 'FORGE_CLIENT_ID/SECRET missing',
            message: 'Configure Forge credentials to enable this feature',
          };
        }
        return { 
          success: true, 
          data: { 
            objectId: 'mock-object-id', 
            bucketKey: config.forge.bucket || 'installsure-dev' 
          } 
        };
      });

      fastify.post('/api/autocad/translate', async (request, reply) => {
        if (!config.forge.clientId || !config.forge.clientSecret) {
          reply.status(400);
          return {
            success: false,
            error: 'FORGE_CLIENT_ID/SECRET missing',
            message: 'Configure Forge credentials to enable this feature',
          };
        }
        return { 
          success: true, 
          data: { 
            jobId: 'mock-job-id', 
            urn: 'mock-urn' 
          } 
        };
      });

      fastify.get('/api/autocad/manifest/:urn', async (request, reply) => {
        if (!config.forge.clientId || !config.forge.clientSecret) {
          reply.status(400);
          return {
            success: false,
            error: 'FORGE_CLIENT_ID/SECRET missing',
            message: 'Configure Forge credentials to enable this feature',
          };
        }
        return { 
          success: true, 
          data: { 
            status: 'success', 
            derivatives: [] 
          } 
        };
      });

      fastify.get('/api/autocad/properties/:urn', async (request, reply) => {
        if (!config.forge.clientId || !config.forge.clientSecret) {
          reply.status(400);
          return {
            success: false,
            error: 'FORGE_CLIENT_ID/SECRET missing',
            message: 'Configure Forge credentials to enable this feature',
          };
        }
        return { 
          success: true, 
          data: { 
            properties: [] 
          } 
        };
      });

      fastify.get('/api/autocad/takeoff/:urn', async (request, reply) => {
        if (!config.forge.clientId || !config.forge.clientSecret) {
          reply.status(400);
          return {
            success: false,
            error: 'FORGE_CLIENT_ID/SECRET missing',
            message: 'Configure Forge credentials to enable this feature',
          };
        }
        return { 
          success: true, 
          data: { 
            areas: [], 
            lengths: [] 
          } 
        };
      });

      // QuickBooks endpoint
      fastify.get('/api/qb/health', async (request, reply) => {
        return {
          success: true,
          data: {
            ok: true,
            connected: false,
            message: 'QuickBooks integration not configured',
          }
        };
      });

      // WebSocket endpoint for real-time updates
      if (config.features.realTimeSync) {
        fastify.register(async function (fastify) {
          fastify.get('/ws', { websocket: true }, (connection, request) => {
            logger.info('🔌 WebSocket connection established', { 
              requestId: request.ctx?.requestId,
              ip: request.ip 
            });

            connection.socket.on('message', async (message) => {
              try {
                const data = JSON.parse(message.toString());
                logger.debug('📨 WebSocket message received', { 
                  requestId: request.ctx?.requestId,
                  type: data.type 
                });

                // Echo message back for now
                connection.socket.send(JSON.stringify({
                  type: 'echo',
                  data,
                  timestamp: new Date().toISOString(),
                  server: 'InstallSure Backend'
                }));
              } catch (error) {
                logger.error('💥 WebSocket message error', { 
                  requestId: request.ctx?.requestId,
                  error: error instanceof Error ? error.message : String(error)
                });
              }
            });

            connection.socket.on('close', () => {
              logger.info('🔌 WebSocket connection closed', { 
                requestId: request.ctx?.requestId 
              });
            });
          });
        });
      }
    });

    logger.info('✅ API routes registered successfully');
  }

  async start(): Promise<void> {
    if (!this.server) {
      throw new Error('Server not initialized. Call initialize() first.');
    }

    try {
      const serverFactory = createServerFactory();
      await serverFactory.start();

      logger.info('🎉 InstallSure Backend Server started successfully', {
        host: config.server.host,
        port: config.server.port,
        environment: config.deployment.environment,
        version: config.deployment.version,
        features: config.features,
        urls: {
          health: `http://${config.server.host}:${config.server.port}/api/health`,
          api: `http://${config.server.host}:${config.server.port}/api`,
          swagger: config.isDevelopment ? `http://${config.server.host}:${config.server.port}/documentation` : undefined,
          websocket: config.features.realTimeSync ? `ws://${config.server.host}:${config.server.port}/ws` : undefined,
        }
      });

      // Register graceful shutdown
      this.registerShutdownHandlers();

    } catch (error) {
      logger.error('💥 Failed to start server', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private registerShutdownHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        return;
      }

      this.isShuttingDown = true;
      logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);

      try {
        // Stop accepting new connections
        if (this.server) {
          await this.server.close();
          logger.info('✅ HTTP server closed');
        }

        // Shutdown queue manager
        await shutdownQueueManager();
        logger.info('✅ Queue manager shutdown');

        // Close Redis connection
        await closeRedisConnection();
        logger.info('✅ Redis connection closed');

        // Close logger
        await closeLogger();
        console.log('✅ Logger closed');

        process.exit(0);
      } catch (error) {
        console.error('💥 Error during graceful shutdown:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught exception', { 
        error: error.message, 
        stack: error.stack 
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled rejection', { reason, promise });
      process.exit(1);
    });
  }
}

// Main startup sequence
async function main() {
  try {
    const server = new InstallSureServer();
    await server.initialize();
    await server.start();
  } catch (error) {
    console.error('💥 Failed to start InstallSure Backend:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default InstallSureServer;

import { createServer } from 'http';
import { createApp } from './app.js';
import { config } from './infra/config.js';
import { logger } from './infra/logger.js';
import { initSentry } from './infra/sentry.js';
import { initializeWebSocket } from './infra/websocket.js';
import { db } from './data/db.js';
import { redisManager } from './infra/redis.js';

async function startServer() {
  try {
    // Initialize Sentry early
    initSentry();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = createServer(app);

    // Initialize Redis connection
    await redisManager.connect();

    // Initialize WebSocket server
    const wsManager = initializeWebSocket(server);

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);

      // Stop accepting new connections
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close WebSocket connections
      wsManager.wss.close(() => {
        logger.info('WebSocket server closed');
      });

      // Close database connections
      await db.close();
      logger.info('Database connections closed');

      // Close Redis connections
      await redisManager.disconnect();
      logger.info('Redis connections closed');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error({ error: error.message, stack: error.stack }, 'Uncaught exception');
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled rejection');
      gracefulShutdown('unhandledRejection');
    });

    // Start server
    server.listen(config.PORT, () => {
      logger.info(
        {
          port: config.PORT,
          environment: config.NODE_ENV,
          websocketEnabled: true,
          redisEnabled: redisManager.isHealthy(),
          connections: wsManager.getConnectionStats(),
        },
        'InstallSure server started successfully',
      );

      console.log(`🚀 InstallSure Server running on port ${config.PORT}`);
      console.log(`📊 Health check: http://localhost:${config.PORT}/api/health`);
      console.log(`🔌 WebSocket: ws://localhost:${config.PORT}/ws`);
      console.log(`🔧 Environment: ${config.NODE_ENV}`);
    });

    // Health check endpoint with WebSocket stats
    app.get('/api/health/websocket', (req, res) => {
      const stats = wsManager.getConnectionStats();
      res.json({
        websocket: {
          enabled: true,
          totalConnections: stats.totalConnections,
          userConnections: stats.userConnections,
          companyConnections: stats.companyConnections,
        },
      });
    });
  } catch (error) {
    logger.error(
      { error: (error as Error).message, stack: (error as Error).stack },
      'Failed to start server',
    );
    process.exit(1);
  }
}

// Start the server
startServer();

import { createApp } from './app.js';
import { config } from './infra/config.js';
import { logger } from './infra/logger.js';
import { initDatabase } from './data/db.js';

const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    logger.info('Database initialized');

    // Create Express app
    const app = createApp();

    // Start server
    const PORT = config.PORT || 8000;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 InstallSure Backend running on port ${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🔧 Environment: ${config.NODE_ENV}`);
      logger.info(`📁 Upload directory: ${config.FILES_LOCAL_DIR}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();




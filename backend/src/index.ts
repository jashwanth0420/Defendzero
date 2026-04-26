import app from './app';
import { config } from './config/env.config';
import { logger } from './utils/logger';

process.on('unhandledRejection', (error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown unhandled rejection';
  logger.error('Unhandled rejection', { message });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

const startServer = async () => {
  try {
    app.listen(config.PORT, () => {
      logger.info('DefendZero server running', {
        port: config.PORT,
        environment: config.NODE_ENV
      });
    });
  } catch (error: any) {
    logger.error('Failed to start server', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();

import { app } from './src/app.js';
import { config } from './src/config/index.js';
import { logger } from './src/utils/logger.js';

const server = app.listen(config.port, () => {
  logger.info(`College ERP Server running on port ${config.port} in ${config.env} mode`);
});

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

require('dotenv').config();
// Force reload comment 4
const http = require('http');
const app = require('./app');
const socketServer = require('./socket');
const { sequelize } = require('./models');
const { startSubscriptionExpiryJob } = require('./jobs/subscriptionExpiry.job');
const logger = require('./config/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    if (NODE_ENV === 'development') {
      logger.info('Sequelize connected (use `npm run db:migrate` to sync schema)');
    }

    startSubscriptionExpiryJob();

    // Create HTTP server from Express app so Socket.IO can share the same port
    const httpServer = http.createServer(app);

    // Initialise Socket.IO
    socketServer.init(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`StreamVault API + WebSocket server running`, {
        port: PORT,
        env: NODE_ENV,
        url: `http://localhost:${PORT}`,
      });
    });

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');
        try {
          await sequelize.close();
          logger.info('Database connection closed');
        } catch (err) {
          logger.error('Error closing database', { error: err.message });
        }
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
      });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
      process.exit(1);
    });

    return httpServer;
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

startServer();

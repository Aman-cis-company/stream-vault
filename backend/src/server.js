require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { startSubscriptionExpiryJob } = require('./jobs/subscriptionExpiry.job');
const logger = require('./config/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    if (NODE_ENV === 'development') {
      // Sync models in development only (use migrations in production)
      // await sequelize.sync({ alter: true });
      logger.info('Sequelize connected (use `npm run db:migrate` to sync schema)');
    }

    // Start background jobs
    startSubscriptionExpiryJob();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`StreamVault API server running`, {
        port: PORT,
        env: NODE_ENV,
        url: `http://localhost:${PORT}`,
      });
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await sequelize.close();
          logger.info('Database connection closed');
        } catch (err) {
          logger.error('Error closing database', { error: err.message });
        }

        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        promise: String(promise),
      });
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
      process.exit(1);
    });

    return server;
  } catch (err) {
    logger.error('Failed to start server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

startServer();

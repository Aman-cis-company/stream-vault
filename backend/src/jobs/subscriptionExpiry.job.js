const cron = require('node-cron');
const SubscriptionRepository = require('../api/repositories/SubscriptionRepository');
const logger = require('../config/logger');

/**
 * Subscription Expiry Job
 *
 * Runs every day at midnight to mark subscriptions past their end_date as 'expired'.
 * Schedule: '0 0 * * *' — every day at 00:00
 */
const startSubscriptionExpiryJob = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running subscription expiry job...');

    try {
      const now = new Date();
      const expiring = await SubscriptionRepository.findExpiring(now);

      if (expiring.length === 0) {
        logger.info('No subscriptions to expire.');
        return;
      }

      let expiredCount = 0;
      for (const sub of expiring) {
        try {
          await SubscriptionRepository.updateById(sub.id, { status: 'expired' });
          expiredCount++;
        } catch (err) {
          logger.error('Failed to expire subscription', { subscriptionId: sub.id, error: err.message });
        }
      }

      logger.info(`Subscription expiry job completed. Expired: ${expiredCount}/${expiring.length}`);
    } catch (err) {
      logger.error('Subscription expiry job failed', { error: err.message });
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('Subscription expiry cron job registered (runs daily at midnight IST)');
};

module.exports = { startSubscriptionExpiryJob };

const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('../config/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  maxRetriesPerRequest: null,
};

let connection = null;
try {
  connection = new IORedis(redisConfig);
  connection.on('error', (err) => {
    logger.warn('Redis queue connection issue (Queue will retry):', { error: err.message });
  });
} catch (e) {
  logger.error('Failed to instantiate IORedis connection:', { error: e.message });
}

const transcodingQueue = connection ? new Queue('transcoding', { connection }) : null;
const notificationQueue = connection ? new Queue('notification', { connection }) : null;

/**
 * Enqueue a video transcoding job (HLS, subtitles, and dubbing).
 * @param {string} name - Job name (e.g. 'transcode_movie', 'transcode_episode')
 * @param {object} data - Payload containing media parameters
 */
async function addTranscodingJob(name, data) {
  if (!transcodingQueue) {
    logger.error('Transcoding Queue is not available (Redis down).');
    throw new Error('Queue service unavailable');
  }
  try {
    const job = await transcodingQueue.add(name, data, {
      attempts: 3, // bullmq retries 3 times on failure
      backoff: {
        type: 'exponential',
        delay: 10000, // wait 10s before retry
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
    logger.info('Transcoding job enqueued successfully', { jobId: job.id, jobName: name });
    return job;
  } catch (err) {
    logger.error('Failed to enqueue transcoding job', { error: err.message });
    throw err;
  }
}

/**
 * Enqueue a notification email or SMS.
 * @param {string} name - Job name (e.g. 'send_email', 'send_sms')
 * @param {object} data - Payload containing email parameters
 */
async function addNotificationJob(name, data) {
  if (!notificationQueue) {
    logger.error('Notification Queue is not available (Redis down).');
    throw new Error('Queue service unavailable');
  }
  try {
    const job = await notificationQueue.add(name, data, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000, // wait 5s before retry
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
    logger.info('Notification job enqueued successfully', { jobId: job.id, jobName: name });
    return job;
  } catch (err) {
    logger.error('Failed to enqueue notification job', { error: err.message });
    throw err;
  }
}

module.exports = {
  transcodingQueue,
  notificationQueue,
  addTranscodingJob,
  addNotificationJob,
};

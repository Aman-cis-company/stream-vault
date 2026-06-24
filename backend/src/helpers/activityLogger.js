const { ActivityLog } = require('../models');
const logger = require('../config/logger');

/**
 * Log activity in the database.
 * @param {number|null} userId - The user ID associated with the action
 * @param {string} action - The action name (e.g. 'user_login', 'movie_created', 'invoice_created')
 * @param {object|null} details - Structured metadata or changes list
 * @param {object|string|null} reqOrIp - Express request object or direct IP string
 */
async function logActivity(userId, action, details = null, reqOrIp = null) {
  try {
    let ipAddress = null;
    if (reqOrIp) {
      if (typeof reqOrIp === 'string') {
        ipAddress = reqOrIp;
      } else if (reqOrIp.ip) {
        ipAddress = reqOrIp.ip;
      } else if (reqOrIp.headers) {
        ipAddress = reqOrIp.headers['x-forwarded-for'] || reqOrIp.socket?.remoteAddress;
      }
    }

    await ActivityLog.create({
      user_id: userId || null,
      action,
      details,
      ip_address: ipAddress || null,
    });
  } catch (err) {
    logger.error('Failed to write activity log', { error: err.message, action, userId });
  }
}

module.exports = { logActivity };

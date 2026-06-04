const SubscriptionRepository = require('../repositories/SubscriptionRepository');
const { errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const ROLES = require('../../constants/roles');
const logger = require('../../config/logger');

/**
 * Verify that the authenticated user has an active subscription.
 * Super admins and team members bypass this check.
 */
const verifySubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
    }

    const userRole = req.user.role ? req.user.role.name : null;

    // Staff bypass
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.TEAM_MEMBER) {
      return next();
    }

    const subscription = await SubscriptionRepository.findActiveByUserId(req.user.id);
    if (!subscription) {
      return errorResponse(res, MESSAGES.NO_ACTIVE_SUBSCRIPTION, STATUS_CODES.FORBIDDEN);
    }

    req.subscription = subscription;
    next();
  } catch (err) {
    logger.error('verifySubscription middleware error', { error: err.message });
    return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

module.exports = verifySubscription;

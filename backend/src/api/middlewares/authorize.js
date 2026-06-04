const { errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');

/**
 * Authorize middleware factory.
 * Usage: authorize('super_admin') or authorize('super_admin', 'team_member')
 *
 * Must be used AFTER authenticate.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
  }

  const userRole = req.user.role ? req.user.role.name : null;
  console.log('userRole: ', userRole);

  if (!userRole || !allowedRoles.includes(userRole)) {
    return errorResponse(res, MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN);
  }

  next();
};

module.exports = authorize;

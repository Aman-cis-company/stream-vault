const { verifyAccessToken } = require('../../helpers/tokenHelper');
const UserRepository = require('../repositories/UserRepository');
const { errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

/**
 * Authenticate middleware — verifies the JWT Bearer token, attaches req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return errorResponse(res, MESSAGES.INVALID_TOKEN, STATUS_CODES.UNAUTHORIZED);
    }

    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      return errorResponse(res, MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
    }

    if (user.status === 'inactive') {
      return errorResponse(res, MESSAGES.ACCOUNT_INACTIVE, STATUS_CODES.FORBIDDEN);
    }
    if (user.status === 'banned') {
      return errorResponse(res, MESSAGES.ACCOUNT_BANNED, STATUS_CODES.FORBIDDEN);
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('Authentication middleware error', { error: err.message });
    return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

module.exports = authenticate;

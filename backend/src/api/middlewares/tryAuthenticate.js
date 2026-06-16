const { verifyAccessToken } = require('../../helpers/tokenHelper');
const UserRepository = require('../repositories/UserRepository');
const logger = require('../../config/logger');

/**
 * Optional authentication middleware.
 * Verifies JWT if present, attaches req.user, but allows requests to proceed if unauthenticated.
 */
const tryAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (err) {
        // Suppress token verification failure and proceed as guest
        return next();
      }

      const user = await UserRepository.findById(decoded.id);
      if (user && user.status !== 'inactive' && user.status !== 'banned') {
        req.user = user;
      }
    }
    next();
  } catch (err) {
    logger.error('Optional authentication middleware error', { error: err.message });
    next();
  }
};

module.exports = tryAuthenticate;

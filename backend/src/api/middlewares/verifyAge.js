const { errorResponse } = require('../../helpers/responseHelper');
const STATUS_CODES = require('../../constants/statusCodes');
const ROLES = require('../../constants/roles');
const logger = require('../../config/logger');

const RATING_ORDER = ['G', 'PG', 'PG-13', '16+', '18+', '21+'];

function ratingToAge(rating) {
  const map = { 'G': 0, 'PG': 0, 'PG-13': 13, '16+': 16, '18+': 18, '21+': 21 };
  return map[rating] ?? 0;
}

function userAgeFromDob(dob) {
  if (!dob) return null;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Middleware factory. Checks that the authenticated user meets the minimum age
 * required for the requested content.
 *
 * Usage: verifyAge()               — checks movie/category from req.body or req.params
 *        verifyAge({ minAge: 18 }) — hard-coded minimum
 */
const verifyAge = (options = {}) => async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', STATUS_CODES.UNAUTHORIZED);
    }

    const userRole = req.user.role ? req.user.role.name : null;
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.TEAM_MEMBER) {
      return next();
    }

    const { minAge } = options;
    const requiredAge = minAge ?? 0;

    if (requiredAge === 0) return next();

    if (!req.user.age_verified) {
      return errorResponse(
        res,
        'Age verification required to access this content.',
        STATUS_CODES.FORBIDDEN,
      );
    }

    const userAge = userAgeFromDob(req.user.date_of_birth);
    if (userAge === null || userAge < requiredAge) {
      return errorResponse(
        res,
        `You must be at least ${requiredAge} years old to access this content.`,
        STATUS_CODES.FORBIDDEN,
      );
    }

    next();
  } catch (err) {
    logger.error('verifyAge middleware error', { error: err.message });
    return errorResponse(res, 'An internal server error occurred.', STATUS_CODES.INTERNAL_SERVER_ERROR);
  }
};

verifyAge.ratingToAge = ratingToAge;
verifyAge.RATING_ORDER = RATING_ORDER;

module.exports = verifyAge;

const { Role, Permission } = require('../../models');
const { errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');

/**
 * Middleware to check if the user has a specific permission.
 * Usage: checkPermission('movies:write')
 */
const checkPermission = (requiredPermission) => async (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED);
  }

  try {
    // Super admins always have full access
    if (req.user.role && req.user.role.name === 'super_admin') {
      return next();
    }

    // Load role with its permissions
    const roleWithPermissions = await Role.findByPk(req.user.role_id, {
      include: [{
        model: Permission,
        as: 'permissions',
        attributes: ['name'],
        through: { attributes: [] }
      }]
    });

    if (!roleWithPermissions) {
      return errorResponse(res, MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN);
    }

    const permissions = roleWithPermissions.permissions.map(p => p.name);
    
    if (!permissions.includes(requiredPermission)) {
      return errorResponse(res, MESSAGES.FORBIDDEN, STATUS_CODES.FORBIDDEN);
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = checkPermission;

const ROLES = require('../../constants/roles');

class AuthPolicy {
  /**
   * Can the user create a team member?
   */
  canCreateTeamMember(user) {
    return user.role && user.role.name === ROLES.SUPER_ADMIN;
  }

  /**
   * Can the user manage content (categories, movies)?
   */
  canManageContent(user) {
    return user.role && [ROLES.SUPER_ADMIN, ROLES.TEAM_MEMBER].includes(user.role.name);
  }

  /**
   * Can the user delete content?
   */
  canDeleteContent(user) {
    return user.role && user.role.name === ROLES.SUPER_ADMIN;
  }

  /**
   * Can the user access dashboard?
   */
  canAccessDashboard(user) {
    return user.role && user.role.name === ROLES.SUPER_ADMIN;
  }

  /**
   * Can the user update their own profile?
   */
  canUpdateProfile(user, targetUserId) {
    if (!user) return false;
    if (user.role && user.role.name === ROLES.SUPER_ADMIN) return true;
    return user.id === targetUserId;
  }
}

module.exports = new AuthPolicy();

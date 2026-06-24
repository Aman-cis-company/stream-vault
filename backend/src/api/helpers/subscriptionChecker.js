const SubscriptionRepository = require('../repositories/SubscriptionRepository');

const staffRoles = ['super_admin', 'admin', 'content_manager', 'finance_manager', 'affiliate_manager', 'support_agent', 'team_member'];

/**
 * Checks if the user is a staff member or has an active subscription.
 * Returns true if subscribed or staff, false otherwise.
 */
async function checkUserSubscription(user) {
  if (!user) return false;
  
  // Check if staff member
  const roleName = user.role ? user.role.name : null;
  if (roleName && staffRoles.includes(roleName)) {
    return true;
  }
  
  // Check active subscription
  const activeSub = await SubscriptionRepository.findActiveByUserId(user.id);
  return !!activeSub;
}

module.exports = {
  checkUserSubscription
};

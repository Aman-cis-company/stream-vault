const { UserSubscription, SubscriptionPlan, User } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

class SubscriptionRepository {
  async findActiveByUserId(userId) {
    return UserSubscription.findOne({
      where: {
        user_id: userId,
        status: 'active',
        end_date: { [Op.gt]: new Date() },
      },
      include: [{ model: SubscriptionPlan, as: 'plan' }],
    });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId) {
    return UserSubscription.findOne({
      where: { stripe_subscription_id: stripeSubscriptionId },
    });
  }

  async findByUserId(userId) {
    return UserSubscription.findAll({
      where: { user_id: userId },
      include: [{ model: SubscriptionPlan, as: 'plan' }],
      order: [['created_at', 'DESC']],
    });
  }

  async create(data) {
    return UserSubscription.create(data);
  }

  async updateById(id, data) {
    const [affected] = await UserSubscription.update(data, { where: { id } });
    return affected;
  }

  async updateByStripeSubscriptionId(stripeSubId, data) {
    const [affected] = await UserSubscription.update(data, {
      where: { stripe_subscription_id: stripeSubId },
    });
    return affected;
  }

  async countActive() {
    return UserSubscription.count({
      where: {
        status: 'active',
        end_date: { [Op.gt]: new Date() },
      },
    });
  }

  async findExpiring(beforeDate) {
    return UserSubscription.findAll({
      where: {
        status: 'active',
        end_date: { [Op.lte]: beforeDate },
      },
    });
  }

  async getSubscriberGrowth(months = 12) {
    const results = await UserSubscription.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        created_at: {
          [Op.gte]: literal(`DATE_SUB(NOW(), INTERVAL ${months} MONTH)`),
        },
      },
      group: [literal("DATE_FORMAT(created_at, '%Y-%m')")],
      order: [[literal("DATE_FORMAT(created_at, '%Y-%m')"), 'ASC']],
      raw: true,
    });
    return results;
  }
}

module.exports = new SubscriptionRepository();

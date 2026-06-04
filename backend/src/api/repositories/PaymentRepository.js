const { Payment, User, UserSubscription, SubscriptionPlan } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

class PaymentRepository {
  async create(data) {
    return Payment.create(data);
  }

  async findByStripePaymentIntentId(intentId) {
    return Payment.findOne({ where: { stripe_payment_intent_id: intentId } });
  }

  async findByStripeSessionId(sessionId) {
    return Payment.findOne({ where: { stripe_session_id: sessionId } });
  }

  async updateByStripePaymentIntentId(intentId, data) {
    const [affected] = await Payment.update(data, {
      where: { stripe_payment_intent_id: intentId },
    });
    return affected;
  }

  async findByUserId(userId, limit = 20) {
    return Payment.findAll({
      where: { user_id: userId },
      include: [
        {
          model: UserSubscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['id', 'name', 'billing_cycle'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  async findRecent(limit = 10) {
    return Payment.findAll({
      where: { status: 'succeeded' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
        {
          model: UserSubscription,
          as: 'subscription',
          include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['id', 'name'] }],
        },
      ],
      order: [['paid_at', 'DESC']],
      limit,
    });
  }

  async getTotalRevenue() {
    const result = await Payment.findOne({
      attributes: [[fn('SUM', col('amount')), 'total']],
      where: { status: 'succeeded' },
      raw: true,
    });
    return parseFloat(result.total) || 0;
  }

  async getMonthlyRevenue(months = 12) {
    const results = await Payment.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('paid_at'), '%Y-%m'), 'month'],
        [fn('SUM', col('amount')), 'revenue'],
        [fn('COUNT', col('id')), 'transactions'],
      ],
      where: {
        status: 'succeeded',
        paid_at: {
          [Op.gte]: literal(`DATE_SUB(NOW(), INTERVAL ${months} MONTH)`),
        },
      },
      group: [literal("DATE_FORMAT(paid_at, '%Y-%m')")],
      order: [[literal("DATE_FORMAT(paid_at, '%Y-%m')"), 'ASC']],
      raw: true,
    });
    return results;
  }

  async getYearlyRevenue(years = 3) {
    const results = await Payment.findAll({
      attributes: [
        [fn('YEAR', col('paid_at')), 'year'],
        [fn('SUM', col('amount')), 'revenue'],
        [fn('COUNT', col('id')), 'transactions'],
      ],
      where: {
        status: 'succeeded',
        paid_at: {
          [Op.gte]: literal(`DATE_SUB(NOW(), INTERVAL ${years} YEAR)`),
        },
      },
      group: [fn('YEAR', col('paid_at'))],
      order: [[fn('YEAR', col('paid_at')), 'ASC']],
      raw: true,
    });
    return results;
  }
}

module.exports = new PaymentRepository();

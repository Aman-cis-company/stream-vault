const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const authenticate = require('../middlewares/authenticate');
const { AffiliateCode, ReferralConversion, User, Payment, UserSubscription, SubscriptionPlan } = require('../../models');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const { fn, col } = require('sequelize');
const socketServer = require('../../socket');
const EVENTS = require('../../socket/events');

const COMMISSION_RATE = parseFloat(process.env.AFFILIATE_COMMISSION_RATE || '0.10');

function generateCode(userId) {
  const rand = crypto.randomBytes(4).toString('hex');
  return `sv-${String(userId).padStart(3, '0')}${rand}`;
}

// GET /api/v1/affiliate/code
router.get('/code', authenticate, async (req, res) => {
  try {
    let record = await AffiliateCode.findOne({ where: { user_id: req.user.id } });
    if (!record) {
      let code;
      let attempts = 0;
      do {
        code = generateCode(req.user.id);
        const exists = await AffiliateCode.findOne({ where: { code } });
        if (!exists) break;
        attempts++;
      } while (attempts < 5);

      record = await AffiliateCode.create({ user_id: req.user.id, code });
    }
    return successResponse(res, 'Affiliate code fetched', { code: record.code, totalClicks: record.total_clicks });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch affiliate code', 500);
  }
});

// GET /api/v1/affiliate/stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const affiliateCode = await AffiliateCode.findOne({ where: { user_id: req.user.id } });
    if (!affiliateCode) {
      return successResponse(res, 'Affiliate stats fetched', {
        totalClicks: 0,
        totalReferrals: 0,
        confirmedReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        recentConversions: [],
      });
    }

    const [conversions, earningsResult] = await Promise.all([
      ReferralConversion.findAll({
        where: { affiliate_code_id: affiliateCode.id },
        include: [
          { model: User, as: 'referredUser', attributes: ['id', 'first_name', 'last_name', 'email', 'createdAt'] },
          {
            model: Payment,
            as: 'payment',
            required: false,
            include: [{
              model: UserSubscription,
              as: 'subscription',
              required: false,
              include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['name'] }],
            }],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 10,
      }),
      ReferralConversion.findAll({
        attributes: [
          'status',
          [fn('SUM', col('commission_amount')), 'total'],
          [fn('COUNT', col('id')), 'count'],
        ],
        where: { affiliate_code_id: affiliateCode.id },
        group: ['status'],
        raw: true,
      }),
    ]);

    let totalEarnings = 0, pendingEarnings = 0, confirmedReferrals = 0, totalReferrals = 0;
    earningsResult.forEach((r) => {
      totalReferrals += parseInt(r.count) || 0;
      if (r.status === 'confirmed' || r.status === 'paid') {
        totalEarnings += parseFloat(r.total) || 0;
        confirmedReferrals += parseInt(r.count) || 0;
      } else if (r.status === 'pending') {
        pendingEarnings += parseFloat(r.total) || 0;
      }
    });

    const recentConversions = conversions.map((c) => ({
      id: c.id,
      referredUser: c.referredUser
        ? { name: `${c.referredUser.first_name} ${c.referredUser.last_name}`, email: c.referredUser.email, joinedAt: c.referredUser.createdAt }
        : null,
      planName: c.payment?.subscription?.plan?.name ?? null,
      commissionAmount: parseFloat(c.commission_amount) || 0,
      status: c.status,
      date: c.createdAt,
    }));

    return successResponse(res, 'Affiliate stats fetched', {
      totalClicks: affiliateCode.total_clicks,
      totalReferrals,
      confirmedReferrals,
      totalEarnings,
      pendingEarnings,
      recentConversions,
    });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch affiliate stats', 500);
  }
});

// POST /api/v1/affiliate/track — public
router.post('/track', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return errorResponse(res, 'code is required', 400);
    const record = await AffiliateCode.findOne({ where: { code } });
    if (!record) return errorResponse(res, 'Affiliate code not found', 404);
    await record.increment('total_clicks');

    // Notify affiliate of click in real time
    socketServer.emitToAffiliate(record.user_id, EVENTS.AFFILIATE_STATS_UPDATED, {
      field: 'totalClicks',
      value: record.total_clicks + 1,
    });

    return successResponse(res, 'Click tracked');
  } catch (err) {
    return errorResponse(res, 'Failed to track click', 500);
  }
});

module.exports = router;
module.exports.COMMISSION_RATE = COMMISSION_RATE;

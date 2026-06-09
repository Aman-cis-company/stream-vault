const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const { WatchHistory, Movie, Episode, Series, Payment, UserSubscription, SubscriptionPlan } = require('../../models');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const { fn, col, literal, Op } = require('sequelize');

// GET /api/v1/user/stats — hours watched, watch streak, affiliate earnings, next payment
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Total hours watched
    const watchResult = await WatchHistory.findOne({
      attributes: [[fn('SUM', col('watch_time')), 'total_seconds']],
      where: { user_id: userId },
      raw: true,
    });
    const totalSeconds = parseFloat(watchResult?.total_seconds) || 0;
    const hoursWatched = Math.round(totalSeconds / 3600);

    // Watch streak: count consecutive days ending today where the user watched something
    const watchDays = await WatchHistory.findAll({
      attributes: [[fn('DATE', col('last_watched_at')), 'watch_date']],
      where: {
        user_id: userId,
        last_watched_at: { [Op.not]: null },
      },
      group: [literal("DATE(last_watched_at)")],
      order: [[literal("DATE(last_watched_at)"), 'DESC']],
      raw: true,
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < watchDays.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const dayStr = expected.toISOString().slice(0, 10);
      if (watchDays[i].watch_date === dayStr) {
        streak++;
      } else {
        break;
      }
    }

    // Affiliate earnings = total succeeded payments by user
    const paymentResult = await Payment.findOne({
      attributes: [[fn('SUM', col('amount')), 'total']],
      where: { user_id: userId, status: 'succeeded' },
      raw: true,
    });
    const affiliateEarnings = parseFloat(paymentResult?.total) || 0;

    // Next payment date from active subscription
    const activeSub = await UserSubscription.findOne({
      where: { user_id: userId, status: 'active' },
      include: [{ model: SubscriptionPlan, as: 'plan', attributes: ['name', 'price', 'billing_cycle'] }],
      order: [['end_date', 'DESC']],
    });

    return successResponse(res, 'User stats fetched', {
      hoursWatched,
      watchStreak: streak,
      affiliateEarnings,
      nextPayment: activeSub
        ? { amount: activeSub.plan?.price ?? 0, dueDate: activeSub.end_date, planName: activeSub.plan?.name }
        : null,
    });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch user stats', 500);
  }
});

// GET /api/v1/user/watch-activity — monthly watch time (minutes) for the last 12 months
router.get('/watch-activity', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const rows = await WatchHistory.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('last_watched_at'), '%Y-%m'), 'month'],
        [fn('SUM', col('watch_time')), 'total_seconds'],
        [fn('COUNT', col('id')), 'sessions'],
      ],
      where: {
        user_id: userId,
        last_watched_at: {
          [Op.gte]: literal('DATE_SUB(NOW(), INTERVAL 12 MONTH)'),
        },
      },
      group: [literal("DATE_FORMAT(last_watched_at, '%Y-%m')")],
      order: [[literal("DATE_FORMAT(last_watched_at, '%Y-%m')"), 'ASC']],
      raw: true,
    });

    // Build full 12-month skeleton so months with 0 activity still appear
    const activity = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const found = rows.find((r) => r.month === key);
      activity.push({
        month: label,
        minutes: found ? Math.round(parseFloat(found.total_seconds) / 60) : 0,
        sessions: found ? parseInt(found.sessions) : 0,
      });
    }

    return successResponse(res, 'Watch activity fetched', { activity });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch watch activity', 500);
  }
});

// GET /api/v1/user/recent-activity — last 10 watch events with title info
router.get('/recent-activity', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);

    const records = await WatchHistory.findAll({
      where: { user_id: userId },
      include: [
        { model: Movie, as: 'movie', attributes: ['id', 'title', 'thumbnail_url'], required: false },
        {
          model: Episode,
          as: 'episode',
          attributes: ['id', 'title', 'episode_number', 'season_number'],
          required: false,
          include: [{ model: Series, as: 'series', attributes: ['id', 'title'], required: false }],
        },
      ],
      order: [['last_watched_at', 'DESC']],
      limit,
    });

    const activity = records.map((r) => {
      const raw = r.toJSON();
      let text = '';
      if (raw.movie) {
        text = `Watched "${raw.movie.title}"`;
      } else if (raw.episode) {
        const seriesTitle = raw.episode.series?.title ?? 'Series';
        text = `Watched "${seriesTitle}" S${raw.episode.season_number}E${raw.episode.episode_number} — ${raw.episode.title}`;
      } else {
        text = 'Watched content';
      }
      return {
        id: raw.id,
        text,
        time: raw.last_watched_at
          ? new Date(raw.last_watched_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
          : new Date(raw.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short' }),
        completionPercentage: parseFloat(raw.completion_percentage) || 0,
        watchTimeSec: raw.watch_time || 0,
      };
    });

    return successResponse(res, 'Recent activity fetched', { activity });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch recent activity', 500);
  }
});

module.exports = router;

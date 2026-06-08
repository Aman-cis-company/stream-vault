const express = require('express');
const router = express.Router();
const StripeController = require('../controllers/StripeController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const { webhookLimiter } = require('../middlewares/rateLimiter');
const {
  validateCreateCheckout,
  validateCreateSubscription,
  validateCancelSubscription,
} = require('../validators/subscription.validator');
const { SubscriptionPlan } = require('../../models');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const ROLES = require('../../constants/roles');
const PaymentRepository = require('../repositories/PaymentRepository');
const StripeService = require('../services/StripeService');
const logger = require('../../config/logger');

// ── Public: list active subscription plans ────────────────────────────────────
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { status: 'active' },
      order: [['id', 'ASC']],
    });
    return successResponse(res, 'Subscription plans fetched', { plans });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch plans', 500);
  }
});

// ── Admin: list ALL plans (including inactive) ────────────────────────────────
router.get('/plans/all', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({ order: [['id', 'ASC']] });
    return successResponse(res, 'All plans fetched', { plans });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch plans', 500);
  }
});

// ── Admin: update a subscription plan ────────────────────────────────────────
router.put('/plans/:id', authenticate, authorize(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByPk(req.params.id);
    if (!plan) return errorResponse(res, 'Plan not found', 404);

    const allowed = ['name', 'description', 'price', 'billing_cycle', 'stripe_price_id', 'features_json', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await plan.update(updates);
    return successResponse(res, 'Plan updated', { plan });
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to update plan', 500);
  }
});

// ── Public: return Stripe publishable key for frontend Elements ───────────────
router.get('/config', (req, res) => {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key || key.startsWith('pk_test_REPLACE')) {
    return errorResponse(res, 'Stripe publishable key not configured', 500);
  }
  return successResponse(res, 'Stripe config', { publishableKey: key });
});

// ── Custom embedded checkout: create incomplete subscription → return client_secret ──
router.post(
  '/create-subscription-intent',
  authenticate,
  async (req, res) => {
    try {
      const { plan_id, billing } = req.body;
      if (!plan_id) return errorResponse(res, 'plan_id is required', 400);
      const result = await StripeService.createSubscriptionIntent(req.user, plan_id, billing);
      return successResponse(res, 'Subscription intent created', result, 201);
    } catch (err) {
      logger.error('create-subscription-intent error', { error: err.message });
      return errorResponse(res, err.message || 'Failed to create subscription intent', err.statusCode || 500);
    }
  }
);

// ── Activate subscription after successful payment ────────────────────────────
router.post(
  '/activate-subscription',
  authenticate,
  async (req, res) => {
    try {
      const { subscription_id } = req.body;
      if (!subscription_id) return errorResponse(res, 'subscription_id is required', 400);
      const result = await StripeService.activateSubscription(req.user.id, subscription_id);
      return successResponse(res, 'Subscription activated', result);
    } catch (err) {
      logger.error('activate-subscription error', { error: err.message });
      return errorResponse(res, err.message || 'Failed to activate subscription', err.statusCode || 500);
    }
  }
);

// IMPORTANT: Webhook must use raw body — mounted BEFORE express.json() via app.js
// This route receives the raw body via express.raw() applied in app.js
router.post('/webhook', webhookLimiter, StripeController.webhook.bind(StripeController));

// Protected routes
router.post('/create-customer', authenticate, StripeController.createCustomer.bind(StripeController));

router.post(
  '/create-checkout-session',
  authenticate,
  validateCreateCheckout,
  StripeController.createCheckoutSession.bind(StripeController)
);

router.post(
  '/create-subscription',
  authenticate,
  validateCreateSubscription,
  StripeController.createSubscription.bind(StripeController)
);

router.post(
  '/cancel-subscription',
  authenticate,
  validateCancelSubscription,
  StripeController.cancelSubscription.bind(StripeController)
);

router.get('/subscription-status', authenticate, StripeController.getSubscriptionStatus.bind(StripeController));

// Current user's own payment history
router.get('/my-payments', authenticate, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const payments = await PaymentRepository.findByUserId(req.user.id, limit);
    return successResponse(res, 'Payments fetched', { payments });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch payments', 500);
  }
});

// Fulfill a completed checkout session (called from success page — works without webhooks)
router.post('/fulfill-checkout', authenticate, async (req, res) => {
  try {
    const { session_id } = req.body;
    console.log('--------------session_id:------------', session_id);

    if (!session_id) return errorResponse(res, 'session_id is required', 400);
    const result = await StripeService.fulfillCheckout(session_id);
    return successResponse(res, 'Checkout fulfilled', result);
  } catch (err) {
    return errorResponse(res, err.message || 'Failed to fulfill checkout', err.statusCode || 500);
  }
});

module.exports = router;

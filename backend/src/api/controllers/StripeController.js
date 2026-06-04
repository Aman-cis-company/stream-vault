const stripe = require('../../config/stripe');
const StripeService = require('../services/StripeService');
const { successResponse, errorResponse } = require('../../helpers/responseHelper');
const MESSAGES = require('../../constants/messages');
const STATUS_CODES = require('../../constants/statusCodes');
const logger = require('../../config/logger');

class StripeController {
  async createCustomer(req, res) {
    try {
      const customer = await StripeService.createOrGetCustomer(req.user);
      return successResponse(res, MESSAGES.CUSTOMER_CREATED, { customer }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('StripeController.createCustomer error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async createCheckoutSession(req, res) {
    try {
      const { plan_id, success_url, cancel_url } = req.body;
      const session = await StripeService.createCheckoutSession(
        req.user, plan_id, success_url, cancel_url
      );
      return successResponse(res, MESSAGES.CHECKOUT_SESSION_CREATED, { url: session.url, sessionId: session.id }, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('StripeController.createCheckoutSession error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async createSubscription(req, res) {
    try {
      const { plan_id, payment_method_id } = req.body;
      const result = await StripeService.createSubscription(req.user, plan_id, payment_method_id);
      return successResponse(res, MESSAGES.SUBSCRIPTION_CREATED, result, STATUS_CODES.CREATED);
    } catch (err) {
      logger.error('StripeController.createSubscription error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async cancelSubscription(req, res) {
    try {
      const { subscription_id } = req.body;
      const result = await StripeService.cancelSubscription(subscription_id);
      return successResponse(res, MESSAGES.SUBSCRIPTION_CANCELLED, { subscription: result });
    } catch (err) {
      logger.error('StripeController.cancelSubscription error', { error: err.message });
      return errorResponse(res, err.message || MESSAGES.INTERNAL_ERROR, err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async getSubscriptionStatus(req, res) {
    try {
      const subscription = await StripeService.getSubscriptionStatus(req.user.id);
      return successResponse(res, MESSAGES.SUBSCRIPTION_FETCHED, { subscription });
    } catch (err) {
      logger.error('StripeController.getSubscriptionStatus error', { error: err.message });
      return errorResponse(res, MESSAGES.INTERNAL_ERROR, STATUS_CODES.INTERNAL_SERVER_ERROR);
    }
  }

  async webhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      logger.warn('Stripe webhook signature verification failed', { error: err.message });
      return errorResponse(res, MESSAGES.INVALID_WEBHOOK, STATUS_CODES.BAD_REQUEST);
    }

    try {
      await StripeService.handleWebhook(event);
      return successResponse(res, MESSAGES.WEBHOOK_RECEIVED);
    } catch (err) {
      logger.error('StripeController.webhook processing error', { error: err.message, event: event.type });
      // Return 200 to prevent Stripe from retrying on our own processing error
      return successResponse(res, 'Webhook received with processing error');
    }
  }
}

module.exports = new StripeController();

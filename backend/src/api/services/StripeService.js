const stripe = require('../../config/stripe');
const SubscriptionRepository = require('../repositories/SubscriptionRepository');
const PaymentRepository = require('../repositories/PaymentRepository');
const UserRepository = require('../repositories/UserRepository');
const { SubscriptionPlan, ReferralConversion } = require('../../models');
const EmailService = require('./EmailService');
const logger = require('../../config/logger');

async function confirmReferralCommission(userId, paymentAmount) {
  try {
    const conversion = await ReferralConversion.findOne({
      where: { referred_user_id: userId, status: 'pending' },
    });
    if (conversion) {
      const commission = (parseFloat(paymentAmount) * parseFloat(conversion.commission_rate)).toFixed(2);
      await conversion.update({ commission_amount: commission, status: 'confirmed' });
      logger.info('Referral commission confirmed', { userId, commission });
    }
  } catch (e) {
    logger.warn('confirmReferralCommission error', { error: e.message });
  }
}

class StripeService {
  /**
   * Create or retrieve a Stripe customer for the user.
   */
  async createOrGetCustomer(user) {
    // Check if user already has a customer ID from an existing subscription
    const existingSub = await SubscriptionRepository.findByUserId
      ? (await SubscriptionRepository.findByUserId(user.id)).find((s) => s.stripe_customer_id)
      : null;

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

    if (existingSub && existingSub.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(existingSub.stripe_customer_id);
        if (!customer.deleted) {
          // Patch name if missing — required for Stripe India export compliance
          if (!customer.name && fullName) {
            await stripe.customers.update(customer.id, { name: fullName });
            customer.name = fullName;
          }
          return customer;
        }
      } catch (err) {
        logger.warn('Could not retrieve existing Stripe customer', { error: err.message });
      }
    }

    const customer = await stripe.customers.create({
      email: user.email,
      name: fullName,
      metadata: { user_id: String(user.id) },
    });

    logger.info('Stripe customer created', { customerId: customer.id, userId: user.id });
    return customer;
  }

  /**
   * Auto-create a Stripe Product + Price for a plan that has no stripe_price_id yet,
   * then persist the price ID so it is reused on future checkouts.
   */
  async ensureStripePriceId(plan) {
    if (plan.stripe_price_id) return plan;

    const product = await stripe.products.create({
      name: plan.name,
      ...(plan.description ? { description: plan.description } : {}),
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(Number(plan.price) * 100),
      currency: (plan.currency || 'INR').toLowerCase(),
      recurring: {
        interval: plan.billing_cycle === 'yearly' ? 'year' : 'month',
      },
    });

    await plan.update({ stripe_price_id: price.id });
    logger.info('Auto-created Stripe price for plan', { planId: plan.id, priceId: price.id });
    return plan;
  }

  /**
   * Create an incomplete Stripe subscription and return the PaymentIntent client_secret.
   * Used by the custom embedded checkout page — no redirect to stripe.com.
   */
  async createSubscriptionIntent(user, planId, billing) {
    let plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || plan.status !== 'active') {
      const err = new Error('Subscription plan not found or inactive');
      err.statusCode = 404;
      throw err;
    }

    plan = await this.ensureStripePriceId(plan);
    const customer = await this.createOrGetCustomer(user);

    // Required for Stripe India export compliance: customer must have name + address
    // before the subscription/PaymentIntent is created.
    if (billing) {
      const update = {};
      if (billing.name) update.name = billing.name;
      if (billing.line1 || billing.city || billing.state || billing.postal_code || billing.country) {
        update.address = {
          line1: billing.line1 || '',
          city: billing.city || '',
          state: billing.state || '',
          postal_code: billing.postal_code || '',
          country: billing.country || 'IN',
        };
      }
      if (Object.keys(update).length > 0) {
        await stripe.customers.update(customer.id, update);
        logger.info('Stripe customer updated with billing details', { customerId: customer.id });
      }
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.stripe_price_id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { user_id: String(user.id), plan_id: String(plan.id) },
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;

    logger.info('Subscription intent created', { subscriptionId: subscription.id, userId: user.id });

    return {
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      planId: plan.id,
      planName: plan.name,
      amount: Number(plan.price),
      currency: (plan.currency || 'INR').toUpperCase(),
      billingCycle: plan.billing_cycle,
    };
  }

  /**
   * Activate a subscription after payment confirmation.
   * Called from the success page with the Stripe subscription ID.
   * Idempotent — safe to call multiple times.
   */
  async activateSubscription(userId, stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
      expand: ['latest_invoice.payment_intent'],
    });

    if (!['active', 'trialing', 'incomplete'].includes(subscription.status)) {
      const err = new Error(`Subscription status is "${subscription.status}" — payment may not have completed.`);
      err.statusCode = 402;
      throw err;
    }

    const planId = parseInt(subscription.metadata?.plan_id, 10);
    const plan = planId ? await SubscriptionPlan.findByPk(planId) : null;

    const startDate = new Date(subscription.current_period_start * 1000);
    const endDate = new Date(subscription.current_period_end * 1000);

    let localSub = await SubscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!localSub) {
      localSub = await SubscriptionRepository.create({
        user_id: userId,
        plan_id: planId || null,
        stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
        stripe_subscription_id: stripeSubscriptionId,
        start_date: startDate,
        end_date: endDate,
        status: subscription.status === 'active' ? 'active' : 'pending',
      });
    } else {
      await SubscriptionRepository.updateByStripeSubscriptionId(stripeSubscriptionId, {
        status: subscription.status === 'active' ? 'active' : 'pending',
        start_date: startDate,
        end_date: endDate,
      });
      localSub = await SubscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
    }

    // Record the payment if not already done
    const pi = subscription.latest_invoice?.payment_intent;
    const piId = typeof pi === 'string' ? pi : pi?.id;
    if (piId) {
      const existing = await PaymentRepository.findByStripePaymentIntentId(piId);
      if (!existing && subscription.latest_invoice?.amount_paid) {
        await PaymentRepository.create({
          user_id: userId,
          subscription_id: localSub.id,
          stripe_payment_intent_id: piId,
          amount: subscription.latest_invoice.amount_paid / 100,
          currency: (subscription.latest_invoice.currency || 'inr').toUpperCase(),
          payment_method: 'card',
          status: 'succeeded',
          paid_at: new Date(),
        });
      }
    }

    // Send confirmation email
    if (plan) {
      const user = await UserRepository.findById(userId);
      if (user) {
        EmailService.sendSubscriptionConfirmation(user, plan).catch((e) =>
          logger.warn('Subscription confirmation email failed', { userId, error: e.message })
        );
      }
    }

    logger.info('Subscription activated', { subscriptionId: stripeSubscriptionId, userId });
    return { subscription: localSub, planName: plan?.name ?? '' };
  }

  /**
   * Create a Stripe Checkout session for a subscription plan.
   */
  async createCheckoutSession(user, planId, successUrl, cancelUrl) {
    let plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || plan.status !== 'active') {
      const err = new Error('Subscription plan not found or inactive');
      err.statusCode = 404;
      throw err;
    }

    plan = await this.ensureStripePriceId(plan);

    const customer = await this.createOrGetCustomer(user);

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      // Required by RBI/Stripe India export regulations: collect full billing address
      billing_address_collection: 'required',
      // Persist the collected name + address back to the Stripe Customer object
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: successUrl || process.env.STRIPE_SUCCESS_URL,
      cancel_url: cancelUrl || process.env.STRIPE_CANCEL_URL,
      metadata: {
        user_id: String(user.id),
        plan_id: String(plan.id),
      },
      subscription_data: {
        metadata: {
          user_id: String(user.id),
          plan_id: String(plan.id),
        },
      },
    });

    logger.info('Stripe checkout session created', { sessionId: session.id, userId: user.id });
    return session;
  }

  /**
   * Create a subscription directly (for API-based flow with a payment method).
   */
  async createSubscription(user, planId, paymentMethodId) {
    let plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || plan.status !== 'active') {
      const err = new Error('Subscription plan not found or inactive');
      err.statusCode = 404;
      throw err;
    }

    plan = await this.ensureStripePriceId(plan);

    const customer = await this.createOrGetCustomer(user);

    // Attach payment method
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.stripe_price_id }],
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: String(user.id),
        plan_id: String(plan.id),
      },
    });

    // Create local subscription record
    const startDate = new Date(subscription.current_period_start * 1000);
    const endDate = new Date(subscription.current_period_end * 1000);

    const localSub = await SubscriptionRepository.create({
      user_id: user.id,
      plan_id: plan.id,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      start_date: startDate,
      end_date: endDate,
      status: subscription.status === 'active' ? 'active' : 'pending',
    });

    logger.info('Stripe subscription created', { subscriptionId: subscription.id, userId: user.id });
    return { subscription, localSubscription: localSub };
  }

  /**
   * Cancel a subscription at the end of the current period.
   */
  async cancelSubscription(subscriptionId) {
    const localSub = await SubscriptionRepository.findById
      ? null
      : null;

    // We cancel via Stripe subscription ID
    const updated = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record
    await SubscriptionRepository.updateByStripeSubscriptionId(subscriptionId, {
      status: 'cancelled',
    });

    logger.info('Stripe subscription cancelled', { subscriptionId });
    return updated;
  }

  /**
   * Fulfill a completed Stripe Checkout session by session ID.
   * Called from the success-redirect page so payments are recorded even without webhooks.
   * Idempotent — safe to call multiple times for the same session.
   */
  async fulfillCheckout(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription'],
    });

    if (session.payment_status !== 'paid') {
      const err = new Error('Payment not completed yet');
      err.statusCode = 402;
      throw err;
    }

    await this._handleCheckoutCompleted(session);

    // Return fresh subscription + payment for the caller
    const userId = parseInt(session.metadata?.user_id, 10);
    const subscription = userId ? await SubscriptionRepository.findActiveByUserId(userId) : null;
    const payments = userId ? await PaymentRepository.findByUserId(userId, 1) : [];
    return { subscription, latestPayment: payments[0] ?? null };
  }

  /**
   * Get subscription status for the current user.
   */
  async getSubscriptionStatus(userId) {
    const subscription = await SubscriptionRepository.findActiveByUserId(userId);
    return subscription;
  }

  /**
   * Handle Stripe webhook events.
   */
  async handleWebhook(event) {
    logger.info('Stripe webhook received', { type: event.type });

    switch (event.type) {
      case 'checkout.session.completed':
        await this._handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this._handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this._handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this._handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this._handlePaymentFailed(event.data.object);
        break;

      default:
        logger.info('Unhandled Stripe webhook event', { type: event.type });
    }
  }

  async _handleCheckoutCompleted(session) {
    const userId = parseInt(session.metadata?.user_id, 10);
    const planId = parseInt(session.metadata?.plan_id, 10);

    if (!userId || !planId) return;

    try {
      // session.subscription may be a string ID or an already-expanded object
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

      const stripeSubscription = typeof session.subscription === 'object' && session.subscription !== null
        ? session.subscription
        : await stripe.subscriptions.retrieve(subscriptionId);

      const plan = await SubscriptionPlan.findByPk(planId);

      const startDate = new Date(stripeSubscription.current_period_start * 1000);
      const endDate = new Date(stripeSubscription.current_period_end * 1000);

      // Upsert local subscription record
      let localSub = await SubscriptionRepository.findByStripeSubscriptionId(subscriptionId);
      if (!localSub) {
        localSub = await SubscriptionRepository.create({
          user_id: userId,
          plan_id: planId,
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscriptionId,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
        });
      } else {
        await SubscriptionRepository.updateByStripeSubscriptionId(subscriptionId, {
          status: 'active',
          start_date: startDate,
          end_date: endDate,
        });
        localSub = await SubscriptionRepository.findByStripeSubscriptionId(subscriptionId);
      }

      // Record the payment — dedup by session ID (idempotent for repeated fulfill calls)
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      const existingPayment = await PaymentRepository.findByStripeSessionId(session.id)
        ?? (paymentIntentId ? await PaymentRepository.findByStripePaymentIntentId(paymentIntentId) : null);

      if (!existingPayment && session.amount_total) {
        await PaymentRepository.create({
          user_id: userId,
          subscription_id: localSub?.id ?? null,
          stripe_payment_intent_id: paymentIntentId,
          stripe_session_id: session.id,
          amount: session.amount_total / 100,
          currency: (session.currency || 'inr').toUpperCase(),
          payment_method: 'card',
          status: 'succeeded',
          paid_at: new Date(),
        });
        logger.info('Payment recorded from checkout.session.completed', { userId, planId });
        confirmReferralCommission(userId, session.amount_total / 100);
      }

      if (plan) {
        const user = await UserRepository.findById(userId);
        if (user) {
          EmailService.sendSubscriptionConfirmation(user, plan).catch((e) =>
            logger.warn('Subscription confirmation email failed', { userId, error: e.message })
          );
        }
      }

      logger.info('Checkout completed, subscription activated', { userId, planId });
    } catch (err) {
      console.log("-------------error-------------",err);
      logger.error('_handleCheckoutCompleted error', { error: err.message });
    }
  }

  async _handleSubscriptionUpdated(subscription) {
    try {
      const startDate = new Date(subscription.current_period_start * 1000);
      const endDate = new Date(subscription.current_period_end * 1000);

      let status = 'active';
      if (subscription.status === 'canceled') status = 'cancelled';
      else if (subscription.status === 'past_due') status = 'expired';
      else if (subscription.status === 'unpaid') status = 'expired';

      await SubscriptionRepository.updateByStripeSubscriptionId(subscription.id, {
        status,
        start_date: startDate,
        end_date: endDate,
      });

      logger.info('Subscription updated', { subscriptionId: subscription.id, status });
    } catch (err) {
      logger.error('_handleSubscriptionUpdated error', { error: err.message });
    }
  }

  async _handleSubscriptionDeleted(subscription) {
    try {
      await SubscriptionRepository.updateByStripeSubscriptionId(subscription.id, {
        status: 'cancelled',
      });
      logger.info('Subscription deleted/cancelled', { subscriptionId: subscription.id });
    } catch (err) {
      logger.error('_handleSubscriptionDeleted error', { error: err.message });
    }
  }

  async _handlePaymentSucceeded(invoice) {
    try {
      if (!invoice.subscription) return;

      const localSub = await SubscriptionRepository.findByStripeSubscriptionId(invoice.subscription);
      if (!localSub) return;

      const paymentIntent = typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent?.id;

      const existing = paymentIntent
        ? await PaymentRepository.findByStripePaymentIntentId(paymentIntent)
        : null;

      if (!existing) {
        await PaymentRepository.create({
          user_id: localSub.user_id,
          subscription_id: localSub.id,
          stripe_payment_intent_id: paymentIntent,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency?.toUpperCase() || 'INR',
          payment_method: 'card',
          status: 'succeeded',
          paid_at: new Date(invoice.status_transitions?.paid_at * 1000 || Date.now()),
        });
      }

      // Update subscription end date
      const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription);
      await SubscriptionRepository.updateByStripeSubscriptionId(invoice.subscription, {
        status: 'active',
        end_date: new Date(stripeSubscription.current_period_end * 1000),
      });

      logger.info('Payment succeeded recorded', { invoiceId: invoice.id });
    } catch (err) {
      logger.error('_handlePaymentSucceeded error', { error: err.message });
    }
  }

  async _handlePaymentFailed(invoice) {
    try {
      if (!invoice.subscription) return;

      const localSub = await SubscriptionRepository.findByStripeSubscriptionId(invoice.subscription);
      if (!localSub) return;

      const paymentIntent = typeof invoice.payment_intent === 'string'
        ? invoice.payment_intent
        : invoice.payment_intent?.id;

      await PaymentRepository.create({
        user_id: localSub.user_id,
        subscription_id: localSub.id,
        stripe_payment_intent_id: paymentIntent,
        amount: invoice.amount_due / 100,
        currency: invoice.currency?.toUpperCase() || 'INR',
        payment_method: 'card',
        status: 'failed',
        paid_at: null,
      });

      // Notify user
      const user = await UserRepository.findById(localSub.user_id);
      const plan = localSub.plan;
      if (user && plan) {
        EmailService.sendPaymentFailedEmail(user, plan.name).catch((e) =>
          logger.warn('Payment failed email error', { userId: localSub.user_id, error: e.message })
        );
      }

      logger.info('Payment failed recorded', { invoiceId: invoice.id });
    } catch (err) {
      logger.error('_handlePaymentFailed error', { error: err.message });
    }
  }
}

module.exports = new StripeService();

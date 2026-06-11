/**
 * Canonical Socket.IO event names.
 * Import this on both backend (emitter) and frontend (listener).
 */
const EVENTS = {
  // ── Content ──────────────────────────────────────────────────────────────
  MOVIE_CREATED:     'content:movie:created',
  MOVIE_UPDATED:     'content:movie:updated',
  MOVIE_DELETED:     'content:movie:deleted',
  SERIES_CREATED:    'content:series:created',
  SERIES_UPDATED:    'content:series:updated',
  SERIES_DELETED:    'content:series:deleted',
  CONTENT_PUBLISHED: 'content:published',
  CONTENT_UNPUBLISHED: 'content:unpublished',

  // ── User management ───────────────────────────────────────────────────────
  USER_APPROVED:       'user:approved',
  USER_BLOCKED:        'user:blocked',
  USER_PROFILE_UPDATED: 'user:profile:updated',
  USER_SUBSCRIPTION_CHANGED: 'user:subscription:changed',

  // ── Subscription lifecycle ────────────────────────────────────────────────
  SUBSCRIPTION_CREATED:   'subscription:created',
  SUBSCRIPTION_CANCELLED: 'subscription:cancelled',
  SUBSCRIPTION_EXPIRED:   'subscription:expired',
  SUBSCRIPTION_RENEWED:   'subscription:renewed',

  // ── Affiliate ────────────────────────────────────────────────────────────
  AFFILIATE_REFERRAL_NEW:       'affiliate:referral:new',
  AFFILIATE_COMMISSION_GENERATED: 'affiliate:commission:generated',
  AFFILIATE_STATS_UPDATED:      'affiliate:stats:updated',
  AFFILIATE_PAYOUT_CREATED:     'affiliate:payout:created',

  // ── Payments ──────────────────────────────────────────────────────────────
  PAYMENT_COMPLETED: 'payment:completed',
  PAYMENT_REFUNDED:  'payment:refunded',
  PAYMENT_INVOICE:   'payment:invoice:created',

  // ── Admin dashboard ────────────────────────────────────────────────────────
  DASHBOARD_STATS_UPDATED: 'dashboard:stats:updated',
};

module.exports = EVENTS;

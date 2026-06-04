const rateLimit = require('express-rate-limit');

/**
 * General rate limiter: 1000 requests per 15 minutes, keyed per user (or IP for guests).
 * Only failed requests count — normal browsing never burns the limit.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Authenticated users get their own counter; guests share by IP
    if (req.user && req.user.id) return `user_${req.user.id}`;
    return req.ip;
  },
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Auth rate limiter: 20 attempts per 15 minutes per IP (only failed attempts count).
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true,
});

/**
 * Webhook limiter: 50 requests per minute (Stripe can send bursts).
 */
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many webhook requests.',
  },
});

module.exports = { generalLimiter, authLimiter, webhookLimiter };

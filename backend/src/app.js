require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const { generalLimiter } = require('./api/middlewares/rateLimiter');
const apiRoutes = require('./api/routes/index');
const logger = require('./config/logger');

const app = express();

// ── Trust proxy — required when running behind Nginx/load balancer ────────────
// Without this, req.ip resolves to the proxy IP and all users share one rate limit counter.
app.set('trust proxy', 1);

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy does not allow origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
  credentials: true,
}));

// ── Stripe Webhook — MUST be before express.json() ───────────────────────────
// Raw body is required for Stripe signature verification
app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }));

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files ──────────────────────────────────────────────────────────────
// Thumbnails: public, long-cached
app.use('/uploads/thumbnails', express.static(path.join(__dirname, '../uploads/thumbnails'), {
  maxAge: '1d',
}));

// HLS segments & playlists: served statically for local-transcoded videos
app.use('/uploads/hls', express.static(path.join(__dirname, '../uploads/hls'), {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    }
  },
}));

// ── General Rate Limiter ──────────────────────────────────────────────────────
app.use('/api', generalLimiter);
// app.get('/api/demo', (req, res) => {
//   res.send('Hello World!!!');
// });
// ── Request Logging ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ── Root ──────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to StreamVault API',
    docs: '/api/v1/health',
    version: '1.0.0',
  });
});

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  // CORS error
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An internal server error occurred.'
    : err.message || 'An internal server error occurred.';

  res.status(statusCode).json({ success: false, message });
});

module.exports = app;

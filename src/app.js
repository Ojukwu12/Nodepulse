/**
 * NodePulse - Express application setup
 * Sets up middleware, routes, and error handling.
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('express').json;
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const nodeRoutes = require('./routes/node');
const statsRoutes = require('./routes/stats');
const payoutRoutes = require('./routes/payout');

const app = express();

// When running behind a reverse proxy (e.g. Kubernetes ingress, load balancer)
// enable trust proxy in production so Express respects X-Forwarded-* headers.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Basic security + performance middleware
app.use(helmet());
app.use(compression());
app.use(bodyParser({ limit: '1mb' }));

// Rate limiting to protect public endpoints from abuse. Enabled in production.
if (process.env.NODE_ENV === 'production') {
  try {
    const rateLimit = require('express-rate-limit');
    const apiLimiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10), // limit each IP
      standardHeaders: true,
      legacyHeaders: false
    });
    app.use(apiLimiter);
  } catch (err) {
    // If dependency missing, log and continue (dev environments may not install it)
    const logger = require('./config/logger');
    logger.warn({ err }, 'express-rate-limit not available; skipping rate limiter');
  }
}

// Request logging (pino)
app.use(requestLogger);

// Health endpoints
app.get('/healthz', (req, res) => res.json({ status: 'ok', service: 'NodePulse' }));
app.get('/readyz', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connState = mongoose?.connection?.readyState;
    // readyState 1 = connected
    const ready = connState === 1;
    res.json({ ready, mongoState: connState });
  } catch (err) {
    res.status(500).json({ ready: false, err: String(err) });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/nodes', nodeRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/payouts', payoutRoutes);

// 404
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
app.use(errorHandler);

module.exports = app;

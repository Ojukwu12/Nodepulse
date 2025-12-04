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

// Basic security + performance middleware
app.use(helmet());
app.use(compression());
app.use(bodyParser({ limit: '1mb' }));

// Request logging (pino)
app.use(requestLogger);

// Health endpoints
app.get('/healthz', (req, res) => res.json({ status: 'ok', service: 'NodePulse' }));
app.get('/readyz', (req, res) => res.json({ ready: true }));

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

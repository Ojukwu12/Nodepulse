/**
 * Centralized Express error handler
 */

const { AppError } = require('../utils/errors');
const logger = require('../config/logger');

module.exports = function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (!err) return next();

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal Server Error';

  logger.error({ err, path: req.path, user: req.user ? req.user._id : null }, 'NodePulse: Error');

  // Only send stacktrace in development
  const payload = { success: false, error: { code, message } };
  if (process.env.NODE_ENV !== 'production') payload.error.stack = err.stack;

  res.status(status).json(payload);
};

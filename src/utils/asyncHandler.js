/**
 * asyncHandler - wraps async route handlers and forwards errors to express
 */

module.exports = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

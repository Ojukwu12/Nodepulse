/**
 * Authentication middleware
 * - JWT-based auth for users
 * - Wallet verification helper (placeholder)
 */

const jwt = require('jsonwebtoken');
const ethersPkg = require('ethers');
const ethers = ethersPkg.ethers || ethersPkg;
const logger = require('../config/logger');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/errors');

// JWT secret MUST be provided via environment variable. Do NOT hardcode secrets.
// Provide `JWT_SECRET` in your `.env` (see `.env.example`).
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return next();

  const token = auth.slice(7);
  try {
    if (!JWT_SECRET) throw new UnauthorizedError('JWT secret not configured');
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) throw new UnauthorizedError('Invalid token');
    req.user = user;
    return next();
  } catch (err) {
    logger.warn({ err }, 'NodePulse: auth failed');
    return next();
  }
}

// Helper to require login
function requireAuth(req, res, next) {
  if (!req.user) return next(new UnauthorizedError('Authentication required'));
  return next();
}

// Wallet signature verification placeholder
async function verifyWalletSignature(address, message, signature) {
  // Verify an EVM-style signature signed via `personal_sign` or `eth_sign`.
  // Uses ethers.js to recover the signer address.
  if (!address || !message || !signature) return false;
  try {
    // ethers.verifyMessage recovers an address which signed the given message
    const signer = ethers.verifyMessage(message, signature);
    return signer.toLowerCase() === address.toLowerCase();
  } catch (err) {
    logger.warn({ err, address }, 'NodePulse: wallet signature verification failed');
    return false;
  }
}

module.exports = { authMiddleware, requireAuth, verifyWalletSignature };

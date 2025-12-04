/**
 * Auth controller - register, login, wallet verify
 */

const jwt = require('jsonwebtoken');
const ethersPkg = require('ethers');
const ethers = ethersPkg.ethers || ethersPkg;
const User = require('../models/User');
const { ValidationError, UnauthorizedError } = require('../utils/errors');
const logger = require('../config/logger');

// Secrets must come from environment variables. Do NOT hardcode values.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

async function register(req, res) {
  const { email, password, name } = req.body || {};
  if (!email || !password) throw new ValidationError('email and password required');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ValidationError('Email already registered');

  const passwordHash = await User.hashPassword(password);
  const user = new User({ email, passwordHash, name });
  await user.save();
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  const token = jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({ success: true, user: { id: user._id, email: user.email, name: user.name }, token });
}

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ValidationError('email and password required');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new UnauthorizedError('Invalid credentials');
  const ok = await user.verifyPassword(password);
  if (!ok) throw new UnauthorizedError('Invalid credentials');

  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  const token = jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  res.json({ success: true, token, user: { id: user._id, email: user.email, name: user.name } });
}

async function verifyWallet(req, res) {
  // Verify a wallet ownership by signature (nonce flow)
  // POST body: { address, signature, message }
  const { address, signature, message } = req.body || {};
  if (!address || !signature || !message) throw new ValidationError('address, signature and message required');

  // Verify the signature against the provided message
  let verified = false;
  try {
    const signer = ethers.verifyMessage(message, signature);
    verified = signer.toLowerCase() === address.toLowerCase();
  } catch (err) {
    logger.warn({ err, address }, 'NodePulse: signature verification error');
    verified = false;
  }

  if (!verified) throw new UnauthorizedError('Signature verification failed');

  // If verified, link wallet to authenticated user or return success for claim flow
  if (req.user) {
    // attach wallet to user if not present
    const existing = req.user.wallets && req.user.wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
    if (!existing) {
      req.user.wallets.push({ address: address.toLowerCase(), verified: true, verifiedAt: new Date() });
      await req.user.save();
    }
    logger.info({ userId: req.user._id, address }, 'NodePulse: wallet linked to user');
    return res.json({ success: true, address, linked: true });
  }

  // No authenticated user - return success and allow client to claim/associate later
  logger.info({ address }, 'NodePulse: wallet verified (no authenticated user)');
  res.json({ success: true, address, linked: false });
}

module.exports = { register, login, verifyWallet };

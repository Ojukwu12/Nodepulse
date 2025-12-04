/**
 * User model
 * - Supports wallet associations and password auth
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const WalletSchema = new mongoose.Schema({
  address: { type: String, required: true, lowercase: true, index: true },
  label: { type: String },
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, index: true },
  passwordHash: { type: String },
  name: { type: String },
  wallets: { type: [WalletSchema], default: [] },
  roles: { type: [String], default: ['user'] },
  settings: {
    notifyOnPayout: { type: Boolean, default: true }
  }
}, { timestamps: true });

UserSchema.methods.verifyPassword = async function verifyPassword(password) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.statics.hashPassword = async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model('User', UserSchema);

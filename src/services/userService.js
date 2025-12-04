/**
 * User service - business logic for users
 */

const User = require('../models/User');

async function findById(id) {
  return User.findById(id).select('-passwordHash');
}

async function addWallet(userId, address) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  user.wallets.push({ address: address.toLowerCase() });
  await user.save();
  return user;
}

module.exports = { findById, addWallet };

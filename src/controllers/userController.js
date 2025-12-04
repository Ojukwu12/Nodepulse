/**
 * User controller
 */

const User = require('../models/User');

async function me(req, res) {
  const user = req.user;
  res.json({ success: true, user });
}

async function list(req, res) {
  const users = await User.find().limit(50).select('-passwordHash');
  res.json({ success: true, users });
}

module.exports = { me, list };

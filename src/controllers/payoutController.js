/**
 * Payout controller - list and retrieve payouts
 */

const Payout = require('../models/Payout');

async function listPayouts(req, res) {
  const user = req.user;
  // If the app stores recipient -> user mapping, we would filter by user wallets
  const payouts = await Payout.find().sort({ timestamp: -1 }).limit(100);
  res.json({ success: true, payouts });
}

async function getPayout(req, res) {
  const { payoutId } = req.params;
  const payout = await Payout.findOne({ payoutId });
  if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
  res.json({ success: true, payout });
}

module.exports = { listPayouts, getPayout };

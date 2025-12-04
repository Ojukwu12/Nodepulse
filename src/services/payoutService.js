/**
 * Payout service - handle mapping on-chain payouts to DB and users
 */

const Payout = require('../models/Payout');
const logger = require('../config/logger');

async function upsertPayout({ payoutId, recipient, amount, blockNumber, txHash, timestamp, jobs = [] }) {
  // Normalize amount (BigNumber -> string)
  let amt = amount;
  try {
    const ethersPkg = require('ethers');
    const ethers = ethersPkg.ethers || ethersPkg;
    if (amount && typeof amount === 'object' && ethers.BigNumber && ethers.BigNumber.isBigNumber && ethers.BigNumber.isBigNumber(amount)) {
      amt = amount.toString();
    }
  } catch (err) {
    // ignore
  }
  const doc = await Payout.findOneAndUpdate({ txHash }, { payoutId, recipient: recipient.toLowerCase(), amount: amt ? amt.toString() : undefined, blockNumber, txHash, timestamp, jobs, processedAt: new Date() }, { upsert: true, new: true });
  logger.info({ payout: doc._id }, 'NodePulse: upserted payout');
  return doc;
}

async function listRecent(limit = 100) {
  return Payout.find().sort({ timestamp: -1 }).limit(limit);
}

module.exports = { upsertPayout, listRecent };

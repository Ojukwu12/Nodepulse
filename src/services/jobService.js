/**
 * Job service - upsert jobs derived from chain events
 */

const Job = require('../models/Job');
const logger = require('../config/logger');

async function upsertJob({ jobId, jobType, jobSpec, nodeWallet, nodeId, status = 'reported', contribution = {}, rewardAmount, txHash, blockNumber, timestamp }) {
  const filter = txHash ? { txHash } : { jobId };
  // Normalize rewardAmount (handle ethers.BigNumber)
  let reward = rewardAmount;
  try {
    const ethersPkg = require('ethers');
    const ethers = ethersPkg.ethers || ethersPkg;
    if (rewardAmount && typeof rewardAmount === 'object' && ethers.BigNumber && ethers.BigNumber.isBigNumber && ethers.BigNumber.isBigNumber(rewardAmount)) {
      reward = rewardAmount.toString();
    }
  } catch (err) {
    // ignore
  }
  const update = { jobId, jobType, jobSpec, nodeWallet: nodeWallet ? nodeWallet.toLowerCase() : undefined, nodeId, status, contribution, rewardAmount: reward ? reward.toString() : undefined, txHash, blockNumber, timestamp };
  const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
  const doc = await Job.findOneAndUpdate(filter, update, opts);
  logger.info({ job: doc._id, txHash }, 'NodePulse: upserted job');
  return doc;
}

module.exports = { upsertJob };

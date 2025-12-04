/**
 * Chain watcher job - polls chain for events and processes them.
 * Uses node-cron for scheduling. This is a simple placeholder implementation.
 */

const cron = require('node-cron');
const logger = require('../config/logger');
const chainService = require('../services/chainService');
const payoutService = require('../services/payoutService');
const jobService = require('../services/jobService');
const ChainState = require('../models/ChainState');

let task = null;

async function getLastProcessedBlock() {
  const doc = await ChainState.findOne({ key: 'lastProcessedBlock' });
  return doc ? parseInt(doc.value, 10) : null;
}

async function setLastProcessedBlock(blockNumber) {
  await ChainState.findOneAndUpdate({ key: 'lastProcessedBlock' }, { value: blockNumber }, { upsert: true });
}

async function processRange(fromBlock, toBlock) {
  logger.info({ fromBlock, toBlock }, 'NodePulse: processing chain range');
  const logs = await chainService.fetchLogs(fromBlock, toBlock);

  for (const log of logs) {
    try {
      let decoded = null;
      if (chainService.contractInterface) {
        decoded = await chainService.decodeLog(log);
      }

      if (decoded && decoded.name) {
        // Example handling: depending on event name, map to job or payout
        const name = decoded.name;
        const args = decoded.args || {};
        logger.debug({ name, args }, 'NodePulse: decoded event');

        if (/payout|reward/i.test(name)) {
          // Expect args: recipient, amount
          const recipient = args.recipient || args.to || args.wallet || '0x0';
          const amount = args.amount || args.value || '0';
          await payoutService.upsertPayout({ payoutId: log.transactionHash, recipient, amount: amount.toString(), blockNumber: log.blockNumber, txHash: log.transactionHash, timestamp: await chainService.getBlockTimestamp(log.blockNumber) });
        } else if (/job/i.test(name)) {
          // Map job event
          const jobId = args.jobId || args.id || null;
          const nodeWallet = args.node || args.operator || args.wallet || null;
          const reward = args.reward || args.amount || '0';
          await jobService.upsertJob({ jobId, jobType: name, nodeWallet, rewardAmount: reward.toString(), txHash: log.transactionHash, blockNumber: log.blockNumber, timestamp: await chainService.getBlockTimestamp(log.blockNumber) });
        } else {
          // Generic fallback: try to upsert as payout if topics indicate transfer
          logger.debug({ name }, 'NodePulse: unhandled event name');
        }
      } else {
        // No ABI or couldn't decode: create placeholder payout record with unknown recipient
        await payoutService.upsertPayout({ payoutId: log.transactionHash, recipient: '0xunknown', amount: '0', blockNumber: log.blockNumber, txHash: log.transactionHash, timestamp: await chainService.getBlockTimestamp(log.blockNumber) });
      }
    } catch (err) {
      logger.warn({ err, log }, 'NodePulse: failed processing log');
    }
  }

  // persist last processed block
  await setLastProcessedBlock(toBlock);
}

function chunkRange(from, to, size) {
  const ranges = [];
  let start = from;
  while (start <= to) {
    const end = Math.min(start + size - 1, to);
    ranges.push({ start, end });
    start = end + 1;
  }
  return ranges;
}

function start() {
  if (task) return task;

  // Run every minute
  task = cron.schedule('* * * * *', async () => {
    try {
      logger.debug('NodePulse: chainWatcher tick');
      if (!chainService || !chainService.provider) return logger.warn('No chain provider configured');
      const provider = chainService.provider;
      const latest = await provider.getBlockNumber();
      const confirmations = chainService.CONFIRMATIONS || parseInt(process.env.CHAIN_CONFIRMATIONS || '12', 10);
      const safeTo = latest - confirmations;

      let last = await getLastProcessedBlock();
      if (last === null || typeof last === 'undefined') {
        // Initialize last to safeTo - 100 blocks (or 0)
        last = Math.max(safeTo - 100, 0);
        logger.info({ last }, 'NodePulse: initializing lastProcessedBlock');
        await setLastProcessedBlock(last);
      }

      const from = last + 1;
      if (from > safeTo) return logger.debug('NodePulse: no new confirmed blocks');

      // Process in chunks of 500 blocks to avoid too-large RPC calls
      const ranges = chunkRange(from, safeTo, 500);
      for (const r of ranges) {
        await processRange(r.start, r.end);
      }
    } catch (err) {
      logger.error({ err }, 'NodePulse: chainWatcher error');
    }
  });

  logger.info('NodePulse: chainWatcher scheduled (every minute)');
  return task;
}

function stop() {
  if (task) task.stop();
}

module.exports = { start, stop };

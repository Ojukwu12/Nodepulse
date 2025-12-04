/**
 * Chain service - interacts with Gensyn/EVM network via JSON-RPC (ethers.js)
 * TODO: implement event decoding based on Gensyn contract ABI and event topics.
 */

const { provider, CONFIRMATIONS, CONTRACT_ADDRESS } = require('../config/chain');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

// Optional: load ABI from path specified in env GENSYN_ABI_PATH
let contractInterface = null;
const abiPath = process.env.GENSYN_ABI_PATH;
// If no explicit ABI path provided, look for `config/gensyn.abi.json` in repo
const defaultAbiPath = path.join(process.cwd(), 'config', 'gensyn.abi.json');
const chosenAbiPath = abiPath || (fs.existsSync(defaultAbiPath) ? defaultAbiPath : null);
if (chosenAbiPath) {
  try {
    const full = path.isAbsolute(chosenAbiPath) ? chosenAbiPath : path.join(process.cwd(), chosenAbiPath);
    if (fs.existsSync(full)) {
      const abi = require(full);
      // ethers Interface constructor
      const ethersPkg = require('ethers');
      const ethers = ethersPkg.ethers || ethersPkg;
      contractInterface = new ethers.Interface(abi);
      logger.info({ abiPath: full }, 'NodePulse: Loaded Gensyn ABI for event decoding');
    } else {
      logger.warn({ abiPath: full }, 'NodePulse: configured ABI path not found');
    }
  } catch (err) {
    logger.warn({ err }, 'NodePulse: Failed to load ABI for Gensyn');
  }
}

/**
 * Build filter for provider.getLogs. Supports two modes:
 * - ABI present + CHAIN_EVENT_NAMES env (comma-separated event names)
 * - CHAIN_EVENT_TOPICS env (comma-separated hex topics)
 */
async function fetchLogs(fromBlock, toBlock) {
  if (!provider) throw new Error('No chain provider configured');

  // Max block range per single getLogs call (some providers limit this, e.g. Alchemy Free = 10)
  const maxRange = parseInt(process.env.CHAIN_LOGS_MAX_BLOCK_RANGE || '10', 10);

  // Build base filter (topics may be added below)
  const namesEnv = process.env.CHAIN_EVENT_NAMES || '';
  const topicsEnv = process.env.CHAIN_EVENT_TOPICS || '';

  // compute topics if ABI + names provided
  let baseTopics = null;
  if (contractInterface && namesEnv) {
    const names = namesEnv.split(',').map(s => s.trim()).filter(Boolean);
    const topics = names.map(n => {
      try {
        if (typeof contractInterface.getEventTopic === 'function') return contractInterface.getEventTopic(n);
        const frag = contractInterface.getEvent(n);
        return contractInterface.getEventTopic(frag);
      } catch (err) {
        logger.warn({ err, event: n }, 'NodePulse: failed to get topic for event');
        return null;
      }
    }).filter(Boolean);
    if (topics.length) baseTopics = topics;
  } else if (topicsEnv) {
    const topics = topicsEnv.split(',').map(s => s.trim()).filter(Boolean);
    if (topics.length) baseTopics = topics;
  }

  logger.info({ fromBlock, toBlock, maxRange }, 'NodePulse: fetching logs (will chunk if needed)');

  const results = [];
  // helper to perform a single getLogs with retries
  async function singleGetLogs(fb, tb) {
    const filter = { address: CONTRACT_ADDRESS || undefined, fromBlock: fb, toBlock: tb };
    if (baseTopics) filter.topics = baseTopics;

    // retry with exponential backoff on transient errors
    const maxAttempts = 3;
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        const logs = await provider.getLogs(filter);
        return logs;
      } catch (err) {
        attempt += 1;
        logger.warn({ err, attempt, fb, tb }, 'NodePulse: getLogs failed, retrying');
        // if last attempt, throw
        if (attempt >= maxAttempts) throw err;
        // backoff
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    return [];
  }

  // If range is small, do single call
  if ((toBlock - fromBlock + 1) <= maxRange) {
    const logs = await singleGetLogs(fromBlock, toBlock);
    return logs;
  }

  // Otherwise split into chunks of maxRange and concat results
  let start = fromBlock;
  while (start <= toBlock) {
    const end = Math.min(start + maxRange - 1, toBlock);
    try {
      const part = await singleGetLogs(start, end);
      if (Array.isArray(part) && part.length) results.push(...part);
    } catch (err) {
      // log and continue to next chunk to avoid failing entire sync
      logger.error({ err, start, end }, 'NodePulse: failed fetching logs for chunk');
    }
    start = end + 1;
  }

  return results;
}

async function decodeLog(log) {
  if (!contractInterface) return null;
  try {
    const parsed = contractInterface.parseLog(log);
    return parsed; // contains { name, args, signature }
  } catch (err) {
    logger.debug({ err, topic0: log.topics && log.topics[0] }, 'NodePulse: parseLog failed for a log');
    return null;
  }
}

async function getBlockTimestamp(blockNumber) {
  if (!provider) return null;
  const block = await provider.getBlock(blockNumber);
  return block ? new Date(block.timestamp * 1000) : null;
}

module.exports = { fetchLogs, decodeLog, getBlockTimestamp, contractInterface, CONFIRMATIONS, CONTRACT_ADDRESS, provider };

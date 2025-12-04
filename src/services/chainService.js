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
if (abiPath) {
  try {
    const full = path.isAbsolute(abiPath) ? abiPath : path.join(process.cwd(), abiPath);
    if (fs.existsSync(full)) {
      const abi = require(full);
      // ethers Interface constructor
      const ethersPkg = require('ethers');
      const ethers = ethersPkg.ethers || ethersPkg;
      contractInterface = new ethers.Interface(abi);
      logger.info({ abiPath: full }, 'NodePulse: Loaded Gensyn ABI for event decoding');
    } else {
      logger.warn({ abiPath: full }, 'NodePulse: GENSYN_ABI_PATH configured but file not found');
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

  const filter = { address: CONTRACT_ADDRESS || undefined, fromBlock, toBlock };

  // If we have ABI and event names, compute topics via the interface
  const namesEnv = process.env.CHAIN_EVENT_NAMES || '';
  const topicsEnv = process.env.CHAIN_EVENT_TOPICS || '';

  if (contractInterface && namesEnv) {
    const names = namesEnv.split(',').map(s => s.trim()).filter(Boolean);
    const topics = names.map(n => {
      try {
        if (typeof contractInterface.getEventTopic === 'function') return contractInterface.getEventTopic(n);
        // ethers v6: getEventTopic exists; if not, fallback to eventFragment
        const frag = contractInterface.getEvent(n);
        return contractInterface.getEventTopic(frag);
      } catch (err) {
        logger.warn({ err, event: n }, 'NodePulse: failed to get topic for event');
        return null;
      }
    }).filter(Boolean);
    if (topics.length) filter.topics = topics;
  } else if (topicsEnv) {
    const topics = topicsEnv.split(',').map(s => s.trim()).filter(Boolean);
    if (topics.length) filter.topics = topics;
  }

  logger.info({ filter }, 'NodePulse: fetching logs');
  const logs = await provider.getLogs(filter);
  return logs;
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

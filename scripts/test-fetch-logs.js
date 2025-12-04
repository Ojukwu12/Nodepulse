#!/usr/bin/env node
/**
 * Simple smoke test for chainService.fetchLogs + decodeLog
 * Usage: CHAIN_RPC_URL="https://..." node scripts/test-fetch-logs.js
 */

const { provider } = require('../src/config/chain');
const { fetchLogs, decodeLog } = require('../src/services/chainService');
const logger = require('../src/config/logger');

async function run() {
  try {
    const bnHex = await provider.send('eth_blockNumber', []);
    const bn = parseInt(bnHex, 16);
    const from = Math.max(0, bn - 20);
    const to = bn;
    logger.info({ from, to }, 'test-fetch-logs: fetching logs');
    const logs = await fetchLogs(from, to);
    console.log('Fetched logs count:', logs.length);
    for (const l of logs.slice(0, 5)) {
      const parsed = await decodeLog(l);
      console.log('Log:', { topic0: l.topics && l.topics[0], parsed: parsed ? { name: parsed.name, args: parsed.args } : null });
    }
  } catch (err) {
    console.error('test-fetch-logs failed', err);
    process.exitCode = 1;
  }
}

run();

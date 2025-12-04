/**
 * Test decoder script for NodePulse
 * Ensures ABI is loaded and demonstrates decoding of synthetic logs.
 * Usage: `node scripts/test-decode.js` (make sure `.env` or env var GENSYN_ABI_PATH points to `./config/gensyn.abi.json`)
 */

process.env.GENSYN_ABI_PATH = process.env.GENSYN_ABI_PATH || './config/gensyn.abi.json';

const chainService = require('../src/services/chainService');
const logger = require('../src/config/logger');

async function run() {
  if (!chainService.contractInterface) {
    console.error('No contractInterface loaded. Set GENSYN_ABI_PATH to an ABI JSON file.');
    process.exit(1);
  }

  const iface = chainService.contractInterface;

  // Prepare synthetic events using the interface. We'll encode two events and then parse them back.
  try {
    const jobEvent = iface.getEvent('JobCompleted');
    const rewardEvent = iface.getEvent('RewardPaid');

    // Values align with ABI: JobCompleted(bytes32 jobId, address node, uint256 reward)
    const jobId = '0x' + '11'.repeat(32).slice(0, 64);
    const nodeAddr = '0x000000000000000000000000000000000000c0de';
    const reward = 123456;

    const encodedJob = iface.encodeEventLog(jobEvent, [jobId, nodeAddr, reward]);
    const jobLog = { topics: encodedJob.topics, data: encodedJob.data, blockNumber: 123456, transactionHash: '0xjobtxhash' };

    const encodedReward = iface.encodeEventLog(rewardEvent, [nodeAddr, reward]);
    const rewardLog = { topics: encodedReward.topics, data: encodedReward.data, blockNumber: 123457, transactionHash: '0xrewardtxhash' };

    console.log('--- Decoding synthetic JobCompleted log ---');
    const parsedJob = await chainService.decodeLog(jobLog);
    console.log(parsedJob ? parsedJob.toString() : 'parse failed', parsedJob ? parsedJob.args : null);

    console.log('\n--- Decoding synthetic RewardPaid log ---');
    const parsedReward = await chainService.decodeLog(rewardLog);
    console.log(parsedReward ? parsedReward.toString() : 'parse failed', parsedReward ? parsedReward.args : null);

    console.log('\nTest decode finished. If you see parsed events above, event decoding works.');
  } catch (err) {
    logger.error({ err }, 'Test decode failed');
    process.exit(1);
  }
}

run();

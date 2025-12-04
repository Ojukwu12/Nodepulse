/**
 * Chain (Gensyn) configuration and provider helper
 * Note: implement contract ABI/event decoding where TODOs are placed.
 */

const ethersPkg = require('ethers');
const ethers = ethersPkg.ethers || ethersPkg;
const logger = require('./logger');

// Chain RPC URL should be provided via env var. Do NOT hardcode RPC keys/endpoints.
const RPC_URL = process.env.CHAIN_RPC_URL;
const provider = RPC_URL ? new ethers.JsonRpcProvider(RPC_URL) : null;

// Number of confirmations to consider a block final (configurable via env)
const CONFIRMATIONS = parseInt(process.env.CHAIN_CONFIRMATIONS || '12', 10);

// Gensyn contract address. Not a secret. Environment var `CHAIN_CONTRACT_ADDRESS`
// is preferred; if not provided, default to the known network address below.
// Update `.env` in production to set the contract address explicitly.
const CONTRACT_ADDRESS = process.env.CHAIN_CONTRACT_ADDRESS || '0x69C6e1D608ec64885E7b185d39b04B491a71768C';

if (!provider) {
  logger.warn('NodePulse: No CHAIN_RPC_URL configured; chain features will be disabled');
}

module.exports = {
  provider,
  CONFIRMATIONS,
  CONTRACT_ADDRESS
};

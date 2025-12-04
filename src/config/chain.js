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

// Gensyn contract address. Not a secret, but set via env for flexibility.
// Provide `CHAIN_CONTRACT_ADDRESS` in `.env` (example included in `.env.example`).
const CONTRACT_ADDRESS = process.env.CHAIN_CONTRACT_ADDRESS || null;

if (!provider) {
  logger.warn('NodePulse: No CHAIN_RPC_URL configured; chain features will be disabled');
}

module.exports = {
  provider,
  CONFIRMATIONS,
  CONTRACT_ADDRESS
};

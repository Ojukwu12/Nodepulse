/**
 * Fetch Gensyn contract ABI using Alchemy RPC method (if supported) and save to `config/gensyn.abi.json`.
 *
 * Usage (local):
 *   export CHAIN_RPC_URL="https://gensyn-testnet.g.alchemy.com/v2/<KEY>"
 *   export CHAIN_CONTRACT_ADDRESS="0x69C6e1D608ec64885E7b185d39b04B491a71768C"
 *   node scripts/fetch-abi.js
 *
 * This script does not commit secrets. It writes ABI JSON to `config/gensyn.abi.json`.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const ethersPkg = require('ethers');
const ethers = ethersPkg.ethers || ethersPkg;
const logger = require('../src/config/logger');

const RPC = process.env.CHAIN_RPC_URL;
const ADDRESS = process.env.CHAIN_CONTRACT_ADDRESS || '0x69C6e1D608ec64885E7b185d39b04B491a71768C';

async function fetchAbiWithAlchemy(provider) {
  try {
    // Alchemy provides `alchemy_getContractMetadata` which can include the ABI in some cases.
    const res = await provider.send('alchemy_getContractMetadata', [ADDRESS]);
    if (res && res.abi) return res.abi;
    if (res && res.contractMetadata && res.contractMetadata.abi) return res.contractMetadata.abi;
    return null;
  } catch (err) {
    logger.warn({ err }, 'fetch-abi: alchemy_getContractMetadata failed');
    return null;
  }
}

async function run() {
  if (!RPC) {
    console.error('Please set CHAIN_RPC_URL in your environment to an Alchemy RPC URL.');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC);

  console.log('Attempting to fetch ABI for', ADDRESS);
  let abi = await fetchAbiWithAlchemy(provider);

  if (!abi) {
    console.warn('Could not fetch ABI via alchemy_getContractMetadata. Trying to query contract source via etherscan-style endpoints is not implemented.');
    process.exit(1);
  }

  const outPath = path.join(process.cwd(), 'config', 'gensyn.abi.json');
  fs.writeFileSync(outPath, JSON.stringify(abi, null, 2));
  console.log('ABI written to', outPath);
}

run().catch(err => {
  console.error('fetch-abi failed', err);
  process.exit(1);
});

// lib/blockchain.js
// Fricoin Bot — Blockchain Interaction Layer
// The Palace, Inc.

import { ethers } from 'ethers';

// ── Polygon RPC ──────────────────────────────────────────
const POLYGON_RPC = 'https://polygon-rpc.com'; // Mainnet
// const POLYGON_RPC = 'https://rpc-amoy.polygon.technology'; // Testnet (uncomment for testing)

// ── Fricoin Contract Address ──────────────────────────────
// Replace with your real contract address after mainnet deploy
export const FRICOIN_ADDRESS = process.env.FRICOIN_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';

// ── Minimal ABI for balance + transfer ───────────────────
const FRICOIN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function circulatingSupply() view returns (uint256)',
  'function burnedSupply() view returns (uint256)',
  'function getTokenInfo() view returns (string,string,uint256,uint256,uint256,uint256)',
];

// ── Provider & Reward Pool Signer ────────────────────────
const provider = new ethers.JsonRpcProvider(POLYGON_RPC);

// Reward pool wallet — used to send mining rewards to users
// Private key stored safely in Vercel env vars
const getRewardSigner = () => {
  if (!process.env.REWARD_POOL_PRIVATE_KEY) {
    throw new Error('Reward pool private key not configured');
  }
  return new ethers.Wallet(process.env.REWARD_POOL_PRIVATE_KEY, provider);
};

// ── Get FRI balance of any address ───────────────────────
export async function getFRIBalance(address) {
  try {
    const contract = new ethers.Contract(FRICOIN_ADDRESS, FRICOIN_ABI, provider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(address),
      contract.decimals(),
    ]);
    return parseFloat(ethers.formatUnits(balance, decimals));
  } catch {
    return 0;
  }
}

// ── Send FRI from reward pool to a user ──────────────────
export async function sendFRIReward(toAddress, amount) {
  try {
    const signer   = getRewardSigner();
    const contract = new ethers.Contract(FRICOIN_ADDRESS, FRICOIN_ABI, signer);
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    const tx = await contract.transfer(toAddress, amountWei);
    await tx.wait();
    return { success: true, txHash: tx.hash };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ── Get global Fricoin stats ──────────────────────────────
export async function getFricoinStats() {
  try {
    const contract = new ethers.Contract(FRICOIN_ADDRESS, FRICOIN_ABI, provider);
    const info = await contract.getTokenInfo();
    return {
      name:        info[0],
      symbol:      info[1],
      totalSupply: parseFloat(ethers.formatUnits(info[2], 18)).toLocaleString(),
      circulating: parseFloat(ethers.formatUnits(info[3], 18)).toLocaleString(),
      burned:      parseFloat(ethers.formatUnits(info[4], 18)).toLocaleString(),
      tax:         info[5].toString() + '%',
    };
  } catch {
    return null;
  }
}

// ── Validate a wallet address ─────────────────────────────
export function isValidAddress(address) {
  try {
    ethers.getAddress(address);
    return true;
  } catch {
    return false;
  }
}

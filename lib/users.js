// lib/users.js
// Fricoin Bot — User Management
// The Palace, Inc.

import db from './firebase.js';

const USERS     = 'users';
const MINING    = 'mining_log';

// ── Get or create a user record ───────────────────────────
export async function getOrCreateUser(telegramId, username, firstName) {
  const ref = db.collection(USERS).doc(String(telegramId));
  const doc = await ref.get();

  if (!doc.exists) {
    const newUser = {
      telegramId:   String(telegramId),
      username:     username || '',
      firstName:    firstName || 'Miner',
      walletAddress: null,
      friBalance:   0,        // Off-chain balance (pre-mainnet)
      totalMined:   0,
      lastMined:    null,
      joinedAt:     new Date().toISOString(),
      rank:         'Rookie Miner 🪨',
    };
    await ref.set(newUser);
    return newUser;
  }
  return doc.data();
}

// ── Get user by Telegram ID ───────────────────────────────
export async function getUser(telegramId) {
  const doc = await db.collection(USERS).doc(String(telegramId)).get();
  return doc.exists ? doc.data() : null;
}

// ── Get user by Telegram username ─────────────────────────
export async function getUserByUsername(username) {
  const clean = username.replace('@', '');
  const snap  = await db.collection(USERS).where('username', '==', clean).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

// ── Update wallet address ─────────────────────────────────
export async function setWalletAddress(telegramId, walletAddress) {
  await db.collection(USERS).doc(String(telegramId)).update({ walletAddress });
}

// ── Credit FRI to user (off-chain balance) ────────────────
export async function creditFRI(telegramId, amount) {
  const ref = db.collection(USERS).doc(String(telegramId));
  await ref.update({
    friBalance: db.FieldValue ? db.FieldValue.increment(amount) : admin.firestore.FieldValue.increment(amount),
    totalMined: db.FieldValue ? db.FieldValue.increment(amount) : admin.firestore.FieldValue.increment(amount),
  });
}

// ── Debit FRI from user ───────────────────────────────────
export async function debitFRI(telegramId, amount) {
  const user = await getUser(telegramId);
  if (!user || user.friBalance < amount) return false;
  await db.collection(USERS).doc(String(telegramId)).update({
    friBalance: user.friBalance - amount,
  });
  return true;
}

// ── Check if user can mine today ──────────────────────────
export async function canMineToday(telegramId) {
  const user = await getUser(telegramId);
  if (!user || !user.lastMined) return true;

  const last  = new Date(user.lastMined);
  const now   = new Date();
  const diffH = (now - last) / (1000 * 60 * 60);
  return diffH >= 24;
}

// ── Record a mining event ─────────────────────────────────
export async function recordMining(telegramId, amount) {
  const now = new Date().toISOString();
  await db.collection(USERS).doc(String(telegramId)).update({
    lastMined:  now,
    totalMined: require('firebase-admin').firestore.FieldValue.increment(amount),
    friBalance: require('firebase-admin').firestore.FieldValue.increment(amount),
    rank:       await computeRank(telegramId),
  });
  await db.collection(MINING).add({
    telegramId: String(telegramId),
    amount,
    minedAt:    now,
  });
}

// ── Get top miners leaderboard ────────────────────────────
export async function getLeaderboard(limit = 10) {
  const snap = await db.collection(USERS)
    .orderBy('totalMined', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => d.data());
}

// ── Get total registered users count ─────────────────────
export async function getTotalUsers() {
  const snap = await db.collection(USERS).count().get();
  return snap.data().count;
}

// ── Compute rank based on total mined ────────────────────
async function computeRank(telegramId) {
  const user = await getUser(telegramId);
  const total = user?.totalMined || 0;
  if (total >= 1_000_000) return 'Diamond Miner 💎';
  if (total >= 100_000)   return 'Gold Miner 🥇';
  if (total >= 10_000)    return 'Silver Miner 🥈';
  if (total >= 1_000)     return 'Bronze Miner 🥉';
  return 'Rookie Miner 🪨';
}

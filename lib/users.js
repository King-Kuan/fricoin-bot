// lib/users.js
// Fricoin Bot v2 — User Management + Referral + Transaction Logs
// The Palace, Inc.

import admin from 'firebase-admin';
import db from './firebase.js';

const USERS   = 'users';
const LOGS    = 'transaction_logs';
const MINING  = 'mining_log';
const REFS    = 'referrals';

// ── Referral code generator ───────────────────────────────
export function generateRefCode(telegramId) {
  return `FRI${String(telegramId).slice(-5)}${Math.random().toString(36).slice(2,5).toUpperCase()}`;
}

// ── Get or create user ────────────────────────────────────
export async function getOrCreateUser(telegramId, username, firstName, refCode = null) {
  const ref = db.collection(USERS).doc(String(telegramId));
  const doc = await ref.get();

  if (!doc.exists) {
    const code = generateRefCode(telegramId);
    const newUser = {
      telegramId:      String(telegramId),
      username:        username || '',
      firstName:       firstName || 'Miner',
      walletAddress:   null,
      friBalance:      0,
      totalMined:      0,
      totalEarned:     0,
      totalSent:       0,
      totalReceived:   0,
      lastMined:       null,
      joinedAt:        new Date().toISOString(),
      rank:            'Rookie Miner 🪨',
      referralCode:    code,
      referredBy:      null,
      referralCount:   0,
      channelJoined:   false,
      channelBonusPaid: false,
    };
    await ref.set(newUser);

    // Handle referral if code provided
    if (refCode) {
      await processReferralJoin(String(telegramId), refCode, firstName);
    }

    return newUser;
  }
  return doc.data();
}

// ── Get user ──────────────────────────────────────────────
export async function getUser(telegramId) {
  const doc = await db.collection(USERS).doc(String(telegramId)).get();
  return doc.exists ? doc.data() : null;
}

// ── Get user by username ──────────────────────────────────
export async function getUserByUsername(username) {
  const clean = username.replace('@', '');
  const snap  = await db.collection(USERS).where('username', '==', clean).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

// ── Get user by referral code ─────────────────────────────
export async function getUserByRefCode(refCode) {
  const snap = await db.collection(USERS).where('referralCode', '==', refCode.toUpperCase()).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].data();
}

// ── Set wallet address ────────────────────────────────────
export async function setWalletAddress(telegramId, walletAddress) {
  await db.collection(USERS).doc(String(telegramId)).update({ walletAddress });
}

// ── Mark channel as joined ────────────────────────────────
export async function markChannelJoined(telegramId) {
  await db.collection(USERS).doc(String(telegramId)).update({ channelJoined: true });
}

// ── Credit FRI ────────────────────────────────────────────
export async function creditFRI(telegramId, amount, type = 'credit', note = '') {
  const ref = db.collection(USERS).doc(String(telegramId));
  await ref.update({
    friBalance:   admin.firestore.FieldValue.increment(amount),
    totalEarned:  admin.firestore.FieldValue.increment(amount),
  });
  await logTransaction(telegramId, type, amount, note);
}

// ── Debit FRI ─────────────────────────────────────────────
export async function debitFRI(telegramId, amount, note = '') {
  const user = await getUser(telegramId);
  if (!user || user.friBalance < amount) return false;
  await db.collection(USERS).doc(String(telegramId)).update({
    friBalance:  user.friBalance - amount,
    totalSent:   admin.firestore.FieldValue.increment(amount),
  });
  await logTransaction(telegramId, 'sent', amount, note);
  return true;
}

// ── Credit received FRI ───────────────────────────────────
export async function creditReceived(telegramId, amount, note = '') {
  await db.collection(USERS).doc(String(telegramId)).update({
    friBalance:    admin.firestore.FieldValue.increment(amount),
    totalReceived: admin.firestore.FieldValue.increment(amount),
  });
  await logTransaction(telegramId, 'received', amount, note);
}

// ── Log a transaction ─────────────────────────────────────
export async function logTransaction(telegramId, type, amount, note = '') {
  const icons = {
    mined:            '⛏️',
    sent:             '📤',
    received:         '📥',
    referral_join:    '👥',
    referral_mine:    '🤝',
    referral_bonus:   '🎯',
    milestone:        '🏆',
    channel_bonus:    '📢',
    new_user_bonus:   '🎁',
  };
  await db.collection(LOGS).add({
    telegramId: String(telegramId),
    type,
    amount,
    note,
    icon:      icons[type] || '💰',
    createdAt: new Date().toISOString(),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ── Get transaction history ───────────────────────────────
export async function getTransactionHistory(telegramId, limit = 15) {
  const snap = await db.collection(LOGS)
    .where('telegramId', '==', String(telegramId))
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => d.data());
}

// ── Can mine today ────────────────────────────────────────
export async function canMineToday(telegramId) {
  const user = await getUser(telegramId);
  if (!user || !user.lastMined) return true;
  const diffH = (new Date() - new Date(user.lastMined)) / (1000 * 60 * 60);
  return diffH >= 24;
}

// ── Record mining ─────────────────────────────────────────
export async function recordMining(telegramId, amount) {
  const now  = new Date().toISOString();
  const user = await getUser(telegramId);
  const newTotal = (user?.totalMined || 0) + amount;
  const rank = computeRank(newTotal);

  await db.collection(USERS).doc(String(telegramId)).update({
    lastMined:  now,
    totalMined: admin.firestore.FieldValue.increment(amount),
    friBalance: admin.firestore.FieldValue.increment(amount),
    totalEarned: admin.firestore.FieldValue.increment(amount),
    rank,
  });

  await logTransaction(telegramId, 'mined', amount, 'Daily mining reward');

  // Give referral mine bonus to referrer
  if (user?.referredBy) {
    const firstMine = !user.lastMined;
    if (firstMine) {
      await creditFRI(user.referredBy, 50, 'referral_mine', `First mine bonus from @${user.username || user.firstName}`);
    } else {
      await creditFRI(user.referredBy, 10, 'referral_mine', `Mining bonus from @${user.username || user.firstName}`);
    }
  }

  return rank;
}

// ── Process referral join ─────────────────────────────────
export async function processReferralJoin(newUserId, refCode, newFirstName) {
  const referrer = await getUserByRefCode(refCode);
  if (!referrer || referrer.telegramId === newUserId) return;

  // Set referredBy on new user
  await db.collection(USERS).doc(String(newUserId)).update({
    referredBy: referrer.telegramId,
  });

  // Credit referrer
  const newCount = (referrer.referralCount || 0) + 1;
  await db.collection(USERS).doc(String(referrer.telegramId)).update({
    referralCount: admin.firestore.FieldValue.increment(1),
  });

  await creditFRI(referrer.telegramId, 200, 'referral_join',
    `New referral joined: ${newFirstName}`);

  // Milestone bonuses
  if (newCount === 10) {
    await creditFRI(referrer.telegramId, 1000, 'milestone', '🎯 10 Referrals Milestone!');
  } else if (newCount === 50) {
    await creditFRI(referrer.telegramId, 10000, 'milestone', '🚀 50 Referrals Milestone!');
  } else if (newCount === 100) {
    await creditFRI(referrer.telegramId, 50000, 'milestone', '💎 100 Referrals Milestone!');
  }

  // Log referral record
  await db.collection(REFS).add({
    referrerId:  referrer.telegramId,
    newUserId:   String(newUserId),
    newName:     newFirstName,
    refCode,
    joinedAt:    new Date().toISOString(),
  });

  return referrer;
}

// ── Give channel join bonus ───────────────────────────────
export async function giveChannelBonus(telegramId) {
  const user = await getUser(telegramId);
  if (!user || user.channelBonusPaid) return false;

  await db.collection(USERS).doc(String(telegramId)).update({
    channelBonusPaid: true,
    channelJoined:    true,
  });
  await creditFRI(telegramId, 300, 'channel_bonus', 'Joined @FricoinNews channel');
  return true;
}

// ── Get leaderboard ───────────────────────────────────────
export async function getLeaderboard(limit = 10) {
  const snap = await db.collection(USERS)
    .orderBy('totalMined', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => d.data());
}

// ── Get referral leaderboard ──────────────────────────────
export async function getReferralLeaderboard(limit = 10) {
  const snap = await db.collection(USERS)
    .orderBy('referralCount', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => d.data());
}

// ── Get total users ───────────────────────────────────────
export async function getTotalUsers() {
  const snap = await db.collection(USERS).count().get();
  return snap.data().count;
}

// ── Get total mined across all users ─────────────────────
export async function getTotalMinedGlobal() {
  const snap = await db.collection(USERS).get();
  return snap.docs.reduce((sum, d) => sum + (d.data().totalMined || 0), 0);
}

// ── Compute rank ──────────────────────────────────────────
export function computeRank(totalMined) {
  if (totalMined >= 1_000_000) return 'Diamond Miner 💎';
  if (totalMined >= 100_000)   return 'Gold Miner 🥇';
  if (totalMined >= 10_000)    return 'Silver Miner 🥈';
  if (totalMined >= 1_000)     return 'Bronze Miner 🥉';
  return 'Rookie Miner 🪨';
}

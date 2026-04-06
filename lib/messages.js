// lib/messages.js
// Fricoin Bot — Message Templates
// The Palace, Inc.

export const DAILY_REWARD = 500; // FRI per day
export const SEND_MIN     = 10;  // Minimum send amount

// ── Welcome message ───────────────────────────────────────
export const welcomeMessage = (firstName) => `
🪙 *Welcome to Fricoin Bot, ${firstName}!*

_The future of mobile crypto mining is here._

━━━━━━━━━━━━━━━━━━━━━
⚡ *FRI* — Mine it. Hold it. Send it.
━━━━━━━━━━━━━━━━━━━━━

You've just joined a new era of accessible cryptocurrency. Every day you can mine *${DAILY_REWARD} FRI* just by being active.

*🚀 Get started:*
┣ /mine — Claim your daily FRI
┣ /balance — Check your FRI balance  
┣ /wallet — Link your crypto wallet
┣ /send — Send FRI to a friend
┣ /stats — Live Fricoin stats
┣ /top — Leaderboard
┗ /help — All commands

_Powered by The Palace, Inc. 🏰_
`;

// ── Help message ──────────────────────────────────────────
export const helpMessage = () => `
🏰 *Fricoin Bot — Command Center*

━━━━━━━━━━━━━━━━━━━━━
⛏️ *MINING*
┣ /mine — Claim ${DAILY_REWARD} FRI every 24h
┗ /top — Top 10 miners leaderboard

💰 *WALLET*
┣ /balance — Your FRI balance & rank
┣ /wallet \`0x...\` — Link your crypto wallet
┗ /wallet — View your linked wallet

📤 *TRANSFERS*
┗ /send @username 100 — Send FRI to a user

📊 *STATS*
┗ /stats — Live Fricoin network stats

━━━━━━━━━━━━━━━━━━━━━
_Mine daily. Build your stack. 🪙_
`;

// ── Balance message ───────────────────────────────────────
export const balanceMessage = (user, onchainBalance) => `
💰 *Your Fricoin Portfolio*

━━━━━━━━━━━━━━━━━━━━━
👤 *${user.firstName}* ${user.username ? `(@${user.username})` : ''}
🏅 Rank: *${user.rank}*
━━━━━━━━━━━━━━━━━━━━━

📱 *Bot Balance:* \`${user.friBalance?.toLocaleString() || 0} FRI\`
⛓️ *On-chain Balance:* \`${onchainBalance?.toLocaleString() || '—'} FRI\`
⛏️ *Total Ever Mined:* \`${user.totalMined?.toLocaleString() || 0} FRI\`

${user.walletAddress
  ? `🔗 *Wallet:* \`${user.walletAddress.slice(0,6)}...${user.walletAddress.slice(-4)}\``
  : `⚠️ *No wallet linked yet*\nUse /wallet \`0x...\` to link one`
}

━━━━━━━━━━━━━━━━━━━━━
_Use /mine to claim your daily FRI_ ⚡
`;

// ── Mine success message ──────────────────────────────────
export const mineSuccessMessage = (firstName, amount, newBalance, rank) => `
⛏️ *Mining Successful!*

━━━━━━━━━━━━━━━━━━━━━
✨ *${firstName} just mined FRI!*
━━━━━━━━━━━━━━━━━━━━━

💎 *Mined:* +${amount.toLocaleString()} FRI
💰 *New Balance:* ${newBalance.toLocaleString()} FRI
🏅 *Rank:* ${rank}

⏰ Come back in *24 hours* for your next mining session!

_Keep mining. Keep stacking. 🚀_
`;

// ── Mine cooldown message ─────────────────────────────────
export const mineCooldownMessage = (hoursLeft) => `
⏳ *Mining Cooldown Active*

━━━━━━━━━━━━━━━━━━━━━
You already mined today!

⏰ Next mining in: *${hoursLeft} hours*
━━━━━━━━━━━━━━━━━━━━━

_Stay patient, miner. The FRI will be worth it. 💎_
`;

// ── Send success message ──────────────────────────────────
export const sendSuccessMessage = (toUsername, amount, newBalance) => `
📤 *Transfer Complete!*

━━━━━━━━━━━━━━━━━━━━━
✅ Sent *${amount.toLocaleString()} FRI* to @${toUsername}
💰 Your new balance: *${newBalance.toLocaleString()} FRI*
━━━━━━━━━━━━━━━━━━━━━

_Spreading the FRI love 🪙_
`;

// ── Receive notification message ──────────────────────────
export const receiveMessage = (fromFirstName, amount) => `
📥 *You received FRI!*

━━━━━━━━━━━━━━━━━━━━━
🎁 *${fromFirstName}* just sent you *${amount.toLocaleString()} FRI*!
━━━━━━━━━━━━━━━━━━━━━

Check your balance with /balance 💰
`;

// ── Stats message ─────────────────────────────────────────
export const statsMessage = (stats, totalUsers) => `
📊 *Fricoin Network Stats*

━━━━━━━━━━━━━━━━━━━━━
🪙 *Token:* Fricoin (FRI)
⛓️ *Network:* Polygon
━━━━━━━━━━━━━━━━━━━━━

📦 *Total Supply:* ${stats?.totalSupply || '1,000,000,000,000'} FRI
🔄 *Circulating:* ${stats?.circulating || 'Pre-launch'} FRI
🔥 *Burned:* ${stats?.burned || '0'} FRI
💸 *Transfer Tax:* ${stats?.tax || '3%'}

━━━━━━━━━━━━━━━━━━━━━
👥 *Bot Miners:* ${totalUsers?.toLocaleString() || 0} users
⛏️ *Daily Reward:* ${DAILY_REWARD} FRI/day
━━━━━━━━━━━━━━━━━━━━━

_Fricoin — Mine it. Own it. 🏰_
`;

// ── Leaderboard message ───────────────────────────────────
export const leaderboardMessage = (miners) => {
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  const rows = miners.map((m, i) =>
    `${medals[i]} *${m.firstName}* ${m.username ? `(@${m.username})` : ''}\n    ⛏️ ${m.totalMined?.toLocaleString() || 0} FRI • ${m.rank}`
  ).join('\n\n');

  return `
🏆 *Fricoin Mining Leaderboard*

━━━━━━━━━━━━━━━━━━━━━
${rows}
━━━━━━━━━━━━━━━━━━━━━

_Mine daily to climb the ranks! /mine_ ⚡
`;
};

// ── Wallet linked message ─────────────────────────────────
export const walletLinkedMessage = (address) => `
🔗 *Wallet Linked Successfully!*

━━━━━━━━━━━━━━━━━━━━━
✅ \`${address}\`
━━━━━━━━━━━━━━━━━━━━━

Your on-chain FRI balance will now sync automatically.
When mainnet launches, rewards will be sent directly to this wallet!

_You're ready for the future 🚀_
`;

// lib/messages.js
// Fricoin Bot v2 — Message Templates
// The Palace, Inc.

export const DAILY_REWARD   = 500;
export const SEND_MIN       = 10;
export const CHANNEL_HANDLE = '@FricoinNews';
export const CHANNEL_LINK   = 'https://t.me/FricoinNews';
export const BOT_LINK       = 'https://t.me/fricoiniabot';

// ── Format numbers ─────────────────────────────────────────
export const fmt = (n) => Number(n || 0).toLocaleString();

// ── Format date ────────────────────────────────────────────
export const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ── Welcome ────────────────────────────────────────────────
export const welcomeMessage = (firstName, refCode, isNew, referrerName = null) => `
🏰 *Welcome to Fricoin, ${firstName}!*
${isNew ? '_You just joined the future of mobile crypto._' : '_Welcome back, miner!_'}

━━━━━━━━━━━━━━━━━━━━━━━━
🪙 *FRICOIN (FRI)* — Mine it. Hold it. Own it.
━━━━━━━━━━━━━━━━━━━━━━━━
${referrerName ? `\n🎁 You were referred by *${referrerName}*! You'll get *+100 FRI* after joining our channel.\n` : ''}
${isNew ? `\n📢 *Step 1:* Join ${CHANNEL_HANDLE} to unlock mining\n⛏️ *Step 2:* Use /mine every 24 hours\n💰 *Step 3:* Watch your FRI grow\n` : ''}

*⚡ Commands:*
┣ /mine — Claim ${DAILY_REWARD} FRI daily
┣ /balance — Your FRI portfolio
┣ /history — Transaction log
┣ /refer — Your referral link
┣ /send @user amount — Send FRI
┣ /stats — Network stats
┣ /top — Mining leaderboard
┗ /help — All commands

_Powered by The Palace, Inc. 🏰_
`;

// ── Help ───────────────────────────────────────────────────
export const helpMessage = () => `
🏰 *Fricoin Command Center*

━━━━━━━━━━━━━━━━━━━━━━━━
⛏️ *MINING*
┣ /mine — Claim ${DAILY_REWARD} FRI every 24h
┣ /top — Top 10 miners
┗ /stats — Live network stats

💰 *WALLET & BALANCE*
┣ /balance — Full portfolio view
┣ /history — Transaction log
┗ /wallet 0x... — Link crypto wallet

📤 *TRANSFERS*
┗ /send @username 500 — Send FRI instantly

👥 *REFERRALS*
┗ /refer — Your referral link & earnings

📢 *CHANNEL*
┗ Join ${CHANNEL_HANDLE} to unlock mining & earn +300 FRI

━━━━━━━━━━━━━━━━━━━━━━━━
_Mine daily. Refer friends. Stack FRI. 🪙_
`;

// ── Balance ────────────────────────────────────────────────
export const balanceMessage = (user, onchain) => `
💰 *Fricoin Portfolio*

━━━━━━━━━━━━━━━━━━━━━━━━
👤 *${user.firstName}* ${user.username ? `(@${user.username})` : ''}
🏅 *${user.rank}*
━━━━━━━━━━━━━━━━━━━━━━━━

📱 *Bot Balance:*    \`${fmt(user.friBalance)} FRI\`
⛓️ *On-chain:*       \`${onchain !== null ? fmt(onchain) + ' FRI' : '— (no wallet linked)'}\`

━━━━━━━━━━━━━━━━━━━━━━━━
📊 *Lifetime Stats*
⛏️ Total Mined:     \`${fmt(user.totalMined)} FRI\`
📥 Total Received:  \`${fmt(user.totalReceived)} FRI\`
📤 Total Sent:      \`${fmt(user.totalSent)} FRI\`
👥 Referrals:       \`${user.referralCount || 0} people\`
━━━━━━━━━━━━━━━━━━━━━━━━

${user.walletAddress
  ? `🔗 *Wallet:* \`${user.walletAddress.slice(0,6)}...${user.walletAddress.slice(-4)}\``
  : `⚠️ No wallet linked — use /wallet 0x...`
}

_Use /history to see all transactions_ 📋
`;

// ── Transaction history ────────────────────────────────────
export const historyMessage = (logs, firstName) => {
  if (!logs || logs.length === 0) {
    return `📋 *Transaction Log*\n\n_No transactions yet, ${firstName}._\n_Start with /mine to earn your first FRI!_ ⛏️`;
  }

  const rows = logs.map(l => {
    const sign  = ['sent'].includes(l.type) ? '−' : '+';
    const color = l.type === 'sent' ? '' : '';
    return `${l.icon} *${sign}${fmt(l.amount)} FRI*\n    📝 ${l.note || l.type}\n    🕐 ${fmtDate(l.createdAt)}`;
  }).join('\n\n');

  return `
📋 *Transaction Log — ${firstName}*

━━━━━━━━━━━━━━━━━━━━━━━━
${rows}
━━━━━━━━━━━━━━━━━━━━━━━━
_Showing last ${logs.length} transactions_
_Use /balance for your full portfolio_ 💰
`;
};

// ── Mine success ───────────────────────────────────────────
export const mineSuccessMessage = (firstName, amount, newBalance, rank, streak) => `
⛏️ *Block Found!*

━━━━━━━━━━━━━━━━━━━━━━━━
✨ *${firstName}* just mined FRI!
━━━━━━━━━━━━━━━━━━━━━━━━

💎 *Mined:*       +${fmt(amount)} FRI
💰 *Balance:*     ${fmt(newBalance)} FRI
🏅 *Rank:*        ${rank}
🔥 *Streak:*      ${streak} day${streak !== 1 ? 's' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Next mining in *24 hours*
📢 Share your link → /refer
━━━━━━━━━━━━━━━━━━━━━━━━

_Every day you mine, you get ahead. 🚀_
`;

// ── Mine cooldown ──────────────────────────────────────────
export const mineCooldownMessage = (hoursLeft, minsLeft) => `
⏳ *Mining Cooldown*

━━━━━━━━━━━━━━━━━━━━━━━━
You already mined today!

⏰ Next mining in: *${hoursLeft}h ${minsLeft}m*
━━━━━━━━━━━━━━━━━━━━━━━━

While you wait:
┣ 👥 /refer — Earn FRI by inviting friends
┣ 📊 /stats — Check Fricoin stats
┗ 📋 /history — View your earnings

_Patience builds empires. 💎_
`;

// ── Channel gate ───────────────────────────────────────────
export const channelGateMessage = () => `
📢 *Join Our Channel to Mine!*

━━━━━━━━━━━━━━━━━━━━━━━━
To unlock mining, you must join the official Fricoin channel.

🎁 *Reward for joining:* +300 FRI instantly!

━━━━━━━━━━━━━━━━━━━━━━━━

👆 Click below to join, then press ✅ *I Joined!*
`;

// ── Channel joined ─────────────────────────────────────────
export const channelJoinedMessage = (firstName, bonus) => `
📢 *Channel Verified!*

━━━━━━━━━━━━━━━━━━━━━━━━
✅ Welcome to ${CHANNEL_HANDLE}, *${firstName}*!
🎁 *+${fmt(bonus)} FRI* has been added to your balance!
━━━━━━━━━━━━━━━━━━━━━━━━

You're now fully unlocked! Start mining:

⛏️ /mine — Claim your first ${DAILY_REWARD} FRI now!
`;

// ── Referral dashboard ─────────────────────────────────────
export const referMessage = (user) => {
  const next = user.referralCount < 10
    ? `\n🎯 *Next milestone:* 10 referrals → +1,000 FRI bonus\n    Progress: ${user.referralCount}/10`
    : user.referralCount < 50
    ? `\n🎯 *Next milestone:* 50 referrals → +10,000 FRI bonus\n    Progress: ${user.referralCount}/50`
    : user.referralCount < 100
    ? `\n🎯 *Next milestone:* 100 referrals → +50,000 FRI bonus\n    Progress: ${user.referralCount}/100`
    : `\n💎 *Legendary Referrer!* You've unlocked all milestones.`;

  return `
👥 *Your Referral Dashboard*

━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *Your referral link:*
\`${BOT_LINK}?start=${user.referralCode}\`

━━━━━━━━━━━━━━━━━━━━━━━━
📊 *Your Referral Stats*
👥 People referred:   *${user.referralCount || 0}*
💰 Earned from refs:  Check /history
━━━━━━━━━━━━━━━━━━━━━━━━

*💸 How It Works:*
┣ Friend joins via your link → *+200 FRI*
┣ Friend mines first time → *+50 FRI*
┣ Every friend mine after → *+10 FRI*
${next}

━━━━━━━━━━━━━━━━━━━━━━━━
*🏆 Milestones:*
┣ 10 referrals  →  +1,000 FRI 🎯
┣ 50 referrals  →  +10,000 FRI 🚀
┗ 100 referrals →  +50,000 FRI 💎

_Share your link and build your FRI empire!_ 🏰
`;
};

// ── New user referral bonus ────────────────────────────────
export const newUserBonusMessage = (referrerName, amount) => `
🎁 *Referral Bonus Unlocked!*

━━━━━━━━━━━━━━━━━━━━━━━━
You were referred by *${referrerName}*
and just earned *+${fmt(amount)} FRI* bonus!
━━━━━━━━━━━━━━━━━━━━━━━━

_Now go mine your first FRI → /mine_ ⛏️
`;

// ── Referrer notification ──────────────────────────────────
export const referrerNotifyMessage = (newName, earned, total) => `
👥 *New Referral!*

━━━━━━━━━━━━━━━━━━━━━━━━
*${newName}* just joined via your link!
💰 You earned: *+${fmt(earned)} FRI*
👥 Total referrals: *${total}*
━━━━━━━━━━━━━━━━━━━━━━━━

_Keep sharing → /refer_ 🔗
`;

// ── Milestone notification ─────────────────────────────────
export const milestoneMessage = (count, bonus) => `
🏆 *MILESTONE UNLOCKED!*

━━━━━━━━━━━━━━━━━━━━━━━━
🎯 You've referred *${count} people!*
💎 Bonus: *+${fmt(bonus)} FRI* added!
━━━━━━━━━━━━━━━━━━━━━━━━

_You're building an empire. Keep going! 🏰_
`;

// ── Send success ───────────────────────────────────────────
export const sendSuccessMessage = (toName, amount, newBalance) => `
📤 *Transfer Sent!*

━━━━━━━━━━━━━━━━━━━━━━━━
✅ Sent *${fmt(amount)} FRI* to *${toName}*
💰 New balance: *${fmt(newBalance)} FRI*
━━━━━━━━━━━━━━━━━━━━━━━━

_Use /history to view all transfers_ 📋
`;

// ── Receive notification ───────────────────────────────────
export const receiveMessage = (fromName, amount, newBalance) => `
📥 *FRI Received!*

━━━━━━━━━━━━━━━━━━━━━━━━
🎁 *${fromName}* sent you *${fmt(amount)} FRI*!
💰 New balance: *${fmt(newBalance)} FRI*
━━━━━━━━━━━━━━━━━━━━━━━━

_View your full history → /history_ 📋
`;

// ── Stats ──────────────────────────────────────────────────
export const statsMessage = (totalUsers, totalMined) => `
📊 *Fricoin Network Stats*

━━━━━━━━━━━━━━━━━━━━━━━━
🪙 *Token:*        Fricoin (FRI)
⛓️ *Network:*      Polygon
💸 *Tax:*          3% per transfer
🔥 *Burn:*         1% per transfer
━━━━━━━━━━━━━━━━━━━━━━━━

👥 *Total Miners:*     ${fmt(totalUsers)}
⛏️ *Total FRI Mined:*  ${fmt(totalMined)}
🎁 *Daily Reward:*     ${fmt(DAILY_REWARD)} FRI/day
━━━━━━━━━━━━━━━━━━━━━━━━

📢 Channel: ${CHANNEL_HANDLE}
🤖 Bot: @fricoiniabot

_Fricoin — The People's Crypto. 🏰_
`;

// ── Leaderboard ────────────────────────────────────────────
export const leaderboardMessage = (miners) => {
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  const rows = miners.map((m, i) =>
    `${medals[i]} *${m.firstName}* ${m.username ? `(@${m.username})` : ''}\n    ⛏️ ${fmt(m.totalMined)} FRI • ${m.rank}`
  ).join('\n\n');

  return `
🏆 *Mining Leaderboard*

━━━━━━━━━━━━━━━━━━━━━━━━
${rows}
━━━━━━━━━━━━━━━━━━━━━━━━

_Mine daily to climb the ranks! /mine_ ⚡
`;
};

// ── Wallet linked ──────────────────────────────────────────
export const walletLinkedMessage = (address) => `
🔗 *Wallet Linked!*

━━━━━━━━━━━━━━━━━━━━━━━━
✅ \`${address}\`
━━━━━━━━━━━━━━━━━━━━━━━━

Your on-chain FRI balance now syncs automatically. When mainnet launches, rewards go straight to this wallet!

_You're ready for the future 🚀_
`;

// ════════════════════════════════════════════════════════
// CHANNEL BROADCAST MESSAGES
// ════════════════════════════════════════════════════════

export const channelMessages = {

  dailyReminder: (totalUsers, totalMined) => `
🪙 *DAILY MINING REMINDER*

━━━━━━━━━━━━━━━━━━━━━━━━
⛏️ Have you mined your FRI today?

Every single day you skip is *${DAILY_REWARD} FRI* you'll never get back.

The miners who show up every day are the ones who will look back and smile when FRI is listed on global exchanges.

━━━━━━━━━━━━━━━━━━━━━━━━
📊 *Community Stats*
👥 Active Miners: *${fmt(totalUsers)}*
⛏️ Total Mined: *${fmt(totalMined)} FRI*
━━━━━━━━━━━━━━━━━━━━━━━━

👉 Mine now → @fricoiniabot
👉 Invite a friend → /refer

_The early bird gets the FRI. 🐦_

#Fricoin #FRI #Mining #Crypto
`,

  morningMotivation: () => `
☀️ *GOOD MORNING, MINERS!*

━━━━━━━━━━━━━━━━━━━━━━━━
A new day. A new block. A new 500 FRI waiting for you.

💭 *Think about this:*
The people who mined Bitcoin in 2009 for free are millionaires today. Fricoin is giving you that same opportunity — right now — from your phone.

The only question is: will you show up every day?

━━━━━━━━━━━━━━━━━━━━━━━━
⛏️ Mine your FRI → @fricoiniabot
👥 Refer a friend → earn +200 FRI per person

_Fortune favors the consistent. 🏆_

#Fricoin #GoodMorning #Crypto #Mining
`,

  weeklyUpdate: (totalUsers, totalMined, topMiner) => `
📰 *WEEKLY FRICOIN UPDATE*

━━━━━━━━━━━━━━━━━━━━━━━━
Another incredible week for the Fricoin community!

📊 *This Week's Numbers:*
👥 Total Miners: *${fmt(totalUsers)}*
⛏️ Total FRI Mined: *${fmt(totalMined)}*
🥇 Top Miner: *${topMiner?.firstName || 'Unknown'}* with ${fmt(topMiner?.totalMined)} FRI

━━━━━━━━━━━━━━━━━━━━━━━━
🗺️ *Progress Update:*
✅ Smart Contract — Deployed
✅ Telegram Bot — Live
✅ Landing Page — Live
✅ Whitepaper — Published
🔄 Mainnet Launch — Coming Soon
⏳ CoinGecko Listing — Pending

━━━━━━━━━━━━━━━━━━━━━━━━
Keep mining. Keep referring. The listing is getting closer every day.

⛏️ @fricoiniabot

_Built by The Palace, Inc. 🏰_

#Fricoin #WeeklyUpdate #Crypto
`,

  motivationalQuote: () => {
    const quotes = [
      { q: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
      { q: 'Don\'t watch the clock; do what it does. Keep going.', a: 'Sam Levenson' },
      { q: 'Success is the sum of small efforts repeated day in and day out.', a: 'Robert Collier' },
      { q: 'The best time to plant a tree was 20 years ago. The second best time is now.', a: 'Chinese Proverb' },
      { q: 'It does not matter how slowly you go as long as you do not stop.', a: 'Confucius' },
    ];
    const pick = quotes[Math.floor(Math.random() * quotes.length)];
    return `
💭 *Daily Inspiration for Miners*

━━━━━━━━━━━━━━━━━━━━━━━━
_"${pick.q}"_

— *${pick.a}*
━━━━━━━━━━━━━━━━━━━━━━━━

Apply this to your Fricoin journey. Mine every day. Refer every week. Stack FRI every month.

⛏️ Mine now → @fricoiniabot

#Fricoin #Motivation #Crypto #FRI
`;
  },

  newMilestone: (totalUsers) => `
🎉 *COMMUNITY MILESTONE!*

━━━━━━━━━━━━━━━━━━━━━━━━
🚀 We just hit *${fmt(totalUsers)} miners!*

This is incredible. Every single one of you is part of building something historic — a cryptocurrency that gives everyone, everywhere, a fair shot.

Thank you for believing in Fricoin from the beginning. The earliest miners will always be remembered.

━━━━━━━━━━━━━━━━━━━━━━━━
Keep sharing. Keep mining. Keep winning.

⛏️ @fricoiniabot

_The Palace is proud of this community. 🏰_

#Fricoin #Milestone #Crypto #FRI
`,
};

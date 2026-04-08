// pages/api/webhook.js
// Fricoin Bot v2 — Complete Webhook Handler
// The Palace, Inc.

import { Telegraf } from 'telegraf';
import db from '../../lib/firebase.js';
import {
  getOrCreateUser, getUser, getUserByUsername,
  setWalletAddress, debitFRI, creditReceived,
  canMineToday, recordMining, getLeaderboard,
  getTotalUsers, getTotalMinedGlobal, getTransactionHistory,
  giveChannelBonus, markChannelJoined, getUserByRefCode,
  processReferralJoin, logTransaction,
} from '../../lib/users.js';
import { getFRIBalance, getFricoinStats, isValidAddress } from '../../lib/blockchain.js';
import {
  welcomeMessage, helpMessage, balanceMessage, historyMessage,
  mineSuccessMessage, mineCooldownMessage, channelGateMessage,
  channelJoinedMessage, referMessage, newUserBonusMessage,
  referrerNotifyMessage, milestoneMessage, sendSuccessMessage,
  receiveMessage, statsMessage, leaderboardMessage, walletLinkedMessage,
  DAILY_REWARD, SEND_MIN, CHANNEL_LINK, fmt,
} from '../../lib/messages.js';

// ── Bot instance ──────────────────────────────────────────
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const CHANNEL_ID = '@FricoinNews';

// ── Check channel membership ──────────────────────────────
async function isMemberOfChannel(userId) {
  try {
    const member = await bot.telegram.getChatMember(CHANNEL_ID, userId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch {
    return false;
  }
}

// ── Auto-register middleware ───────────────────────────────
bot.use(async (ctx, next) => {
  if (ctx.from) {
    const startParam = ctx.message?.text?.startsWith('/start ')
      ? ctx.message.text.split(' ')[1]
      : null;
    await getOrCreateUser(
      ctx.from.id,
      ctx.from.username,
      ctx.from.first_name,
      startParam
    );
  }
  return next();
});

// ── /start ────────────────────────────────────────────────
bot.start(async (ctx) => {
  const param   = ctx.message.text.split(' ')[1] || null;
  const user    = await getUser(ctx.from.id);
  const isNew   = !user?.lastMined && user?.totalMined === 0;
  let referrerName = null;

  if (param && isNew) {
    const referrer = await getUserByRefCode(param);
    if (referrer && referrer.telegramId !== String(ctx.from.id)) {
      referrerName = referrer.firstName;
    }
  }

  await ctx.replyWithMarkdown(
    welcomeMessage(ctx.from.first_name, user?.referralCode, isNew, referrerName),
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📢 Join Channel & Earn +300 FRI', url: CHANNEL_LINK },
          ],
          [
            { text: '✅ I Joined the Channel!', callback_data: 'verify_channel' },
          ],
          [
            { text: '⛏️ Mine FRI', callback_data: 'mine' },
            { text: '💰 Balance',  callback_data: 'balance' },
          ],
          [
            { text: '👥 Refer Friends', callback_data: 'refer' },
            { text: '📋 History',       callback_data: 'history' },
          ],
        ],
      },
    }
  );
});

// ── /help ─────────────────────────────────────────────────
bot.command('help', async (ctx) => {
  await ctx.replyWithMarkdown(helpMessage());
});

// ── /balance ──────────────────────────────────────────────
bot.command('balance', async (ctx) => {
  const user = await getUser(ctx.from.id);
  if (!user) return ctx.reply('Please /start first.');
  let onchain = null;
  if (user.walletAddress) onchain = await getFRIBalance(user.walletAddress);
  await ctx.replyWithMarkdown(balanceMessage(user, onchain), {
    reply_markup: {
      inline_keyboard: [[
        { text: '⛏️ Mine', callback_data: 'mine' },
        { text: '📋 History', callback_data: 'history' },
        { text: '👥 Refer', callback_data: 'refer' },
      ]]
    }
  });
});

// ── /history ──────────────────────────────────────────────
bot.command('history', async (ctx) => {
  const user = await getUser(ctx.from.id);
  if (!user) return ctx.reply('Please /start first.');
  const logs = await getTransactionHistory(ctx.from.id, 15);
  await ctx.replyWithMarkdown(historyMessage(logs, ctx.from.first_name));
});

// ── /mine ─────────────────────────────────────────────────
bot.command('mine', async (ctx) => { await handleMine(ctx); });

async function handleMine(ctx) {
  const user = await getUser(ctx.from.id);

  // ── Channel gate ───────────────────────────────────────
  const isMember = await isMemberOfChannel(ctx.from.id);
  if (!isMember) {
    return ctx.replyWithMarkdown(channelGateMessage(), {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 Join @FricoinNews Now', url: CHANNEL_LINK }],
          [{ text: '✅ I Joined! Verify Me', callback_data: 'verify_channel' }],
        ]
      }
    });
  }

  // ── Give channel bonus if not yet paid ─────────────────
  if (!user?.channelBonusPaid) {
    const bonusPaid = await giveChannelBonus(ctx.from.id);
    if (bonusPaid) {
      await ctx.replyWithMarkdown(channelJoinedMessage(ctx.from.first_name, 300));
      // Give new user referral bonus
      if (user?.referredBy) {
        await logTransaction(String(ctx.from.id), 'new_user_bonus', 100, 'Referral welcome bonus');
        const ref = await getUser(user.referredBy);
        if (ref) {
          await bot.telegram.sendMessage(
            user.referredBy,
            referrerNotifyMessage(ctx.from.first_name, 200, ref.referralCount),
            { parse_mode: 'Markdown' }
          ).catch(() => {});
        }
      }
    }
  }

  // ── Cooldown check ─────────────────────────────────────
  const canMine = await canMineToday(ctx.from.id);
  if (!canMine) {
    const last  = new Date(user.lastMined);
    const diff  = (new Date() - last) / (1000 * 60);
    const hLeft = Math.floor((24 * 60 - diff) / 60);
    const mLeft = Math.floor((24 * 60 - diff) % 60);
    return ctx.replyWithMarkdown(mineCooldownMessage(hLeft, mLeft));
  }

  // ── Mine! ──────────────────────────────────────────────
  const loadMsg = await ctx.reply('⛏️ Mining...');
  await new Promise(r => setTimeout(r, 1200));

  const rank  = await recordMining(ctx.from.id, DAILY_REWARD);
  const fresh = await getUser(ctx.from.id);

  // Calculate streak
  const streak = Math.floor((fresh.totalMined || 0) / DAILY_REWARD);

  try {
    await ctx.telegram.editMessageText(ctx.chat.id, loadMsg.message_id, undefined, '✅ Block confirmed!');
  } catch {}

  await ctx.replyWithMarkdown(
    mineSuccessMessage(ctx.from.first_name, DAILY_REWARD, fresh.friBalance, rank, streak),
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '💰 Balance',    callback_data: 'balance' },
          { text: '👥 Refer & Earn', callback_data: 'refer' },
          { text: '🏆 Leaderboard', callback_data: 'top' },
        ]]
      }
    }
  );

  // ── Check user milestones ──────────────────────────────
  const milestones = [100, 1000, 10000, 100000];
  if (milestones.includes(streak)) {
    await ctx.replyWithMarkdown(`🎉 *${streak}-Day Mining Streak!* You've been mining for ${streak} consecutive days. Legendary dedication! 💎`);
  }
}

// ── /refer ────────────────────────────────────────────────
bot.command('refer', async (ctx) => {
  const user = await getUser(ctx.from.id);
  if (!user) return ctx.reply('Please /start first.');
  await ctx.replyWithMarkdown(referMessage(user), {
    reply_markup: {
      inline_keyboard: [[
        { text: '📊 View Earnings', callback_data: 'history' },
        { text: '🏆 Top Referrers', callback_data: 'top_refs' },
      ]]
    }
  });
});

// ── /send ─────────────────────────────────────────────────
bot.command('send', async (ctx) => {
  const parts    = ctx.message.text.trim().split(/\s+/);
  const toHandle = parts[1];
  const amount   = parseFloat(parts[2]);

  if (!toHandle || isNaN(amount)) {
    return ctx.replyWithMarkdown(
      `📤 *Send FRI*\n\nFormat: \`/send @username amount\`\nExample: \`/send @john 500\`\n\nMinimum: *${SEND_MIN} FRI*`
    );
  }

  if (amount < SEND_MIN) return ctx.reply(`❌ Minimum send is ${SEND_MIN} FRI.`);

  const sender = await getUser(ctx.from.id);
  if (!sender || sender.friBalance < amount) {
    return ctx.reply(`❌ Insufficient balance. You have ${fmt(sender?.friBalance)} FRI.`);
  }

  const recipient = await getUserByUsername(toHandle);
  if (!recipient) return ctx.reply(`❌ User ${toHandle} not found. They must start the bot first.`);
  if (String(recipient.telegramId) === String(ctx.from.id)) return ctx.reply("❌ You can't send FRI to yourself.");

  // Execute transfer
  const note = `Sent to @${recipient.username || recipient.firstName}`;
  await debitFRI(ctx.from.id, amount, note);
  await creditReceived(recipient.telegramId, amount, `Received from @${sender.username || sender.firstName}`);

  const updated = await getUser(ctx.from.id);
  const updatedRecipient = await getUser(recipient.telegramId);

  await ctx.replyWithMarkdown(sendSuccessMessage(
    recipient.username || recipient.firstName, amount, updated.friBalance
  ));

  // Notify recipient
  try {
    await bot.telegram.sendMessage(
      recipient.telegramId,
      receiveMessage(ctx.from.first_name, amount, updatedRecipient.friBalance),
      { parse_mode: 'Markdown' }
    );
  } catch {}
});

// ── /wallet ───────────────────────────────────────────────
bot.command('wallet', async (ctx) => {
  const parts   = ctx.message.text.trim().split(/\s+/);
  const address = parts[1];
  if (!address) {
    const user = await getUser(ctx.from.id);
    return ctx.replyWithMarkdown(
      user?.walletAddress
        ? `🔗 *Your Wallet:*\n\n\`${user.walletAddress}\`\n\nTo update: \`/wallet 0xNewAddress\``
        : `🔗 *Link Your Wallet*\n\n\`/wallet 0xYourPolygonAddress\`\n\n_Get a free wallet at metamask.io_`
    );
  }
  if (!isValidAddress(address)) return ctx.reply('❌ Invalid address. Please check and try again.');
  await setWalletAddress(ctx.from.id, address);
  await logTransaction(String(ctx.from.id), 'credit', 0, `Wallet linked: ${address.slice(0,6)}...${address.slice(-4)}`);
  await ctx.replyWithMarkdown(walletLinkedMessage(address));
});

// ── /stats ────────────────────────────────────────────────
bot.command('stats', async (ctx) => {
  const [totalUsers, totalMined] = await Promise.all([getTotalUsers(), getTotalMinedGlobal()]);
  await ctx.replyWithMarkdown(statsMessage(totalUsers, totalMined));
});

// ── /top ──────────────────────────────────────────────────
bot.command('top', async (ctx) => {
  const miners = await getLeaderboard(10);
  if (!miners.length) return ctx.reply('No miners yet. Be the first! /mine');
  await ctx.replyWithMarkdown(leaderboardMessage(miners));
});

// ── Inline button callbacks ───────────────────────────────
bot.action('mine',    async (ctx) => { await ctx.answerCbQuery(); await handleMine(ctx); });
bot.action('balance', async (ctx) => {
  await ctx.answerCbQuery();
  const user = await getUser(ctx.from.id);
  await ctx.replyWithMarkdown(balanceMessage(user, null));
});
bot.action('history', async (ctx) => {
  await ctx.answerCbQuery();
  const logs = await getTransactionHistory(ctx.from.id, 15);
  await ctx.replyWithMarkdown(historyMessage(logs, ctx.from.first_name));
});
bot.action('refer', async (ctx) => {
  await ctx.answerCbQuery();
  const user = await getUser(ctx.from.id);
  await ctx.replyWithMarkdown(referMessage(user));
});
bot.action('top', async (ctx) => {
  await ctx.answerCbQuery();
  const miners = await getLeaderboard(10);
  await ctx.replyWithMarkdown(leaderboardMessage(miners));
});
bot.action('top_refs', async (ctx) => {
  await ctx.answerCbQuery();
  const { getReferralLeaderboard } = await import('../../lib/users.js');
  const refs = await getReferralLeaderboard(10);
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  const rows = refs.map((r, i) =>
    `${medals[i]} *${r.firstName}* — ${r.referralCount || 0} referrals`
  ).join('\n');
  await ctx.replyWithMarkdown(`🏆 *Top Referrers*\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n${rows}\n━━━━━━━━━━━━━━━━━━━━━━━━\n_Share your link → /refer_ 👥`);
});

// ── Channel verification button ───────────────────────────
bot.action('verify_channel', async (ctx) => {
  await ctx.answerCbQuery('Checking membership...');
  const isMember = await isMemberOfChannel(ctx.from.id);

  if (!isMember) {
    return ctx.replyWithMarkdown(
      `❌ *Not detected yet!*\n\nMake sure you joined ${CHANNEL_LINK} then tap the button again.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📢 Join @FricoinNews', url: CHANNEL_LINK }],
            [{ text: '✅ Check Again', callback_data: 'verify_channel' }],
          ]
        }
      }
    );
  }

  const bonusPaid = await giveChannelBonus(ctx.from.id);
  if (bonusPaid) {
    await ctx.replyWithMarkdown(channelJoinedMessage(ctx.from.first_name, 300));
  } else {
    await ctx.replyWithMarkdown(`✅ *Already verified!* You're a channel member.\n\nGo mine! → /mine ⛏️`);
  }
});

// ── Webhook handler ───────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: '🪙 Fricoin Bot v2 is alive!' });
  }
  try {
    await bot.handleUpdate(req.body);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Bot error:', err);
    res.status(200).json({ ok: false });
  }
}

export const config = { api: { bodyParser: true } };

// pages/api/webhook.js
// Fricoin Bot — Main Telegram Webhook
// The Palace, Inc.

import { Telegraf } from 'telegraf';
import db from '../../lib/firebase.js';
import {
  getOrCreateUser,
  getUser,
  getUserByUsername,
  setWalletAddress,
  creditFRI,
  debitFRI,
  canMineToday,
  recordMining,
  getLeaderboard,
  getTotalUsers,
} from '../../lib/users.js';
import {
  getFRIBalance,
  getFricoinStats,
  isValidAddress,
} from '../../lib/blockchain.js';
import {
  welcomeMessage,
  helpMessage,
  balanceMessage,
  mineSuccessMessage,
  mineCooldownMessage,
  sendSuccessMessage,
  receiveMessage,
  statsMessage,
  leaderboardMessage,
  walletLinkedMessage,
  DAILY_REWARD,
  SEND_MIN,
} from '../../lib/messages.js';

// ── Bot instance ──────────────────────────────────────────
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// ── Middleware: auto-register every user ──────────────────
bot.use(async (ctx, next) => {
  if (ctx.from) {
    await getOrCreateUser(
      ctx.from.id,
      ctx.from.username,
      ctx.from.first_name
    );
  }
  return next();
});

// ── /start ────────────────────────────────────────────────
bot.start(async (ctx) => {
  await ctx.replyWithMarkdown(welcomeMessage(ctx.from.first_name), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⛏️ Mine FRI', callback_data: 'mine' },
          { text: '💰 Balance',  callback_data: 'balance' },
        ],
        [
          { text: '📊 Stats',       callback_data: 'stats' },
          { text: '🏆 Leaderboard', callback_data: 'top' },
        ],
        [
          { text: '❓ Help', callback_data: 'help' },
        ],
      ],
    },
  });
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
  if (user.walletAddress) {
    onchain = await getFRIBalance(user.walletAddress);
  }

  await ctx.replyWithMarkdown(balanceMessage(user, onchain), {
    reply_markup: {
      inline_keyboard: [[
        { text: '⛏️ Mine Now', callback_data: 'mine' },
        { text: '📤 Send FRI', callback_data: 'send_help' },
      ]],
    },
  });
});

// ── /mine ─────────────────────────────────────────────────
bot.command('mine', async (ctx) => {
  await handleMine(ctx);
});

async function handleMine(ctx) {
  const canMine = await canMineToday(ctx.from.id);

  if (!canMine) {
    const user = await getUser(ctx.from.id);
    const last = new Date(user.lastMined);
    const now  = new Date();
    const diffH = (now - last) / (1000 * 60 * 60);
    const hoursLeft = Math.ceil(24 - diffH);
    return ctx.replyWithMarkdown(mineCooldownMessage(hoursLeft));
  }

  // Mining animation message
  const loadMsg = await ctx.reply('⛏️ Mining in progress...');

  // Short delay for effect
  await new Promise(r => setTimeout(r, 1500));

  await recordMining(ctx.from.id, DAILY_REWARD);
  const user = await getUser(ctx.from.id);

  // Edit the loading message
  try {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      loadMsg.message_id,
      undefined,
      '✅ Block found!'
    );
  } catch {}

  await ctx.replyWithMarkdown(
    mineSuccessMessage(
      ctx.from.first_name,
      DAILY_REWARD,
      user.friBalance,
      user.rank
    ),
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '💰 View Balance', callback_data: 'balance' },
          { text: '🏆 Leaderboard',  callback_data: 'top' },
        ]],
      },
    }
  );
}

// ── /wallet ───────────────────────────────────────────────
bot.command('wallet', async (ctx) => {
  const parts   = ctx.message.text.trim().split(/\s+/);
  const address = parts[1];

  if (!address) {
    const user = await getUser(ctx.from.id);
    if (!user?.walletAddress) {
      return ctx.replyWithMarkdown(
        `🔗 *Link Your Wallet*\n\nSend your Polygon wallet address:\n\n\`/wallet 0xYourAddressHere\`\n\n_Get a wallet at metamask.io_`
      );
    }
    return ctx.replyWithMarkdown(
      `🔗 *Your Linked Wallet*\n\n\`${user.walletAddress}\`\n\nTo change it, send:\n\`/wallet 0xNewAddress\``
    );
  }

  if (!isValidAddress(address)) {
    return ctx.reply('❌ Invalid wallet address. Please check and try again.');
  }

  await setWalletAddress(ctx.from.id, address);
  await ctx.replyWithMarkdown(walletLinkedMessage(address));
});

// ── /send ─────────────────────────────────────────────────
bot.command('send', async (ctx) => {
  const parts    = ctx.message.text.trim().split(/\s+/);
  const toHandle = parts[1]; // @username
  const amount   = parseFloat(parts[2]);

  if (!toHandle || isNaN(amount)) {
    return ctx.replyWithMarkdown(
      `📤 *Send FRI*\n\nFormat: \`/send @username amount\`\nExample: \`/send @john 500\`\n\nMinimum: *${SEND_MIN} FRI*`
    );
  }

  if (amount < SEND_MIN) {
    return ctx.reply(`❌ Minimum send amount is ${SEND_MIN} FRI.`);
  }

  const sender = await getUser(ctx.from.id);
  if (!sender || sender.friBalance < amount) {
    return ctx.reply(`❌ Insufficient balance. You have ${sender?.friBalance?.toLocaleString() || 0} FRI.`);
  }

  const recipient = await getUserByUsername(toHandle);
  if (!recipient) {
    return ctx.reply(`❌ User ${toHandle} not found. They must start the bot first.`);
  }

  if (String(recipient.telegramId) === String(ctx.from.id)) {
    return ctx.reply("❌ You can't send FRI to yourself.");
  }

  // Debit sender
  await debitFRI(ctx.from.id, amount);

  // Credit recipient
  await creditFRI(recipient.telegramId, amount);

  // Notify sender
  const updatedSender = await getUser(ctx.from.id);
  await ctx.replyWithMarkdown(
    sendSuccessMessage(
      recipient.username || recipient.firstName,
      amount,
      updatedSender.friBalance
    )
  );

  // Notify recipient
  try {
    await bot.telegram.sendMessage(
      recipient.telegramId,
      receiveMessage(ctx.from.first_name, amount),
      { parse_mode: 'Markdown' }
    );
  } catch {}
});

// ── /stats ────────────────────────────────────────────────
bot.command('stats', async (ctx) => {
  const loadMsg = await ctx.reply('📊 Fetching live stats...');
  const [stats, totalUsers] = await Promise.all([
    getFricoinStats(),
    getTotalUsers(),
  ]);
  try {
    await ctx.telegram.deleteMessage(ctx.chat.id, loadMsg.message_id);
  } catch {}
  await ctx.replyWithMarkdown(statsMessage(stats, totalUsers));
});

// ── /top ──────────────────────────────────────────────────
bot.command('top', async (ctx) => {
  const miners = await getLeaderboard(10);
  if (!miners.length) return ctx.reply('No miners yet. Be the first! /mine');
  await ctx.replyWithMarkdown(leaderboardMessage(miners));
});

// ── Inline button callbacks ───────────────────────────────
bot.action('mine',      async (ctx) => { await ctx.answerCbQuery(); await handleMine(ctx); });
bot.action('balance',   async (ctx) => { await ctx.answerCbQuery(); ctx.message = { text: '/balance', ...ctx.update.callback_query.message }; await ctx.replyWithMarkdown(balanceMessage(await getUser(ctx.from.id), null)); });
bot.action('stats',     async (ctx) => { await ctx.answerCbQuery(); const [s, u] = await Promise.all([getFricoinStats(), getTotalUsers()]); await ctx.replyWithMarkdown(statsMessage(s, u)); });
bot.action('top',       async (ctx) => { await ctx.answerCbQuery(); const m = await getLeaderboard(10); await ctx.replyWithMarkdown(leaderboardMessage(m)); });
bot.action('help',      async (ctx) => { await ctx.answerCbQuery(); await ctx.replyWithMarkdown(helpMessage()); });
bot.action('send_help', async (ctx) => { await ctx.answerCbQuery(); await ctx.replyWithMarkdown(`📤 *Send FRI*\n\nFormat: \`/send @username amount\`\nExample: \`/send @john 500\``); });

// ── Webhook handler ───────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Fricoin Bot is alive 🪙' });
  }
  try {
    await bot.handleUpdate(req.body);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Bot error:', err);
    res.status(200).json({ ok: false });
  }
}

export const config = {
  api: { bodyParser: true },
};

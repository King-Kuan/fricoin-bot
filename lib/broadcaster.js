// lib/broadcaster.js
// Fricoin Bot v2 — Automated Channel Broadcaster
// Posts reminders, motivation and stats to @FricoinNews
// The Palace, Inc.

import { Telegraf } from 'telegraf';
import { getTotalUsers, getTotalMinedGlobal, getLeaderboard } from './users.js';
import { channelMessages } from './messages.js';

const CHANNEL = '@FricoinNews';

export async function broadcastDailyReminder() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  const [totalUsers, totalMined] = await Promise.all([
    getTotalUsers(),
    getTotalMinedGlobal(),
  ]);
  await bot.telegram.sendMessage(
    CHANNEL,
    channelMessages.dailyReminder(totalUsers, totalMined),
    { parse_mode: 'Markdown' }
  );
}

export async function broadcastMorningMotivation() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  await bot.telegram.sendMessage(
    CHANNEL,
    channelMessages.morningMotivation(),
    { parse_mode: 'Markdown' }
  );
}

export async function broadcastWeeklyUpdate() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  const [totalUsers, totalMined, miners] = await Promise.all([
    getTotalUsers(),
    getTotalMinedGlobal(),
    getLeaderboard(1),
  ]);
  await bot.telegram.sendMessage(
    CHANNEL,
    channelMessages.weeklyUpdate(totalUsers, totalMined, miners[0]),
    { parse_mode: 'Markdown' }
  );
}

export async function broadcastMotivationalQuote() {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  await bot.telegram.sendMessage(
    CHANNEL,
    channelMessages.motivationalQuote(),
    { parse_mode: 'Markdown' }
  );
}

export async function broadcastMilestone(totalUsers) {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  await bot.telegram.sendMessage(
    CHANNEL,
    channelMessages.newMilestone(totalUsers),
    { parse_mode: 'Markdown' }
  );
}

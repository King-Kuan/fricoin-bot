// pages/api/cron/reminder.js
// Fires every day at 6:00 PM UTC
// Posts daily mining reminder to @FricoinNews
// The Palace, Inc.

import { broadcastDailyReminder } from '../../../lib/broadcaster.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await broadcastDailyReminder();
    res.status(200).json({ ok: true, message: '⛏️ Daily reminder sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

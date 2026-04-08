// pages/api/cron/morning.js
// Fires every day at 6:00 AM UTC
// Posts morning motivation to @FricoinNews
// The Palace, Inc.

import { broadcastMorningMotivation } from '../../../lib/broadcaster.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await broadcastMorningMotivation();
    res.status(200).json({ ok: true, message: '☀️ Morning motivation sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

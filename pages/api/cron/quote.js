// pages/api/cron/quote.js
// Fires every Wednesday at 12:00 PM UTC
// Posts motivational quote to @FricoinNews
// The Palace, Inc.

import { broadcastMotivationalQuote } from '../../../lib/broadcaster.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await broadcastMotivationalQuote();
    res.status(200).json({ ok: true, message: '💭 Quote sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// pages/api/cron/weekly.js
// Fires every Monday at 9:00 AM UTC
// Posts weekly community update to @FricoinNews
// The Palace, Inc.

import { broadcastWeeklyUpdate } from '../../../lib/broadcaster.js';

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await broadcastWeeklyUpdate();
    res.status(200).json({ ok: true, message: '📰 Weekly update sent!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

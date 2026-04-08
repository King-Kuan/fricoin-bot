// pages/api/setup.js
// Fricoin Bot — Webhook Registration
// Run once after deployment: visit /api/setup in your browser
// The Palace, Inc.

export default async function handler(req, res) {
  const token      = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = `${process.env.VERCEL_URL}/api/webhook`;

  if (!token) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not set' });
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url:             webhookUrl,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: true,
        }),
      }
    );
    const data = await response.json();

    if (data.ok) {
      res.status(200).json({
        success: true,
        message: '✅ Fricoin Bot webhook registered!',
        webhook: webhookUrl,
        telegram: data,
      });
    } else {
      res.status(400).json({ success: false, telegram: data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

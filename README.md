# 🪙 Fricoin Bot — Deployment Guide
## The Palace, Inc.

---

## 📁 Project Structure

```
fricoin-bot/
├── pages/
│   ├── index.js              ← Beautiful status homepage
│   └── api/
│       ├── webhook.js        ← Main bot logic (all commands)
│       └── setup.js          ← Run once to register webhook
├── lib/
│   ├── firebase.js           ← Firebase Admin connection
│   ├── blockchain.js         ← Polygon/FRI contract interaction
│   ├── users.js              ← Firestore user management
│   └── messages.js           ← All bot message templates
├── .env.example              ← Environment variables template
├── .gitignore
└── package.json
```

---

## 🚀 Step-by-Step Deployment

### Step 1 — Push to GitHub
1. Create a new GitHub repo called `fricoin-bot`
2. Upload all these files
3. Make sure `.env` is in `.gitignore` (it is ✅)

### Step 2 — Deploy to Vercel
1. Go to vercel.com → New Project
2. Import your `fricoin-bot` GitHub repo
3. Click Deploy (it will fail first time — that's fine)

### Step 3 — Add Environment Variables in Vercel
Go to: Project → Settings → Environment Variables

Add these one by one:

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | Your token from @BotFather |
| `FIREBASE_PROJECT_ID` | `fricoin-bot` |
| `FIREBASE_CLIENT_EMAIL` | Your service account email |
| `FIREBASE_PRIVATE_KEY` | Your private key (with \n) |
| `FRICOIN_CONTRACT_ADDRESS` | Your contract address (after deploy) |
| `REWARD_POOL_PRIVATE_KEY` | Reward pool wallet private key |
| `VERCEL_URL` | Your Vercel URL (e.g. fricoin-bot.vercel.app) |

### Step 4 — Redeploy
After adding env vars, go to Deployments → Redeploy

### Step 5 — Register Webhook (ONE TIME ONLY)
Visit this URL in your browser:
```
https://your-project.vercel.app/api/setup
```
You should see: `✅ Fricoin Bot webhook registered!`

### Step 6 — Test Your Bot
Open Telegram → search `@fricoiniabot` → send `/start`

---

## 🤖 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome + register user |
| `/mine` | Claim 500 FRI every 24 hours |
| `/balance` | View FRI balance + rank |
| `/wallet 0x...` | Link your Polygon wallet |
| `/send @user 100` | Send FRI to another user |
| `/stats` | Live Fricoin network stats |
| `/top` | Top 10 miners leaderboard |
| `/help` | All commands |

---

## 🏅 Mining Ranks

| Rank | Total Mined |
|------|-------------|
| 🪨 Rookie Miner | 0 FRI |
| 🥉 Bronze Miner | 1,000+ FRI |
| 🥈 Silver Miner | 10,000+ FRI |
| 🥇 Gold Miner | 100,000+ FRI |
| 💎 Diamond Miner | 1,000,000+ FRI |

---

## ⚠️ Security Reminders
- NEVER commit `.env` or any private keys to GitHub
- Rotate your Firebase service account key immediately if exposed
- Store `REWARD_POOL_PRIVATE_KEY` only in Vercel env vars
- Never share private keys in chat or email

---

*Powered by The Palace, Inc. 🏰*

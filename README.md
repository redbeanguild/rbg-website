# Red Bean Guild

> **"Products are armor for your arc."**
> Premium streetwear with anime-coded aesthetics.

---

## Overview

The RBG website is the main brand presence and collector identity system for Red Bean Guild. It combines e-commerce (Shopify), a guild rank loyalty system, email subscriptions (ConvertKit), and optional Web3 wallet verification — all served as a static frontend with Vercel serverless functions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, Tailwind CSS (CDN), Vanilla JS |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Supabase (PostgreSQL + Auth) |
| Commerce | Shopify (Admin API + Webhooks) |
| Email | ConvertKit |
| Web3 | MetaMask + ethers.js (ERC-721 verification) |
| Hosting | Vercel |

---

## Guild Rank System

Ranks are assigned automatically based on lifetime spend and piece count.

| Rank | Name | Kanji | Threshold |
|---|---|---|---|
| I | Recruit | 新兵 | First purchase |
| II | Ronin | 浪人 | 2+ pieces, $150+ |
| III | Kenshi | 剣士 | 5+ pieces, $400+ |
| IV | Guildmaster | ギルドマスター | 10+ pieces, $900+ |
| V | Grand Guildmaster | 大ギルドマスター | OG / Top 1% / Invite-only |

---

## Project Structure

```
/
├── index.html              # Main landing page
├── profile.html            # Collector profile dashboard
├── login.html              # Auth (Supabase magic link)
├── admin.html              # Admin panel
├── hall.html               # Hall of Legends leaderboard
├── tos.html                # Terms of Service
│
├── js/
│   ├── auth.js             # Supabase auth client
│   └── wallet.js           # MetaMask + NFT verification
│
├── api/
│   ├── subscribe.js        # ConvertKit email signup
│   └── shopify/
│       ├── webhook.js      # Order webhook handler
│       ├── token.js        # OAuth token refresh
│       └── backfill.js     # Historical order sync
│
├── brand_assets/           # Logos, drop imagery, rank icons
│   ├── 2025_drops/
│   ├── 5ranks_icons/
│   └── Frontend_reference/
│
├── *-migration.sql         # Supabase schema migrations
├── serve.mjs               # Local dev server
└── screenshot.mjs          # Puppeteer screenshot utility
```

---

## Local Development

```bash
npm install
node serve.mjs
```

The dev server runs at `http://localhost:3000`.

---

## Documentation

- [Collector Profile System](RBG_GP_README.md) — full technical spec, rank logic, schema, and roadmap
- [Design System](RBG_GP_DESIGN_SYSTEM.md) — colors, typography, spacing, component patterns
- [Shopify Setup](SHOPIFY_SETUP.md) — webhook and API configuration

---

## How It Works

1. **Customer buys from Shopify** — an `orders/paid` webhook fires
2. **Webhook handler** creates/updates a Supabase profile and wardrobe items
3. **Rank is recalculated** automatically on every order
4. **Customer signs in** via magic link and views their collector profile
5. **Optional**: connect a MetaMask wallet to verify NFT ownership

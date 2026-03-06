# RBG Collector Profile

> **"Products are armor for your arc."**  
> Red Bean Guild 2.0 — High-end streetwear with anime-coded aesthetics.

---

## What This Is

The RBG Collector Profile is a web-based identity layer that lives on top of the Shopify commerce backend. Every customer who buys from RBG gets a profile that tracks their purchase history, displays their owned pieces in a wardrobe grid, and assigns them a **Guild Rank** based on lifetime spend and piece count.

It's not just a loyalty program. It's a status system — your collection becomes your identity.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js (React) |
| Hosting | Vercel |
| Database | Supabase |
| Commerce | Shopify (Admin API + Storefront API) |
| Email | ConvertKit |
| Automation | n8n |

---

## Guild Rank System

Ranks are assigned automatically based on lifetime spend and piece count. They never go away once earned — but future tiers may require activity to maintain.

| Rank | Name | Kanji | Threshold |
|---|---|---|---|
| I | Recruit | 新兵 | First purchase |
| II | Ronin | 浪人 | 2+ pieces · $150+ |
| III | Kenshi | 剣士 | 5+ pieces · $400+ |
| IV | Guildmaster | ギルドマスター | 10+ pieces · $900+ |
| V | Grand Guildmaster | 大ギルドマスター | OG · Top 1% · Invited only |

Each rank unlocks a new tier of perks — early drop access, private Discord, limited run priority, physical membership cards, and co-creation rights at the top.

---

## How It Works

### 1. Purchase triggers profile creation
When a customer completes a Shopify order, a webhook fires to the backend. If no profile exists, one is created in Supabase using the customer's email as the identifier.

### 2. Order data populates the wardrobe
Each purchased product is written to the collector's wardrobe grid. Historical orders are backfilled via the Shopify Admin API on first login.

### 3. Rank is calculated automatically
On every order write, a server-side function recalculates the collector's total spend and piece count, then assigns the appropriate Guild Rank.

### 4. Profile is accessible via unique slug
Each collector gets a shareable profile URL:
```
rbg.com/collector/[username]
```

---

## Project Structure

```
/
├── app/
│   ├── collector/
│   │   └── [username]/
│   │       └── page.tsx          # Public collector profile page
│   └── api/
│       ├── shopify/
│       │   └── webhook/
│       │       └── route.ts      # Shopify order webhook handler
│       └── collector/
│           └── route.ts          # Collector data endpoints
├── components/
│   └── collector/
│       ├── ProfileHero.tsx       # Identity header, rank badge, XP bar
│       ├── WardrobeGrid.tsx      # Owned pieces grid
│       ├── RanksList.tsx         # Guild rank progression display
│       └── PerksList.tsx         # Active + locked perks
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── shopify.ts                # Shopify API client
│   └── ranks.ts                  # Rank calculation logic
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- A Shopify store with Admin API access
- Supabase project
- Vercel account (for deployment)

### 1. Clone and install
```bash
git clone https://github.com/rbg/collector-profile
cd collector-profile
npm install
```

### 2. Environment variables
Create a `.env.local` file in the root:
```env
# Shopify
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxxxxxxxxx
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Supabase Schema

### `collectors` table
```sql
id              uuid primary key
email           text unique not null
username        text unique
shopify_id      text unique
rank            int default 1        -- 1–5
total_spend     numeric default 0
piece_count     int default 0
created_at      timestamp default now()
```

### `wardrobe_items` table
```sql
id              uuid primary key
collector_id    uuid references collectors(id)
shopify_order_id  text
product_id      text
product_title   text
variant_title   text
drop_name       text
purchased_at    timestamp
```

---

## Shopify Webhook Setup

In your Shopify admin, register a webhook for:
- **Topic:** `orders/paid`
- **URL:** `https://your-domain.com/api/shopify/webhook`
- **Format:** JSON

The handler will:
1. Verify the HMAC signature
2. Upsert the collector record
3. Write wardrobe items
4. Recalculate and update rank

---

## Rank Calculation Logic

```ts
// lib/ranks.ts

export function calculateRank(pieceCount: number, totalSpend: number): number {
  if (totalSpend >= 900 && pieceCount >= 10) return 4; // Guildmaster
  if (totalSpend >= 400 && pieceCount >= 5)  return 3; // Kenshi
  if (totalSpend >= 150 && pieceCount >= 2)  return 2; // Ronin
  if (pieceCount >= 1)                        return 1; // Recruit
  return 0;
}

// Grand Guildmaster (Rank V) is assigned manually — invite only.
```

---

## Deployment

```bash
# Deploy to Vercel
vercel --prod
```

Make sure all environment variables are set in the Vercel project dashboard before deploying.

---

## Roadmap

- [x] Core collector profile UI
- [x] Guild rank system (5 tiers)
- [x] Wardrobe grid with locked/unlocked states
- [ ] Shopify webhook integration
- [ ] Historical order backfill on first login
- [ ] Shareable profile slugs
- [ ] Email automation on rank-up (ConvertKit + n8n)
- [ ] Rank-up animation / notification
- [ ] Badge system for seasonal achievements
- [ ] Physical card generation for Guildmaster+

---

## Notes

- Grand Guildmaster rank is **never assigned automatically**. It's reserved for OG members and must be set manually in Supabase or via an admin tool.
- Profile pages are public by default. A collector can share their link anywhere.
- The wardrobe grid shows locked pieces to create aspiration — collectors can see what they're working toward.

---

*RBG 2.0 — Red Bean Guild*

# Shopify Integration Setup — RBG Rev 2.2.1

## 1. Create an App in Shopify Dev Dashboard

> **Note:** As of Jan 2026, Shopify no longer provides static Admin API tokens.
> This project uses the **client credentials grant** (OAuth 2.0) to obtain
> short-lived access tokens automatically. No manual token copying required.

1. Go to [**Shopify Dev Dashboard**](https://partners.shopify.com) > **Apps** > **Create app**
2. Name it `RBG Collector Profile`
3. Under **Configuration** > **Admin API scopes**, select:
   - `read_orders`
   - `read_products`
   - `read_customers`
4. Click **Save**
5. Go to **Settings** (or **Client credentials**) and copy:
   - **Client ID** — a public identifier for the app
   - **Client Secret** — starts with `shpss_`
6. **Install the app** on your store (`fa80c3.myshopify.com` or your domain)

## 2. Register the Webhook

1. Go to **Shopify Admin** > **Settings** > **Notifications**
2. Scroll to the bottom → **Webhooks** section
3. Click **Create webhook**
   - **Event:** `Order payment`
   - **Format:** JSON
   - **URL:** `https://your-vercel-domain.com/api/shopify/webhook`
   - Replace `your-vercel-domain.com` with your actual Vercel deployment URL
4. Copy the **Webhook signing secret** shown at the top of the webhooks section

## 3. Set Environment Variables in Vercel

Go to **Vercel Dashboard** > your project > **Settings** > **Environment Variables**

Add these variables (all environments: Production, Preview, Development):

| Variable | Value | Example |
|----------|-------|---------|
| `SHOPIFY_STORE_DOMAIN` | Your `.myshopify.com` domain | `fa80c3.myshopify.com` |
| `SHOPIFY_CLIENT_ID` | App Client ID from Step 1 | `abcdef1234567890` |
| `SHOPIFY_CLIENT_SECRET` | App Client Secret from Step 1 | `shpss_xxxxxxxxxxxxxxxx` |
| `SHOPIFY_WEBHOOK_SECRET` | Webhook signing secret from Step 2 | `whsec_xxxxxxxxxxxxxxxx` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase dashboard | `eyJhbGciOi...` |

The Supabase service role key is found at:
**Supabase Dashboard** > **Settings** > **API** > **Service role key** (the `secret` one, not the `anon` one)

> **How tokens work:** The app exchanges `SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET`
> for a short-lived Admin API access token (24 h) via OAuth client credentials grant.
> This happens automatically — no manual token management needed.

## 4. Install Dependencies

```bash
npm install
```

This installs `@supabase/supabase-js` which the webhook and backfill serverless functions need. Vercel also runs this automatically on deploy, but run it locally to verify everything resolves.

## 5. Run the Database Migration

1. Go to **Supabase Dashboard** > **SQL Editor** > **New Query**
2. Paste the contents of `shopify-migration.sql`
3. Click **Run**
4. Verify: run `SELECT * FROM public.profiles LIMIT 1;` — you should see the new columns
5. Verify: run `SELECT * FROM public.wardrobe_items LIMIT 0;` — table should exist

## 6. Deploy to Vercel

```bash
vercel --prod
```

Or push to your connected Git branch — Vercel will auto-deploy.

## 7. Test the Webhook

1. In Shopify Admin > Settings > Notifications > Webhooks
2. Find your `Order payment` webhook
3. Click **Send test notification**
4. Check Vercel function logs for the response
5. If a matching profile exists, check Supabase `wardrobe_items` table for new entries

## 8. Configure Shopify MCP (for Claude dev sessions)

The `.mcp.json` file is already in the project root. To activate it:

1. Edit `.mcp.json` and replace:
   - `<your-shopify-access-token>` with your `shpss_` client secret
   - `<your-store>.myshopify.com` with your actual store domain
2. Restart your Claude Code session
3. The `shopify-dev` server (official Shopify) provides docs and API schema search
4. The `shopify-store` server provides direct access to your store data (products, orders, customers)

## Troubleshooting

- **Webhook returns 401**: Check that `SHOPIFY_WEBHOOK_SECRET` matches the signing secret in Shopify admin
- **No wardrobe items appearing**: Verify the customer's email in Shopify matches their RBG profile email
- **Shopify token exchange failed (401)**: Verify `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` are correct and the app is installed on the store
- **Backfill returns empty**: Check that the app has `read_orders` scope
- **Images not loading**: Verify the app has `read_products` scope
- **Magic links redirect to localhost**: In **Supabase Dashboard** > **Authentication** > **URL Configuration**, set **Site URL** to `https://redbeanguild.com` and add `https://redbeanguild.com/**` to the **Redirect URLs** allow-list

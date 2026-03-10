# Shopify Integration Setup — RBG Rev 2.2.1

## 1. Create a Custom App in Shopify

1. Go to **Shopify Admin** > **Settings** > **Apps and sales channels**
2. Click **Develop apps** (top right)
3. Click **Create an app** → name it `RBG Collector Profile`
4. Go to **Configuration** tab > **Admin API integration**
5. Select these scopes:
   - `read_orders`
   - `read_products`
   - `read_customers`
6. Click **Save**
7. Go to **API credentials** tab
8. Click **Install app** and confirm
9. Copy the **Admin API access token** (starts with `shpat_`) — you'll need this

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
| `SHOPIFY_STORE_DOMAIN` | Your `.myshopify.com` domain | `redbeanguild.myshopify.com` |
| `SHOPIFY_ADMIN_API_TOKEN` | Admin API access token from Step 1 | `shpat_xxxxxxxxxxxxxxxx` |
| `SHOPIFY_WEBHOOK_SECRET` | Webhook signing secret from Step 2 | `whsec_xxxxxxxxxxxxxxxx` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase dashboard | `eyJhbGciOi...` |

The Supabase service role key is found at:
**Supabase Dashboard** > **Settings** > **API** > **Service role key** (the `secret` one, not the `anon` one)

## 4. Run the Database Migration

1. Go to **Supabase Dashboard** > **SQL Editor** > **New Query**
2. Paste the contents of `shopify-migration.sql`
3. Click **Run**
4. Verify: run `SELECT * FROM public.profiles LIMIT 1;` — you should see the new columns
5. Verify: run `SELECT * FROM public.wardrobe_items LIMIT 0;` — table should exist

## 5. Deploy to Vercel

```bash
vercel --prod
```

Or push to your connected Git branch — Vercel will auto-deploy.

## 6. Test the Webhook

1. In Shopify Admin > Settings > Notifications > Webhooks
2. Find your `Order payment` webhook
3. Click **Send test notification**
4. Check Vercel function logs for the response
5. If a matching profile exists, check Supabase `wardrobe_items` table for new entries

## 7. Configure Shopify MCP (for Claude dev sessions)

The `.mcp.json` file is already in the project root. To activate it:

1. Edit `.mcp.json` and replace:
   - `<your-shopify-admin-api-token>` with your actual `shpat_` token
   - `<your-store>.myshopify.com` with your actual store domain
2. Restart your Claude Code session
3. The `shopify-dev` server (official Shopify) provides docs and API schema search
4. The `shopify-store` server provides direct access to your store data (products, orders, customers)

## Troubleshooting

- **Webhook returns 401**: Check that `SHOPIFY_WEBHOOK_SECRET` matches the signing secret in Shopify admin
- **No wardrobe items appearing**: Verify the customer's email in Shopify matches their RBG profile email
- **Backfill returns empty**: Check that `SHOPIFY_ADMIN_API_TOKEN` has `read_orders` scope
- **Images not loading**: Verify `SHOPIFY_ADMIN_API_TOKEN` has `read_products` scope

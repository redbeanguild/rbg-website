// api/shopify/webhook.js
// Vercel serverless function — handles Shopify orders/paid webhook.
//
// When a customer completes a purchase on Shopify, this endpoint:
//   1. Verifies the webhook signature (HMAC-SHA256)
//   2. Looks up the collector profile by customer email
//   3. Inserts wardrobe items for each purchased product
//   4. Fetches product images from Shopify Admin API
//   5. Recalculates the collector's guild rank
//
// Environment variables required (set in Vercel Dashboard):
//   SHOPIFY_WEBHOOK_SECRET   — webhook signing secret from Shopify
//   SHOPIFY_CLIENT_ID        — App Client ID (from Shopify Dev Dashboard)
//   SHOPIFY_CLIENT_SECRET    — App Client Secret (starts with shpss_)
//   SHOPIFY_STORE_DOMAIN     — e.g. your-store.myshopify.com
//   SUPABASE_URL             — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { getAdminToken } = require('./token');

// Disable Vercel's automatic body parsing so we can read the raw body
// for HMAC verification.
const config = {
  api: { bodyParser: false },
};
module.exports.config = config;

// Read the raw body from the request stream
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Verify Shopify HMAC signature
function verifyHmac(rawBody, hmacHeader, secret) {
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

// Fetch product image URL from Shopify Admin API
async function fetchProductImage(productId) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!domain || !productId) return null;

  try {
    const token = await getAdminToken();
    const res = await fetch(
      `https://${domain}/admin/api/2024-01/products/${productId}.json?fields=image`,
      {
        headers: { 'X-Shopify-Access-Token': token },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.product?.image?.src || null;
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- HMAC Verification ---
  const hmacHeader = req.headers['x-shopify-hmac-sha256'];
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!hmacHeader || !webhookSecret) {
    console.error('Missing HMAC header or webhook secret');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const rawBody = await getRawBody(req);

  if (!verifyHmac(rawBody, hmacHeader, webhookSecret)) {
    console.error('HMAC verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // --- Parse Order Data ---
  let order;
  try {
    order = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const customerEmail = order.customer?.email;
  const customerId = order.customer?.id;

  if (!customerEmail) {
    // No customer email — can't link to a profile. Return 200 so Shopify
    // doesn't keep retrying.
    console.warn('Webhook received order with no customer email:', order.id);
    return res.status(200).json({ status: 'skipped', reason: 'no customer email' });
  }

  // --- Supabase Service Role Client ---
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // --- Look Up Profile ---
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', customerEmail.toLowerCase())
    .single();

  if (profileError || !profile) {
    // Customer hasn't signed up for RBG yet. Return 200 so Shopify stops
    // retrying. The backfill endpoint will catch this when they register.
    console.warn('No RBG profile for:', customerEmail);
    return res.status(200).json({ status: 'skipped', reason: 'no profile found' });
  }

  // --- Process Line Items ---
  const lineItems = order.line_items || [];

  // Collect unique product IDs for image fetching
  const productIds = [...new Set(lineItems.map((item) => item.product_id).filter(Boolean))];

  // Fetch product images in parallel
  const imageMap = {};
  await Promise.all(
    productIds.map(async (pid) => {
      imageMap[pid] = await fetchProductImage(pid);
    })
  );

  // Upsert each line item into wardrobe_items
  for (const item of lineItems) {
    const { error: insertError } = await supabaseAdmin
      .from('wardrobe_items')
      .upsert(
        {
          collector_id: profile.id,
          shopify_order_id: String(order.id),
          shopify_product_id: String(item.product_id),
          product_title: item.title,
          variant_title: item.variant_title || null,
          product_image_url: imageMap[item.product_id] || null,
          price: parseFloat(item.price) || 0,
          purchased_at: order.created_at,
        },
        { onConflict: 'collector_id,shopify_order_id,shopify_product_id' }
      );

    if (insertError) {
      console.error('Failed to upsert wardrobe item:', insertError.message);
    }
  }

  // --- Update Shopify Customer ID ---
  if (customerId) {
    await supabaseAdmin
      .from('profiles')
      .update({ shopify_customer_id: String(customerId) })
      .eq('id', profile.id);
  }

  // --- Recalculate Rank ---
  const { data: newRank, error: rankError } = await supabaseAdmin.rpc(
    'recalculate_rank',
    { target_user_id: profile.id }
  );

  if (rankError) {
    console.error('Rank recalculation failed:', rankError.message);
  }

  return res.status(200).json({
    status: 'ok',
    collector: profile.id,
    items_processed: lineItems.length,
    new_rank: newRank,
  });
}

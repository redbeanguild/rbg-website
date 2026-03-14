// api/shopify/backfill.js
// Vercel serverless function — backfills historical Shopify orders for a collector.
//
// Triggered from:
//   - profile.html on first login (when piece_count is 0)
//   - admin.html "Sync" button for any member
//
// Authentication:
//   Requires a valid Supabase JWT in the Authorization header.
//   Admins can backfill any user via ?userId=xxx query param.
//
// Environment variables required (set in Vercel Dashboard):
//   SHOPIFY_CLIENT_ID        — App Client ID (from Shopify Dev Dashboard)
//   SHOPIFY_CLIENT_SECRET    — App Client Secret (starts with shpss_)
//   SHOPIFY_STORE_DOMAIN     — e.g. your-store.myshopify.com
//   SUPABASE_URL             — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS)

const { createClient } = require('@supabase/supabase-js');
const { getAdminToken } = require('./token');

// Fetch product image URL from Shopify Admin API
async function fetchProductImage(productId) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!domain || !productId) return null;

  try {
    const token = await getAdminToken();
    const res = await fetch(
      `https://${domain}/admin/api/2024-01/products/${productId}.json?fields=image`,
      { headers: { 'X-Shopify-Access-Token': token } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.product?.image?.src || null;
  } catch {
    return null;
  }
}

// Fetch all orders for an email from Shopify Admin API (handles pagination)
async function fetchAllOrders(email) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = await getAdminToken();
  const allOrders = [];
  let url = `https://${domain}/admin/api/2024-01/orders.json?email=${encodeURIComponent(email)}&status=any&limit=250`;

  while (url) {
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token },
    });

    if (!res.ok) {
      console.error('Shopify API error:', res.status, await res.text());
      break;
    }

    const data = await res.json();
    allOrders.push(...(data.orders || []));

    // Handle pagination via Link header
    const linkHeader = res.headers.get('link');
    url = null;
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (nextMatch) url = nextMatch[1];
    }
  }

  return allOrders;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- Check required env vars ---
  const missingVars = ['SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET', 'SHOPIFY_STORE_DOMAIN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    .filter((v) => !process.env[v]);
  if (missingVars.length) {
    console.error('Missing env vars:', missingVars);
    return res.status(500).json({ error: 'Server config error', detail: 'Missing env: ' + missingVars.join(', ') });
  }

  try {
    // --- Authenticate via Supabase JWT ---
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token' });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth failed:', authError?.message);
      return res.status(401).json({ error: 'Invalid token', detail: authError?.message });
    }

    // --- Determine Target User ---
    let targetUserId = user.id;
    const requestedUserId = req.query?.userId;

    if (requestedUserId && requestedUserId !== user.id) {
      // Verify caller is admin
      const { data: callerProfile } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!callerProfile?.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      targetUserId = requestedUserId;
    }

    // --- Get Target User's Email ---
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', targetUserId)
      .single();

    if (profileError || !targetProfile?.email) {
      console.error('Profile lookup failed:', profileError?.message, 'userId:', targetUserId);
      return res.status(404).json({ error: 'Profile not found', detail: profileError?.message });
    }

    console.log('Backfill started for:', targetProfile.email);

    // --- Fetch Orders from Shopify ---
    const orders = await fetchAllOrders(targetProfile.email);
    console.log('Orders fetched:', orders.length, 'for', targetProfile.email);

    if (!orders.length) {
      return res.status(200).json({ status: 'ok', items_processed: 0, message: 'No orders found for ' + targetProfile.email });
    }

    // --- Collect Unique Product IDs and Fetch Images ---
    const allProductIds = new Set();
    for (const order of orders) {
      for (const item of order.line_items || []) {
        if (item.product_id) allProductIds.add(item.product_id);
      }
    }

    const imageMap = {};
    // Batch image fetches with a small delay to respect rate limits
    for (const pid of allProductIds) {
      imageMap[pid] = await fetchProductImage(pid);
      // Small delay between API calls to respect Shopify rate limits
      await new Promise((r) => setTimeout(r, 250));
    }

    // --- Upsert Wardrobe Items ---
    let itemsProcessed = 0;
    const upsertErrors = [];

    for (const order of orders) {
      for (const item of order.line_items || []) {
        const { error: insertError } = await supabaseAdmin
          .from('wardrobe_items')
          .upsert(
            {
              collector_id: targetUserId,
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
          upsertErrors.push(insertError.message);
        } else {
          itemsProcessed++;
        }
      }
    }

    // --- Update Shopify Customer ID (from first order's customer) ---
    const firstCustomerId = orders[0]?.customer?.id;
    if (firstCustomerId) {
      await supabaseAdmin
        .from('profiles')
        .update({ shopify_customer_id: String(firstCustomerId) })
        .eq('id', targetUserId);
    }

    // --- Recalculate Rank ---
    const { data: newRank, error: rankError } = await supabaseAdmin.rpc(
      'recalculate_rank',
      { target_user_id: targetUserId }
    );

    if (rankError) {
      console.error('Rank recalculation failed:', rankError.message);
    }

    return res.status(200).json({
      status: 'ok',
      orders_found: orders.length,
      items_processed: itemsProcessed,
      new_rank: newRank,
      upsert_errors: upsertErrors.length ? upsertErrors : undefined,
      rank_error: rankError?.message || undefined,
    });
  } catch (err) {
    console.error('Backfill unhandled error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}

// api/shopify/token.js
// Shopify Admin API token helper — implements the client credentials grant flow.
//
// Since Jan 2026, Shopify no longer provides static Admin API tokens.
// This module exchanges SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET for a
// short-lived access token (24 h) via OAuth 2.0 client_credentials grant.
//
// Environment variables required:
//   SHOPIFY_CLIENT_ID      — App Client ID (from Shopify Dev Dashboard)
//   SHOPIFY_CLIENT_SECRET  — App Client Secret (starts with shpss_)
//   SHOPIFY_STORE_DOMAIN   — e.g. your-store.myshopify.com

// In-memory cache — survives within a single serverless instance lifetime.
let cachedToken = null;
let cachedTokenExpiry = 0;

/**
 * Returns a valid Shopify Admin API access token.
 * Caches the token and refreshes automatically when it expires.
 * Refreshes 5 minutes early to avoid edge-case expiry during a request.
 */
async function getAdminToken() {
  const now = Date.now();

  if (cachedToken && now < cachedTokenExpiry) {
    return cachedToken;
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      'Missing Shopify OAuth env vars: ' +
        ['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET']
          .filter((v) => !process.env[v])
          .join(', ')
    );
  }

  const tokenUrl = `https://${domain}/admin/oauth/access_token`;

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify token exchange failed (${res.status}): ${body}`);
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error('Shopify token response missing access_token');
  }

  cachedToken = data.access_token;
  // Refresh 5 minutes before actual expiry (expires_in is in seconds)
  const expiresInMs = ((data.expires_in || 86399) - 300) * 1000;
  cachedTokenExpiry = now + expiresInMs;

  console.log('Shopify Admin token acquired, expires in', data.expires_in, 's');
  return cachedToken;
}

module.exports = { getAdminToken };

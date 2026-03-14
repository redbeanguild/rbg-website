// api/subscribe.js
// Vercel serverless function — handles ConvertKit email subscriber creation.
//
// Why this file exists:
//   The ConvertKit API key must never appear in browser-side code (anyone can
//   view-source and steal it to spam your list). This function runs on Vercel's
//   servers, where it can safely read the key from an environment variable.
//
// Environment variable required:
//   CONVERTKIT_API_KEY — set this in Vercel Dashboard > Project > Settings > Environment Variables
//   Never put the real key in this file.

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validate that an email was provided
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Forward the subscribe request to ConvertKit, using the secret key from env
  const response = await fetch('https://api.kit.com/v4/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': process.env.CONVERTKIT_API_KEY,
    },
    body: JSON.stringify({ email_address: email }),
  });

  const data = await response.json();

  // Pass through the response status and body to the browser
  return res.status(response.ok ? 200 : response.status).json(data);
}

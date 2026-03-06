// screenshot.mjs — takes a full-page screenshot of a URL
// Usage: node screenshot.mjs <url> [label]
// Saves to: ./temporary screenshots/screenshot-N[-label].png

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read CLI args
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

// Ensure output directory exists
const outDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Find next auto-increment number
const existing = fs.readdirSync(outDir).filter(f => f.startsWith('screenshot-'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'));
const next = nums.length ? Math.max(...nums) + 1 : 1;

const filename = label
  ? `screenshot-${next}-${label}.png`
  : `screenshot-${next}.png`;
const outPath = path.join(outDir, filename);

// Launch headless browser and screenshot
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();

// Desktop viewport (1440px wide)
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

console.log(`Navigating to ${url}...`);
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Wait a moment for fonts and animations to settle
await new Promise(r => setTimeout(r, 1500));

// Full-page screenshot
await page.screenshot({ path: outPath, fullPage: true });

await browser.close();

console.log(`Screenshot saved: temporary screenshots/${filename}`);

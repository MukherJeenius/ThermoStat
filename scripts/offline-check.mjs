// Offline check (spec 15, 16): loads the production preview in the local Chrome, walks the main screens and the demo
// tour, and records every request. Fails if any request leaves 127.0.0.1. Writes test-results/offline-log.json.
// Also asserts the CSP is in dist/index.html and that dist/ and public/ never mention CLIMATIQ.
// Needs `npm run build && npm run preview`. Without Chrome: NOT VERIFIABLE HERE.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/';
if (!existsSync(CHROME)) {
  console.log(`offline-check: NOT VERIFIABLE HERE (no Chrome at ${CHROME})`);
  process.exit(0);
}
mkdirSync(join(root, 'test-results'), { recursive: true });
const meta = JSON.parse(readFileSync(join(root, 'public/data/meta.json'), 'utf8'));
const demo = encodeURIComponent(meta.demoRecipientId);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const expect = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures++;
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--use-angle=metal', '--enable-webgl'] });
const log = [];
const outside = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    const local = /^(data:|blob:|about:)/.test(url) || new URL(url).hostname === '127.0.0.1';
    log.push({ url: url.startsWith('data:') ? url.slice(0, 40) + '…' : url, local });
    if (!local) {
      outside.push(url);
      return req.abort(); // behave as if the network were off
    }
    req.continue();
  });
  const t0 = Date.now();
  for (const hash of ['', '#/explore', '#/explore/f/hce-recovery-plant', `#/explore/r/${demo}`, `#/place/r/${demo}`, `#/brief/${demo}`, '#/records', '#/method']) {
    await page.goto(BASE + hash, { waitUntil: 'networkidle0' });
    await sleep(600);
  }
  // the demo tour, at a quick pace: 7 steps
  await page.goto(BASE + '?demo=1#/explore', { waitUntil: 'networkidle0' });
  for (let i = 0; i < 7; i++) {
    await sleep(1200);
    await page.keyboard.press('ArrowRight');
  }
  const s = (Date.now() - t0) / 1000;
  expect(outside.length === 0, `no request outside 127.0.0.1 (${log.length} requests${outside.length ? `; outside: ${[...new Set(outside)].join(', ')}` : ''})`);
  expect(s < 90, `screens and the 7-step tour ran offline in ${s.toFixed(0)} s (< 90 s)`);
} finally {
  await browser.close();
}
writeFileSync(join(root, 'test-results', 'offline-log.json'), JSON.stringify({ outside, requests: log }, null, 1));

const html = readFileSync(join(root, 'dist', 'index.html'), 'utf8');
expect(/http-equiv="Content-Security-Policy"/i.test(html), 'CSP present in dist/index.html');
let climatiq = '';
try {
  climatiq = execSync('grep -rIl CLIMATIQ dist public', { cwd: root, encoding: 'utf8' }).trim();
} catch {
  climatiq = '';
}
expect(climatiq === '', `grep -r CLIMATIQ dist/ public/ is empty${climatiq ? ` (found: ${climatiq})` : ''}`);
console.log(`offline-check: ${failures ? `${failures} failure(s)` : 'all checks pass'} · test-results/offline-log.json`);
process.exit(failures ? 1 : 0);

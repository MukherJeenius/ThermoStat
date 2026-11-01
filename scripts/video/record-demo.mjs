// Records the ThermoStat feature demo with the local Chrome (puppeteer-core screencast), scene by scene, and writes
// test-results/video/raw.webm plus scenes.json (when each scene started). Needs the dev server (npm run dev).
//   node scripts/video/record-demo.mjs [baseUrl]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('../..', import.meta.url));
const out = join(root, 'test-results', 'video');
mkdirSync(out, { recursive: true });
const BASE = process.argv[2] || 'http://127.0.0.1:5173/';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1600;
const H = 900;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-first-run', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
await page.goto(BASE + '?video=1', { waitUntil: 'networkidle0' });
await page.waitForSelector('.ts-home-actions .ts-primary:not([disabled])');
await sleep(800);

const scenes = [];
let t0 = 0;
const mark = (name) => scenes.push({ name, t: (Date.now() - t0) / 1000 });
const recorder = await page.screencast({ path: join(out, 'raw.webm') });
t0 = Date.now();

// 1 · homepage
mark('home');
await sleep(2800);

// 2 · the map, with heat demand colours and the network
mark('map');
await page.click('.ts-home-actions .ts-primary');
await sleep(1400);
await page.evaluate(() => {
  const m = window.__thermostat?.map;
  m?.easeTo({ bearing: m.getBearing() - 22, zoom: m.getZoom() + 0.35, duration: 3200 });
});
await sleep(3300);

// 3 · a facility: the proposed recovery plant and its study connections
mark('facility');
await page.click('.ts-places button.ts-place');
await sleep(3000);

// 4 · its details: the promise in the study's own words
mark('promises');
await page.click('#ts-open-details');
await sleep(1500);
await page.evaluate(() => window.scrollTo({ top: 260, behavior: 'smooth' }));
await sleep(2200);

// 5 · who to connect: the top recipient on the map
mark('recipient');
const demoId = await page.evaluate(async () => (await (await fetch('data/meta.json')).json()).demoRecipientId);
await page.evaluate((id) => {
  window.location.hash = '#/explore/r/' + encodeURIComponent(id);
}, demoId);
await sleep(3200);

// 6 · the cost comparison, then a carbon price of $85/t
mark('cost');
await page.click('#ts-open-details');
await sleep(900);
await page.evaluate(() => {
  const h = [...document.querySelectorAll('.ts-doc-h2')].find((x) => x.textContent?.includes('Cost'));
  if (h) window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
});
await sleep(1600);
await page.evaluate(() => {
  const inputs = document.querySelectorAll('.ts-doc-carbon button');
  inputs[1]?.click();
});
await sleep(2400);

// 7 · the one-page brief
mark('brief');
await page.evaluate((id) => {
  window.location.hash = '#/brief/' + encodeURIComponent(id);
}, demoId);
await sleep(1200);
await page.evaluate(() => window.scrollTo({ top: 180, behavior: 'smooth' }));
await sleep(2300);
mark('end');

await recorder.stop();
await browser.close();
writeFileSync(join(out, 'scenes.json'), JSON.stringify(scenes, null, 1));
console.log(scenes.map((s) => `${s.name} ${s.t.toFixed(1)}s`).join(' · '));

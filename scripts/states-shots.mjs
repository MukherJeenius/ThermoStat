// Screenshots each state in spec 13 with the local Chrome, removing tiles, factors.json, prices.json, meta.json and WebGL
// in turn and returning 404 for a data file. Also captures public/fallback/map.png (the no-WebGL image) with --fallback.
// Needs `npm run preview` (or BASE_URL). Without Chrome: NOT VERIFIABLE HERE.
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const out = join(root, 'test-results', 'shots', 'states');
if (!existsSync(CHROME)) {
  console.log(`states-shots: NOT VERIFIABLE HERE (no Chrome at ${CHROME})`);
  process.exit(0);
}
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--use-angle=metal', '--enable-webgl'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const expect = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures++;
};

async function open(hash, { block = [], delay = null, noWebGL = false, size = [1440, 900] } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width: size[0], height: size[1], deviceScaleFactor: 1 });
  if (noWebGL) {
    await page.evaluateOnNewDocument(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        return /webgl/.test(type) ? null : orig.call(this, type, ...rest);
      };
    });
  }
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    if (block.some((b) => url.includes(b))) return req.respond({ status: 404, body: 'not found' });
    if (delay && url.includes('/data/')) await sleep(delay);
    req.continue().catch(() => {});
  });
  await page.goto(BASE + hash, { waitUntil: delay ? 'domcontentloaded' : 'networkidle0' });
  return page;
}
const has = (page, text) => page.evaluate((t) => document.body.innerText.includes(t), text);

try {
  if (process.argv.includes('--fallback')) {
    const page = await open('?testhooks#/explore/f/hce-downtown-plant');
    await page.waitForSelector('.ts-map.is-ready', { timeout: 20000 });
    await sleep(3000);
    await page.evaluate(() => window.__thermostat?.map.jumpTo({ center: [-79.865, 43.259], zoom: 14.2, pitch: 50, bearing: -17 }));
    await sleep(2500);
    await page.addStyleTag({ content: '.ts-controls,.ts-rail-slot,.ts-card-slot,.ts-map-controls,.ts-legend,.ts-places-btn,.maplibregl-control-container,.ts-intro,.ts-key-btn{display:none!important}' });
    await sleep(300);
    await page.screenshot({ path: join(root, 'public', 'fallback', 'map.png'), clip: { x: 0, y: 64, width: 1440, height: 790 } });
    console.log('wrote public/fallback/map.png');
    await page.close();
  }

  let page = await open('#/explore/f/hce-downtown-plant', { delay: 2500 });
  await sleep(400);
  await page.screenshot({ path: join(out, '01-loading.png') });
  expect(await page.evaluate(() => !!document.querySelector('[aria-busy="true"]')), 'loading: aria-busy with skeleton rows');
  expect(!(await has(page, 'NaN')), 'loading: no NaN on screen');
  await page.close();

  page = await open('#/explore/f/hce-downtown-plant', { block: ['/data/sources.json'] });
  await sleep(800);
  await page.screenshot({ path: join(out, '02-data-404.png') });
  expect(await has(page, 'Couldn’t load sources. The map still works.'), 'a data file 404s: the named message and Retry');
  await page.close();

  page = await open('#/explore/f/hce-downtown-plant', { block: ['/tiles/'] });
  await sleep(2500);
  await page.screenshot({ path: join(out, '03-basemap-fails.png') });
  await page.evaluate(() => document.querySelector('.ts-key-btn, [aria-controls="ts-map-key"]')?.click());
  await sleep(300);
  expect(await has(page, 'Basemap unavailable'), 'basemap fails: the key says "Basemap unavailable"');
  await page.close();

  page = await open('#/brief/' + encodeURIComponent('osm:way/43939696'), { block: ['/data/factors.json', '/data/prices.json'] });
  await sleep(800);
  await page.screenshot({ path: join(out, '04-fallback-factors-prices.png') });
  expect(await has(page, 'Fallback emission factors'), 'factors.json fails: "Fallback emission factors"');
  expect(await has(page, 'Fallback prices (plan defaults)'), 'prices.json fails: "Fallback prices (plan defaults)"');
  await page.close();

  page = await open('#/explore/f/hce-downtown-plant', { block: ['/data/meta.json'] });
  await sleep(1500);
  await page.screenshot({ path: join(out, '05-meta-fails.png') });
  expect(await has(page, 'Couldn’t load the record dates'), 'meta.json fails: named, the map still works');
  await page.close();

  page = await open('#/explore/f/hce-downtown-plant', { noWebGL: true });
  await sleep(800);
  await page.screenshot({ path: join(out, '06-no-webgl.png') });
  expect(await has(page, 'This device can’t draw the 3D map') || (await has(page, "This device can't draw the 3D map")), 'no WebGL: fallback image and the Records line');
  await page.close();

  page = await open('#/explore/r/osm:way/0');
  await sleep(1200);
  await page.screenshot({ path: join(out, '07-unknown-link.png') });
  expect(await page.evaluate(() => !!document.querySelector('.ts-stage-notice')), 'unknown deep link: Explore with a one-line notice');
  await page.close();
} finally {
  await browser.close();
}
console.log(`states-shots: ${failures ? `${failures} failure(s)` : 'all checks pass'} · ${out}`);
process.exit(failures ? 1 : 0);

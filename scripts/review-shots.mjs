// Design-review screenshots: every screen at the review sizes. node scripts/review-shots.mjs OUT [WxH,...] [screen,...]
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const sizes = (process.argv[3] || '1440x900,1280x720,1024x768,768x1024,375x812').split(',').map((s) => s.split('x').map(Number));
const only = process.argv[4] ? process.argv[4].split(',') : null;
const B = 'http://127.0.0.1:4173/';
const R = encodeURIComponent('osm:way/43939696');
const screens = [
  ['home', '', 0], ['home-scrolled', '', 900], ['explore', '#/explore/f/hce-recovery-plant', 0], ['explore-none', '?testhooks#/explore', 0],
  ['facility', '#/explore/f/hce-downtown-plant', 0], ['evidence', '#/place/f/hce-recovery-plant', 0], ['recipient', `#/explore/r/${R}`, 0],
  ['recipient-details', `#/place/r/${R}`, 0], ['recipient-details-cost', `#/place/r/${R}`, 1400], ['brief', `#/brief/${R}`, 0],
  ['records', '#/records', 0], ['method', '#/method', 0],
];
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-webgl'] });
for (const [w, h] of sizes) for (const [name, hash, scroll] of screens) {
  if (only && !only.includes(name)) continue;
  const p = await browser.newPage(); await p.setViewport({ width: w, height: h });
  await p.goto(B + hash, { waitUntil: 'networkidle0' });
  if (name === 'explore-none') await p.evaluate(() => document.querySelector('.ts-home-actions .ts-primary')?.click());
  await new Promise((r) => setTimeout(r, 2200));
  if (scroll) { await p.evaluate((y) => { const el = document.querySelector('.ts-home') || document.scrollingElement; el.scrollTo(0, y); }, scroll); await new Promise((r) => setTimeout(r, 900)); }
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  await p.screenshot({ path: `${out}/${w}-${name}.png` });
  if (sw > w) console.log(`OVERFLOW ${w} ${name} ${sw}`);
  await p.close();
}
await browser.close(); console.log('review done', out);

// Screenshots with the local Chrome (spec 3.4), demo build: the default view, the evidence record, a recipient card
// with its cost row, the brief, and the phone sheet, at the sizes below. Asserts no horizontal page scroll.
// Needs `npm run preview` (or BASE_URL). Without Chrome: NOT VERIFIABLE HERE.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const out = join(root, 'test-results', 'shots');
if (!existsSync(CHROME)) {
  console.log(`shots: NOT VERIFIABLE HERE (no Chrome at ${CHROME})`);
  process.exit(0);
}
mkdirSync(out, { recursive: true });
const meta = JSON.parse(readFileSync(join(root, 'public/data/meta.json'), 'utf8'));
const demo = encodeURIComponent(meta.demoRecipientId);
const SIZES = [
  [1440, 900], [1536, 864], [1280, 720], [1024, 768], [768, 1024], [700, 900], [640, 360], [844, 390], [375, 812], [320, 640],
];
const STATES = [
  { name: 'default', hash: '#/explore' },
  { name: 'evidence', hash: '#/explore/f/hce-recovery-plant/evidence' },
  { name: 'downtown', hash: '#/explore/f/hce-downtown-plant' },
  { name: 'recipient', hash: `#/explore/r/${demo}`, openCost: true },
  { name: 'brief', hash: `#/brief/${demo}` },
];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--use-angle=metal', '--enable-webgl'] });
let failures = 0;
const only = process.argv[2];
try {
  for (const [w, h] of SIZES) {
    if (only && !only.split(',').includes(String(w))) continue;
    for (const s of STATES) {
      if (w < 1024 && !['default', 'recipient', 'brief'].includes(s.name)) continue;
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      await page.goto(BASE + s.hash, { waitUntil: 'networkidle0' });
      await new Promise((r) => setTimeout(r, s.name === 'brief' ? 800 : 3500));
      if (s.openCost) {
        await page.evaluate(() => {
          const rows = document.querySelectorAll('.ts-panel--card details.ts-row');
          if (rows[1]) rows[1].open = true;
        });
        await new Promise((r) => setTimeout(r, 300));
      }
      const sw = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      const ok = sw[0] <= sw[1];
      if (!ok) failures++;
      const file = join(out, `${w}-${s.name}.png`);
      await page.screenshot({ path: file });
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${w}x${h} ${s.name}: scrollWidth ${sw[0]} / ${sw[1]} → ${file.replace(root, '')}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
if (failures) {
  console.log(`shots: ${failures} horizontal-scroll failure(s)`);
  process.exit(1);
}
console.log('shots: done');

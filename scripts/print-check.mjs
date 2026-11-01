// Prints Recipient briefs with the local Chrome and asserts exactly 1 US Letter page each (spec 11.4).
// Needs `npm run preview` (or BASE_URL pointing at a running server). Without Chrome: NOT VERIFIABLE HERE.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const outDir = join(root, 'test-results', 'print');

if (!existsSync(CHROME)) {
  console.log(`check:print: NOT VERIFIABLE HERE (no Chrome at ${CHROME})`);
  process.exit(0);
}
const meta = JSON.parse(readFileSync(join(root, 'public/data/meta.json'), 'utf8'));
const recips = JSON.parse(readFileSync(join(root, 'public/data/recipients.geojson'), 'utf8')).features.map((f) => f.properties);
const longest = [...recips].sort((a, b) => (b.name ?? '').length - (a.name ?? '').length)[0];
const mostMissing = [...recips].sort((a, b) => b.fit.missing.length - a.fit.missing.length)[0];
const synthetic = recips.find((r) => r.synthetic);
const cases = [
  { label: 'demo recipient', id: meta.demoRecipientId },
  { label: 'longest name', id: longest?.id },
  { label: 'most missing fields', id: mostMissing?.id },
  { label: 'demo recipient, carbon $85/t (edited)', id: meta.demoRecipientId, carbon: 85, expect: ['Uses edited assumptions, not the sourced defaults.', 'Carbon price: $85 per tonne (scenario)'] },
  ...(synthetic ? [{ label: 'illustrative recipient', id: synthetic.id, expect: ['Illustrative building: generated data, not a real site.'] }] : []),
].filter((c) => c.id);

const ALWAYS = ['HCE logo', 'Prepared for Hamilton Community Enterprises (HCE). An independent student project, not produced or endorsed by HCE.',
  'For an exact version, the building owner would share 12 months of gas bills directly with HCE', 'Reviewed by'];

mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run'] });
let failures = 0;
try {
  for (const c of cases) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 1400 });
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate((carbon) => {
      try {
        if (carbon) localStorage.setItem('thermostat:v1:carbon', String(carbon));
        else localStorage.removeItem('thermostat:v1:carbon');
      } catch {
        /* ignore */
      }
    }, c.carbon ?? 0);
    await page.goto(`${BASE}#/brief/${encodeURIComponent(c.id)}`, { waitUntil: 'networkidle0' });
    await page.reload({ waitUntil: 'networkidle0' });   // the carbon setting is read at start-up
    await page.waitForSelector('.ts-brief', { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    const text = await page.$eval('.ts-brief', (el) => el.innerText);
    const pdf = await page.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true });
    const pages = (Buffer.from(pdf).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    const file = join(outDir, `${c.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`);
    writeFileSync(file, pdf);
    const missing = [...ALWAYS, ...(c.expect ?? [])].filter((s) => !text.includes(s));
    const carbonLine = text.includes('Carbon price:');
    const ok = pages === 1 && missing.length === 0 && carbonLine;
    if (!ok) failures++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.label} (${c.id}): ${pages} page(s)${missing.length ? `; missing: ${missing.join(' | ')}` : ''}${carbonLine ? '' : '; no carbon-price line'} → ${file.replace(root, '')}`);
    await page.close();
  }
} finally {
  await browser.close();
}
if (failures) {
  console.log(`check:print: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`check:print: ${cases.length} briefs, each exactly 1 page (Chrome; Safari NOT VERIFIABLE HERE)`);

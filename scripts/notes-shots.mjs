// Screenshots every field-notes save state (spec 10, 16 "Notes") with the local Chrome: empty, unsaved, saving, saved,
// failed (storage blocked, then quota), the shortlist on Records, and its empty state. Uses fictional note text only.
// Needs `npm run preview` (or BASE_URL). Without Chrome: NOT VERIFIABLE HERE.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/';
const out = join(root, 'test-results', 'shots', 'notes');
if (!existsSync(CHROME)) {
  console.log(`notes-shots: NOT VERIFIABLE HERE (no Chrome at ${CHROME})`);
  process.exit(0);
}
mkdirSync(out, { recursive: true });
const meta = JSON.parse(readFileSync(join(root, 'public/data/meta.json'), 'utf8'));
const place = `#/place/r/${encodeURIComponent(meta.demoRecipientId)}`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run'] });
let failures = 0;
const expect = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures++;
};
// clear ThermoStat's storage on the first load of a page only, so a reload keeps what was saved
const clearOnce = () => {
  if (!sessionStorage.getItem('seeded')) {
    localStorage.clear();
    sessionStorage.setItem('seeded', '1');
  }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(hash, before) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  if (before) await page.evaluateOnNewDocument(before);
  await page.goto(BASE + hash, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.ts-notes-block textarea', { timeout: 15000 }).catch(() => {});
  return page;
}
async function shot(page, name) {
  const el = await page.$('.ts-notes-block');
  if (el) await el.scrollIntoView();
  await sleep(150);
  await page.screenshot({ path: join(out, `${name}.png`) });
}
const status = (page) => page.$eval('.ts-note-status', (e) => e.textContent?.trim() ?? '');
const text = (page) => page.$eval('.ts-notes-block textarea', (e) => e.value);

try {
  // empty → unsaved → saving → saved
  let page = await open(place, clearOnce);
  await shot(page, '1-empty');
  expect((await status(page)) === '', 'empty: no status');
  await page.type('.ts-notes-block textarea', 'Ask facilities about the boiler age.');
  await shot(page, '2-unsaved');
  expect((await status(page)) === 'Unsaved changes', 'unsaved: "Unsaved changes"');
  await page.waitForFunction(() => document.querySelector('.ts-note-status')?.textContent?.startsWith('Saved on this device'), { timeout: 5000 });
  await shot(page, '4-saved');
  expect(/^Saved on this device · \d\d:\d\d$/.test(await status(page)), 'saved: "Saved on this device · hh:mm"');
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.querySelector('.ts-notes-block textarea')?.value.length > 0, { timeout: 5000 });
  expect((await text(page)) === 'Ask facilities about the boiler age.', 'round trip after reload');
  await page.click('.ts-notes-row .ts-btn-outline');
  await sleep(200);
  await page.close();

  // saving: a slowed write (?testhooks&notesdelay) shows "Saving…" until the Promise resolves, then "Saved"
  page = await open(place.replace('#', '?testhooks&notesdelay=2500#'), clearOnce);
  await page.type('.ts-notes-block textarea', 'Second visit: owner open to a call.');
  await page.waitForFunction(() => document.querySelector('.ts-note-status')?.textContent === 'Saving…', { timeout: 3000 }).catch(() => {});
  await shot(page, '3-saving');
  expect((await status(page)) === 'Saving…', 'saving: "Saving…" while the write is pending');
  await sleep(1000);
  expect((await status(page)) === 'Saving…', 'saving: still not "Saved" before the write resolves');
  await page.waitForFunction(() => document.querySelector('.ts-note-status')?.textContent?.startsWith('Saved on'), { timeout: 5000 }).catch(() => {});
  expect((await status(page)).startsWith('Saved on'), 'saving → saved once it resolves');
  await page.close();

  // failed: storage blocked (private mode)
  page = await open(place, () => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw Object.assign(new Error('blocked'), { name: 'SecurityError' });
      },
    });
  });
  await page.type('.ts-notes-block textarea', 'Typed with storage blocked.');
  await sleep(1300);
  await shot(page, '5-failed-unavailable');
  expect((await status(page)).startsWith("Notes can't be saved in this browser"), 'failed (unavailable): the browser message');
  expect((await text(page)) === 'Typed with storage blocked.', 'failed (unavailable): text kept');
  await page.close();

  // failed: quota, with Retry
  page = await open(place, () => {
    localStorage.clear();
    Storage.prototype.setItem = function () {
      throw Object.assign(new Error('full'), { name: 'QuotaExceededError' });
    };
  });
  await page.type('.ts-notes-block textarea', 'Typed with storage full.');
  await sleep(1300);
  await shot(page, '6-failed-quota');
  expect((await status(page)).startsWith("Couldn't save. Your text is still here."), 'failed (quota): message and Retry');
  expect((await text(page)) === 'Typed with storage full.', 'failed (quota): text kept');
  const guarded = await page.evaluate(() => {
    const e = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(e);
    return e.defaultPrevented;
  });
  expect(guarded, 'leaving with failed text is guarded (beforeunload)');
  await page.close();

  // the shortlist on Records, filled and empty
  page = await open(place, clearOnce);
  await page.click('.ts-notes-row .ts-btn-outline');
  await sleep(200);
  await page.goto(BASE + '#/records#shortlist', { waitUntil: 'networkidle0' });
  await page.waitForSelector('#shortlist .ts-shortlist li', { timeout: 5000 }).catch(() => {});
  await sleep(300);
  await page.screenshot({ path: join(out, '7-shortlist.png') });
  expect((await page.$$('#shortlist .ts-shortlist li')).length === 1, 'shortlist: 1 saved place with Together totals');
  await page.click('#shortlist .ts-shortlist li button');
  await sleep(300);
  await page.screenshot({ path: join(out, '8-shortlist-empty.png') });
  expect(!!(await page.$('#shortlist .ts-shortlist-empty')), 'shortlist: empty state');
  await page.close();
} finally {
  await browser.close();
}
console.log(`notes-shots: ${failures ? `${failures} failure(s)` : 'all checks pass'} · ${out}`);
process.exit(failures ? 1 : 0);

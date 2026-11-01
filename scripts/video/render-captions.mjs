// Renders each caption as a transparent 1920x1080 PNG (Inter, ink on a paper chip) for the video overlay.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
const root = fileURLToPath(new URL('../..', import.meta.url));
const out = join(root, 'test-results', 'video');
mkdirSync(out, { recursive: true });
const CAPS = ['A map of Hamilton’s waste-heat network', 'Every promise, quoted from the source', 'Which buildings to connect first',
  'Gas, heat pump or district heat over 20 years', 'A one-page brief for every building'];
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1920, height: 1080 });
for (const [i, t] of CAPS.entries()) {
  await p.setContent(`<html><body style="margin:0;background:transparent;font-family:'Helvetica Neue',Arial,sans-serif">
    <div style="position:absolute;left:50%;bottom:72px;transform:translateX(-50%);padding:16px 30px;background:#f1efe8;color:#1f1e1b;
    border-radius:10px;font-size:34px;font-weight:500;letter-spacing:-.01em;white-space:nowrap;box-shadow:0 2px 0 rgba(0,0,0,.08)">${t}</div></body></html>`);
  await p.screenshot({ path: join(out, `cap${i}.png`), omitBackground: true });
}
await b.close();
console.log('captions', CAPS.length);

// Renders each caption as a transparent 1920x1080 PNG (Literata italic on a solid paper card, ink rule) for the video overlay.
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
  await p.setContent(`<html><body style="margin:0;background:transparent">
    <div style="position:absolute;left:50%;bottom:72px;transform:translateX(-50%);padding:18px 34px 20px;background:#fbf8f2;color:#1f1d1a;
    border:1px solid #1f1d1a;border-radius:2px;white-space:nowrap;text-align:center">
    <div style="font:600 13px/1 'Helvetica Neue',Arial,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#9a3714;margin-bottom:10px">ThermoStat · ${String(i + 1).padStart(2, '0')}</div>
    <div style="font:italic 400 36px/1.15 'Literata','Iowan Old Style',Georgia,serif">${t}</div></div></body></html>`);
  await p.screenshot({ path: join(out, `cap${i}.png`), omitBackground: true });
}
await b.close();
console.log('captions', CAPS.length);

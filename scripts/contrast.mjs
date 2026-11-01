// Measured contrast and ramp checks (spec 9.16). Prints every ratio and exits 1 on any failure.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrast, CVD, deltaE, luminance, readTokens } from './lib/color.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const tokens = readTokens(join(root, 'src/ui/tokens.css'));
const { pairs, info = [] } = JSON.parse(readFileSync(join(root, 'scripts/contrast-pairs.json'), 'utf8'));
const MIN = { text: 4.5, 'large-text': 3, 'non-text': 3 };
const failures = [];
const resolve = (v) => {
  if (v.startsWith('#')) return v.toLowerCase();
  if (!tokens[v]) throw new Error(`unknown token ${v} in contrast-pairs.json`);
  return tokens[v];
};
const row = (label, ratio, min) => {
  const ok = ratio >= min;
  if (!ok) failures.push(`${label}: ${ratio.toFixed(2)} < ${min}`);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`);
};

console.log('Declared pairs (scripts/contrast-pairs.json)');
for (const p of pairs) {
  row(`${p.fg} on ${p.bg} [${p.kind}] ${p.where ?? ''}`, contrast(resolve(p.fg), resolve(p.bg)), MIN[p.kind]);
}

console.log('\nMap arcs and endpoints (3:1 against ground, roof, water and the surface casing)');
for (const fg of ['--ts-map-attention', '--ts-map-secondary']) {
  for (const bg of ['--ts-map-ground', '--ts-map-roof', '--ts-map-water', '--ts-surface']) {
    row(`${fg} on ${bg}`, contrast(tokens[fg], tokens[bg]), 3);
  }
}

console.log('\nHeat ramp (--ts-heat-1..5)');
const ramp = [1, 2, 3, 4, 5].map((i) => tokens[`--ts-heat-${i}`]);
const lums = ramp.map((c) => luminance(c));
const mono = lums.every((l, i) => i === 0 || l < lums[i - 1]);
console.log(`${mono ? 'PASS' : 'FAIL'}  luminance ${lums.map((l) => l.toFixed(2)).join(' → ')} (must fall monotonically)`);
if (!mono) failures.push('heat ramp luminance is not monotonic');
for (const vision of Object.keys(CVD)) {
  const steps = ramp.slice(1).map((c, i) => deltaE(ramp[i], c, vision));
  const minStep = Math.min(...steps);
  const okStep = minStep >= 8;
  const roof = deltaE(ramp[0], tokens['--ts-map-roof'], vision);
  const okRoof = roof >= 5;
  console.log(
    `${okStep ? 'PASS' : 'FAIL'}  ${vision.padEnd(12)} adjacent ΔE2000 ${steps.map((d) => d.toFixed(1)).join(', ')} (min ${minStep.toFixed(1)} ≥ 8)`,
  );
  console.log(`${okRoof ? 'PASS' : 'FAIL'}  ${vision.padEnd(12)} heat-1 vs roof ΔE2000 ${roof.toFixed(1)} (≥ 5)`);
  if (!okStep) failures.push(`heat ramp adjacent ΔE ${minStep.toFixed(1)} < 8 under ${vision}`);
  if (!okRoof) failures.push(`heat-1 vs roof ΔE ${roof.toFixed(1)} < 5 under ${vision}`);
}

console.log('\nAmber text rule (no CSS colour may use var(--ts-accent); amber text uses --ts-accent-text)');
const offenders = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(css|tsx?)$/.test(name)) {
      const text = readFileSync(p, 'utf8');
      const re = /(?<![-\w])color\s*:\s*['"]?var\(--ts-accent\)/g;
      let m;
      while ((m = re.exec(text))) {
        const line = text.slice(0, m.index).split('\n').length;
        offenders.push(`${p.replace(root, '')}:${line}`);
      }
    }
  }
};
walk(join(root, 'src'));
if (offenders.length) {
  failures.push(`var(--ts-accent) used as a text colour: ${offenders.join(', ')}`);
  console.log(`FAIL  ${offenders.join(', ')}`);
} else console.log('PASS  none found in src/');

if (info.length) {
  console.log('\nInformation only (handoff tokens kept for reference, not drawn on the map)');
  for (const p of info) console.log(`info  ${contrast(resolve(p.fg), resolve(p.bg)).toFixed(2).padStart(5)}:1  ${p.fg} on ${p.bg}`);
}

if (failures.length) {
  console.log(`\ncontrast: ${failures.length} failure(s)`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log('\ncontrast: all checks pass');

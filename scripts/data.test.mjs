// @vitest-environment node
// public/data validates against the generated schema (ajv draft-07), and every exported recipient's fit scores the
// same in TypeScript as in the pipeline (spec 7.4, 8.5 "Fit parity").
import Ajv from 'ajv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { fitAssessment } from '../src/engine/fit.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const FILES = ['facilities.json', 'connections.json', 'sources.json', 'recipients.geojson', 'context-buildings.geojson',
  'network.geojson', 'places.json', 'prices.json', 'factors.json', 'meta.json'];

describe('public/data', () => {
  it.each(FILES)('%s validates against pipeline/schema', (file) => {
    const schema = read(`pipeline/schema/${file.replace(/\.(json|geojson)$/, '')}.schema.json`);
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);
    const ok = validate(read(`public/data/${file}`));
    expect(ok, JSON.stringify(validate.errors?.slice(0, 3))).toBe(true);
  });

  it('every recipient scores the same in TypeScript as the exported fit', () => {
    const recips = read('public/data/recipients.geojson').features.map((f) => f.properties);
    expect(recips.length).toBeGreaterThan(0);
    for (const r of recips) {
      const got = fitAssessment({
        annualHeatMwh: r.estimate.annualHeatMwh,
        minM: r.distances.minM,
        distanceQuality: r.distances.quality,
        heatingSystem: r.heatingSystem,
        type: r.type,
        ownerType: r.ownerType,
        yearBuilt: r.yearBuilt,
        boilerYearsLeft: r.boilerYearsLeft,
        quality: r.estimate.quality,
        activePermit: r.activePermit,
        typeAssumed: r.fit.missing.includes('building type'),
      });
      expect(got.score, r.id).toBe(r.fit.score);
      expect(got.band, r.id).toBe(r.fit.band);
      expect(got.reasons, r.id).toEqual(r.fit.reasons);
    }
  });

  it('honesty rules hold in the data', () => {
    const facilities = read('public/data/facilities.json');
    for (const f of facilities) {
      expect(f.mapLabel.length, f.id).toBeLessThanOrEqual(24);
      for (const c of f.commitments) {
        if (c.source === null) expect(c.status, `${f.id}/${c.id}`).toBe('unknown');
        else expect(c.source.url.startsWith('https://'), c.id).toBe(true);
      }
    }
    const sources = new Set(read('public/data/sources.json').map((s) => s.id));
    for (const c of read('public/data/connections.json')) {
      if (c.kind !== 'scenario' && !c.synthetic) {
        expect(c.evidenceIds.length, c.id).toBeGreaterThan(0);
        for (const id of c.evidenceIds) expect(sources.has(id), `${c.id} → ${id}`).toBe(true);
      }
    }
    for (const r of read('public/data/recipients.geojson').features) expect(r.properties.sourceIds.length).toBeGreaterThan(0);
    const all = FILES.map((f) => readFileSync(join(root, 'public/data', f), 'utf8')).join('');
    expect(all.includes('CLIMATIQ')).toBe(false);
    expect(all.includes('Authorization')).toBe(false);
  });
});

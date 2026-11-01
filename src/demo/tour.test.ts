import { describe, expect, it } from 'vitest';
import type { Recipient } from '../contract/data-contract';
import { DEFAULT_FACTORS, DEFAULT_PRICE_VALUES } from '../engine/defaults';
import { DEMO_STEPS, step, type DemoContext } from './tour';

const empty: DemoContext = { facilities: [], connections: [], recipients: [], meta: null, prices: DEFAULT_PRICE_VALUES, factor: DEFAULT_FACTORS.sets.eccc };

const recipient = {
  id: 'osm:way/1', name: null, address: null, type: 'office', position: [-79.87, 43.256], floorAreaM2: 10000, floorAreaMethod: 'levels',
  heightM: null, yearBuilt: null, ownerType: null, heatingSystem: null, boilerYearsLeft: null, activePermit: null,
  estimate: { annualHeatMwh: 3900, peakHeatKw: 1950, networkKw: 1083, quality: 'checked', method: 'archetype_calibrated', intensityKwhM2: 190, ageFactor: 1, calibration: null, actual: null, sourceIds: ['osm'] },
  distances: { existingM: null, plannedM: null, plannedQuality: null, minM: null, quality: 'known_customer' },
  fit: { band: 'possible', score: 50, reasons: [], missing: [], points: { size: 0, distance: 0, heating: 0, anchor: 0, timing: 0, data: 0 } },
  rank: 1, sourceIds: ['osm'], lastVerified: null, synthetic: false,
} as unknown as Recipient;

const bad = /\{|undefined|NaN|null/;

describe('demo tour', () => {
  it.each([1, 2, 3, 4, 5, 6, 7])('step %i renders with every input missing', (n) => {
    const s = step(n, empty);
    expect(s.caption).not.toMatch(bad);
    expect(s.caption.length).toBeGreaterThan(10);
  });
  it.each([1, 2, 3, 4, 5, 6, 7])('step %i renders with a recipient whose fields are null', (n) => {
    const s = step(n, { ...empty, recipients: [recipient] });
    expect(s.caption).not.toMatch(bad);
  });
  it('step 4 is the verdict and step 5 sets the carbon price', () => {
    const ctx = { ...empty, recipients: [recipient] };
    expect(step(4, ctx).caption.startsWith('About the same cost as gas')).toBe(true);
    expect(step(5, ctx).carbonPriceT).toBe(85);
    expect(step(5, ctx).caption).toContain('$85/t');
    expect(step(5, ctx).caption).not.toMatch(/because of the carbon price/i);
  });
  it('steps are clamped and pure', () => {
    expect(step(0, empty).n).toBe(1);
    expect(step(99, empty).n).toBe(DEMO_STEPS);
    expect(step(3, empty)).toEqual(step(3, empty));
  });
});

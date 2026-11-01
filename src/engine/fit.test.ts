import { describe, expect, it } from 'vitest';
import fitCases from '../../fixtures/fit-cases.json';
import { bandOf, fitAssessment, fitPoints, scoreOf, type FitInput } from './fit';

const base: FitInput = {
  annualHeatMwh: 1000,
  minM: 300,
  distanceQuality: 'approx_route',
  heatingSystem: null,
  type: 'office',
  ownerType: null,
  yearBuilt: null,
  boilerYearsLeft: null,
  quality: 'estimate',
  activePermit: null,
};

describe('8.5 fit', () => {
  it('distance points', () => {
    expect(fitPoints({ ...base, minM: 100 }).distance).toBe(25);
    expect(fitPoints({ ...base, minM: 350 }).distance).toBe(12.5);
    expect(fitPoints({ ...base, minM: 600 }).distance).toBe(0);
    expect(fitPoints({ ...base, minM: null }).distance).toBe(0);
  });
  it('size points', () => {
    expect(fitPoints({ ...base, annualHeatMwh: 300 }).size).toBe(0);
    expect(fitPoints({ ...base, annualHeatMwh: 1650 }).size).toBe(15);
    expect(fitPoints({ ...base, annualHeatMwh: 3000 }).size).toBe(30);
  });
  it('sums ending in .5 round half up', () => {
    expect(scoreOf({ size: 30, distance: 12.5, heating: 15, anchor: 15, timing: 6, data: 5 })).toBe(84);
    expect(scoreOf({ size: 30, distance: 22.5, heating: 3, anchor: 8, timing: 6, data: 3 })).toBe(73);
  });
  it('bands', () => {
    expect(bandOf(70)).toBe('strong');
    expect(bandOf(69)).toBe('possible');
    expect(bandOf(45)).toBe('possible');
    expect(bandOf(44)).toBe('weak');
  });
  it('fit parity: every case in fixtures/fit-cases.json', () => {
    let halves = 0;
    for (const c of fitCases) {
      const got = fitAssessment(c.input as FitInput);
      expect(got.score, c.name).toBe(c.expected.score);
      expect(got.band, c.name).toBe(c.expected.band);
      for (const [k, v] of Object.entries(c.expected.points)) {
        expect(got.points[k as keyof typeof got.points], `${c.name} ${k}`).toBeCloseTo(v, 9);
      }
      const sum = Object.values(c.expected.points).reduce((a, b) => a + b, 0);
      if (Math.abs((sum % 1) - 0.5) < 1e-9) halves++;
    }
    expect(halves).toBeGreaterThanOrEqual(2);
  });
  it('reasons are sentences from the data; unknowns go to missing', () => {
    const f = fitAssessment({ ...base, annualHeatMwh: 3900, minM: 140, quality: 'checked', type: 'hospital' });
    expect(f.reasons[0]).toBe('Large heat user: about 3,900 MWh a year (Checked estimate).');
    expect(f.reasons).toContain('About 140 m from the planned route (approximate).');
    expect(f.reasons).toContain('A public anchor building: a hospital.');
    expect(f.missing).toEqual(['heating system', 'year built']);
  });
});

import { describe, expect, it } from 'vitest';
import type { CostComparison, PriceValues } from '../contract/data-contract';
import { boilerYear, compare, gasParityParts, gasParityRate, networkKwFor, networkScenario } from './cost';
import { DEFAULT_FACTORS, DEFAULT_PRICE_VALUES as P } from './defaults';
import { money } from './format';
import { annuityFactor, crf } from './units';
import { bandFor } from './verdict';

const ECCC = DEFAULT_FACTORS.sets.eccc;
const TAF = DEFAULT_FACTORS.sets.taf;
const OFFICE = { annualHeatMwh: 3900, peakHeatKw: 1950, boilerYearsLeft: 12 };
const at = (over: Partial<PriceValues>): PriceValues => ({ ...P, ...over });
const within = (actual: number, expected: number, tol: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tol);
const withinPct = (actual: number, expected: number, pct: number) => within(actual, expected, (Math.abs(expected) * pct) / 100);
const allText = (c: CostComparison) => [c.verdict.sentence, c.verdict.heatPumpCaveat ?? ''].join(' ');

describe('8.5 intermediates and gas parity', () => {
  it('intermediates at defaults', () => {
    const parts = gasParityParts(P, ECCC);
    within(parts.fuel, 36.339, 0.001);
    within(crf(0.05, 25), 0.0709525, 0.0000001);
    within(parts.capex, 8.869, 0.001);
    within(parts.maint, 2.5, 0.001);
  });
  it('gasParityRate 47.708 at defaults and 66.048 at $85/t', () => {
    within(gasParityRate(P, ECCC), 47.708, 0.01);
    within(gasParityRate(at({ carbonPriceT: 85 }), ECCC), 66.048, 0.01);
  });
  it('annuity factor', () => {
    within(annuityFactor(0.05, 20), 12.46221, 0.00001);
  });
});

describe('8.5 office case', () => {
  const c = compare(OFFICE, P, ECCC);
  it('gas', () => {
    within((3900 * 1000) / (10.36 * 0.85), 442880, 1);
    within(c.gas.annual, 151471.55, 1);
    expect(c.gas.replacement).toBe(487500);
    within(c.gas.replacementPv, 271458, 1);
    withinPct(c.gas.pv20, 2159129, 0.05);
    within(c.gas.levelized, 44.42, 0.01);
    within(c.gas.co2T, 841.47, 0.01);
    expect(c.gas.gridKw).toBe(0);
  });
  it('HCE', () => {
    within(c.hce.annual, 186061, 1);
    withinPct(c.hce.pv20, 2318730, 0.05);
    within(c.hce.levelized, 47.71, 0.01);
    within(c.hce.levelized, c.hceRate, 1e-9);
    within(c.hce.co2T, 168.29, 0.01);
    within(c.hce.co2T, 0.2 * c.gas.co2T, 1e-9);
    expect(c.hce.gridKw).toBe(0);
  });
  it('verdict at defaults', () => {
    within(c.verdict.deltaPct, 7.39, 0.01);
    expect(c.verdict.band).toBe('about_the_same');
    expect(c.verdict.sentence.startsWith('About the same cost as gas')).toBe(true);
    expect(Math.round(c.verdict.co2CutPct)).toBe(80);
    expect(c.verdict.sentence).toBe(
      'About the same cost as gas over 20 years (+7 %). About 80 % less CO2 than gas, and about 0 kW of added grid ' +
        'load against about 980 kW for an own heat pump.',
    );
  });
  it('heat pump', () => {
    expect(c.heatpump.upfront).toBe(3802500);
    within(3900 / 2.8, 1392.857, 0.001);
    within(c.heatpump.annual, 323003.57, 1);
    withinPct(c.heatpump.pv20, 7827838, 0.05);
    within(c.heatpump.levelized, 161.06, 0.01);
    expect(c.heatpump.gridKw).toBe(975);
    within(c.heatpump.co2T, 97.5, 0.01);
    within(c.heatpump.co2_20yT, 1165.8, 0.1);
  });
  it('heat pump with the TAF set', () => {
    const t = compare(OFFICE, P, TAF);
    within(t.heatpump.co2T, 112.82, 0.01);
    within(t.heatpump.co2_20yT, 2968.2, 0.1);
  });
  it('CO2 ordering sets the heat-pump caveat; never "lowest carbon"', () => {
    expect(c.heatpump.co2T).toBeLessThan(c.hce.co2T);
    expect(c.hce.co2T).toBeLessThan(c.gas.co2T);
    expect(c.verdict.heatPumpCaveat).toBe(
      'An own heat pump emits less (about 98 t against 170 t a year at the 2026 grid factor) but adds about 980 kW ' +
        'of grid load and about $3.8M upfront.',
    );
    expect(allText(c).toLowerCase()).not.toContain('lowest carbon');
    expect(allText(c).toLowerCase()).not.toContain('cheapest');
  });
});

describe('8.5 scenarios and edges', () => {
  it('office at $85/t', () => {
    const c = compare(OFFICE, at({ carbonPriceT: 85 }), ECCC);
    within(c.gas.annual, 222996.65, 1);
    withinPct(c.gas.pv20, 3050489, 0.05);
    within(c.hceRate, 66.048, 0.01);
    within(c.hce.annual, 257586, 1);
    withinPct(c.hce.pv20, 3210091, 0.05);
    within(c.verdict.deltaPct, 5.23, 0.01);
    expect(c.verdict.band).toBe('about_the_same');
  });
  it('boilerYearsLeft 25: no replacement inside 20 years', () => {
    const c = compare({ ...OFFICE, boilerYearsLeft: 25 }, P, ECCC);
    expect(c.gas.replacement).toBe(0);
    withinPct(c.gas.pv20, 1887670, 0.05);
  });
  it('connection fee on', () => {
    const c = compare(OFFICE, at({ connectionFeeOn: 1 }), ECCC);
    expect(c.hce.upfront).toBe(487500);
    withinPct(c.hce.pv20, 2806230, 0.05);
  });
  it('clamping', () => {
    expect(boilerYear(0)).toEqual({ year: 1, assumed: false });
    expect(boilerYear(40)).toEqual({ year: 30, assumed: false });
    expect(boilerYear(null)).toEqual({ year: 12, assumed: true });
  });
  it('headline: 5 MW ≈ 18,000 MWh ≈ $0.86M to $1.19M', () => {
    expect(networkKwFor(18000, P)).toBe(5000);
    const lo = networkScenario(5000, P, ECCC);
    const hi = networkScenario(5000, at({ carbonPriceT: 85 }), ECCC);
    expect(lo.annualMwh).toBe(18000);
    within(lo.revenue, 858743, 1);
    within(hi.revenue, 1188858, 1);
    expect(money(lo.revenue)).toBe('$0.86M');
    expect(money(hi.revenue)).toBe('$1.19M');
  });
  it('monotonic', () => {
    const base = compare(OFFICE, P, ECCC);
    const gasUp = compare(OFFICE, at({ gasPriceM3: 0.4 }), ECCC);
    expect(gasUp.gas.annual).toBeGreaterThan(base.gas.annual);
    expect(gasUp.hceRate).toBeGreaterThan(base.hceRate);
    const copUp = compare(OFFICE, at({ hpCop: 3.2 }), ECCC);
    expect(copUp.heatpump.annual).toBeLessThan(base.heatpump.annual);
    expect(crf(0.07, 25)).toBeGreaterThan(crf(0.05, 25));
    expect(gasParityRate(at({ discountRate: 0.07 }), ECCC)).toBeGreaterThan(gasParityRate(P, ECCC));
  });
  it('verdict bands', () => {
    expect(bandFor(10.0)).toBe('about_the_same');
    expect(bandFor(10.1)).toBe('costs_more');
    expect(bandFor(-10.1)).toBe('cheaper');
    const c = compare({ ...OFFICE, boilerYearsLeft: 1 }, at({ hceRateAdj: -0.1 }), ECCC);
    within(c.verdict.deltaPct, -11.27, 0.01);
    expect(c.verdict.band).toBe('cheaper');
    expect(c.verdict.sentence).toContain('at your assumed HCE rate.');
    for (const x of [c, compare(OFFICE, at({ carbonPriceT: 85 }), ECCC)]) {
      expect(allText(x).toLowerCase()).not.toContain('carbon price');
    }
  });
});

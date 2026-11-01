import { describe, expect, it } from 'vitest';
import { DEFAULT_FACTORS, DEFAULT_PRICE_VALUES as P } from './defaults';
import { about, date, money, moneyProse, num, NOT_IN_SOURCE, orMissing, pct } from './format';
import { together } from './totals';

describe('8.5 formatting', () => {
  it('rows from the spec', () => {
    expect(`about ${about(975)} kW`).toBe('about 980 kW');
    expect(money(2159129)).toBe('$2.16M');
    expect(`about ${moneyProse(2159129)}`).toBe('about $2.2M');
    expect(pct(7.39)).toBe('+7 %');
    expect(orMissing(null, String)).toBe(NOT_IN_SOURCE);
    expect(NOT_IN_SOURCE).toBe('Not in source data');
  });
  it('money and quantities', () => {
    expect(money(151471.55)).toBe('$151,000');
    expect(money(858743)).toBe('$0.86M');
    expect(moneyProse(3802500)).toBe('$3.8M');
    expect(num(44.42)).toBe('44.4');
    expect(num(3876)).toBe('3,880');
    expect(pct(-11.27)).toBe('−11 %');
    expect(date('2026-10-31')).toBe('31 Oct 2026');
  });
});

describe('8.5 totals', () => {
  it('together() of the office twice', () => {
    const office = { estimate: { annualHeatMwh: 3900, peakHeatKw: 1950, networkKw: 1083 }, boilerYearsLeft: 12 };
    const t = together([office, office], P, DEFAULT_FACTORS.sets.eccc);
    expect(t.count).toBe(2);
    expect(t.annualMwh).toBe(7800);
    expect(Math.abs(t.networkMw - 2.17)).toBeLessThanOrEqual(0.005);
    expect(Math.abs(t.co2AvoidedT - 1346.4)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(t.hceRevenue - 372122)).toBeLessThanOrEqual(1);
  });
});

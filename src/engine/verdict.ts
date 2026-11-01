/** Verdict and wording (spec 8.4). Never "lowest carbon" or "cheapest" for HCE; "assumed" before any HCE rate. */
import type { CostComparison, PriceValues, Verdict } from '../contract/data-contract';
import { about, moneyProse, pct, pctAbs } from './format';

export const SAME_BAND_PCT = 10;

export function bandFor(deltaPct: number): Verdict['band'] {
  if (Math.abs(deltaPct) <= SAME_BAND_PCT + 1e-9) return 'about_the_same';
  return deltaPct > 0 ? 'costs_more' : 'cheaper';
}

/** The first sentence: the cost band, from the numbers. */
export function costSentence(band: Verdict['band'], deltaPct: number): string {
  if (band === 'about_the_same') return `About the same cost as gas over 20 years (${pct(deltaPct)}).`;
  if (band === 'costs_more') return `Costs about ${pctAbs(deltaPct)} more than gas over 20 years.`;
  return `About ${pctAbs(deltaPct)} cheaper than gas over 20 years, at your assumed HCE rate.`;
}

/** A short phrase for captions: "about the same as gas", "about 14 % more than gas", "about 12 % cheaper". */
export function bandPhrase(band: Verdict['band'], deltaPct: number): string {
  if (band === 'about_the_same') return 'about the same as gas';
  if (band === 'costs_more') return `about ${pctAbs(deltaPct)} more than gas`;
  return `about ${pctAbs(deltaPct)} cheaper than gas, at your assumed HCE rate`;
}

export function verdict(c: Omit<CostComparison, 'verdict'>, _p?: PriceValues): Verdict {
  void _p;
  const deltaPct = ((c.hce.pv20 - c.gas.pv20) / c.gas.pv20) * 100;
  const co2CutPct = (1 - c.hce.co2T / c.gas.co2T) * 100;
  const band = bandFor(deltaPct);
  const hpGridKw = c.heatpump.gridKw;
  const hceGridKw = c.hce.gridKw;
  const second =
    `About ${pctAbs(co2CutPct)} less CO2 than gas, and about ${about(hceGridKw)} kW of added grid load ` +
    `against about ${about(hpGridKw)} kW for an own heat pump.`;
  const sentence = `${costSentence(band, deltaPct)} ${second}`;
  const heatPumpCaveat =
    c.heatpump.co2T < c.hce.co2T
      ? `An own heat pump emits less (about ${about(c.heatpump.co2T)} t against ${about(c.hce.co2T)} t a year at the ` +
        `${c.factorYear} grid factor) but adds about ${about(hpGridKw)} kW of grid load and about ` +
        `${moneyProse(c.heatpump.upfront)} upfront.`
      : null;
  return { band, deltaPct, co2CutPct, hceGridKw, hpGridKw, sentence, heatPumpCaveat };
}

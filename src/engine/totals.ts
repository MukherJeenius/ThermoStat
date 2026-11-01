/** "Together" totals for a group of recipients (spec 2.5, plan B5.6). */
import type { FactorSet, PriceValues, Totals } from '../contract/data-contract';
import { compare } from './cost';

export interface TotalsInput {
  estimate: { annualHeatMwh: number; peakHeatKw: number; networkKw: number };
  boilerYearsLeft: number | null;
}

export function together(recipients: readonly TotalsInput[], p: PriceValues, f: FactorSet): Totals {
  let annualMwh = 0;
  let networkKw = 0;
  let co2AvoidedT = 0;
  let hceRevenue = 0;
  for (const r of recipients) {
    const c = compare(
      { annualHeatMwh: r.estimate.annualHeatMwh, peakHeatKw: r.estimate.peakHeatKw, boilerYearsLeft: r.boilerYearsLeft },
      p,
      f,
    );
    annualMwh += r.estimate.annualHeatMwh;
    networkKw += r.estimate.networkKw;
    co2AvoidedT += c.gas.co2T - c.hce.co2T;
    hceRevenue += r.estimate.annualHeatMwh * c.hceRate;
  }
  return { count: recipients.length, annualMwh, networkMw: networkKw / 1000, co2AvoidedT, hceRevenue };
}

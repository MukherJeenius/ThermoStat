/** Gas vs own heat pump vs HCE over 20 years (spec 8.2, plan B5.5). */
import type { CostComparison, CostOption, FactorSet, PriceValues } from '../contract/data-contract';
import { annuityFactor, clamp, crf, interpolateByYear } from './units';
import { verdict } from './verdict';

export const START_YEAR = 2026;
export const DEFAULT_BOILER_YEARS = 12;
const YEARS = 20;

export interface CompareInput {
  annualHeatMwh: number;
  peakHeatKw: number;
  boilerYearsLeft: number | null;
}

export interface CompareOptions {
  startYear?: number;
  assumptions?: CostComparison['assumptions'];
}

/** The replacement year: clamp(boilerYearsLeft ?? 12, 1, 30); "assumed" when the building's value is unknown. */
export function boilerYear(boilerYearsLeft: number | null): { year: number; assumed: boolean } {
  if (boilerYearsLeft === null || !Number.isFinite(boilerYearsLeft)) {
    return { year: DEFAULT_BOILER_YEARS, assumed: true };
  }
  return { year: clamp(Math.round(boilerYearsLeft), 1, 30), assumed: false };
}

function heatPerM3(p: PriceValues): number {
  return p.kwhPerM3 * p.boilerEff; // kWh of heat per m3 (8.806 at defaults)
}

/** Parts of the gas-parity rate in $/MWh, before the HCE rate adjustment. */
export function gasParityParts(p: PriceValues, f: Pick<FactorSet, 'gasKgPerM3'>) {
  const h = heatPerM3(p);
  const perKwPeakToPerMwh = 1000 / p.fullLoadHoursBuilding;
  const fuel = (p.gasPriceM3 / h) * 1000;
  const capex = p.boilerCapexKw * perKwPeakToPerMwh * crf(p.discountRate, p.boilerLife);
  const maint = p.maintGas * p.boilerCapexKw * perKwPeakToPerMwh;
  const carbon = ((p.carbonPriceT * f.gasKgPerM3) / 1000 / h) * 1000;
  return { fuel, capex, maint, carbon };
}

/** HCE's assumed rate in $/MWh: (fuel + capex + maint + carbon) × (1 + hceRateAdj). */
export function gasParityRate(p: PriceValues, f: Pick<FactorSet, 'gasKgPerM3'>): number {
  const { fuel, capex, maint, carbon } = gasParityParts(p, f);
  return (fuel + capex + maint + carbon) * (1 + p.hceRateAdj);
}

/** Grid factor for a calendar year: interpolated by year, or the set's flat value. */
export function gridFactor(f: FactorSet, year: number): number {
  if (f.gridTPerMwh) return interpolateByYear(f.gridTPerMwh, year);
  if (f.gridTPerMwhFlat !== null) return f.gridTPerMwhFlat;
  throw new Error(`factor set ${f.id} has no grid factor`);
}

function option(partial: Omit<CostOption, 'pv20' | 'levelized'>, af: number, q: number): CostOption {
  const pv20 = partial.upfront + partial.annual * af + partial.replacementPv;
  return { ...partial, pv20, levelized: pv20 / (af * q) };
}

export function compare(
  input: CompareInput,
  p: PriceValues,
  f: FactorSet,
  opts: CompareOptions = {},
): CostComparison {
  const startYear = opts.startYear ?? START_YEAR;
  const q = input.annualHeatMwh;
  const peak = input.peakHeatKw;
  const r = p.discountRate;
  const af = annuityFactor(r, YEARS);
  const h = heatPerM3(p);

  // keep gas
  const fuelM3 = (q * 1000) / h;
  const gasAnnual = fuelM3 * (p.gasPriceM3 + (p.carbonPriceT * f.gasKgPerM3) / 1000) + p.maintGas * p.boilerCapexKw * peak;
  const { year: n } = boilerYear(input.boilerYearsLeft);
  const replacement = n <= YEARS ? p.boilerCapexKw * peak : 0;
  const replacementPv = replacement / Math.pow(1 + r, n);
  const gasCo2 = (fuelM3 * f.gasKgPerM3) / 1000;
  const gas = option(
    { annual: gasAnnual, upfront: 0, replacement, replacementPv, co2T: gasCo2, co2_20yT: YEARS * gasCo2, gridKw: 0 },
    af,
    q,
  );

  // own heat pump
  const elecMwh = q / p.hpCop;
  const hpUpfront = (p.hpCapexKw + p.elecUpgradeKw) * peak;
  const hpAnnual = elecMwh * 1000 * p.elecPriceKwh + p.maintHp * hpUpfront;
  let hpCo2_20y = 0;
  for (let t = 1; t <= YEARS; t++) hpCo2_20y += elecMwh * gridFactor(f, startYear - 1 + t);
  const heatpump = option(
    {
      annual: hpAnnual,
      upfront: hpUpfront,
      replacement: 0,
      replacementPv: 0,
      co2T: elecMwh * gridFactor(f, startYear),
      co2_20yT: hpCo2_20y,
      gridKw: peak / p.hpCopDesign,
    },
    af,
    q,
  );

  // connect to HCE at the assumed gas-parity rate
  const hceRate = gasParityRate(p, f);
  const hceCo2 = p.hceCo2Share * gasCo2;
  const hce = option(
    {
      annual: q * hceRate,
      upfront: p.connectionFeeOn ? p.boilerCapexKw * peak : 0,
      replacement: 0,
      replacementPv: 0,
      co2T: hceCo2,
      co2_20yT: YEARS * hceCo2,
      gridKw: 0, // network load is handled at HCE's plant
    },
    af,
    q,
  );

  const factorYear =
    f.gridTPerMwh === null && 'factorYear' in f && typeof f.factorYear === 'number' ? f.factorYear : startYear;
  const base: Omit<CostComparison, 'verdict'> = {
    gas,
    heatpump,
    hce,
    hceRate,
    factorSetId: f.id,
    factorYear,
    assumptions: opts.assumptions ?? 'sourced_defaults',
  };
  return { ...base, verdict: verdict(base, p) };
}

/** Annual heat and HCE heat sales for a network peak (the "5 MW" scale line). */
export function networkScenario(
  networkKw: number,
  p: PriceValues,
  f: Pick<FactorSet, 'gasKgPerM3'>,
): { annualMwh: number; revenue: number } {
  const annualMwh = (networkKw * p.fullLoadHoursNetwork) / 1000;
  return { annualMwh, revenue: annualMwh * gasParityRate(p, f) };
}

/** Network peak contribution from annual heat: round(Q × 1000 / 3600). */
export function networkKwFor(annualHeatMwh: number, p: Pick<PriceValues, 'fullLoadHoursNetwork'>): number {
  return Math.floor((annualHeatMwh * 1000) / p.fullLoadHoursNetwork + 0.5);
}

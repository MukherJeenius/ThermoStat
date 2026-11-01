/** The plan B5 defaults: used by the tests and as the fallback when prices.json or factors.json fail (spec 13). */
import type { FactorSet, FactorsFile, PriceKey, Prices, PriceValues } from '../contract/data-contract';
import factorsJson from './fixtures/factors.default.json';
import pricesJson from './fixtures/prices.default.json';

export const DEFAULT_PRICES = pricesJson as Prices;
export const DEFAULT_FACTORS = factorsJson as FactorsFile;

/** The engine's built-in ECCC set, flagged as the fallback (only when factors.json fails to load). */
export const FALLBACK_FACTOR_SET: FactorSet = { ...DEFAULT_FACTORS.sets.eccc, isFallback: true };

export function priceValues(p: Prices): PriceValues {
  const out = {} as PriceValues;
  for (const k of Object.keys(p) as PriceKey[]) out[k] = p[k].value;
  return out;
}

export const DEFAULT_PRICE_VALUES = priceValues(DEFAULT_PRICES);

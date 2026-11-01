/** Fit assessment (spec 8.3). Mirrors pipeline/thermostat/fit.py; fixtures/fit-cases.json keeps them equal. */
import type { Archetype, DataQuality, Distances, FitAssessment, FitBand, Recipient } from '../contract/data-contract';
import { about } from './format';

export interface FitInput {
  annualHeatMwh: number;
  minM: number | null;
  distanceQuality?: Distances['quality'];
  heatingSystem: Recipient['heatingSystem'];
  type: Archetype;
  ownerType: Recipient['ownerType'];
  yearBuilt: number | null;
  boilerYearsLeft: number | null;
  quality: DataQuality;
  activePermit: boolean | null;
  typeAssumed?: boolean;
}

export const FACTORS = ['size', 'distance', 'heating', 'anchor', 'timing', 'data'] as const;
type Factor = (typeof FACTORS)[number];
type Points = FitAssessment['points'];

export const QUALITY_WORD: Record<DataQuality, string> = {
  actual: 'Actual',
  checked: 'Checked estimate',
  estimate: 'Estimate only',
};
const DISTANCE_PHRASE: Record<Distances['quality'], [string, string]> = {
  known_customer: ['an existing HCE customer', 'known customer'],
  approx_route: ['the planned route', 'approximate'],
  illustrative_route: ['the planned route', 'illustrative'],
};
const ANCHOR_TYPE_WORD: Partial<Record<Archetype, string>> = {
  hospital: 'a hospital',
  school: 'a school',
  civic: 'a civic building',
};

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export function fitPoints(i: FitInput): Points {
  const q = i.annualHeatMwh;
  const size = clamp((30 * (q - 300)) / 2700, 0, 30);
  const distance = i.minM === null ? 0 : clamp((25 * (600 - i.minM)) / 500, 0, 25);
  const heating = i.heatingSystem === 'hydronic' ? 15 : i.heatingSystem === 'forced_air' ? 3 : 7;
  let anchor = 3;
  if (i.type === 'hospital' || i.type === 'school' || i.type === 'civic' || i.ownerType === 'public' || i.ownerType === 'institutional') {
    anchor = 15;
  } else if (q >= 1000) {
    anchor = 8;
  }
  let timing = 2;
  if (i.activePermit === true) timing = 10;
  else if (i.boilerYearsLeft !== null && i.boilerYearsLeft <= 5) timing = 8;
  else if (i.yearBuilt !== null && i.yearBuilt <= 2001) timing = 6;
  const data = i.quality === 'actual' ? 5 : i.quality === 'checked' ? 3 : 1;
  return { size, distance, heating, anchor, timing, data };
}

export function scoreOf(points: Points): number {
  let total = 0;
  for (const k of FACTORS) total += points[k]; // fixed order, so both languages sum identically
  return Math.floor(total + 0.5);
}

export function bandOf(score: number): FitBand {
  if (score >= 70) return 'strong';
  if (score >= 45) return 'possible';
  return 'weak';
}

function reason(k: Factor, i: FitInput, pts: Points): string | null {
  const q = i.annualHeatMwh;
  switch (k) {
    case 'size':
      return `${q >= 1000 ? 'Large heat user' : 'Heat use'}: about ${about(q)} MWh a year (${QUALITY_WORD[i.quality]}).`;
    case 'distance': {
      if (i.minM === null || pts.distance <= 0) return null;
      const [what, word] = DISTANCE_PHRASE[i.distanceQuality ?? 'approx_route'];
      return `About ${about(Math.max(i.minM, 10))} m from ${what} (${word}).`;
    }
    case 'heating':
      return i.heatingSystem === 'hydronic' ? 'Heats with hot water, which suits a network connection.' : null;
    case 'anchor':
      if (pts.anchor !== 15) return null;
      return ANCHOR_TYPE_WORD[i.type] ? `A public anchor building: ${ANCHOR_TYPE_WORD[i.type]}.` : 'A public or institutional owner.';
    case 'timing':
      if (pts.timing === 10) return 'An active permit or site plan within 50 m.';
      if (pts.timing === 8) return `Boiler due for replacement in about ${i.boilerYearsLeft} years.`;
      if (pts.timing === 6) return `Built in ${i.yearBuilt}, so its heating plant may be due for renewal.`;
      return null;
    case 'data':
      if (i.quality === 'actual') return "Uses this building's reported gas use.";
      if (i.quality === 'checked') return 'Its estimate is calibrated against Hamilton large-building reports.';
      return null;
  }
}

export function missingOf(i: FitInput): string[] {
  const out: string[] = [];
  if (i.typeAssumed) out.push('building type');
  if (i.heatingSystem === null) out.push('heating system');
  if (i.yearBuilt === null) out.push('year built');
  if (i.minM === null) out.push('distance to the network');
  return out;
}

export function fitAssessment(i: FitInput): FitAssessment {
  const points = fitPoints(i);
  const score = scoreOf(points);
  const order = [...FACTORS].sort((a, b) => points[b] - points[a] || FACTORS.indexOf(a) - FACTORS.indexOf(b));
  const reasons: string[] = [];
  for (const k of order) {
    const r = reason(k, i, points);
    if (r) reasons.push(r);
    if (reasons.length === 3) break;
  }
  return { band: bandOf(score), score, reasons, missing: missingOf(i), points };
}

export const BAND_WORD: Record<FitBand, string> = { strong: 'Strong', possible: 'Possible', weak: 'Weak' };

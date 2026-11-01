/** Demo mode (spec 12): seven steps, each a pure function of the data, so Back always works. Every figure in a
 *  caption comes from the engine or meta.json, and every caption has a fallback for each input that can be missing. */
import type { ConnectionKind, FactorSet, Facility, HeatConnection, MetaFile, PriceValues, Recipient } from '../contract/data-contract';
import { compare, networkScenario } from '../engine/cost';
import { about, money, pct, pctAbs } from '../engine/format';
import { bandPhrase } from '../engine/verdict';
import { together } from '../engine/totals';
import { BAND_WORD } from '../content/copy';
import { href } from '../state/route';

export const DEMO_STEPS = 7;

export interface DemoContext {
  facilities: Facility[];
  connections: HeatConnection[];
  recipients: Recipient[];
  meta: MetaFile | null;
  prices: PriceValues;
  factor: FactorSet;
}

export interface DemoCamera {
  points: (readonly number[])[];
  maxZoom: number;
  floor: number;
}

export interface DemoStep {
  n: number;
  hash: string;
  tab: 'facilities' | 'recipients';
  carbonPriceT: number;
  openRow: number | 'all';
  showRail: boolean;
  caption: string;
  camera: DemoCamera | null;
  arcKinds: ConnectionKind[] | null; // null = every kind the selection policy draws
}

const DOWNTOWN = 'hce-downtown-plant';
const RECOVERY = 'hce-recovery-plant';
const DC21 = 'dc-21-king-w';

function demoRecipient(ctx: DemoContext): Recipient | null {
  const id = ctx.meta?.demoRecipientId;
  const byId = id ? ctx.recipients.find((r) => r.id === id) : undefined;
  if (byId) return byId;
  return [...ctx.recipients].filter((r) => r.rank).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))[0] ?? null;
}

function name(r: Recipient): string {
  return r.name ?? (r.address ? `the building at ${r.address}` : 'this building');
}

export function step(nIn: number, ctx: DemoContext): DemoStep {
  const n = Math.min(DEMO_STEPS, Math.max(1, Math.round(nIn)));
  const fac = (id: string) => ctx.facilities.find((f) => f.id === id) ?? null;
  const own = (id: string) => ctx.connections.filter((c) => c.facilityId === id);
  const r = demoRecipient(ctx);
  const base = { n, carbonPriceT: 0, showRail: false, openRow: 0 as number | 'all', tab: 'facilities' as const, arcKinds: null as ConnectionKind[] | null };

  if (n === 1) {
    const plant = fac(DOWNTOWN);
    const ops = own(DOWNTOWN).filter((c) => c.kind === 'operational');
    // frame the plant and its nearby customers; a far customer's arc may run off-screen
    const near = plant ? ops.filter((c) => Math.hypot((c.target[0] - plant.position[0]) * 0.73, c.target[1] - plant.position[1]) < 0.0065) : [];
    const caption = ops.length
      ? `Downtown Hamilton already shares heat: HCE’s plant at 79 Bay St N serves ${ops.length} buildings named in public records.`
      : 'Downtown Hamilton already shares heat from HCE’s plant at 79 Bay St N. Its customers are not yet named in a cached public source.';
    return {
      ...base,
      arcKinds: ['operational'],
      hash: href.facility(DOWNTOWN),
      caption,
      camera: plant ? { points: [plant.position, ...near.map((c) => c.target)], maxZoom: 16, floor: 14.5 } : null,
    };
  }
  if (n === 2) {
    const plant = fac(RECOVERY);
    const heat = plant?.commitments.find((c) => c.topic === 'heat' && c.source);
    const page = heat?.source?.page;
    const caption =
      heat && page
        ? `HCE’s study proposes Bayfront industrial heat for Hamilton General, then downtown. Here it is in the study’s own words, page ${page}.`
        : 'HCE’s study proposes Bayfront industrial heat for Hamilton General, then downtown. Its passage could not be located automatically and is listed for a person to check.';
    const targets = own(RECOVERY).filter((c) => c.kind === 'proposed').map((c) => c.target);
    return {
      ...base,
      arcKinds: ['proposed'],
      hash: plant ? href.evidence(RECOVERY, heat?.id) : href.explore(),
      caption,
      camera: plant ? { points: [plant.position, ...targets], maxZoom: 14.5, floor: 12.4 } : null,
    };
  }
  if (!r) {
    // no recipients: the remaining steps fall back to the facilities
    return { ...base, n, hash: href.facility(RECOVERY), caption: 'No recipients are in this build yet.', camera: null };
  }
  const c0 = compare({ annualHeatMwh: r.estimate.annualHeatMwh, peakHeatKw: r.estimate.peakHeatKw, boilerYearsLeft: r.boilerYearsLeft }, { ...ctx.prices, carbonPriceT: 0 }, ctx.factor);
  const arc = ctx.connections.find((c) => c.recipientId === r.id);
  const recCam: DemoCamera = { points: arc ? [r.position, arc.source] : [r.position], maxZoom: 16, floor: 13.5 };
  if (n === 3) {
    const reason = r.fit.reasons[0];
    const caption = `Who should HCE approach first? ${name(r)}: ${BAND_WORD[r.fit.band].toLowerCase()} fit.${reason ? ` ${reason}` : ''}`;
    return { ...base, tab: 'recipients', showRail: true, hash: href.recipient(r.id), caption, camera: recCam };
  }
  if (n === 4) {
    return { ...base, tab: 'recipients', openRow: 1, hash: href.recipient(r.id), caption: c0.verdict.sentence, camera: recCam };
  }
  if (n === 5) {
    const c85 = compare({ annualHeatMwh: r.estimate.annualHeatMwh, peakHeatKw: r.estimate.peakHeatKw, boilerYearsLeft: r.boilerYearsLeft }, { ...ctx.prices, carbonPriceT: 85 }, ctx.factor);
    const v = c85.verdict;
    const caption =
      `If a carbon price of $85/t returns, gas and HCE’s assumed rate rise together: still ${bandPhrase(v.band, v.deltaPct)} ` +
      `(${pct(v.deltaPct)}), with about ${pctAbs(v.co2CutPct)} less CO2.`;
    return { ...base, tab: 'recipients', openRow: 1, carbonPriceT: 85, hash: href.recipient(r.id), caption, camera: recCam };
  }
  if (n === 6) {
    const top5 = ctx.recipients.filter((x) => x.rank && x.rank <= 5);
    const t = together(top5, { ...ctx.prices, carbonPriceT: 0 }, ctx.factor);
    const lo = networkScenario(5000, { ...ctx.prices, carbonPriceT: 0 }, ctx.factor);
    const hi = networkScenario(5000, { ...ctx.prices, carbonPriceT: 85 }, ctx.factor);
    const caption = top5.length
      ? `Together, the top five add about ${about(t.annualMwh)} MWh a year and ${about(t.networkMw)} MW of network peak. ` +
        `For scale, 5 MW is worth about ${money(lo.revenue)} to ${money(hi.revenue)} a year to HCE.`
      : `For scale, 5 MW of network peak is worth about ${money(lo.revenue)} to ${money(hi.revenue)} a year to HCE.`;
    const plant = fac(DOWNTOWN);
    return {
      ...base,
      tab: 'recipients',
      showRail: true,
      hash: href.recipient(r.id),
      caption,
      camera: { points: [...top5.map((x) => x.position), ...(plant ? [plant.position] : [])], maxZoom: 15.2, floor: 13.5 },
    };
  }
  const dc = fac(DC21);
  return {
    ...base,
    openRow: 'all',
    hash: dc ? href.facility(DC21) : href.explore(),
    caption: 'And the questions still open: no public record says whether this site’s heat is reused. Unknown, not non-compliant.',
    camera: dc ? { points: [dc.position], maxZoom: 16, floor: 15 } : null,
  };
}

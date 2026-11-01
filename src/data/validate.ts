/** Hand-written runtime guards for what the UI relies on (spec 7.4). Invalid items are skipped and counted. */
import type { Facility, Feature, HeatConnection, Poly, Recipient, SourceRecord } from '../contract/data-contract';
import { safeHttpsUrl } from './urls';

const isPos = (p: unknown): boolean =>
  Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]);

function okSource(s: SourceRecord | null): boolean {
  return s === null || (typeof s.excerpt === 'string' && safeHttpsUrl(s.url) !== null);
}

export function validateFacilities(items: Facility[]): { items: Facility[]; skipped: number } {
  const out: Facility[] = [];
  let skipped = 0;
  for (const f of items) {
    if (!f || typeof f.id !== 'string' || typeof f.name !== 'string' || !isPos(f.position) || !Array.isArray(f.commitments)) {
      skipped++;
      continue;
    }
    const commitments = f.commitments.filter((c) => {
      const ok = c && typeof c.id === 'string' && okSource(c.source) && (c.source !== null || c.status === 'unknown');
      if (!ok) skipped++;
      return ok;
    });
    out.push({ ...f, commitments });
  }
  return { items: out, skipped };
}

export function validateConnections(items: HeatConnection[]): { items: HeatConnection[]; skipped: number } {
  const out = items.filter((c) => c && typeof c.id === 'string' && isPos(c.source) && isPos(c.target));
  return { items: out, skipped: items.length - out.length };
}

export function validateRecipients(items: Feature<Poly, Recipient>[]): { items: Feature<Poly, Recipient>[]; skipped: number } {
  const out = items.filter((f) => {
    const p = f?.properties;
    return (
      p &&
      typeof p.id === 'string' &&
      isPos(p.position) &&
      p.estimate &&
      p.estimate.annualHeatMwh > 0 &&
      p.fit &&
      Array.isArray(p.sourceIds) &&
      p.sourceIds.length > 0
    );
  });
  return { items: out, skipped: items.length - out.length };
}

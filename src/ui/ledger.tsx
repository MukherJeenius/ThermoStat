/** Small shared pieces for the Ledger look: the literal word "Unknown", facility status in words, page refs. */
import type { ReactNode } from 'react';
import type { Facility, HeatConnection, SourceRecord } from '../contract/data-contract';

export const UNKNOWN = 'Unknown';

/** A value, or the word "Unknown" in muted italic when it is missing. */
export function Val({ v }: { v: ReactNode | null | undefined }) {
  if (v === null || v === undefined || v === '' || v === 'Not in source data') return <span className="ts-unknown">{UNKNOWN}</span>;
  return <>{v}</>;
}

export type FacilityState = 'built' | 'promised' | 'unknown';

/** Built when an operating connection is on record; promised when a sourced claim exists; else unknown. */
export function facilityState(f: Facility, connections: HeatConnection[]): FacilityState {
  if (connections.some((c) => c.facilityId === f.id && c.kind === 'operational')) return 'built';
  if (f.commitments.some((c) => c.source)) return 'promised';
  return 'unknown';
}

export const FACILITY_STATE_WORD: Record<FacilityState, string> = {
  built: 'Built',
  promised: 'Promised · not built',
  unknown: 'Unknown',
};

export function StateWord({ s }: { s: FacilityState }) {
  return <span className={`ts-status-${s}`}>{FACILITY_STATE_WORD[s]}</span>;
}

/** "Energy Harvesting Study, p. 14" (or the title alone when the source has no page). */
export function pageRef(s: SourceRecord): string {
  if (!s.page) return s.shortTitle;
  const p = s.page.replace(/^PDF p\.\s*/, '').replace(/^page\s*/i, '');
  return `${s.shortTitle}, p. ${p}`;
}

export const two = (n: number) => String(n).padStart(2, '0');

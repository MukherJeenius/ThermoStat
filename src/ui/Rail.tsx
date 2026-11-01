/** Left rail: two plain-text tabs, ranked rows with status in words, the top eight then "Show all N". */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Facility, HeatConnection, Recipient, Totals } from '../contract/data-contract';
import { BAND_WORD, COPY, TYPE_WORD } from '../content/copy';
import { facilityState, FACILITY_STATE_WORD, two } from './ledger';
import { recipientName } from './RecipientPanel';

export type Tab = 'facilities' | 'recipients';
export type LayerKey = 'facilities' | 'connections' | 'buildings' | 'heat';

type Props = {
  facilities: Facility[];
  recipients: Recipient[];
  connections?: HeatConnection[];
  tab: Tab;
  onTab: (t: Tab) => void;
  layers: Record<LayerKey, boolean>;
  onLayer: (k: LayerKey) => void;
  heatDisabled: boolean;
  selectedId: string | null;
  onSelectFacility: (id: string) => void;
  onSelectRecipient: (id: string) => void;
  together: Totals | null;
  scale: { low: number; high: number; mwh: number } | null;
  retrieved: string;
  loading: boolean;
};


function roving(e: KeyboardEvent<HTMLButtonElement>) {
  const list = e.currentTarget.closest('ul');
  if (!list) return;
  const items = Array.from(list.querySelectorAll<HTMLButtonElement>('button.ts-place'));
  const i = items.indexOf(document.activeElement as HTMLButtonElement);
  let next = -1;
  if (e.key === 'ArrowDown') next = Math.min(items.length - 1, i + 1);
  else if (e.key === 'ArrowUp') next = Math.max(0, i - 1);
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = items.length - 1;
  if (next >= 0) {
    e.preventDefault();
    items.forEach((b, k) => (b.tabIndex = k === next ? 0 : -1));
    items[next].focus();
  }
}

const TOP = 8;

export function Rail(p: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [all, setAll] = useState(false);
  const ranked = p.recipients.filter((r) => r.rank).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const conns = p.connections ?? [];
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [p.selectedId, p.tab]);
  const selIndex = p.tab === 'facilities' ? p.facilities.findIndex((f) => f.id === p.selectedId) : ranked.findIndex((r) => r.id === p.selectedId);
  const total = p.tab === 'facilities' ? p.facilities.length : ranked.length;
  const limit = all || selIndex >= TOP ? total : TOP;
  return (
    <aside className="ts-panel ts-panel--rail" aria-label="Places to investigate">
      <div className="ts-tabs" role="tablist" aria-label="Places to investigate">
        {(['facilities', 'recipients'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`ts-tab-${t}`}
            aria-selected={p.tab === t}
            aria-controls="ts-places"
            className="ts-tab"
            onClick={() => { setAll(false); p.onTab(t); }}
          >
            {t === 'facilities' ? 'Facilities' : 'Buildings'}{' '}
            <span className="ts-tab-count">{t === 'facilities' ? p.facilities.length : ranked.length}</span>
            {t === 'recipients' && <span className="ts-visually-hidden"> to approach</span>}
          </button>
        ))}
      </div>
      <div className="ts-rail-places" id="ts-places" role="tabpanel" aria-labelledby={`ts-tab-${p.tab}`} ref={listRef} aria-busy={p.loading}>
        {p.loading && (
          <>
            <p className="ts-meta">{COPY.loading}</p>
            <div className="ts-skeleton" />
            <div className="ts-skeleton" />
            <div className="ts-skeleton" />
          </>
        )}
        {!p.loading && p.tab === 'facilities' && (
          <ul className="ts-places">
            {p.facilities.slice(0, limit).map((f, i) => (
              <li key={f.id}>
                <button
                  type="button"
                  className="ts-place"
                  onKeyDown={roving}
                  aria-current={p.selectedId === f.id ? 'true' : undefined}
                  tabIndex={p.selectedId === f.id || (!p.selectedId && i === 0) ? 0 : -1}
                  onClick={() => p.onSelectFacility(f.id)}
                >
                  <span className="ts-number">{two(i + 1)}</span>
                  <span className="ts-place-name">{f.name}</span>
                  <span className="ts-place-sub">
                    {FACILITY_STATE_WORD[facilityState(f, conns)]}
                    {f.synthetic ? ' · Illustrative' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!p.loading && p.tab === 'recipients' && (
          <ul className="ts-places">
            {ranked.slice(0, limit).map((r, i) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="ts-place"
                  onKeyDown={roving}
                  aria-current={p.selectedId === r.id ? 'true' : undefined}
                  tabIndex={p.selectedId === r.id || (!p.selectedId && i === 0) ? 0 : -1}
                  onClick={() => p.onSelectRecipient(r.id)}
                >
                  <span className="ts-number">{two(r.rank ?? 0)}</span>
                  <span className="ts-place-name">{recipientName(r)}</span>
                  <span className="ts-place-sub">
                    {TYPE_WORD[r.type]} · {BAND_WORD[r.fit.band]} fit{r.synthetic ? ' · Illustrative' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!p.loading && total > limit && (
          <button type="button" className="ts-link ts-show-all" onClick={() => setAll(true)}>
            Show all {total} <span aria-hidden="true">→</span>
          </button>
        )}
        <p className="ts-footnote">{COPY.railFootnote}</p>
      </div>
    </aside>
  );
}

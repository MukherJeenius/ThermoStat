/** Left rail (spec 9.4): intro, layer switches, "Places to investigate" with two tabs, Together totals. */
import { useEffect, useRef, type KeyboardEvent } from 'react';
import type { Facility, Recipient, Totals } from '../contract/data-contract';
import { BAND_WORD, COPY, FACILITY_KIND_WORD } from '../content/copy';
import { about, money, num, two } from '../engine/format';
import { recipientName } from './RecipientPanel';

export type Tab = 'facilities' | 'recipients';
export type LayerKey = 'facilities' | 'connections' | 'buildings' | 'heat';

type Props = {
  facilities: Facility[];
  recipients: Recipient[];
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

export function Rail(p: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const ranked = p.recipients.filter((r) => r.rank).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [p.selectedId, p.tab]);
  return (
    <aside className="ts-panel ts-panel--rail" aria-label="Places to investigate">
      <div className="ts-rail-tabs">
        <p className="ts-rail-heading">Places to investigate</p>
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
              onClick={() => p.onTab(t)}
            >
              {t === 'facilities' ? 'Facilities' : 'Recipients'}
              <span className="ts-tab-count" aria-hidden="true">{two(t === 'facilities' ? p.facilities.length : ranked.length)}</span>
              {t === 'recipients' && <span className="ts-visually-hidden"> to approach</span>}
            </button>
          ))}
        </div>
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
            {p.facilities.map((f, i) => (
              <li key={f.id}>
                <button
                  type="button"
                  className="ts-place"
                  onKeyDown={roving}
                  aria-current={p.selectedId === f.id ? 'true' : undefined}
                  tabIndex={p.selectedId === f.id || (!p.selectedId && i === 0) ? 0 : -1}
                  onClick={() => p.onSelectFacility(f.id)}
                >
                  <span className={`ts-dot${p.selectedId === f.id ? ' is-on' : ''}`} aria-hidden="true" />
                  <span>{f.name}</span>
                  <span className="ts-place-sub">
                    {FACILITY_KIND_WORD[f.kind]}
                    {f.synthetic ? ' · Illustrative' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!p.loading && p.tab === 'recipients' && (
          <>
            <ul className="ts-places">
              {ranked.map((r, i) => (
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
                    <span>{recipientName(r)}</span>
                    <span className="ts-place-sub">
                      {BAND_WORD[r.fit.band]} fit{r.synthetic ? ' · Illustrative' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {p.together && (
              <div className="ts-totals" id="ts-together">
                <p className="ts-label">TOGETHER: THE TOP {p.together.count}</p>
                <dl>
                  <dt>Annual heat</dt>
                  <dd>{num(p.together.annualMwh)} MWh a year</dd>
                  <dt>Network peak</dt>
                  <dd>{num(p.together.networkMw)} MW</dd>
                  <dt>CO2 avoided against gas</dt>
                  <dd>{num(p.together.co2AvoidedT)} t a year</dd>
                  <dt>Heat sales for HCE</dt>
                  <dd>{money(p.together.hceRevenue)} a year</dd>
                </dl>
                {p.scale && (
                  <p className="ts-meta">
                    For scale: 5 MW of network peak ≈ {about(p.scale.mwh)} MWh a year ≈ {money(p.scale.low)}–{money(p.scale.high)} a year at gas
                    parity (carbon $0 to $85/t).
                  </p>
                )}
              </div>
            )}
          </>
        )}
        <p className="ts-footnote">{COPY.railFootnote}</p>
      </div>
    </aside>
  );
}

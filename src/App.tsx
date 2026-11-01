/** ThermoStat: one product, two lenses. Hash routes drive the view and the selection (spec 9.12). */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CostComparison, FactorSet, PriceValues, Recipient } from './contract/data-contract';
import { COPY } from './content/copy';
import { TEAM_CREDIT } from './content/credits';
import { loadAll, type AppData } from './data/load';
import { compare, networkScenario } from './engine/cost';
import { priceValues } from './engine/defaults';
import { date } from './engine/format';
import { together } from './engine/totals';
import { MapView } from './map/MapView';
import { href, parseRoute, type Route } from './state/route';
import { EvidencePanel } from './ui/EvidencePanel';
import { FacilityPanel } from './ui/FacilityPanel';
import { Close, Minus, Plus, Reset, Search as SearchIcon } from './ui/icons';
import { Legend } from './ui/Legend';
import { Rail, type LayerKey, type Tab } from './ui/Rail';
import { RecipientPanel, recipientName } from './ui/RecipientPanel';
import { Search } from './ui/Search';
import { Brief } from './views/Brief';
import { Method } from './views/Method';
import { Records } from './views/Records';
import { KIND_WORD } from './content/copy';

const CARBON_KEY = 'thermostat:v1:carbon';

function readCarbon(): number {
  try {
    return Number(localStorage.getItem(CARBON_KEY)) === 85 ? 85 : 0;
  } catch {
    return 0;
  }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(h: string) {
  if (window.location.hash !== h) window.location.hash = h;
}

export interface Engine {
  prices: PriceValues;
  factor: FactorSet;
  carbon: number;
  compareFor: (r: Recipient) => CostComparison;
}

export function App() {
  const route = useHashRoute();
  const [data, setData] = useState<AppData | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ facilities: true, connections: true, buildings: true, heat: false });
  const [carbon, setCarbonState] = useState<number>(readCarbon);
  const [pitched, setPitched] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [zoomDelta, setZoomDelta] = useState({ n: 0, d: 0 });
  const [popover, setPopover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [announce, setAnnounce] = useState('');
  const [basemapFailed, setBasemapFailed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const setHeading = useCallback((el: HTMLHeadingElement | null) => {
    headingRef.current = el;
  }, []);
  const focusNext = useRef(false);

  // Esc closes the innermost open thing: the drawer, then the popover (spec 9.12)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (drawerOpen) setDrawerOpen(false);
      else if (popover) setPopover(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, popover]);

  const reload = useCallback(() => {
    setData(null);
    loadAll().then(setData);
  }, []);
  useEffect(() => {
    loadAll().then(setData);
  }, []);

  const setCarbon = (t: number) => {
    setCarbonState(t);
    try {
      localStorage.setItem(CARBON_KEY, String(t));
    } catch {
      /* viewer convenience only */
    }
  };

  const facilities = useMemo(() => (data?.facilities ?? []).filter((f) => !f.synthetic), [data]);
  const connections = useMemo(() => (data?.connections ?? []).filter((c) => !c.synthetic), [data]);
  const recipients = useMemo(() => (data?.recipients.features ?? []).map((f) => f.properties), [data]);
  const recById = useMemo(() => new Map(recipients.map((r) => [r.id, r])), [recipients]);
  const facIndex = useMemo(() => new Map(facilities.map((f, i) => [f.id, i + 1])), [facilities]);

  const engine = useMemo<Engine | null>(() => {
    if (!data) return null;
    const base = priceValues(data.prices);
    const prices = { ...base, carbonPriceT: carbon };
    const factor = data.factors.sets[data.factors.default] ?? data.factors.sets.eccc;
    return {
      prices,
      factor,
      carbon,
      compareFor: (r: Recipient) =>
        compare({ annualHeatMwh: r.estimate.annualHeatMwh, peakHeatKw: r.estimate.peakHeatKw, boilerYearsLeft: r.boilerYearsLeft }, prices, factor, {
          assumptions: carbon !== base.carbonPriceT ? 'edited' : 'sourced_defaults',
        }),
    };
  }, [data, carbon]);

  const defaultFacilityId = data?.meta?.defaultFacilityId ?? 'hce-recovery-plant';
  const sel = route.view === 'explore' ? route.sel : null;
  // the tab follows the selection unless the viewer picked a tab for the current selection
  const selKey = sel ? `${sel.kind}:${sel.id}` : 'none';
  const [tabState, setTabState] = useState<{ tab: Tab; key: string }>({ tab: 'facilities', key: '' });
  const tab: Tab =
    tabState.key === selKey ? tabState.tab : sel?.kind === 'recipient' ? 'recipients' : sel?.kind === 'facility' ? 'facilities' : tabState.tab;
  const setTab = (t: Tab) => setTabState({ tab: t, key: selKey });
  const selectedFacility = sel?.kind === 'facility' ? facilities.find((f) => f.id === sel.id) ?? null : null;
  const selectedRecipient = sel?.kind === 'recipient' ? recById.get(sel.id) ?? null : null;
  const selectedConnection = sel?.kind === 'connection' ? connections.find((c) => c.id === sel.id) ?? null : null;
  const unknownId = data && sel && !selectedFacility && !selectedRecipient && !selectedConnection;
  const focusFacilityId = selectedFacility?.id ?? (sel === null || unknownId ? defaultFacilityId : selectedConnection?.facilityId ?? null);
  const cardFacility = selectedFacility ?? (sel === null || unknownId ? facilities.find((f) => f.id === defaultFacilityId) ?? null : null);

  // focus moves to the new panel's h2 only after an action inside the card (spec 9.2)
  useEffect(() => {
    if (focusNext.current) {
      headingRef.current?.focus({ preventScroll: true });
      focusNext.current = false;
    }
  });

  const top5 = useMemo(() => recipients.filter((r) => r.rank && r.rank <= 5), [recipients]);
  const totals = useMemo(() => (engine && top5.length ? together(top5, engine.prices, engine.factor) : null), [engine, top5]);
  const scale = useMemo(() => {
    if (!engine || !data) return null;
    const base = priceValues(data.prices);
    const lo = networkScenario(5000, { ...base, carbonPriceT: 0 }, engine.factor);
    const hi = networkScenario(5000, { ...base, carbonPriceT: 85 }, engine.factor);
    return { low: lo.revenue, high: hi.revenue, mwh: lo.annualMwh };
  }, [engine, data]);

  const retrieved = data?.meta ? date(data.meta.osmBase) : 'Not in source data';
  const caption = `Hamilton, Ontario · records retrieved ${retrieved}`;

  const selectFacility = (id: string) => {
    setPopover(null);
    const f = facilities.find((x) => x.id === id);
    if (f) setAnnounce(`Selected ${f.name}, ${f.commitments.length} records`);
    go(href.facility(id));
  };
  const selectRecipient = (id: string) => {
    setPopover(null);
    const r = recById.get(id);
    if (r) setAnnounce(`Selected ${recipientName(r)}, ${r.fit.band} fit`);
    go(href.recipient(id));
  };
  const selectConnection = (id: string, x: number, y: number) => setPopover({ id, x, y });

  if (route.view === 'brief') {
    const r = recById.get(route.id);
    return data && engine ? (
      r ? (
        <Brief recipient={r} comparison={engine.compareFor(r)} data={data} engine={engine} />
      ) : (
        <main className="ts-page"><p>{COPY.unknownRoute}</p><a href={href.explore()}>Back to the map</a></main>
      )
    ) : (
      <main className="ts-page" aria-busy="true"><p>{COPY.loading}</p></main>
    );
  }

  const view = route.view;
  const popConn = popover ? connections.find((c) => c.id === popover.id) : null;
  const openCost = false;
  let card: React.ReactNode = null;
  if (data && engine) {
    if (selectedRecipient) {
      const c = engine.compareFor(selectedRecipient);
      card = (
        <RecipientPanel
          recipient={selectedRecipient}
          comparison={c}
          factorLabel={engine.factor.isFallback ? 'Fallback emission factors' : engine.factor.label}
          fallbackNote={data.fallback.prices ? 'Fallback prices (plan defaults)' : null}
          carbon={carbon}
          onCarbon={setCarbon}
          edited={carbon !== priceValues(data.prices).carbonPriceT}
          onReset={() => setCarbon(priceValues(data.prices).carbonPriceT)}
          sources={data.sources}
          onBrief={() => go(href.brief(selectedRecipient.id))}
          onMethod={() => go(href.method('costs'))}
          onHeading={setHeading}
          openCost={openCost}
        />
      );
    } else if (cardFacility && route.view === 'explore' && 'evidence' in route && route.evidence) {
      card = (
        <EvidencePanel
          facility={cardFacility}
          focusCommitmentId={route.commitmentId}
          onBack={() => {
            focusNext.current = false;
            go(href.facility(cardFacility.id));
            setTimeout(() => document.getElementById('ts-open-evidence')?.focus(), 0);
          }}
          onHeading={setHeading}
        />
      );
    } else if (cardFacility) {
      card = (
        <FacilityPanel
          facility={cardFacility}
          index={facIndex.get(cardFacility.id) ?? 1}
          connections={connections.filter((c) => c.facilityId === cardFacility.id)}
          onOpenEvidence={(fid, cid) => {
            focusNext.current = !cid;
            go(href.evidence(fid, cid));
          }}
          onSelectConnection={(id) => {
            const c = connections.find((x) => x.id === id);
            if (c?.recipientId) go(href.recipient(c.recipientId));
            else setPopover({ id, x: window.innerWidth / 2, y: window.innerHeight / 2 });
          }}
          onHeading={setHeading}
        />
      );
    }
  }

  const rail = (
    <Rail
      facilities={facilities}
      recipients={recipients}
      tab={tab}
      onTab={setTab}
      layers={layers}
      onLayer={(k) => setLayers((l) => ({ ...l, [k]: !l[k] }))}
      heatDisabled={!data?.meta}
      selectedId={selectedRecipient?.id ?? cardFacility?.id ?? null}
      onSelectFacility={(id) => {
        setDrawerOpen(false);
        selectFacility(id);
      }}
      onSelectRecipient={(id) => {
        setDrawerOpen(false);
        selectRecipient(id);
      }}
      together={totals}
      scale={scale}
      retrieved={retrieved}
      loading={!data}
    />
  );

  return (
    <div className={`ts-app ts-view-${view}`}>
      <h1 className="ts-visually-hidden">{COPY.h1}</h1>
      <header className="ts-header">
        <div className="ts-brand">
          <a className="ts-wordmark" href={href.explore()}>{COPY.wordmark}</a>
          <p className="ts-subline"><span className="ts-subline-dot" aria-hidden="true" />{COPY.subline}</p>
        </div>
        <nav className="ts-nav" aria-label="Main">
          <a href={href.explore()} aria-current={view === 'explore' ? 'page' : undefined}>Explore</a>
          <a href={href.records()} aria-current={view === 'records' ? 'page' : undefined}>Records</a>
          <a href={href.method()} aria-current={view === 'method' ? 'page' : undefined}>Method</a>
        </nav>
        {data && (
          <Search
            facilities={facilities}
            recipients={recipients}
            places={data.places}
            onFacility={selectFacility}
            onRecipient={selectRecipient}
          />
        )}
        <button type="button" className="ts-icon-btn ts-search-toggle" aria-label="Find a place"
          onClick={() => document.querySelector<HTMLInputElement>('.ts-search input')?.focus()}>
          <SearchIcon />
        </button>
      </header>
      {view === 'records' && data && engine && <Records data={data} engine={engine} />}
      {view === 'method' && <Method data={data} engine={engine} anchor={route.view === 'method' ? route.anchor : null} />}
      <main className="ts-stage" hidden={view !== 'explore'} aria-label="Explore">
        {data && (
          <MapView
            data={data}
            facilities={facilities}
            connections={connections}
            selection={sel && !unknownId ? sel : null}
            focusFacilityId={focusFacilityId}
            tab={tab}
            layers={layers}
            pitched={pitched}
            resetToken={resetToken}
            zoomDelta={zoomDelta}
            onSelectFacility={selectFacility}
            onSelectRecipient={selectRecipient}
            onSelectConnection={selectConnection}
            onBasemapError={() => setBasemapFailed(true)}
          />
        )}
        <div className="ts-rail-slot">{rail}</div>
        <button type="button" className="ts-pill ts-places-btn" aria-haspopup="dialog" onClick={() => setDrawerOpen(true)}>
          Places
        </button>
        {drawerOpen && (
          <div className="ts-drawer-wrap" role="dialog" aria-modal="true" aria-label="Places to investigate">
            <div className="ts-drawer">
              <button type="button" className="ts-icon-btn ts-drawer-close" aria-label="Close places" onClick={() => setDrawerOpen(false)}>
                <Close />
              </button>
              {rail}
            </div>
            <button type="button" className="ts-drawer-backdrop" aria-label="Close places" onClick={() => setDrawerOpen(false)} />
          </div>
        )}
        {unknownId && <p className="ts-notice ts-stage-notice" role="status">{COPY.unknownRoute}</p>}
        {data?.failed.length ? (
          <p className="ts-notice ts-stage-notice" role="alert">
            Couldn’t load {data.failed.join(', ')}. The map still works.{' '}
            <button type="button" className="ts-secondary" onClick={reload}>Retry</button>
          </p>
        ) : null}
        <div className={`ts-card-slot${sheetExpanded ? ' is-expanded' : ''}`}>
          <div className="ts-sheet-head">
            <button type="button" className="ts-secondary" onClick={() => setDrawerOpen(true)}>Places</button>
            <button type="button" className="ts-grabber" aria-expanded={sheetExpanded} aria-label="Expand panel"
              onClick={() => setSheetExpanded((v) => !v)} />
            <button type="button" className="ts-icon-btn" aria-label="Close" onClick={() => go(href.explore())}><Close /></button>
          </div>
          {card ?? (
            <section className="ts-panel ts-panel--card" aria-busy="true">
              <div className="ts-panel-body">
                <p className="ts-meta">{COPY.loading}</p>
                <div className="ts-skeleton" />
                <div className="ts-skeleton" />
              </div>
            </section>
          )}
        </div>
        <div className="ts-legend-slot">
          <Legend heatOn={layers.heat} breaks={data?.meta?.rampBreaksMwh ?? null} basemapFailed={basemapFailed} caption={caption} illustrative={false} />
        </div>
        <div className="ts-controls" role="group" aria-label="Map controls">
          <button type="button" aria-label="Zoom in" onClick={() => setZoomDelta((z) => ({ n: z.n + 1, d: 1 }))}><Plus /></button>
          <button type="button" aria-label="Zoom out" onClick={() => setZoomDelta((z) => ({ n: z.n + 1, d: -1 }))}><Minus /></button>
          <button type="button" aria-pressed={!pitched} onClick={() => setPitched((p) => !p)}>{pitched ? '2D' : '3D'}</button>
          <button type="button" aria-label="Reset view" onClick={() => { setPopover(null); go(href.explore()); setResetToken((t) => t + 1); }}><Reset /></button>
        </div>
        {popConn && popover && (
          <div className="ts-pop ts-conn-pop" role="dialog" aria-label={popConn.recipientName}
            style={{ left: Math.min(popover.x + 12, window.innerWidth - 300), top: Math.max(popover.y - 20, 8) }}>
            <p className="ts-pop-title">{popConn.recipientName}</p>
            <p>{KIND_WORD[popConn.kind]}{popConn.phase ? ` · ${popConn.phase}` : ''}</p>
            <p className="ts-meta">{COPY.notPipe}</p>
            <div className="ts-pop-actions">
              {popConn.recipientId && (
                <button type="button" className="ts-link" onClick={() => { focusNext.current = true; selectRecipient(popConn.recipientId!); }}>
                  Open recipient
                </button>
              )}
              <button type="button" className="ts-icon-btn" aria-label="Close" onClick={() => setPopover(null)}><Close /></button>
            </div>
          </div>
        )}
      </main>
      <footer className="ts-footer">
        <span>ThermoStat · McMaster P2P Hacks 2026 · {TEAM_CREDIT}</span>
        <a href={href.method('sources')}>Sources and method</a>
      </footer>
      <div className="ts-visually-hidden" aria-live="polite">{announce}</div>
    </div>
  );
}

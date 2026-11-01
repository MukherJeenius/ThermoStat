/** ThermoStat: one product, two lenses. Hash routes drive the view and the selection (spec 9.12). */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CostComparison, FactorSet, PriceValues, Recipient } from './contract/data-contract';
import { COPY } from './content/copy';
import { TEAM_CREDIT } from './content/credits';
import { loadAll, type AppData } from './data/load';
import { baseUrl } from './data/urls';
import { compare, networkScenario } from './engine/cost';
import { priceValues } from './engine/defaults';
import { date } from './engine/format';
import { together } from './engine/totals';
import { MapView } from './map/MapView';
import { href, parseRoute, type Route } from './state/route';
import { Close, Minus, Plus, Reset, Search as SearchIcon } from './ui/icons';
import { Intro } from './ui/Intro';
import { Legend } from './ui/Legend';
import { Wordmark } from './ui/Logo';
import { Rail, type LayerKey, type Tab } from './ui/Rail';
import { FacilityPreview, RecipientPreview } from './ui/PreviewCard';
import { recipientName } from './ui/RecipientPanel';
import { FacilityDetails, RecipientDetails } from './views/Details';
import { Search } from './ui/Search';
import { Brief } from './views/Brief';
import { Method } from './views/Method';
import { Records } from './views/Records';
import { KIND_WORD } from './content/copy';
import { LocalNotesStore, NotesContext } from './notes/store';
import { DEMO_STEPS, step as demoStepFor, type DemoContext } from './demo/tour';

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

// ?testhooks&notesdelay=ms slows note writes so scripts/notes-shots.mjs can capture the "Saving…" state
/** WebGL2 probe (spec 13): without it the map can't draw, and Records carries every record. */
function hasWebGL2(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
const WEBGL = hasWebGL2();
const FILE_WORD: Record<string, string> = {
  'facilities.json': 'facilities', 'connections.json': 'connections', 'sources.json': 'sources', 'recipients.geojson': 'recipients',
  'context-buildings.geojson': 'context buildings', 'network.geojson': 'the network', 'places.json': 'places',
  'prices.json': 'prices', 'factors.json': 'emission factors', 'meta.json': 'the record dates',
};

const notesParams = new URLSearchParams(window.location.search);
const notesStore = new LocalNotesStore(undefined, notesParams.has('testhooks') ? Number(notesParams.get('notesdelay')) || 0 : 0);

export function App() {
  const route = useHashRoute();
  const [data, setData] = useState<AppData | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ facilities: true, connections: true, buildings: true, heat: true });
  const [carbon, setCarbonState] = useState<number>(readCarbon);
  const [pitched, setPitched] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [zoomDelta, setZoomDelta] = useState({ n: 0, d: 0 });
  const [popover, setPopover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [announce, setAnnounce] = useState('');
  const [basemapFailed, setBasemapFailed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 10 });
  // the opening screen shows on a fresh visit; deep links, #demo and ?demo=1 go straight in
  const [intro, setIntro] = useState<'shown' | 'leaving' | 'gone'>(() => {
    const h = window.location.hash;
    const direct = new URLSearchParams(window.location.search).get('demo') === '1' || (h !== '' && h !== '#/explore');
    return direct ? 'gone' : 'shown';
  });
  const closeIntro = (then?: () => void) => {
    setIntro('leaving');
    then?.();
    window.setTimeout(() => setIntro('gone'), 450);
  };
  const [demo, setDemo] = useState<number | null>(() =>
    new URLSearchParams(window.location.search).get('demo') === '1' || window.location.hash === '#demo' ? 1 : null,
  );
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const setHeading = useCallback((el: HTMLHeadingElement | null) => {
    headingRef.current = el;
  }, []);
  const focusNext = useRef(false);

  // Esc closes the innermost open thing: the drawer, then the popover (spec 9.12)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (videoOpen) setVideoOpen(false);
      else if (drawerOpen) setDrawerOpen(false);
      else if (popover) setPopover(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, popover, videoOpen]);

  const reload = useCallback(() => {
    setData(null);
    loadAll((done, total) => setProgress({ done, total })).then(setData);
  }, []);
  useEffect(() => {
    loadAll((done, total) => setProgress({ done, total })).then(setData);
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

  // demo mode sets the carbon price per step and restores the sourced assumptions on exit (spec 12)
  const demoCtx = useMemo<DemoContext | null>(() => {
    if (!data) return null;
    const factor = data.factors.sets[data.factors.default] ?? data.factors.sets.eccc;
    return { facilities, connections, recipients, meta: data.meta, prices: priceValues(data.prices), factor };
  }, [data, facilities, connections, recipients]);
  const demoStep = demo && demoCtx && data?.meta ? demoStepFor(demo, demoCtx) : null;
  const effCarbon = demoStep ? demoStep.carbonPriceT : carbon;

  const engine = useMemo<Engine | null>(() => {
    if (!data) return null;
    const base = priceValues(data.prices);
    const carbon = effCarbon;
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
  }, [data, effCarbon]);

  const defaultFacilityId = data?.meta?.defaultFacilityId ?? 'hce-recovery-plant';
  const sel = route.view === 'explore' ? route.sel : null;
  // the tab follows the selection unless the viewer picked a tab for the current selection
  const selKey = sel ? `${sel.kind}:${sel.id}` : 'none';
  const [tabState, setTabState] = useState<{ tab: Tab; key: string }>({ tab: 'facilities', key: '' });
  const tab: Tab = demoStep
    ? demoStep.tab
    : tabState.key === selKey
      ? tabState.tab
      : sel?.kind === 'recipient'
        ? 'recipients'
        : sel?.kind === 'facility'
          ? 'facilities'
          : tabState.tab;
  const setTab = (t: Tab) => setTabState({ tab: t, key: selKey });

  // #demo starts the demo at any time, not only on page load
  useEffect(() => {
    const on = () => {
      if (window.location.hash === '#demo') {
        setDemo(1);
        setIntro('gone');
      }
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  // the route follows the demo step
  const demoHash = demoStep?.hash;
  useEffect(() => {
    if (demoHash) go(demoHash);
  }, [demoHash, demo]);
  useEffect(() => {
    if (demoStep?.n === 6) {
      const t = window.setTimeout(() => document.getElementById('ts-together')?.scrollIntoView({ block: 'nearest' }), 300);
      return () => window.clearTimeout(t);
    }
  }, [demoStep?.n]);

  // single-key shortcuts for the demo, ignored while typing (spec 9.12)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable || t.getAttribute('role') === 'combobox')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (demo === null) {
        if (e.key === 'd' || e.key === 'D') {
          if (!data?.meta) return;
          e.preventDefault();
          setDemo(1);
        }
        return;
      }
      const onButton = t?.tagName === 'BUTTON' || t?.classList.contains('maplibregl-canvas');
      if ((e.key === ' ' && !onButton) || (e.key === 'ArrowRight' && !onButton)) {
        e.preventDefault();
        setDemo((d) => Math.min(DEMO_STEPS, (d ?? 1) + 1));
      } else if (e.key === 'ArrowLeft' && !onButton) {
        e.preventDefault();
        setDemo((d) => Math.max(1, (d ?? 1) - 1));
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setDemo(1);
      } else if (e.key === 'Escape') {
        setDemo(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [demo, data]);

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
  let card: React.ReactNode = null;
  if (data && engine) {
    if (selectedRecipient) {
      const near = connections.find((c) => c.recipientId === selectedRecipient.id);
      const nearest = near ? facilities.find((f) => f.id === near.facilityId)?.name ?? null : null;
      card = <RecipientPreview key={selectedRecipient.id} recipient={selectedRecipient} comparison={engine.compareFor(selectedRecipient)} nearest={nearest} onHeading={setHeading} />;
    } else if (cardFacility) {
      card = (
        <FacilityPreview
          key={cardFacility.id}
          facility={cardFacility}
          connections={connections.filter((c) => c.facilityId === cardFacility.id)}
          onHeading={setHeading}
        />
      );
    }
  }

  const rail = (
    <Rail
      facilities={facilities}
      recipients={recipients}
      connections={connections}
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
    <NotesContext.Provider value={demo ? null : notesStore}>
    <div className={`ts-app ts-view-${view}${demoStep ? ' is-demo' : ''}${demoStep && !demoStep.showRail ? ' is-demo-norail' : ''}`}>
      <h1 className="ts-visually-hidden">{COPY.h1}</h1>
      <header className="ts-header">
        <div className="ts-brand">
          <a className="ts-wordmark" href={href.explore()} aria-label="ThermoStat home"
            onClick={(e) => { e.preventDefault(); setDemo(null); setIntro('shown'); }}>
            <Wordmark />
          </a>
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
      {view === 'records' && data && engine && <Records data={data} engine={engine} anchor={route.view === 'records' ? route.anchor : null} />}
      {view === 'method' && <Method data={data} engine={engine} anchor={route.view === 'method' ? route.anchor : null} />}
      {route.view === 'place' && data && engine && (() => {
        if (route.kind === 'facility') {
          const f = facilities.find((x) => x.id === route.id);
          return f ? (
            <FacilityDetails facility={f} connections={connections.filter((c) => c.facilityId === f.id)} anchor={route.anchor} />
          ) : (
            <main className="ts-detail"><p>{COPY.unknownRoute}</p><a href={href.explore()}>Back to the map</a></main>
          );
        }
        const r = recById.get(route.id);
        return r ? (
          <RecipientDetails
            recipient={r}
            comparison={engine.compareFor(r)}
            sources={data.sources}
            carbon={effCarbon}
            onCarbon={setCarbon}
            factorLabel={engine.factor.isFallback ? 'Fallback emission factors' : engine.factor.label}
            connections={connections}
            facilities={facilities}
          />
        ) : (
          <main className="ts-detail"><p>{COPY.unknownRoute}</p><a href={href.explore()}>Back to the map</a></main>
        );
      })()}
      <main className="ts-stage" hidden={view !== 'explore'} aria-label="Explore">
        {data && !WEBGL && (
          <div className="ts-nogl" role="note">
            <img src={baseUrl() + 'fallback/map.png'} alt="" />
            <p>This device can&apos;t draw the 3D map. Every record is in <a className="ts-link" href={href.records()}>Records</a>.</p>
          </div>
        )}
        {data && WEBGL && (
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
            demoCamera={demoStep?.camera ?? null}
            demoKey={demoStep?.n ?? null}
            arcKinds={demoStep?.arcKinds ?? null}
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
            Couldn’t load {data.failed.map((f) => FILE_WORD[f] ?? f).join(', ')}. The map still works.{' '}
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
        {demoStep && (
          <section className="ts-panel ts-caption" aria-label="Guided demo">
            <p className="ts-caption-step">Step {demoStep.n} of {DEMO_STEPS}</p>
            <p className="ts-caption-text" aria-live="polite">{demoStep.caption}</p>
            <div className="ts-caption-actions">
              <button type="button" className="ts-secondary" onClick={() => setDemo((d) => Math.max(1, (d ?? 1) - 1))} disabled={demoStep.n === 1}>
                Back
              </button>
              {demoStep.n < DEMO_STEPS ? (
                <button type="button" className="ts-primary" onClick={() => setDemo((d) => Math.min(DEMO_STEPS, (d ?? 1) + 1))}>
                  Next
                </button>
              ) : (
                <button type="button" className="ts-primary" onClick={() => setDemo(null)}>
                  Finish
                </button>
              )}
              <button type="button" className="ts-secondary ts-caption-exit" onClick={() => setDemo(null)}>
                Exit demo
              </button>
            </div>
          </section>
        )}
        <div className="ts-legend-slot" hidden={!keyOpen}>
          <Legend heatOn={layers.heat} breaks={data?.meta?.rampBreaksMwh ?? null} basemapFailed={basemapFailed} caption={caption} illustrative={false}
            layers={layers} onLayer={(k) => setLayers((l) => ({ ...l, [k]: !l[k] }))} onClose={() => setKeyOpen(false)} />
        </div>
        <div className="ts-controls" role="group" aria-label="Map controls">
          <button type="button" className="ts-key-btn" aria-expanded={keyOpen} aria-controls="ts-map-key" onClick={() => setKeyOpen((v) => !v)}>
            Map key
          </button>
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
      {videoOpen && (
        <div className="ts-video" role="dialog" aria-modal="true" aria-label="ThermoStat demo video">
          <div className="ts-video-frame">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- music only, no speech */}
            <video src={baseUrl() + 'demo/thermostat-demo.mp4'} controls autoPlay playsInline />
            <button type="button" className="ts-video-close" onClick={() => setVideoOpen(false)}>Close</button>
          </div>
        </div>
      )}
      {intro !== 'gone' && (
        <div className={intro === 'leaving' ? 'ts-intro-leave' : undefined}>
          <Intro
            progress={progress}
            ready={!!data}
            facts={data ? {
              facilities: facilities.length,
              recipients: recipients.filter((r) => r.rank).length,
              excerpts: facilities.reduce((n, f) => n + f.commitments.filter((c) => c.source).length, 0),
            } : null}
            figure={data ? {
              facilities: facilities.map((f) => f.position),
              buildings: recipients.filter((r) => r.rank).map((r) => r.position),
              arcs: connections.map((c) => [c.source, c.target]),
            } : null}
            briefHref={(() => { const top = recipients.find((r) => r.rank === 1); return top ? href.brief(top.id) : null; })()}
            onDemo={() => setVideoOpen(true)}
            onExplore={() => closeIntro(() => { setDemo(null); go(href.explore()); })}
          />
        </div>
      )}
    </div>
    </NotesContext.Provider>
  );
}

/** The Recipient brief (spec 11): one US Letter page, printed by the browser. No PDF library; nothing leaves the machine. */
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { CostComparison, Recipient } from '../contract/data-contract';
import type { Engine } from '../App';
import type { AppData } from '../data/load';
import { boilerYear } from '../engine/cost';
import { date, money, num, pctAbs } from '../engine/format';

/** Table cells share one unit so a column reads at a glance ($0.26M beside $6.50M, not $259,000 beside $6.50M). */
const moneyCol = (x: number | null | undefined) =>
  x === null || x === undefined || !Number.isFinite(x) ? money(x) : x === 0 ? '$0' : `$${(x / 1e6).toFixed(2)}M`;
import { bandPhrase } from '../engine/verdict';
import { BAND_WORD, COPY, METHOD_SENTENCE, QUALITY_WORD, recipientQuestion, TYPE_WORD } from '../content/copy';
import { TEAM_CREDIT } from '../content/credits';
import { href } from '../state/route';
import { recipientName } from '../ui/RecipientPanel';

const MERC = 6378137;
const toM = (lon: number, lat: number): [number, number] => [
  (lon * Math.PI * MERC) / 180,
  MERC * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
];

function CostChart({ c }: { c: CostComparison }) {
  const rows = [
    { key: 'gas', label: 'Keep gas', v: c.gas.pv20 },
    { key: 'heatpump', label: 'Own heat pump', v: c.heatpump.pv20 },
    { key: 'hce', label: 'Connect to HCE (assumed rate: gas parity)', v: c.hce.pv20 },
  ].sort((a, b) => a.v - b.v);
  const max = Math.max(...rows.map((r) => r.v));
  const W = 440;
  const labelW = 0;
  return (
    <svg className="ts-brief-chart" viewBox={`0 0 ${W} ${rows.length * 30}`} role="img" aria-label="20-year cost of each option">
      {rows.map((r, i) => {
        const w = Math.max(2, ((W - labelW - 70) * r.v) / max);
        return (
          <g key={r.key} transform={`translate(0 ${i * 30})`}>
            <text x="0" y="10" className="ts-chart-label">{r.label}</text>
            <rect x={labelW} y="14" width={w} height="12" fill={r.key === 'hce' ? '#1c5e7e' : '#a7b8c6'} />
            <text x={labelW + w + 6} y="24" className="ts-chart-value">{money(r.v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Locator({ r, data }: { r: Recipient; data: AppData }) {
  const feat = data.recipients.features.find((f) => f.id === r.id);
  const [cx, cy] = toM(r.position[0], r.position[1]);
  const R = 300;
  const W = 85;
  const H = 60;
  const scale = Math.min(W / (2 * R), H / (2 * R * (H / W))) ;
  const proj = (lon: number, lat: number) => {
    const [x, y] = toM(lon, lat);
    return [W / 2 + (x - cx) * (W / (2 * R)), H / 2 - (y - cy) * (W / (2 * R))] as const;
  };
  const ring = (coords: number[][]) => coords.map(([lon, lat]) => proj(lon, lat).join(',')).join(' ');
  const near = (data.context?.features ?? []).filter((f) => {
    const g = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
    const [x, y] = toM(g[0][0], g[0][1]);
    return Math.abs(x - cx) < R && Math.abs(y - cy) < R;
  });
  const network = data.network?.features ?? [];
  const route = network.find((f) => f.properties.role === 'route');
  const customers = network.filter((f) => f.properties.role === 'customer' || f.properties.role === 'plant');
  const routeQ = route?.properties.quality;
  const knownNearer = r.distances.quality === 'known_customer';
  const nearest = knownNearer
    ? customers
        .map((f) => f.geometry as { type: 'Point'; coordinates: number[] })
        .sort((a, b) => {
          const d = (p: number[]) => (toM(p[0], p[1])[0] - cx) ** 2 + (toM(p[0], p[1])[1] - cy) ** 2;
          return d(a.coordinates) - d(b.coordinates);
        })[0]
    : null;
  void scale;
  return (
    <figure className="ts-locator">
      <svg viewBox={`0 0 ${W} ${H}`} width="70mm" height="50mm" role="img" aria-label="Schematic locator">
        <rect x="0" y="0" width={W} height={H} fill="#fff" stroke="#d9d7d1" strokeWidth="0.3" />
        {near.map((f) =>
          f.geometry.type === 'Polygon' ? (
            <polygon key={f.id} points={ring(f.geometry.coordinates[0])} fill="#e6e4de" />
          ) : null,
        )}
        {route && !knownNearer && route.geometry.type === 'LineString' && (
          <polyline points={ring(route.geometry.coordinates)} fill="none" stroke="#716e67" strokeWidth="0.6" strokeDasharray="2 1.5" />
        )}
        {nearest && (() => {
          const [x, y] = proj(nearest.coordinates[0], nearest.coordinates[1]);
          return (
            <>
              <line x1={W / 2} y1={H / 2} x2={x} y2={y} stroke="#716e67" strokeWidth="0.5" strokeDasharray="2 1.5" />
              <circle cx={x} cy={y} r="1.2" fill="#716e67" />
            </>
          );
        })()}
        {feat && feat.geometry.type === 'Polygon' && <polygon points={ring(feat.geometry.coordinates[0])} fill="#292925" />}
        {feat && feat.geometry.type === 'MultiPolygon' && feat.geometry.coordinates.map((p, i) => <polygon key={i} points={ring(p[0])} fill="#292925" />)}
        <g transform={`translate(4 ${H - 5})`}>
          <line x1="0" y1="0" x2={(100 * W) / (2 * R)} y2="0" stroke="#292925" strokeWidth="0.6" />
          <text x="0" y="-1.5" className="ts-locator-text">100 m</text>
        </g>
        <g transform={`translate(${W - 6} 8)`}>
          <path d="M0 -4 L2 2 L0 1 L-2 2 Z" fill="#292925" />
          <text x="0" y="6" textAnchor="middle" className="ts-locator-text">N</text>
        </g>
      </svg>
      <figcaption>
        Schematic. The connection shown is not a pipe route. Nearest network element:{' '}
        {knownNearer ? 'a known customer' : routeQ === 'illustrative_route' ? 'the planned route (illustrative)' : 'the planned route (approximate)'}.
      </figcaption>
    </figure>
  );
}

export function Brief({ recipient: r, comparison: c, data, engine }: { recipient: Recipient; comparison: CostComparison; data: AppData; engine: Engine }) {
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const on = () => setFit(Math.min(1, (window.innerWidth - 32) / 816));
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  useEffect(() => {
    document.title = `Recipient brief: ${recipientName(r)} · ThermoStat`;
    return () => {
      document.title = 'ThermoStat';
    };
  }, [r]);
  const v = c.verdict;
  const by = boilerYear(r.boilerYearsLeft);
  const edited = c.assumptions === 'edited';
  const srcById = useMemo(() => new Map(data.sources.map((s) => [s.id, s])), [data.sources]);
  // the study passages behind the price rule, the route and the CO2 share
  const studyCites = ['src-study-no-green-premium', 'src-study-phase12-route', 'src-study-emissions-80']
    .map((id) => srcById.get(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const print = async () => {
    await document.fonts.ready;
    window.print();
  };
  const p = engine.prices;
  return (
    <div className="ts-brief-wrap">
      <div className="ts-brief-toolbar">
        <button type="button" className="ts-primary" onClick={print}>Print or save as PDF</button>
        <a className="ts-secondary" href={href.recipient(r.id)}>Back to the map</a>
        <p className="ts-meta">Your browser’s print dialog saves it as a PDF. Nothing is uploaded.</p>
      </div>
      <div className="ts-brief-fit" style={{ height: `${1056 * fit}px` }}>
        <article className="ts-brief" style={{ ['--fit' as string]: String(fit) }} aria-label="Recipient brief">
          <header className="ts-brief-mast">
            <span className="ts-brief-wordmark">THERMOSTAT</span>
            <span className="ts-brief-mast-r">
              <span>Recipient brief · {r.synthetic ? 'Illustrative' : 'Scenario'}</span>
              <span className="ts-brief-logo" aria-label="Placeholder for the HCE logo">HCE logo</span>
            </span>
          </header>
          <section className="ts-brief-title">
            <h1>{recipientName(r)}</h1>
            <span className="ts-double-rule" aria-hidden="true" />
            <p className="ts-brief-disclaimer">{COPY.disclaimer}</p>
            <p>
              {r.address ?? 'Address not in source data'} · {TYPE_WORD[r.type]} · {QUALITY_WORD[r.estimate.quality]} · Data as of{' '}
              {date(data.meta?.osmBase)}
            </p>
            <p className="ts-brief-flag">
              {[
                r.synthetic ? 'Illustrative building: generated data, not a real site.' : null,
                edited ? 'Uses edited assumptions, not the sourced defaults.' : null,
                data.fallback.prices ? 'Fallback prices (plan defaults)' : null,
                engine.factor.isFallback ? 'Fallback emission factors' : null,
                p.carbonPriceT > 0 ? `Carbon price: $${p.carbonPriceT} per tonne (scenario)` : 'Carbon price: none',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </section>
          <p className="ts-brief-lead">{v.sentence}</p>
          <p className="ts-brief-question">{recipientQuestion(r)}</p>
          <div className="ts-brief-grid">
            <div>
              <h2 className="ts-brief-h">Cost over 20 years</h2>
              <CostChart c={c} />
              <table className="ts-brief-table">
                <thead>
                  <tr><th /><th>Annual</th><th>Upfront</th><th>Per MWh</th><th>t CO2 a year</th><th>Added grid kW</th></tr>
                </thead>
                <tbody>
                  {([['Keep gas', c.gas], ['Own heat pump', c.heatpump], ['Connect to HCE', c.hce]] as const).map(([label, o]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td>{moneyCol(o.annual)}</td><td>{moneyCol(o.upfront)}</td><td>${num(o.levelized)}</td><td>{num(o.co2T)}</td><td>{num(o.gridKw)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Locator r={r} data={data} />
              <p className="ts-brief-cta">{COPY.briefCta}</p>
              <p className="ts-brief-review">Reviewed by ____________ on ____________</p>
            </div>
            <div>
              <h2 className="ts-brief-h">Why it fits</h2>
              <p><strong>{BAND_WORD[r.fit.band]} fit</strong> (score {r.fit.score} of 100)</p>
              <ul>{r.fit.reasons.slice(0, 2).map((x) => <li key={x}>{x}</li>)}</ul>
              {r.fit.missing.length > 0 && <p className="ts-brief-small">Not in source data: {r.fit.missing.join(', ')}.</p>}
              <h2 className="ts-brief-h">Heat demand</h2>
              <p>
                {num(r.estimate.annualHeatMwh)} MWh a year · building peak {num(r.estimate.peakHeatKw)} kW · network peak {num(r.estimate.networkKw)} kW.{' '}
                {QUALITY_WORD[r.estimate.quality]}: {METHOD_SENTENCE[r.estimate.method]}
              </p>
              <h2 className="ts-brief-h">What this means</h2>
              <ul>
                <li>Over 20 years, connecting is {bandPhrase(v.band, v.deltaPct)}.</li>
                <li>About {pctAbs(v.co2CutPct)} less CO2 than gas, with no added grid load at the building.</li>
                <li>
                  {v.heatPumpCaveat ??
                    `No boiler to replace: the gas option includes a boiler replacement in year ${by.year}${by.assumed ? ' (assumed)' : ''}.`}
                </li>
              </ul>
              <h2 className="ts-brief-h">Assumptions and sources</h2>
              <div className="ts-brief-assume">
                <p>
                  Gas ${p.gasPriceM3}/m³ all-in · electricity ${p.elecPriceKwh}/kWh · heat-pump COP {p.hpCop} (design {p.hpCopDesign}) · heat pump $
                  {num(p.hpCapexKw, 4)}/kW + ${p.elecUpgradeKw}/kW electrical · boiler ${p.boilerCapexKw}/kW, {p.boilerLife} years · discount rate{' '}
                  {Math.round(p.discountRate * 100)} % · prices dated {date(data.prices.gasPriceM3.date)}{edited ? ' · carbon price (edited)' : ''}.
                </p>
                <p>
                  HCE’s assumed rate is gas parity: fuel, maintenance and the boiler’s replacement spread over its life, about ${num(c.hceRate)}/MWh here.
                  Emission factors: {engine.factor.label}, {c.factorYear}. Distance: {r.distances.quality.replace('_', ' ')}.
                </p>
                <p>
                  {studyCites.map((s) => `${s.shortTitle}, page ${s.page}`).join('; ')}
                  {r.sourceIds.map((id) => srcById.get(id)?.shortTitle).filter(Boolean).length
                    ? `; ${r.sourceIds.map((id) => srcById.get(id)?.shortTitle).filter(Boolean).join('; ')}`
                    : ''}
                  .
                </p>
              </div>
            </div>
          </div>
          <footer className="ts-brief-foot">
            <span>Estimates, not a quote.</span>
            <span>{TEAM_CREDIT}</span>
            <span>Sources: ThermoStat → Method</span>
          </footer>
        </article>
      </div>
    </div>
  );
}

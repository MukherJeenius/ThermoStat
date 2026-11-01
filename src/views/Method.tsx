/** Method (spec 9.10), demo build: how to read ThermoStat, sources and licences, evidence counts, costs, data quality. */
import { useEffect } from 'react';
import type { Engine } from '../App';
import type { AppData } from '../data/load';
import { safeHttpsUrl } from '../data/urls';
import { date, num } from '../engine/format';
import { COPY, KIND_WORD, QUALITY_WORD, STATUS_LINE, STATUS_WORD } from '../content/copy';
import { TEAM_CREDIT } from '../content/credits';

const ATTRIBUTION = [
  '© OpenStreetMap contributors (ODbL)',
  'Basemap: Protomaps, © OpenStreetMap contributors',
  'Contains information licensed under the Open Government Licence – Ontario',
  'Contains information licensed under the Open Government Licence – Canada',
  'Excerpts from Hamilton Community Enterprises reports and City of Hamilton documents, quoted for review, with page references',
  'Fonts: Inter and Literata, SIL Open Font License',
  'Derived and modified by the ThermoStat team.',
];

export function Method({ data, engine, anchor }: { data: AppData | null; engine: Engine | null; anchor: string | null }) {
  useEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView();
  }, [anchor, data]);
  const meta = data?.meta;
  return (
    <main className="ts-page">
      <div data-crumb="METHOD">
        <h2 className="ts-page-title">How ThermoStat knows what it shows.</h2>
        <p className="ts-page-lede">Every figure has a source, a date and a quality word. Unknowns stay unknown.</p>
      </div>
      <section className="ts-panel ts-panel--flow" id="read">
        <h3>How to read ThermoStat</h3>
        <dl className="ts-facts">
          {(Object.keys(STATUS_WORD) as (keyof typeof STATUS_WORD)[]).map((k) => (
            <div key={k}><dt>{STATUS_WORD[k]}</dt><dd>{STATUS_LINE[k]}</dd></div>
          ))}
          {(Object.keys(KIND_WORD) as (keyof typeof KIND_WORD)[]).map((k) => (
            <div key={k}><dt>{KIND_WORD[k]}</dt><dd>{k === 'scenario' ? 'A team estimate; no evidence is claimed.' : 'Backed by at least one cited source.'}</dd></div>
          ))}
          {(Object.keys(QUALITY_WORD) as (keyof typeof QUALITY_WORD)[]).map((k) => (
            <div key={k}><dt>{QUALITY_WORD[k]}</dt><dd>{k === 'actual' ? 'From the building’s reported gas use.' : k === 'checked' ? 'Calibrated against Hamilton large-building reports.' : 'A starting intensity for its type.'}</dd></div>
          ))}
        </dl>
        <p>Arcs are not pipe routes. They join two endpoints.</p>
      </section>
      <section className="ts-panel ts-panel--flow" id="sources">
        <h3>Sources and licences</h3>
        <table className="ts-table ts-table--stack">
          <thead><tr><th data-type="text">Source</th><th data-type="text">Publisher</th><th data-type="text">Licence</th><th>Retrieved</th></tr></thead>
          <tbody>
            {(data?.sources ?? []).filter((s) => s.docKind === 'dataset' || s.id.startsWith('src-')).map((s) => {
              const url = safeHttpsUrl(s.url);
              return (
                <tr key={s.id}>
                  <td data-type="text" data-label="Source">{url ? <a className="ts-source" href={url} target="_blank" rel="noopener noreferrer">{s.shortTitle}</a> : s.shortTitle}{s.page ? `, page ${s.page}` : ''}</td>
                  <td data-type="text" data-label="Publisher">{s.publisher ?? 'Not in source data'}</td>
                  <td data-type="text" data-label="Licence">{s.licence ?? 'Not stated'}</td>
                  <td data-label="Retrieved">{date(s.retrievedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <ul>{ATTRIBUTION.map((a) => <li key={a}>{a}</li>)}</ul>
      </section>
      <section className="ts-panel ts-panel--flow" id="evidence">
        <h3>Evidence</h3>
        <p>
          Each excerpt is copied word for word from the cached document, at most 60 words, with its page. It shows as checked only after a
          person has compared it with the original page.
        </p>
        {meta && (
          <p>
            {meta.evidence.claims} claims: {meta.evidence.found} found, {meta.evidence.unknown} unknown, {meta.evidence.humanChecked} checked by a person.
          </p>
        )}
      </section>
      <section className="ts-panel ts-panel--flow" id="costs">
        <h3>Costs</h3>
        <p>
          HCE heat is priced at gas parity: the full cost of heating with an own gas boiler, that is fuel, maintenance and the boiler’s
          replacement spread over its life. At these prices that is about ${engine ? num(engine.compareFor({ estimate: { annualHeatMwh: 1000, peakHeatKw: 500 }, boilerYearsLeft: null } as never).hceRate) : '…'}/MWh.
        </p>
        <p>
          Each option is compared over 20 years at a {engine ? Math.round(engine.prices.discountRate * 100) : 5} % discount rate: upfront cost plus
          the present value of yearly costs, plus a boiler replacement for gas when it falls due. Heat pumps add grid load at the building
          (peak ÷ design COP); HCE adds none there.
        </p>
      </section>
      <section className="ts-panel ts-panel--flow" id="quality">
        <h3>Data quality</h3>
        {meta ? (
          <p>
            {meta.counts.recipients} recipients: {meta.counts.byQuality.actual} actual, {meta.counts.byQuality.checked} checked estimates,{' '}
            {meta.counts.byQuality.estimate} estimates only. Illustrative items: {meta.counts.synthetic}. Invalid items skipped: {data?.skipped ?? 0}.
            OpenStreetMap data as of {date(meta.osmBase)}.
          </p>
        ) : (
          <p>Not in source data</p>
        )}
        {data?.factors.climatiqReason && <p>Climatiq not used in this build: {data.factors.climatiqReason}.</p>}
      </section>
      <section className="ts-panel ts-panel--flow" id="about">
        <h3>About this project</h3>
        <p>{COPY.disclaimer}</p>
        <p>{TEAM_CREDIT}</p>
      </section>
    </main>
  );
}

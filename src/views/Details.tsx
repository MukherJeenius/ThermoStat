/** The details screen: one place, laid out to be read. Facilities show their promises in the documents' own words;
 *  recipients show why they fit, the 20-year cost comparison and the sources. */
import { useEffect } from 'react';
import type { CostComparison, Facility, HeatConnection, Recipient, SourceRecord } from '../contract/data-contract';
import { safeHttpsUrl } from '../data/urls';
import { boilerYear } from '../engine/cost';
import { date, money, num, pct } from '../engine/format';
import { BAND_WORD, COPY, FACILITY_KIND_WORD, KIND_WORD, METHOD_SENTENCE, QUALITY_WORD, recipientQuestion, STATUS_LINE, STATUS_WORD, TYPE_WORD } from '../content/copy';
import { href } from '../state/route';
import { ChevronLeft, ChevronRight, External } from '../ui/icons';
import { recipientName } from '../ui/RecipientPanel';

function useScrollTo(anchor: string | null, dep: unknown) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (anchor) document.getElementById(`ev-${anchor}`)?.scrollIntoView({ block: 'center' });
  }, [anchor, dep]);
}

function pageLabel(s: SourceRecord): string {
  if (s.page === null) return '';
  return /^PDF p\./.test(s.page) ? s.page : `page ${s.page}`;
}

export function FacilityDetails({ facility, connections, anchor }: { facility: Facility; connections: HeatConnection[]; anchor: string | null }) {
  useScrollTo(anchor, facility.id);
  const sourced = facility.commitments.filter((c) => c.source);
  const open = facility.commitments.filter((c) => !c.source);
  const counts = (['operational', 'proposed', 'scenario'] as const).map((k) => connections.filter((c) => c.kind === k).length);
  const positionNote =
    facility.positionQuality === 'illustrative' ? 'Position illustrative until traced from the study figure' : facility.positionQuality === 'approximate' ? 'Position approximate' : null;
  return (
    <main className="ts-detail">
      <a className="ts-detail-back" href={href.facility(facility.id)}>
        <ChevronLeft /> Back to the map
      </a>
      <header className="ts-detail-head">
        <p className="ts-detail-kicker">{FACILITY_KIND_WORD[facility.kind]}</p>
        <h1>{facility.name}</h1>
        <p className="ts-detail-meta">
          {facility.address ?? facility.locality}
          {facility.operator ? ` · ${facility.operator}` : ''}
          {positionNote ? ` · ${positionNote}` : ''}
        </p>
      </header>
      <dl className="ts-detail-glance">
        <div><dt>Promises on record</dt><dd>{sourced.length}</dd></div>
        <div><dt>Open questions</dt><dd>{open.length}</dd></div>
        <div><dt>Existing connections</dt><dd>{counts[0]}</dd></div>
        <div><dt>Proposed connections</dt><dd>{counts[1]}</dd></div>
      </dl>

      <section className="ts-detail-section">
        <h2><span>01</span>What was promised</h2>
        {sourced.length === 0 && <p className="ts-detail-empty">No promise on record yet. {COPY.notNonCompliance}</p>}
        {sourced.map((c) => {
          const s = c.source!;
          const url = safeHttpsUrl(s.url);
          return (
            <article className="ts-promise" key={c.id} id={`ev-${c.id}`}>
              <div className="ts-promise-side">
                <span className="ts-status-word">{STATUS_WORD[c.status]}</span>
                <span className="ts-promise-topic">{c.title}</span>
              </div>
              <div className="ts-promise-body">
                <blockquote className="ts-promise-quote">“{s.excerpt}”</blockquote>
                <p className="ts-promise-source">
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {s.shortTitle} <External />
                    </a>
                  ) : (
                    s.shortTitle
                  )}
                  {pageLabel(s) && <> · {pageLabel(s)}</>} · {s.documentDate ? `published ${date(s.documentDate)}` : 'publication date not in source data'} · retrieved {date(s.retrievedAt)}
                </p>
                <p className="ts-promise-note">
                  {c.interpretation ?? STATUS_LINE[c.status]}{' '}
                  {s.humanCheck ? `Checked against the original by ${s.humanCheck.checkedBy} on ${date(s.humanCheck.checkedOn)}.` : 'Not yet checked against the original by a person.'}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      {open.length > 0 && (
        <section className="ts-detail-section">
          <h2><span>02</span>Still open</h2>
          <ul className="ts-open-list">
            {open.map((c) => (
              <li key={c.id} id={`ev-${c.id}`}>
                <span className="ts-status-word">Unknown</span>
                <span>
                  <strong>{c.title}.</strong> {c.summary} {c.question && <em className="ts-open-q">{c.question}</em>}
                </span>
              </li>
            ))}
          </ul>
          <p className="ts-detail-fine">{COPY.notNonCompliance}</p>
        </section>
      )}

      {connections.length > 0 && (
        <section className="ts-detail-section">
          <h2><span>{open.length > 0 ? '03' : '02'}</span>Connections</h2>
          <ul className="ts-conn-rows">
            {connections.map((c) => (
              <li key={c.id}>
                <span>{c.recipientName}</span>
                <span className="ts-conn-kind" data-kind={c.kind}>{KIND_WORD[c.kind]}{c.phase ? `, ${c.phase}` : ''}</span>
                <a href={c.recipientId ? href.placeRecipient(c.recipientId) : href.connection(c.id)}>
                  {c.recipientId ? 'Details' : 'On the map'} <ChevronRight />
                </a>
              </li>
            ))}
          </ul>
          <p className="ts-detail-fine">Lines on the map join two places. They are not pipe routes.</p>
        </section>
      )}
    </main>
  );
}

function CostBars({ c }: { c: CostComparison }) {
  const rows = [
    { key: 'gas', label: 'Keep gas', o: c.gas, note: 'boiler replacement included' },
    { key: 'hce', label: 'Connect to HCE', o: c.hce, note: 'assumed rate: gas parity' },
    { key: 'heatpump', label: 'Own heat pump', o: c.heatpump, note: 'equipment and grid upgrade' },
  ];
  const max = Math.max(...rows.map((r) => r.o.pv20));
  return (
    <div className="ts-bars" role="table" aria-label="20-year cost of each option">
      {rows.map((r) => (
        <div className="ts-bar-row" role="row" key={r.key} data-option={r.key}>
          <span className="ts-bar-label" role="rowheader">
            {r.label}
            <small>{r.note}</small>
          </span>
          <span className="ts-bar-track" role="cell" aria-label={money(r.o.pv20)}>
            <span className="ts-bar-fill" style={{ width: `${(r.o.pv20 / max) * 100}%` }} />
          </span>
          <span className="ts-bar-value" role="cell">{money(r.o.pv20)}</span>
        </div>
      ))}
    </div>
  );
}

export function RecipientDetails({
  recipient: r, comparison: c, sources, carbon, onCarbon, factorLabel,
}: {
  recipient: Recipient;
  comparison: CostComparison;
  sources: SourceRecord[];
  carbon: number;
  onCarbon: (t: number) => void;
  factorLabel: string;
}) {
  useScrollTo(null, r.id);
  const v = c.verdict;
  const by = boilerYear(r.boilerYearsLeft);
  const srcById = new Map(sources.map((s) => [s.id, s]));
  return (
    <main className="ts-detail">
      <a className="ts-detail-back" href={href.recipient(r.id)}>
        <ChevronLeft /> Back to the map
      </a>
      <header className="ts-detail-head">
        <p className="ts-detail-kicker">{r.rank ? `Recipient ${r.rank} of 20` : 'Candidate building'}{r.synthetic ? ' · Illustrative' : ''}</p>
        <h1>{recipientName(r)}</h1>
        <p className="ts-detail-meta">
          {TYPE_WORD[r.type]}
          {r.address ? ` · ${r.address}` : ''} · {QUALITY_WORD[r.estimate.quality]}
        </p>
        <div className="ts-detail-actions">
          <a className="ts-primary" href={href.brief(r.id)}>Get the recipient brief <ChevronRight /></a>
        </div>
      </header>
      <dl className="ts-detail-glance">
        <div><dt>Fit</dt><dd>{BAND_WORD[r.fit.band]}<small>score {r.fit.score} of 100</small></dd></div>
        <div><dt>Heat a year</dt><dd>{num(r.estimate.annualHeatMwh, 2)} MWh<small>{QUALITY_WORD[r.estimate.quality].toLowerCase()}</small></dd></div>
        <div><dt>Cost vs gas, 20 years</dt><dd>{pct(v.deltaPct)}<small>{v.band === 'about_the_same' ? 'about the same' : v.band === 'costs_more' ? 'costs more' : 'cheaper'}</small></dd></div>
        <div><dt>CO2 vs gas</dt><dd>{pct(-v.co2CutPct)}<small>about {num(c.gas.co2T - c.hce.co2T, 2)} t less a year</small></dd></div>
      </dl>

      <section className="ts-detail-section">
        <h2><span>01</span>Why it fits</h2>
        <ul className="ts-reason-list">
          {r.fit.reasons.map((x) => <li key={x}>{x}</li>)}
        </ul>
        {r.fit.missing.length > 0 && <p className="ts-detail-fine">Not in source data: {r.fit.missing.join(', ')}.</p>}
        <p className="ts-detail-q">{recipientQuestion(r)}</p>
      </section>

      <section className="ts-detail-section">
        <h2><span>02</span>Cost over 20 years</h2>
        <p className="ts-detail-lead">{v.sentence}</p>
        <fieldset className="ts-segment" aria-label="Carbon price">
          <legend className="ts-visually-hidden">Carbon price</legend>
          {[{ t: 0, label: 'No carbon price' }, { t: 85, label: '$85 per tonne' }].map((o) => (
            <label key={o.t}>
              <input type="radio" name="ts-detail-carbon" checked={carbon === o.t} onChange={() => onCarbon(o.t)} />
              {o.label}
            </label>
          ))}
        </fieldset>
        <CostBars c={c} />
        <table className="ts-table ts-detail-table">
          <thead>
            <tr><th data-type="text">Option</th><th>Each year</th><th>Upfront</th><th>Per MWh</th><th>t CO2 a year</th><th>Added grid kW</th></tr>
          </thead>
          <tbody>
            {([['Keep gas', c.gas], ['Own heat pump', c.heatpump], ['Connect to HCE', c.hce]] as const).map(([label, o]) => (
              <tr key={label}>
                <td data-type="text">{label}</td>
                <td>{money(o.annual)}</td><td>{money(o.upfront)}</td><td>${num(o.levelized)}</td><td>{num(o.co2T)}</td><td>{num(o.gridKw)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {v.heatPumpCaveat && <p className="ts-detail-fine">{v.heatPumpCaveat}</p>}
        <p className="ts-detail-fine">
          Boiler replacement in year {by.year}{by.assumed ? ' (assumed)' : ''}. Emission factors: {factorLabel}, {c.factorYear}. HCE’s assumed rate is gas
          parity, about ${num(c.hceRate)}/MWh. <a href={href.method('costs')}>How this is calculated</a>
        </p>
      </section>

      <section className="ts-detail-section">
        <h2><span>03</span>Heat demand and sources</h2>
        <dl className="ts-detail-facts">
          <div><dt>Annual heat</dt><dd>{num(r.estimate.annualHeatMwh)} MWh</dd></div>
          <div><dt>Building peak</dt><dd>{num(r.estimate.peakHeatKw)} kW</dd></div>
          <div><dt>Network peak</dt><dd>{num(r.estimate.networkKw)} kW</dd></div>
          <div><dt>Floor area</dt><dd>{num(r.floorAreaM2)} m²</dd></div>
          <div><dt>Year built</dt><dd>{r.yearBuilt ?? 'Not in source data'}</dd></div>
          <div><dt>Distance</dt><dd>{r.distances.minM === null ? 'Not computed' : `${num(r.distances.minM, 2)} m`}</dd></div>
        </dl>
        <p className="ts-detail-fine">{QUALITY_WORD[r.estimate.quality]}. {METHOD_SENTENCE[r.estimate.method]}</p>
        <p className="ts-detail-fine">
          Sources: {r.sourceIds.map((id) => srcById.get(id)?.shortTitle ?? id).join(' · ')}. Estimates, not a quote. Carbon price: {carbon ? `$${carbon} per tonne (scenario)` : 'none'}.
        </p>
      </section>
    </main>
  );
}

/** The details screen: one place as a page of the record. Kicker, title, a fact table, the evidence in the documents'
 *  own words, the cost table, a figure, and the "prepared for" line. Missing values print "Unknown". */
import { useEffect, type ReactNode } from 'react';
import type { CostComparison, Facility, HeatConnection, Recipient, SourceRecord } from '../contract/data-contract';
import { safeHttpsUrl } from '../data/urls';
import { boilerYear } from '../engine/cost';
import { date, money, num } from '../engine/format';
import { BAND_WORD, COPY, FACILITY_KIND_WORD, KIND_WORD, METHOD_SENTENCE, QUALITY_WORD, recipientQuestion, STATUS_LINE, STATUS_WORD, TYPE_WORD } from '../content/copy';
import { href } from '../state/route';
import { facilityState, FACILITY_STATE_WORD, pageRef, two, Val } from '../ui/ledger';
import { recipientName } from '../ui/RecipientPanel';
import { Schematic } from '../ui/Schematic';
import { FieldNotes } from '../ui/FieldNotes';

function useScrollTo(anchor: string | null, dep: unknown) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (anchor) document.getElementById(`ev-${anchor}`)?.scrollIntoView({ block: 'center' });
  }, [anchor, dep]);
}

function Facts({ rows }: { rows: [string, ReactNode | null | undefined][] }) {
  return (
    <dl className="ts-facts-table">
      {rows.map(([k, v]) => (
        <div key={k}><dt className="ts-label">{k}</dt><dd><Val v={v} /></dd></div>
      ))}
    </dl>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ts-doc-section">
      <span className="ts-double-rule" aria-hidden="true" />
      <h2 className="ts-label ts-doc-h2">{title}</h2>
      {children}
    </section>
  );
}

function Quote({ n, s, id, note }: { n: number; s: SourceRecord; id: string; note?: string | null }) {
  const url = safeHttpsUrl(s.url);
  return (
    <li className="ts-doc-quote" id={`ev-${id}`}>
      <span className="ts-doc-n">{two(n)}</span>
      <div>
        <blockquote className="ts-quote">“{s.excerpt}”</blockquote>
        <p className="ts-quote-ref">
          {url ? <a href={url} target="_blank" rel="noopener noreferrer">{pageRef(s)}</a> : pageRef(s)}
        </p>
        {note && <p className="ts-doc-fine">{note}</p>}
      </div>
    </li>
  );
}

function Footer({ action }: { action?: ReactNode }) {
  return (
    <footer className="ts-doc-foot">
      <span className="ts-double-rule" aria-hidden="true" />
      <div className="ts-doc-foot-actions">
        {action}
        <button type="button" className="ts-link" onClick={() => window.print()}>Print</button>
      </div>
      <p className="ts-doc-fine">{COPY.disclaimer}</p>
    </footer>
  );
}

export function FacilityDetails({ facility, connections, anchor }: { facility: Facility; connections: HeatConnection[]; anchor: string | null }) {
  useScrollTo(anchor, facility.id);
  const sourced = facility.commitments.filter((c) => c.source);
  const open = facility.commitments.filter((c) => !c.source);
  const state = facilityState(facility, connections);
  const served = connections.filter((c) => c.kind !== 'scenario');
  const positionNote = facility.positionQuality === 'illustrative' ? 'Position illustrative' : facility.positionQuality === 'approximate' ? 'Position approximate' : null;
  return (
    <main className="ts-doc">
      <nav className="ts-doc-crumbs" aria-label="Breadcrumb">
        <a className="ts-link" href={href.facility(facility.id)}><span aria-hidden="true">←</span> Back to map</a>
        <span className="ts-label">FACILITIES / {facility.name.toUpperCase()}</span>
      </nav>
      <header className="ts-doc-head">
        <p className="ts-label">FACILITY · {FACILITY_KIND_WORD[facility.kind].toUpperCase()}{facility.synthetic ? ' · ILLUSTRATIVE' : ''}</p>
        <h1>{facility.name}</h1>
        <p className="ts-doc-meta">
          {facility.address ?? facility.locality}{facility.operator ? ` · ${facility.operator}` : ''}{positionNote ? ` · ${positionNote}` : ''}
        </p>
      </header>
      <span className="ts-double-rule" aria-hidden="true" />
      <Facts rows={[
        ['Kind', FACILITY_KIND_WORD[facility.kind]],
        ['Status', FACILITY_STATE_WORD[state]],
        ['Claimed capacity', null],
        ['Claim status', sourced.length ? sourced.map((c) => STATUS_WORD[c.status]).filter((w, i, a) => a.indexOf(w) === i).join(', ') : null],
        ['Operator', facility.operator],
        ['Buildings served', served.length || null],
      ]} />

      <Section title="The evidence">
        {sourced.length === 0 ? (
          <p className="ts-doc-empty">No promise on record. {COPY.notNonCompliance}</p>
        ) : (
          <ol className="ts-doc-list">
            {sourced.map((c, i) => (
              <Quote key={c.id} n={i + 1} s={c.source!} id={c.id}
                note={`${STATUS_WORD[c.status]}. ${c.interpretation ?? STATUS_LINE[c.status]} Retrieved ${date(c.source!.retrievedAt)}.`} />
            ))}
          </ol>
        )}
        {open.length > 0 && (
          <>
            <h3 className="ts-label ts-doc-h3">Still open</h3>
            <ul className="ts-doc-rows">
              {open.map((c) => (
                <li key={c.id} id={`ev-${c.id}`}>
                  <span className="ts-unknown">Unknown</span>
                  <span><strong>{c.title}.</strong> {c.summary} {c.question && <em>{c.question}</em>}</span>
                </li>
              ))}
            </ul>
            <p className="ts-doc-fine">{COPY.notNonCompliance}</p>
          </>
        )}
      </Section>

      <Section title="Buildings served">
        {connections.length === 0 ? (
          <p className="ts-doc-empty">Unknown</p>
        ) : (
          <ol className="ts-doc-rows ts-doc-rows--num">
            {connections.map((c, i) => (
              <li key={c.id}>
                <span className="ts-doc-n">{two(i + 1)}</span>
                <span>{c.recipientName}</span>
                <span className="ts-doc-kind">{KIND_WORD[c.kind]}{c.phase ? `, ${c.phase}` : ''}</span>
                <a className="ts-link" href={c.recipientId ? href.placeRecipient(c.recipientId) : href.connection(c.id)}>
                  {c.recipientId ? 'Details' : 'On the map'} <span aria-hidden="true">→</span>
                </a>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="See on map">
        <figure className="ts-frame ts-doc-fig">
          <a href={href.facility(facility.id)} aria-label="Open this facility on the map">
            <Schematic fig={{ facilities: [facility.position], buildings: connections.map((c) => c.target), arcs: connections.map((c) => [c.source, c.target]) }} />
          </a>
          <figcaption>Fig. 1. {facility.name} (brick) and the buildings it is linked to (ink). {COPY.legendNote}</figcaption>
        </figure>
      </Section>

      <FieldNotes key={facility.id} subject={{ kind: 'facility', id: facility.id }} place={facility.name} />

      <Footer />
    </main>
  );
}

export function RecipientDetails({
  recipient: r, comparison: c, sources, carbon, onCarbon, factorLabel, connections = [], facilities = [],
}: {
  recipient: Recipient;
  comparison: CostComparison;
  sources: SourceRecord[];
  carbon: number;
  onCarbon: (t: number) => void;
  factorLabel: string;
  connections?: HeatConnection[];
  facilities?: Facility[];
}) {
  useScrollTo(null, r.id);
  const v = c.verdict;
  const by = boilerYear(r.boilerYearsLeft);
  const srcById = new Map(sources.map((s) => [s.id, s]));
  const links = connections.filter((x) => x.recipientId === r.id);
  const nearFac = links.length ? facilities.find((f) => f.id === links[0].facilityId) ?? null : null;
  const evidence = (nearFac?.commitments ?? []).filter((x) => x.source).slice(0, 2);
  const opts = [
    { key: 'gas', label: 'Gas', o: c.gas },
    { key: 'heatpump', label: 'Heat pump', o: c.heatpump },
    { key: 'hce', label: 'District heat', o: c.hce },
  ];
  const lowest = opts.reduce((a, b) => (b.o.pv20 < a.o.pv20 ? b : a)).key;
  return (
    <main className="ts-doc">
      <nav className="ts-doc-crumbs" aria-label="Breadcrumb">
        <a className="ts-link" href={href.recipient(r.id)}><span aria-hidden="true">←</span> Back to map</a>
        <span className="ts-label">BUILDINGS / {r.rank ? `RANK ${r.rank}` : 'NOT RANKED'}</span>
      </nav>
      <header className="ts-doc-head">
        <p className="ts-label">BUILDING · {TYPE_WORD[r.type].toUpperCase()}{r.synthetic ? ' · ILLUSTRATIVE' : ''}</p>
        <h1>{recipientName(r)}</h1>
        <p className="ts-doc-meta"><Val v={r.address} /></p>
      </header>
      <span className="ts-double-rule" aria-hidden="true" />
      <Facts rows={[
        ['Kind', TYPE_WORD[r.type]],
        ['Status', r.rank ? `Ranked ${r.rank} of 20 · ${QUALITY_WORD[r.estimate.quality]}` : `Candidate, not ranked · ${QUALITY_WORD[r.estimate.quality]}`],
        ['Fit', `${BAND_WORD[r.fit.band]} (score ${r.fit.score} of 100)`],
        ['Annual heat demand', Number.isFinite(r.estimate.annualHeatMwh) ? `${num(r.estimate.annualHeatMwh, 2)} MWh a year` : null],
        ['Nearest facility', nearFac?.name],
        ['Year built', r.yearBuilt],
      ]} />

      <Section title="Why it fits">
        <ol className="ts-doc-rows ts-doc-rows--num">
          {r.fit.reasons.map((x, i) => <li key={x}><span className="ts-doc-n">{two(i + 1)}</span><span>{x}</span></li>)}
        </ol>
        {r.fit.missing.length > 0 && <p className="ts-doc-fine">Unknown: {r.fit.missing.join(', ')}.</p>}
        <p className="ts-doc-q">{recipientQuestion(r)}</p>
      </Section>

      <Section title="The evidence">
        {evidence.length === 0 ? (
          <p className="ts-doc-empty">Unknown. No quoted claim links this building to a facility.</p>
        ) : (
          <ol className="ts-doc-list">
            {evidence.map((x, i) => <Quote key={x.id} n={i + 1} s={x.source!} id={x.id} note={`${STATUS_WORD[x.status]}, from ${nearFac!.name}.`} />)}
          </ol>
        )}
      </Section>

      <Section title="What it would cost">
        <p className="ts-doc-lead">{v.sentence}</p>
        <div className="ts-tabs ts-doc-carbon" role="radiogroup" aria-label="Carbon price">
          {[{ t: 0, label: 'No carbon price' }, { t: 85, label: '$85 per tonne' }].map((o) => (
            <button key={o.t} type="button" role="radio" aria-checked={carbon === o.t} className="ts-tab" onClick={() => onCarbon(o.t)}>
              {o.label}
            </button>
          ))}
        </div>
        <div className="ts-doc-table-wrap">
          <table className="ts-cost">
            <thead>
              <tr>
                <th scope="col"><span className="ts-visually-hidden">Measure</span></th>
                {opts.map((o) => (
                  <th scope="col" key={o.key} className={o.key === lowest ? 'is-lowest' : undefined}>
                    {o.label}{o.key === lowest && <small>Lowest</small>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">Capital</th>{opts.map((o) => <td key={o.key}>{money(o.o.upfront)}</td>)}</tr>
              <tr><th scope="row">Annual</th>{opts.map((o) => <td key={o.key}>{money(o.o.annual)}</td>)}</tr>
              <tr><th scope="row">20-year</th>{opts.map((o) => <td key={o.key}>{money(o.o.pv20)}</td>)}</tr>
            </tbody>
          </table>
        </div>
        {v.heatPumpCaveat && <p className="ts-doc-fine">{v.heatPumpCaveat}</p>}
        <p className="ts-doc-fine">
          District heat assumes HCE’s rate at gas parity, about ${num(c.hceRate)}/MWh. Boiler replacement in year {by.year}{by.assumed ? ' (assumed)' : ''}.
          Emission factors: {factorLabel}, {c.factorYear}. {QUALITY_WORD[r.estimate.quality]}. {METHOD_SENTENCE[r.estimate.method]}{' '}
          Sources: {r.sourceIds.map((id) => srcById.get(id)?.shortTitle ?? id).join(' · ')}. Estimates, not a quote.{' '}
          <a className="ts-link" href={href.method('costs')}>How this is calculated <span aria-hidden="true">→</span></a>
        </p>
      </Section>

      <Section title="See on map">
        <figure className="ts-frame ts-doc-fig">
          <a href={href.recipient(r.id)} aria-label="Open this building on the map">
            <Schematic fig={{ facilities: nearFac ? [nearFac.position] : [], buildings: [r.position], arcs: links.map((x) => [x.source, x.target]) }} />
          </a>
          <figcaption>Fig. 1. {recipientName(r)} (ink){nearFac ? ` and ${nearFac.name} (brick)` : ''}. {COPY.legendNote}</figcaption>
        </figure>
      </Section>

      <FieldNotes key={r.id} subject={{ kind: 'recipient', id: r.id }} place={recipientName(r)} />

      <Footer action={<a className="ts-primary" href={href.brief(r.id)}>Add to brief</a>} />
    </main>
  );
}

/** Records (spec 9.9), demo build: facilities with every commitment, recipients to approach, connections. */
import type { Engine } from '../App';
import type { Recipient } from '../contract/data-contract';
import type { AppData } from '../data/load';
import { num, date } from '../engine/format';
import { BAND_WORD, KIND_WORD, QUALITY_WORD, STATUS_WORD, TYPE_WORD } from '../content/copy';
import { href } from '../state/route';
import { useEffect, useState } from 'react';
import { together } from '../engine/totals';
import { useNotesStore, type NoteSubject } from '../notes/store';
import { recipientName } from '../ui/RecipientPanel';

/** Your shortlist (spec 9.8): saved places with a remove button, and the Together totals for saved buildings. */
function Shortlist({ data, engine, focus }: { data: AppData; engine: Engine; focus: boolean }) {
  const store = useNotesStore();
  const [list, setList] = useState<NoteSubject[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    store?.shortlist().then(setList).catch(() => setFailed(true));
  }, [store]);
  useEffect(() => {
    if (focus && list) document.getElementById('shortlist')?.scrollIntoView({ block: 'start' });
  }, [focus, list]);
  if (!store) return null;
  const recById = new Map(data.recipients.features.map((f) => [f.properties.id, f.properties]));
  const facById = new Map(data.facilities.map((f) => [f.id, f]));
  const rows = (list ?? []).flatMap((s): { s: NoteSubject; name: string; to: string; r: Recipient | null }[] => {
    if (s.kind === 'recipient') {
      const r = recById.get(s.id);
      return r ? [{ s, name: recipientName(r), to: href.placeRecipient(r.id), r }] : [];
    }
    const f = facById.get(s.id);
    return f ? [{ s, name: f.name, to: href.placeFacility(f.id), r: null }] : [];
  });
  const recs = rows.flatMap((x) => (x.r ? [x.r] : []));
  const t = recs.length ? together(recs, engine.prices, engine.factor) : null;
  const remove = (s: NoteSubject) => store.setShortlisted(s, false).then(setList).catch(() => setFailed(true));
  return (
    <section className="ts-panel ts-panel--flow" id="shortlist" aria-busy={list === null && !failed}>
      <h3>Your shortlist</h3>
      {failed ? (
        <p className="ts-meta">Notes can&apos;t be saved in this browser, so there is no shortlist here.</p>
      ) : list === null ? (
        <p className="ts-meta">Loading your shortlist…</p>
      ) : rows.length === 0 ? (
        <>
          <p className="ts-shortlist-empty">Your investigation starts here.</p>
          <p className="ts-meta">Saved places are leads, not conclusions. Add one from any place&apos;s details page.</p>
        </>
      ) : (
        <ul className="ts-shortlist">
          {rows.map((x) => (
            <li key={`${x.s.kind}:${x.s.id}`}>
              <a className="ts-link" href={x.to}>{x.name}</a>
              <span className="ts-meta">{x.s.kind === 'facility' ? 'Facility' : 'Building'}</span>
              <button type="button" className="ts-link" aria-label={`Remove ${x.name} from your shortlist`} onClick={() => void remove(x.s)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      {t && (
        <div className="ts-totals">
          <p className="ts-label">TOGETHER · {t.count} {t.count === 1 ? 'BUILDING' : 'BUILDINGS'}</p>
          <dl>
            <dt>Heat a year</dt><dd>{num(t.annualMwh)} MWh</dd>
            <dt>Network peak</dt><dd>{num(t.networkMw, 2)} MW</dd>
            <dt>CO2 avoided a year</dt><dd>{num(t.co2AvoidedT)} t</dd>
          </dl>
          <p className="ts-meta">Notes stay in this browser. They are not evidence and are never published.</p>
        </div>
      )}
    </section>
  );
}

export function Records({ data, engine, anchor = null }: { data: AppData; engine: Engine; anchor?: string | null }) {
  const recipients = data.recipients.features.map((f) => f.properties).filter((r) => r.rank).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const facilities = data.facilities.filter((f) => !f.synthetic);
  const connections = data.connections.filter((c) => !c.synthetic);
  return (
    <main className="ts-page">
      <div data-crumb="RECORDS">
        <h2 className="ts-page-title">A quieter way to investigate.</h2>
        <p className="ts-page-lede">Every record on the map, as a readable list.</p>
      </div>
      <Shortlist data={data} engine={engine} focus={anchor === 'shortlist'} />
      <section className="ts-panel ts-panel--flow">
        <h3>Facilities</h3>
        {facilities.map((f) => (
          <details className="ts-row" key={f.id}>
            <summary><span>{f.name}</span><span className="ts-row-status">{f.commitments.length} records</span></summary>
            <div className="ts-row-body">
              {f.commitments.map((c) => (
                <div key={c.id} className="ts-record">
                  <p><strong>{c.title}</strong> · {STATUS_WORD[c.status]}</p>
                  {c.source ? (
                    <p className="ts-quote">“{c.source.excerpt}”<br /><span className="ts-meta">{c.source.shortTitle}{c.source.page ? `, page ${c.source.page}` : ''} · published {date(c.source.documentDate)} · retrieved {date(c.source.retrievedAt)}</span></p>
                  ) : (
                    <p className="ts-meta">Source not available.</p>
                  )}
                </div>
              ))}
              <a href={href.facility(f.id)}>Show on map</a>
            </div>
          </details>
        ))}
      </section>
      <section className="ts-panel ts-panel--flow">
        <h3>Recipients to approach</h3>
        <table className="ts-table ts-table--stack">
          <thead><tr><th>Rank</th><th data-type="text">Name</th><th data-type="text">Type</th><th data-type="text">Fit</th><th>MWh a year</th><th>Distance</th><th data-type="text">Quality</th><th /></tr></thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id}>
                <td data-label="Rank">{r.rank}</td>
                <td data-type="text" data-label="Name">{r.name ?? 'Unnamed building'}</td>
                <td data-type="text" data-label="Type">{TYPE_WORD[r.type]}</td>
                <td data-type="text" data-label="Fit">{BAND_WORD[r.fit.band]} fit</td>
                <td data-label="MWh a year">{num(r.estimate.annualHeatMwh)}</td>
                <td data-label="Distance">{r.distances.minM === null ? 'Not computed' : `${num(r.distances.minM, 2)} m`}</td>
                <td data-type="text" data-label="Quality">{QUALITY_WORD[r.estimate.quality]}</td>
                <td><a href={href.recipient(r.id)}>Show on map</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="ts-panel ts-panel--flow">
        <h3>Connections</h3>
        <table className="ts-table ts-table--stack">
          <thead><tr><th data-type="text">From</th><th data-type="text">To</th><th data-type="text">Kind</th><th data-type="text">Phase</th><th /></tr></thead>
          <tbody>
            {connections.map((c) => (
              <tr key={c.id}>
                <td data-type="text" data-label="From">{facilities.find((f) => f.id === c.facilityId)?.mapLabel ?? c.facilityId}</td>
                <td data-type="text" data-label="To">{c.recipientName}</td>
                <td data-type="text" data-label="Kind">{KIND_WORD[c.kind]}</td>
                <td data-type="text" data-label="Phase">{c.phase ?? '—'}</td>
                <td><a href={c.recipientId ? href.recipient(c.recipientId) : href.facility(c.facilityId)}>Show on map</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

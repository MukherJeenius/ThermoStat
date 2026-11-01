/** Records (spec 9.9), demo build: facilities with every commitment, recipients to approach, connections. */
import type { Engine } from '../App';
import type { AppData } from '../data/load';
import { num, date } from '../engine/format';
import { BAND_WORD, KIND_WORD, QUALITY_WORD, STATUS_WORD, TYPE_WORD } from '../content/copy';
import { href } from '../state/route';

export function Records({ data, engine }: { data: AppData; engine: Engine }) {
  void engine;
  const recipients = data.recipients.features.map((f) => f.properties).filter((r) => r.rank).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const facilities = data.facilities.filter((f) => !f.synthetic);
  const connections = data.connections.filter((c) => !c.synthetic);
  return (
    <main className="ts-page">
      <div>
        <h2 className="ts-page-title">A quieter way to investigate.</h2>
        <p className="ts-page-lede">Every record on the map, as a readable list.</p>
      </div>
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

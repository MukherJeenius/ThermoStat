/** The map's preview card: kicker, title, one meta line, four facts, one quote, and the way into details. */
import { useState } from 'react';
import type { CostComparison, Facility, HeatConnection, Recipient } from '../contract/data-contract';
import { BAND_WORD, TYPE_WORD } from '../content/copy';
import { href } from '../state/route';
import { facilityState, FACILITY_STATE_WORD, pageRef, StateWord, Val } from './ledger';
import { recipientName } from './RecipientPanel';

function CopyCitation({ text }: { text: string | null }) {
  const [done, setDone] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      className="ts-card-cite"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => setDone(true), () => setDone(false));
      }}
    >
      {done ? 'Citation copied' : 'Copy citation'}
    </button>
  );
}

export function FacilityPreview({ facility, connections, onHeading }: {
  facility: Facility;
  connections: HeatConnection[];
  onHeading?: (el: HTMLHeadingElement | null) => void;
}) {
  const sourced = facility.commitments.filter((c) => c.source);
  const lead = sourced[0];
  const state = facilityState(facility, connections);
  const served = new Set(connections.filter((c) => c.kind !== 'scenario').map((c) => c.recipientName)).size;
  const cite = lead?.source ? `${pageRef(lead.source)}. ${lead.source.url}` : null;
  return (
    <section className="ts-panel ts-panel--card ts-preview" aria-labelledby="ts-card-h2">
      <div className="ts-panel-body">
        <p className="ts-label ts-card-kicker">FACILITY · <StateWord s={state} /></p>
        <h2 id="ts-card-h2" tabIndex={-1} ref={onHeading}>{facility.name}</h2>
        <p className="ts-meta">{facility.address ?? facility.locality}{facility.synthetic ? ' · Illustrative' : ''}</p>
        <dl className="ts-kv">
          <div><dt>Claimed</dt><dd><Val v={null} /></dd></div>
          <div><dt>Status</dt><dd>{FACILITY_STATE_WORD[state]}</dd></div>
          <div><dt>Evidence</dt><dd>{sourced.length ? `${sourced.length} quoted` : <Val v={null} />}</dd></div>
          <div><dt>Buildings served</dt><dd>{served || <Val v={null} />}</dd></div>
        </dl>
        {lead?.source && (
          <blockquote className="ts-card-quote">
            <p className="ts-quote">“{lead.source.excerpt}”</p>
            <cite className="ts-quote-ref">{pageRef(lead.source)}</cite>
          </blockquote>
        )}
      </div>
      <div className="ts-actions">
        <a className="ts-primary" href={href.placeFacility(facility.id)} id="ts-open-details">View details</a>
        <CopyCitation text={cite} />
      </div>
    </section>
  );
}

export function RecipientPreview({ recipient: r, comparison: c, nearest, onHeading }: {
  recipient: Recipient;
  comparison: CostComparison;
  nearest?: string | null;
  onHeading?: (el: HTMLHeadingElement | null) => void;
}) {
  void c;
  return (
    <section className="ts-panel ts-panel--card ts-preview" aria-labelledby="ts-card-h2">
      <div className="ts-panel-body">
        <p className="ts-label ts-card-kicker">BUILDING · {BAND_WORD[r.fit.band].toUpperCase()} FIT{r.synthetic ? ' · ILLUSTRATIVE' : ''}</p>
        <h2 id="ts-card-h2" tabIndex={-1} ref={onHeading}>{recipientName(r)}</h2>
        <p className="ts-meta"><Val v={r.address} /></p>
        <dl className="ts-kv">
          <div><dt>Rank</dt><dd>{r.rank ? `${r.rank} of 20` : <Val v={null} />}</dd></div>
          <div><dt>Kind</dt><dd>{TYPE_WORD[r.type]}</dd></div>
          <div><dt>Fit</dt><dd>{BAND_WORD[r.fit.band]}</dd></div>
          <div><dt>Nearest facility</dt><dd><Val v={nearest} /></dd></div>
        </dl>
        {r.fit.reasons[0] && (
          <p className="ts-card-reason">
            <span className="ts-label">Why it fits</span>
            {r.fit.reasons[0]}
          </p>
        )}
      </div>
      <div className="ts-actions">
        <a className="ts-primary" href={href.placeRecipient(r.id)} id="ts-open-details">View details</a>
        <a className="ts-card-cite" href={href.brief(r.id)}>Get the brief</a>
      </div>
    </section>
  );
}

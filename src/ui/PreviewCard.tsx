/** The map's small preview card: what the selected place is, three facts, and the way into its details screen. */
import type { CostComparison, Facility, HeatConnection, Recipient } from '../contract/data-contract';
import { BAND_WORD, FACILITY_KIND_WORD, QUALITY_WORD, TYPE_WORD } from '../content/copy';
import { num, pct } from '../engine/format';
import { href } from '../state/route';
import { ChevronRight } from './icons';
import { recipientName } from './RecipientPanel';

export function FacilityPreview({ facility, connections, onHeading }: {
  facility: Facility;
  connections: HeatConnection[];
  onHeading?: (el: HTMLHeadingElement | null) => void;
}) {
  const sourced = facility.commitments.filter((c) => c.source);
  const open = facility.commitments.length - sourced.length;
  const lead = sourced[0] ?? facility.commitments[0];
  return (
    <section className="ts-panel ts-panel--card ts-preview" aria-labelledby="ts-card-h2">
      <div className="ts-panel-body">
        <p className="ts-kicker">{FACILITY_KIND_WORD[facility.kind]}{facility.synthetic ? ' / ILLUSTRATIVE' : ''}</p>
        <h2 id="ts-card-h2" tabIndex={-1} ref={onHeading}>{facility.name}</h2>
        <p className="ts-meta">{facility.address ?? facility.locality}</p>
        <dl className="ts-glance ts-glance--3">
          <div><dt>Promises</dt><dd>{sourced.length}</dd></div>
          <div><dt>Open questions</dt><dd>{open}</dd></div>
          <div><dt>Connections</dt><dd>{connections.filter((c) => c.kind !== 'scenario').length}</dd></div>
        </dl>
        {lead && <p className="ts-summary ts-preview-lead">{lead.summary}</p>}
      </div>
      <div className="ts-actions">
        <a className="ts-primary" href={href.placeFacility(facility.id)} id="ts-open-details">
          Open full details <ChevronRight />
        </a>
      </div>
    </section>
  );
}

export function RecipientPreview({ recipient: r, comparison: c, onHeading }: {
  recipient: Recipient;
  comparison: CostComparison;
  onHeading?: (el: HTMLHeadingElement | null) => void;
}) {
  const v = c.verdict;
  return (
    <section className="ts-panel ts-panel--card ts-preview" aria-labelledby="ts-card-h2">
      <div className="ts-panel-body">
        <p className="ts-kicker">{r.rank ? `RECIPIENT ${r.rank} OF 20` : 'CANDIDATE'}{r.synthetic ? ' / ILLUSTRATIVE' : ''}</p>
        <h2 id="ts-card-h2" tabIndex={-1} ref={onHeading}>{recipientName(r)}</h2>
        <p className="ts-meta">{TYPE_WORD[r.type]}{r.address ? ` · ${r.address}` : ''}</p>
        <dl className="ts-glance">
          <div><dt>Fit</dt><dd>{BAND_WORD[r.fit.band]}</dd></div>
          <div><dt>Heat a year</dt><dd>{num(r.estimate.annualHeatMwh, 2)}<small>MWh</small></dd></div>
          <div><dt>Cost vs gas</dt><dd>{pct(v.deltaPct)}</dd></div>
          <div><dt>CO2</dt><dd>{pct(-v.co2CutPct)}</dd></div>
        </dl>
        <p className="ts-preview-reason">{r.fit.reasons[0] ?? `${QUALITY_WORD[r.estimate.quality]}.`}</p>
      </div>
      <div className="ts-actions">
        <a className="ts-primary" href={href.placeRecipient(r.id)} id="ts-open-details">
          Open full details <ChevronRight />
        </a>
        <a className="ts-secondary" href={href.brief(r.id)}>Get the brief</a>
      </div>
    </section>
  );
}

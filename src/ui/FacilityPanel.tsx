/** Facility card (spec 9.5): the handoff's FacilityPanel, adapted. Rows show the team's summary, the status in words
 *  and a source line; the exact excerpt lives in the evidence record. */
import type { Facility, HeatConnection } from '../contract/data-contract';
import { date, two } from '../engine/format';
import { COPY, FACILITY_KIND_WORD, KIND_WORD, STATUS_LINE, STATUS_WORD } from '../content/copy';
import { ChevronRight } from './icons';

type Props = {
  facility: Facility;
  index: number;
  connections: HeatConnection[];
  onOpenEvidence: (facilityId: string, commitmentId?: string) => void;
  onSelectConnection: (id: string) => void;
  onHeading?: (el: HTMLHeadingElement | null) => void;
  openAll?: boolean;
};

export function sourceLine(s: NonNullable<Facility['commitments'][number]['source']>): string {
  const page = s.page === null ? '' : /^PDF p\./.test(s.page) ? `, ${s.page}` : `, page ${s.page}`;
  return `${s.shortTitle}${page} · ${s.documentDate ? `published ${date(s.documentDate)}` : 'publication date not in source data'}`;
}

export function FacilityPanel({ facility, index, connections, onOpenEvidence, onSelectConnection, onHeading, openAll }: Props) {
  const counts = (['operational', 'proposed', 'scenario'] as const).map((k) => [k, connections.filter((c) => c.kind === k).length] as const);
  const countText = counts
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k === 'operational' ? 'operating' : k === 'proposed' ? 'proposed' : n === 1 ? 'team scenario' : 'team scenarios'}`)
    .join(' · ');
  const question = facility.commitments.find((c) => c.question)?.question ?? null;
  const positionNote =
    facility.positionQuality === 'illustrative'
      ? facility.id === 'hce-recovery-plant'
        ? 'Position illustrative: not yet traced from the study figure'
        : 'Position illustrative'
      : facility.positionQuality === 'approximate'
        ? 'Position approximate'
        : null;
  return (
    <section className="ts-panel ts-panel--card" aria-labelledby="ts-card-h2">
      <div className="ts-panel-body">
        <p className="ts-kicker">
          SITE {two(index)} / {facility.synthetic ? 'ILLUSTRATIVE' : 'PUBLIC RECORD'}
        </p>
        <h2 id="ts-card-h2" tabIndex={-1} ref={onHeading}>
          {facility.name}
        </h2>
        <p className="ts-meta">
          {FACILITY_KIND_WORD[facility.kind]} · {facility.address ?? facility.locality}
          {positionNote && (
            <>
              <br />
              {positionNote}
            </>
          )}
        </p>
        {facility.commitments.length === 0 && <p className="ts-empty">No public records have been added yet.</p>}
        {facility.commitments.map((c, i) => (
          <details className="ts-row" key={c.id} open={openAll || i === 0}>
            <summary>
              <span className="ts-number">{two(i + 1)}</span>
              <span>{c.title}</span>
              <span className="ts-row-status">{STATUS_WORD[c.status]}</span>
            </summary>
            <div className="ts-row-body">
              <p className="ts-summary">{c.summary}</p>
              <p className="ts-status">
                Evidence status: {STATUS_WORD[c.status]}. {c.interpretation ?? STATUS_LINE[c.status]}
              </p>
              {c.source ? (
                <>
                  <p className="ts-meta">{sourceLine(c.source)}</p>
                  <button type="button" className="ts-source ts-link" onClick={() => onOpenEvidence(facility.id, c.id)}>
                    Read the source passage <ChevronRight />
                  </button>
                </>
              ) : (
                <p className="ts-meta">{COPY.noSource}</p>
              )}
            </div>
          </details>
        ))}
        <details className="ts-row">
          <summary>
            <span className="ts-number">{two(facility.commitments.length + 1)}</span>
            <span>Connections</span>
            <span className="ts-row-status">{countText || 'None'}</span>
          </summary>
          <div className="ts-row-body">
            {connections.length === 0 ? (
              <p>No connections on record.</p>
            ) : (
              <ul className="ts-conn-list">
                {connections.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="ts-link" onClick={() => onSelectConnection(c.id)}>
                      {c.recipientName}
                    </button>
                    <span className="ts-status"> · {KIND_WORD[c.kind]}{c.phase ? `, ${c.phase}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
        {question && (
          <div className="ts-question-block">
            <p className="ts-label">A QUESTION WORTH ASKING</p>
            <p className="ts-question">{question}</p>
          </div>
        )}
      </div>
      <div className="ts-actions">
        <button type="button" className="ts-primary" id="ts-open-evidence" onClick={() => onOpenEvidence(facility.id)}>
          Open evidence record <ChevronRight />
        </button>
      </div>
    </section>
  );
}

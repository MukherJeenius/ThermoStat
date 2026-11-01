/** The evidence record (spec 9.7, Mockup-2 left): every promise in its own words, with page and dates. */
import { useEffect } from 'react';
import type { Facility } from '../contract/data-contract';
import { safeHttpsUrl } from '../data/urls';
import { date, two } from '../engine/format';
import { COPY, STATUS_LINE, STATUS_WORD } from '../content/copy';
import { ChevronLeft, External } from './icons';

type Props = {
  facility: Facility;
  focusCommitmentId: string | null;
  onBack: () => void;
  onHeading?: (el: HTMLHeadingElement | null) => void;
};

export function EvidencePanel({ facility, focusCommitmentId, onBack, onHeading }: Props) {
  const allUnknown = facility.commitments.every((c) => !c.source);
  const question = facility.commitments.find((c) => c.id === focusCommitmentId)?.question ?? facility.commitments.find((c) => c.question)?.question;
  useEffect(() => {
    if (!focusCommitmentId) return;
    const el = document.getElementById(`ev-${focusCommitmentId}`);
    el?.scrollIntoView({ block: 'nearest' });
    el?.focus({ preventScroll: true });
  }, [focusCommitmentId]);
  return (
    <section className="ts-panel ts-panel--card" aria-labelledby="ts-card-h2">
      <div className="ts-panel-body">
        <button type="button" className="ts-back" onClick={onBack}>
          <ChevronLeft /> {facility.name}
        </button>
        <p className="ts-kicker ts-kicker--plain">THE EVIDENCE RECORD</p>
        <h2 id="ts-card-h2" tabIndex={-1} ref={onHeading}>
          {allUnknown ? 'No promise on record yet.' : 'A promise, in its own words.'}
        </h2>
        {facility.commitments.map((c, i) => {
          const s = c.source;
          const url = s ? safeHttpsUrl(s.url) : null;
          return (
            <article className="ts-evidence" key={c.id} id={`ev-${c.id}`} tabIndex={-1}>
              {s ? (
                <>
                  <p className="ts-label">
                    <span className="ts-number">{two(i + 1)}</span>
                    {STATUS_WORD[c.status].toUpperCase()} / {s.shortTitle.toUpperCase()}
                  </p>
                  <p className="ts-quote">“{s.excerpt}”</p>
                  <p className="ts-interp">{c.interpretation ?? STATUS_LINE[c.status]}</p>
                  <p className="ts-meta ts-evidence-meta">
                    {url ? (
                      <a className="ts-source" href={url} target="_blank" rel="noopener noreferrer">
                        Original document <External />
                      </a>
                    ) : (
                      'Original document'
                    )}
                    {s.page !== null && <> · {/^PDF p\./.test(s.page) ? s.page : `Page ${s.page}`}</>}
                    {' · '}{s.documentDate ? `Published ${date(s.documentDate)}` : 'Publication date not in source data'} · Retrieved {date(s.retrievedAt)}
                  </p>
                  <p className="ts-meta">
                    {s.humanCheck
                      ? `Checked against the original by ${s.humanCheck.checkedBy} on ${date(s.humanCheck.checkedOn)}`
                      : COPY.notChecked}
                  </p>
                </>
              ) : (
                <>
                  <p className="ts-label">
                    <span className="ts-number">{two(i + 1)}</span>
                    {c.topic.toUpperCase()} / NO PUBLIC RECORD
                  </p>
                  <p className="ts-quote ts-quote--empty">Source not available.</p>
                  <p className="ts-interp">{COPY.notNonCompliance}</p>
                </>
              )}
            </article>
          );
        })}
        {question && (
          <div className="ts-question-block">
            <p className="ts-label">YOUR NEXT QUESTION</p>
            <p className="ts-question">{question}</p>
          </div>
        )}
      </div>
    </section>
  );
}

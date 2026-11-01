/** "Your field notes" on a details screen: the shortlist toggle, a ruled notes field and an honest save status (spec 9.8, 10). */
import { useEffect, useId, useState } from 'react';
import { sameSubject, useNotesStore, type NoteSubject } from '../notes/store';
import { statusText, useNoteDraft } from '../notes/useNoteDraft';

export function FieldNotes({ subject, place }: { subject: NoteSubject; place: string }) {
  const store = useNotesStore();
  const draft = useNoteDraft(store, subject);
  const [listed, setListed] = useState<boolean | null>(null);
  const id = useId();

  useEffect(() => {
    let live = true;
    store
      ?.shortlist()
      .then((l) => live && setListed(l.some((s) => sameSubject(s, subject))))
      .catch(() => live && setListed(null));
    return () => {
      live = false;
    };
  }, [store, subject.kind, subject.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!store) return null; // demo mode never reads or writes notes

  const toggle = () =>
    store
      .setShortlisted(subject, !listed)
      .then((l) => setListed(l.some((s) => sameSubject(s, subject))))
      .catch(() => setListed(null));

  const s = draft.state;
  return (
    <section className="ts-doc-section ts-notes-block" aria-labelledby={`${id}-h`}>
      <span className="ts-double-rule" aria-hidden="true" />
      <h2 className="ts-label ts-doc-h2" id={`${id}-h`}>Your field notes</h2>
      <div className="ts-notes-row">
        <button type="button" className="ts-btn-outline" aria-pressed={!!listed} onClick={toggle} disabled={listed === null && s.kind === 'failed'}>
          {listed ? `On your shortlist · Remove` : `Add ${place} to your shortlist`}
        </button>
        <a className="ts-link" href="#/records#shortlist">See your shortlist <span aria-hidden="true">→</span></a>
      </div>
      <label className="ts-label ts-note-label" htmlFor={`${id}-t`}>Notes — {place}</label>
      <textarea
        id={`${id}-t`}
        className="ts-notes"
        value={draft.text}
        placeholder="What changed? What remains unanswered?"
        onChange={(e) => draft.change(e.target.value)}
        onBlur={() => draft.state.kind === 'unsaved' && void draft.save()}
      />
      <p className={`ts-note-status is-${s.kind}`} role="status" aria-live="polite">
        {statusText(s)}
        {s.kind === 'failed' && s.reason !== 'unavailable' && s.reason !== 'conflict' && (
          <button type="button" className="ts-link" onClick={() => void draft.save()}>Retry</button>
        )}
        {s.kind === 'failed' && s.reason === 'conflict' && (
          <>
            <button type="button" className="ts-link" onClick={() => void draft.loadNewer()}>Load the newer note</button>
            <button type="button" className="ts-link" onClick={() => void draft.keepMine()}>Keep mine</button>
          </>
        )}
      </p>
      <p className="ts-doc-fine">Notes stay in this browser. They are not evidence and are never published.</p>
    </section>
  );
}

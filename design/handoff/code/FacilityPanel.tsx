import type { Facility } from './data-contract';
import './tokens.css';

type Props = {
  facility: Facility;
  onOpenEvidence: (facilityId: string) => void;
  onSaveNote: (facilityId: string) => void;
};
/** Place in the map container at top/right:24px on desktop. Parent owns positioning. */
export function FacilityPanel({ facility, onOpenEvidence, onSaveNote }: Props) {
  return <section className="ts-panel" aria-label={`${facility.name} evidence`}>
    <p className="ts-kicker">Site record {facility.synthetic ? '/ demonstration' : ''}</p>
    <h2>{facility.name}</h2>
    <p className="ts-meta">{facility.locality}</p>
    {facility.commitments.length === 0 && <p className="ts-empty">No public records have been added yet.</p>}
    {facility.commitments.map((item, i) => <details className="ts-row" key={item.id} open={i === 0}>
      <summary><span className="ts-number">{String(i + 1).padStart(2, '0')}</span>{item.title}</summary>
      <div className="ts-row-body">
        <p className="ts-quote">{item.summary}</p>
        <p className="ts-status">Evidence status: {item.status}</p>
        {item.source ? <>
          <p>{item.source.synthetic && 'Illustrative excerpt: '}{item.source.excerpt}</p>
          {/^https:\/\//i.test(item.source.url) && <a className="ts-source" href={item.source.url} target="_blank" rel="noopener noreferrer">Read original record ↗</a>}
        </> : <p>Source not available. This claim cannot currently be checked here.</p>}
        {item.question && <p>Question to follow: {item.question}</p>}
      </div>
    </details>)}
    <div className="ts-actions">
      <button className="ts-primary" onClick={() => onOpenEvidence(facility.id)}>Open evidence record ↗</button>
      <button className="ts-secondary" onClick={() => onSaveNote(facility.id)}>Save a note +</button>
    </div>
  </section>;
}
/** A controlled notes component. Persist privately through the parent after a debounce.
 * Do not present a successful save until the persistence request has completed. */
export function FieldNotes({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <section className="ts-panel" aria-label="Your field notes">
    <p className="ts-kicker">Your field notes</p>
    <h2>Keep the question.</h2>
    <p className="ts-meta">Notes are leads, not conclusions.</p>
    <label className="ts-note-label" htmlFor="ts-notes">YOUR NOTES</label>
    <textarea id="ts-notes" className="ts-notes" value={value} onChange={e=>onChange(e.target.value)} placeholder="What changed? What remains unanswered?" />
  </section>;
}

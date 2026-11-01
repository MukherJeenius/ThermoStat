/** The opening screen: a plain, centred greeting on solid paper, a loading line over the real data files, and two
 *  clear ways in. One text colour, one accent. */
import { useEffect, useRef } from 'react';
import { LogoMark } from './Logo';

type Props = {
  progress: { done: number; total: number };
  ready: boolean;
  facts: { facilities: number; recipients: number; excerpts: number } | null;
  onDemo: () => void;
  onExplore: () => void;
};

const STEPS = [
  { n: '01', title: 'Read the promises', text: 'What was promised about Hamilton’s waste heat, quoted from the documents, with page numbers.' },
  { n: '02', title: 'Find who to connect', text: 'Buildings near the heat network, ranked for Hamilton Community Enterprises, with plain reasons.' },
  { n: '03', title: 'Compare the cost', text: 'Gas, an own heat pump or district heat over 20 years, and a one-page brief to print.' },
];

export function Intro({ progress, ready, facts, onDemo, onExplore }: Props) {
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (ready) primary.current?.focus({ preventScroll: true });
  }, [ready]);
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="ts-home" role="dialog" aria-modal="true" aria-labelledby="ts-home-title">
      <header className="ts-home-bar">
        <span className="ts-home-brand">
          <LogoMark size={26} />
          <span>ThermoStat</span>
        </span>
        <span className="ts-home-event">McMaster P2P Hacks 2026</span>
      </header>
      <main className="ts-home-main">
        <p className="ts-home-kicker">
          <span className="ts-home-dot" aria-hidden="true" />
          Hamilton waste-heat field notes
        </p>
        <h1 id="ts-home-title" className="ts-home-title">THERMOSTAT</h1>
        <p className="ts-home-tag">
          Every promise has a place.
          <span>Who to connect first, and why.</span>
        </p>
        <p className="ts-home-lede">
          Hamilton plans to pipe industrial waste heat to its hospital and downtown. ThermoStat maps what has been promised and
          which buildings Hamilton Community Enterprises should approach first.
        </p>
        <div className="ts-home-actions">
          <button ref={primary} type="button" className="ts-home-primary" onClick={onExplore} disabled={!ready}>
            Explore the map
          </button>
          <button type="button" className="ts-home-link" onClick={onDemo} disabled={!ready}>
            Watch the demo <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="ts-home-load" aria-live="polite">
          {ready ? (
            <dl className="ts-home-stats">
              <div><dt>Facilities</dt><dd>{facts?.facilities ?? 0}</dd></div>
              <div><dt>Buildings scored</dt><dd>{facts?.recipients ?? 0}</dd></div>
              <div><dt>Sourced excerpts</dt><dd>{facts?.excerpts ?? 0}</dd></div>
            </dl>
          ) : (
            <div className="ts-home-loading">
              <div className="ts-home-bar-track" role="progressbar" aria-label="Loading public records" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <span style={{ width: `${Math.max(4, pct)}%` }} />
              </div>
              <p>Loading Hamilton’s public records · {progress.done} of {progress.total}</p>
            </div>
          )}
        </div>
      </main>
      <section className="ts-home-how" aria-labelledby="ts-home-how-title">
        <h2 id="ts-home-how-title">How it works</h2>
        <ol>
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="ts-home-n">{s.n}</span>
              <span className="ts-home-step">{s.title}</span>
              <span className="ts-home-text">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>
      <footer className="ts-home-foot">
        Public records and estimates, labelled as such. Prepared for Hamilton Community Enterprises; an independent student project,
        not produced or endorsed by HCE.
      </footer>
    </div>
  );
}

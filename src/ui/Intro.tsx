/** The homepage: a printed public record. Masthead, a headline with one action, Fig. 1, three figures from the data,
 *  how to read it, and a colophon with the disclaimer. Ink on paper; brick means heat. */
import { useEffect, useRef } from 'react';
import { ArrowRight, BookOpen, Building, FileText, Play, MapIcon } from './icons';
import { LogoMark } from './Logo';
import { useReveal } from './reveal';
import { COPY } from '../content/copy';
import { Schematic, type SchematicData } from './Schematic';
import { UNKNOWN } from './ledger';

type Props = {
  progress: { done: number; total: number };
  ready: boolean;
  facts: { facilities: number; recipients: number; excerpts: number } | null;
  figure?: SchematicData | null;
  briefHref?: string | null;
  onDemo: () => void;
  onExplore: () => void;
};

const HOW = [
  { n: '01', icon: FileText, title: 'Evidence', text: 'Every promise is quoted from a public document with its page number. Where no record exists, the page says Unknown rather than guessing.' },
  { n: '02', icon: Building, title: 'Fit', text: 'Buildings near the heat network are ranked by size, distance, heating system and timing. The fit is a word (Strong, Possible, Weak), with the reasons beside it.' },
  { n: '03', icon: BookOpen, title: 'Cost', text: 'For each building: keep gas, buy an own heat pump, or join district heat, compared over 20 years. Estimates, not quotes, and labelled as such.' },
];

const fig = (n: number | undefined) => (n === undefined || n === null ? UNKNOWN : String(n));

export function Intro({ progress, ready, facts, figure, briefHref, onDemo, onExplore }: Props) {
  const primary = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useReveal(root, ready);
  useEffect(() => {
    if (ready) primary.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
  }, [ready]);
  return (
    <div className="ts-home" ref={root} role="dialog" aria-modal="true" aria-labelledby="ts-home-title">
      <header className="ts-home-mast">
        <span className="ts-label ts-home-brand"><LogoMark size={22} />THERMOSTAT</span>
        <span className="ts-home-edition">43.26° N · 79.87° W — Hamilton, Ontario · Nov 2026</span>
      </header>
      <main className="ts-home-grid">
        <div className="ts-home-lead" data-reveal>
          <p className="ts-label">A PUBLIC RECORD</p>
          <h1 id="ts-home-title" className="ts-home-title">Hamilton’s factories have promised heat. <em>Here is who it should reach first.</em></h1>
          <p className="ts-home-deck">
            ThermoStat maps what Hamilton’s industrial sites have promised about their waste heat, quoted with page numbers,
            and ranks the nearby buildings worth connecting first, with the cost of gas, a heat pump or district heat side by side.
          </p>
          <div className="ts-home-actions">
            <button ref={primary} type="button" className="ts-primary" onClick={onExplore} disabled={!ready}><MapIcon /> Open the map <ArrowRight /></button>
            {briefHref && <a className="ts-link" href={briefHref}>Read the brief <span aria-hidden="true">→</span></a>}
            <button type="button" className="ts-link ts-link--muted" onClick={onDemo} disabled={!ready}><Play size={14} /> Watch the demo</button>
          </div>
          {!ready && <p className="ts-home-loading" aria-live="polite">Loading Hamilton’s public records · {progress.done} of {progress.total}</p>}
        </div>
        <figure className="ts-frame ts-home-fig" data-reveal data-reveal-d="1">
          {figure ? <Schematic fig={figure} /> : <div className="ts-home-fig-empty" />}
          <figcaption>Fig. 1 — Facilities (squares) and candidate buildings (dots). Arcs join endpoints, not pipe routes.</figcaption>
        </figure>
      </main>
      <section className="ts-home-section ts-home-band" aria-label="The record in figures" data-reveal>
        <span className="ts-double-rule" aria-hidden="true" />
        <dl className="ts-home-figures">
          <div><dt className="ts-label">Facilities tracked</dt><dd>{fig(facts?.facilities)}</dd></div>
          <div><dt className="ts-label">Quoted claims</dt><dd>{fig(facts?.excerpts)}</dd></div>
          <div><dt className="ts-label">Buildings ranked</dt><dd>{fig(facts?.recipients)}</dd></div>
        </dl>
      </section>
      <section className="ts-home-section" aria-labelledby="ts-home-how" data-reveal>
        <span className="ts-double-rule" aria-hidden="true" />
        <h2 id="ts-home-how" className="ts-label ts-home-h2">How to read this</h2>
        <ol className="ts-home-how">
          {HOW.map((s, i) => (
            <li key={s.n} data-reveal data-reveal-d={String(i + 1)}>
              <div className="ts-home-step-top"><s.icon size={22} /><span className="ts-home-n">{s.n}</span></div>
              <h3>{s.title}</h3><p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <footer className="ts-home-colophon">
        <p>{COPY.disclaimer}</p>
        <p>Data: public documents from the City of Hamilton, Hamilton Community Enterprises, FVB Energy, the Government of Ontario and Natural Resources Canada, quoted with page numbers; buildings from OpenStreetMap contributors. Costs are team estimates.</p>
      </footer>
    </div>
  );
}

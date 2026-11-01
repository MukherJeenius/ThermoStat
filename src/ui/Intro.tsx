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
  { n: '01', icon: FileText, title: 'Evidence', text: 'Each promise is quoted with its page. No record? It says Unknown.' },
  { n: '02', icon: Building, title: 'Fit', text: 'Nearby buildings ranked Strong, Possible or Weak, with the reasons.' },
  { n: '03', icon: BookOpen, title: 'Cost', text: 'Gas, a heat pump or district heat over 20 years. Estimates, labelled.' },
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
      <header className="ts-hm-mast">
        <span className="ts-hm-brand"><LogoMark size={22} />THERMOSTAT</span>
        <span className="ts-readout ts-hm-edition">43.26° N · 79.87° W · Hamilton · Nov 2026</span>
      </header>
      <main className="ts-hm-hero">
        <div className="ts-hm-lead" data-reveal>
          <p className="ts-label ts-hm-eyebrow">A public record</p>
          <h1 id="ts-home-title" className="ts-hm-title">Hamilton’s factories promised heat. <em>Who should get it first?</em></h1>
          <p className="ts-hm-deck">Their waste-heat promises, quoted with page numbers. The nearby buildings to connect first, with costs.</p>
          <div className="ts-home-actions">
            <button ref={primary} type="button" className="ts-primary" onClick={onExplore} disabled={!ready}><MapIcon /> Open the map <ArrowRight /></button>
            {briefHref && <a className="ts-link" href={briefHref}>Read the brief <span aria-hidden="true">→</span></a>}
            <button type="button" className="ts-link ts-link--muted" onClick={onDemo} disabled={!ready}><Play size={14} /> Watch the demo</button>
          </div>
          {!ready && <p className="ts-home-loading" aria-live="polite">Loading Hamilton’s public records · {progress.done} of {progress.total}</p>}
        </div>
        <div className="ts-hm-field">
          <figure className="ts-hm-fig" data-reveal data-reveal-d="1">
            {figure ? <Schematic fig={figure} /> : <div className="ts-home-fig-empty" />}
            <figcaption>Fig. 1 — Facilities (squares), buildings (dots). Arcs join endpoints, not pipe routes.</figcaption>
          </figure>
        </div>
      </main>
      <section className="ts-hm-tiles" aria-label="The record in figures">
        <dl>
          <div className="ts-hm-tile is-night" data-reveal><dt>Facilities tracked</dt><dd>{fig(facts?.facilities)}</dd></div>
          <div className="ts-hm-tile is-flare" data-reveal data-reveal-d="1"><dt>Quoted claims</dt><dd>{fig(facts?.excerpts)}</dd></div>
          <div className="ts-hm-tile is-paper" data-reveal data-reveal-d="2"><dt>Buildings ranked</dt><dd>{fig(facts?.recipients)}</dd></div>
        </dl>
      </section>
      <section className="ts-hm-how" aria-labelledby="ts-home-how">
        <h2 id="ts-home-how" className="ts-hm-h2">How to read it</h2>
        <ol>
          {HOW.map((s, i) => (
            <li key={s.n} data-reveal data-reveal-d={String(i + 1)}>
              <span className="ts-hm-n">{s.n}</span>
              <s.icon size={24} />
              <h3>{s.title}</h3><p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <footer className="ts-hm-foot">
        <p>{COPY.disclaimer}</p>
        <p>Data: public documents from the City of Hamilton, Hamilton Community Enterprises, FVB Energy, the Government of Ontario and Natural Resources Canada, quoted with page numbers; buildings from OpenStreetMap contributors. Costs are team estimates.</p>
      </footer>
    </div>
  );
}

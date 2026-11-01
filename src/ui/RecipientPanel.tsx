/** Recipient card (spec 9.6): fit in words, gas vs own heat pump vs HCE over 20 years, carbon and grid, demand. */
import { useEffect, useRef } from 'react';
import type { CostComparison, Recipient, SourceRecord } from '../contract/data-contract';
import { boilerYear } from '../engine/cost';
import { BAND_WORD, COPY, METHOD_SENTENCE, QUALITY_WORD, recipientQuestion, TYPE_WORD } from '../content/copy';
import { date, money, NOT_IN_SOURCE, num, pct, pctAbs, two } from '../engine/format';
import { ChevronRight } from './icons';

type Props = {
  recipient: Recipient;
  comparison: CostComparison;
  factorLabel: string;
  fallbackNote: string | null;
  carbon: number;
  onCarbon: (t: number) => void;
  edited: boolean;
  onReset: () => void;
  sources: SourceRecord[];
  onBrief: () => void;
  onMethod: () => void;
  onHeading?: (el: HTMLHeadingElement | null) => void;
  openRow?: number;
};

const STATUS = { about_the_same: 'About the same', costs_more: 'Costs more', cheaper: 'Cheaper' } as const;

export function recipientName(r: Recipient): string {
  if (r.name) return r.name;
  if (r.address) return `Unnamed building, ${r.address}`;
  return `Unnamed ${TYPE_WORD[r.type].toLowerCase()}`;
}

export function CostTable({ c }: { c: CostComparison }) {
  const rows = [
    { key: 'gas', label: 'Keep gas', o: c.gas, small: null },
    { key: 'heatpump', label: 'Own heat pump', o: c.heatpump, small: null },
    { key: 'hce', label: 'Connect to HCE', o: c.hce, small: 'assumed rate: gas parity' },
  ];
  return (
    <table className="ts-table ts-table--stack" role="table">
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" data-type="text">Option</th>
          <th role="columnheader">20-year cost</th>
          <th role="columnheader">Per MWh</th>
          <th role="columnheader">Upfront</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map((r) => (
          <tr role="row" key={r.key} data-option={r.key}>
            <td role="cell" data-type="text">
              {r.label}
              {r.small && <small>{r.small}</small>}
            </td>
            <td role="cell" data-label="20-year cost">{money(r.o.pv20)}</td>
            <td role="cell" data-label="Per MWh">${num(r.o.levelized)}</td>
            <td role="cell" data-label="Upfront">{money(r.o.upfront)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RecipientPanel(p: Props) {
  const { onHeading } = p;
  const costRef = useRef<HTMLDetailsElement>(null);
  const openRow = p.openRow;
  // when a step opens the cost row, bring it to the top of the card body
  useEffect(() => {
    if (openRow !== 1 || !costRef.current) return;
    const body = costRef.current.closest('.ts-panel-body');
    if (body) body.scrollTop += costRef.current.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
  }, [openRow]);
  const r = p.recipient;
  const c = p.comparison;
  const v = c.verdict;
  const by = boilerYear(r.boilerYearsLeft);
  const srcById = new Map(p.sources.map((s) => [s.id, s]));
  return (
    <section className="ts-panel ts-panel--card" aria-labelledby="ts-card-h2">
      <div className="ts-panel-body">
        <p className="ts-kicker">
          {r.rank ? `RECIPIENT ${two(r.rank)}` : 'CANDIDATE'} / {r.synthetic ? 'ILLUSTRATIVE' : 'SCENARIO'}
        </p>
        <h2 id="ts-card-h2" tabIndex={-1} ref={onHeading}>
          {recipientName(r)}
        </h2>
        <p className="ts-meta">
          {TYPE_WORD[r.type]}
          {r.address ? ` · ${r.address}` : ''} · {QUALITY_WORD[r.estimate.quality]}
        </p>
        <dl className="ts-glance" aria-label="At a glance">
          <div><dt>Fit</dt><dd>{BAND_WORD[r.fit.band]}<small>score {r.fit.score} of 100</small></dd></div>
          <div><dt>Heat a year</dt><dd>{num(r.estimate.annualHeatMwh, 2)}<small>MWh · {QUALITY_WORD[r.estimate.quality].toLowerCase()}</small></dd></div>
          <div><dt>Cost vs gas</dt><dd>{pct(v.deltaPct)}<small>over 20 years</small></dd></div>
          <div><dt>CO2 vs gas</dt><dd>{pct(-v.co2CutPct)}<small>a year</small></dd></div>
        </dl>
        {p.edited && (
          <p className="ts-notice" role="status">
            Using your assumptions ·{' '}
            <button type="button" className="ts-link" onClick={p.onReset}>
              Reset
            </button>
          </p>
        )}
        <details className="ts-row" open={(p.openRow ?? 0) === 0}>
          <summary>
            <span className="ts-number">01</span>
            <span>Why it fits</span>
            <span className="ts-row-status">{BAND_WORD[r.fit.band]} fit</span>
          </summary>
          <div className="ts-row-body">
            <p>
              <strong className="ts-fit-word">{BAND_WORD[r.fit.band]} fit</strong>{' '}
              <span className="ts-fit-score">score {r.fit.score} of 100</span>
            </p>
            <ul className="ts-reasons">
              {r.fit.reasons.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            {r.fit.missing.length > 0 && <p className="ts-meta">Not in source data: {r.fit.missing.join(', ')}.</p>}
          </div>
        </details>
        <details className="ts-row" open={p.openRow === 1} ref={costRef}>
          <summary>
            <span className="ts-number">02</span>
            <span>Cost over 20 years</span>
            <span className="ts-row-status">{STATUS[v.band]}</span>
          </summary>
          <div className="ts-row-body">
            <p className="ts-verdict">{v.sentence}</p>
            <CostTable c={c} />
            <fieldset className="ts-segment" aria-label="Carbon price">
              <legend className="ts-visually-hidden">Carbon price</legend>
              {[
                { t: 0, label: 'None today' },
                { t: 85, label: '$85 per tonne' },
              ].map((o) => (
                <label key={o.t}>
                  <input type="radio" name="ts-carbon" checked={p.carbon === o.t} onChange={() => p.onCarbon(o.t)} />
                  {o.t === 0 ? `Carbon price: ${o.label}` : o.label}
                </label>
              ))}
            </fieldset>
            <p className="ts-meta">
              Boiler replacement in year {by.year}
              {by.assumed ? ' (assumed)' : ''}.{' '}
              <button type="button" className="ts-source ts-link" onClick={p.onMethod}>
                How this is calculated <ChevronRight />
              </button>
            </p>
          </div>
        </details>
        <details className="ts-row">
          <summary>
            <span className="ts-number">03</span>
            <span>Carbon and grid</span>
            <span className="ts-row-status">about {pctAbs(v.co2CutPct)} less CO2</span>
          </summary>
          <div className="ts-row-body">
            <table className="ts-table ts-table--stack" role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader" data-type="text">Option</th>
                  <th role="columnheader">t CO2 a year</th>
                  <th role="columnheader">Added grid kW</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {(
                  [
                    ['gas', 'Keep gas', c.gas],
                    ['heatpump', 'Own heat pump', c.heatpump],
                    ['hce', 'Connect to HCE', c.hce],
                  ] as const
                ).map(([k, label, o]) => (
                  <tr role="row" key={k} data-option={k}>
                    <td role="cell" data-type="text">{label}</td>
                    <td role="cell" data-label="t CO2 a year">{num(o.co2T)}</td>
                    <td role="cell" data-label="Added grid kW">{num(o.gridKw)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ts-meta">
              Emission factors: {p.factorLabel}, {c.factorYear}.{p.fallbackNote ? ` ${p.fallbackNote}.` : ''}
            </p>
            {v.heatPumpCaveat && <p>{v.heatPumpCaveat}</p>}
          </div>
        </details>
        <details className="ts-row">
          <summary>
            <span className="ts-number">04</span>
            <span>Heat demand and sources</span>
            <span className="ts-row-status">{QUALITY_WORD[r.estimate.quality]}</span>
          </summary>
          <div className="ts-row-body">
            <dl className="ts-facts">
              <dt>Annual heat</dt>
              <dd>{num(r.estimate.annualHeatMwh)} MWh</dd>
              <dt>Building peak</dt>
              <dd>{num(r.estimate.peakHeatKw)} kW</dd>
              <dt>Network peak</dt>
              <dd>{num(r.estimate.networkKw)} kW</dd>
              <dt>Floor area</dt>
              <dd>
                {num(r.floorAreaM2)} m²{r.floorAreaMethod === 'assumed_3_levels' ? ' (3 levels assumed)' : ''}
              </dd>
              <dt>Year built</dt>
              <dd>{r.yearBuilt ?? NOT_IN_SOURCE}</dd>
            </dl>
            <p className="ts-meta">
              {QUALITY_WORD[r.estimate.quality]}. {METHOD_SENTENCE[r.estimate.method]}
            </p>
            <ul className="ts-sources">
              {r.sourceIds.map((id) => {
                const s = srcById.get(id);
                return <li key={id}>{s ? `${s.shortTitle}, retrieved ${date(s.retrievedAt)}` : id}</li>;
              })}
            </ul>
          </div>
        </details>
        <div className="ts-question-block">
          <p className="ts-label">A QUESTION WORTH ASKING</p>
          <p className="ts-question">{recipientQuestion(r)}</p>
        </div>
        {r.synthetic && <p className="ts-meta">Illustrative building: generated data, not a real site.</p>}
      </div>
      <div className="ts-actions">
        <button type="button" className="ts-primary" id="ts-get-brief" onClick={p.onBrief}>
          Get the recipient brief <ChevronRight />
        </button>
      </div>
      <span hidden>{COPY.notPipe}</span>
    </section>
  );
}

/** Legend card (spec 9.3): the same shapes, colours and line patterns as the map, items inline. */
import { HEAT_RAMP, MAP } from './mapTokens';
import { COPY } from '../content/copy';
import { num } from '../engine/format';

function Dot({ r, fill, ring }: { r: number; fill?: string; ring?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      {ring ? (
        <>
          <circle cx="7" cy="7" r={r} fill="none" stroke={MAP.surface} strokeWidth="3" />
          <circle cx="7" cy="7" r={r} fill="none" stroke={ring} strokeWidth="1.5" />
        </>
      ) : (
        <circle cx="7" cy="7" r={r} fill={fill} stroke={MAP.surface} strokeWidth="1.5" />
      )}
    </svg>
  );
}

function Line({ color, dash }: { color: string; dash?: string }) {
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true">
      <line x1="2" y1="6" x2="22" y2="6" stroke={MAP.surface} strokeWidth="5" strokeLinecap="round" />
      <line x1="2" y1="6" x2="22" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={dash} />
    </svg>
  );
}

export function Legend({ heatOn, breaks, basemapFailed, caption, illustrative }: {
  heatOn: boolean;
  breaks: readonly number[] | null;
  basemapFailed: boolean;
  caption: string;
  illustrative: boolean;
}) {
  return (
    <section className="ts-panel ts-legend" aria-label="Legend">
      <ul>
        <li><Dot r={5} fill={MAP.attention} /> Source</li>
        <li><Dot r={3.5} fill={MAP.secondary} /> Connected or proposed customer</li>
        <li><Dot r={4} ring={MAP.secondary} /> Recipient to approach</li>
      </ul>
      <ul>
        <li><Line color={MAP.attention} /> Operating (public record)</li>
        <li><Line color={MAP.attention} dash="6 4" /> Proposed (HCE study)</li>
        <li><Line color={MAP.secondary} dash="1 3" /> Scenario (team estimate)</li>
      </ul>
      <p className="ts-legend-note">{COPY.legendNote}</p>
      {heatOn && breaks && (
        <div className="ts-ramp">
          <div className="ts-ramp-strip" aria-hidden="true">
            {HEAT_RAMP.map((c) => <span key={c} style={{ background: c }} />)}
          </div>
          <p className="ts-ramp-labels">
            <span>Estimated annual heat demand, MWh a year:</span> under {num(breaks[0], 2)} · {breaks.map((b) => num(b, 2)).join(' · ')} and up
          </p>
        </div>
      )}
      {illustrative && <p className="ts-legend-note">Illustrative items are labelled</p>}
      {basemapFailed && <p className="ts-legend-note">Basemap unavailable</p>}
      <p className="ts-legend-caption">{caption}</p>
    </section>
  );
}

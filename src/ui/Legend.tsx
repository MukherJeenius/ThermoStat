/** Legend card (spec 9.3): the same shapes, colours and line patterns as the map, grouped and inline. */
import { HEAT_RAMP, MAP } from './mapTokens';
import { COPY } from '../content/copy';
import { num } from '../engine/format';

const ROUTE = HEAT_RAMP[4];

function Dot({ r, fill, ring, halo }: { r: number; fill?: string; ring?: string; halo?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      {halo && <circle cx="9" cy="9" r="8.5" fill={MAP.attention} opacity="0.18" />}
      {ring ? (
        <>
          <circle cx="9" cy="9" r={r} fill="none" stroke={MAP.surface} strokeWidth="3" />
          <circle cx="9" cy="9" r={r} fill="none" stroke={ring} strokeWidth="1.5" />
        </>
      ) : (
        <circle cx="9" cy="9" r={r} fill={fill} stroke={MAP.surface} strokeWidth="1.5" />
      )}
    </svg>
  );
}

function Line({ color, dash, width = 2, opacity = 1 }: { color: string; dash?: string; width?: number; opacity?: number }) {
  return (
    <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden="true">
      <line x1="3" y1="6" x2="25" y2="6" stroke={MAP.surface} strokeWidth={width + 2.5} strokeLinecap="round" />
      <line x1="3" y1="6" x2="25" y2="6" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dash} opacity={opacity} />
    </svg>
  );
}

const LAYER_LABEL = { facilities: 'Heat sources', connections: 'Connections', buildings: 'Buildings', heat: 'Heat demand colours' } as const;
type LayerKey = keyof typeof LAYER_LABEL;

export function Legend({ heatOn, breaks, basemapFailed, caption, illustrative, layers, onLayer, onClose }: {
  heatOn: boolean;
  breaks: readonly number[] | null;
  basemapFailed: boolean;
  caption: string;
  illustrative: boolean;
  layers?: Record<LayerKey, boolean>;
  onLayer?: (k: LayerKey) => void;
  onClose?: () => void;
}) {
  return (
    <section className="ts-panel ts-legend" aria-label="Map key" id="ts-map-key">
      <div className="ts-key-head">
        <p className="ts-legend-title">Map key</p>
        {onClose && (
          <button type="button" className="ts-key-close" onClick={onClose}>
            Close
          </button>
        )}
      </div>
      {layers && onLayer && (
        <div className="ts-key-layers">
          {(Object.keys(LAYER_LABEL) as LayerKey[]).map((k) => (
            <button key={k} type="button" role="switch" aria-checked={layers[k]} className="ts-switch" onClick={() => onLayer(k)}>
              <span>{LAYER_LABEL[k]}</span>
              <span className="track" aria-hidden="true"><span className="knob" /></span>
            </button>
          ))}
        </div>
      )}
      <ul>
        <li><Dot r={5} fill={MAP.attention} halo /> Heat source</li>
        <li><Dot r={3.5} fill={MAP.secondary} /> Customer</li>
        <li><Dot r={4} ring={MAP.secondary} /> Recipient to approach</li>
      </ul>
      <ul>
        <li><Line color={MAP.attention} width={3} /> Existing (public record)</li>
        <li><Line color={MAP.attention} dash="9 6" width={2.6} /> Proposed (HCE study)</li>
        <li><Line color={ROUTE} width={6} opacity={0.55} /> Planned route (approx.)</li>
        <li><Line color={MAP.secondary} width={1.6} /> Team scenario</li>
      </ul>
      {heatOn && breaks && (
        <div className="ts-ramp">
          <p className="ts-legend-title">Top 20 buildings to approach, heat a year (MWh)</p>
          <div className="ts-ramp-strip" aria-hidden="true">
            {HEAT_RAMP.map((c) => <span key={c} style={{ background: c }} />)}
          </div>
          <p className="ts-ramp-labels">
            <span>{num(breaks[0], 2)}</span>
            <span>{num(breaks[1], 2)}</span>
            <span>{num(breaks[2], 2)}</span>
            <span>{num(breaks[3], 2)}+</span>
          </p>
        </div>
      )}
      <p className="ts-legend-note">{COPY.legendNote}</p>
      {illustrative && <p className="ts-legend-note">Illustrative items are labelled</p>}
      {basemapFailed && <p className="ts-legend-note">Basemap unavailable</p>}
      <p className="ts-visually-hidden">{caption}</p>
    </section>
  );
}

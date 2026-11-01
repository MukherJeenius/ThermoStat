/** The printed key: brick square, ink dot, brick line, and the heat ramp only when heat density is on. */
import { HEAT_RAMP, MAP } from './mapTokens';
import { COPY } from '../content/copy';

const LAYER_LABEL = { facilities: 'Heat sources', connections: 'Connections', buildings: 'Buildings', heat: 'Heat density' } as const;
type LayerKey = keyof typeof LAYER_LABEL;

function Square() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" fill={MAP.surface} />
      <rect x="3" y="3" width="10" height="10" fill={MAP.attention} />
    </svg>
  );
}
function Dot() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="3" fill={MAP.secondary} />
    </svg>
  );
}
function Arc() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <line x1="1" y1="8" x2="15" y2="8" stroke={MAP.attention} strokeWidth="1.5" />
    </svg>
  );
}

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
    <section className="ts-frame ts-legend" aria-label="Map key" id="ts-map-key">
      <div className="ts-key-head">
        <p className="ts-label">KEY</p>
        {onClose && (
          <button type="button" className="ts-key-close" onClick={onClose}>
            Close
          </button>
        )}
      </div>
      <ul className="ts-key-rows">
        <li><Square /> Facility (heat source)</li>
        <li><Dot /> Candidate building</li>
        <li><Arc /> Arc: joins endpoints, not pipe routes</li>
      </ul>
      {heatOn && breaks && (
        <div className="ts-ramp">
          <div className="ts-ramp-strip" aria-hidden="true">
            {HEAT_RAMP.map((c) => <span key={c} style={{ background: c }} />)}
          </div>
          <p className="ts-ramp-labels"><span>Low</span><span>High</span></p>
          <p className="ts-visually-hidden">Heat demand a year, ranked buildings only</p>
        </div>
      )}
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
      {illustrative && <p className="ts-legend-note">Illustrative items are labelled</p>}
      {basemapFailed && <p className="ts-legend-note">Basemap unavailable</p>}
      <p className="ts-visually-hidden">{caption} {COPY.legendNote}</p>
    </section>
  );
}

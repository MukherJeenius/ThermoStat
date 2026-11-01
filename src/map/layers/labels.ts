/** Endpoints (shape carries meaning with colour) and map labels with a surface halo (spec 9.3, layers 7 and 8). */
import { IconLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { MAP, rgba } from '../../ui/mapTokens';
import { interleave, OVERLAY_PARAMS } from './heatLayers';

/** A brick square inside a 1.5 px surface halo, drawn as an inline SVG icon (10 px square, 13 px with halo). */
function squareIcon(id: string, ring: string): { id: string; url: string; width: number; height: number } {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><rect x="0" y="0" width="26" height="26" fill="${ring}"/><rect x="3" y="3" width="20" height="20" fill="${MAP.attention}"/></svg>`;
  return { id, url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, width: 26, height: 26 };
}
const SQUARE = squareIcon('ts-square', MAP.surface);
const SQUARE_SELECTED = squareIcon('ts-square-on', MAP.ink);

export interface EndpointDatum {
  id: string;
  position: [number, number, number];
  role: 'source' | 'customer' | 'scenario';
  facilityId?: string;
  recipientId?: string | null;
  connectionId?: string;
  selected?: boolean;
}

export interface LabelDatum {
  id: string;
  text: string;
  position: [number, number, number];
  priority: number;
}

export function endpointLayers(opts: {
  data: EndpointDatum[];
  visible: boolean;
  onPick: (d: EndpointDatum) => void;
  beforeId?: string;
}) {
  const common = {
    visible: opts.visible,
    getPosition: (d: EndpointDatum) => d.position,
    radiusUnits: 'pixels' as const,
    lineWidthUnits: 'pixels' as const,
    parameters: OVERLAY_PARAMS,
    ...interleave(opts.beforeId),
    pickable: true,
    onClick: (info: { object?: EndpointDatum }) => {
      if (info.object) opts.onPick(info.object);
      return true;
    },
  };
  const sources = opts.data.filter((d) => d.role === 'source');
  const dots = opts.data.filter((d) => d.role !== 'source');
  return [
    // facilities: 10 px brick squares with a 1.5 px surface halo
    new IconLayer<EndpointDatum>({
      ...common,
      id: 'ts-endpoints-sources',
      data: sources,
      getIcon: (d) => (d.selected ? SQUARE_SELECTED : SQUARE),
      getSize: (d) => (d.selected ? 17 : 13),
      sizeUnits: 'pixels',
      billboard: true,
      updateTriggers: { getIcon: sources.map((d) => d.selected).join(), getSize: sources.map((d) => d.selected).join() },
    }),
    // buildings: 6 px ink dots
    new ScatterplotLayer<EndpointDatum>({
      ...common,
      id: 'ts-endpoints',
      data: dots,
      getRadius: (d) => (d.selected ? 4.5 : 3),
      updateTriggers: { getRadius: dots.map((d) => d.selected).join() },
      getFillColor: rgba(MAP.secondary, 1),
      stroked: true,
      getLineColor: rgba(MAP.surface, 1),
      getLineWidth: 1,
    }),
  ];
}

export function labelLayer(opts: { data: LabelDatum[]; visible: boolean; beforeId?: string }) {
  return new TextLayer<LabelDatum>({
    id: 'ts-labels',
    data: opts.data,
    visible: opts.visible,
    getPosition: (d) => d.position,
    getText: (d) => d.text,
    getSize: 13,
    sizeUnits: 'pixels',
    fontFamily: '"Inter Variable", Inter, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 500,
    characterSet: 'auto',
    fontSettings: { sdf: true, fontSize: 48, buffer: 10 },
    outlineWidth: 6,
    outlineColor: rgba(MAP.surface, 1),
    getColor: rgba(MAP.ink, 1),
    getTextAnchor: 'start',
    getAlignmentBaseline: 'center',
    getPixelOffset: [14, 0],
    parameters: OVERLAY_PARAMS,
    beforeId: opts.beforeId,
  } as ConstructorParameters<typeof TextLayer<LabelDatum>>[0]);
}

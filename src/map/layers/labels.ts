/** Endpoints (shape carries meaning with colour) and map labels with a surface halo (spec 9.3, layers 7 and 8). */
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { MAP, rgba } from '../../ui/mapTokens';
import { interleave, OVERLAY_PARAMS } from './heatLayers';

export interface EndpointDatum {
  id: string;
  position: [number, number, number];
  role: 'source' | 'customer' | 'scenario';
  facilityId?: string;
  recipientId?: string | null;
  connectionId?: string;
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
  const filled = opts.data.filter((d) => d.role !== 'scenario');
  const rings = opts.data.filter((d) => d.role === 'scenario');
  return [
    new ScatterplotLayer<EndpointDatum>({
      ...common,
      id: 'ts-endpoints',
      data: filled,
      getRadius: (d) => (d.role === 'source' ? 6 : 4),
      getFillColor: (d) => rgba(d.role === 'source' ? MAP.attention : MAP.secondary, 1),
      stroked: true,
      getLineColor: rgba(MAP.surface, 1),
      getLineWidth: 1.5,
    }),
    // hollow rings for recipients to approach: a surface ring under a secondary ring
    new ScatterplotLayer<EndpointDatum>({
      ...common,
      id: 'ts-endpoint-ring-halo',
      data: rings,
      getRadius: 5,
      filled: false,
      stroked: true,
      getLineColor: rgba(MAP.surface, 1),
      getLineWidth: 3,
      pickable: false,
    }),
    new ScatterplotLayer<EndpointDatum>({
      ...common,
      id: 'ts-endpoint-rings',
      data: rings,
      getRadius: 5,
      filled: true,
      getFillColor: rgba(MAP.surface, 0.01),
      stroked: true,
      getLineColor: rgba(MAP.secondary, 1),
      getLineWidth: 1.5,
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
    getSize: 12,
    sizeUnits: 'pixels',
    fontFamily: '"Inter Variable", Inter, "Helvetica Neue", Arial, sans-serif',
    fontWeight: 500,
    characterSet: 'auto',
    fontSettings: { sdf: true, fontSize: 48, buffer: 6 },
    outlineWidth: 2,
    outlineColor: rgba(MAP.surface, 1),
    getColor: rgba(MAP.ink, 1),
    getTextAnchor: 'start',
    getAlignmentBaseline: 'center',
    getPixelOffset: [10, 0],
    parameters: OVERLAY_PARAMS,
    beforeId: opts.beforeId,
  } as ConstructorParameters<typeof TextLayer<LabelDatum>>[0]);
}

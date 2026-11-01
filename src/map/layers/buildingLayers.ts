/** Extruded context buildings and recipients with the 9.3 lighting and material. Buildings are desaturated by default;
 *  "Heat demand" tints recipients by quantile class. */
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';
import { PathLayer, SolidPolygonLayer } from '@deck.gl/layers';
import type { ContextFile, Feature, Poly, Recipient } from '../../contract/data-contract';
import { darken, HEAT_RAMP, MAP, rgba } from '../../ui/mapTokens';
import { interleave, OVERLAY_PARAMS } from './heatLayers';

export const DEFAULT_HEIGHT_M = 9;
export const MATERIAL = { ambient: 1, diffuse: 1, shininess: 0, specularColor: [0, 0, 0] as [number, number, number] };

export function lighting(ambient = 0.82, directional = 0.2): LightingEffect {
  return new LightingEffect({
    ambient: new AmbientLight({ color: [255, 255, 255], intensity: ambient }),
    sun: new DirectionalLight({ color: [255, 255, 255], intensity: directional, direction: [0.21, 0.37, -0.91] }),
  });
}

export interface PolyDatum {
  id: string;
  ring: number[][][];
  height: number;
  recipient?: Recipient;
}

export function flattenPolys(id: string, g: Poly, height: number, recipient?: Recipient): PolyDatum[] {
  if (g.type === 'Polygon') return [{ id, ring: g.coordinates, height, recipient }];
  return g.coordinates.map((c) => ({ id, ring: c, height, recipient }));
}

export function contextData(ctx: ContextFile | null): PolyDatum[] {
  if (!ctx) return [];
  return ctx.features.flatMap((f) => flattenPolys(f.id, f.geometry, f.properties.heightM ?? DEFAULT_HEIGHT_M));
}

export function recipientData(features: Feature<Poly, Recipient>[]): PolyDatum[] {
  return features.flatMap((f) => flattenPolys(f.id, f.geometry, f.properties.heightM ?? DEFAULT_HEIGHT_M, f.properties));
}

/** Recipients: the roof colour, slightly warmer. */
const RECIPIENT_FILL = '#e9e2d6';

function heatClass(mwh: number, breaks: readonly number[]): number {
  let i = 0;
  while (i < breaks.length && mwh > breaks[i]) i++;
  return i;
}

export function buildingLayers(opts: {
  context: PolyDatum[];
  recipients: PolyDatum[];
  visible: boolean;
  heatOn: boolean;
  rampBreaks: readonly number[] | null;
  selectedId: string | null;
  onSelectRecipient: (id: string) => void;
  beforeId?: string;
}) {
  const sel = opts.selectedId;
  const fill = (d: PolyDatum) => {
    let hex = RECIPIENT_FILL;
    if (opts.heatOn && opts.rampBreaks && d.recipient) hex = HEAT_RAMP[heatClass(d.recipient.estimate.annualHeatMwh, opts.rampBreaks)];
    if (d.id === sel) hex = darken(hex, 0.12);
    return rgba(hex, 1);
  };
  const selected = opts.recipients.filter((d) => d.id === sel);
  return [
    new SolidPolygonLayer<PolyDatum>({
      id: 'ts-context',
      data: opts.context,
      visible: opts.visible,
      extruded: true,
      getPolygon: (d) => d.ring as never,
      getElevation: (d) => d.height,
      getFillColor: rgba(MAP.roof, 1),
      material: MATERIAL,
      pickable: false,
      ...interleave(opts.beforeId),
    }),
    new SolidPolygonLayer<PolyDatum>({
      id: 'ts-recipients',
      data: opts.recipients,
      visible: opts.visible,
      extruded: true,
      getPolygon: (d) => d.ring as never,
      getElevation: (d) => d.height,
      getFillColor: fill,
      material: MATERIAL,
      getPolygonOffset: () => [0, -2000],   // wins over coincident basemap walls in the interim tile-context mode
      pickable: true,
      onClick: (info) => {
        if (info.object) opts.onSelectRecipient(info.object.id);
        return true;
      },
      updateTriggers: { getFillColor: [opts.heatOn, sel, opts.rampBreaks?.join(',')] },
      ...interleave(opts.beforeId),
    }),
    new PathLayer<PolyDatum>({
      id: 'ts-selected-outline',
      data: selected,
      visible: opts.visible,
      getPath: (d) => d.ring[0].map((p) => [p[0], p[1], d.height + 0.5]) as never,
      getColor: rgba(MAP.ink, 1),
      getWidth: 2,
      widthUnits: 'pixels',
      parameters: OVERLAY_PARAMS,
      ...interleave(opts.beforeId),
    }),
  ];
}

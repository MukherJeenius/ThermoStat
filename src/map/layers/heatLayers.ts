/** Connections as dashed billboard paths over a surface casing (spec 9.3). The handoff's name and signature are kept;
 *  options are extended. Width never encodes capacity; arcs join endpoints and are not pipe routes. */
import type { Layer } from '@deck.gl/core';
import { PathStyleExtension } from '@deck.gl/extensions';
import { PathLayer } from '@deck.gl/layers';
import type { ConnectionKind, HeatConnection } from '../../contract/data-contract';
import { HEAT_RAMP, MAP, rgba } from '../../ui/mapTokens';

export const ROUTE_COLOR = HEAT_RAMP[4];

export const OVERLAY_PARAMS = { depthCompare: 'always', depthWriteEnabled: false } as const;

/** MapboxOverlay's interleaved `beforeId` (not part of deck's typed LayerProps). */
export const interleave = (beforeId?: string) => ({ beforeId }) as Record<string, unknown>;
const SAMPLES = 48;
// existing: bold solid · proposed: long even dash · scenario: thin solid in the secondary colour
const DASH: Record<ConnectionKind, [number, number]> = { operational: [0, 0], proposed: [9, 6], scenario: [0, 0] };
const WIDTH: Record<ConnectionKind, number> = { operational: 3, proposed: 2.6, scenario: 1.6 };

export interface ArcDatum {
  connection: HeatConnection;
  path: [number, number, number][];
}

/** Ground distance in metres (equirectangular; fine at city scale). */
export function groundDistanceM(a: readonly number[], b: readonly number[]): number {
  const R = 6371008.8;
  const lat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  const dx = ((b[0] - a[0]) * Math.PI) / 180 * Math.cos(lat) * R;
  const dy = ((b[1] - a[1]) * Math.PI) / 180 * R;
  return Math.hypot(dx, dy);
}

/** 48 points with height h × 4t(1 − t), h = clamp(0.25 × ground distance, 40 m, 700 m), between z0 and z1. */
export function arcPath(src: readonly number[], dst: readonly number[], z0 = 0, z1 = 0): [number, number, number][] {
  const h = Math.max(40, Math.min(700, 0.25 * groundDistanceM(src, dst)));   // tuned from 0.45 · [150, 1500] (decisions.md)
  const out: [number, number, number][] = [];
  for (let i = 0; i < SAMPLES; i++) {
    const t = i / (SAMPLES - 1);
    out.push([src[0] + (dst[0] - src[0]) * t, src[1] + (dst[1] - src[1]) * t, z0 + (z1 - z0) * t + h * 4 * t * (1 - t)]);
  }
  return out;
}

export function makeHeatLayers(
  connections: HeatConnection[],
  options: {
    visible: boolean;
    onSelect: (connectionId: string) => void;
    selectedConnectionId?: string | null; // added: drawn 3 px wide
    targetZ?: (c: HeatConnection) => number; // added: endpoint heights (roof + 2 m for recipients)
    beforeId?: string;
  },
): Layer[] {
  const data: ArcDatum[] = connections.map((c) => ({ connection: c, path: arcPath(c.source, c.target, 0, options.targetZ?.(c) ?? 0) }));
  const width = (d: ArcDatum) => WIDTH[d.connection.kind] + (d.connection.id === options.selectedConnectionId ? 1 : 0);
  const common = {
    data,
    visible: options.visible,
    getPath: (d: ArcDatum) => d.path,
    widthUnits: 'pixels' as const,
    billboard: true,
    capRounded: true,
    jointRounded: true,
    parameters: OVERLAY_PARAMS,
    ...interleave(options.beforeId),
    updateTriggers: { getWidth: options.selectedConnectionId },
  };
  return [
    new PathLayer<ArcDatum>({
      ...common,
      id: 'ts-heat-casing',
      getColor: rgba(MAP.surface, 1),
      getWidth: (d) => width(d) + 2.5,
      pickable: false,
    }),
    new PathLayer<ArcDatum, { getDashArray: (d: ArcDatum) => [number, number] }>({
      ...common,
      id: 'ts-heat-connections',
      getColor: (d) => rgba(d.connection.kind === 'scenario' ? MAP.secondary : MAP.attention, 1),
      getWidth: width,
      getDashArray: (d) => DASH[d.connection.kind],
      extensions: [new PathStyleExtension({ dash: true })],
      pickable: true,
      onClick: (info) => {
        if (info.object) options.onSelect(info.object.connection.id);
        return true;
      },
    }),
  ];
}

/** The planned route as a highlighted ground line (approximate or illustrative; never drawn as a pipe design). */
export function routeLayer(coords: number[][] | null, visible: boolean, beforeId?: string): Layer[] {
  if (!coords || coords.length < 2) return [];
  const data = [{ path: coords.map((c) => [c[0], c[1], 1]) }];
  return [
    new PathLayer<{ path: number[][] }>({
      id: 'ts-route-casing',
      data,
      visible,
      getPath: (d) => d.path as never,
      getColor: rgba(MAP.surface, 0.85),
      getWidth: 10,
      widthUnits: 'pixels',
      capRounded: true,
      jointRounded: true,
      parameters: OVERLAY_PARAMS,
      ...interleave(beforeId),
    }),
    new PathLayer<{ path: number[][] }>({
      id: 'ts-route',
      data,
      visible,
      getPath: (d) => d.path as never,
      getColor: rgba(ROUTE_COLOR, 0.55),
      getWidth: 6,
      widthUnits: 'pixels',
      capRounded: true,
      jointRounded: true,
      parameters: OVERLAY_PARAMS,
      ...interleave(beforeId),
    }),
  ];
}

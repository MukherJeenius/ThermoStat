/** Connections as dashed billboard paths over a surface casing (spec 9.3). The handoff's name and signature are kept;
 *  options are extended. Width never encodes capacity; arcs join endpoints and are not pipe routes. */
import type { Layer } from '@deck.gl/core';
import { PathStyleExtension } from '@deck.gl/extensions';
import { PathLayer } from '@deck.gl/layers';
import type { ConnectionKind, HeatConnection } from '../../contract/data-contract';
import { MAP, rgba } from '../../ui/mapTokens';

export const OVERLAY_PARAMS = { depthCompare: 'always', depthWriteEnabled: false } as const;

/** MapboxOverlay's interleaved `beforeId` (not part of deck's typed LayerProps). */
export const interleave = (beforeId?: string) => ({ beforeId }) as Record<string, unknown>;
const SAMPLES = 48;
const DASH: Record<ConnectionKind, [number, number]> = { operational: [0, 0], proposed: [6, 4], scenario: [1, 3] };

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

/** 48 points with height h × 4t(1 − t), h = clamp(0.2 × ground distance, 120 m, 800 m), between z0 and z1. */
export function arcPath(src: readonly number[], dst: readonly number[], z0 = 0, z1 = 0): [number, number, number][] {
  const h = Math.max(120, Math.min(800, 0.2 * groundDistanceM(src, dst)));   // tuned from 0.45 · [150, 1500] (decisions.md)
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
  const width = (d: ArcDatum) => (d.connection.id === options.selectedConnectionId ? 3 : 2);
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
      getWidth: (d) => width(d) + 3,
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

/** Fig. schematic: real positions as brick squares, ink dots and straight arcs in a fixed frame. */
import { MAP } from './mapTokens';
import { UNKNOWN } from './ledger';

type Pt = readonly number[];
export type SchematicData = { facilities: Pt[]; buildings: Pt[]; arcs: (readonly [Pt, Pt])[] };

/** A schematic of the real positions: brick squares, ink dots and straight arcs, in a fixed frame. */
export function Schematic({ fig }: { fig: SchematicData }) {
  const all = [...fig.facilities, ...fig.buildings];
  if (!all.length) return <div className="ts-fig-empty">{UNKNOWN}</div>;
  // Frame on the buildings and the facilities near them, so one distant site does not shrink the cluster to a dot.
  const core = fig.buildings.length ? fig.buildings : all;
  const bx = core.map((p) => p[0]), by = core.map((p) => p[1]);
  const spanX = Math.max(...bx) - Math.min(...bx) || 0.01, spanY = Math.max(...by) - Math.min(...by) || 0.01;
  const near = (p: Pt) => p[0] > Math.min(...bx) - spanX && p[0] < Math.max(...bx) + spanX && p[1] > Math.min(...by) - spanY && p[1] < Math.max(...by) + spanY;
  const framed = [...core, ...fig.facilities.filter(near)];
  const xs = framed.map((p) => p[0]);
  const ys = framed.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const W = 400, H = 300, pad = 24;
  const s = Math.min((W - 2 * pad) / (x1 - x0 || 1), (H - 2 * pad) / ((y1 - y0) * 1.37 || 1));
  const px = (p: Pt) => [W / 2 + (p[0] - (x0 + x1) / 2) * s, H / 2 - (p[1] - (y0 + y1) / 2) * s * 1.37] as const;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} overflow="hidden" role="img" aria-label="Schematic of facilities, candidate buildings and arcs">
      <rect width={W} height={H} fill={MAP.ground} />
      {fig.arcs.map(([a, b], i) => {
        const [ax, ay] = px(a); const [bx, by] = px(b);
        return <line key={i} pathLength={1} style={{ ['--i' as string]: i }} x1={ax} y1={ay} x2={bx} y2={by} stroke={MAP.attention} strokeWidth="1.25" opacity="0.85" />;
      })}
      {fig.buildings.map((p, i) => { const [x, y] = px(p); return <circle key={i} style={{ ['--i' as string]: i }} cx={x} cy={y} r="3" fill={MAP.secondary} />; })}
      {fig.facilities.map((p, i) => {
        const [x, y] = px(p);
        return <g key={i}><rect x={x - 6.5} y={y - 6.5} width="13" height="13" fill={MAP.surface} /><rect x={x - 5} y={y - 5} width="10" height="10" fill={MAP.attention} /></g>;
      })}
    </svg>
  );
}


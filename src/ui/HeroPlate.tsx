/** The homepage plate: the real positions of the facilities and ranked buildings, drawn as an annotated figure.
 *  The frame fits the downtown cluster; a facility outside it is drawn as an edge marker with its true distance.
 *  Facilities are named in a callout column with leader lines. Arcs are curves between endpoints, not pipe routes. */
type Pt = readonly number[];
export type PlateData = {
  facilities: { name: string; at: Pt }[];
  buildings: Pt[];
  arcs: (readonly [Pt, Pt])[];
};

const W = 640, H = 460, MAPW = 440, PAD = 36;
const short = (n: string) => n.replace(/\s*\(.*?\)\s*/g, ' ').split(',')[0].trim().slice(0, 24);
const km = (a: Pt, b: Pt) => {
  const dx = (a[0] - b[0]) * 111.32 * Math.cos(((a[1] + b[1]) / 2) * Math.PI / 180), dy = (a[1] - b[1]) * 110.57;
  return Math.hypot(dx, dy);
};

export function HeroPlate({ fig }: { fig: PlateData }) {
  const core = fig.buildings.length ? fig.buildings : fig.facilities.map((f) => f.at);
  const lon = core.map((p) => p[0]), lat = core.map((p) => p[1]);
  const cx = (Math.min(...lon) + Math.max(...lon)) / 2, cy = (Math.min(...lat) + Math.max(...lat)) / 2;
  const k = Math.cos(cy * Math.PI / 180);
  const span = Math.max((Math.max(...lon) - Math.min(...lon)) * k, Math.max(...lat) - Math.min(...lat), 0.004);
  const s = (Math.min(MAPW, H) - 2 * PAD) / (span * 1.12);
  const px = (p: Pt): [number, number] => [MAPW / 2 + (p[0] - cx) * k * s, H / 2 - (p[1] - cy) * s];
  const inside = ([x, y]: [number, number]) => x > 14 && x < MAPW - 14 && y > 14 && y < H - 14;
  // clamp a point outside the frame to the frame edge, along the line from the centre
  const edge = ([x, y]: [number, number]): [number, number] => {
    const dx = x - MAPW / 2, dy = y - H / 2;
    const t = Math.min((MAPW / 2 - 22) / Math.abs(dx || 1e-9), (H / 2 - 22) / Math.abs(dy || 1e-9));
    return [MAPW / 2 + dx * t, H / 2 + dy * t];
  };
  const place = (p: Pt) => { const q = px(p); return inside(q) ? q : edge(q); };
  const centre: Pt = [cx, cy];
  const facs = fig.facilities.map((f) => {
    const raw = px(f.at);
    return { ...f, raw, out: !inside(raw), xy: place(f.at), d: km(f.at, centre) };
  });
  // off-frame markers sharing an edge are spread apart, at least 30 px
  const outs = facs.filter((f) => f.out).sort((a, b) => a.xy[1] - b.xy[1]);
  for (let i = 1; i < outs.length; i++) {
    if (Math.abs(outs[i].xy[0] - outs[i - 1].xy[0]) < 30 && outs[i].xy[1] - outs[i - 1].xy[1] < 30) outs[i].xy = [outs[i].xy[0], outs[i - 1].xy[1] + 30];
  }
  const key = (p: Pt) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
  const where = new Map(facs.map((f) => [key(f.at), f.xy] as const));
  const placeF = (p: Pt) => where.get(key(p)) ?? place(p);
  // callout column: labels sorted by y, spaced at least 34 px apart
  const labels = [...facs].sort((a, b) => a.xy[1] - b.xy[1]);
  let y = 40;
  const ly = labels.map((f) => { y = Math.max(y, Math.min(H - 30, f.xy[1])); const v = y; y += 46; return v; });
  const shift = Math.max(0, y - 46 - (H - 30));
  // a scale bar of 500 m
  const bar = 0.5 / 111.32 * s / 1;
  // 1 km grid
  const step = (1 / 111.32) * s * 0.5;
  const grid: number[] = [];
  for (let g = step; g < Math.max(MAPW, H); g += step) grid.push(g);
  return (
    <svg className="ts-plate" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Figure: ${fig.facilities.length} facilities and ${fig.buildings.length} ranked buildings in Hamilton, joined by arcs that are not pipe routes`}>
      <rect width={W} height={H} className="ts-plate-ground" />
      <g className="ts-plate-grid">
        {grid.map((g) => <line key={`x${g}`} x1={g} y1={0} x2={g} y2={H} />)}
        {grid.filter((g) => g < H).map((g) => <line key={`y${g}`} x1={0} y1={g} x2={MAPW} y2={g} />)}
      </g>
      <rect x={MAPW} width={W - MAPW} height={H} className="ts-plate-gutter" />
      <line x1={MAPW} y1={0} x2={MAPW} y2={H} className="ts-plate-rule" />
      {facs.filter((f) => !f.out).map((f, i) => (
        <g key={`h${i}`} className="ts-plate-halo" style={{ ['--i' as string]: i }}>
          <circle cx={f.xy[0]} cy={f.xy[1]} r={54} className="h1" />
          <circle cx={f.xy[0]} cy={f.xy[1]} r={34} className="h2" />
          <circle cx={f.xy[0]} cy={f.xy[1]} r={18} className="h3" />
        </g>
      ))}
      {fig.arcs.map(([a, b], i) => {
        const [ax, ay] = placeF(a), [bx, by] = placeF(b);
        const mx = (ax + bx) / 2, my = (ay + by) / 2, len = Math.hypot(bx - ax, by - ay);
        const nx = -(by - ay) / (len || 1), ny = (bx - ax) / (len || 1);
        return <path key={i} pathLength={1} style={{ ['--i' as string]: i }} className="ts-plate-arc"
          d={`M${ax},${ay} Q${mx + nx * len * 0.18},${my + ny * len * 0.18} ${bx},${by}`} />;
      })}
      {fig.buildings.map((p, i) => { const [x, yy] = place(p); return <circle key={i} style={{ ['--i' as string]: i }} className="ts-plate-dot" cx={x} cy={yy} r={4.5} />; })}
      {labels.map((f, i) => {
        const yy = ly[i] - shift;
        return (
          <g key={`l${i}`} className="ts-plate-label" style={{ ['--i' as string]: i }}>
            <polyline points={`${f.xy[0] + 9},${f.xy[1]} ${MAPW - 10},${yy} ${MAPW + 14},${yy}`} />
            <text x={MAPW + 20} y={yy - 3}>{short(f.name)}</text>
            <text x={MAPW + 20} y={yy + 12} className="sub">{f.out ? `off frame · ${f.d.toFixed(1)} km` : `${f.d.toFixed(1)} km from centre`}</text>
          </g>
        );
      })}
      {facs.map((f, i) => (
        <g key={`f${i}`} className="ts-plate-fac" style={{ ['--i' as string]: i }}>
          <rect x={f.xy[0] - 8} y={f.xy[1] - 8} width="16" height="16" />
          {f.out && <path d={`M${f.xy[0]},${f.xy[1]} m${Math.sign(f.raw[0] - f.xy[0]) * 14},0 l${-Math.sign(f.raw[0] - f.xy[0]) * 6},-5 v10 z`} className="ts-plate-arrow" />}
        </g>
      ))}
      <g className="ts-plate-scale" transform={`translate(20 ${H - 26})`}>
        <rect width={bar} height="6" /><text y="-6">500 m</text>
      </g>
      <g className="ts-plate-north" transform={`translate(${MAPW - 28} 30)`}>
        <path d="M0,-14 L7,8 L0,3 L-7,8 Z" /><text y="22">N</text>
      </g>
    </svg>
  );
}

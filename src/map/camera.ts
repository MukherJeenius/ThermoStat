/** Camera rules (spec 9.3): pitch 50°, bearing −17°, padding that keeps the selection clear of the panels. */
import type { Map as MlMap, PaddingOptions } from 'maplibre-gl';

export const PITCH = 50;
export const BEARING = -17;
export const FACILITY_MAX_ZOOM = 15.5;
export const RECIPIENT_MAX_ZOOM = 16;
export const MIN_FIT_ZOOM = 13.5;
export const FRAME: [[number, number], [number, number]] = [
  [-79.9, 43.23],
  [-79.77, 43.29],
];

/** Padding from the live panel rectangles, so it follows every layout. */
export function cameraPadding(container: HTMLElement): PaddingOptions {
  const stage = container.getBoundingClientRect();
  const pad: PaddingOptions = { left: 24, right: 24, top: 24, bottom: 24 };
  const rail = document.querySelector('.ts-panel--rail:not(dialog *)')?.getBoundingClientRect();
  const card = document.querySelector('.ts-stage .ts-panel--card')?.getBoundingClientRect();
  const legend = document.querySelector('.ts-stage .ts-legend')?.getBoundingClientRect();
  const caption = document.querySelector('.ts-stage .ts-caption')?.getBoundingClientRect();
  const sheet = document.querySelector('.ts-sheet')?.getBoundingClientRect();
  if (sheet && sheet.height > 0) {
    pad.bottom = Math.max(24, stage.bottom - sheet.top + 12);
    return pad;
  }
  if (rail && rail.width > 0) pad.left = rail.right - stage.left + 24;
  if (card && card.width > 0) pad.right = stage.right - card.left + 24;
  if (legend && legend.height > 0) pad.bottom = stage.bottom - legend.top + 24;
  if (caption && caption.height > 0) pad.bottom = Math.max(pad.bottom ?? 24, stage.bottom - caption.top + 16);
  // keep at least 120 px of free map between the panels
  const left = pad.left ?? 24;
  const right = pad.right ?? 24;
  const free = stage.width - left - right;
  if (free < 120) {
    const k = Math.max(0, stage.width - 120) / (left + right);
    return { ...pad, left: left * k, right: right * k };
  }
  return pad;
}

export function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** fitBounds over the points with the 13.5 floor: below it, centre on `focus` at 13.5 instead. */
export function fitPoints(
  map: MlMap,
  points: readonly (readonly number[])[],
  focus: readonly number[],
  maxZoom: number,
  padding: PaddingOptions,
  animate: boolean,
  floor: number = MIN_FIT_ZOOM,
): void {
  const lons = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const bounds: [[number, number], [number, number]] = [
    [Math.min(...lons), Math.min(...lats)],
    [Math.max(...lons), Math.max(...lats)],
  ];
  // The map never stores padding: MapLibre 5 subtracts the stored padding as well as the padding passed here, so
  // every fit passes the live panel padding and flies without it (the fallback uses a pixel offset instead).
  map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
  const cam = map.cameraForBounds(bounds, { padding, bearing: BEARING, maxZoom });
  const duration = animate && !reducedMotion() ? 900 : 0;
  if (!cam || cam.zoom === undefined || cam.zoom < floor || points.length < 2) {
    const l = padding.left ?? 0;
    const r = padding.right ?? 0;
    const t = padding.top ?? 0;
    const b = padding.bottom ?? 0;
    map.easeTo({
      center: [focus[0], focus[1]],
      zoom: points.length < 2 ? maxZoom : floor,
      pitch: PITCH,
      bearing: BEARING,
      offset: [(l - r) / 2, (t - b) / 2],
      duration,
    });
    return;
  }
  const target = { center: cam.center, zoom: cam.zoom, pitch: PITCH, bearing: BEARING };
  if (duration) map.flyTo({ ...target, duration });
  else map.jumpTo(target);
}

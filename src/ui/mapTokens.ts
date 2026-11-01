/** Map colours for deck.gl and MapLibre, equal to the custom properties in tokens.css (mapTokens.test.ts checks).
 *  src/map/ takes every colour from here and contains no colour literals (spec 9.1). */
export const MAP = {
  ground: '#f3eee3',
  water: '#c6dae6',
  road: '#ffffff',
  roof: '#e3e1da',
  attention: '#b8441a',
  secondary: '#14213a',
  surface: '#fffcf5',
  ink: '#14213a',
  muted: '#4e5a6b',
  line: '#e2dacb',
  park: '#e6e6da',
} as const;

export const HEAT_RAMP = ['#f1d9b5', '#e3a673', '#cf7442', '#b8441a', '#7e2a10'] as const;

/** The custom property each value mirrors. */
export const MAP_TOKEN_NAMES: Partial<Record<keyof typeof MAP, string>> = {
  ground: '--ts-map-ground',
  park: '--ts-map-park',
  water: '--ts-map-water',
  road: '--ts-map-road',
  roof: '--ts-map-roof',
  attention: '--ts-map-attention',
  secondary: '--ts-map-secondary',
  surface: '--ts-surface',
  ink: '--ts-ink',
  muted: '--ts-muted',
  line: '--ts-line',
};

/** Arcs: solid brick, 1.25 px, 0.85 opacity, never animated. */
export const ARC = { width: 1.25, opacity: 0.85 } as const;

export type RGBA = [number, number, number, number];

/** '#rrggbb' + alpha (0..1) → deck.gl [r, g, b, a] with a in 0..255. */
export function rgba(hex: string, alpha = 1): RGBA {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    Math.round(Math.max(0, Math.min(1, alpha)) * 255),
  ];
}

/** Darken a hex colour by a fraction (the selected recipient's fill is 12 % darker, spec 9.3). */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = rgba(hex);
  const f = (v: number) => Math.round(v * (1 - amount)).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

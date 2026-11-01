/** Map colours for deck.gl and MapLibre, equal to the custom properties in tokens.css (mapTokens.test.ts checks).
 *  src/map/ takes every colour from here and contains no colour literals (spec 9.1). */
export const MAP = {
  ground: '#f3f2ee',
  water: '#dde3df',
  road: '#fbfaf6',
  roof: '#e7e5df',
  attention: '#c45f1c',
  secondary: '#857a8c',
  surface: '#fdfcf9',
  ink: '#292925',
  muted: '#716e67',
  line: '#d9d7d1',
  park: '#e9ebe3',
} as const;

export const HEAT_RAMP = ['#e2cdb0', '#d6ab82', '#c5875b', '#ab6a45', '#8c5133'] as const;

/** The custom property each value mirrors. `park` has no token (spec 3.5 gives #e9ebe3 directly). */
export const MAP_TOKEN_NAMES: Partial<Record<keyof typeof MAP, string>> = {
  ground: '--ts-map-ground',
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

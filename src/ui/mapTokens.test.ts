// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HEAT_RAMP, MAP, MAP_TOKEN_NAMES, rgba } from './mapTokens';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const declared = (name: string) => {
  const m = new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  return m?.[1].toLowerCase();
};

describe('mapTokens mirrors tokens.css', () => {
  it('every exported value equals its custom property', () => {
    for (const [key, token] of Object.entries(MAP_TOKEN_NAMES)) {
      expect(MAP[key as keyof typeof MAP], token).toBe(declared(token as string));
    }
    HEAT_RAMP.forEach((hex, i) => expect(hex).toBe(declared(`--ts-heat-${i + 1}`)));
  });
  it('rgba', () => {
    expect(rgba('#c45f1c', 1)).toEqual([196, 95, 28, 255]);
    expect(rgba('#fdfcf9', 0)).toEqual([253, 252, 249, 0]);
  });
});

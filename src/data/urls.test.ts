import { describe, expect, it } from 'vitest';
import { baseUrl, glyphsUrl, safeHttpsUrl, tilesUrl } from './urls';

describe('urls', () => {
  it('glyph URL keeps its template on a hash route', () => {
    const base = baseUrl('http://127.0.0.1:4173/#/explore/r/osm%3Away%2F123');
    expect(glyphsUrl(base)).toBe('http://127.0.0.1:4173/basemap/glyphs/{fontstack}/{range}.pbf');
    expect(tilesUrl(base)).toBe('pmtiles://http://127.0.0.1:4173/tiles/hamilton.pmtiles');
  });
  it('only https survives', () => {
    expect(safeHttpsUrl('https://hce.net/energy')).toBe('https://hce.net/energy');
    expect(safeHttpsUrl('http://hce.net/energy')).toBeNull();
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpsUrl(null)).toBeNull();
  });
});

/** Runtime URLs built from the page's directory (spec 3.5), so the build runs from any static path. */

/** The page's directory: resolving '.' drops the query and the #/route fragment. */
export function baseUrl(baseURI: string = document.baseURI): string {
  return new URL('.', baseURI).href;
}

export function dataUrl(file: string, base = baseUrl()): string {
  return base + 'data/' + file;
}

export function tilesUrl(base = baseUrl()): string {
  return 'pmtiles://' + base + 'tiles/hamilton.pmtiles';
}

/** Never pass the glyphs template through new URL(): it percent-encodes {fontstack} and {range}. */
export function glyphsUrl(base = baseUrl()): string {
  return base + 'basemap/glyphs/{fontstack}/{range}.pbf';
}

/** An HTTPS URL, or null. Any other scheme is rejected (spec 1.4). */
export function safeHttpsUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

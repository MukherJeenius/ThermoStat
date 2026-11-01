/** The offline Protomaps basemap, recoloured neutral and desaturated (spec 3.5). deck.gl draws the buildings. */
import { layers, namedFlavor, type Flavor } from '@protomaps/basemaps';
import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { MAP } from '../ui/mapTokens';

export function basemapFlavor(): Flavor {
  const light = namedFlavor('light');
  const road = MAP.road;
  const casing = MAP.line;
  const label = MAP.muted;
  const halo = MAP.surface;
  return {
    ...light,
    background: MAP.ground,
    earth: MAP.ground,
    park_a: MAP.park,
    park_b: MAP.park,
    wood_a: MAP.park,
    wood_b: MAP.park,
    scrub_a: MAP.park,
    scrub_b: MAP.park,
    zoo: MAP.park,
    hospital: MAP.ground,
    industrial: MAP.ground,
    school: MAP.ground,
    pedestrian: MAP.ground,
    military: MAP.ground,
    aerodrome: MAP.ground,
    beach: MAP.ground,
    sand: MAP.ground,
    glacier: MAP.ground,
    water: MAP.water,
    buildings: MAP.ground,
    pier: MAP.ground,
    runway: road,
    other: road,
    minor_service: road,
    minor_a: road,
    minor_b: road,
    link: road,
    major: road,
    highway: road,
    bridges_other: road,
    bridges_minor: road,
    bridges_link: road,
    bridges_major: road,
    bridges_highway: road,
    tunnel_other: road,
    tunnel_minor: road,
    tunnel_link: road,
    tunnel_major: road,
    tunnel_highway: road,
    minor_service_casing: casing,
    minor_casing: casing,
    link_casing: casing,
    major_casing_late: casing,
    highway_casing_late: casing,
    major_casing_early: casing,
    highway_casing_early: casing,
    bridges_other_casing: casing,
    bridges_minor_casing: casing,
    bridges_link_casing: casing,
    bridges_major_casing: casing,
    bridges_highway_casing: casing,
    tunnel_other_casing: casing,
    tunnel_minor_casing: casing,
    tunnel_link_casing: casing,
    tunnel_major_casing: casing,
    tunnel_highway_casing: casing,
    railway: casing,
    boundaries: casing,
    roads_label_minor: label,
    roads_label_minor_halo: halo,
    roads_label_major: label,
    roads_label_major_halo: halo,
    ocean_label: label,
    subplace_label: label,
    subplace_label_halo: halo,
    city_label: label,
    city_label_halo: halo,
    state_label: label,
    state_label_halo: halo,
    country_label: label,
    address_label: label,
    address_label_halo: halo,
    pois: undefined,
    landcover: undefined,
  };
}

/** Drop POIs, buildings and address labels; street names from z15, neighbourhood and water names from z13. */
export function basemapLayers(source = 'protomaps'): LayerSpecification[] {
  const all = layers(source, basemapFlavor(), { lang: 'en' }) as LayerSpecification[];
  return all
    .filter((l) => {
      const sl = (l as { 'source-layer'?: string })['source-layer'];
      return sl !== 'pois' && sl !== 'buildings' && !l.id.startsWith('address');
    })
    .map((l) => {
      const sl = (l as { 'source-layer'?: string })['source-layer'];
      if (l.type !== 'symbol') return l;
      if (sl === 'roads') return { ...l, minzoom: Math.max(l.minzoom ?? 0, 15) };
      if (sl === 'places' || sl === 'water') return { ...l, minzoom: Math.max(l.minzoom ?? 0, 13) };
      return l;
    });
}

/** Interim context buildings from the basemap's own buildings layer, used only while the OpenStreetMap context
 *  extract is incomplete (docs/decisions.md). Inserted below the first label layer. */
export function tileBuildingsLayer(): LayerSpecification {
  return {
    id: 'ts-context-tiles',
    type: 'fill-extrusion',
    source: 'protomaps',
    'source-layer': 'buildings',
    minzoom: 13,
    paint: {
      'fill-extrusion-color': MAP.roof,
      'fill-extrusion-height': ['coalesce', ['get', 'height'], 9],
      'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0],
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': false,
    },
  } as LayerSpecification;
}

export function basemapStyle(tiles: string, glyphs: string, withTileBuildings = false): StyleSpecification {
  const base = basemapLayers();
  if (withTileBuildings) {
    const i = base.findIndex((l) => l.type === 'symbol');
    base.splice(i < 0 ? base.length : i, 0, tileBuildingsLayer());
  }
  return {
    version: 8,
    glyphs,
    light: { anchor: 'map', color: '#ffffff', intensity: 0.22, position: [1.15, 210, 25] },
    sources: {
      protomaps: {
        type: 'vector',
        url: tiles,
        attribution: 'Basemap: Protomaps, © OpenStreetMap contributors',
      },
    },
    layers: base,
  };
}

/** The first label layer: deck layers are inserted below it, so basemap labels stay on top (spec 3.5). */
export function firstSymbolLayerId(style: StyleSpecification): string | undefined {
  return style.layers.find((l) => l.type === 'symbol')?.id;
}

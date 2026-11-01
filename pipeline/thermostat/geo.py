"""Geometry helpers: Overpass elements to shapely polygons, UTM 17N metrics (EPSG:32617)."""
from __future__ import annotations

from functools import lru_cache

import shapely
from shapely import ops
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, mapping, shape
from shapely.validation import make_valid

FRAME_BBOX = (-79.90, 43.23, -79.77, 43.29)   # west, south, east, north


@lru_cache(maxsize=1)
def _transformers():
    from pyproj import Transformer

    fwd = Transformer.from_crs("EPSG:4326", "EPSG:32617", always_xy=True)
    inv = Transformer.from_crs("EPSG:32617", "EPSG:4326", always_xy=True)
    return fwd, inv


def to_utm(geom):
    fwd, _ = _transformers()
    return shapely.transform(geom, lambda x, y: fwd.transform(x, y), interleaved=False)


def to_wgs(geom):
    _, inv = _transformers()
    return shapely.transform(geom, lambda x, y: inv.transform(x, y), interleaved=False)


def utm_point(lon: float, lat: float) -> Point:
    fwd, _ = _transformers()
    x, y = fwd.transform(lon, lat)
    return Point(x, y)


def _ring(coords: list[dict]) -> list[tuple[float, float]] | None:
    pts = [(c["lon"], c["lat"]) for c in coords if c]
    if len(pts) < 4 or pts[0] != pts[-1]:
        return None
    return pts


def way_polygon(el: dict):
    ring = _ring(el.get("geometry") or [])
    if not ring:
        return None
    p = Polygon(ring)
    if not p.is_valid:
        p = make_valid(p)
        p = _largest_polygonal(p)
    return p if p is not None and not p.is_empty and p.area > 0 else None


def relation_polygon(el: dict):
    """Outer rings minus inner rings, using polygonize over member ways (spec 6.5)."""
    outers, inners = [], []
    for m in el.get("members", []):
        if m.get("type") != "way" or not m.get("geometry"):
            continue
        line = LineString([(c["lon"], c["lat"]) for c in m["geometry"] if c])
        if line.length == 0:
            continue
        (inners if m.get("role") == "inner" else outers).append(line)
    if not outers:
        return None
    outer_polys = list(ops.polygonize(ops.unary_union(outers)))
    if not outer_polys:
        return None
    geom = ops.unary_union(outer_polys)
    if inners:
        inner_polys = list(ops.polygonize(ops.unary_union(inners)))
        if inner_polys:
            geom = geom.difference(ops.unary_union(inner_polys))
    geom = make_valid(geom) if not geom.is_valid else geom
    return _largest_polygonal(geom, keep_multi=True)


def _largest_polygonal(geom, keep_multi: bool = False):
    if geom is None or geom.is_empty:
        return None
    if isinstance(geom, (Polygon,)):
        return geom
    if isinstance(geom, MultiPolygon):
        return geom if keep_multi else max(geom.geoms, key=lambda g: g.area)
    polys = [g for g in getattr(geom, "geoms", []) if isinstance(g, (Polygon, MultiPolygon))]
    flat = []
    for g in polys:
        flat.extend(g.geoms if isinstance(g, MultiPolygon) else [g])
    if not flat:
        return None
    if keep_multi and len(flat) > 1:
        return MultiPolygon(flat)
    return max(flat, key=lambda g: g.area)


def area_m2(geom_wgs) -> float:
    return to_utm(geom_wgs).area


def label_point(geom_wgs) -> tuple[float, float]:
    p = geom_wgs.representative_point()
    return (p.x, p.y)


def round_coords(geom_mapping: dict, digits: int) -> dict:
    def r(c):
        if isinstance(c, (list, tuple)) and c and isinstance(c[0], (int, float)):
            return [round(float(v), digits) for v in c]
        return [r(x) for x in c]

    return {"type": geom_mapping["type"], "coordinates": r(geom_mapping["coordinates"])}


def geom_to_json(geom_wgs, digits: int) -> dict:
    return round_coords(mapping(geom_wgs), digits)


def from_json(g: dict):
    return shape(g)


def in_frame(lon: float, lat: float) -> bool:
    w, s, e, n = FRAME_BBOX
    return w <= lon <= e and s <= lat <= n

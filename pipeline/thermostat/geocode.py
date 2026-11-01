"""Nominatim geocoding with a permanent cache (spec 4, row 8).

At most 1 request a second, single thread, a custom User-Agent, bounded to the frame viewbox. Every answer (hits and
misses) is cached in raw/geocode_cache.json so a rerun makes 0 calls. Fewer than 200 queries in total. Only public
facilities and public-sector addresses are geocoded, never personal data.
"""
from __future__ import annotations

import time

from thermostat.io import RAW, offline, read_json, session, write_json

CACHE = RAW / "geocode_cache.json"
ENDPOINT = "https://nominatim.openstreetmap.org/search"
VIEWBOX = "-79.90,43.29,-79.77,43.23"   # left, top, right, bottom
MAX_QUERIES = 200

_state = {"last": 0.0, "session": None}


def _load() -> dict:
    return read_json(CACHE) if CACHE.exists() else {}


def query_count() -> int:
    return len(_load())


def geocode(q: str) -> tuple[float, float] | None:
    """Return (lon, lat) or None. Cached forever; offline runs read the cache only."""
    cache = _load()
    if q in cache:
        hit = cache[q]
        return (hit["lon"], hit["lat"]) if hit else None
    if offline():
        return None
    if len(cache) >= MAX_QUERIES:
        raise RuntimeError("geocode cap of 200 queries reached")
    if _state["session"] is None:
        _state["session"] = session()
    wait = 1.05 - (time.monotonic() - _state["last"])
    if wait > 0:
        time.sleep(wait)
    r = _state["session"].get(ENDPOINT, params={"q": q, "format": "jsonv2", "limit": 1, "countrycodes": "ca",
                                                "viewbox": VIEWBOX, "bounded": 1}, timeout=30)
    _state["last"] = time.monotonic()
    r.raise_for_status()
    res = r.json()
    hit = None
    if res:
        hit = {"lon": round(float(res[0]["lon"]), 7), "lat": round(float(res[0]["lat"]), 7),
               "display_name": res[0].get("display_name"), "osm": f"{res[0].get('osm_type')}/{res[0].get('osm_id')}"}
    cache[q] = hit
    write_json(CACHE, cache)
    return (hit["lon"], hit["lat"]) if hit else None

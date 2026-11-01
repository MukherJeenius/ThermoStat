"""02_buildings: OpenStreetMap footprints to recipient candidates and context (spec 6.1, step 02).

Writes out/buildings_raw.geojson (candidates with an archetype and floor area >= 400 m2) and out/context.geojson
(every footprint of 60 m2 or more). Both stay inside the frame bbox; 07 and 09 narrow them.
"""
from __future__ import annotations

import sys

from thermostat import archetypes as A
from thermostat.geo import area_m2, geom_to_json, in_frame, label_point, relation_polygon, way_polygon
from thermostat.io import OUT, RAW, ensure_dirs, read_json, write_json

KEEP_TAGS = ("name", "building", "amenity", "healthcare", "tourism", "leisure", "office", "shop", "operator",
             "operator:type", "addr:housenumber", "addr:street", "building:levels", "height", "start_date",
             "building:start_date", "construction_date")
EXCLUDED = {"parking", "garage", "garages"}


def build(osm: dict) -> tuple[list[dict], list[dict], dict]:
    osm_base = osm["osm3s"]["timestamp_osm_base"]
    last_verified = osm_base[:10]
    candidates, context = [], []
    stats = {"elements": 0, "no_geometry": 0, "excluded": 0, "small": 0, "outside": 0}
    for el in osm["elements"]:
        tags = el.get("tags") or {}
        if "building" not in tags or "building:part" in tags:
            continue
        stats["elements"] += 1
        b = (tags.get("building") or "").lower()
        if b in EXCLUDED or tags.get("amenity") == "parking":
            stats["excluded"] += 1
            continue
        if el["type"] == "way":
            geom = way_polygon(el)
        elif el["type"] == "relation":
            geom = relation_polygon(el)
        else:
            continue
        if geom is None:
            stats["no_geometry"] += 1
            continue
        lon, lat = label_point(geom)
        if not in_frame(lon, lat):
            stats["outside"] += 1
            continue
        fp = area_m2(geom)
        if fp < A.MIN_CONTEXT_FOOTPRINT_M2:
            stats["small"] += 1
            continue
        bid = f"osm:{el['type']}/{el['id']}"
        h = A.height_m(tags)
        context.append({"type": "Feature", "id": bid, "geometry": geom_to_json(geom, 7),
                        "properties": {"id": bid, "heightM": h, "footprintM2": round(fp, 1)}})
        arch, assumed = A.archetype(tags, fp)
        if arch is None:
            continue
        floor, method = A.floor_area(fp, tags)
        if floor < A.MIN_RECIPIENT_FLOOR_M2:
            continue
        props = {
            "id": bid,
            "name": tags.get("name"),
            "address": A.address(tags),
            "type": arch,
            "typeAssumed": assumed,
            "position": [round(lon, 6), round(lat, 6)],
            "footprintM2": round(fp, 1),
            "floorAreaM2": round(floor, 1),
            "floorAreaMethod": method,
            "heightM": h,
            "yearBuilt": A.year_built(tags),
            "ownerType": A.owner_type(tags, arch),
            "heatingSystem": None,
            "boilerYearsLeft": None,
            "lastVerified": last_verified,
            "synthetic": False,
            "tags": {k: tags[k] for k in KEEP_TAGS if k in tags},
        }
        candidates.append({"type": "Feature", "id": bid, "geometry": geom_to_json(geom, 7), "properties": props})
    candidates.sort(key=lambda f: f["id"])
    context.sort(key=lambda f: f["id"])
    stats.update({"candidates": len(candidates), "context": len(context), "osmBase": osm_base})
    return candidates, context, stats


def main() -> int:
    ensure_dirs()
    src = RAW / "osm" / "buildings.json"
    partial = False
    if not src.exists():
        alt = RAW / "osm" / "candidates.json"
        if not alt.exists():
            print("02_buildings: raw/osm/buildings.json is missing; run 01_fetch (or mock.py on a pipeline failure)")
            return 1
        # every Overpass server timed out on the full frame: tagged candidates only, context from the basemap tiles
        src, partial = alt, True
    osm = read_json(src)
    candidates, context, stats = build(osm)
    meta = {"osmBase": stats["osmBase"], "synthetic": False, "source": "osm", "partial": partial}
    write_json(OUT / "buildings_raw.geojson", {"type": "FeatureCollection", "meta": meta, "features": candidates},
               compact=True)
    write_json(OUT / "context.geojson", {"type": "FeatureCollection", "meta": meta, "features": context}, compact=True)
    by_type: dict[str, int] = {}
    for f in candidates:
        by_type[f["properties"]["type"]] = by_type.get(f["properties"]["type"], 0) + 1
    print(f"02_buildings: {stats['elements']} building elements; {stats['context']} context footprints; "
          f"{stats['candidates']} recipient candidates {dict(sorted(by_type.items()))}; "
          f"dropped: excluded {stats['excluded']}, small {stats['small']}, outside {stats['outside']}, "
          f"no geometry {stats['no_geometry']}; osm base {stats['osmBase']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

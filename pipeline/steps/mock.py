"""mock: 100 plausible corridor buildings labelled "Illustrative" (spec 6.1, `mock`).

Used only when 01_fetch or 02_buildings fails, and said so. Writes the outputs of 02 (out/buildings_raw.geojson and
out/context.geojson) with every feature `synthetic: true`; steps 03 to 09 then run unchanged.
"""
from __future__ import annotations

import random
import sys

from shapely.affinity import rotate
from shapely.geometry import box

from thermostat import archetypes as A
from thermostat.geo import area_m2, geom_to_json, label_point, to_utm, to_wgs, utm_point
from thermostat.io import OUT, ensure_dirs, write_json

# a band from downtown (79 Bay St N) east along the lower city towards the Bayfront
CORRIDOR = [(-79.8720, 43.2590), (-79.8600, 43.2560), (-79.8450, 43.2540), (-79.8300, 43.2540), (-79.8150, 43.2560)]
TYPES = ["office", "multi_res", "retail", "school", "hotel", "civic", "hospital", "mixed"]
WEIGHTS = [22, 26, 14, 8, 5, 10, 3, 12]


def generate(n: int = 100, seed: int = 20261031) -> tuple[list[dict], list[dict]]:
    rnd = random.Random(seed)
    cands, ctx = [], []
    for i in range(1, n + 1):
        a, b = rnd.sample(range(len(CORRIDOR)), 2)
        t = rnd.random()
        lon = CORRIDOR[a][0] + (CORRIDOR[b][0] - CORRIDOR[a][0]) * t + rnd.uniform(-0.004, 0.004)
        lat = CORRIDOR[a][1] + (CORRIDOR[b][1] - CORRIDOR[a][1]) * t + rnd.uniform(-0.003, 0.003)
        c = utm_point(lon, lat)
        w, d = rnd.uniform(18, 60), rnd.uniform(18, 50)
        geom = to_wgs(rotate(box(c.x - w / 2, c.y - d / 2, c.x + w / 2, c.y + d / 2), rnd.uniform(-20, 20)))
        arch = rnd.choices(TYPES, WEIGHTS)[0]
        lv = rnd.choice([2, 3, 4, 5, 6, 8, 10, 12, 15]) if arch != "hospital" else rnd.choice([5, 7, 9])
        fp = area_m2(geom)
        tags = {"building:levels": str(lv)}
        floor, method = A.floor_area(fp, tags)
        bid = f"demo:{i}"
        h = round(lv * A.LEVEL_HEIGHT_M, 1)
        ctx.append({"type": "Feature", "id": bid, "geometry": geom_to_json(geom, 7),
                    "properties": {"id": bid, "heightM": h, "footprintM2": round(fp, 1), "synthetic": True}})
        if floor < A.MIN_RECIPIENT_FLOOR_M2:
            continue
        lon_l, lat_l = label_point(geom)
        cands.append({"type": "Feature", "id": bid, "geometry": geom_to_json(geom, 7), "properties": {
            "id": bid, "name": f"Illustrative building {i}", "address": None, "type": arch, "typeAssumed": False,
            "position": [round(lon_l, 6), round(lat_l, 6)], "footprintM2": round(fp, 1),
            "floorAreaM2": round(floor, 1), "floorAreaMethod": method, "heightM": h,
            "yearBuilt": rnd.choice([None, 1925, 1958, 1968, 1975, 1988, 2004, 2016]),
            "ownerType": A.owner_type({}, arch), "heatingSystem": None, "boilerYearsLeft": None,
            "lastVerified": None, "synthetic": True, "tags": {}}})
    cands.sort(key=lambda f: f["id"])
    ctx.sort(key=lambda f: f["id"])
    return cands, ctx


def main() -> int:
    ensure_dirs()
    cands, ctx = generate()
    meta = {"osmBase": None, "synthetic": True, "source": "mock"}
    write_json(OUT / "buildings_raw.geojson", {"type": "FeatureCollection", "meta": meta, "features": cands}, compact=True)
    write_json(OUT / "context.geojson", {"type": "FeatureCollection", "meta": meta, "features": ctx}, compact=True)
    print(f"mock: {len(cands)} illustrative candidates, {len(ctx)} footprints (every feature synthetic: true)")
    return 0


if __name__ == "__main__":
    _ = to_utm  # keep the projection import warm for callers
    sys.exit(main())

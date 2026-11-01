"""06_places: facility, customer and proposed-target points, their footprints, and the planned route (spec 6.1).

The recovery plant takes its position only from lon/lat in places.yml (traced by a person). Until then it is the
midpoint of the Dofasco and Air Liquide geocodes with positionQuality 'illustrative'. The route is read from
route/route_planned.geojson, or an illustrative placeholder (plant → Hamilton General → 79 Bay St N) is written.
"""
from __future__ import annotations

import sys

from shapely.geometry import Point, shape
from shapely.strtree import STRtree

from thermostat.bps import name_ratio
from thermostat.geo import to_utm, utm_point
from thermostat.geocode import geocode
from thermostat.io import OUT, RAW, ROOT, ensure_dirs, load_yaml, read_json, write_json

ROUTE = ROOT / "route" / "route_planned.geojson"


def locate(entry: dict) -> tuple[tuple[float, float] | None, str | None]:
    """First geocode query that answers. A street-address query gives 'address', a name query 'approximate'."""
    for q in entry.get("geocode") or []:
        pt = geocode(q)
        if pt:
            quality = "address" if q[:1].isdigit() else "approximate"
            return pt, quality
    return None, None


def main() -> int:
    ensure_dirs()
    cfg = load_yaml(ROOT / "places.yml")
    ctx = read_json(OUT / "context.geojson")["features"]
    cands = {f["id"]: f for f in read_json(OUT / "buildings_raw.geojson")["features"]}
    geoms = [to_utm(shape(f["geometry"])) for f in ctx]
    ids = [f["id"] for f in ctx]
    tree = STRtree(geoms)

    def containing(lon: float, lat: float) -> list[str]:
        p = utm_point(lon, lat)
        return [ids[i] for i in tree.query(p, predicate="intersects")]

    facilities = {}
    for f in cfg["facilities"]:
        if f["id"] == "hce-recovery-plant":
            continue
        pt, q = locate(f)
        if not pt:
            print(f"06_places: no position for {f['id']}; it is left off the map")
            continue
        facilities[f["id"]] = {**{k: v for k, v in f.items() if k != "geocode"}, "position": [round(pt[0], 6), round(pt[1], 6)],
                               "positionQuality": q, "footprintIds": containing(*pt)}
    plant_cfg = next(f for f in cfg["facilities"] if f["id"] == "hce-recovery-plant")
    if plant_cfg.get("lon") is not None and plant_cfg.get("lat") is not None:
        ppos, pq = [plant_cfg["lon"], plant_cfg["lat"]], "approximate"
    else:
        a, b = facilities.get("dofasco"), facilities.get("air-liquide")
        if not (a and b):
            print("06_places: Dofasco or Air Liquide not located; cannot place the illustrative recovery plant")
            return 1
        ppos = [round((a["position"][0] + b["position"][0]) / 2, 6), round((a["position"][1] + b["position"][1]) / 2, 6)]
        pq = "illustrative"
    facilities["hce-recovery-plant"] = {**plant_cfg, "position": ppos, "positionQuality": pq, "footprintIds": []}

    customers = []
    for c in cfg["customers"]:
        pt, q = locate(c)
        if not pt:
            print(f"06_places: customer {c['name']} not located; no arc")
            continue
        customers.append({**{k: v for k, v in c.items() if k != "geocode"}, "position": [round(pt[0], 6), round(pt[1], 6)],
                          "positionQuality": q, "footprintIds": containing(*pt)})

    proposed = []
    for t in cfg["proposed"]:
        pt, q = locate(t)
        if not pt:
            print(f"06_places: proposed target {t['name']} not located")
            continue
        fp = set(containing(*pt))
        centre = utm_point(*pt)
        for cid, f in cands.items():
            p = f["properties"]
            if p["type"] != "hospital" and not (p.get("name") and name_ratio(p.get("name"), t.get("campusName")) >= 85):
                continue
            if to_utm(shape(f["geometry"])).distance(centre) <= t.get("campusRadiusM", 250):
                fp.add(cid)
        proposed.append({**{k: v for k, v in t.items() if k != "geocode"}, "position": [round(pt[0], 6), round(pt[1], 6)],
                         "positionQuality": q, "footprintIds": sorted(fp)})

    if ROUTE.exists():
        g = read_json(ROUTE)
        line = g["features"][0]["geometry"]["coordinates"] if g.get("type") == "FeatureCollection" else g["coordinates"]
        route = {"coordinates": line, "quality": "approx_route"}
    else:
        hg = next((p["position"] for p in proposed if p["id"] == "hamilton-general"), None)
        dt = facilities["hce-downtown-plant"]["position"]
        route = {"coordinates": [ppos] + ([hg] if hg else []) + [dt], "quality": "illustrative_route"}

    places = []
    pf = RAW / "osm" / "places.json"
    if pf.exists():
        for el in read_json(pf)["elements"]:
            name = (el.get("tags") or {}).get("name")
            if name:
                places.append({"name": name, "kind": "neighbourhood", "position": [round(el["lon"], 6), round(el["lat"], 6)]})
    places.sort(key=lambda p: (p["name"], p["position"]))
    write_json(OUT / "places.json", {"facilities": dict(sorted(facilities.items())), "customers": customers,
                                     "proposed": proposed, "route": route, "neighbourhoods": places})
    print(f"06_places: {len(facilities)} facilities (plant {pq}); {len(customers)} customers located; "
          f"{len(proposed)} proposed targets ({sum(len(p['footprintIds']) for p in proposed)} campus footprints); "
          f"route {route['quality']}; {len(places)} neighbourhoods")
    for f in facilities.values():
        print(f"  {f['id']:<20} {f['position']} {f['positionQuality']} footprints={len(f['footprintIds'])}")
    for c in customers:
        print(f"  customer {c['name']:<44} {c['position']} {c['positionQuality']} footprints={len(c['footprintIds'])}")
    _ = Point
    return 0


if __name__ == "__main__":
    sys.exit(main())

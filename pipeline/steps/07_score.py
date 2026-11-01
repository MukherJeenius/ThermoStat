"""07_score: distances (EPSG:32617, rounded to 10 m), the 600 m eligibility rule, fit and rank (spec 6.1, 8.3)."""
from __future__ import annotations

import csv
import sys

from shapely.geometry import LineString, MultiPoint, shape

from thermostat.fit import fit_assessment
from thermostat.geo import to_utm, to_wgs, utm_point
from thermostat.io import OUT, ROOT, ensure_dirs, read_json, write_json
from thermostat.units import round_to

MAX_M = 600
RANKED = 20


def overrides() -> dict[str, dict]:
    p = ROOT / "overrides" / "buildings.csv"
    out: dict[str, dict] = {}
    if not p.exists():
        return out
    with open(p, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            v: object = r["value"]
            if r["field"] == "boilerYearsLeft":
                v = int(r["value"])
            out.setdefault(r["building_id"], {})[r["field"]] = v
    return out


def main() -> int:
    ensure_dirs()
    places = read_json(OUT / "places.json")
    cands = read_json(OUT / "buildings_raw.geojson")["features"]
    est = read_json(OUT / "estimates.json")
    act_file = OUT / "actuals.json"
    actuals = read_json(act_file)["buildings"] if act_file.exists() else {}
    ov = overrides()

    excluded = set()
    for group in (places["customers"], places["proposed"], list(places["facilities"].values())):
        for p in group:
            excluded.update(p.get("footprintIds", []))
    known = [utm_point(*c["position"]) for c in places["customers"]] + [utm_point(*places["facilities"]["hce-downtown-plant"]["position"])]
    known_mp = MultiPoint(known)
    route_q = places["route"]["quality"]
    route_utm = to_utm(LineString(places["route"]["coordinates"]))

    recipients, dropped = [], 0
    for f in cands:
        if f["id"] in excluded:
            continue
        p = dict(f["properties"])
        p.update(ov.get(f["id"], {}))
        g = to_utm(shape(f["geometry"]))
        existing = round_to(g.distance(known_mp), 10)
        planned = round_to(g.distance(route_utm), 10)
        if existing <= planned:
            min_m, quality = existing, "known_customer"
        else:
            min_m, quality = planned, route_q
        if min_m > MAX_M:
            dropped += 1
            continue
        e = est[f["id"]]
        a = actuals.get(f["id"])
        owner = (a or {}).get("ownerType") or p.get("ownerType")
        fit_in = {"annualHeatMwh": e["annualHeatMwh"], "minM": min_m, "distanceQuality": quality,
                  "heatingSystem": p.get("heatingSystem"), "type": p["type"], "ownerType": owner,
                  "yearBuilt": p.get("yearBuilt"), "boilerYearsLeft": p.get("boilerYearsLeft"), "quality": e["quality"],
                  "activePermit": None, "typeAssumed": p.get("typeAssumed", False)}
        fit = fit_assessment(fit_in)
        recipients.append({
            "id": f["id"], "name": p.get("name"), "address": p.get("address"), "type": p["type"],
            "typeAssumed": p.get("typeAssumed", False), "position": p["position"], "floorAreaM2": p["floorAreaM2"],
            "floorAreaMethod": p["floorAreaMethod"], "heightM": p.get("heightM"), "yearBuilt": p.get("yearBuilt"),
            "ownerType": owner, "heatingSystem": p.get("heatingSystem"), "boilerYearsLeft": p.get("boilerYearsLeft"),
            "activePermit": None, "estimate": e,
            "distances": {"existingM": existing, "plannedM": planned, "plannedQuality": route_q, "minM": min_m, "quality": quality},
            "fit": fit, "rank": None, "sourceIds": e["sourceIds"],
            "lastVerified": (str(a["year"]) + "-12-31") if a else p.get("lastVerified"),
            "synthetic": p.get("synthetic", False),
        })
    order = sorted(recipients, key=lambda r: (-r["fit"]["score"], -r["estimate"]["annualHeatMwh"], r["id"]))
    for i, r in enumerate(order[:RANKED]):
        r["rank"] = i + 1
    recipients.sort(key=lambda r: r["id"])

    buf = to_wgs(known_mp.union(route_utm).buffer(MAX_M))
    w, s, e_, n = buf.bounds
    analysis = [round(w, 5), round(s, 5), round(e_, 5), round(n, 5)]
    corridor = to_wgs(known_mp.union(route_utm).buffer(MAX_M).simplify(10))
    write_json(OUT / "scored.json", {"recipients": recipients, "analysisBbox": analysis,
                                     "corridor": [[round(x, 5), round(y, 5)] for x, y in corridor.exterior.coords]
                                     if corridor.geom_type == "Polygon" else None,
                                     "excludedFootprints": sorted(excluded)})
    bands = {b: sum(1 for r in recipients if r["fit"]["band"] == b) for b in ("strong", "possible", "weak")}
    print(f"07_score: {len(recipients)} recipients within {MAX_M} m (dropped {dropped}; excluded endpoints {len(excluded)}); "
          f"bands {bands}; analysis bbox {analysis}")
    for r in order[:RANKED]:
        print(f"  {r['rank']:>2} {r['fit']['score']:>3} {r['fit']['band']:<8} {r['estimate']['annualHeatMwh']:>8} MWh "
              f"{r['estimate']['quality']:<8} {r['distances']['minM']:>4} m {r['type']:<9} {r['name'] or r['address'] or r['id']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

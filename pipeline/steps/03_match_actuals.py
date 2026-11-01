"""03_match_actuals: attach reported BPS gas use to footprints (spec 6.1, step 03).

Match order: (1) overrides/bps_matches.csv; (2) unique normalised address; (3) name ratio >= 85 inside the frame
(within 150 m of a cached geocode when one exists); (4) geocode rows whose FSA lies in the frame and take the
footprint containing the point; (5) the only footprint within 60 m of that point. Writes out/actuals.json and
out/unmatched_bps.csv.
"""
from __future__ import annotations

import csv
import sys

from shapely.geometry import shape
from shapely.strtree import STRtree

from thermostat import bps as B
from thermostat.geo import to_utm, utm_point
from thermostat.geocode import _load as load_geocodes
from thermostat.geocode import geocode
from thermostat.io import OUT, RAW, ROOT, ensure_dirs, read_json, write_json

OVERRIDES = ROOT / "overrides" / "bps_matches.csv"


def read_overrides() -> dict[str, str]:
    if not OVERRIDES.exists():
        return {}
    with open(OVERRIDES, newline="", encoding="utf-8") as f:
        return {r["bps_operation_id"].strip(): r["building_id"].strip() for r in csv.DictReader(f) if r.get("building_id")}


def is_campus(row: dict) -> bool:
    n = row.get("Number of Buildings")
    try:
        many = float(n) > 1
    except (TypeError, ValueError):
        many = False
    parent = str(row.get("Portfolio Manager Parent Property ID") or "")
    return many or (parent != "" and not parent.startswith("Not Applicable"))


def geocode_query(row: dict) -> str:
    return f"{row.get('Address')}, Hamilton, Ontario"


class Footprints:
    def __init__(self, candidates: list[dict], context: list[dict]):
        self.cand = {f["id"]: f for f in candidates}
        self.ids = [f["id"] for f in context]
        self.geoms = [to_utm(shape(f["geometry"])) for f in context]
        self.tree = STRtree(self.geoms)
        self.addr: dict[str, list[str]] = {}
        for f in candidates:
            p = f["properties"]
            a = B.normalise_address(p.get("address"))
            if a:
                self.addr.setdefault(a, []).append(f["id"])
        self.utm_cand = {fid: to_utm(shape(f["geometry"])) for fid, f in self.cand.items()}

    def containing(self, pt) -> list[str]:
        return [self.ids[i] for i in self.tree.query(pt, predicate="intersects")]

    def within(self, pt, d: float) -> list[str]:
        return [self.ids[i] for i in self.tree.query(pt.buffer(d), predicate="intersects")]


def match_row(row: dict, fps: Footprints, overrides: dict, geocodes: dict) -> tuple[list[str], str, str | None]:
    """Return (building ids, method, reason-if-unmatched)."""
    pid = str(row.get("Portfolio Manager Property ID"))
    if pid in overrides:
        bid = overrides[pid]
        return ([bid], "override", None) if bid in fps.cand else ([], "override", f"override target {bid} not a candidate")
    a = B.normalise_address(row.get("Address"))
    if a and len(fps.addr.get(a, [])) == 1:
        return fps.addr[a], "address", None
    cached = geocodes.get(geocode_query(row))
    cpt = utm_point(cached["lon"], cached["lat"]) if cached else None
    scored = []
    for fid, f in fps.cand.items():
        nm = f["properties"].get("name")
        if not nm:
            continue
        ratio = B.name_ratio(row.get("Property Name"), nm)
        if ratio >= B.NAME_THRESHOLD:
            if cpt is not None and fps.utm_cand[fid].distance(cpt) > 150:
                continue
            scored.append((ratio, fid))
    if scored:
        scored.sort(key=lambda t: (-t[0], t[1]))
        if is_campus(row) and len(scored) > 1:
            return [fid for _, fid in scored], "name_campus", None
        if len(scored) == 1 or scored[0][0] > scored[1][0]:
            return [scored[0][1]], "name", None
    if B.fsa(row.get("Postal Code")) in B.FRAME_FSAS:
        pt_ll = geocode(geocode_query(row))
        if pt_ll:
            pt = utm_point(*pt_ll)
            inside = [i for i in fps.containing(pt)]
            if len(inside) == 1:
                bid = inside[0]
                return ([bid], "geocode_contains", None) if bid in fps.cand else ([], "geocode_contains",
                                                                                     f"point falls in non-candidate {bid}")
            near = fps.within(pt, 60)
            if len(near) == 1:
                bid = near[0]
                return ([bid], "geocode_nearest", None) if bid in fps.cand else ([], "geocode_nearest",
                                                                                    f"nearest footprint {bid} is not a candidate")
            return [], "geocode", f"{len(near)} footprints within 60 m"
        return [], "geocode", "no geocode result in the frame"
    return [], "-", "FSA outside the frame"


def main() -> int:
    ensure_dirs()
    src = RAW / "bps"
    files = sorted(src.glob("bps-*.xlsx"))
    if not files:
        print("03_match_actuals: no BPS file in raw/bps; no actuals")
        write_json(OUT / "actuals.json", {"year": None, "buildings": {}, "rows": 0})
        return 0
    rows, year = B.read_rows(files[-1])
    ham = B.hamilton_rows(rows)
    raw = read_json(OUT / "buildings_raw.geojson")
    if raw.get("meta", {}).get("synthetic"):
        print("03_match_actuals: buildings are illustrative (mock.py); no BPS matching")
        write_json(OUT / "actuals.json", {"year": year, "file": files[-1].name, "rows": len(ham), "buildings": {}})
        return 0
    cand = raw["features"]
    ctx = read_json(OUT / "context.geojson")["features"]
    fps = Footprints(cand, ctx)
    overrides = read_overrides()
    geocodes = load_geocodes()

    out: dict[str, dict] = {}
    unmatched = []
    rejected_units = 0
    for row in ham:
        try:
            gas, col = B.row_gas_m3(row)
        except ValueError:
            rejected_units += 1
            unmatched.append((row, "-", "unknown gas unit"))
            continue
        if not gas:
            unmatched.append((row, "-", "no gas reported"))
            continue
        ids, method, reason = match_row(row, fps, overrides, geocodes)
        if not ids:
            unmatched.append((row, method, reason))
            continue
        pid = str(row.get("Portfolio Manager Property ID"))
        campus = is_campus(row)
        areas = {i: cand_by_area(fps, i) for i in ids}
        total = sum(areas.values()) or 1.0
        quality = "actual" if (method in ("override", "address") or not campus) else "checked"
        owner = B.owner_from_sector(row.get("Sector"))
        for bid in ids:
            share = gas * areas[bid] / total
            prev = out.get(bid)
            if prev:
                prev["gasM3"] += share
                prev["bpsOperationId"] += "+" + pid
                prev["quality"] = "checked" if "checked" in (prev["quality"], quality) else "actual"
                continue
            out[bid] = {"gasM3": share, "year": int(row.get("Year") or year), "bpsOperationId": pid,
                        "quality": quality, "matchMethod": method, "rowName": row.get("Property Name"),
                        "rowAddress": row.get("Address"), "ownerType": owner, "gasColumn": col,
                        "campusSplit": len(ids) > 1}
    for v in out.values():
        v["gasM3"] = round(v["gasM3"], 1)
    write_json(OUT / "actuals.json", {"year": year, "file": files[-1].name, "rows": len(ham),
                                      "buildings": dict(sorted(out.items()))})
    with open(OUT / "unmatched_bps.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["bps_operation_id", "property_name", "address", "postal_code", "sector", "step", "reason"])
        for row, method, reason in sorted(unmatched, key=lambda t: str(t[0].get("Portfolio Manager Property ID"))):
            w.writerow([row.get("Portfolio Manager Property ID"), row.get("Property Name"), row.get("Address"),
                        row.get("Postal Code"), row.get("Sector"), method, reason])
    methods: dict[str, int] = {}
    for v in out.values():
        methods[v["matchMethod"]] = methods.get(v["matchMethod"], 0) + 1
    q = {k: sum(1 for v in out.values() if v["quality"] == k) for k in ("actual", "checked")}
    print(f"03_match_actuals: BPS {year}: {len(ham)} Hamilton rows; {len(out)} footprints matched {methods}; "
          f"quality {q}; unmatched {len(unmatched)} (unknown units {rejected_units}); geocode cache {len(load_geocodes())}")
    return 0


def cand_by_area(fps: Footprints, bid: str) -> float:
    return float(fps.cand[bid]["properties"]["floorAreaM2"])


if __name__ == "__main__":
    sys.exit(main())

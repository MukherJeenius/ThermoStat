"""09_export: assemble public/data/* and meta.json (spec 6.1, 7.2, 7.3). Deterministic: sorted keys, features
sorted by id, fixed rounding, no timestamps except values read from inputs. Validates against pipeline/schema/."""
from __future__ import annotations

import json
import statistics
import sys

from shapely.geometry import shape

from thermostat.geo import geom_to_json, to_utm, to_wgs
from thermostat.io import OUT, PUBLIC_DATA, RAW, REPO, ROOT, ensure_dirs, load_yaml, read_json, write_json

HANDOFF_SAMPLE = REPO / "design" / "handoff" / "code" / "sample-data.json"
BUDGET = {"recipients.geojson": 1_500_000, "context-buildings.geojson": 4_000_000}
CONTEXT_PAD_M = 800
FACILITY_DESC = {
    "energy_plant": "Energy plant", "industrial_source": "Industrial heat source", "data_centre": "Data centre",
}


def simplify(geom_wgs, tol_m: float, digits: int) -> dict:
    g = to_wgs(to_utm(geom_wgs).simplify(tol_m, preserve_topology=True))
    return geom_to_json(g, digits)


def dataset_record(key: str, src: dict, manifest_by_source: dict, desc: str) -> dict:
    man = manifest_by_source.get(key, {})
    return {"id": key, "title": src["title"], "url": src["url"], "documentDate": src.get("documentDate"),
            "retrievedAt": man.get("fetched") or src.get("probed_on") or "2026-10-31", "page": None, "excerpt": desc,
            "synthetic": False, "shortTitle": src["shortTitle"], "publisher": src.get("publisher"), "docKind": "dataset",
            "pdfPageIndex": None, "excerptNormalisation": "none", "sha256": man.get("sha256"), "licence": src.get("licence"),
            "humanCheck": None}


def main() -> int:
    ensure_dirs()
    sources = {s["key"]: s for s in load_yaml(ROOT / "sources.yml")}
    manifest = read_json(RAW / "manifest.json") if (RAW / "manifest.json").exists() else {}
    man_by_source = {v.get("source"): v for v in manifest.values() if isinstance(v, dict) and v.get("source")}
    for rel, v in manifest.items():
        if isinstance(v, dict):
            if rel.startswith("bps/"):
                man_by_source.setdefault("bps", v)
            elif rel.startswith("ewrb/ewrb-20"):
                man_by_source.setdefault("ewrb", v)
            elif rel == "osm/buildings.json":
                man_by_source.setdefault("osm", v)
    places = read_json(OUT / "places.json")
    scored = read_json(OUT / "scored.json")
    ev = read_json(OUT / "evidence.json")
    raw_meta = read_json(OUT / "buildings_raw.geojson").get("meta", {})
    fetched = sorted(v.get("fetched") for v in manifest.values() if isinstance(v, dict) and v.get("fetched"))
    osm_base = raw_meta.get("osmBase") or ((fetched[-1] + "T00:00:00Z") if fetched else "2026-10-31T00:00:00Z")
    cands = {f["id"]: f for f in read_json(OUT / "buildings_raw.geojson")["features"]}
    ctx = read_json(OUT / "context.geojson")["features"]
    calibration = read_json(OUT / "calibration.json")

    # ---- sources
    records = {r["id"]: r for r in ev["records"]}
    descs = {"osm": "Building footprints, names, levels and types from OpenStreetMap.",
             "bps": "Reported annual gas use of public-sector buildings (O. Reg. 25/23).",
             "ewrb": "Median gas intensity by property type, for calibration only (no addresses).",
             "ceud": "Starting heating intensities by building type (space and water heating)."}
    for key, d in descs.items():
        records[key] = dataset_record(key, sources[key], man_by_source, d)
    sources_out = sorted(records.values(), key=lambda r: r["id"])

    # ---- facilities with commitments
    by_fac: dict[str, list] = {}
    for c in ev["commitments"]:
        if c["facility"]:
            by_fac.setdefault(c["facility"], []).append(c["commitment"])
    facilities = []
    for fid, f in places["facilities"].items():
        facilities.append({"id": fid, "name": f["name"], "locality": f["locality"], "position": f["position"],
                           "synthetic": False, "commitments": by_fac.get(fid, []), "kind": f["kind"],
                           "operator": f.get("operator"), "address": f.get("address"),
                           "positionQuality": f["positionQuality"], "mapLabel": f["mapLabel"]})
    sample = json.loads(HANDOFF_SAMPLE.read_text(encoding="utf-8"))
    sf = sample["facility"]
    sample_commitments = []
    for c in sf["commitments"]:
        status = c["status"] if c["source"] else "unknown"      # 2.2: no source, no status
        sample_commitments.append({**c, "status": status, "interpretation": None, "holder": None})
    facilities.append({"id": sf["id"], "name": sf["name"], "locality": sf["locality"], "position": sf["position"],
                       "synthetic": True, "commitments": sample_commitments, "kind": "data_centre", "operator": None,
                       "address": None, "positionQuality": "illustrative", "mapLabel": sf["name"]})
    order = [f["id"] for f in load_yaml(ROOT / "places.yml")["facilities"]]
    facilities.sort(key=lambda f: (order.index(f["id"]) if f["id"] in order else len(order), f["id"]))

    # ---- connections
    plant = places["facilities"]["hce-downtown-plant"]
    recovery = places["facilities"]["hce-recovery-plant"]
    conns = []
    for c in places["customers"]:
        ev_ids = [f"src-{e}" for e in c.get("evidence", []) if f"src-{e}" in records]
        if not ev_ids:
            continue                                   # a customer not named in a cached source gets no arc
        conns.append({"id": f"op-{c['id']}", "facilityId": "hce-downtown-plant", "recipientName": c["name"],
                      "source": plant["position"], "target": c["position"], "kind": "operational",
                      "evidenceIds": ev_ids, "synthetic": False, "recipientId": None, "phase": None,
                      "targetQuality": c["positionQuality"]})
    route_ev = [i for i in ("src-study-phase12-route",) if i in records]
    for t in places["proposed"]:
        if route_ev:
            conns.append({"id": f"prop-{t['id']}", "facilityId": "hce-recovery-plant", "recipientName": t["name"],
                          "source": recovery["position"], "target": t["position"], "kind": "proposed",
                          "evidenceIds": route_ev, "synthetic": False, "recipientId": None, "phase": t.get("phase"),
                          "targetQuality": t["positionQuality"]})
    if route_ev:
        conns.append({"id": "prop-downtown-plant", "facilityId": "hce-recovery-plant",
                      "recipientName": "HCE downtown plant, 79 Bay St N", "source": recovery["position"],
                      "target": plant["position"], "kind": "proposed", "evidenceIds": route_ev, "synthetic": False,
                      "recipientId": None, "phase": "Phase 2", "targetQuality": plant["positionQuality"]})
    recipients = scored["recipients"]
    for r in sorted((r for r in recipients if r["rank"]), key=lambda r: r["rank"]):
        src_fac = plant if r["distances"]["quality"] == "known_customer" else recovery
        fid = "hce-downtown-plant" if src_fac is plant else "hce-recovery-plant"
        conns.append({"id": f"scn-{r['rank']:02d}", "facilityId": fid,
                      "recipientName": r["name"] or (f"Unnamed building, {r['address']}" if r["address"] else "Unnamed building"),
                      "source": src_fac["position"], "target": r["position"], "kind": "scenario", "evidenceIds": [],
                      "synthetic": r["synthetic"], "recipientId": r["id"], "phase": None, "targetQuality": "approximate"})
    for c in sample["connections"]:
        conns.append({**c, "recipientId": None, "phase": None, "targetQuality": "illustrative"})
    conns.sort(key=lambda c: c["id"])

    # ---- recipients.geojson
    rfeats = []
    for r in recipients:
        props = {k: v for k, v in r.items() if k != "typeAssumed"}
        rfeats.append({"type": "Feature", "id": r["id"], "geometry": simplify(shape(cands[r["id"]]["geometry"]), 0.5, 6),
                       "properties": props})
    rfeats.sort(key=lambda f: f["id"])

    # ---- context-buildings.geojson (clip per spec 4; enforce the 4 MB budget)
    recip_ids = {r["id"] for r in recipients}
    customer_fp = {i for c in places["customers"] for i in c["footprintIds"]} | {i for t in places["proposed"] for i in t["footprintIds"]}
    facility_fp = {i for f in places["facilities"].values() for i in f["footprintIds"]}
    w, s, e, n = scored["analysisBbox"]
    pad_lon, pad_lat = CONTEXT_PAD_M / 80_000, CONTEXT_PAD_M / 111_000
    box = (w - pad_lon, s - pad_lat, e + pad_lon, n + pad_lat)
    min_area = 60.0
    if raw_meta.get("partial"):
        ctx = []      # candidates-only extract: the app draws context from the basemap's buildings layer
        print("09_export: OSM extract is partial (candidates only); context-buildings.geojson left empty")
    while True:
        cfeats = []
        for f in ctx:
            if f["id"] in recip_ids:
                continue
            g = shape(f["geometry"])
            c = g.representative_point()
            inside = box[0] <= c.x <= box[2] and box[1] <= c.y <= box[3]
            area = f["properties"]["footprintM2"]
            if (inside and area >= min_area) or (not inside and area >= 2000):
                role = "facility" if f["id"] in facility_fp else "customer" if f["id"] in customer_fp else "context"
                cfeats.append({"type": "Feature", "id": f["id"], "geometry": simplify(g, 1.0, 5),
                               "properties": {"id": f["id"], "heightM": f["properties"]["heightM"], "role": role}})
        cfeats.sort(key=lambda f: f["id"])
        size = len(json.dumps({"type": "FeatureCollection", "features": cfeats}, separators=(",", ":")))
        if size <= BUDGET["context-buildings.geojson"] or min_area >= 100:
            break
        min_area = 100.0
        print(f"09_export: context {size} bytes over budget; raising the minimum area to 100 m2")

    # ---- network.geojson
    nfeats = [{"type": "Feature", "id": "plant-downtown", "geometry": {"type": "Point", "coordinates": plant["position"]},
               "properties": {"role": "plant", "name": plant["name"], "quality": plant["positionQuality"]}},
              {"type": "Feature", "id": "plant-recovery", "geometry": {"type": "Point", "coordinates": recovery["position"]},
               "properties": {"role": "plant", "name": recovery["name"], "quality": recovery["positionQuality"]}},
              {"type": "Feature", "id": "route", "geometry": {"type": "LineString", "coordinates": places["route"]["coordinates"]},
               "properties": {"role": "route", "name": "Planned route", "quality": places["route"]["quality"]}}]
    for c in places["customers"]:
        nfeats.append({"type": "Feature", "id": f"customer-{c['id']}", "geometry": {"type": "Point", "coordinates": c["position"]},
                       "properties": {"role": "customer", "name": c["name"], "quality": "known_customer"}})
    if scored.get("corridor"):
        nfeats.append({"type": "Feature", "id": "corridor", "geometry": {"type": "Polygon", "coordinates": [scored["corridor"]]},
                       "properties": {"role": "corridor", "name": "Study corridor (approx.)", "quality": places["route"]["quality"]}})
    nfeats.sort(key=lambda f: f["id"])

    # ---- prices, meta
    prices = load_yaml(ROOT / "prices.yml")
    for k in prices:
        prices[k]["value"] = float(prices[k]["value"]) if isinstance(prices[k]["value"], float) else prices[k]["value"]
    heats = sorted(r["estimate"]["annualHeatMwh"] for r in recipients)
    if len(heats) >= 5:
        qs = statistics.quantiles(heats, n=5, method="inclusive")
        breaks = [round(q, 0) for q in qs]
    else:
        breaks = [0, 0, 0, 0]
    ranked = sorted((r for r in recipients if r["rank"]), key=lambda r: r["rank"])
    demo = next((r for r in ranked if r["estimate"]["quality"] == "actual"), None) or \
        next((r for r in ranked if r["estimate"]["quality"] == "checked"), None) or (ranked[0] if ranked else None)
    kinds = {k: sum(1 for c in conns if c["kind"] == k and not c["synthetic"]) for k in ("scenario", "proposed", "operational")}
    retrieved = {k: v.get("fetched") for k, v in sorted(man_by_source.items()) if k and v.get("fetched")}
    pm = sources.get("protomaps-builds", {})
    meta = {
        "generatedAt": osm_base, "osmBase": osm_base, "protomapsBuild": pm.get("newest_build"),
        "frameBbox": [-79.9, 43.23, -79.77, 43.29], "analysisBbox": scored["analysisBbox"], "retrieved": retrieved,
        "counts": {"buildings": len(cfeats) + len(rfeats), "recipients": len(rfeats),
                   "byQuality": {q: sum(1 for r in recipients if r["estimate"]["quality"] == q) for q in ("actual", "checked", "estimate")},
                   "synthetic": sum(1 for f in facilities if f["synthetic"]) + sum(1 for c in conns if c["synthetic"]) + sum(1 for r in recipients if r["synthetic"]),
                   "facilities": len(facilities), "connectionsByKind": kinds},
        "rampBreaksMwh": breaks,
        "calibration": [{"type": c["type"], "n": c["n"], "medianKwhM2": c["medianKwhM2"], "used": c["used"],
                         "column": c["column"], "year": c["year"], "bpsRatio": c["bpsRatio"]} for c in calibration],
        "evidence": ev["counts"], "defaultFacilityId": "hce-recovery-plant", "demoRecipientId": demo["id"] if demo else "",
    }

    out = {
        "facilities.json": facilities, "connections.json": conns, "sources.json": sources_out,
        "recipients.geojson": {"type": "FeatureCollection", "features": rfeats},
        "context-buildings.geojson": {"type": "FeatureCollection", "features": cfeats},
        "network.geojson": {"type": "FeatureCollection", "features": nfeats},
        "places.json": places["neighbourhoods"], "prices.json": prices, "meta.json": meta,
    }
    for name, data in out.items():
        compact = name.endswith(".geojson")
        write_json(PUBLIC_DATA / name, data, compact=compact)
    # validate every file against pipeline/schema (generated from the contract)
    try:
        import jsonschema

        for name in list(out) + ["factors.json"]:
            schema_file = ROOT / "schema" / (name.rsplit(".", 1)[0] + ".schema.json")
            if schema_file.exists():
                jsonschema.Draft7Validator(read_json(schema_file)).validate(read_json(PUBLIC_DATA / name))
    except Exception as e:  # noqa: BLE001
        print(f"09_export: schema validation failed: {str(e)[:400]}")
        return 1
    sizes = {n: (PUBLIC_DATA / n).stat().st_size for n in list(out) + ["factors.json"]}
    other = sum(v for k, v in sizes.items() if k not in BUDGET)
    for k, lim in BUDGET.items():
        if sizes[k] > lim:
            print(f"09_export: {k} is {sizes[k]} bytes, over its {lim} budget")
    print(f"09_export: {len(facilities)} facilities, {len(conns)} connections {kinds}, {len(rfeats)} recipients "
          f"{meta['counts']['byQuality']}, {len(cfeats)} context footprints (min area {min_area:g} m2), demo {meta['demoRecipientId']}")
    print("  sizes: " + ", ".join(f"{k} {v / 1000:.0f} kB" for k, v in sizes.items()) + f"; other files {other / 1000:.0f} kB (budget 300)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

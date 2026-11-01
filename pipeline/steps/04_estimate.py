"""04_estimate: annual heat, peaks and data quality per candidate (plan B5.1, B5.2; spec 6.1, step 04).

EWRB calibrates the archetype intensity medians only (it has no addresses). Actual comes only from a BPS match.
Annual heat is rounded to 4 significant figures here, before scoring. Writes out/estimates.json and
out/calibration.json.
"""
from __future__ import annotations

import re
import statistics
import sys

from thermostat import archetypes as A
from thermostat.io import OUT, RAW, ensure_dirs, read_json, write_json
from thermostat.units import heat_from_gas_m3, intensity_to_kwh_m2, network_kw, peak_kw, sig

HAMILTON_FSAS = ("L9A", "L9B", "L9C", "L9G", "L9H", "L9K")
TYPE_MAP = {
    "office": "office", "medical office": "office",
    "multifamily housing": "multi_res", "residence hall/dormitory": "multi_res",
    "senior living community": "multi_res", "senior care community": "multi_res",
    "hotel": "hotel",
    "k-12 school": "school", "college/university": "school",
    "hospital (general medical & surgical)": "hospital", "other - specialty hospital": "hospital",
    "retail store": "retail", "enclosed mall": "retail", "strip mall": "retail", "supermarket/grocery store": "retail",
    "mixed use property": "mixed",
    "ice/curling rink": "civic", "library": "civic", "social/meeting hall": "civic", "performing arts": "civic",
    "courthouse": "civic", "fire station": "civic", "police station": "civic", "other - public services": "civic",
}
GAS_COLUMN = ("WN_Sit_Gas_Int2", "m3/m2")          # weather-normalised site gas intensity, m3 per m2
EUI_COLUMN = ("WN_Site_EUI1", "GJ/m2")             # fallback when no gas intensity exists
MIN_N = 8


def _num(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v))
    except (TypeError, ValueError):
        return None


def ewrb_rows(path) -> tuple[list[dict], int | None]:
    import openpyxl

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    it = ws.iter_rows(values_only=True)
    header = [str(h).strip() if h is not None else "" for h in next(it)]
    rows = [dict(zip(header, r)) for r in it if any(v is not None for v in r)]
    m = re.search(r"(20\d\d)", path.name)
    return rows, int(m.group(1)) if m else None


def is_hamilton(row: dict) -> bool:
    city = str(row.get("City") or "").strip().lower()
    pc = str(row.get("Postal_Code") or "").replace(" ", "").upper()
    return city == "hamilton" or pc.startswith("L8") or pc[:3] in HAMILTON_FSAS


def heating_proxy(row: dict) -> tuple[float | None, bool]:
    """Heating proxy in kWh/m2: gas intensity × 0.85; else total EUI × the type's heating share (flagged)."""
    g = _num(row.get(GAS_COLUMN[0]))
    if g is not None and g > 0:
        return intensity_to_kwh_m2(g, GAS_COLUMN[1]) * 0.85, False
    return None, False


def calibrate(rows: list[dict], year: int | None) -> list[dict]:
    """One row per archetype: n, median, used (n >= 8 and median within 0.5x to 2x of the start value)."""
    by_type_ham: dict[str, list[float]] = {}
    by_type_all: dict[str, list[float]] = {}
    unmapped: dict[str, int] = {}
    for r in rows:
        pm = str(r.get("PrimPropTypCalc") or "").strip().lower()
        arch = TYPE_MAP.get(pm)
        if not arch:
            if pm:
                unmapped[pm] = unmapped.get(pm, 0) + 1
            continue
        v, _ = heating_proxy(r)
        if v is None:
            continue
        by_type_all.setdefault(arch, []).append(v)
        if is_hamilton(r):
            by_type_ham.setdefault(arch, []).append(v)
    out = []
    for arch in A.ARCHETYPES:
        vals = by_type_ham.get(arch, [])
        scope = "Hamilton"
        if len(vals) < MIN_N:
            vals = by_type_all.get(arch, [])
            scope = "Ontario"
        n = len(vals)
        med = round(statistics.median(vals), 1) if vals else None
        start = A.START_INTENSITY[arch]
        used = bool(n >= MIN_N and med is not None and 0.5 * start <= med <= 2 * start)
        reason = None
        if not used:
            reason = f"n={n} below {MIN_N}" if n < MIN_N else f"median {med} outside 0.5x-2x of {start}"
        out.append({"type": arch, "n": n, "medianKwhM2": med, "used": used, "scope": scope, "start": start,
                    "column": f"{GAS_COLUMN[0]} ({GAS_COLUMN[1]}) × 10.36 kWh/m3 × 0.85", "year": year,
                    "reason": reason, "bpsRatio": None})
    if unmapped:
        top = sorted(unmapped.items(), key=lambda t: -t[1])[:8]
        print("04_estimate: unmapped EWRB types (top): " + ", ".join(f"{k} ({v})" for k, v in top))
    return out


def estimate(props: dict, actual: dict | None, cal: dict, ewrb_source: str | None, bps_source: str | None) -> dict:
    arch = props["type"]
    if actual:
        q = sig(heat_from_gas_m3(actual["gasM3"]), 4)
        return {"annualHeatMwh": q, "peakHeatKw": peak_kw(q), "networkKw": network_kw(q), "quality": actual["quality"],
                "method": "bps_actual", "intensityKwhM2": None, "ageFactor": None, "calibration": None,
                "actual": {"gasM3": actual["gasM3"], "year": actual["year"], "bpsOperationId": actual["bpsOperationId"]},
                "sourceIds": [s for s in ("osm", bps_source) if s]}
    c = cal[arch]
    intensity = c["medianKwhM2"] if c["used"] else c["start"]
    af = A.age_factor(props.get("yearBuilt"))
    q = sig(props["floorAreaM2"] * intensity * af / 1000, 4)
    return {"annualHeatMwh": q, "peakHeatKw": peak_kw(q), "networkKw": network_kw(q),
            "quality": "checked" if c["used"] else "estimate",
            "method": "archetype_calibrated" if c["used"] else "archetype_start",
            "intensityKwhM2": intensity, "ageFactor": af,
            "calibration": {"n": c["n"], "medianKwhM2": c["medianKwhM2"], "year": c["year"]} if c["used"] else None,
            "actual": None, "sourceIds": [s for s in ("osm", ewrb_source if c["used"] else "ceud") if s]}


def main() -> int:
    ensure_dirs()
    files = sorted((RAW / "ewrb").glob("ewrb-20*.xlsx"))
    if files:
        rows, year = ewrb_rows(files[-1])
        cal_rows = calibrate(rows, year)
    else:
        print("04_estimate: no EWRB file; start values only")
        cal_rows = [{"type": a, "n": 0, "medianKwhM2": None, "used": False, "scope": None, "start": A.START_INTENSITY[a],
                     "column": None, "year": None, "reason": "no EWRB file", "bpsRatio": None} for a in A.ARCHETYPES]
    cal = {c["type"]: c for c in cal_rows}
    feats = read_json(OUT / "buildings_raw.geojson")["features"]
    act_file = OUT / "actuals.json"
    actuals = read_json(act_file)["buildings"] if act_file.exists() else {}
    est = {}
    ratios: dict[str, list[float]] = {}
    for f in feats:
        p = f["properties"]
        a = actuals.get(f["id"])
        e = estimate(p, a, cal, "ewrb" if files else None, "bps")
        if a:
            arch_only = estimate(p, None, cal, "ewrb", None)["annualHeatMwh"]
            if arch_only > 0:
                ratios.setdefault(p["type"], []).append(e["annualHeatMwh"] / arch_only)
        est[f["id"]] = e
    for c in cal_rows:
        r = ratios.get(c["type"])
        c["bpsRatio"] = round(statistics.median(r), 2) if r else None
    write_json(OUT / "estimates.json", dict(sorted(est.items())))
    write_json(OUT / "calibration.json", cal_rows)
    q = {k: sum(1 for e in est.values() if e["quality"] == k) for k in ("actual", "checked", "estimate")}
    print(f"04_estimate: {len(est)} estimates; quality {q}")
    for c in cal_rows:
        print(f"  {c['type']:<10} n={c['n']:<5} median={c['medianKwhM2']} start={c['start']} used={c['used']} "
              f"scope={c['scope']} bpsRatio={c['bpsRatio']}" + (f" ({c['reason']})" if c["reason"] else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())

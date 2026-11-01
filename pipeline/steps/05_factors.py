"""05_factors: emission factor sets for public/data/factors.json (spec 5).

ECCC by year is the default and TAF/IESO the conservative option (plan B5.5 tables, [Verify] against the published
tables). Climatiq runs only with a key in pipeline/.env, receives quantities only (1 m3 of gas, 1 MWh of electricity),
and is pinned through climatiq.lock.json. With no key, sets.climatiq is null and climatiqReason says why.
"""
from __future__ import annotations

import datetime as dt
import os
import sys

from thermostat.io import PUBLIC_DATA, offline, ROOT, ensure_dirs, read_json, session, write_json

LOCK = ROOT / "climatiq.lock.json"
API = "https://api.climatiq.io/data/v1"
KWH_PER_M3 = 10.36

ECCC = {"id": "eccc", "label": "ECCC reference, by year", "isFallback": False, "gasKgPerM3": 1.9,
        "gridTPerMwh": {"2025": 0.084, "2026": 0.070, "2027": 0.085, "2030": 0.055, "2035": 0.029},
        "gridTPerMwhFlat": None}
TAF = {"id": "taf", "label": "TAF/IESO forecast (conservative)", "isFallback": False, "gasKgPerM3": 1.9,
       "gridTPerMwh": {"2025": 0.075, "2026": 0.081, "2027": 0.124, "2030": 0.106}, "gridTPerMwhFlat": None}


def _key() -> str:
    try:
        from dotenv import load_dotenv

        load_dotenv(ROOT / ".env")
    except Exception:  # noqa: BLE001
        pass
    return os.environ.get("CLIMATIQ_API_KEY", "").strip()


def _selector(r: dict) -> dict:
    return {k: r.get(k) for k in ("id", "activity_id", "source", "year", "region", "source_lca_activity",
                                  "calculation_method", "unit_type") if r.get(k) is not None}


def climatiq(refresh: bool) -> tuple[dict | None, str | None]:
    key = _key()
    lock = read_json(LOCK) if LOCK.exists() else {}
    if not key:
        return None, "no API key"
    if offline():
        if lock.get("result"):
            return lock["result"], None
        return None, "offline run with no locked Climatiq result"
    s = session()
    s.headers["Authorization"] = "Bearer " + key
    try:
        version = lock.get("dataVersion")
        if refresh or not version:
            r = s.get(f"{API}/data-versions", timeout=20)
            if r.status_code in (400, 401, 429):
                return None, f"Climatiq HTTP {r.status_code}"
            version = str(r.json()["latest_release"])
        sel = lock.get("selectors") if not refresh else None
        if not sel:
            sel = {}
            for name, q, regions in (("gas", "natural gas", ["CA*"]), ("grid", "electricity grid", ["CA-ON", "CA*"])):
                for reg in regions:
                    r = s.get(f"{API}/search", params={"query": q, "region": reg, "data_version": version,
                                                       "results_per_page": 20}, timeout=20)
                    if r.status_code in (400, 401, 429):
                        return None, f"Climatiq HTTP {r.status_code}"
                    res = [x for x in r.json().get("results", [])
                           if (name == "gas" and x.get("unit_type") in ("Volume", "Energy"))
                           or (name == "grid" and x.get("unit_type") == "Energy")]
                    if res:
                        sel[name] = _selector(res[0])
                        break
            if set(sel) != {"gas", "grid"}:
                return None, "no matching Climatiq factor found"
        gas_params = ({"volume": 1, "volume_unit": "m3"} if sel["gas"].get("unit_type") == "Volume"
                      else {"energy": 1000, "energy_unit": "kWh"})
        body = [{"emission_factor": {"id": sel["gas"]["id"]}, "parameters": gas_params},
                {"emission_factor": {"id": sel["grid"]["id"]}, "parameters": {"energy": 1, "energy_unit": "MWh"}}]
        for attempt in range(2):
            try:
                r = s.post(f"{API}/estimate/batch", json=body, timeout=20)
                break
            except Exception:  # noqa: BLE001
                if attempt:
                    raise
        if r.status_code in (400, 401, 429):
            return None, f"Climatiq HTTP {r.status_code}"
        res = r.json()["results"]
        if any(x.get("co2e_unit") != "kg" for x in res):
            return None, "unexpected co2e unit"
        gas = res[0]["co2e"] if "volume" in gas_params else res[0]["co2e"] / 1000 * KWH_PER_M3
        grid = res[1]["co2e"] / 1000
        if not (1.7 <= gas <= 2.1):
            return None, f"gas factor {gas:.3f} kg/m3 outside 1.7-2.1"
        if not (0.01 <= grid <= 0.20):
            return None, f"grid factor {grid:.3f} t/MWh outside 0.01-0.20"
        result = {"id": "climatiq", "label": f"Climatiq (data version {version})", "isFallback": False,
                  "gasKgPerM3": round(gas, 4), "gridTPerMwh": None, "gridTPerMwhFlat": round(grid, 4),
                  "factorYear": int(sel["grid"].get("year") or 0), "dataVersion": version,
                  "selectors": {k: str(v.get("id")) for k, v in sel.items()},
                  "retrieved": dt.date.today().isoformat()}
        write_json(LOCK, {"dataVersion": version, "selectors": sel, "result": result})
        return result, None
    except Exception as e:  # noqa: BLE001 - never log the key or headers
        return None, f"Climatiq unavailable ({type(e).__name__})"


def main() -> int:
    ensure_dirs()
    refresh = "--refresh" in sys.argv
    clim, reason = climatiq(refresh)
    data = {"default": "eccc", "sets": {"eccc": ECCC, "taf": TAF, "climatiq": clim}, "climatiqReason": reason}
    write_json(PUBLIC_DATA / "factors.json", data)
    if not LOCK.exists():
        write_json(LOCK, {"dataVersion": None, "selectors": None, "result": None,
                          "note": "No Climatiq key yet. Add CLIMATIQ_API_KEY to pipeline/.env and rerun make data."})
    print(f"05_factors: eccc and taf written; climatiq {'set' if clim else 'null'}" + (f" ({reason})" if reason else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())

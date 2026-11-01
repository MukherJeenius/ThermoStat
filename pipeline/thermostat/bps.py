"""Broader Public Sector (BPS, O. Reg. 25/23) rows: reading, unit normalisation and match keys (spec 6.1, step 03)."""
from __future__ import annotations

import re
from pathlib import Path

from rapidfuzz import fuzz

from thermostat.units import gas_to_m3

NAME_THRESHOLD = 85
# Forward sortation areas that lie (wholly or partly) inside the frame bbox; only their unmatched rows are geocoded.
FRAME_FSAS = ("L8H", "L8K", "L8L", "L8M", "L8N", "L8P", "L8R", "L9A")
_STREET_ABBR = {
    "STREET": "ST", "AVENUE": "AVE", "ROAD": "RD", "DRIVE": "DR", "BOULEVARD": "BLVD", "COURT": "CRT",
    "CRESCENT": "CRES", "PLACE": "PL", "SQUARE": "SQ", "TERRACE": "TERR", "PARKWAY": "PKWY", "HIGHWAY": "HWY",
    "LANE": "LN", "CIRCLE": "CIR", "EAST": "E", "WEST": "W", "NORTH": "N", "SOUTH": "S", "SAINT": "ST",
}
_NAME_STOP = {"the", "inc", "ltd"}
_GAS_COLUMNS = (("Natural Gas Use (GJ)", "GJ"), ("Natural Gas Use (m³)", "m3"), ("Natural Gas Use (ekWh)", "ekWh"))


def normalise_address(a: str | None) -> str | None:
    if not a:
        return None
    s = re.sub(r"[.,#]", " ", str(a).upper())
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"^(\d+)\s*-\s*\d+\s", r"\1 ", s)          # "100-110 KING" keeps the first number
    words = [_STREET_ABBR.get(w, w) for w in s.split(" ")]
    return " ".join(words) or None


def normalise_name(n: str | None) -> str:
    s = re.sub(r"[^\w\s]", " ", str(n or "").lower())
    return " ".join(w for w in s.split() if w not in _NAME_STOP)


def name_ratio(a: str | None, b: str | None) -> float:
    return fuzz.token_set_ratio(normalise_name(a), normalise_name(b))


def name_matches(a: str | None, b: str | None) -> bool:
    return bool(a and b) and name_ratio(a, b) >= NAME_THRESHOLD


def owner_from_sector(sector: str | None) -> str | None:
    s = (sector or "").lower()
    if "municipal" in s:
        return "public"
    if "hospital" in s or "post-secondary" in s or "school" in s or "college" in s or "university" in s:
        return "institutional"
    return None


def _num(v) -> float | None:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(",", ""))
    except ValueError:
        return None


def row_gas_m3(row: dict) -> tuple[float | None, str | None]:
    """Normalise a row's gas use to m3 from whichever known gas column it carries."""
    for col, unit in _GAS_COLUMNS:
        if col in row:
            v = _num(row[col])
            if v is not None and v > 0:
                return gas_to_m3(v, unit), col
    return None, None


def read_rows(path: Path) -> tuple[list[dict], int]:
    import openpyxl

    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.worksheets[0]
    it = ws.iter_rows(values_only=True)
    header = [str(h).strip() if h is not None else "" for h in next(it)]
    rows = []
    for r in it:
        d = dict(zip(header, r))
        if not any(v is not None for v in r):
            continue
        rows.append(d)
    year = max((int(d["Year"]) for d in rows if isinstance(d.get("Year"), (int, float))), default=0)
    return rows, year


def hamilton_rows(rows: list[dict]) -> list[dict]:
    return [r for r in rows if str(r.get("City") or "").strip().lower() == "hamilton"]


def fsa(postal: str | None) -> str | None:
    if not postal:
        return None
    s = re.sub(r"\s", "", str(postal).upper())
    return s[:3] if len(s) >= 3 else None

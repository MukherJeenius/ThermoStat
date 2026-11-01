"""Archetype mapping and building fields from OpenStreetMap tags (spec 6.1, step 02)."""
from __future__ import annotations

import re

ARCHETYPES = ("office", "multi_res", "retail", "school", "hotel", "civic", "hospital", "mixed")
START_INTENSITY = {  # kWh/m2/yr, space + water heating (plan B5.1)
    "office": 190, "multi_res": 185, "retail": 180, "school": 170, "hotel": 180, "civic": 200,
    "hospital": 350, "mixed": 185,
}
HEATING_SHARE = {  # share of total EUI that is heating, used only when no gas intensity exists (step 04)
    "office": 0.5, "multi_res": 0.55, "retail": 0.45, "school": 0.6, "hotel": 0.5, "civic": 0.55,
    "hospital": 0.45, "mixed": 0.5,
}
LEVEL_HEIGHT_M = 3.5
MIN_RECIPIENT_FLOOR_M2 = 400
MIN_CONTEXT_FOOTPRINT_M2 = 60

_HOUSES = {"house", "detached", "semidetached_house", "terrace", "bungalow"}
_CONTEXT_BUILDING = _HOUSES | {
    "garage", "garages", "parking", "shed", "roof", "carport", "industrial", "warehouse", "manufacture",
    "church", "cathedral", "chapel", "mosque", "synagogue", "temple", "shrine", "religious", "monastery",
}
_CIVIC_AMENITY = {"townhall", "courthouse", "library", "community_centre", "police", "fire_station", "arts_centre",
                  "theatre"}
_CIVIC_LEISURE = {"sports_centre", "ice_rink", "stadium"}
_CIVIC_BUILDING = {"civic", "government", "public", "sports_hall", "stadium"}


def _num(s: str | None) -> float | None:
    if s is None:
        return None
    m = re.match(r"^\s*([0-9]+(?:[.,][0-9]+)?)", str(s))
    if not m:
        return None
    return float(m.group(1).replace(",", "."))


def height_m(tags: dict) -> float | None:
    """`height` tag in metres (feet converted), else building:levels × 3.5 m, else None."""
    h = tags.get("height")
    if h is not None:
        v = _num(h)
        if v is not None and v > 0:
            if re.search(r"(ft|feet|')", str(h)):
                v *= 0.3048
            return round(v, 1)
    lv = levels(tags)
    if lv:
        return round(lv * LEVEL_HEIGHT_M, 1)
    return None


def levels(tags: dict) -> float | None:
    v = _num(tags.get("building:levels"))
    return v if v and v > 0 else None


def floor_area(footprint_m2: float, tags: dict) -> tuple[float, str]:
    """Floor area = footprint × levels; else footprint × height ÷ 3.5 m; else footprint × 3, flagged."""
    lv = levels(tags)
    if lv:
        return footprint_m2 * lv, "levels"
    h = _num(tags.get("height"))
    if h and h > 0:
        hm = height_m(tags) or h
        return footprint_m2 * max(1.0, hm / LEVEL_HEIGHT_M), "height"
    return footprint_m2 * 3, "assumed_3_levels"


def is_context_only(tags: dict) -> bool:
    b = (tags.get("building") or "").lower()
    if b in _CONTEXT_BUILDING:
        return True
    if tags.get("amenity") in ("parking", "place_of_worship"):
        return True
    if "man_made" in tags or "power" in tags:
        return True
    return False


def archetype(tags: dict, footprint_m2: float) -> tuple[str | None, bool]:
    """Return (archetype or None for context only, type_assumed). The first matching rule wins."""
    if is_context_only(tags):
        return None, False
    b = (tags.get("building") or "").lower()
    amenity = tags.get("amenity")
    if amenity == "hospital" or tags.get("healthcare") == "hospital" or b == "hospital":
        return "hospital", False
    if amenity in ("school", "college", "university") or b in ("school", "college", "university"):
        return "school", False
    if tags.get("tourism") in ("hotel", "motel", "hostel") or b == "hotel":
        return "hotel", False
    if amenity in _CIVIC_AMENITY or tags.get("leisure") in _CIVIC_LEISURE or b in _CIVIC_BUILDING:
        return "civic", False
    if "office" in tags or b == "office":
        return "office", False
    if b in ("apartments", "residential", "dormitory"):
        return "multi_res", False
    if "shop" in tags or b in ("retail", "supermarket"):
        return "retail", False
    if b in ("commercial", "mixed_use"):
        return "mixed", False
    if b == "yes":
        lv = levels(tags) or 0
        if tags.get("name") or amenity or lv >= 4 or footprint_m2 >= 600:
            return "mixed", True
    return None, False


def owner_type(tags: dict, arch: str | None) -> str | None:
    op = (tags.get("operator:type") or "").lower()
    if arch == "civic" or op in ("government", "public"):
        return "public"
    if arch in ("hospital", "school"):
        return "institutional"
    if op == "private":
        return "private"
    return None


def year_built(tags: dict) -> int | None:
    for k in ("start_date", "building:start_date", "construction_date"):
        v = tags.get(k)
        if v:
            for m in re.finditer(r"(?<!\d)(\d{4})(?!\d)", str(v)):
                y = int(m.group(1))
                if 1800 <= y <= 2026:
                    return y
    return None


def address(tags: dict) -> str | None:
    hn, st = tags.get("addr:housenumber"), tags.get("addr:street")
    if hn and st:
        return f"{hn} {st}"
    return None


def age_factor(year: int | None) -> float:
    if year is None:
        return 1.0
    if year < 1960:
        return 1.2
    if year < 1980:
        return 1.1
    if year < 2000:
        return 1.0
    if year < 2015:
        return 0.85
    return 0.7


TYPE_WORD = {
    "office": "Office", "multi_res": "Multi-residential", "retail": "Retail", "school": "School", "hotel": "Hotel",
    "civic": "Civic building", "hospital": "Hospital", "mixed": "Mixed use",
}

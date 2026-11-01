"""Fit assessment (spec 8.3, plan B5.4). Mirrors src/engine/fit.ts; fixtures/fit-cases.json keeps them equal."""
from __future__ import annotations

import math

from thermostat.units import about

QUALITY_WORD = {"actual": "Actual", "checked": "Checked estimate", "estimate": "Estimate only"}
DISTANCE_PHRASE = {
    "known_customer": ("an existing HCE customer", "known customer"),
    "approx_route": ("the planned route", "approximate"),
    "illustrative_route": ("the planned route", "illustrative"),
}
ANCHOR_TYPE_WORD = {"hospital": "a hospital", "school": "a school", "civic": "a civic building"}
FACTORS = ("size", "distance", "heating", "anchor", "timing", "data")


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def fit_points(i: dict) -> dict:
    q = i["annualHeatMwh"]
    min_m = i.get("minM")
    size = _clamp(30 * (q - 300) / 2700, 0, 30)
    distance = 0.0 if min_m is None else _clamp(25 * (600 - min_m) / 500, 0, 25)
    heating = {"hydronic": 15, "forced_air": 3}.get(i.get("heatingSystem"), 7)
    if i["type"] in ("hospital", "school", "civic") or i.get("ownerType") in ("public", "institutional"):
        anchor = 15
    elif q >= 1000:
        anchor = 8
    else:
        anchor = 3
    byl = i.get("boilerYearsLeft")
    yb = i.get("yearBuilt")
    if i.get("activePermit") is True:
        timing = 10
    elif byl is not None and byl <= 5:
        timing = 8
    elif yb is not None and yb <= 2001:
        timing = 6
    else:
        timing = 2
    data = {"actual": 5, "checked": 3}.get(i["quality"], 1)
    return {"size": size, "distance": distance, "heating": heating, "anchor": anchor, "timing": timing, "data": data}


def score_of(points: dict) -> int:
    total = 0.0
    for k in FACTORS:          # fixed order, so both languages sum identically
        total += points[k]
    return math.floor(total + 0.5)


def band_of(score: int) -> str:
    if score >= 70:
        return "strong"
    if score >= 45:
        return "possible"
    return "weak"


def _reason(factor: str, i: dict, pts: dict) -> str | None:
    q = i["annualHeatMwh"]
    if factor == "size":
        lead = "Large heat user" if q >= 1000 else "Heat use"
        return f"{lead}: about {about(q)} MWh a year ({QUALITY_WORD[i['quality']]})."
    if factor == "distance":
        if i.get("minM") is None or pts["distance"] <= 0:
            return None
        what, word = DISTANCE_PHRASE[i["distanceQuality"]]
        return f"About {about(max(i['minM'], 10))} m from {what} ({word})."
    if factor == "heating":
        if i.get("heatingSystem") == "hydronic":
            return "Heats with hot water, which suits a network connection."
        return None
    if factor == "anchor":
        if pts["anchor"] == 15:
            if i["type"] in ANCHOR_TYPE_WORD:
                return f"A public anchor building: {ANCHOR_TYPE_WORD[i['type']]}."
            return "A public or institutional owner."
        return None
    if factor == "timing":
        if pts["timing"] == 10:
            return "An active permit or site plan within 50 m."
        if pts["timing"] == 8:
            return f"Boiler due for replacement in about {i['boilerYearsLeft']} years."
        if pts["timing"] == 6:
            return f"Built in {i['yearBuilt']}, so its heating plant may be due for renewal."
        return None
    if factor == "data":
        if i["quality"] == "actual":
            return "Uses this building's reported gas use."
        if i["quality"] == "checked":
            return "Its estimate is calibrated against Hamilton large-building reports."
        return None
    return None


def missing_of(i: dict) -> list[str]:
    out = []
    if i.get("typeAssumed"):
        out.append("building type")
    if i.get("heatingSystem") is None:
        out.append("heating system")
    if i.get("yearBuilt") is None:
        out.append("year built")
    if i.get("minM") is None:
        out.append("distance to the network")
    return out


def fit_assessment(i: dict) -> dict:
    """i: annualHeatMwh, minM, distanceQuality, heatingSystem, type, ownerType, yearBuilt, boilerYearsLeft,
    quality, activePermit, typeAssumed."""
    pts = fit_points(i)
    score = score_of(pts)
    order = sorted(FACTORS, key=lambda k: (-pts[k], FACTORS.index(k)))
    reasons = []
    for k in order:
        r = _reason(k, i, pts)
        if r:
            reasons.append(r)
        if len(reasons) == 3:
            break
    return {"band": band_of(score), "score": score, "reasons": reasons, "missing": missing_of(i), "points": pts}

"""Unit conversions and rounding rules (plan B5.1, B5.2; spec 6.1 steps 03 and 04)."""
from __future__ import annotations

import math
import re

KWH_PER_M3 = 10.36          # heat content of natural gas
BOILER_EFF = 0.85
GJ_TO_M3 = 26.8             # 1 GJ of gas = 26.8 m3
EKWH_TO_M3 = 0.0965         # 1 equivalent kWh of gas = 0.0965 m3
FULL_LOAD_BUILDING = 2000   # h
FULL_LOAD_NETWORK = 3600    # h

_GAS_UNITS = {
    "m3": 1.0, "m³": 1.0, "cubic meters": 1.0, "cubic metres": 1.0, "cubic meter": 1.0, "cubic metre": 1.0,
    "gj": GJ_TO_M3, "gigajoules": GJ_TO_M3, "gigajoule": GJ_TO_M3,
    "ekwh": EKWH_TO_M3, "equivalent kilowatt hours": EKWH_TO_M3, "equivalent kilowatt-hours": EKWH_TO_M3,
    "ekw h": EKWH_TO_M3,
}

_INTENSITY_UNITS = {
    "ekwh/ft2": 10.7639, "ekwh/ft²": 10.7639, "ekwh/sq ft": 10.7639,
    "kbtu/ft2": 3.1546, "kbtu/ft²": 3.1546, "kbtu/sq ft": 3.1546,
    "gj/m2": 277.78, "gj/m²": 277.78,
    "m3/m2": KWH_PER_M3, "m³/m²": KWH_PER_M3,
    "kwh/m2": 1.0, "kwh/m²": 1.0, "ekwh/m2": 1.0, "ekwh/m²": 1.0,
}


def norm_unit(unit: str) -> str:
    u = str(unit).strip().lower()
    u = u.replace("cubic meters", "m3") if u in ("cubic meters",) else u
    u = re.sub(r"\s+", " ", u)
    u = u.replace("per", "/").replace(" / ", "/").replace("sq. ft", "sq ft").replace("ft^2", "ft2").replace("m^2", "m2")
    u = u.replace("m^3", "m3")
    return u


def gas_to_m3(value: float, unit: str) -> float:
    """Normalise a gas quantity to m3. Unknown units raise ValueError (rejected, never guessed)."""
    u = norm_unit(unit)
    if u not in _GAS_UNITS:
        raise ValueError(f"unknown gas unit: {unit!r}")
    return float(value) * _GAS_UNITS[u]


def intensity_to_kwh_m2(value: float, unit: str) -> float:
    u = norm_unit(unit).replace(" ", "")
    u = u.replace("sqft", "ft2")
    if u not in {k.replace(" ", "").replace("sqft", "ft2") for k in _INTENSITY_UNITS}:
        raise ValueError(f"unknown intensity unit: {unit!r}")
    table = {k.replace(" ", "").replace("sqft", "ft2"): v for k, v in _INTENSITY_UNITS.items()}
    return float(value) * table[u]


def heat_from_gas_m3(gas_m3: float) -> float:
    """Annual heat (MWh) from reported gas use: gas_m3 × 10.36 × 0.85 / 1000."""
    return gas_m3 * KWH_PER_M3 * BOILER_EFF / 1000


def round_half_up(x: float) -> int:
    """floor(x + 0.5): the same rule as Math.floor(x + 0.5) in the engine (never banker's rounding)."""
    return math.floor(x + 0.5)


def sig(x: float, n: int) -> float:
    """Round to n significant figures (half away from zero on the decimal representation)."""
    if x == 0 or not math.isfinite(x):
        return x
    digits = n - int(math.floor(math.log10(abs(x)))) - 1
    q = 10.0 ** digits
    return math.floor(abs(x) * q + 0.5) / q * (1 if x > 0 else -1)


def peak_kw(annual_mwh: float) -> int:
    return round_half_up(annual_mwh * 1000 / FULL_LOAD_BUILDING)


def network_kw(annual_mwh: float) -> int:
    return round_half_up(annual_mwh * 1000 / FULL_LOAD_NETWORK)


def round_to(x: float, step: float) -> float:
    return round_half_up(x / step) * step


def fmt_int(x: float) -> str:
    return f"{int(round_half_up(x)):,}"


def about(x: float) -> str:
    """'about' figure for prose: 2 significant figures with thousands separators (spec 8.1 format)."""
    v = sig(x, 2)
    if abs(v) >= 100:
        return f"{int(v):,}"
    if v == int(v):
        return str(int(v))
    return f"{v:g}"

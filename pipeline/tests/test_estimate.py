import pytest

from conftest import step
from thermostat import units as U


def _rows(arch_label, values, city="Hamilton"):
    pc = "L8P" if city == "Hamilton" else "K1A"
    return [{"PrimPropTypCalc": arch_label, "City": city, "Postal_Code": pc, "WN_Sit_Gas_Int2": v} for v in values]


def test_ewrb_guard_keeps_start_value_when_n_below_8():
    m = step("04_estimate")
    cal = {c["type"]: c for c in m.calibrate(_rows("Office", [15.0] * 7, city="Toronto"), 2024)}
    assert cal["office"]["n"] == 7 and cal["office"]["used"] is False


def test_ewrb_guard_uses_median_inside_range():
    m = step("04_estimate")
    cal = {c["type"]: c for c in m.calibrate(_rows("Office", [15.0] * 8), 2024)}
    # 15 m3/m2 × 10.36 × 0.85 = 132.09 kWh/m2, inside 0.5x-2x of 190
    assert cal["office"]["used"] is True and cal["office"]["medianKwhM2"] == pytest.approx(132.1)
    assert cal["office"]["scope"] == "Hamilton"


def test_ewrb_guard_rejects_median_outside_range():
    m = step("04_estimate")
    cal = {c["type"]: c for c in m.calibrate(_rows("Office", [5.0] * 10), 2024)}   # 44 kWh/m2 < 95
    assert cal["office"]["used"] is False
    cal = {c["type"]: c for c in m.calibrate(_rows("Office", [60.0] * 10), 2024)}  # 528 kWh/m2 > 380
    assert cal["office"]["used"] is False


def test_falls_back_to_ontario_when_hamilton_has_fewer_than_8():
    m = step("04_estimate")
    rows = _rows("Hotel", [15.0] * 3) + _rows("Hotel", [16.0] * 9, city="Ottawa")
    cal = {c["type"]: c for c in m.calibrate(rows, 2024)}
    assert cal["hotel"]["scope"] == "Ontario" and cal["hotel"]["n"] == 12


def test_estimate_formulas():
    m = step("04_estimate")
    cal = {"office": {"used": False, "start": 190, "medianKwhM2": None, "n": 0, "year": None}}
    props = {"type": "office", "floorAreaM2": 10000.0, "yearBuilt": 1955}
    e = m.estimate(props, None, cal, "ewrb", "bps")
    assert e["annualHeatMwh"] == 2280          # 10,000 × 190 × 1.2 / 1000
    assert e["peakHeatKw"] == 1140 and e["networkKw"] == 633
    assert e["quality"] == "estimate" and e["method"] == "archetype_start"
    actual = {"gasM3": 100000.0, "year": 2024, "bpsOperationId": "7", "quality": "actual"}
    e = m.estimate(props, actual, cal, "ewrb", "bps")
    assert e["annualHeatMwh"] == U.sig(100000 * 10.36 * 0.85 / 1000, 4) == 880.6
    assert e["quality"] == "actual" and e["method"] == "bps_actual" and "bps" in e["sourceIds"]


def test_rounding_helpers():
    assert U.round_half_up(2.5) == 3 and U.round_half_up(3.5) == 4
    assert U.sig(3876.4, 4) == 3876 and U.sig(12345, 4) == 12350
    assert U.about(3876) == "3,900" and U.about(140) == "140" and U.about(975) == "980"

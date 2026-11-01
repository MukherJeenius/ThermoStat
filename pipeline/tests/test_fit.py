import pytest

from thermostat.fit import band_of, fit_assessment, fit_points, score_of


def _input(**kw):
    base = {"annualHeatMwh": 1000, "minM": 300, "distanceQuality": "approx_route", "heatingSystem": None,
            "type": "office", "ownerType": None, "yearBuilt": None, "boilerYearsLeft": None, "quality": "estimate",
            "activePermit": None, "typeAssumed": False}
    base.update(kw)
    return base


@pytest.mark.parametrize("min_m,expected", [(100, 25), (50, 25), (350, 12.5), (600, 0), (800, 0), (None, 0)])
def test_distance_points(min_m, expected):
    assert fit_points(_input(minM=min_m))["distance"] == expected


@pytest.mark.parametrize("q,expected", [(300, 0), (200, 0), (1650, 15), (3000, 30), (9000, 30)])
def test_size_points(q, expected):
    assert fit_points(_input(annualHeatMwh=q))["size"] == expected


def test_score_rounds_half_up():
    assert score_of({"size": 30, "distance": 12.5, "heating": 15, "anchor": 15, "timing": 6, "data": 5}) == 84
    assert score_of({"size": 30, "distance": 22.5, "heating": 3, "anchor": 8, "timing": 6, "data": 3}) == 73


@pytest.mark.parametrize("score,band", [(70, "strong"), (69, "possible"), (45, "possible"), (44, "weak")])
def test_bands(score, band):
    assert band_of(score) == band


def test_fit_parity_cases(fit_cases):
    assert len(fit_cases) >= 2
    halves = 0
    for case in fit_cases:
        inp = dict(case["input"], distanceQuality="approx_route", typeAssumed=False)
        got = fit_assessment(inp)
        exp = case["expected"]
        assert got["score"] == exp["score"], case["name"]
        assert got["band"] == exp["band"], case["name"]
        for k, v in exp["points"].items():
            assert got["points"][k] == pytest.approx(v, abs=1e-9), (case["name"], k)
        if sum(exp["points"].values()) % 1 == 0.5:
            halves += 1
    assert halves >= 2


def test_reasons_never_praise_unknowns():
    f = fit_assessment(_input(annualHeatMwh=3900, minM=140, quality="checked", type="hospital"))
    assert 1 <= len(f["reasons"]) <= 3
    assert f["reasons"][0] == "Large heat user: about 3,900 MWh a year (Checked estimate)."
    assert "About 140 m from the planned route (approximate)." in f["reasons"]
    assert "A public anchor building: a hospital." in f["reasons"]
    assert not any("hot water" in r for r in f["reasons"])
    assert f["missing"] == ["heating system", "year built"]

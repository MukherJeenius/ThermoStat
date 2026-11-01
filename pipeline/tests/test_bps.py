import pytest
from shapely.geometry import box, mapping

from conftest import step
from thermostat import bps as B
from thermostat import units as U
from thermostat.geo import to_wgs, utm_point


def test_gas_units():
    assert U.gas_to_m3(10, "GJ") == pytest.approx(268)
    assert U.gas_to_m3(1000, "ekWh") == pytest.approx(96.5)
    assert U.gas_to_m3(5, "m³") == 5
    assert U.gas_to_m3(5, "cubic metres") == 5
    with pytest.raises(ValueError):
        U.gas_to_m3(5, "therms")
    assert B.row_gas_m3({"Natural Gas Use (GJ)": 100})[0] == pytest.approx(2680)
    assert B.row_gas_m3({"Natural Gas Use (GJ)": "Not Available"}) == (None, None)


def test_intensity_units():
    assert U.intensity_to_kwh_m2(1, "ekWh/ft2") == pytest.approx(10.7639)
    assert U.intensity_to_kwh_m2(1, "kBtu/ft2") == pytest.approx(3.1546)
    assert U.intensity_to_kwh_m2(1, "GJ/m2") == pytest.approx(277.78)
    assert U.intensity_to_kwh_m2(1, "m3/m2") == pytest.approx(10.36)
    with pytest.raises(ValueError):
        U.intensity_to_kwh_m2(1, "MJ/ft2")


def test_address_and_name_normalisation():
    assert B.normalise_address("71 Main Street West") == B.normalise_address("71 MAIN ST. W")
    assert B.normalise_name("The Hamilton Public Library, Inc.") == "hamilton public library"


def _feature(fid, x, y, name=None, address=None, size=40):
    c = utm_point(-79.868, 43.257)
    g = to_wgs(box(c.x + x, c.y + y, c.x + x + size, c.y + y + size))
    return {"type": "Feature", "id": fid, "geometry": mapping(g),
            "properties": {"id": fid, "name": name, "address": address, "floorAreaM2": 4000.0}}


@pytest.fixture
def footprints():
    m = step("03_match_actuals")
    cands = [
        _feature("osm:way/1", 0, 0, name="Central Library", address="55 York Boulevard"),
        _feature("osm:way/2", 200, 0, name="Fire Station 1", address="10 King Street West"),
        _feature("osm:way/3", 400, 0, name="Fire Station 1 Annex"),
        _feature("osm:way/4", 0, 300, address="10 King Street West"),
    ]
    return m, m.Footprints(cands, cands)


def row(**kw):
    base = {"Portfolio Manager Property ID": 9, "Property Name": "Nothing alike", "Address": "1 Nowhere Rd",
            "Postal Code": "M5V 1A1", "Number of Buildings": 1,
            "Portfolio Manager Parent Property ID": "Not Applicable: Standalone Property"}
    base.update(kw)
    return base


def test_match_order_override_first(footprints):
    m, fps = footprints
    ids, method, _ = m.match_row(row(**{"Address": "55 York Blvd"}), fps, {"9": "osm:way/2"}, {})
    assert (ids, method) == (["osm:way/2"], "override")


def test_match_by_unique_address(footprints):
    m, fps = footprints
    ids, method, _ = m.match_row(row(Address="55 YORK BLVD"), fps, {}, {})
    assert (ids, method) == (["osm:way/1"], "address")


def test_ambiguous_address_falls_through_to_name(footprints):
    m, fps = footprints
    ids, method, _ = m.match_row(row(Address="10 King St W", **{"Property Name": "Central Library"}), fps, {}, {})
    assert (ids, method) == (["osm:way/1"], "name")


def test_name_ratio_threshold(footprints, monkeypatch):
    m, fps = footprints
    monkeypatch.setattr(m.B, "name_ratio", lambda a, b: 84 if b == "Central Library" else 0)
    assert m.match_row(row(), fps, {}, {})[0] == []
    monkeypatch.setattr(m.B, "name_ratio", lambda a, b: 85 if b == "Central Library" else 0)
    assert m.match_row(row(), fps, {}, {})[0] == ["osm:way/1"]


def test_name_match_respects_cached_geocode(footprints):
    m, fps = footprints
    c = utm_point(-79.868, 43.257)
    from shapely.geometry import Point
    p = to_wgs(Point(c.x + 2000, c.y))
    q = m.geocode_query(row(**{"Property Name": "Central Library"}))
    ids, _, _ = m.match_row(row(**{"Property Name": "Central Library"}), fps, {}, {q: {"lon": p.x, "lat": p.y}})
    assert ids == []


def test_campus_row_split(footprints):
    m, fps = footprints
    r = row(**{"Property Name": "Fire Station 1", "Number of Buildings": 2})
    ids, method, _ = m.match_row(r, fps, {}, {})
    assert method == "name_campus" and set(ids) == {"osm:way/2", "osm:way/3"}


def test_owner_from_sector():
    assert B.owner_from_sector("Municipal") == "public"
    assert B.owner_from_sector("Public Hospital") == "institutional"
    assert B.owner_from_sector(None) is None

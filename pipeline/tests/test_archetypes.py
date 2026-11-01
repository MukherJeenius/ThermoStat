import pytest

from thermostat import archetypes as A


@pytest.mark.parametrize("tags,fp,expected", [
    ({"building": "house"}, 900, None),
    ({"building": "detached"}, 900, None),
    ({"building": "garage"}, 900, None),
    ({"building": "yes", "amenity": "parking"}, 2000, None),
    ({"building": "shed"}, 900, None),
    ({"building": "industrial", "name": "Plant"}, 5000, None),
    ({"building": "warehouse"}, 5000, None),
    ({"building": "church"}, 900, None),
    ({"building": "yes", "amenity": "place_of_worship"}, 900, None),
    ({"building": "yes", "man_made": "works"}, 900, None),
    ({"building": "yes", "power": "substation"}, 900, None),
    ({"building": "yes", "amenity": "hospital"}, 900, "hospital"),
    ({"building": "hospital"}, 900, "hospital"),
    ({"building": "yes", "healthcare": "hospital"}, 900, "hospital"),
    ({"building": "school"}, 900, "school"),
    ({"building": "yes", "amenity": "university"}, 900, "school"),
    ({"building": "yes", "tourism": "hotel"}, 900, "hotel"),
    ({"building": "hotel"}, 900, "hotel"),
    ({"building": "yes", "amenity": "townhall"}, 900, "civic"),
    ({"building": "yes", "leisure": "ice_rink"}, 900, "civic"),
    ({"building": "government"}, 900, "civic"),
    ({"building": "yes", "office": "company"}, 900, "office"),
    ({"building": "office"}, 900, "office"),
    ({"building": "apartments"}, 900, "multi_res"),
    ({"building": "residential"}, 900, "multi_res"),
    ({"building": "yes", "shop": "supermarket"}, 900, "retail"),
    ({"building": "retail"}, 900, "retail"),
    ({"building": "commercial"}, 300, "mixed"),
    ({"building": "mixed_use"}, 300, "mixed"),
    ({"building": "yes", "name": "Lister Block"}, 300, "mixed"),
    ({"building": "yes", "amenity": "restaurant"}, 300, "mixed"),
    ({"building": "yes", "building:levels": "4"}, 300, "mixed"),
    ({"building": "yes"}, 600, "mixed"),
    # building=yes below each threshold stays context only
    ({"building": "yes", "building:levels": "3"}, 300, None),
    ({"building": "yes"}, 599.9, None),
    ({"building": "roof"}, 2000, None),
])
def test_archetype_rules(tags, fp, expected):
    arch, assumed = A.archetype(tags, fp)
    assert arch == expected
    if expected == "mixed" and tags.get("building") == "yes":
        assert assumed is True


def test_first_match_wins():
    assert A.archetype({"building": "apartments", "amenity": "hospital"}, 900)[0] == "hospital"
    assert A.archetype({"building": "office", "shop": "bakery"}, 900)[0] == "office"


def test_height_and_floor_area_fallbacks():
    assert A.height_m({"height": "42 m"}) == 42
    assert A.height_m({"height": "100 ft"}) == pytest.approx(30.5, abs=0.1)
    assert A.height_m({"building:levels": "4"}) == 14
    assert A.height_m({}) is None
    assert A.floor_area(500, {"building:levels": "4"}) == (2000, "levels")
    area, method = A.floor_area(500, {"height": "35"})
    assert method == "height" and area == pytest.approx(5000)
    assert A.floor_area(500, {}) == (1500, "assumed_3_levels")


def test_fields():
    assert A.year_built({"start_date": "c. 1888"}) == 1888
    assert A.year_built({"building:start_date": "2031"}) is None
    assert A.owner_type({}, "civic") == "public"
    assert A.owner_type({}, "school") == "institutional"
    assert A.owner_type({"operator:type": "private"}, "office") == "private"
    assert A.owner_type({}, "office") is None
    assert A.address({"addr:housenumber": "71", "addr:street": "Main Street West"}) == "71 Main Street West"

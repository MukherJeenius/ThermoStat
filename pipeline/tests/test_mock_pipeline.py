"""Steps 03 to 05 run unchanged on mock output, offline and with no key."""
import json

from conftest import step


def test_mock_then_03_to_05(tmp_out, monkeypatch):
    out, pub = tmp_out
    monkeypatch.setenv("OFFLINE", "1")
    monkeypatch.delenv("CLIMATIQ_API_KEY", raising=False)
    mock = step("mock")
    monkeypatch.setattr(mock, "OUT", out)
    assert mock.main() == 0
    feats = json.loads((out / "buildings_raw.geojson").read_text())["features"]
    assert len(feats) >= 80 and all(f["properties"]["synthetic"] for f in feats)

    m3 = step("03_match_actuals")
    monkeypatch.setattr(m3, "OUT", out)
    assert m3.main() == 0
    assert json.loads((out / "actuals.json").read_text())["buildings"] == {}

    m4 = step("04_estimate")
    monkeypatch.setattr(m4, "OUT", out)
    assert m4.main() == 0
    est = json.loads((out / "estimates.json").read_text())
    assert len(est) == len(feats)
    assert all(e["annualHeatMwh"] > 0 and e["quality"] in ("checked", "estimate") for e in est.values())

    m5 = step("05_factors")
    monkeypatch.setattr(m5, "PUBLIC_DATA", pub)
    monkeypatch.setattr(m5, "_key", lambda: "")
    assert m5.main() == 0
    f = json.loads((pub / "factors.json").read_text())
    assert f["sets"]["climatiq"] is None and f["climatiqReason"] == "no API key"
    assert f["sets"]["eccc"]["gridTPerMwh"]["2026"] == 0.070
    assert "CLIMATIQ" not in (pub / "factors.json").read_text()

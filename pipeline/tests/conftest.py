import importlib
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def step(name: str):
    """Import a pipeline step whose file name starts with a digit (steps.03_match_actuals)."""
    return importlib.import_module(f"steps.{name}")


@pytest.fixture
def fit_cases():
    return json.loads((REPO / "fixtures" / "fit-cases.json").read_text(encoding="utf-8"))


@pytest.fixture
def tmp_out(tmp_path, monkeypatch):
    """Point every step's OUT and PUBLIC_DATA at a temp folder."""
    out = tmp_path / "out"
    pub = tmp_path / "public" / "data"
    out.mkdir(parents=True)
    pub.mkdir(parents=True)
    import thermostat.io as io

    monkeypatch.setattr(io, "OUT", out)
    monkeypatch.setattr(io, "PUBLIC_DATA", pub)
    for mod in list(sys.modules.values()):
        name = getattr(mod, "__name__", "")
        if name.startswith("steps."):
            if hasattr(mod, "OUT"):
                monkeypatch.setattr(mod, "OUT", out)
            if hasattr(mod, "PUBLIC_DATA"):
                monkeypatch.setattr(mod, "PUBLIC_DATA", pub)
    return out, pub

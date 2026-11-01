"""Paths, HTTP and deterministic file writing shared by every pipeline step."""
from __future__ import annotations

import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]          # pipeline/
REPO = ROOT.parent
RAW = ROOT / "raw"
OUT = ROOT / "out"
PUBLIC_DATA = REPO / "public" / "data"
USER_AGENT = "ThermoStat/0.1 (+https://github.com/MukherJeenius/ThermoStat)"


def offline() -> bool:
    """OFFLINE=1 (make data OFFLINE=1): read raw/, the Climatiq lock and the geocode cache only."""
    return os.environ.get("OFFLINE") == "1"


class OfflineError(RuntimeError):
    """Raised when a step needs the network but OFFLINE=1."""


def ensure_dirs() -> None:
    for p in (RAW, OUT, PUBLIC_DATA):
        p.mkdir(parents=True, exist_ok=True)


def load_yaml(path: Path) -> Any:
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def dump_yaml(path: Path, data: Any, header: str = "") -> None:
    text = yaml.safe_dump(data, sort_keys=False, allow_unicode=True, width=110)
    path.write_text(header + text, encoding="utf-8")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _round_floats(obj: Any, digits: int | None) -> Any:
    if isinstance(obj, float):
        if digits is None:
            return obj
        r = round(obj, digits)
        return 0.0 if r == 0 else r
    if isinstance(obj, dict):
        return {k: _round_floats(v, digits) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_round_floats(v, digits) for v in obj]
    return obj


def write_json(path: Path, data: Any, *, sort_keys: bool = True, compact: bool = False) -> None:
    """Deterministic JSON: sorted keys, fixed separators, trailing newline."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(data, sort_keys=sort_keys, ensure_ascii=False, separators=(",", ":"))
    else:
        text = json.dumps(data, sort_keys=sort_keys, ensure_ascii=False, indent=1)
    path.write_text(text + "\n", encoding="utf-8")


def read_json(path: Path) -> Any:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def session():
    import requests

    s = requests.Session()
    s.headers["User-Agent"] = USER_AGENT
    return s


def http_get(url: str, *, timeout: float = 60, retries: int = 3, backoff: float = 2.0, **kw):
    """GET with retries and exponential backoff. Never logs headers."""
    if offline():
        raise OfflineError(f"offline: refusing to fetch {url}")
    import requests

    s = session()
    last: Exception | None = None
    for attempt in range(retries):
        try:
            r = s.get(url, timeout=timeout, **kw)
            if r.status_code in (429, 502, 503, 504):
                raise requests.HTTPError(f"HTTP {r.status_code}", response=r)
            return r
        except Exception as e:  # noqa: BLE001 - retried and re-raised
            last = e
            if attempt < retries - 1:
                time.sleep(backoff * (2**attempt))
    assert last is not None
    raise last

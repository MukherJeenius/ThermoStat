"""01_fetch: download every source once into raw/ and record raw/manifest.json.

Idempotent: files already present are skipped (their manifest entry is kept). Overpass gets 3 retries with
backoff, then the mirror, then a 4-quadrant split (spec 4). Glyphs are vendored into public/basemap/glyphs/.
"""
from __future__ import annotations

import datetime as dt
import json
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote

from thermostat.io import RAW, REPO, ROOT, ensure_dirs, load_yaml, read_json, session, sha256_file, write_json

MANIFEST = RAW / "manifest.json"
FRAME = (43.230, -79.900, 43.290, -79.770)          # south, west, north, east
GLYPH_STACKS = ["Noto Sans Regular", "Noto Sans Medium", "Noto Sans Italic"]
GLYPH_RANGES = ["0-255", "256-511", "8192-8447"]
GLYPH_DIR = REPO / "public" / "basemap" / "glyphs"
HTML_EVIDENCE_KEYS = ("hce-network", "fvb-hamilton", "hce-telecom", "dc-100-king")


class OverpassTooBig(RuntimeError):
    pass


class OverpassTimeout(RuntimeError):
    """A gateway timeout: retried, and when every attempt times out the query is split (spec 4)."""


def _today() -> str:
    return dt.date.today().isoformat()


def load_manifest() -> dict:
    return read_json(MANIFEST) if MANIFEST.exists() else {}


def record(manifest: dict, path: Path, url: str, licence: str | None, **extra) -> None:
    rel = str(path.relative_to(RAW)) if path.is_relative_to(RAW) else str(path.relative_to(REPO))
    entry = manifest.get(rel, {})
    entry.update({"url": url, "sha256": sha256_file(path), "bytes": path.stat().st_size,
                  "fetched": entry.get("fetched") or _today(), "licence": licence})
    entry.update(extra)
    manifest[rel] = entry


def download(s, url: str, dest: Path, *, timeout: float = 180) -> bool:
    """Return True when a new file was written. HTTP 401/403/404 are final (no retries)."""
    if dest.exists() and dest.stat().st_size > 0:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    last = None
    for attempt in range(3):
        try:
            with s.get(url, timeout=timeout, stream=True, allow_redirects=True) as r:
                if r.status_code in (401, 403, 404, 410):
                    raise PermissionError(f"HTTP {r.status_code}")
                r.raise_for_status()
                with open(tmp, "wb") as f:
                    for chunk in r.iter_content(1 << 16):
                        f.write(chunk)
            tmp.rename(dest)
            return True
        except PermissionError as e:
            raise RuntimeError(f"download refused: {e}") from e
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(2 * (2**attempt))
    raise RuntimeError(f"download failed: {last}")


# ---------------------------------------------------------------- Overpass


def _overpass_once(s, endpoint: str, query: str) -> dict:
    r = s.post(endpoint, data={"data": query}, timeout=360)
    text = r.text
    if r.status_code == 200:
        data = r.json()
        remark = data.get("remark") or ""
        if "out of memory" in remark or "timed out" in remark:
            raise OverpassTooBig(remark)
        return data
    # Overpass reports its own runtime limits in the body of a 400/504; anything else is the server being busy
    body = text[:4000].lower()
    if r.status_code in (400, 504) and ("out of memory" in body or "runtime error" in body and "timed out" in body):
        raise OverpassTooBig(f"HTTP {r.status_code}: query hit a runtime limit")
    if r.status_code == 504:
        raise OverpassTimeout("HTTP 504 gateway timeout")
    raise RuntimeError(f"Overpass HTTP {r.status_code}")


def overpass(s, endpoints: list[str], query: str) -> tuple[dict, str]:
    """3 tries with backoff on each endpoint in turn (primary, then the mirror). A memory or runtime error, or
    timeouts on every attempt, raise OverpassTooBig so the caller splits the frame into quadrants."""
    last: Exception | None = None
    timeouts = attempts = 0
    for ep in endpoints:
        for attempt in range(3):
            attempts += 1
            try:
                return _overpass_once(s, ep, query), ep
            except OverpassTooBig:
                raise
            except Exception as e:  # noqa: BLE001
                last = e
                if isinstance(e, OverpassTimeout) or "timed out" in str(e).lower():
                    timeouts += 1
                print(f"  overpass {ep} attempt {attempt + 1} failed: {str(e)[:120]}")
                time.sleep(5 * (2**attempt))
    if timeouts == attempts:
        raise OverpassTooBig(f"every attempt timed out ({attempts})")
    raise RuntimeError(f"Overpass failed on every endpoint: {last}")


def _bbox_query(template: str, bbox: tuple[float, float, float, float]) -> str:
    b = ",".join(f"{v:.3f}" for v in bbox)
    return re.sub(r"\[bbox:[^\]]+\]", f"[bbox:{b}]", template)


def fetch_overpass(s, manifest: dict, endpoints: list[str], name: str, query_file: Path) -> None:
    dest = RAW / "osm" / f"{name}.json"
    if dest.exists():
        print(f"skip {dest.relative_to(RAW)} (present)")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    template = query_file.read_text(encoding="utf-8")
    try:
        data, ep = overpass(s, endpoints, template)
        parts = [{"bbox": list(FRAME), "timestamp_osm_base": data["osm3s"]["timestamp_osm_base"], "endpoint": ep}]
        elements = data["elements"]
    except OverpassTooBig as e:
        print(f"  {name}: too big ({str(e)[:80]}); splitting into 4 quadrants")
        s_, w, n, e_ = FRAME
        mlat, mlon = (s_ + n) / 2, (w + e_) / 2
        quads = [(s_, w, mlat, mlon), (s_, mlon, mlat, e_), (mlat, w, n, mlon), (mlat, mlon, n, e_)]
        by_id: dict[str, dict] = {}
        parts = []
        for q in quads:
            d, ep = overpass(s, endpoints, _bbox_query(template, q))
            parts.append({"bbox": list(q), "timestamp_osm_base": d["osm3s"]["timestamp_osm_base"], "endpoint": ep})
            for el in d["elements"]:
                by_id[f"{el['type']}/{el['id']}"] = el
        elements = list(by_id.values())
    elements.sort(key=lambda el: (el["type"], el["id"]))
    osm_base = min(p["timestamp_osm_base"] for p in parts)
    out = {"osm3s": {"timestamp_osm_base": osm_base}, "parts": parts, "elements": elements}
    dest.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    record(manifest, dest, endpoints[0], "ODbL 1.0", query=str(query_file.relative_to(ROOT)), parts=parts,
           osm_base=osm_base, split=len(parts) > 1)
    print(f"fetched {dest.relative_to(RAW)}: {len(elements)} elements, osm base {osm_base}, parts {len(parts)}")


# ---------------------------------------------------------------- datasets


def pick_ckan(src: dict, *, want: str) -> dict | None:
    """Choose the English resource of the newest year (or the data dictionary)."""
    res = [r for r in src.get("resources", []) if r.get("url")]
    english = [r for r in res if not re.search(r"french|les_donnees|energie_eau|dictionnaire|rapports_de", r["url"], re.I)]
    if want == "dictionary":
        return next((r for r in english if "dictionary" in (r["name"] or "").lower()), None)
    years = [r for r in english if re.search(r"(20\d\d)", r["name"] or "") and "normalized" not in (r["name"] or "").lower()
             and "did not report" not in (r["name"] or "").lower()]
    years.sort(key=lambda r: int(re.search(r"(20\d\d)", r["name"]).group(1)))
    return years[-1] if years else None


def main() -> int:
    ensure_dirs()
    sources = load_yaml(ROOT / "sources.yml")
    by = {x["key"]: x for x in sources}
    s = session()
    manifest = load_manifest()

    # datasets: BPS (latest year) and EWRB (latest year + dictionary)
    for key, want, sub in (("bps", "year", "bps"), ("ewrb", "year", "ewrb"), ("ewrb", "dictionary", "ewrb")):
        r = pick_ckan(by[key], want=want)
        if not r:
            print(f"warning: no {want} resource for {key}")
            continue
        year = re.search(r"(20\d\d)", r["name"] or "")
        fname = f"{key}-{'dictionary' if want == 'dictionary' else year.group(1)}.xlsx"
        dest = RAW / sub / fname
        new = download(s, r["url"], dest)
        record(manifest, dest, r["url"], by[key].get("licence"), resource=r["name"], last_modified=r["last_modified"])
        print(("fetched " if new else "skip ") + str(dest.relative_to(RAW)))

    # documents: HCE PDFs, the CEEP, and HTML snapshots for evidence. A refused download is recorded, not fatal.
    for src in sources:
        url = src.get("url")
        if not url:
            continue
        if src["key"].startswith("hce-") and src.get("docKind") == "pdf":
            dest = RAW / "hce" / f"{src['key']}.pdf"
        elif src["key"].startswith("ceep") and src.get("docKind") == "pdf":
            dest = RAW / "docs" / f"{src['key']}.pdf"
        elif src["key"] in HTML_EVIDENCE_KEYS or src.get("snapshot"):
            dest = RAW / "web" / f"{src['key']}.html"
        else:
            continue
        try:
            new = download(s, url, dest)
        except Exception as e:  # noqa: BLE001
            print(f"unavailable {src['key']}: {str(e)[:140]}")
            manifest.setdefault("_unavailable", {})[src["key"]] = {"url": url, "reason": str(e)[:200], "on": _today()}
            continue
        record(manifest, dest, url, src.get("licence"), source=src["key"])
        manifest.get("_unavailable", {}).pop(src["key"], None)
        print(("fetched " if new else "skip ") + str(dest.relative_to(RAW)))

    if "--docs-only" in sys.argv:
        write_json(MANIFEST, manifest)
        return 0

    # glyphs (committed under public/basemap/glyphs; only the stacks and ranges the style uses)
    base = by["protomaps-glyphs"]["url"]
    for stack in GLYPH_STACKS:
        for rng in GLYPH_RANGES:
            dest = GLYPH_DIR / stack / f"{rng}.pbf"
            download(s, base + quote(stack) + "/" + rng + ".pbf", dest)
    print(f"glyphs: {len(GLYPH_STACKS)} stacks x {len(GLYPH_RANGES)} ranges in {GLYPH_DIR.relative_to(REPO)}")

    write_json(MANIFEST, manifest)

    # OpenStreetMap via Overpass
    endpoints = [by["osm"]["url"]] + ([by["osm-mirror"]["url"]] if by.get("osm-mirror", {}).get("url") else [])
    try:
        fetch_overpass(s, manifest, endpoints, "places", ROOT / "queries" / "places.overpassql")
        fetch_overpass(s, manifest, endpoints, "buildings", ROOT / "queries" / "buildings.overpassql")
    finally:
        write_json(MANIFEST, manifest)

    write_json(MANIFEST, manifest)
    print(f"manifest: {len(manifest)} files")
    return 0


if __name__ == "__main__":
    sys.exit(main())

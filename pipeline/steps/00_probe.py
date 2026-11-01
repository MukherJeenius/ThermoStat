"""00_probe: resolve every source URL in sources.yml and write out/probe-report.md.

Metadata requests only: CKAN package_show, HEAD (or a 1-byte ranged GET), the HCE reports page,
the Protomaps build list, and Climatiq data-versions only when a key exists. No large downloads.
"""
from __future__ import annotations

import datetime as dt
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urljoin, unquote

from thermostat.io import OUT, ROOT, dump_yaml, ensure_dirs, load_yaml, session

SOURCES = ROOT / "sources.yml"
HEADER = (
    "# Every source ThermoStat uses. URLs are seeds from docs/build-spec.md section 4 or were found by search\n"
    "# (found_by/found_on). 00_probe resolves them and writes the results back here; never hand-build a URL.\n"
)
HCE_PDF_KEYS = [
    (re.compile(r"SUMMARY REPORT", re.I), "hce-summary"),
    (re.compile(r"FINAL REPORT", re.I), "hce-full"),
    (re.compile(r"OVERVIEW REPORT", re.I), "hce-overview"),
    (re.compile(r"McMaster", re.I), "hce-mcmaster-policy"),
    (re.compile(r"Mohawk", re.I), "hce-mohawk-storage"),
    (re.compile(r"Progress Report", re.I), "hce-ap-progress"),
]


class _Links(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            for k, v in attrs:
                if k == "href" and v:
                    self.links.append(v)


def head_or_range(s, url: str) -> dict:
    """HEAD; on 400/403/405/501 one GET with Range: bytes=0-0 (200 or 206 passes)."""
    try:
        r = s.head(url, allow_redirects=True, timeout=30)
        method = "HEAD"
        if r.status_code in (400, 403, 405, 501):
            r = s.get(url, headers={"Range": "bytes=0-0"}, allow_redirects=True, timeout=30, stream=True)
            r.close()
            method = "GET range"
        ok = r.status_code in (200, 206)
        return {
            "status": r.status_code,
            "method": method,
            "final_url": r.url,
            "content_type": r.headers.get("Content-Type"),
            "bytes": r.headers.get("Content-Length") if method == "HEAD" else _range_total(r),
            "ok": ok,
        }
    except Exception as e:  # noqa: BLE001
        return {"status": None, "method": "HEAD", "error": type(e).__name__ + ": " + str(e)[:160], "ok": False}


def _range_total(r) -> str | None:
    cr = r.headers.get("Content-Range")
    if cr and "/" in cr:
        return cr.split("/")[-1]
    return r.headers.get("Content-Length")


def probe_ckan(s, src: dict) -> dict:
    slug = src["slug"]
    for host in ("data.ontario.ca", "data2.ontario.ca"):
        api = f"https://{host}/api/3/action/package_show?id={slug}"
        try:
            r = s.get(api, timeout=60)
            if r.status_code != 200:
                continue
            pkg = r.json()["result"]
            res = [
                {
                    "name": x.get("name"),
                    "format": (x.get("format") or "").upper() or None,
                    "last_modified": x.get("last_modified") or x.get("created"),
                    "url": x.get("url"),
                }
                for x in pkg.get("resources", [])
            ]
            src["url"] = f"https://{host}/dataset/{slug}"
            src["api"] = api
            src["resources"] = res
            src["licence"] = src.get("licence") or (pkg.get("license_title") or None)
            return {"status": 200, "method": "CKAN package_show", "final_url": api, "ok": True,
                    "note": f"{len(res)} resources; licence {pkg.get('license_title')}"}
        except Exception as e:  # noqa: BLE001
            last = f"{type(e).__name__}: {str(e)[:120]}"
    return {"status": None, "method": "CKAN package_show", "ok": False, "error": locals().get("last", "not found")}


def probe_hce(s, src: dict, sources: list[dict]) -> dict:
    r = s.get(src["url"], timeout=60, allow_redirects=True)
    p = _Links()
    p.feed(r.text)
    pdfs = sorted({urljoin(r.url, h) for h in p.links if ".pdf" in h.lower()})
    src["final_url"] = r.url
    src["pdf_links"] = pdfs
    by_key = {x["key"]: x for x in sources}
    assigned = []
    for link in pdfs:
        name = unquote(link.rsplit("/", 1)[-1])
        for pat, key in HCE_PDF_KEYS:
            if pat.search(name) and key in by_key:
                if by_key[key].get("url") != link:
                    by_key[key]["url"] = link
                by_key[key]["found_by"] = "hce-reports-page"
                assigned.append(key)
                break
    return {"status": r.status_code, "method": "GET page", "final_url": r.url, "ok": r.status_code == 200,
            "note": f"{len(pdfs)} PDF links; assigned {', '.join(assigned) or 'none'}"}


def probe_protomaps(s, src: dict) -> dict:
    r = s.get(src["url"], timeout=60)
    builds = r.json()
    builds = [b for b in builds if re.fullmatch(r"\d{8}\.pmtiles", b.get("key", ""))]
    newest = max(builds, key=lambda b: b["key"])
    src["newest_build"] = newest["key"].removesuffix(".pmtiles")
    src["newest_build_uploaded"] = newest.get("uploaded")
    src["newest_build_bytes"] = newest.get("size")
    src["archive_url"] = f"https://build.protomaps.com/{newest['key']}"
    archive = head_or_range(s, src["archive_url"])
    return {"status": r.status_code, "method": "GET JSON", "final_url": r.url, "ok": archive["ok"],
            "note": f"newest build {src['newest_build']} ({newest.get('version')}); archive {archive.get('status')} via {archive.get('method')}"}


def probe_overpass(s, src: dict) -> dict:
    """A tiny query (one node id); Overpass answers HEAD slowly or not at all."""
    try:
        r = s.get(src["url"], params={"data": "[out:json][timeout:20];node(1);out ids;"}, timeout=45)
        ok = r.status_code == 200 and "osm3s" in r.text
        base = r.json().get("osm3s", {}).get("timestamp_osm_base") if ok else None
        return {"status": r.status_code, "method": "GET tiny query", "final_url": src["url"], "ok": ok,
                "note": f"timestamp_osm_base {base}" if base else ""}
    except Exception as e:  # noqa: BLE001
        return {"status": None, "method": "GET tiny query", "ok": False, "error": type(e).__name__ + ": " + str(e)[:120]}


def probe_climatiq(s, src: dict) -> dict:
    key = os.environ.get("CLIMATIQ_API_KEY", "").strip()
    if not key:
        return {"status": None, "method": "skipped", "ok": True, "note": "no CLIMATIQ_API_KEY; ECCC fallback path"}
    r = s.get(src["url"], headers={"Authorization": "Bearer " + key}, timeout=20)
    note = ""
    if r.status_code == 200:
        note = f"latest_release {r.json().get('latest_release')}"
    return {"status": r.status_code, "method": "GET data-versions", "final_url": src["url"], "ok": r.status_code == 200,
            "note": note}


def main() -> int:
    ensure_dirs()
    try:
        from dotenv import load_dotenv

        load_dotenv(ROOT / ".env")
    except Exception:  # noqa: BLE001
        pass
    sources = load_yaml(SOURCES)
    s = session()
    rows = []
    today = dt.date.today().isoformat()
    for src in sources:
        kind = src.get("probe", "head")
        if not src.get("url") and kind not in ("hce_pdf",):
            res = {"status": None, "method": "-", "ok": False, "error": src.get("unavailable") or "no URL found yet"}
        elif kind == "ckan":
            res = probe_ckan(s, src)
        elif kind == "hce_reports":
            res = probe_hce(s, src, sources)
        elif kind == "protomaps":
            res = probe_protomaps(s, src)
        elif kind == "climatiq":
            res = probe_climatiq(s, src)
        elif kind == "overpass":
            res = probe_overpass(s, src)
        elif kind == "local":
            res = {"status": None, "method": "local file", "ok": True, "note": src.get("note", "")}
        else:
            res = None
        rows.append((src, res))
    # second pass: HEAD every plain URL (including PDFs assigned by the reports page)
    for i, (src, res) in enumerate(rows):
        if res is None:
            if src.get("url"):
                url = src["url"] + (src.get("probe_suffix") or "")
                res = head_or_range(s, url)
            else:
                res = {"status": None, "method": "-", "ok": False, "error": src.get("unavailable") or "no URL found yet"}
            rows[i] = (src, res)
        src["probe"] = src.get("probe", "head")
        src["probed_on"] = today
        src["probe_status"] = res.get("status")
        src["probe_method"] = res.get("method")
        if res.get("bytes"):
            src["probe_bytes"] = int(res["bytes"]) if str(res["bytes"]).isdigit() else res["bytes"]
    dump_yaml(SOURCES, sources, HEADER)

    lines = [
        "# 00_probe report",
        "",
        f"Run on {today}. Metadata requests only.",
        "",
        "| key | row | status | method | ok | url | note |",
        "|---|---|---|---|---|---|---|",
    ]
    for src, res in rows:
        note = res.get("note") or res.get("error") or ""
        if src.get("found_by") == "search":
            note = (note + " · found by search " + str(src.get("found_on", ""))).strip(" ·") + " [Verify]"
        lines.append(
            f"| {src['key']} | {src.get('row', '')} | {res.get('status')} | {res.get('method')} | "
            f"{'yes' if res.get('ok') else 'NO'} | {src.get('url') or '-'} | {note} |"
        )
    ck = [x for x in sources if x.get("probe") == "ckan"]
    for src in ck:
        lines += ["", f"## {src['key']}: CKAN resources", "", "| name | format | last modified | url |", "|---|---|---|---|"]
        for r in src.get("resources", []):
            lines.append(f"| {r['name']} | {r['format']} | {(r['last_modified'] or '')[:10]} | {r['url']} |")
    hce = next((x for x in sources if x.get("probe") == "hce_reports"), None)
    if hce:
        lines += ["", "## hce.net/reports PDF links", ""] + [f"- {u}" for u in hce.get("pdf_links", [])]
    pm = next((x for x in sources if x.get("probe") == "protomaps"), None)
    if pm and pm.get("newest_build"):
        lines += ["", "## Protomaps", "",
                  f"Newest build: **{pm['newest_build']}** (uploaded {pm.get('newest_build_uploaded')}, "
                  f"{pm.get('newest_build_bytes')} bytes). Archive: {pm.get('archive_url')}"]
    (OUT / "probe-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    bad = [src["key"] for src, res in rows if not res.get("ok")]
    print(f"probe: {len(rows)} sources, {len(rows) - len(bad)} ok; unresolved: {', '.join(bad) or 'none'}")
    print(f"report: {OUT / 'probe-report.md'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

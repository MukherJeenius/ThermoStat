"""08_evidence: exact excerpts with page labels for every claim in evidence/claims.yml (spec 6.3).

A claim whose anchors are not found on any page stays `unknown` with `source: null` and is listed in
out/evidence-report.md for a person. There is no fallback to typed text.
"""
from __future__ import annotations

import csv
import sys

from thermostat.evidence import ExcerptError, check_excerpt, find_passage, html_text, normalise, page_label, pdf_pages
from thermostat.io import OUT, RAW, ROOT, ensure_dirs, load_yaml, read_json, write_json

DEFAULT_INTERP = {
    "proposed": "A plan or intention in a public document. Not yet a delivery.",
    "required": "A condition set by a rule, permit or approval.",
    "reported": "The holder says it is so. Not independently checked.",
    "verified": "Confirmed by an independent public record.",
    "unknown": "No public record found. This is an open question, not non-compliance.",
}


def doc_path(key: str, doc_kind: str):
    if doc_kind == "pdf":
        for p in (RAW / "hce" / f"{key}.pdf", RAW / "docs" / f"{key}.pdf"):
            if p.exists():
                return p
        return None
    p = RAW / "web" / f"{key}.html"
    return p if p.exists() else None


def checks() -> dict[str, dict]:
    p = ROOT / "evidence" / "checks.csv"
    out = {}
    if p.exists():
        with open(p, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                out[r["claim_id"]] = r
    return out


def main() -> int:
    ensure_dirs()
    claims = load_yaml(ROOT / "evidence" / "claims.yml")
    sources = {s["key"]: s for s in load_yaml(ROOT / "sources.yml")}
    manifest = read_json(RAW / "manifest.json") if (RAW / "manifest.json").exists() else {}
    by_source = {v.get("source"): v for k, v in manifest.items() if isinstance(v, dict) and v.get("source")}
    human = checks()
    cache: dict[str, list[dict]] = {}
    commitments, records, report = [], [], []
    for c in claims:
        rec = None
        why = None
        if c.get("doc"):
            src = sources[c["doc"]]
            path = doc_path(c["doc"], src["docKind"])
            if path is None:
                why = "Source not available (document not cached)"
            else:
                if c["doc"] not in cache:
                    cache[c["doc"]] = pdf_pages(path) if src["docKind"] == "pdf" else [
                        {"index": None, "label": None, "text": html_text(path), "columns": []}]
                hits = []
                for pg in cache[c["doc"]]:
                    for text in list(pg.get("columns") or []) + [pg["text"]]:   # columns first (spec 6.3)
                        passage = find_passage(text, c["anchors"])
                        if passage:
                            hits.append((pg, text, passage))
                            break
                if c.get("page_hint") is not None:
                    hits.sort(key=lambda h: h[0]["index"] != c["page_hint"])
                if not hits:
                    why = "anchors not found on any page"
                else:
                    pg, text, passage = hits[0]
                    excerpt, norm = normalise(passage)
                    try:
                        check_excerpt(excerpt, text)
                        man = by_source.get(c["doc"], {})
                        hc = human.get(c["id"])
                        if hc and hc.get("matches") == "no":
                            print(f"08_evidence: {c['id']} was checked and does NOT match its page; fix the claim")
                            return 1
                        rec = {
                            "id": f"src-{c['id']}", "title": src["title"], "url": src["url"],
                            "documentDate": src.get("documentDate"), "retrievedAt": man.get("fetched") or src.get("probed_on"),
                            "page": (page_label(pg) if pg["index"] else None), "excerpt": excerpt, "synthetic": False,
                            "shortTitle": src["shortTitle"], "publisher": src.get("publisher"), "docKind": src["docKind"],
                            "pdfPageIndex": pg["index"], "excerptNormalisation": norm, "sha256": man.get("sha256"),
                            "licence": src.get("licence"),
                            "humanCheck": {"checkedBy": hc["checked_by"], "checkedOn": hc["checked_on"]}
                            if hc and hc.get("matches") == "yes" else None,
                        }
                        if len(hits) > 1:
                            others = [h[0]["index"] for h in hits[1:]]
                            report.append(f"- {c['id']}: also matched on pages {others}")
                    except ExcerptError as e:
                        why = f"excerpt refused: {e}"
        status = c["status"] if rec else "unknown"
        if rec:
            records.append(rec)
        commitments.append({"claimId": c["id"], "facility": c.get("facility"), "commitment": {
            "id": c["id"], "topic": c["topic"], "title": c["title"], "summary": c["summary"], "status": status,
            "source": rec, "question": c.get("question"), "interpretation": c.get("interpretation"),
            "holder": c.get("holder") if rec else None}, "why": why, "doc": c.get("doc")})
    found = [x for x in commitments if x["commitment"]["source"]]
    unknown = [x for x in commitments if not x["commitment"]["source"]]
    sought_missing = [x for x in unknown if x["doc"]]
    checked = [x for x in found if x["commitment"]["source"]["humanCheck"]]
    lines = ["# Evidence report", "", f"{len(commitments)} claims: {len(found)} found, {len(unknown)} unknown "
             f"({len(sought_missing)} sought but not located), {len(checked)} checked by a person.", "",
             "## Found (each needs a person to check it against the page, evidence/checks.csv)", ""]
    for x in found:
        s = x["commitment"]["source"]
        lines.append(f"- **{x['claimId']}** · {s['shortTitle']}, page {s['page'] or 'n/a'} (PDF p. {s['pdfPageIndex']}) · "
                     f"{'checked by ' + s['humanCheck']['checkedBy'] if s['humanCheck'] else 'NOT YET CHECKED'} · {s['url']}")
        lines.append(f"  > {s['excerpt']}")
    lines += ["", "## Unknown", ""]
    for x in unknown:
        lines.append(f"- **{x['claimId']}**: {x['why'] or 'no public record sought (no source known)'}")
    if report:
        lines += ["", "## Notes", ""] + report
    (OUT / "evidence-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    write_json(OUT / "evidence.json", {"commitments": commitments, "records": records,
                                       "counts": {"claims": len(commitments), "found": len(found), "unknown": len(unknown),
                                                  "humanChecked": len(checked)}})
    print(f"08_evidence: {len(commitments)} claims; found {len(found)}; unknown {len(unknown)} "
          f"(not located: {[x['claimId'] for x in sought_missing]}); checked {len(checked)}")
    _ = DEFAULT_INTERP
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Evidence extraction (spec 6.3): find the exact passage that contains every anchor, with its page.

Anchors are matched against a folded copy of the page text (NFKC; U+00A0, U+2009 and U+202F as spaces;
case-insensitive) with an offset map back to the original. The stored excerpt is the original slice with whitespace
and line-break hyphens normalised (and ligatures replaced), and must occur verbatim in the normalised page text.
"""
from __future__ import annotations

import re
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

MAX_WORDS = 60
LIGATURES = {"ﬀ": "ff", "ﬁ": "fi", "ﬂ": "fl", "ﬃ": "ffi", "ﬄ": "ffl", "ﬅ": "st", "ﬆ": "st"}
_SPACES = {" ": " ", " ": " ", " ": " "}
_SENT_END = re.compile(r"(?<=[.!?;:])\s+(?=[“\"(A-Z0-9•u])|\n\s*(?:u|•)\s+|\n\s*\n")


class ExcerptError(ValueError):
    pass


def fold(text: str) -> tuple[str, list[int]]:
    """Folded text and, for every folded character, the index of the original character it came from."""
    out, idx = [], []
    for i, ch in enumerate(text):
        ch2 = _SPACES.get(ch, ch)
        f = unicodedata.normalize("NFKC", ch2).lower()
        for c in f:
            out.append(c)
            idx.append(i)
    return "".join(out), idx


def normalise(s: str) -> tuple[str, str]:
    """Whitespace and line-break hyphens normalised, ligatures replaced. Returns (text, normalisation label)."""
    kinds = []
    t = s
    t2 = re.sub(r"(\w)-\n(\w)", r"\1\2", t)
    if t2 != t:
        kinds.append("hyphenation")
    t = t2
    t3 = re.sub(r"[\s\u200b\u200c\u200d\ufeff]+", " ", t).strip()
    ws = t3 != t
    t = t3
    lig = any(c in t for c in LIGATURES)
    for k, v in LIGATURES.items():
        t = t.replace(k, v)
    if lig:
        kinds.append("ligatures")
    if not kinds and not ws:
        return t, "none"
    label = "whitespace" + ("+hyphenation" if "hyphenation" in kinds else "") + ("+ligatures" if "ligatures" in kinds else "")
    if "ligatures" in kinds and "hyphenation" not in kinds:
        label = "whitespace+hyphenation+ligatures"
    return t, label


def sentences(text: str) -> list[tuple[int, int]]:
    """Sentence spans (start, end) in the original text."""
    spans, start = [], 0
    for m in _SENT_END.finditer(text):
        end = m.start()
        if text[start:end].strip():
            spans.append((start, end))
        start = m.end()
    if text[start:].strip():
        spans.append((start, len(text.rstrip())))
    return spans


def find_passage(page_text: str, anchors: list[str]) -> str | None:
    """The sentence (or at most 2 adjacent sentences) containing every anchor, as the original slice."""
    folded, idx = fold(page_text)
    fanchors = [fold(a)[0] for a in anchors]
    spans = sentences(page_text)

    def has_all(a: int, b: int) -> bool:
        fa = next((k for k, o in enumerate(idx) if o >= a), len(idx))
        fb = next((k for k, o in enumerate(idx) if o >= b), len(idx))
        seg = re.sub(r"\s+", " ", folded[fa:fb])
        return all(re.sub(r"\s+", " ", x) in seg for x in fanchors)

    def is_heading(line: str) -> bool:
        """A short, title-like line: at most 16 words, at least 70 % of them capitalised, no closing punctuation."""
        words = [w for w in re.findall(r"[A-Za-z][A-Za-z'’-]*", line)]
        if not words or len(line.split()) > 20 or re.search(r"[.,;:]$", line):
            return False
        if len(line.split()) <= 7:          # a short table cell or label line
            return True
        caps = sum(1 for w in words if w[0].isupper())
        return caps / len(words) >= 0.7

    def trim_headings(a: int, b: int) -> int:
        """Drop leading heading lines glued to the passage."""
        while True:
            nl = page_text.find("\n", a, b)
            if nl == -1:
                return a
            first = page_text[a:nl].strip()
            rest = page_text[nl + 1:b].lstrip()
            if not first or not is_heading(first) or not rest[:1].isupper() or not has_all(nl + 1, b):
                return a
            a = nl + 1

    for i, (a, b) in enumerate(spans):
        if has_all(a, b):
            return page_text[trim_headings(a, b):b]
    for i in range(len(spans) - 1):
        a, b = spans[i][0], spans[i + 1][1]
        if has_all(a, b):
            return page_text[trim_headings(a, b):b]
    return None


def check_excerpt(excerpt: str, page_text: str) -> None:
    norm_page, _ = normalise(page_text)
    if excerpt not in norm_page:
        raise ExcerptError("excerpt does not occur verbatim in the normalised page text")
    if len(excerpt.split()) > MAX_WORDS:
        raise ExcerptError(f"excerpt has {len(excerpt.split())} words (max {MAX_WORDS})")


def two_columns(pg) -> list[str]:
    """Left and right column text when the page's words fall into two x-bands, else []."""
    words = pg.extract_words()
    if len(words) < 40:
        return []
    w = pg.width
    best = None
    for frac in [x / 100 for x in range(38, 63)]:
        cut = w * frac
        crossing = sum(1 for wd in words if wd["x0"] < cut < wd["x1"])
        left = sum(1 for wd in words if wd["x1"] <= cut)
        right = sum(1 for wd in words if wd["x0"] >= cut)
        if left > 0.2 * len(words) and right > 0.2 * len(words):
            if best is None or crossing < best[0]:
                best = (crossing, cut)
    if best is None or best[0] > 0.02 * len(words):
        return []
    cut = best[1]
    return [pg.crop((0, 0, cut, pg.height)).extract_text() or "", pg.crop((cut, 0, w, pg.height)).extract_text() or ""]


def pdf_pages(path: Path) -> list[dict]:
    """Per page: text, the printed page label (else None) and the 1-based physical index, plus column halves."""
    import pdfplumber
    import pypdf

    try:
        labels = pypdf.PdfReader(str(path)).page_labels
    except Exception:  # noqa: BLE001
        labels = None
    pages = []
    with pdfplumber.open(str(path)) as pdf:
        for i, pg in enumerate(pdf.pages):
            text = pg.extract_text() or ""
            cols = []
            try:
                cols = two_columns(pg)
            except Exception:  # noqa: BLE001
                cols = []
            label = labels[i] if labels and i < len(labels) else None
            pages.append({"index": i + 1, "label": label, "text": text, "columns": cols})
    return pages


def page_label(page: dict) -> str:
    """The printed page label when the PDF has one, else "PDF p. N"."""
    lab = page.get("label")
    if lab and not re.fullmatch(r"\d+", str(lab)) or (lab and str(lab) != str(page["index"])):
        return str(lab)
    if lab:
        return str(lab)
    return f"PDF p. {page['index']}"


class _Text(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "nav", "footer", "header", "form"}
    BLOCK = {"p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "br", "section", "article", "tr", "td", "ul", "ol"}

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self.skip += 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self.skip:
            self.skip -= 1
        elif tag in self.BLOCK:
            self.parts.append("\n")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def html_text(path: Path) -> str:
    p = _Text()
    p.feed(path.read_text(encoding="utf-8", errors="replace"))
    text = "".join(p.parts)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    return text.strip()

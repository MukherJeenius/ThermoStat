# Definition of done: spec section 16

Checked on 1 November 2026 against `main` (after commit 9a8d889), on the Mac with local Chrome and the production
preview on 127.0.0.1:4173. **PASS** means it was run here and the evidence is named. **FAIL** means it was run and
missed. **NOT VERIFIABLE HERE** means it could not be run in this session. **CHANGED BY DECISION** means Krishna's later
design direction (the ledger look in blue, cream and navy, flat context buildings, solid heat lines) replaced the
original measure on purpose.

Rerun everything with:

```
npm run check                      # typecheck, lint, Vitest (75), contrast
npm run build && npm run preview   # then, in another shell:
npm run check:print                # 4 briefs, 1 page each
npm run check:offline              # writes test-results/offline-log.json
npm run shots                      # sizes × states, no horizontal scroll
npm run shots:notes                # every notes save state
npm run shots:states               # every state in section 13
(cd pipeline && .venv/bin/python -m pytest -q)
```

Screenshots and logs go to `test-results/` (git-ignored).

## Data and pipeline

| Item | Result | Evidence |
|---|---|---|
| `00_probe` report; each source resolved or marked unavailable | PASS | `pipeline/out/probe-report.md` |
| At least 80 real buildings in `recipients.geojson` | PASS | 375 real, 0 synthetic, 20 ranked |
| Actual recipients from BPS: at least 5 | PASS | 7 recipients with `quality: actual` |
| Mock data only on a pipeline failure, labelled | PASS | no synthetic items in `public/data/` |
| `make data OFFLINE=1` byte-identical across two runs | NOT VERIFIABLE HERE | not rerun this session; the full OSM context fetch is still running (see Open items) |
| `pytest` passes with no network and no key | PASS | 74 passed in 6.2 s |
| Evidence report lists every claim; excerpts verbatim on their page | PASS (automatic part) | `pipeline/out/evidence-report.md`; the human check of each excerpt against its PDF page is still a human task [Verify] |
| Every operational and proposed connection has evidence; every URL is HTTPS | PASS | 32 connections, 0 without evidence; 18 sources, 0 non-HTTPS |

## Engine

| Item | Result | Evidence |
|---|---|---|
| Every 8.5 row passes in Vitest, including fit parity with Python | PASS | `npm test`: 75 passed, including `fit.test.ts` parity and `scripts/data.test.mjs` |

## Interface fidelity

| Item | Result | Evidence |
|---|---|---|
| Header, rail and card sizes; panel radius 30 px; one primary panel | CHANGED BY DECISION | The ledger design uses a slim 56 px header, a flush rail and 4 px corners. One primary panel at a time still holds. |
| Roofs within ΔE 5 of `#e6e6de`, walls within 6 | CHANGED BY DECISION | Context buildings are now flat footprints (no walls) so nothing flickers while zooming. Only scored buildings stand in 3D. |
| Primary button, h2 and first row visible at 1440 × 900, 1280 × 720 and 375 × 812 | PASS | `test-results/shots/{1440,1280,375}-*.png` |
| Recipients tab: only the list scrolls; rows 1–3 visible | PASS | `test-results/shots/1440-*.png` |
| Evidence shows the exact excerpt, page, document date and retrieval date | PASS | the details screens (`#/place/f/<id>`) and Records |
| No score bars, dials, compliance pills, counters or arc animation; fit in words | PASS | by inspection. The homepage has three static totals (facilities, claims, buildings), not counters. |
| Buildings desaturated by default; heat demand toggle tints recipients with its legend strip | PASS | Map key → Heat density |
| Selected facility's connections only; kinds in words; "not a pipe route" visible | PASS | Dashes are gone. Kinds now differ by **line width plus end shape**: operating = thick line with a filled end, proposed = a ring end, scenario = a thin line with a small ring. Each is named in words in the Map key, which also shows "Arcs join endpoints. They are not pipe routes." |
| Verdict and figures come from the engine; office case reads "About the same cost as gas" | PASS | `tour.test.ts`; demo step 4 |
| `npm run contrast` passes | PASS | "contrast: all checks pass" (new palette: `--ts-line-strong` raised to `#6f7d8a` for 3:1) |

## Responsive

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll at the 10 sizes; sheet and drawer; h2 and primary action visible at 640 × 360 and 844 × 390 | PASS | `npm run shots`: every size reports scrollWidth = width. At 640 × 360 the sheet's peek now shows the kicker, name and "View details" / "Get the brief" (`test-results/shots/640-recipient.png`). At 320 px the nav fits. |

## Notes

| Item | Result | Evidence |
|---|---|---|
| Unsaved, saving, saved and failed states shown; text survives failure; leaving with unsaved text is guarded | PASS | `npm run shots:notes`: 14 checks, screenshots `test-results/shots/notes/1-empty … 8-shortlist-empty.png`. Failure is forced with storage blocked and with quota full. |
| Switching subject with unsaved text prompts | PASS (as specified for the page) | Notes live on each place's details page, and leaving the page with unsaved text triggers the `beforeunload` guard. There is no in-panel subject switcher in this layout. |
| Notes unit tests | PASS | `src/notes/notes.test.ts`: round trip, unavailable, quota, conflict, debounce, no "Saved" before resolve, text kept on failure, shortlist toggle, `clearAll` |

## Recipient brief

| Item | Result | Evidence |
|---|---|---|
| 1 page for 3 recipients plus the edited-assumptions brief; disclaimer, HCE logo placeholder, carbon line, CTA, review line | PASS | `npm run check:print`: 4 briefs, 1 page each (Chrome). Safari: NOT VERIFIABLE HERE. |
| Illustrative line on a synthetic recipient | NOT VERIFIABLE HERE | there are no synthetic recipients in the data |

## Demo

| Item | Result | Evidence |
|---|---|---|
| `#demo` runs 7 steps offline in under 90 s; step 5 changes the numbers live; R resets; Back works | PASS | `npm run check:offline`: the screens plus the 7-step tour took 17 s with every outside request blocked. In the browser, `#demo` opens straight into step 1. Step 4 reads "+7 %" and step 5 "+5 %". R returns to step 1 and ← goes back. |

## States

| Item | Result | Evidence |
|---|---|---|
| A screenshot of each state in section 13 | PASS | `npm run shots:states`: 10 checks covering loading, a data file 404, tiles removed, `factors.json` + `prices.json` removed, `meta.json` removed, no WebGL and an unknown deep link. Screenshots are in `test-results/shots/states/`. The fallback image is `public/fallback/map.png`. |

## Accessibility

| Item | Result | Evidence |
|---|---|---|
| jsx-a11y clean | PASS | `npm run lint`: 0 errors (1 unrelated hook-dependency warning in MapView) |
| Keyboard-only run of the section 14 path; dialog focus trap | NOT VERIFIABLE HERE | needs a manual run |
| Lighthouse Accessibility ≥ 95 | NOT VERIFIABLE HERE | Lighthouse not installed |
| VoiceOver pass | NOT VERIFIABLE HERE | manual |

## Offline and security

| Item | Result | Evidence |
|---|---|---|
| `check:offline` attempts no request outside 127.0.0.1 | PASS | 167 requests, 0 outside (`test-results/offline-log.json`). Krishna repeats with Wi-Fi off [Verify]. |
| CSP present in `dist/index.html` | PASS | `check:offline` |
| `grep -r CLIMATIQ dist/ public/` is empty | PASS | `check:offline` |

## Performance

| Item | Result | Evidence |
|---|---|---|
| Lighthouse Performance ≥ 85; smooth 3D pan | NOT VERIFIABLE HERE | Lighthouse is not installed. Zooming no longer flickers now that context buildings are flat. |

## Repo hygiene

| Item | Result | Evidence |
|---|---|---|
| `.gitignore` in place | PASS | ignores `node_modules`, `dist`, `test-results/`, `pipeline/raw`, `pipeline/out`, `.env` and `.venv` |
| No `.env`, key, local tool folder or tool attribution in any tracked file or commit message | PASS | the grep guard (kept outside the repo) runs before every push |
| Handoff zip unchanged | PASS | the zip was last changed in commit cb0248f (the original upload) |
| Work on `feat/thermostat-app` | PASS | pushed to `feat/thermostat-app` and `main` |

## Open items

- **Full OSM context:** the grid fetch is still running in the background (60 tiles done, about 350 queued; Overpass
  times out often). Until it finishes, the context buildings come from the basemap tiles, and when it does, pipeline
  steps 02 to 09 need a rerun.
- **Human tasks before the demo:** check each excerpt against its PDF page, confirm the operator names and customer
  list, review the brief for the demo recipient, and rehearse with Wi-Fi off.
- **Manual accessibility:** a keyboard-only run, VoiceOver and Lighthouse.
- **The demo video** still shows the earlier brick-and-paper colours. Re-record it with `scripts/video/record-demo.mjs`
  if it will be shown.

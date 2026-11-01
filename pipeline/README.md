# ThermoStat pipeline

Turns open data, the HCE study PDFs and emission factors into the static files in `public/data/`. No network at app
run time; Climatiq (optional) runs at build time only and receives quantities only.

```bash
make venv                 # python3 -m venv .venv && pip install -r requirements.txt (exact pins)
make probe                # 00_probe: resolve every source in sources.yml → out/probe-report.md
make data                 # 01_fetch … 09_export
make data OFFLINE=1       # rebuild from raw/, the Climatiq lock and the geocode cache only
.venv/bin/python -m pytest -q
```

| Step | Does |
|---|---|
| 00_probe | CKAN package_show for the Ontario datasets, HEAD (or a 1-byte GET) for the rest, the HCE reports page, the Protomaps build list |
| 01_fetch | downloads once into `raw/` with `raw/manifest.json` (url, sha256, bytes, fetched, licence); Overpass with retries, a mirror and tile splits |
| 02_buildings | OSM footprints → archetypes, floor area, heights (`out/buildings_raw.geojson`, `out/context.geojson`) |
| 03_match_actuals | BPS gas use matched to footprints (overrides, address, name, geocode) |
| 04_estimate | annual heat and peaks; EWRB calibrates type medians only |
| 05_factors | `public/data/factors.json` (ECCC, TAF, Climatiq when keyed) |
| 06_places | facility, customer and proposed-target positions; the planned route (illustrative until traced) |
| 07_score | distances in UTM 17N, the 600 m rule, fit and rank |
| 08_evidence | exact excerpts with page labels for `evidence/claims.yml`; `out/evidence-report.md` |
| 09_export | `public/data/*`, validated against `schema/` |
| mock | 100 illustrative buildings, only if 01 or 02 fails |

Human inputs: `places.yml` (a traced recovery-plant position), `route/route_planned.geojson` (the traced route),
`evidence/checks.csv` (a person's check of each excerpt), `overrides/*.csv`.

## Sources

Every source, with its URL, licence and retrieval date, is in `sources.yml` (resolved by `00_probe`) and listed in the
app's Method view. Licences: ODbL (OpenStreetMap, Protomaps), Open Government Licence – Ontario (BPS, EWRB), Open
Government Licence – Canada (ECCC, NRCan), City of Hamilton Open Data Licence (not used yet). HCE and City documents
are quoted for review with page references.

## Later

- box-select clusters
- permit and site-plan alerts (City development applications have coordinates)
- isotherms
- a Backboard notes adapter
- a bill-upload flow with consent
- other utilities
- City of Hamilton footprints as a geometry check

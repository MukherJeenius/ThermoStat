# ThermoStat: decisions

Dated decisions taken during the build: versions, fallbacks, and every deviation from `docs/build-spec.md`. Newest
entries are appended at the end of each section.

## Milestone 0 (31 October 2026)

### Teammate's existing application

- The handoff restyles an existing application (a map shell, 3D buildings, a Backboard backend) that is not in this
  repository. Until the team says where it lives, ThermoStat is built fresh to the spec and extends the handoff's
  `data-contract.ts` (spec 7.1). If the app turns up, its objects will be mapped to the contract and the panels
  mounted in its shell; restructuring it needs the owner's OK first.

### Pinned versions

Rule (spec 3.1): the newest stable release at least 14 days old on 31 October 2026 (released on or before 17 October
2026), stepping a host down when a plugin's peer range excludes it.

| Package | Version | Note |
|---|---|---|
| react, react-dom | 19.3.1 | |
| maplibre-gl | 6.14.0 | newest qualifying 6.x (6.16.0 is too new) |
| @deck.gl/core, layers, mapbox, extensions | 9.4.0 | one version for all four; `npm ls` resolves one @deck.gl/core 9.4.0 and one @luma.gl/core 9.4.2 |
| pmtiles (npm) | 4.5.0 | |
| @protomaps/basemaps | 5.7.2 | |
| @fontsource-variable/inter | 5.3.0 | |
| @fontsource/literata | 5.3.0 | italic 400 only is imported |
| vite | 8.3.4 | 8.3.5 is too new |
| @vitejs/plugin-react | 6.1.2 | |
| typescript | 6.0.3 | stepped down from 7.0.2: typescript-eslint 8.71.2 declares `typescript >=4.8.4 <6.1.0` |
| typescript-eslint | 8.71.2 | |
| eslint | 9.39.5 | stepped down from 10.13.0: eslint-plugin-jsx-a11y 6.10.2 declares `eslint ^3 … ^9` |
| @eslint/js | 9.39.5 | matches eslint 9 (its 10.x line requires eslint 10) |
| eslint-plugin-jsx-a11y | 6.10.2 | |
| eslint-plugin-react-hooks | 7.1.1 | |
| globals | 17.13.0 | |
| vitest | 5.0.5 | |
| jsdom | 30.1.3 | |
| @testing-library/react / dom / user-event / jest-dom | 16.3.3 / 10.4.2 / 14.6.8 / 7.0.1 | |
| @types/react, @types/react-dom | 19.3.0 | |
| ajv | 8.20.0 | |
| ts-json-schema-generator | 2.9.0 | |
| puppeteer-core | 25.14.0 | drives the local Chrome; never downloads a browser |

`npm install` resolved with no ERESOLVE and without `--force` or `--legacy-peer-deps`. npm prints a deprecation
notice for eslint 9.39.5 (the 9.x line is out of support); it stays because of the jsx-a11y peer range.

Python (`pipeline/requirements.txt`, Python 3.14.7): requests 2.34.2, PyYAML 6.0.3, python-dotenv 1.2.4, shapely
2.2.0, pyproj 3.8.0, rapidfuzz 3.14.6, pdfplumber 0.11.10, pypdf 6.21.1, openpyxl 3.1.5, jsonschema 4.26.0, pytest
9.1.1.

Node 26.5.1, npm 11.17.0. `pmtiles` CLI 1.31.2 installed with Homebrew.

### Local environment

- The user npm cache (`~/.npm`) contains root-owned files, so `npm install` fails with EACCES. Installs on this Mac
  run with `npm_config_cache` pointed at a separate folder. Fix, to be run by the owner:
  `sudo chown -R 501:20 "/Users/krishnas/.npm"`.
- Local tool folders are listed in `.git/info/exclude`, not in the tracked `.gitignore` (owner rule: tool folders are
  never named in a tracked file). This narrows spec 3.3's last paragraph.

### Basemap

- Route (a) of spec 4 row 13: `pmtiles extract` from Protomaps build **20261031** (tiles version 4.15.2), bbox
  −79.90,43.23,−79.77,43.29, maxzoom 15. Result: 4.0 MB, 156 tile entries. Below the 25 MB line, so it is committed
  (the spec's recommended option; the owner may switch to `make tiles` at Stop 1).

### Emission factors

- No `CLIMATIQ_API_KEY` exists, so `factors.json` carries the ECCC (default) and TAF sets and `sets.climatiq: null`
  with `climatiqReason: "no API key"`. To add it later: put `CLIMATIQ_API_KEY=…` in `pipeline/.env` and rerun
  `make data`.

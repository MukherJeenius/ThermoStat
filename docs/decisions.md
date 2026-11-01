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

## Milestones 1 to 5, demo build (31 October to 1 November 2026)

### Owner request: a hackathon demo first

- On 31 October 2026 (about 23:10) the owner asked for a working demo within 3 to 4 hours. The demo path (map,
  facility and evidence records, recipients with the cost comparison, the brief) is built first. Field notes, the full
  Records and Method views, the guided `#demo` tour, the state screenshots and the shots/print/offline scripts follow
  after the demo.

### Map stack

- **maplibre-gl stepped down to 5.24.0** (newest qualifying 5.x), as spec 3.1 prescribes on a smoke-test failure:
  with maplibre-gl 6.14.0, deck.gl 9.4.0's interleaved `MapboxOverlay` throws in `getViewport`
  (`map.transform` is gone in MapLibre 6), so no deck layer draws. With 5.24.0, interleaving works.
- The label `TextLayer` runs without `CollisionFilterExtension` for now (the labels did not draw with it); the
  facility labels are short `mapLabel`s and were checked by eye. [Verify] at the look check.

### OpenStreetMap download

- On 31 October 2026 every Overpass server tried timed out (HTTP 504) on the full frame, on quadrants and on most
  1/48 tiles: overpass-api.de, overpass.private.coffee and the VK Maps mirror (maps.mail.ru, also listed on the
  OpenStreetMap wiki). The spec allows one mirror; VK replaced private.coffee because private.coffee did not answer
  at all. Tiles are split further on timeout (a deviation from the 4-quadrant rule).
- **Interim for the demo:** a tag-filtered query (`queries/candidates.overpassql`: named, amenity, office, shop,
  tourism, leisure, healthcare, the residential and commercial building values, 4+ levels or a height) over the study
  area supplies the recipient candidates. Context buildings are drawn by MapLibre from the basemap's own `buildings`
  layer (Protomaps tiles, offline) while `context-buildings.geojson` is empty, instead of deck.gl. Unnamed
  `building=yes` footprints of 600 m² or more with fewer than 4 levels are missed in this mode. The full-frame fetch
  resumes afterwards and restores the spec path.

### Sources

- The CEEP final plan (City meeting system, eScribe) answers HTTP 403 to automated downloads. The 2022 draft
  (Appendix A to Report PED22058/HSC22030, on the City's hamiltoncivicmuseums.ca site) is cached and cited as
  "City climate plan (CEEP), 2022 draft". [Verify] the passage in the final plan.
- The City of Hamilton building footprints layer exists (City of Hamilton Open Data Licence v1.1) but is not used in
  this build: OSM geometry only. Development applications (point layer) exist; permits are not used, so
  `activePermit` is null everywhere.
- 100 King St W: no current operator could be confirmed (directories name Rogers; Qu was not confirmed), so the
  facility is named by its address with `operator: null`.
- HCE study document dates are taken from the PDF modification date (25 May 2025); the study page says the study was
  completed in June 2025. [Verify]
- Customer geocodes: several queries use street addresses supplied by the team for public buildings (City Hall,
  the Convention Centre, Hamilton Place, the Art Gallery, FirstOntario Centre, Lister Block, Jackson Square, the
  Police ISF). Every position is [Verify].

### Evidence extraction

- Two-column pages are read column by column first (words split into two x-bands with under 2 % crossing the gap),
  then as a whole page. Short label lines and title-like heading lines glued to the front of a passage are dropped
  only when the remaining text still holds every anchor. All 14 found excerpts were read in the evidence report.

### Calibration

- EWRB 2024 publishes gas intensity in bins (62 distinct values, steps of 3.044 m³/m²), so type medians are bin
  values. Zero-gas buildings are excluded. The office median (80 kWh/m² heating proxy) falls outside 0.5× to 2× of
  190, so offices keep the start value; schools and hospitals have fewer than 8 rows and keep theirs.

### Tooling

- Test files typecheck in `tsconfig.test.json` with Node types (`@types/node` 25.9.9, already installed by vite), so
  app code stays free of Node globals.
- Explicit table roles (`role="table"`, `row`, `cell`, `columnheader`) are kept as spec 9.6 requires;
  jsx-a11y's `no-redundant-roles` and `no-interactive-element-to-noninteractive-role` allow them for table elements.
- **Arc height tuned** (spec 9.3 calls it a starting value): h = clamp(0.2 × ground distance, 120 m, 800 m) instead of
  clamp(0.45 × d, 150 m, 1,500 m). With the recovery plant about 5 km east of downtown, the starting value sent its
  arcs off the top of the screen as near-vertical lines at pitch 50°.
- The brief cites the study passages behind the price rule (page 18), the route (page 5) and the CO2 share (page 5).
- In the candidates-only mode the brief's locator shows the recipient and the nearest network element without
  surrounding context footprints (`context-buildings.geojson` is empty until the full-frame fetch completes).

### npm audit (1 November 2026)

- `npm audit` reports 1 critical advisory in maplibre-gl ≤ 6.4.0 (GHSA-jrc7-96c5-q579, an XSS sanitizer bypass in
  `DOM.sanitize()`, which handles HTML given to popups and attribution). ThermoStat uses no MapLibre popups, its
  attribution strings are fixed in code, data strings render as React text, and the production CSP blocks other
  origins. The fix (6.16.0) is MapLibre 6, which deck.gl 9.4's interleaved overlay cannot draw on, so 5.24.0 stays
  until deck.gl supports MapLibre 6 (then step up and recheck). `npm audit fix --force` must not be run: it installs
  MapLibre 6 and breaks the map. The 14 moderate advisories are in dev-only tooling (eslint, typescript-eslint,
  ts-json-schema-generator, glob, minimatch) and never ship in the bundle.

## Demo presentation pass (1 November 2026)

The owner asked (1 November 2026) for a demo that looks finished first: an opening screen with a logo, greeting and
loading bar; clear ways in; a colourful, readable map with hot spots and highlighted connections; less information
per screen; a less "vibecoded" look. These changes override the handoff's look where they conflict:

- **Opening screen** (`src/ui/Intro.tsx`): logo mark, greeting, a loading bar over the ten data files, "Start the
  guided demo" and "Explore the map", and three numbered steps. Deep links and `?demo=1` skip it; the header logo
  returns to it.
- **Guided demo** (spec 12) is built: seven steps, captions computed from the data, per-step camera framing, keys
  (Space, arrows, R, Esc), the rail shown only on the list steps and the legend folded away.
- **Square-edged controls:** panel radius 16 px (was 30), buttons, search, segments and map controls 8 to 12 px
  (were pills), rectangular toggles. Rail tabs read "FACILITIES 06 · RECIPIENTS 20" (label plus two-digit count).
- **Heat ramp made more vivid** (amber to deep red: #f3cf9c, #eea25c, #de7233, #bb4b1f, #8e2d13) and the Heat demand
  layer is on by default. It still passes every 9.16 check: luminance 0.66 → 0.08, smallest adjacent ΔE2000 9.6 across
  normal and simulated protanopia, deuteranopia and tritanopia, heat-1 15.9 from the roof colour.
- **Hot spots:** every heat source has a soft halo; the selected one is larger.
- **Planned route** drawn as a dashed ground line (labelled "Planned route (approx.)" in the legend; illustrative until
  traced) alongside the existing, proposed and scenario arcs.
- **Recipient card** opens with an "at a glance" hairline grid (fit, heat a year, cost vs gas, CO2 vs gas); duplicate
  distance lines removed. The rail drops its intro paragraph (the opening screen carries it).
- Footer credit placeholder "Team ThermoStat" until the team supplies its line.
- **Map screen reorganised** (owner, 1 November 2026: "too much info"): the map shows a slim places list, a small
  preview card (three facts and "Open full details") and a "Map key" button that holds the legend and the layer
  switches. Each place has its own **details screen** (`#/place/f/<id>`, `#/place/r/<id>`) laid out to be read: a
  facility's promises quoted with page and dates, open questions and connections; a building's reasons, a 20-year cost
  chart with the carbon toggle, carbon and grid, demand and sources. The accordion cards are retired from the map.
- **Lines restyled** (owner: dotted lines looked unprofessional): existing connections bold solid amber, proposed a long
  even dash, team scenarios a thin solid lilac line (shown with buildings, not on the Facilities tab), and the planned
  route a soft solid band. Width and pattern still distinguish them without colour.
- **Homepage** rebuilt in solid colours on paper (one ink, one accent; no glow or tinted boxes): centred wordmark,
  two-line tagline, "Explore the map" and "Watch the demo", three plain counts and three steps.
- The click-through guided tour stays reachable with `?demo=1` but is no longer offered on screen; a recorded demo video
  replaces it.
- **Zoom glitches fixed:** scored buildings are drawn 0.8 m wider and 1 m taller than the basemap building under them
  (no coincident faces), the depth offset is gone, and basemap buildings rise and fade in between zoom 13.5 and 14.3
  instead of popping.
- **Camera fits** no longer store padding on the map (MapLibre 5 subtracts stored padding as well as the padding passed
  to `cameraForBounds`, which made fits fail and fall back to a wide view).

## Redesign from four references (owner, 1 November 2026)

The owner asked for icons, style, colours, motion, themes and the organisation of information to come from four sites,
in off-white cream, dark navy and an orange accent. We read each site's HTML, CSS and JS. We took patterns and
mechanics only: no logos, images, copy or code blocks.

- **Tapasya Studio (shop page):**
  - a solid colour band behind the page title, with a breadcrumb above it
  - filters as pill chips with counts (`All 31`), where the active chip is filled with ink
  - a fully rounded search field and a plain sort select
  - scroll reveals through a `data-reveal` attribute: opacity plus a 26 px rise over .7 s on `cubic-bezier(.2,.7,.2,1)`,
    switched off under reduced motion
  - focus rings drawn in ink

  In ThermoStat this becomes the navy title band on the details, Records and Method pages, the rail tabs drawn as
  count chips, and the reveal on the homepage and pages.
- **Racing portfolio:**
  - an instrument-panel register: small monospace readouts (coordinates and "2026 season" lines) above large sans
    statements
  - spec cards with a hairline top row ("label · value") and a 1 px strong border
  - a status dot next to a word
  - orange text links ending in "↗"
  - a faint grid behind the hero

  In ThermoStat this becomes monospace readouts (coordinates, record dates, "Fig." captions), spec-card fact grids, the
  status dot beside facility states, and orange "→" links. It is a dark-and-light portfolio template that isn't ours,
  so only its mechanics are used.
- **West End Diner:**
  - a serif display face for section heads, each with a small caps eyebrow
  - alternating cream and dark bands to separate sections
  - a sticky header that gains a hairline once you scroll
  - 24 px line icons (stroke 1.6, `currentColor`)
  - card hover lift (`transform` plus shadow over .4 s on `cubic-bezier(.22,1,.36,1)`)
  - IntersectionObserver reveals that add `is-in`

  In ThermoStat this becomes eyebrow-plus-serif section heads, a navy band on the homepage, the header hairline, line
  icons and the hover lift on cards and list rows.
- **ThermoStat keynote (`pitch/`):**
  - Inter and Literata, both already vendored
  - amber `#d16b24` as the single accent
  - dark "night" slides with cream text
  - tight-tracked sans display headings
  - the easing `cubic-bezier(.16,1,.3,1)`

  We adopt its easing as the app's one motion curve and keep its amber family for the accent, so the deck and the app
  read as one product.

**Palette:** cream `#F6F1E6` ground and `#FFFCF5` surfaces, dark navy `#14213A` ink and bands, muted `#4E5A6B`, and
orange `#D9641E` as the accent fill. Orange text uses `#A9440F`, which reaches 4.5:1 on cream. Heat on the map stays
warm (the same ramp), the water stays pale blue, and `npm run contrast` judges every pair.

**Icons:** one set, Lucide (ISC), vendored as inline SVG in `src/ui/icons.tsx`, with its licence in
`src/ui/icons.LICENSE`. No icon images are taken from the references.

**Motion:** one easing curve (`--ts-ease: cubic-bezier(.16,1,.3,1)`): 200 ms for state changes, 600 ms for reveals.
Everything stops under `prefers-reduced-motion`. The map camera keeps its own timing.

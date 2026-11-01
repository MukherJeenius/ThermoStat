# ThermoStat: Build Specification

*The engineering contract for the ThermoStat demo (McMaster P2P Hacks 2026). Written 31 October 2026 from the
team's design handoff (`ThermoStat-Frontend-Handoff.zip`), the product plan (`docs/plan.md`) and an audit of this
repository at commit cb0248f, when it held only the handoff zip.*

**How the documents fit together**

| Document | What it is | It wins on |
|---|---|---|
| `docs/build-spec.md` (this file) | What to build and how to prove it works | Engineering, the data contract, UI behaviour, tests |
| `docs/plan.md` | The product story, the business case, every figure and formula | Figures and formulas |
| `design/handoff/` (the zip, extracted) | The visual direction: `Mockup-1.png`, `Mockup-2.png`, `code/tokens.css`, `code/data-contract.ts`, the PDFs | Look and feel, except for the changes listed in 9.1 |

If two documents disagree in a way this table does not settle, never pick silently: take the reading that changes
less, log it with its reason in `docs/decisions.md`, and raise it at the next stop.

**Markers.** **[Verify]**: a person must confirm it before the demo. **ASK**: stop and ask the person running the build
before doing it. **[Est]**: a team estimate or assumption, shown as such in the app.

---

## 1. Goal

### 1.1 In one sentence

ThermoStat is a map of Hamilton's waste-heat promises and prospects. It shows what has been promised about recovering
industrial heat, in the documents' own words and with page numbers, and which buildings Hamilton Community
Enterprises (HCE) should approach first, with an honest cost and carbon comparison for each.

### 1.2 One product, two lenses

| Lens | Judging angle | The question | What the user sees |
|---|---|---|---|
| **Accountability** | society | *"Every promise has a place."* What was promised, by whom, where, and is there evidence? | Facilities with commitments. Each commitment has a status in words and an exact excerpt with page, document date and retrieval date. Unknowns stay unknown. |
| **Connection** | sustainability and business | *"Who should HCE connect first, and why is it worth it?"* | Recipients to approach, ranked. Fit in words with reasons. Gas vs own heat pump vs HCE over 20 years. A one-page Recipient brief. |

**The bridge between them:** HCE's own Energy Harvesting Study says its next step is a "Commercialization Phase" to
obtain customer and supplier commitments. ThermoStat follows the commitments that exist (lens 1) and finds the
customers who could make the next ones (lens 2).

### 1.3 The story every screen tells

All figures below come from plan B5 and are computed by the engine at runtime, never typed into copy.

1. HCE heat is priced at **gas parity**: about $47.7/MWh at default prices, about $66.0/MWh if a carbon price of
   $85/t returns. Cost is therefore **about the same as gas by design**. Never present HCE as cheaper at default
   prices.
2. The reasons to connect:
   - about **80 % less CO2** than gas
   - about **0 kW** of added grid load at the building, against about P / 2 kW for an own heat pump (975 kW for the
     reference office)
   - no boiler to replace
   - protection from future carbon and gas prices
3. **Value to HCE:** 5 MW of network peak ≈ 18,000 MWh a year ≈ **$0.86M to $1.19M a year** in heat sales.
4. **Missing evidence is an open question,** not a finding of non-compliance.

### 1.4 Honesty rules (from the handoff; binding in the UI, the brief, the data and the docs)

- Unknown is `null`, never zero. The UI says "Not in source data" or "Source not available".
- A missing record does not mean non-compliance.
- Every synthetic item carries `synthetic: true` and a visible label.
- An arc joins two endpoints. It is not a pipe route.
- No compliance pills, completeness scores, score bars or dials.
- Colour is never the only signal.
- Only HTTPS sources. Any other URL scheme is rejected when data loads.
- Strings from data are rendered as React text, never as HTML.
- Notes are leads, not evidence. They are never shown as verified findings and never published.
- HCE is named as "prepared for", with the disclaimer in 11.3. Never its logo, colours or domain.

### 1.5 Non-goals

- no accounts, logins or backend server
- no live HCE data, real bills or personal data; no upload field or contact form
- no Backboard calls (the notes adapter seam in section 10 is the only hook)
- Hamilton only: the Bayfront-to-downtown corridor
- no pipe routing or engineering design

---

## 2. Product model

### 2.1 Facilities

Facilities are real heat sources and heat-network holders. Every position is geocoded or traced in the pipeline (step
06) and carries a `positionQuality`.

| id | Name | kind | Position | Commitment rows to look for (section 6.3) |
|---|---|---|---|---|
| `hce-recovery-plant` | Central Energy Recovery Plant (proposed) | `energy_plant` | Bayfront, traced by a person from the study's site figure; illustrative until then (6.1) [Verify] | heat: proposed recovery for Hamilton General and downtown · energy: proposed plant equipment · emissions: proposed cut of about 80 % against gas |
| `hce-downtown-plant` | HCE downtown plant, 79 Bay St N | `energy_plant` | address | heat: reported, serves about 12 downtown buildings · energy: reported gas combined heat and power · emissions: proposed switch from gas to industrial waste heat (City climate plan, CEEP) |
| `dofasco` | ArcelorMittal Dofasco | `industrial_source` | site, geocoded [Verify] | heat: proposed as a waste-heat supplier in the study · supply agreement: unknown |
| `air-liquide` | Air Liquide, Hamilton (Bayfront) | `industrial_source` | site, geocoded [Verify] | heat: proposed as a waste-heat supplier in the study · supply agreement: unknown |
| `dc-21-king-w` | Data centres at 21 King St W (NetAccess; HCE Telecom) | `data_centre` | address | heat reuse, water, energy: unknown unless a public, site-specific record is found |
| `dc-100-king-w` | Data centre at 100 King St W (Qu, formerly Rogers) | `data_centre` | address | heat reuse, water, energy: unknown unless a public, site-specific record is found |

- Operator names come from public pages found in step 08 [Verify]. If an operator cannot be confirmed, the facility is
  named by its address only.
- **Illustrative examples** come only from `design/handoff/code/sample-data.json`: Bayfront Compute, its 2
  commitments and its 1 connection. `09_export` copies them into `facilities.json` and `connections.json` with
  `synthetic: true`, `kind: 'data_centre'`, `mapLabel` = the name, `positionQuality` and `targetQuality`
  `'illustrative'`, and `operator`, `address`, `interpretation`, `holder`, `recipientId` and `phase` null. The
  sample's `demo-heat` is `proposed` with `source: null`, which breaks 2.2, so it is exported as `unknown` (title,
  summary and question kept); 2.2 binds synthetic items too (6.4 tests it). Do not create Mockup-1's West End Digital
  or Eastgate Cloud. They carry the kicker "Illustrative" and are off by default (Method → "Show illustrative examples").
  While the switch is off, synthetic facilities and their connections appear nowhere: map, lists, search, briefs,
  totals and ranking all leave them out. (`mock.py` buildings are not governed by this switch.)

### 2.2 Commitments and evidence

A commitment is one statement about one facility on one topic (`heat | water | noise | energy | emissions`).

**Status words.** The status is always printed as a word, with its interpretation line (editable per commitment):

| Status | Word | Default interpretation line |
|---|---|---|
| `proposed` | Proposed | A plan or intention in a public document. Not yet a delivery. |
| `required` | Required | A condition set by a rule, permit or approval. |
| `reported` | Reported | The holder says it is so. Not independently checked. |
| `verified` | Verified | Confirmed by an independent public record. |
| `unknown` | Unknown | No public record found. This is an open question, not non-compliance. |

**Evidence rules.**

- **Exact.** The excerpt is the passage as printed, from the cached document. Only whitespace, line-break hyphens and
  ligature characters (ﬁ → fi) may be normalised, and the record says which (6.3). Never paraphrase inside quotation
  marks.
- **Short.** At most 60 words. Choose the key sentence.
- **Located.** It carries the page (the printed page label when the PDF has one, else "PDF p. N"), the document date,
  the retrieval date, the document's sha256 and an HTTPS URL to the original.
- **Checked.** Each excerpt starts with `humanCheck: null` ("Not yet checked against the original by a person"). It
  becomes checked only through `pipeline/evidence/checks.csv` (6.3).
- **No source, no status.** If no passage is found, the commitment is `unknown`, `source: null`, and the UI says
  "Source not available. This claim cannot currently be checked here."
- **One source per commitment.** Further supporting sources go in a connection's `evidenceIds` or in Method.

### 2.3 Connections

A connection is an arc from a facility to a recipient. Its `kind` is always printed in words; colour and line
pattern support the word but never replace it.

| kind | Word | Which arcs | Evidence |
|---|---|---|---|
| `operational` | Operating connection | HCE downtown plant → each existing customer named in a public source: City Hall, TD Coliseum, Hamilton Place, the Convention Centre, the Art Gallery of Hamilton, Lister Block, Jackson Square [Verify each] | at least 1 source that names the customer; a customer not named in a cached source gets no arc |
| `proposed` | Proposed in HCE's study | Recovery plant → Hamilton General Hospital (`phase: "Phase 1"`); recovery plant → HCE downtown plant (`phase: "Phase 2"`) | the study excerpt(s), with page |
| `scenario` | Team scenario | For each of the 20 recipients to approach, an arc from the facility whose network is nearest: the downtown plant if the nearest network element is an existing customer, else the recovery plant | none; `evidenceIds: []`, labelled "team estimate" |

Existing customers and the targets of proposed connections (every footprint of the Hamilton General Hospital campus,
matched in step 06) are endpoints, not recipients to approach. They appear in Records with their connection, as
"Operating connection" or "Proposed customer (HCE study)", and are never ranked.

### 2.4 Recipients (candidate buildings)

A recipient is a building that could take HCE heat.

- **Eligible:** within 600 m of the existing network (known customers and the downtown plant) or the planned route;
  one of 8 archetypes (`office, multi_res, retail, school, hotel, civic, hospital, mixed`; mapping in 6.1); floor area
  ≥ 400 m²; not already an HCE customer; not the target of a proposed connection (2.3); not a facility.
- **Fields** (contract in section 7):
  - identity: name, address, type, owner type
  - building: floor area and how it was derived, height, year built, heating system, `boilerYearsLeft`
  - `Estimate`: annual heat (MWh), building peak (kW), network peak (kW), data quality (Actual / Checked estimate /
    Estimate only) and method
  - `Distances`: to the existing network and to the planned route, with a quality word
  - `FitAssessment`: band (Strong / Possible / Weak fit), score (secondary), 1 to 3 reasons as sentences
  - rank (1 to 20, or null), sources, last verified date, synthetic flag
- **The `CostComparison` is computed in the browser** by the engine (section 8), so assumption changes apply at
  once.
- **Naming.** The ranked list is "Places to investigate" in the rail, with two tabs: **Facilities** and
  **Recipients to approach**. The old "Top 20" name is not used in the UI.

### 2.5 Totals ("Together")

For the top 5 recipients, and for the user's shortlisted recipients, the engine shows:

- total annual heat (MWh a year)
- network peak (MW, the sum of each building's network kW)
- CO2 avoided against gas (t a year)
- heat sales for HCE at the current rate ($ a year)

Beside them, a fixed scale line computed by the engine: "For scale: 5 MW of network peak ≈ 18,000 MWh a year ≈
$0.86M–$1.19M a year at gas parity (carbon $0 to $85/t)."

### 2.6 Field notes and the shortlist

These are private browser state behind a `NotesStore` interface (section 10). The shortlist doubles as the cluster
tool: shortlisted recipients get a "Together" total.

### 2.7 Recipient brief

A one-page, US Letter, printable brief per recipient, in ThermoStat's identity (section 11). It replaces the old
"one-pager".

---

## 3. Stack and repository

### 3.1 Stack

| Part | Choice | Notes |
|---|---|---|
| Front end | Vite + React + TypeScript (strict) | No router library: hash routes (9.12). No state library: React context + `useReducer`. No CSS framework, no chart library. |
| Map | MapLibre GL JS + deck.gl `MapboxOverlay` with `interleaved: true` | deck.gl draws the 3D buildings, the arcs, the endpoints and the map labels. MapLibre draws the basemap. |
| Basemap | a Protomaps `.pmtiles` extract in `public/tiles/` with the `pmtiles` protocol | Served by Vite, which serves byte ranges. Styled with `@protomaps/basemaps`, recoloured neutral and desaturated. |
| Fonts | `@fontsource-variable/inter` and `@fontsource/literata` (italic 400 only: `@fontsource/literata/400-italic.css`), both SIL OFL | Bundled by Vite, so they work offline |
| Engine | pure TypeScript in `src/engine/`, no DOM | Tests run in Vitest |
| Pipeline | Python 3.11+ in `pipeline/` | Writes static files to `public/data/`. Climatiq runs at build time only. |
| Tests | Vitest (+ Testing Library, jsdom), pytest, `scripts/contrast.mjs`, `scripts/print-check.mjs` | |

**Versions.** At milestone 0, pin exact versions in `package.json` (no `^` or `~`) and in `pipeline/requirements.txt`,
and record each one in `docs/decisions.md`. For each package take the newest stable release that is at least 14 days old
(`npm view <pkg> time --json`), then step majors down until `npm install` resolves with no ERESOLVE and without
`--force` or `--legacy-peer-deps`. When two packages conflict, step down the host whose peer range is violated (eslint,
typescript, vite, react), never the plugin; so TypeScript is the newest version inside typescript-eslint's declared peer
range. Every `@deck.gl/*` package uses one identical version (the newest `@deck.gl/core` release at least 14 days old),
and after install `npm ls @deck.gl/core @luma.gl/core` shows exactly one version of each. `@deck.gl/mapbox` declares
no maplibre-gl peer (checked on 31 October 2026), so start with the newest qualifying maplibre-gl 6.x. **Interleaving
smoke test** (the first task of milestone 4): one 1440 × 900 preview shot showing (1) extruded context buildings
occluding correctly, (2) a dashed billboard `PathLayer` arc above the roofs, (3) an endpoint click reaching `onSelect`,
(4) basemap labels above the deck layers via `beforeId`, and (5) no console errors. On any failure, step down to the
newest qualifying maplibre-gl 5.x and retry before trying `interleaved: false`; record the result in
`docs/decisions.md`. Add `"engines": { "node": ">=22.12" }` and `.nvmrc` (`26`; this Mac runs Node 26). Check the APIs
this spec names against the pinned versions:

- `MapboxOverlay` from `@deck.gl/mapbox`
- `PathStyleExtension` and `CollisionFilterExtension` from `@deck.gl/extensions`
- `Protocol` from `pmtiles` (`maplibregl.addProtocol('pmtiles', protocol.tile)`)
- `layers()` and `namedFlavor()` from `@protomaps/basemaps`

**Runtime dependencies (the full list):** react, react-dom, maplibre-gl, @deck.gl/core, @deck.gl/layers,
@deck.gl/mapbox, @deck.gl/extensions, pmtiles, @protomaps/basemaps, @fontsource-variable/inter, @fontsource/literata.

**Dev dependencies:** vite, @vitejs/plugin-react, typescript, @types/react, @types/react-dom, vitest, jsdom,
@testing-library/react, @testing-library/dom, @testing-library/user-event, @testing-library/jest-dom, eslint with
@eslint/js, globals, typescript-eslint, eslint-plugin-react-hooks and eslint-plugin-jsx-a11y, ajv,
ts-json-schema-generator, and puppeteer-core (it drives the locally installed Chrome for the print, screenshot and
offline checks and never downloads a browser). Adding anything else needs a line in `docs/decisions.md`.

**Lint scope:** `eslint.config.js` ignores `dist`, `coverage`, `test-results`, `design/**`, `pipeline/**` and
`public/**`. The handoff code in `design/handoff/` is an uncompiled scaffold and is never linted, typechecked or
imported.

### 3.2 Repository layout

```text
ThermoStat/
  .gitignore                      written first (3.3)
  README.md                       what it is, how to run (npm, make data), credits, licences; no tool attribution
  ThermoStat-Frontend-Handoff.zip the handoff, kept as committed
  design/handoff/                 the zip extracted, for reference only; never imported at runtime
  docs/
    build-spec.md                 this file
    plan.md                       product plan, figures and formulas
    decisions.md                  dated decisions (versions, fallbacks, any deviation from this spec)
    method.md                     written at milestone 7; the Method view renders the same content
  fixtures/
    fit-cases.json                shared by pytest and Vitest (fit parity)
  index.html
  package.json  package-lock.json  tsconfig.json  vite.config.ts  eslint.config.js
  public/
    data/                         pipeline output, committed: facilities.json, connections.json, sources.json,
                                  recipients.geojson, context-buildings.geojson, network.geojson, places.json,
                                  prices.json, factors.json, meta.json
    tiles/hamilton.pmtiles        basemap extract (commit or fetch: decided at Stop 1, see 3.6)
    basemap/glyphs/<stack>/<range>.pbf   only the stacks and ranges the style uses
    fallback/map.png              no-WebGL image, captured from the app at milestone 7
  scripts/
    contrast.mjs                  measured contrast + ramp checks (9.16)
    lib/color.mjs                 WCAG ratio, CVD simulation and ΔE2000, shared by contrast.mjs and shots.mjs
    contrast-pairs.json           every foreground/background pair the UI declares
    schema.mjs                    JSON Schema generation (7.4)
    print-check.mjs               prints a brief with local Chrome and asserts exactly 1 page
    shots.mjs                     screenshots and fidelity measurements (3.4)
    offline-check.mjs             runs the demo with every non-local request blocked and logged (3.4)
  src/
    main.tsx  App.tsx
    contract/data-contract.ts     the handoff contract, extended (section 7)
    engine/                       cost.ts fit.ts verdict.ts totals.ts format.ts units.ts (+ *.test.ts, fixtures/)
    data/                         load.ts (fetch + normalise), validate.ts (runtime guards), urls.ts (safeHttpsUrl)
    notes/                        NotesStore.ts (interface), LocalNotesStore.ts, useNoteDraft.ts (+ tests)
    map/                          MapView.tsx, basemapStyle.ts, camera.ts,
                                  layers/heatLayers.ts (makeHeatLayers), layers/buildingLayers.ts, layers/labels.ts
    ui/                           tokens.css (handoff + additions), mapTokens.ts (9.1), fonts.css, Header,
                                  Rail, FacilityPanel, RecipientPanel, EvidencePanel, FieldNotesPanel, Legend, BottomSheet, Search,
                                  ConnectionPopover, Dialog, Toggle
    views/                        Explore.tsx, Records.tsx, Method.tsx, Brief.tsx
    demo/tour.ts                  demo steps as pure functions of state
    state/                        store.ts (reducer), route.ts (hash routes), assumptions.ts
    content/                      copy.ts (every UI string), credits.ts (team credit line)
  pipeline/
    README.md                     how to run; every source with URL, licence, retrieval date; "Later" list
    requirements.txt              exact pins
    .env.example                  CLIMATIQ_API_KEY=
    Makefile                      make venv | probe | data | data OFFLINE=1 | evidence | tiles (6.5)
    sources.yml                   every source: key, title, shortTitle, publisher, url, docKind, licence,
                                  documentDate; URLs resolved by 00_probe
    places.yml                    facilities, existing customers and proposed-connection targets: id, name, mapLabel,
                                  kind, operator, address or geocode query, or traced lon/lat (6.1, 06_places)
    prices.yml                    one entry per PriceKey: value, unit, sourceId (a sources.yml key or null), date,
                                  verify; 09_export writes prices.json from it
    overrides/bps_matches.csv     committed manual BPS matches: bps_operation_id,building_id,reason,added_by,added_on
    overrides/buildings.csv       committed field corrections: building_id,field,value,source,added_on
                                  (heatingSystem, boilerYearsLeft, type); added_by holds initials only
    climatiq.lock.json            pinned factor selectors + data version (section 5)
    queries/                      buildings.overpassql, places.overpassql, roads.overpassql
    schema/                       JSON Schema generated from src/contract (npm run schema); used by pytest
    evidence/claims.yml           claims to find in documents (6.3)
    evidence/checks.csv           human checks of excerpts (6.3)
    route/route_planned.geojson   the planned route, traced by a person from the study figure
    thermostat/                   shared Python package: io, geo, units, archetypes, fit, evidence
    steps/                        00_probe.py … 09_export.py, mock.py
    tests/
    raw/                          downloads, never edited (git-ignored)
    out/                          working outputs and reports (git-ignored)
```

### 3.3 `.gitignore` (created before any other file)

```text
node_modules/
dist/
coverage/
.vite/
*.log
.DS_Store
.env
.env.*
!.env.example
.vercel/
.venv/
__pycache__/
*.pyc
.pytest_cache/
pipeline/raw/
pipeline/out/
test-results/
```

Add the folders of any local editor or development tool used on the machine (for example its settings or preview
configuration) to this list as well. Such folders are never committed.

### 3.4 npm scripts

| Script | Command |
|---|---|
| `dev` | `vite --host 127.0.0.1 --port 5173 --strictPort` |
| `build` | `tsc -b && vite build` |
| `preview` | `vite preview --host 127.0.0.1 --port 4173 --strictPort` |
| `test` | `vitest run` |
| `typecheck` | `tsc -b --pretty false` |
| `lint` | `eslint .` |
| `schema` | `node scripts/schema.mjs` (7.4) |
| `contrast` | `node scripts/contrast.mjs` |
| `check:print` | `node scripts/print-check.mjs` (needs `npm run preview` running) |
| `shots` | `node scripts/shots.mjs` (needs `npm run preview` running) |
| `check:offline` | `node scripts/offline-check.mjs` (needs `npm run preview` running) |
| `check` | `npm run typecheck && npm run lint && npm test && npm run contrast` |

**The browser scripts** use puppeteer-core with the local Chrome (`CHROME_PATH`, default
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`); without Chrome they report NOT VERIFIABLE HERE.

- **`shots`** writes `test-results/shots/<width>-<state>.png` at 1440 × 900, 1536 × 864, 1280 × 720, 1024 × 768,
  768 × 1024, 700 × 900, 640 × 360, 844 × 390, 375 × 812 and 320 × 640: the default view, each panel, the bottom sheet,
  demo steps 2 and 5, every state in 13, `map-focus` (Tab to the map) and `forced-colors` (`page.emulateMediaFeatures([{
  name: 'forced-colors', value: 'active' }])`). It makes the states with request interception (404 for `tiles/*`,
  `data/factors.json`, `data/prices.json`, `data/meta.json` or `data/recipients.geojson`) and launches Chrome with
  `--disable-3d-apis` for No WebGL. It also prints the fidelity measurements in 16 and writes
  `test-results/shots/fidelity-1440.png` (the screenshot beside Mockup-1).
- **Assertions in `shots`:** at every size, `document.documentElement.scrollWidth <= innerWidth`; at 640 × 360 and
  844 × 390, the active panel's h2 and primary action are visible without scrolling; at every desktop width,
  `[role=tablist]` is at most 46 px tall and `.ts-summary` computes to 17 px; each dialog keeps focus inside through 20
  Tab presses, and Esc returns focus to its trigger.
- **Fidelity sampling** needs no new dependency. It uses a separate 1440 × 900 shot at the downtown plant's selection
  camera (taller buildings than the opening view), with the `TextLayer` and basemap labels hidden through a test-only
  hook. `page.evaluate` loads its PNG data URL into an `<img>`, draws it to an `OffscreenCanvas` and reads
  `getImageData`. Mask out the header, the footer and every panel's `getBoundingClientRect`, drop pixels within ΔE2000 3
  of `--ts-map-ground`, `-water`, `-road` or any arc or endpoint colour, and drop pixels with CIE L* below 55 (text,
  outlines). Run seeded k-means (k = 3, 10 iterations) on the rest, sort the centres by luminance (roof, lit
  wall, shaded wall) and print each centre's ΔE2000 to `#e6e6de`, `#d0d0c9` and `#bfc2bb`. ΔE2000 lives in
  `scripts/lib/color.mjs`, shared with `contrast.mjs`. "Arcs above the roofs" is judged by eye from
  `fidelity-1440.png` and reported as such.
- **`check:offline`** aborts and logs every request whose host is not 127.0.0.1, runs `#demo` steps 1 to 7, writes
  `test-results/offline-log.json`, and exits 1 if any outside request was attempted.

### 3.5 Map integration details

- **Overlay:** `const overlay = new MapboxOverlay({ interleaved: true, layers }); map.addControl(overlay);` Update it
  with `overlay.setProps({ layers })`. Insert deck layers below the basemap's label layers with each layer's `beforeId`.
  If interleaving misbehaves at the pinned versions (depth, picking or labels), switch to `interleaved: false` and
  record the reason.
- **Basemap protocol:** register `pmtiles` once at start-up.
- **Relative base:** `base: './'` in `vite.config.ts`, so the build runs from any static path.
  - Build every runtime URL from the page's directory: `const BASE = new URL('.', document.baseURI).href`
    (`src/data/urls.ts`). Resolving `'.'` drops the query and the `#/route` fragment, which `document.baseURI`
    includes on every hash route.
  - Tiles: `'pmtiles://' + BASE + 'tiles/hamilton.pmtiles'`.
  - **Gotcha:** never pass the glyphs template through `new URL()`. It percent-encodes `{fontstack}` and `{range}` and
    breaks MapLibre. Append it to BASE instead: `BASE + 'basemap/glyphs/{fontstack}/{range}.pbf'`.
  - Test (Vitest): with the base URI `http://127.0.0.1:4173/#/explore/r/osm%3Away%2F123`, the glyph URL is
    `http://127.0.0.1:4173/basemap/glyphs/{fontstack}/{range}.pbf`.
- **Byte ranges:** check that both `npm run dev` and `npm run preview` answer
  `curl -s -o /dev/null -w '%{http_code}' -r 0-99 http://127.0.0.1:5173/tiles/hamilton.pmtiles` with `206`.
- **Basemap style:** `layers('protomaps', flavor, { lang: 'en' })`, with a flavor derived from the light flavor:
  - land `--ts-map-ground`, water `--ts-map-water`, parks `#e9ebe3`
  - roads `--ts-map-road` with `--ts-line` casing, rail `--ts-line`
  - labels in `--ts-muted` with a `--ts-surface` halo: street names from z15, neighbourhood and water names from z13
  - remove the POI and building layers (deck.gl draws the buildings)
  - no sprite is needed, because no icons are shown
- **Content Security Policy** (production build only, injected by a small Vite plugin in `transformIndexHtml`, since the
  dev server needs its websocket):
  `default-src 'self'; img-src 'self' data: blob:; worker-src 'self' blob:; style-src 'self' 'unsafe-inline';
  font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'`.
  `connect-src 'self'` makes any accidental external request fail loudly.

### 3.6 Budgets

| Item | Budget | If over |
|---|---|---|
| `public/data/recipients.geojson` | ≤ 1.5 MB | simplify footprints further (never drop recipients silently) |
| `public/data/context-buildings.geojson` | ≤ 4 MB | raise the minimum area to 100 m², then shrink the context bbox (4); never change the frame bbox |
| the other files in `public/data/` | ≤ 300 KB together | |
| `public/tiles/hamilton.pmtiles` | ≤ 40 MB (expect 3 to 8 MB at maxzoom 15) | lower maxzoom to 14 |
| JS bundle (gzip) | ≤ 900 KB including MapLibre and deck.gl | code-split the Brief and Method views |

**ASK at Stop 1:** commit `hamilton.pmtiles` (recommended; fine below 25 MB), or git-ignore it and fetch it with `make
tiles`. Protomaps keeps daily builds only for days (on 31 October 2026 the list held dailies from 26 October only), so
a pinned build date cannot be re-fetched later: if fetching is chosen, `make tiles` takes the newest build in the list
at run time and records it in `meta.protomapsBuild`.

---

## 4. Data sources

`00_probe` resolves every URL. `01_fetch` downloads each source once into `pipeline/raw/` and writes
`raw/manifest.json` with `{url, sha256, bytes, fetched, licence}`. `pipeline/README.md` lists every source with its
licence and retrieval date. The facts in the last column were checked on 31 October 2026.

**Seed URLs for `sources.yml`** (milestone 0): CKAN `https://data.ontario.ca/api/3/action/package_show?id=<slug>`
(rows 4 and 5; data2.ontario.ca if needed); `https://hce.net/reports` (follow redirects; row 14); Overpass
`https://overpass-api.de/api/interpreter` plus one mirror from the OpenStreetMap wiki's list of public instances (row
1); `https://build-metadata.protomaps.dev/builds.json` (row 13); glyphs from
`https://protomaps.github.io/basemaps-assets/fonts/<stack>/<range>.pbf` (row 13); Nominatim
`https://nominatim.openstreetmap.org/search` (row 8). Every other URL (CEEP, Enbridge, OEB/IESO, the ECCC and TAF
tables, HCE/FVB pages, City footprints, permits) is found by web search, for discovery only: write it with
`found_by: search`, `found_on: <date>` and [Verify], and the probe report lists it for Stop 1. Never build a URL from a
pattern.

| # | Layer | Source | Used for | Known facts and checks |
|---|---|---|---|---|
| 1 | Building footprints, names, levels, types | **OpenStreetMap** via Overpass (overpass-api.de; one mirror as fallback) | primary geometry and tags: `name`, `building`, `building:levels`, `height`, `amenity`, `addr:*` | `queries/buildings.overpassql` (below the table). Send `User-Agent: ThermoStat/0.1 (+https://github.com/MukherJeenius/ThermoStat)`. Store `osm3s.timestamp_osm_base`. Ids `osm:way/<id>`, `osm:relation/<id>`. Ignore `building:part`; exclude parking and garages. ODbL. |
| 2 | Neighbourhood names (search) | OpenStreetMap via Overpass | `places.json` for "Find a place" | `queries/places.overpassql` (below the table) |
| 3 | Footprints (geometry check) | City of Hamilton open data (open.hamilton.ca, an ArcGIS Hub portal) | replaces OSM geometry where it is clearly better | [Verify] that a building footprints layer exists, plus its format and licence. The City's terms ask that the City of Hamilton be cited. If it is not found within 15 minutes, use OSM only and note it. |
| 4 | Public-sector actual energy | **"Energy use and greenhouse gas emissions for the Broader Public Sector"** (BPS), data.ontario.ca, slug `energy-use-and-greenhouse-gas-emissions-for-the-broader-public-sector` | **Actual** annual gas for hospitals, schools, colleges, universities and municipal buildings | Reported under **O. Reg. 25/23** (formerly 397/11). Raw yearly files (2011 onward) plus 2011–2020 weather-normalised files by sector. Units are mixed (m³, GJ, ekWh, spelled-out names). [Verify] that rows carry the facility name and address. OGL-Ontario. |
| 5 | Large-building intensity calibration | **"Energy and water usage of large buildings in Ontario"** (EWRB), data.ontario.ca, slug `energy-and-water-usage-of-large-buildings-in-ontario` | median gas intensity by property type (step 04) | **No street addresses:** only city, the first 3 postal characters and an EWRB ID; totals withheld. Yearly XLSX (2018 onward) plus a data dictionary. Self-reported, Energy Star Portfolio Manager property types, weather-normalised where possible, not cleansed. **Calibration only: never mark a building Actual from EWRB.** OGL-Ontario. |
| 6 | Archetype intensities | NRCan Comprehensive Energy Use Database (CEUD) | start values (plan B5.1) | space plus water heating only |
| 7 | Weather | ECCC climate data, Hamilton | Hamilton heating degree days, shown in Method only | Full-load hours stay fixed at 2,000 h (building) and 3,600 h (network). OGL-Canada. |
| 8 | Geocoding | Nominatim (nominatim.openstreetmap.org) | facilities, existing customers, and BPS rows left unmatched after steps 1 to 3 of `03_match_actuals` | At most 1 request a second, single thread, a custom User-Agent, `countrycodes=ca&viewbox=<bbox>&bounded=1`. Cache every answer in `raw/geocode_cache.json`, so a rerun makes 0 calls. Under 200 queries in total. Never geocode personal data. ODbL attribution. |
| 9 | Emission factors | **Climatiq API** (section 5) | gas combustion and Ontario grid factors | optional third factor set; ECCC by year is the default |
| 10 | Gas price | Enbridge Gas rate schedule, Union South (OEB-approved) | `prices.json` | One gas-supply charge plus transportation, delivery and fixed charges; never two supply lines. [Verify] |
| 11 | Electricity price | OEB rates and IESO Global Adjustment | `prices.json` | about $0.15/kWh all-in [Est]; [Verify] the customer class |
| 12 | Grid CO2 by year | ECCC reference and TAF/IESO forecast | `factors.json` | the plan B5.5 table; [Verify] against the published tables |
| 13 | Basemap | **Protomaps** daily builds | offline vector basemap | The probe reads the build list as JSON (the source behind maps.protomaps.com/builds; [Verify] `https://build-metadata.protomaps.dev/builds.json`), takes the newest build at milestone 0 (never a guessed date) and records it in meta.json. Archive: `https://build.protomaps.com/<YYYYMMDD>.pmtiles`. Extract: `pmtiles extract <build URL> public/tiles/hamilton.pmtiles --bbox=-79.90,43.23,-79.77,43.29 --maxzoom=15`. ODbL produced work; OSM attribution is required. Glyphs: vendor only the font stacks and ranges the style uses (at least 0-255 and 256-511) from Protomaps' basemaps assets (OFL). **The `pmtiles` CLI is not installed on this Mac.** Options in order, each an ASK: (a) `brew install pmtiles`; (b) `pipeline/steps/tiles_extract.py`, which uses the `pmtiles` PyPI package to range-read the remote build for z0 to 15 inside the frame (a few hundred tiles) and write the archive ([Verify] the package's reader and writer API); (c) if both are refused, Overpass roads, water (`natural=water`, `waterway=riverbank`) and parks, written to `public/data/basemap-fallback.geojson` and drawn by MapLibre with labels from the vendored glyphs only. |
| 14 | HCE study and supporting reports | hce.net/reports: the Energy Harvesting Study **Full Report**, **Summary** (executive summary) and **Overview**, plus the McMaster policy report and the Mohawk College thermal storage report (PDFs on HCE's CDN) | evidence excerpts (step 08); the planned route figure | `00_probe` reads the reports page and records the exact PDF URLs; this spec does not hard-code them. Cache each PDF in `raw/hce/` with its sha256. |
| 15 | City climate plan | City of Hamilton Community Energy and Emissions Plan (CEEP) | evidence: converting downtown district energy from gas to industrial waste heat | [Verify] the final PDF URL on hamilton.ca with the probe |
| 16 | HCE network description | public HCE and FVB pages | evidence for existing customers and the 79 Bay St N plant | an HTML snapshot is cached in `raw/web/` |
| 17 | Planned route | **A person traces** the route figure in the study PDF (geojson.io) into `pipeline/route/route_planned.geojson` | distance to the planned route | Until it is traced, a placeholder polyline (recovery plant → Hamilton General, 237 Barton St E → 79 Bay St N) with `quality: "illustrative"`. Never displayed as a pipe. |
| 18 | Permits (optional) | City of Hamilton building permits or development applications | the timing factor of the fit score | Only if the probe finds it; otherwise the "active permit" branch never fires. |

**Overpass queries** (kept out of the table so the regex pipes stay literal):

```text
queries/buildings.overpassql:
[out:json][timeout:300][maxsize:1073741824][bbox:43.230,-79.900,43.290,-79.770];
(way[building]; relation[building][type=multipolygon];);
out body geom;

queries/places.overpassql:
[out:json][timeout:60][bbox:43.230,-79.900,43.290,-79.770];
node[place~"^(suburb|neighbourhood|quarter)$"];
out body;
```

`out body geom` keeps relation members with their geometry, which `polygonize` needs (6.5). On a timeout or an "out
of memory" error, split the frame bbox into 4 equal quadrants, fetch each with the same retries, merge by id, and
record the split (and each quadrant's `timestamp_osm_base`; `osmBase` is the oldest) in `raw/manifest.json`. Use
`mock.py` only if the split also fails on both the primary server and the mirror.

**Bounding boxes.**

- **Analysis (recipients):** derived from the network, not fixed (a fixed east edge would cut off the eastern half of
  the Phase 1 route). `02_buildings` keeps recipient candidates anywhere in the frame; `07_score` keeps only those
  within 600 m of the existing network or the planned route (2.4), and the rest stay as context. `meta.analysisBbox`
  is the bounding box of that 600 m buffer, so it follows the route once a person traces it.
- **Frame (map and tiles):** −79.90 to −79.77 W and 43.23 to 43.29 N, so Dofasco and Air Liquide are on the map.
- **Context buildings** (clipped in `09_export`): inside the context bbox (`meta.analysisBbox` plus 800 m), footprints
  of 60 m² or more; in the rest of the frame, only footprints of 2,000 m² or more (the Bayfront industrial buildings).
  Context coordinates use 5 decimals.

**Attribution** (Method, plus a compact MapLibre attribution control), each with its retrieval date:

- "© OpenStreetMap contributors (ODbL)"
- "Basemap: Protomaps, © OpenStreetMap contributors"
- "Contains information licensed under the Open Government Licence – Ontario"
- "Contains information licensed under the Open Government Licence – Canada"
- "City of Hamilton open data" with the City's required wording [Verify]
- "Emission factors: Climatiq (data version X)" or "ECCC"
- "Excerpts from Hamilton Community Enterprises reports and City of Hamilton documents, quoted for review, with page
  references"
- "Fonts: Inter and Literata, SIL Open Font License"
- "Derived and modified by the ThermoStat team."

---

## 5. Climatiq (build time only)

Climatiq is an emission-factor API. It runs only in `pipeline/steps/05_factors.py`, never from the browser.

- **Privacy:** it receives factor searches and quantities only (for example 1 m³ of gas or 1 MWh of electricity). It
  never receives building names, addresses or ids.
- **Key hygiene:**
  - The key lives in `pipeline/.env` as `CLIMATIQ_API_KEY` (git-ignored); `.env.example` holds the empty name.
  - **Never prefix it `VITE_`:** Vite exposes `VITE_*` variables to the browser bundle.
  - Never log the Authorization header or write it to `raw/`, `out/`, `meta.json` or `factors.json`.
  - `grep -r CLIMATIQ public/ dist/` returns nothing.

**Steps:**

1. **Read the current docs before coding:** `/docs/api-reference/search`, `/estimate` and `/data-version-endpoint`.
   As checked on 31 October 2026:
   - `GET https://api.climatiq.io/data/v1/data-versions` returns `latest_release`
   - `GET /data/v1/search` requires `data_version` and accepts `query`, `region` (trailing `*` wildcard),
     `unit_type`, `source`, `year`, `page` and `results_per_page`
   - `POST /data/v1/estimate/batch` takes up to 100 estimate bodies
2. **Pin the data version.** Record the exact `latest_release` in `pipeline/climatiq.lock.json`. Use it unchanged for
   reproducible runs: no caret. [Verify] the accepted format in the docs.
3. **Search** with `query=natural gas&region=CA*` and `query=electricity grid&region=CA-ON` (fall back to
   `region=CA*`). Pick one factor each. Record its full selector (`activity_id`, `source`, `year`, `region`,
   `source_lca_activity`, `calculation_method`) and its factor `id`; an `activity_id` alone does not identify one
   factor. Later runs read the lock and never search again unless run with `--refresh`.
4. **Estimate** with one batch call. Gas: `{"volume": 1, "volume_unit": "m3"}`; if the factor's unit type is energy,
   use `{"energy": 1000, "energy_unit": "kWh"}` and convert at 10.36 kWh/m³. Grid: `{"energy": 1, "energy_unit":
   "MWh"}`. Assert that `co2e_unit` is `kg`. Use a 20 s timeout and one retry.
5. **Sanity bounds:** accept gas only between 1.7 and 2.1 kg/m³ and grid only between 0.01 and 0.20 t/MWh. Otherwise,
   or with no key, HTTP 400/401/429 or no network, write `sets.climatiq: null` with the reason in `climatiqReason`
   (for example "no API key") and log it (never the key).
6. **Write `public/data/factors.json`** in the `FactorsFile` shape (7.1):

   ```json
   { "default": "eccc",
     "sets": {
       "eccc": { "id": "eccc", "label": "ECCC reference, by year", "isFallback": false, "gasKgPerM3": 1.9,
                 "gridTPerMwh": {"2025": 0.084, "2026": 0.070, "2027": 0.085, "2030": 0.055, "2035": 0.029},
                 "gridTPerMwhFlat": null },
       "taf":  { "id": "taf", "label": "TAF/IESO forecast (conservative)", "isFallback": false, "gasKgPerM3": 1.9,
                 "gridTPerMwh": {"2025": 0.075, "2026": 0.081, "2027": 0.124, "2030": 0.106},
                 "gridTPerMwhFlat": null },
       "climatiq": { "id": "climatiq", "label": "Climatiq (data version N)", "isFallback": false,
                     "gasKgPerM3": 1.9, "gridTPerMwh": null, "gridTPerMwhFlat": 0.03, "factorYear": 2023,
                     "dataVersion": "N", "selectors": {}, "retrieved": "2026-10-31" } },
     "climatiqReason": null }
   ```

   - The numbers in the climatiq set above are placeholders for the shape only; the run writes real values.
   - `isFallback` is `true` only on the engine's built-in ECCC set, used when `factors.json` fails to load (13).
   - The Climatiq set is a single inventory-year factor, held flat across all 20 years. With no key, `sets.climatiq` is
     `null`.
7. **In the app:** Method → Emission factors offers ECCC by year (default), Climatiq (hidden when null) and TAF
   (conservative). The recipient card and the brief name the active set, and say "Fallback emission factors" only when
   `factors.json` failed to load (13). When `sets.climatiq` is null, its option is hidden and Method → Emission factors
   says "Climatiq not used in this build: {climatiqReason}".

---

## 6. Pipeline

### 6.1 Steps

| Step | Input | Output | Rules |
|---|---|---|---|
| `00_probe` | `sources.yml` | resolved URLs written back to `sources.yml`; `out/probe-report.md` | CKAN `package_show` for each data.ontario.ca slug (try data2.ontario.ca if needed), listing resources with name, format, `last_modified` and URL. HEAD for the other sources; on 400, 403, 405 or 501, one GET with `Range: bytes=0-0` (200 or 206 passes; builds.json answers HEAD with 400), recording the method that worked. Lists the hce.net/reports PDF links and the newest Protomaps build. Calls Climatiq `data-versions` only if a key exists. No large downloads. The report is pasted at Stop 1. |
| `01_fetch` | `sources.yml` | `raw/*`, `raw/manifest.json` | Idempotent: skips files already present; records sha256 and date. Fetches the HCE PDFs, the CEEP PDF and HTML snapshots too. |
| `02_buildings` | OSM (+ City footprints) | `out/buildings_raw.geojson`, `out/context.geojson` | Keep recipient candidates and context inside the frame bbox (07 and 09 narrow them, per 4). Drop recipient candidates whose floor area (after the floor-area rule below) is under 400 m²; such buildings stay as context. Drop context footprints under 60 m². `heightM` = the `height` tag in metres; else `building:levels` × 3.5 m; else null. Floor area = footprint × levels; if levels are missing, height ÷ 3.5 m; else 3 levels, flagged. Archetypes and fields per the rules below the table. `mixed` uses start value 185 kWh/m² and heating share 0.5. |
| `03_match_actuals` | BPS rows + geocodes | `actual_gas_m3` per building | City = Hamilton, latest complete year. Normalise gas to m³ (1 GJ = 26.8 m³; 1 ekWh = 0.0965 m³); reject unknown units. **Match order:** (1) `overrides/bps_matches.csv`; (2) address: the normalised BPS street address equals a footprint's `addr:housenumber` + `addr:street`, and only one footprint matches; (3) name: `rapidfuzz.fuzz.token_set_ratio(a, b) >= 85` (the scorer returns 0 to 100) against the footprint `name`, after lower-casing and stripping punctuation and "the", "inc", "ltd", only if the footprint is inside the frame bbox and, when the row already has a cached geocode, within 150 m of it; (4) for rows still unmatched whose FSA lies in the frame, geocode (cached, counted in the 200-query cap) and take the footprint that contains the point; (5) the nearest footprint within 60 m of that point, only if unique. A campus row spanning several footprints is split by floor area. Unmatched rows go to `out/unmatched_bps.csv`. Rows reported at corporation or campus level count as Checked unless the address matches the footprint. |
| `04_estimate` | archetypes + EWRB | `Estimate` per building | Plan B5.1 and B5.2. **EWRB:** rows whose City is Hamilton (case-insensitive) or whose FSA is L8\* or one of L9A, L9B, L9C, L9G, L9H, L9K (all of Ontario if fewer than 8 rows for a type), latest year. **Type map** (Portfolio Manager type, case-insensitive): Office, Medical Office → office · Multifamily Housing, Residence Hall/Dormitory, Senior Living Community (or Senior Care Community) → multi_res · Hotel → hotel · K-12 School, College/University → school · Hospital (General Medical & Surgical), Other - Specialty Hospital → hospital · Retail Store, Enclosed Mall, Strip Mall, Supermarket/Grocery Store → retail · Mixed Use Property → mixed · Ice/Curling Rink, Library, Social/Meeting Hall, Performing Arts, Courthouse, Fire Station, Police Station, Other - Public Services → civic · anything else unmapped (logged). **Units:** convert intensity to kWh/m² before the guard: ekWh/ft² × 10.7639; kBtu/ft² × 3.1546; GJ/m² × 277.78; m³ of gas per m² × 10.36; reject unknown units. Record the source column and its unit in `meta.calibration.column`. Heating proxy = gas intensity (kWh/m²) × 0.85; if only total EUI exists, × the heating share (office 0.5, multi_res 0.55, retail 0.45, school 0.6, hotel 0.5, civic 0.55, hospital 0.45, mixed 0.5), flagged. Replace a start value only when n ≥ 8 and the median is within 0.5× to 2× of it; otherwise keep it and log. Calibrated types are Checked, the rest Estimate only. **Actual comes only from a BPS match, never from EWRB.** The per-type BPS actual-to-estimate ratio is reported in `meta.calibration` and Method only, and never applied. Record n, median and column in meta.json. Round annual heat to 4 significant figures here, before scoring. |
| `05_factors` | Climatiq / fallback | `factors.json` | Section 5 |
| `06_places` | `places.yml`, `route/route_planned.geojson` | facility points, customer points, `network.geojson` | Geocode facilities and customers (cached). Match the footprints of existing customers and of proposed-connection targets (the Hamilton General campus); they leave the recipient set (2.3). Read `route/route_planned.geojson` or write the illustrative placeholder. `positionQuality` per point. `hce-recovery-plant` takes its position only from `lon`/`lat` in `places.yml`, traced by a person from the study's site figure; until then it is the midpoint of the Dofasco and Air Liquide geocodes with `positionQuality: 'illustrative'`, the card says "Position illustrative: not yet traced from the study figure", and the item stays under [Verify] at every stop. Never estimate coordinates from a figure yourself. |
| `07_score` | network + buildings | `Distances`, `FitAssessment`, rank | Distances in EPSG:32617 (UTM 17N), rounded to 10 m before scoring: existing = to the nearest known customer or plant point (`known_customer`); planned = to the route line (`approx_route` or `illustrative_route`). Candidates with `minM` over 600 m leave the recipient set and stay as context (2.4); write `meta.analysisBbox` (4). Set `activePermit` (null when no permit source was found). Fit per 8.3, implemented in `pipeline/thermostat/fit.py`, from the rounded values. Rank the top 20 eligible recipients by score, ties broken by annual heat, then id ascending. |
| `08_evidence` | cached PDFs and HTML, `evidence/claims.yml`, `evidence/checks.csv` | `SourceRecord`s and `Commitment`s | Section 6.3 |
| `09_export` | everything | `public/data/*`, `meta.json` | Assemble facilities with commitments; connections (operational, proposed, scenario for the 20 ranked). Write `prices.json` from `prices.yml` (`connectionFeeOn` is 0 or 1). Clip context per 4. Simplify footprints (0.5 m recipients, 1 m context) in EPSG:32617 before reprojecting; 6-decimal coordinates (5 for context); peak and network kW computed from the annual heat rounded in 04 and rounded to whole kW; nothing that fit used is re-rounded. Validate every file against `pipeline/schema/`. Enforce the 3.6 budgets. Write `meta.json` (7.3). |
| `mock` | n/a | the outputs of 02 (`out/buildings_raw.geojson`, `out/context.geojson`), every feature `synthetic: true` | 100 plausible corridor buildings labelled "Illustrative"; steps 03 to 09 then run unchanged on them. Used only if 01 or 02 fails, and said so |

`make data OFFLINE=1` rebuilds every output from `raw/`, the Climatiq lock and the geocode cache with no network. It
is byte-identical across reruns: sorted keys, features sorted by id, fixed float formatting, no timestamps except
values read from inputs.

**Archetypes (step 02).** First, these are context only and never recipients: houses (`house`, `detached`,
`semidetached_house`, `terrace`, `bungalow`), garages, parking (`amenity=parking` too), sheds, roofs, carports,
`industrial`, `warehouse`, `manufacture`, places of worship (`amenity=place_of_worship` or a religious `building`
value), `man_made=*` and `power=*`. Then the first match wins:

1. `hospital`: `amenity=hospital`, `healthcare=hospital` or `building=hospital`
2. `school`: `amenity` or `building` = `school`, `college` or `university`
3. `hotel`: `tourism=hotel|motel|hostel` or `building=hotel`
4. `civic`: `amenity=townhall|courthouse|library|community_centre|police|fire_station|arts_centre|theatre`,
   `leisure=sports_centre|ice_rink|stadium`, or `building=civic|government|public|sports_hall|stadium`
5. `office`: `office=*` or `building=office`
6. `multi_res`: `building=apartments|residential|dormitory`
7. `retail`: `shop=*` or `building=retail|supermarket`
8. `mixed`: `building=commercial|mixed_use`; or `building=yes` with a name, an `amenity=*` tag, at least 4 levels or a
   footprint of 600 m² or more. For `building=yes`, "building type" goes in `fit.missing` and the card reads "Mixed
   use (type assumed)".

Anything else, including any other `building=yes`, is context only.

**Fields (step 02).** Unknown stays null; nothing else is assumed.

- `ownerType`: `public` for civic types, a municipal BPS match or `operator:type=government|public`; `institutional`
  for hospital and school types or a hospital, college or university BPS match; `private` only from
  `operator:type=private`; else null.
- `yearBuilt`: the first 4-digit year from 1800 to 2026 in `start_date`, `building:start_date` or
  `construction_date`; else null.
- `heatingSystem` and `boilerYearsLeft`: null unless set in `overrides/buildings.csv`.
- `lastVerified`: the OSM base date, or the BPS file date for an Actual building.

### 6.2 Estimate formulas (plan B5.1 and B5.2, repeated so this file stands alone)

```text
annual_heat_mwh = floor_area_m2 × intensity_kwh_per_m2[type] × age_factor[year_built] / 1000
  start intensities (kWh/m²/yr): office 190 · multi_res 185 · retail 180 · school 170 · hotel 180 · civic 200 ·
                                  hospital 350 · mixed 185
  age factor: before 1960 1.2 · 1960–1979 1.1 · 1980–1999 1.0 · 2000–2014 0.85 · 2015+ 0.7 · unknown 1.0
BPS actual:  annual_heat_mwh = gas_m3 × 10.36 kWh/m³ × 0.85 / 1000          (quality: actual)
building peak:  peak_heat_kw = annual_heat_mwh × 1000 / 2,000 h
network peak:   network_kw   = annual_heat_mwh × 1000 / 3,600 h               (never add another diversity factor)
```

### 6.3 Evidence extraction (`08_evidence`)

The point of this step is that every quotation in ThermoStat can be found, word for word, on the cited page of the
cached original.

1. **`evidence/claims.yml`** lists what to look for. It holds search phrases, not quotations:

   ```yaml
   - id: study-phase12-volume
     facility: hce-recovery-plant
     topic: heat
     title: Heat for Hamilton General, then downtown
     status: proposed
     doc: hce-summary            # key in sources.yml
     anchors: ["65,000 MWh", "18 MW"]   # all must occur in the chosen passage
     page_hint: null
     summary: A proposed network. Customers still to commit.   # team's plain words, ≤ 90 characters
     holder: HCE (Energy Harvesting Study)
     interpretation: null        # null = the default line for the status
     question: Which buildings have committed so far?
   ```

   Claims to seed (each [Verify] by a person after extraction):

   | Facility | Topic | Look for, in | Anchor ideas |
   |---|---|---|---|
   | recovery plant | heat | Summary | Phases 1 and 2: 65,000 MWh a year, 18 MW peak; Phase 1 to Hamilton General, Phase 2 to the downtown plant |
   | recovery plant | energy | Summary | 3 × 10 MW heat pumps, 1.7 MW electric boiler, 2 × 13 MW gas boilers, 6.1 million litres of storage |
   | recovery plant | emissions | Summary | full build-out 143,000 MWh, 51 MW, more than 27,000 t CO2e a year avoided, 80 % |
   | recovery plant | heat | Summary or Full Report | "Commercialization Phase"; customer and supplier commitments |
   | recovery plant | energy | Summary | Phase 1 and 2 capital cost 32 % above the conceptual estimate |
   | recovery plant | heat | Full Report | heat priced at business-as-usual gas cost, no green premium; connection charge equal to in-building equipment avoided |
   | Dofasco, Air Liquide | heat | Summary or Full Report | named as waste-heat sources; IRR 14.3 % (Dofasco) and 11.5 % (Air Liquide) |
   | downtown plant | heat, energy | HCE or FVB pages | about 12 buildings; combined heat and power; 79 Bay St N; customer names |
   | downtown plant | emissions | CEEP | converting the downtown district energy system from natural gas to industrial waste heat |
   | data centres | heat, water, energy | none known | leave `unknown` unless a public, site-specific record turns up; never cite general principles or industry claims as a facility's commitment |

2. **Text per page.**
   - **PDFs:** pdfplumber for the text, and pypdf `page_labels` for the printed page label. Record both the label and
     the 1-based physical index.
   - **HTML:** the stdlib `html.parser` text of the main content; `page: null`.
3. **Find the passage.** Search for the sentence (or at most 2 adjacent sentences) containing every anchor.
   - Match anchors against a folded copy of the page text (NFKC; U+00A0, U+2009 and U+202F as spaces;
     case-insensitive), with an offset map back to the original.
   - The stored excerpt is the original slice with whitespace and line-break hyphens normalised. If it contains
     ligature code points, replace them with their letters. Record which in `excerptNormalisation`.
   - If a page's words fall into two x-bands (two columns), extract each column with `page.crop()` and search the
     left, then the right.
   - If several pages match, prefer `page_hint`, else the first, and log the others.
   - **Assert** that the stored excerpt occurs verbatim in the normalised page text, and that it is at most 60 words.
4. **Not found:** the commitment is written with `status: "unknown"` and `source: null`, and is listed in
   `out/evidence-report.md` for a person. Never fall back to typed text.
5. **Human check.** A person opens each PDF at the cited page and adds a row to `evidence/checks.csv`:

   ```text
   claim_id,checked_by,checked_on,matches
   ```

   - `checked_by` holds initials only. `matches` is `yes` or `no`.
   - `09_export` sets `humanCheck` only for `yes`. A `no` fails the export until the claim is fixed.
   - The UI shows either "Checked against the original by AB on 1 Nov 2026" or "Not yet checked against the original
     by a person".
6. **Report:** `out/evidence-report.md` lists claims found, not found and checked, with page and URL. Its counts go
   into `meta.json`.

### 6.4 Pipeline tests (`pytest`, no network, no key)

- archetype mapping (one row per rule above, plus `building=yes` below each threshold); the height and floor-area
  fallbacks
- BPS unit normalisation and the match order (fixture rows); name ratio 84 → no match, 85 → match
- no recipient is the target of a proposed connection, and `meta.demoRecipientId` is a ranked recipient
- the EWRB guard: n < 8, or outside 0.5× to 2×, keeps the start value
- fit boundaries and **fit parity:** `fixtures/fit-cases.json` gives the same score and band in Python and TypeScript
- evidence:
  - an anchor found gives the exact passage with its page label
  - a missing anchor gives `unknown` and `source: null`
  - an over-long passage is refused
  - an excerpt not found verbatim is refused
  - the checks.csv join works
  - the page-label mapping works
  - HTML extraction works

  The tests use pre-extracted page-text fixtures. An optional integration test runs on a cached real PDF and is
  skipped (and reported as skipped) when the cache is absent.
- every exported file validates against `pipeline/schema/`
- every recipient has at least 1 `sourceId`; every operational or proposed connection has at least 1 `evidenceId`
  present in `sources.json`; every URL is HTTPS; no commitment with `source: null` has a status other than `unknown`
  (synthetic ones included); every facility `mapLabel` is at most 24 characters
- `prices.yml` equals `src/engine/fixtures/prices.default.json` value for value; a verified price that differs is an
  ASK, never an edit to either file
- `make data OFFLINE=1` twice gives the same sha256 for every file in `public/data/`
- no exported file contains the API key value, `Authorization` or `CLIMATIQ`
- budgets (3.6)

### 6.5 Python environment

- Python 3.11 to 3.14 (this Mac has 3.14). `pipeline/requirements.txt`, exact pins at milestone 0: requests,
  PyYAML, python-dotenv, shapely, pyproj, rapidfuzz, pdfplumber, pypdf, openpyxl, jsonschema, pytest. No geopandas,
  fiona or GDAL: files in `out/` are GeoJSON.
- Overpass relations become polygons with `shapely.ops.polygonize` over the member ways: outer rings minus inner
  rings.
- Makefile: `venv` runs `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`; every other target runs
  `.venv/bin/python -m steps.<file stem>`.

---

## 7. Data contract

### 7.1 `src/contract/data-contract.ts`

This extends the handoff's `code/data-contract.ts`. **Every handoff name and field is kept**; additions are marked.
The pipeline exports JSON in exactly these camelCase names, so the front end does no renaming.

```ts
/** ThermoStat data contract. Extends design/handoff/code/data-contract.ts; handoff names are unchanged.
 *  Timestamps and dates are ISO 8601. Unknown values are null, never 0 or ''. */

export type Position = readonly [longitude: number, latitude: number];
export type EvidenceStatus = 'proposed' | 'required' | 'reported' | 'verified' | 'unknown';

export interface SourceRecord {
  id: string;
  title: string;
  url: string;                      // the original HTTPS document; never a guessed or generated link
  documentDate: string | null;
  retrievedAt: string;
  page: string | null;              // printed page label, else "PDF p. N"; null for HTML
  excerpt: string;                  // exact passage, ≤ 60 words
  synthetic: boolean;
  // added
  shortTitle: string;               // e.g. "Energy Harvesting Study, Summary" (from sources.yml)
  publisher: string | null;         // e.g. "Hamilton Community Enterprises", "City of Hamilton"
  docKind: 'pdf' | 'html' | 'dataset';
  pdfPageIndex: number | null;      // 1-based physical page
  excerptNormalisation: 'none' | 'whitespace' | 'whitespace+hyphenation' | 'whitespace+hyphenation+ligatures';
  sha256: string | null;            // of the cached document
  licence: string | null;
  humanCheck: { checkedBy: string; checkedOn: string } | null;   // null = not yet checked by a person
}

export type CommitmentTopic = 'heat' | 'water' | 'noise' | 'energy' | 'emissions';  // added: 'emissions'

export interface Commitment {
  id: string;
  topic: CommitmentTopic;
  title: string;
  summary: string;                  // the team's plain words, ≤ 90 characters, never in quotation marks
  status: EvidenceStatus;
  source: SourceRecord | null;
  question: string | null;
  // added
  interpretation: string | null;    // null = the default line for the status (2.2)
  holder: string | null;            // who made the statement, e.g. "HCE (Energy Harvesting Study)"
}

export type FacilityKind = 'industrial_source' | 'energy_plant' | 'data_centre';
export type PositionQuality = 'address' | 'approximate' | 'illustrative';

export interface Facility {
  id: string; name: string; locality: string; position: Position;
  synthetic: boolean; commitments: Commitment[];
  // added
  kind: FacilityKind;
  operator: string | null;
  address: string | null;
  positionQuality: PositionQuality;
  mapLabel: string;                 // ≤ 24 characters, from places.yml: 'Proposed recovery plant', 'HCE plant, 79 Bay St N'
}

export type ConnectionKind = 'scenario' | 'proposed' | 'operational';

export interface HeatConnection {
  id: string; facilityId: string; recipientName: string;
  source: Position; target: Position;
  kind: ConnectionKind;
  evidenceIds: string[];
  synthetic: boolean;
  // added
  recipientId: string | null;       // Recipient.id for scenario links, else null
  phase: string | null;             // e.g. "Phase 1" (study), else null
  targetQuality: PositionQuality;
}

export type RemoteState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

// ---- added: recipients (candidate buildings) ----

export type Archetype = 'office' | 'multi_res' | 'retail' | 'school' | 'hotel' | 'civic' | 'hospital' | 'mixed';
export type DataQuality = 'actual' | 'checked' | 'estimate';   // words: Actual · Checked estimate · Estimate only

export interface Estimate {
  annualHeatMwh: number;            // > 0
  peakHeatKw: number;               // round(annualHeatMwh × 1000 / 2000)
  networkKw: number;                // round(annualHeatMwh × 1000 / 3600)
  quality: DataQuality;
  method: 'bps_actual' | 'archetype_calibrated' | 'archetype_start';
  intensityKwhM2: number | null;
  ageFactor: number | null;
  calibration: { n: number; medianKwhM2: number; year: number } | null;
  actual: { gasM3: number; year: number; bpsOperationId: string } | null;
  sourceIds: string[];
}

export interface Distances {
  existingM: number | null;         // to the nearest known customer or the downtown plant; always 'known_customer'
  plannedM: number | null;          // to the planned route line
  plannedQuality: 'approx_route' | 'illustrative_route' | null;   // added
  minM: number | null;
  quality: 'known_customer' | 'approx_route' | 'illustrative_route';   // the quality of minM
}

export type FitBand = 'strong' | 'possible' | 'weak';

export interface FitAssessment {
  band: FitBand;
  score: number;                    // integer 0..100, shown small and secondary
  reasons: string[];                // 1 to 3 plain sentences
  missing: string[];                // e.g. ["heating system", "year built"]: "Not in source data"
  points: { size: number; distance: number; heating: number; anchor: number; timing: number; data: number };
}

export interface Recipient {
  id: string;                       // 'osm:way/123' | 'osm:relation/45' | 'ham:<id>' | 'demo:<n>'
  name: string | null;              // null → "Unnamed building" + address
  address: string | null;
  type: Archetype;
  position: Position;               // a label point inside the footprint
  floorAreaM2: number;              // ≥ 400
  floorAreaMethod: 'levels' | 'height' | 'assumed_3_levels' | 'reported';
  heightM: number | null;
  yearBuilt: number | null;
  ownerType: 'public' | 'institutional' | 'private' | null;
  heatingSystem: 'hydronic' | 'forced_air' | null;   // null = unknown
  boilerYearsLeft: number | null;   // null → the engine assumes 12 and says "assumed"
  activePermit: boolean | null;     // added: an active permit or site plan within 50 m; null = no permit data (4, row 18)
  estimate: Estimate;
  distances: Distances;
  fit: FitAssessment;
  rank: number | null;              // 1..20 among recipients to approach, else null
  sourceIds: string[];              // ≥ 1
  lastVerified: string | null;
  synthetic: boolean;
}

/** Properties of every footprint in context-buildings.geojson (and the role of recipients.geojson features). */
export interface BuildingFootprint {
  id: string;
  heightM: number | null;           // height tag, else levels × 3.5 m; null → drawn at 9 m, never labelled
  role: 'context' | 'recipient' | 'customer' | 'facility';
}
export type Building = Recipient;   // alias, so either name reads naturally in components

// ---- added: assumptions, factors and engine results ----

export interface Assumption { value: number; unit: string; sourceId: string | null; date: string | null; verify: boolean }
export type PriceKey =
  | 'gasPriceM3' | 'boilerEff' | 'kwhPerM3' | 'elecPriceKwh' | 'hpCop' | 'hpCopDesign' | 'hpCapexKw'
  | 'elecUpgradeKw' | 'boilerCapexKw' | 'boilerLife' | 'maintGas' | 'maintHp' | 'discountRate'
  | 'carbonPriceT' | 'hceRateAdj' | 'connectionFeeOn' | 'fullLoadHoursBuilding' | 'fullLoadHoursNetwork'
  | 'hceCo2Share';
export type Prices = Record<PriceKey, Assumption>;
export type PriceValues = Record<PriceKey, number>;          // what the engine takes

export interface FactorSet {
  id: 'eccc' | 'climatiq' | 'taf';
  gasKgPerM3: number;
  gridTPerMwh: Record<string, number> | null;               // by year; null for a flat set
  gridTPerMwhFlat: number | null;
  label: string;                                            // shown in the card and the brief
  isFallback: boolean;
}

export interface CostOption {
  annual: number; upfront: number; replacement: number; replacementPv: number;
  pv20: number; levelized: number; co2T: number; co2_20yT: number; gridKw: number;
}

export interface Verdict {
  band: 'about_the_same' | 'costs_more' | 'cheaper';
  deltaPct: number;                 // HCE pv20 vs gas pv20, in %
  co2CutPct: number;                // HCE vs gas
  hceGridKw: number; hpGridKw: number;
  sentence: string;                 // built from the numbers above (8.4)
  heatPumpCaveat: string | null;    // set when the heat pump emits less than HCE
}

export interface CostComparison {
  gas: CostOption; heatpump: CostOption; hce: CostOption;
  hceRate: number;                  // $/MWh: gas parity × (1 + hceRateAdj)
  verdict: Verdict;
  factorSetId: FactorSet['id'];
  factorYear: number;
  assumptions: 'sourced_defaults' | 'edited';
}

export interface Totals {
  count: number; annualMwh: number; networkMw: number; co2AvoidedT: number; hceRevenue: number;
}

// ---- added: file shapes, one per file in public/data/ (7.2); the schema is generated from these ----

export interface Feature<G, P> { type: 'Feature'; id: string; geometry: G; properties: P }
export type Poly = { type: 'Polygon'; coordinates: number[][][] } | { type: 'MultiPolygon'; coordinates: number[][][][] };
export type FacilitiesFile = Facility[];
export type ConnectionsFile = HeatConnection[];
export type SourcesFile = SourceRecord[];
export interface RecipientsFile { type: 'FeatureCollection'; features: Feature<Poly, Recipient>[] }
export interface ContextFile { type: 'FeatureCollection'; features: Feature<Poly, BuildingFootprint>[] }
export interface NetworkProps {
  role: 'plant' | 'customer' | 'route' | 'corridor';   // corridor = the 600 m study band (9.3 layer 2)
  name: string | null;
  quality: PositionQuality | 'known_customer' | 'approx_route' | 'illustrative_route';
}
export interface NetworkFile {
  type: 'FeatureCollection';
  features: Feature<{ type: 'Point'; coordinates: number[] } | { type: 'LineString'; coordinates: number[][] } | Poly,
    NetworkProps>[];
}
export interface Place { name: string; kind: 'neighbourhood'; position: Position }
export type PlacesFile = Place[];
export type PricesFile = Prices;
export interface FactorsFile {
  default: FactorSet['id'];
  sets: {
    eccc: FactorSet; taf: FactorSet;
    climatiq: (FactorSet & { factorYear: number; dataVersion: string; selectors: Record<string, string>;
      retrieved: string }) | null;
  };
  climatiqReason: string | null;    // why sets.climatiq is null, e.g. "no API key"; null when it is present
}
export interface MetaFile {
  generatedAt: string; osmBase: string; protomapsBuild: string | null;
  frameBbox: [number, number, number, number]; analysisBbox: [number, number, number, number];
  retrieved: Record<string, string>;
  counts: { buildings: number; recipients: number; byQuality: Record<DataQuality, number>; synthetic: number;
    facilities: number; connectionsByKind: Record<ConnectionKind, number> };
  rampBreaksMwh: [number, number, number, number];
  calibration: { type: Archetype; n: number; medianKwhM2: number | null; used: boolean; column: string | null;
    year: number | null; bpsRatio: number | null }[];   // bpsRatio: median BPS actual ÷ estimate, reported only
  evidence: { claims: number; found: number; unknown: number; humanChecked: number };
  defaultFacilityId: string; demoRecipientId: string;
}

/** No absence-of-record → non-compliance inference. Unknown numeric values use null, not zero.
 *  Dates, units and comparable definitions are required before comparison. Layer visibility, selection,
 *  notes and the shortlist are frontend state, not evidence. */
```

### 7.2 Files in `public/data/`

| File | Content |
|---|---|
| `facilities.json` | `FacilitiesFile`: commitments and their `SourceRecord`s embedded |
| `connections.json` | `ConnectionsFile` |
| `sources.json` | `SourcesFile`: every `SourceRecord`, including dataset sources (`docKind: 'dataset'`, `excerpt` = a one-line description) |
| `recipients.geojson` | `RecipientsFile` |
| `context-buildings.geojson` | `ContextFile` |
| `network.geojson` | `NetworkFile`: known-customer points, the plant point, the planned route and the corridor band, each with `quality` |
| `places.json` | `PlacesFile`, for search |
| `basemap-fallback.geojson` | only when basemap option (c) is used (section 4, row 13) |
| `prices.json` | `PricesFile` (every value with unit, source, date, verify) |
| `factors.json` | `FactorsFile` (section 5) |
| `meta.json` | `MetaFile` (7.3) |

### 7.3 `meta.json`

The shape is `MetaFile` (7.1). `generatedAt` is taken from the newest input date, so reruns stay identical.

- `rampBreaksMwh`: 4 quantile breaks for the heat-demand tint
- `calibration[]`: one row per archetype (4, step 04)
- `defaultFacilityId`: `hce-recovery-plant`
- `demoRecipientId`: the highest-ranked Actual recipient, else the highest-ranked Checked one, else rank 1.
  Proposed-connection targets are never recipients (2.3), so they can never be chosen.

### 7.4 Validation

- **Schema:** `npm run schema` (`scripts/schema.mjs`) calls ts-json-schema-generator once per file type in 7.1
  (`path: 'src/contract/data-contract.ts'`, `expose: 'export'`, `topRef: true`) and writes
  `pipeline/schema/<file>.schema.json`. The output is JSON Schema draft-07, which is what the tool emits.
  - A Vitest test regenerates it and fails if the committed copy is stale.
  - pytest validates every export with `jsonschema.Draft7Validator`.
  - A Vitest test validates `public/data/*` with ajv's default (draft-07) class, `new Ajv({ allErrors: true,
    strict: false })`.
- **Runtime:** `src/data/validate.ts` holds hand-written guards for what the UI relies on, and `safeHttpsUrl()`
  (`new URL(u)`, protocol must be `https:`).
  - An invalid item is skipped and counted (Method → Data quality). The app never crashes on bad data.
  - A file that fails as a whole gives an error state with Retry (section 13).
- **Fetching:** components never fetch. `src/data/load.ts` fetches, validates and normalises, then passes
  `RemoteState<T>` down.

---

## 8. Engine (pure TypeScript, no DOM)

### 8.1 Modules

`src/engine/` imports nothing from React, MapLibre, deck.gl or the DOM; an ESLint `no-restricted-imports` rule
enforces this.

| Module | Exports |
|---|---|
| `units.ts` | `crf(r, years)`, `annuityFactor(r, years = 20)`, `interpolateByYear(table, year)` (linear between table years, held flat outside them) |
| `cost.ts` | `gasParityRate(p: PriceValues, f: Pick<FactorSet, 'gasKgPerM3'>)`; `compare(input: { annualHeatMwh; peakHeatKw; boilerYearsLeft: number \| null }, p, f: FactorSet, opts?: { startYear?: number }) → CostComparison`; `networkScenario(networkKw, p, f) → { annualMwh, revenue }` |
| `fit.ts` | `fitAssessment(recipientInputs, opts?) → FitAssessment` (same rules as `pipeline/thermostat/fit.py`) |
| `verdict.ts` | `verdict(comparison, p) → Verdict` |
| `totals.ts` | `together(recipients, p, f) → Totals` |
| `format.ts` | en-CA. **Money:** in tables, totals, the scale line and captions, $500,000 or more is `'$' + (x / 1e6).toFixed(2) + 'M'` ($0.86M, $1.19M, $2.16M) and smaller amounts take 3 significant figures ($151,000); in prose sentences, 2 significant figures after "about" (about $2.2M, about $3.8M). **Other quantities** (MWh, kW, t, $/MWh): 3 significant figures in tables, 2 with "about" in prose. **Percentages:** integers with sign. |

Every figure in UI copy, captions and the brief comes from these modules or from `meta.json`, never from a template.

### 8.2 Cost formulas (plan B5.5)

**Defaults** (`prices.json`; each value with source and date):

| Assumption | Default |
|---|---|
| gas price | $0.32/m³ all-in |
| boiler efficiency | 0.85 |
| heat content of gas | 10.36 kWh/m³ |
| electricity price | $0.15/kWh |
| heat pump seasonal COP | 2.8 |
| heat pump design COP | 2.0 |
| heat pump capital cost | $1,800/kW |
| electrical upgrade | $150/kW |
| boiler capital cost | $250/kW |
| boiler life | 25 years |
| maintenance | gas 0.02 of boiler capex a year · heat pump 0.03 of heat pump capex a year |
| discount rate | 0.05 |
| carbon price | $0/t |
| HCE rate adjustment | 0 (slider ±0.10) |
| connection fee | off |
| full-load hours | 2,000 (building) and 3,600 (network) |
| gas CO2 | 1.9 kg/m³ (in `factors.json` as `FactorSet.gasKgPerM3`, not in `prices.json`) |
| HCE CO2 | 0.2 of the gas option |

**Formulas.** Q = annual heat (MWh); P = building peak (kW); r = discount rate; AF = Σ_{t=1..20} 1/(1+r)^t.

```text
heat_per_m3 = kwhPerM3 × boilerEff                                  (8.806 kWh of heat per m³)
GAS PARITY RATE ($/MWh)
  fuel   = gasPriceM3 / heat_per_m3 × 1000
  capex  = boilerCapexKw × (1000 / fullLoadHoursBuilding) × CRF(boilerLife, r)
  maint  = maintGas × boilerCapexKw × (1000 / fullLoadHoursBuilding)
  carbon = carbonPriceT × gasKgPerM3 / 1000 / heat_per_m3 × 1000
  hceRate = (fuel + capex + maint + carbon) × (1 + hceRateAdj)

GAS        fuel_m3     = Q × 1000 / heat_per_m3
           annual      = fuel_m3 × (gasPriceM3 + carbonPriceT × gasKgPerM3 / 1000) + maintGas × boilerCapexKw × P
           replacement = boilerCapexKw × P, in year n = clamp(boilerYearsLeft ?? 12, 1, 30), only if n ≤ 20
           replacementPv = replacement / (1+r)^n ;  upfront = 0 ;  co2T = fuel_m3 × gasKgPerM3 / 1000 ;  gridKw = 0
HEAT PUMP  elec_mwh = Q / hpCop
           upfront  = (hpCapexKw + elecUpgradeKw) × P
           annual   = elec_mwh × 1000 × elecPriceKwh + maintHp × upfront
           co2T     = elec_mwh × grid[startYear]  ;  gridKw = P / hpCopDesign
HCE        annual   = Q × hceRate
           upfront  = connectionFeeOn ? boilerCapexKw × P : 0
           co2T     = hceCo2Share × gas.co2T  ;  gridKw = 0 (network load is handled at HCE's plant)

pv20      = upfront + annual × AF + replacementPv
levelized = pv20 / (AF × Q)
co2_20yT  = heat pump: Σ_{t=1..20} elec_mwh × grid[startYear − 1 + t]  (interpolated; flat after the last table year)
            gas and HCE: 20 × co2T
startYear = 2026
```

### 8.3 Fit (plan B5.4)

| Factor | Points | Rule |
|---|---|---|
| Size | 0 to 30 | 0 below 300 MWh, 30 at 3,000 MWh or more, linear between |
| Distance | 0 to 25 | `minM`: 25 within 100 m, 0 at 600 m or more, linear between; null → 0 and "Distance not computed" |
| Heating | 15 / 7 / 3 | hydronic 15 · unknown 7 · forced air 3 |
| Anchor | 15 / 8 / 3 | hospital, school or civic, or owner public or institutional → 15 · any other building with ≥ 1,000 MWh (plan B5.4's "large private"; owner type is usually unknown) → 8 · else 3 |
| Timing | 10 / 8 / 6 / 2 | an active permit within 50 m (only when permit data exists) 10 · `boilerYearsLeft` ≤ 5 → 8 · built 2001 or earlier → 6 · else, or year unknown, 2 |
| Data | 5 / 3 / 1 | actual 5 · checked 3 · estimate 1 |

- **Points** stay unrounded, computed in this order in both languages: size = 30 × (Q − 300) / 2700, distance =
  25 × (600 − minM) / 500, each clamped to its range. Q and minM are the exported (already rounded) values (6.1).
- **Score** = floor(sum + 0.5) in both languages: Python `math.floor(total + 0.5)`, never `round()` (it rounds half
  to even); TypeScript `Math.floor(total + 0.5)`. Sums ending in .5 are common, because distance moves in 0.5-point
  steps.
- **`fixtures/fit-cases.json`:** `[{ name, input: { annualHeatMwh, minM, heatingSystem, type, ownerType, yearBuilt,
  boilerYearsLeft, quality, activePermit }, expected: { score, band, points } }]`, with at least two sums ending in
  .5. For example, Q 3,000, minM 350, hydronic, hospital, built 1960, actual: 30 + 12.5 + 15 + 15 + 6 + 5 = 83.5 →
  84, Strong fit.
- **Band:** Strong fit ≥ 70 · Possible fit 45 to 69 · Weak fit < 45 [Est]. The bands are stated in Method.
- **Reasons:** the top 3 factors by points, written as sentences from the data. For example:
  - "Large heat user: about 3,900 MWh a year (Checked estimate)."
  - "About 140 m from the planned route (approximate)."
  - "A public anchor building: a hospital."
  - "Uses this building's reported gas use."

  An unknown is never phrased as a strength. Unknown fields go in `missing` and are shown as "Not in source data:
  heating system, year built."

### 8.4 Verdict and wording

- **Band:**
  - |Δ| ≤ 10 % → `about_the_same`: "About the same cost as gas over 20 years (+7 %)."
  - Δ > +10 % → `costs_more`: "Costs about 14 % more than gas over 20 years."
  - Δ < −10 % → `cheaper`: "About 12 % cheaper than gas over 20 years, at your assumed HCE rate." Under gas parity a
    carbon price adds the same $/MWh to gas and to HCE's rate, so only a lower assumed rate (`hceRateAdj` < 0) can
    make HCE cheaper. Never attribute it to the carbon price.
- **Then always:** "About 80 % less CO2 than gas, and about 0 kW of added grid load against about 980 kW for an own
  heat pump." Every number comes from the comparison, formatted to 2 significant figures.
- **`heatPumpCaveat`,** when heat pump co2T < HCE co2T: "An own heat pump emits less (about 98 t against 170 t a year
  at the 2026 grid factor) but adds about 980 kW of grid load and about $3.8M upfront."
- **Never** write "lowest carbon" or "cheapest" for HCE, or "HCE's rate" without "assumed".

### 8.5 Required unit tests (Vitest)

Use the frozen fixtures `src/engine/fixtures/prices.default.json` and `factors.default.json` (the plan B5 defaults),
never `public/data/`. All values below were recomputed from the formulas in 8.2. "Plan" gives the rounded figure the
plan quotes. Tolerances are absolute unless shown as %. Never change an expected number to make a test pass; ask.

| Case | Expected |
|---|---|
| Intermediates at defaults | fuel 36.339 $/MWh; CRF(25 y, 5 %) 0.0709525; capex 8.869; maint 2.500 (±0.001) |
| `gasParityRate` | **47.708** at defaults (±0.01; plan "about $47.7/MWh"); **66.048** at $85/t (±0.01; plan "about $66.0") |
| Annuity factor | AF(5 %, 20) = 12.46221 (±0.00001) |
| Office, gas (Q 3,900 MWh, P 1,950 kW, boilerYearsLeft 12) | fuel 442,880 m³ (±1); annual **$151,471.55** (±$1; plan ≈ $151,470); replacement $487,500, replacementPv $271,458 (±$1); pv20 **$2,159,129** (±0.05 %; plan ≈ $2,159,130); levelized 44.42 $/MWh; co2T 841.47 t; gridKw 0 |
| Office, HCE | annual $186,061 (±$1); pv20 **$2,318,730** (±0.05 %; plan ≈ $2.319M); levelized 47.71 (equals the rate when there is no fee); co2T 168.29 t (= 0.2 × gas); gridKw 0 |
| Office verdict at defaults | deltaPct **+7.39** (±0.01) → `about_the_same`; sentence starts "About the same cost as gas"; co2CutPct 80 |
| Office, heat pump | upfront $3,802,500; electricity 1,392.857 MWh; annual $323,003.57 (±$1); pv20 $7,827,838 (±0.05 %); levelized 161.06 $/MWh; gridKw **975** (= P / 2.0); co2T 97.50 t (ECCC 2026, 0.070); co2_20yT 1,165.8 t (±0.1) |
| Heat pump with the TAF set | co2T 112.82 t (0.081); co2_20yT 2,968.2 t (±0.1) |
| CO2 ordering | heat pump 97.5 < HCE 168.3 < gas 841.5, so `heatPumpCaveat` is set; no output contains "lowest carbon" |
| Office at $85/t | gas annual $222,996.65, pv20 $3,050,489; HCE rate 66.048, annual $257,586, pv20 $3,210,091 (±0.05 %); deltaPct +5.23 → `about_the_same` |
| boilerYearsLeft 25 | gas pv20 $1,887,670 (±0.05 %): no replacement inside 20 years |
| Connection fee on | HCE upfront $487,500; pv20 $2,806,230 (±0.05 %) |
| Clamping | boilerYearsLeft 0 → 1; 40 → 30; null → 12, marked "assumed" |
| Headline | `networkKw` for 18,000 MWh = 5,000 kW; `networkScenario(5000, p, f)` revenue $858,743 at defaults and $1,188,858 at $85/t (±$1), formatted "$0.86M" and "$1.19M" |
| Monotonic | a higher gas price raises the gas annual and the HCE rate; a higher COP lowers the heat-pump annual; a higher discount rate raises the CRF and the HCE rate |
| Verdict bands | Δ +10.0 → `about_the_same`; +10.1 → `costs_more`; −10.1 → `cheaper`, ending "at your assumed HCE rate"; the office with `hceRateAdj` −0.10 and boilerYearsLeft 1 → deltaPct −11.27 (±0.01) → `cheaper`; no output names the carbon price as a reason |
| Fit | distance 100 m → 25, 350 m → 12.5, 600 m → 0; size 300 → 0, 1,650 → 15, 3,000 → 30; sum 83.5 → score 84 and 72.5 → 73 in both languages; score 70 → strong, 69 → possible, 45 → possible, 44 → weak |
| Fit parity | every case in `fixtures/fit-cases.json`, and every recipient in `public/data/`, scores the same in TypeScript as the exported `fit` |
| Formatting | 975 → "about 980 kW"; 2,159,129 → "$2.16M" (table) and "about $2.2M" (prose); 7.39 → "+7 %"; null → "Not in source data" |
| Totals | `together()` of the office twice: annualMwh 7,800, networkMw 2.17, co2AvoidedT 1,346.4, hceRevenue $372,122 (±$1) |

Each Totals value is the office case doubled. For example, CO2 avoided per office = 841.47 − 168.29 = 673.2 t, so
1,346.4 t for two.

---

## 9. User interface

### 9.1 Identity: the handoff is canonical; these are the only changes

The canonical look is `design/handoff/code/tokens.css` plus `Mockup-1.png` and `Mockup-2.png`:

- warm white surfaces, charcoal type, fine separators
- 30 px corners and the two-part soft shadow
- generous padding
- amber `#d16b24` reserved for attention, muted lilac for secondary connections
- Inter, with an italic serif used sparingly (the list in 9.15)

**The changes:**

1. **Fonts are self-hosted:**
   - `--ts-sans: 'Inter Variable', 'Inter', 'Helvetica Neue', Arial, sans-serif`
   - `--ts-serif: 'Literata', 'Iowan Old Style', Georgia, serif`, italic 400 only

   Do not substitute another serif. The serif is italic: `tokens.css`, `START-HERE.md` and the vector
   `01-Visual-Direction.pdf` and `draw-mockups.py` (Times-Italic) all say so. The two PNGs show it upright, which
   looks like a font substitution when they were rasterised; follow the vector sources.
2. **Amber text is measured.** `#d16b24` measures 3.5:1 on `--ts-surface` and 3.2:1 on `--ts-bg`: fine for dots, large
   marks and focus rings, but not for small text.
   - Add `--ts-accent-text: #a3521b` (5.4:1 on surface, 5.0:1 on bg) for links and small text.
   - `.ts-source` and every amber link use it.
3. **Map colours are measured.** The handoff's arc colours (`#e68338`, `#a49aa9`) measure 2.4 to 2.7:1 on the map
   ground, below the 3:1 needed for graphics. The map uses:
   - `--ts-map-attention: #c45f1c` (3.7:1 on the ground)
   - `--ts-map-secondary: #857a8c` (3.6:1)
   - a `--ts-surface` casing 1.5 px wider than the arc on each side (9.3); it is mandatory, because both arc colours
     measure 2.3 to 2.7:1 on building walls

   The handoff tokens stay declared for large legend dots only if the contrast script passes them.
4. **No numeric score bars or dials.** Fit is a word (Strong / Possible / Weak fit) with the number small and secondary,
   and the reasons are sentences.
5. **No continuous arc animation, no decorative counters.**
6. **Buildings are desaturated by default.** A "Heat demand" toggle tints recipients with a restrained warm ramp
   (9.3).
7. **Navigation:** Explore (the map) · Records (a readable list) · Method (sources, licences, formulas, data quality).
8. **Footer:** the team credit and a link to Method → Sources only. No other credit line.
9. **FacilityPanel rows** show the team's summary, the status in words and a source line. The exact excerpt moves to
   the evidence record (9.7), where it gets quotation marks and room. The handoff component is adapted, not
   replaced, and the change goes in `docs/decisions.md`.
10. **Fitted to real content.** Mockup-1 shows 3 switches, 3 places and 3 short rows; the real data is longer. So the
    rail drops the "01 YOUR AREA" block and scrolls only its list (9.4), the cards keep their actions in a fixed footer
    (9.5), and the current nav item is also underlined (9.17), because colour alone (2.87:1 between ink and muted) is
    not enough.

**Token additions** (in `src/ui/tokens.css`, after the handoff block):

```css
:root {
  --ts-accent-text: #a3521b;
  --ts-map-ground: #f3f2ee; --ts-map-water: #dde3df; --ts-map-road: #fbfaf6; --ts-map-roof: #e7e5df;
  --ts-map-attention: #c45f1c; --ts-map-secondary: #857a8c;
  --ts-heat-1: #e2cdb0; --ts-heat-2: #d6ab82; --ts-heat-3: #c5875b; --ts-heat-4: #ab6a45; --ts-heat-5: #8c5133;
  --ts-line-strong: #85817a;  /* 3.46:1 on bg, 3.78:1 on surface: control boundaries only (WCAG 1.4.11) */
  --ts-rail-w: 272px; --ts-card-w: 404px; --ts-gutter: 32px; --ts-header-h: 112px; --ts-footer-h: 32px;
  --ts-dur: 200ms; --ts-dur-fast: 120ms; --ts-ease: cubic-bezier(.2, 0, 0, 1);
}
.ts-primary, .ts-secondary { min-height: 44px; display: inline-flex; align-items: center; }
.ts-secondary { padding: 0 4px; }
.ts-source { display: inline-block; padding-block: 4px; color: var(--ts-accent-text); }
```

All of these are starting values. `scripts/contrast.mjs` (9.16) is the judge, and any change goes in
`docs/decisions.md`. `--ts-line` stays for decorative hairlines; `--ts-line-strong` is the boundary of the search pill,
every input, the notes textarea's first rule, the switch's off track and the segmented control.

**Map colours in TypeScript.** `src/ui/mapTokens.ts` exports the `--ts-map-*`, `--ts-heat-*`, `--ts-surface`,
`--ts-ink` and `--ts-muted` values as hex strings, plus `rgba(hex, alpha)` for deck.gl. `src/ui/mapTokens.test.ts`
parses `src/ui/tokens.css` and asserts every exported value equals its custom property. `src/map/` contains no colour
literals.

### 9.2 Desktop layout (1440 × 900 and up; Mockup-1)

- **Header** (`--ts-header-h`, on `--ts-bg`):
  - **Left:** the wordmark "THERMOSTAT" (Inter 500, 15 px, letter-spacing .38em, ink). Under it, an amber 6 px dot
    and "HAMILTON / FIELD NOTES" (10 px caps, .16em, muted).
  - **Right:** the nav links Explore · Records · Method (`.ts-nav`, 9.17: 13 px, 44 px targets; the current one in ink
    and underlined, with `aria-current="page"`, the others muted), then the "Find a place" search pill (`.ts-search`,
    190 × 44 px, radius 999 px, `--ts-surface`, `--ts-line-strong` border).
- **Map:** the map region (`.ts-stage`, `position: relative`) fills the area between the header and the footer, edge
  to edge; the floating panels, controls, legend and demo caption are positioned inside it.
- **Floating panels** inside the map area, `--ts-gutter` (24 to 32 px) from its edges. Width and max-height sit on the
  panel itself (`.ts-panel--rail`, `.ts-panel--card`, 9.17), never on a wrapper such as the guide's
  `.facility-position`:
  - **left rail:** 272 px wide (260 at 1024 to 1279 px)
  - **right card:** 404 px wide (380 at 1024 to 1279 px), with a max-height that reserves 110 px at the bottom for
    the attribution (34), a 12 px gap, the 52 px control row and 12 px of clearance, so it never covers them
  - **legend card:** bottom left, right of the rail, `width: min(340px, 100% - rail - card - 4 gutters)`; under
    260 px it becomes the "Legend" button. Its last line is the map caption: "Hamilton, Ontario · records retrieved
    {date}" (serif 13 px, muted).
  - **bottom right:** the compact MapLibre attribution in the corner, and 12 px above it the map controls as ONE
    horizontal `.ts-controls` row, 52 px tall (9.17): zoom in, zoom out, "2D / 3D" and Reset view
- **Footer** (`<footer>`, a 32 px strip on `--ts-bg` below the map, 11 px, muted): left, "ThermoStat · McMaster P2P
  Hacks 2026 · {team credit from `src/content/credits.ts`}"; right, "Sources and method", linking to Method.
- **No interface text sits directly on the map canvas.** Captions, the footer and notices sit on a surface; map labels
  keep their 2 px surface halo (9.3).
- **One primary panel at a time** in the right card: facility, evidence record, recipient, or field notes. Each
  replaces the previous one; a visible back link returns to the record it came from. Panels never stack.
- **Focus when a panel is replaced.** After an action inside the card or popover (Open evidence record, Save a note,
  Read the source passage, the popover's Open recipient), focus moves to the new panel's h2 (`tabIndex={-1}`,
  `focus({ preventScroll: true })`). A selection made from the map, rail or search leaves focus where it is and is
  announced in the live region. The back link and Close return focus to the control that opened the panel (its DOM id
  is kept in the reducer as `returnFocusId`).
- **Camera padding:** every fly-to and fit-bounds uses `{ left: rail + 2 gutters, right: card + 2 gutters, top: 24,
  bottom: legend height + 24 }`, so the selection is never under a panel.

### 9.3 The map

**Camera.**

Fitting the whole frame would open near 16 m per pixel, where towers are a few pixels tall. So:

- **Start and Reset view:** `meta.defaultFacilityId` (the recovery plant) is selected, but the camera fits its
  proposed-connection targets and the recipients ranked 1 to 20, not the plant itself (the plant sits about 6 km east
  of downtown, which would open near zoom 13.5 with towers about 10 px tall). Same padding, pitch, bearing and
  `maxZoom` as a facility selection, applied with `jumpTo` (no animation on load); the plant's arcs rise in from the
  east. The frame bounds are used only for `maxBounds`.
- **Facility selected:** `fitBounds` over the facility and every endpoint of its drawn connections, with the 9.2
  padding, pitch 50° (45° to 55° allowed), bearing −17°, `maxZoom` 15.5. With no drawn connections, centre on the
  facility at zoom 15.5. If the bounds need a zoom below 13.5, centre on the facility at 13.5 instead; arcs may run
  off-screen.
- **Recipient selected:** `fitBounds` over the recipient and the source of its scenario arc, `maxZoom` 16, with the
  same 13.5 floor.
- `maxBounds` = the tile extract; `minZoom` 12, `maxZoom` 17 (tiles overzoom beyond 15).
- Controls bottom right (9.2): zoom in, zoom out, "2D / 3D" (animates the pitch to 0° or 50°) and "Reset view".
- Record the tuned numbers in `docs/decisions.md`.

**Layers, bottom to top:**

1. **Basemap** (3.5).
2. **"Study corridor (approx.)":** a faint 600 m band along the network. Off by default; it explains the eligibility
   rule.
3. **Context buildings:** a deck.gl `SolidPolygonLayer` with `extruded: true`.
   - height `heightM ?? 9`; fill `--ts-map-roof`; no outlines; not pickable
   - **Lighting:** one `LightingEffect` passed to the overlay (`new MapboxOverlay({ interleaved: true, effects:
     [lighting] })`): `new AmbientLight({ color: [255, 255, 255], intensity: 0.82 })` and `new DirectionalLight({
     color: [255, 255, 255], intensity: 0.2, direction: [0.21, 0.37, -0.91] })`, light from azimuth 210° about 65°
     above the horizon.
   - Every building layer uses `material: { ambient: 1, diffuse: 1, shininess: 0, specularColor: [0, 0, 0] }`;
     deck.gl's default material renders roofs at about half brightness and adds glints.
   - **Colour targets** (Mockup-1, `draw-mockups.py`): roofs `#e6e6de`, lit walls `#d0d0c9`, shaded walls `#bfc2bb`.
     Sample them from the fidelity sample shot (3.4) and tune only the two intensities until each is within ΔE2000 5.
4. **Recipients:** the same style and slightly warmer.
   - **Heat demand on:** filled by quantile class from `meta.rampBreaksMwh`, `--ts-heat-1..5`.
   - **Selected:** fill darkened 12 %, an outline (a `PathLayer` of the footprint ring at z = height + 0.5 m, 2 px,
     ink; `SolidPolygonLayer` has no stroke) and an amber endpoint marker.
   - Pickable.
5. **Customer and facility footprints:** neutral.
6. **Connections:** `makeHeatLayers` (below).
7. **Endpoints** (`ScatterplotLayer`, pixel radii; the dot shape carries meaning with the colour):
   - sources: `--ts-map-attention`, 6 px
   - operating and proposed customers (the targets of operational and proposed arcs): `--ts-map-secondary`, 4 px,
     filled
   - scenario endpoints (recipients to approach): hollow rings (a 1.5 px surface ring under a 1.5 px
     `--ts-map-secondary` ring)
   - every endpoint has a 1.5 px `--ts-surface` halo (`stroked: true`, `lineWidthUnits: 'pixels'`)
8. **Labels:** a deck.gl `TextLayer`, Inter 12 px, ink with a 2 px surface outline (`fontSettings: { sdf: true }`).
   Every facility's `mapLabel` (the full names collide downtown, where three facilities sit a few hundred metres
   apart); the selected recipient's name. `getTextAnchor: 'start'`, `getPixelOffset: [10, 0]`, and
   `CollisionFilterExtension` with `getCollisionPriority` 3 for the selected item and 2 for other facilities; the
   selected label is never filtered. [Verify] at milestone 4; fallback: below zoom 15, draw only the selected label.
   Create the layer only after `document.fonts.load('12px "Inter Variable"')` resolves.
9. **HTML overlays** (React, positioned with `map.project`):
   - the hover tooltip (pointer devices only): name plus one line, such as "Recipient · Strong fit" or "Facility · 3
     records"
   - the connection popover (9.12)

**Overlays are never hidden by buildings.** In interleaved mode deck layers share one depth buffer, so:

- Arcs, their casings, endpoints, the selected outline and the `TextLayer` use `parameters: { depthCompare: 'always',
  depthWriteEnabled: false }` (deck.gl 9).
- A recipient's endpoint, and the arc target that ends there, sit at z = (heightM ?? 9) + 2 m (positions become
  `[lon, lat, z]`); a facility's endpoint sits at its footprint height, or 0. Markers rest on roofs, never inside
  footprints.
- Draw order: buildings, arc casings, arcs, endpoints, labels.

**`makeHeatLayers` (keep the handoff's name and signature; extend the options):**

```ts
export function makeHeatLayers(connections: HeatConnection[], options: {
  visible: boolean;
  onSelect: (connectionId: string) => void;
  selectedConnectionId?: string | null; // added: drawn 3 px wide
}): Layer[]
```

- **Arc shape.** Sample each arc as a 3D path of 48 points: height `h × 4t(1 − t)`, with `h = clamp(0.45 × ground
  distance, 150 m, 1,500 m)` (a starting value), so arcs rise clearly above the roofs as in Mockup-1.
- **Drawing.** Draw the paths with a `PathLayer` plus `PathStyleExtension({ dash: true })`, so the kind is also a line
  pattern:

  | kind | pattern |
  |---|---|
  | operational | solid |
  | proposed | long dash `[6, 4]` |
  | scenario | dotted `[1, 3]` |

  - **Colour follows evidence:** operational and proposed arcs are `--ts-map-attention`; scenario arcs are
    `--ts-map-secondary`. The legend's line samples use the same colours and patterns.
  - Width 2 px, 3 px when selected (popover open).
  - The arc and casing `PathLayer`s both set `billboard: true`, `capRounded: true` and `jointRounded: true`; without
    `billboard` the ribbon lies flat, and seen side-on at 50° pitch the width and the dotted pattern collapse to
    about 1 px.
  - **Casing (mandatory):** a separate `PathLayer` drawn first, with the same 48-point path, solid (no dash),
    `getColor` = `--ts-surface`, `widthUnits: 'pixels'`, width = arc width + 3 (5 px, or 6 px when selected), and the
    same depth parameters. Without it the arc colours fall below 3:1 on walls.
  - **Width never encodes capacity.**
- **Fallback.** If the dash extension fails in interleaved mode, use the handoff's `ArcLayer` with the kind carried by
  the endpoint shape, the legend and the label, and record it.
- **Picking:** `pickingRadius: 6` on the overlay; an arc or an endpoint click calls `onSelect`.

**Selection policy** (from the handoff):

- **On load:** the facility in `meta.defaultFacilityId` (the recovery plant) is selected, so the first screen shows the
  proposed network and its record.
- **Facilities tab:** all of the selected facility's connections are drawn (operating, proposed and team scenarios:
  Mockup-1's amber-and-lilac fan). Other facilities show their endpoint dot and label only.
- **Recipients tab:** the 20 ranked recipients show as hollow lilac rings, and only the selected recipient's scenario
  arc is drawn.
- Changing the selection switches the card and the map highlight in the same frame.

**Legend card** (always visible on desktop; a "Legend" button below 1024 px):

- "● Source" (6 px, `--ts-map-attention`), "● Connected or proposed customer" (4 px filled, `--ts-map-secondary`)
  and "○ Recipient to approach" (hollow ring), drawn with the same shapes and colours as the map
- three line samples: "Operating (public record)", "Proposed (HCE study)", "Scenario (team estimate)"
- the line "Arcs join endpoints. They are not pipe routes."
- when Heat demand is on: a 5-step swatch strip with MWh-a-year breaks and "Estimated annual heat demand"
- when illustrative examples are on: "Illustrative items are labelled"
- **Markup** (`.ts-panel.ts-legend`, 9.17): one `<ul>` of the three endpoint items, one `<ul>` of the three line
  samples (inline SVG swatches, 24 × 12), then the note, the ramp when on, and the caption. Items flow inline and wrap,
  as Mockup-1's compact chip row; never one item per line.

### 9.4 Left rail (Mockup-1)

`.ts-panel.ts-panel--rail` (28 px padding; 9.17). From top to bottom:

1. **Kicker "THE LOCAL PICTURE"** (`.ts-kicker--plain`, 9.17).
   - Heading "Every promise has a place." (27 px / 500 / −.035em).
   - Body (`p.ts-intro`): "Follow what was promised for Hamilton's waste heat, who could use it, and the questions
     still open."
   - `.ts-meta`: "Hamilton, Ontario · records retrieved {date}". There is no separate "Your area" section (9.1,
     change 10).
2. **01 ON THE MAP:** a `<details class="ts-row">` whose summary holds the `.ts-label` and "{n} of 4 on"
   (`.ts-row-status`). It is open by default only when the viewport is at least 1,000 px tall. Inside: switches for
   Facilities, Heat connections (hides arcs **and** endpoints), Buildings, and Heat demand.
   - Each is a `<button role="switch" aria-checked>`; the whole 44 px row is the target.
   - On: ink track, surface knob on the right (Mockup-1). Off: surface track, `--ts-line-strong` border, muted knob on
     the left (`.ts-switch`, 9.17).
3. **02 PLACES TO INVESTIGATE**, with two text tabs, **Facilities** and **Recipients to approach** (a `tablist` on one
   line; if it is taller than 46 px at a desktop width, the visible label becomes "Recipients" with the accessible name
   "Recipients to approach", logged in `docs/decisions.md`). Below the tabs, `.ts-rail-places` is the rail's only scroll area; it holds the list, the Together block and the
   footnote, while the intro, the layer row and the tabs stay put.
   - Rows: a `<ul>` of `<button type="button" class="ts-place">`, `aria-current="true"` on the selected one, with a
     roving tabindex (Up/Down/Home/End move focus; Enter or Space selects). The selected row is kept in view with
     `scrollIntoView({ block: 'nearest' })`.
   - **Facilities:** a 6 px dot (accent when selected, else `--ts-line-strong`) | the name, with the kind word as the
     sub-line; illustrative items say "Illustrative".
   - **Recipients to approach:** rank (`01`, `.ts-number`) | the name, with "{band} fit" on a second line
     (`.ts-place-sub`; "· Illustrative" appended when synthetic). A "Together" block under the top 5 gives the
     totals from 2.5.
   - The selected fill is `--ts-bg`, never the PNG's `#f2eee7`: muted text measures 4.40:1 on `#f2eee7` (a fail) and
     4.54:1 on `--ts-bg`. The fill alone is 1.09:1 against the rail, so the selected row (and the combobox's active
     option) also gets a 1 px `--ts-line-strong` inset ring (3.46:1; Mockup-1 draws a hairline there too).
4. **Footnote** (11 px, muted), at the end of the scroll area: "Public records. Estimates are labelled. Arcs are not
   pipe routes."

### 9.5 Facility card (Mockup-1 right; adapted `FacilityPanel`)

- **Kicker:** "SITE 0n / PUBLIC RECORD" (or "/ ILLUSTRATIVE" when synthetic).
- **h2:** the name. **Meta:** "{kind word} · {address or locality}", plus "Position approximate" or "Position
  illustrative" when it is not `address` (for the untraced recovery plant, the 06_places line).
- **Structure** (shared with 9.6): `.ts-panel.ts-panel--card` holds `.ts-panel-body` (kicker, h2, meta, rows and the
  question), the only part that scrolls, and then `.ts-actions` as a fixed footer outside it, so the primary action is
  always visible (9.17).
- **Accordion rows** (native `<details>`, only the first open):
  - **Summary:** number (`01`), the topic title, and on the right the status word ("Proposed"), then +/−.
  - **Body:**
    - the team summary in `.ts-summary` (9.17): serif italic 17 px, never in quotation marks, so it never looks like
      an excerpt
    - "Evidence status: Proposed. {interpretation}"
    - the source line "{shortTitle}, page {label} · published {date}"; with no printed label, "{shortTitle}, PDF
      p. N · published {date}"
    - "Read the source passage ›" (`--ts-accent-text`), which opens `#/explore/f/<id>/evidence/<commitmentId>`
  - **No source:** "Source not available. This claim cannot currently be checked here."
- **Connections row** (always last): "Connections · {n} operating · {n} proposed · {n} team scenarios", leaving out
  zero counts; with none, "No connections on record." It expands to a list in which each item names the recipient
  and the connection kind in words; clicking one selects it on the map. This is the text route to every connection.
- **"A QUESTION WORTH ASKING":** the first open question, as `p.ts-question` (serif italic, 17 px) under its
  `.ts-label`.
- **Actions:**
  - primary "Open evidence record ›" (a dark pill)
  - secondary "Save a note +"

### 9.6 Recipient card

- **Kicker:** "RECIPIENT {rank} / SCENARIO" ("CANDIDATE" when unranked; "ILLUSTRATIVE" when synthetic).
- **h2:** the name, or "Unnamed building". **Meta:** "{type word} · {address}" and the data-quality word.
- **Accordion rows.** Each summary shows a short status on its right (`.ts-row-status`): "{band word} fit", "About the
  same" / "Costs more" / "Cheaper", "about {co2Cut} % less CO2", and the data-quality word.
  1. **Why it fits** (open): "Strong fit", with "score 82 of 100" small and muted beside it; the 1 to 3 reasons; the
     missing line; distances to the existing network ("known customer") and the planned route (its
     `plannedQuality` word).
  2. **Cost over 20 years:**
     - The body opens with the verdict sentence.
     - A `.ts-table` follows: Option · 20-year cost · Per MWh · Upfront, with the rows "Keep gas", "Own heat pump"
       and "Connect to HCE" with `<small>assumed rate: gas parity</small>` as its second line (so "assumed" stays on
       the row without a 4-line label). Figures are tabular and right-aligned.
     - A `.ts-segment` radio group: "Carbon price: None today · $85 per tonne".
     - A link: "How this is calculated" → Method#costs.
     - No bars here.
  3. **Carbon and grid:** a second `.ts-table` of t CO2 a year for each option, naming the factor set and year; added
     grid kW at the building; the `heatPumpCaveat` line when set.
  4. **Heat demand and sources:** annual MWh, building peak kW, network kW, the quality word and method sentence, and
     the sources list with dates.
- **Tables follow the panel width, not the viewport.** A row body that holds a table has no 32 px indent. Both tables
  use `.ts-table--stack` (9.17), which stacks when the panel body is under 340 px wide (the 380 and 360 px cards and
  the sheet): one block per option, its name on its own line and three label/value pairs beneath. They keep explicit
  `role="table"`, `row`, `cell` and `columnheader`, because changing `display` drops table semantics in Safari. At
  320 px no element is wider than the sheet's content box.
- **"A QUESTION WORTH ASKING"** (`p.ts-question`), chosen by rule:
  - `boilerYearsLeft` null → "When is this building's boiler due for replacement?"
  - else heating unknown → "Does this building heat with hot water?"
  - else → "Would the owner share 12 months of gas bills with HCE for an exact comparison?"
- **Actions:** primary "Get the recipient brief" (11); secondary "Save a note +".
- When assumptions differ from the sourced defaults, a one-line `.ts-notice` reads "Using your assumptions · Reset".

### 9.7 Evidence record (Mockup-2 left)

The evidence record replaces the facility card.

- **Header:** a back link "‹ {facility name}", the kicker "THE EVIDENCE RECORD" and the h2 "A promise, in its own
  words." (or "No promise on record yet." when every commitment is unknown).
- **Each commitment with a source:**
  - the micro-label "0n  {STATUS WORD} / {DOCUMENT SHORT TITLE}"
  - the excerpt in serif italic 22 px, in curly quotation marks
  - the interpretation line (muted)
  - the meta line: "Original document ↗ · Page 12 · Published 12 Jun 2026 · Retrieved 31 Oct 2026" ("PDF p. 12"
    alone when there is no printed label). The link opens in a new tab with `rel="noopener noreferrer"`, only if
    `safeHttpsUrl` passes.
  - the human-check line
- **Each commitment without a source:**
  - the micro-label "0n  {TOPIC} / NO PUBLIC RECORD"
  - the serif line "Source not available."
  - "Missing evidence is not non-compliance. It means this question is still open."
- **"YOUR NEXT QUESTION":** the commitment's question, as `p.ts-question`.

### 9.8 Field notes panel (Mockup-2 right)

The panel replaces the card. Its behaviour is in section 10.

- **Header:** `<h2 class="ts-kicker ts-kicker--plain">Your field notes</h2>` (it labels the panel, 14) and a close
  button (aria-label "Close field notes") that returns to the record it came from.
- **FIND A PLACE** (`.ts-label`): the combobox (9.11) drawn as `.ts-search-line` (Mockup-2's large underlined field,
  not the header pill), placeholder "Search sites or neighbourhoods…". Its listbox is rendered in flow under the field
  and pushes the shortlist down; it is never absolutely positioned inside the scrolling panel, which would clip it.
  Choosing a result switches the notes subject, after resolving any unsaved text.
- **YOUR SHORTLIST:**
  - the saved places, each with a remove button
  - "Add {place} to your shortlist"
  - the "Together" totals for shortlisted recipients
  - when empty: the serif line "Your investigation starts here." and "Saved places are leads, not conclusions."
- **YOUR NOTES — {place}:** a serif italic textarea on ruled lines, with the placeholder "What changed? What remains
  unanswered?" (`.ts-notes`, 9.17). The rule under its first line is `--ts-line-strong` (the input boundary); the
  rules below stay `--ts-line` and are decorative.
- **Status line** (`role="status"`), then the note "Notes stay in this browser. They are not evidence and are never
  published."

### 9.9 Records view (`#/records`)

A readable page: `<main class="ts-page">` (a centred 1040 px column on `--ts-bg`), an `h2.ts-page-title` with a
`.ts-page-lede` (scaled from Mockup-2's "A quieter way to investigate."), then three sections as
`.ts-panel.ts-panel--flow` with h3 headings (9.17; no cards inside cards), rows separated by hairlines:

1. **Facilities:**
   - each facility as `<details>`, with every commitment, excerpt, page and dates
   - a status filter: All · Proposed · Required · Reported · Verified · Unknown (a `.ts-segment` radiogroup)
2. **Recipients to approach:**
   - a `<table>`: rank, name, type, fit word, annual MWh, distance, quality
   - sorted by a `.ts-segment` radiogroup "Sort by: Fit · Heat · Distance" above the table, at every width; the sorted
     column's header carries `aria-sort` and the arrowUp or arrowDown icon (9.17)
   - the Together totals
3. **Connections:** a `<table>`: from, to, kind word, phase, evidence link.

Both tables are `.ts-table.ts-table--stack` with `data-label` on every cell, and text cells carry `data-type="text"`
(left-aligned). Below 768 px they stack with the card-table rules (9.17), repeated inside `@media (max-width:767.98px)`
for `.ts-page`, so 320 and 375 px never scroll sideways.

Every row has "Show on map", which goes to `#/explore/f/<id>`, `#/explore/r/<id>` or `#/explore/c/<id>`. This view is
also the fallback when WebGL is missing.

### 9.10 Method view (`#/method`)

The same page structure as Records. Sections, each with an anchor:

1. **How to read ThermoStat:** status words and their meanings, connection kinds, data-quality words, and "Arcs are not
   pipe routes".
2. **Sources and licences:** a table of every source with publisher, licence, retrieval date and URL, plus the
   attribution list (4).
3. **Evidence:** how excerpts are found and checked; the counts found, unknown and checked from `meta.evidence`.
4. **Heat demand:** the formulas in 6.2; the calibration table (type, n, median, used or not).
5. **Fit:** the factor table in 8.3 and the bands.
6. **Costs:** the gas-parity rule and the formulas in 8.2, written out.
   - **An assumptions form:** gas price, electricity price, carbon price, heat-pump COP, HCE rate ±10 %, discount
     rate, connection fee. Each assumption is a `.ts-field` (9.17): the label, a `.ts-input` with its unit, then a
     meta line "Source: {shortTitle}, {date}", ending in "Verify" when `verify` is true. The HCE-rate slider
     (`.ts-range`) shows its value in an `<output>` ("+0 %").
   - "Reset to sourced defaults" (`.ts-secondary`).
   - Changes apply everywhere at once and persist in localStorage (try/catch) as a viewer convenience.
7. **Emission factors:** the active set; the Climatiq data version, or "Climatiq not used in this build:
   {climatiqReason}"; "Fallback emission factors" only when `factors.json` failed (13); and the grid table.
8. **Data quality:** counts by quality, synthetic items, invalid items skipped, and the OSM base date.
9. **Settings:** "Show illustrative examples", "Single-key shortcuts" (on by default; 9.12) and "Clear my notes on
   this device" (with a confirmation dialog).
10. **About this project:** the disclaimer (11.3) and the team credit.

### 9.11 Search ("Find a place")

- An ARIA 1.2 combobox over facilities, recipients (name and address) and neighbourhoods (`places.json`), grouped
  under headings; `/` focuses it.
- **Results:** Enter selects and flies there; neighbourhoods fly there without selecting anything.
- **No results:** 'Nothing in these records matches "{q}".' and three suggestions (facility names).
- Fully offline; there is no external geocoder at runtime.

### 9.12 Interactions (the handoff's table, completed)

| User action | Behaviour |
|---|---|
| Select a facility (list, map, search) | Replace the card, highlight the marker, fly with safe padding (one camera move), announce "Selected {name}, {n} records" in the live region |
| Expand an evidence row | Show the summary, status, source line and link |
| Open a source | Open the original HTTPS document in a new tab; other schemes are never rendered as links |
| Toggle Heat connections | Hide arcs **and** endpoint dots |
| Click a connection | A non-modal popover at the endpoint: recipient name, "{kind word}", the phase if any, "Not a pipe route", and "Open recipient" if it has a `recipientId` |
| Open notes | Replace the card; never stack panels |
| Save a note | Unsaved → Saving → Saved, or Failed with Retry (10) |
| Change the subject with unsaved notes | Flush the save; if it fails, a dialog offers "Keep editing" (default), "Retry" or "Discard" |
| Esc | Close only the innermost open thing: the listbox, then the popover, then the dialog or drawer, then an expanded sheet (back to peek), then clear the selection. Never clears the selection while focus is in a text field. |
| `/` · J/K · ? | Focus search · next/previous recipient to approach (the map follows) · a shortcuts dialog |
| D | Start the demo (12) |

**Single-key shortcuts** (`/`, J, K, ?, D, and Space, ← → and R in the demo) are ignored while focus is in an input,
textarea, select, contenteditable element or the combobox; arrows and Space are also ignored while the map canvas or
a button has focus. Method → Settings → "Single-key shortcuts" turns them all off (WCAG 2.1.4), stored in
localStorage inside try/catch. A Testing Library test types "jkd/" into the notes textarea and asserts that no
selection changes and no demo starts.

**Routes** (hash, deep-linkable, back and forward work). Every id segment is written with `encodeURIComponent` and read
with `decodeURIComponent` (`#/explore/r/osm%3Away%2F123`). `#/method#costs` parses as the view `method` plus the anchor
`costs`. `state/route.test.ts` round-trips `osm:way/123`, `osm:relation/45`, `demo:7`, `#/method#costs` and an unknown
id.

| Route | Opens |
|---|---|
| `#/explore` | the map with the default facility |
| `#/explore/f/<id>` | a facility |
| `#/explore/f/<id>/evidence` | its evidence record |
| `#/explore/f/<id>/evidence/<commitmentId>` | the evidence record, scrolled to and focused on that commitment |
| `#/explore/r/<id>` | a recipient |
| `#/explore/c/<id>` | a connection |
| `#/notes/<kind>/<id>` | field notes |
| `#/records`, `#/method`, `#/method#costs` | the views |
| `#/brief/<id>` | a Recipient brief |
| `#demo`, `?demo=1` | demo mode |

An unknown id falls back to `#/explore` with the message "That record isn't in this version."

### 9.13 Responsive rules

| Width | Layout |
|---|---|
| ≥ 1280 px | rail 272, card 404, gutters 32 |
| 1024 to 1279 px | rail 260, card 380, gutters 24 |
| 640 to 1023 px | The rail collapses into a **"Places" button** (a pill, top left of the map). It opens a left drawer (320 px, `dialog.ts-drawer`), which is a modal dialog: focus trapped, Esc closes it, focus returns to the button. The card is 360 px on the right. The legend becomes a "Legend" pill, top right of the free map area (left of the card); both pills sit `--ts-gutter` from the top. The header keeps the wordmark and nav (`.ts-nav` gap 20 px), and the search pill becomes a 44 × 44 search icon button (aria-label "Find a place") that opens the full-width search row used under 640 px, because the desktop header needs about 690 px. |
| < 640 px | The header is 56 px plus `env(safe-area-inset-top)` (the viewport meta has `viewport-fit=cover`): the wordmark, a search icon (full-width search) and a menu button (Explore / Records / Method). **One bottom sheet** holds whichever panel is active, or the Places list (tabs, list, switches, Together). On load it shows the default facility at peek. Its header row holds, left to right: a "Places" button that shows the Places list; the 36 × 4 px grabber, centred in a 44 × 44 button with `aria-expanded` that toggles peek and expanded (dragging is optional); and Close, which clears the selection and shows Places. The sheet (`.ts-sheet`, 9.17) is anchored to the bottom edge, full width, with a 24 px top radius and safe-area padding. Two heights: peek (160 px plus the bottom safe-area inset: kicker, name, status line) and expanded (up to 62 dvh). The panel inside is flattened (no second border, shadow, radius or padding: never a card in a card), and while expanded its actions stay pinned to the bottom of the sheet. The camera's bottom padding is the sheet height + 12, so the selection stays visible above it. A 44 px "Legend" pill sits top right of the map and opens the legend as a non-modal `.ts-pop`. The map controls and the attribution sit 12 px above the sheet's top edge. The sheet is non-modal, so the map stays usable. |

**Short viewports.** A projector at "1080p" usually runs at 150 % or 125 % scaling, so 1280 × 720 or 1536 × 864 CSS
px. At 640 px wide or more and 560 to 820 px tall, the 9.17 rule applies: a 72 px header with the wordmark and
"HAMILTON / FIELD NOTES" on one line, 20 px gutters, 22 px panel padding and 24 px h2.

**Short or zoomed viewports.** The sheet layout (the < 640 px row) also applies whenever the viewport is under 560 px
tall, at any width: a 1280 × 720 projector at 200 % zoom is 640 × 360 CSS px, and a landscape phone about 844 × 390,
where the card would get under 120 px of height. One function decides, re-read on resize: `layoutFor(w, h) => w <
640 || h < 560 ? 'sheet' : w < 1024 ? 'tablet' : 'desktop'` (`src/state/layout.ts`). Every 9.17 rule for the sheet
layout uses `@media (max-width:639.98px), (max-height:559.98px)`, and peek is `min(160px, 40dvh)` plus the bottom
safe-area inset.

At every width there is no horizontal page scroll (check 320, 375, 640 × 360, 700, 768, 844 × 390, 1024, 1280 × 720,
1440 and 1536 × 864). Buttons,
switches, tabs, list rows, summaries, map controls and the grabber are at least 44 × 44 px. Inline text links inside a
sentence or a meta line are at least 24 px tall (`display: inline-block; padding-block: 4px`), per WCAG 2.5.8.

### 9.14 Motion

- **Panels:** enter over 180 to 220 ms (`--ts-dur`) with opacity and a 6 px translation. Swapping panels cross-fades
  over 180 ms. Accordions open instantly (native `details`).
- **Camera:** one `flyTo` per action, about 900 ms.
- **Hover:** colour only, 120 ms.
- **Never:** continuous arc animation, counters, bouncing, or parallax.
- **`prefers-reduced-motion`:** every transition is 0 ms and `flyTo` becomes `jumpTo`.

### 9.15 Copy rules

- sentence case
- status, kind and fit always in words
- "assumed" before any HCE rate
- "about" before rounded figures in prose
- dates written as "31 Oct 2026"
- no exclamation marks or marketing superlatives
- serif (italic) only for: verbatim excerpts, always in curly quotation marks (`.ts-quote`); the team summary
  (`.ts-summary`, never quoted and never styled like an excerpt); questions; empty states; the notes textarea; and the
  legend's caption line
- at most one dark primary button per panel
- strings live in `src/content/copy.ts` so the team can edit them in one place

### 9.16 Contrast script (`scripts/contrast.mjs`)

The script reads the custom properties from `src/ui/tokens.css` and the pairs declared in
`scripts/contrast-pairs.json` (`fg`, `bg`, `kind`: `text`, `large-text` or `non-text`). For each pair it prints the
WCAG 2.x ratio, and it **exits 1** on any failure:

- text below 4.5:1
- large text or non-text below 3:1
- `--ts-map-attention` or `--ts-map-secondary` below 3:1 against `--ts-map-ground`, `--ts-map-roof`,
  `--ts-map-water` or `--ts-surface` (the arc casing; on walls the arcs measure only 2.3 to 2.7:1, which is why the
  casing is mandatory)
- the heat ramp failing either of these:
  - relative luminance must fall monotonically from stop 1 to stop 5
  - adjacent stops must differ by ΔE2000 ≥ 8 under normal vision and under simulated protanopia, deuteranopia and
    tritanopia (Machado 2009, severity 1.0)
  - `--ts-heat-1` must differ from `--ts-map-roof` by ΔE2000 ≥ 5 under the same four visions, so the lowest class
    never reads as an ordinary roof
- any CSS rule in `src/` that uses `var(--ts-accent)` as a text `color` (amber text must use `--ts-accent-text`)

**Simulation method** (in `scripts/lib/color.mjs`). Apply the matrix to linear sRGB, clamp to 0..1, then convert to CIE
Lab (D65) for ΔE2000. Machado 2009, severity 1.0:

- protanopia `[[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]`
- deuteranopia `[[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]`
- tritanopia `[[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]`

`contrast-pairs.json` also declares `--ts-line-strong` against `--ts-bg` and `--ts-surface` as non-text (the selected
row's ring), muted on `--ts-bg` as text (the selected rail row), and `--ts-ink` on the shaded wall `#bfc2bb` as
non-text (the map focus ring).

Starting measurements, for orientation only (the script's output is the evidence):

| Pair | Ratio |
|---|---|
| ink on surface | 14.2 |
| muted on surface | 5.0 |
| muted on bg | 4.5 |
| accent-text on surface | 5.4 |
| accent on surface | 3.5 |
| map-attention on ground | 3.7 |
| map-secondary on ground | 3.6 |
| map-attention / map-secondary on surface (casing) | 4.09 / 3.97 |

The ramp's luminance runs 0.63 → 0.45 → 0.30 → 0.19 → 0.12; its smallest adjacent ΔE2000 is 8.6 (deuteranopia), and
heat-1 sits 10.8 to 12.4 from the roof. If
a pair fails, adjust only that token, keeping its hue, and record the change; never relax a threshold.

### 9.17 Component recipes

The handoff styles panels, kickers, rows, buttons and notes only. Every other surface uses these recipes, pasted into
`src/ui/tokens.css` after the token additions, so nothing looks bolted on (no native radios, default table borders,
browser-styled ranges or large KPI numerals):

```css
/* panels and pages: width and max-height on the panel itself, never on a wrapper */
.ts-panel--rail{width:var(--ts-rail-w);max-height:calc(100dvh - var(--ts-header-h) - var(--ts-footer-h) - 2*var(--ts-gutter));display:flex;flex-direction:column;overflow:hidden}
.ts-rail-places{flex:1 1 auto;min-height:120px;overflow:auto;overscroll-behavior:contain;margin-inline:-28px;padding:8px 28px}
.ts-panel--card{width:var(--ts-card-w);max-height:calc(100dvh - var(--ts-header-h) - var(--ts-footer-h) - var(--ts-gutter) - 110px);display:flex;flex-direction:column;overflow:hidden;padding:0}
.ts-panel--card>.ts-panel-body{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;padding:28px 28px 8px}
.ts-panel--card>.ts-actions{flex:none;margin:0;padding:18px 28px 24px;background:var(--ts-surface)}
@media (max-width:1279.98px){:root{--ts-rail-w:260px;--ts-card-w:380px;--ts-gutter:24px}}
@media (max-width:1023.98px){:root{--ts-card-w:360px}}
.ts-panel--flow{width:100%;max-height:none;overflow:visible;animation:none}
.ts-panel--flow h3{font-size:22px;font-weight:500;letter-spacing:-.02em;margin:0 0 12px}
.ts-page{max-width:1040px;margin:0 auto;padding:48px 32px 64px;display:grid;gap:32px}
.ts-page-title{font-size:40px;font-weight:500;letter-spacing:-.035em;line-height:1.1;margin:0}
.ts-page-lede{font-size:17px;color:var(--ts-muted);margin:12px 0 0;max-width:60ch}
@media (max-width:639.98px){.ts-page{padding:24px 16px 48px}.ts-page-title{font-size:30px}}
.ts-controls{display:flex;padding:4px;background:var(--ts-surface);border:1px solid var(--ts-line);border-radius:999px;box-shadow:var(--ts-shadow)}
.ts-controls button{min-width:44px;height:44px;padding:0 10px;border:0;border-radius:999px;background:none;color:var(--ts-ink);display:grid;place-items:center;font:inherit;font-size:12px;cursor:pointer}
.ts-controls button:hover{background:var(--ts-bg)}
/* demo caption (12): centred in the free band between rail and card; at the top of the map in the sheet layout */
.ts-panel.ts-caption{position:absolute;z-index:3;bottom:var(--ts-gutter);left:calc(var(--ts-rail-w) + 2*var(--ts-gutter));right:calc(var(--ts-card-w) + 2*var(--ts-gutter));width:auto;max-width:560px;max-height:none;margin-inline:auto}
.ts-caption-text{font-size:16px;line-height:1.5;margin:6px 0 12px}
@media (max-width:1023.98px){.ts-panel.ts-caption{left:var(--ts-gutter)}}
@media (max-width:639.98px),(max-height:559.98px){.ts-panel.ts-caption{top:8px;bottom:auto;left:8px;right:8px;max-width:none;padding:14px 16px;border-radius:18px}}
/* legend (9.3): Mockup-1's compact chip, items inline */
.ts-panel.ts-legend{max-height:none;padding:16px 22px 14px;border-radius:22px;font-size:11px;line-height:1.4}
.ts-legend ul{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0;padding:0;list-style:none}
.ts-legend ul+ul{margin-top:8px;padding-top:8px;border-top:1px solid var(--ts-line)}
.ts-legend li{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
.ts-legend svg{flex:none;forced-color-adjust:none}
.ts-legend-caption{margin:6px 0 0;font:italic 13px/1.4 var(--ts-serif);color:var(--ts-muted)}
/* panel text: the handoff .ts-panel sets no size, so lists and loose text would fall back to 16 px */
:where(.ts-panel){font-size:13px;line-height:1.6}
.ts-intro{font-size:13px;line-height:1.75;color:var(--ts-muted);max-width:34ch;margin:0 0 16px}
.ts-back{display:inline-flex;align-items:center;gap:6px;min-height:44px;margin:-12px 0 8px;padding:0;border:0;background:none;font:inherit;font-size:12px;color:var(--ts-muted);cursor:pointer}
.ts-back:hover{color:var(--ts-ink)}
.ts-icon-btn{display:grid;place-items:center;flex:none;width:44px;height:44px;padding:0;border:0;border-radius:999px;background:none;color:var(--ts-ink);cursor:pointer}
.ts-icon-btn:hover{background:var(--ts-bg)}
/* rows, tables, segments, tabs, switches, totals, popovers, dialogs, inputs */
/* the handoff's .ts-row-body p is (0,1,1), so a row-body override needs two classes */
.ts-summary,.ts-row-body .ts-summary{font-family:var(--ts-serif);font-style:italic;font-size:17px;line-height:1.45;margin:4px 0 14px}
.ts-row-body .ts-meta{font-size:12px;line-height:1.6}
.ts-row-body .ts-status{font-size:11px}
.ts-question{font:italic 17px/1.45 var(--ts-serif);margin:0 0 8px;color:var(--ts-ink)}
.ts-row-status{margin-left:auto;font-size:12px;color:var(--ts-muted);white-space:nowrap}
.ts-row summary:has(.ts-row-status)::after{margin-left:16px}
.ts-row summary::after{content:'+' / ''}
.ts-row[open] summary::after{content:'\2212' / ''}
.ts-table{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums;margin:4px 0 16px}
.ts-table th{font-weight:400;color:var(--ts-muted);text-align:right;padding:8px 0 8px 12px;border-bottom:1px solid var(--ts-line)}
.ts-table td{text-align:right;padding:10px 0 10px 12px;border-bottom:1px solid var(--ts-line);vertical-align:top}
.ts-table :is(th,td):first-child{text-align:left;padding-left:0}
.ts-table tr[data-option=hce] td:first-child{font-weight:500}
.ts-table :is(th,td) small{display:block;font-size:11px;font-weight:400;color:var(--ts-muted)}
.ts-table [data-type=text]{text-align:left}
.ts-panel-body,.ts-sheet{container-type:inline-size}
.ts-row-body:has(>.ts-table){padding-left:0}
/* card tables stack by panel width; the Records tables repeat these rules in @media (max-width:767.98px) (9.9) */
@container (max-width:339.98px){
  .ts-table--stack thead{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
  .ts-table--stack tr{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 12px;padding:12px 0;border-bottom:1px solid var(--ts-line)}
  .ts-table--stack td{border:0;padding:0;text-align:left}
  .ts-table--stack td:first-child{grid-column:1/-1;font-weight:500}
  .ts-table--stack td[data-label]::before{content:attr(data-label) / '';display:block;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--ts-muted)}
}
.ts-segment{display:inline-flex;flex-wrap:wrap;gap:2px;padding:3px;border:1px solid var(--ts-line-strong);border-radius:999px}
.ts-segment label{position:relative;min-height:44px;display:inline-flex;align-items:center;padding:0 16px;border-radius:999px;font-size:12px;color:var(--ts-muted);cursor:pointer}
.ts-segment input{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer}
.ts-segment label:has(input:checked){background:var(--ts-bg);color:var(--ts-ink);box-shadow:inset 0 0 0 1px var(--ts-ink)}
.ts-segment label:has(input:focus-visible){outline:2px solid var(--ts-accent);outline-offset:3px}
.ts-tabs{display:flex;flex-wrap:nowrap;gap:0 14px;border-bottom:1px solid var(--ts-line);margin:0 0 8px}
.ts-tab{min-height:44px;padding:0;border:0;background:none;font:inherit;font-size:12px;white-space:nowrap;color:var(--ts-muted);cursor:pointer}
.ts-tab[aria-selected=true]{color:var(--ts-ink);box-shadow:inset 0 -2px 0 var(--ts-ink)}
.ts-switch{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:44px;padding:0;border:0;background:none;font:inherit;font-size:13px;color:var(--ts-ink);text-align:left;cursor:pointer}
.ts-switch .track{position:relative;flex:none;width:34px;height:20px;border-radius:999px;border:1px solid var(--ts-line-strong);background:var(--ts-surface)}
.ts-switch .knob{position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;background:var(--ts-muted);transition:transform var(--ts-dur-fast) var(--ts-ease)}
.ts-switch[aria-checked=true] .track{background:var(--ts-ink);border-color:var(--ts-ink)}
.ts-switch[aria-checked=true] .knob{transform:translateX(14px);background:var(--ts-surface)}
.ts-totals{margin:16px 0 0;padding-top:12px;border-top:1px solid var(--ts-line);font-size:12px;line-height:1.6;font-variant-numeric:tabular-nums}
.ts-totals dl{display:grid;grid-template-columns:1fr auto;gap:6px 12px;margin:8px 0}
.ts-totals dt{color:var(--ts-muted)}
.ts-totals dd{margin:0;text-align:right}
.ts-notice{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12px;background:var(--ts-bg);border-radius:12px;padding:10px 14px;margin:0 0 16px}
.ts-pop{background:var(--ts-surface);border:1px solid var(--ts-line);border-radius:16px;box-shadow:var(--ts-shadow);padding:14px 16px;font-size:12px;line-height:1.5;max-width:280px}
.ts-pop[role=listbox]{min-width:260px;max-width:min(360px,calc(100vw - 32px));max-height:min(320px,50dvh);overflow:auto;padding:6px}
.ts-option-group{padding:10px 10px 4px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--ts-muted)}
[role=option]{display:grid;gap:2px;min-height:44px;padding:8px 10px;border-radius:10px;font-size:13px;cursor:pointer}
[role=option] small{font-size:11px;color:var(--ts-muted)}
[role=option][aria-selected=true]{background:var(--ts-bg);box-shadow:inset 0 0 0 1px var(--ts-line-strong)}
.ts-search-line~[role=listbox]{position:static;width:100%;max-width:none;margin:8px 0 0;box-shadow:none}
dialog.ts-dialog{border:1px solid var(--ts-line);border-radius:var(--ts-radius);padding:28px;background:var(--ts-surface);color:var(--ts-ink);box-shadow:var(--ts-shadow);width:min(440px,calc(100vw - 32px))}
dialog.ts-drawer{position:fixed;inset:0 auto 0 0;margin:0;width:min(320px,calc(100vw - 48px));height:100dvh;max-height:none;box-sizing:border-box;padding:28px;border:0;border-radius:0 var(--ts-radius) var(--ts-radius) 0;background:var(--ts-surface);color:var(--ts-ink);box-shadow:var(--ts-shadow);overflow:auto}
dialog.ts-drawer .ts-panel--rail{width:auto;max-height:none;padding:0;border:0;box-shadow:none;background:none;animation:none}
:is(dialog.ts-dialog,dialog.ts-drawer)::backdrop{background:rgb(41 41 37 / .24)}
.ts-input{min-height:44px;border:1px solid var(--ts-line-strong);border-radius:12px;background:var(--ts-surface);color:var(--ts-ink);font:inherit;font-size:14px;padding:0 14px;font-variant-numeric:tabular-nums}
.ts-range{-webkit-appearance:none;appearance:none;width:100%;height:44px;background:transparent;cursor:pointer}
.ts-range::-webkit-slider-runnable-track{height:2px;background:var(--ts-line-strong);border-radius:2px}
.ts-range::-moz-range-track{height:2px;background:var(--ts-line-strong);border-radius:2px}
.ts-range::-webkit-slider-thumb{-webkit-appearance:none;box-sizing:border-box;width:20px;height:20px;margin-top:-9px;border-radius:50%;background:var(--ts-surface);border:1.5px solid var(--ts-ink);box-shadow:0 1px 3px rgb(68 56 39 / .18)}
.ts-range::-moz-range-thumb{box-sizing:border-box;width:20px;height:20px;border-radius:50%;background:var(--ts-surface);border:1.5px solid var(--ts-ink)}
.ts-range:focus-visible{outline:none}
.ts-range:focus-visible::-webkit-slider-thumb{outline:2px solid var(--ts-accent);outline-offset:3px}
.ts-range:focus-visible::-moz-range-thumb{outline:2px solid var(--ts-accent);outline-offset:3px}
.ts-field{display:grid;grid-template-columns:1fr minmax(120px,168px);gap:4px 16px;align-items:center;padding:14px 0;border-top:1px solid var(--ts-line)}
.ts-field>label{font-size:13px}
.ts-field .ts-unit{font-size:12px;color:var(--ts-muted);margin-left:8px}
.ts-field .ts-field-meta{grid-column:1/-1;font-size:11px;color:var(--ts-muted)}
.ts-field output{font-size:13px;font-variant-numeric:tabular-nums;text-align:right}
.ts-skeleton{height:12px;border-radius:6px;background:var(--ts-bg);margin:14px 0}
:where(a,button,input,select,textarea,summary,[tabindex]):focus-visible{outline:2px solid var(--ts-accent);outline-offset:5px}
/* map focus: amber measures 2.0 to 2.3:1 on walls, so the map region draws an ink ring with surface separators */
.maplibregl-canvas:focus-visible{outline:none}
.ts-stage:has(.maplibregl-canvas:focus-visible)::after{content:'';position:absolute;inset:6px;z-index:1;border:2px solid var(--ts-ink);border-radius:14px;box-shadow:0 0 0 2px var(--ts-surface),inset 0 0 0 2px var(--ts-surface);pointer-events:none}
.ts-controls button:focus-visible{outline-offset:2px}
@media (max-width:639.98px),(max-height:559.98px){
  :root{--ts-header-h:calc(56px + env(safe-area-inset-top))}
  .ts-input,.ts-search input{font-size:16px}
  .ts-row-body{padding-left:0}
}
/* kickers and labels */
.ts-kicker--plain::before{content:none}
.ts-label{display:block;font-size:10px;line-height:1.5;letter-spacing:.16em;text-transform:uppercase;color:var(--ts-muted);margin:0 0 12px}
.ts-label .ts-number{margin-right:12px;letter-spacing:0}
.ts-row summary .ts-label{margin:0}
.ts-panel h2.ts-kicker{font-size:10px;font-weight:400;letter-spacing:.16em;line-height:1.5;margin:0 0 20px}
/* rail rows and nav */
.ts-place{display:grid;grid-template-columns:24px 1fr;column-gap:12px;align-items:baseline;width:calc(100% + 24px);min-height:44px;margin-inline:-12px;padding:10px 12px;border:0;border-radius:12px;background:none;font:inherit;font-size:13px;line-height:1.35;color:var(--ts-ink);text-align:left;cursor:pointer;transition:background-color var(--ts-dur-fast) var(--ts-ease)}
.ts-place-sub{grid-column:2;font-size:12px;color:var(--ts-muted);white-space:nowrap}
.ts-place:hover{background:var(--ts-bg)}
.ts-place[aria-current=true]{background:var(--ts-bg);box-shadow:inset 0 0 0 1px var(--ts-line-strong)}
.ts-nav{display:flex;gap:28px}
.ts-nav a{display:inline-flex;align-items:center;min-height:44px;padding-inline:4px;font-size:13px;color:var(--ts-muted);text-decoration:none;transition:color var(--ts-dur-fast) var(--ts-ease)}
.ts-nav a:hover{color:var(--ts-ink)}
.ts-nav a[aria-current=page]{color:var(--ts-ink);text-decoration:underline 1px var(--ts-ink);text-underline-offset:8px}
/* field notes (Mockup-2) */
.ts-search-line{display:block;width:100%;min-height:56px;padding:8px 0;border:0;border-bottom:1px solid var(--ts-line-strong);background:transparent;color:var(--ts-ink);font:400 clamp(17px,6.2cqi,22px)/1.3 var(--ts-sans);letter-spacing:-.01em}
:is(.ts-search-line,.ts-notes,.ts-input)::placeholder{color:var(--ts-muted);opacity:1}
.ts-notes{--rule:40px;border:0;padding:0;line-height:var(--rule);min-height:calc(var(--rule)*4);background:linear-gradient(var(--ts-line-strong),var(--ts-line-strong)) 0 calc(var(--rule) - 1px)/100% 1px no-repeat local,repeating-linear-gradient(to bottom,transparent 0 calc(var(--rule) - 1px),var(--ts-line) calc(var(--rule) - 1px) var(--rule)) local}
/* bottom sheet (under 640 px wide or 560 px tall) */
.ts-sheet{position:fixed;z-index:4;inset:auto 0 0 0;max-height:62dvh;overflow-x:hidden;overflow-y:auto;padding:0 22px max(22px,env(safe-area-inset-bottom));background:var(--ts-surface);border:1px solid var(--ts-line);border-bottom:0;border-radius:24px 24px 0 0;box-shadow:var(--ts-shadow)}
.ts-sheet[data-state=peek]{height:calc(min(160px,40dvh) + env(safe-area-inset-bottom));overflow:hidden}
.ts-sheet[data-state=peek] .ts-kicker{margin-bottom:8px}
.ts-sheet[data-state=peek] h2:not(.ts-kicker){font-size:20px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-sheet-head{position:sticky;top:0;z-index:1;display:grid;grid-template-columns:auto 1fr auto;align-items:center;min-height:44px;background:var(--ts-surface)}
.ts-grabber{justify-self:center;width:44px;height:44px;border:0;background:none;display:grid;place-items:center;cursor:pointer}
.ts-grabber::before{content:'';width:36px;height:4px;border-radius:2px;background:var(--ts-line-strong)}
.ts-sheet .ts-panel{width:auto;max-height:none;overflow:visible;padding:0;border:0;border-radius:0;box-shadow:none;background:none;animation:none}
.ts-sheet .ts-panel--card>.ts-panel-body{padding:0;overflow:visible}
.ts-sheet[data-state=expanded] .ts-panel--card>.ts-actions{position:sticky;bottom:0;padding:14px 0 18px}
/* the rail inside the sheet: no overhang past the 22 px padding, no nested scroll area */
.ts-sheet .ts-panel--rail{display:block}
.ts-sheet .ts-rail-places{margin-inline:-22px;padding-inline:22px;overflow:visible;flex:none;min-height:0}
/* short viewports: a projector at 1280 × 720 or 1536 × 864, or a short tablet (9.13); after the width rules */
@media (min-width:640px) and (min-height:560px) and (max-height:820px){
  :root{--ts-header-h:72px;--ts-gutter:20px}
  .ts-panel{padding:22px} .ts-panel--card{padding:0} .ts-panel h2{font-size:24px}
  .ts-panel--card>.ts-panel-body{padding:22px 22px 8px} .ts-panel--card>.ts-actions{padding:14px 22px 18px}
  .ts-rail-places{margin-inline:-22px;padding-inline:22px}
}
/* forced colours: states that rely on background or box-shadow */
@media (forced-colors:active){
  .ts-panel,.ts-pop,.ts-controls,.ts-sheet,dialog.ts-dialog{border:1px solid CanvasText}
  .ts-switch .track,.ts-switch .knob{forced-color-adjust:none}
  .ts-switch .track{background:Canvas;border-color:CanvasText}
  .ts-switch .knob{background:CanvasText}
  .ts-switch[aria-checked=true] .track{background:Highlight;border-color:Highlight}
  .ts-switch[aria-checked=true] .knob{background:HighlightText}
  .ts-segment label:has(input:checked){outline:2px solid Highlight;outline-offset:-2px}
  .ts-tab[aria-selected=true]{text-decoration:underline 2px;text-underline-offset:12px}
  .ts-place[aria-current=true],[role=option][aria-selected=true]{outline:1px solid Highlight}
  :where(a,button,input,select,textarea,summary,[tabindex]):focus-visible{outline-color:Highlight}
}
```

- Recipient cost and carbon rows: `.ts-table` (+ `.ts-table--stack`); the carbon price: `.ts-segment`
  (radiogroup "Carbon price").
- Together, in the rail and the shortlist: `.ts-totals` as a `<dl>`. Numbers stay at text size: no large numerals,
  no tiles.
- Rail tabs: `.ts-tabs`. Switches: `.ts-switch`. Method form: `.ts-field` with `.ts-input` and `.ts-range`. Notices:
  `.ts-notice`. Map controls: `.ts-controls`. Demo caption: `.ts-panel.ts-caption`.
- Popover, tooltip and combobox listbox: `.ts-pop`. Dialogs: native `<dialog>` with `showModal()` and `.ts-dialog`;
  the Places drawer: `dialog.ts-drawer`. Back links: `.ts-back`. Icon-only buttons (close, search, menu, remove):
  `.ts-icon-btn`. Error blocks (13): `.ts-notice` with a `.ts-secondary` Retry. Loading rows: `.ts-skeleton` (static,
  no shimmer).
- **Kickers and labels.** The amber-dot `.ts-kicker` appears only on the facility and recipient cards (the selected
  thing) and on the header subline, as in the mockups. The rail ("THE LOCAL PICTURE"), the evidence record ("THE
  EVIDENCE RECORD") and the notes ("YOUR FIELD NOTES") use `.ts-kicker.ts-kicker--plain`. Every numbered or section
  micro-label ("01 ON THE MAP", "A QUESTION WORTH ASKING", "YOUR NEXT QUESTION", "0n PROPOSED / …", "FIND A PLACE",
  "YOUR SHORTLIST", "YOUR NOTES — {place}") uses `.ts-label`.
- **Icons.** The implementation guide (p. 3) asks for a real icon set, not improvised symbols. `src/ui/icons.tsx`
  exports inline SVG icons (no dependency): viewBox `0 0 16 16`, 16 × 16, `fill="none"`, `stroke="currentColor"`,
  stroke-width 1.5, round caps and joins, `aria-hidden="true"`, `focusable="false"`; the accessible name lives on the
  parent control. Paths: chevronRight `M6 3.5 10.5 8 6 12.5`; chevronLeft `M10 3.5 5.5 8 10 12.5`; external
  `M5.5 3.5h7v7M12.5 3.5l-9 9`; plus `M8 3v10M3 8h10`; minus `M3 8h10`; close `M4 4l8 8M12 4l-8 8`; search
  `<circle cx="7" cy="7" r="4.25"/>` + `M10.25 10.25 13.5 13.5`; menu `M2.5 4.5h11M2.5 8h11M2.5 11.5h11`; reset
  `<circle cx="8" cy="8" r="4.5"/>` + `M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3`; arrowUp `M8 12.5V3.5M4.5 7 8 3.5 11.5 7`;
  arrowDown `M8 3.5v9M4.5 9 8 12.5 11.5 9` (sorted column only). "2D / 3D" is a text label, and the
  accordion +/− stay as the handoff's `::after` glyphs. Every other '›', '‹', '↗', '×' or trailing '+' written in
  this spec's copy is an icon in the UI (gap 6 px, `vertical-align: -2px`), not a character in `copy.ts`.

---

## 10. Field notes: `NotesStore`

```ts
export type NoteSubject = { kind: 'facility' | 'recipient'; id: string };
export interface NoteRecord { subject: NoteSubject; text: string; updatedAt: string; revision: number }
export type NotesErrorReason = 'quota' | 'unavailable' | 'conflict' | 'unknown';
export class NotesError extends Error { constructor(public reason: NotesErrorReason) { super(reason); } }

export interface NotesStore {
  load(subject: NoteSubject): Promise<NoteRecord | null>;
  save(subject: NoteSubject, text: string, baseRevision: number | null): Promise<NoteRecord>; // rejects NotesError
  shortlist(): Promise<NoteSubject[]>;
  setShortlisted(subject: NoteSubject, on: boolean): Promise<NoteSubject[]>;
  clearAll(): Promise<void>;
}
```

- **`LocalNotesStore`:**
  - keys `thermostat:v1:note:<kind>:<id>` and `thermostat:v1:shortlist`
  - every call wrapped in try/catch and returned as a Promise, so a remote store can replace it without changing
    callers
  - storage unavailable (private mode, blocked) → `NotesError('unavailable')`, and the panel says "Notes can't be
    saved in this browser. Copy your text before leaving."
  - a quota error → `'quota'`
  - a revision mismatch → `'conflict'` (another tab), offering "Load the newer note" or "Keep mine"
- **`useNoteDraft(subject)`:**
  - **States:** `empty | unsaved | saving | saved(at) | failed(reason)`
  - **Saving:** debounce 800 ms after typing stops, and on blur
  - **"Saved" is shown only after the Promise resolves.**
  - **On failure:** the text stays in the textarea and is never cleared.
  - **Leaving with unsaved or failed text:** a `beforeunload` guard warns first.
- **Status line text:**

  | State | Text |
  |---|---|
  | saved | "Saved on this device · 14:02" |
  | unsaved | "Unsaved changes" |
  | saving | "Saving…" |
  | failed | "Couldn't save. Your text is still here. Retry" |

  Each change is announced politely by the live region.
- **Backboard seam:** a later `RemoteNotesStore` would implement the same interface. It is **out of scope**. Visual
  components never import a store; the store is provided by context from `App.tsx`.
- **Demo mode** never reads or writes notes.
- **Tests (Vitest):**
  - round trip
  - unavailable storage
  - quota
  - conflict
  - the debounce
  - no "Saved" before resolve
  - text kept on failure
  - the shortlist toggle
  - `clearAll`

---

## 11. Recipient brief (the PDF)

### 11.1 How it is made

- "Get the recipient brief" goes to `#/brief/<id>`, which renders the brief on screen with two buttons: "Print or save
  as PDF" and "Back to the map".
- The print button waits for `document.fonts.ready` and the inset SVG, then calls `window.print()`. The user saves it
  as a PDF from the browser's dialog, and the button's help text says so.
- No PDF library; nothing leaves the machine.
- **On screen:** a white Letter-proportioned sheet centred on `--ts-bg`, with `--ts-shadow` and a 30 px top margin;
  the two buttons sit in a toolbar above it, "Print or save as PDF" the one dark primary. Below 880 px the sheet
  scales to fit (`transform: scale(var(--fit))`, `transform-origin: top left`, `--fit = (100vw − 32px) / 816px` set
  in JS) inside a wrapper that reserves 1056 × fit px of height; `@media print` removes the transform. No horizontal
  scroll at 320 px.

### 11.2 Page

- **Size:** US Letter portrait, `@page { size: Letter; margin: 14mm }`, **exactly 1 page**.
- **Print styling:** `print-color-adjust: exact`; `break-inside: avoid` on every block; `@media print` hides
  everything except the brief.
- **Identity:** white paper; ink `#292925`; muted `#716e67` (5.1:1 on white); `--ts-accent-text` for the few small
  accents; amber `#d16b24` only for the 6 px kicker dot and the HCE bar in the chart; hairlines `--ts-line`; no
  shadows, no tints behind text.
- **Type:** Inter (title 20 pt / 500; body 9.5/13 pt; micro-labels 7 pt caps, .16em); tabular figures; one serif
  italic line for the question.
- **Grid:** 2 columns at 7 : 5 with a 6 mm gutter.
- **If it runs to 2 pages,** apply in order until the print check gives 1: cap the sources at 6 plus "and {n} more in
  Method"; show 2 reasons instead of 3; shrink the locator inset to 70 × 50 mm; clamp the name to 2 lines. Never go
  below the type sizes above.

### 11.3 Content, top to bottom

1. **Header row:**
   - the wordmark "THERMOSTAT" (letter-spaced) and the kicker "RECIPIENT BRIEF / SCENARIO"
   - right: an outlined grey box with the words "HCE logo" (a placeholder, never the real logo)
   - under it, verbatim: "Prepared for Hamilton Community Enterprises (HCE). An independent student project, not
     produced or endorsed by HCE."
2. **Title block:** name, address, type, the data-quality word, and "Data as of {meta date}". The brief is the page
   most likely to leave the room, so it always states its own basis:
   - `synthetic`: the kicker reads "RECIPIENT BRIEF / ILLUSTRATIVE", and under the title "Illustrative building:
     generated data, not a real site."
   - `assumptions === 'edited'`: "Uses edited assumptions, not the sourced defaults.", and each edited value in
     "Assumptions and sources" ends in "(edited)"
   - fallbacks (13): "Fallback prices (plan defaults)" and/or "Fallback emission factors"
   - always the carbon price: "Carbon price: none" or "Carbon price: $85 per tonne (scenario)"
3. **Lead** (Inter 12 pt): the verdict sentence. Then, on its own line, the serif question from 9.6.
4. **Left column:**
   - **"Cost over 20 years":** a zero-based horizontal bar chart in inline SVG, 3 bars, direct labels, figures at the
     bar ends, HCE in amber and the others in muted; sorted by cost; the HCE label says "assumed rate: gas parity".
     This is a quantity comparison, not a score.
   - **A table:** annual, upfront, per MWh, t CO2 a year, added grid kW.
   - **Locator inset (85 × 60 mm, inline SVG, no map capture):**
     - the recipient footprint in ink and nearby context footprints in light grey, within 300 m, in Web Mercator
       metres
     - the nearest network element (customer point or route segment) dashed in muted, with its quality word
     - a 100 m scale bar and a north arrow
     - the caption "Schematic. The connection shown is not a pipe route."
5. **Right column:**
   - **"Why it fits":** the band word and reasons.
   - **"Heat demand":** figures, method and quality.
   - **"What this means":** 3 computed bullets: the cost band, CO2 and grid, and the boiler (or the heat-pump caveat).
   - **"Assumptions and sources"** at 7.5 pt: prices with dates, the factor set and year, the gas-parity rule, the
     distance quality, and the study citations with page numbers.
6. **Call to action:** "For an exact version, the building owner would share 12 months of gas bills directly with HCE
   under a data-sharing agreement. This tool does not collect bills."
7. **Review line:** "Reviewed by ____________ on ____________". A person on the team reviews every brief before it
   reaches anyone.
8. **Footer:** "Estimates, not a quote." · the team credit · "Sources: ThermoStat → Method".

### 11.4 Check

`npm run check:print` loads `#/brief/<meta.demoRecipientId>` and two other recipients (the longest name and the most
missing fields) in local Chrome through puppeteer-core, prints each to PDF, and asserts that each has 1 page. It also
prints the demo recipient with edited assumptions (carbon $85/t, set in localStorage before load) and a synthetic
recipient when one exists, and asserts their lines from 11.3 item 2. If Chrome cannot be found, report NOT VERIFIABLE
HERE.

---

## 12. Demo mode

- **Entry:** `#demo`, `?demo=1` or the D key. **Exit:** Esc.
- **Caption card:** `.ts-panel.ts-caption` (9.17), centred at the bottom of the free band between the rail and the
  card and at most 560 px wide, so it never overlaps them; in the sheet layout it sits at the top of the map and the
  sheet stays at peek. The legend collapses to its button while the demo runs. It holds "Step 2 of 7" (tabular,
  muted), one sentence (`.ts-caption-text`, Inter 16 px) and Back · Next.
- **Keys:** Space or → advances (a presentation clicker works), ← goes back, R resets to step 1 in under 1 s.
- **Each step is a pure function** `step(n) → { route, selection, lens, layers, carbonPriceT, camera, openRow }`, so
  Back always works.
- **Demo mode** hides hover tooltips, never touches notes, and restores the sourced assumptions on exit or reset.
- **Every figure in a caption comes from the engine or `meta.json`,** and every caption has a fallback for each input
  that can be missing:
  - step 1 with no named customer: "Downtown Hamilton already shares heat from HCE's plant at 79 Bay St N. Its
    customers are not yet named in a cached public source."
  - step 2 with the claim unknown: "HCE's study proposes Bayfront industrial heat for Hamilton General, then downtown.
    Its passage could not be located automatically and is listed for a person to check."
  - step 3 with no reasons: leave the reason out

  `demo/tour.test.ts` renders every step with a fixture in which each input is null and asserts that no caption
  contains `{`, `undefined`, `NaN` or `null`.
- **The brief during the demo.** "Get the recipient brief" on the recipient card keeps demo mode on; the brief's
  "Back to the map" returns to the current step (plan B8 opens it after step 5).

| Step | State | Caption template |
|---|---|---|
| 1 | Explore; downtown plant selected; operational arcs | "Downtown Hamilton already shares heat: HCE's plant at 79 Bay St N serves {n} buildings named in public records." |
| 2 | Recovery plant selected; evidence record open on the heat commitment | "HCE's study proposes Bayfront industrial heat for Hamilton General, then downtown. Here it is in the study's own words, page {p}." |
| 3 | Recipients tab; `demoRecipientId` selected; "Why it fits" open | "Who should HCE approach first? {name}: {band word} fit. {reason 1}" |
| 4 | "Cost over 20 years" open | "{verdict sentence}" |
| 5 | Carbon set to $85/t; the cost row stays open | "If a carbon price of $85/t returns, gas and HCE's assumed rate rise together: still {band phrase} ({Δ}), with about {co2Cut} % less CO2." |
| 6 | Recipients tab; top 5 highlighted; the Together block scrolled into view (`scrollIntoView({ block: 'nearest' })`) | "Together, the top five add about {MWh} MWh a year and {MW} MW of network peak. For scale, 5 MW is worth about {low} to {high} a year to HCE." |
| 7 | 21 King St W selected; its unknown rows open | "And the questions still open: no public record says whether this site's heat is reused. Unknown, not non-compliant." |

The whole tour runs offline in under 90 seconds at a speaking pace. Plan B8 is the spoken script around it.

---

## 13. States

| State | Behaviour |
|---|---|
| First paint (under 1 s) | The header, the rail with skeleton rows, and the map area in `--ts-map-ground`. The map fades in over 200 ms on its first `idle`. No spinner. |
| Loading data | `aria-busy="true"` on the rail lists and the card. Hairline skeleton rows and "Loading public records…". Never 0, NaN or a fabricated value. |
| Facility with no commitments | The serif empty state "No public records have been added yet." and a "See how records are gathered" link (Method#evidence) |
| Commitment without a source | "Source not available. This claim cannot currently be checked here." |
| Missing recipient field | "Not in source data" |
| Search with no results | Section 9.11 |
| A data file fails to load | The affected panel says "Couldn't load {facilities / recipients / sources}. The map still works." with a Retry button. The map stays usable. |
| Invalid items | Skipped and counted in Method → Data quality |
| Basemap fails | Buildings, arcs and labels on the plain ground; the legend says "Basemap unavailable" |
| `factors.json` fails | The engine uses its built-in ECCC set; the card and Method say "Fallback emission factors" |
| `prices.json` fails | The engine uses `src/engine/fixtures/prices.default.json`; the card, brief and Method say "Fallback prices (plan defaults)" |
| `meta.json` fails | Select `hce-recovery-plant`; disable the demo ("Demo needs meta.json") and the Heat demand switch; dates read "Not in source data" |
| No WebGL (checked with a WebGL2 context probe) | `fallback/map.png`, the line "This device can't draw the 3D map. Every record is in Records.", and the Records view |
| A notes save fails | Section 10 |
| Illustrative examples on | Each synthetic item says "Illustrative" in its kicker, list row and legend |
| Unknown deep link | Falls back to Explore with a one-line notice |

---

## 14. Accessibility (WCAG 2.2 AA as the floor)

- **Document structure:** `lang="en-CA"`. A visually hidden `h1` "ThermoStat: Hamilton's waste-heat promises and
  prospects". Each panel is a `<section>` labelled by its `h2`. The landmarks are header, nav, main and footer.
- **Keyboard:** a full path with no pointer: search, select a facility, read the evidence, switch to recipients, open
  the cost row, change the carbon price, save a note, open the brief and print.
  - Focus is always visible: a 2 px amber outline, offset 5 px (handoff); on the edge-to-edge map it is a 2 px ink
    ring inset 6 px with surface separators, drawn by the map region, because amber measures only 2.0 to 2.3:1 on
    walls (9.17). Panel swaps move focus as in 9.2.
  - The order is header, rail, map, card, legend.
  - Single-key shortcuts can be turned off and never fire while typing (9.12, WCAG 2.1.4).
- **The map** is a `region` with an `aria-label` ("Map of Hamilton facilities, connections and candidate buildings").
  - MapLibre keyboard pan and zoom stay on.
  - Every map object is also reachable as text: the rail lists, the card's Connections row, and Records.
- **Non-modal panels never trap focus.** Dialogs (the Places drawer under 1024 px, the unsaved-notes prompt, the
  shortcuts dialog, the clear-notes confirmation) trap focus, close with Esc, and return focus to their trigger.
- **Live region:** a polite `aria-live` region announces selections, save states and demo steps.
- **Never by colour alone:** status, kind and fit are words; arcs also differ by pattern and endpoints by shape.
- **Targets and reflow:** target sizes per 9.13; reflow works at 320 CSS px and at 200 % zoom.
- **Forced colours:** panel borders, focus rings and every on, checked, selected and current state stay visible (the
  9.17 `forced-colors` rules; the `forced-colors` shot).
- **Reduced motion:** 9.14.
- **Tests:**
  - `eslint-plugin-jsx-a11y`
  - Testing Library tests for the accordion, the switches, the tablist, the combobox, the dialog focus trap and
    restore, and the live announcements. jsdom has no `showModal`, so `src/test/setup.ts` (Vitest `setupFiles`) adds
    a minimal `showModal`/`close` when missing (set or remove `open`; `close` fires a `close` event), and
    `ui/Dialog.tsx` implements the Tab and Shift+Tab wrap, Esc and focus restore itself, so the tests exercise the
    app's logic; `shots` repeats the check in real Chrome (3.4).
  - panel focus: Open evidence record → `activeElement` is the evidence h2 → activate the back link → `activeElement`
    is the "Open evidence record" button
  - Tab to the map: the focus ring is visible in the `map-focus` shot
  - a manual screen-reader pass with VoiceOver at milestone 8

---

## 15. Offline, privacy and security

- **Offline:** everything the app needs is in the build:
  - tiles, glyphs, fonts and data
  - `npm run build && npm run preview` on 127.0.0.1 works with the network off
  - the production CSP (3.5) blocks any other origin
- **No personal data** is collected, stored remotely or uploaded. Notes and the shortlist stay in this browser's
  localStorage. No analytics, no external fonts or CDNs at runtime.
- **Climatiq** receives quantities only, at build time (5).
- **Safe rendering:** data strings render as text (never `dangerouslySetInnerHTML`). URLs pass `safeHttpsUrl` before
  becoming links. External links use `rel="noopener noreferrer"`.
- **Secrets:** no secrets in the repo, the bundle, the data or the logs (6.4 checks it).

---

## 16. Acceptance criteria

Report every item as **PASS**, **FAIL** or **NOT VERIFIABLE HERE**, with evidence: command output, a screenshot path
or a file reference. Never report PASS for something you could not run.

**Data and pipeline**

- [ ] `00_probe` report exists; every source in section 4 is resolved, or marked unavailable with the reason.
- [ ] At least 80 real buildings in `recipients.geojson`.
- [ ] Actual recipients from BPS: at least 5, or the honest number and the reason.
- [ ] Mock data only on a pipeline failure, labelled.
- [ ] `make data OFFLINE=1` is byte-identical across two runs (sha256 list).
- [ ] `pytest` passes with no network and no key.
- [ ] The evidence report lists every claim as found, unknown or checked. Every found excerpt occurs verbatim on its
  cited page (test), and at least the study claims are human-checked before the demo [Verify].
- [ ] Every operational and proposed connection has at least 1 evidence id; every URL is HTTPS.

**Engine**

- [ ] Every row of 8.5 passes in Vitest, including fit parity with Python.

**Interface fidelity** (measured by `npm run shots` on the 1440 × 900 screenshot; evidence:
`test-results/shots/fidelity-1440.png` beside Mockup-1, and the same for the evidence record and notes against
Mockup-2)

- [ ] Header 100 to 116 px tall at viewport heights of 821 px or more (72 px at 820 px or less); rail 260 to 280 px wide
  and card 380 to 420 px wide, each inset 24 to 32 px from the map edges; panel radius 30 ± 1 px and padding 28 px;
  kicker 10 px caps at .16em; card h2 27 to 28 px; one primary panel at a time; panels never stack.
- [ ] Sampled roofs within ΔE2000 5 of `#e6e6de`, walls within 6 of `#d0d0c9` and `#bfc2bb` (sampling per 3.4); every
  drawn arc visible above the roofs (judged by eye).
- [ ] At 1440 × 900 and 1280 × 720 (and at 375 × 812 with the sheet expanded), with the default facility and with the
  demo recipient's Cost row open, the primary button is fully inside the viewport, and the h2 and the first row's
  summary are visible without scrolling.
- [ ] At 1440 × 900 with the Recipients tab open, only the places list scrolls (the intro, the layer row and the tabs
  stay put), at least rows 1 to 3 are visible, and no fit word wraps.
- [ ] Accordion evidence rows, heat first and open, with the status in words and the team summary at 17 px serif
  italic; the evidence record shows the exact excerpt, page, document date and retrieval date. The legend's items
  flow inline, never one per line.
- [ ] No score bars, dials, compliance pills, counters or arc animation anywhere. Fit is shown in words.
- [ ] Buildings are desaturated by default, and the Heat demand toggle tints recipients with its legend strip.
- [ ] The selected facility's connections only (9.3 selection policy); kinds labelled in words and by pattern; "not a
  pipe route" visible in the legend and the popover.
- [ ] The verdict and every figure come from the engine. The office case reads "About the same cost as gas" and the
  heat-pump caveat appears.
- [ ] `npm run contrast` passes; its output is pasted as evidence.

**Responsive**

- [ ] 1536 × 864, 1440, 1280 × 720, 1024, 768, 700, 640 × 360, 844 × 390, 375 and 320 px: no horizontal scroll. Below
  1024 px the Places drawer works; below 640 px or 560 px tall, one bottom sheet with a grabber and a close button, at
  most 62 dvh, the selection visible above it, attribution visible; at 640 × 360 and 844 × 390 the active panel's h2
  and primary action are visible without scrolling.

**Notes**

- [ ] Unsaved, saving, saved and failed states are all shown (forcing a failure with storage blocked). Text survives a
  failure. Switching subject with unsaved text prompts.

**Recipient brief**

- [ ] `npm run check:print` gives 1 page for 3 recipients (Safari: NOT VERIFIABLE HERE unless available). The header
  disclaimer, the "HCE logo" placeholder, the carbon-price line, the call to action and the review line are present,
  and the edited-assumptions and illustrative lines appear in their states (11.4).

**Demo**

- [ ] `#demo` runs all 7 steps offline in under 90 s; step 5 changes the numbers live; R resets in under 1 s; Back
  works on every step.

**States**

- [ ] A screenshot of each state in section 13, with tiles, `factors.json` and WebGL each removed in turn, plus a data
  file returning 404.

**Accessibility**

- [ ] Keyboard-only run of the section 14 path. The focus trap and restore work in the dialogs only. jsx-a11y is clean.
  Lighthouse Accessibility ≥ 95 (NOT VERIFIABLE HERE if Lighthouse is unavailable). VoiceOver pass notes.

**Offline and security**

- [ ] `npm run check:offline` attempts no request outside 127.0.0.1 (`test-results/offline-log.json`); Krishna repeats
  the demo with Wi-Fi off [Verify].
- [ ] The CSP is present in `dist/index.html`.
- [ ] `grep -r CLIMATIQ dist/ public/` is empty.

**Performance**

- [ ] Lighthouse Performance ≥ 85 on the production preview; a smooth 3D pan on a 2020 or newer laptop (NOT VERIFIABLE
  HERE if it cannot be measured).

**Repo hygiene**

- [ ] `.gitignore` is in place.
- [ ] No `.env`, key, local tool folder, or tool attribution in any tracked file or commit message (checked with a grep
  kept outside the repo).
- [ ] The handoff zip is unchanged, and `design/handoff/` matches its contents.
- [ ] Work is on `feat/thermostat-app`.

---

## 17. Milestones

There are two hard stops, plus a look check after milestone 4: screenshots of the opening view and the fidelity shot,
and an OK on the look before milestone 5 builds on it. Otherwise the build runs on its own and gives a 3-line status
after each milestone (done, open [Verify] items, next). Estimates are focused build time for one experienced developer working with the
specs; human-only tasks are listed separately.

| # | Milestone | Done when | Estimate |
|---|---|---|---|
| 0 | Setup and audit: pull, branch, `.gitignore`, extract the handoff, ASK whether the teammate's existing app exists elsewhere, pin versions, `make venv`, run `00_probe`, list planned downloads with sizes | **STOP 1:** plan, layout, probe report, risks, the answer about the existing app, the tiles decision, the download list | 0.5 to 1 h |
| 1 | Pipeline 01 to 05 plus `mock.py`, with tests | buildings, actuals and estimates in `out/`; factors written; counts printed; pytest green, including 03 to 05 run on `mock` output | 3 to 5 h |
| 2 | Contract (with the file types), schema generation, engine (cost, fit, verdict, totals, format), `src/ui/tokens.css` (handoff block, additions and 9.17 recipes), `mapTokens.ts`, `scripts/contrast.mjs` and `contrast-pairs.json`, with tests | every 8.5 row passes except fit parity over `public/data/` and the ajv check of `public/data/`, which are added and must pass at milestone 3; `npm run contrast` passes | 2 to 3 h |
| 3 | Pipeline 06 to 09: places, score, evidence extraction, export | `public/data/*` complete and valid; evidence report written; fit parity over `public/data/` passes | 3 to 4 h |
| 4 | Vite app shell, fonts, header, nav and footer, map: offline basemap, deck.gl buildings with the 9.3 lighting, facilities, connections, legend, camera; `scripts/shots.mjs` | the interleaving smoke test (3.1) recorded; `npm run shots` at 1440 px with the roof and wall colours in range; the Range check returns 206; **look check:** `1440-default.png`, `fidelity-1440.png`, the smoke-test result and the ΔE values, then wait for an OK | 3.5 to 5 h |
| 5 | Rail, facility card with evidence rows, evidence record, recipient card (fit, cost, carbon), selection, deep links, search, bottom sheet, Recipient brief (the MVP) | **STOP 2:** screenshots at 1440 and 375 px, test output, contrast output, the print check giving 1 page | 4.5 to 7 h |
| 6 | Field notes with `NotesStore`, the shortlist and its Together totals | every notes test passes; each save state screenshotted | 1 to 2 h |
| 7 | Records, Method, demo mode, the states in 13, `fallback/map.png`, `scripts/offline-check.mjs` | the tour runs offline in under 90 s; every state screenshotted | 3 to 4.5 h |
| 8 | Responsive pass, accessibility, illustrative-examples switch, polish, `docs/method.md` | every section 16 item reported | 2.5 to 4 h |

This order follows plan B7: the map, evidence, the recipient card and the brief first; notes, Records and Method
after.

**In total:** about 23 to 36 hours of focused build time (MVP at Stop 2 after about 16 to 25 hours), so about 3 to 4.5
eight-hour working days, plus Krishna's review time at Stops 1 and 2 and the look check. The human tasks (about 2 to 3
hours) run in parallel and must finish before the demo.

**Human tasks, in parallel:**

- trace the planned route and the recovery plant's position from the study figure (30 to 45 minutes)
- check each excerpt against its PDF page in `evidence/checks.csv` (30 to 60 minutes)
- confirm operator names and the customer list (30 minutes)
- review the brief for the demo recipient
- rehearse the demo

**Scope control:**

- Milestones 0 to 5 come first, end to end. Milestones 6 and 7 are the second tier, and 8 is polish.
- Do not build anything outside this spec; put ideas in the "Later" list in `pipeline/README.md`. Starting entries:
  box-select clusters, permit alerts, isotherms, a Backboard notes adapter, a bill-upload flow with consent, other
  utilities.

---

## 18. Open items to verify

| Item | Why it matters | When |
|---|---|---|
| BPS rows carry facility name and address | how many Actual recipients there can be | milestone 1 |
| EWRB data dictionary: which intensity columns exist | calibration | milestone 1 |
| A City of Hamilton footprints layer, its format and licence wording | geometry and attribution | milestone 1 |
| Enbridge Union South all-in gas price; the facility carbon charge | the gas option and the HCE rate | milestone 2 |
| The OEB electricity price for the customer class | the heat-pump option | milestone 2 |
| The ECCC and TAF grid tables | heat-pump CO2 | milestone 2 |
| Dofasco, Air Liquide and recovery plant positions (the plant traced by a person, 6.1) | the map; the plant also starts the placeholder route, so distances, fit and ranking | milestone 3 |
| The HCE customer list, operator names, the CEEP final PDF URL | operational connections and evidence | milestone 3 |
| Every excerpt checked against its page | evidence integrity | before the demo |
| The planned route traced | distances and fit | before the demo |
| The Climatiq data-version format and selector-by-id support | reproducible factors | milestone 1 |
| deck.gl interleaved mode with `PathStyleExtension` and `CollisionFilterExtension` at the pinned versions (3.1 smoke test) | arc patterns, map labels | milestone 4 |
| The Protomaps build-list JSON URL and which basemap route (4, row 13) is allowed | the offline basemap | Stop 1 |
| The team credit line | footer and brief | Stop 1 |

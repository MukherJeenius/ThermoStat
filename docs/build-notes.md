# ThermoStat: build notes

Durable facts found while building. Dates are written out.

## How to run (1 November 2026)

- App: `npm install`, then `npm run dev` (http://127.0.0.1:5173) or `npm run build && npm run preview`
  (http://127.0.0.1:4173, offline, with the production CSP).
- Pipeline: `cd pipeline && make venv && make data` (or `make data OFFLINE=1` from the cache). Steps run as
  `.venv/bin/python -m steps.<file stem>`.
- On this Mac the user npm cache has root-owned files: run installs with `npm_config_cache` set to another folder, or
  fix it once with `sudo chown -R 501:20 "/Users/krishnas/.npm"`.

## Datasets actually found (31 October 2026)

- **BPS** (data.ontario.ca, "Energy use and greenhouse gas emissions for the Broader Public Sector"): yearly XLSX
  files 2011 to 2024; the 2024 file (`2024_final_data_set.xlsx`, updated 13 January 2026) has one sheet with columns
  including Sector, Subsector, Organization, Property Name, Primary Property Type - Self Selected, Portfolio Manager
  Property ID, Parent Property ID, Address, City, Postal Code, Property GFA - Self-Reported (m²), Number of
  Buildings, Natural Gas Use (therms) and Natural Gas Use (GJ). The GJ column is used (1 GJ = 26.8 m³). 160 rows have
  City = Hamilton (139 municipal, 21 public hospital, 1 post-secondary; no school boards in 2024).
- **EWRB** (data.ontario.ca, "Energy and water usage of large buildings in Ontario"): yearly XLSX 2018 to 2024 plus a
  data dictionary. 2024 columns: EWRB_ID, City, Postal_Code (3 characters), PrimPropTypCalc, PrimPropTypSelf,
  Largest_PropTyp, All_Prop_Types, WN_Sit_Gas_Int1 (GJ/m²), WN_Sit_Gas_Int2 (m³/m²), WN_Sit_Gas_Int3 (m³/ft²),
  Site_EUI1/2, WN_Site_EUI1 (GJ/m²)/2 (ekWh/ft²), GHG intensity, ENERGY STAR score and data-quality fields. Gas
  intensities are published in bins (62 distinct values, steps of 3.044 m³/m²).
- **HCE reports** (hce.net/reports redirects to hce.net/energy-harvesting-study): six PDFs on HCE's CDN: the Energy
  Harvesting Study Summary (32 pages), Final Report (139 pages), Overview (8 pages), the McMaster policy report, the
  Mohawk College thermal storage report and an "HCE AP Progress Report 2026". Printed page labels equal the physical
  page numbers in the Summary.
- **HCE network pages:** hce.net/energy names David Braley Health Sciences Centre, Hamilton City Hall, Hamilton Police
  ISF, Hamilton Convention Centre, FirstOntario Concert Hall and the Art Gallery of Hamilton. FVB Energy's project page
  names FirstOntario Centre (former Copps Coliseum), Lister Block, Jackson Square and City Hall, "12 Connected
  Buildings" and a 3.5 MW gas combined heat and power engine, with the plant at the northwest corner of Bay Street
  and York Boulevard.
- **CEEP:** the final plan is on the City's eScribe meeting system (refuses automated downloads); the 2022 draft on
  hamiltoncivicmuseums.ca is cached. Action 19, "Decarbonize and Expand District Energy", is on PDF p. 42 of the draft.
- **Data centres:** PeeringDB lists "HCE Telecom Hamilton" (Hamilton Utilities Corporation, 21 King St W floor 14)
  and "NetAccess Hamilton HAM02" (21 King St W suite 1500). No current operator confirmed for 100 King St W.
- **City of Hamilton open data:** a Buildings layer (214,292 footprints) and development applications exist under the
  City of Hamilton Open Data Licence v1.1 ("Contains public sector Data made available under the City of Hamilton's
  Open Data Licence"). Not used in this build.
- **Protomaps:** build 20261031 (tiles version 4.15.2); the Hamilton extract is 4.0 MB at maxzoom 15. Its `buildings`
  layer carries `height` and `min_height`.
- **Climatiq:** not used (no key).

## Facility positions used (geocoded with Nominatim, all [Verify])

- HCE downtown plant: "79 Bay Street North" → −79.873207, 43.260706 (address).
- ArcelorMittal Dofasco: name query → −79.794832, 43.269014 (approximate).
- Air Liquide: name query → −79.836736, 43.266196 (approximate).
- Data centres: 21 King St W → −79.884155, 43.260741; 100 King St W → −79.870193, 43.257343 (address).
- Central Energy Recovery Plant: the midpoint of Dofasco and Air Liquide, −79.815784, 43.267605, **illustrative**
  until a person traces it from the study's site figure into `pipeline/places.yml`.

## Gotchas

- deck.gl 9.4 interleaving needs maplibre-gl 5.x (MapLibre 6 removed `map.transform`).
- After changing the maplibre-gl version, clear `node_modules/.vite` or Vite serves the old pre-bundle.
- Overpass was overloaded on 31 October 2026: full-frame and quadrant queries time out; small tiles work.
- The repo guard greps tracked files for tool names, so tool folders live in `.git/info/exclude`.

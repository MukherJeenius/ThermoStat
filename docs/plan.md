# ThermoStat: Product Plan

*McMaster P2P Hacks 2026, sustainability and society track. Version 7, 31 October 2026. This version fuses the HCE
waste-heat plan (version 6) with the team's ThermoStat design handoff. Every figure and formula is unchanged from
version 6. What to build is in `docs/build-spec.md`; where the two differ, the spec wins on engineering and this plan
wins on figures.*

> **In one sentence:** ThermoStat follows the public promises about Hamilton's industrial waste heat to the places
> they concern, and tells Hamilton Community Enterprises (HCE) which buildings near its planned pipe to connect first,
> with an honest, current cost comparison for each.

**Contents**

- **Part A, the proposal:** the two lenses, the problem, the deliverables, the customer, the money and the risks.
- **Part B, the demo guide:** what judges see and do, the data, the model, the maths, the brief, the schedule and the
  script.
- **Appendix A:** key numbers and their sources.
- **Appendix B:** questions for HCE.
- **Appendix C:** items to verify before the demo.

**Status:** nothing is built yet. `docs/build-spec.md` is the engineering contract.

**Labels**

- **[Study]**: from HCE's *2025 Hamilton Energy Harvesting Study* (summary and full reports at hce.net/reports).
- **[Est]**: our estimate or assumption.
- **[Verify]**: a team member must confirm it before the demo.
- **Data quality**, always shown in words: **Actual** (reported gas use) · **Checked estimate** (calibrated) ·
  **Estimate only**.

**One price rule, used everywhere in this document.**

- HCE heat is priced at **gas parity**: the full cost a building would pay to heat with its own gas boiler. That is
  fuel, plus maintenance, plus the boiler's replacement spread over its life.
- At default prices this is **about $48/MWh**, or **about $66/MWh** if a carbon price of $85/t returns (B5.5).
- The Recipient brief, the totals and the revenue figures all use this same rate.

---

# Part A: Proposal

## A0. One product, two lenses

| Lens | The question | For whom |
|---|---|---|
| **Accountability** ("Every promise has a place") | What has been promised about recovering Hamilton's waste heat, by whom and where, and what evidence exists? | the public, councillors, journalists, students; the society judging lens |
| **Connection** ("Who should HCE connect first, and why it is worth it") | Which buildings near the network should HCE approach first, and what would connecting cost them? | HCE's business development team, building owners; the sustainability and business judging lens |

**The bridge:**

- HCE's own study says the next step is a "Commercialization Phase" to **obtain customer and supplier commitments**
  [Study].
- ThermoStat follows the commitments that already exist (lens 1) and finds the customers who could make the next ones
  (lens 2).

**What the user works with:**

- **Facilities** are the real heat sources and holders:
  - ArcelorMittal Dofasco and Air Liquide (Bayfront)
  - HCE's proposed Central Energy Recovery Plant
  - HCE's downtown plant at 79 Bay St N
  - the data centres at 21 King St W (NetAccess; HCE Telecom) and 100 King St W (Qu, formerly Rogers)
- **Commitments** belong to facilities. Each one has:
  - a status in words: proposed, required, reported, verified or unknown
  - an exact excerpt with its page number, document date and retrieval date
  - a question worth asking next

  Where no public record exists, the status is **unknown**, "Source not available", never invented.
- **Connections** are arcs from a facility to a recipient:
  - **operational:** HCE's plant to its existing downtown customers
  - **proposed:** the recovery plant to Hamilton General Hospital, then to the downtown plant, per the study
  - **scenario:** the team's ranked candidate buildings

  An arc is never a pipe route.
- **Recipients** are candidate buildings with an estimate, a fit in words and a cost comparison, plus a one-page
  **Recipient brief**.
- **Field notes** and a **shortlist** are private to the user's browser. Notes are leads, not conclusions.

## A1. Background: what HCE is doing

- **Ownership.** HCE is owned by the City of Hamilton through Hamilton Utilities Corporation. It has two divisions:
  HCE Energy (district energy) and HCE Telecom.
- **Today's downtown system.** About 12 buildings, roughly 2 to 2.5M sq ft:
  - Customers include City Hall, TD Coliseum, Hamilton Place, the Convention Centre, the Art Gallery of Hamilton,
    Lister Block and Jackson Square.
  - The heat comes from a gas-fired combined heat and power plant at 79 Bay St N.
  - This system is separate from the new waste-heat network described next.
- **The new waste-heat network [Study].**
  - Heat comes from ArcelorMittal Dofasco and Air Liquide in the Bayfront industrial area.
  - A Central Energy Recovery Plant would have three 10 MW heat pumps, a 1.7 MW electric boiler, two 13 MW gas
    condensing boilers (for peaks and backup) and 6.1 million litres of thermal storage.
  - **Phase 1:** a pipe to the Hamilton General Hospital campus. **Phase 2:** extends it to HCE's downtown plant.
  - **Phases 1 and 2:** 65,000 MWh a year and 18 MW peak (stated in the summary report).
  - **All five phases (about 10 years):** 143,000 MWh a year, 51 MW peak, more than 27,000 t CO2e a year avoided
    (80 % below gas).
  - **Buildings served:** from 1.5M sq ft in Phase 1 to 10.5M sq ft in Phase 5 (full report).
- **The longer-term potential.** The Hamilton Chamber of Commerce's 2021 *Industrial Waste Heat Recovery Report*
  (cited in the study) found that Bayfront waste heat could heat about **80M sq ft**. That is a **supply** figure,
  the most the heat could serve. It is not the market HCE can reach in the near term.
- **Money [Study].**
  - The early model (fall 2023) covers the downtown node over 30 years: **$504M to $529M in heat sales**, or about
    $17M a year on average across the 30 years. Unlevered IRR (before financing) is 11.5 % (Air Liquide) to 14.3 %
    (Dofasco).
  - Heat is priced at the cost of gas heating, with **no green premium**. The carbon tax was counted at 50 %.
  - The Phase 1 and 2 capital cost came in **32 % above** the conceptual estimate.
  - The project needs grants and low-cost loans. The Canada Infrastructure Bank is named.
  - **Status:** the next step is a "Commercialization Phase" to **obtain customer and supplier commitments**.
- **The City's plan.** The City's Community Energy and Emissions Plan (CEEP) plans to switch the downtown district
  energy system from gas to industrial waste heat [Verify the page].

## A2. The gaps we fill

| # | Gap (HCE study's own next steps and risks, and the public record) | What we deliver |
|---|---|---|
| 1 | Customer and supplier commitments are still being sought. The new network must grow from 1.5M to 10.5M sq ft. | **Recipients to approach**: a ranked list |
| 2 | The city heat map was built once by consultants (Planning department, MPAC, Canada Post and Enbridge data). | **Updated heat map**: a living map |
| 3 | Risk that clients will not accept the "business as usual" cost comparison. The business case used benchmarks, not each building's own bills. | **Cost comparison**: a current Recipient brief for each building |
| 4 | Risk that the network's timeline falls behind new buildings, and that connections are delayed. | Permit and site-plan alerts (part of #1; later) |
| 5 | Public statements about waste heat (the study, the City's plan, data-centre operators) are scattered across PDFs and pages. Nobody shows which are proposed, reported or still unknown. | **Evidence record**: every commitment in its own words, with page, dates and status |

**The customer is HCE, not the City.**

- **HCE** earns more for every building connected. Worked example [Est]:
  - "5 MW" here means **5 MW of network peak**.
  - At the study's own network ratio (65,000 MWh ÷ 18 MW ≈ 3,600 full-load hours a year), that is about **18,000
    MWh a year**.
  - At gas parity of $48 to $66/MWh, that is about **$0.9 to $1.2M a year** in extra heat sales (the engine computes
    $0.86M to $1.19M).
  - HCE's actual quoted rate is not public (Appendix B, Q7).
- **The City** owns HCE, issues permits and owns several HCE customer buildings. It supports the project but does
  not pay us.
- **Building owners** receive the Recipient briefs free.
- **The public** gets the evidence record free. It is the accountability lens and the reason the tool is open.

## A3. Deliverable 1: Recipients to approach (prospect engine)

**We build:**

- **A list of every candidate building within 600 m** of the existing and planned pipes (the fit score's
  zero-distance point). For each building:
  - address, type, floor area, year built, owner type
  - estimated annual heat (MWh) and peak (kW)
  - distance to the pipe, likely heating system and data quality
- **A fit in words:** Strong, Possible or Weak fit. It rests on a score from 0 to 100, shown small and secondary, and
  plain-language reasons. Example: "Large heat user: about 3,900 MWh a year. About 140 m from the planned route. A
  public anchor building."
- **A pipeline status** (later, for HCE's own use): not contacted → contacted → interested → data shared → signed.
- **Development alerts** (later): new building permits and site plans near the route (Steelport, Pier 8 and downtown
  towers), so HCE reaches buildings while they are still being designed.

**In the demo:** the ranked list is called "Places to investigate · Recipients to approach" (the top 20). A
"Together" line totals the top 5, or the user's shortlist.

**HCE receives:** the web tool, a monthly "recipients to approach" list (CSV or Excel) and alerts.

## A4. Deliverable 2: Updated heat map

**We build:**

- **A 3D map of downtown and the Bayfront-to-downtown corridor** showing:
  - buildings, desaturated by default, with a "Heat demand" layer that tints candidate recipients by estimated
    demand
  - the facilities: Dofasco, Air Liquide, the recovery plant, the downtown plant, the data centres
  - connections as labelled arcs: operating (from public records), proposed (from the study) and scenario (our
    ranking). Arcs join endpoints; they are not pipe routes.
  - the planned Phase 1 and 2 corridor (approximate, traced from the study figure), used for distances
- **Search** by place, building or neighbourhood, with no outside geocoder.
- **Totals.** Pick a group of buildings (the top 5 or a shortlist) and see "+X MWh a year, +Y MW peak, Z t CO2
  avoided, $W a year for HCE".
- **Data-quality words** on every building.
- **Automatic refresh** from new building energy reports, permits and bills that buildings share (later).

**HCE receives:** the live map, a quarterly snapshot (PDF plus GeoJSON) for planning and funding applications, and a
change log.

## A5. Deliverable 3: Cost comparison (the Recipient brief)

**We build:** a one-page brief for any building that compares three options.

1. **Keep gas:** current Enbridge rates, boiler efficiency and maintenance, and boiler replacement when it falls due.
2. **Install its own heat pump:** current Ontario electricity rates, the heat-pump capital cost and an electrical
   service upgrade.
3. **Connect to HCE:** HCE's gas-parity rate (the one price rule). The default connection fee is $0, because the
   study treats it as cost-neutral, offsetting the in-building equipment the building no longer buys. A toggle can
   charge it.

**It shows, for each option:**

- annual cost, 20-year cost, upfront cost and levelized cost per MWh
- t CO2 a year
- added peak load on the electricity grid (kW)

**Also on the page:**

- a sources box with dates and data-quality words
- a call to action: owners share bills directly with HCE for an exact version
- a reviewer line
- "Prepared for HCE" with a logo placeholder

**HCE receives:** a "Get the recipient brief" button for any building, giving a PDF its sales team can hand to
building managers.

**Be honest in the pitch.** At gas parity, HCE matches gas on cost by design. The reasons to connect are:

- about 80 % less CO2
- no added load on the electricity grid
- no boiler to replace
- protection from future carbon and gas prices

## A6. Deliverable 4: Evidence record (the accountability lens)

**We build:**

- **A record for every facility.** Each commitment is shown as a numbered row with its status in words. The evidence
  record then shows the promise **in its own words**: the exact excerpt, the page, the document date, the retrieval
  date and a link to the original.
- **Honest unknowns.** Where no public record exists, the row says "Source not available". Missing evidence is an
  open question, not a finding of non-compliance.
- **A question worth asking** for each record. For example: "Has a supply agreement been signed?" or "Does this
  site report its heat, water or energy use anywhere public?"
- **Human checks.** Every excerpt is extracted automatically from the cached document. It shows "checked" only after a
  team member has compared it with the original page.
- **Field notes.** A private shortlist and notes, kept in the user's browser and never published.

**Who uses it:** residents, councillors, journalists, students and HCE itself, to see in one place what has been
said and what is still open.

## A7. Revenue and cost [Est]

**Our running cost, year 1 (CAD):**

| Item | Cost | Notes |
|---|---|---|
| Hosting, map tiles, database | $2k to $5k | |
| MPAC property data | $0 to $10k | Licence terms restrict redistribution in third-party tools. Confirm with MPAC, or use HCE's own licence internally. Treat $0 as optimistic. |
| Legal (privacy policy, data-sharing agreement, incorporation) | $2k to $5k | Required before handling real bills |
| Professional liability insurance | $1k to $3k | |
| **Cash total** | **about $5k to $23k** | Team time is unpaid; Mitacs or grants could cover some of it. |

**Revenue:**

| Model | Price | Year 1 with HCE |
|---|---|---|
| Pilot (Phase 1 and 2 corridor, 6 months) | $10k to $20k | $10k to $20k |
| Subscription (all deliverables) | $25k to $60k a year | $25k to $60k |
| Success fee | about $10k per MW of network peak connected | about $50k if 5 MW connect |
| **Recommended mix** | lower subscription plus success fee | **about $40k to $80k a year** |

- **Value to HCE:** about $0.9 to $1.2M a year per 5 MW connected (A2). The success fee of about $50k is about 4 to
  6 % of one year's extra heat sales, and less than 1 % of 20 years of them.
- **Price anchor:** a pilot costs a fraction of one consultant study. HCE's Energy Harvesting Study cost $510k.
- **Scale:** 5 to 10 Canadian district-energy utilities and cities at $30k to $60k each would be about $150k to $600k
  a year within 3 to 5 years.
- **The evidence record stays free and public.** It earns trust, not revenue.

## A8. Risks and mitigations [Est]

| Risk | Likelihood | Mitigation |
|---|---|---|
| HCE builds the tool in-house, or does nothing | Medium | A pilot at a fraction of one consultant study; the success fee ties our pay to connections |
| Procurement rules block a student team | Medium | Run the pilot through McMaster's industry-liaison office or a sponsor |
| HCE's real rate differs from gas parity | Medium | Rate slider ±10 %; the brief states the rule; ask HCE (Q7) |
| A key B2 source is missing or licence-restricted | Medium | Illustrative buildings, clearly labelled; the minimum viable demo needs only 30 buildings |
| Data licences (MPAC, ODbL) limit redistribution | Medium | Public sources only in the shipped tool; MPAC used only inside HCE's own licence |
| An excerpt is misquoted or taken out of context | Low | Excerpts are extracted verbatim with page numbers, capped at 60 words, and checked against the original by a person before the demo |
| A missing record is read as wrongdoing | Medium | Unknown is labelled "an open question, not non-compliance" everywhere |

## A9. Why Europe matters to our pitch

- **Germany requires every municipality to make a heat plan.**
  - The vendor greenventory (founded 2019, about 90 staff, more than 400 heat plans by its own count) charged
    Mühlacker about €68k (about CAD 108k) for one plan.
  - Federal BEW grants cover up to 40 % of heat-network investment (capped per project).
- **Canada has no such mandate and no such tool.** Hamilton has a live project, 143,000 MWh a year at full build,
  that needs customers.
- **The pitch:** "We are not selling HCE another report. We help it fill the pipe, in the open."

---

# Part B: Demo guide

## B1. What the judges see

1. **The map opens** on downtown Hamilton and the Bayfront. The recovery plant is selected, so the proposed network
   to Hamilton General and downtown is drawn, and its record is open on the right. The rail says "Every promise has a
   place."
2. **Accountability.** A judge opens the evidence record and sees the study's own sentence, with its page and dates.
   They then open a data centre and see honest unknowns: "Source not available."
3. **Connection.** The judge switches to "Recipients to approach" and clicks a building. The card shows:
   - its fit in words with reasons
   - its estimated MWh and kW and its distance to the network
   - a three-option cost comparison over 20 years
4. **The carbon price** switches to $85/t, and every number updates live.
5. **"Get the recipient brief"** gives a one-page PDF.
6. **The "Together" line** totals the top 5: MWh, MW, t CO2 and $ a year for HCE.
7. **Method** lists every source, licence, formula and data-quality count.

**Rule:** every number shows its source, and any illustrative value is labelled "Illustrative".

## B2. Data sources

Use only public or illustrative data. No personal data or real bills during the hackathon. Full details,
including the exact queries and limits, are in `docs/build-spec.md` section 4.

| Layer | Source | Use | Status |
|---|---|---|---|
| Building footprints | OpenStreetMap (Overpass); City of Hamilton open data where better | Shapes and areas | [Verify] the City layer |
| Floors or height | OpenStreetMap `building:levels` and `height`; City data | Floor area = footprint × floors | [Verify] |
| Building type | OpenStreetMap tags; City zoning or parcel data | Archetype | [Verify] |
| Year built | City heritage inventory, OpenStreetMap, or "Not in source data" (MPAC is licensed) | Age factor and timing | Unknown stays unknown |
| Energy intensity, large private buildings | Ontario EWRB data (data.ontario.ca, OGL-Ontario; yearly XLSX files plus a data dictionary) | Checked estimate: calibration by type | The public files have **no street address**: only city, the first 3 postal characters and an EWRB ID, and totals are withheld. Use them to calibrate intensity medians by property type for Hamilton (City = Hamilton: L8\* plus L9A, L9B, L9C, L9G, L9H and L9K). **Never mark a single building Actual from EWRB.** |
| Actual energy, public sector | "Energy use and greenhouse gas emissions for the Broader Public Sector" (data.ontario.ca; reported under O. Reg. 25/23, formerly 397/11) | Actual: hospitals, schools, City buildings | [Verify] that the files include facility name and address |
| Heating intensity by type | NRCan Comprehensive Energy Use Database (CEUD) | Estimate only: starting values | Calibrate against EWRB medians (B5.1) |
| Weather | ECCC Hamilton heating degree days | Shown in Method | Public |
| Gas price | Enbridge Gas rate schedule (Union South rate zone, OEB-approved) | Gas option and HCE parity rate | Build the all-in price from **one** gas-supply charge plus transportation, delivery and the monthly fixed charge. [Verify] |
| Electricity price | OEB / IESO, Global Adjustment | Heat-pump option | ~$0.15/kWh all-in [Est]. [Verify] per customer class |
| Grid CO2 | ECCC and TAF/IESO year-by-year factors; Climatiq at build time | Heat-pump CO2 | B5.5 table. [Verify] against the published tables |
| Commitments | HCE study PDFs (summary, full report, overview), the City's CEEP, HCE and FVB pages | Evidence record | Exact excerpts with page numbers; human-checked |
| HCE network | Public HCE and FVB descriptions; plant at 79 Bay St N | Operating connections; distance to the existing network | Label "approximate" |
| Planned route | Traced by hand from the study's route figure | Distance to the planned route | Label "approximate, from the study figure"; never drawn as a pipe |
| Heat sources | Dofasco, Air Liquide; data centres (21 King St W, 100 King St W) | Facilities | Public locations |
| Permits | City of Hamilton building permits or development applications | Timing factor; alerts later | [Verify] |
| Basemap | A Protomaps extract of OpenStreetMap, served locally | Background, offline | Credit OSM (ODbL) and Protomaps |

If a building has no year built or heating type, it shows "Not in source data". No value is invented; the fit score
treats it as unknown (B5.4).

## B3. Architecture

`docs/build-spec.md` section 3 is the contract. In short:

- A **Python pipeline** turns open data, the study PDFs and Climatiq factors into static files.
- A **Vite + React + TypeScript** app shows them, with MapLibre and deck.gl for the 3D map.
- The cost and fit engine is plain TypeScript in the browser, so assumption changes are instant.
- There is no backend. It runs offline from a laptop on 127.0.0.1.

## B4. Data model

The full contract is in `docs/build-spec.md` section 7. It extends the handoff's `data-contract.ts` without renaming
anything.

| Object | Key fields |
|---|---|
| Facility | name, kind, position (and how precise), commitments |
| Commitment | topic, title, summary, status in words, source (exact excerpt, page, document date, retrieval date, URL, human check), question |
| HeatConnection | facility → recipient, kind (operational / proposed / scenario), phase, evidence ids |
| Recipient | name, address, type, floor area, year built, owner type, heating system, `boilerYearsLeft` (12 assumed when unknown), estimate (annual MWh, building peak kW, network kW, quality, method), distances (existing, planned, quality), fit (band, score, reasons, missing), rank, sources, last verified, synthetic flag |
| CostComparison | gas / heat pump / HCE: annual, upfront, replacement, 20-year PV, levelized, t CO2 a year, grid kW; the HCE rate; the verdict |

Archetypes: `office`, `hospital`, `multi_res`, `retail`, `school`, `hotel`, `civic`, `mixed`.

## B5. The maths

All defaults are starting values [Est]. Calibrate them and show their sources in the app.

### B5.1 Annual heat demand

```text
annual_heat_mwh = floor_area_m2 × intensity_kwh_per_m2[type] × age_factor[year_built] / 1000
```

**Starting heating intensities** (space heating plus hot water only, not whole-building energy use). Before the demo,
replace each with the **median of actual EWRB buildings of the same type**.

| Type | Start value (kWh/m²/yr) | Basis |
|---|---|---|
| Office | 190 | CEUD Ontario space + water heating |
| Multi-residential | 185 | [Est] about 50 % of CEUD whole-building intensity |
| Retail | 180 | [Est] CEUD tables suggest higher figures that may include ventilation; calibrate |
| School | 170 | [Est] same caveat |
| Hotel | 180 | [Est] about 50 % of CEUD whole-building intensity |
| Civic / arena | 200 | [Est] |
| Hospital | 350 | [Est] heating portion of a high whole-building intensity |
| Mixed | 185 | [Est] an even office/retail blend; heating share 0.5 |

**Age factor:** before 1960 → 1.2 · 1960 to 1979 → 1.1 · 1980 to 1999 → 1.0 · 2000 to 2014 → 0.85 · 2015 and later →
0.7 · unknown → 1.0.

**Where a building's own gas use is reported (BPS data under O. Reg. 25/23):**

```text
annual_heat_mwh = gas_m3 × 10.36 kWh/m³ × 0.85 / 1000
```

- That building is marked **Actual**.
- Report the median actual-to-estimate ratio for each type in Method as a check; do not apply it. Types whose
  intensity comes from an EWRB median are marked **Checked estimate**.
- EWRB data has no addresses, so it only calibrates the medians. It never makes a single building Actual.

### B5.2 Peak heat

```text
building peak:  peak_heat_kw = annual_heat_mwh × 1000 / 2,000 h      (fixed for the hackathon; HDD tuning is later)
network peak:   network_kw   = annual_heat_mwh × 1000 / 3,600 h      (study ratio 65,000 MWh ÷ 18 MW; includes diversity)
```

- The **building peak** sizes that building's equipment (boiler, heat pump, grid kW).
- The **network peak** is that building's contribution to HCE's plant. It is used for "MW connected", totals and the
  success fee.
- Never apply a diversity factor on top of the network peak.

### B5.3 Distance to pipe

- Use the shortest distance from the building's footprint to the network, computed in UTM 17N (EPSG:32617).
- Report distances to the existing network (known customers and the plant) and to the planned route separately, with
  a quality word: "known customer", "approximate route" or "illustrative route".

### B5.4 Fit (shown in words; score 0 to 100 behind it)

| Factor | Weight | Scoring |
|---|---|---|
| Size (annual MWh) | 30 | 0 below 300 MWh, 30 at 3,000 MWh or more, linear in between |
| Distance to pipe | 25 | 25 within 100 m, 0 at 600 m or more, linear in between |
| Heating system | 15 | hydronic 15 · unknown 7 · forced air 3 |
| Anchor or owner | 15 | hospital, school, university, civic or public owner 15 · other large (≥ 1,000 MWh) 8 · small 3 |
| Timing | 10 | active permit or site plan 10 · `boilerYearsLeft` ≤ 5 → 8 · building older than 25 years 6 · otherwise 2 |
| Data quality | 5 | actual 5 · checked 3 · estimate 1 |

- **Bands [Est]:** Strong fit at 70 or more · Possible fit at 45 to 69 · Weak fit below 45.
- The **reasons** are the top three factors, in plain sentences. Unknowns are listed as "Not in source data", never
  as strengths.
- A settings screen can later let HCE change the weights.

### B5.5 Cost comparison: three options over 20 years

**Inputs (assumptions panel; each with source and date):**

| Input | Default | Notes |
|---|---|---|
| Gas price | $0.32/m³ all-in | One Union South gas-supply charge plus transportation, delivery and fixed charges. [Verify] |
| Boiler efficiency | 0.85 | So 1 m³ of gas gives 8.8 kWh of heat |
| Consumer carbon charge | $0 | Removed 1 April 2025 |
| Facility carbon charge | as on the Enbridge bill | Enbridge's federal OBPS facility charge, small. [Verify] the current value. |
| Future carbon price (switch) | $0/t by default | $85/t adds about $18/MWh to gas heat |
| Electricity price | $0.15/kWh all-in | [Verify] per customer class |
| Heat-pump seasonal COP | 2.8 | Cold-climate ASHP; about 1.8 to 2.2 at −15 °C |
| Heat-pump capital cost | $1,800/kW of building peak + $150/kW for the electrical upgrade | |
| Boiler replacement | $250/kW of building peak, 25-year life | |
| Maintenance | gas 2 % of boiler capex a year · heat pump 3 % of HP capex · HCE 0 (in the rate) | |
| HCE rate | gas parity (formula below): about $48/MWh at defaults, about $66/MWh at $85/t carbon | The one price rule; slider ±10 % |
| HCE connection fee | $0 (toggle: charge it at boiler capex) | The study treats it as cost-neutral |
| Discount rate (r) | 5 % | |
| Gas CO2 | 1.9 kg/m³ | Canada's inventory uses about 1.95; this is a conservative rounding |
| Grid CO2 | year-by-year table below | 2026 default 0.070 t/MWh |
| HCE CO2 | 20 % of the gas option | The study's −80 % |

**Grid CO2 factors (t CO2e per MWh) [Verify against the published tables]:**

| Year | ECCC reference | TAF/IESO forecast |
|---|---|---|
| 2025 | 0.084 | 0.075 |
| 2026 | 0.070 | 0.081 |
| 2027 | 0.085 | 0.124 |
| 2030 | 0.055 | 0.106 |
| 2035 | 0.029 | n/a |

- Use ECCC as the default, and TAF as a "conservative" option that avoids understating heat-pump emissions.
- The year-to-year swings come from the published tables, not from our model.
- Climatiq can supply a single inventory-year factor at build time; it is shown as such.

**Formulas.** Q is annual heat in MWh. P is the building peak in kW. CRF is the capital recovery factor for 25
years at 5 %, which is 0.0710.

```text
GAS PARITY RATE (per MWh)
   fuel   = gas_price / (10.36 × 0.85) × 1000                 ≈ $36.3
   capex  = 250 × (1000 / 2000) × CRF                         ≈ $8.9   (boiler replacement spread over its life)
   maint  = 0.02 × 250 × (1000 / 2000)                        ≈ $2.5
   carbon = carbon_price × 1.9 / 1000 / (10.36 × 0.85) × 1000  (0 by default; ≈ $18.3 at $85/t)
   hce_rate = (fuel + capex + maint + carbon) × (1 + rate_slider)   ≈ $47.7 at defaults

GAS       fuel_m3     = Q × 1000 / (10.36 × 0.85)
          annual      = fuel_m3 × (gas_price + carbon_price × 0.0019) + 0.02 × 250 × P
          replacement = 250 × P in year boiler_years_left (only if ≤ 20)
          upfront     = 0
          co2_t       = fuel_m3 × 1.9 / 1000
          grid_kw     ≈ 0

HEAT PUMP elec_mwh = Q / COP
          annual   = elec_mwh × 1000 × elec_price + 0.03 × hp_capex
          upfront  = hp_capex = (1800 + 150) × P
          co2_t    = elec_mwh × grid_factor[year]
          grid_kw  = P / 2.0                         (COP on a −18 °C design day)

HCE       annual   = Q × hce_rate
          upfront  = connection_fee (0 by default)
          co2_t    = 0.2 × gas co2_t
          grid_kw  ≈ 0 at the building (network load is handled at HCE's plant)

20-yr cost (PV)  = upfront + Σ_{t=1..20} annual / (1+r)^t + replacement / (1+r)^boiler_years_left
levelized $/MWh  = 20-yr cost (PV) ÷ Σ_{t=1..20} Q / (1+r)^t          (Σ 1/(1.05)^t over 20 years = 12.46)
```

**Display:**

- the verdict in one sentence, built from the numbers. For example: "About the same cost as gas over 20 years
  (+7 %). About 80 % less CO2 than gas, and about 0 kW of added grid load against about 980 kW for an own heat pump."
  The heat-pump figure is P / 2.0, which is 975 kW for the office test case below.
- a table: 20-year cost, levelized cost per MWh, upfront cost, t CO2 a year and grid kW for each option
- in the brief, a zero-based bar chart of the 20-year cost
- when a heat pump emits less than HCE at the current grid factor, one more computed line says so, with its grid load
  and upfront cost. Never write "lowest carbon" for HCE.

**Unit test (hand-checked).** Office, Q = 3,900 MWh, P = 1,950 kW, defaults, `boiler_years_left` = 12:

| Option | Annual | Upfront | Replacement |
|---|---|---|---|
| Gas | 442,900 m³ × $0.32 + $9,750 ≈ $151,500 | | $487,500 in year 12 |
| HCE | 3,900 × $47.7 ≈ $186,000 | $0 | |

- The two 20-year present values should land within about 10 % of each other: gas about $2.16M, HCE about $2.32M,
  a 7.4 % gap. Gas parity spreads the boiler over its full life, while the 20-year window catches only one
  replacement. If they do not, the code has a bug.
- The exact expected values for every option, the $85/t case and the edge cases are in `docs/build-spec.md`
  section 8.5.

### B5.6 Totals ("Together")

For the top 5, or for the buildings on a user's shortlist, show:

- total MWh
- network MW (the sum of each building's network peak)
- CO2 avoided against gas
- HCE revenue = Σ Q × hce_rate

## B6. Recipient brief layout (one page, US Letter)

1. **Header:** the ThermoStat wordmark, "Recipient brief / scenario", an "HCE logo" placeholder, and "Prepared for
   Hamilton Community Enterprises (HCE). An independent student project, not produced or endorsed by HCE."
2. **Title:** building name and address, type, data-quality word, data date.
3. **Verdict:** the one-sentence verdict, and one question worth asking (for example, when the boiler is due).
4. **Chart:** 20-year cost for the three options.
5. **Table:** annual cost, upfront cost, levelized cost per MWh, CO2 and grid kW.
6. **Locator:** a schematic inset of the building and the nearest network element, with "not a pipe route".
7. **Why it fits** and **heat demand:** the fit in words with its reasons, the estimate and its method.
8. **What this means:** three short computed bullets.
9. **Assumptions and sources:** prices with dates, intensity, grid-factor year, the gas-parity rule, which values are
   estimates, and the study citations with page numbers.
10. **Next step:** "For an exact version, the building owner would share 12 months of gas bills directly with HCE
    under a data-sharing agreement. This tool does not collect bills."
11. **Review line:** the team member who checked the numbers.
12. **Footer:** "Estimates, not a quote." Team credit.

## B7. Hackathon schedule (about 30 hours)

| Block | Hours | Tasks | Owner |
|---|---|---|---|
| 0. Prep | before the event | Probe and download every B2 source; cache the study PDFs; trace the route into GeoJSON; build `mock.py`; finish Appendix C | All |
| 1. Data pipeline | 0 to 8 | Clip footprints to the corridor, join type, floors and BPS/EWRB data, estimate MWh and kW, compute distances and fit, export | Data lead |
| 2. Evidence | 2 to 10 | Extract the study and CEEP excerpts with page numbers; a person checks each one against the original | Data lead + one reviewer |
| 3. Map and panels | 0 to 12 | MapLibre + deck.gl map, facilities and connections, rail, facility and recipient cards, evidence record | Front-end lead |
| 4. Cost engine | 6 to 14 | Port B5.5 to TypeScript, pass the B5.5 unit test plus the spec's other cases, build the assumptions panel | Logic lead |
| 5. Brief | 12 to 18 | The print template and the one-page check | Front-end lead |
| 6. Records, Method, notes, demo mode | 16 to 22 | The readable list views, field notes and shortlist, the guided tour | Logic lead |
| 7. Polish | 22 to 27 | Source labels, illustrative labels, offline check, phone layout, projector test | All |
| 8. Pitch | 27 to 30 | Slides and the 3-minute script, rehearsed three times | All |

**Minimum viable demo:** the map, a facility record with one real excerpt, a recipient card with the cost
comparison, and the brief, for 30 buildings. Drop the notes, Records and permits first.

**Fallback:** if any B2 download fails, run `mock.py` to generate 100 corridor buildings labelled "Illustrative".

**Go/no-go checklist (morning of the demo):**

- projector tested at 1080p
- offline tile bundle present; network off, everything still loads
- the three hand-checked buildings printed on one page
- the brief printed once in the venue's browser
- every assumption control moved once
- all illustrative data labelled
- every excerpt shown in the demo checked against its page
- one full cold-start rehearsal in under 4 minutes

## B8. Demo script (3 minutes)

1. **Promises (30 s).** "Hamilton plans to pipe industrial waste heat to Hamilton General, then downtown: 143,000 MWh
   a year when fully built. Here is that promise in the study's own words, on its own page. And here is a data
   centre downtown: no public record says whether its heat is reused. That is an open question, not an accusation."
2. **The gap (20 s).** "HCE's own study says the next step is getting customers to commit, and that clients may not
   accept a generic cost comparison."
3. **Who to approach (50 s).** Switch to Recipients to approach and click an anchor building. Show its fit in words
   and its reasons, then the three-option comparison: about the same cost as gas, about 80 % less CO2, about 0 kW of
   grid load against a heat pump's. Switch the carbon price to $85/t, and the numbers update live.
4. **Brief (20 s).** "This goes to the building manager, with every assumption and source on the page."
5. **Together (20 s).** "Connecting these 5 buildings adds about X MWh, Y MW and $Z a year for HCE."
6. **Business (20 s).** "HCE is our customer. A pilot at $10k to $20k, then a subscription plus a success fee. In
   our scenario, 5 MW connected is worth about $0.9 to $1.2M a year to HCE. Our fee is a few per cent of that. The
   evidence record stays public."
7. **Close (20 s).** "Every promise has a place. ThermoStat shows where, and who could make the next one."

The guided demo mode (`#demo`, 7 steps) is defined in `docs/build-spec.md` section 12: downtown plant → the study's
promise → recipient → cost → $85/t → Together → a data centre's open question. This script is spoken around it: say
beat 1's data-centre line at demo step 7, and open the brief (beat 4) by hand after step 5 with the card's "Get the
recipient brief" button, then "Back to the map" and continue. Captions are computed from the data.

## B9. Ethics, privacy and honesty

- Use public and illustrative data only. No real bills or personal information during the hackathon.
- Label every estimate. Never present one as a quote.
- Do not imply HCE endorses the project unless it has agreed. Write "prepared for" and use a logo placeholder.
- Label the route and network geometry as approximate. An arc is not a pipe route.
- **Quote exactly**, with page numbers, at most 60 words per excerpt, and have a person check each one.
- A missing record is not non-compliance. Unknown values stay unknown, never zero.
- Notes are private leads, kept in the user's browser. They are never published or treated as evidence.
- No compliance pills or completeness scores; colour is never the only signal.
- Emission factors from Climatiq are fetched at build time with quantities only; no building identity leaves the
  team's machine.
- Respect dataset licences (OGL-Ontario, OGL-Canada, City of Hamilton, ODbL for OpenStreetMap and the Protomaps
  basemap) and credit each one in the app.
- Use MPAC data only within its licence terms.
- A human reviews every brief before it reaches a building owner. Generated verdicts are drafts, not quotes.

## B10. Roadmap (one slide, not built)

- Supply-side layer: hour-by-hour waste-heat availability and storage dispatch, including the data-centre "judge"
  (NetAccess and others).
- Affordability layer: prioritise social housing near the route.
- Bill upload with owner consent, which turns Estimate-only buildings into Actual ones.
- Synced field notes through the backend owner's Backboard integration (the `NotesStore` seam is ready).
- Permit and site-plan alerts; box-select totals.
- Other utilities: Enwave, Markham District Energy, London District Energy and more.

---

# Appendix A: Key numbers and sources

| Number | Value | Source |
|---|---|---|
| Phases 1 and 2 | 65,000 MWh a year, 18 MW peak | [Study] summary report |
| Full build-out | 143,000 MWh a year, 51 MW peak, more than 27,000 t CO2e a year avoided (−80 %) | [Study] summary report |
| New network's buildings | 1.5M sq ft (Phase 1) → 10.5M sq ft (Phase 5) | [Study] full report |
| Waste-heat supply potential | about 80M sq ft could be heated | Hamilton Chamber of Commerce, 2021 (cited in the study) |
| Plant equipment | 3 × 10 MW heat pumps, 1.7 MW electric boiler, 2 × 13 MW gas boilers, 6.1 ML storage | [Study] summary report |
| 30-year heat sales (downtown node, early model) | $504M to $529M | [Study] full report, Milestone 3 |
| Unlevered IRR | 11.5 % (Air Liquide) / 14.3 % (Dofasco) | [Study] |
| Phase 1 and 2 capital cost | 32 % above the conceptual estimate | [Study] summary report |
| Study budget and funders | $510k; The Atmospheric Fund and FCM | [Study] summary report |
| Gas-parity heat rate | about $48/MWh (about $66 at $85/t carbon) | [Est] B5.5 |
| Value of 5 MW connected | about $0.9 to $1.2M a year | [Est] A2 |
| greenventory, Mühlacker | about €68k | Mühlacker Tagblatt |
| Germany BEW grant | up to 40 % of eligible investment | BEW programme |
| EWRB coverage | ≥100,000 sq ft; ≥50,000 sq ft from the 2023 reporting year | Ontario EWRB |
| Consumer carbon charge | $0 from 1 April 2025 | Federal government |

# Appendix B: Questions for HCE (validation, not sales)

1. How many buildings have committed to the waste-heat network so far, and what is the hardest part of getting a
   signature?
2. Did the business case use measured building consumption or benchmarks?
3. Is there a digital (GIS) version of the planned route and the existing network?
4. Who at HCE would use a recipients list and briefs: business development, engineering or communications?
5. Would a 6-month pilot on the Phase 1 and 2 corridor be useful? What result would make it worth paying for?
6. Does HCE hold an MPAC licence, and does it allow use inside a vendor's tool?
7. What heat rate would a new customer actually be quoted, and does it match our gas-parity rule (fuel, maintenance,
   boiler replacement, carbon)?
8. Which customer or supplier commitments could be shown publicly, and which must stay private until signed?

# Appendix C: Verify before the demo

| Item | Why it matters | Owner |
|---|---|---|
| EWRB data dictionary: which intensity columns exist (no addresses are published) | Calibration by type | Data lead |
| BPS (O. Reg. 25/23) dataset fields and years | Actual coverage for hospitals and schools | Data lead |
| Which footprint source covers downtown best | Building shapes and areas | Data lead |
| Enbridge Union South all-in gas price (one supply charge plus delivery and fixed charges) and the facility carbon charge | Gas option and HCE rate | Logic lead |
| OEB electricity price for the relevant customer class | Heat-pump option | Logic lead |
| ECCC and TAF grid CO2 tables | Heat-pump CO2 | Logic lead |
| Heating intensities calibrated to EWRB medians | Every estimate | Data lead |
| Every excerpt checked against its page in the original PDF | The evidence record's credibility | One reviewer (not the extractor) |
| The planned route traced from the study figure | Distances and fit | Data lead |
| Facility positions (recovery plant, Dofasco, Air Liquide), operator names, HCE's customer list | Map and operating connections | Front-end lead |
| City of Hamilton permit open data | Timing factor | Front-end lead |
| MPAC licence scope | Whether MPAC can be used at all | BD lead (whole team confirms) |
| `mock.py` built and labelled | Offline insurance if any B2 source fails | Data lead |
| B5.5 unit test plus the spec's other hand-checked cases | Cost-engine correctness | Logic lead |
| Go/no-go checklist rehearsed once | The demo cannot fail on stage | All |

*End of file. Version 7, 31 October 2026. Prepared for McMaster P2P Hacks. Not a quote. HCE logo placeholder.*

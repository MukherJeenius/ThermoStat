# ThermoStat

A map of Hamilton's waste-heat promises and prospects (McMaster P2P Hacks 2026, sustainability and society).

- **Every promise has a place.** Facilities (ArcelorMittal Dofasco, Air Liquide, HCE's proposed recovery plant, HCE's
  downtown plant at 79 Bay St N, the data centres at 21 and 100 King St W) and the commitments made about them, in
  the documents' own words, with page numbers and dates. Unknowns stay unknown.
- **Who should HCE connect first, and why it is worth it.** Ranked recipient buildings near the network, their fit in
  words, gas vs an own heat pump vs HCE over 20 years, and a one-page Recipient brief.

Prepared for Hamilton Community Enterprises (HCE). An independent student project, not produced or endorsed by HCE.

## Run it

Node 22.12 or newer (`.nvmrc`: 26) and Python 3.11 to 3.14.

```bash
npm install
npm run dev          # http://127.0.0.1:5173
```

Production build, served locally and fully offline:

```bash
npm run build
npm run preview      # http://127.0.0.1:4173
```

Checks:

```bash
npm run check        # typecheck, lint, unit tests, contrast
npm run check:print  # with `npm run preview` running: every brief prints on one US Letter page
(cd pipeline && make venv && .venv/bin/python -m pytest -q)
```

## Data

`public/data/` is produced by the Python pipeline in `pipeline/` (see `pipeline/README.md`):

```bash
cd pipeline
make venv
make data            # downloads into pipeline/raw/ once, then builds public/data/
make data OFFLINE=1  # rebuild from the cached downloads only
```

Emission factors use ECCC (default) and TAF tables. Climatiq is optional: put `CLIMATIQ_API_KEY=…` in
`pipeline/.env` (never committed) and rerun `make data`.

## Documents

- `docs/build-spec.md`: the engineering contract.
- `docs/plan.md`: the product plan, figures and formulas.
- `docs/decisions.md`: dated decisions and deviations.
- `docs/build-notes.md`: dataset facts, positions used and how to run.
- `design/handoff/`: the team's visual direction (from `ThermoStat-Frontend-Handoff.zip`).

## Sources and licences

- © OpenStreetMap contributors (ODbL). Basemap: Protomaps, © OpenStreetMap contributors.
- Contains information licensed under the Open Government Licence – Ontario (Broader Public Sector energy reports;
  large-building energy and water reports).
- Contains information licensed under the Open Government Licence – Canada.
- Excerpts from Hamilton Community Enterprises reports and City of Hamilton documents, quoted for review, with page
  references.
- Fonts: Inter and Literata, SIL Open Font License.
- Derived and modified by the ThermoStat team.

Estimates, not a quote. Every brief is reviewed by a person on the team before it reaches anyone.

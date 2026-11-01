# ThermoStat pipeline. Run from pipeline/. Every step is `.venv/bin/python -m steps.<file stem>`.
PY := .venv/bin/python
OFFLINE ?= 0
export OFFLINE

.PHONY: venv probe fetch buildings actuals estimate factors places score evidence export data mock tiles test

venv:
	python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

probe:
	$(PY) -m steps.00_probe

fetch:
	$(PY) -m steps.01_fetch

buildings:
	$(PY) -m steps.02_buildings

actuals:
	$(PY) -m steps.03_match_actuals

estimate:
	$(PY) -m steps.04_estimate

factors:
	$(PY) -m steps.05_factors

places:
	$(PY) -m steps.06_places

score:
	$(PY) -m steps.07_score

evidence:
	$(PY) -m steps.08_evidence

export:
	$(PY) -m steps.09_export

mock:
	$(PY) -m steps.mock

tiles:
	$(PY) -m steps.tiles

# make data OFFLINE=1 rebuilds every output from raw/, the Climatiq lock and the geocode cache with no network.
ifeq ($(OFFLINE),1)
data: buildings actuals estimate factors places score evidence export
else
data: fetch buildings actuals estimate factors places score evidence export
endif

test:
	$(PY) -m pytest -q

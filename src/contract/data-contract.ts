/** ThermoStat data contract. Extends design/handoff/code/data-contract.ts; handoff names are unchanged.
 *  Timestamps and dates are ISO 8601. Unknown values are null, never 0 or ''. */

export type Position = readonly [longitude: number, latitude: number];
export type EvidenceStatus = 'proposed' | 'required' | 'reported' | 'verified' | 'unknown';

export interface SourceRecord {
  id: string;
  title: string;
  url: string; // the original HTTPS document; never a guessed or generated link
  documentDate: string | null;
  retrievedAt: string;
  page: string | null; // printed page label, else "PDF p. N"; null for HTML
  excerpt: string; // exact passage, ≤ 60 words
  synthetic: boolean;
  // added
  shortTitle: string; // e.g. "Energy Harvesting Study, Summary" (from sources.yml)
  publisher: string | null; // e.g. "Hamilton Community Enterprises", "City of Hamilton"
  docKind: 'pdf' | 'html' | 'dataset';
  pdfPageIndex: number | null; // 1-based physical page
  excerptNormalisation: 'none' | 'whitespace' | 'whitespace+hyphenation' | 'whitespace+hyphenation+ligatures';
  sha256: string | null; // of the cached document
  licence: string | null;
  humanCheck: { checkedBy: string; checkedOn: string } | null; // null = not yet checked by a person
}

export type CommitmentTopic = 'heat' | 'water' | 'noise' | 'energy' | 'emissions'; // added: 'emissions'

export interface Commitment {
  id: string;
  topic: CommitmentTopic;
  title: string;
  summary: string; // the team's plain words, ≤ 90 characters, never in quotation marks
  status: EvidenceStatus;
  source: SourceRecord | null;
  question: string | null;
  // added
  interpretation: string | null; // null = the default line for the status (2.2)
  holder: string | null; // who made the statement, e.g. "HCE (Energy Harvesting Study)"
}

export type FacilityKind = 'industrial_source' | 'energy_plant' | 'data_centre';
export type PositionQuality = 'address' | 'approximate' | 'illustrative';

export interface Facility {
  id: string;
  name: string;
  locality: string;
  position: Position;
  synthetic: boolean;
  commitments: Commitment[];
  // added
  kind: FacilityKind;
  operator: string | null;
  address: string | null;
  positionQuality: PositionQuality;
  mapLabel: string; // ≤ 24 characters, from places.yml: 'Proposed recovery plant', 'HCE plant, 79 Bay St N'
}

export type ConnectionKind = 'scenario' | 'proposed' | 'operational';

export interface HeatConnection {
  id: string;
  facilityId: string;
  recipientName: string;
  source: Position;
  target: Position;
  kind: ConnectionKind;
  evidenceIds: string[];
  synthetic: boolean;
  // added
  recipientId: string | null; // Recipient.id for scenario links, else null
  phase: string | null; // e.g. "Phase 1" (study), else null
  targetQuality: PositionQuality;
}

export type RemoteState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

// ---- added: recipients (candidate buildings) ----

export type Archetype = 'office' | 'multi_res' | 'retail' | 'school' | 'hotel' | 'civic' | 'hospital' | 'mixed';
export type DataQuality = 'actual' | 'checked' | 'estimate'; // words: Actual · Checked estimate · Estimate only

export interface Estimate {
  annualHeatMwh: number; // > 0
  peakHeatKw: number; // round(annualHeatMwh × 1000 / 2000)
  networkKw: number; // round(annualHeatMwh × 1000 / 3600)
  quality: DataQuality;
  method: 'bps_actual' | 'archetype_calibrated' | 'archetype_start';
  intensityKwhM2: number | null;
  ageFactor: number | null;
  calibration: { n: number; medianKwhM2: number; year: number } | null;
  actual: { gasM3: number; year: number; bpsOperationId: string } | null;
  sourceIds: string[];
}

export interface Distances {
  existingM: number | null; // to the nearest known customer or the downtown plant; always 'known_customer'
  plannedM: number | null; // to the planned route line
  plannedQuality: 'approx_route' | 'illustrative_route' | null; // added
  minM: number | null;
  quality: 'known_customer' | 'approx_route' | 'illustrative_route'; // the quality of minM
}

export type FitBand = 'strong' | 'possible' | 'weak';

export interface FitAssessment {
  band: FitBand;
  score: number; // integer 0..100, shown small and secondary
  reasons: string[]; // 1 to 3 plain sentences
  missing: string[]; // e.g. ["heating system", "year built"]: "Not in source data"
  points: { size: number; distance: number; heating: number; anchor: number; timing: number; data: number };
}

export interface Recipient {
  id: string; // 'osm:way/123' | 'osm:relation/45' | 'ham:<id>' | 'demo:<n>'
  name: string | null; // null → "Unnamed building" + address
  address: string | null;
  type: Archetype;
  position: Position; // a label point inside the footprint
  floorAreaM2: number; // ≥ 400
  floorAreaMethod: 'levels' | 'height' | 'assumed_3_levels' | 'reported';
  heightM: number | null;
  yearBuilt: number | null;
  ownerType: 'public' | 'institutional' | 'private' | null;
  heatingSystem: 'hydronic' | 'forced_air' | null; // null = unknown
  boilerYearsLeft: number | null; // null → the engine assumes 12 and says "assumed"
  activePermit: boolean | null; // added: an active permit or site plan within 50 m; null = no permit data (4, row 18)
  estimate: Estimate;
  distances: Distances;
  fit: FitAssessment;
  rank: number | null; // 1..20 among recipients to approach, else null
  sourceIds: string[]; // ≥ 1
  lastVerified: string | null;
  synthetic: boolean;
}

/** Properties of every footprint in context-buildings.geojson (and the role of recipients.geojson features). */
export interface BuildingFootprint {
  id: string;
  heightM: number | null; // height tag, else levels × 3.5 m; null → drawn at 9 m, never labelled
  role: 'context' | 'recipient' | 'customer' | 'facility';
}
export type Building = Recipient; // alias, so either name reads naturally in components

// ---- added: assumptions, factors and engine results ----

export interface Assumption {
  value: number;
  unit: string;
  sourceId: string | null;
  date: string | null;
  verify: boolean;
}
export type PriceKey =
  | 'gasPriceM3'
  | 'boilerEff'
  | 'kwhPerM3'
  | 'elecPriceKwh'
  | 'hpCop'
  | 'hpCopDesign'
  | 'hpCapexKw'
  | 'elecUpgradeKw'
  | 'boilerCapexKw'
  | 'boilerLife'
  | 'maintGas'
  | 'maintHp'
  | 'discountRate'
  | 'carbonPriceT'
  | 'hceRateAdj'
  | 'connectionFeeOn'
  | 'fullLoadHoursBuilding'
  | 'fullLoadHoursNetwork'
  | 'hceCo2Share';
export type Prices = Record<PriceKey, Assumption>;
export type PriceValues = Record<PriceKey, number>; // what the engine takes

export interface FactorSet {
  id: 'eccc' | 'climatiq' | 'taf';
  gasKgPerM3: number;
  gridTPerMwh: Record<string, number> | null; // by year; null for a flat set
  gridTPerMwhFlat: number | null;
  label: string; // shown in the card and the brief
  isFallback: boolean;
}

export interface CostOption {
  annual: number;
  upfront: number;
  replacement: number;
  replacementPv: number;
  pv20: number;
  levelized: number;
  co2T: number;
  co2_20yT: number;
  gridKw: number;
}

export interface Verdict {
  band: 'about_the_same' | 'costs_more' | 'cheaper';
  deltaPct: number; // HCE pv20 vs gas pv20, in %
  co2CutPct: number; // HCE vs gas
  hceGridKw: number;
  hpGridKw: number;
  sentence: string; // built from the numbers above (8.4)
  heatPumpCaveat: string | null; // set when the heat pump emits less than HCE
}

export interface CostComparison {
  gas: CostOption;
  heatpump: CostOption;
  hce: CostOption;
  hceRate: number; // $/MWh: gas parity × (1 + hceRateAdj)
  verdict: Verdict;
  factorSetId: FactorSet['id'];
  factorYear: number;
  assumptions: 'sourced_defaults' | 'edited';
}

export interface Totals {
  count: number;
  annualMwh: number;
  networkMw: number;
  co2AvoidedT: number;
  hceRevenue: number;
}

// ---- added: file shapes, one per file in public/data/ (7.2); the schema is generated from these ----

export interface Feature<G, P> {
  type: 'Feature';
  id: string;
  geometry: G;
  properties: P;
}
export type Poly =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };
export type FacilitiesFile = Facility[];
export type ConnectionsFile = HeatConnection[];
export type SourcesFile = SourceRecord[];
export interface RecipientsFile {
  type: 'FeatureCollection';
  features: Feature<Poly, Recipient>[];
}
export interface ContextFile {
  type: 'FeatureCollection';
  features: Feature<Poly, BuildingFootprint>[];
}
export interface NetworkProps {
  role: 'plant' | 'customer' | 'route' | 'corridor'; // corridor = the 600 m study band (9.3 layer 2)
  name: string | null;
  quality: PositionQuality | 'known_customer' | 'approx_route' | 'illustrative_route';
}
export interface NetworkFile {
  type: 'FeatureCollection';
  features: Feature<
    { type: 'Point'; coordinates: number[] } | { type: 'LineString'; coordinates: number[][] } | Poly,
    NetworkProps
  >[];
}
export interface Place {
  name: string;
  kind: 'neighbourhood';
  position: Position;
}
export type PlacesFile = Place[];
export type PricesFile = Prices;
export interface FactorsFile {
  default: FactorSet['id'];
  sets: {
    eccc: FactorSet;
    taf: FactorSet;
    climatiq:
      | (FactorSet & { factorYear: number; dataVersion: string; selectors: Record<string, string>; retrieved: string })
      | null;
  };
  climatiqReason: string | null; // why sets.climatiq is null, e.g. "no API key"; null when it is present
}
export interface MetaFile {
  generatedAt: string;
  osmBase: string;
  protomapsBuild: string | null;
  frameBbox: [number, number, number, number];
  analysisBbox: [number, number, number, number];
  retrieved: Record<string, string>;
  counts: {
    buildings: number;
    recipients: number;
    byQuality: Record<DataQuality, number>;
    synthetic: number;
    facilities: number;
    connectionsByKind: Record<ConnectionKind, number>;
  };
  rampBreaksMwh: [number, number, number, number];
  calibration: {
    type: Archetype;
    n: number;
    medianKwhM2: number | null;
    used: boolean;
    column: string | null;
    year: number | null;
    bpsRatio: number | null;
  }[]; // bpsRatio: median BPS actual ÷ estimate, reported only
  evidence: { claims: number; found: number; unknown: number; humanChecked: number };
  defaultFacilityId: string;
  demoRecipientId: string;
}

/** No absence-of-record → non-compliance inference. Unknown numeric values use null, not zero.
 *  Dates, units and comparable definitions are required before comparison. Layer visibility, selection,
 *  notes and the shortlist are frontend state, not evidence. */

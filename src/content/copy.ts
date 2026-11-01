/** UI words and fixed strings, so the team can edit them in one place (spec 9.15). Figures never live here. */
import type { Archetype, ConnectionKind, DataQuality, EvidenceStatus, FacilityKind, FitBand } from '../contract/data-contract';

export const STATUS_WORD: Record<EvidenceStatus, string> = {
  proposed: 'Proposed',
  required: 'Required',
  reported: 'Reported',
  verified: 'Verified',
  unknown: 'Unknown',
};

export const STATUS_LINE: Record<EvidenceStatus, string> = {
  proposed: 'A plan or intention in a public document. Not yet a delivery.',
  required: 'A condition set by a rule, permit or approval.',
  reported: 'The holder says it is so. Not independently checked.',
  verified: 'Confirmed by an independent public record.',
  unknown: 'No public record found. This is an open question, not non-compliance.',
};

export const KIND_WORD: Record<ConnectionKind, string> = {
  operational: 'Operating connection',
  proposed: 'Proposed in HCE’s study',
  scenario: 'Team scenario',
};

export const FACILITY_KIND_WORD: Record<FacilityKind, string> = {
  energy_plant: 'Energy plant',
  industrial_source: 'Industrial heat source',
  data_centre: 'Data centre',
};

export const TYPE_WORD: Record<Archetype, string> = {
  office: 'Office',
  multi_res: 'Multi-residential',
  retail: 'Retail',
  school: 'School',
  hotel: 'Hotel',
  civic: 'Civic building',
  hospital: 'Hospital',
  mixed: 'Mixed use',
};

export const QUALITY_WORD: Record<DataQuality, string> = {
  actual: 'Actual',
  checked: 'Checked estimate',
  estimate: 'Estimate only',
};

export const METHOD_SENTENCE: Record<'bps_actual' | 'archetype_calibrated' | 'archetype_start', string> = {
  bps_actual: 'From this building’s reported gas use (Ontario public-sector energy reports).',
  archetype_calibrated: 'Floor area × a heating intensity calibrated to Hamilton large-building reports.',
  archetype_start: 'Floor area × a starting heating intensity for its type (team estimate).',
};

export const BAND_WORD: Record<FitBand, string> = { strong: 'Strong', possible: 'Possible', weak: 'Weak' };

export const COPY = {
  h1: 'ThermoStat: Hamilton’s waste-heat promises and prospects',
  wordmark: 'THERMOSTAT',
  subline: 'HAMILTON / FIELD NOTES',
  railKicker: 'THE LOCAL PICTURE',
  railTitle: 'Every promise has a place.',
  railIntro: 'Follow what was promised for Hamilton’s waste heat, who could use it, and the questions still open.',
  railFootnote: 'Public records. Estimates are labelled. Arcs are not pipe routes.',
  noSource: 'Source not available. This claim cannot currently be checked here.',
  notNonCompliance: 'Missing evidence is not non-compliance. It means this question is still open.',
  notChecked: 'Not yet checked against the original by a person',
  legendNote: 'Arcs join endpoints. They are not pipe routes.',
  notPipe: 'Not a pipe route',
  loading: 'Loading public records…',
  disclaimer: 'Prepared for Hamilton Community Enterprises (HCE). An independent student project, not produced or endorsed by HCE.',
  briefCta:
    'For an exact version, the building owner would share 12 months of gas bills directly with HCE under a data-sharing agreement. This tool does not collect bills.',
  unknownRoute: 'That record isn’t in this version.',
};

export function recipientQuestion(r: { boilerYearsLeft: number | null; heatingSystem: string | null }): string {
  if (r.boilerYearsLeft === null) return 'When is this building’s boiler due for replacement?';
  if (r.heatingSystem === null) return 'Does this building heat with hot water?';
  return 'Would the owner share 12 months of gas bills with HCE for an exact comparison?';
}

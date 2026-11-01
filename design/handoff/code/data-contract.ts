/** Suggested contract, not an existing API. All timestamps are ISO 8601. */
export type Position = readonly [longitude: number, latitude: number];
export type EvidenceStatus = 'proposed' | 'required' | 'reported' | 'verified' | 'unknown';
export interface SourceRecord {
  id: string;
  title: string;
  url: string; // Original HTTPS document, not an AI-generated link.
  documentDate: string | null;
  retrievedAt: string;
  page: string | null;
  excerpt: string; // Exact, human-checkable passage.
  synthetic: boolean;
}
export interface Commitment {
  id: string;
  topic: 'heat' | 'water' | 'noise' | 'energy';
  title: string;
  summary: string;
  status: EvidenceStatus;
  source: SourceRecord | null;
  question: string | null;
}
export interface Facility {
  id: string; name: string; locality: string; position: Position;
  synthetic: boolean; commitments: Commitment[];
}
export interface HeatConnection {
  id: string; facilityId: string; recipientName: string;
  source: Position; target: Position;
  kind: 'scenario' | 'proposed' | 'operational';
  evidenceIds: string[];
  synthetic: boolean;
}
export type RemoteState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };
/** No absence-of-record -> non-compliance inference. Unknown numeric values use null,
 * not zero. Dates, units and comparable definitions are required before comparison.
 * Layer visibility, selection and temporary notes are frontend state, not AI memory.
 */

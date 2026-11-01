/** Fetch, validate and normalise every file in public/data (spec 7.4). Components never fetch. */
import type {
  ConnectionsFile,
  ContextFile,
  FacilitiesFile,
  FactorsFile,
  MetaFile,
  NetworkFile,
  PlacesFile,
  Prices,
  RecipientsFile,
  SourcesFile,
} from '../contract/data-contract';
import { DEFAULT_FACTORS, DEFAULT_PRICES, FALLBACK_FACTOR_SET } from '../engine/defaults';
import { dataUrl } from './urls';
import { validateConnections, validateFacilities, validateRecipients } from './validate';

export interface AppData {
  facilities: FacilitiesFile;
  connections: ConnectionsFile;
  sources: SourcesFile;
  recipients: RecipientsFile;
  context: ContextFile | null;
  network: NetworkFile | null;
  places: PlacesFile;
  prices: Prices;
  factors: FactorsFile;
  meta: MetaFile | null;
  fallback: { prices: boolean; factors: boolean };
  skipped: number;
  failed: string[];
}

async function getJson<T>(file: string): Promise<T> {
  const r = await fetch(dataUrl(file), { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
  return (await r.json()) as T;
}

async function optional<T>(file: string, failed: string[], tick: () => void): Promise<T | null> {
  try {
    return await getJson<T>(file);
  } catch {
    failed.push(file);
    return null;
  } finally {
    tick();
  }
}

export const DATA_FILES = 10;

export async function loadAll(onProgress?: (done: number, total: number) => void): Promise<AppData> {
  const failed: string[] = [];
  let done = 0;
  const tick = () => onProgress?.(++done, DATA_FILES);
  const [facilities, connections, sources, recipients, context, network, places, prices, factors, meta] = await Promise.all([
    optional<FacilitiesFile>('facilities.json', failed, tick),
    optional<ConnectionsFile>('connections.json', failed, tick),
    optional<SourcesFile>('sources.json', failed, tick),
    optional<RecipientsFile>('recipients.geojson', failed, tick),
    optional<ContextFile>('context-buildings.geojson', failed, tick),
    optional<NetworkFile>('network.geojson', failed, tick),
    optional<PlacesFile>('places.json', failed, tick),
    optional<Prices>('prices.json', failed, tick),
    optional<FactorsFile>('factors.json', failed, tick),
    optional<MetaFile>('meta.json', failed, tick),
  ]);
  const f = validateFacilities(facilities ?? []);
  const c = validateConnections(connections ?? []);
  const r = validateRecipients(recipients?.features ?? []);
  return {
    facilities: f.items,
    connections: c.items,
    sources: sources ?? [],
    recipients: { type: 'FeatureCollection', features: r.items },
    context,
    network,
    places: places ?? [],
    prices: prices ?? DEFAULT_PRICES,
    factors: factors ?? { ...DEFAULT_FACTORS, sets: { ...DEFAULT_FACTORS.sets, eccc: FALLBACK_FACTOR_SET } },
    meta,
    fallback: { prices: !prices, factors: !factors },
    skipped: f.skipped + c.skipped + r.skipped,
    failed,
  };
}

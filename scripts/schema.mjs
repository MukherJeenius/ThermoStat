// JSON Schema (draft-07) for every file type in src/contract/data-contract.ts (spec 7.4).
// Writes pipeline/schema/<file>.schema.json; pytest validates the pipeline's exports against them.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator } from 'ts-json-schema-generator';

const root = fileURLToPath(new URL('..', import.meta.url));
export const FILE_TYPES = {
  facilities: 'FacilitiesFile',
  connections: 'ConnectionsFile',
  sources: 'SourcesFile',
  recipients: 'RecipientsFile',
  'context-buildings': 'ContextFile',
  network: 'NetworkFile',
  places: 'PlacesFile',
  prices: 'PricesFile',
  factors: 'FactorsFile',
  meta: 'MetaFile',
};

export function generate() {
  const out = {};
  for (const [file, type] of Object.entries(FILE_TYPES)) {
    const gen = createGenerator({
      path: join(root, 'src/contract/data-contract.ts'),
      tsconfig: join(root, 'tsconfig.app.json'),
      type,
      expose: 'export',
      topRef: true,
      skipTypeCheck: true,
    });
    out[file] = JSON.stringify(gen.createSchema(type), null, 2) + '\n';
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = join(root, 'pipeline/schema');
  mkdirSync(dir, { recursive: true });
  for (const [file, text] of Object.entries(generate())) writeFileSync(join(dir, `${file}.schema.json`), text);
  console.log(`schema: ${Object.keys(FILE_TYPES).length} files in pipeline/schema/`);
}

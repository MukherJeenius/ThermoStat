// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FILE_TYPES, generate } from './schema.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('pipeline/schema is generated from the contract', () => {
  it('the committed copy is not stale (run npm run schema)', () => {
    const fresh = generate();
    for (const file of Object.keys(FILE_TYPES)) {
      const committed = readFileSync(join(root, 'pipeline/schema', `${file}.schema.json`), 'utf8');
      expect(committed, file).toBe(fresh[file]);
    }
  }, 60_000);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { buildDerivedEntries } from '../scripts/build-derived-entries.mjs';

const fixtureDir = join(process.cwd(), 'tmp', 'build-derived-entries');

test('buildDerivedEntries emits several hundred searchable knowledge records', () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(join(fixtureDir, 'generated'), { recursive: true });

  const outputFile = join(fixtureDir, 'generated', 'derived-entries.json');
  const { entries } = buildDerivedEntries({
    augmentCatalogFile: join(process.cwd(), 'data/generated/augment-catalog.json'),
    outputFile
  });

  assert.equal(entries.length >= 500, true);
  assert.equal(entries.some((entry) => entry.id === 'derived-jax-w-onhit'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-hextech-soul-augment-directory'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-hextech-soul-augment-rarity'), true);

  const payload = JSON.parse(readFileSync(outputFile, 'utf8'));
  assert.equal(payload.entries.length, entries.length);
});

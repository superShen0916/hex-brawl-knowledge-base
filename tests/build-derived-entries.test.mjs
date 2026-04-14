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

  assert.equal(entries.length >= 600, true);
  assert.equal(entries.some((entry) => entry.id === 'derived-jax-w-onhit'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-hextech-soul-augment-directory'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-hextech-soul-augment-rarity'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-upgrade-sheen-augment-effect'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-firebrand-augment-effect'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-twisted-fate-w-damage-classification'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-vi-e-damage-classification'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-kled-w-spell-effects'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-ivern-r-spell-effects'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-nocturne-passive-scaling-note'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-nautilus-passive-onhit'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-vampirism-augment-effect'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-jax-w-damage-classification'), true);
  assert.equal(entries.some((entry) => entry.id === 'derived-urgot-w-scaling-note'), true);

  const twistedFateEntry = entries.find((entry) => entry.id === 'derived-twisted-fate-w-damage-classification');
  assert.equal(
    twistedFateEntry.sources[0].url,
    'https://wiki.leagueoflegends.com/en-us/Twisted_Fate'
  );

  const payload = JSON.parse(readFileSync(outputFile, 'utf8'));
  assert.equal(payload.entries.length, entries.length);
});

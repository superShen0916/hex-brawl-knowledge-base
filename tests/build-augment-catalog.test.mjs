import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { buildAugmentCatalog } from '../scripts/build-augment-catalog.mjs';

const fixtureDir = join(process.cwd(), 'tmp', 'build-augment-catalog');

test('buildAugmentCatalog emits the full augment catalog with rarity counts', () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(join(fixtureDir, 'generated'), { recursive: true });

  const { catalog } = buildAugmentCatalog({
    sourceFile: join(process.cwd(), 'data', 'source', 'augments-26.3.txt'),
    outputFile: join(fixtureDir, 'generated', 'augment-catalog.json')
  });

  assert.equal(catalog.length, 195);

  const rarityCounts = catalog.reduce((acc, entry) => {
    acc[entry.rarity] = (acc[entry.rarity] ?? 0) + 1;
    return acc;
  }, {});

  assert.deepEqual(rarityCounts, {
    Prismatic: 65,
    Gold: 68,
    Silver: 62
  });

  const output = JSON.parse(
    readFileSync(join(fixtureDir, 'generated', 'augment-catalog.json'), 'utf8')
  );

  assert.equal(output.catalog.some((entry) => entry.name === 'Hextech Soul'), true);
  assert.equal(output.catalog.some((entry) => entry.name === 'Jeweled Gauntlet'), true);
});

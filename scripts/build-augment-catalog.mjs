import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseCatalog(input) {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const catalog = [];
  let currentRarity = '';

  for (const line of lines) {
    const rarityMatch = /^\[(.+)\]$/.exec(line);
    if (rarityMatch) {
      currentRarity = rarityMatch[1];
      continue;
    }

    if (!currentRarity) {
      throw new Error(`augment source is missing a rarity header before "${line}"`);
    }

    catalog.push({
      id: slugify(line),
      name: line,
      rarity: currentRarity,
      sourcePatch: '26.3+',
    });
  }

  return catalog;
}

export function buildAugmentCatalog({
  sourceFile = join(process.cwd(), 'data/source/augments-26.3.txt'),
  outputFile = join(process.cwd(), 'data/generated/augment-catalog.json'),
} = {}) {
  const input = readFileSync(sourceFile, 'utf8');
  const catalog = parseCatalog(input);

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(
    outputFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceFile,
        catalog,
      },
      null,
      2
    )
  );

  return { catalog };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { catalog } = buildAugmentCatalog();
  console.log(`Built augment catalog with ${catalog.length} entries.`);
}

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { extractTokens, normalizeQuestion } from './lib/normalize.mjs';
import { validateEntries } from './validate-data.mjs';

function collectTokens(entry) {
  const tokenSources = [
    entry.question,
    ...(entry.aliases ?? []),
    ...Object.values(entry.entities ?? {}).flat(),
  ];

  return [...new Set(tokenSources.flatMap(extractTokens))];
}

export function buildSearchIndex({
  entriesDir = join(process.cwd(), 'data/entries'),
  derivedEntriesFile = join(process.cwd(), 'data/generated/derived-entries.json'),
  outputFile = join(process.cwd(), 'data/generated/search-index.json'),
} = {}) {
  validateEntries({ entriesDir });
  const files = readdirSync(entriesDir).filter((file) => file.endsWith('.json'));

  const manualEntries = files.map((file) => {
    const entry = JSON.parse(readFileSync(join(entriesDir, file), 'utf8'));

    return {
      id: entry.id,
      kind: 'manual',
      question: entry.question,
      normalizedQuestion:
        entry.normalized_question ?? normalizeQuestion(entry.question),
      aliases: entry.aliases ?? [],
      answerShort: entry.answer_short,
      answerDetail: entry.answer_detail ?? '',
      confidence: entry.confidence ?? 0,
      status: entry.status ?? 'high_confidence',
      patchRange: entry.patch_range ?? '版本未知',
      conditions: entry.conditions ?? [],
      entities: entry.entities ?? {},
      sources: entry.sources ?? [],
      conflicts: entry.conflict_set ?? [],
      tokens: collectTokens(entry),
      sourceCount: (entry.sources ?? []).length,
    };
  });

  const derivedPayload = JSON.parse(readFileSync(derivedEntriesFile, 'utf8'));
  const derivedEntries = (derivedPayload.entries ?? []).map((entry) => ({
    id: entry.id,
    kind: 'derived',
    question: entry.question,
    normalizedQuestion:
      entry.normalized_question ?? normalizeQuestion(entry.question),
    aliases: entry.aliases ?? [],
    answerShort: entry.answer_short,
    answerDetail: entry.answer_detail ?? '',
    confidence: entry.confidence ?? 0,
    status: entry.status ?? 'high_confidence',
    patchRange: entry.patch_range ?? '版本未知',
    conditions: entry.conditions ?? [],
    entities: entry.entities ?? {},
    sources: entry.sources ?? [],
    conflicts: entry.conflict_set ?? [],
    tokens: collectTokens(entry),
    sourceCount: (entry.sources ?? []).length,
  }));

  const entries = [...manualEntries, ...derivedEntries];

  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(
    outputFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        entries,
      },
      null,
      2
    )
  );

  return { entries };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildSearchIndex();
}

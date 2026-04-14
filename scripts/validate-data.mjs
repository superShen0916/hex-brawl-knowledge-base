import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateEntry } from './lib/validate-entry.mjs';

export function validateEntries({
  entriesDir = join(process.cwd(), 'data/entries'),
} = {}) {
  const files = readdirSync(entriesDir).filter((file) => file.endsWith('.json'));
  const errors = [];

  for (const file of files) {
    const fullPath = join(entriesDir, file);
    const entry = JSON.parse(readFileSync(fullPath, 'utf8'));
    errors.push(...validateEntry(entry, file));
  }

  if (errors.length > 0) {
    const error = new Error(errors.join('\n'));
    error.validationErrors = errors;
    throw error;
  }

  return {
    entryCount: files.length,
    errors,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = validateEntries();
  console.log(`Validated ${summary.entryCount} entries.`);
}

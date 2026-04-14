import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rankEntries } from '../site/search.js';

test('generated search index exposes enough seed records for the homepage', () => {
  const payload = JSON.parse(readFileSync('data/generated/search-index.json', 'utf8'));
  assert.equal(payload.entries.length >= 10, true);

  const ranked = rankEntries('厄加特 W 攻击特效', payload.entries);
  assert.equal(ranked[0].id, 'urgot-w-onhit');
});

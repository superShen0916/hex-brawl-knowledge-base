import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTokens, normalizeQuestion } from '../scripts/lib/normalize.mjs';

test('normalizeQuestion merges common Hex Brawl aliases', () => {
  assert.equal(
    normalizeQuestion('螃蟹W 吃不吃 on-hit？'),
    '厄加特 w 触发 攻击特效'
  );
});

test('extractTokens keeps meaningful tokens for search recall', () => {
  assert.deepEqual(
    extractTokens('厄加特 W 能不能触发攻击特效'),
    ['厄加特', 'w', '触发', '攻击特效']
  );
});

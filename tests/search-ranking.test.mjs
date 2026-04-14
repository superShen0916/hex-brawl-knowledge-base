import test from 'node:test';
import assert from 'node:assert/strict';
import { rankEntries } from '../site/search.js';

const entries = [
  {
    id: 'urgot-w-onhit',
    question: '厄加特 W 能不能触发攻击特效',
    normalizedQuestion: '厄加特 w 触发 攻击特效',
    tokens: ['厄加特', 'w', '触发', '攻击特效'],
    confidence: 0.86,
  },
  {
    id: 'generic-onhit',
    question: '哪些技能会触发攻击特效',
    normalizedQuestion: '哪些 技能 触发 攻击特效',
    tokens: ['技能', '触发', '攻击特效'],
    confidence: 0.55,
  },
];

test('rankEntries prefers exact champion-skill matches over generic records', () => {
  const results = rankEntries('厄加特 W 攻击特效', entries);
  assert.equal(results[0].id, 'urgot-w-onhit');
});

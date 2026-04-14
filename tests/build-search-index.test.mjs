import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSearchIndex } from '../scripts/build-search-index.mjs';

const fixtureDir = join(process.cwd(), 'tmp', 'build-search-index');

test('buildSearchIndex emits ranked search data from entry JSON', () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(join(fixtureDir, 'entries'), { recursive: true });
  mkdirSync(join(fixtureDir, 'generated'), { recursive: true });

  writeFileSync(
    join(fixtureDir, 'entries', 'urgot-w-onhit.json'),
    JSON.stringify({
      id: 'urgot-w-onhit',
      question: '厄加特 W 能不能触发攻击特效',
      aliases: ['螃蟹 W 吃不吃 on-hit'],
      answer_short: '大多数情况下会触发攻击特效。',
      confidence: 0.86,
      status: 'high_confidence',
      patch_range: '26.7',
      entities: { champions: ['厄加特'], skills: ['W'], mechanics: ['攻击特效'] },
      sources: [],
    })
  );

  buildSearchIndex({
    entriesDir: join(fixtureDir, 'entries'),
    outputFile: join(fixtureDir, 'generated', 'search-index.json'),
  });

  const output = JSON.parse(
    readFileSync(join(fixtureDir, 'generated', 'search-index.json'), 'utf8')
  );

  assert.equal(output.entries.length, 1);
  assert.equal(output.entries[0].normalizedQuestion, '厄加特 w 触发 攻击特效');
  assert.equal(output.entries[0].tokens.includes('攻击特效'), true);
});

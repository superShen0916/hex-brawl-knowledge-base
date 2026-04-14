import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateEntries } from '../scripts/validate-data.mjs';

const fixtureDir = join(process.cwd(), 'tmp', 'validate-data');

test('validateEntries accepts well-formed knowledge entries', () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(fixtureDir, { recursive: true });

  writeFileSync(
    join(fixtureDir, 'valid-entry.json'),
    JSON.stringify({
      id: 'jax-w-onhit',
      question: '贾克斯 W 能不能触发攻击特效',
      aliases: ['jax w on-hit'],
      answer_short: '高置信结论：能。',
      answer_detail: 'Empower 属于会触发攻击特效和技能效果的强化普攻。',
      status: 'high_confidence',
      confidence: 0.84,
      patch_range: '通用机制',
      conditions: ['默认按当前通用机制理解。'],
      entities: {
        champions: ['贾克斯'],
        skills: ['W'],
        mechanics: ['攻击特效']
      },
      sources: [
        {
          source_type: 'wiki',
          title: 'Jax - League of Legends Wiki',
          url: 'https://wiki.leagueoflegends.com/en-us/Jax',
          publisher: 'League of Legends Wiki',
          retrieved_at: '2026-04-14',
          source_confidence: 0.82,
          evidence_summary: 'Empower 被列入会触发攻击特效与技能效果的技能集合。',
          patch_hint: '当前通用机制'
        }
      ]
    })
  );

  const result = validateEntries({ entriesDir: fixtureDir });
  assert.equal(result.entryCount, 1);
  assert.deepEqual(result.errors, []);
});

test('validateEntries rejects malformed entries with actionable errors', () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(fixtureDir, { recursive: true });

  writeFileSync(
    join(fixtureDir, 'broken-entry.json'),
    JSON.stringify({
      id: '',
      question: '这条数据有问题吗',
      aliases: [],
      answer_short: '',
      status: 'unknown',
      confidence: 2,
      patch_range: '',
      entities: {},
      sources: [
        {
          source_type: 'mystery',
          title: '',
          url: 'not-a-url',
          publisher: '',
          retrieved_at: '',
          source_confidence: 5,
          evidence_summary: '',
          patch_hint: ''
        }
      ]
    })
  );

  assert.throws(
    () => validateEntries({ entriesDir: fixtureDir }),
    /broken-entry\.json/
  );
});

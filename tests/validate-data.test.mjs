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

test('validateEntries accepts conflicted entries with structured conflict candidates', () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(fixtureDir, { recursive: true });

  writeFileSync(
    join(fixtureDir, 'conflicted-entry.json'),
    JSON.stringify({
      id: 'twisted-fate-w-conflict-shape',
      question: '崔斯特 W 算强化普攻还是技能伤害',
      aliases: ['卡牌 W 是平A还是技能'],
      answer_short: '当前记录为冲突词条：不同来源对载体和伤害身份的描述重点不同。',
      answer_detail: '这个测试只验证冲突词条的数据结构是否合格。',
      status: 'conflicted',
      confidence: 0.61,
      patch_range: '通用机制',
      conditions: ['测试条件'],
      entities: {
        champions: ['崔斯特'],
        skills: ['W'],
        mechanics: ['强化普攻', '技能伤害']
      },
      sources: [
        {
          source_type: 'wiki',
          title: 'Twisted Fate - League of Legends Wiki',
          url: 'https://wiki.leagueoflegends.com/en-us/Twisted_Fate',
          publisher: 'League of Legends Wiki',
          retrieved_at: '2026-04-14',
          source_confidence: 0.84,
          evidence_summary: 'Pick a Card 会强化下一次基础攻击。',
          patch_hint: '当前通用机制'
        }
      ],
      conflict_set: [
        {
          candidate_answer: '另一种说法：它更像强化普攻，因为载体是下一次基础攻击。',
          candidate_confidence: 0.52,
          why_it_differs: '分歧点在于有人更看重攻击载体，有人更看重伤害身份。',
          sources: [
            {
              source_type: 'forum',
              title: 'Community discussion',
              url: 'https://example.com/community-twisted-fate-discussion',
              publisher: 'Community',
              retrieved_at: '2026-04-14',
              source_confidence: 0.35,
              evidence_summary: '社区讨论更偏向按强化普攻理解。',
              patch_hint: '玩家讨论'
            }
          ]
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

test('validateEntries rejects malformed conflict_set candidates', () => {
  rmSync(fixtureDir, { recursive: true, force: true });
  mkdirSync(fixtureDir, { recursive: true });

  writeFileSync(
    join(fixtureDir, 'broken-conflict-entry.json'),
    JSON.stringify({
      id: 'broken-conflict-entry',
      question: '这条冲突数据有问题吗',
      aliases: [],
      answer_short: '测试冲突校验',
      answer_detail: '测试冲突校验',
      status: 'conflicted',
      confidence: 0.42,
      patch_range: '通用机制',
      conditions: [],
      entities: {},
      sources: [
        {
          source_type: 'wiki',
          title: 'Test Source',
          url: 'https://example.com/source',
          publisher: 'Example',
          retrieved_at: '2026-04-14',
          source_confidence: 0.7,
          evidence_summary: '测试来源',
          patch_hint: '测试'
        }
      ],
      conflict_set: [
        {
          candidate_answer: '',
          candidate_confidence: 3,
          why_it_differs: '',
          sources: []
        }
      ]
    })
  );

  assert.throws(
    () => validateEntries({ entriesDir: fixtureDir }),
    /conflict_set/
  );
});

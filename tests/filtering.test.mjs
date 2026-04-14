import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFilterSections, filterEntries, hasActiveFilters } from '../site/filters.js';

const entries = [
  {
    id: 'urgot-w-onhit',
    kind: 'manual',
    status: 'high_confidence',
    entities: {
      champions: ['厄加特'],
      mechanics: ['攻击特效'],
      augments: []
    }
  },
  {
    id: 'firebrand-augment-effect',
    kind: 'derived',
    status: 'high_confidence',
    entities: {
      champions: [],
      mechanics: ['灼烧'],
      augments: ['Firebrand']
    }
  },
  {
    id: 'twisted-fate-conflicted',
    kind: 'manual',
    status: 'conflicted',
    entities: {
      champions: ['崔斯特'],
      mechanics: ['技能伤害'],
      augments: []
    }
  },
  {
    id: 'vampirism-augment-effect',
    kind: 'derived',
    status: 'high_confidence',
    entities: {
      champions: [],
      mechanics: ['全能吸血'],
      augments: ['Vampirism']
    }
  }
];

test('filterEntries can narrow records by status kind and entity tags', () => {
  const filtered = filterEntries(entries, {
    status: 'high_confidence',
    kind: 'derived',
    champion: '',
    augment: 'Vampirism',
    mechanic: '全能吸血'
  });

  assert.deepEqual(filtered.map((entry) => entry.id), ['vampirism-augment-effect']);
});

test('buildFilterSections exposes conflict and entity options with counts', () => {
  const sections = buildFilterSections(entries);
  const statusSection = sections.find((section) => section.key === 'status');
  const championSection = sections.find((section) => section.key === 'champion');
  const augmentSection = sections.find((section) => section.key === 'augment');

  assert.equal(statusSection.options.some((option) => option.value === 'conflicted' && option.count === 1), true);
  assert.equal(championSection.options.some((option) => option.value === '厄加特' && option.count === 1), true);
  assert.equal(augmentSection.options.some((option) => option.value === 'Vampirism' && option.count === 1), true);
});

test('hasActiveFilters detects whether any chip is selected', () => {
  assert.equal(
    hasActiveFilters({
      status: '',
      kind: '',
      champion: '',
      augment: '',
      mechanic: ''
    }),
    false
  );

  assert.equal(
    hasActiveFilters({
      status: 'conflicted',
      kind: '',
      champion: '',
      augment: '',
      mechanic: ''
    }),
    true
  );
});

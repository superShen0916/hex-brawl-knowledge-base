import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { abilityMechanics } from '../data/source/ability-mechanics.mjs';
import { augmentDetails } from '../data/source/augment-details.mjs';
import { validateEntry } from './lib/validate-entry.mjs';

const attackEffectsSource = {
  source_type: 'wiki',
  title: 'Attack effects - League of Legends Wiki',
  url: 'https://wiki.leagueoflegends.com/en-us/Attack_effects',
  publisher: 'League of Legends Wiki',
  retrieved_at: '2026-04-14',
  source_confidence: 0.81,
  patch_hint: '当前通用机制'
};

const augmentCatalogSource = {
  source_type: 'guide',
  title: 'ARAM: Mayhem Augments - ARAM Mayhem',
  url: 'https://arammayhem.com/augments/',
  publisher: 'ARAM Mayhem',
  retrieved_at: '2026-04-14',
  source_confidence: 0.72,
  patch_hint: '26.3+'
};

function withSummary(source, evidence_summary) {
  return { ...source, evidence_summary };
}

function getAbilitySource(meta) {
  return meta.source ?? attackEffectsSource;
}

function getAbilityEvidence(meta, key, fallback) {
  return meta.evidence?.[key] ?? fallback;
}

function makeOnHitEntry(meta) {
  const aliasText = meta.aliases.slice(0, 2);
  const source = getAbilitySource(meta);
  return {
    id: `derived-${meta.key}-onhit`,
    question: `${meta.champion} ${meta.slot} 能不能触发攻击特效`,
    aliases: [
      `${meta.champion} ${meta.slot} 会不会触发攻击特效`,
      `${meta.champion} ${meta.slot} 吃不吃 on-hit`,
      ...aliasText.map((alias) => `${alias} ${meta.slot} on-hit`)
    ],
    answer_short: `高置信结论：能。${meta.champion} ${meta.slot}（${meta.skill}）被攻击特效规则页列为会施加 on-hit 的技能${meta.note ? `，并带有${meta.note}` : ''}。`,
    answer_detail: `${meta.champion} ${meta.slot}（${meta.skill}）可按“会施加攻击特效”的技能理解。${meta.onAttack ? '同时它也会触发 on-attack 类效果。' : ''}${meta.spellEffects ? '另外，规则页还把它列为会同时触发法术效果的混合技能。' : ''}${meta.note ? `当前公开规则页还补充了 ${meta.note}。` : ''}`,
    status: 'high_confidence',
    confidence: meta.spellEffects || meta.onAttack ? 0.84 : 0.8,
    patch_range: '当前通用机制',
    conditions: [
      '该结论来自公开规则页的技能分类，适合回答“能不能触发”。',
      '如果你关心的是具体收益高低，还要结合技能自身的命中次数和攻击特效效率判断。'
    ],
    entities: {
      champions: [meta.champion],
      skills: [meta.slot, meta.skill],
      mechanics: ['攻击特效', 'on-hit']
    },
    sources: [
      withSummary(
        source,
        getAbilityEvidence(
          meta,
          'onHit',
          `${meta.champion} 的 ${meta.skill} 被列在“Applying on-hit effects”或“同时触发 on-hit 与 spell effects”的技能清单中。`
        )
      )
    ]
  };
}

function makeOnAttackEntry(meta) {
  const source = getAbilitySource(meta);
  return {
    id: `derived-${meta.key}-onattack`,
    question: `${meta.champion} ${meta.slot} 会不会触发 on-attack 效果`,
    aliases: [
      `${meta.champion} ${meta.slot} 会不会触发攻击前触发类效果`,
      `${meta.champion} ${meta.slot} on-attack`,
      `${meta.champion} ${meta.slot} 触发 on-attack 吗`
    ],
    answer_short: `高置信结论：会。${meta.champion} ${meta.slot}（${meta.skill}）被规则页列为会触发 on-attack 的技能。`,
    answer_detail: `这类技能不只会在命中时结算 on-hit，还会走 on-attack 那条触发链路。判断海克斯或装备时，如果文本区分 on-hit 和 on-attack，${meta.champion} ${meta.slot} 需要两边分别看。${meta.note ? `当前规则页还补充了 ${meta.note}。` : ''}`,
    status: 'high_confidence',
    confidence: 0.82,
    patch_range: '当前通用机制',
    conditions: [
      '只回答是否触发 on-attack，不代表所有 on-attack 效果收益完全相同。',
      '若文本限制首个目标或首次命中，应优先按技能原文说明理解。'
    ],
    entities: {
      champions: [meta.champion],
      skills: [meta.slot, meta.skill],
      mechanics: ['on-attack', '攻击前触发']
    },
    sources: [
      withSummary(
        source,
        getAbilityEvidence(
          meta,
          'onAttack',
          `${meta.champion} 的 ${meta.skill} 被列在“Applying on-attack effects”技能清单中。`
        )
      )
    ]
  };
}

function makeSpellEffectsEntry(meta) {
  const source = getAbilitySource(meta);
  return {
    id: `derived-${meta.key}-spell-effects`,
    question: `${meta.champion} ${meta.slot} 会不会同时触发法术效果`,
    aliases: [
      `${meta.champion} ${meta.slot} 算不算混合法术效果`,
      `${meta.champion} ${meta.slot} 会不会触发 spell effects`,
      `${meta.champion} ${meta.slot} 是普攻还是技能`
    ],
    answer_short: `高置信结论：会。${meta.champion} ${meta.slot}（${meta.skill}）被规则页列为会同时施加攻击特效和法术效果的技能。`,
    answer_detail: `${meta.champion} ${meta.slot} 不适合被简单归成“纯普攻”或“纯技能”。规则页把它放进“同时触发 on-hit 与 spell effects”的混合技能集合，因此海克斯或装备如果分别判断攻击效果与法术效果，通常都要把这两条链路考虑进去。${meta.note ? `公开规则页还补充了 ${meta.note}。` : ''}`,
    status: 'high_confidence',
    confidence: 0.85,
    patch_range: '当前通用机制',
    conditions: [
      '这类结论更适合回答“会不会同时触发法术效果”。',
      '如果要判断某个效果是按普攻收益还是按技能收益结算，还要继续看单个效果文本。'
    ],
    entities: {
      champions: [meta.champion],
      skills: [meta.slot, meta.skill],
      mechanics: ['法术效果', 'spell effects', '攻击特效']
    },
    sources: [
      withSummary(
        source,
        getAbilityEvidence(
          meta,
          'spellEffects',
          `${meta.champion} 的 ${meta.skill} 被列在“同时触发 on-hit effects 与 spell effects”的技能清单中。`
        )
      )
    ]
  };
}

function getDamageClassification(meta) {
  if (meta.damageClassification) {
    return meta.damageClassification;
  }

  if (meta.spellEffects) {
    return 'non_ability_damage';
  }

  return null;
}

function makeDamageClassificationEntry(meta) {
  const classification = getDamageClassification(meta);
  if (!classification) {
    return null;
  }
  const source = getAbilitySource(meta);

  let answer_short = '';
  let answer_detail = '';

  if (classification === 'ability_damage') {
    answer_short = `高置信结论：算技能伤害。${meta.champion} ${meta.slot}（${meta.skill}）虽然会和攻击特效联动，但其伤害本体仍按技能伤害理解。`;
    answer_detail = `${meta.champion} ${meta.slot} 被规则页列在“会同时触发攻击特效和法术效果”的技能集合里，而且属于少数明确保留 ability damage 身份的例外。判断海克斯时，既要考虑它能带攻击特效，也要承认它本体仍是技能伤害。`;
  } else if (classification === 'mixed') {
    answer_short = `高置信结论：混合判定。${meta.champion} ${meta.slot}（${meta.skill}）会施加攻击特效，但其中技能伤害部分仍按技能伤害处理。`;
    answer_detail = `${meta.champion} ${meta.slot} 不是单纯的普攻复制体。规则页把它列在“会同时触发攻击特效和法术效果”的集合里，并特别提示其伤害中存在按技能伤害处理的部分，所以回答“到底算不算技能伤害”时更适合给出混合判定。`;
  } else {
    answer_short = `高置信结论：通常不算传统技能伤害。${meta.champion} ${meta.slot}（${meta.skill}）虽然会触发法术效果，但规则页说明这类技能的伤害本体通常不按 ability damage 归类。`;
    answer_detail = `${meta.champion} ${meta.slot} 属于“会同时触发攻击特效和法术效果”的混合技能。规则页特别说明，这一类技能大多不会把伤害本体记作 ability damage，因此玩家常说的“它算技能还是平A”更接近“强化攻击载体，而不是普通技能伤害”。`;
  }

  return {
    id: `derived-${meta.key}-damage-classification`,
    question: `${meta.champion} ${meta.slot} 算技能伤害吗`,
    aliases: [
      `${meta.champion} ${meta.slot} 是普攻还是技能`,
      `${meta.champion} ${meta.slot} 算不算 ability damage`,
      `${meta.champion} ${meta.slot} 伤害归类`
    ],
    answer_short,
    answer_detail,
    status: 'high_confidence',
    confidence: classification === 'mixed' ? 0.8 : 0.83,
    patch_range: '当前通用机制',
    conditions: [
      '这个结论解决的是伤害归类，不等于所有装备或海克斯收益都完全一致。',
      '如果海克斯文本同时区分攻击特效和技能伤害，需要两条链路一起判断。'
    ],
    entities: {
      champions: [meta.champion],
      skills: [meta.slot, meta.skill],
      mechanics: ['技能伤害', 'ability damage', '攻击特效']
    },
    sources: [
      withSummary(
        source,
        getAbilityEvidence(
          meta,
          'damageClassification',
          `${meta.champion} 的 ${meta.skill} 被列在“会同时触发 on-hit 与 spell effects”的集合里，规则页同时说明这类技能大多不按 ability damage 归类，并点名了少数例外。`
        )
      )
    ]
  };
}

function makeScalingNoteEntry(meta) {
  if (!meta.note) {
    return null;
  }
  const source = getAbilitySource(meta);

  return {
    id: `derived-${meta.key}-scaling-note`,
    question: `${meta.champion} ${meta.slot} 的攻击特效按多少比例结算`,
    aliases: [
      `${meta.champion} ${meta.slot} 攻击特效比例是多少`,
      `${meta.champion} ${meta.slot} on-hit 按多少算`,
      `${meta.champion} ${meta.slot} 特效效率`
    ],
    answer_short: `高置信结论：${meta.note}。${meta.champion} ${meta.slot}（${meta.skill}）不是按完整普攻 100% 等比结算。`,
    answer_detail: `${meta.champion} ${meta.slot} 的攻击特效联动需要特别看技能注记。公开规则页对该技能补充了“${meta.note}”这类说明，因此评价装备、海克斯或符文收益时，不能把它直接当作一次完整平A处理。`,
    status: 'high_confidence',
    confidence: 0.84,
    patch_range: '当前通用机制',
    conditions: [
      '该结论主要解释攻击特效比例，不替代具体伤害计算器。',
      '如果技能还有主目标 / 重复命中 / 首个目标等限制，需要和原技能逻辑一起看。'
    ],
    entities: {
      champions: [meta.champion],
      skills: [meta.slot, meta.skill],
      mechanics: ['攻击特效', '比例', '效率']
    },
    sources: [
      withSummary(
        source,
        getAbilityEvidence(
          meta,
          'scalingNote',
          `${meta.champion} 的 ${meta.skill} 在规则页里带有“${meta.note}”这类攻击特效效率说明。`
        )
      )
    ]
  };
}

function makeAugmentDirectoryEntry(augment) {
  return {
    id: `derived-${augment.id}-augment-directory`,
    question: `${augment.name} 是什么海克斯`,
    aliases: [
      `${augment.name} 几级海克斯`,
      `${augment.name} 是 ${augment.rarity} 还是别的`,
      `${augment.name} augment`
    ],
    answer_short: `目录信息：${augment.name} 是一个 ${augment.rarity} 海克斯，当前已纳入 ${augment.sourcePatch} 海克斯目录。`,
    answer_detail: `${augment.name} 当前在目录里记录为 ${augment.rarity} 海克斯。这个条目主要保证名称、稀有度和版本目录信息可搜索；更细的效果描述后续再继续补全。`,
    status: 'high_confidence',
    confidence: 0.78,
    patch_range: augment.sourcePatch,
    conditions: [
      '该条目当前属于目录型记录，优先用于按名称搜索和按稀有度过滤。',
      '如果需要具体效果说明，需要继续补详细海克斯词条。'
    ],
    entities: {
      augments: [augment.name],
      rarities: [augment.rarity],
      mechanics: ['海克斯']
    },
    sources: [
      withSummary(
        augmentCatalogSource,
        `${augment.name} 被 Augments 目录列为 ${augment.rarity} 海克斯。`
      )
    ]
  };
}

function makeAugmentRarityEntry(augment) {
  return {
    id: `derived-${augment.id}-augment-rarity`,
    question: `${augment.name} 是什么级别的海克斯`,
    aliases: [
      `${augment.name} 是银海克斯还是金海克斯`,
      `${augment.name} 是棱彩海克斯吗`,
      `${augment.name} 几级海克斯`
    ],
    answer_short: `目录信息：${augment.name} 属于 ${augment.rarity} 海克斯。`,
    answer_detail: `${augment.name} 在当前目录中被标记为 ${augment.rarity} 海克斯。这个条目适合回答“它属于银 / 金 / 棱彩哪一档”这类问题。`,
    status: 'high_confidence',
    confidence: 0.8,
    patch_range: augment.sourcePatch,
    conditions: [
      '该条目主要回答稀有度与档位，不直接解释完整效果。',
      '如果问题是具体效果，需要继续补效果型海克斯词条。'
    ],
    entities: {
      augments: [augment.name],
      rarities: [augment.rarity],
      mechanics: ['海克斯', '稀有度']
    },
    sources: [
      withSummary(
        augmentCatalogSource,
        `${augment.name} 在 Augments 目录里被归为 ${augment.rarity} 海克斯。`
      )
    ]
  };
}

function makeAugmentEffectEntry(detail) {
  return {
    id: `derived-${detail.key}-augment-effect`,
    question: `${detail.name} 这个海克斯是干嘛的`,
    aliases: [
      `${detail.name} 有什么效果`,
      `${detail.name} 海克斯效果`,
      `${detail.name} 值得拿吗`
    ],
    answer_short: `高置信结论：${detail.summary}`,
    answer_detail: `${detail.name} 当前记录为 ${detail.rarity} 海克斯，初次出现于 ${detail.introduced}。这个条目先用结构化摘要回答“它大概干什么”，方便在搜名字时快速理解方向。`,
    status: 'high_confidence',
    confidence: 0.79,
    patch_range: detail.introduced,
    conditions: [
      '这是效果摘要，不是完整机制全文。',
      '如果需要更细的数值、内置冷却或联动示例，还需要继续补专门词条。'
    ],
    entities: {
      augments: [detail.name],
      rarities: [detail.rarity],
      mechanics: detail.tags
    },
    sources: [
      {
        source_type: 'guide',
        title: `${detail.name} Augment Guide - ARAM Mayhem`,
        url: detail.sourceUrl,
        publisher: 'ARAM Mayhem',
        retrieved_at: '2026-04-14',
        source_confidence: 0.74,
        evidence_summary: `${detail.name} 的公开页面提供了海克斯效果说明与加入版本，当前条目按摘要方式改写收录。`,
        patch_hint: detail.introduced
      }
    ]
  };
}

export function buildDerivedEntries({
  augmentCatalogFile = join(process.cwd(), 'data/generated/augment-catalog.json'),
  outputFile = join(process.cwd(), 'data/generated/derived-entries.json'),
} = {}) {
  const augmentCatalog = JSON.parse(readFileSync(augmentCatalogFile, 'utf8'));
  const entries = [];

  for (const meta of abilityMechanics) {
    entries.push(makeOnHitEntry(meta));

    if (meta.onAttack) {
      entries.push(makeOnAttackEntry(meta));
    }

    if (meta.spellEffects) {
      entries.push(makeSpellEffectsEntry(meta));
    }

    const damageClassificationEntry = makeDamageClassificationEntry(meta);
    if (damageClassificationEntry) {
      entries.push(damageClassificationEntry);
    }

    const scalingNoteEntry = makeScalingNoteEntry(meta);
    if (scalingNoteEntry) {
      entries.push(scalingNoteEntry);
    }
  }

  for (const augment of augmentCatalog.catalog ?? []) {
    entries.push(makeAugmentDirectoryEntry(augment));
    entries.push(makeAugmentRarityEntry(augment));
  }

  for (const detail of augmentDetails) {
    entries.push(makeAugmentEffectEntry(detail));
  }

  const validationErrors = entries.flatMap((entry) => validateEntry(entry, `${entry.id}.generated`));
  if (validationErrors.length > 0) {
    const error = new Error(validationErrors.join('\n'));
    error.validationErrors = validationErrors;
    throw error;
  }

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
  const { entries } = buildDerivedEntries();
  console.log(`Built derived entries with ${entries.length} records.`);
}

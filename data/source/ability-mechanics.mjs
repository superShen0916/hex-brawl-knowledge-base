function wikiSource(title, url, source_confidence = 0.82) {
  return {
    source_type: 'wiki',
    title,
    url,
    publisher: 'League of Legends Wiki',
    retrieved_at: '2026-04-14',
    source_confidence,
    patch_hint: '当前通用机制'
  };
}

export const abilityMechanics = [
  { key: 'akshan-passive', champion: '阿克尚', aliases: ['Akshan'], slot: '被动', skill: 'Dirty Fighting', onHit: true, onAttack: true, note: '25% 攻击特效效率' },
  { key: 'akshan-e', champion: '阿克尚', aliases: ['Akshan'], slot: 'E', skill: 'Heroic Swing', onHit: true, note: '25% 攻击特效效率' },
  { key: 'aphelios-q-severum', champion: '厄斐琉斯', aliases: ['Aphelios'], slot: 'Q', skill: 'Onslaught', onHit: true, note: '25% 攻击特效效率' },
  { key: 'aphelios-q-infernum', champion: '厄斐琉斯', aliases: ['Aphelios'], slot: 'Infernum Q', skill: 'Duskwave', onHit: true },
  { key: 'aphelios-r', champion: '厄斐琉斯', aliases: ['Aphelios'], slot: 'R', skill: 'Moonlight Vigil', onHit: true },
  { key: 'azir-w', champion: '阿兹尔', aliases: ['Azir'], slot: 'W', skill: 'Arise!', onHit: true, onAttack: true, note: '50% 攻击特效效率' },
  { key: 'belveth-q', champion: '卑尔维斯', aliases: ['BelVeth', "Bel'Veth"], slot: 'Q', skill: 'Void Surge', onHit: true, note: '75% 攻击特效效率' },
  { key: 'belveth-e', champion: '卑尔维斯', aliases: ['BelVeth', "Bel'Veth"], slot: 'E', skill: 'Royal Maelstrom', onHit: true, onAttack: true, note: '攻击特效效率会变化' },
  { key: 'blitzcrank-e', champion: '布里茨', aliases: ['Blitzcrank', '机器人'], slot: 'E', skill: 'Power Fist', onHit: true, spellEffects: true },
  { key: 'briar-q', champion: '贝蕾亚', aliases: ['Briar'], slot: 'Q', skill: 'Head Rush', onHit: true, onAttack: true },
  { key: 'camille-q', champion: '卡蜜尔', aliases: ['Camille', '青钢影'], slot: 'Q', skill: 'Precision Protocol', onHit: true, spellEffects: true },
  { key: 'darius-w', champion: '德莱厄斯', aliases: ['Darius', '诺手'], slot: 'W', skill: 'Crippling Strike', onHit: true, spellEffects: true },
  { key: 'elise-q-spider', champion: '伊莉丝', aliases: ['Elise'], slot: '蜘蛛 Q', skill: 'Venomous Bite', onHit: true },
  { key: 'evelynn-e', champion: '伊芙琳', aliases: ['Evelynn'], slot: 'E', skill: 'Whiplash', onHit: true, spellEffects: true, damageClassification: 'ability_damage' },
  { key: 'evelynn-e-empowered', champion: '伊芙琳', aliases: ['Evelynn'], slot: '强化 E', skill: 'Empowered Whiplash', onHit: true, spellEffects: true, damageClassification: 'ability_damage' },
  { key: 'ezreal-q', champion: '伊泽瑞尔', aliases: ['Ezreal', 'EZ'], slot: 'Q', skill: 'Mystic Shot', onHit: true, onAttack: true, spellEffects: true },
  { key: 'fiora-q', champion: '菲奥娜', aliases: ['Fiora'], slot: 'Q', skill: 'Lunge', onHit: true, spellEffects: true },
  { key: 'fizz-q', champion: '菲兹', aliases: ['Fizz', '小鱼人'], slot: 'Q', skill: 'Urchin Strike', onHit: true, spellEffects: true, damageClassification: 'mixed' },
  { key: 'gangplank-q', champion: '普朗克', aliases: ['Gangplank', '船长'], slot: 'Q', skill: 'Parrrley', onHit: true, onAttack: true, spellEffects: true },
  { key: 'garen-q', champion: '盖伦', aliases: ['Garen'], slot: 'Q', skill: 'Decisive Strike', onHit: true, spellEffects: true },
  { key: 'graves-passive', champion: '格雷福斯', aliases: ['Graves', '男枪'], slot: '被动', skill: 'New Destiny', onHit: true, onAttack: true },
  { key: 'hecarim-e', champion: '赫卡里姆', aliases: ['Hecarim', '人马'], slot: 'E', skill: 'Devastating Charge', onHit: true, spellEffects: true },
  { key: 'irelia-q', champion: '艾瑞莉娅', aliases: ['Irelia'], slot: 'Q', skill: 'Bladesurge', onHit: true, spellEffects: true },
  {
    key: 'ivern-r',
    champion: '艾翁',
    aliases: ['Ivern', '小菊'],
    slot: 'R',
    skill: 'Daisy!',
    onHit: true,
    spellEffects: true,
    source: wikiSource('Ivern - League of Legends Wiki', 'https://wiki.leagueoflegends.com/en-us/Ivern', 0.84),
    evidence: {
      onHit: 'Ivern 页面明确写到 Daisy 的普攻会施加艾翁自己的 on-hit effects。',
      spellEffects: 'Ivern 页面同时写到 Daisy 的普攻会以 area damage 形式施加 spell effects。'
    }
  },
  { key: 'jax-w', champion: '贾克斯', aliases: ['Jax', '武器'], slot: 'W', skill: 'Empower', onHit: true, spellEffects: true },
  { key: 'kassadin-w', champion: '卡萨丁', aliases: ['Kassadin'], slot: 'W', skill: 'Nether Blade', onHit: true, spellEffects: true },
  { key: 'katarina-passive', champion: '卡特琳娜', aliases: ['Katarina', '卡特'], slot: '被动', skill: 'Voracity', onHit: true, spellEffects: true },
  { key: 'katarina-w', champion: '卡特琳娜', aliases: ['Katarina', '卡特'], slot: 'W', skill: 'Sinister Steel', onHit: true, note: '30% 攻击特效效率' },
  { key: 'katarina-e', champion: '卡特琳娜', aliases: ['Katarina', '卡特'], slot: 'E', skill: 'Shunpo', onHit: true, spellEffects: true, note: '35% 攻击特效效率' },
  { key: 'katarina-r', champion: '卡特琳娜', aliases: ['Katarina', '卡特'], slot: 'R', skill: 'Death Lotus', onHit: true, onAttack: true, spellEffects: true, note: '40% 攻击特效效率' },
  { key: 'kayle-e', champion: '凯尔', aliases: ['Kayle'], slot: 'E', skill: 'Starfire Spellblade', onHit: true, spellEffects: true },
  {
    key: 'kled-w',
    champion: '克烈',
    aliases: ['Kled'],
    slot: 'W',
    skill: 'Violent Tendencies',
    onHit: true,
    spellEffects: true,
    damageClassification: 'mixed',
    source: wikiSource('Kled - League of Legends Wiki', 'https://wiki.leagueoflegends.com/en-us/Kled/LoL', 0.82),
    evidence: {
      onHit: 'Kled 页面说明 Violent Tendencies 的第 4 下仍是基础攻击命中，因此会带出攻击特效。',
      spellEffects: 'Violent Tendencies 的第 4 下 bonus damage 被标成 basic damage 和 spell damage，因此可触发 spell effects。',
      damageClassification: 'Violent Tendencies 的第 4 下同时保留基础攻击载体和额外技能伤害，更适合按混合判定理解。'
    }
  },
  { key: 'lucian-passive', champion: '卢锡安', aliases: ['Lucian'], slot: '被动', skill: 'Lightslinger', onHit: true, onAttack: true },
  { key: 'master-yi-passive', champion: '易大师', aliases: ['Master Yi', '剑圣'], slot: '被动', skill: 'Double Strike', onHit: true, onAttack: true, note: '75% / 18.75% 攻击特效效率' },
  { key: 'master-yi-q', champion: '易大师', aliases: ['Master Yi', '剑圣'], slot: 'Q', skill: 'Alpha Strike', onHit: true, spellEffects: true, note: '75% / 18.75% 攻击特效效率' },
  { key: 'miss-fortune-q', champion: '厄运小姐', aliases: ['Miss Fortune', '女枪'], slot: 'Q', skill: 'Double Up', onHit: true, onAttack: true, spellEffects: true, note: 'on-attack 只对首个单位生效' },
  { key: 'mundo-e', champion: '蒙多医生', aliases: ['Dr. Mundo', 'Mundo', '蒙多'], slot: 'E', skill: 'Blunt Force Trauma', onHit: true, spellEffects: true },
  {
    key: 'nautilus-passive',
    champion: '诺提勒斯',
    aliases: ['Nautilus', '泰坦'],
    slot: '被动',
    skill: 'Staggering Blow',
    onHit: true,
    source: wikiSource(
      'Template:Data Nautilus/Staggering Blow - League of Legends Wiki',
      'https://wiki.leagueoflegends.com/en-us/Template%3AData_Nautilus/Staggering_Blow',
      0.82
    ),
    evidence: {
      onHit: 'Staggering Blow 被描述为强化后的基础攻击命中，并附带 proc damage 与禁锢。'
    }
  },
  { key: 'nasus-q', champion: '内瑟斯', aliases: ['Nasus', '狗头'], slot: 'Q', skill: 'Siphoning Strike', onHit: true, spellEffects: true },
  { key: 'nidalee-q-cougar', champion: '奈德丽', aliases: ['Nidalee', '豹女'], slot: '美洲狮 Q', skill: 'Takedown', onHit: true, spellEffects: true },
  {
    key: 'nocturne-passive',
    champion: '魔腾',
    aliases: ['Nocturne', '梦魇'],
    slot: '被动',
    skill: 'Umbra Blades',
    onHit: true,
    note: '次级目标会以 100% 攻击特效效率施加 on-hit',
    source: wikiSource('Nocturne - League of Legends Wiki', 'https://wiki.leagueoflegends.com/en-us/Nocturne', 0.84),
    evidence: {
      onHit: 'Umbra Blades 的强化攻击会对目标及周围单位结算攻击路径。',
      scalingNote: 'Nocturne 页面明确写到 Umbra Blades 会对所有目标以 100% 效率施加 on-hit。'
    }
  },
  { key: 'pantheon-w-empowered', champion: '潘森', aliases: ['Pantheon'], slot: '强化 W', skill: 'Empowered Shield Vault', onHit: true },
  { key: 'renekton-w', champion: '雷克顿', aliases: ['Renekton', '鳄鱼'], slot: 'W', skill: 'Ruthless Predator', onHit: true },
  { key: 'senna-q', champion: '赛娜', aliases: ['Senna'], slot: 'Q', skill: 'Piercing Darkness', onHit: true, spellEffects: true },
  { key: 'shyvana-q', champion: '希瓦娜', aliases: ['Shyvana', '龙女'], slot: 'Q', skill: 'Twin Bite', onHit: true, onAttack: true, spellEffects: true },
  { key: 'smolder-q', champion: '斯莫德', aliases: ['Smolder'], slot: 'Q', skill: 'Super Scorcher Breath', onHit: true, onAttack: true },
  { key: 'trundle-q', champion: '特朗德尔', aliases: ['Trundle', '巨魔'], slot: 'Q', skill: 'Chomp', onHit: true, spellEffects: true },
  {
    key: 'twisted-fate-w',
    champion: '崔斯特',
    aliases: ['Twisted Fate', '卡牌', '卡牌大师', 'TF'],
    slot: 'W',
    skill: 'Pick a Card',
    onHit: true,
    spellEffects: true,
    damageClassification: 'ability_damage',
    source: wikiSource('Twisted Fate - League of Legends Wiki', 'https://wiki.leagueoflegends.com/en-us/Twisted_Fate', 0.84),
    evidence: {
      onHit: 'Pick a Card 会强化下一次基础攻击，因此该命中仍沿用基础攻击载体并能带出攻击特效。',
      spellEffects: 'Pick a Card 的额外伤害被记录为 spell damage，可视作会同时走技能效果链路。',
      damageClassification: 'Pick a Card 的伤害分类明确写为 spell damage。'
    }
  },
  { key: 'twitch-r', champion: '图奇', aliases: ['Twitch', '老鼠'], slot: 'R', skill: 'Spray and Pray', onHit: true },
  { key: 'urgot-w', champion: '厄加特', aliases: ['Urgot', '螃蟹'], slot: 'W', skill: 'Purge', onHit: true, onAttack: true, note: '50% 攻击特效效率' },
  { key: 'vayne-q', champion: '薇恩', aliases: ['Vayne'], slot: 'Q', skill: 'Tumble', onHit: true, spellEffects: true },
  {
    key: 'vi-e',
    champion: '蔚',
    aliases: ['Vi'],
    slot: 'E',
    skill: 'Relentless Force',
    onHit: true,
    spellEffects: true,
    damageClassification: 'mixed',
    source: wikiSource('Vi - League of Legends Wiki', 'https://wiki.leagueoflegends.com/en-us/Vi', 0.83),
    evidence: {
      onHit: 'Relentless Force 的主目标会施加基础攻击所需效果，因此会带出 on-hit。',
      spellEffects: 'Relentless Force 说明里明确写到主目标会施加 spell damage。',
      damageClassification: 'Relentless Force 同时包含主目标的 basic-damage-required effects 与 spell damage，属于混合判定。'
    }
  },
  { key: 'viego-passive', champion: '佛耶戈', aliases: ['Viego'], slot: '被动', skill: 'Blade of the Ruined King', onHit: true },
  { key: 'viego-r', champion: '佛耶戈', aliases: ['Viego'], slot: 'R', skill: 'Heartbreaker', onHit: true },
  { key: 'volibear-q', champion: '沃利贝尔', aliases: ['Volibear', '狗熊'], slot: 'Q', skill: 'Thundering Smash', onHit: true, spellEffects: true },
  { key: 'volibear-w', champion: '沃利贝尔', aliases: ['Volibear', '狗熊'], slot: 'W', skill: 'Frenzied Maul', onHit: true, onAttack: true, spellEffects: true },
  { key: 'warwick-q', champion: '沃里克', aliases: ['Warwick', '狼人'], slot: 'Q', skill: 'Jaws of the Beast', onHit: true, onAttack: true, spellEffects: true },
  { key: 'warwick-r', champion: '沃里克', aliases: ['Warwick', '狼人'], slot: 'R', skill: 'Infinite Duress', onHit: true, onAttack: true, spellEffects: true },
  { key: 'wukong-q', champion: '悟空', aliases: ['Wukong'], slot: 'Q', skill: 'Crushing Blow', onHit: true, spellEffects: true },
  { key: 'yasuo-q', champion: '亚索', aliases: ['Yasuo'], slot: 'Q', skill: 'Steel Tempest', onHit: true, onAttack: true },
  { key: 'yone-q', champion: '永恩', aliases: ['Yone'], slot: 'Q', skill: 'Mortal Steel', onHit: true, onAttack: true },
  { key: 'yorick-q', champion: '约里克', aliases: ['Yorick', '牧魂人'], slot: 'Q', skill: 'Last Rites', onHit: true, spellEffects: true },
  { key: 'zeri-q', champion: '泽丽', aliases: ['Zeri'], slot: 'Q', skill: 'Burst Fire', onHit: true, onAttack: true }
];

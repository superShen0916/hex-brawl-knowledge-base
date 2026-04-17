#!/usr/bin/env node
/**
 * Parse official wiki Attack effects/Abilities page
 * Extract all abilities that trigger on-hit effects
 */

import fs from 'fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync('/tmp/wiki.html', 'utf-8');

// 屏蔽 CSS 解析错误
const originalConsoleError = console.error;
console.error = () => {};
const dom = new JSDOM(html);
console.error = originalConsoleError;
const doc = dom.window.document;

// 提取所有列表项
const lists = doc.querySelectorAll('ul');
const foundAbilities = [];

// 中文常见英雄名映射
const cnMap = {
  'Akshan': '阿克尚',
  'Aphelios': '厄斐琉斯',
  'Azir': '阿兹尔',
  "Bel'Veth": '卑尔维斯',
  'Briar': '贝蕾亚',
  'Blitzcrank': '布里茨',
  'Camille': '卡蜜尔',
  'Darius': '德莱厄斯',
  'Elise': '伊莉丝',
  'Evelynn': '伊芙琳',
  'Ezreal': '伊泽瑞尔',
  'Fiora': '菲奥娜',
  'Fizz': '菲兹',
  'Gangplank': '普朗克',
  'Garen': '盖伦',
  'Graves': '格雷福斯',
  'Hecarim': '赫卡里姆',
  'Irelia': '艾瑞莉娅',
  'Ivern': '艾翁',
  'Jax': '贾克斯',
  "Kai'Sa": '卡莎',
  "Kha'Zix": '卡兹克',
  'Lee Sin': '李青',
  'Lucian': '卢锡安',
  'Miss Fortune': '厄运小姐',
  'Nocturne': '魔腾',
  'Olaf': '奥拉夫',
  'Ryze': '瑞兹',
  'Samira': '莎弥拉',
  'Senna': '赛娜',
  'Thresh': '锤石',
  'Varus': '韦鲁斯',
  'Vayne': '薇恩',
  'Zed': '劫',
  'Caitlyn': '凯特琳',
  'Cassiopeia': '卡西奥佩娅',
  'ChoGath': '科加斯',
  'Dr. Mundo': '蒙多医生',
  'Jarvan IV': '嘉文四世',
  'Katarina': '卡特琳娜',
  'Kennen': '凯南',
  'Leblanc': '乐芙兰',
  'Malphite': '墨菲特',
  'Master Yi': '易',
  'Mordekaiser': '莫德凯撒',
  'Morgana': '莫甘娜',
  'Nasus': '内瑟斯',
  'Sivir': '希维尔',
  'Xin Zhao': '赵信',
  'Wukong': '孙悟空',
};

function getChineseName(enName) {
  return cnMap[enName] || enName;
}

function parseLine(text) {
  // 格式: "Champion Name: Ability Name"
  const parts = text.split(':');
  if (parts.length < 2) return null;
  const championEn = parts[0].trim().replace(/\[\d+\]/g, '').trim();
  const ability = parts.slice(1).join(':').trim().replace(/\[\d+\]/g, '').trim();

  // 去除链接括号
  const championCn = getChineseName(championEn);

  return {
    championEn,
    championCn,
    abilityName: ability,
  };
}

// 遍历所有li寻找技能条目
Array.from(doc.querySelectorAll('li')).forEach(li => {
  const text = li.textContent.trim();
  if (text.includes(':') && text.length < 100 && !text.includes(':')) {
    const parsed = parseLine(text);
    if (parsed && !foundAbilities.find(p => p.championEn === parsed.championEn && p.abilityName === parsed.abilityName)) {
      foundAbilities.push(parsed);
    }
  }
});

console.log(`找到 ${foundAbilities.length} 个触发on-hit的技能`);
console.log('');

// 输出可直接导入的格式
console.log('// 从官方 wiki Attack effects/Abilities 页面提取');
console.log('const currentPatch = "wiki-import";');
console.log('');

foundAbilities.forEach((a, index) => {
  const key = `${a.championEn.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}-onhit${index}`;
  console.log('  {');
  console.log(`    key: '${key}',`);
  console.log(`    champion: '${a.championCn}',`);
  console.log(`    aliases: ['${a.championEn}'],`);
  console.log(`    slot: '',`); // 用户填
  console.log(`    skill: '${a.abilityName}',`);
  console.log(`    onHit: true,`); // 根据维基分类就是触发on-hit
  console.log(`    source: wikiSource('Attack effects/Abilities', 'https://leagueoflegends.fandom.com/wiki/Attack_effects/Abilities', 0.90),`);
  console.log(`    note: '官方维基记录该技能触发攻击特效',`);
  console.log(`    patch: currentPatch,`);
  console.log('  },');
});

console.log('');

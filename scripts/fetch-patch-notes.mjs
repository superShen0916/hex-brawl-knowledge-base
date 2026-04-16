#!/usr/bin/env node
/**
 * 抓取英雄联盟版本更新公告，提取英雄技能机制改动
 *
 * Usage:
 * node scripts/fetch-patch-notes.mjs https://www.leagueoflegends.com/zh-cn/news/game-updates/patch-xx-notes
 *
 * 输出提取结果，建议人工复核后合并到 data/source/ability-mechanics.mjs
 */

import https from 'https';
import http from 'http';
import { JSDOM } from 'jsdom';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const parser = new URL(url);
    const module = parser.protocol === 'https:' ? https : http;
    module.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

function extractSkillChanges(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // 常见的LOL公告内容选择器
  const contentSelectors = [
    '.patch-notes-container',
    '.content',
    '.article-body',
    'main article',
    '.bodymarkup',
  ];

  let content = null;
  for (const selector of contentSelectors) {
    content = doc.querySelector(selector);
    if (content) break;
  }

  if (!content) {
    console.error('❌ 找不到公告内容区域');
    return [];
  }

  const changes = [];
  const text = content.textContent || '';

  // 匹配 "英雄名 技能名：" 开头的段落
  // 中文公告常见格式："[英雄名]：[...] 现在 [...] 改为 [...]"
  const paragraphs = content.querySelectorAll('p, h2, h3, h4');

  const championPattern = /([\u4e00-\u9fa5a-zA-Z\s]+)(?:[：:]\s*)/;
  const keywords = [
    '伤害',
    '攻击特效',
    'on-hit',
    '暴击',
    '普攻',
    '技能伤害',
    '触发',
    '改动',
    '调整',
    '修复',
    '改为',
    '现在',
  ];

  paragraphs.forEach((p) => {
    const pText = p.textContent?.trim();
    if (!pText) return;

    const match = pText.match(championPattern);
    if (!match) return;

    // 检查是否包含机制/伤害分类相关关键词
    const hasMechanicsKeyword = keywords.some((k) => pText.includes(k));
    if (!hasMechanicsKeyword) return;

    const championName = match[1].trim();
    changes.push({
      champion: championName,
      text: pText,
      selector: p.tagName.toLowerCase(),
    });
  });

  // 如果没找到，尝试整段文本搜索
  if (changes.length === 0) {
    console.log('ℹ️  按段落匹配没找到，尝试整块提取...');
    // todo: 更激进的提取策略
  }

  return changes;
}

function formatForImport(changes) {
  if (changes.length === 0) {
    return '// 没有提取到技能机制改动\n';
  }

  let output = `// 提取自版本更新公告\n// 请人工复核后合并到 data/source/ability-mechanics.mjs\n\n`;

  changes.forEach((c) => {
    output += `// ${c.champion} - ${c.text.trim()}\n`;
  });

  output += `\n/*
  复制到 data/source/ability-mechanics.mjs 格式参考：

  {
    key: 'champion-skill',
    champion: '英雄名',
    aliases: ['英文名'],
    slot: 'Q',
    skill: '技能名',
    onHit: true/false,
    damageClassification: 'ability_damage',
    note: '版本改动说明...',
  },
  */\n`;

  return output;
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.log('Usage: node scripts/fetch-patch-notes.mjs <patch-notes-url>');
    console.log('Example: node scripts/fetch-patch-notes.mjs https://www.leagueoflegends.com/zh-cn/news/game-updates/patch-14-1-notes/');
    process.exit(1);
  }

  console.log(`🔍 正在抓取: ${url}`);

  try {
    const html = await fetchUrl(url);
    const changes = extractSkillChanges(html);
    console.log(`✅ 提取完成，找到 ${changes.length} 条可能的机制改动\n`);
    console.log(formatForImport(changes));
  } catch (error) {
    console.error('❌ 抓取失败:', error.message);
    process.exit(1);
  }
}

main();

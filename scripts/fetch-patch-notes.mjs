#!/usr/bin/env node
/**
 * 抓取英雄联盟版本更新公告，提取英雄技能机制改动
 * 自动输出结构化数据，可直接合并到数据源
 *
 * Usage:
 * node scripts/fetch-patch-notes.mjs https://www.leagueoflegends.com/zh-cn/news/game-updates/patch-xx-notes [--merge]
 * node scripts/fetch-patch-notes.mjs ./patch-xx.html [--merge]
 *
 * Options:
 *   --merge    自动合并提取结果到 data/source/ability-mechanics.mjs 末尾
 *
 * 输出提取结果，建议人工复核后保存
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

async function fetchUrl(url) {
  // 处理本地文件
  if (url.startsWith('file://') || !url.startsWith('http')) {
    let filePath = url;
    if (filePath.startsWith('file://')) {
      filePath = filePath.slice(7);
    }
    // 处理相对路径
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(process.cwd(), filePath);
    }
    return fs.promises.readFile(filePath, 'utf-8');
  }

  // 处理远程URL
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    const module = options.protocol === 'https:' ? https : http;
    const req = module.get({
      hostname: options.hostname,
      path: options.pathname,
      port: options.port,
      protocol: options.protocol,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

function extractSkillChanges(html) {
  // 捕获 jsdom CSS 解析警告
  const originalConsoleError = console.error;
  console.error = () => {};
  const dom = new JSDOM(html);
  console.error = originalConsoleError;
  const doc = dom.window.document;

  // 获取完整文本
  let fullText = '';
  try {
    // 尝试从content中获取
    const contentSelectors = [
      '.patch-notes-container',
      '.content',
      '.article-body',
      'main article',
      '.bodymarkup',
      'div[data-content]',
      '.c-written-content',
      '.page-content',
      '.article-content',
      '.content-body',
      '.rtext',
      'main',
      'article',
    ];

    let content = null;
    for (const selector of contentSelectors) {
      content = doc.querySelector(selector);
      if (content && content.textContent.trim().length > 500) break;
    }

    if (content) {
      fullText = content.textContent;
    } else {
      //  fallback: 拿整个页面文本
      fullText = doc.body.textContent;
    }
  } catch (e) {
    fullText = doc.body.textContent;
  }

  const changes = [];
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
    '更新',
    '机制',
    '修正',
    '调整了',
    '⇒',
    '改为',
    '上限',
    '加成',
  ];

  // 尝试从DOM中捞所有英雄改动段落
  // 查找所有包含英雄名和关键词的段落
  const allParagraphs = Array.from(doc.querySelectorAll('p, h2, h3, h4, li'))
    .map(el => el.textContent.trim())
    .filter(p => p.length > 10 && p.length < 800);

  // 如果DOM段落提取不到，回退到按空格切分长文本
  let chunks;
  if (allParagraphs.length > 10) {
    chunks = allParagraphs;
  } else {
    // 按标点符号分段
    chunks = fullText
      .split(/(?<=[。．！？\n])/)
      .map(l => l.trim())
      .filter(l => l.length > 10);
  }

  // 中文常见的英雄技能改动描述模式
  // 开头两个到四个字是英雄名
  const championPattern = /^([\u4e00-\u9fa5]{1,4}[\u4e00-\u9fa5a-zA-Z\s]*)[：:\s]/;

  chunks.forEach((text) => {
    // 检查是否包含机制/伤害分类相关关键词
    const hasMechanicsKeyword = keywords.some((k) => text.includes(k));
    if (!hasMechanicsKeyword) return;

    // 过滤掉非英雄改动的大段介绍文字
    if (text.length > 500) return;

    // 尝试提取英雄名
    const match = text.match(championPattern);
    if (match) {
      let championName = match[1].trim();
      // 去掉一些常见前缀
      championName = championName.replace(/^(英雄|本次)/, '').trim();
      changes.push({
        champion: championName,
        text: text,
      });
    } else {
      // 尝试在文本中找英雄名
      const anyMatch = text.match(/([\u4e00-\u9fa5]{1,4})/);
      if (anyMatch && anyMatch[1]) {
        changes.push({
          champion: anyMatch[1].trim(),
          text: text,
        });
      } else {
        // 有关键词，没提取到英雄名也保留
        changes.push({
          champion: '(需手动确认英雄)',
          text: text,
        });
      }
    }
  });

  // 去重
  const seen = new Set();
  const uniqueChanges = changes.filter(c => {
    if (seen.has(c.text)) return false;
    seen.add(c.text);
    return true;
  });

  console.log(`ℹ️  扫描完成，找到 ${uniqueChanges.length} 条包含关键词的改动`);
  return uniqueChanges;
}

function formatForImport(changes) {
  if (changes.length === 0) {
    return '// 没有提取到技能机制改动\n';
  }

  let output = `// 提取自版本更新公告\n// 请人工复核后合并到 data/source/ability-mechanics.mjs\n\n`;

  // 输出注释预览
  changes.forEach((c) => {
    output += `// ${c.champion} - ${c.text.trim()}\n`;
  });

  output += `\n// =============== 下面是可直接复制的数据结构骨架，请填充缺失信息 ===============\n`;
  output += `// 格式已经对齐，复制后只需要补 key, aliases, slot, skill 等字段\n\n`;

  // 为每个条目生成数据结构骨架
  changes.forEach((c, index) => {
    const cleanText = c.text.trim().replace(/\s+/g, ' ');
    const key = `${c.champion.toLowerCase().replace(/\s+/g, '-')}-patch-${index + 1}`;
    output += `  {\n`;
    output += `    // ${c.champion} - ${cleanText}\n`;
    output += `    key: '${key}',\n`;
    output += `    champion: '${c.champion}',\n`;
    output += `    aliases: ['${englishNameHint(c.champion)}'],\n`;
    output += `    slot: '', // 填写技能位置 Q/W/E/R/被动\n`;
    output += `    skill: '', // 填写技能名\n`;
    output += `    // onHit: false,  // 根据实际情况取消注释并设置\n`;
    output += `    // spellEffects: false,\n`;
    output += `    // onAttack: false,\n`;
    output += `    // damageClassification: 'ability_damage',\n`;
    output += `    note: '${escapeJs(cleanText)}',\n`;
    output += `    patch: currentPatch,\n`;
    output += `  },\n`;
  });

  output += `\n// 记得在文件头部定义 currentPatch:\n// const currentPatch = '14.x';\n`;

  return output;
}

function englishNameHint(chineseName) {
  // 简单映射，大多数情况下拼音差不多，用户可以修正
  const pinyinMap = {
    '厄斐琉斯': 'Aphelios',
    '阿克尚': 'Akshan',
    '阿兹尔': 'Azir',
    '卑尔维斯': "Bel'Veth",
    '贝蕾亚': 'Briar',
    '布里茨': 'Blitzcrank',
    '卡蜜尔': 'Camille',
    '德莱厄斯': 'Darius',
    '伊莉丝': 'Elise',
    '伊芙琳': 'Evelynn',
    '伊泽瑞尔': 'Ezreal',
    '菲奥娜': 'Fiora',
    '菲兹': 'Fizz',
    '普朗克': 'Gangplank',
    '盖伦': 'Garen',
    '格雷福斯': 'Graves',
    '赫卡里姆': 'Hecarim',
    '艾瑞莉娅': 'Irelia',
    '艾翁': 'Ivern',
    '贾克斯': 'Jax',
    '卡莎': "Kai'Sa",
    '卡兹克': "Kha'Zix",
    '李青': 'Lee Sin',
    '卢锡安': 'Lucian',
    '厄运小姐': 'Miss Fortune',
    '魔腾': 'Nocturne',
    '奥拉夫': 'Olaf',
    '瑞兹': 'Ryze',
    '莎弥拉': 'Samira',
    '赛娜': 'Senna',
    '锤石': 'Thresh',
    '韦鲁斯': 'Varus',
    '薇恩': 'Vayne',
    '劫': 'Zed',
  };
  return pinyinMap[chineseName.trim()] || chineseName.trim();
}

function escapeJs(str) {
  return str.replace(/'/g, "\\'");
}

async function main() {
  const input = process.argv[2];
  const shouldMerge = process.argv.includes('--merge');

  if (!input) {
    console.log('Usage:');
    console.log('  node scripts/fetch-patch-notes.mjs <patch-notes-url> [--merge]');
    console.log('  node scripts/fetch-patch-notes.mjs <local-html-file> [--merge]');
    console.log('');
    console.log('Options:');
    console.log('  --merge    自动合并提取结果到 data/source/ability-mechanics.mjs');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/fetch-patch-notes.mjs https://www.leagueoflegends.com/zh-cn/news/game-updates/patch-14-1-notes/');
    console.log('  node scripts/fetch-patch-notes.mjs ./patch-14-4.html --merge');
    process.exit(1);
  }

  console.log(`🔍 正在读取: ${input}`);

  try {
    const html = await fetchUrl(input);
    const changes = extractSkillChanges(html);
    // 过滤掉明显不是英雄机制改动的条目（比如皮肤公告、页脚等）
    const validChanges = changes.filter(c => {
      const badKeywords = ['造型', '皮肤', '炫彩', '版本更新公告', '游戏更新', '下列'];
      return !badKeywords.some(k => c.champion.includes(k) || c.text.includes(k));
    });
    console.log(`✅ 提取完成，找到 ${changes.length} 条包含关键词的改动，过滤后剩余 ${validChanges.length} 条英雄机制改动\n`);
    const output = formatForImport(validChanges);
    console.log(output);

    if (shouldMerge && validChanges.length > 0) {
      // 自动合并到数据源文件
      const targetPath = path.join(
        path.dirname(new URL(import.meta.url).pathname),
        '../data/source/ability-mechanics.mjs'
      );
      console.log(`\n📝 自动合并到 ${targetPath}...`);
      let existing = await fs.promises.readFile(targetPath, 'utf-8');

      // 提取补丁版本号从url或文件名
      const patchMatch = input.match(/patch[-_]?(\d+[.]\d+)/i);
      const patchVersion = patchMatch ? patchMatch[1] : '26.8';

      // 在开头添加currentPatch定义如果不存在
      if (!existing.includes('const currentPatch')) {
        // 在文件开头插入补丁版本定义
        existing = `const currentPatch = '${patchVersion}';\n\n${existing}`;
      }

      // 找到export行，在那之前插入新数据
      const insertMarker = 'export const abilityMechanics = [';
      const markerIndex = existing.indexOf(insertMarker);
      if (markerIndex === -1) {
        console.error('❌ 无法找到插入位置，请手动复制上面输出');
        process.exit(1);
      }

      // 生成要插入的内容
      let insertContent = '\n  // --- 提取自 ' + patchVersion + ' 版本更新公告 ---\n';

      // 为每个条目生成对象
      validChanges.forEach((c, index) => {
        const cleanText = c.text.trim().replace(/\s+/g, ' ');
        const key = c.champion.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + patchVersion + '-' + index;
        insertContent += '  {\n';
        insertContent += '    // ' + c.champion + ' - ' + escapeJsForComment(cleanText) + '\n';
        insertContent += '    key: \'' + escapeJs(key) + '\',\n';
        insertContent += '    champion: \'' + escapeJs(c.champion) + '\',\n';
        insertContent += '    aliases: [\'' + escapeJs(englishNameHint(c.champion)) + '\'],\n';
        insertContent += '    slot: \'\',\n';
        insertContent += '    skill: \'\',\n';
        insertContent += '    // onHit: false,\n';
        insertContent += '    // spellEffects: false,\n';
        insertContent += '    // onAttack: false,\n';
        insertContent += '    // damageClassification: \'ability_damage\',\n';
        insertContent += '    note: \'' + escapeJs(cleanText) + '\',\n';
        insertContent += '    patch: currentPatch,\n';
        insertContent += '  },\n';
      });
      insertContent += '  // --- 结束版本更新提取 ---\n';

      // 在marker行之后插入
      const newContent = existing.slice(0, markerIndex + insertMarker.length) + insertContent + existing.slice(markerIndex + insertMarker.length);

      await fs.promises.writeFile(targetPath, newContent, 'utf-8');
      console.log('✅ 已自动合并到 data/source/ability-mechanics.mjs！请检查后运行 npm run build');
    }
  } catch (error) {
    console.error('❌ 读取失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function escapeJsForComment(str) {
  return str.replace(/'/g, "\\'");
}

main();

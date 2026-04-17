const championAliases = new Map([
  ['螃蟹', '厄加特'],
  ['船长', '普朗克'],
  ['卡特', '卡特琳娜'],
  ['卡牌', '崔斯特'],
  ['卡牌大师', '崔斯特'],
  ['tf', '崔斯特'],
  ['ez', '伊泽瑞尔'],
  ['ezreal', '伊泽瑞尔'],
  ['小鱼人', '菲兹'],
  ['狼人', '沃里克'],
  ['狗头', '内瑟斯'],
  ['泰坦', '诺提勒斯'],
  ['梦魇', '魔腾'],
  ['小菊', '艾翁'],
  ['亚索', '亚索'],
  ['永恩', '永恩'],
  ['莎米拉', '莎弥拉'],
]);

const phraseAliases = new Map([
  ['on-hit', '攻击特效'],
  ['onhit', '攻击特效'],
  ['spellblade', '法术刃'],
  ['sheen', '法术刃'],
  ['咒刃', '法术刃'],
  ['吃不吃', '触发'],
  ['能不能', '触发'],
  ['会不会', '触发'],
  ['可不可以', '触发'],
]);

const fillerTokens = new Set(['吗', '么', '呢']);

function normalizeSpacing(text) {
  return text
    .replace(/([a-z])([一-龥])/gi, '$1 $2')
    .replace(/([一-龥])([a-z])/gi, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeQuestion(input) {
  if (!input) return '';
  let text = input.toLowerCase().replace(/[？?。！!，,；;：:]/g, ' ').trim();

  for (const [alias, canonical] of championAliases) {
    text = text.replaceAll(alias, canonical);
  }

  for (const [alias, canonical] of phraseAliases) {
    text = text.replaceAll(alias, canonical);
  }

  text = normalizeSpacing(text);
  text = text.replace(/触发\s*触发/g, '触发');
  text = text.replace(/攻击\s*特效/g, '攻击特效');
  text = text.replace(/触发攻击特效/g, '触发 攻击特效');
  text = text.replace(/厄加特w/g, '厄加特 w');
  text = text.replace(/厄加特\s+w\s+触发\s+攻击特效/g, '厄加特 w 触发 攻击特效');

  return text;
}

export function extractTokens(input) {
  return normalizeQuestion(input)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !fillerTokens.has(token));
}

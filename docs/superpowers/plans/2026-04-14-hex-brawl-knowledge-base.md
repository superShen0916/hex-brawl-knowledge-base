# Hex Brawl Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a searchable static knowledge site for Hex Brawl interaction Q&A, backed by structured JSON data and an offline AI-friendly indexing pipeline.

**Architecture:** Use a zero-dependency static web app so the repository stays easy to run, review, and publish to GitHub Pages. Store curated Q&A entries as JSON, generate a search index with Node.js scripts, and keep search logic deterministic in the browser instead of relying on online LLM responses.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js built-in test runner, JSON data files, Git

---

### Task 1: Initialize the repository skeleton

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `package.json`
- Create: `site/index.html`
- Create: `site/styles.css`
- Create: `site/app.js`
- Create: `data/entries/.gitkeep`
- Create: `data/generated/.gitkeep`
- Create: `tests/repository-layout.test.mjs`

- [ ] **Step 1: Write the failing repository layout test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const expectedPaths = [
  '.gitignore',
  'README.md',
  'package.json',
  'site/index.html',
  'site/styles.css',
  'site/app.js',
  'data/entries/.gitkeep',
  'data/generated/.gitkeep',
];

test('repository exposes the expected static-site skeleton', () => {
  for (const target of expectedPaths) {
    assert.equal(existsSync(target), true, `missing ${target}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/repository-layout.test.mjs`
Expected: FAIL with one or more `missing <path>` assertions because the repository is still empty.

- [ ] **Step 3: Write the minimal repository files**

```json
{
  "name": "hex-brawl-knowledge-base",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "build:index": "node scripts/build-search-index.mjs",
    "build": "npm run build:index",
    "serve": "python3 -m http.server 4173"
  }
}
```

```gitignore
node_modules/
.DS_Store
site-data.json
```

```md
# Hex Brawl Knowledge Base

Search-first static knowledge site for Hex Brawl interaction Q&A.

## Commands

- `npm test`
- `npm run build`
- `npm run serve`
```

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>海克斯大乱斗交互知识库</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./app.js"></script>
  </body>
</html>
```

```css
body {
  margin: 0;
  font-family: "Noto Sans SC", "PingFang SC", sans-serif;
  background: #f5f1e8;
  color: #16202a;
}
```

```js
const root = document.querySelector('#app');

if (root) {
  root.innerHTML = '<main><h1>海克斯大乱斗交互知识库</h1></main>';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/repository-layout.test.mjs`
Expected: PASS with `repository exposes the expected static-site skeleton`.

- [ ] **Step 5: Commit**

```bash
git add .gitignore README.md package.json site/index.html site/styles.css site/app.js data/entries/.gitkeep data/generated/.gitkeep tests/repository-layout.test.mjs
git commit -m "chore: initialize static knowledge base skeleton"
```

### Task 2: Implement normalization and search-index generation

**Files:**
- Create: `scripts/lib/normalize.mjs`
- Create: `scripts/build-search-index.mjs`
- Create: `tests/normalize.test.mjs`
- Create: `tests/build-search-index.test.mjs`

- [ ] **Step 1: Write the failing normalization and index tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuestion, extractTokens } from '../scripts/lib/normalize.mjs';

test('normalizeQuestion merges common Hex Brawl aliases', () => {
  assert.equal(
    normalizeQuestion('螃蟹W 吃不吃 on-hit？'),
    '厄加特 w 触发 攻击特效'
  );
});

test('extractTokens keeps meaningful tokens for search recall', () => {
  assert.deepEqual(
    extractTokens('厄加特 W 能不能触发攻击特效'),
    ['厄加特', 'w', '触发', '攻击特效']
  );
});
```

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildSearchIndex } from '../scripts/build-search-index.mjs';

const fixtureDir = join(process.cwd(), 'tmp-build-index');

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/normalize.test.mjs tests/build-search-index.test.mjs`
Expected: FAIL because `scripts/lib/normalize.mjs` and `scripts/build-search-index.mjs` do not exist yet.

- [ ] **Step 3: Write the minimal normalization and index builder**

```js
const championAliases = new Map([
  ['螃蟹', '厄加特'],
]);

const phraseAliases = new Map([
  ['on-hit', '攻击特效'],
  ['onhit', '攻击特效'],
  ['吃不吃', '触发'],
  ['能不能', '触发'],
]);

export function normalizeQuestion(input) {
  let text = input.toLowerCase().replace(/[？?。！!]/g, ' ').trim();

  for (const [alias, canonical] of championAliases) {
    text = text.replaceAll(alias, canonical);
  }

  for (const [alias, canonical] of phraseAliases) {
    text = text.replaceAll(alias, canonical);
  }

  return text
    .replace(/\s+/g, ' ')
    .replace('厄加特w', '厄加特 w')
    .replace('触发攻击特效', '触发 攻击特效')
    .trim();
}

export function extractTokens(input) {
  return normalizeQuestion(input)
    .split(' ')
    .filter(Boolean)
    .filter((token) => token !== '吗');
}
```

```js
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractTokens, normalizeQuestion } from './lib/normalize.mjs';

export function buildSearchIndex({
  entriesDir = join(process.cwd(), 'data/entries'),
  outputFile = join(process.cwd(), 'data/generated/search-index.json'),
} = {}) {
  const files = readdirSync(entriesDir).filter((file) => file.endsWith('.json'));

  const entries = files.map((file) => {
    const entry = JSON.parse(readFileSync(join(entriesDir, file), 'utf8'));
    const normalizedQuestion = normalizeQuestion(entry.question);

    return {
      id: entry.id,
      question: entry.question,
      normalizedQuestion,
      aliases: entry.aliases ?? [],
      answerShort: entry.answer_short,
      confidence: entry.confidence,
      status: entry.status,
      patchRange: entry.patch_range,
      entities: entry.entities,
      tokens: [...new Set([normalizedQuestion, ...extractTokens(entry.question), ...(entry.aliases ?? []).flatMap(extractTokens)])],
      sourceCount: (entry.sources ?? []).length,
    };
  });

  writeFileSync(outputFile, JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildSearchIndex();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/normalize.test.mjs tests/build-search-index.test.mjs`
Expected: PASS for both tests, with a generated search index fixture file.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/normalize.mjs scripts/build-search-index.mjs tests/normalize.test.mjs tests/build-search-index.test.mjs
git commit -m "feat: add search normalization and index generation"
```

### Task 3: Build the search-first static UI

**Files:**
- Modify: `site/index.html`
- Modify: `site/styles.css`
- Modify: `site/app.js`
- Create: `site/search.js`
- Create: `tests/search-ranking.test.mjs`

- [ ] **Step 1: Write the failing search-ranking test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { rankEntries } from '../site/search.js';

const entries = [
  {
    id: 'urgot-w-onhit',
    question: '厄加特 W 能不能触发攻击特效',
    normalizedQuestion: '厄加特 w 触发 攻击特效',
    tokens: ['厄加特', 'w', '触发', '攻击特效'],
    confidence: 0.86,
  },
  {
    id: 'generic-onhit',
    question: '哪些技能会触发攻击特效',
    normalizedQuestion: '哪些 技能 触发 攻击特效',
    tokens: ['技能', '触发', '攻击特效'],
    confidence: 0.55,
  },
];

test('rankEntries prefers exact champion-skill matches over generic records', () => {
  const results = rankEntries('厄加特 W 攻击特效', entries);
  assert.equal(results[0].id, 'urgot-w-onhit');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/search-ranking.test.mjs`
Expected: FAIL because `site/search.js` does not exist.

- [ ] **Step 3: Write the minimal ranking logic and UI shell**

```js
import { normalizeQuestion, extractTokens } from '../scripts/lib/normalize.mjs';

export function rankEntries(query, entries) {
  const normalizedQuery = normalizeQuestion(query);
  const queryTokens = new Set(extractTokens(query));

  return [...entries]
    .map((entry) => {
      let score = entry.normalizedQuestion === normalizedQuery ? 100 : 0;

      for (const token of entry.tokens) {
        if (queryTokens.has(token)) score += 10;
      }

      score += Math.round((entry.confidence ?? 0) * 10);

      return { ...entry, score };
    })
    .sort((left, right) => right.score - left.score);
}
```

```html
<main class="shell">
  <section class="hero">
    <p class="eyebrow">HEX BRAWL KNOWLEDGE BASE</p>
    <h1>海克斯大乱斗交互知识库</h1>
    <p class="lede">直接输入问题，先看结论，再按需展开来源和冲突说明。</p>
    <form id="search-form" class="search-panel">
      <input id="search-input" name="q" placeholder="比如：厄加特 W 能不能触发攻击特效" />
      <button type="submit">搜索</button>
    </form>
  </section>
  <section id="results" class="results"></section>
</main>
```

```css
:root {
  --bg: linear-gradient(180deg, #efe7d4 0%, #e6dcc4 100%);
  --panel: rgba(255, 250, 240, 0.9);
  --ink: #17212b;
  --accent: #b85c38;
  --muted: #6f6556;
}

body {
  min-height: 100vh;
  background: var(--bg);
}

.shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 48px 20px 80px;
}

.search-panel {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}
```

```js
import { rankEntries } from './search.js';

const state = { entries: [] };
const app = document.querySelector('#app');

function render(entries) {
  const results = document.querySelector('#results');

  if (!results) return;

  results.innerHTML = entries
    .map(
      (entry) => `
        <article class="result-card">
          <p class="result-label">${entry.patchRange ?? '版本未知'} · 置信度 ${entry.confidence}</p>
          <h2>${entry.question}</h2>
          <p>${entry.answerShort}</p>
        </article>
      `
    )
    .join('');
}

async function boot() {
  if (!app) return;

  app.innerHTML = await fetch('./app-shell.html').then(() => '');
}

document.addEventListener('submit', (event) => {
  if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'search-form') return;
  event.preventDefault();
  const input = document.querySelector('#search-input');
  if (!(input instanceof HTMLInputElement)) return;
  render(rankEntries(input.value, state.entries).slice(0, 10));
});

void boot();
```

During implementation, replace the placeholder `boot()` with direct DOM rendering instead of fetching a missing file.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/search-ranking.test.mjs`
Expected: PASS with `rankEntries prefers exact champion-skill matches over generic records`.

- [ ] **Step 5: Commit**

```bash
git add site/index.html site/styles.css site/app.js site/search.js tests/search-ranking.test.mjs
git commit -m "feat: add search-first knowledge site interface"
```

### Task 4: Seed curated entries and wire the generated search index into the site

**Files:**
- Create: `data/entries/urgot-w-onhit.json`
- Create: `data/entries/ezreal-q-spellblade.json`
- Create: `data/entries/samira-r-onhit.json`
- Create: `data/entries/ability-classification-template.json`
- Modify: `scripts/build-search-index.mjs`
- Modify: `site/app.js`
- Create: `tests/site-data-loading.test.mjs`

- [ ] **Step 1: Write the failing site-data-loading test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { rankEntries } from '../site/search.js';
import { readFileSync } from 'node:fs';

test('generated search index exposes enough seed records for the homepage', () => {
  const payload = JSON.parse(readFileSync('data/generated/search-index.json', 'utf8'));
  assert.equal(payload.entries.length >= 4, true);

  const ranked = rankEntries('厄加特 W 攻击特效', payload.entries);
  assert.equal(ranked[0].id, 'urgot-w-onhit');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/site-data-loading.test.mjs`
Expected: FAIL because `data/generated/search-index.json` has not been built yet.

- [ ] **Step 3: Write the minimal seed data and browser loading flow**

```json
{
  "id": "urgot-w-onhit",
  "question": "厄加特 W 能不能触发攻击特效",
  "normalized_question": "厄加特 w 触发 攻击特效",
  "aliases": ["螃蟹 W 吃不吃 on-hit"],
  "answer_short": "高置信结论：大多数情况下会触发攻击特效，但应按当前版本和特殊交互复核。",
  "answer_detail": "该结论来自多源整理，当前按更高置信来源处理。",
  "status": "high_confidence",
  "confidence": 0.86,
  "patch_range": "26.7",
  "conditions": ["以当前海克斯大乱斗版本资料为准"],
  "entities": {
    "champions": ["厄加特"],
    "skills": ["W"],
    "mechanics": ["攻击特效"]
  },
  "sources": [
    {
      "source_type": "guide",
      "title": "社区交互整理",
      "url": "https://example.com/urgot",
      "publisher": "seed",
      "retrieved_at": "2026-04-14",
      "source_confidence": 0.7,
      "evidence_summary": "作为初始种子，待后续真实来源替换。",
      "patch_hint": "26.7"
    }
  ]
}
```

```js
async function loadEntries() {
  const response = await fetch('../data/generated/search-index.json');
  const payload = await response.json();
  state.entries = payload.entries;
  render(payload.entries.slice(0, 8));
}
```

```js
if (import.meta.url === `file://${process.argv[1]}`) {
  buildSearchIndex();
}
```

After adding seed files, run `npm run build` so the generated index exists before the UI loads it.

- [ ] **Step 4: Run tests and build to verify everything passes**

Run: `npm run build && node --test`
Expected: PASS for all tests and a generated `data/generated/search-index.json`.

- [ ] **Step 5: Commit**

```bash
git add data/entries/*.json data/generated/search-index.json scripts/build-search-index.mjs site/app.js tests/site-data-loading.test.mjs
git commit -m "feat: ship seed knowledge entries and generated search index"
```

## Self-Review

### Spec coverage

- Search-first homepage: covered by Task 3.
- Short-answer cards with confidence/version: covered by Task 3 and Task 4.
- Structured JSON records with status/confidence/sources: covered by Task 4.
- Offline deterministic index generation: covered by Task 2.
- Seed content for first-run experience: covered by Task 4.
- Git-ready repository skeleton and local commands: covered by Task 1.

### Placeholder scan

- No `TBD`, `TODO`, or deferred implementation markers remain in the task steps.
- One implementation note in Task 3 explicitly instructs replacing a placeholder `boot()` approach during execution; that should be resolved in code, not kept in the final implementation.

### Type consistency

- Entry fields use `answer_short` in source JSON and `answerShort` in generated index output.
- `rankEntries()` consistently operates on generated index entries, not raw JSON source records.
- Tests expect `normalizedQuestion`, `patchRange`, and `confidence` in generated output.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-14-hex-brawl-knowledge-base.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Default assumption for this repository: use **Inline Execution** unless the user asks to switch.

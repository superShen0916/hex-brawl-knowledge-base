import { confidenceLabel, rankEntries } from './search.js';

const root = document.querySelector('#app');

const state = {
  entries: [],
  query: '',
  selectedId: '',
  statusText: '正在加载知识索引...',
};

const suggestedQueries = [
  '厄加特 W 能不能触发攻击特效',
  '伊泽瑞尔 Q 会不会触发法术刃',
  '莎弥拉 R 能吃攻击特效吗',
  '技能算普攻还是技能伤害',
];

function formatConfidence(value) {
  return Number(value ?? 0).toFixed(2);
}

function escapeHtml(input) {
  return String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resultSummary(entries) {
  if (!state.query) {
    return `已收录 ${entries.length} 条可搜索问答，默认按置信度排序。`;
  }

  return `当前问题“${state.query}”命中 ${entries.length} 条记录。`;
}

function renderSources(sources = []) {
  if (!sources.length) {
    return '<p class="status-line">当前条目暂时没有公开来源。</p>';
  }

  return `
    <ul class="source-list">
      ${sources
        .slice(0, 6)
        .map(
          (source) => `
            <li class="source-item">
              <a class="source-title" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">
                ${escapeHtml(source.title)}
              </a>
              <div class="source-meta">
                ${escapeHtml(source.publisher ?? '未知来源')} · ${escapeHtml(source.patch_hint ?? '版本未标注')} · 来源置信度 ${formatConfidence(source.source_confidence)}
              </div>
              <div class="source-meta">${escapeHtml(source.evidence_summary ?? '')}</div>
            </li>
          `
        )
        .join('')}
    </ul>
  `;
}

function renderConflicts(conflicts = []) {
  if (!conflicts.length) {
    return '<p class="status-line">当前没有记录到有效冲突结论。</p>';
  }

  return `
    <ul class="conflict-list">
      ${conflicts
        .map(
          (conflict) => `
            <li class="conflict-item">
              <strong>${escapeHtml(conflict.candidate_answer)}</strong>
              <div class="source-meta">候选置信度 ${formatConfidence(conflict.candidate_confidence)}</div>
              <div class="source-meta">${escapeHtml(conflict.why_it_differs ?? '来源结论存在明显分歧。')}</div>
            </li>
          `
        )
        .join('')}
    </ul>
  `;
}

function renderResults(entries) {
  if (!entries.length) {
    return `
      <div class="empty-state">
        没有找到可直接复用的高可信答案。你可以换一种问法，或者改成“英雄 + 技能 + 交互类型”的形式继续搜。
      </div>
    `;
  }

  return entries
    .map((entry) => {
      const activeClass = entry.id === state.selectedId ? 'active' : '';
      const topSource = entry.sources?.[0];

      return `
        <article class="result-card ${activeClass}" data-entry-id="${escapeHtml(entry.id)}" tabindex="0">
          <div class="result-meta">
            <span class="badge">${escapeHtml(confidenceLabel(entry.confidence ?? 0))}</span>
            <span class="badge">${escapeHtml(entry.patchRange ?? '版本未知')}</span>
            <span class="badge">${escapeHtml(entry.status ?? 'high_confidence')}</span>
          </div>
          <h2>${escapeHtml(entry.question)}</h2>
          <p class="result-answer">${escapeHtml(entry.answerShort ?? '')}</p>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">置信度</span>
              <strong>${formatConfidence(entry.confidence)}</strong>
            </div>
            <div class="meta-item">
              <span class="meta-label">关键来源</span>
              <strong>${escapeHtml(topSource?.title ?? '暂无来源')}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderDetail(entry) {
  if (!entry) {
    return `
      <aside class="detail-panel">
        <h2>查看详情</h2>
        <p class="detail-intro">
          点击左侧结果卡片后，这里会显示详细说明、适用条件、来源和冲突记录。
        </p>
      </aside>
    `;
  }

  return `
    <aside class="detail-panel">
      <div class="result-meta">
        <span class="badge">${escapeHtml(confidenceLabel(entry.confidence ?? 0))}</span>
        <span class="badge">${escapeHtml(entry.patchRange ?? '版本未知')}</span>
      </div>
      <h2>${escapeHtml(entry.question)}</h2>
      <p class="detail-intro">${escapeHtml(entry.answerDetail || entry.answerShort || '')}</p>

      <section class="detail-block">
        <h3>适用条件</h3>
        <ul class="detail-list">
          ${(entry.conditions?.length ? entry.conditions : ['暂无额外条件说明'])
            .map((condition) => `<li>${escapeHtml(condition)}</li>`)
            .join('')}
        </ul>
      </section>

      <section class="detail-block">
        <h3>关键来源</h3>
        ${renderSources(entry.sources)}
      </section>

      <section class="detail-block">
        <h3>冲突记录</h3>
        ${renderConflicts(entry.conflicts)}
      </section>
    </aside>
  `;
}

function getRankedEntries() {
  return rankEntries(state.query, state.entries).slice(0, 12);
}

function syncSelected(rankedEntries) {
  if (!rankedEntries.length) {
    state.selectedId = '';
    return;
  }

  const stillExists = rankedEntries.some((entry) => entry.id === state.selectedId);
  if (!stillExists) {
    state.selectedId = rankedEntries[0].id;
  }
}

function paint() {
  if (!root) {
    return;
  }

  const rankedEntries = getRankedEntries();
  syncSelected(rankedEntries);
  const activeEntry = rankedEntries.find((entry) => entry.id === state.selectedId);

  root.innerHTML = `
    <main class="shell">
      <section class="masthead">
        <section class="hero">
          <p class="eyebrow">HEX BRAWL KNOWLEDGE BASE</p>
          <h1>海克斯大乱斗交互知识库</h1>
          <p class="lede">
            直接输入问题，先看结论，再按需展开版本、来源、冲突说明和适用条件。
          </p>
          <div class="hero-footer">
            <form id="search-form" class="search-panel">
              <input
                id="search-input"
                name="q"
                autocomplete="off"
                placeholder="比如：厄加特 W 能不能触发攻击特效"
                value="${escapeHtml(state.query)}"
              />
              <button type="submit">搜索</button>
            </form>
            <div class="hint-row">
              <span class="hint-pill">${escapeHtml(state.statusText)}</span>
            </div>
            <div class="chip-row">
              ${suggestedQueries
                .map(
                  (query) => `
                    <button type="button" class="chip" data-suggested-query="${escapeHtml(query)}">
                      ${escapeHtml(query)}
                    </button>
                  `
                )
                .join('')}
            </div>
          </div>
        </section>
      </section>

      <section class="layout">
        <section class="result-panel">
          <div class="result-head">
            <h2>搜索结果</h2>
            <p class="result-summary">${escapeHtml(resultSummary(rankedEntries))}</p>
          </div>
          <div id="results" class="results">
            ${renderResults(rankedEntries)}
          </div>
        </section>
        ${renderDetail(activeEntry)}
      </section>
    </main>
  `;
}

function updateQuery(query, { pushHistory = true } = {}) {
  state.query = query.trim();

  if (pushHistory) {
    const url = new URL(window.location.href);
    if (state.query) {
      url.searchParams.set('q', state.query);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url);
  }

  paint();
}

async function loadEntries() {
  try {
    const response = await fetch(new URL('../data/generated/search-index.json', import.meta.url));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    state.entries = payload.entries ?? [];
    state.statusText = `索引构建于 ${new Date(payload.generatedAt).toLocaleString('zh-CN')}`;
  } catch (error) {
    state.entries = [];
    state.statusText = `知识索引加载失败：${error instanceof Error ? error.message : '未知错误'}`;
  }

  updateQuery(state.query, { pushHistory: false });
}

document.addEventListener('submit', (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== 'search-form') {
    return;
  }

  event.preventDefault();
  const input = form.querySelector('#search-input');
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  updateQuery(input.value);
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const chip = target.closest('[data-suggested-query]');
  if (chip instanceof HTMLElement) {
    updateQuery(chip.dataset.suggestedQuery ?? '');
    return;
  }

  const card = target.closest('[data-entry-id]');
  if (card instanceof HTMLElement) {
    state.selectedId = card.dataset.entryId ?? '';
    paint();
  }
});

window.addEventListener('popstate', () => {
  const url = new URL(window.location.href);
  updateQuery(url.searchParams.get('q') ?? '', { pushHistory: false });
});

const initialUrl = new URL(window.location.href);
state.query = initialUrl.searchParams.get('q') ?? '';
paint();
void loadEntries();

import {
  buildFilterSections,
  filterEntries,
  hasActiveFilters,
} from "./filters.js";
import { confidenceLabel, rankEntries } from "./search.js";

const root = document.querySelector("#app");

const state = {
  entries: [],
  augmentCount: 0,
  query: "",
  selectedId: "",
  statusText: "正在加载知识索引...",
  filters: {
    status: "",
    kind: "",
    champion: "",
    augment: "",
    mechanic: "",
  },
  filterCollapsed: true,
};

const suggestedQueries = [
  "厄加特 W 能不能触发攻击特效",
  "伊泽瑞尔 Q 会不会触发法术刃",
  "莎弥拉 R 能吃攻击特效吗",
  "蛮王 E 能触发攻击特效吗",
  "船长 Q 触发哪些特效",
  "韦鲁斯 W 伤害分类",
  "卡蜜尔 Q 二段是什么伤害",
  "哪些海克斯增加攻击特效",
];

function formatConfidence(value) {
  return Number(value ?? 0).toFixed(2);
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function highlightMatchingKeywords(text, query) {
  const trimmedQuery = (query || "").trim().toLowerCase();
  if (!trimmedQuery) {
    return escapeHtml(text);
  }

  const queryTokens = trimmedQuery
    .split(/\s+/)
    .filter((token) => token.length >= 2)
    .map((token) => token.toLowerCase());

  if (!queryTokens.length) {
    return escapeHtml(text);
  }

  let result = escapeHtml(text);
  for (const token of queryTokens) {
    const regex = new RegExp(`(${escapeRegExp(token)})`, "gi");
    result = result.replace(regex, '<mark class="highlight">$1</mark>');
  }
  return result;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resultSummary(rankedEntries, filteredEntries) {
  const filtersEnabled = hasActiveFilters(state.filters);

  if (!state.query) {
    if (filtersEnabled) {
      return `已收录 ${state.entries.length} 条交互问答，已跟踪 ${state.augmentCount} 个海克斯；当前筛选后展示 ${filteredEntries.length} / ${rankedEntries.length} 条。`;
    }

    return `已收录 ${state.entries.length} 条交互问答，已跟踪 ${state.augmentCount} 个海克斯，默认按置信度排序。`;
  }

  if (filtersEnabled) {
    return `当前问题“${state.query}”先命中 ${rankedEntries.length} 条记录，筛选后保留 ${filteredEntries.length} 条。`;
  }

  return `当前问题“${state.query}”命中 ${filteredEntries.length} 条记录。`;
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
                ${escapeHtml(source.publisher ?? "未知来源")} · ${escapeHtml(source.patch_hint ?? "版本未标注")} · 来源置信度 ${formatConfidence(source.source_confidence)}
              </div>
              <div class="source-meta">${escapeHtml(source.evidence_summary ?? "")}</div>
            </li>
          `,
        )
        .join("")}
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
              <div class="source-meta">${escapeHtml(conflict.why_it_differs ?? "来源结论存在明显分歧。")}</div>
              ${
                conflict.sources?.length
                  ? `
                    <div class="mini-source-list">
                      ${conflict.sources
                        .slice(0, 2)
                        .map(
                          (source) => `
                            <a class="mini-source" href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">
                              ${escapeHtml(source.title)}
                            </a>
                          `,
                        )
                        .join("")}
                    </div>
                  `
                  : ""
              }
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderFilters(sections) {
  if (!sections.length) {
    return "";
  }

  let filterGroupsHtml = "";
  if (!state.filterCollapsed) {
    filterGroupsHtml = `
      <div class="filter-groups">
        ${sections
          .map(
            (section) => `
              <div class="filter-group">
                <span class="filter-label">${escapeHtml(section.label)}</span>
                <div class="filter-chip-row">
                  ${section.options
                    .map((option) => {
                      const active =
                        state.filters[section.key] === option.value;
                      return `
                        <button
                          type="button"
                          class="filter-chip ${active ? "active" : ""}"
                          data-filter-key="${escapeHtml(section.key)}"
                          data-filter-value="${escapeHtml(option.value)}"
                          aria-pressed="${active ? "true" : "false"}"
                        >
                          ${escapeHtml(option.label)}
                          <span class="filter-count">${escapeHtml(String(option.count))}</span>
                        </button>
                      `;
                    })
                    .join("")}
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    `;
  }

  return `
    <section class="filter-panel">
      <div class="filter-head">
        <h3>快速筛选</h3>
        <div class="filter-head-actions">
          ${
            hasActiveFilters(state.filters)
              ? '<button type="button" class="ghost-button" data-reset-filters="true">清空筛选</button>'
              : ""
          }
          <button type="button" class="ghost-button" data-toggle-filter-collapse>
            ${state.filterCollapsed ? "展开" : "收起"}
          </button>
        </div>
      </div>
      ${filterGroupsHtml}
    </section>
  `;
}

function findSimilarQueries(query, limit = 4) {
  if (!query || !state.entries.length) return [];

  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (!queryTokens.length) return [];

  const scored = state.entries
    .map((entry) => {
      let score = 0;
      const entryText = (
        entry.question +
        " " +
        (entry.answerShort || "")
      ).toLowerCase();
      for (const token of queryTokens) {
        if (entryText.includes(token)) {
          score += 1;
        }
      }
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);

  return scored;
}

function renderResults(entries, { filteredFrom = 0 } = {}) {
  if (!entries.length) {
    if (hasActiveFilters(state.filters) && filteredFrom > 0) {
      return `
        <div class="empty-state">
          当前查询本来能命中 ${filteredFrom} 条记录，但被筛选条件全部排掉了。你可以清空部分筛选后再看。
        </div>
      `;
    }

    const similar = findSimilarQueries(state.query, 4);
    let similarHtml = "";
    if (similar.length > 0) {
      similarHtml = `
        <div class="similar-suggestions">
          <p class="similar-label">你是不是想找：</p>
          <div class="similar-list">
            ${similar
              .map(
                (entry) => `
                <button class="similar-item" data-similar-id="${escapeHtml(entry.id)}">
                  ${escapeHtml(entry.question)}
                </button>
              `,
              )
              .join("")}
          </div>
        </div>
      `;
    }

    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>没有找到匹配的问答</h3>
        <p>试试这样提问：<strong>"厄加特 W 能不能触发攻击特效"</strong></p>
        <p>格式：<strong>英雄名 + 技能 + 问题</strong>，更容易命中</p>
        ${similarHtml}
      </div>
    `;
  }

  return entries
    .map((entry) => {
      const activeClass = entry.id === state.selectedId ? "active" : "";
      const topSource = entry.sources?.[0];

      return `
        <article class="result-card ${activeClass}" data-entry-id="${escapeHtml(entry.id)}" tabindex="0">
          <div class="result-meta">
            <span class="badge">${escapeHtml(confidenceLabel(entry.confidence ?? 0))}</span>
            <span class="badge">${escapeHtml(entry.patchRange ?? "版本未知")}</span>
            <span class="badge">${escapeHtml(entry.status ?? "high_confidence")}</span>
          </div>
          <h2>${highlightMatchingKeywords(entry.question, state.query)}</h2>
          <p class="result-answer">${highlightMatchingKeywords(entry.answerShort ?? "", state.query)}</p>
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">置信度</span>
              <strong>${formatConfidence(entry.confidence)}</strong>
            </div>
            <div class="meta-item">
              <span class="meta-label">关键来源</span>
              <strong>${escapeHtml(topSource?.title ?? "暂无来源")}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function findRelatedEntries(entry, allEntries, limit = 4) {
  if (!entry.entities) return [];

  const related = allEntries
    .filter((candidate) => candidate.id !== entry.id)
    .map((candidate) => {
      let score = 0;
      // 相同英雄加分
      if (entry.entities.champions && candidate.entities?.champions) {
        const common = entry.entities.champions.filter((c) =>
          candidate.entities.champions.includes(c),
        );
        score += common.length * 10;
      }
      // 相同机制加分
      if (entry.entities.mechanics && candidate.entities?.mechanics) {
        const common = entry.entities.mechanics.filter((m) =>
          candidate.entities.mechanics.includes(m),
        );
        score += common.length * 5;
      }
      // 相同海克斯加分
      if (entry.entities.augments && candidate.entities?.augments) {
        const common = entry.entities.augments.filter((a) =>
          candidate.entities.augments.includes(a),
        );
        score += common.length * 8;
      }
      return { entry: candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.entry);

  return related;
}

function renderRelated(related) {
  if (!related.length) {
    return "";
  }

  return `
    <section class="detail-block">
      <h3>相关问题</h3>
      <div class="related-list">
        ${related
          .map(
            (entry) => `
              <button class="related-item" data-related-id="${escapeHtml(entry.id)}">
                ${escapeHtml(entry.question)}
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderDetail(entry, allEntries) {
  if (!entry) {
    return "";
  }

  const related = findRelatedEntries(entry, allEntries);
  const currentUrl = window.location.href;

  return `
    <aside class="detail-panel">
      <div class="result-meta">
        <span class="badge">${escapeHtml(confidenceLabel(entry.confidence ?? 0))}</span>
        <span class="badge">${escapeHtml(entry.patchRange ?? "版本未知")}</span>
        <button type="button" class="copy-link-button" data-copy-link="${escapeHtml(currentUrl)}" title="复制当前问题链接">
          🔗 复制链接
        </button>
      </div>
      <h2>${escapeHtml(entry.question)}</h2>
      <p class="detail-intro">${escapeHtml(entry.answerDetail || entry.answerShort || "")}</p>

      <section class="detail-block">
        <h3>适用条件</h3>
        <ul class="detail-list">
          ${(entry.conditions?.length ? entry.conditions : ["暂无额外条件说明"])
            .map((condition) => `<li>${escapeHtml(condition)}</li>`)
            .join("")}
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

      ${renderRelated(related)}
    </aside>
  `;
}

function getRankedEntries() {
  return rankEntries(state.query, state.entries);
}

function syncSelected(rankedEntries) {
  if (!rankedEntries.length) {
    state.selectedId = "";
    return;
  }

  const stillExists = rankedEntries.some(
    (entry) => entry.id === state.selectedId,
  );
  if (!stillExists) {
    state.selectedId = rankedEntries[0].id;
  }
}

function paint() {
  if (!root) {
    return;
  }

  const rankedEntries = getRankedEntries();
  const filterSections = buildFilterSections(rankedEntries);
  const filteredEntries = filterEntries(rankedEntries, state.filters);
  const visibleEntries = filteredEntries.slice(0, 12);
  syncSelected(visibleEntries);
  const activeEntry = visibleEntries.find(
    (entry) => entry.id === state.selectedId,
  );

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
              ${state.query ? '<button type="button" id="clear-search" class="ghost-button">清空</button>' : ""}
            </form>
            <div class="hint-row">
              <span class="hint-pill">${escapeHtml(state.statusText)}</span>
              <span class="hint-pill">交互问答 ${escapeHtml(String(state.entries.length))} 条</span>
              <span class="hint-pill">海克斯目录 ${escapeHtml(String(state.augmentCount))} 个</span>
            </div>
            ${
              !state.query
                ? `
            <div class="chip-row">
              ${suggestedQueries
                .map(
                  (query) => `
                    <button type="button" class="chip" data-suggested-query="${escapeHtml(query)}">
                      ${escapeHtml(query)}
                    </button>
                  `,
                )
                .join("")}
              <button type="button" class="chip random-chip" id="random-question">
                🎲 随机问题
              </button>
            </div>
            `
                : ""
            }
          </div>
        </section>
      </section>

      <section class="layout">
        <section class="result-panel">
          <div class="result-head">
            <h2>搜索结果</h2>
            <p class="result-summary">${escapeHtml(resultSummary(rankedEntries, filteredEntries))}</p>
          </div>
          ${renderFilters(filterSections)}
          <div id="results" class="results">
            ${renderResults(visibleEntries, { filteredFrom: rankedEntries.length })}
          </div>
        </section>
        ${renderDetail(activeEntry, state.entries)}
      </section>
    </main>
  `;
}

function updateQuery(query, { pushHistory = true } = {}) {
  state.query = query.trim();

  if (pushHistory) {
    const url = new URL(window.location.href);
    if (state.query) {
      url.searchParams.set("q", state.query);
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState({}, "", url);
  }

  paint();
}

async function loadEntries() {
  try {
    const [searchResponse, augmentResponse] = await Promise.all([
      fetch(new URL("../data/generated/search-index.json", import.meta.url)),
      fetch(new URL("../data/generated/augment-catalog.json", import.meta.url)),
    ]);

    if (!searchResponse.ok) {
      throw new Error(`search index HTTP ${searchResponse.status}`);
    }

    if (!augmentResponse.ok) {
      throw new Error(`augment catalog HTTP ${augmentResponse.status}`);
    }

    const [searchPayload, augmentPayload] = await Promise.all([
      searchResponse.json(),
      augmentResponse.json(),
    ]);

    state.entries = searchPayload.entries ?? [];
    state.augmentCount = augmentPayload.catalog?.length ?? 0;
    state.statusText = `索引构建于 ${new Date(searchPayload.generatedAt).toLocaleString("zh-CN")}`;
  } catch (error) {
    state.entries = [];
    state.augmentCount = 0;
    state.statusText = `知识索引加载失败：${error instanceof Error ? error.message : "未知错误"}`;
  }

  updateQuery(state.query, { pushHistory: false });
}

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== "search-form") {
    return;
  }

  event.preventDefault();
  const input = form.querySelector("#search-input");
  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  updateQuery(input.value);
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const clearButton = target.closest("#clear-search");
  if (clearButton instanceof HTMLElement) {
    updateQuery("");
    const input = document.querySelector("#search-input");
    if (input instanceof HTMLInputElement) {
      input.value = "";
      input.focus();
    }
    return;
  }

  const toggleFilterButton = target.closest("[data-toggle-filter-collapse]");
  if (toggleFilterButton instanceof HTMLElement) {
    state.filterCollapsed = !state.filterCollapsed;
    paint();
    return;
  }

  const randomButton = target.closest("#random-question");
  if (randomButton instanceof HTMLElement) {
    if (state.entries.length === 0) return;
    const randomIndex = Math.floor(Math.random() * state.entries.length);
    const randomEntry = state.entries[randomIndex];
    updateQuery(randomEntry.question);
    return;
  }

  const similarItem = target.closest("[data-similar-id]");
  if (similarItem instanceof HTMLElement) {
    const similarId = similarItem.dataset.similarId;
    if (similarId) {
      const entry = state.entries.find((e) => e.id === similarId);
      if (entry) {
        updateQuery(entry.question);
        state.selectedId = entry.id;
      }
    }
    return;
  }

  const chip = target.closest("[data-suggested-query]");
  if (chip instanceof HTMLElement) {
    updateQuery(chip.dataset.suggestedQuery ?? "");
    return;
  }

  const resetFiltersButton = target.closest("[data-reset-filters]");
  if (resetFiltersButton instanceof HTMLElement) {
    state.filters = {
      status: "",
      kind: "",
      champion: "",
      augment: "",
      mechanic: "",
    };
    paint();
    return;
  }

  const filterChip = target.closest("[data-filter-key]");
  if (filterChip instanceof HTMLElement) {
    const filterKey = filterChip.dataset.filterKey;
    const filterValue = filterChip.dataset.filterValue ?? "";

    if (
      filterKey &&
      Object.prototype.hasOwnProperty.call(state.filters, filterKey)
    ) {
      state.filters[filterKey] =
        state.filters[filterKey] === filterValue ? "" : filterValue;
      paint();
    }

    return;
  }

  const copyLinkButton = target.closest("[data-copy-link]");
  if (copyLinkButton instanceof HTMLElement) {
    const url = copyLinkButton.dataset.copyLink;
    if (url && navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          // Could show a toast, but no UX for now - just copy silently
        })
        .catch(() => {
          // Fallback if clipboard API fails
        });
    }
    return;
  }

  const relatedItem = target.closest("[data-related-id]");
  if (relatedItem instanceof HTMLElement) {
    const relatedId = relatedItem.dataset.relatedId;
    if (relatedId) {
      state.selectedId = relatedId;
      paint();
    }
    return;
  }

  const card = target.closest("[data-entry-id]");
  if (card instanceof HTMLElement) {
    state.selectedId = card.dataset.entryId ?? "";
    paint();
    // 点击后平滑滚动到详情区域
    requestAnimationFrame(() => {
      const detail = document.querySelector(".detail-panel");
      if (detail) {
        detail.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
});

window.addEventListener("popstate", () => {
  const url = new URL(window.location.href);
  updateQuery(url.searchParams.get("q") ?? "", { pushHistory: false });
});

const initialUrl = new URL(window.location.href);
state.query = initialUrl.searchParams.get("q") ?? "";
paint();
void loadEntries();

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  const isInputFocused =
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement;

  // Slash key focuses search input when not already typing
  if (event.key === "/" && !isInputFocused) {
    event.preventDefault();
    const input = document.querySelector("#search-input");
    if (input instanceof HTMLInputElement) {
      input.focus();
      input.select();
    }
    return;
  }

  // Escape key clears search and focuses input
  if (event.key === "Escape" && state.query) {
    event.preventDefault();
    updateQuery("");
    const input = document.querySelector("#search-input");
    if (input instanceof HTMLInputElement) {
      input.value = "";
      input.focus();
    }
    return;
  }

  // Arrow keys navigate search results
  const rankedEntries = getRankedEntries();
  const filteredEntries = filterEntries(rankedEntries, state.filters);
  const visibleEntries = filteredEntries.slice(0, 12);

  if (visibleEntries.length === 0) return;

  const currentIndex = visibleEntries.findIndex(
    (entry) => entry.id === state.selectedId,
  );

  if (event.key === "ArrowDown") {
    event.preventDefault();
    const nextIndex =
      currentIndex >= visibleEntries.length - 1 ? 0 : currentIndex + 1;
    state.selectedId = visibleEntries[nextIndex].id;
    paint();
    scrollSelectedIntoView();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    const prevIndex =
      currentIndex <= 0 ? visibleEntries.length - 1 : currentIndex - 1;
    state.selectedId = visibleEntries[prevIndex].id;
    paint();
    scrollSelectedIntoView();
    return;
  }
});

function scrollSelectedIntoView() {
  setTimeout(() => {
    const selected = document.querySelector(".result-card.active");
    if (selected instanceof HTMLElement) {
      selected.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, 0);
}

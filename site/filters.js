const statusLabels = {
  confirmed: '已确认',
  high_confidence: '高置信',
  conflicted: '有冲突'
};

const kindLabels = {
  manual: '人工精修',
  derived: '自动派生'
};

const entityFieldMap = {
  champion: 'champions',
  augment: 'augments',
  mechanic: 'mechanics'
};

function compareOptions(left, right) {
  if (right.count !== left.count) {
    return right.count - left.count;
  }

  return String(left.label).localeCompare(String(right.label), 'zh-CN');
}

function collectEntityOptions(entries, filterKey, limit = 8) {
  const field = entityFieldMap[filterKey];
  const counts = new Map();

  for (const entry of entries) {
    for (const value of entry.entities?.[field] ?? []) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort(compareOptions)
    .slice(0, limit);
}

export function hasActiveFilters(filters = {}) {
  return Object.values(filters).some((value) => Boolean(value));
}

export function filterEntries(entries, filters = {}) {
  return entries.filter((entry) => {
    if (filters.status && entry.status !== filters.status) {
      return false;
    }

    if (filters.kind && entry.kind !== filters.kind) {
      return false;
    }

    for (const [filterKey, field] of Object.entries(entityFieldMap)) {
      const selectedValue = filters[filterKey];
      if (!selectedValue) {
        continue;
      }

      if (!(entry.entities?.[field] ?? []).includes(selectedValue)) {
        return false;
      }
    }

    return true;
  });
}

export function buildFilterSections(entries) {
  const statusCounts = new Map();
  const kindCounts = new Map();

  for (const entry of entries) {
    if (entry.status) {
      statusCounts.set(entry.status, (statusCounts.get(entry.status) ?? 0) + 1);
    }

    if (entry.kind) {
      kindCounts.set(entry.kind, (kindCounts.get(entry.kind) ?? 0) + 1);
    }
  }

  return [
    {
      key: 'status',
      label: '结论状态',
      options: [...statusCounts.entries()]
        .map(([value, count]) => ({
          value,
          label: statusLabels[value] ?? value,
          count
        }))
        .sort(compareOptions)
    },
    {
      key: 'kind',
      label: '收录方式',
      options: [...kindCounts.entries()]
        .map(([value, count]) => ({
          value,
          label: kindLabels[value] ?? value,
          count
        }))
        .sort(compareOptions)
    },
    {
      key: 'champion',
      label: '英雄',
      options: collectEntityOptions(entries, 'champion')
    },
    {
      key: 'augment',
      label: '海克斯',
      options: collectEntityOptions(entries, 'augment')
    },
    {
      key: 'mechanic',
      label: '机制',
      options: collectEntityOptions(entries, 'mechanic')
    }
  ].filter((section) => section.options.length > 0);
}

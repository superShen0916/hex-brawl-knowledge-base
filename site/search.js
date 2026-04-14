import { extractTokens, normalizeQuestion } from '../scripts/lib/normalize.mjs';

function scoreEntry(query, entry) {
  const normalizedQuery = normalizeQuestion(query);
  const queryTokens = new Set(extractTokens(query));
  const entryTokens = new Set(entry.tokens ?? []);

  let score = 0;

  if (entry.normalizedQuestion === normalizedQuery) {
    score += 120;
  }

  if (entry.question?.includes(query.trim())) {
    score += 40;
  }

  for (const token of queryTokens) {
    if (entryTokens.has(token)) {
      score += 18;
    }
  }

  const aliasHit = (entry.aliases ?? []).some(
    (alias) => normalizeQuestion(alias) === normalizedQuery
  );

  if (aliasHit) {
    score += 60;
  }

  score += Math.round((entry.confidence ?? 0) * 20);

  return score;
}

export function rankEntries(query, entries) {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [...entries].sort((left, right) => {
      const confidenceDelta = (right.confidence ?? 0) - (left.confidence ?? 0);
      if (confidenceDelta !== 0) {
        return confidenceDelta;
      }
      return (right.sourceCount ?? 0) - (left.sourceCount ?? 0);
    });
  }

  return [...entries]
    .map((entry) => ({ ...entry, score: scoreEntry(trimmedQuery, entry) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);
}

export function confidenceLabel(confidence) {
  if (confidence >= 0.9) return '已确认';
  if (confidence >= 0.75) return '高置信';
  if (confidence >= 0.55) return '中等置信';
  return '低置信';
}

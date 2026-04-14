import { URL } from 'node:url';

const allowedStatuses = new Set([
  'confirmed',
  'high_confidence',
  'conflicted',
]);

const allowedSourceTypes = new Set([
  'official',
  'wiki',
  'guide',
  'forum',
  'video',
  'other',
]);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateSource(source, file) {
  const errors = [];

  if (!allowedSourceTypes.has(source.source_type)) {
    errors.push(`${file}: unsupported source_type "${source.source_type}"`);
  }

  if (!isNonEmptyString(source.title)) {
    errors.push(`${file}: source.title must be a non-empty string`);
  }

  if (!validateUrl(source.url)) {
    errors.push(`${file}: source.url must be a valid http(s) URL`);
  }

  if (!isNonEmptyString(source.publisher)) {
    errors.push(`${file}: source.publisher must be a non-empty string`);
  }

  if (!isNonEmptyString(source.retrieved_at)) {
    errors.push(`${file}: source.retrieved_at must be a non-empty string`);
  }

  if (
    typeof source.source_confidence !== 'number' ||
    source.source_confidence < 0 ||
    source.source_confidence > 1
  ) {
    errors.push(`${file}: source.source_confidence must be a number between 0 and 1`);
  }

  if (!isNonEmptyString(source.evidence_summary)) {
    errors.push(`${file}: source.evidence_summary must be a non-empty string`);
  }

  if (!isNonEmptyString(source.patch_hint)) {
    errors.push(`${file}: source.patch_hint must be a non-empty string`);
  }

  return errors;
}

export function validateEntry(entry, file = '<entry>') {
  const errors = [];

  if (!isNonEmptyString(entry.id)) {
    errors.push(`${file}: id must be a non-empty string`);
  }

  if (!isNonEmptyString(entry.question)) {
    errors.push(`${file}: question must be a non-empty string`);
  }

  if (!Array.isArray(entry.aliases)) {
    errors.push(`${file}: aliases must be an array`);
  }

  if (!isNonEmptyString(entry.answer_short)) {
    errors.push(`${file}: answer_short must be a non-empty string`);
  }

  if (!isNonEmptyString(entry.answer_detail)) {
    errors.push(`${file}: answer_detail must be a non-empty string`);
  }

  if (!allowedStatuses.has(entry.status)) {
    errors.push(`${file}: status must be one of ${[...allowedStatuses].join(', ')}`);
  }

  if (
    typeof entry.confidence !== 'number' ||
    entry.confidence < 0 ||
    entry.confidence > 1
  ) {
    errors.push(`${file}: confidence must be a number between 0 and 1`);
  }

  if (!isNonEmptyString(entry.patch_range)) {
    errors.push(`${file}: patch_range must be a non-empty string`);
  }

  if (!Array.isArray(entry.conditions)) {
    errors.push(`${file}: conditions must be an array`);
  }

  if (!entry.entities || typeof entry.entities !== 'object' || Array.isArray(entry.entities)) {
    errors.push(`${file}: entities must be an object`);
  }

  if (!Array.isArray(entry.sources) || entry.sources.length === 0) {
    errors.push(`${file}: sources must be a non-empty array`);
  } else {
    for (const source of entry.sources) {
      errors.push(...validateSource(source, file));
    }
  }

  if (entry.conflict_set !== undefined && !Array.isArray(entry.conflict_set)) {
    errors.push(`${file}: conflict_set must be an array when provided`);
  }

  return errors;
}

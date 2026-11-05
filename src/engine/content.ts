import { FIELDS, FIELD_MAP } from './fields';
import type { FlyerContent, ImageValue, Template } from './types';

/**
 * The content model helpers.
 *
 * Content is always structured: a `Record` of known field keys. The manual
 * form and the free-text parser both write into this same shape, which is why
 * a parsed flyer and a hand-typed flyer are indistinguishable downstream.
 */

export function emptyContent(): FlyerContent {
  return {};
}

export function normalizeContent(content: FlyerContent): FlyerContent {
  const out: FlyerContent = {};
  for (const [key, value] of Object.entries(content)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) out[key] = trimmed;
      continue;
    }
    if (Array.isArray(value)) {
      const cleaned = value.map((v) => String(v).trim()).filter(Boolean);
      if (cleaned.length) out[key] = cleaned;
      continue;
    }
    if (typeof value === 'object' && 'url' in value) {
      out[key] = value as ImageValue;
    }
  }
  return out;
}

export function getString(content: FlyerContent, key: string): string {
  const value = content[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join('\n');
  return '';
}

export function getList(content: FlyerContent, key: string): string[] {
  const value = content[key];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

export function getImage(content: FlyerContent, key = 'image'): ImageValue | null {
  const value = content[key];
  if (value && typeof value === 'object' && !Array.isArray(value) && 'url' in value) return value;
  return null;
}

/** Is this field present and non-empty? */
export function hasValue(content: FlyerContent, key: string): boolean {
  const value = content[key];
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return true;
  return false;
}

/**
 * The fields a template actually uses, in the order they should be shown.
 * Templates declare the vocabulary they care about; everything else is hidden.
 */
export function fieldsForTemplate(template: Template): string[] {
  const declared = new Set(template.fields);
  const ordered = FIELDS.filter((f) => declared.has(f.key)).map((f) => f.key);
  const extra = [...declared].filter((key) => !FIELD_MAP[key]);
  return [...ordered, ...extra];
}

/** Fields the template expects that the user has not filled in yet. */
export function missingFields(template: Template, content: FlyerContent): string[] {
  return template.fields.filter((key) => !hasValue(content, key));
}

/** Fields the user filled in that this template will never show. */
export function unusedFields(template: Template, content: FlyerContent): string[] {
  const declared = new Set(template.fields);
  return Object.keys(content).filter((key) => !declared.has(key) && FIELD_MAP[key]);
}

/** Merge parsed content over the current content without losing user edits. */
export function mergeContent(current: FlyerContent, incoming: FlyerContent): FlyerContent {
  const merged: FlyerContent = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    merged[key] = value;
  }
  return merged;
}

/** A readable summary of how complete a flyer is, for the UI. */
export function contentScore(template: Template, content: FlyerContent): { filled: number; total: number } {
  const fields = fieldsForTemplate(template);
  const filled = fields.filter((key) => hasValue(content, key)).length;
  return { filled, total: fields.length };
}

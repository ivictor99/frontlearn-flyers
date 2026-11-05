import { DEFAULT_ROLE_STYLE } from '../layout';
import type {
  AspectKey,
  Decoration,
  Fill,
  LayoutBand,
  Template,
  TemplateCategory,
  TextRole,
  TextStyle,
} from '../types';

/** Build a complete role table from the shared defaults plus overrides. */
export function roles(
  overrides: Partial<Record<TextRole, Partial<TextStyle>>> = {},
): Record<TextRole, TextStyle> {
  const out = {} as Record<TextRole, TextStyle>;
  (Object.keys(DEFAULT_ROLE_STYLE) as TextRole[]).forEach((key) => {
    out[key] = { ...DEFAULT_ROLE_STYLE[key], ...(overrides[key] ?? {}) };
  });
  return out;
}

export interface TemplateInput {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  aspect: AspectKey;
  /** Content fields this template expects. */
  fields: string[];
  background: Fill;
  roles?: Record<TextRole, TextStyle>;
  decorations?: Decoration[];
  bands: LayoutBand[];
  scale?: number;
  logo?: { maxWidth: number; maxHeight: number };
}

export function makeTemplate(input: TemplateInput): Template {
  const now = new Date().toISOString();
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    description: input.description,
    aspect: input.aspect,
    active: true,
    builtin: true,
    fields: input.fields,
    style: {
      background: input.background,
      scale: input.scale ?? 0.92,
      roles: input.roles ?? roles(),
      logo: input.logo ?? { maxWidth: 300, maxHeight: 64 },
    },
    layout: { bands: input.bands, decorations: input.decorations ?? [] },
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

/** Contact row used by most footers — falls back to the brand automatically. */
export function contactFacts() {
  return [
    { field: 'phone', label: 'Call', icon: 'phone' as const },
    { field: 'email', label: 'Email', icon: 'mail' as const },
    { field: 'website', label: 'Web', icon: 'globe' as const },
  ];
}

/** Light-on-dark variant of the contact row. */
export function contactFactsLight() {
  return contactFacts();
}

export const SIDES = 72;

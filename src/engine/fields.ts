/**
 * The field vocabulary.
 *
 * This is the single source of truth for "what a flyer can say". Adding a field
 * here makes it available to every template that lists it, to the manual form,
 * and to the free-text parser.
 */

export type FieldType = 'text' | 'longtext' | 'list' | 'date' | 'time' | 'money' | 'image';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  max?: number;
  group: string;
  /** Marks the field as the "headline" of the flyer (used by the parser). */
  headline?: boolean;
  /** Rendered as a pill/badge in fact rows. */
  compact?: boolean;
}

export const FIELDS: FieldDef[] = [
  { key: 'eyebrow', label: 'Kicker / label', type: 'text', placeholder: 'Admissions open', group: 'Headline', max: 48 },
  { key: 'headline', label: 'Main title', type: 'text', placeholder: 'January 2027 Intake', group: 'Headline', max: 90, headline: true },
  { key: 'subhead', label: 'Supporting line', type: 'text', placeholder: 'AI Programming Diploma', group: 'Headline', max: 120 },
  { key: 'body', label: 'Description', type: 'longtext', placeholder: 'Tell people what this is about in one or two sentences.', group: 'Headline', max: 420 },
  { key: 'program', label: 'Course / programme', type: 'text', placeholder: 'Diploma in ICT', group: 'Details', max: 80 },
  { key: 'date', label: 'Date', type: 'date', placeholder: '20 December 2026', group: 'Details', max: 60 },
  { key: 'time', label: 'Time', type: 'time', placeholder: '9:00 AM – 4:00 PM', group: 'Details', max: 60 },
  { key: 'venue', label: 'Location', type: 'text', placeholder: 'Main Campus, Nairobi', group: 'Details', max: 90 },
  { key: 'fee', label: 'Fee / price', type: 'money', placeholder: 'KSh 25,000 per term', group: 'Details', max: 60 },
  { key: 'deadline', label: 'Application deadline', type: 'date', placeholder: '20 December 2026', group: 'Details', max: 60 },
  { key: 'cta', label: 'Call to action', type: 'text', placeholder: 'Apply now', group: 'Action', max: 40 },
  { key: 'highlights', label: 'Key points', type: 'list', placeholder: 'One point per line', group: 'Details', help: 'Press Enter after each point.' },
  { key: 'bullets', label: 'Bullet list', type: 'list', placeholder: 'One point per line', group: 'Details', help: 'Press Enter after each point.' },
  { key: 'organiser', label: 'Organiser / department', type: 'text', placeholder: 'Department of ICT', group: 'Action', max: 70 },
  { key: 'reference', label: 'Reference / code', type: 'text', placeholder: 'FL-ADM-2027', group: 'Action', max: 40 },
  { key: 'phone', label: 'Phone', type: 'text', placeholder: '0712 345 678', group: 'Contact', max: 40, compact: true },
  { key: 'email', label: 'Email', type: 'text', placeholder: 'admissions@frontlearn.ac.ke', group: 'Contact', max: 80, compact: true },
  { key: 'website', label: 'Website', type: 'text', placeholder: 'www.frontlearn.ac.ke', group: 'Contact', max: 80, compact: true },
  { key: 'address', label: 'Address', type: 'text', placeholder: 'Nairobi, Kenya', group: 'Contact', max: 120, compact: true },
  { key: 'image', label: 'Image', type: 'image', group: 'Media' },
];

export const FIELD_MAP: Record<string, FieldDef> = Object.fromEntries(FIELDS.map((f) => [f.key, f]));

export const FIELD_GROUPS = ['Headline', 'Details', 'Action', 'Contact', 'Media'];

export function fieldLabel(key: string): string {
  return FIELD_MAP[key]?.label ?? key;
}

export function isCompactField(key: string): boolean {
  return FIELD_MAP[key]?.compact ?? false;
}

/** Fields that are supplied by the brand rather than typed by the user. */
export const BRAND_BACKED_FIELDS = new Set(['phone', 'email', 'website', 'address']);

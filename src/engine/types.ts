/**
 * Core type contracts for the Flyer Studio engine.
 *
 * Everything in `src/engine` is plain TypeScript with no React and no DOM
 * dependency beyond the injected `measureText` function, so the same engine can
 * drive a browser preview, a server-side renderer, or a test.
 */

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

export type FontKey = 'jakarta' | 'inter' | 'serif';

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  ink: string;
  paper: string;
  muted: string;
}

export interface BrandConfig {
  schoolName: string;
  tagline: string;
  logoUrl: string | null;
  /** Intrinsic size of the logo file, used to size the logo box. */
  logoWidth: number | null;
  logoHeight: number | null;
  colors: BrandColors;
  fonts: { heading: FontKey; body: FontKey };
  website: string;
  phone: string;
  email: string;
  address: string;
  socials: { platform: string; handle: string }[];
  defaultCta: string;
  footerNote: string;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export interface ImageValue {
  url: string;
  width: number;
  height: number;
  /** Focal point 0..1 used when cover-cropping. */
  focalX: number;
  focalY: number;
  alt?: string;
}

export type ContentValue = string | string[] | ImageValue | null;

export type FlyerContent = Record<string, ContentValue>;

/** Roles drive the typographic system. A role resolves to concrete type. */
export type TextRole =
  | 'eyebrow'
  | 'headline'
  | 'subhead'
  | 'body'
  | 'cta'
  | 'meta'
  | 'label'
  | 'display'
  | 'number';

export type Align = 'left' | 'center' | 'right';

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export type AspectKey = 'square' | 'portrait' | 'story' | 'landscape' | 'a4';

export interface AspectSpec {
  key: AspectKey;
  label: string;
  width: number;
  height: number;
  /** Pixel dimensions used for raster export (print quality). */
  exportScale: number;
}

export type TemplateCategory =
  | 'admissions'
  | 'programme'
  | 'event'
  | 'graduation'
  | 'workshop'
  | 'seminar'
  | 'career'
  | 'intake'
  | 'deadline'
  | 'announcement'
  | 'promo'
  | 'achievement'
  | 'scholarship'
  | 'social';

export interface TextStyle {
  family: 'heading' | 'body';
  weight: number;
  /** Base size in design units (px at 1x). */
  size: number;
  lineHeight: number;
  tracking: number;
  transform: 'none' | 'upper';
  align: Align;
  /** Maximum lines before truncation. */
  maxLines: number;
  /** Type may shrink between these bounds to fit its box. */
  minSize: number;
  maxSize: number;
  /** `shrink` adapts the size; `fixed` keeps the size and truncates instead. */
  fit: 'shrink' | 'fixed';
  color?: string;
  opacity?: number;
  /** Colour used for list markers/icons. */
  iconColor?: string;
}

export type Fill =
  | { kind: 'none' }
  | { kind: 'solid'; color: string; opacity?: number }
  | { kind: 'linear'; from: string; to: string; angle: number }
  | { kind: 'radial'; from: string; to: string; cx: number; cy: number }
  | { kind: 'image'; url: string; opacity?: number; overlay?: string; overlayOpacity?: number };

export interface Decoration {
  id: string;
  kind:
    | 'circle'
    | 'rect'
    | 'triangle'
    | 'line'
    | 'ring'
    | 'dots'
    | 'blob';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  opacity?: number;
  radius?: number;
  rotation?: number;
  lineWidth?: number;
}

export interface ImageSpec {
  fit: 'cover' | 'contain';
  radius: number;
  focal: 'center' | 'top' | 'bottom';
  overlay?: string;
  overlayOpacity?: number;
  /** Fixed height in design units; omit to derive from the source aspect. */
  height?: number;
}

export interface FactItem {
  field?: string;
  label?: string;
  text?: string;
  /** Visual token rendered before the text. */
  icon?: 'calendar' | 'clock' | 'pin' | 'tag' | 'money' | 'phone' | 'mail' | 'globe' | 'check';
}

export type BlockKind =
  | 'text'
  | 'facts'
  | 'list'
  | 'image'
  | 'cta'
  | 'logo'
  | 'divider'
  | 'space'
  | 'rule';

export type ListStyle = 'check' | 'number' | 'dash' | 'dot';

export interface LayoutBlock {
  id: string;
  kind: BlockKind;
  /** Content field this block renders (text/cta/image/facts items). */
  field?: string;
  role: TextRole;
  /** Static text; supports {{token}} substitution. */
  text?: string;
  items?: FactItem[];
  /** Gap above this block in design units. */
  gap?: number;
  align?: Align;
  /** Fraction of the column width (1 = full). */
  width?: number;
  style?: Partial<TextStyle>;
  image?: ImageSpec;
  /** Optional fixed height for a band band. */
  height?: number;
  /** Render the text inside a rounded pill. */
  pill?: boolean;
  /** Optional pill styling. */
  pillStyle?: { fill?: string; textColor?: string; paddingX?: number; paddingY?: number; radius?: number };
  /** Lower priority blocks are dropped first when a layout overflows. */
  priority?: number;
  /** Never drop this block, even when space is tight. */
  essential?: boolean;
  /** Number of fact cells per row. */
  factsColumns?: number;
  /** Alignment of text inside each fact cell. */
  cellAlign?: 'left' | 'center';
  /** Visual treatment for list blocks. */
  listStyle?: ListStyle;
  /** Maximum number of list items shown before the list is clipped. */
  maxItems?: number;
  /** Gap between list rows in design units. */
  listGap?: number;
  /** Colour overrides for fact cells (needed on dark bands). */
  factColors?: { label?: string; value?: string; icon?: string };
  /** Offsets applied after band placement — used for overlapping elements. */
  offsetX?: number;
  offsetY?: number;
  /** Rule/divider colour. */
  color?: string;
  thickness?: number;
}

export interface LayoutColumn {
  /** Fraction of the band width (columns in a band sum to 1). */
  w: number;
  align?: Align;
  gap?: number;
  blocks: LayoutBlock[];
}

export interface LayoutBand {
  id: string;
  /** Fixed height; omit for auto height from content. */
  height?: number;
  minHeight?: number;
  /** Background fill for the band. */
  bg?: Fill;
  padX?: number;
  padY?: number;
  gap?: number;
  /** Horizontal gap between columns inside a band. */
  colGap?: number;
  align?: Align;
  columns?: LayoutColumn[];
  blocks?: LayoutBlock[];
  pin?: 'top' | 'bottom';
  /** Vertical offset applied to the whole band. */
  offsetY?: number;
  /** Absorbs leftover vertical space so the content fills the canvas. */
  flex?: boolean;
  /** Insets the whole band from the canvas edges (cards, side panels). */
  inset?: { left?: number; right?: number };
}

export interface TemplateStyle {
  /** Background of the whole flyer. */
  background: Fill;
  /** Multiplier applied to every type size. */
  scale: number;
  /** Role → type style. */
  roles: Record<TextRole, TextStyle>;
  /** Draw order hint for the logo. */
  logo: { maxWidth: number; maxHeight: number };
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  aspect: AspectKey;
  active: boolean;
  builtin: boolean;
  /** Vocabulary fields this template expects. */
  fields: string[];
  style: TemplateStyle;
  layout: { bands: LayoutBand[]; decorations?: Decoration[] };
  /** Optional poster image for the gallery. */
  previewUrl?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ---------------------------------------------------------------------------
// Resolved layout (the renderer's only input)
// ---------------------------------------------------------------------------

export interface ResolvedText {
  text: string;
  size: number;
  lineHeight: number;
  lines: string[];
  width: number;
  height: number;
  truncated: boolean;
  color?: string;
  opacity?: number;
  family: 'heading' | 'body';
  weight: number;
  tracking: number;
  transform: 'none' | 'upper';
  /** Width of the box the text is aligned within. */
  boxWidth: number;
}

export interface ResolvedFactCell {
  label: string;
  value: string;
  icon?: FactItem['icon'];
  x: number;
  y: number;
  w: number;
  h: number;
  labelSize: number;
  valueSize: number;
  labelLineHeight: number;
  valueLineHeight: number;
  valueLines: string[];
  valueWidth: number;
  /** Horizontal space reserved for a leading icon. */
  iconSpace: number;
  labelColor?: string;
  valueColor?: string;
  iconColor?: string;
  cellAlign?: 'left' | 'center';
}

export interface ResolvedListItem {
  index: number;
  lines: string[];
  lineHeight: number;
  size: number;
  width: number;
  y: number;
  truncated: boolean;
}

export type ResolvedBlock =
  | { kind: 'text'; id: string; x: number; y: number; w: number; role: TextRole; text: ResolvedText; align: Align; pill?: boolean; pillHeight?: number; pillStyle?: LayoutBlock['pillStyle'] }
  | { kind: 'facts'; id: string; x: number; y: number; w: number; cells: ResolvedFactCell[]; align: Align; role: TextRole }
  | { kind: 'list'; id: string; x: number; y: number; w: number; items: ResolvedListItem[]; align: Align; role: TextRole; style: ListStyle; iconSize: number; color?: string; iconColor?: string }
  | { kind: 'image'; id: string; x: number; y: number; w: number; h: number; image: ImageSpec; value: ImageValue }
  | { kind: 'cta'; id: string; x: number; y: number; w: number; h: number; text: ResolvedText; align: Align; pillStyle?: LayoutBlock['pillStyle'] }
  | { kind: 'logo'; id: string; x: number; y: number; w: number; h: number; align: Align }
  | { kind: 'divider'; id: string; x: number; y: number; w: number; thickness: number; color: string }
  | { kind: 'space'; id: string; x: number; y: number; w: number; h: number };

export interface ResolvedBand {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bg?: Fill;
  blocks: ResolvedBlock[];
}

export interface ResolvedLayout {
  width: number;
  height: number;
  bands: ResolvedBand[];
  blocks: ResolvedBlock[];
  decorations: Decoration[];
  background: Fill;
  /** True when content could not be fully shown. */
  overflowed: boolean;
  /** Fields that were dropped to make the layout fit. */
  droppedFields: string[];
  /** The content values that were actually used. */
  used: Record<string, boolean>;
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

export interface TextMetrics {
  width: number;
}

export type MeasureText = (
  text: string,
  font: { family: string; weight: number; size: number; tracking?: number },
) => number;

export interface MeasureImage {
  (url: string): Promise<{ width: number; height: number } | null>;
}

import type { AspectKey, AspectSpec, BrandConfig, FontKey } from './types';

export const FONT_STACKS: Record<FontKey, string> = {
  jakarta: '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  inter: '"Inter Variable", Inter, system-ui, -apple-system, sans-serif',
  serif: '"DM Serif Display", Georgia, "Times New Roman", serif',
};

export const FONT_KEYS: FontKey[] = ['jakarta', 'inter', 'serif'];

export const FONT_LABELS: Record<FontKey, string> = {
  jakarta: 'Plus Jakarta Sans',
  inter: 'Inter',
  serif: 'DM Serif Display',
};

export const ASPECTS: Record<AspectKey, AspectSpec> = {
  square: { key: 'square', label: 'Square (1:1)', width: 1080, height: 1080, exportScale: 2 },
  portrait: { key: 'portrait', label: 'Portrait (4:5)', width: 1080, height: 1350, exportScale: 2 },
  story: { key: 'story', label: 'Story (9:16)', width: 1080, height: 1920, exportScale: 2 },
  landscape: { key: 'landscape', label: 'Landscape (1.91:1)', width: 1200, height: 628, exportScale: 2 },
  a4: { key: 'a4', label: 'A4 print (150dpi)', width: 1240, height: 1754, exportScale: 2 },
};

export const ASPECT_KEYS: AspectKey[] = ['portrait', 'square', 'story', 'landscape', 'a4'];

export const DEFAULT_BRAND: BrandConfig = {
  schoolName: 'Frontlearn Institute',
  tagline: 'Skills for the world of work',
  logoUrl: '/logo.png',
  logoWidth: 1590,
  logoHeight: 444,
  colors: {
    primary: '#12203A',
    secondary: '#1F3A6E',
    accent: '#F2A93B',
    ink: '#16202F',
    paper: '#FFFFFF',
    muted: '#5C6B80',
  },
  fonts: { heading: 'jakarta', body: 'inter' },
  website: 'www.frontlearn.ac.ke',
  phone: '0712 345 678',
  email: 'admissions@frontlearn.ac.ke',
  address: 'Nairobi, Kenya',
  socials: [{ platform: 'Facebook', handle: 'frontlearnke' }],
  defaultCta: 'Apply now',
  footerNote: 'Admissions open for January 2027 intake',
};

/** Palette presets offered in the brand editor. */
export const BRAND_PRESETS: { id: string; name: string; colors: BrandConfig['colors'] }[] = [
  {
    id: 'navy-gold',
    name: 'Navy & Gold',
    colors: { primary: '#12203A', secondary: '#1F3A6E', accent: '#F2A93B', ink: '#16202F', paper: '#FFFFFF', muted: '#5C6B80' },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: { primary: '#12372A', secondary: '#1C5C43', accent: '#E9B949', ink: '#16221D', paper: '#FFFFFF', muted: '#5A6B62' },
  },
  {
    id: 'crimson',
    name: 'Crimson',
    colors: { primary: '#3A1220', secondary: '#6B1F33', accent: '#F0A202', ink: '#241419', paper: '#FFFDFC', muted: '#6B5A5E' },
  },
  {
    id: 'indigo',
    name: 'Indigo',
    colors: { primary: '#1B1F3B', secondary: '#353A70', accent: '#4ECDC4', ink: '#171A2E', paper: '#FFFFFF', muted: '#5E6178' },
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    colors: { primary: '#2E1F17', secondary: '#5A3A28', accent: '#E07A5F', ink: '#241813', paper: '#FFF9F5', muted: '#6E5C52' },
  },
];

export function brandFontStack(brand: BrandConfig, family: 'heading' | 'body'): string {
  return FONT_STACKS[brand.fonts[family]];
}

/** Lighten/darken a hex colour. amount > 0 lightens, < 0 darkens. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const target = amount > 0 ? 255 : 0;
  const p = Math.abs(amount);
  const mix = (c: number) => Math.round((target - c) * p + c);
  return toHex({ r: mix(r), g: mix(g), b: mix(b) });
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function parseHex(hex: string): { r: number; g: number; b: number } {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Relative luminance — used to pick readable foreground colours automatically. */
export function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const srgb = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function readableOn(bg: string, light = '#FFFFFF', dark = '#16202F'): string {
  return luminance(bg) > 0.55 ? dark : light;
}

/**
 * Brand colour tokens.
 *
 * Templates store colour *roles* rather than hex values, so restyling the
 * school restyles every template at once. A literal hex (starting with `#`)
 * is passed through untouched.
 */
export type ColorToken =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'ink'
  | 'paper'
  | 'muted'
  | 'primary-soft'
  | 'secondary-soft'
  | 'accent-soft'
  | 'ink-soft'
  | 'on-primary'
  | 'on-secondary'
  | 'on-accent';

export function resolveColor(value: string | undefined, brand: BrandConfig): string | undefined {
  if (!value) return undefined;
  const key = value.replace(/^\$/, '').trim();
  if (key.startsWith('#')) return value;

  switch (key) {
    case 'on-primary':
      return readableOn(brand.colors.primary);
    case 'on-secondary':
      return readableOn(brand.colors.secondary);
    case 'on-accent':
      return readableOn(brand.colors.accent);
    default:
      break;
  }

  if (key.endsWith('-soft')) {
    const base = key.slice(0, -5) as keyof BrandConfig['colors'];
    const color = brand.colors[base];
    return color ? withAlpha(color, 0.14) : value;
  }

  const color = brand.colors[key as keyof BrandConfig['colors']];
  return color ?? value;
}

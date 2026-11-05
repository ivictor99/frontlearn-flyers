import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_BRAND, readableOn } from '../brand';
import { resolveLayout } from '../layout';
import { BUILTIN_TEMPLATES } from '../templates';
import { fitText, wrapText } from '../typography';
import type { MeasureText } from '../types';

/**
 * Deterministic stub measurer: roughly proportional to the real thing, so
 * tests exercise the fitting logic without a browser.
 */
const measure: MeasureText = (text, font) => {
  const average = 0.52 * font.size;
  return text.length * average + (font.tracking ?? 0) * Math.max(0, text.length - 1);
};

const FULL_CONTENT = {
  eyebrow: 'Admissions open',
  headline: 'January 2027 Intake',
  subhead: 'AI Programming Diploma',
  body: 'Applications are now open for our January intake. We offer diploma and certificate programmes in ICT, engineering and business.',
  program: 'Diploma in ICT',
  date: '20 January 2027',
  time: '9:00 AM',
  venue: 'Main Campus, Nairobi',
  fee: 'KSh 25,000',
  deadline: '20 December 2026',
  cta: 'Apply now',
  highlights: ['Hands-on training', 'Industry placement', 'Flexible payment'],
  bullets: ['Networking', 'Certifications', 'Mentorship'],
  organiser: 'Admissions Office',
  image: { url: '/media/sample.jpg', width: 1600, height: 900, focalX: 0.5, focalY: 0.5 },
};

function resolveWith(content: Record<string, unknown>, templateId = 'admissions-open') {
  const template = BUILTIN_TEMPLATES.find((t) => t.id === templateId)!;
  return resolveLayout(template, DEFAULT_BRAND, content as never, { measure });
}

describe('typography', () => {
  it('wraps text at word boundaries', () => {
    const lines = wrapText('the quick brown fox jumps', measure, { family: 'sans', weight: 400, size: 20, tracking: 0 }, 160);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe('the quick brown fox jumps');
  });

  it('breaks words that are longer than the line', () => {
    const lines = wrapText('supercalifragilistic', measure, { family: 'sans', weight: 400, size: 20, tracking: 0 }, 100);
    expect(lines.length).toBeGreaterThan(1);
  });

  it('shrinks the type until the text fits the line budget', () => {
    const result = fitText(
      {
        text: 'A very long headline that will not fit on one line at the maximum size',
        family: 'sans',
        weight: 800,
        tracking: 0,
        maxWidth: 400,
        minSize: 20,
        maxSize: 80,
        maxLines: 2,
        lineHeightRatio: 1.1,
        transform: 'none',
        fit: 'shrink',
      },
      measure,
    );
    expect(result.size).toBeLessThan(80);
    expect(result.lines.length).toBeLessThanOrEqual(2);
    expect(result.truncated).toBe(false);
  });

  it('never exceeds the line budget even at the minimum size', () => {
    const result = fitText(
      {
        text: 'An extremely long headline that cannot possibly fit within two lines at twenty pixels either',
        family: 'sans',
        weight: 800,
        tracking: 0,
        maxWidth: 120,
        minSize: 20,
        maxSize: 80,
        maxLines: 2,
        lineHeightRatio: 1.1,
        transform: 'none',
        fit: 'shrink',
      },
      measure,
    );
    expect(result.lines.length).toBeLessThanOrEqual(2);
    expect(result.truncated).toBe(true);
  });

  it('shrinks rather than splitting a long word such as an email', () => {
    const result = fitText(
      {
        text: 'admissions@frontlearn.ac.ke',
        family: 'sans',
        weight: 700,
        tracking: 0,
        maxWidth: 260,
        minSize: 12,
        maxSize: 22,
        maxLines: 2,
        lineHeightRatio: 1.2,
        transform: 'none',
        fit: 'shrink',
      },
      measure,
    );
    expect(result.lines.length).toBe(1);
    expect(result.truncated).toBe(false);
  });

  it('keeps fixed-size text at its size and truncates instead', () => {
    const result = fitText(
      {
        text: '20 December 2026 and a great deal more text that will not fit',
        family: 'sans',
        weight: 700,
        tracking: 0,
        maxWidth: 150,
        minSize: 20,
        maxSize: 40,
        maxLines: 1,
        lineHeightRatio: 1.2,
        transform: 'none',
        fit: 'fixed',
      },
      measure,
    );
    expect(result.size).toBe(40);
    expect(result.lines.length).toBe(1);
    expect(result.truncated).toBe(true);
  });
});

describe('layout engine', () => {
  it('lays out a fully populated flyer without overflowing', () => {
    const layout = resolveWith(FULL_CONTENT);
    expect(layout.overflowed).toBe(false);
    expect(layout.blocks.length).toBeGreaterThan(4);
  });

  it('collapses sections when information is missing', () => {
    const full = resolveWith(FULL_CONTENT);
    const sparse = resolveWith({
      eyebrow: 'Admissions open',
      headline: 'January 2027 Intake',
      cta: 'Apply now',
    });
    expect(sparse.blocks.length).toBeLessThan(full.blocks.length);
    expect(sparse.overflowed).toBe(false);
  });

  it('never lets a block fall outside the canvas', () => {
    const layout = resolveWith(FULL_CONTENT);
    for (const block of layout.blocks) {
      expect(block.y).toBeGreaterThanOrEqual(-1);
      expect(block.y + (block.kind === 'text' ? block.text.height : 0)).toBeLessThanOrEqual(layout.height + 1);
    }
  });

  it('adapts the type size when the headline is very long', () => {
    const short = resolveWith({ headline: 'Intake' });
    const long = resolveWith({
      headline:
        'Applications for the January 2027 intake of the AI programming diploma and certificate programmes are now officially open',
    });
    const sizeOf = (layout: ReturnType<typeof resolveWith>) => {
      const block = layout.blocks.find((b) => b.kind === 'text' && b.role === 'headline');
      return block && block.kind === 'text' ? block.text.size : 0;
    };
    expect(sizeOf(long)).toBeLessThan(sizeOf(short));
  });

  it('drops optional content before breaking the layout', () => {
    const layout = resolveWith({
      ...FULL_CONTENT,
      body: 'x'.repeat(600),
      highlights: Array.from({ length: 10 }, (_, i) => `Point number ${i}`),
    });
    expect(layout.overflowed).toBe(false);
  });

  it('works for every built-in template', () => {
    for (const template of BUILTIN_TEMPLATES) {
      const layout = resolveLayout(template, DEFAULT_BRAND, FULL_CONTENT as never, { measure });
      expect(layout.width).toBeGreaterThan(0);
      expect(layout.height).toBeGreaterThan(0);
      expect(layout.blocks.length).toBeGreaterThan(0);
      expect(layout.overflowed).toBe(false);
    }
  });

  it('resolves layouts without a Node process global', () => {
    vi.stubGlobal('process', undefined);
    try {
      const layout = resolveWith({ headline: 'Applications are closing' }, 'admissions-closing');
      expect(layout.blocks.length).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps Applications Closing supporting copy readable on its dark background', () => {
    const layout = resolveWith({ body: 'Applications close soon.' }, 'admissions-closing');
    const body = layout.blocks.find((block) => block.kind === 'text' && block.id === 'body');
    expect(body?.kind).toBe('text');
    if (body?.kind === 'text') {
      expect(body.text.color).toBe(readableOn(DEFAULT_BRAND.colors.primary));
    }
  });

  it('fills the canvas when content is sparse (no big empty gaps)', () => {
    const layout = resolveWith({ headline: 'Hello', cta: 'Join us' }, 'admissions-open');
    const bottomBand = layout.bands[layout.bands.length - 1];
    expect(bottomBand.y + bottomBand.h).toBeLessThanOrEqual(layout.height + 1);
  });
});

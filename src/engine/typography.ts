import type { MeasureText } from './types';

export interface FitOptions {
  text: string;
  /** CSS font stack. */
  family: string;
  weight: number;
  tracking: number;
  maxWidth: number;
  minSize: number;
  maxSize: number;
  maxLines: number;
  lineHeightRatio: number;
  transform: 'none' | 'upper';
  fit: 'shrink' | 'fixed';
}

export interface FitResult {
  size: number;
  lines: string[];
  lineHeight: number;
  /** Width of the widest line. */
  width: number;
  height: number;
  truncated: boolean;
}

const ELLIPSIS = '…';

export interface WrapResult {
  lines: string[];
  /** True when a word had to be split across lines (e.g. a long URL). */
  hardBroken: boolean;
}

/**
 * Greedy word wrap.
 *
 * Words longer than the line are broken by character, and the result reports
 * that it happened so callers can shrink the type instead of splitting an
 * email address or a URL across two lines.
 */
export function wrapTextDetailed(
  text: string,
  measure: MeasureText,
  font: { family: string; weight: number; size: number; tracking: number },
  maxWidth: number,
): WrapResult {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];
  let hardBroken = false;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measure(candidate, font) <= maxWidth || current === '') {
        // A single word wider than the box: hard-break it by character.
        if (current === '' && measure(candidate, font) > maxWidth) {
          hardBroken = true;
          let chunk = '';
          for (const ch of candidate) {
            if (chunk && measure(chunk + ch, font) > maxWidth) {
              lines.push(chunk);
              chunk = ch;
            } else {
              chunk += ch;
            }
          }
          current = chunk;
          continue;
        }
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }

  return { lines: lines.length ? lines : [''], hardBroken };
}

/** Convenience wrapper returning only the lines. */
export function wrapText(
  text: string,
  measure: MeasureText,
  font: { family: string; weight: number; size: number; tracking: number },
  maxWidth: number,
): string[] {
  return wrapTextDetailed(text, measure, font, maxWidth).lines;
}

/** Trim a single line so it fits, appending an ellipsis when cut. */
export function ellipsize(
  text: string,
  measure: MeasureText,
  font: { family: string; weight: number; size: number; tracking: number },
  maxWidth: number,
): string {
  if (measure(text, font) <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = `${text.slice(0, mid).trimEnd()} ${ELLIPSIS}`;
    if (measure(candidate, font) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return `${text.slice(0, lo).trimEnd()} ${ELLIPSIS}`.trim();
}

/**
 * Fit a piece of text into a box.
 *
 * - `shrink` roles adapt their type size between `minSize` and `maxSize` until
 *   the text fits the width and the line budget.
 * - `fixed` roles keep their size and are truncated instead (dates, prices,
 *   labels — shrinking them would break the visual rhythm).
 *
 * Text is never allowed to overflow its box: the last resort is truncation.
 */
export function fitText(opts: FitOptions, measure: MeasureText): FitResult {
  const source = opts.transform === 'upper' ? opts.text.toUpperCase() : opts.text;
  const maxSize = Math.max(1, Math.round(opts.maxSize));
  const minSize = Math.max(1, Math.min(Math.round(opts.minSize), maxSize));

  const fontAt = (size: number) => ({
    family: opts.family,
    weight: opts.weight,
    size,
    tracking: opts.tracking,
  });

  const evaluate = (size: number) => {
    const font = fontAt(size);
    const wrapped = wrapTextDetailed(source, measure, font, opts.maxWidth);
    const lines = wrapped.lines;
    const widths = lines.map((l) => measure(l, font));
    const overflowWidth = widths.some((w) => w > opts.maxWidth + 0.5);
    return { lines, widths, overflowWidth, hardBroken: wrapped.hardBroken, lineCount: lines.length };
  };

  let size = maxSize;
  let result = evaluate(size);

  if (opts.fit === 'fixed') {
    // Keep the size; clip to the line budget.
    if (result.lineCount > opts.maxLines || result.hardBroken) {
      const kept = result.lines.slice(0, opts.maxLines);
      kept[kept.length - 1] = ellipsize(
        `${kept[kept.length - 1]} ${result.lines[opts.maxLines] ?? ''}`.trim(),
        measure,
        fontAt(size),
        opts.maxWidth,
      );
      result = { ...result, lines: kept, widths: kept.map((l) => measure(l, fontAt(size))), lineCount: kept.length };
      return finish(size, result.lines, result.widths, true);
    }
    return finish(size, result.lines, result.widths, false);
  }

  const fits = (r: typeof result) =>
    r.lineCount <= opts.maxLines && !r.overflowWidth && !r.hardBroken;

  if (!fits(result)) {
    // Binary search for the largest size that fits.
    let lo = minSize;
    let hi = maxSize;
    let best: typeof result | null = null;
    let bestSize = minSize;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const r = evaluate(mid);
      if (fits(r)) {
        best = r;
        bestSize = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (best) {
      return finish(bestSize, best.lines, best.widths, false);
    }
    // Even the minimum size overflows: clip to the line budget and the width.
    size = minSize;
    result = evaluate(size);
    const kept = result.lines.slice(0, opts.maxLines);
    const last = ellipsize(
      `${kept[kept.length - 1] ?? ''} ${result.lines[opts.maxLines] ?? ''}`.trim(),
      measure,
      fontAt(size),
      opts.maxWidth,
    );
    kept[kept.length - 1] = last;
    return finish(size, kept, kept.map((l) => measure(l, fontAt(size))), true);
  }

  return finish(size, result.lines, result.widths, false);

  function finish(s: number, lines: string[], widths: number[], truncated: boolean): FitResult {
    const lineHeight = Math.round(s * opts.lineHeightRatio);
    return {
      size: s,
      lines,
      lineHeight,
      width: widths.length ? Math.max(...widths) : 0,
      height: lines.length * lineHeight,
      truncated,
    };
  }
}

/** Scale a fitted block so it fits a given height (used for band compression). */
export function scaleFit(fit: FitResult, maxHeight: number, minRatio = 0.72): FitResult {
  if (fit.height <= maxHeight || fit.height === 0) return fit;
  const ratio = Math.max(minRatio, maxHeight / fit.height);
  const size = Math.max(8, Math.floor(fit.size * ratio));
  const lineHeight = Math.round(size * (fit.lineHeight / fit.size));
  return { ...fit, size, lineHeight, height: fit.lines.length * lineHeight };
}

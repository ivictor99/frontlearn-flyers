import type { MeasureText } from './types';

/**
 * Text measurement.
 *
 * The measurer mirrors exactly how the renderer draws text (same font string,
 * same letter-spacing handling), so a measured width always matches what ends
 * up on the canvas. That equivalence is what keeps the preview faithful and
 * the layout free of overlap.
 */

const cache = new Map<string, number>();
let ctx: CanvasRenderingContext2D | null = null;
let supportsSpacing = false;

function getContext(): CanvasRenderingContext2D | null {
  if (ctx) return ctx;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  ctx = canvas.getContext('2d');
  supportsSpacing = !!ctx && 'letterSpacing' in ctx;
  return ctx;
}

/** Test seam: allows the engine to run against a deterministic stub. */
export function setMeasurementContext(next: CanvasRenderingContext2D | null): void {
  ctx = next;
  supportsSpacing = !!ctx && 'letterSpacing' in ctx;
  cache.clear();
}

export function createMeasurer(): MeasureText {
  return (text, font) => {
    if (!text) return 0;
    const tracking = font.tracking ?? 0;
    const key = `${font.family}|${font.weight}|${font.size}|${tracking}|${text}`;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;

    const context = getContext();
    if (!context) {
      // Rough fallback so the engine still produces a sane layout off-screen.
      const estimate = text.length * font.size * 0.52;
      cache.set(key, estimate);
      return estimate;
    }

    context.font = `${font.weight} ${font.size}px ${font.family}`;
    let width: number;
    if (supportsSpacing) {
      context.letterSpacing = `${tracking}px`;
      width = context.measureText(text).width;
    } else {
      width = 0;
      for (const ch of text) width += context.measureText(ch).width;
      width += tracking * Math.max(0, text.length - 1);
    }
    cache.set(key, width);
    return width;
  };
}

export function clearMeasurementCache(): void {
  cache.clear();
}

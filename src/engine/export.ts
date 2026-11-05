import { ASPECTS } from './brand';
import { loadImages } from './image';
import { resolveLayout } from './layout';
import { renderFlyer } from './render';
import { createMeasurer } from './measure';
import type { BrandConfig, FlyerContent, ResolvedLayout, Template } from './types';

/**
 * Export pipeline.
 *
 * The export renders the *same* resolved layout the preview shows, on a
 * canvas at a higher scale factor. PNG and JPG are encoded by the browser's
 * canvas; PDF is a full-bleed page built with jsPDF.
 */

export interface ExportOptions {
  template: Template;
  brand: BrandConfig;
  content: FlyerContent;
  format: 'png' | 'jpg' | 'pdf';
  /** Multiplier on the design pixels (2 = retina/print). */
  scale?: number;
  fileName?: string;
  /** Known asset sizes for logo placement. */
  assets?: Record<string, { width: number; height: number }>;
}

export interface RenderResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  layout: ResolvedLayout;
}

export interface PaintOptions {
  template: Template;
  brand: BrandConfig;
  content: FlyerContent;
  scale?: number;
  assets?: Record<string, { width: number; height: number }>;
  guides?: boolean;
}

/**
 * Paint a flyer onto an existing canvas element.
 * Used by the live preview so the preview is literally the export.
 */
export async function paintFlyer(
  canvas: HTMLCanvasElement,
  options: PaintOptions,
): Promise<ResolvedLayout> {
  const aspect = ASPECTS[options.template.aspect];
  const scale = options.scale ?? 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');

  const layout = resolveLayout(options.template, options.brand, options.content, {
    measure: createMeasurer(),
    assets: options.assets,
  });

  canvas.width = Math.round(aspect.width * scale);
  canvas.height = Math.round(aspect.height * scale);

  const urls = [
    ...layout.blocks
      .filter((b): b is Extract<typeof b, { kind: 'image' }> => b.kind === 'image')
      .map((b) => b.value.url),
    options.brand.logoUrl ?? '',
  ].filter(Boolean);

  const images = await loadImages(urls);
  renderFlyer(layout, ctx, { brand: options.brand, images, scale, guides: options.guides });
  return layout;
}

export async function renderToCanvas(
  options: Omit<ExportOptions, 'format' | 'fileName'>,
): Promise<RenderResult> {
  const aspect = ASPECTS[options.template.aspect];
  const scale = options.scale ?? aspect.exportScale;
  const canvas = document.createElement('canvas');
  const layout = await paintFlyer(canvas, { ...options, scale });
  return { canvas, width: canvas.width, height: canvas.height, layout };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('The image could not be encoded.'));
    }, type, quality);
  });
}

function safeFileName(name: string): string {
  return name
    .trim()
    .replace(/[^a-z0-9-_ ]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60) || 'flyer';
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function exportFlyer(options: ExportOptions): Promise<void> {
  const baseName = safeFileName(options.fileName ?? options.template.name);
  const result = await renderToCanvas(options);

  if (options.format === 'pdf') {
    const { jsPDF } = await import('jspdf');
    const aspect = ASPECTS[options.template.aspect];
    const isA4 = options.template.aspect === 'a4';
    // Design pixels are 96 dpi, so a page of `px * 0.75` points prints at the
    // size the pixel dimensions imply. A4 templates use the real A4 sheet.
    const pageW = aspect.width * 0.75;
    const pageH = aspect.height * 0.75;
    const doc = isA4
      ? new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
      : new jsPDF({
          orientation: aspect.width >= aspect.height ? 'landscape' : 'portrait',
          unit: 'pt',
          format: [pageW, pageH],
          compress: true,
        });
    const dataUrl = result.canvas.toDataURL('image/png');
    if (isA4) doc.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    else doc.addImage(dataUrl, 'PNG', 0, 0, pageW, pageH, undefined, 'FAST');
    doc.save(`${baseName}.pdf`);
    return;
  }

  const mime = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
  const blob = await canvasToBlob(result.canvas, mime, options.format === 'jpg' ? 0.92 : undefined);
  triggerDownload(blob, `${baseName}.${options.format}`);
}

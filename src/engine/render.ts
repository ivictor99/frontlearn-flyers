import { brandFontStack, readableOn, resolveColor, withAlpha } from './brand';
import { drawIcon } from './icons';
import { coverCrop, focalFor } from './image';
import type {
  BrandConfig,
  Decoration,
  Fill,
  ResolvedBlock,
  ResolvedLayout,
  ResolvedText,
} from './types';

/**
 * The renderer.
 *
 * It receives a fully resolved layout — every position, size and line break is
 * already decided — and paints it. The renderer makes no layout decisions, so
 * the on-screen preview and the exported file are the same picture.
 */

export interface RenderOptions {
  brand: BrandConfig;
  images: Map<string, HTMLImageElement>;
  /** Uniform scale factor (1 = design pixels). */
  scale?: number;
  /** Draw editable-region guides (admin mode). */
  guides?: boolean;
}

export function renderFlyer(
  layout: ResolvedLayout,
  ctx: CanvasRenderingContext2D,
  options: RenderOptions,
): void {
  const { brand, images } = options;
  const scale = options.scale ?? 1;

  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, layout.width, layout.height);

  paintFill(ctx, layout.background, 0, 0, layout.width, layout.height, images, brand);

  for (const decoration of layout.decorations) {
    paintDecoration(ctx, decoration, brand);
  }

  for (const band of layout.bands) {
    if (band.bg) {
      paintFill(ctx, band.bg, band.x, band.y, band.w, band.h, images, brand);
    }
    for (const block of band.blocks) {
      paintBlock(ctx, block, brand, images);
    }
  }

  if (options.guides) {
    paintGuides(ctx, layout);
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

export function paintFill(
  ctx: CanvasRenderingContext2D,
  fill: Fill | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  images: Map<string, HTMLImageElement>,
  brand: BrandConfig,
): void {
  if (!fill || fill.kind === 'none') return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  switch (fill.kind) {
    case 'solid': {
      ctx.globalAlpha = fill.opacity ?? 1;
      ctx.fillStyle = resolveColor(fill.color, brand) ?? fill.color;
      ctx.fillRect(x, y, w, h);
      break;
    }
    case 'linear': {
      const rad = ((fill.angle - 90) * Math.PI) / 180;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const len = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
      const dx = (Math.cos(rad) * len) / 2;
      const dy = (Math.sin(rad) * len) / 2;
      const gradient = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
      gradient.addColorStop(0, resolveColor(fill.from, brand) ?? fill.from);
      gradient.addColorStop(1, resolveColor(fill.to, brand) ?? fill.to);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w, h);
      break;
    }
    case 'radial': {
      const gradient = ctx.createRadialGradient(
        x + w * fill.cx,
        y + h * fill.cy,
        0,
        x + w * fill.cx,
        y + h * fill.cy,
        Math.max(w, h) * 0.75,
      );
      gradient.addColorStop(0, resolveColor(fill.from, brand) ?? fill.from);
      gradient.addColorStop(1, resolveColor(fill.to, brand) ?? fill.to);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w, h);
      break;
    }
    case 'image': {
      const img = images.get(fill.url);
      if (img) {
        const crop = coverCrop(img, { w, h }, 0.5, 0.5);
        ctx.globalAlpha = fill.opacity ?? 1;
        ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, x, y, w, h);
        if (fill.overlay) {
          ctx.globalAlpha = fill.overlayOpacity ?? 0.5;
          ctx.fillStyle = resolveColor(fill.overlay, brand) ?? fill.overlay;
          ctx.fillRect(x, y, w, h);
        }
      } else {
        ctx.fillStyle = brand.colors.paper;
        ctx.fillRect(x, y, w, h);
      }
      break;
    }
  }
  ctx.restore();
}

function paintDecoration(ctx: CanvasRenderingContext2D, d: Decoration, brand: BrandConfig): void {
  ctx.save();
  ctx.globalAlpha = d.opacity ?? 1;
  const decorationColor = resolveColor(d.color, brand) ?? d.color;
  ctx.fillStyle = decorationColor;
  ctx.strokeStyle = decorationColor;
  ctx.translate(d.x + d.w / 2, d.y + d.h / 2);
  if (d.rotation) ctx.rotate((d.rotation * Math.PI) / 180);
  ctx.translate(-d.w / 2, -d.h / 2);

  switch (d.kind) {
    case 'circle':
      ctx.beginPath();
      ctx.ellipse(d.w / 2, d.h / 2, d.w / 2, d.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ring':
      ctx.lineWidth = d.lineWidth ?? 10;
      ctx.beginPath();
      ctx.ellipse(d.w / 2, d.h / 2, d.w / 2 - ctx.lineWidth / 2, d.h / 2 - ctx.lineWidth / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'rect':
      roundRectPath(ctx, 0, 0, d.w, d.h, d.radius ?? 0);
      ctx.fill();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(d.w / 2, 0);
      ctx.lineTo(d.w, d.h);
      ctx.lineTo(0, d.h);
      ctx.closePath();
      ctx.fill();
      break;
    case 'line':
      ctx.fillRect(0, d.h / 2 - (d.lineWidth ?? 2) / 2, d.w, d.lineWidth ?? 2);
      break;
    case 'dots': {
      const cols = Math.max(1, Math.round(d.w / 26));
      const rows = Math.max(1, Math.round(d.h / 26));
      const r = Math.min(d.w / cols, d.h / rows) * 0.22;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          ctx.beginPath();
          ctx.arc((i + 0.5) * (d.w / cols), (j + 0.5) * (d.h / rows), r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'blob': {
      ctx.beginPath();
      ctx.moveTo(0, d.h * 0.35);
      ctx.bezierCurveTo(d.w * 0.25, -d.h * 0.1, d.w * 0.85, d.h * 0.05, d.w, d.h * 0.45);
      ctx.bezierCurveTo(d.w * 1.05, d.h * 0.9, d.w * 0.3, d.h * 1.1, 0, d.h * 0.35);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

function paintBlock(
  ctx: CanvasRenderingContext2D,
  block: ResolvedBlock,
  brand: BrandConfig,
  images: Map<string, HTMLImageElement>,
): void {
  switch (block.kind) {
    case 'text': {
      if (block.pill) {
        const padY = block.pillStyle?.paddingY ?? 14;
        paintPill(ctx, block.x, block.y, block.w, block.pillHeight ?? block.text.height, block.pillStyle, brand);
        drawText(ctx, block.text, block.x, block.y + padY, 'center', brand, block.pillStyle?.textColor);
      } else {
        drawText(ctx, block.text, block.x, block.y, block.align, brand, block.text.color);
      }
      break;
    }
    case 'cta': {
      const fill = block.pillStyle?.fill ?? brand.colors.accent;
      const textColor = block.pillStyle?.textColor ?? readableOn(fill);
      paintPill(ctx, block.x, block.y, block.w, block.h, { ...block.pillStyle, fill, textColor }, brand);
      drawText(ctx, { ...block.text, boxWidth: block.w }, block.x, block.y + (block.h - block.text.height) / 2, 'center', brand, textColor);
      break;
    }
    case 'list': {
      const markerSpace = block.iconSize + 14;
      for (const item of block.items) {
        const itemY = block.y + item.y;
        const markerY = itemY + item.lineHeight * 0.5;
        if (block.style === 'check') {
          drawIcon(ctx, 'check', block.x, markerY - block.iconSize / 2, block.iconSize, block.iconColor ?? brand.colors.accent);
        } else if (block.style === 'number') {
          ctx.save();
          setFont(ctx, brandFontStack(brand, 'heading'), 800, item.size * 1.05, 0);
          ctx.fillStyle = block.iconColor ?? brand.colors.accent;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(item.index + 1), block.x, markerY);
          ctx.restore();
        } else {
          ctx.save();
          ctx.fillStyle = block.iconColor ?? brand.colors.accent;
          if (block.style === 'dot') {
            ctx.beginPath();
            ctx.arc(block.x + block.iconSize * 0.32, markerY, block.iconSize * 0.16, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillRect(block.x, markerY - 2, block.iconSize * 0.72, 4);
          }
          ctx.restore();
        }
        ctx.save();
        setFont(ctx, brandFontStack(brand, 'body'), 600, item.size, 0);
        ctx.fillStyle = block.color ?? brand.colors.ink;
        item.lines.forEach((line, i) => {
          drawRun(ctx, line, block.x + markerSpace, itemY + item.lineHeight * (i + 0.5), block.w - markerSpace, 'left');
        });
        ctx.restore();
      }
      break;
    }
    case 'image': {
      paintImage(ctx, block, images, brand);
      break;
    }
    case 'facts': {
      for (const cell of block.cells) {
        const cellX = block.x + cell.x;
        const cellY = block.y + cell.y;
        let cursor = cellY;
        if (cell.icon) {
          drawIcon(ctx, cell.icon, cellX, cursor + 2, cell.labelSize * 1.5, cell.iconColor ?? brand.colors.accent);
        }
        const indent = cell.iconSpace ?? 0;
        if (cell.label) {
          setFont(ctx, brandFontStack(brand, 'body'), 700, cell.labelSize, cell.labelSize * 0.12);
          ctx.fillStyle = cell.labelColor ?? brand.colors.muted;
          drawRun(ctx, cell.label.toUpperCase(), cellX + indent, cursor + cell.labelSize * 0.55, cell.w - indent, cell.cellAlign ?? 'left');
          cursor += cell.labelLineHeight + 6;
        }
        setFont(ctx, brandFontStack(brand, 'body'), 700, cell.valueSize, 0);
        ctx.fillStyle = cell.valueColor ?? brand.colors.ink;
        cell.valueLines.forEach((line, i) => {
          drawRun(ctx, line, cellX + indent, cursor + cell.valueLineHeight * (i + 0.5), cell.w - indent, cell.cellAlign ?? 'left');
        });
      }
      break;
    }
    case 'logo': {
      paintLogo(ctx, block.x, block.y, block.w, block.h, brand, images, block.align);
      break;
    }
    case 'divider': {
      ctx.save();
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x, block.y, block.w, block.thickness);
      ctx.restore();
      break;
    }
    case 'space':
      break;
  }
}

function paintPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  style: { fill?: string; textColor?: string; paddingX?: number; paddingY?: number; radius?: number } | undefined,
  brand: BrandConfig,
): void {
  const fill = style?.fill ?? brand.colors.accent;
  ctx.save();
  ctx.fillStyle = fill;
  roundRectPath(ctx, x, y, w, h, style?.radius ?? Math.min(h / 2, 28));
  ctx.fill();
  ctx.restore();
}

function paintImage(
  ctx: CanvasRenderingContext2D,
  block: Extract<ResolvedBlock, { kind: 'image' }>,
  images: Map<string, HTMLImageElement>,
  brand: BrandConfig,
): void {
  const img = images.get(block.value.url);
  const { x, y, w, h } = block;
  const radius = block.image.radius ?? 0;

  ctx.save();
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  if (img) {
    const focal = focalFor(block.image.focal, block.value);
    const crop = coverCrop(img, { w, h }, focal.x, focal.y);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, x, y, w, h);
  } else {
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, withAlpha(brand.colors.primary, 0.14));
    gradient.addColorStop(1, withAlpha(brand.colors.accent, 0.2));
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
  }

  if (block.image.overlay) {
    ctx.fillStyle = resolveColor(block.image.overlay, brand) ?? block.image.overlay;
    ctx.globalAlpha = block.image.overlayOpacity ?? 0.4;
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

function paintLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  brand: BrandConfig,
  images: Map<string, HTMLImageElement>,
  align: 'left' | 'center' | 'right' = 'left',
): void {
  const img = brand.logoUrl ? images.get(brand.logoUrl) : undefined;
  ctx.save();
  if (img) {
    const ratio = Math.min(w / img.width, h / img.height);
    const dw = img.width * ratio;
    const dh = img.height * ratio;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    // Wordmark fallback so a school without a logo file still looks designed.
    const family = brandFontStack(brand, 'heading');
    let fontSize = Math.min(h * 0.52, 40);
    setFont(ctx, family, 800, fontSize, -0.01);
    while (fontSize > 12 && ctx.measureText(brand.schoolName).width > w) {
      fontSize -= 1;
      setFont(ctx, family, 800, fontSize, -0.01);
    }
    ctx.fillStyle = brand.colors.ink;
    ctx.textBaseline = 'middle';
    ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
    const anchorX = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x;
    ctx.fillText(brand.schoolName, anchorX, y + h / 2);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

function setFont(
  ctx: CanvasRenderingContext2D,
  family: string,
  weight: number,
  size: number,
  tracking: number,
): void {
  ctx.font = `${weight} ${size}px ${family}`;
  const withSpacing = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
  if ('letterSpacing' in withSpacing) withSpacing.letterSpacing = `${tracking}px`;
}

function supportsLetterSpacing(ctx: CanvasRenderingContext2D): boolean {
  return 'letterSpacing' in (ctx as CanvasRenderingContext2D & { letterSpacing?: string });
}

function drawRun(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  boxWidth: number,
  align: 'left' | 'center' | 'right',
): void {
  const spacing = (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing;
  const tracking = spacing ? parseFloat(spacing) || 0 : 0;

  if (supportsLetterSpacing(ctx)) {
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const anchor = align === 'left' ? x : align === 'center' ? x + boxWidth / 2 : x + boxWidth;
    ctx.fillText(text, anchor, y);
    return;
  }

  // Fallback: manual character placement with tracking.
  const width = measureWithTracking(ctx, text, tracking);
  let cursor =
    align === 'left' ? x : align === 'center' ? x + (boxWidth - width) / 2 : x + boxWidth - width;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + tracking;
  }
}

function measureWithTracking(ctx: CanvasRenderingContext2D, text: string, tracking: number): number {
  let width = 0;
  for (const ch of text) width += ctx.measureText(ch).width;
  return width + tracking * Math.max(0, text.length - 1);
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: ResolvedText,
  x: number,
  y: number,
  align: 'left' | 'center' | 'right',
  brand: BrandConfig,
  colorOverride?: string,
): void {
  ctx.save();
  if (text.opacity !== undefined) ctx.globalAlpha = text.opacity;
  setFont(ctx, brandFontStack(brand, text.family), text.weight, text.size, text.tracking);
  ctx.fillStyle = colorOverride ?? text.color ?? brand.colors.ink;
  text.lines.forEach((line, i) => {
    drawRun(ctx, line, x, y + text.lineHeight * (i + 0.5), text.boxWidth, align);
  });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function paintGuides(ctx: CanvasRenderingContext2D, layout: ResolvedLayout): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
  ctx.setLineDash([8, 8]);
  ctx.lineWidth = 2;
  for (const band of layout.bands) {
    ctx.strokeRect(band.x + 2, band.y + 2, band.w - 4, Math.max(0, band.h - 4));
  }
  ctx.restore();
}

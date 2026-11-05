import { ASPECTS, brandFontStack, resolveColor } from './brand';
import { fitText, wrapText } from './typography';
import type {
  BrandConfig,
  ContentValue,
  FlyerContent,
  ImageValue,
  LayoutBand,
  LayoutBlock,
  LayoutColumn,
  MeasureText,
  ResolvedBand,
  ResolvedBlock,
  ResolvedFactCell,
  ResolvedLayout,
  ResolvedListItem,
  ResolvedText,
  Template,
  TextRole,
  TextStyle,
} from './types';

/**
 * The layout engine.
 *
 * Takes a declarative template + brand + content and produces absolute geometry:
 * every block knows exactly where it is, at what size, with which line breaks.
 *
 * It is pure — the only browser dependency is the injected `measureText`
 * function, which keeps it unit-testable and portable to a server renderer.
 */

export interface AssetSize {
  width: number;
  height: number;
}

export interface ResolveOptions {
  measure: MeasureText;
  /** Known pixel sizes for logo/media assets, keyed by URL. */
  assets?: Record<string, AssetSize>;
}

interface ComposeConfig {
  dropped: Set<string>;
  typeScale: number;
  gapScale: number;
  /** Multiplier applied to image heights when the flyer is too tall. */
  imageScale: number;
  /** Ids of blocks that were dropped for space, mapped to the field they used. */
  droppedFields: Map<string, string>;
}

export const DEFAULT_ROLE_STYLE: Record<TextRole, TextStyle> = {
  eyebrow: { family: 'heading', weight: 700, size: 26, lineHeight: 1.2, tracking: 0.16, transform: 'upper', align: 'left', maxLines: 1, minSize: 16, maxSize: 30, fit: 'shrink' },
  headline: { family: 'heading', weight: 800, size: 78, lineHeight: 1.06, tracking: -0.01, transform: 'none', align: 'left', maxLines: 3, minSize: 38, maxSize: 96, fit: 'shrink' },
  subhead: { family: 'heading', weight: 600, size: 36, lineHeight: 1.22, tracking: -0.005, transform: 'none', align: 'left', maxLines: 3, minSize: 22, maxSize: 44, fit: 'shrink' },
  body: { family: 'body', weight: 400, size: 26, lineHeight: 1.5, tracking: 0, transform: 'none', align: 'left', maxLines: 6, minSize: 18, maxSize: 30, fit: 'shrink' },
  cta: { family: 'heading', weight: 700, size: 30, lineHeight: 1.1, tracking: 0.04, transform: 'upper', align: 'center', maxLines: 1, minSize: 18, maxSize: 34, fit: 'shrink' },
  meta: { family: 'body', weight: 500, size: 24, lineHeight: 1.35, tracking: 0, transform: 'none', align: 'left', maxLines: 2, minSize: 16, maxSize: 28, fit: 'shrink' },
  label: { family: 'body', weight: 700, size: 19, lineHeight: 1.25, tracking: 0.12, transform: 'upper', align: 'left', maxLines: 1, minSize: 13, maxSize: 22, fit: 'shrink' },
  display: { family: 'heading', weight: 800, size: 120, lineHeight: 1, tracking: -0.03, transform: 'none', align: 'center', maxLines: 1, minSize: 60, maxSize: 160, fit: 'shrink' },
  number: { family: 'heading', weight: 800, size: 92, lineHeight: 1, tracking: -0.02, transform: 'none', align: 'left', maxLines: 1, minSize: 44, maxSize: 120, fit: 'shrink' },
};

const TOKEN_RE = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;

export function resolveTemplateTokens(text: string, brand: BrandConfig): string {
  return text.replace(TOKEN_RE, (_, key: string) => {
    switch (key) {
      case 'schoolName':
        return brand.schoolName;
      case 'tagline':
        return brand.tagline;
      case 'website':
        return brand.website;
      case 'phone':
        return brand.phone;
      case 'email':
        return brand.email;
      case 'address':
        return brand.address;
      case 'footerNote':
        return brand.footerNote;
      case 'cta':
        return brand.defaultCta;
      default:
        return '';
    }
  });
}

function contentString(content: FlyerContent, key: string | undefined): string {
  if (!key) return '';
  const value = content[key];
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.join('\n').trim();
  return '';
}

function contentImage(content: FlyerContent, key: string | undefined): ImageValue | null {
  if (!key) return null;
  const value = content[key];
  if (value && typeof value === 'object' && !Array.isArray(value) && 'url' in value) return value;
  return null;
}

/** Resolve the effective style for a role, honouring block overrides and scaling. */
function styleFor(
  template: Template,
  role: TextRole,
  override: Partial<TextStyle> | undefined,
  config: ComposeConfig,
  brand: BrandConfig,
): TextStyle {
  const base = { ...(template.style.roles[role] ?? DEFAULT_ROLE_STYLE[role] ?? DEFAULT_ROLE_STYLE.body) };
  const merged: TextStyle = { ...base, ...(override ?? {}) };
  merged.color = resolveColor(merged.color, brand);
  merged.iconColor = resolveColor(merged.iconColor, brand);
  const scale = (template.style.scale || 1) * config.typeScale;
  merged.size = Math.round(merged.size * scale);
  merged.minSize = Math.max(8, Math.round(merged.minSize * scale));
  merged.maxSize = Math.max(merged.minSize, Math.round(merged.maxSize * scale));
  merged.lineHeight = merged.lineHeight || 1.2;
  return merged;
}

function placeX(align: LayoutColumn['align'] | 'left' | 'center' | 'right', boxW: number, containerW: number): number {
  if (align === 'center') return (containerW - boxW) / 2;
  if (align === 'right') return containerW - boxW;
  return 0;
}

interface MeasuredColumn {
  x: number;
  w: number;
  align: LayoutColumn['align'];
  height: number;
  blocks: { block: LayoutBlock; resolved: ResolvedBlock; height: number }[];
}

interface MeasuredBand {
  band: LayoutBand;
  height: number;
  columns: MeasuredColumn[];
}

/**
 * Compose the template into absolute geometry.
 * `config` controls the compression strategy (dropped blocks, type scale, gaps).
 */
function compose(
  template: Template,
  brand: BrandConfig,
  content: FlyerContent,
  options: ResolveOptions,
  config: ComposeConfig,
): ResolvedLayout {
  const aspect = ASPECTS[template.aspect];
  const canvasW = aspect.width;
  const canvasH = aspect.height;
  const measure = options.measure;
  const used: Record<string, boolean> = {};
  const resolvedBands: ResolvedBand[] = [];

  const topBands: LayoutBand[] = [];
  const flowBands: LayoutBand[] = [];
  const bottomBands: LayoutBand[] = [];
  for (const band of template.layout.bands) {
    if (band.pin === 'top') topBands.push(band);
    else if (band.pin === 'bottom') bottomBands.push(band);
    else flowBands.push(band);
  }

  const measureBand = (band: LayoutBand, extraGap = 0): MeasuredBand => {
    const padX = band.padX ?? 0;
    const padY = band.padY ?? 0;
    const bandX = band.inset?.left ?? 0;
    const bandW = Math.max(0, canvasW - (band.inset?.left ?? 0) - (band.inset?.right ?? 0));
    const innerW = Math.max(0, bandW - padX * 2);
    const rawColumns: LayoutColumn[] = band.columns?.length
      ? band.columns
      : [{ w: 1, align: band.align, blocks: band.blocks ?? [] }];
    const colGap = band.colGap ?? 0;
    const totalW = rawColumns.reduce((sum, c) => sum + c.w, 0) || 1;
    const usable = innerW - colGap * Math.max(0, rawColumns.length - 1);

    let cursorX = bandX + padX;
    const columns: MeasuredColumn[] = rawColumns.map((col) => {
      const colW = (usable * col.w) / totalW;
      const x = cursorX;
      cursorX += colW + colGap;
      return { x, w: colW, align: col.align ?? band.align ?? 'left', height: padY, blocks: [] };
    });

    rawColumns.forEach((col, colIndex) => {
      const target = columns[colIndex];
      const colGapInner = (col.gap ?? 0) * config.gapScale;
      // In a flexible band the spare space sits above the closing block, so the
      // call to action sits at the bottom instead of floating in the middle.
      const lastIndex = col.blocks.length - 1;
      const extraGapBefore = (blockIndex: number) => (blockIndex === lastIndex ? extraGap : 0);
      let y = padY;
      col.blocks.forEach((block, blockIndex) => {
        if (config.dropped.has(block.id)) {
          if (block.field) config.droppedFields.set(block.id, block.field);
          return;
        }
        const prepared = prepareBlock(block, target.w, template, brand, content, options, config, measure, used);
        if (!prepared) return;
        const gapBefore =
          (blockIndex === 0 ? 0 : colGapInner) + (block.gap ?? 0) * config.gapScale + extraGapBefore(blockIndex);
        y += gapBefore;
        const resolved = prepared.resolved;
        if (resolved) {
          const x = target.x + placeX(target.align, resolved.w, target.w);
          resolved.x = x;
          resolved.y = y;
          target.blocks.push({ block, resolved, height: prepared.height });
        }
        y += prepared.height;
      });
      target.height = y + padY;
    });

    const contentHeight = Math.max(0, ...columns.map((c) => c.height));
    const height = band.height ?? Math.max(band.minHeight ?? 0, contentHeight);
    return { band, height, columns };
  };

  const measuredTop = topBands.map((band) => measureBand(band));
  const measuredFlow = flowBands.map((band) => measureBand(band));
  const measuredBottom = bottomBands.map((band) => measureBand(band));

  const emit = (m: MeasuredBand, y: number): ResolvedBand => ({
    id: m.band.id,
    x: m.band.inset?.left ?? 0,
    y,
    w: Math.max(0, canvasW - (m.band.inset?.left ?? 0) - (m.band.inset?.right ?? 0)),
    h: m.height,
    bg: m.band.bg,
    blocks: m.columns.flatMap((c) =>
      c.blocks.map((b) => ({
        ...b.resolved,
        x: b.resolved.x + (b.block.offsetX ?? 0),
        y: b.resolved.y + y + (b.block.offsetY ?? 0),
      })),
    ),
  });

  // --- distribute leftover space to flexible bands ------------------------
  const allMeasured = [...measuredTop, ...measuredFlow, ...measuredBottom];
  const gapTotal = allMeasured.reduce((sum, m) => sum + (m.band.gap ?? 0) * config.gapScale, 0);
  const fixedTotal = allMeasured.reduce((sum, m) => sum + m.height, 0);
  const leftover = canvasH - fixedTotal - gapTotal;
  const flexBands = allMeasured.filter((m) => m.band.flex);
  if (leftover > 0 && flexBands.length > 0) {
    const share = leftover / flexBands.length;
    for (const m of flexBands) {
      const blockCount = m.columns.reduce((sum, column) => sum + column.blocks.length, 0);
      // The whole share goes into a single gap, so the band fills exactly.
      const extraGap = blockCount > 0 ? share : 0;
      const remeasured = measureBand(m.band, extraGap);
      m.height = remeasured.height;
      m.columns = remeasured.columns;
    }
  }

  // --- vertical placement -------------------------------------------------
  let y = 0;
  for (const m of measuredTop) {
    resolvedBands.push(emit(m, y + (m.band.offsetY ?? 0)));
    y += m.height + (m.band.gap ?? 0) * config.gapScale;
  }

  const bottomTotal = measuredBottom.reduce(
    (sum, m) => sum + m.height + (m.band.gap ?? 0) * config.gapScale,
    0,
  );

  for (const m of measuredFlow) {
    resolvedBands.push(emit(m, y + (m.band.offsetY ?? 0)));
    y += m.height + (m.band.gap ?? 0) * config.gapScale;
  }

  const flowEnd = y;
  let bottomY = canvasH - bottomTotal;
  if (bottomY < flowEnd) bottomY = flowEnd; // overflow: pushed below the canvas
  for (const m of measuredBottom) {
    resolvedBands.push(emit(m, bottomY + (m.band.offsetY ?? 0)));
    bottomY += m.height + (m.band.gap ?? 0) * config.gapScale;
  }

  const overflowed = flowEnd > canvasH + 1 || bottomY > canvasH + 1;
  if (typeof process !== 'undefined' && process.env.FLYER_DEBUG) {
    console.log(
      '[compose]',
      'img', config.imageScale,
      'type', config.typeScale,
      '|', [...measuredTop, ...measuredFlow, ...measuredBottom].map((m) => `${m.band.id}:${Math.round(m.height)}`).join(' '),
      '| flowEnd', Math.round(flowEnd), 'canvas', canvasH,
    );
  }

  return {
    width: canvasW,
    height: canvasH,
    bands: resolvedBands,
    blocks: resolvedBands.flatMap((b) => b.blocks),
    decorations: template.layout.decorations ?? [],
    background: template.style.background,
    overflowed,
    droppedFields: [...config.droppedFields.values()],
    used,
  };
}

/**
 * Prepare one block: measure it and produce its resolved representation.
 * Returns null when the block has no content (missing information collapses).
 */
function prepareBlock(
  block: LayoutBlock,
  columnWidth: number,
  template: Template,
  brand: BrandConfig,
  content: FlyerContent,
  options: ResolveOptions,
  config: ComposeConfig,
  measure: MeasureText,
  used: Record<string, boolean>,
): { block: LayoutBlock; height: number; resolved: ResolvedBlock } | null {
  const style = styleFor(template, block.role, block.style, config, brand);
  const align = block.align ?? style.align;
  const boxWidth = columnWidth * (block.width ?? 1);

  /**
   * Field values fall back to the brand for contact details, so the school
   * phone / email / website appear on every flyer without being retyped.
   */
  const fieldValue = (field: string | undefined): string => {
    if (!field) return '';
    const direct = contentString(content, field);
    if (direct) return direct;
    switch (field) {
      case 'phone':
        return brand.phone;
      case 'email':
        return brand.email;
      case 'website':
        return brand.website;
      case 'address':
        return brand.address;
      default:
        return '';
    }
  };

  switch (block.kind) {
    case 'text': {
      const raw = block.field ? fieldValue(block.field) : resolveTemplateTokens(block.text ?? '', brand);
      if (!raw) return null;
      if (block.field) used[block.field] = true;
      const font = brandFontStack(brand, style.family);
      const fit = fitText(
        {
          text: raw,
          family: font,
          weight: style.weight,
          tracking: style.tracking * style.size,
          maxWidth: boxWidth,
          minSize: style.minSize,
          maxSize: style.maxSize,
          maxLines: style.maxLines,
          lineHeightRatio: style.lineHeight,
          transform: style.transform,
          fit: style.fit,
        },
        measure,
      );
      const text: ResolvedText = {
        text: raw,
        size: fit.size,
        lineHeight: fit.lineHeight,
        lines: fit.lines,
        width: fit.width,
        height: fit.height,
        truncated: fit.truncated,
        color: style.color,
        opacity: style.opacity,
        family: style.family,
        weight: style.weight,
        tracking: style.tracking * style.size,
        transform: style.transform,
        boxWidth,
      };
      let resolvedWidth = boxWidth;
      let pillHeight: number | undefined;
      let resolvedAlign = align;
      if (block.pill) {
        const padX = block.pillStyle?.paddingX ?? 28;
        const padY = block.pillStyle?.paddingY ?? 14;
        resolvedWidth = Math.min(boxWidth, fit.width + padX * 2);
        pillHeight = fit.height + padY * 2;
        text.boxWidth = resolvedWidth;
        resolvedAlign = 'center';
      }
      const resolved: ResolvedBlock = {
        kind: 'text',
        id: block.id,
        x: 0,
        y: 0,
        w: resolvedWidth,
        role: block.role,
        text,
        align: resolvedAlign,
        pill: block.pill,
        pillHeight,
        pillStyle: block.pillStyle
          ? { ...block.pillStyle, fill: resolveColor(block.pillStyle.fill, brand), textColor: resolveColor(block.pillStyle.textColor, brand) }
          : undefined,
      };
      return { block, height: pillHeight ?? fit.height, resolved };
    }

    case 'cta': {
      const raw =
        contentString(content, block.field ?? 'cta') ||
        resolveTemplateTokens(block.text ?? '', brand) ||
        brand.defaultCta;
      if (!raw) return null;
      if (block.field) used[block.field] = true;
      const font = brandFontStack(brand, style.family);
      const padX = block.pillStyle?.paddingX ?? 34;
      const padY = block.pillStyle?.paddingY ?? 18;
      const fit = fitText(
        {
          text: raw,
          family: font,
          weight: style.weight,
          tracking: style.tracking * style.size,
          maxWidth: Math.max(40, boxWidth - padX * 2),
          minSize: style.minSize,
          maxSize: style.maxSize,
          maxLines: 1,
          lineHeightRatio: style.lineHeight,
          transform: style.transform,
          fit: 'shrink',
        },
        measure,
      );
      const text: ResolvedText = {
        text: raw,
        size: fit.size,
        lineHeight: fit.lineHeight,
        lines: fit.lines,
        width: fit.width,
        height: fit.height,
        truncated: fit.truncated,
        color: style.color,
        opacity: style.opacity,
        family: style.family,
        weight: style.weight,
        tracking: style.tracking * style.size,
        transform: style.transform,
        boxWidth,
      };
      const width = Math.min(boxWidth, fit.width + padX * 2);
      const height = fit.height + padY * 2;
      text.boxWidth = width;
      const resolved: ResolvedBlock = {
        kind: 'cta',
        id: block.id,
        x: 0,
        y: 0,
        w: width,
        h: height,
        text,
        align,
        pillStyle: {
          ...(block.pillStyle ?? {}),
          paddingX: padX,
          paddingY: padY,
          fill: resolveColor(block.pillStyle?.fill, brand),
          textColor: resolveColor(block.pillStyle?.textColor, brand),
        },
      };
      return { block, height, resolved };
    }

    case 'facts': {
      const items = (block.items ?? [])
        .map((item) => {
          const value = item.field
            ? fieldValue(item.field)
            : resolveTemplateTokens(item.text ?? '', brand);
          return { item, value };
        })
        .filter((entry) => entry.value.length > 0);
      if (items.length === 0) return null;
      for (const entry of items) if (entry.item.field) used[entry.item.field] = true;

      const columnsCount = Math.max(1, Math.min(block.factsColumns ?? 3, items.length));
      const rows = Math.ceil(items.length / columnsCount);
      const colW = (boxWidth - 24 * (columnsCount - 1)) / columnsCount;
      const labelStyle = styleFor(template, 'label', undefined, config, brand);
      const valueStyle = styleFor(template, 'meta', { weight: 700 }, config, brand);
      const labelFont = brandFontStack(brand, labelStyle.family);
      const valueFont = brandFontStack(brand, valueStyle.family);

      const prepared = items.map((entry) => {
        const label = entry.item.label ? resolveTemplateTokens(entry.item.label, brand) : '';
        const iconSpace = entry.item.icon ? Math.round(labelStyle.size * 1.5) + 12 : 0;
        const textWidth = Math.max(20, colW - iconSpace);
        const valueFit = fitText(
          {
            text: entry.value,
            family: valueFont,
            weight: valueStyle.weight,
            tracking: valueStyle.tracking * valueStyle.size,
            maxWidth: textWidth,
            // Allowed to shrink further so an email or URL never breaks mid-word.
            minSize: Math.max(11, Math.round(valueStyle.size * 0.58)),
            maxSize: valueStyle.maxSize,
            maxLines: 2,
            lineHeightRatio: valueStyle.lineHeight,
            transform: 'none',
            fit: 'shrink',
          },
          measure,
        );
        const labelFit = label
          ? fitText(
              {
                text: label,
                family: labelFont,
                weight: labelStyle.weight,
                tracking: labelStyle.tracking * labelStyle.size,
                maxWidth: textWidth,
                minSize: labelStyle.minSize,
                maxSize: labelStyle.maxSize,
                maxLines: 1,
                lineHeightRatio: labelStyle.lineHeight,
                transform: labelStyle.transform,
                fit: 'shrink',
              },
              measure,
            )
          : null;
        const h = (labelFit?.height ?? 0) + (labelFit ? 8 : 0) + valueFit.height;
        return { entry, labelFit, valueFit, h, iconSpace };
      });

      const rowHeights = new Array(rows).fill(0);
      prepared.forEach((p, i) => {
        const row = Math.floor(i / columnsCount);
        rowHeights[row] = Math.max(rowHeights[row], p.h);
      });

      const rowGap = 26 * config.gapScale;
      const cells: ResolvedFactCell[] = [];
      prepared.forEach((p, i) => {
        const row = Math.floor(i / columnsCount);
        const col = i % columnsCount;
        cells.push({
          label: p.entry.item.label ? resolveTemplateTokens(p.entry.item.label, brand) : '',
          value: p.entry.value,
          icon: p.entry.item.icon,
          x: col * (colW + 24),
          y: row * (rowHeights[row] + rowGap),
          w: colW,
          h: p.h,
          labelSize: p.labelFit?.size ?? 0,
          valueSize: p.valueFit.size,
          labelLineHeight: p.labelFit?.lineHeight ?? 0,
          valueLineHeight: p.valueFit.lineHeight,
          valueLines: p.valueFit.lines,
          valueWidth: p.valueFit.width,
          iconSpace: p.iconSpace,
          labelColor: resolveColor(block.factColors?.label, brand) ?? labelStyle.color,
          valueColor: resolveColor(block.factColors?.value, brand) ?? valueStyle.color,
          iconColor: resolveColor(block.factColors?.icon, brand) ?? valueStyle.iconColor,
          cellAlign: block.cellAlign ?? 'left',
        });
      });

      const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0) + rowGap * (rows - 1);
      const resolved: ResolvedBlock = {
        kind: 'facts',
        id: block.id,
        x: 0,
        y: 0,
        w: boxWidth,
        cells,
        align,
        role: block.role,
      };
      return { block, height: totalHeight, resolved };
    }

    case 'list': {
      const raw = contentString(content, block.field ?? 'bullets');
      if (!raw) return null;
      used[block.field ?? 'bullets'] = true;
      const allItems = raw
        .split(/\r?\n/)
        .map((s) => s.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);
      if (allItems.length === 0) return null;

      const listStyle = block.listStyle ?? 'check';
      const maxItems = block.maxItems ?? 4;
      const shown = allItems.slice(0, maxItems);
      const clipped = allItems.length > maxItems;
      const itemStyle = styleFor(template, block.role, block.style, config, brand);
      const font = brandFontStack(brand, itemStyle.family);
      const iconSize = Math.round(itemStyle.size * 1.15);
      const markerSpace = listStyle === 'number' ? iconSize + 14 : iconSize + 14;
      const textWidth = Math.max(30, boxWidth - markerSpace);
      const rowGap = (block.listGap ?? 14) * config.gapScale;

      const items: ResolvedListItem[] = [];
      let cursor = 0;
      shown.forEach((rawItem, i) => {
        const isLast = i === shown.length - 1;
        const text = isLast && clipped ? `${rawItem} …` : rawItem;
        const fit = fitText(
          {
            text,
            family: font,
            weight: itemStyle.weight,
            tracking: itemStyle.tracking * itemStyle.size,
            maxWidth: textWidth,
            minSize: itemStyle.minSize,
            maxSize: itemStyle.maxSize,
            maxLines: 2,
            lineHeightRatio: itemStyle.lineHeight,
            transform: itemStyle.transform,
            fit: 'shrink',
          },
          measure,
        );
        items.push({
          index: i,
          lines: fit.lines,
          lineHeight: fit.lineHeight,
          size: fit.size,
          width: fit.width,
          y: cursor,
          truncated: fit.truncated,
        });
        cursor += fit.height + rowGap;
      });

      const height = Math.max(0, cursor - rowGap);
      const resolved: ResolvedBlock = {
        kind: 'list',
        id: block.id,
        x: 0,
        y: 0,
        w: boxWidth,
        items,
        align,
        role: block.role,
        style: listStyle,
        iconSize,
        color: itemStyle.color,
        iconColor: itemStyle.iconColor,
      };
      return { block, height, resolved };
    }

    case 'image': {
      const value = contentImage(content, block.field ?? 'image');
      if (!value) return null;
      used[block.field ?? 'image'] = true;
      const imgStyle = block.image ?? { fit: 'cover', radius: 0, focal: 'center' };
      const width = boxWidth;
      const naturalHeight =
        block.height ??
        (block.image?.height ??
          (value.height && value.width ? (width * value.height) / value.width : width * 0.62));
      const height = Math.max(120, naturalHeight * config.imageScale);
      const resolved: ResolvedBlock = {
        kind: 'image',
        id: block.id,
        x: 0,
        y: 0,
        w: width,
        h: height,
        image: imgStyle,
        value,
      };
      return { block, height, resolved };
    }

    case 'logo': {
      const url = brand.logoUrl;
      const asset = url ? options.assets?.[url] : undefined;
      // Prefer the measured asset, then the dimensions stored on the brand.
      const logoWidth = asset?.width ?? brand.logoWidth ?? undefined;
      const logoHeight = asset?.height ?? brand.logoHeight ?? undefined;
      const maxW = template.style.logo.maxWidth;
      const maxH = template.style.logo.maxHeight;
      let width = maxW;
      let height = maxH;
      if (logoWidth && logoHeight) {
        const ratio = Math.min(maxW / logoWidth, maxH / logoHeight);
        width = logoWidth * ratio;
        height = logoHeight * ratio;
      } else {
        // No logo file: size the wordmark so it reads as a real logo lockup.
        const fontSize = Math.min(maxH * 0.52, 40);
        const measured = measure(brand.schoolName, {
          family: brandFontStack(brand, 'heading'),
          weight: 800,
          size: fontSize,
          tracking: -0.01,
        });
        width = Math.min(maxW, Math.max(70, measured + 4));
      }
      const resolved: ResolvedBlock = { kind: 'logo', id: block.id, x: 0, y: 0, w: width, h: height, align };
      return { block, height, resolved };
    }

    case 'divider':
    case 'rule': {
      const thickness = block.thickness ?? 2;
      const resolved: ResolvedBlock = {
        kind: 'divider',
        id: block.id,
        x: 0,
        y: 0,
        w: boxWidth,
        thickness,
        color: resolveColor(block.color, brand) ?? style.color ?? brand.colors.accent,
      };
      return { block, height: thickness, resolved };
    }

    case 'space': {
      const height = block.height ?? 0;
      const resolved: ResolvedBlock = { kind: 'space', id: block.id, x: 0, y: 0, w: boxWidth, h: height };
      return { block, height, resolved };
    }

    default:
      return null;
  }
}

/**
 * Resolve a template into a draw-ready layout.
 *
 * Overflow is resolved in escalating stages:
 *   1. drop the lowest-priority optional blocks,
 *   2. scale the type down,
 *   3. compress the gaps,
 *   4. clip and flag the result.
 */
export function resolveLayout(
  template: Template,
  brand: BrandConfig,
  content: FlyerContent,
  options: ResolveOptions,
): ResolvedLayout {
  const base: ComposeConfig = {
    dropped: new Set(),
    typeScale: 1,
    gapScale: 1,
    imageScale: 1,
    droppedFields: new Map(),
  };

  let result = compose(template, brand, content, options, base);
  if (!result.overflowed) return result;

  const droppable = collectDroppable(template);

  // Stage 1 — a touch smaller type; barely noticeable, saves real space.
  for (const scale of [0.94, 0.88]) {
    base.typeScale = scale;
    result = compose(template, brand, content, options, base);
    if (!result.overflowed) return result;
  }

  // Stage 2 — give the picture less room before anything disappears.
  for (const scale of [0.85, 0.72, 0.6]) {
    base.imageScale = scale;
    result = compose(template, brand, content, options, base);
    if (!result.overflowed) return result;
  }

  // Stage 3 — trim the least important copy first (body text, long lists).
  for (const block of droppable.filter((b) => (b.priority ?? defaultPriority(b)) >= 6)) {
    base.dropped.add(block.id);
    result = compose(template, brand, content, options, base);
    if (!result.overflowed) return result;
  }

  // Stage 4 — shrink the type further, then the picture.
  for (const scale of [0.82, 0.76]) {
    base.typeScale = scale;
    result = compose(template, brand, content, options, base);
    if (!result.overflowed) return result;
  }
  for (const scale of [0.5]) {
    base.imageScale = scale;
    result = compose(template, brand, content, options, base);
    if (!result.overflowed) return result;
  }

  // Stage 5 — drop the remaining optional blocks, least important first.
  for (const block of droppable) {
    if (base.dropped.has(block.id)) continue;
    base.dropped.add(block.id);
    result = compose(template, brand, content, options, base);
    if (!result.overflowed) return result;
  }

  // Stage 6 — compress the gaps.
  for (const gapScale of [0.8, 0.6, 0.4]) {
    base.gapScale = gapScale;
    result = compose(template, brand, content, options, base);
    if (!result.overflowed) return result;
  }

  return result;
}

/**
 * How important a block is.
 *
 * Lower numbers are more important. The headline is sacred: it is never
 * dropped, only resized.
 */
export function defaultPriority(block: LayoutBlock): number {
  if (block.role === 'headline') return 0;
  if (block.kind === 'cta') return 1;
  if (['eyebrow', 'subhead', 'display', 'number', 'label'].includes(block.role)) return 2;
  if (block.kind === 'image') return 3;
  if (block.kind === 'facts') return 4;
  if (block.kind === 'logo') return 5;
  if (block.kind === 'list') return 6;
  return 7;
}

export function isEssential(block: LayoutBlock): boolean {
  return block.essential === true || block.role === 'headline';
}

function collectDroppable(template: Template): LayoutBlock[] {
  const blocks: LayoutBlock[] = [];
  for (const band of template.layout.bands) {
    const columns = band.columns?.length ? band.columns : [{ w: 1, blocks: band.blocks ?? [] }];
    for (const col of columns) {
      for (const block of col.blocks) {
        if (isEssential(block)) continue;
        if (block.kind === 'space' || block.kind === 'divider' || block.kind === 'rule') continue;
        blocks.push(block);
      }
    }
  }
  // Least important first — that is the order in which they are sacrificed.
  return blocks.sort((a, b) => (b.priority ?? defaultPriority(b)) - (a.priority ?? defaultPriority(a)));
}

/** Convenience wrapper used by tests. */
export function measureLines(
  text: string,
  measure: MeasureText,
  font: { family: string; weight: number; size: number; tracking: number },
  maxWidth: number,
): string[] {
  return wrapText(text, measure, font, maxWidth);
}

export { contentString, contentImage };
export type { ContentValue };

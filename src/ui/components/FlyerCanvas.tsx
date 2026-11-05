import { useEffect, useRef, useState } from 'react';
import { paintFlyer } from '@engine/export';
import { ASPECTS } from '@engine/brand';
import type { BrandConfig, FlyerContent, ResolvedLayout, Template } from '@engine/types';

interface FlyerCanvasProps {
  template: Template;
  brand: BrandConfig;
  content: FlyerContent;
  assets?: Record<string, { width: number; height: number }>;
  /** Backing-store scale. 1 is enough for a preview; 2 for retina screens. */
  scale?: number;
  guides?: boolean;
  className?: string;
  onLayout?: (layout: ResolvedLayout) => void;
}

/**
 * The live preview.
 *
 * It paints the resolved layout onto a canvas — the same code path the export
 * uses — so what you see here is exactly what gets downloaded.
 */
export function FlyerCanvas({
  template,
  brand,
  content,
  assets,
  scale = 1,
  guides = false,
  className,
  onLayout,
}: FlyerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const latest = useRef(0);
  const [fitted, setFitted] = useState<{ width: number; height: number } | null>(null);

  // Fit the flyer inside whatever space the layout gives it.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const aspect = ASPECTS[template.aspect];
    const update = () => {
      const rect = frame.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      const ratio = Math.min(rect.width / aspect.width, rect.height / aspect.height);
      setFitted({
        width: Math.max(80, Math.floor(aspect.width * ratio)),
        height: Math.max(80, Math.floor(aspect.height * ratio)),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [template.aspect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const run = ++latest.current;
    let cancelled = false;

    const draw = async () => {
      // Wait for the brand fonts so measurements match what is drawn.
      if (typeof document !== 'undefined' && 'fonts' in document) {
        try {
          await document.fonts.ready;
        } catch {
          /* fonts are optional */
        }
      }
      if (cancelled || run !== latest.current) return;
      try {
        const layout = await paintFlyer(canvas, { template, brand, content, scale, assets, guides });
        if (!cancelled && run === latest.current) onLayout?.(layout);
      } catch {
        /* a render failure should never blank the whole editor */
      }
    };

    void draw();
    return () => {
      cancelled = true;
    };
  }, [template, brand, content, scale, assets, guides, onLayout]);

  return (
    <div className={`flyer-canvas${className ? ` ${className}` : ''}`} ref={frameRef}>
      <canvas
        ref={canvasRef}
        style={fitted ? { width: fitted.width, height: fitted.height } : undefined}
        aria-label={`${template.name} flyer preview`}
      />
    </div>
  );
}

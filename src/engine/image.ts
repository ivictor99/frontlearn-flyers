/**
 * Image loading + cover-crop geometry.
 *
 * Images are never distorted: the source rectangle is chosen to preserve the
 * aspect ratio and the focal point decides which part survives the crop.
 */

const imageCache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement | null>>();

export function loadImage(url: string): Promise<HTMLImageElement | null> {
  const cached = imageCache.get(url);
  if (cached) return Promise.resolve(cached);
  const inFlight = pending.get(url);
  if (inFlight) return inFlight;

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    if (typeof Image === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      imageCache.set(url, img);
      pending.delete(url);
      resolve(img);
    };
    img.onerror = () => {
      pending.delete(url);
      resolve(null);
    };
    img.src = url;
  });
  pending.set(url, promise);
  return promise;
}

export async function loadImages(urls: string[]): Promise<Map<string, HTMLImageElement>> {
  const unique = [...new Set(urls.filter(Boolean))];
  const results = await Promise.all(unique.map((u) => loadImage(u)));
  const map = new Map<string, HTMLImageElement>();
  unique.forEach((url, i) => {
    const img = results[i];
    if (img) map.set(url, img);
  });
  return map;
}

export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** Source rectangle to take from an image so it fills `w × h` without distortion. */
export function coverCrop(
  source: { width: number; height: number },
  target: { w: number; h: number },
  focalX = 0.5,
  focalY = 0.5,
): CropRect {
  const sourceRatio = source.width / source.height;
  const targetRatio = target.w / target.h;
  let sw = source.width;
  let sh = source.height;
  if (sourceRatio > targetRatio) {
    sw = source.height * targetRatio;
  } else {
    sh = source.width / targetRatio;
  }
  sw = Math.max(1, Math.min(sw, source.width));
  sh = Math.max(1, Math.min(sh, source.height));
  const sx = Math.max(0, Math.min(source.width - sw, (source.width - sw) * focalX));
  const sy = Math.max(0, Math.min(source.height - sh, (source.height - sh) * focalY));
  return { sx, sy, sw, sh };
}

/** Focal point for a named position within an image. */
export function focalFor(
  position: 'center' | 'top' | 'bottom',
  focal?: { focalX: number; focalY: number },
): { x: number; y: number } {
  if (focal && (focal.focalX !== 0.5 || focal.focalY !== 0.5)) {
    return { x: focal.focalX, y: focal.focalY };
  }
  if (position === 'top') return { x: 0.5, y: 0.18 };
  if (position === 'bottom') return { x: 0.5, y: 0.82 };
  return { x: 0.5, y: 0.5 };
}

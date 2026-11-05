/**
 * Trims the transparent margin from a logo PNG so it fills its box in a flyer.
 *
 *   npx tsx scripts/trim-logo.ts uploads/logo_frontlearn-2-1.png public/logo.png
 *
 * The output keeps the artwork's own aspect ratio and is written as a
 * high-quality PNG with an alpha channel.
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const input = process.argv[2] ?? 'uploads/logo_frontlearn-2-1.png';
const output = process.argv[3] ?? 'public/logo.png';
const padding = Number(process.argv[4] ?? 8);

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
const dataUrl = `data:image/png;base64,${readFileSync(input).toString('base64')}`;

const result = await page.evaluate(
  `(async (url, pad) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const probe = document.createElement('canvas');
    probe.width = img.width;
    probe.height = img.height;
    const pctx = probe.getContext('2d');
    pctx.drawImage(img, 0, 0);
    const data = pctx.getImageData(0, 0, probe.width, probe.height).data;

    let minX = probe.width, minY = probe.height, maxX = -1, maxY = -1;
    for (let y = 0; y < probe.height; y++) {
      for (let x = 0; x < probe.width; x++) {
        if (data[(y * probe.width + x) * 4 + 3] > 24) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return { error: 'The image is fully transparent.' };

    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(probe.width - 1, maxX + pad);
    maxY = Math.min(probe.height - 1, maxY + pad);

    const out = document.createElement('canvas');
    out.width = maxX - minX + 1;
    out.height = maxY - minY + 1;
    const octx = out.getContext('2d');
    octx.drawImage(img, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
    return { dataUrl: out.toDataURL('image/png'), width: out.width, height: out.height };
  })(${JSON.stringify(dataUrl)}, ${padding})`,
);

if ('error' in result) {
  console.error(result.error);
  await browser.close();
  process.exit(1);
}

writeFileSync(output, Buffer.from(String(result.dataUrl).split(',')[1], 'base64'));
console.log(`trimmed ${input} -> ${output}  ${result.width}x${result.height}`);
await browser.close();

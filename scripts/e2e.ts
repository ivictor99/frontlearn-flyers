/**
 * End-to-end check: upload an image, build a flyer, export PNG / JPG / PDF.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.APP_URL ?? 'http://127.0.0.1:4010';
const OUT = 'shots/exports';

async function main() {
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });

  // A real test picture, drawn in the browser and saved to disk.
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, '#1f3a6e');
    gradient.addColorStop(1, '#f2a93b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 800);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 96px sans-serif';
    ctx.fillText('Campus photo', 120, 430);
    return canvas.toDataURL('image/png');
  });
  writeFileSync('/tmp/test-photo.png', Buffer.from(dataUrl.split(',')[1], 'base64'));

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#username', 'admin');
  await page.fill('#password', 'frontlearn');
  await page.click('button[type=submit]');
  await page.waitForTimeout(1000);

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const fill = async (label: string, value: string) => {
    const field = page.locator(`label:has-text("${label}")`).first();
    const id = await field.getAttribute('for');
    if (!id) throw new Error(`No field labelled ${label}`);
    await page.locator(`#${id}`).fill(value);
  };

  await fill('Kicker / label', 'Admissions Open');
  await fill('Main title', 'January 2027 Intake');
  await fill('Supporting line', 'AI Programming Diploma');
  await fill('Description', 'Applications are open for our January intake across diploma and certificate programmes.');
  await fill('Date', '20 January 2027');
  await fill('Location', 'Main Campus, Nairobi');
  await fill('Fee / price', 'KSh 25,000 per term');
  await fill('Call to action', 'Apply now');
  await page.waitForTimeout(600);

  // --- upload an image and attach it -------------------------------------
  const mediaInput = page.locator('input[type=file]').first();
  await mediaInput.setInputFiles('/tmp/test-photo.png');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'shots/08-with-image.png' });

  // --- export each format -------------------------------------------------
  const results: { format: string; file: string; bytes: number }[] = [];
  for (const [label, format] of [
    ['Download PNG', 'png'],
    ['JPG', 'jpg'],
    ['PDF', 'pdf'],
  ] as const) {
    const button = page.getByRole('button', { name: label });
    console.log(`exporting ${label} — found ${await button.count()} button(s)`);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }).catch(async (error) => {
        const toast = await page.locator('.toast').textContent().catch(() => null);
        await page.screenshot({ path: `shots/export-fail-${format}.png` });
        throw new Error(`${label}: ${String(error)} toast=${toast} errors=${errors.join(' | ')}`);
      }),
      button.click(),
    ]);
    const target = join(OUT, download.suggestedFilename());
    await download.saveAs(target);
    results.push({ format, file: download.suggestedFilename(), bytes: statSync(target).size });
    await page.waitForTimeout(600);
    const toast = page.locator('.toast');
    if (await toast.count()) await toast.click({ force: true });
  }

  // --- save a draft -------------------------------------------------------
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.waitForTimeout(1200);

  console.log('exports:', JSON.stringify(results, null, 2));
  console.log('errors:', errors.length ? errors.join(' | ') : 'none');

  for (const result of results) {
    if (!existsSync(join(OUT, result.file)) || result.bytes < 1000) {
      throw new Error(`Export ${result.format} looks wrong (${result.bytes} bytes)`);
    }
  }
  await browser.close();
  console.log('OK');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

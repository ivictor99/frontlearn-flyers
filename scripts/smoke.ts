/**
 * Visual smoke test.
 *
 * Opens the running app, exercises the studio and captures screenshots so the
 * interface and the generated flyers can be reviewed without a display.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.APP_URL ?? 'http://127.0.0.1:4010';
const OUT = 'shots';

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 });

  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/01-studio-empty.png` });

  // Sign in so the full experience is available.
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#username', 'admin');
  await page.fill('#password', 'frontlearn');
  await page.click('button[type=submit]');
  await page.waitForTimeout(1200);

  // Type the details of a flyer.
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const fill = async (label: string, value: string) => {
    const field = page.locator(`label:has-text("${label}")`).first();
    const id = await field.getAttribute('for');
    if (!id) return;
    const input = page.locator(`#${id}`);
    if (await input.count()) await input.fill(value);
  };

  await fill('Kicker / label', 'Admissions Open');
  await fill('Main title', 'January 2027 Intake');
  await fill('Supporting line', 'AI Programming Diploma');
  await fill('Description', 'Applications are open for our January intake across diploma and certificate programmes in ICT, engineering and business.');
  await fill('Course / programme', 'Diploma in ICT');
  await fill('Date', '20 January 2027');
  await fill('Location', 'Main Campus, Nairobi');
  await fill('Fee / price', 'KSh 25,000 per term');
  await fill('Application deadline', '20 December 2026');
  await fill('Call to action', 'Apply now');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/02-studio-filled.png` });

  // Capture the rendered flyer itself.
  const canvas = page.locator('.preview-frame canvas');
  if (await canvas.count()) {
    await canvas.screenshot({ path: `${OUT}/03-flyer-admissions.png` });
  }

  // The AI assistant.
  const aiSummary = page.locator('.ai-box summary');
  if (await aiSummary.count()) {
    await aiSummary.click();
    await page.waitForTimeout(400);
    await page.fill(
      '.ai-box textarea',
      'Admissions are now open for our January intake. We offer diploma and certificate programmes in ICT. Applications close on 20 December. Call 0712 345 678 or visit www.frontlearn.ac.ke.',
    );
    await page.click('.ai-box .btn--primary');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/04-ai-assist.png` });
  }

  // Template gallery.
  await page.goto(`${BASE}/templates`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/05-gallery.png`, fullPage: false });

  // Brand admin.
  await page.goto(`${BASE}/brand`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/06-brand.png` });

  // Template admin.
  await page.goto(`${BASE}/admin/templates`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/07-templates-admin.png` });

  console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join('\n')}` : 'No console errors.');
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

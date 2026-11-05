/**
 * End-to-end check of the assist flow and the admin editing tools.
 */
import { chromium, type Page } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.APP_URL ?? 'http://127.0.0.1:4010';

const NOTE = `Frontlearn Institute is running a free online coding bootcamp for January 2027.
The programme is a 12 week AI Programming Diploma and it starts on 20 January 2027 at 9:00 AM.
Classes run at our Main Campus, Nairobi.
The fee is KSh 25,000 per term and applications close on 20 December 2026.
Places are limited so apply now.
Call us on 0712 345 678 or email admissions@frontlearn.ac.ke.`;

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#username', 'admin');
  await page.fill('#password', 'frontlearn');
  await page.click('button[type=submit]');
  await page.waitForTimeout(1200);
}

async function main() {
  mkdirSync('shots', { recursive: true });
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });

  await login(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // --- assist: paste a message, read it back ------------------------------
  await page.locator('.ai-box summary').click();
  await page.waitForTimeout(300);
  await page.locator('.ai-box textarea').fill(NOTE);
  await page.getByRole('button', { name: 'Fill in the details' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'shots/10-assist.png' });

  const suggested = await page.locator('.ai-result__line').textContent();
  console.log('suggested template:', suggested?.trim());
  await page.getByRole('button', { name: 'Use these details' }).click();
  await page.waitForTimeout(1200);

  const filled = await page.locator('.progress').getAttribute('aria-label');
  console.log('progress:', filled);

  // read back a few field values
  const values: Record<string, string> = {};
  for (const label of ['Main title', 'Supporting line', 'Date', 'Location', 'Fee / price']) {
    const field = page.locator(`label:has-text("${label}")`).first();
    const id = await field.getAttribute('for');
    if (id) values[label] = await page.locator(`#${id}`).inputValue();
  }
  console.log('fields:', JSON.stringify(values, null, 2));

  // --- brand admin: change the primary colour ------------------------------
  await page.goto(`${BASE}/brand`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'shots/11-brand.png' });
  const colourInputs = page.locator('input[type=color]');
  const count = await colourInputs.count();
  console.log('colour inputs:', count);
  if (count > 0) {
    await colourInputs.first().evaluate((el: HTMLInputElement) => {
      el.value = '#7a2f8f';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForTimeout(900);
    await page.screenshot({ path: 'shots/12-brand-changed.png' });
  }

  // --- template admin: duplicate, deactivate, delete ------------------------
  await page.goto(`${BASE}/admin/templates`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const rows = page.locator('.table__row:not(.table__row--head)');
  const before = await rows.count();
  await rows.first().getByRole('button', { name: 'Duplicate' }).click();
  await page.waitForTimeout(1000);
  const afterDuplicate = await rows.count();
  console.log(`templates ${before} -> ${afterDuplicate} after duplicate`);

  await rows.last().getByRole('button', { name: 'Hide' }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'shots/13-template-admin.png' });

  console.log('errors:', errors.length ? errors.join(' | ') : 'none');
  await browser.close();
  if (errors.length) throw new Error('Console errors detected');
  console.log('OK');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

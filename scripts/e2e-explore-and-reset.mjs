import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const base = 'http://localhost:3100';

async function newCtx() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  return { ctx, page };
}

// ---------- Exploring ----------
{
  const { page } = await newCtx();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.click("text=I'm Just Exploring");
  await page.waitForURL('**/start/exploring');
  await page.fill('#name', 'Jamie Fox');
  await page.fill('#email', 'jamie.fox@example.com');
  await Promise.all([
    page.waitForURL((u) => u.pathname === '/explore'),
    page.click('button[type="submit"]'),
  ]);
  await page.screenshot({ path: '/tmp/shots/e1-explore-dashboard.png', fullPage: true });

  await page.fill('textarea[name="body"]', "Not sure yet — just want to keep an eye on the market.");
  await Promise.all([
    page.waitForURL('**/explore?sent=1'),
    page.click('button:has-text("Send")'),
  ]);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/shots/e2-explore-message-sent.png', fullPage: true });

  // upgrade path works
  await page.click("text=I think I'm buying");
  await page.waitForURL('**/start/buying');
  const h1 = await page.locator('h1').first().textContent();
  console.log('upgrade path landed on:', h1);
  console.log('explore flow done');
}

// ---------- Admin: reset (guarded by confirm dialog) ----------
{
  const { page } = await newCtx();
  await page.goto(base + '/admin', { waitUntil: 'networkidle' });
  const before = await page.locator('table tbody tr').count();
  console.log('contacts before reset:', before);

  // Dismiss the confirm() dialog first — proves the guard actually blocks it.
  page.once('dialog', (d) => d.dismiss());
  await page.click('text=Clear test data');
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'networkidle' });
  const afterDismiss = await page.locator('table tbody tr').count();
  console.log('contacts after dismissed confirm:', afterDismiss);

  // Now actually accept it.
  page.once('dialog', (d) => d.accept());
  await Promise.all([
    page.waitForURL('**/admin'),
    page.click('text=Clear test data'),
  ]);
  await page.waitForLoadState('networkidle');
  const afterAccept = await page.locator('table tbody tr').count();
  console.log('contacts after accepted reset:', afterAccept);
  await page.screenshot({ path: '/tmp/shots/a2-admin-after-reset.png', fullPage: true });
  console.log('reset flow done');
}

await browser.close();
console.log('ALL DONE');

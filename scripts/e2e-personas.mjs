import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const base = 'http://localhost:3100';

async function newCtx() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  return { ctx, page };
}

// ---------- Seller ----------
{
  const { page } = await newCtx();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.click("text=I'm Selling");
  await page.waitForURL('**/start/selling');
  await page.fill('#name', 'Marcus Chen');
  await page.fill('#email', 'marcus.chen@example.com');
  await page.fill('#phone', '416-555-0199');
  await page.fill('#address', '77 Danforth Ave, Toronto');
  await page.selectOption('#reasonForSelling', 'Upsizing');
  await Promise.all([page.waitForURL('**/seller'), page.click('button[type="submit"]')]);
  await page.screenshot({ path: '/tmp/shots/s1-seller-dashboard.png', fullPage: true });

  // toggle a couple checklist items
  const checkboxes = await page.locator('input[type="checkbox"]').all();
  await checkboxes[0].click();
  await checkboxes[3].click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/shots/s2-seller-checklist-progress.png', fullPage: true });

  // request valuation
  await Promise.all([
    page.waitForURL('**/seller?requested=1'),
    page.click('button:has-text("Request a valuation")'),
  ]);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/shots/s3-seller-valuation-requested.png', fullPage: true });
  console.log('seller flow done');
}

// ---------- Homeowner ----------
{
  const { page } = await newCtx();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.click("text=I'm a Homeowner");
  await page.waitForURL('**/start/homeowner');
  await page.fill('#name', 'Aisha Bello');
  await page.fill('#email', 'aisha.bello@example.com');
  await page.fill('#phone', '647-555-0122');
  await page.fill('#address', '9 Lakeview Cres, Whitby');
  await page.fill('#purchaseDate', '2021-06-15');
  // renewal in ~45 days from "today" (env date Aug 21 2026) -> Oct 5 2026
  await page.fill('#mortgageRenewalDate', '2026-10-05');
  // NOTE: '**/homeowner' would also match the current '/start/homeowner' URL
  // (both end in "/homeowner"), so waitForURL resolves before navigation
  // even happens. Use an exact-pathname predicate instead.
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/homeowner'),
    page.click('button[type="submit"]'),
  ]);
  await page.screenshot({ path: '/tmp/shots/h1-homeowner-dashboard.png', fullPage: true });

  await page.fill('textarea[name="body"]', 'Is now a good time to look into a HELOC?');
  await Promise.all([
    page.waitForURL('**/homeowner?sent=1'),
    page.click('button:has-text("Send")'),
  ]);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/shots/h2-homeowner-message-sent.png', fullPage: true });

  await page.fill('input[name="referredName"]', 'Sam Patel');
  await page.fill('input[name="referredContact"]', 'sam.patel@example.com');
  await Promise.all([
    page.waitForURL('**/homeowner?referred=1'),
    page.click('button:has-text("Send referral")'),
  ]);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/shots/h3-homeowner-referred.png', fullPage: true });
  console.log('homeowner flow done');
}

// ---------- Investor ----------
{
  const { page } = await newCtx();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.click("text=I'm Investing");
  await page.waitForURL('**/start/investing');
  await page.fill('#name', 'Wei Zhang');
  await page.fill('#email', 'wei.zhang@example.com');
  await page.fill('#targetArea', 'Oshawa, Whitby');
  await Promise.all([page.waitForURL('**/investor'), page.click('button[type="submit"]')]);
  await page.screenshot({ path: '/tmp/shots/i1-investor-analyzer.png', fullPage: true });

  await Promise.all([
    page.waitForURL('**/investor/compare?saved=1'),
    page.click('button:has-text("Save this analysis")'),
  ]);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/shots/i2-investor-compare.png', fullPage: true });

  // go back, change numbers, save a second one
  await page.goto(base + '/investor', { waitUntil: 'networkidle' });
  await page.fill('input[name="label"]', '456 Rental Ave (higher rent)');
  const rentInput = page.locator('input[name="expectedRentMonthly"]');
  await rentInput.fill('3800');
  await Promise.all([
    page.waitForURL('**/investor/compare?saved=1'),
    page.click('button:has-text("Save this analysis")'),
  ]);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/shots/i3-investor-compare-two.png', fullPage: true });
  console.log('investor flow done');
}

// ---------- Admin (fresh, cookie-less view) ----------
{
  const { page } = await newCtx();
  await page.goto(base + '/admin', { waitUntil: 'networkidle' });
  await page.screenshot({ path: '/tmp/shots/a1-admin-all-personas.png', fullPage: true });
  console.log('admin check done');
}

await browser.close();
console.log('ALL DONE');

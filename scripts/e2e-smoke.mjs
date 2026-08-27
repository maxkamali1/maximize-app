import { chromium } from 'playwright';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on('console', (msg) => console.log('CONSOLE:', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));

await page.goto('http://localhost:3100/', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/shots/01-home.png' });

await page.click('text=I\'m Buying');
await page.waitForURL('**/start/buying');
console.log('at', page.url());
await page.screenshot({ path: '/tmp/shots/02-onboarding.png' });

await page.fill('#name', 'Priya Nair');
await page.fill('#email', 'priya.nair@example.com');
await page.fill('#phone', '416-555-0148');
await page.fill('input[name="budgetMin"]', '650000');
await page.fill('input[name="budgetMax"]', '850000');
await page.fill('#preferredArea', 'Scarborough, Toronto');
await page.selectOption('#timeline', '3-6 months');
await page.selectOption('#financingStatus', 'in_progress');

await Promise.all([
  page.waitForURL('**/buyer', { timeout: 15000 }),
  page.click('button[type="submit"]'),
]);
console.log('after submit, at', page.url());
await page.waitForLoadState('networkidle');
await page.screenshot({ path: '/tmp/shots/03-buyer-dashboard.png', fullPage: true });

await page.goto('http://localhost:3100/buyer/compare', { waitUntil: 'networkidle' });
console.log('at', page.url());
const checkboxCount = await page.locator('input[name="propertyId"]').count();
console.log('checkbox count', checkboxCount);
const checkboxes = await page.locator('input[name="propertyId"]').all();
await checkboxes[0].click();
await checkboxes[1].click();
await page.waitForTimeout(200);
const prosBoxes = await page.locator('textarea[name^="pros_"]').all();
await prosBoxes[0].fill('Close to GO station, finished basement');
await prosBoxes[1].fill('Bigger lot, newer build');
await page.screenshot({ path: '/tmp/shots/04-compare.png', fullPage: true });

await Promise.all([
  page.waitForURL('**/buyer/compare', { timeout: 15000 }),
  page.click('button:has-text("Save comparison")'),
]);
await page.waitForLoadState('networkidle');

await page.goto('http://localhost:3100/buyer/showing', { waitUntil: 'networkidle' });
await page.fill('#propertyAddress', '42 Birchmount Rd, Scarborough');
await page.fill('#preferredWindow', 'This weekend, mornings');
await Promise.all([
  page.waitForURL('**/buyer?showingRequested=1', { timeout: 15000 }),
  page.click('button:has-text("Send request")'),
]);
await page.waitForLoadState('networkidle');
await page.screenshot({ path: '/tmp/shots/05-buyer-after-showing.png', fullPage: true });

await page.goto('http://localhost:3100/admin', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/tmp/shots/06-admin.png', fullPage: true });

await browser.close();
console.log('done');

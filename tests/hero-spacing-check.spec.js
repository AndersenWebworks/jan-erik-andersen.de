const { test } = require('@playwright/test');

test('hero spacing mobile', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto('http://localhost:8765/?nofunnel=1', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.remove('funnel-active'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-hero-mobile-after.png', fullPage: false });

  const m = await page.evaluate(() => {
    const header = document.querySelector('.site-header');
    const h1 = document.querySelector('.hero-content h1');
    const hero = document.querySelector('.hero');
    const lead = document.querySelector('.hero-lead');
    const hr = header.getBoundingClientRect();
    const h1r = h1.getBoundingClientRect();
    const heroR = hero.getBoundingClientRect();
    const leadR = lead.getBoundingClientRect();
    return {
      headerBottom: hr.bottom,
      heroTop: heroR.top,
      h1Top: h1r.top,
      h1FontSize: getComputedStyle(h1).fontSize,
      h1LineHeight: getComputedStyle(h1).lineHeight,
      heroPaddingTop: getComputedStyle(hero).paddingTop,
      gapHeaderToH1: h1r.top - hr.bottom,
      gapH1ToLead: leadR.top - h1r.bottom,
    };
  });
  console.log('METRICS', JSON.stringify(m, null, 2));
});

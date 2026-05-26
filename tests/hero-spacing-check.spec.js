const { test, expect } = require('@playwright/test');

test('hero spacing mobile', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 });
  await page.goto('/?nofunnel=1', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.classList.remove('funnel-active'));
  await page.waitForTimeout(800);

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
  expect(m.gapHeaderToH1).toBeGreaterThanOrEqual(64);
  expect(m.gapHeaderToH1).toBeLessThanOrEqual(150);
  expect(m.gapH1ToLead).toBeGreaterThanOrEqual(24);
  expect(m.gapH1ToLead).toBeLessThanOrEqual(80);
  expect(parseFloat(m.h1FontSize)).toBeGreaterThanOrEqual(36);
});

import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 1400 } });

test('focus-extras-block rendert mit 2 Spalten und korrekten Inhalten', async ({ page }) => {
  await page.addInitScript(() => {
    const mark = () => {
      document.querySelectorAll('.services-intro h2').forEach(h => {
        (h as HTMLElement).dataset.typed = '1';
      });
    };
    document.addEventListener('DOMContentLoaded', mark);
  });
  await page.goto('http://localhost:5500/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.classList.remove('funnel-active');
    const f = document.getElementById('funnel');
    if (f) (f as HTMLElement).style.display = 'none';
    const reopen = document.getElementById('funnel-reopen');
    if (reopen) (reopen as HTMLElement).hidden = true;
    document.querySelectorAll('.focus-card,.focus-grid,.services-extras').forEach(el => el.classList.add('is-visible'));
  });

  const extras = page.locator('.services-extras');
  await expect(extras).toBeVisible();

  // 2 Kindelemente: nav.services-quicknav + div.standards-strip
  const children = extras.locator('> *');
  await expect(children).toHaveCount(2);
  await expect(extras.locator('.services-quicknav')).toBeVisible();
  await expect(extras.locator('.standards-strip')).toBeVisible();

  // Quicknav enthaelt 4 "Ausserdem"-Links + 1 "Alle Leistungen"-Link
  await expect(extras.locator('.services-quicknav h3')).toHaveText('Außerdem');
  await expect(extras.locator('.services-quicknav a')).toHaveCount(5);

  // Standards-Liste mit 5 Items
  await expect(extras.locator('.standards-list li')).toHaveCount(5);

  // Layout-Check: extras-Block hat 2 Spalten (Quicknav links, Standards rechts)
  const navBox = await extras.locator('.services-quicknav').boundingBox();
  const stdBox = await extras.locator('.standards-strip').boundingBox();
  expect(navBox && stdBox).toBeTruthy();
  expect((stdBox!.x)).toBeGreaterThan(navBox!.x + navBox!.width / 2);

  // Cards: 3 gleichbreite Spalten
  const cards = page.locator('.focus-card');
  await expect(cards).toHaveCount(3);
  const widths = await Promise.all([0,1,2].map(async i => (await cards.nth(i).boundingBox())!.width));
  // alle Cards in 5px Toleranz gleich breit
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(5);
  // Cards mindestens 300px breit (Anti-Pattern)
  expect(widths[0]).toBeGreaterThan(300);

});

test('focus-extras-block stapelt mobil', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 1400 });
  await page.goto('http://localhost:5500/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.documentElement.classList.remove('funnel-active');
    const f = document.getElementById('funnel');
    if (f) (f as HTMLElement).style.display = 'none';
  });
  const extras = page.locator('.services-extras');
  const navBox = await extras.locator('.services-quicknav').boundingBox();
  const stdBox = await extras.locator('.standards-strip').boundingBox();
  // gestapelt: Standards liegen UNTER Quicknav (y groesser)
  expect(stdBox!.y).toBeGreaterThan(navBox!.y + navBox!.height - 10);

  // Cards 1-Spalt
  const cards = page.locator('.focus-card');
  const c0 = await cards.nth(0).boundingBox();
  const c1 = await cards.nth(1).boundingBox();
  expect(c1!.y).toBeGreaterThan(c0!.y + c0!.height - 10);
});

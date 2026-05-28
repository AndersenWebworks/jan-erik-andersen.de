import { test, expect } from '@playwright/test';

test.describe('subpage mobile polish', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  for (const path of ['/ueber/', '/en/about/']) {
    test(`${path} leads with editorial content before portrait`, async ({ page }) => {
      await page.goto(path);

      const headlineBox = await page.locator('.editorial-main h1').boundingBox();
      const sidebarBox = await page.locator('.editorial-sidebar').boundingBox();

      expect(headlineBox).toBeTruthy();
      expect(sidebarBox).toBeTruthy();
      expect(headlineBox!.y).toBeLessThan(420);
      expect(headlineBox!.y).toBeLessThan(sidebarBox!.y);
    });
  }

  for (const path of ['/de/datenschutz.html', '/en/privacy.html']) {
    test(`${path} keeps legal hero inside mobile viewport`, async ({ page }) => {
      await page.goto(path);

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
        heroH1Width: document.querySelector('.hero h1')?.getBoundingClientRect().width ?? 0,
      }));

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewportWidth);
      expect(metrics.heroH1Width).toBeLessThanOrEqual(metrics.viewportWidth - 40);
    });
  }

  for (const path of ['/', '/en/']) {
    test(`${path} keeps mobile hero CTA hierarchy compact`, async ({ page }) => {
      await page.goto(path);

      const quickCheck = page.locator('.quickcheck-card .funnel-reopen');
      await expect(quickCheck).toBeVisible();

      const box = await quickCheck.boundingBox();
      const styles = await quickCheck.evaluate((button) => {
        const computed = window.getComputedStyle(button);
        return {
          background: computed.backgroundColor,
          color: computed.color,
          borderColor: computed.borderTopColor,
        };
      });

      expect(box).toBeTruthy();
      expect(box!.height).toBeGreaterThanOrEqual(50);
      expect(box!.height).toBeLessThanOrEqual(58);
      expect(styles.background).toBe('rgb(168, 58, 58)');
      expect(styles.color).toBe('rgb(255, 255, 255)');
    });
  }
});

test.describe('subpage tablet polish', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  for (const path of ['/ueber/', '/en/about/']) {
    test(`${path} keeps editorial content before profile card on tablet`, async ({ page }) => {
      await page.goto(path);

      const headlineBox = await page.locator('.editorial-main h1').boundingBox();
      const sidebarBox = await page.locator('.editorial-sidebar').boundingBox();

      expect(headlineBox).toBeTruthy();
      expect(sidebarBox).toBeTruthy();
      expect(headlineBox!.y).toBeLessThan(260);
      expect(headlineBox!.y).toBeLessThan(sidebarBox!.y);
    });
  }
});

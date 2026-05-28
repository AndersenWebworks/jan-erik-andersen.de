import { test, expect } from '@playwright/test';

const desktop = { width: 1280, height: 900 };
const mobile = { width: 390, height: 844 };

test.describe('header follows standalone template controls', () => {
  test.use({ viewport: desktop });

  for (const path of ['/', '/en/']) {
    test(`${path} desktop header controls match the standalone template`, async ({ page }) => {
      await page.goto(path);

      const navContact = page.locator('.header-nav > .header-nav-cta').first();
      await expect(navContact).toBeVisible();
      await expect(navContact).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(navContact).toHaveCSS('color', 'rgb(74, 74, 70)');

      const metaCta = page.locator('.header-meta-cta').first();
      await expect(metaCta).toBeVisible();
      await expect(metaCta).toHaveCSS('background-color', 'rgb(168, 58, 58)');
      await expect(metaCta).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(metaCta).toHaveCSS('border-radius', '10px');

      const darkToggle = page.locator('.header-right .pill-toggle:has(.darkmode-checkbox) .pill-track').first();
      await expect(darkToggle).toBeVisible();
      await expect(darkToggle).toHaveCSS('width', '34px');
      await expect(darkToggle).toHaveCSS('height', '34px');
      await expect(darkToggle).toHaveCSS('border-radius', '8px');

      const langSwitch = page.locator('.header-right .pill-toggle:not(:has(.darkmode-checkbox)) .pill-track').first();
      await expect(langSwitch).toBeVisible();
      await expect(langSwitch).toHaveCSS('width', '70px');
      await expect(langSwitch).toHaveCSS('height', '34px');
      await expect(langSwitch).toHaveCSS('border-radius', '8px');

      const activeLang = page.locator('.header-right .pill-toggle:not(:has(.darkmode-checkbox)) .pill-option.active').first();
      await expect(activeLang).toHaveCSS('background-color', 'rgb(26, 26, 24)');
      await expect(activeLang).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(activeLang).toHaveCSS('font-family', /JetBrains Mono/);
      await expect(activeLang).toHaveCSS('font-size', '11.5px');

      const dropdownTrigger = page.locator('.header-nav-dropdown > a').first();
      await dropdownTrigger.hover();
      const dropdown = page.locator('.header-nav-dropdown-menu').first();
      await expect(dropdown).toBeVisible();
      await expect(dropdown).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(dropdown).toHaveCSS('border-radius', '14px');
      await expect(dropdown).toHaveCSS('padding', '8px');

      const firstDropdownItem = dropdown.locator('a').first();
      const box = await firstDropdownItem.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(63);
      expect(box?.height).toBeLessThanOrEqual(65);
      await expect(firstDropdownItem.locator('span')).toHaveCSS('text-transform', 'none');
      await expect(firstDropdownItem.locator('span')).toHaveCSS('font-size', '14px');
      await expect(firstDropdownItem.locator('small')).toHaveCSS('font-size', '12px');
    });
  }

  test('mobile header keeps template CTA while preserving the site menu', async ({ page }) => {
    await page.setViewportSize(mobile);
    await page.goto('/');

    await expect(page.locator('.header-nav')).toBeHidden();
    await expect(page.locator('.header-meta-cta').first()).toBeVisible();
    await expect(page.locator('.header-meta-cta').first()).toHaveCSS('background-color', 'rgb(168, 58, 58)');
    await expect(page.locator('.header-hamburger')).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

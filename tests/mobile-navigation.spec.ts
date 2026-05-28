import { test, expect } from '@playwright/test';

const PAGES = [
  '/',
  '/leistungen/',
  '/leistungen/ki-sichtbarkeit/',
  '/leistungen/bfsg-barrierefreiheit/',
  '/leistungen/shops-und-custom/',
  '/projekte/',
  '/preise/',
  '/faq/',
  '/ueber/',
  '/kontakt/',
  '/de/impressum.html',
  '/de/datenschutz.html',
  '/de/barrierefreiheit.html',
  '/en/',
  '/en/services/',
  '/en/services/ai-visibility/',
  '/en/services/bfsg-accessibility/',
  '/en/services/shops-and-custom/',
  '/en/projects/',
  '/en/pricing/',
  '/en/faq/',
  '/en/about/',
  '/en/contact/',
  '/en/imprint.html',
  '/en/privacy.html',
  '/en/accessibility.html',
];

const MOBILE_VIEWPORTS = [
  { name: 'phone', width: 375, height: 667 },
  { name: 'small-phone', width: 390, height: 844 },
  { name: 'legacy-breakpoint', width: 480, height: 800 },
  { name: 'small-tablet', width: 600, height: 900 },
  { name: 'wide-phone-edge', width: 720, height: 900 },
  { name: 'former-dead-zone-start', width: 721, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'former-dead-zone-end', width: 980, height: 900 },
];

const DESKTOP_VIEWPORTS = [
  { name: 'desktop-edge', width: 981, height: 900 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const viewport of MOBILE_VIEWPORTS) {
  test.describe(`mobile navigation ${viewport.name}`, () => {
    test.use({ viewport });

    for (const path of PAGES) {
      test(`${path} exposes and opens mobile menu`, async ({ page }) => {
        await page.goto(path);

        const hamburger = page.locator('#header-hamburger');
        const desktopNav = page.locator('.site-header .header-nav');
        const headerCta = page.locator('.site-header .header-meta-cta').first();
        const mobileMenu = page.locator('#mobile-menu');

        await expect(hamburger).toBeVisible();
        await expect(desktopNav).toBeHidden();
        await expect(headerCta).toBeVisible();
        await expect(headerCta).toHaveCSS('background-color', 'rgb(168, 58, 58)');
        await expect(mobileMenu).toBeHidden();

        await hamburger.click();

        await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
        await expect(mobileMenu).toBeVisible();
        expect(await mobileMenu.locator('nav a').count()).toBeGreaterThan(5);

        const menuBox = await mobileMenu.boundingBox();
        expect(menuBox).toBeTruthy();
        expect(menuBox!.height).toBeLessThanOrEqual(Math.min(viewport.height * 0.58, 540));
        expect(menuBox!.x).toBeGreaterThanOrEqual(0);
        expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(viewport.width);

        const menuPosition = await mobileMenu.evaluate((menu) => window.getComputedStyle(menu).position);
        expect(menuPosition).toBe('absolute');

        const mobileCtaBox = await mobileMenu.locator('.header-nav-cta').boundingBox();
        expect(mobileCtaBox).toBeTruthy();
        expect(mobileCtaBox!.width).toBeGreaterThan(menuBox!.width * 0.8);

        const activeThemeColor = await mobileMenu
          .locator('.darkmode-checkbox-mobile ~ .pill-track .pill-option')
          .first()
          .evaluate((el) => window.getComputedStyle(el).color);
        expect(activeThemeColor).toBe('rgb(255, 255, 255)');

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
      });
    }
  });
}

for (const viewport of DESKTOP_VIEWPORTS) {
  test.describe(`desktop navigation ${viewport.name}`, () => {
    test.use({ viewport });

    for (const path of PAGES) {
      test(`${path} exposes full desktop nav`, async ({ page }) => {
        await page.goto(path);

        const hamburger = page.locator('#header-hamburger');
        const desktopNav = page.locator('.site-header .header-nav');
        const navLinks = desktopNav.locator('a');
        const headerCta = page.locator('.site-header .header-meta-cta').first();

        await expect(hamburger).toBeHidden();
        await expect(desktopNav).toBeVisible();
        await expect(headerCta).toBeVisible();
        await expect(headerCta).toHaveCSS('background-color', 'rgb(168, 58, 58)');
        expect(await navLinks.count()).toBeGreaterThan(5);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
      });
    }
  });
}

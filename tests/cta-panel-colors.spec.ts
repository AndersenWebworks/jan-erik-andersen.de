import { test, expect } from '@playwright/test';

const CTA_PANEL_PAGES = [
  '/leistungen/ki-sichtbarkeit/',
  '/leistungen/bfsg-barrierefreiheit/',
  '/leistungen/shops-und-custom/',
  '/leistungen/',
  '/kontakt/',
  '/en/services/ai-visibility/',
  '/en/contact/',
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1366, height: 900 },
];

test.describe('brand-red CTA panels', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} ${viewport.width}px`, () => {
      test.use({ viewport });

      for (const path of CTA_PANEL_PAGES) {
        test(`${path} uses red CTA panels with readable contrast`, async ({ page }) => {
          await page.goto(path);

          const panel = page.locator('.contact-card, .contact-section--hero .contact-inner').first();
          await expect(panel).toBeVisible();

          const styles = await panel.evaluate((element) => {
            const panelStyle = window.getComputedStyle(element);
            const heading = element.querySelector('h1, h2');
            const headingStyle = heading ? window.getComputedStyle(heading) : null;
            const primaryButton = element.querySelector('.btn-primary');
            const buttonStyle = primaryButton ? window.getComputedStyle(primaryButton) : null;
            const rect = element.getBoundingClientRect();

            return {
              panelBackground: panelStyle.backgroundColor,
              panelColor: panelStyle.color,
              headingColor: headingStyle?.color ?? '',
              hasPrimaryButton: Boolean(primaryButton),
              buttonBackground: buttonStyle?.backgroundColor ?? '',
              buttonColor: buttonStyle?.color ?? '',
              left: rect.left,
              right: rect.right,
              viewportWidth: window.innerWidth,
            };
          });

          expect(styles.panelBackground).toBe('rgb(168, 58, 58)');
          expect(styles.panelColor).toBe('rgb(255, 255, 255)');
          expect(styles.headingColor).toBe('rgb(255, 255, 255)');
          if (styles.hasPrimaryButton) {
            expect(styles.buttonBackground).toBe('rgb(255, 255, 255)');
            expect(styles.buttonColor).toBe('rgb(168, 58, 58)');
          }
          expect(styles.left).toBeGreaterThanOrEqual(0);
          expect(styles.right).toBeLessThanOrEqual(styles.viewportWidth);
        });
      }
    });
  }
});

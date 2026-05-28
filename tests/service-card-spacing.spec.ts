import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1366, height: 900 },
];

const SERVICE_PAGES = [
  '/leistungen/',
  '/leistungen/ki-sichtbarkeit/',
  '/leistungen/bfsg-barrierefreiheit/',
  '/leistungen/shops-und-custom/',
  '/en/services/',
  '/en/services/ai-visibility/',
  '/en/services/bfsg-accessibility/',
  '/en/services/shops-and-custom/',
];

test.describe('service card spacing', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} ${viewport.width}px`, () => {
      test.use({ viewport });

      for (const path of SERVICE_PAGES) {
        test(`${path} keeps inner padding on first and last service cards`, async ({ page }) => {
          await page.goto(path);
          await page.waitForLoadState('domcontentloaded');

          const measurements = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.services-grid')).flatMap((grid, gridIndex) => {
              return Array.from(grid.querySelectorAll(':scope > .service-item')).map((item, itemIndex) => {
                const style = window.getComputedStyle(item);
                const itemRect = item.getBoundingClientRect();
                const headline = item.querySelector('h2, h3');
                const headlineRect = headline?.getBoundingClientRect();

                return {
                  gridIndex,
                  itemIndex,
                  paddingTop: parseFloat(style.paddingTop),
                  paddingBottom: parseFloat(style.paddingBottom),
                  borderTopWidth: parseFloat(style.borderTopWidth),
                  borderBottomWidth: parseFloat(style.borderBottomWidth),
                  headlineOffsetTop: headlineRect ? headlineRect.top - itemRect.top : 0,
                };
              });
            });
          });

          expect(measurements.length).toBeGreaterThan(0);

          for (const item of measurements) {
            expect(item.paddingTop, `grid ${item.gridIndex} item ${item.itemIndex} top padding`).toBeGreaterThanOrEqual(18);
            expect(item.paddingBottom, `grid ${item.gridIndex} item ${item.itemIndex} bottom padding`).toBeGreaterThanOrEqual(18);
            expect(item.borderTopWidth, `grid ${item.gridIndex} item ${item.itemIndex} top border`).toBeGreaterThan(0);
            expect(item.borderBottomWidth, `grid ${item.gridIndex} item ${item.itemIndex} bottom border`).toBeGreaterThan(0);
            expect(item.headlineOffsetTop, `grid ${item.gridIndex} item ${item.itemIndex} headline offset`).toBeGreaterThanOrEqual(18);
          }
        });
      }
    });
  }
});

import { test, expect, type Locator } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1366, height: 900 },
];

const DETAIL_PAGES = [
  '/',
  '/faq/',
  '/leistungen/ki-sichtbarkeit/',
  '/leistungen/bfsg-barrierefreiheit/',
  '/leistungen/shops-und-custom/',
  '/en/',
  '/en/faq/',
  '/en/services/ai-visibility/',
  '/en/services/bfsg-accessibility/',
  '/en/services/shops-and-custom/',
];

test.describe('accordion layout stability', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} ${viewport.width}px`, () => {
      test.use({ viewport });

      for (const path of DETAIL_PAGES) {
        test(`${path} details open without jumping summary spacing`, async ({ page }) => {
          await page.goto(path);

          const items = page.locator('details.faq-item');
          const count = await items.count();
          expect(count).toBeGreaterThan(0);

          for (let index = 0; index < count; index++) {
            const item = items.nth(index);
            const summary = item.locator('summary').first();

            await summary.scrollIntoViewIfNeeded();
            await page.waitForTimeout(40);

            const before = await measureAccordion(item);

            await summary.click();
            await page.waitForTimeout(80);

            const open = await measureAccordion(item);
            expect(open.isOpen).toBe(true);
            expect(Math.abs(open.summaryHeight - before.summaryHeight)).toBeLessThanOrEqual(1);
            expect(open.answerHeight).toBeGreaterThan(8);
            expect(open.answerTop).toBeGreaterThanOrEqual(open.summaryBottom - 1);
            expect(open.scrollWidth).toBeLessThanOrEqual(open.viewportWidth);

            await summary.click();
            await page.waitForTimeout(80);

            const closed = await measureAccordion(item);
            expect(closed.isOpen).toBe(false);
            expect(Math.abs(closed.summaryHeight - before.summaryHeight)).toBeLessThanOrEqual(1);
            expect(closed.scrollWidth).toBeLessThanOrEqual(closed.viewportWidth);
          }
        });
      }
    });
  }
});

async function measureAccordion(item: Locator) {
  return item.evaluate((details: HTMLDetailsElement) => {
    const summary = details.querySelector('summary');
    const answer = details.querySelector('.faq-answer, .faq-body');
    const summaryBox = summary?.getBoundingClientRect();
    const answerBox = answer?.getBoundingClientRect();

    return {
      isOpen: details.open,
      summaryHeight: summaryBox?.height ?? 0,
      summaryBottom: summaryBox?.bottom ?? 0,
      answerTop: answerBox?.top ?? 0,
      answerHeight: answerBox?.height ?? 0,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });
}

import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
};

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/leistungen/', name: 'Leistungen' },
  { path: '/projekte/', name: 'Projekte' },
  { path: '/preise/', name: 'Preise' },
  { path: '/kontakt/', name: 'Kontakt' },
];

for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
  test.describe(`${viewportName} (${viewport.width}px)`, () => {
    test.use({ viewport });

    for (const page of PAGES) {
      test(`${page.name} - no horizontal overflow`, async ({ page: p }) => {
        await p.goto(page.path);
        const bodyWidth = await p.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await p.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      });

      test(`${page.name} - text readable (min 12px)`, async ({ page: p }) => {
        await p.goto(page.path);
        const tooSmall = await p.evaluate(() => {
          const elements = document.querySelectorAll('p, li:not(.footer-links li)');
          let smallCount = 0;
          elements.forEach(el => {
            const size = parseFloat(getComputedStyle(el).fontSize);
            if (size < 12 && el.textContent?.trim().length > 20) smallCount++;
          });
          return smallCount;
        });
        expect(tooSmall).toBe(0);
      });

      test(`${page.name} - buttons tappable (min 36px height)`, async ({ page: p }) => {
        await p.goto(page.path);
        const buttons = p.locator('.btn');
        const count = await buttons.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
          const btn = buttons.nth(i);
          if (await btn.isVisible()) {
            const box = await btn.boundingBox();
            if (box) {
              expect(box.height).toBeGreaterThanOrEqual(36);
            }
          }
        }
      });
    }

    if (viewportName === 'mobile') {
      test('Home - hero stacks vertically', async ({ page: p }) => {
        await p.goto('/');
        const heroInner = p.locator('.hero-inner');
        if (await heroInner.count() > 0) {
          const cols = await heroInner.evaluate(el =>
            getComputedStyle(el).gridTemplateColumns.split(' ').length
          );
          expect(cols).toBe(1);
        }
      });

      test('Home - comparison cards stack', async ({ page: p }) => {
        await p.goto('/');
        const grid = p.locator('.comparison-grid');
        if (await grid.count() > 0) {
          const cols = await grid.evaluate(el =>
            getComputedStyle(el).gridTemplateColumns.split(' ').length
          );
          expect(cols).toBe(1);
        }
      });

      test('Preise - pricing cards stack', async ({ page: p }) => {
        await p.goto('/preise/');
        const grid = p.locator('.pricing-grid');
        if (await grid.count() > 0) {
          const cols = await grid.evaluate(el =>
            getComputedStyle(el).gridTemplateColumns.split(' ').length
          );
          expect(cols).toBe(1);
        }
      });

      test('Kontakt - contact grid stacks', async ({ page: p }) => {
        await p.goto('/kontakt/');
        const grid = p.locator('.contact-grid');
        if (await grid.count() > 0) {
          const cols = await grid.evaluate(el =>
            getComputedStyle(el).gridTemplateColumns.split(' ').length
          );
          expect(cols).toBe(1);
        }
      });
    }
  });
}

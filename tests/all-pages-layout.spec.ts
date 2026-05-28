import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1366, height: 900 },
];

const PUBLIC_HTML_PAGES = [
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
  '/en/',
  '/en/about/',
  '/en/services/',
  '/en/services/ai-visibility/',
  '/en/services/bfsg-accessibility/',
  '/en/services/shops-and-custom/',
  '/en/projects/',
  '/en/pricing/',
  '/en/faq/',
  '/en/contact/',
  '/de/impressum.html',
  '/de/datenschutz.html',
  '/de/barrierefreiheit.html',
  '/en/privacy.html',
  '/en/imprint.html',
  '/en/accessibility.html',
];

test.describe('all public pages layout audit', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} ${viewport.width}px`, () => {
      test.use({ viewport });

      for (const path of PUBLIC_HTML_PAGES) {
        test(`${path} has no viewport overflow or header collision`, async ({ page }) => {
          await page.goto(path);
          await page.waitForLoadState('domcontentloaded');

          const result = await page.evaluate(() => {
            const viewportWidth = window.innerWidth;
            const offenders: string[] = [];
            const clippedText: string[] = [];

            for (const element of document.body.querySelectorAll('*')) {
              const style = window.getComputedStyle(element);
              if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                Number(style.opacity) === 0 ||
                element.closest('[aria-hidden="true"]')
              ) {
                continue;
              }

              const rect = element.getBoundingClientRect();
              if (rect.width < 1 || rect.height < 1) continue;

              const tag = element.tagName.toLowerCase();
              const classes = Array.from(element.classList).slice(0, 3).join('.');
              const label = classes ? `${tag}.${classes}` : tag;

              if (rect.left < -1 || rect.right > viewportWidth + 1) {
                offenders.push(`${label} left=${rect.left.toFixed(1)} right=${rect.right.toFixed(1)}`);
              }

              const mayContainReadableText = ['a', 'button', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'li', 'p', 'span', 'strong', 'td', 'th'].includes(tag);
              const clipsInlineText = mayContainReadableText &&
                element.scrollWidth > element.clientWidth + 2 &&
                (style.overflowX === 'hidden' || style.overflowX === 'clip');

              if (clipsInlineText) {
                clippedText.push(`${label} scrollWidth=${element.scrollWidth} clientWidth=${element.clientWidth}`);
              }
            }

            const header = document.querySelector('.site-header')?.getBoundingClientRect();
            const main = document.querySelector('main')?.getBoundingClientRect();
            const h1 = document.querySelector('main h1')?.getBoundingClientRect();
            const sections = Array.from(document.querySelectorAll('main > section, main > .hero')).filter((section) => {
              const style = window.getComputedStyle(section);
              const rect = section.getBoundingClientRect();
              return style.display !== 'none' && rect.height > 0;
            });
            let maxSectionGap = 0;

            for (let index = 1; index < sections.length; index++) {
              const previous = sections[index - 1].getBoundingClientRect();
              const current = sections[index].getBoundingClientRect();
              maxSectionGap = Math.max(maxSectionGap, current.top - previous.bottom);
            }

            return {
              viewportWidth,
              scrollWidth: document.documentElement.scrollWidth,
              offenders: offenders.slice(0, 10),
              clippedText: clippedText.slice(0, 10),
              headerBottom: header?.bottom ?? 0,
              headerHeight: header?.height ?? 0,
              mainTop: main?.top ?? 0,
              h1Left: h1?.left ?? 0,
              h1Right: h1?.right ?? 0,
              maxSectionGap,
            };
          });

          expect(result.scrollWidth).toBeLessThanOrEqual(result.viewportWidth);
          expect(result.offenders).toEqual([]);
          expect(result.clippedText).toEqual([]);
          expect(result.headerHeight).toBeGreaterThanOrEqual(48);
          expect(result.headerHeight).toBeLessThanOrEqual(100);
          expect(result.mainTop).toBeGreaterThanOrEqual(result.headerBottom - 1);
          expect(result.h1Left).toBeGreaterThanOrEqual(-1);
          expect(result.h1Right).toBeLessThanOrEqual(result.viewportWidth + 1);
          expect(result.maxSectionGap).toBeLessThanOrEqual(300);
        });
      }
    });
  }
});

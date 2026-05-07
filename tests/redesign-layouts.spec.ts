import { test, expect } from '@playwright/test';

const DE_PAGES = [
  { path: '/', name: 'DE Home' },
  { path: '/leistungen/', name: 'DE Leistungen' },
  { path: '/projekte/', name: 'DE Projekte' },
  { path: '/preise/', name: 'DE Preise' },
  { path: '/faq/', name: 'DE FAQ' },
  { path: '/ueber/', name: 'DE Über' },
  { path: '/kontakt/', name: 'DE Kontakt' },
];

const EN_PAGES = [
  { path: '/en/', name: 'EN Home' },
  { path: '/en/services/', name: 'EN Services' },
  { path: '/en/projects/', name: 'EN Projects' },
  { path: '/en/pricing/', name: 'EN Pricing' },
  { path: '/en/faq/', name: 'EN FAQ' },
  { path: '/en/about/', name: 'EN About' },
  { path: '/en/contact/', name: 'EN Contact' },
];

const ALL_PAGES = [...DE_PAGES, ...EN_PAGES];

for (const page of ALL_PAGES) {
  test.describe(page.name, () => {
    test('page loads without errors', async ({ page: p }) => {
      const errors: string[] = [];
      p.on('pageerror', (err) => errors.push(err.message));

      const response = await p.goto(page.path);
      expect(response?.status()).toBe(200);
      expect(errors).toHaveLength(0);
    });

    test('header brand is visible', async ({ page: p }) => {
      await p.goto(page.path);
      const brand = p.locator('.header-brand');
      await expect(brand).toBeVisible();
      const name = p.locator('.header-brand-name');
      await expect(name).toHaveText('Jan-Erik');
    });

    test('LinkedIn logo is visible', async ({ page: p }) => {
      await p.goto(page.path);
      const linkedin = p.locator('.logo-link img');
      await expect(linkedin).toBeVisible();
      const src = await linkedin.getAttribute('src');
      expect(src).not.toContain('../../../');
    });

    test('header navigation exists', async ({ page: p }) => {
      await p.goto(page.path);
      const nav = p.locator('.header-nav');
      await expect(nav).toBeVisible();
      const links = nav.locator('a');
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(6);
    });

    test('main content exists', async ({ page: p }) => {
      await p.goto(page.path);
      const main = p.locator('main#main');
      await expect(main).toBeVisible();
    });

    test('footer exists', async ({ page: p }) => {
      await p.goto(page.path);
      const footer = p.locator('.site-footer');
      await expect(footer).toBeVisible();
    });

    test('no broken images', async ({ page: p }) => {
      await p.goto(page.path);

      // Lazy-Bilder eager forcen und Ladevorgang abwarten, damit naturalWidth
      // auch ausserhalb des Viewports verlaesslich gefuellt ist.
      await p.evaluate(async () => {
        const lazy = Array.from(document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]'));
        lazy.forEach((img) => { img.loading = 'eager'; });
        const all = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
        await Promise.all(all.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
        }));
      });

      const images = p.locator('img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        const src = await img.getAttribute('src');
        expect(naturalWidth, `Image ${src} should have loaded`).toBeGreaterThan(0);
      }
    });

    test('darkmode toggle exists', async ({ page: p }) => {
      await p.goto(page.path);
      const toggle = p.locator('#darkmode-toggle');
      await expect(toggle).toBeAttached();
    });
  });
}

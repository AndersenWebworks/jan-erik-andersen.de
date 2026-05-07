import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5500';

const forceVisible = async (page) => {
  await page.evaluate(() => {
    // Funnel ausblenden, sonst überdeckt es den Hero
    document.documentElement.classList.remove('funnel-active');
    document.documentElement.classList.add('funnel-inline');
    const funnel = document.querySelector('section.funnel');
    if (funnel) {
      funnel.classList.add('funnel-hidden');
      funnel.style.display = 'none';
    }
    document.querySelectorAll('.hero, .services-grid, .services-section, .process-section, .testimonials-section, .projects-section, .pricing-section, .contact-section, .section-cta')
      .forEach(el => el.classList.add('is-visible'));
  });
};

test.describe('Button System QA - Issue #14', () => {

  test('Homepage DE - Hero CTAs Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await forceVisible(page);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'qa-btn-hero-de.png', clip: { x: 0, y: 0, width: 1280, height: 700 } });
  });

  test('Homepage DE - Hero CTAs Hover-State', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await forceVisible(page);
    await page.waitForTimeout(1200);
    const primary = page.locator('.hero-ctas .btn-primary').first();
    await primary.scrollIntoViewIfNeeded();
    await primary.hover({ force: true });
    await page.waitForTimeout(400);
    const hero = page.locator('.hero-ctas').first();
    await hero.screenshot({ path: 'qa-btn-hero-de-hover.png' });
  });

  test('Homepage DE - Section CTA (Projekte)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    const cta = page.locator('.section-cta').first();
    await cta.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(500);
    await cta.screenshot({ path: 'qa-btn-section-cta.png' });
  });

  test('Homepage DE - Mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    await forceVisible(page);
    await page.waitForTimeout(1200);
    const hero = page.locator('.hero-ctas').first();
    await hero.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await hero.screenshot({ path: 'qa-btn-hero-mobile.png' });
  });

  test('Pricing Page DE - Cards mit Anfragen-Buttons', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/preise/index.html`);
    await page.waitForLoadState('networkidle');
    await forceVisible(page);
    await page.waitForTimeout(1200);
    const grid = page.locator('.pricing-grid').first();
    await grid.evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForTimeout(500);
    await grid.screenshot({ path: 'qa-btn-pricing-cards.png' });
  });

  test('EN Homepage - Hero CTAs', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/en/index.html`);
    await page.waitForLoadState('networkidle');
    await forceVisible(page);
    await page.waitForTimeout(1200);
    const hero = page.locator('.hero-ctas').first();
    await hero.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await hero.screenshot({ path: 'qa-btn-hero-en.png' });
  });

  test('Button-Style Audit - check computed styles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    const primary = page.locator('.hero-ctas .btn-primary').first();
    const ghost = page.locator('.hero-ctas .btn-secondary').first();

    const primaryStyles = await primary.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        color: cs.color,
        border: cs.borderColor,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        padding: cs.padding,
      };
    });
    const ghostStyles = await ghost.evaluate(el => {
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        color: cs.color,
        border: cs.borderColor,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        padding: cs.padding,
      };
    });

    console.log('PRIMARY:', JSON.stringify(primaryStyles, null, 2));
    console.log('GHOST:', JSON.stringify(ghostStyles, null, 2));

    // Assertions
    expect(primaryStyles.bg).toContain('220, 38, 38'); // accent red
    expect(primaryStyles.color).toContain('255, 255, 255');
    expect(ghostStyles.bg).toMatch(/(rgba\(0, 0, 0, 0\)|transparent)/);
  });

  test('Pfeil-Span ist da und hat Transition', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/index.html`);
    await page.waitForLoadState('networkidle');
    const arrow = page.locator('.hero-ctas .btn-primary .btn-arr').first();
    await expect(arrow).toBeVisible();
    await expect(arrow).toHaveText('→');

    const arrTransition = await arrow.evaluate(el => getComputedStyle(el).transition);
    expect(arrTransition.toLowerCase()).toContain('transform');
    expect(arrTransition).toContain('cubic-bezier');
  });
});

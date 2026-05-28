import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TEMPLATE_URL = pathToFileURL(
  path.join(__dirname, '..', 'JEA-Andersen-Webworks-standalone.html')
).toString();

type BoxMetric = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: string;
  lineHeight: string;
  background: string;
  borderRadius: string;
};

async function elementMetric(page: Page, selector: string): Promise<BoxMetric> {
  return page.locator(selector).first().evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);

    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      background: style.backgroundColor,
      borderRadius: style.borderRadius,
    };
  });
}

async function currentAndTemplate(page: Page, currentPath: string, selector: string) {
  await page.goto(TEMPLATE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const template = await elementMetric(page, selector);

  await page.goto(currentPath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const current = await elementMetric(page, selector);

  return { template, current };
}

function expectClose(actual: number, expected: number, tolerance: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

test.describe('visible standalone template metrics', () => {
  test('homepage desktop hero follows the standalone geometry', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 });

    for (const selector of ['header', 'h1', '.hero-sub, .hero-lead', '.portrait-card']) {
      const { template, current } = await currentAndTemplate(page, '/', selector);

      expect(current.fontSize).toBe(template.fontSize);
      expect(current.lineHeight).toBe(template.lineHeight);
      expectClose(current.x, template.x, 12);
      expectClose(current.y, template.y, 12);
      expectClose(current.width, template.width, 16);
    }

    const { template: templateNav, current: currentNav } = await currentAndTemplate(page, '/', 'nav');
    expectClose(currentNav.x, templateNav.x, 24);
  });

  test('homepage mobile hero keeps the standalone rhythm before functional extras', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1200 });

    for (const selector of ['h1', '.hero-sub, .hero-lead']) {
      const { template, current } = await currentAndTemplate(page, '/', selector);

      expect(current.fontSize).toBe(template.fontSize);
      expect(current.lineHeight).toBe(template.lineHeight);
      expectClose(current.x, template.x, 4);
      expectClose(current.y, template.y, 12);
      expectClose(current.width, template.width, 4);
    }

    await page.goto('/', { waitUntil: 'networkidle' });
    const primary = await elementMetric(page, '.hero-ctas .btn-primary');
    const secondary = await elementMetric(page, '.hero-ctas .btn-secondary');
    const quickCheck = await elementMetric(page, '.hero-ctas .funnel-reopen');

    expect(primary.x).toBe(20);
    expect(primary.height).toBeLessThanOrEqual(46);
    expect(secondary.x).toBe(20);
    expect(secondary.height).toBeLessThanOrEqual(48);
    expect(quickCheck.y).toBeGreaterThan(secondary.y);
    expect(quickCheck.background).not.toBe('rgb(168, 58, 58)');
  });
});

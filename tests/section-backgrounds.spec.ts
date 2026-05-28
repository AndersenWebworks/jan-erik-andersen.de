import { test, expect } from '@playwright/test';

const HOME_SECTIONS = [
  ['#hero', 'rgba(0, 0, 0, 0)'],
  ['#projekte', 'rgba(0, 0, 0, 0)'],
  ['#leistungen', 'rgb(245, 244, 238)'],
  ['#stimmen', 'rgba(0, 0, 0, 0)'],
  ['#prozess', 'rgb(245, 244, 238)'],
  ['#ueber', 'rgba(0, 0, 0, 0)'],
  ['#preise', 'rgb(245, 244, 238)'],
  ['#faq', 'rgba(0, 0, 0, 0)'],
  ['#kontakt', 'rgba(0, 0, 0, 0)'],
] as const;

const EN_HOME_SECTIONS = [
  ['#hero', 'rgba(0, 0, 0, 0)'],
  ['#projects', 'rgba(0, 0, 0, 0)'],
  ['#services', 'rgb(245, 244, 238)'],
  ['#testimonials', 'rgba(0, 0, 0, 0)'],
  ['#process', 'rgb(245, 244, 238)'],
  ['#about', 'rgba(0, 0, 0, 0)'],
  ['#pricing', 'rgb(245, 244, 238)'],
  ['#faq', 'rgba(0, 0, 0, 0)'],
  ['#contact', 'rgba(0, 0, 0, 0)'],
] as const;

test('homepage root colors match the visible standalone template defaults', async ({ page }) => {
  await page.goto('/');

  await expect.poll(async () => page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);

    return {
      bg: root.getPropertyValue('--color-bg').trim(),
      bgAlt: root.getPropertyValue('--color-bg-alt').trim(),
      bgMuted: root.getPropertyValue('--color-bg-muted').trim(),
      bodyBg: body.backgroundColor,
    };
  })).toEqual({
    bg: '#ffffff',
    bgAlt: '#f5f4ee',
    bgMuted: '#e8e7e0',
    bodyBg: 'rgb(255, 255, 255)',
  });
});

test('German homepage uses the reference background sequence', async ({ page }) => {
  await page.goto('/');

  for (const [selector, expectedBackground] of HOME_SECTIONS) {
    await expect
      .poll(async () => page.locator(selector).evaluate((el) => getComputedStyle(el).backgroundColor))
      .toBe(expectedBackground);
  }
});

test('English homepage uses the reference background sequence', async ({ page }) => {
  await page.goto('/en/');

  for (const [selector, expectedBackground] of EN_HOME_SECTIONS) {
    await expect
      .poll(async () => page.locator(selector).evaluate((el) => getComputedStyle(el).backgroundColor))
      .toBe(expectedBackground);
  }
});

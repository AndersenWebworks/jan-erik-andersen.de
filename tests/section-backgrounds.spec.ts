import { test, expect } from '@playwright/test';

const HOME_SECTIONS = [
  ['#hero', 'rgba(0, 0, 0, 0)'],
  ['#projekte', 'rgba(0, 0, 0, 0)'],
  ['#leistungen', 'rgb(242, 241, 236)'],
  ['#stimmen', 'rgba(0, 0, 0, 0)'],
  ['#prozess', 'rgb(242, 241, 236)'],
  ['#ueber', 'rgba(0, 0, 0, 0)'],
  ['#preise', 'rgb(242, 241, 236)'],
  ['#faq', 'rgba(0, 0, 0, 0)'],
  ['#kontakt', 'rgba(0, 0, 0, 0)'],
] as const;

const EN_HOME_SECTIONS = [
  ['#hero', 'rgba(0, 0, 0, 0)'],
  ['#projects', 'rgba(0, 0, 0, 0)'],
  ['#services', 'rgb(242, 241, 236)'],
  ['#testimonials', 'rgba(0, 0, 0, 0)'],
  ['#process', 'rgb(242, 241, 236)'],
  ['#about', 'rgba(0, 0, 0, 0)'],
  ['#pricing', 'rgb(242, 241, 236)'],
  ['#faq', 'rgba(0, 0, 0, 0)'],
  ['#contact', 'rgba(0, 0, 0, 0)'],
] as const;

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

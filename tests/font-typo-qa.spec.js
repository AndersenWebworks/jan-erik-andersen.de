// QA: JetBrains Mono Akzent-Font + clamp() Typografie-Scale
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:5500';

test('JetBrains Mono is loaded and applied to mono accents', async ({ page }) => {
  await page.goto(`${BASE}/index.html`);
  // Warten bis Fonts geladen sind
  await page.evaluate(() => document.fonts.ready);

  // Prueft: gibt es ueberhaupt einen Loader fuer JetBrains Mono?
  const linkHref = await page.locator('link[href*="JetBrains+Mono"]').first().getAttribute('href');
  expect(linkHref).toContain('JetBrains+Mono');

  // Prueft: wird die Font-Family auf typischen Mono-Akzent-Elementen wirklich verwendet?
  // Wir suchen nach einem Element mit font-family Mono (eyebrow, badge oder aehnliches)
  const monoFontInUse = await page.evaluate(() => {
    const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--font-mono');
    return cssVar.trim();
  });
  expect(monoFontInUse).toContain('JetBrains Mono');

  // Prueft, dass mindestens ein Element die Mono-Familie tatsaechlich rendert
  const sampleApplied = await page.evaluate(() => {
    const candidates = document.querySelectorAll('[class*="eyebrow"], [class*="badge"], [class*="kicker"], code, kbd');
    for (const el of candidates) {
      const ff = getComputedStyle(el).fontFamily;
      if (/JetBrains Mono/i.test(ff)) return ff;
    }
    return null;
  });
  expect(sampleApplied).toBeTruthy();
});

test('Type scale uses clamp() and scales between 320px and 1280px', async ({ page }) => {
  // Mobile
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`${BASE}/index.html`);
  await page.evaluate(() => document.fonts.ready);
  const h1Mobile = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
  });

  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/index.html`);
  await page.evaluate(() => document.fonts.ready);
  const h1Desktop = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? parseFloat(getComputedStyle(h1).fontSize) : 0;
  });

  // Erwartung: mobile h1 < desktop h1 (clamp greift)
  expect(h1Mobile).toBeGreaterThan(0);
  expect(h1Desktop).toBeGreaterThan(h1Mobile);
  // Mobile sollte rund 36px (2.25rem), Desktop rund 52px (3.25rem) sein
  expect(h1Mobile).toBeLessThan(h1Desktop * 0.9);
});

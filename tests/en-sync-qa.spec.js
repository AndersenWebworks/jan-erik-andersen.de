const { test, expect } = require('@playwright/test');

const pairs = [
  ['/index.html', '/en/index.html'],
  ['/leistungen/index.html', '/en/services/index.html'],
  ['/leistungen/ki-sichtbarkeit/index.html', '/en/services/ai-visibility/index.html'],
  ['/leistungen/bfsg-barrierefreiheit/index.html', '/en/services/bfsg-accessibility/index.html'],
  ['/leistungen/shops-und-custom/index.html', '/en/services/shops-and-custom/index.html'],
  ['/projekte/index.html', '/en/projects/index.html'],
  ['/ueber/index.html', '/en/about/index.html'],
  ['/kontakt/index.html', '/en/contact/index.html'],
  ['/preise/index.html', '/en/pricing/index.html'],
  ['/faq/index.html', '/en/faq/index.html'],
  ['/de/impressum.html', '/en/imprint.html'],
  ['/de/datenschutz.html', '/en/privacy.html'],
  ['/de/barrierefreiheit.html', '/en/accessibility.html'],
];

const BASE = 'http://localhost:5500';

test.describe.configure({ mode: 'parallel' });

for (const [de, en] of pairs) {
  test(`structure parity ${en}`, async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      const t = msg.text();
      if (t.includes('goatcounter') || t.includes('Failed to load resource')) return;
      errors.push(t);
    });
    page.on('pageerror', err => errors.push(err.message));
    const failedReq = [];
    page.on('requestfailed', req => {
      const u = req.url();
      if (u.includes('goatcounter') || u.includes('googletagmanager') || u.includes('google-analytics')) return;
      failedReq.push(u + ' ' + req.failure().errorText);
    });

    await page.goto(BASE + de, { waitUntil: 'networkidle' });
    const deStats = await page.evaluate(() => ({
      sections: document.querySelectorAll('section').length,
      headings: document.querySelectorAll('h1,h2,h3').length,
      eyebrows: document.querySelectorAll('.eyebrow').length,
      buttons: document.querySelectorAll('a.btn, button').length,
      cards: document.querySelectorAll('[class*="card"]').length,
      h1Text: document.querySelector('h1')?.textContent.trim().slice(0, 80) || '',
      lang: document.documentElement.lang,
    }));

    await page.goto(BASE + en, { waitUntil: 'networkidle' });
    const enStats = await page.evaluate(() => ({
      sections: document.querySelectorAll('section').length,
      headings: document.querySelectorAll('h1,h2,h3').length,
      eyebrows: document.querySelectorAll('.eyebrow').length,
      buttons: document.querySelectorAll('a.btn, button').length,
      cards: document.querySelectorAll('[class*="card"]').length,
      h1Text: document.querySelector('h1')?.textContent.trim().slice(0, 80) || '',
      lang: document.documentElement.lang,
    }));

    expect(enStats.lang, `EN lang mismatch ${en}`).toBe('en');
    expect(deStats.lang, `DE lang mismatch ${de}`).toBe('de');
    expect(enStats.sections, `sections ${de} vs ${en}`).toBe(deStats.sections);
    expect(enStats.eyebrows, `eyebrows ${de} vs ${en}`).toBe(deStats.eyebrows);
    expect(enStats.cards, `cards ${de} vs ${en}`).toBe(deStats.cards);
    expect(failedReq, `failed reqs on ${en}: ${failedReq.join(', ')}`).toEqual([]);
    expect(errors, `console errors on ${en}: ${errors.join(', ')}`).toEqual([]);
  });
}

import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const activeTextFiles = [
  'index.html',
  'en/index.html',
  'de/impressum.html',
  'en/imprint.html',
  'de/datenschutz.html',
  'en/privacy.html',
  'de/barrierefreiheit.html',
  'en/accessibility.html',
  'faq/index.html',
  'en/faq/index.html',
  'leistungen/index.html',
  'en/services/index.html',
  'leistungen/bfsg-barrierefreiheit/index.html',
  'en/services/bfsg-accessibility/index.html',
  'preise/index.html',
  'en/pricing/index.html',
  'funnel.json',
  'en/funnel.json',
  'funnel.js',
  'en/funnel.js',
  'llms.txt',
  'llms-full.txt',
  'ai/services.json',
  'ai/services.txt',
];

function read(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test.describe('legal and compliance copy', () => {
  test('imprint pages do not link to the discontinued EU ODR platform', async ({ page }) => {
    for (const url of ['/de/impressum.html', '/en/imprint.html']) {
      await page.goto(url);
      await expect(page.locator('main')).not.toContainText('ec.europa.eu/consumers/odr');
      await expect(page.locator('main')).not.toContainText('Online-Streitbeilegung');
      await expect(page.locator('main')).not.toContainText('online dispute resolution (ODR)');
      await expect(page.locator('main')).toContainText(/Verbraucher|Consumer/);
    }
  });

  test('privacy pages describe the actual data processing surface', async ({ page }) => {
    for (const url of ['/de/datenschutz.html', '/en/privacy.html']) {
      await page.goto(url);
      const main = page.locator('main');

      await expect(main).toContainText('GitHub Pages');
      await expect(main).toContainText(/localStorage|LocalStorage/);
      await expect(main).toContainText(/darkmode/);
      await expect(main).toContainText(/funnel-done/);
      await expect(main).toContainText(/GoatCounter/);
      await expect(main).toContainText(/8 Stunden|8 hours/);
      await expect(main).toContainText(/datenschutz-mv\.de/);
      await expect(main).not.toContainText('Kontaktformular / E-Mail-Kontakt');
      await expect(main).not.toContainText('Contact Form / Email Contact');
      await expect(main).not.toContainText('ohne personenbezogene Daten');
      await expect(main).not.toContainText('without storing any personal data');
    }
  });

  test('accessibility statements avoid formal overclaiming and point to MLBF', async ({ page }) => {
    for (const url of ['/de/barrierefreiheit.html', '/en/accessibility.html']) {
      await page.goto(url);
      const main = page.locator('main');

      await expect(main).toContainText(/vollständiges externes WCAG|no full external WCAG/);
      await expect(main).toContainText(/keine formelle Konformitätszertifizierung|not a formal conformance certification/);
      await expect(main).toContainText(/MLBF/);
      await expect(main).toContainText(/Carl-Miller-Str\. 6/);
      await expect(main).not.toContainText('Bundesfachstelle Barrierefreiheit');
      await expect(main).not.toContainText('Federal Accessibility Office');
    }
  });

  test('active public copy avoids broad BFSG and GDPR compliance claims', () => {
    const forbidden = [
      /Seit Juni 2025/i,
      /Since June 2025/i,
      /B2C-Websites[^.\n]*müssen/i,
      /B2C websites[^.\n]*must/i,
      /websites[^.\n]*must be accessible/i,
      /Websites[^.\n]*müssen[^.\n]*barrierefrei/i,
      /gesetzlich geforderte Standard/i,
      /legally required standard/i,
      /DSGVO-konform/i,
      /GDPR compliant/i,
      /Pflicht seit Juni 2025/i,
      /Mandatory since June 2025/i,
      /Bußgelder bis/i,
      /fines up to/i,
    ];

    for (const relativePath of activeTextFiles) {
      const content = read(relativePath);
      for (const pattern of forbidden) {
        expect(content, `${relativePath} contains ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

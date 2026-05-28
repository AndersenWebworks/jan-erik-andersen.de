import { test, expect } from '@playwright/test';

const ROOT = 'http://127.0.0.1:5500';

async function openFresh(page, path = '/') {
  await page.addInitScript(() => localStorage.removeItem('funnel-done'));
  await page.goto(`${ROOT}${path}`);
  await expect(page.locator('#funnel')).toBeHidden();
  await expect(page.locator('.quickcheck-card')).toBeVisible();
  await expect(page.locator('#funnel-reopen')).toBeVisible();
  await page.locator('#funnel-reopen').click();
  await expect(page.locator('#funnel-skip')).toBeVisible();
  await expect(page.locator('#funnel')).toBeVisible();
  await expect(page.locator('.quickcheck-card')).toBeHidden();
}

async function decodedMailto(page) {
  const href = await page.locator('.funnel-contact-send').getAttribute('href');
  expect(href).toBeTruthy();
  const parsed = new URL(href!);
  return {
    subject: parsed.searchParams.get('subject') || '',
    body: parsed.searchParams.get('body') || '',
  };
}

test.describe('project compass funnel', () => {
  test('home starts with a prominent quickcheck invitation instead of automatic funnel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.removeItem('funnel-done'));
    await page.goto(ROOT);

    const card = page.locator('.quickcheck-card');
    const button = page.locator('#funnel-reopen');

    await expect(page.locator('#funnel')).toBeHidden();
    await expect(card).toBeVisible();
    await expect(button).toBeVisible();
    await expect(card).toContainText('Nicht sicher');

    const metrics = await card.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const btn = el.querySelector('.funnel-reopen') as HTMLElement;
      const btnRect = btn.getBoundingClientRect();
      const styles = getComputedStyle(btn);
      return {
        cardTop: rect.top,
        cardBottom: rect.bottom,
        buttonHeight: btnRect.height,
        buttonBg: styles.backgroundColor,
        buttonColor: styles.color,
      };
    });

    expect(metrics.cardTop).toBeGreaterThanOrEqual(0);
    expect(metrics.cardTop).toBeLessThan(620);
    expect(metrics.cardBottom).toBeLessThanOrEqual(844);
    expect(metrics.buttonHeight).toBeGreaterThanOrEqual(50);
    expect(metrics.buttonBg).toBe('rgb(168, 58, 58)');
    expect(metrics.buttonColor).toBe('rgb(255, 255, 255)');
  });

  test('opens inline as a template card, not as a fixed full-screen overlay', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFresh(page);

    const state = await page.evaluate(() => {
      const funnel = document.querySelector('#funnel') as HTMLElement;
      const app = document.querySelector('.funnel-app') as HTMLElement;
      const skip = document.querySelector('#funnel-skip') as HTMLElement;
      const funnelRect = funnel.getBoundingClientRect();
      const appRect = app.getBoundingClientRect();
      const skipRect = skip.getBoundingClientRect();

      return {
        htmlActive: document.documentElement.classList.contains('funnel-active'),
        htmlInline: document.documentElement.classList.contains('funnel-inline'),
        funnelPosition: getComputedStyle(funnel).position,
        appBackground: getComputedStyle(app).backgroundColor,
        appRadius: parseFloat(getComputedStyle(app).borderRadius),
        appWidth: appRect.width,
        funnelHeight: funnelRect.height,
        viewportHeight: window.innerHeight,
        skipPosition: getComputedStyle(skip).position,
        skipTop: skipRect.top,
        scrollY: window.scrollY,
      };
    });

    expect(state.htmlActive).toBe(true);
    expect(state.htmlInline).toBe(false);
    expect(state.funnelPosition).not.toBe('fixed');
    expect(state.funnelHeight).toBeLessThan(state.viewportHeight * 1.25);
    expect(state.appWidth).toBeLessThanOrEqual(760);
    expect(state.appBackground).toBe('rgb(255, 255, 255)');
    expect(state.appRadius).toBeGreaterThanOrEqual(10);
    expect(state.skipPosition).toBe('absolute');
    expect(state.skipTop).toBeGreaterThanOrEqual(0);
    expect(state.scrollY).toBeGreaterThan(0);
  });

  test('page scroll stays normal while the inline funnel is open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFresh(page);

    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);

    await page.locator('#funnel-skip').click();
    await expect(page.locator('#funnel')).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('funnel-active'))).toBe(false);
    await expect(page.locator('#funnel-reopen')).toBeVisible();
  });

  test('question flow stays stable on mobile while content settles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFresh(page);

    await page.waitForTimeout(250);
    const first = await page.locator('.funnel-app').boundingBox();

    await page.waitForTimeout(900);
    const mid = await page.locator('.funnel-app').boundingBox();

    await page.waitForTimeout(900);
    const done = await page.locator('.funnel-app').boundingBox();

    expect(first).not.toBeNull();
    expect(mid).not.toBeNull();
    expect(done).not.toBeNull();

    const widths = [first!.width, mid!.width, done!.width];
    const widthDelta = Math.max(...widths) - Math.min(...widths);
    expect(widthDelta).toBeLessThanOrEqual(2);
  });

  test('contact result creates a useful German mail draft with real umlauts', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFresh(page);

    await page.getByRole('button', { name: /Kontakt aufnehmen/i }).click();
    await expect(page.getByRole('heading', { name: /Kurzer Draht/i })).toBeVisible();
    await page.getByRole('button', { name: /Mail schreiben/i }).click();
    await expect(page.locator('.funnel-contact-send')).toBeVisible();

    const email = await decodedMailto(page);
    expect(email.subject).toBe('Kurze Anfrage');
    expect(email.body).toContain('Kurzcheck-Ergebnis:');
    expect(email.body).toContain('Mein Weg:');
    expect(email.body).toContain('Können wir kurz telefonieren?');
    expect(email.body).not.toContain('Berater-Funnel');
    expect(email.body).not.toMatch(/\b(moechte|koennen|fuer|ueber|wuerde|pruefen|klaeren|noetig)\b/i);
  });

  test('english home uses the same inline behavior', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFresh(page, '/en/');

    await expect(page.locator('#funnel')).not.toHaveCSS('position', 'fixed');
    await expect(page.locator('#funnel-skip')).toHaveText('Close');
    await expect(page.locator('#funnel-skip')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('funnel-inline'))).toBe(false);
  });
});

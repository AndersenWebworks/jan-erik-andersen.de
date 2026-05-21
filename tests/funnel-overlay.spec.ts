import { test, expect } from '@playwright/test';

const ROOT = 'http://127.0.0.1:5500';

async function openFresh(page, path = '/') {
  await page.addInitScript(() => localStorage.removeItem('funnel-done'));
  await page.goto(`${ROOT}${path}`);
  await expect(page.locator('#funnel')).toBeVisible();
  await expect(page.locator('#funnel-skip')).toBeVisible();
}

test.describe('funnel overlay', () => {
  test('mobile opens as a viewport overlay with fixed skip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFresh(page);

    const state = await page.evaluate(() => {
      const funnel = document.querySelector('#funnel') as HTMLElement;
      const container = document.querySelector('.funnel-container') as HTMLElement;
      const skip = document.querySelector('#funnel-skip') as HTMLElement;
      const funnelRect = funnel.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const skipRect = skip.getBoundingClientRect();

      return {
        htmlActive: document.documentElement.classList.contains('funnel-active'),
        htmlInline: document.documentElement.classList.contains('funnel-inline'),
        funnelPosition: getComputedStyle(funnel).position,
        funnelTop: funnelRect.top,
        funnelBottom: funnelRect.bottom,
        funnelHeight: funnelRect.height,
        viewportHeight: window.innerHeight,
        containerCenterDelta: Math.abs((containerRect.top + containerRect.height / 2) - window.innerHeight / 2),
        skipBottom: window.innerHeight - skipRect.bottom,
        skipTop: skipRect.top,
        scrollY: window.scrollY
      };
    });

    expect(state.htmlActive).toBe(true);
    expect(state.htmlInline).toBe(false);
    expect(state.funnelPosition).toBe('fixed');
    expect(Math.abs(state.funnelTop)).toBeLessThanOrEqual(1);
    expect(Math.abs(state.funnelBottom - state.viewportHeight)).toBeLessThanOrEqual(1);
    expect(state.funnelHeight).toBeGreaterThanOrEqual(state.viewportHeight - 1);
    expect(state.containerCenterDelta).toBeLessThanOrEqual(90);
    expect(state.skipBottom).toBeGreaterThanOrEqual(8);
    expect(state.skipTop).toBeGreaterThan(state.viewportHeight - 120);
    expect(state.scrollY).toBe(0);
  });

  test('mobile locks background scroll until skip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFresh(page);

    await page.mouse.wheel(0, 900);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

    await page.locator('#funnel-skip').click();
    await expect(page.locator('#funnel')).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('funnel-active'))).toBe(false);

    await page.mouse.wheel(0, 900);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test('mobile keeps skip visible through funnel steps', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFresh(page);

    for (let i = 0; i < 3; i++) {
      await page.locator('.funnel-option').first().click();
      await expect(page.locator('#funnel-skip')).toBeVisible();
      await expect(page.locator('.funnel-container')).toBeInViewport();
      await page.waitForTimeout(100);
    }
  });

  test('small mobile viewport shows a visible scrollbar when funnel content overflows', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 360 });
    await openFresh(page);

    const state = await page.evaluate(() => {
      const container = document.querySelector('.funnel-container') as HTMLElement;
      const styles = getComputedStyle(container);

      container.scrollTop = 0;
      container.scrollTop = 48;

      return {
        canOverflow: container.scrollHeight > container.clientHeight,
        scrolled: container.scrollTop > 0,
        scrollbarWidth: styles.scrollbarWidth,
        overflowY: styles.overflowY
      };
    });

    expect(state.canOverflow).toBe(true);
    expect(state.scrolled).toBe(true);
    expect(state.overflowY).toBe('auto');
    expect(state.scrollbarWidth).not.toBe('none');
  });

  test('desktop remains an overlay with fixed skip', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openFresh(page);

    await expect(page.locator('#funnel')).toHaveCSS('position', 'fixed');
    await expect(page.locator('#funnel-skip')).toBeVisible();
    await expect(page.locator('#funnel')).toBeInViewport();
  });

  test('english home uses the same overlay behavior', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFresh(page, '/en/');

    await expect(page.locator('#funnel')).toHaveCSS('position', 'fixed');
    await expect(page.locator('#funnel-skip')).toHaveText('Skip');
    await expect(page.locator('#funnel-skip')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('funnel-inline'))).toBe(false);
  });
});

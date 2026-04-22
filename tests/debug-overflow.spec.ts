import { test, expect } from '@playwright/test';

test('debug overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');

  const overflowingElements = await page.evaluate(() => {
    const results: string[] = [];
    const viewportWidth = window.innerWidth;

    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 5) {
        const tag = el.tagName.toLowerCase();
        const cls = el.className ? `.${el.className.toString().split(' ').join('.')}` : '';
        const id = el.id ? `#${el.id}` : '';
        results.push(`${tag}${id}${cls}: right=${Math.round(rect.right)}px, width=${Math.round(rect.width)}px`);
      }
    });

    return results.slice(0, 20);
  });

  console.log('Overflowing elements:', overflowingElements);
  expect(overflowingElements.length).toBe(0);
});

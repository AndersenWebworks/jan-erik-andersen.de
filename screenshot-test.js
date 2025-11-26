const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + __dirname.replace(/\\/g, '/') + '/index.html');
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Scroll to accordion section
  await page.evaluate(() => {
    const accordion = document.querySelector('[uk-accordion]');
    if (accordion) accordion.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'accordion-screenshot.png', fullPage: true });

  await browser.close();
  console.log('Screenshot saved as accordion-screenshot.png');
})();

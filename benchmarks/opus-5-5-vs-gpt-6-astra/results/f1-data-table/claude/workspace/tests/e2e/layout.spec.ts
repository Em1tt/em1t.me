import { expect, test, type Page } from '@playwright/test';

async function pageScrollsSideways(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    window.scrollTo(1000, window.scrollY);
    const scrolled = window.scrollX !== 0;
    window.scrollTo(0, window.scrollY);
    return scrolled || document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

test.describe('on a 390px wide phone screen', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ['/', '/?q=zzz', '/?sort=email&dir=desc&page=25', '/?dept=Engineering']) {
    test(`the page does not scroll sideways (${path})`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('table')).toBeVisible();
      expect(await pageScrollsSideways(page)).toBe(false);
    });
  }

  test('the table scrolls inside its own container', async ({ page }) => {
    await page.goto('/');
    const container = page.locator('table').locator('..');
    const { scrollWidth, clientWidth } = await container.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);

    await container.evaluate((el) => el.scrollBy({ left: 400 }));
    expect(await container.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    expect(await pageScrollsSideways(page)).toBe(false);

    // Every control stays usable.
    await expect(page.getByTestId('search')).toBeInViewport();
    await page.getByTestId('next').click();
    await expect(page.getByTestId('page-info')).toHaveText('Page 2 of 25');
    await page.locator('th[data-key="location"] button').click();
    await expect(page.locator('th[data-key="location"]')).toHaveAttribute('aria-sort', 'ascending');
  });
});

test.describe('on a touch phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

  test('the page does not scroll sideways', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox does not emulate mobile viewports');
    await page.goto('/');
    expect(await page.evaluate(() => window.innerWidth)).toBe(390);
    expect(await pageScrollsSideways(page)).toBe(false);
  });
});

test('the table fits a laptop screen without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  const container = page.locator('table').locator('..');
  const overflow = await container.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

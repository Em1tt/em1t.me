import { expect, test } from '@playwright/test';
import { expectedIds, expectedRows, expectRows, expectStatus, sortButton } from './support';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('starts on the first of 25 pages', async ({ page }) => {
  await expectStatus(page, 'Showing 1–20 of 500', 'Page 1 of 25');
  await expect(page.getByTestId('prev')).toBeDisabled();
  await expect(page.getByTestId('next')).toBeEnabled();
  await expect(page.locator('tbody tr')).toHaveCount(20);
});

test('moves between pages', async ({ page }) => {
  await page.getByTestId('next').click();
  await expectStatus(page, 'Showing 21–40 of 500', 'Page 2 of 25');
  await expectRows(page, expectedIds({}, 2));
  await expect(page.getByTestId('prev')).toBeEnabled();

  await page.getByTestId('next').click();
  await expectStatus(page, 'Showing 41–60 of 500', 'Page 3 of 25');

  await page.getByTestId('prev').click();
  await page.getByTestId('prev').click();
  await expectStatus(page, 'Showing 1–20 of 500', 'Page 1 of 25');
  await expect(page.getByTestId('prev')).toBeDisabled();
});

test('disables next on the last page', async ({ page }) => {
  for (let i = 1; i < 25; i++) await page.getByTestId('next').click();
  await expectStatus(page, 'Showing 481–500 of 500', 'Page 25 of 25');
  await expectRows(page, expectedIds({}, 25));
  await expect(page.getByTestId('next')).toBeDisabled();
  await expect(page.getByTestId('prev')).toBeEnabled();
});

test('keeps keyboard focus when the focused button gets disabled', async ({ page }) => {
  await page.goto('/?page=24');
  await page.getByTestId('next').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('page-info')).toHaveText('Page 25 of 25');
  await expect(page.getByTestId('prev')).toBeFocused();

  for (let i = 0; i < 24; i++) await page.keyboard.press('Enter');
  await expect(page.getByTestId('page-info')).toHaveText('Page 1 of 25');
  await expect(page.getByTestId('next')).toBeFocused();
});

test('shows a partial last page', async ({ page }) => {
  await page.getByTestId('department').selectOption('Engineering');
  const total = expectedRows({ dept: 'Engineering' }).length;
  const pages = Math.ceil(total / 20);
  for (let i = 1; i < pages; i++) await page.getByTestId('next').click();
  await expectStatus(page, `Showing ${(pages - 1) * 20 + 1}–${total} of ${total}`, `Page ${pages} of ${pages}`);
  await expect(page.locator('tbody tr')).toHaveCount(total - (pages - 1) * 20);
});

test('has a single page when few employees match', async ({ page }) => {
  await page.getByTestId('search').fill('van der berg');
  const total = expectedRows({ q: 'van der berg' }).length;
  expect(total).toBeLessThanOrEqual(20);
  await expectStatus(page, `Showing 1–${total} of ${total}`, 'Page 1 of 1');
  await expect(page.getByTestId('prev')).toBeDisabled();
  await expect(page.getByTestId('next')).toBeDisabled();
});

test.describe('goes back to page 1 when', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByTestId('next').click();
    await page.getByTestId('next').click();
    await expect(page.getByTestId('page-info')).toHaveText('Page 3 of 25');
  });

  test('the search changes', async ({ page }) => {
    await page.getByTestId('search').fill('a');
    await expect(page.getByTestId('page-info')).toHaveText(/^Page 1 of /);
    await expectRows(page, expectedIds({ q: 'a' }));
  });

  test('the department changes', async ({ page }) => {
    await page.getByTestId('department').selectOption('Sales');
    await expect(page.getByTestId('page-info')).toHaveText(/^Page 1 of /);
    await expectRows(page, expectedIds({ dept: 'Sales' }));
  });

  test('the sort changes', async ({ page }) => {
    await sortButton(page, 'location').click();
    await expect(page.getByTestId('page-info')).toHaveText('Page 1 of 25');
    await expectRows(page, expectedIds({ sort: 'location', dir: 'asc' }));

    await page.getByTestId('next').click();
    await sortButton(page, 'location').click();
    await expect(page.getByTestId('page-info')).toHaveText('Page 1 of 25');

    await page.getByTestId('next').click();
    await sortButton(page, 'location').click();
    await expect(page.getByTestId('page-info')).toHaveText('Page 1 of 25');
    await expectRows(page, expectedIds());
  });
});

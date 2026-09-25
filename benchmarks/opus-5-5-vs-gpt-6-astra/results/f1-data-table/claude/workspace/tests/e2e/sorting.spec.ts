import { expect, test } from '@playwright/test';
import { ariaSorts, COLUMNS, expectedIds, expectRows, sortButton, sortedHeaders } from './support';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

for (const [key, label] of COLUMNS) {
  test(`${label}: ascending, descending, then unsorted`, async ({ page }) => {
    await sortButton(page, key).click();
    await expect(page.locator(`th[data-key="${key}"]`)).toHaveAttribute('aria-sort', 'ascending');
    expect(await ariaSorts(page)).toEqual(sortedHeaders(key, 'ascending'));
    await expectRows(page, expectedIds({ sort: key, dir: 'asc' }));

    await sortButton(page, key).click();
    await expect(page.locator(`th[data-key="${key}"]`)).toHaveAttribute('aria-sort', 'descending');
    expect(await ariaSorts(page)).toEqual(sortedHeaders(key, 'descending'));
    await expectRows(page, expectedIds({ sort: key, dir: 'desc' }));

    await sortButton(page, key).click();
    await expect(page.locator(`th[data-key="${key}"]`)).toHaveAttribute('aria-sort', 'none');
    expect(await ariaSorts(page)).toEqual(sortedHeaders());
    await expectRows(page, expectedIds());
  });
}

test('sorts the whole result, not just the page', async ({ page }) => {
  await sortButton(page, 'salary').click();
  await sortButton(page, 'salary').click();
  for (let pageNumber = 1; pageNumber <= 25; pageNumber++) {
    if (pageNumber > 1) await page.getByTestId('next').click();
    await expectRows(page, expectedIds({ sort: 'salary', dir: 'desc' }, pageNumber));
  }
});

test('breaks ties by ascending id in both directions', async ({ page }) => {
  // Departments are full of ties: within one, rows stay in id order either way.
  await sortButton(page, 'department').click();
  await expectRows(page, expectedIds({ sort: 'department', dir: 'asc' }));
  await sortButton(page, 'department').click();
  const ids = expectedIds({ sort: 'department', dir: 'desc' });
  expect(ids).toEqual([...ids].sort((a, b) => a - b)); // one department, so ascending ids
  await expectRows(page, ids);
});

test('clicking another column starts it at ascending and unsorts the first', async ({ page }) => {
  await sortButton(page, 'name').click();
  await sortButton(page, 'name').click();
  await sortButton(page, 'startDate').click();
  expect(await ariaSorts(page)).toEqual(sortedHeaders('startDate', 'ascending'));
  await expectRows(page, expectedIds({ sort: 'startDate', dir: 'asc' }));
});

test('sorts within the search and department filters', async ({ page }) => {
  await page.getByTestId('search').fill('an');
  await page.getByTestId('department').selectOption('Sales');
  await sortButton(page, 'name').click();
  await expectRows(page, expectedIds({ q: 'an', dept: 'Sales', sort: 'name', dir: 'asc' }));
});

test('can be sorted with the keyboard', async ({ page }) => {
  await sortButton(page, 'role').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('th[data-key="role"]')).toHaveAttribute('aria-sort', 'ascending');
  await page.keyboard.press('Space');
  await expect(page.locator('th[data-key="role"]')).toHaveAttribute('aria-sort', 'descending');
});

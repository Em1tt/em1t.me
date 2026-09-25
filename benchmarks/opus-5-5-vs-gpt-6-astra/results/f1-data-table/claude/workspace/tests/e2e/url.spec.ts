import { expect, test } from '@playwright/test';
import {
  ariaSorts,
  expectedIds,
  expectedRows,
  expectParams,
  expectRows,
  expectStatus,
  sortButton,
  sortedHeaders,
} from './support';

test.describe('writing the URL', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('records each change in the query string, leaving out defaults', async ({ page }) => {
    await page.getByTestId('search').fill('an');
    await expect(page).toHaveURL(/\/\?q=an$/);

    await page.getByTestId('department').selectOption('Sales');
    await expect(page).toHaveURL(/\/\?q=an&dept=Sales$/);

    await sortButton(page, 'salary').click();
    await expect(page).toHaveURL(/\/\?q=an&dept=Sales&sort=salary&dir=asc$/);

    await sortButton(page, 'salary').click();
    await page.getByTestId('next').click();
    await expectParams(page, { q: 'an', dept: 'Sales', sort: 'salary', dir: 'desc', page: '2' });

    await page.getByTestId('prev').click();
    await expectParams(page, { q: 'an', dept: 'Sales', sort: 'salary', dir: 'desc' });

    await sortButton(page, 'salary').click();
    await page.getByTestId('department').selectOption('');
    await page.getByTestId('search').fill('');
    await expect(page).toHaveURL(/\/$/);
    expect(new URL(page.url()).search).toBe('');
  });

  test('keeps the search as typed', async ({ page }) => {
    await page.getByTestId('search').fill('  São Paulo ');
    await expectParams(page, { q: '  São Paulo ' });
  });

  test('neither reloads the page nor adds history entries', async ({ page }) => {
    const historyLength = await page.evaluate(() => history.length);
    await page.evaluate(() => Object.assign(window, { marker: 'still here' }));

    await page.getByTestId('search').pressSequentially('an');
    await page.getByTestId('department').selectOption('Sales');
    await sortButton(page, 'name').click();
    await page.getByTestId('next').click();

    await expectParams(page, { q: 'an', dept: 'Sales', sort: 'name', dir: 'asc', page: '2' });
    expect(await page.evaluate(() => history.length)).toBe(historyLength);
    expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe('still here');
  });

  test('catches up when the browser throttles history updates', async ({ page }) => {
    test.slow();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // WebKit allows 100 history updates per 10 seconds; flip through pages well past that.
    for (let i = 0; i < 60; i++) {
      await page.getByTestId('next').click();
      await page.getByTestId('prev').click();
    }
    await page.getByTestId('search').fill('an');
    await expect(page.getByTestId('count')).toHaveText(/ of 215$/);
    await expect.poll(() => page.evaluate(() => location.search), { timeout: 15_000 }).toBe('?q=an');
    expect(errors).toEqual([]);
  });
});

test.describe('reading the URL', () => {
  test('restores the search, department, sort and page', async ({ page }) => {
    await page.goto('/?q=an&dept=Engineering&sort=salary&dir=desc&page=2');
    const options = { q: 'an', dept: 'Engineering', sort: 'salary', dir: 'desc' } as const;
    const total = expectedRows(options).length;

    await expect(page.getByTestId('search')).toHaveValue('an');
    await expect(page.getByTestId('department')).toHaveValue('Engineering');
    expect(await ariaSorts(page)).toEqual(sortedHeaders('salary', 'descending'));
    await expectStatus(page, `Showing 21–${Math.min(40, total)} of ${total}`, `Page 2 of ${Math.ceil(total / 20)}`);
    await expectRows(page, expectedIds(options, 2));
    await expectParams(page, { q: 'an', dept: 'Engineering', sort: 'salary', dir: 'desc', page: '2' });
  });

  test('restores a search with spaces and accents', async ({ page }) => {
    await page.goto('/?q=+S%C3%A3o+Paulo+');
    await expect(page.getByTestId('search')).toHaveValue(' São Paulo ');
    await expectRows(page, expectedIds({ q: 'São Paulo' }));
  });

  test('survives a reload', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('search').fill('an');
    await page.getByTestId('department').selectOption('Sales');
    await sortButton(page, 'startDate').click();
    await sortButton(page, 'startDate').click();
    await page.getByTestId('next').click();
    const params = { q: 'an', dept: 'Sales', sort: 'startDate', dir: 'desc', page: '2' };
    await expectParams(page, params);

    await page.reload();
    await expectParams(page, params);
    await expect(page.getByTestId('search')).toHaveValue('an');
    await expect(page.getByTestId('department')).toHaveValue('Sales');
    expect(await ariaSorts(page)).toEqual(sortedHeaders('startDate', 'descending'));
    await expect(page.getByTestId('page-info')).toHaveText(/^Page 2 of /);
    await expectRows(page, expectedIds({ q: 'an', dept: 'Sales', sort: 'startDate', dir: 'desc' }, 2));
  });

  test('ignores invalid values', async ({ page }) => {
    await page.goto('/?dept=Nowhere&sort=height&dir=sideways&page=abc');
    await expect(page.getByTestId('search')).toHaveValue('');
    await expect(page.getByTestId('department')).toHaveValue('');
    expect(await ariaSorts(page)).toEqual(sortedHeaders());
    await expectStatus(page, 'Showing 1–20 of 500', 'Page 1 of 25');
    await expectRows(page, expectedIds());
    expect(new URL(page.url()).search).toBe('');
  });

  for (const invalidPage of ['0', '-3', '2.5', 'two']) {
    test(`treats page=${invalidPage} as page 1`, async ({ page }) => {
      await page.goto(`/?sort=email&dir=asc&page=${invalidPage}`);
      await expect(page.getByTestId('page-info')).toHaveText('Page 1 of 25');
      await expectRows(page, expectedIds({ sort: 'email', dir: 'asc' }));
    });
  }

  test('shows the last page for a page number past the end', async ({ page }) => {
    await page.goto('/?page=999');
    await expectStatus(page, 'Showing 481–500 of 500', 'Page 25 of 25');
    await expectRows(page, expectedIds({}, 25));
    await expect(page.getByTestId('next')).toBeDisabled();
    await expectParams(page, { page: '25' });
  });

  test('clamps the page after filtering', async ({ page }) => {
    await page.goto('/?dept=Design&page=50');
    const total = expectedRows({ dept: 'Design' }).length;
    const pages = Math.ceil(total / 20);
    await expectStatus(page, `Showing ${(pages - 1) * 20 + 1}–${total} of ${total}`, `Page ${pages} of ${pages}`);
    await expectParams(page, { dept: 'Design', page: String(pages) });
  });

  test('shows page 1 of 1 for a page past the end of an empty result', async ({ page }) => {
    await page.goto('/?q=nobody+at+all&page=3');
    await expect(page.getByTestId('empty')).toBeVisible();
    await expectStatus(page, 'Showing 0 of 0', 'Page 1 of 1');
    await expectParams(page, { q: 'nobody at all' });
  });
});

import { expect, test } from '@playwright/test';
import { cellTexts, COLUMNS, employees, expectRows, sortedHeaders, ariaSorts } from './support';

test('loads without errors and with no query string', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.locator('tbody tr')).toHaveCount(20);
  expect(new URL(page.url()).search).toBe('');
  expect(errors).toEqual([]);
});

test('has a captioned table with a sort button in each column header', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('table > caption')).toHaveText(/\S/);

  const headers = page.locator('table > thead > tr > th');
  await expect(headers).toHaveCount(COLUMNS.length);
  const headerInfo = await headers.evaluateAll((cells) =>
    cells.map((cell) => ({
      key: cell.getAttribute('data-key'),
      text: cell.textContent,
      buttons: cell.querySelectorAll('button').length,
    })),
  );
  expect(headerInfo).toEqual(COLUMNS.map(([key, text]) => ({ key, text, buttons: 1 })));

  for (const [key, label] of COLUMNS) {
    await expect(page.locator(`th[data-key="${key}"]`).getByRole('button', { name: label, exact: true })).toBeVisible();
  }
  expect(await ariaSorts(page)).toEqual(sortedHeaders());
});

test('shows one row per employee, in id order, with a cell per column', async ({ page }) => {
  await page.goto('/');
  await expectRows(page, employees.slice(0, 20).map((e) => e.id));

  const rows = await page.locator('table > tbody > tr').evaluateAll((trs) =>
    trs.map((tr) => ({
      id: tr.getAttribute('data-id'),
      cells: [...tr.children].map((cell) => [cell.tagName, cell.textContent]),
    })),
  );
  expect(rows).toEqual(
    employees.slice(0, 20).map((e) => ({ id: String(e.id), cells: cellTexts(e).map((text) => ['TD', text]) })),
  );
});

test.describe('in a time zone behind UTC with a German browser', () => {
  test.use({ timezoneId: 'America/Los_Angeles', locale: 'de-DE' });

  test('formats salaries and start dates for every employee', async ({ page }) => {
    await page.goto('/');
    expect(await page.evaluate(() => new Date('2021-03-04').getDate())).toBe(3); // local time really is behind UTC

    for (let pageNumber = 1; pageNumber <= 25; pageNumber++) {
      if (pageNumber > 1) await page.getByTestId('next').click();
      await expect(page.getByTestId('page-info')).toHaveText(`Page ${pageNumber} of 25`);
      const cells = await page
        .locator('tbody tr')
        .evaluateAll((trs) => trs.map((tr) => [...tr.children].map((cell) => cell.textContent)));
      expect(cells).toEqual(employees.slice((pageNumber - 1) * 20, pageNumber * 20).map(cellTexts));
    }
  });
});

test('shows sample values in the documented formats', async ({ page }) => {
  await page.goto('/');
  const firstRow = page.locator('tbody tr[data-id="1"] td');
  await expect(firstRow.nth(4)).toHaveText('$62,000');
  await expect(firstRow.nth(5)).toHaveText('Aug 23, 2025');
});

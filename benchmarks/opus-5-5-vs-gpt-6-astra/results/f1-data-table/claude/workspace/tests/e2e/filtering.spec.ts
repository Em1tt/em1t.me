import { expect, test } from '@playwright/test';
import { DEPARTMENTS, expectedIds, expectedRows, expectRows, expectStatus } from './support';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('search', () => {
  test('is a labelled text input', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Search', exact: true })).toHaveAttribute('data-testid', 'search');
    await expect(page.getByTestId('search')).toBeEditable();
  });

  test('clears with Escape', async ({ page }) => {
    await page.getByTestId('search').fill('anna');
    await page.getByTestId('search').press('Escape');
    await expect(page.getByTestId('search')).toHaveValue('');
    await expect(page.getByTestId('count')).toHaveText('Showing 1–20 of 500');
  });

  test('keeps employees whose name, email, department, role or location contains the query', async ({ page }) => {
    for (const q of ['anna', 'obrien@', 'marketing', 'engineer', 'toronto', 'o']) {
      await page.getByTestId('search').fill(q);
      const total = expectedRows({ q }).length;
      await expectStatus(page, `Showing 1–${Math.min(20, total)} of ${total}`, `Page 1 of ${Math.ceil(total / 20)}`);
      await expectRows(page, expectedIds({ q }));
    }
  });

  test('ignores case and surrounding spaces', async ({ page }) => {
    const ids = expectedIds({ q: 'anna' });
    await page.getByTestId('search').fill('ANNA');
    await expectRows(page, ids);
    await page.getByTestId('search').fill('   aNNa  ');
    await expectRows(page, ids);
  });

  test('works while typing', async ({ page }) => {
    await page.getByTestId('search').pressSequentially('van der');
    await expectRows(page, expectedIds({ q: 'van der' }));
  });

  test('does not fold accents', async ({ page }) => {
    await page.getByTestId('search').fill('zurich');
    await expect(page.locator('tbody tr')).toHaveCount(0);

    await page.getByTestId('search').fill('Zür');
    const total = expectedRows({ q: 'Zür' }).length;
    expect(total).toBeGreaterThan(0);
    await expect(page.getByTestId('count')).toHaveText(`Showing 1–20 of ${total}`);
  });

  test('does not search salaries or dates', async ({ page }) => {
    await page.getByTestId('search').fill('62000');
    await expect(page.locator('tbody tr')).toHaveCount(0);
    await page.getByTestId('search').fill('Aug 23');
    await expect(page.locator('tbody tr')).toHaveCount(0);
  });

  test('keeps everyone when cleared', async ({ page }) => {
    await page.getByTestId('search').fill('anna');
    await page.getByTestId('search').fill('');
    await expectStatus(page, 'Showing 1–20 of 500', 'Page 1 of 25');
    await expectRows(page, expectedIds());
  });
});

test.describe('department filter', () => {
  test('lists all departments alphabetically after "All departments"', async ({ page }) => {
    const select = page.getByTestId('department');
    await expect(page.getByLabel('Department', { exact: true })).toHaveAttribute('data-testid', 'department');
    await expect(select).toHaveValue('');

    const options = await select
      .locator('option')
      .evaluateAll((opts) => opts.map((o) => [(o as HTMLOptionElement).value, o.textContent]));
    expect(options).toEqual([['', 'All departments'], ...DEPARTMENTS.map((d) => [d, d])]);
  });

  test('keeps only the chosen department', async ({ page }) => {
    for (const dept of DEPARTMENTS) {
      await page.getByTestId('department').selectOption(dept);
      const total = expectedRows({ dept }).length;
      await expect(page.getByTestId('count')).toHaveText(`Showing 1–20 of ${total}`);
      await expectRows(page, expectedIds({ dept }));
    }
    await page.getByTestId('department').selectOption('');
    await expect(page.getByTestId('count')).toHaveText('Showing 1–20 of 500');
  });

  test('combines with the search', async ({ page }) => {
    await page.getByTestId('search').fill('an');
    await page.getByTestId('department').selectOption('Engineering');
    const total = expectedRows({ q: 'an', dept: 'Engineering' }).length;
    expect(total).toBeLessThan(expectedRows({ q: 'an' }).length);
    await expect(page.getByTestId('count')).toHaveText(`Showing 1–${Math.min(20, total)} of ${total}`);
    await expectRows(page, expectedIds({ q: 'an', dept: 'Engineering' }));
  });
});

test.describe('empty state', () => {
  test('is hidden while there are results', async ({ page }) => {
    await expect(page.getByTestId('empty')).toBeHidden();
    await page.getByTestId('search').fill('no such person');
    await expect(page.getByTestId('empty')).toBeVisible();
    await page.getByTestId('search').fill('anna');
    await expect(page.getByTestId('empty')).toBeHidden();
  });

  test('shows when nothing matches, with an empty table body', async ({ page }) => {
    await page.getByTestId('search').fill('no such person');
    await expect(page.getByTestId('empty')).toBeVisible();
    await expect(page.getByTestId('empty')).toHaveText('No employees match your filters.');
    await expect(page.locator('tbody tr')).toHaveCount(0);
    await expectStatus(page, 'Showing 0 of 0', 'Page 1 of 1');
    await expect(page.getByTestId('prev')).toBeDisabled();
    await expect(page.getByTestId('next')).toBeDisabled();

    await page.getByTestId('search').fill('');
    await expect(page.getByTestId('empty')).toBeHidden();
    await expect(page.locator('tbody tr')).toHaveCount(20);
  });

  test('shows when the search and department exclude each other', async ({ page }) => {
    await page.getByTestId('search').fill('recruiter');
    await page.getByTestId('department').selectOption('Engineering');
    await expect(page.getByTestId('empty')).toBeVisible();
    await expect(page.getByTestId('count')).toHaveText('Showing 0 of 0');
  });

  test('offers to clear the filters', async ({ page }) => {
    await page.getByTestId('search').fill('recruiter');
    await page.getByTestId('department').selectOption('Engineering');
    await page.getByRole('button', { name: 'Clear filters' }).click();

    await expect(page.getByTestId('search')).toHaveValue('');
    await expect(page.getByTestId('search')).toBeFocused();
    await expect(page.getByTestId('department')).toHaveValue('');
    await expect(page.getByTestId('empty')).toBeHidden();
    await expect(page.getByTestId('count')).toHaveText('Showing 1–20 of 500');
    expect(new URL(page.url()).search).toBe('');
  });
});

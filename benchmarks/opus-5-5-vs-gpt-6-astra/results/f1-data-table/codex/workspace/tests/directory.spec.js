import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const employees = JSON.parse(readFileSync(new URL('../data/employees.json', import.meta.url), 'utf8'));
const columns = [
  ['name', 'Name'], ['email', 'Email'], ['department', 'Department'],
  ['role', 'Role'], ['salary', 'Salary'], ['startDate', 'Start date'], ['location', 'Location'],
];
const searchable = ['name', 'email', 'department', 'role', 'location'];
const departments = [...new Set(employees.map(employee => employee.department))].sort();

function matching({ q = '', dept = '', sort = '', dir = 'asc' } = {}) {
  const query = q.trim().toLowerCase();
  return employees.filter(employee =>
    (!dept || employee.department === dept) &&
    (!query || searchable.some(key => employee[key].toLowerCase().includes(query))),
  ).sort((a, b) => {
    if (!sort) return a.id - b.id;
    const comparison = sort === 'salary' ? a.salary - b.salary
      : sort === 'startDate' ? new Date(a.startDate) - new Date(b.startDate)
        : a[sort].localeCompare(b[sort], 'en');
    return (dir === 'desc' ? -comparison : comparison) || a.id - b.id;
  });
}

async function expectRows(page, rows, pageNumber = 1) {
  const expected = rows.slice((pageNumber - 1) * 20, pageNumber * 20).map(row => String(row.id));
  await expect.poll(() => page.locator('tbody tr').evaluateAll(
    elements => elements.map(element => element.getAttribute('data-id')),
  )).toEqual(expected);
}

async function expectPagination(page, total, pageNumber = 1) {
  const pages = Math.max(1, Math.ceil(total / 20));
  await expect(page.getByTestId('page-info')).toHaveText(`Page ${pageNumber} of ${pages}`);
  await expect(page.getByTestId('count')).toHaveText(total
    ? `Showing ${(pageNumber - 1) * 20 + 1}\u2013${Math.min(pageNumber * 20, total)} of ${total}`
    : 'Showing 0 of 0');
  if (pageNumber === 1) await expect(page.getByTestId('prev')).toBeDisabled();
  else await expect(page.getByTestId('prev')).toBeEnabled();
  if (pageNumber === pages) await expect(page.getByTestId('next')).toBeDisabled();
  else await expect(page.getByTestId('next')).toBeEnabled();
}

test('default table has the required semantics, options, data and formatting', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('table')).toHaveCount(1);
  await expect(page.locator('table caption')).not.toHaveText('');
  await expect(page.getByTestId('search')).toHaveAccessibleName(/\S/);
  await expect(page.getByTestId('search')).toHaveValue('');
  await expect(page.getByTestId('department')).toHaveValue('');
  const options = await page.getByTestId('department').locator('option').evaluateAll(elements =>
    elements.map(element => ({ value: element.value, text: element.textContent })),
  );
  expect(options).toEqual([{ value: '', text: 'All departments' }, ...departments.map(value => ({ value, text: value }))]);
  await expect(page.locator('thead th')).toHaveCount(7);
  for (let index = 0; index < columns.length; index++) {
    const [key, title] = columns[index];
    const header = page.locator('thead th').nth(index);
    await expect(header).toHaveAttribute('data-key', key);
    await expect(header).toHaveAttribute('aria-sort', 'none');
    await expect(header.getByRole('button')).toContainText(title);
  }
  await expectRows(page, matching());
  await expectPagination(page, 500);
  await expect(page.getByTestId('empty')).not.toBeVisible();
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  for (const employee of matching().slice(0, 20)) {
    const cells = page.locator(`tbody tr[data-id="${employee.id}"] td`);
    await expect(cells).toHaveCount(7);
    await expect(cells).toHaveText([
      employee.name, employee.email, employee.department, employee.role,
      formatter.format(employee.salary),
      new Date(employee.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
      employee.location,
    ]);
  }
  expect(new URL(page.url()).search).toBe('');
});

for (const [key] of columns) {
  test(`${key} supports ascending, descending and unsorted order`, async ({ page }) => {
    await page.goto('/?page=2');
    const header = page.locator(`th[data-key="${key}"]`);
    for (const [dir, aria] of [['asc', 'ascending'], ['desc', 'descending'], ['', 'none']]) {
      await header.getByRole('button').click();
      await expectRows(page, matching({ sort: dir ? key : '', dir }));
      await expectPagination(page, 500);
      await expect(header).toHaveAttribute('aria-sort', aria);
      for (const [other] of columns.filter(([other]) => other !== key)) {
        await expect(page.locator(`th[data-key="${other}"]`)).toHaveAttribute('aria-sort', 'none');
      }
      const url = new URL(page.url());
      expect(url.searchParams.get('sort')).toBe(dir ? key : null);
      expect(url.searchParams.get('dir')).toBe(dir || null);
      expect(url.searchParams.has('page')).toBe(false);
    }
    expect(new URL(page.url()).search).toBe('');
  });
}

test('descending ties remain in ascending employee ID order', async ({ page }) => {
  for (const [key] of columns) {
    const ordered = matching({ sort: key, dir: 'desc' });
    const tieIndex = ordered.findIndex((employee, index) => index > 0 && employee[key] === ordered[index - 1][key]);
    if (tieIndex < 0) continue;
    const pageNumber = Math.floor(tieIndex / 20) + 1;
    await page.goto(`/?sort=${key}&dir=desc&page=${pageNumber}`);
    await expectRows(page, ordered, pageNumber);
  }
});

test('changing the sorted column starts ascending and resets the page', async ({ page }) => {
  await page.goto('/?sort=salary&dir=desc&page=4');
  await page.locator('th[data-key="name"] button').click();
  await expectRows(page, matching({ sort: 'name' }));
  await expectPagination(page, 500);
  await expect(page.locator('th[data-key="name"]')).toHaveAttribute('aria-sort', 'ascending');
  await expect(page.locator('th[data-key="salary"]')).toHaveAttribute('aria-sort', 'none');
});

test('search matches each supported field, ignores surrounding spaces and preserves accents', async ({ page }) => {
  await page.goto('/');
  const search = page.getByTestId('search');
  for (const q of ['  sOFIa  ', 'HADDAD@EXAMPLE.COM', 'finance', 'UX RESEARCHER', 'Zürich', 'Zurich', '   ']) {
    await search.fill(q);
    const expected = matching({ q });
    await expectRows(page, expected);
    await expectPagination(page, expected.length);
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(q);
  }
  await search.fill('');
  await expectRows(page, employees);
  await expect.poll(() => new URL(page.url()).search).toBe('');
});

test('search and department combine and reset pagination', async ({ page }) => {
  await page.goto('/?page=3');
  await page.getByTestId('department').selectOption('Engineering');
  const engineering = matching({ dept: 'Engineering' });
  await expectRows(page, engineering);
  await expectPagination(page, engineering.length);
  await page.getByTestId('next').click();
  await expectPagination(page, engineering.length, 2);
  await page.getByTestId('search').fill('  MANAGER  ');
  const filtered = matching({ dept: 'Engineering', q: 'manager' });
  await expectRows(page, filtered);
  await expectPagination(page, filtered.length);
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('  MANAGER  ');
  expect(new URL(page.url()).searchParams.get('dept')).toBe('Engineering');
  expect(new URL(page.url()).searchParams.has('page')).toBe(false);
  await page.getByTestId('department').selectOption('');
  await expectRows(page, matching({ q: 'manager' }));
  expect(new URL(page.url()).searchParams.has('dept')).toBe(false);
});

test('pagination traverses all employees without skips or duplicate rows', async ({ page }) => {
  await page.goto('/');
  const seen = [];
  for (let pageNumber = 1; pageNumber <= 25; pageNumber++) {
    await expectRows(page, matching(), pageNumber);
    await expectPagination(page, 500, pageNumber);
    seen.push(...await page.locator('tbody tr').evaluateAll(elements => elements.map(element => Number(element.dataset.id))));
    if (pageNumber < 25) await page.getByTestId('next').click();
  }
  expect(seen).toEqual(matching().map(employee => employee.id));
  expect(new URL(page.url()).searchParams.get('page')).toBe('25');
  await page.getByTestId('prev').click();
  await expectRows(page, matching(), 24);
  await expectPagination(page, 500, 24);
});

test('empty state has no body rows and returns to normal after clearing filters', async ({ page }) => {
  await page.goto('/?page=4');
  await page.getByTestId('search').fill('this employee does not exist 928734');
  await expect(page.locator('tbody tr')).toHaveCount(0);
  await expect(page.getByTestId('empty')).toBeVisible();
  await expect(page.getByTestId('empty')).toHaveText('No employees match your filters.');
  await expectPagination(page, 0);
  await page.getByTestId('search').fill('');
  await expectRows(page, matching());
  await expect(page.getByTestId('empty')).not.toBeVisible();
  await expectPagination(page, 500);
});

test('bookmarked state restores all controls, order and page', async ({ page }) => {
  const state = { q: '  engineer  ', dept: 'Engineering', sort: 'salary', dir: 'desc', page: '2' };
  await page.goto(`/?${new URLSearchParams(state)}`);
  await expect(page.getByTestId('search')).toHaveValue(state.q);
  await expect(page.getByTestId('department')).toHaveValue(state.dept);
  await expect(page.locator('th[data-key="salary"]')).toHaveAttribute('aria-sort', 'descending');
  const filtered = matching(state);
  await expectRows(page, filtered, 2);
  await expectPagination(page, filtered.length, 2);
  await page.reload();
  await expectRows(page, filtered, 2);
  await expect(page.getByTestId('search')).toHaveValue(state.q);
});

test('invalid URL values are ignored and pages past the end are clamped', async ({ page }) => {
  for (const query of ['dept=NotARealDepartment&sort=unknown&dir=up&page=-2', 'sort=name&dir=sideways&page=abc', 'page=2.5']) {
    await page.goto(`/?${query}`);
    await expectRows(page, matching());
    await expectPagination(page, 500);
    await expect(page.getByTestId('department')).toHaveValue('');
    for (const [key] of columns) await expect(page.locator(`th[data-key="${key}"]`)).toHaveAttribute('aria-sort', 'none');
  }
  await page.goto('/?dept=Support&page=9999');
  const filtered = matching({ dept: 'Support' });
  const lastPage = Math.ceil(filtered.length / 20);
  await expectRows(page, filtered, lastPage);
  await expectPagination(page, filtered.length, lastPage);
  for (const pageNumber of ['9007199254740992', '9'.repeat(400)]) {
    await page.goto(`/?page=${pageNumber}`);
    await expectRows(page, matching(), 25);
    await expectPagination(page, 500, 25);
    expect(new URL(page.url()).searchParams.get('page')).toBe('25');
  }
  await page.goto('/?q=doesnotexist_92345&page=99');
  await expectPagination(page, 0);
  await expect(page.getByTestId('empty')).toBeVisible();
});

test('state updates replace browser history and do not reload the document', async ({ page }) => {
  await page.goto('/');
  const historyLength = await page.evaluate(() => {
    window.__directoryTestMarker = 'same document';
    return history.length;
  });
  await page.getByTestId('next').click();
  await expectPagination(page, 500, 2);
  await page.getByTestId('department').selectOption('Finance');
  await page.getByTestId('search').fill('analyst');
  await page.locator('th[data-key="salary"] button').click();
  await expectRows(page, matching({ dept: 'Finance', q: 'analyst', sort: 'salary' }));
  expect(await page.evaluate(() => window.__directoryTestMarker)).toBe('same document');
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  const url = new URL(page.url());
  expect(Object.fromEntries(url.searchParams)).toEqual({ dept: 'Finance', q: 'analyst', sort: 'salary', dir: 'asc' });
});

test('390px viewport keeps horizontal overflow inside the table container', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expectRows(page, matching());
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByTestId('search')).toBeVisible();
  await expect(page.getByTestId('department')).toBeVisible();
  await page.getByTestId('search').fill('são paulo');
  await expectRows(page, matching({ q: 'são paulo' }));
});

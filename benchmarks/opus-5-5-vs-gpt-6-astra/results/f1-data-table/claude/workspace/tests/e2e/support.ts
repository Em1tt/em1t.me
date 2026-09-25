import { readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';

// An independent reference implementation of the behaviour in TASK.md, used to work out
// which rows the app should show. It deliberately shares no code with src/.

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
  salary: number;
  startDate: string;
  location: string;
}

export type ColumnKey = 'name' | 'email' | 'department' | 'role' | 'salary' | 'startDate' | 'location';

export const employees: Employee[] = JSON.parse(
  readFileSync(new URL('../../data/employees.json', import.meta.url), 'utf8'),
);

export const COLUMNS: [ColumnKey, string][] = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['department', 'Department'],
  ['role', 'Role'],
  ['salary', 'Salary'],
  ['startDate', 'Start date'],
  ['location', 'Location'],
];

export const DEPARTMENTS = [...new Set(employees.map((e) => e.department))].sort();

export interface ViewOptions {
  q?: string;
  dept?: string;
  sort?: ColumnKey;
  dir?: 'asc' | 'desc';
}

export function expectedRows({ q = '', dept = '', sort, dir = 'asc' }: ViewOptions = {}): Employee[] {
  const query = q.trim().toLowerCase();
  const matches = employees.filter(
    (e) =>
      (dept === '' || e.department === dept) &&
      [e.name, e.email, e.department, e.role, e.location].some((field) => field.toLowerCase().includes(query)),
  );
  return matches.sort((a, b) => {
    let order = 0;
    if (sort === 'salary') order = a.salary - b.salary;
    else if (sort === 'startDate') order = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    else if (sort) order = a[sort].localeCompare(b[sort], 'en');
    if (dir === 'desc') order = -order;
    return order || a.id - b.id;
  });
}

/** Ids of the rows on one page (20 a page) of the expected result. */
export function expectedIds(options: ViewOptions = {}, page = 1): number[] {
  return expectedRows(options)
    .slice((page - 1) * 20, page * 20)
    .map((e) => e.id);
}

export function formatSalary(salary: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    salary,
  );
}

export function formatStartDate(startDate: string): string {
  return new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function cellTexts(e: Employee): string[] {
  return [e.name, e.email, e.department, e.role, formatSalary(e.salary), formatStartDate(e.startDate), e.location];
}

// Page helpers.

export async function rowIds(page: Page): Promise<number[]> {
  return page.locator('tbody tr').evaluateAll((rows) => rows.map((row) => Number(row.getAttribute('data-id'))));
}

export async function expectRows(page: Page, ids: number[]): Promise<void> {
  await expect.poll(() => rowIds(page)).toEqual(ids);
}

export async function ariaSorts(page: Page): Promise<Record<string, string | null>> {
  return page
    .locator('thead th')
    .evaluateAll((cells) => Object.fromEntries(cells.map((c) => [c.dataset.key, c.getAttribute('aria-sort')])));
}

/** aria-sort of every header when `key` (or nothing) is sorted. */
export function sortedHeaders(key?: ColumnKey, value?: 'ascending' | 'descending'): Record<string, string> {
  return Object.fromEntries(COLUMNS.map(([k]) => [k, k === key && value ? value : 'none']));
}

export function sortButton(page: Page, key: ColumnKey) {
  return page.locator(`th[data-key="${key}"] button`);
}

function searchParams(page: Page): Record<string, string> {
  return Object.fromEntries(new URL(page.url()).searchParams);
}

/** page.url() catches up with history.replaceState asynchronously, so poll it. */
export async function expectParams(page: Page, expected: Record<string, string>): Promise<void> {
  await expect.poll(() => searchParams(page)).toEqual(expected);
}

export async function expectStatus(page: Page, count: string, pageInfo: string): Promise<void> {
  await expect(page.getByTestId('count')).toHaveText(count);
  await expect(page.getByTestId('page-info')).toHaveText(pageInfo);
}

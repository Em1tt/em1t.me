import { describe, expect, it } from 'vitest';
import data from '../../data/employees.json';
import type { Employee } from '../../src/employee';
import {
  computePage,
  DEFAULT_VIEW_STATE,
  describePage,
  describeRange,
  filterEmployees,
  nextSort,
  paginate,
  PAGE_SIZE,
  sortEmployees,
} from '../../src/view';
import { employee, ids } from './fixtures';

const employees: readonly Employee[] = data;

describe('filterEmployees', () => {
  const people = [
    employee({ id: 1, name: 'Sofia Haddad', department: 'Support', role: 'Support Lead', location: 'São Paulo' }),
    employee({ id: 2, name: 'anna Andersen', email: 'anna.andersen@example.com', department: 'Finance' }),
    employee({ id: 3, name: 'Nadia Müller', location: 'Zürich', salary: 62000, startDate: '2021-03-04' }),
    employee({ id: 4, name: 'Ben Okafor', department: 'Sales', role: 'Account Executive', location: 'Nairobi' }),
  ];

  it('keeps everyone for an empty or blank query', () => {
    expect(ids(filterEmployees(people, '', ''))).toEqual([1, 2, 3, 4]);
    expect(ids(filterEmployees(people, '   ', ''))).toEqual([1, 2, 3, 4]);
  });

  it('searches name, email, department, role and location', () => {
    expect(ids(filterEmployees(people, 'haddad', ''))).toEqual([1]);
    expect(ids(filterEmployees(people, 'anna.andersen@', ''))).toEqual([2]);
    expect(ids(filterEmployees(people, 'finance', ''))).toEqual([2]);
    expect(ids(filterEmployees(people, 'account exec', ''))).toEqual([4]);
    expect(ids(filterEmployees(people, 'nairobi', ''))).toEqual([4]);
  });

  it('does not search salary or start date', () => {
    expect(filterEmployees(people, '62000', '')).toEqual([]);
    expect(filterEmployees(people, '2021', '')).toEqual([]);
  });

  it('ignores case and surrounding spaces, but not inner spaces', () => {
    expect(ids(filterEmployees(people, 'ANNA', ''))).toEqual([2]);
    expect(ids(filterEmployees(people, '  Anna Andersen \t', ''))).toEqual([2]);
    expect(filterEmployees(people, 'anna  andersen', '')).toEqual([]);
  });

  it('does not fold accents', () => {
    expect(filterEmployees(people, 'zurich', '')).toEqual([]);
    expect(ids(filterEmployees(people, 'ZÜR', ''))).toEqual([3]);
    expect(ids(filterEmployees(people, 'são', ''))).toEqual([1]);
  });

  it('keeps only the chosen department, combined with the query', () => {
    expect(ids(filterEmployees(people, '', 'Engineering'))).toEqual([3]);
    expect(ids(filterEmployees(people, 'a', 'Sales'))).toEqual([4]);
    expect(filterEmployees(people, 'anna', 'Sales')).toEqual([]);
    expect(filterEmployees(people, '', 'engineering')).toEqual([]);
  });
});

describe('sortEmployees', () => {
  const people = [
    employee({ id: 4, name: 'Ömer Schmidt', salary: 62000, startDate: '2019-05-01' }),
    employee({ id: 2, name: 'anna Andersen', salary: 9000, startDate: '2021-01-15' }),
    employee({ id: 5, name: 'Anna Andersen', salary: 62000, startDate: '2012-02-16' }),
    employee({ id: 1, name: 'Oscar Smith', salary: 150000, startDate: '2021-01-15' }),
    employee({ id: 3, name: 'Ben Mendes', salary: 62000, startDate: '2024-02-29' }),
  ];

  it('orders by id when unsorted', () => {
    expect(ids(sortEmployees(people, null))).toEqual([1, 2, 3, 4, 5]);
  });

  it('orders text with English collation', () => {
    // localeCompare puts "anna" next to "Anna" and "Ömer" before "Oscar".
    expect(ids(sortEmployees(people, { key: 'name', dir: 'asc' }))).toEqual([2, 5, 3, 4, 1]);
    expect(ids(sortEmployees(people, { key: 'name', dir: 'desc' }))).toEqual([1, 4, 3, 5, 2]);
  });

  it('orders salaries numerically, breaking ties by ascending id in both directions', () => {
    expect(ids(sortEmployees(people, { key: 'salary', dir: 'asc' }))).toEqual([2, 3, 4, 5, 1]);
    expect(ids(sortEmployees(people, { key: 'salary', dir: 'desc' }))).toEqual([1, 3, 4, 5, 2]);
  });

  it('orders start dates chronologically, breaking ties by ascending id in both directions', () => {
    expect(ids(sortEmployees(people, { key: 'startDate', dir: 'asc' }))).toEqual([5, 4, 1, 2, 3]);
    expect(ids(sortEmployees(people, { key: 'startDate', dir: 'desc' }))).toEqual([3, 1, 2, 4, 5]);
  });

  it('leaves its input alone', () => {
    const before = ids(people);
    sortEmployees(people, { key: 'name', dir: 'asc' });
    expect(ids(people)).toEqual(before);
  });

  it('keeps tied departments in id order when descending, across the real data', () => {
    const sorted = sortEmployees(employees, { key: 'department', dir: 'desc' });
    for (let i = 1; i < sorted.length; i++) {
      const [previous, current] = [sorted[i - 1]!, sorted[i]!];
      if (previous.department === current.department) expect(previous.id).toBeLessThan(current.id);
      else expect(previous.department.localeCompare(current.department, 'en')).toBeGreaterThan(0);
    }
  });
});

describe('nextSort', () => {
  it('cycles a column through ascending, descending and unsorted', () => {
    const ascending = nextSort(null, 'salary');
    expect(ascending).toEqual({ key: 'salary', dir: 'asc' });
    const descending = nextSort(ascending, 'salary');
    expect(descending).toEqual({ key: 'salary', dir: 'desc' });
    expect(nextSort(descending, 'salary')).toBeNull();
  });

  it('starts another column at ascending', () => {
    expect(nextSort({ key: 'salary', dir: 'desc' }, 'name')).toEqual({ key: 'name', dir: 'asc' });
    expect(nextSort({ key: 'salary', dir: 'asc' }, 'name')).toEqual({ key: 'name', dir: 'asc' });
  });
});

describe('paginate', () => {
  const numbers = Array.from({ length: 45 }, (_, index) => index + 1);

  it(`shows ${PAGE_SIZE} rows a page`, () => {
    const page = paginate(numbers, 2);
    expect(page).toMatchObject({ page: 2, pageCount: 3, total: 45, offset: 20 });
    expect(page.rows).toEqual(numbers.slice(20, 40));
  });

  it('shows the remainder on the last page', () => {
    expect(paginate(numbers, 3).rows).toEqual([41, 42, 43, 44, 45]);
  });

  it('clamps the page to the pages that exist', () => {
    expect(paginate(numbers, 99).page).toBe(3);
    expect(paginate(numbers, 0).page).toBe(1);
    expect(paginate(numbers, -4).page).toBe(1);
  });

  it('has one empty page when there is nothing to show', () => {
    expect(paginate([], 3)).toEqual({ rows: [], page: 1, pageCount: 1, total: 0, offset: 0 });
  });
});

describe('describeRange and describePage', () => {
  it('describe a full page', () => {
    const page = paginate(employees, 2);
    expect(describeRange(page)).toBe('Showing 21–40 of 500');
    expect(describePage(page)).toBe('Page 2 of 25');
  });

  it('describe a partial last page', () => {
    const page = paginate(Array.from({ length: 45 }), 3);
    expect(describeRange(page)).toBe('Showing 41–45 of 45');
    expect(describePage(page)).toBe('Page 3 of 3');
  });

  it('describe an empty result', () => {
    const page = paginate([], 1);
    expect(describeRange(page)).toBe('Showing 0 of 0');
    expect(describePage(page)).toBe('Page 1 of 1');
  });
});

describe('computePage', () => {
  it('shows the first 20 employees in id order by default', () => {
    const page = computePage(employees, DEFAULT_VIEW_STATE);
    expect(ids(page.rows)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(page.pageCount).toBe(25);
  });

  it('filters, then sorts, then paginates', () => {
    const page = computePage(employees, {
      query: ' SALES ',
      department: 'Sales',
      sort: { key: 'salary', dir: 'desc' },
      page: 99,
    });
    const sales = employees.filter((e) => e.department === 'Sales');
    expect(page.total).toBe(sales.length);
    expect(page.page).toBe(page.pageCount);
    const salaries = page.rows.map((e) => e.salary);
    expect(salaries).toEqual([...salaries].sort((a, b) => b - a));
  });
});

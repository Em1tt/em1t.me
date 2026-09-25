import { getColumn, type ColumnKey } from './columns';
import type { Employee } from './employee';

export type SortDirection = 'asc' | 'desc';

export interface Sort {
  readonly key: ColumnKey;
  readonly dir: SortDirection;
}

/** What the user has chosen to see. Mirrored in the query string. */
export interface ViewState {
  /** Search text exactly as typed; surrounding spaces are ignored when matching. */
  readonly query: string;
  /** The department to show, or '' for all of them. */
  readonly department: string;
  /** The sorted column, or null for id order. */
  readonly sort: Sort | null;
  /** 1-based page number. */
  readonly page: number;
}

export const DEFAULT_VIEW_STATE: ViewState = { query: '', department: '', sort: null, page: 1 };

export const PAGE_SIZE = 20;

const SEARCHABLE_KEYS = ['name', 'email', 'department', 'role', 'location'] as const;

/** Employees in `department` (or any, when '') with a searchable field containing `query`. */
export function filterEmployees(
  employees: readonly Employee[],
  query: string,
  department: string,
): Employee[] {
  // An empty needle is contained in every string, so an empty query keeps everyone.
  const needle = query.trim().toLowerCase();
  return employees.filter(
    (employee) =>
      (department === '' || employee.department === department) &&
      SEARCHABLE_KEYS.some((key) => employee[key].toLowerCase().includes(needle)),
  );
}

const byId = (a: Employee, b: Employee): number => a.id - b.id;

/** A sorted copy. Ties, and everything when unsorted, are in ascending id order. */
export function sortEmployees(employees: readonly Employee[], sort: Sort | null): Employee[] {
  if (!sort) return [...employees].sort(byId);
  const { compare } = getColumn(sort.key);
  const sign = sort.dir === 'asc' ? 1 : -1;
  return [...employees].sort((a, b) => sign * compare(a, b) || byId(a, b));
}

/** Clicking a column sorts it ascending, then descending, then not at all. */
export function nextSort(current: Sort | null, key: ColumnKey): Sort | null {
  if (current?.key !== key) return { key, dir: 'asc' };
  return current.dir === 'asc' ? { key, dir: 'desc' } : null;
}

export interface Page<T> {
  readonly rows: readonly T[];
  /** The page shown: the requested one, clamped to the pages that exist. */
  readonly page: number;
  /** Number of pages; at least 1, even when there are no rows. */
  readonly pageCount: number;
  /** Number of rows across all pages. */
  readonly total: number;
  /** Position of `rows[0]` among all rows, counting from 0. */
  readonly offset: number;
}

export function paginate<T>(items: readonly T[], page: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.trunc(page)), pageCount);
  const offset = (current - 1) * PAGE_SIZE;
  return {
    rows: items.slice(offset, offset + PAGE_SIZE),
    page: current,
    pageCount,
    total: items.length,
    offset,
  };
}

/** Filters, sorts and paginates `employees` as `state` asks. */
export function computePage(employees: readonly Employee[], state: ViewState): Page<Employee> {
  const matches = filterEmployees(employees, state.query, state.department);
  return paginate(sortEmployees(matches, state.sort), state.page);
}

/** `Showing 21–40 of 500`, or `Showing 0 of 0` when nothing matches. */
export function describeRange({ rows, total, offset }: Page<unknown>): string {
  if (total === 0) return 'Showing 0 of 0';
  return `Showing ${offset + 1}–${offset + rows.length} of ${total}`;
}

/** `Page 2 of 25` */
export function describePage({ page, pageCount }: Page<unknown>): string {
  return `Page ${page} of ${pageCount}`;
}

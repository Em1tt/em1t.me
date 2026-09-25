import { isColumnKey } from './columns';
import type { ViewState } from './view';

/**
 * Reads the view state from a query string such as `?q=ann&sort=salary&dir=desc`.
 * Missing or invalid values fall back to their defaults. The page is not clamped
 * to the last page here, because the number of pages depends on the filters.
 */
export function parseViewState(search: string, departments: readonly string[]): ViewState {
  const params = new URLSearchParams(search);
  const department = params.get('dept') ?? '';
  const sortKey = params.get('sort');
  const page = params.get('page') ?? '';
  return {
    query: params.get('q') ?? '',
    department: departments.includes(department) ? department : '',
    sort: isColumnKey(sortKey)
      ? { key: sortKey, dir: params.get('dir') === 'desc' ? 'desc' : 'asc' }
      : null,
    page: /^\d+$/.test(page) ? Math.max(1, Number(page)) : 1,
  };
}

/**
 * Writes the view state as a query string with a leading `?`, leaving out
 * default values; the default view is the empty string.
 */
export function serializeViewState({ query, department, sort, page }: ViewState): string {
  const params = new URLSearchParams();
  if (query !== '') params.set('q', query);
  if (department !== '') params.set('dept', department);
  if (sort) {
    params.set('sort', sort.key);
    params.set('dir', sort.dir);
  }
  if (page > 1) params.set('page', String(page));
  const search = params.toString();
  return search === '' ? '' : `?${search}`;
}

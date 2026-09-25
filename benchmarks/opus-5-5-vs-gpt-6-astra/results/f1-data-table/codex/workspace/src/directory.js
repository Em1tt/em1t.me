export const PAGE_SIZE = 20;

export const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'department', label: 'Department' },
  { key: 'role', label: 'Role' },
  { key: 'salary', label: 'Salary' },
  { key: 'startDate', label: 'Start date' },
  { key: 'location', label: 'Location' },
];

const columnKeys = new Set(COLUMNS.map(({ key }) => key));
const searchableKeys = ['name', 'email', 'department', 'role', 'location'];

function hasSort(state) {
  return columnKeys.has(state.sort) && (state.dir === 'asc' || state.dir === 'desc');
}

function validPage(page) {
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function getDepartments(employees) {
  return [...new Set(employees.map(({ department }) => department))].sort((a, b) =>
    a.localeCompare(b, 'en'),
  );
}

export function readState(search, departments) {
  const params = new URLSearchParams(search);
  const department = params.get('dept') || '';
  const sort = params.get('sort') || '';
  const dir = params.get('dir') || '';
  const sorted = hasSort({ sort, dir });
  const pageText = params.get('page') || '';

  return {
    query: params.get('q') || '',
    department: departments.includes(department) ? department : '',
    sort: sorted ? sort : '',
    dir: sorted ? dir : '',
    page: /^\d+$/.test(pageText) ? validPage(Math.min(Number(pageText), Number.MAX_SAFE_INTEGER)) : 1,
  };
}

export function getView(employees, state) {
  const query = state.query.trim().toLowerCase();
  const filtered = employees.filter((employee) => {
    if (state.department && employee.department !== state.department) return false;
    return !query || searchableKeys.some((key) => employee[key].toLowerCase().includes(query));
  });

  const sorted = hasSort(state);
  const direction = state.dir === 'desc' ? -1 : 1;
  filtered.sort((a, b) => {
    let comparison = 0;
    if (sorted) {
      if (state.sort === 'salary') comparison = a.salary - b.salary;
      else if (state.sort === 'startDate') {
        comparison = Date.parse(a.startDate) - Date.parse(b.startDate);
      } else comparison = a[state.sort].localeCompare(b[state.sort], 'en');
    }
    return comparison * direction || a.id - b.id;
  });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(validPage(state.page), pageCount);
  const offset = (page - 1) * PAGE_SIZE;

  return {
    rows: filtered.slice(offset, offset + PAGE_SIZE),
    total,
    page,
    pageCount,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + PAGE_SIZE, total),
  };
}

export function stateToSearch(state) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.department) params.set('dept', state.department);
  if (hasSort(state)) {
    params.set('sort', state.sort);
    params.set('dir', state.dir);
  }
  if (validPage(state.page) > 1) params.set('page', String(state.page));
  const search = params.toString();
  return search ? `?${search}` : '';
}

import data from '../data/employees.json';
import { COLUMNS, type Column, type ColumnKey } from './columns';
import { listDepartments, type Employee } from './employee';
import { parseViewState, serializeViewState } from './url-state';
import { computePage, describePage, describeRange, nextSort, type ViewState } from './view';
import './styles.css';

const employees: readonly Employee[] = data;
const departments = listDepartments(employees);

function getElement<T extends HTMLElement>(id: string, type: abstract new () => T): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`Missing element #${id}`);
  return element;
}

const summary = getElement('directory-summary', HTMLParagraphElement);
const searchInput = getElement('search', HTMLInputElement);
const departmentSelect = getElement('department', HTMLSelectElement);
const tableScroll = getElement('table-scroll', HTMLDivElement);
const table = getElement('employee-table', HTMLTableElement);
const emptyState = getElement('empty-state', HTMLDivElement);
const clearFiltersButton = getElement('clear-filters', HTMLButtonElement);
const resultCount = getElement('result-count', HTMLParagraphElement);
const pageInfo = getElement('page-info', HTMLSpanElement);
const prevButton = getElement('prev-page', HTMLButtonElement);
const nextButton = getElement('next-page', HTMLButtonElement);

let state: ViewState = parseViewState(location.search, departments);

function update(changes: Partial<ViewState>): void {
  state = { ...state, ...changes };
  render();
}

// Static parts of the page.

summary.textContent = `${employees.length} people across ${departments.length} departments`;

departmentSelect.append(...departments.map((department) => new Option(department, department)));

const SORT_ICON =
  '<svg class="sort-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
  '<path class="sort-icon__up" d="m5 6.5 3-3 3 3"/><path class="sort-icon__down" d="m5 9.5 3 3 3-3"/></svg>';

const headerRow = table.createTHead().insertRow();
const headerCells = new Map<ColumnKey, HTMLTableCellElement>();
for (const column of COLUMNS) {
  const cell = document.createElement('th');
  cell.scope = 'col';
  cell.dataset.key = column.key;
  if (column.numeric) cell.className = 'numeric';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'sort-button';
  button.textContent = column.label;
  button.insertAdjacentHTML('beforeend', SORT_ICON);
  button.addEventListener('click', () => update({ sort: nextSort(state.sort, column.key), page: 1 }));

  cell.append(button);
  headerRow.append(cell);
  headerCells.set(column.key, cell);
}

const tableBody = table.createTBody();

// The empty state is only in the page while nothing matches. It starts out hidden so it never flashes.
emptyState.remove();
emptyState.hidden = false;

// Spread the departments around the colour wheel for their tags.
const departmentHues = new Map(
  departments.map((department, index) => [department, Math.round((index * 360) / departments.length)]),
);

// Rendering.

function renderCell(column: Column, employee: Employee): HTMLTableCellElement {
  const cell = document.createElement('td');
  if (column.numeric) cell.className = 'numeric';
  const text = column.format(employee);

  if (column.key === 'email') {
    const link = document.createElement('a');
    link.href = `mailto:${employee.email}`;
    link.textContent = text;
    cell.append(link);
  } else if (column.key === 'department') {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.style.setProperty('--hue', String(departmentHues.get(employee.department) ?? 0));
    tag.textContent = text;
    cell.append(tag);
  } else {
    cell.textContent = text;
  }
  return cell;
}

function renderRow(employee: Employee): HTMLTableRowElement {
  const row = document.createElement('tr');
  row.dataset.id = String(employee.id);
  row.append(...COLUMNS.map((column) => renderCell(column, employee)));
  return row;
}

function renderSortState(): void {
  for (const [key, cell] of headerCells) {
    const dir = state.sort?.key === key ? state.sort.dir : null;
    cell.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none');
  }
}

function renderEmptyState(isEmpty: boolean): void {
  if (!isEmpty) emptyState.remove();
  else if (!emptyState.isConnected) tableScroll.after(emptyState);
}

function renderPagination(page: number, pageCount: number): void {
  const focused = document.activeElement;
  prevButton.disabled = page <= 1;
  nextButton.disabled = page >= pageCount;
  // A button that gets disabled loses focus; hand it to the other one so keyboard users keep their place.
  if (focused === prevButton && prevButton.disabled) nextButton.focus();
  if (focused === nextButton && nextButton.disabled) prevButton.focus();
}

/** The table scrolls sideways on narrow screens: make it keyboard-scrollable and shade the pinned column. */
function updateScrollAffordances(): void {
  if (tableScroll.scrollWidth > tableScroll.clientWidth) tableScroll.tabIndex = 0;
  else tableScroll.removeAttribute('tabindex');
  tableScroll.classList.toggle('is-scrolled', tableScroll.scrollLeft > 0);
}

let urlRetry: number | undefined;

/** Mirrors the state in the query string, replacing the current history entry. */
function writeUrl(): void {
  window.clearTimeout(urlRetry);
  const url = new URL(location.href);
  url.search = serializeViewState(state);
  if (url.href === location.href) return;
  try {
    history.replaceState(history.state, '', url);
  } catch {
    // WebKit refuses more than 100 history updates in 10 seconds; catch up once it allows them again.
    urlRetry = window.setTimeout(writeUrl, 1000);
  }
}

function render(): void {
  const page = computePage(employees, state);
  // Keep the page that is actually shown, e.g. the last page when the URL asked for one past it.
  state = { ...state, page: page.page };

  renderSortState();
  tableBody.replaceChildren(...page.rows.map(renderRow));
  renderEmptyState(page.total === 0);
  resultCount.textContent = describeRange(page);
  pageInfo.textContent = describePage(page);
  renderPagination(page.page, page.pageCount);
  updateScrollAffordances();
  writeUrl();
}

// Interaction.

searchInput.addEventListener('input', () => update({ query: searchInput.value, page: 1 }));

searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && searchInput.value !== '') {
    searchInput.value = '';
    update({ query: '', page: 1 });
  }
});

departmentSelect.addEventListener('change', () => update({ department: departmentSelect.value, page: 1 }));

prevButton.addEventListener('click', () => update({ page: state.page - 1 }));
nextButton.addEventListener('click', () => update({ page: state.page + 1 }));

clearFiltersButton.addEventListener('click', () => {
  searchInput.value = '';
  departmentSelect.value = '';
  update({ query: '', department: '', page: 1 });
  searchInput.focus();
});

tableScroll.addEventListener('scroll', updateScrollAffordances, { passive: true });
new ResizeObserver(updateScrollAffordances).observe(tableScroll);

// Restore the controls from the URL, then draw the first page.
searchInput.value = state.query;
departmentSelect.value = state.department;
render();

import employees from '../data/employees.json';
import { COLUMNS, getDepartments, readState, getView, stateToSearch } from './directory.js';
import './style.css';

const icons = {
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h1m6 0h1M8 11h1m6 0h1"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  laptop: '<rect x="5" y="4" width="14" height="12" rx="2"/><path d="m5 16-3 4h20l-3-4"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
  sort: '<path d="m8 9 4-4 4 4m-8 6 4 4 4-4"/>',
  arrow: '<path d="M12 19V5m-5 5 5-5 5 5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
};
const icon = (name, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const departments = getDepartments(employees);
let state = readState(window.location.search, departments);
const salaryFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const escapeHTML = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const locations = new Set(employees.map((employee) => employee.location).filter((location) => location !== 'Remote'));

document.querySelector('#app').innerHTML = `
  <header class="app-header">
    <div class="header-inner">
      <a class="brand" href="/" aria-label="Gather home"><img src="/favicon.svg" alt="" width="34" height="34" /><span>gather<span class="brand-dot">.</span></span></a>
      <div class="header-divider"></div>
      <div class="breadcrumb"><span>Workspace</span>${icon('chevron')}<span class="breadcrumb-current">People</span></div>
      <div class="workspace-label"><span class="status-dot"></span>Your people, connected</div>
      <div class="workspace-avatar" aria-label="People workspace">G</div>
    </div>
  </header>
  <main>
    <section class="page-heading" aria-labelledby="page-title">
      <div><div class="eyebrow">THE PEOPLE BEHIND THE WORK</div><h1 id="page-title">People directory<span class="heading-dot">.</span></h1><p>A little closer to everyone you work with.</p></div>
      <button class="button export-button" id="export">${icon('download')}<span>Export directory</span></button>
    </section>
    <section class="stats" aria-label="Directory overview">
      <div class="stat"><div class="stat-icon">${icon('people')}</div><div><span class="stat-label">Total employees</span><div class="stat-value">${employees.length}<span class="stat-note">people</span></div></div></div>
      <div class="stat"><div class="stat-icon">${icon('building')}</div><div><span class="stat-label">Departments</span><div class="stat-value">${departments.length}<span class="stat-note">working together</span></div></div></div>
      <div class="stat"><div class="stat-icon">${icon('globe')}</div><div><span class="stat-label">Office locations</span><div class="stat-value">${locations.size}<span class="stat-note">around the world</span></div></div></div>
      <div class="stat"><div class="stat-icon">${icon('laptop')}</div><div><span class="stat-label">Remote employees</span><div class="stat-value">${employees.filter((employee) => employee.location === 'Remote').length}<span class="stat-note">working anywhere</span></div></div></div>
    </section>
    <section class="directory" aria-labelledby="directory-title">
      <div class="directory-heading"><div class="directory-title-row"><h2 id="directory-title">All employees</h2><span class="total-badge">${employees.length}</span></div><span class="directory-description">Good people. Great things.</span></div>
      <div class="toolbar">
        <div class="search-field">${icon('search')}<label for="employee-search" class="sr-only">Search employees</label><input id="employee-search" data-testid="search" type="search" placeholder="Search by name, email, role…" autocomplete="off" /><button id="clear-search" class="icon-button" aria-label="Clear search" hidden>${icon('close')}</button><kbd class="search-shortcut" aria-hidden="true">/</kbd></div>
        <div class="select-field">${icon('building')}<label class="sr-only" for="department">Department</label><select id="department" data-testid="department"><option value="">All departments</option>${departments.map((department) => `<option value="${escapeHTML(department)}">${escapeHTML(department)}</option>`).join('')}</select>${icon('down')}</div>
        <button id="reset" class="reset-button" hidden>Reset filters</button>
        <span class="toolbar-note">Find your people</span>
      </div>
      <div class="table-scroll" role="region" aria-label="Employee table, scroll horizontally to see all columns" tabindex="0">
        <table><caption class="sr-only">Employee directory with contact details, departments, roles, salaries, start dates, and locations</caption><thead><tr>${COLUMNS.map(({ key, label }) => `<th scope="col" data-key="${key}" aria-sort="none"><button data-sort="${key}"><span>${label}</span><span class="sort-icon">${icon('sort')}</span></button></th>`).join('')}</tr></thead><tbody></tbody></table>
      </div>
      <div class="empty-state" id="empty-state" hidden><div class="empty-icon">${icon('search')}</div><p data-testid="empty">No employees match your filters.</p><span>Try another search or choose a different department.</span><button class="button" id="empty-reset">Clear filters</button></div>
      <footer class="table-footer"><span data-testid="count" class="result-count" aria-live="polite"></span><div class="pagination"><span data-testid="page-info"></span><button class="button page-button" data-testid="prev">${icon('chevron', 'rotate')}<span>Previous</span></button><button class="button page-button" data-testid="next"><span>Next</span>${icon('chevron')}</button></div></footer>
    </section>
    <footer class="page-footer"><span>Made for the people who make it happen.</span><span class="footer-brand">gather.</span></footer>
  </main><div id="toast" role="status" class="toast" hidden></div>`;

const searchInput = document.querySelector('[data-testid="search"]');
const departmentSelect = document.querySelector('[data-testid="department"]');
const tbody = document.querySelector('tbody');
const previousButton = document.querySelector('[data-testid="prev"]');
const nextButton = document.querySelector('[data-testid="next"]');

function render() {
  const view = getView(employees, state);
  state.page = view.page;
  if (searchInput.value !== state.query) searchInput.value = state.query;
  departmentSelect.value = state.department;
  document.querySelector('#clear-search').hidden = !state.query;
  document.querySelector('.search-shortcut').hidden = Boolean(state.query);
  document.querySelector('#reset').hidden = !state.query && !state.department && !state.sort;
  document.querySelector('.total-badge').textContent = view.total;

  for (const { key } of COLUMNS) {
    const header = document.querySelector(`th[data-key="${key}"]`);
    const selected = state.sort === key;
    header.setAttribute('aria-sort', selected ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    header.querySelector('.sort-icon').innerHTML = selected ? icon('arrow', state.dir === 'desc' ? 'descending' : '') : icon('sort');
    header.querySelector('button').title = selected ? (state.dir === 'asc' ? 'Sort descending' : 'Remove sorting') : 'Sort ascending';
  }

  tbody.innerHTML = view.rows.map((employee) => {
    const initials = employee.name.split(/\s+/).map((part) => part[0]).filter(Boolean);
    const avatarText = `${initials[0] || ''}${initials.length > 1 ? initials.at(-1) : ''}`.toUpperCase();
    const departmentIndex = departments.indexOf(employee.department);
    return `<tr data-id="${employee.id}">
      <td class="name-cell"><div class="person"><span class="person-avatar tone-${employee.id % 6}" data-initials="${escapeHTML(avatarText)}" aria-hidden="true"></span><span>${escapeHTML(employee.name)}</span></div></td>
      <td class="email-cell"><a href="mailto:${escapeHTML(employee.email)}">${escapeHTML(employee.email)}</a></td>
      <td><span class="department-badge department-${departmentIndex % 8}"><span class="department-dot" aria-hidden="true"></span>${escapeHTML(employee.department)}</span></td>
      <td>${escapeHTML(employee.role)}</td>
      <td class="salary-cell">${salaryFormat.format(employee.salary)}</td>
      <td class="date-cell">${dateFormat.format(new Date(employee.startDate))}</td>
      <td class="location-cell"><span>${icon(employee.location === 'Remote' ? 'laptop' : 'pin')}${escapeHTML(employee.location)}</span></td>
    </tr>`;
  }).join('');

  document.querySelector('#empty-state').hidden = view.total !== 0;
  document.querySelector('[data-testid="count"]').textContent = view.total ? `Showing ${view.start}–${view.end} of ${view.total}` : 'Showing 0 of 0';
  document.querySelector('[data-testid="page-info"]').textContent = `Page ${view.page} of ${view.pageCount}`;
  previousButton.disabled = view.page === 1;
  nextButton.disabled = view.page === view.pageCount;

  const url = `${window.location.pathname}${stateToSearch(state)}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

function reset() {
  state = { query: '', department: '', sort: '', dir: '', page: 1 };
  render();
}

searchInput.addEventListener('input', () => { state.query = searchInput.value; state.page = 1; render(); });
departmentSelect.addEventListener('change', () => { state.department = departmentSelect.value; state.page = 1; render(); });
document.querySelector('#clear-search').addEventListener('click', () => { state.query = ''; state.page = 1; render(); searchInput.focus(); });
document.querySelector('#reset').addEventListener('click', reset);
document.querySelector('#empty-reset').addEventListener('click', () => { reset(); searchInput.focus(); });
document.querySelectorAll('[data-sort]').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.sort;
  if (state.sort !== key) { state.sort = key; state.dir = 'asc'; }
  else if (state.dir === 'asc') state.dir = 'desc';
  else { state.sort = ''; state.dir = ''; }
  state.page = 1;
  render();
}));
previousButton.addEventListener('click', () => { if (state.page > 1) { state.page--; render(); } });
nextButton.addEventListener('click', () => { if (state.page < getView(employees, state).pageCount) { state.page++; render(); } });
window.addEventListener('popstate', () => { state = readState(window.location.search, departments); render(); });
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) {
    event.preventDefault(); searchInput.focus();
  }
});

let toastTimer;
document.querySelector('#export').addEventListener('click', () => {
  const view = getView(employees, state);
  const rows = [];
  for (let page = 1; page <= view.pageCount; page++) rows.push(...getView(employees, { ...state, page }).rows);
  const cell = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const csv = [COLUMNS.map(({ label }) => cell(label)).join(','), ...rows.map((employee) => COLUMNS.map(({ key }) => cell(employee[key])).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url; link.download = 'gather-employees.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  const toast = document.querySelector('#toast');
  toast.textContent = `Exported ${rows.length} ${rows.length === 1 ? 'employee' : 'employees'} to CSV`;
  toast.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
});

render();

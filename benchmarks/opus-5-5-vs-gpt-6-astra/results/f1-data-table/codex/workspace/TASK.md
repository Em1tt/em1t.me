# Task: employee directory table

Build a single-page web app that shows the 500 employees in `data/employees.json` in a searchable,
sortable, paginated table.

You may use any framework or none. The deliverable is a static build:

- `npm run build` must produce `dist/index.html` (plus any assets it needs).
- The site must work when the `dist/` folder is served by a plain static file server at the root
  URL (`/`), with no other server. It may fetch `employees.json` from `dist/` or bundle the data.
- When you finish, the `dist/` folder must be built and up to date.

Automated browser tests will check the behaviour below exactly, so follow the names, texts and
attributes precisely.

## Table

- A `<table>` with a `<caption>` (any text) and these columns, in this order:

  | Header text | Column key  | Cell shows                                    |
  | ----------- | ----------- | --------------------------------------------- |
  | Name        | `name`      | the name                                      |
  | Email       | `email`     | the email                                     |
  | Department  | `department`| the department                                |
  | Role        | `role`      | the role                                      |
  | Salary      | `salary`    | US dollars, no cents: `$123,456`              |
  | Start date  | `startDate` | e.g. `Mar 4, 2021`                            |
  | Location    | `location`  | the location                                  |

  Salary is formatted like `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD',
  maximumFractionDigits: 0 })`, and the start date like `new Date(startDate).toLocaleDateString(
  'en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })`.
- Each header cell is a `<th>` with a `data-key` attribute set to its column key, and contains a
  `<button>` that sorts by that column.
- Each body row is a `<tr>` inside `<tbody>` with a `data-id` attribute set to the employee's `id`,
  and one `<td>` per column in the order above.

## Search and filter

- A text input with `data-testid="search"` and an accessible label. It keeps employees whose name,
  email, department, role or location contains the query, case-insensitively (compare with
  `toLowerCase()`, no accent folding). Leading and trailing spaces in the query are ignored; an
  empty query keeps everyone.
- A `<select>` with `data-testid="department"`. Its first option is "All departments" with value
  `""`, followed by one option per department (value and text = the department name), sorted
  alphabetically. Choosing a department keeps only that department.
- Search and department filter combine.

## Sorting

- Clicking a column's button sorts by it: the first click sorts ascending, the second descending,
  the third removes the sort. Only one column is sorted at a time; clicking a different column
  starts that column at ascending.
- The sorted column's `<th>` has `aria-sort="ascending"` or `aria-sort="descending"`; every other
  `<th>` has `aria-sort="none"`.
- Compare text columns with `a.localeCompare(b, 'en')`, `salary` numerically and `startDate`
  chronologically. Ties are always broken by `id` ascending, also when sorting descending.
- Unsorted, rows are in `id` order.

## Pagination

- 20 rows per page.
- Buttons with `data-testid="prev"` and `data-testid="next"`, disabled (the `disabled` attribute)
  when there is no previous or next page.
- An element with `data-testid="page-info"` reading `Page X of Y`, where Y is the number of pages,
  at least 1.
- An element with `data-testid="count"` reading `Showing A–B of N` (with an en dash `–`), e.g.
  `Showing 21–40 of 500`. When nothing matches, it reads `Showing 0 of 0`.
- Changing the search, the department or the sort goes back to page 1.

## Empty state

When nothing matches, the table body has no rows and an element with `data-testid="empty"` is
visible, reading `No employees match your filters.` It must not be visible otherwise.

## URL

The state lives in the query string, so a page can be bookmarked and shared:

- `q` (the search query, as typed, if not empty), `dept` (if a department is chosen), `sort` and
  `dir` (the column key and `asc` or `desc`, if sorted), and `page` (if it is greater than 1).
  Parameters with default values are left out, so the default view has no query string at all.
- Update the URL as the state changes, without reloading the page and without adding history
  entries.
- Opening the page with these parameters restores that state (search box text, selected
  department, sort, page). Ignore invalid values; a page number past the end shows the last page.

## Layout

- It must look tidy and readable; the visual design is up to you.
- At a viewport 390 px wide, the page itself must not scroll sideways (the table may scroll
  inside its own container).

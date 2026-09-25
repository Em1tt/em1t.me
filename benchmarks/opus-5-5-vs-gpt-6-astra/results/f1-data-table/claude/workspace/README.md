# Employee directory

A single-page app that lists the 500 employees in `data/employees.json` in a searchable, sortable,
paginated table. The whole view (search, department, sort and page) lives in the query string, so
any view can be bookmarked or shared.

Built with TypeScript and Vite, without a UI framework. The employee data is bundled into the build,
so the table is rendered before the page's `load` event and there is nothing to fetch.

## Commands

| Command             | What it does                                                          |
| ------------------- | --------------------------------------------------------------------- |
| `npm install`       | Install the dev dependencies.                                         |
| `npm run dev`       | Start the Vite dev server.                                            |
| `npm run build`     | Build the static site into `dist/`.                                   |
| `npm run preview`   | Serve `dist/` at <http://localhost:4173/> with a plain static server. |
| `npm run typecheck` | Type-check the app and the tests.                                     |
| `npm test`          | Run the unit tests (Vitest).                                          |
| `npm run test:e2e`  | Build, then run the browser tests (Playwright) against `dist/`.       |
| `npm run check`     | All of the above checks.                                              |

The browser tests need Playwright's browsers once: `npx playwright install chromium firefox webkit`.

`dist/` only needs a static file server: `index.html` references its assets with relative URLs.

## Layout

```
index.html            page shell: header, filters, table, empty state, pagination
src/main.ts           wires the page to the view state and renders it
src/view.ts           view state, filtering, sorting and pagination (pure functions)
src/url-state.ts      view state <-> query string
src/columns.ts        column definitions: label, cell text, sort order
src/format.ts         salary and start date formatting
src/employee.ts       the Employee type
src/styles.css        styles, including dark mode and small screens
scripts/serve.mjs     static file server used by `preview` and the browser tests
tests/unit/           Vitest tests for the pure modules
tests/e2e/            Playwright tests, checked against an independent reference implementation
```

## Behaviour notes

- **Search** matches name, email, department, role and location, compared with `toLowerCase()`
  (no accent folding) after trimming the query. The URL keeps the query exactly as typed.
- **Sorting** compares text like `a.localeCompare(b, 'en')` (via an equivalent `Intl.Collator`),
  salaries as numbers and start dates chronologically. Ties are always in ascending id order.
- **URL parameters** are written in the order `q`, `dept`, `sort`, `dir`, `page`, leaving out
  defaults, with `history.replaceState`. On load, invalid values are ignored: an unknown
  department or column, and a page that isn't a whole number from 1 up. A known column with a
  missing or unknown `dir` sorts ascending. A page past the end shows the last page. The URL is
  then rewritten to match what is shown.
- WebKit rejects more than 100 history updates in 10 seconds. If that happens, the app retries
  the URL update a second later.
- **Accessibility**: labelled controls, a sort button in each column header with `aria-sort` on
  the header cell, and the result count as a polite live region. When a pagination button that
  has focus gets disabled, focus moves to the other one. The table container can be focused and
  scrolled with the keyboard whenever it is wider than the screen.
- **Small screens**: the page never scrolls sideways. The table scrolls inside its own container
  and the Name column stays pinned. Column widths are fixed, so the layout doesn't shift between
  pages.

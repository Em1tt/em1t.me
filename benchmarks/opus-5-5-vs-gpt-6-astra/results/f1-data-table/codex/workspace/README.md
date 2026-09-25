# Gather employee directory

A responsive, static directory of the 500 employees in `data/employees.json`, built with vanilla JavaScript and Vite. Includes combined search and department filtering, three-state column sorting, 20-row pagination, accessible table controls, bookmarkable URL state, and CSV export of the current results.

## Run and build

```sh
npm install
npm run dev
npm run build
```

Serve `dist/` with any static HTTP server at `/`. The employee data is bundled into the build; no backend or external services are required.

## Browser checks

Install Playwright Chromium in the workspace (PowerShell):

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.playwright'
npx playwright install chromium
npm run build
npm test
```

The test suite serves `dist/` with a plain static server and checks table semantics, formatting, all seven sorting columns, tie order, filters, pagination, empty results, URL state, and the mobile viewport.

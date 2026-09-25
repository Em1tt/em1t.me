# Tidepool

A responsive, static landing page built with Vite, vanilla JavaScript, locally bundled DM Sans and Fraunces fonts, and inline SVG/CSS illustrations.

## Run

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

Serve `dist/` at `/` using any static file server. The finished site makes no requests to other servers. Font licenses are included in `dist/licenses/`.

## Browser checks

The checks serve the production build with a plain Node static server, then verify pricing, FAQ answers, responsive navigation, overflow, local assets, the preview list, and axe accessibility at desktop and mobile widths.

Install the test browser into this folder (PowerShell):

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = "$PWD/.browser-cache"
npx playwright install chromium
npm run build
npm test
```

Screenshots are written to `.test-results/`.

The call-to-action buttons open a working grocery-list preview. Items can be added, checked, removed, or reset, and are saved in local storage. This is a local product demonstration; it does not create accounts or process payments.

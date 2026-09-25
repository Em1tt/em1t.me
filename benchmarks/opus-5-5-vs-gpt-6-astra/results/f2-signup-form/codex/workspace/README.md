# Gather sign-up

A responsive, client-only sign-up page with accessible live validation and a password strength meter. Successful submissions display a welcome message and the normalized public profile data; passwords are never included.

## Run

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

Serve `dist/` with any static file server at `/`. Fonts, country data, and taken usernames are bundled locally. The included `node scripts/static-server.mjs` serves the build at `http://127.0.0.1:4173`.

The optional `?today=2026-09-25` query parameter fixes the date used for age validation. Otherwise, the browser's current local date is used.

## Browser checks

Install the Playwright Chromium browser into this folder, then run the tests against the build. In PowerShell:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location).Path '.browsers'
npx playwright install chromium
npm run build
npm test
```

Tests cover the field contract, exact validation messages and precedence, validation timing, cross-field updates, password strength, date boundaries, submit focus, success payload, and mobile overflow.

# Tidepool landing page

Marketing page for **Tidepool**, a (made-up) app that keeps one shared grocery list for a household.

It is a static site: plain HTML, CSS and a small script, with no framework and no runtime
dependencies. Everything is served from the same origin. The display font is bundled, the body
text uses the system font, and every illustration is inline SVG or CSS.

## Commands

| Command           | What it does                                                         |
| ----------------- | -------------------------------------------------------------------- |
| `npm run build`   | Builds `src/` into `dist/` (plain Node.js, no packages needed)        |
| `npm run dev`     | Serves `src/` as-is at <http://localhost:4173>                        |
| `npm run preview` | Serves the built `dist/` at <http://localhost:4173>                   |
| `npm test`        | Builds, then runs the Playwright + axe-core suite against `dist/`     |

The tests need the dev dependencies and Playwright's browsers: `npm install` followed by
`npx playwright install`.

## Layout

```
src/
  index.html        page markup and inline SVG illustrations
  styles.css        design tokens, layout and components (mobile-first)
  main.js           mobile menu, billing toggle, FAQ, "get the app" dialog
  favicon.svg
  fonts/            Fraunces variable font (SIL Open Font License 1.1)
scripts/
  build.mjs         fingerprints assets, strips whitespace, checks for broken or external references
  serve.mjs         tiny static server used by dev, preview and the tests
tests/
  landing.spec.js   end-to-end checks for copy, behaviour, layout and accessibility
```

## Notes

- **Build output.** `dist/index.html` references content-hashed files in `dist/assets/`, so
  they can be cached forever. The build stops if the page points at a missing file or at
  another server.
- **Fonts.** Headings use Fraunces as a single 61 kB variable WOFF2 file (Latin subset, weight
  and "soft" axes). The file is preloaded and uses `font-display: swap`.
- **Pricing.** The billing control is a `<button role="switch">` with `aria-checked`. Prices
  live in `data-testid="price-*"` elements and switch between `$4/mo` and `$40/yr` (a year costs
  10 months). A polite live region announces the change.
- **FAQ.** Each question is a `<button>` with `aria-expanded` and `aria-controls`. It toggles
  the `hidden` attribute on its answer, and the answers open independently.
- **Navigation.** Below 768 px the links sit behind `data-testid="menu-button"`. The CSS is
  keyed off the button's `aria-expanded`, so the visible state and the announced state can't
  drift apart. The menu closes on Escape, on an outside click, after a link is chosen and when
  the window grows past the breakpoint.
- **Without JavaScript** the links wrap under the logo and every answer is shown.
- **Accessibility.** axe-core reports no violations at 360, 390, 768 and 1280 px. The page
  has a skip link, visible focus rings, AA contrast throughout, and 44 px touch targets. It also
  respects `prefers-reduced-motion` and forced-colors (Windows high contrast) mode.
- **Browsers.** The suite runs in Chromium, Firefox and WebKit, and on emulated Pixel 7 and
  iPhone 13 devices.

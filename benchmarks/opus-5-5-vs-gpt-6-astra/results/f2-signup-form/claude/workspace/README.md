# Sign-up form

A sign-up page with client-side validation, built as a static site with no framework.
The spec is in [TASK.md](TASK.md).

```sh
npm install
npm run build     # writes dist/index.html
npm run preview   # serves dist/ at http://localhost:4317/
npm test          # unit tests, then browser tests (the first run needs: npx playwright install)
```

## How it is built

`npm run build` (`scripts/build.mjs`) bundles `src/` with esbuild and writes one self-contained
`dist/index.html`. The CSS, the JavaScript and the taken-username list are inlined, and the
country `<option>`s are generated from `countries.json` at build time. So the page needs no
extra requests and works from any static file server, whatever MIME types it sends. The markup
is ASCII-only (other characters become character references), so a server that sends the wrong
charset can't garble it.

| Path                         | Contents                                                           |
| ---------------------------- | ------------------------------------------------------------------ |
| `src/validation.js`          | The rules, messages, password strength and payload, as pure functions |
| `src/main.js`                | DOM wiring: when errors show, ARIA attributes, submit, success view |
| `src/index.html`             | Page markup, with `<!-- inject:... -->` markers for the build      |
| `src/styles.css`             | Styles: mobile first, light and dark themes                        |
| `scripts/serve.mjs`          | A tiny static server for preview and tests                         |
| `tests/unit/`                | Node test-runner tests for `validation.js`                         |
| `tests/e2e/`                 | Playwright tests against the built `dist/` (Chromium, Firefox, WebKit, 390 px mobile) |

## Behaviour notes

- A field's error shows after the field first loses focus, or after the first submit attempt,
  and then updates on every change. All fields are re-validated together, so the password error
  follows the username and the confirmation error follows the password.
- When a field loses focus because the mouse was pressed on another control, its error waits
  until the mouse button is released. Otherwise the new message would push the submit button
  or checkbox down between mousedown and mouseup, and the click would be lost.
- Lengths count Unicode characters (code points), so an emoji is one character. For the password,
  letters and digits in any script count as letters and digits. A "symbol" is anything else,
  including a space.
- "Today" is the `?today=YYYY-MM-DD` query parameter when it is a real date, otherwise the local
  date. Ages are calendar-based: someone turns 16 on their 16th birthday, and a 29 February
  birthday counts from 1 March in other years.
- The success payload is pretty-printed JSON with the keys in the order the spec lists them.
- Errors are linked to their fields with `aria-describedby`, and invalid fields get
  `aria-invalid="true"`. The strength meter is a polite live region.

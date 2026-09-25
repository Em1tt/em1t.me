# Task: fix the reported bugs

This is an existing JavaScript library (Node.js 24, no dependencies). `README.md` describes what
it's meant to do, and `ISSUE.md` lists bugs that customers have reported.

- Find and fix the cause of every bug in `ISSUE.md`.
- Don't change the public API: the same functions, with the same names, arguments and return
  values, exported from `src/index.js`. Other code depends on it.
- Keep the existing tests passing, and add tests that would have caught each bug. `npm test`
  runs them.
- Hidden tests will check that the bugs are fixed and that nothing else broke.

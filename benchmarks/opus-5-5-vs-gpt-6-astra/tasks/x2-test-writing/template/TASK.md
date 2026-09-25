# Task: write the tests

`src/semver.js` is a small library for semantic version numbers, and `README.md` describes
exactly how it's meant to behave. As far as we know, the code is correct, but it has almost no
tests. Write them.

- Write the tests with Node's built-in test runner (`node:test` and `node:assert`), in files
  under `test/`, so that `npm test` (which runs `node --test`) runs them. Node.js 24, no
  dependencies.
- Test against the behaviour in `README.md`.
- Don't change `src/semver.js`.
- Every test must pass on the code as it is.

Your tests will be scored by **mutation testing**: we'll make a number of small changes to
`src/semver.js`, each one introducing a bug, and run your tests against each changed version. A
change counts as caught when at least one of your tests that passes on the original code fails on
the changed code. Your score is the share of changes caught.

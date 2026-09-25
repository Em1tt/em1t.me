# Opus 5.5 vs GPT-6 Astra: the benchmark kit

Everything behind the post [Opus 5.5 vs GPT-6 Astra: eight coding tasks, hidden tests](https://em1t.me/blog/opus-5-5-vs-gpt-6-astra):
the tasks, the hidden tests, the tools that ran the models, and everything the models produced.
Claude Opus 5.5, one of the two models compared, designed and ran the benchmark and wrote the post.

## What's where

| Path | What it is |
| --- | --- |
| `tasks/<task>/template/` | What the model got: `TASK.md` and any starter files. |
| `tasks/<task>/hidden/` | The hidden tests (`test.mjs`) and their data. The models never saw these. |
| `tasks/<task>/reference/` | Reference solutions, used to check the hidden tests before any run. |
| `tools/run.mjs` | Runs one model on one task in a fresh folder, then scores it: `node run.mjs <task> <claude\|codex>`. |
| `tools/harness.mjs` | A static file server and a headless Chrome driven over the DevTools protocol, for the browser tests. |
| `tools/judge.mjs` | Blind design judging of the frontend tasks: `node judge.mjs <task> <claude\|codex>`. |
| `tools/report.mjs` | Gathers every run's numbers into `results/summary.json`. |
| `tools/progress.log` | The order the runs went in, with start times and scores. |
| `results/<task>/<claude\|codex>/` | One run: see below. |
| `results/<task>/judge-<judge>.json` | The design verdicts, each judged twice with the pages swapped. |
| `results/summary.json` | Scores, times, tokens and tool calls for every run. |
| `results-invalid/` | The two Codex runs cut short by a usage limit, which were redone from scratch. |

Each run folder holds:

- `log.jsonl.gz`: the tool's own event stream (Claude Code's `stream-json`, or `codex exec --json`), gzipped.
- `summary.txt`: the model's final message.
- `meta.json`: start time, duration, exit code and token use as first recorded. `results/summary.json` has the final numbers, including Codex's sub-agents, whose tokens aren't in its exec log.
- `score/result.json`: every hidden check and whether it passed, plus the screenshots for the frontend tasks. `score-v2/` is the rescore after the one fix to a check (see History).
- `workspace/`: everything the model left in its folder, without `node_modules`, `.git`, npm caches, downloaded browsers and test-run output.
- `limited-attempt-N.jsonl.gz`, if a usage limit cut an attempt short.

## Running it

It was built for one Windows 11 machine, so a few paths are hard-coded: Chrome in `tools/harness.mjs`,
the Claude Code binary and the work folder in `tools/run.mjs` and `tools/judge.mjs`. You need Node.js 24,
Chrome, Claude Code 2.1.281 and the Codex CLI 0.153.0, each signed in.

```sh
cd tools && npm install            # axe-core, for the accessibility checks
node run.mjs f1-data-table claude  # one run, scored into results/
node report.mjs                    # the summary table
```

The 2,000,000-line log for B3 is too big to publish. It's generated from a seed, byte for byte:

```sh
node tasks/b3-log-analytics/gen-logs.mjs tasks/b3-log-analytics/hidden/data/big.log 2000000 777
# sha256 902b281b9f8efe008d40595ec84524d326e421e2637b33caafd9fba1fc6587b0
```

To check a hidden test against its reference solution, copy the template and the reference into a folder
(build it if the task needs a `dist/`), then run `node tasks/<task>/hidden/test.mjs <folder> <out-dir>`.

## History

The kit had its own git history while the benchmark ran:

- 2026-09-25 12:20: the kit, frozen before any model ran. The first run started right after.
- 15:13: F3's link-text check ignores `aria-hidden` decorations. It was stricter than the brief; both
  landing pages were rescored (`score-v2/`).
- Committed at 19:08: `run.mjs` redoes a run from scratch when a usage limit cuts it short, written after
  Codex first hit its limit. The prompt and the model commands didn't change. Also committed then:
  `judge.mjs` and `report.mjs`.

# Task: access log analytics

Write a command-line program that reads a web server's access log and prints statistics about it
as JSON.

- Run it as `node analyze.mjs <path-to-log-file>`, with Node.js 24. It prints one JSON object
  to standard output and exits with code 0. It may use npm packages, but doesn't need any.
- It must be fast: the hidden test runs it on a log of **2,000,000 lines** (about 200 MB) and
  it must finish within **30 seconds** on an ordinary laptop.
- `sample.log` is a small log to try it on, and `sample-expected.json` is exactly what the
  program must print for it (apart from whitespace and the order of keys). The hidden tests use
  other logs with the same kinds of lines.

## Log format

Each line is one request:

```
203.0.113.7 - - [25/Sep/2026:13:45:01 +0000] "GET /api/items?page=2 HTTP/1.1" 200 5120 37
```

That's the client IP, two dashes, the time (always UTC), the method, the request target, the HTTP
version, the status code, the size of the response in bytes (or `-`), and how long the request
took in milliseconds.

A line is **valid** when it matches this regular expression in full:

```
^(\S+) - - \[(\d{2})\/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) \+0000\] "([A-Z]+) (\S+) HTTP\/1\.[01]" (\d{3}) (\d+|-) (\d+)$
```

- Lines end with `\n` or `\r\n`; the `\r` is not part of the line. The last line may or may not
  end with a line break.
- Empty lines are ignored completely. Any other line that isn't valid is **malformed**.
- The **path** of a request is its target up to, not including, the first `?` or `#` (so it can
  be empty, e.g. for the target `?x=1`).

## Output

```json
{
  "requests": 0,
  "malformed": 0,
  "uniqueIps": 0,
  "status": { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, "other": 0 },
  "bytes": 0,
  "topPaths": [{ "path": "/", "requests": 0 }],
  "durationMs": { "p50": 0, "p95": 0, "p99": 0, "max": 0 },
  "hourly": { "2026-09-25T13": 0 },
  "slowest": [{ "path": "/search", "p95": 0, "requests": 0 }]
}
```

Everything is computed over the valid lines only, except `malformed`.

- `requests`: the number of valid lines. `malformed`: the number of malformed lines.
- `uniqueIps`: the number of different client IP strings.
- `status`: valid lines by status code: 200–299 → `2xx`, 300–399 → `3xx`, 400–499 → `4xx`,
  500–599 → `5xx`, anything else → `other`. All five keys are always present.
- `bytes`: the sum of the sizes, with `-` counting as 0.
- `topPaths`: the 10 paths with the most requests, most first; ties by path in ascending
  order, comparing strings by UTF-16 code units (the default for `<` in JavaScript). Fewer than
  10 if there are fewer paths.
- `durationMs`: percentiles of the durations by the nearest-rank method: sort the n durations
  ascending, and the p-th percentile is the value at 1-based position ⌈p / 100 × n⌉. `max` is the
  largest. All four are `null` when there are no valid lines.
- `hourly`: the number of requests in each UTC hour that has any, keyed `YYYY-MM-DDTHH` (from the
  line's own date and time fields, with the month as a number), in ascending order of the keys.
- `slowest`: among the paths with at least 100 requests, the 5 with the highest 95th percentile
  duration (nearest-rank, over that path's own requests), highest first; ties by path ascending.
  Each entry has the path, its p95 and its number of requests. Fewer than 5 if fewer paths
  qualify, and an empty array if none do.

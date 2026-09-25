import { createReadStream } from 'node:fs';

const linePattern = /^(\S+) - - \[(\d{2})\/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) \+0000\] "([A-Z]+) (\S+) HTTP\/1\.[01]" (\d{3}) (\d+|-) (\d+)$/;
const months = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function comparePaths(a, b) {
  return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
}

function percentile(sorted, percent) {
  return sorted[Math.ceil(sorted.length * percent / 100) - 1];
}

// Keep only the best few entries, even when the log contains many distinct paths.
function retainBest(entries, candidate, limit, compare) {
  let index = entries.length;
  while (index > 0 && compare(candidate, entries[index - 1]) < 0) index--;
  if (index >= limit) return;
  entries.splice(index, 0, candidate);
  if (entries.length > limit) entries.pop();
}

async function analyze(filename) {
  let requests = 0;
  let malformed = 0;
  let bytes = 0;
  const ips = new Set();
  const status = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 };
  const paths = new Map();
  const hours = new Map();
  const durations = [];

  function consume(line) {
    if (line.length === 0) return;
    const match = linePattern.exec(line);
    // JavaScript's $ also matches before a final line terminator. Require full consumption.
    if (match === null || match[0].length !== line.length) {
      malformed++;
      return;
    }

    requests++;
    ips.add(match[1]);
    const category = match[10][0];
    if (category >= '2' && category <= '5') status[`${category}xx`]++;
    else status.other++;
    if (match[11] !== '-') bytes += Number(match[11]);

    const duration = Number(match[12]);
    durations.push(duration);
    const target = match[9];
    const delimiter = target.search(/[?#]/);
    const path = delimiter === -1 ? target : target.slice(0, delimiter);
    const pathDurations = paths.get(path);
    if (pathDurations === undefined) paths.set(path, [duration]);
    else pathDurations.push(duration);

    // The format defines validity; do not normalize or reject unusual date fields.
    const hour = `${match[4]}-${months[match[3]]}-${match[2]}T${match[5]}`;
    hours.set(hour, (hours.get(hour) ?? 0) + 1);
  }

  // Decode across chunk boundaries, split only on LF, and remove only CRLF's CR.
  let remainder = '';
  const input = createReadStream(filename, { encoding: 'utf8', highWaterMark: 1024 * 1024 });
  for await (const chunk of input) {
    const text = remainder + chunk;
    let start = 0;
    let end;
    while ((end = text.indexOf('\n', start)) !== -1) {
      const contentEnd = end > start && text.charCodeAt(end - 1) === 13 ? end - 1 : end;
      consume(text.slice(start, contentEnd));
      start = end + 1;
    }
    remainder = text.slice(start);
  }
  consume(remainder);

  // Typed-array sorting is numeric and avoids a JavaScript comparator for the full log.
  const sortedDurations = Float64Array.from(durations).sort();
  const durationMs = requests === 0
    ? { p50: null, p95: null, p99: null, max: null }
    : {
        p50: percentile(sortedDurations, 50),
        p95: percentile(sortedDurations, 95),
        p99: percentile(sortedDurations, 99),
        max: sortedDurations[requests - 1],
      };
  const topPaths = [];
  const slowest = [];
  const byRequests = (a, b) => b.requests - a.requests || comparePaths(a, b);
  const byP95 = (a, b) => b.p95 - a.p95 || comparePaths(a, b);
  for (const [path, values] of paths) {
    retainBest(topPaths, { path, requests: values.length }, 10, byRequests);
    if (values.length >= 100) {
      const sorted = Float64Array.from(values).sort();
      retainBest(slowest, {
        path, p95: percentile(sorted, 95), requests: values.length,
      }, 5, byP95);
    }
  }

  return {
    requests,
    malformed,
    uniqueIps: ips.size,
    status,
    bytes,
    topPaths,
    durationMs,
    hourly: Object.fromEntries([...hours].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
    slowest,
  };
}

if (process.argv.length !== 3) {
  console.error('Usage: node analyze.mjs <path-to-log-file>');
  process.exitCode = 1;
} else {
  try {
    console.log(JSON.stringify(await analyze(process.argv[2])));
  } catch (error) {
    console.error(`Unable to analyze log: ${error.message}`);
    process.exitCode = 1;
  }
}

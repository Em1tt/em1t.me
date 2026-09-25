// Reference solution for B3: stream the file, one regex per line.
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const LINE = /^(\S+) - - \[(\d{2})\/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\/(\d{4}):(\d{2}):(\d{2}):(\d{2}) \+0000\] "([A-Z]+) (\S+) HTTP\/1\.[01]" (\d{3}) (\d+|-) (\d+)$/;
const MONTH = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

let requests = 0;
let malformed = 0;
let bytes = 0;
const ips = new Set();
const status = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, other: 0 };
const hourly = new Map();
const byPath = new Map();
const durations = [];

const rl = createInterface({ input: createReadStream(process.argv[2]), crlfDelay: Infinity });
for await (const raw of rl) {
	const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
	if (line === '') continue;
	const m = LINE.exec(line);
	if (!m) {
		malformed++;
		continue;
	}
	requests++;
	ips.add(m[1]);
	const code = Number(m[10]);
	status[code >= 200 && code < 600 ? `${Math.floor(code / 100)}xx` : 'other']++;
	if (m[11] !== '-') bytes += Number(m[11]);
	const duration = Number(m[12]);
	durations.push(duration);
	const hour = `${m[4]}-${MONTH[m[3]]}-${m[2]}T${m[5]}`;
	hourly.set(hour, (hourly.get(hour) ?? 0) + 1);
	const target = m[9];
	let cut = target.length;
	const q = target.indexOf('?');
	const h = target.indexOf('#');
	if (q >= 0) cut = q;
	if (h >= 0 && h < cut) cut = h;
	const path = target.slice(0, cut);
	let list = byPath.get(path);
	if (!list) byPath.set(path, (list = []));
	list.push(duration);
}

const rank = (sorted, p) => sorted[Math.ceil((p / 100) * sorted.length) - 1];
const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sorted = Float64Array.from(durations).sort();
const paths = [...byPath].map(([path, list]) => ({ path, list }));
const result = {
	requests,
	malformed,
	uniqueIps: ips.size,
	status,
	bytes,
	topPaths: paths
		.sort((a, b) => b.list.length - a.list.length || byName(a.path, b.path))
		.slice(0, 10)
		.map(({ path, list }) => ({ path, requests: list.length })),
	durationMs: requests
		? { p50: rank(sorted, 50), p95: rank(sorted, 95), p99: rank(sorted, 99), max: sorted[sorted.length - 1] }
		: { p50: null, p95: null, p99: null, max: null },
	hourly: Object.fromEntries([...hourly].sort(([a], [b]) => byName(a, b))),
	slowest: paths
		.filter(({ list }) => list.length >= 100)
		.map(({ path, list }) => ({ path, p95: rank(Float64Array.from(list).sort(), 95), requests: list.length }))
		.sort((a, b) => b.p95 - a.p95 || byName(a.path, b.path))
		.slice(0, 5)
};
process.stdout.write(JSON.stringify(result, null, 2) + '\n');

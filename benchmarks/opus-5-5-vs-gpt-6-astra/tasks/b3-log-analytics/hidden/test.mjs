// Hidden tests for B3, the log analyser. Run: node test.mjs <workspace> <out-dir>
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checks } from '../../../tools/harness.mjs';

const [, , workspace, out] = process.argv;
mkdirSync(out, { recursive: true });
const here = fileURLToPath(new URL('.', import.meta.url));
const FIELDS = ['requests', 'malformed', 'uniqueIps', 'status', 'bytes', 'topPaths', 'durationMs', 'hourly', 'slowest'];

// Deep equality that ignores the order of object keys but not of arrays.
const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
const equal = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

function run(file) {
	const started = process.hrtime.bigint();
	const r = spawnSync(process.execPath, ['analyze.mjs', file], { cwd: workspace, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000 });
	const seconds = Number(process.hrtime.bigint() - started) / 1e9;
	let json = null;
	try {
		json = JSON.parse(r.stdout);
	} catch {
		json = null;
	}
	return { json, seconds, code: r.status, stderr: (r.stderr ?? '').slice(0, 500), timedOut: r.error?.code === 'ETIMEDOUT' };
}

const c = checks();
if (!existsSync(join(workspace, 'analyze.mjs'))) {
	writeFileSync(join(out, 'result.json'), JSON.stringify({ passed: 0, total: 12, results: [], note: 'no analyze.mjs' }, null, 2));
	process.exit(0);
}

const sampleWant = JSON.parse(readFileSync(join(here, '..', 'template', 'sample-expected.json'), 'utf8'));
const sample = run(join(here, '..', 'template', 'sample.log'));
await c.check('sample.log matches sample-expected.json', () => (sample.code === 0 && equal(sample.json, sampleWant)) || { code: sample.code, stderr: sample.stderr });

const mediumWant = JSON.parse(readFileSync(join(here, 'data', 'medium-expected.json'), 'utf8'));
const medium = run(join(here, 'data', 'medium.log'));
for (const field of FIELDS) {
	await c.check(`edge-case log: ${field}`, () => (medium.json && equal(medium.json[field], mediumWant[field])) || { got: JSON.stringify(medium.json?.[field])?.slice(0, 300), want: JSON.stringify(mediumWant[field]).slice(0, 300), stderr: medium.stderr });
}

const bigWant = JSON.parse(readFileSync(join(here, 'data', 'big-expected.json'), 'utf8'));
const big = run(join(here, 'data', 'big.log'));
await c.check('2,000,000 lines: every field correct', () => {
	const wrong = FIELDS.filter((f) => !big.json || !equal(big.json[f], bigWant[f]));
	return wrong.length === 0 || { wrong, code: big.code, stderr: big.stderr };
});
await c.check('2,000,000 lines within 30 seconds', () => (big.seconds <= 30 && !big.timedOut && big.code === 0) || { seconds: big.seconds, code: big.code });

const summary = { ...c.summary(), seconds: { sample: sample.seconds, medium: medium.seconds, big: big.seconds } };
writeFileSync(join(out, 'result.json'), JSON.stringify(summary, null, 2));
console.log(`B3: ${summary.passed}/${summary.total} (big file ${big.seconds.toFixed(1)} s)`);

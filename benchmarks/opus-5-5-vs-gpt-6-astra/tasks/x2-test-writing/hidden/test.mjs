// Scores X2 by mutation testing. Run: node test.mjs <workspace> <out-dir>
// Their tests run on the original library, then on each mutant. A mutant is caught when a test
// that passed on the original fails (or the run dies or hangs).
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MUTANTS, mutate } from './mutants.mjs';

const [, , workspace, out] = process.argv;
mkdirSync(out, { recursive: true });
const original = readFileSync(new URL('../template/src/semver.js', import.meta.url), 'utf8');

// Test results by full name, from Node's TAP output.
function run(dir) {
	const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap'], { cwd: dir, encoding: 'utf8', timeout: 90000, maxBuffer: 32 * 1024 * 1024 });
	const results = new Map();
	const stack = [];
	for (const line of (r.stdout ?? '').split(/\r?\n/)) {
		const sub = /^(\s*)# Subtest: (.*)$/.exec(line);
		if (sub) {
			const depth = sub[1].length / 4;
			stack.length = depth;
			stack[depth] = sub[2];
			continue;
		}
		const res = /^(\s*)(not ok|ok) \d+ - (.*?)(?: # (?:SKIP|TODO).*)?$/.exec(line);
		if (res) {
			const depth = res[1].length / 4;
			let name = [...stack.slice(0, depth), res[3]].join(' > ');
			while (results.has(name)) name += ' (again)';
			results.set(name, res[2] === 'ok');
		}
	}
	return { results, timedOut: r.error?.code === 'ETIMEDOUT', code: r.status };
}

// The files in their test/ folder, with the library swapped for a version of it.
function withLibrary(source) {
	const dir = mkdtempSync(join(tmpdir(), 'bench-x2-'));
	cpSync(workspace, dir, { recursive: true, filter: (p) => !p.includes('node_modules') && !p.includes('.git') });
	writeFileSync(join(dir, 'src', 'semver.js'), source);
	return dir;
}

const base = withLibrary(original);
const baseline = run(base);
rmSync(base, { recursive: true, force: true });
const passing = [...baseline.results].filter(([, ok]) => ok).map(([name]) => name);
const failing = [...baseline.results].filter(([, ok]) => !ok).map(([name]) => name);

const results = [];
for (const mutant of MUTANTS) {
	if (passing.length === 0) {
		results.push({ name: `${mutant.id}: ${mutant.what}`, ok: false, detail: 'no passing tests on the original' });
		continue;
	}
	const dir = withLibrary(mutate(original, mutant));
	const r = run(dir);
	rmSync(dir, { recursive: true, force: true });
	const caughtBy = passing.filter((name) => r.results.get(name) !== true);
	const ok = r.timedOut || caughtBy.length > 0;
	results.push({ name: `${mutant.id}: ${mutant.what}`, ok, detail: ok ? `caught by ${r.timedOut ? 'a hang' : caughtBy.slice(0, 2).join('; ')}` : 'survived' });
}

const passed = results.filter((r) => r.ok).length;
const summary = { passed, total: results.length, results, ownTests: { pass: passing.length, fail: failing.length, failing: failing.slice(0, 10) } };
writeFileSync(join(out, 'result.json'), JSON.stringify(summary, null, 2));
console.log(`X2: ${passed}/${results.length} mutants caught (their tests: ${passing.length} pass, ${failing.length} fail on the original)`);

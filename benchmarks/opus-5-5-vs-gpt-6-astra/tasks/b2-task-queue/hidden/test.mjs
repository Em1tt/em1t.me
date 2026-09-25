// Hidden tests for B2, the task queue. Run: node test.mjs <workspace> <out-dir>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , workspace, out] = process.argv;
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lib;
try {
	lib = await import(pathToFileURL(join(workspace, 'src', 'queue.ts')).href);
} catch (error) {
	writeFileSync(join(out, 'result.json'), JSON.stringify({ passed: 0, total: 25, results: [], note: `import failed: ${error.message}` }, null, 2));
	process.exit(0);
}
const { createQueue, TimeoutError, CancelledError } = lib;

const results = [];
async function test(name, fn, limit = 4000) {
	let timer;
	try {
		await Promise.race([fn(), new Promise((_, reject) => (timer = setTimeout(() => reject(new Error(`took over ${limit} ms`)), limit)))]);
		results.push({ name, ok: true });
	} catch (error) {
		results.push({ name, ok: false, detail: String(error?.message ?? error).slice(0, 300) });
	} finally {
		clearTimeout(timer);
	}
}
function assert(condition, message) {
	if (!condition) throw new Error(message);
}
const settle = (p) => p.then((value) => ({ ok: true, value }), (error) => ({ ok: false, error }));
// A task that finishes when its `done` is called.
function gate() {
	let done;
	const promise = new Promise((r) => (done = r));
	return { promise, done };
}

await test('resolves with the task result', async () => {
	const q = createQueue({ concurrency: 2 });
	assert((await q.add(async () => 'ok')) === 'ok', 'wrong value');
});
await test('never runs more than `concurrency` tasks at once', async () => {
	const q = createQueue({ concurrency: 3 });
	let now = 0;
	let max = 0;
	const tasks = Array.from({ length: 10 }, (_, i) =>
		q.add(async () => {
			now++;
			max = Math.max(max, now);
			await sleep(20);
			now--;
			return i;
		})
	);
	const values = await Promise.all(tasks);
	assert(max === 3, `max concurrent ${max}`);
	assert(values.join() === '0,1,2,3,4,5,6,7,8,9', 'values');
});
await test('starts a task before add returns when a slot is free', async () => {
	const q = createQueue({ concurrency: 2 });
	let started = false;
	const g = gate();
	const p = q.add(async () => {
		started = true;
		await g.promise;
	});
	assert(started === true, 'not started synchronously');
	assert(q.running === 1 && q.size === 0, `running ${q.running} size ${q.size}`);
	g.done();
	await p;
});
await test('size and running', async () => {
	const q = createQueue({ concurrency: 1 });
	const g = gate();
	const ps = [q.add(() => g.promise), q.add(async () => 1), q.add(async () => 2)];
	assert(q.running === 1 && q.size === 2, `running ${q.running} size ${q.size}`);
	g.done();
	await Promise.all(ps);
	assert(q.running === 0 && q.size === 0, `after: running ${q.running} size ${q.size}`);
});
await test('priority: highest first', async () => {
	const q = createQueue({ concurrency: 1 });
	const order = [];
	const g = gate();
	const ps = [q.add(() => g.promise)];
	ps.push(q.add(async () => order.push('low'), { priority: 0 }));
	ps.push(q.add(async () => order.push('high'), { priority: 5 }));
	ps.push(q.add(async () => order.push('mid'), { priority: 2 }));
	ps.push(q.add(async () => order.push('negative'), { priority: -1 }));
	g.done();
	await Promise.all(ps);
	assert(order.join() === 'high,mid,low,negative', order.join());
});
await test('equal priorities run in the order added', async () => {
	const q = createQueue({ concurrency: 1 });
	const order = [];
	const g = gate();
	const ps = [q.add(() => g.promise)];
	for (const name of ['a', 'b', 'c', 'd']) ps.push(q.add(async () => order.push(name), { priority: 1 }));
	ps.push(q.add(async () => order.push('e')));
	g.done();
	await Promise.all(ps);
	assert(order.join() === 'a,b,c,d,e', order.join());
});
await test('retries until success', async () => {
	const q = createQueue({ concurrency: 1, retries: 2 });
	let attempts = 0;
	const value = await q.add(async () => {
		attempts++;
		if (attempts < 3) throw new Error(`fail ${attempts}`);
		return 'third time';
	});
	assert(value === 'third time' && attempts === 3, `${value} after ${attempts}`);
});
await test('rejects with the last error when retries run out', async () => {
	const q = createQueue({ concurrency: 1, retries: 2 });
	let attempts = 0;
	const r = await settle(q.add(async () => { attempts++; throw new Error(`fail ${attempts}`); }));
	assert(!r.ok && r.error.message === 'fail 3' && attempts === 3, `${r.error?.message}, ${attempts} attempts`);
});
await test('no retries by default', async () => {
	const q = createQueue({ concurrency: 1 });
	let attempts = 0;
	const r = await settle(q.add(async () => { attempts++; throw new Error('x'); }));
	assert(!r.ok && attempts === 1, `${attempts} attempts`);
});
await test('retryDelay gets the attempt number and is waited', async () => {
	const seen = [];
	const q = createQueue({ concurrency: 1, retries: 2, retryDelay: (n) => { seen.push(n); return n * 40; } });
	const times = [];
	await settle(q.add(async () => { times.push(Date.now()); throw new Error('x'); }));
	assert(seen.join() === '1,2', `attempts ${seen.join()}`);
	assert(times[1] - times[0] >= 35 && times[2] - times[1] >= 75, `gaps ${times[1] - times[0]}, ${times[2] - times[1]}`);
});
await test('a task keeps its slot while waiting to retry', async () => {
	const q = createQueue({ concurrency: 1, retries: 1, retryDelay: () => 150 });
	let first = 0;
	let secondStarted = false;
	const a = q.add(async () => { first++; if (first === 1) throw new Error('once'); return 'a'; });
	const b = q.add(async () => { secondStarted = true; return 'b'; });
	await sleep(60);
	assert(!secondStarted && q.running === 1 && q.size === 1, `second started ${secondStarted}, running ${q.running}, size ${q.size}`);
	assert((await a) === 'a' && (await b) === 'b', 'results');
});
await test('each attempt gets a fresh signal', async () => {
	const q = createQueue({ concurrency: 1, retries: 1 });
	const signals = [];
	await settle(q.add(async (signal) => { signals.push(signal); throw new Error('x'); }));
	assert(signals.length === 2 && signals[0] !== signals[1] && signals.every((s) => s instanceof AbortSignal), 'signals');
});
await test('timeout: rejects with TimeoutError and aborts the signal', async () => {
	const q = createQueue({ concurrency: 1, timeout: 50 });
	let signal;
	const started = Date.now();
	const r = await settle(q.add((s) => { signal = s; return new Promise(() => {}); }));
	const took = Date.now() - started;
	assert(!r.ok && r.error instanceof TimeoutError && r.error.name === 'TimeoutError', `error ${r.error?.name}`);
	assert(signal.aborted && signal.reason instanceof TimeoutError, 'signal not aborted with a TimeoutError');
	assert(took >= 45 && took < 1000, `took ${took}`);
});
await test('a timed-out task frees its slot', async () => {
	const q = createQueue({ concurrency: 1, timeout: 50 });
	q.add(() => new Promise(() => {})).catch(() => {});
	const started = Date.now();
	await q.add(async () => 'next');
	assert(Date.now() - started < 1000, 'next task waited too long');
});
await test('timeouts are retried like failures', async () => {
	const q = createQueue({ concurrency: 1, timeout: 40, retries: 1 });
	let attempts = 0;
	const r = await settle(q.add(() => { attempts++; return new Promise(() => {}); }));
	assert(!r.ok && r.error instanceof TimeoutError && attempts === 2, `${attempts} attempts, ${r.error?.name}`);
});
await test('cancel a waiting task', async () => {
	const q = createQueue({ concurrency: 1 });
	const g = gate();
	const a = q.add(() => g.promise);
	let ran = false;
	const b = settle(q.add(async () => { ran = true; }, { id: 'b' }));
	assert(q.cancel('b') === true, 'cancel returned false');
	assert(q.size === 0, `size ${q.size}`);
	const r = await b;
	g.done();
	await a;
	await sleep(20);
	assert(!r.ok && r.error instanceof CancelledError && r.error.name === 'CancelledError' && !ran, 'not cancelled properly');
});
await test('cancel a running task: aborts, rejects at once, frees the slot', async () => {
	const q = createQueue({ concurrency: 1 });
	let signal;
	const a = settle(q.add((s) => { signal = s; return new Promise(() => {}); }, { id: 'a' }));
	const b = q.add(async () => 'b');
	await sleep(10);
	assert(q.cancel('a') === true, 'cancel returned false');
	const r = await a;
	assert(!r.ok && r.error instanceof CancelledError, `error ${r.error?.name}`);
	assert(signal.aborted && signal.reason instanceof CancelledError, 'signal not aborted with a CancelledError');
	assert((await b) === 'b', 'next task did not run');
});
await test('cancel during a retry wait stops further attempts', async () => {
	const q = createQueue({ concurrency: 1, retries: 3, retryDelay: () => 80 });
	let attempts = 0;
	const a = settle(q.add(async () => { attempts++; throw new Error('x'); }, { id: 'r' }));
	await sleep(30);
	assert(q.cancel('r') === true, 'cancel returned false');
	const r = await a;
	await sleep(200);
	assert(!r.ok && r.error instanceof CancelledError && attempts === 1 && q.running === 0, `${attempts} attempts, running ${q.running}`);
});
await test('cancel unknown or finished ids returns false', async () => {
	const q = createQueue({ concurrency: 1 });
	await q.add(async () => 1, { id: 'done' });
	assert(q.cancel('done') === false && q.cancel('never') === false, 'returned true');
});
await test('duplicate ids throw; finished ids can be reused', async () => {
	const q = createQueue({ concurrency: 1 });
	const g = gate();
	const a = q.add(() => g.promise, { id: 'x' });
	let threw = false;
	try {
		q.add(async () => 1, { id: 'x' });
	} catch (error) {
		threw = error instanceof Error;
	}
	g.done();
	await a;
	const again = await q.add(async () => 'reused', { id: 'x' });
	assert(threw && again === 'reused', `threw ${threw}`);
});
await test('pause and resume', async () => {
	const q = createQueue({ concurrency: 2 });
	q.pause();
	let started = 0;
	const ps = [1, 2, 3].map((n) => q.add(async () => { started++; await sleep(20); return n; }));
	await sleep(40);
	assert(started === 0 && q.size === 3 && q.running === 0, `started ${started}, size ${q.size}`);
	q.resume();
	await sleep(5);
	assert(started === 2 && q.running === 2, `after resume started ${started}, running ${q.running}`);
	assert((await Promise.all(ps)).join() === '1,2,3', 'results');
});
await test('pause lets running tasks finish', async () => {
	const q = createQueue({ concurrency: 1 });
	const a = q.add(async () => { await sleep(30); return 'a'; });
	let bStarted = false;
	q.add(async () => { bStarted = true; });
	q.pause();
	assert((await a) === 'a', 'running task stopped');
	await sleep(40);
	assert(!bStarted && q.size === 1, 'paused queue started a task');
	q.resume();
	await q.onIdle();
	assert(bStarted, 'did not start after resume');
});
await test('onIdle: at once when idle, after work and failures, not while paused', async () => {
	const q = createQueue({ concurrency: 2 });
	const t0 = Date.now();
	await q.onIdle();
	assert(Date.now() - t0 < 50, 'idle queue did not resolve at once');
	let done = 0;
	q.add(async () => { await sleep(30); done++; });
	q.add(async () => { await sleep(10); done++; throw new Error('x'); }).catch(() => {});
	await q.onIdle();
	assert(done === 2 && q.running === 0, `done ${done}`);
	q.pause();
	q.add(async () => 1);
	let idle = false;
	q.onIdle().then(() => (idle = true));
	await sleep(60);
	assert(!idle, 'resolved while paused with a waiting task');
	q.resume();
	await sleep(30);
	assert(idle, 'did not resolve after resume');
});
await test('a synchronous throw rejects the promise, add does not throw', async () => {
	const q = createQueue({ concurrency: 1 });
	let p;
	try {
		p = q.add(() => { throw new Error('sync'); });
	} catch {
		throw new Error('add threw');
	}
	const r = await settle(p);
	assert(!r.ok && r.error.message === 'sync', 'did not reject');
	assert((await q.add(async () => 'after')) === 'after', 'queue stuck after a sync throw');
});
await test('invalid concurrency throws RangeError', async () => {
	for (const concurrency of [0, -1, 1.5, Number.NaN]) {
		let error;
		try {
			createQueue({ concurrency });
		} catch (e) {
			error = e;
		}
		assert(error instanceof RangeError, `concurrency ${concurrency}: ${error?.name}`);
	}
});

const passed = results.filter((r) => r.ok).length;
writeFileSync(join(out, 'result.json'), JSON.stringify({ passed, total: results.length, results }, null, 2));
console.log(`B2: ${passed}/${results.length}`);
process.exit(0);

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CancelledError, createQueue, TimeoutError } from '../src/queue.ts';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

async function flush() {
	for (let i = 0; i < 12; i++) await Promise.resolve();
}

test('validates concurrency and gives error classes their required names', () => {
	for (const concurrency of [0, -1, 0.5, 1.5, NaN, Infinity, -Infinity]) {
		assert.throws(() => createQueue({ concurrency }), RangeError);
	}
	assert.equal(new TimeoutError().name, 'TimeoutError');
	assert.equal(new CancelledError().name, 'CancelledError');
	assert.ok(new TimeoutError() instanceof Error);
	assert.ok(new CancelledError() instanceof Error);
});

test('starts synchronously, limits concurrency, and drains by priority then insertion order', async () => {
	const queue = createQueue({ concurrency: 2 });
	const first = deferred<string>();
	const second = deferred<string>();
	const starts: string[] = [];
	const firstResult = queue.add(() => { starts.push('first'); return first.promise; });
	assert.deepEqual(starts, ['first']);
	assert.equal(queue.running, 1);
	const secondResult = queue.add(() => { starts.push('second'); return second.promise; });
	assert.deepEqual(starts, ['first', 'second']);
	assert.equal(queue.running, 2);
	const queued = [
		queue.add(async () => { starts.push('low'); return 'low'; }, { priority: -5 }),
		queue.add(async () => { starts.push('high-first'); return 'high-first'; }, { priority: 3 }),
		queue.add(async () => { starts.push('default'); return 'default'; }),
		queue.add(async () => { starts.push('high-second'); return 'high-second'; }, { priority: 3 }),
	];
	assert.equal(queue.size, 4);
	assert.equal(queue.running, 2);
	first.resolve('first-result');
	assert.equal(await firstResult, 'first-result');
	assert.deepEqual(await Promise.all(queued), ['low', 'high-first', 'default', 'high-second']);
	assert.deepEqual(starts, ['first', 'second', 'high-first', 'high-second', 'default', 'low']);
	assert.equal(queue.size, 0);
	assert.equal(queue.running, 1);
	second.resolve('second-result');
	assert.equal(await secondResult, 'second-result');
	await queue.onIdle();
	assert.equal(queue.running, 0);
});

test('synchronous task throws reject the returned promise without throwing from add', async () => {
	const queue = createQueue({ concurrency: 1 });
	const failure = new Error('synchronous failure');
	let result!: Promise<never>;
	assert.doesNotThrow(() => {
		result = queue.add(() => { throw failure; });
	});
	await assert.rejects(result, error => error === failure);
	await queue.onIdle();
	assert.equal(queue.running, 0);
});

test('retries hold their running slot, use numbered delays, and get fresh signals', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const failures = [new Error('first'), new Error('second')];
	const delays: number[] = [];
	const signals: AbortSignal[] = [];
	const queue = createQueue({
		concurrency: 1,
		retries: 2,
		retryDelay: attempt => { delays.push(attempt); return attempt * 10; },
	});
	let attempts = 0;
	const result = queue.add(async signal => {
		signals.push(signal);
		attempts++;
		if (attempts <= 2) throw failures[attempts - 1];
		return 42;
	});
	let nextStarted = false;
	const next = queue.add(async () => { nextStarted = true; });
	await flush();
	assert.deepEqual(delays, [1]);
	assert.equal(queue.running, 1);
	assert.equal(queue.size, 1);
	assert.equal(nextStarted, false);
	t.mock.timers.tick(9);
	await flush();
	assert.equal(attempts, 1);
	t.mock.timers.tick(1);
	await flush();
	assert.equal(attempts, 2);
	assert.deepEqual(delays, [1, 2]);
	assert.equal(nextStarted, false);
	t.mock.timers.tick(19);
	await flush();
	assert.equal(attempts, 2);
	t.mock.timers.tick(1);
	assert.equal(await result, 42);
	await next;
	assert.equal(attempts, 3);
	assert.equal(new Set(signals).size, 3);
	assert.ok(signals.every(signal => !signal.aborted));
	await queue.onIdle();
});

test('exhausted retries reject with the final error, including synchronous failures', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const failures = [new Error('first'), new Error('second'), new Error('last')];
	const queue = createQueue({ concurrency: 1, retries: 2, retryDelay: () => 5 });
	let attempts = 0;
	const result = queue.add(() => { throw failures[attempts++]; });
	const rejected = assert.rejects(result, error => error === failures[2]);
	await flush();
	t.mock.timers.tick(5);
	await flush();
	t.mock.timers.tick(5);
	await rejected;
	assert.equal(attempts, 3);
	await queue.onIdle();
});

test('a timeout aborts with its rejection reason and releases a task that ignores abort', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const queue = createQueue({ concurrency: 1, timeout: 10 });
	const ignored = deferred<number>();
	let signal!: AbortSignal;
	const result = queue.add(currentSignal => { signal = currentSignal; return ignored.promise; });
	const rejected = assert.rejects(result, error => {
		assert.ok(error instanceof TimeoutError);
		assert.equal(signal.reason, error);
		return true;
	});
	let followerStarted = false;
	const follower = queue.add(async () => { followerStarted = true; return 'next'; });
	t.mock.timers.tick(9);
	await flush();
	assert.equal(signal.aborted, false);
	assert.equal(followerStarted, false);
	t.mock.timers.tick(1);
	await rejected;
	assert.equal(signal.aborted, true);
	assert.equal(await follower, 'next');
	await queue.onIdle();
	ignored.reject(new Error('late rejection after timeout'));
	await flush();
	assert.equal(queue.running, 0);
});

test('timed-out attempts retry with fresh signals and ignore a stale attempt result', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const queue = createQueue({ concurrency: 1, timeout: 10, retries: 1, retryDelay: () => 3 });
	const oldAttempt = deferred<string>();
	const newAttempt = deferred<string>();
	const signals: AbortSignal[] = [];
	const result = queue.add(signal => {
		signals.push(signal);
		return signals.length === 1 ? oldAttempt.promise : newAttempt.promise;
	});
	let settled = false;
	void result.then(() => { settled = true; });
	t.mock.timers.tick(10);
	await flush();
	assert.ok(signals[0].reason instanceof TimeoutError);
	assert.equal(queue.running, 1);
	t.mock.timers.tick(3);
	await flush();
	assert.equal(signals.length, 2);
	assert.notEqual(signals[0], signals[1]);
	assert.equal(signals[1].aborted, false);
	oldAttempt.resolve('stale');
	await flush();
	assert.equal(settled, false);
	assert.equal(queue.running, 1);
	newAttempt.resolve('fresh');
	assert.equal(await result, 'fresh');
	await queue.onIdle();
	t.mock.timers.tick(100);
	await flush();
	assert.equal(signals[1].aborted, false);
	assert.equal(signals.length, 2);
});

test('cancels waiting tasks without starting them and makes their ids reusable', async () => {
	const queue = createQueue({ concurrency: 1 });
	queue.pause();
	let started = false;
	const result = queue.add(async () => { started = true; }, { id: '' });
	const rejected = assert.rejects(result, CancelledError);
	assert.throws(() => queue.add(async () => 2, { id: '' }), Error);
	assert.equal(queue.size, 1);
	assert.equal(queue.cancel('missing'), false);
	assert.equal(queue.cancel(''), true);
	assert.equal(queue.cancel(''), false);
	await rejected;
	assert.equal(started, false);
	assert.equal(queue.size, 0);
	await queue.onIdle();
	const reused = queue.add(async () => 7, { id: '' });
	queue.resume();
	assert.equal(await reused, 7);
	assert.equal(started, false);
	assert.equal(queue.cancel(''), false);
});

test('cancels running tasks immediately, aborts with the rejection reason, and ignores late failure', async () => {
	const queue = createQueue({ concurrency: 1, retries: 3 });
	const oldAttempt = deferred<number>();
	const nextAttempt = deferred<number>();
	let signal!: AbortSignal;
	let attempts = 0;
	const result = queue.add(currentSignal => {
		signal = currentSignal;
		attempts++;
		return oldAttempt.promise;
	}, { id: 'active' });
	const rejected = assert.rejects(result, error => {
		assert.ok(error instanceof CancelledError);
		assert.equal(signal.reason, error);
		return true;
	});
	assert.throws(() => queue.add(async () => 2, { id: 'active' }), Error);
	let nextStarted = false;
	const next = queue.add(() => { nextStarted = true; return nextAttempt.promise; });
	assert.equal(queue.cancel('active'), true);
	assert.equal(signal.aborted, true);
	assert.equal(nextStarted, true);
	assert.equal(queue.running, 1);
	assert.equal(queue.size, 0);
	const reused = queue.add(async () => 8, { id: 'active' });
	await rejected;
	oldAttempt.reject(new Error('cancelled attempt eventually rejects'));
	await flush();
	assert.equal(attempts, 1);
	assert.equal(queue.running, 1);
	nextAttempt.resolve(9);
	assert.equal(await next, 9);
	assert.equal(await reused, 8);
	await queue.onIdle();
});

test('cancellation during retry backoff aborts the previous signal and prevents more attempts', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const queue = createQueue({ concurrency: 1, retries: 2, retryDelay: () => 50 });
	let attempts = 0;
	let signal!: AbortSignal;
	const result = queue.add(async currentSignal => {
		signal = currentSignal;
		attempts++;
		throw new Error('retry me');
	}, { id: 'retrying' });
	const rejected = assert.rejects(result, CancelledError);
	await flush();
	assert.equal(attempts, 1);
	assert.equal(queue.running, 1);
	assert.equal(queue.size, 0);
	assert.equal(queue.cancel('retrying'), true);
	assert.equal(signal.aborted, true);
	assert.ok(signal.reason instanceof CancelledError);
	await rejected;
	await queue.onIdle();
	t.mock.timers.tick(1000);
	await flush();
	assert.equal(attempts, 1);
	assert.equal(queue.running, 0);
});

test('paused queues keep active retries running and defer all waiting tasks until resume', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const queue = createQueue({ concurrency: 1, retries: 1, retryDelay: () => 10 });
	const first = deferred<number>();
	let attempts = 0;
	const active = queue.add(() => {
		attempts++;
		return attempts === 1 ? first.promise : Promise.resolve(5);
	});
	let waitingStarted = false;
	const waiting = queue.add(async () => { waitingStarted = true; return 6; });
	queue.pause();
	queue.pause();
	first.reject(new Error('first attempt failed'));
	await flush();
	t.mock.timers.tick(10);
	assert.equal(await active, 5);
	assert.equal(attempts, 2);
	assert.equal(waitingStarted, false);
	assert.equal(queue.running, 0);
	assert.equal(queue.size, 1);
	let idle = false;
	const idlePromise = queue.onIdle().then(() => { idle = true; });
	await flush();
	assert.equal(idle, false);
	queue.resume();
	assert.equal(waitingStarted, true);
	queue.resume();
	assert.equal(await waiting, 6);
	await idlePromise;
	assert.equal(idle, true);
});

test('onIdle supports multiple waiters and waits for both running and waiting tasks', async () => {
	const queue = createQueue({ concurrency: 1 });
	await queue.onIdle();
	const first = deferred<void>();
	const second = deferred<void>();
	const firstResult = queue.add(() => first.promise);
	const secondResult = queue.add(() => second.promise);
	let idleCount = 0;
	const idleOne = queue.onIdle().then(() => { idleCount++; });
	const idleTwo = queue.onIdle().then(() => { idleCount++; });
	await flush();
	assert.equal(idleCount, 0);
	first.resolve(undefined);
	await firstResult;
	await flush();
	assert.equal(idleCount, 0);
	assert.equal(queue.running, 1);
	second.resolve(undefined);
	await Promise.all([secondResult, idleOne, idleTwo]);
	assert.equal(idleCount, 2);
	assert.equal(queue.size, 0);
	assert.equal(queue.running, 0);
	await queue.onIdle();
});

test('ids become reusable after a task rejects normally', async () => {
	const queue = createQueue({ concurrency: 1 });
	const failure = new Error('done');
	const result = queue.add(async () => { throw failure; }, { id: 'reusable' });
	await assert.rejects(result, error => error === failure);
	assert.equal(queue.cancel('reusable'), false);
	assert.equal(await queue.add(async () => 'again', { id: 'reusable' }), 'again');
});

test('a task can cancel itself synchronously without being retried', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const queue = createQueue({ concurrency: 1, retries: 2, retryDelay: () => 5, timeout: 10 });
	let attempts = 0;
	let signal!: AbortSignal;
	const result = queue.add(currentSignal => {
		attempts++;
		signal = currentSignal;
		assert.equal(queue.cancel('self'), true);
		return Promise.reject(new Error('failure after self cancellation'));
	}, { id: 'self' });
	await assert.rejects(result, CancelledError);
	assert.ok(signal.reason instanceof CancelledError);
	assert.equal(queue.running, 0);
	assert.equal(await queue.add(async () => 'replacement', { id: 'self' }), 'replacement');
	t.mock.timers.tick(100);
	await flush();
	assert.equal(attempts, 1);
	await queue.onIdle();
});

test('cancelling from the retryDelay callback prevents a retry from being scheduled', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	let attempts = 0;
	let signal!: AbortSignal;
	const queue = createQueue({
		concurrency: 1,
		retries: 2,
		retryDelay: () => {
			assert.equal(queue.cancel('callback'), true);
			return 5;
		},
	});
	const result = queue.add(async currentSignal => {
		signal = currentSignal;
		attempts++;
		throw new Error('first attempt');
	}, { id: 'callback' });
	await assert.rejects(result, CancelledError);
	assert.ok(signal.reason instanceof CancelledError);
	assert.equal(queue.running, 0);
	t.mock.timers.tick(100);
	await flush();
	assert.equal(attempts, 1);
	await queue.onIdle();
});

test('a cancellation abort handler can reenter cancellation and reuse the completed id', async () => {
	const queue = createQueue({ concurrency: 1 });
	const originalAttempt = deferred<void>();
	const replacementAttempt = deferred<void>();
	let replacement!: Promise<void>;
	let replacementSignal!: AbortSignal;
	let replacementStarted = false;
	const original = queue.add(signal => {
		signal.addEventListener('abort', () => {
			assert.equal(queue.cancel('shared'), false);
			replacement = queue.add(currentSignal => {
				replacementStarted = true;
				replacementSignal = currentSignal;
				return replacementAttempt.promise;
			}, { id: 'shared' });
		});
		return originalAttempt.promise;
	}, { id: 'shared' });
	const originalRejected = assert.rejects(original, CancelledError);
	assert.equal(queue.cancel('shared'), true);
	const replacementRejected = assert.rejects(replacement, CancelledError);
	await originalRejected;
	assert.equal(replacementStarted, true);
	assert.equal(queue.running, 1);
	originalAttempt.resolve(undefined);
	await flush();
	assert.equal(queue.running, 1);
	assert.equal(queue.cancel('shared'), true);
	assert.ok(replacementSignal.reason instanceof CancelledError);
	await replacementRejected;
	replacementAttempt.resolve(undefined);
	await queue.onIdle();
});

test('a timeout abort handler can cancel the task and prevent its retry', async t => {
	t.mock.timers.enable({ apis: ['setTimeout'] });
	let attempts = 0;
	let delays = 0;
	const queue = createQueue({
		concurrency: 1,
		timeout: 10,
		retries: 2,
		retryDelay: () => { delays++; return 5; },
	});
	const attempt = deferred<void>();
	let signal!: AbortSignal;
	const result = queue.add(currentSignal => {
		signal = currentSignal;
		attempts++;
		signal.addEventListener('abort', () => {
			assert.ok(signal.reason instanceof TimeoutError);
			assert.equal(queue.cancel('timeout'), true);
		});
		return attempt.promise;
	}, { id: 'timeout' });
	const rejected = assert.rejects(result, CancelledError);
	t.mock.timers.tick(10);
	await rejected;
	assert.equal(queue.running, 0);
	assert.equal(delays, 0);
	t.mock.timers.tick(100);
	await flush();
	assert.equal(attempts, 1);
	attempt.reject(new Error('late ignored failure'));
	await flush();
	await queue.onIdle();
});

test('draining many synchronously self-cancelling tasks does not overflow the stack', async () => {
	const queue = createQueue({ concurrency: 1 });
	queue.pause();
	let started = 0;
	const rejections: Promise<void>[] = [];
	for (let i = 0; i < 10_000; i++) {
		const id = String(i);
		const result = queue.add(async () => {
			started++;
			assert.equal(queue.cancel(id), true);
		}, { id });
		rejections.push(assert.rejects(result, CancelledError));
	}
	assert.equal(queue.size, 10_000);
	queue.resume();
	await Promise.all(rejections);
	await queue.onIdle();
	assert.equal(started, 10_000);
	assert.equal(queue.size, 0);
	assert.equal(queue.running, 0);
});

test('tasks added from inside a starting task begin synchronously when capacity is available', async () => {
	for (const startPaused of [false, true]) {
		const queue = createQueue({ concurrency: 2 });
		const parentAttempt = deferred<void>();
		const childAttempt = deferred<void>();
		let parentStarted = false;
		let childStarted = false;
		let child!: Promise<void>;
		if (startPaused) queue.pause();
		const parent = queue.add(() => {
			parentStarted = true;
			child = queue.add(() => { childStarted = true; return childAttempt.promise; });
			assert.equal(childStarted, true);
			return parentAttempt.promise;
		});
		if (startPaused) {
			assert.equal(parentStarted, false);
			queue.resume();
		}
		assert.equal(parentStarted, true);
		assert.equal(childStarted, true);
		assert.equal(queue.running, 2);
		parentAttempt.resolve(undefined);
		childAttempt.resolve(undefined);
		await Promise.all([parent, child]);
		await queue.onIdle();
	}
});

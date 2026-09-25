import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CancelledError, createQueue, TimeoutError, type QueueOptions } from '../src/queue.ts';

/** Lets every pending promise callback run. */
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

/** A task that never settles and ignores its signal. */
const never = (): Promise<never> => new Promise(() => {});

interface Attempt<T> {
	signal: AbortSignal;
	resolve: (value: T) => void;
	reject: (reason: unknown) => void;
}

/** A task whose attempts the test settles by hand, recorded in the order they start. */
function manualTask<T = unknown>() {
	const attempts: Attempt<T>[] = [];
	const task = (signal: AbortSignal): Promise<T> => {
		const { promise, resolve, reject } = Promise.withResolvers<T>();
		attempts.push({ signal, resolve, reject });
		return promise;
	};
	return { task, attempts };
}

/** A deterministic pseudo-random number generator, so that a failure can be reproduced. */
function seededRandom(seed: number): () => number {
	return () => {
		seed = (seed * 48271) % 2147483647;
		return seed / 2147483647;
	};
}

test('runs a task and returns its result', async () => {
	const queue = createQueue({ concurrency: 1 });
	assert.equal(await queue.add(async () => 42), 42);
});

describe('errors', () => {
	test('TimeoutError and CancelledError are named Error subclasses', () => {
		for (const [ErrorClass, name] of [[TimeoutError, 'TimeoutError'], [CancelledError, 'CancelledError']] as const) {
			const cause = new Error('cause');
			const error = new ErrorClass('message', { cause });
			assert.ok(error instanceof Error);
			assert.equal(error.name, name);
			assert.equal(error.message, 'message');
			assert.equal(error.cause, cause);
			assert.equal(String(new ErrorClass()), name);
		}
	});
});

describe('createQueue', () => {
	test('throws a RangeError unless concurrency is an integer of at least 1', () => {
		for (const concurrency of [0, -1, 1.5, NaN, Infinity, undefined, null, '2']) {
			assert.throws(() => createQueue({ concurrency } as unknown as QueueOptions), RangeError, String(concurrency));
		}
		assert.throws(() => createQueue(undefined as unknown as QueueOptions), RangeError);
		for (const concurrency of [1, 2, 1000]) {
			assert.equal(createQueue({ concurrency }).running, 0);
		}
	});

	test('rejects invalid retries, retryDelay and timeout options', () => {
		for (const retries of [-1, 1.5, NaN]) {
			assert.throws(() => createQueue({ concurrency: 1, retries }), RangeError);
		}
		for (const timeout of [-1, NaN]) {
			assert.throws(() => createQueue({ concurrency: 1, timeout }), RangeError);
		}
		assert.throws(() => createQueue({ concurrency: 1, retryDelay: 10 as never }), TypeError);
		createQueue({ concurrency: 1, retries: Infinity, timeout: 0 });
	});
});

describe('starting tasks', () => {
	test('starts a task before add returns when the queue has room', () => {
		const queue = createQueue({ concurrency: 2 });
		const { task, attempts } = manualTask();
		queue.add(task);
		assert.equal(attempts.length, 1);
		queue.add(task);
		assert.equal(attempts.length, 2);
		queue.add(task);
		assert.equal(attempts.length, 2);
		assert.equal(queue.running, 2);
		assert.equal(queue.size, 1);
	});

	test('runs at most `concurrency` tasks, starting the next as soon as one finishes', async () => {
		const queue = createQueue({ concurrency: 2 });
		const { task, attempts } = manualTask<number>();
		const results = [1, 2, 3, 4, 5].map(() => queue.add(task));
		assert.equal(attempts.length, 2);
		assert.deepEqual([queue.running, queue.size], [2, 3]);

		attempts[1].resolve(2);
		assert.equal(await results[1], 2);
		assert.equal(attempts.length, 3);
		assert.deepEqual([queue.running, queue.size], [2, 2]);

		attempts[0].resolve(1);
		attempts[2].resolve(3);
		await results[2];
		assert.equal(attempts.length, 5);
		assert.deepEqual([queue.running, queue.size], [2, 0]);

		attempts[3].resolve(4);
		attempts[4].resolve(5);
		assert.deepEqual(await Promise.all(results), [1, 2, 3, 4, 5]);
		assert.deepEqual([queue.running, queue.size], [0, 0]);
	});

	test('starts waiting tasks by priority, highest first, then in the order they were added', async () => {
		const queue = createQueue({ concurrency: 1 });
		const started: string[] = [];
		const task = (name: string) => async () => {
			started.push(name);
		};
		queue.pause();
		queue.add(task('a'));
		queue.add(task('b'), { priority: -1 });
		queue.add(task('c'), { priority: 2 });
		queue.add(task('d'), { priority: 0 });
		queue.add(task('e'), { priority: 2 });
		queue.add(task('f'), { priority: -5 });
		queue.add(task('g'), { priority: 1.5 });
		queue.resume();
		await queue.onIdle();
		assert.deepEqual(started, ['c', 'e', 'g', 'a', 'd', 'b', 'f']);
	});

	test('orders tasks that are added while the queue is full', async () => {
		const queue = createQueue({ concurrency: 1 });
		const started: string[] = [];
		const { task, attempts } = manualTask();
		queue.add(task);
		for (const [name, priority] of [['low', -1], ['high', 1], ['default', undefined], ['high 2', 1]] as const) {
			queue.add(async () => void started.push(name), { priority });
		}
		attempts[0].resolve(undefined);
		await queue.onIdle();
		assert.deepEqual(started, ['high', 'high 2', 'default', 'low']);
	});

	test('keeps to priority order through any mix of adds, cancels and completions', async () => {
		const concurrency = 3;
		const random = seededRandom(20260925);
		const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
		const queue = createQueue({ concurrency });
		const finishers = new Map<string, () => void>();
		const started: string[] = [];

		// A model of what the queue should be doing.
		const running = new Set<string>();
		const waiting: { id: string; priority: number }[] = []; // in the order they were added
		const expected: string[] = [];
		const startInModel = () => {
			while (running.size < concurrency && waiting.length > 0) {
				let best = 0;
				for (let i = 1; i < waiting.length; i++) {
					if (waiting[i].priority > waiting[best].priority) best = i;
				}
				const [{ id }] = waiting.splice(best, 1);
				running.add(id);
				expected.push(id);
			}
		};

		let mostWaiting = 0;
		for (let step = 0; step < 3000; step++) {
			// Cumulative odds of adding, cancelling a waiting task and finishing a running one (the rest
			// cancels a running one). The queue builds up at first, so that plenty of tasks wait, then drains.
			const [add, cancelWaiting, finish] = step < 2000 ? [0.6, 0.8, 0.95] : [0.2, 0.4, 0.85];
			const action = random();
			if (action < add) {
				const id = `task ${step}`;
				const priority = Math.floor(random() * 7) - 3;
				const task = () =>
					new Promise<void>((resolve) => {
						started.push(id);
						finishers.set(id, resolve);
					});
				queue.add(task, { id, priority }).catch(() => {});
				waiting.push({ id, priority });
			} else if (action < cancelWaiting && waiting.length > 0) {
				const { id } = pick(waiting);
				assert.equal(queue.cancel(id), true);
				waiting.splice(waiting.findIndex((task) => task.id === id), 1);
			} else if (action < finish && running.size > 0) {
				const id = pick([...running]);
				finishers.get(id)!();
				await flush();
				running.delete(id);
			} else if (running.size > 0) {
				const id = pick([...running]);
				assert.equal(queue.cancel(id), true);
				running.delete(id);
			}
			startInModel();
			assert.equal(queue.running, running.size);
			assert.equal(queue.size, waiting.length);
			assert.deepEqual(started, expected);
			mostWaiting = Math.max(mostWaiting, waiting.length);
		}
		assert.ok(mostWaiting > 100, `only ${mostWaiting} tasks waited at once`);
		assert.ok(expected.length > 500, `only ${expected.length} tasks started`);
	});

	test('keeps to priority order when many waiting tasks are added and cancelled', async () => {
		const random = seededRandom(42);
		const queue = createQueue({ concurrency: 1 });
		const started: number[] = [];
		const waiting: { index: number; priority: number }[] = [];
		queue.pause();
		for (let index = 0; index < 2000; index++) {
			const priority = Math.floor(random() * 20) - 10;
			queue.add(async () => void started.push(index), { id: String(index), priority }).catch(() => {});
			waiting.push({ index, priority });
			if (random() < 0.4) {
				const [cancelled] = waiting.splice(Math.floor(random() * waiting.length), 1);
				assert.equal(queue.cancel(String(cancelled.index)), true);
			}
		}
		assert.equal(queue.size, waiting.length);
		queue.resume();
		await queue.onIdle();
		const expected = waiting.sort((a, b) => b.priority - a.priority || a.index - b.index).map(({ index }) => index);
		assert.deepEqual(started, expected);
	});

	test('treats a task function that throws synchronously as a failed attempt', async () => {
		const queue = createQueue({ concurrency: 1, retries: 1 });
		let calls = 0;
		const result = queue.add(() => {
			calls++;
			if (calls === 1) throw new Error('sync failure');
			return Promise.resolve('ok');
		});
		assert.equal(await result, 'ok');
		assert.equal(calls, 2);

		const error = new Error('always fails');
		const failing = createQueue({ concurrency: 1 }).add(() => {
			throw error;
		});
		await assert.rejects(failing, (reason) => reason === error);
	});

	test('rejects with the error of a task that fails', async () => {
		const queue = createQueue({ concurrency: 1 });
		const error = new Error('failed');
		await assert.rejects(queue.add(() => Promise.reject(error)), (reason) => reason === error);
		assert.deepEqual([queue.running, queue.size], [0, 0]);
	});

	test('add throws for a task that is not a function or a priority that is not a number', () => {
		const queue = createQueue({ concurrency: 1 });
		assert.throws(() => queue.add(42 as never), TypeError);
		assert.throws(() => queue.add(async () => {}, { priority: NaN }), TypeError);
		assert.throws(() => queue.add(async () => {}, { priority: '1' as never }), TypeError);
		assert.deepEqual([queue.running, queue.size], [0, 0]);
	});

	test('methods work without the queue as `this`', async () => {
		const { add, pause, resume, onIdle } = createQueue({ concurrency: 1 });
		pause();
		const result = add(async () => 'ok');
		setTimeout(resume, 1);
		assert.equal(await result, 'ok');
		await onIdle();
	});
});

describe('retries', () => {
	test('makes a single attempt by default', async () => {
		const queue = createQueue({ concurrency: 1 });
		let calls = 0;
		await assert.rejects(queue.add(async () => {
			calls++;
			throw new Error('failed');
		}));
		assert.equal(calls, 1);
	});

	test('tries a failing task `retries` more times, then rejects with the last error', async () => {
		const queue = createQueue({ concurrency: 1, retries: 2 });
		let calls = 0;
		await assert.rejects(queue.add(async () => {
			throw new Error(`failure ${++calls}`);
		}), { message: 'failure 3' });
		assert.equal(calls, 3);
	});

	test('resolves with the result of the first attempt that succeeds', async () => {
		const queue = createQueue({ concurrency: 1, retries: 5 });
		let calls = 0;
		const result = await queue.add(async () => {
			if (++calls < 3) throw new Error('not yet');
			return calls;
		});
		assert.equal(result, 3);
		assert.equal(calls, 3);
	});

	test('waits retryDelay(attempt) milliseconds before each new attempt', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		const delays: number[] = [];
		const retryDelay = (attempt: number) => {
			delays.push(attempt);
			return attempt * 100;
		};
		const queue = createQueue({ concurrency: 1, retries: 2, retryDelay });
		const { task, attempts } = manualTask();
		const result = queue.add(task);

		attempts[0].reject(new Error('first'));
		await flush();
		assert.deepEqual(delays, [1]);
		t.mock.timers.tick(99);
		assert.equal(attempts.length, 1);
		t.mock.timers.tick(1);
		assert.equal(attempts.length, 2);

		attempts[1].reject(new Error('second'));
		await flush();
		assert.deepEqual(delays, [1, 2]);
		t.mock.timers.tick(199);
		assert.equal(attempts.length, 2);
		t.mock.timers.tick(1);
		assert.equal(attempts.length, 3);

		attempts[2].reject(new Error('third'));
		await assert.rejects(result, { message: 'third' });
		assert.deepEqual(delays, [1, 2]);
	});

	test('keeps its place, and counts as running, while waiting to retry', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		const queue = createQueue({ concurrency: 1, retries: 1, retryDelay: () => 50 });
		const { task, attempts } = manualTask<string>();
		const first = queue.add(task);
		let secondStarted = false;
		const second = queue.add(async () => {
			secondStarted = true;
		});

		attempts[0].reject(new Error('retry me'));
		await flush();
		assert.deepEqual([queue.running, queue.size, secondStarted], [1, 1, false]);
		t.mock.timers.tick(50);
		assert.equal(attempts.length, 2);
		assert.equal(secondStarted, false);

		attempts[1].resolve('done');
		assert.equal(await first, 'done');
		assert.equal(secondStarted, true);
		await second;
	});

	test('gives each attempt a fresh signal, and leaves the signals of failed attempts alone', async () => {
		const queue = createQueue({ concurrency: 1, retries: 2 });
		const signals: AbortSignal[] = [];
		await assert.rejects(queue.add(async (signal) => {
			signals.push(signal);
			throw new Error('failed');
		}));
		assert.equal(new Set(signals).size, 3);
		assert.ok(signals.every((signal) => !signal.aborted));
	});

	test('keeps retrying while the queue is paused', async () => {
		const queue = createQueue({ concurrency: 1, retries: 1 });
		const { task, attempts } = manualTask<string>();
		const result = queue.add(task);
		queue.pause();
		attempts[0].reject(new Error('failed'));
		await flush();
		assert.equal(attempts.length, 2);
		attempts[1].resolve('ok');
		assert.equal(await result, 'ok');
	});

	test('rejects with the error thrown by retryDelay', async () => {
		const error = new Error('bad delay');
		const queue = createQueue({
			concurrency: 1,
			retries: 3,
			retryDelay: () => {
				throw error;
			},
		});
		let calls = 0;
		await assert.rejects(queue.add(async () => {
			calls++;
			throw new Error('failed');
		}), (reason) => reason === error);
		assert.equal(calls, 1);
		assert.deepEqual([queue.running, queue.size], [0, 0]);
	});
});

describe('timeouts', () => {
	test('fails an attempt that outlasts the timeout, even if the task ignores its signal', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		const queue = createQueue({ concurrency: 1, timeout: 100 });
		const { task, attempts } = manualTask();
		const result = queue.add(task);
		const next = queue.add(async () => 'next');

		t.mock.timers.tick(99);
		const { signal } = attempts[0];
		assert.equal(signal.aborted, false);
		t.mock.timers.tick(1);
		assert.ok(signal.reason instanceof TimeoutError);
		assert.equal(queue.size, 0); // the next task started straight away
		await assert.rejects(result, (error) => error === signal.reason);
		assert.equal(await next, 'next');
	});

	test('times out with real timers', async () => {
		const queue = createQueue({ concurrency: 1, timeout: 20 });
		await assert.rejects(queue.add(never), TimeoutError);
		assert.equal(await queue.add(async () => 'quick'), 'quick');
	});

	test('retries a timed-out attempt, and ignores its late result', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		const queue = createQueue({ concurrency: 1, timeout: 100, retries: 1 });
		const { task, attempts } = manualTask<string>();
		const result = queue.add(task);
		t.mock.timers.tick(100);
		assert.equal(attempts.length, 2);
		assert.equal(attempts[1].signal.aborted, false);

		attempts[0].resolve('late');
		await flush();
		assert.equal(queue.running, 1);
		attempts[1].resolve('fresh');
		assert.equal(await result, 'fresh');
	});

	test('rejects with the last TimeoutError when every attempt times out', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		const queue = createQueue({ concurrency: 1, timeout: 10, retries: 2 });
		const { task, attempts } = manualTask();
		const result = queue.add(task);
		t.mock.timers.tick(10);
		t.mock.timers.tick(10);
		t.mock.timers.tick(10);
		await assert.rejects(result, (error) => error instanceof TimeoutError && error === attempts[2].signal.reason);
		assert.equal(attempts.length, 3);
		assert.ok(attempts.every(({ signal }) => signal.reason instanceof TimeoutError));
		for (const attempt of attempts) attempt.reject(attempt.signal.reason); // late rejections are ignored
		await flush();
	});

	test('times each attempt on its own, not counting retry delays', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		const queue = createQueue({ concurrency: 1, timeout: 100, retries: 1, retryDelay: () => 500 });
		const { task, attempts } = manualTask<string>();
		const result = queue.add(task);
		t.mock.timers.tick(60);
		attempts[0].reject(new Error('failed'));
		await flush();
		t.mock.timers.tick(500);
		assert.equal(attempts.length, 2);
		t.mock.timers.tick(99);
		attempts[1].resolve('ok');
		assert.equal(await result, 'ok');
		t.mock.timers.tick(1000);
		assert.ok(attempts.every(({ signal }) => !signal.aborted));
	});

	test('does not time out early when the timeout is too long for setTimeout', async () => {
		for (const timeout of [2 ** 32, Infinity]) {
			const queue = createQueue({ concurrency: 1, timeout });
			const result = queue.add(() => new Promise((resolve) => setTimeout(resolve, 20, 'ok')));
			assert.equal(await result, 'ok');
		}
	});

	test('waits out timeouts longer than setTimeout supports', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		const queue = createQueue({ concurrency: 1, timeout: 2 ** 31 });
		const result = queue.add(never);
		t.mock.timers.tick(2 ** 31 - 1);
		assert.equal(queue.running, 1);
		t.mock.timers.tick(1);
		await assert.rejects(result, TimeoutError);
	});

	test('copes with a task that its abort listener cancels while it times out', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		for (const retries of [0, 3]) {
			let delays = 0;
			const queue = createQueue({ concurrency: 1, timeout: 10, retries, retryDelay: () => delays++ });
			let calls = 0;
			let replacement: Promise<unknown> | undefined;
			const result = queue.add((signal) => {
				calls++;
				signal.addEventListener('abort', () => {
					queue.cancel('task');
					replacement = queue.add(never, { id: 'task' });
				});
				return never();
			}, { id: 'task' });
			t.mock.timers.tick(10);
			await assert.rejects(result, CancelledError);
			assert.deepEqual([calls, delays, queue.running], [1, 0, 1]);
			assert.equal(queue.cancel('task'), true); // the replacement still owns the id
			await assert.rejects(replacement!, CancelledError);
		}
	});

	test('clears its timers once they are no longer needed', async () => {
		const activeTimers = () => process.getActiveResourcesInfo().filter((type) => type === 'Timeout').length;
		const before = activeTimers();
		const queue = createQueue({ concurrency: 1, timeout: 60_000, retries: 1 });
		let calls = 0;
		const result = await queue.add(async () => {
			if (++calls === 1) throw new Error('first attempt fails');
			return 'ok';
		});
		assert.equal(result, 'ok');
		assert.equal(activeTimers(), before);
	});
});

describe('cancel', () => {
	test('removes a waiting task, which never starts', async () => {
		const queue = createQueue({ concurrency: 1 });
		const { task, attempts } = manualTask();
		queue.add(task);
		let started = false;
		const cancelled = queue.add(async () => {
			started = true;
		}, { id: 'waiting' });
		assert.equal(queue.size, 1);
		assert.equal(queue.cancel('waiting'), true);
		assert.equal(queue.size, 0);
		await assert.rejects(cancelled, CancelledError);

		attempts[0].resolve(undefined);
		await queue.onIdle();
		assert.equal(started, false);
	});

	test('aborts a running task, rejects its promise straight away and frees its place', async () => {
		const queue = createQueue({ concurrency: 1, retries: 3 });
		const { task, attempts } = manualTask();
		const cancelled = queue.add(task, { id: 'running' });
		let nextStarted = false;
		const next = queue.add(async () => {
			nextStarted = true;
		});

		assert.equal(queue.cancel('running'), true);
		const { signal } = attempts[0];
		assert.ok(signal.reason instanceof CancelledError);
		assert.equal(nextStarted, true);
		assert.deepEqual([queue.running, queue.size], [1, 0]);
		await assert.rejects(cancelled, (error) => error === signal.reason);
		await next;
		assert.equal(attempts.length, 1);
	});

	test('stops a task that is waiting to retry', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		const queue = createQueue({ concurrency: 1, retries: 3, retryDelay: () => 1000 });
		const { task, attempts } = manualTask();
		const result = queue.add(task, { id: 'retrying' });
		attempts[0].reject(new Error('failed'));
		await flush();
		assert.equal(queue.running, 1);

		assert.equal(queue.cancel('retrying'), true);
		assert.equal(queue.running, 0);
		assert.ok(attempts[0].signal.reason instanceof CancelledError);
		await assert.rejects(result, CancelledError);
		t.mock.timers.tick(5000);
		assert.equal(attempts.length, 1);
	});

	test('stops a task that retryDelay cancels', async () => {
		const queue = createQueue({
			concurrency: 1,
			retries: 3,
			retryDelay: () => {
				queue.cancel('task');
				return 0;
			},
		});
		let calls = 0;
		await assert.rejects(queue.add(async () => {
			calls++;
			throw new Error('failed');
		}, { id: 'task' }), CancelledError);
		assert.equal(calls, 1);
	});

	test('ignores whatever a cancelled task does afterwards', async () => {
		const queue = createQueue({ concurrency: 1 });
		const { task, attempts } = manualTask<string>();
		const resolving = queue.add(task, { id: 'resolving' });
		queue.cancel('resolving');
		attempts[0].resolve('too late');
		await assert.rejects(resolving, CancelledError);

		const rejecting = queue.add((signal) => new Promise((_, reject) => {
			signal.addEventListener('abort', () => reject(signal.reason));
		}), { id: 'rejecting' });
		queue.cancel('rejecting');
		await assert.rejects(rejecting, CancelledError);
		await flush();
		assert.deepEqual([queue.running, queue.size], [0, 0]);
	});

	test('copes with a task that cancels itself while starting', async () => {
		const queue = createQueue({ concurrency: 1 });
		const started: string[] = [];
		const result = queue.add(async () => {
			started.push('self');
			queue.add(async () => void started.push('child'));
			queue.cancel('self');
			return 'ignored';
		}, { id: 'self' });
		await assert.rejects(result, CancelledError);
		await queue.onIdle();
		assert.deepEqual(started, ['self', 'child']);
	});

	test('returns false when no unfinished task has the id', async () => {
		const queue = createQueue({ concurrency: 1 });
		assert.equal(queue.cancel('unknown'), false);
		await queue.add(async () => 'done', { id: 'done' });
		assert.equal(queue.cancel('done'), false);
		await assert.rejects(queue.add(() => Promise.reject(new Error('failed')), { id: 'failed' }));
		assert.equal(queue.cancel('failed'), false);
		const cancelled = queue.add(never, { id: 'cancelled' });
		assert.equal(queue.cancel('cancelled'), true);
		assert.equal(queue.cancel('cancelled'), false);
		await assert.rejects(cancelled, CancelledError);
	});

	test('does not report the rejection of a cancelled task as unhandled', async () => {
		const unhandled: unknown[] = [];
		const onUnhandled = (reason: unknown) => void unhandled.push(reason);
		process.on('unhandledRejection', onUnhandled);
		try {
			const queue = createQueue({ concurrency: 1 });
			queue.add(never, { id: 'running' });
			queue.add(never, { id: 'waiting' });
			queue.cancel('waiting');
			queue.cancel('running');
			await flush();
			await flush();
		} finally {
			process.off('unhandledRejection', onUnhandled);
		}
		assert.deepEqual(unhandled, []);
	});
});

describe('ids', () => {
	test('add throws synchronously for an id that a waiting or running task has', () => {
		const queue = createQueue({ concurrency: 1 });
		const { task } = manualTask();
		queue.add(task, { id: 'running' });
		queue.add(task, { id: 'waiting' });
		queue.add(task, { id: '' });
		assert.throws(() => queue.add(task, { id: 'running' }), Error);
		assert.throws(() => queue.add(task, { id: 'waiting' }), Error);
		assert.throws(() => queue.add(task, { id: '' }), Error);
		assert.deepEqual([queue.running, queue.size], [1, 2]);
		queue.add(task);
		queue.add(task);
		assert.equal(queue.size, 4);
	});

	test('an id can be used again once its task has finished, however it finished', async (t) => {
		t.mock.timers.enable({ apis: ['setTimeout'] });
		const queue = createQueue({ concurrency: 1, timeout: 100 });

		await queue.add(async () => 'done', { id: 'id' });
		await assert.rejects(queue.add(() => Promise.reject(new Error('failed')), { id: 'id' }));
		const cancelled = queue.add(never, { id: 'id' });
		queue.cancel('id');
		const timedOut = queue.add(never, { id: 'id' });
		t.mock.timers.tick(100);
		assert.equal(await queue.add(async () => 'reused', { id: 'id' }), 'reused');

		await assert.rejects(cancelled, CancelledError);
		await assert.rejects(timedOut, TimeoutError);
	});
});

describe('pause and resume', () => {
	test('pause stops new tasks from starting while running ones carry on', async () => {
		const queue = createQueue({ concurrency: 2 });
		const { task, attempts } = manualTask<number>();
		const first = queue.add(task);
		queue.pause();
		const second = queue.add(task);
		assert.equal(attempts.length, 1);
		assert.deepEqual([queue.running, queue.size], [1, 1]);

		attempts[0].resolve(1);
		assert.equal(await first, 1);
		await flush();
		assert.equal(attempts.length, 1);
		assert.deepEqual([queue.running, queue.size], [0, 1]);

		queue.resume();
		assert.equal(attempts.length, 2);
		attempts[1].resolve(2);
		assert.equal(await second, 2);
	});

	test('resume starts waiting tasks up to the concurrency limit', () => {
		const queue = createQueue({ concurrency: 2 });
		const { task, attempts } = manualTask();
		queue.pause();
		for (let i = 0; i < 5; i++) queue.add(task);
		assert.deepEqual([attempts.length, queue.running, queue.size], [0, 0, 5]);
		queue.resume();
		assert.deepEqual([attempts.length, queue.running, queue.size], [2, 2, 3]);
	});
});

describe('onIdle', () => {
	test('resolves right away when the queue is idle', async () => {
		const queue = createQueue({ concurrency: 1 });
		let idle = false;
		queue.onIdle().then(() => {
			idle = true;
		});
		await Promise.resolve();
		assert.equal(idle, true);

		queue.pause();
		await queue.onIdle();
	});

	test('resolves once no task is waiting or running, however the tasks finished', async () => {
		const queue = createQueue({ concurrency: 2, retries: 1 });
		const { task, attempts } = manualTask();
		const settled = Promise.allSettled([queue.add(task), queue.add(task, { id: 'cancelled' }), queue.add(task)]);
		let idle = false;
		const onIdle = queue.onIdle().then(() => {
			idle = true;
		});

		attempts[0].resolve('ok');
		queue.cancel('cancelled');
		await flush();
		assert.equal(idle, false);
		attempts[2].reject(new Error('failed'));
		await flush();
		assert.equal(idle, false);
		attempts[3].reject(new Error('failed again'));
		await onIdle;
		assert.deepEqual([queue.running, queue.size], [0, 0]);
		assert.deepEqual((await settled).map(({ status }) => status), ['fulfilled', 'rejected', 'rejected']);
	});

	test('does not resolve while a paused queue has waiting tasks', async () => {
		const queue = createQueue({ concurrency: 1 });
		queue.pause();
		const result = queue.add(async () => 'done');
		let idle = false;
		queue.onIdle().then(() => {
			idle = true;
		});
		await flush();
		assert.equal(idle, false);

		queue.resume();
		assert.equal(await result, 'done');
		await flush();
		assert.equal(idle, true);
	});

	test('resolves when the last waiting task of a paused queue is cancelled', async () => {
		const queue = createQueue({ concurrency: 1 });
		queue.pause();
		const result = queue.add(async () => {}, { id: 'only' });
		const idle = queue.onIdle();
		queue.cancel('only');
		await idle;
		await assert.rejects(result, CancelledError);
	});
});

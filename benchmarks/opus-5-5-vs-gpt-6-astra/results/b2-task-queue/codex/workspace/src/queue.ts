export class TimeoutError extends Error {
	name = 'TimeoutError';
}

export class CancelledError extends Error {
	name = 'CancelledError';
}

export interface Queue {
	add<T>(task: (signal: AbortSignal) => Promise<T>, options?: { priority?: number; id?: string }): Promise<T>;
	pause(): void;
	resume(): void;
	cancel(id: string): boolean;
	onIdle(): Promise<void>;
	readonly size: number;
	readonly running: number;
}

interface Entry {
	task: (signal: AbortSignal) => Promise<unknown>;
	resolve: (value: unknown) => void;
	reject: (error: unknown) => void;
	id: string | undefined;
	priority: number;
	state: 'waiting' | 'running' | 'finished';
	attempt: number;
	controller?: AbortController;
	clearAttempt?: () => void;
	retryTimer?: ReturnType<typeof setTimeout>;
}

type Outcome = { ok: true; value: unknown } | { ok: false; error: unknown };

export function createQueue(options: {
	concurrency: number;
	retries?: number;
	retryDelay?: (attempt: number) => number;
	timeout?: number;
}): Queue {
	const { concurrency, retries = 0, retryDelay = () => 0, timeout } = options;
	if (!Number.isInteger(concurrency) || concurrency < 1) {
		throw new RangeError('concurrency must be an integer of at least 1');
	}

	const waiting: Entry[] = [];
	const ids = new Map<string, Entry>();
	const idleWaiters = new Set<() => void>();
	let running = 0;
	let paused = false;
	let drainDepth = 0;

	function drain(reentrant = false): void {
		// Self-cancellation leaves draining to the current loop. Nested add/resume
		// calls can still start work synchronously when there is capacity.
		if (drainDepth > 0 && !reentrant) return;
		drainDepth++;
		try {
			while (!paused && running < concurrency && waiting.length > 0) {
				const entry = waiting.shift()!;
				entry.state = 'running';
				running++;
				startAttempt(entry);
			}
		} finally {
			drainDepth--;
		}
		if (running === 0 && waiting.length === 0) {
			for (const resolve of idleWaiters) resolve();
			idleWaiters.clear();
		}
	}

	function finish(entry: Entry, outcome: Outcome, cancellation?: CancelledError): void {
		if (entry.state === 'finished') return;
		if (entry.state === 'waiting') {
			waiting.splice(waiting.indexOf(entry), 1);
		} else {
			running--;
		}
		// Retire the entry before aborting: abort listeners can call back into the queue.
		entry.state = 'finished';
		entry.clearAttempt?.();
		if (entry.retryTimer !== undefined) {
			clearTimeout(entry.retryTimer);
			entry.retryTimer = undefined;
		}
		if (entry.id !== undefined) ids.delete(entry.id);
		if (outcome.ok) entry.resolve(outcome.value);
		else entry.reject(outcome.error);
		if (cancellation) entry.controller?.abort(cancellation);
		drain();
	}

	function failed(entry: Entry, error: unknown): void {
		if (entry.state !== 'running') return;
		if (entry.attempt > retries) {
			finish(entry, { ok: false, error });
			return;
		}

		let delay: number;
		try {
			delay = retryDelay(entry.attempt);
		} catch (delayError) {
			finish(entry, { ok: false, error: delayError });
			return;
		}
		// A user-supplied retryDelay may cancel this entry synchronously.
		if (entry.state !== 'running') return;
		entry.retryTimer = setTimeout(() => {
			entry.retryTimer = undefined;
			startAttempt(entry);
		}, delay);
	}

	function startAttempt(entry: Entry): void {
		if (entry.state !== 'running') return;
		const controller = new AbortController();
		entry.controller = controller;
		entry.attempt++;
		let settled = false;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const clearAttempt = () => {
			settled = true;
			if (timer !== undefined) clearTimeout(timer);
			entry.clearAttempt = undefined;
		};
		entry.clearAttempt = clearAttempt;

		if (timeout !== undefined) {
			timer = setTimeout(() => {
				if (settled) return;
				// Ignore any resolution or rejection triggered by the abort listener.
				clearAttempt();
				const error = new TimeoutError('Task attempt timed out');
				controller.abort(error);
				failed(entry, error);
			}, timeout);
		}

		let result: Promise<unknown>;
		try {
			// Invoke directly so an available task starts before add returns.
			result = Promise.resolve(entry.task(controller.signal));
		} catch (error) {
			result = Promise.reject(error);
		}
		result.then(
			value => {
				if (settled) return;
				clearAttempt();
				finish(entry, { ok: true, value });
			},
			error => {
				if (settled) return;
				clearAttempt();
				failed(entry, error);
			},
		);
	}

	return {
		add<T>(task: (signal: AbortSignal) => Promise<T>, options?: { priority?: number; id?: string }): Promise<T> {
			const id = options?.id;
			if (id !== undefined && ids.has(id)) {
				throw new Error(`An unfinished task already has id "${id}"`);
			}

			let resolve!: (value: T | PromiseLike<T>) => void;
			let reject!: (error: unknown) => void;
			const result = new Promise<T>((onResolve, onReject) => {
				resolve = onResolve;
				reject = onReject;
			});
			const entry: Entry = {
				task,
				resolve: value => resolve(value as T),
				reject,
				id,
				priority: options?.priority ?? 0,
				state: 'waiting',
				attempt: 0,
			};
			if (id !== undefined) ids.set(id, entry);
			const index = waiting.findIndex(other => other.priority < entry.priority);
			waiting.splice(index === -1 ? waiting.length : index, 0, entry);
			drain(true);
			return result;
		},
		pause() {
			paused = true;
		},
		resume() {
			paused = false;
			drain(true);
		},
		cancel(id) {
			const entry = ids.get(id);
			if (!entry) return false;
			const error = new CancelledError('Task cancelled');
			finish(entry, { ok: false, error }, error);
			return true;
		},
		onIdle() {
			if (running === 0 && waiting.length === 0) return Promise.resolve();
			return new Promise<void>(resolve => idleWaiters.add(resolve));
		},
		get size() {
			return waiting.length;
		},
		get running() {
			return running;
		},
	};
}

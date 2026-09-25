// Reference solution for B2.

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

type Job = {
	task: (signal: AbortSignal) => Promise<unknown>;
	priority: number;
	order: number;
	id?: string;
	resolve: (value: unknown) => void;
	reject: (error: unknown) => void;
	controller?: AbortController;
	finished: boolean;
	timer?: ReturnType<typeof setTimeout>;
};

export function createQueue(options: {
	concurrency: number;
	retries?: number;
	retryDelay?: (attempt: number) => number;
	timeout?: number;
}): Queue {
	const { concurrency, retries = 0, retryDelay = () => 0, timeout } = options;
	if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('concurrency must be an integer of at least 1');
	const waiting: Job[] = [];
	const active = new Set<Job>();
	let paused = false;
	let counter = 0;
	let idlers: (() => void)[] = [];

	const checkIdle = () => {
		if (waiting.length === 0 && active.size === 0) {
			const list = idlers;
			idlers = [];
			list.forEach((r) => r());
		}
	};
	const finish = (job: Job) => {
		job.finished = true;
		clearTimeout(job.timer);
		active.delete(job);
		pump();
		checkIdle();
	};
	const attempt = (job: Job, n: number) => {
		if (job.finished) return;
		const controller = new AbortController();
		job.controller = controller;
		new Promise<unknown>((resolve, reject) => {
			let timer: ReturnType<typeof setTimeout> | undefined;
			if (timeout !== undefined) {
				timer = setTimeout(() => {
					const error = new TimeoutError(`timed out after ${timeout} ms`);
					controller.abort(error);
					reject(error);
				}, timeout);
			}
			job.task(controller.signal)
				.then(resolve, reject)
				.finally(() => clearTimeout(timer));
		}).then(
			(value) => {
				if (job.finished || job.controller !== controller) return;
				job.resolve(value);
				finish(job);
			},
			(error) => {
				if (job.finished || job.controller !== controller) return;
				if (n <= retries) {
					job.timer = setTimeout(() => attempt(job, n + 1), retryDelay(n));
				} else {
					job.reject(error);
					finish(job);
				}
			}
		);
	};
	const start = (job: Job) => {
		active.add(job);
		// A synchronous throw from the task has to become a failed attempt, so call it in a try.
		const task = job.task;
		job.task = (signal) => {
			try {
				return Promise.resolve(task(signal));
			} catch (error) {
				return Promise.reject(error);
			}
		};
		attempt(job, 1);
	};
	function pump() {
		while (!paused && active.size < concurrency && waiting.length) {
			waiting.sort((a, b) => b.priority - a.priority || a.order - b.order);
			start(waiting.shift()!);
		}
	}
	const inUse = (id: string) => waiting.some((j) => j.id === id) || [...active].some((j) => j.id === id);

	return {
		add<T>(task: (signal: AbortSignal) => Promise<T>, opts: { priority?: number; id?: string } = {}) {
			if (opts.id !== undefined && inUse(opts.id)) throw new Error(`id ${opts.id} is in use`);
			return new Promise<T>((resolve, reject) => {
				waiting.push({ task, priority: opts.priority ?? 0, order: counter++, id: opts.id, resolve: resolve as (v: unknown) => void, reject, finished: false });
				pump();
			});
		},
		pause() {
			paused = true;
		},
		resume() {
			paused = false;
			pump();
		},
		cancel(id: string) {
			const i = waiting.findIndex((j) => j.id === id);
			if (i >= 0) {
				const [job] = waiting.splice(i, 1);
				job.finished = true;
				job.reject(new CancelledError(`cancelled ${id}`));
				checkIdle();
				return true;
			}
			const job = [...active].find((j) => j.id === id);
			if (!job) return false;
			const error = new CancelledError(`cancelled ${id}`);
			job.controller?.abort(error);
			job.reject(error);
			finish(job);
			return true;
		},
		onIdle() {
			return new Promise<void>((resolve) => {
				idlers.push(resolve);
				checkIdle();
			});
		},
		get size() {
			return waiting.length;
		},
		get running() {
			return active.size;
		}
	};
}

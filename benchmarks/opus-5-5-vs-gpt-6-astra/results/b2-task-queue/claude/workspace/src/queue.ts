// See TASK.md for the full specification.
//
// Waiting tasks sit in a priority heap until there is room to run them. Each attempt gets its own
// AbortController and, when there is a timeout, its own timer. Once the queue stops waiting for an
// attempt (it timed out, or its task was cancelled), whatever that attempt does later is ignored.

/** The reason an attempt fails, and its signal is aborted, when it outlasts the queue's `timeout`. */
export class TimeoutError extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'TimeoutError';
	}
}

/** The reason a cancelled task's promise rejects and its signal is aborted. */
export class CancelledError extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'CancelledError';
	}
}

export interface QueueOptions {
	/** How many tasks may run at once: an integer of at least 1. */
	concurrency: number;
	/** How many more times a failed task is tried (at most `retries + 1` attempts). Default 0. */
	retries?: number;
	/**
	 * Milliseconds to wait before the next attempt, given the number of the attempt that just failed
	 * (1 after the first failure). Default `() => 0`.
	 */
	retryDelay?: (attempt: number) => number;
	/** Milliseconds each attempt may take before it fails with a `TimeoutError`. Default: no limit. */
	timeout?: number;
}

export interface TaskOptions {
	/** Waiting tasks start highest priority first, then in the order they were added. Default 0. */
	priority?: number;
	/** Makes the task cancellable. No other waiting or running task may have the same id. */
	id?: string;
}

export interface Queue {
	/**
	 * Adds a task and returns a promise of its result. The task starts before `add` returns if the
	 * queue isn't paused and has room, and it gets a fresh signal for each attempt.
	 * Throws if a waiting or running task already has the same id.
	 */
	add<T>(task: (signal: AbortSignal) => Promise<T>, options?: TaskOptions): Promise<T>;
	/** Stops waiting tasks from starting. Running tasks carry on, including their retries. */
	pause(): void;
	/** Starts waiting tasks again, up to the concurrency limit. */
	resume(): void;
	/**
	 * Cancels the waiting or running task with this id: it makes no more attempts, its current
	 * signal (if it has started) is aborted and its promise rejects with a `CancelledError`.
	 * Returns false if no unfinished task has this id.
	 */
	cancel(id: string): boolean;
	/** Resolves once no task is waiting or running. */
	onIdle(): Promise<void>;
	/** Tasks waiting to start. */
	readonly size: number;
	/** Tasks that have started and not finished, including those waiting to retry. */
	readonly running: number;
}

/**
 * Creates a queue that runs async tasks with a concurrency limit, priorities, retries, per-attempt
 * timeouts and cancellation. Throws a `RangeError` unless `concurrency` is an integer of at least 1.
 */
export function createQueue(options: QueueOptions): Queue {
	// Spreading tolerates a missing options object, which then fails the concurrency check.
	const { concurrency, retries = 0, retryDelay = () => 0, timeout } = { ...options };
	if (!Number.isInteger(concurrency) || concurrency < 1) {
		throw new RangeError(`concurrency must be an integer of at least 1, got ${String(concurrency)}`);
	}
	if (!(retries >= 0 && (Number.isInteger(retries) || retries === Infinity))) {
		throw new RangeError(`retries must be a non-negative integer or Infinity, got ${String(retries)}`);
	}
	if (typeof retryDelay !== 'function') {
		throw new TypeError('retryDelay must be a function');
	}
	if (timeout !== undefined && !(timeout >= 0)) {
		throw new RangeError(`timeout must be a non-negative number, got ${String(timeout)}`);
	}

	const waiting = new TaskHeap();
	/** Waiting and running tasks that have an id. */
	const unfinished = new Map<string, Task>();
	let runningCount = 0;
	let paused = false;
	let added = 0;
	let idle: PromiseWithResolvers<void> | undefined;

	function add<T>(run: (signal: AbortSignal) => Promise<T>, { priority = 0, id }: TaskOptions = {}): Promise<T> {
		if (typeof run !== 'function') {
			throw new TypeError('task must be a function');
		}
		if (typeof priority !== 'number' || Number.isNaN(priority)) {
			throw new TypeError(`priority must be a number, got ${String(priority)}`);
		}
		if (id !== undefined && unfinished.has(id)) {
			throw new Error(`A task with id "${id}" is already waiting or running`);
		}
		const { promise, resolve, reject } = Promise.withResolvers<T>();
		const task: Task = {
			run,
			id,
			priority,
			order: added++,
			promise,
			resolve: resolve as (value: unknown) => void,
			reject,
			state: 'waiting',
			attempts: 0,
			controller: undefined,
			clearTimer: undefined,
			index: -1,
		};
		if (id !== undefined) unfinished.set(id, task);
		waiting.push(task);
		pump();
		return promise;
	}

	function cancel(id: string): boolean {
		const task = unfinished.get(id);
		if (task === undefined) return false;
		if (task.state === 'waiting') waiting.remove(task);
		release(task);
		const error = new CancelledError(`Task "${id}" was cancelled`);
		task.controller?.abort(error);
		// The caller asked for this rejection, so it mustn't count as unhandled when nobody awaits
		// the task's promise.
		task.promise.catch(() => {});
		task.reject(error);
		pump();
		return true;
	}

	function onIdle(): Promise<void> {
		if (runningCount === 0 && waiting.size === 0) return Promise.resolve();
		idle ??= Promise.withResolvers<void>();
		return idle.promise;
	}

	/** Starts waiting tasks while there is room, then resolves `onIdle()` if nothing is left. */
	function pump(): void {
		while (!paused && runningCount < concurrency && waiting.size > 0) {
			const task = waiting.shift()!;
			task.state = 'running';
			runningCount++;
			startAttempt(task);
		}
		if (idle !== undefined && runningCount === 0 && waiting.size === 0) {
			idle.resolve();
			idle = undefined;
		}
	}

	function startAttempt(task: Task): void {
		const controller = new AbortController();
		task.controller = controller;
		task.attempts++;
		let claimed = false;
		// True for the first outcome of this attempt (its result, its error or the timeout), unless
		// the task has been cancelled in the meantime.
		const claim = (): boolean => {
			if (claimed || task.state !== 'running') return false;
			claimed = true;
			task.clearTimer?.();
			return true;
		};
		task.clearTimer = timeout === undefined ? undefined : startTimer(timeout, () => {
			if (!claim()) return;
			const error = new TimeoutError(`${label(task)} timed out after ${timeout} ms`);
			controller.abort(error);
			attemptFailed(task, error);
		});
		let result: unknown;
		try {
			result = task.run(controller.signal);
		} catch (error) {
			result = Promise.reject(error);
		}
		// Attached even when the task was cancelled while starting, so that a late rejection from an
		// attempt the queue has stopped waiting for is still handled.
		Promise.resolve(result).then(
			(value) => {
				if (claim()) finish(task, true, value);
			},
			(error: unknown) => {
				if (claim()) attemptFailed(task, error);
			},
		);
	}

	function attemptFailed(task: Task, error: unknown): void {
		// Aborting a timed-out attempt runs its signal's listeners, which may have cancelled the task.
		if (task.state !== 'running') return;
		if (task.attempts > retries) {
			finish(task, false, error);
			return;
		}
		let delay: number;
		try {
			delay = retryDelay(task.attempts);
		} catch (delayError) {
			finish(task, false, delayError);
			return;
		}
		if (task.state !== 'running') return; // retryDelay cancelled it
		if (delay > 0) {
			task.clearTimer = startTimer(delay, () => startAttempt(task));
		} else {
			startAttempt(task);
		}
	}

	function finish(task: Task, fulfilled: boolean, value: unknown): void {
		release(task);
		if (fulfilled) task.resolve(value);
		else task.reject(value);
		pump();
	}

	/** Marks a task finished, freeing its place and its id. */
	function release(task: Task): void {
		if (task.state === 'running') runningCount--;
		task.state = 'finished';
		if (task.id !== undefined) unfinished.delete(task.id);
		task.clearTimer?.();
	}

	return {
		add,
		pause() {
			paused = true;
		},
		resume() {
			paused = false;
			pump();
		},
		cancel,
		onIdle,
		get size() {
			return waiting.size;
		},
		get running() {
			return runningCount;
		},
	};
}

interface Task {
	readonly run: (signal: AbortSignal) => unknown;
	readonly id: string | undefined;
	readonly priority: number;
	/** How many tasks were added before this one; breaks ties between equal priorities. */
	readonly order: number;
	readonly promise: Promise<unknown>;
	readonly resolve: (value: unknown) => void;
	readonly reject: (reason: unknown) => void;
	state: 'waiting' | 'running' | 'finished';
	/** Attempts started so far. */
	attempts: number;
	/** The current attempt's controller, or the last attempt's while waiting to retry. */
	controller: AbortController | undefined;
	/** Stops the pending timeout or retry-delay timer, if any. */
	clearTimer: (() => void) | undefined;
	/** Position in the waiting heap. */
	index: number;
}

function label(task: Task): string {
	return task.id === undefined ? 'Task' : `Task "${task.id}"`;
}

/** Whether task `a` should start before task `b`. */
function startsBefore(a: Task, b: Task): boolean {
	return a.priority > b.priority || (a.priority === b.priority && a.order < b.order);
}

/** The waiting tasks, as a binary heap ordered by `startsBefore`. */
class TaskHeap {
	#tasks: Task[] = [];

	get size(): number {
		return this.#tasks.length;
	}

	push(task: Task): void {
		this.#tasks.push(task);
		this.#siftUp(task, this.#tasks.length - 1);
	}

	/** Removes and returns the task that should start next. */
	shift(): Task | undefined {
		const first = this.#tasks[0];
		if (first !== undefined) this.remove(first);
		return first;
	}

	remove(task: Task): void {
		const last = this.#tasks.pop()!;
		if (last !== task) {
			// Move the last task into the gap, then restore the heap order around it.
			this.#siftDown(last, task.index);
			this.#siftUp(last, last.index);
		}
	}

	#siftUp(task: Task, index: number): void {
		while (index > 0) {
			const parentIndex = (index - 1) >> 1;
			const parent = this.#tasks[parentIndex];
			if (!startsBefore(task, parent)) break;
			this.#place(parent, index);
			index = parentIndex;
		}
		this.#place(task, index);
	}

	#siftDown(task: Task, index: number): void {
		const tasks = this.#tasks;
		for (;;) {
			let child = 2 * index + 1;
			if (child >= tasks.length) break;
			if (child + 1 < tasks.length && startsBefore(tasks[child + 1], tasks[child])) child++;
			if (!startsBefore(tasks[child], task)) break;
			this.#place(tasks[child], index);
			index = child;
		}
		this.#place(task, index);
	}

	#place(task: Task, index: number): void {
		this.#tasks[index] = task;
		task.index = index;
	}
}

// setTimeout fires after 1 ms when asked to wait longer than 2^31 - 1 ms, so longer delays are
// waited out in steps.
const MAX_TIMER_DELAY = 2 ** 31 - 1;

/** Calls `callback` after `ms` milliseconds (never, for Infinity). Returns a function that stops it. */
function startTimer(ms: number, callback: () => void): () => void {
	let timer: ReturnType<typeof setTimeout>;
	const wait = (remaining: number): void => {
		timer = remaining > MAX_TIMER_DELAY
			? setTimeout(() => wait(remaining - MAX_TIMER_DELAY), MAX_TIMER_DELAY)
			: setTimeout(callback, remaining);
	};
	wait(ms);
	return () => clearTimeout(timer);
}

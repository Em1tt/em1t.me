# Task: an async task queue

Implement a small library in `src/queue.ts` that runs async tasks with a concurrency limit,
priorities, retries, timeouts and cancellation.

- It must run on Node.js 24 directly, using Node's built-in TypeScript type stripping (Node runs
  `.ts` files by removing the types). So use only erasable TypeScript: no `enum`, no
  `namespace`, no constructor parameter properties, no `import x = require()`.
- No dependencies are needed. `npm test` runs the tests in `test/` with `node --test`.
- Hidden tests will import `src/queue.ts` and check the behaviour below exactly. Write your own
  tests too; they won't be scored, but they're how you'll know it works.

## API

```ts
export class TimeoutError extends Error {}   // its name property is 'TimeoutError'
export class CancelledError extends Error {} // its name property is 'CancelledError'

export function createQueue(options: {
	concurrency: number;
	retries?: number;                         // default 0
	retryDelay?: (attempt: number) => number; // milliseconds; default () => 0
	timeout?: number;                         // milliseconds per attempt; default: none
}): Queue;

export interface Queue {
	add<T>(task: (signal: AbortSignal) => Promise<T>, options?: { priority?: number; id?: string }): Promise<T>;
	pause(): void;
	resume(): void;
	cancel(id: string): boolean;
	onIdle(): Promise<void>;
	readonly size: number;    // tasks waiting to start
	readonly running: number; // tasks that have started and not finished
}
```

## Behaviour

**Starting tasks**
- At most `concurrency` tasks run at once. `concurrency` must be an integer of at least 1, or
  `createQueue` throws a `RangeError`.
- A task starts whenever the queue isn't paused and fewer than `concurrency` tasks are running.
  If that's already the case when `add` is called, the task starts before `add` returns.
- Waiting tasks start in order of `priority`, highest first (default 0, negative numbers
  allowed), and in the order they were added among equal priorities.
- `add` returns a promise of the task's result. If the task function throws synchronously, that
  counts as a failed attempt, the same as a rejected promise; `add` itself doesn't throw.

**Retries**
- When an attempt fails, the task is tried again, up to `retries` more times, so `retries: 2`
  means at most 3 attempts.
- Before each new attempt, the queue waits `retryDelay(attempt)` milliseconds, where `attempt` is
  the number of the attempt that just failed (1 after the first failure).
- A task keeps its place among the running tasks while it waits to retry. It counts in `running`.
- Each attempt gets a fresh `AbortSignal`.
- If every attempt fails, the promise from `add` rejects with the error of the last attempt.

**Timeouts**
- If `timeout` is set and an attempt hasn't settled within that many milliseconds, the queue
  aborts that attempt's signal with a `TimeoutError` as the reason, and the attempt fails with
  that `TimeoutError`. The queue stops waiting for it straight away, even if the task function
  ignores the signal. A timed-out attempt can be retried like any other failure.

**Cancelling**
- `cancel(id)` with the id of a waiting task removes it: it never starts, its promise rejects
  with a `CancelledError`, and `cancel` returns `true`.
- `cancel(id)` with the id of a running task (including one waiting to retry) aborts its current
  signal with a `CancelledError` as the reason, rejects its promise with a `CancelledError`
  straight away, frees its place so the next task can start, and makes no more attempts. It
  returns `true`.
- Otherwise (no unfinished task has that id) it returns `false`.
- Ids are optional, but must be unique among unfinished tasks: `add` throws an `Error`
  synchronously when given an id that a waiting or running task already has. Once a task
  finishes, its id can be used again.

**Pausing**
- `pause()` stops new tasks from starting. Running tasks carry on, including their retries.
- `resume()` starts waiting tasks again, up to the concurrency limit.

**Idle**
- `onIdle()` resolves once no task is waiting or running. If the queue is already idle, it
  resolves right away. A paused queue with waiting tasks is not idle.

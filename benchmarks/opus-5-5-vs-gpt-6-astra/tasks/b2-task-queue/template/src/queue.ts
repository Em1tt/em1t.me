// See TASK.md.

export class TimeoutError extends Error {}

export class CancelledError extends Error {}

export interface Queue {
	add<T>(task: (signal: AbortSignal) => Promise<T>, options?: { priority?: number; id?: string }): Promise<T>;
	pause(): void;
	resume(): void;
	cancel(id: string): boolean;
	onIdle(): Promise<void>;
	readonly size: number;
	readonly running: number;
}

export function createQueue(options: {
	concurrency: number;
	retries?: number;
	retryDelay?: (attempt: number) => number;
	timeout?: number;
}): Queue {
	throw new Error('Not implemented');
}

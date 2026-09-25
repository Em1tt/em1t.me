import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQueue } from '../src/queue.ts';

test('runs a task and returns its result', async () => {
	const queue = createQueue({ concurrency: 1 });
	assert.equal(await queue.add(async () => 42), 42);
});

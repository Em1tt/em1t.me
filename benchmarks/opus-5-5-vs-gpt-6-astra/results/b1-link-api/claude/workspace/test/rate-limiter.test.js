import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RateLimiter } from '../src/rate-limiter.js';

function limiterWithClock() {
  const clock = { now: 0 };
  const limiter = new RateLimiter({ limit: 30, windowMs: 60_000, now: () => clock.now });
  return { clock, limiter };
}

function attemptTimes(limiter, key, count) {
  for (let i = 0; i < count; i++) assert.deepEqual(limiter.attempt(key), { allowed: true }, `request ${i + 1}`);
}

describe('RateLimiter', () => {
  it('refuses the 31st request in a window and says when to retry', () => {
    const { clock, limiter } = limiterWithClock();
    attemptTimes(limiter, 'a', 30);
    assert.deepEqual(limiter.attempt('a'), { allowed: false, retryAfter: 60 });

    clock.now = 59_000;
    assert.deepEqual(limiter.attempt('a'), { allowed: false, retryAfter: 1 });
    clock.now = 59_999;
    assert.deepEqual(limiter.attempt('a'), { allowed: false, retryAfter: 1 });
    clock.now = 60_000;
    assert.deepEqual(limiter.attempt('a'), { allowed: true });
  });

  it('rounds the wait up to whole seconds', () => {
    const { clock, limiter } = limiterWithClock();
    attemptTimes(limiter, 'a', 30);
    clock.now = 12_345;
    assert.deepEqual(limiter.attempt('a'), { allowed: false, retryAfter: 48 }); // 47.655 s
  });

  it('uses a rolling window rather than fixed intervals', () => {
    const { clock, limiter } = limiterWithClock();
    attemptTimes(limiter, 'a', 10);
    clock.now = 30_000;
    attemptTimes(limiter, 'a', 20);
    assert.deepEqual(limiter.attempt('a'), { allowed: false, retryAfter: 30 });

    // The first 10 leave the window at 60 s; the 20 from 30 s are still in it.
    clock.now = 60_000;
    attemptTimes(limiter, 'a', 10);
    assert.deepEqual(limiter.attempt('a'), { allowed: false, retryAfter: 30 });

    clock.now = 90_000;
    attemptTimes(limiter, 'a', 20);
    assert.deepEqual(limiter.attempt('a'), { allowed: false, retryAfter: 30 });
  });

  it('does not count refused requests', () => {
    const { clock, limiter } = limiterWithClock();
    attemptTimes(limiter, 'a', 30);
    for (clock.now = 1_000; clock.now < 60_000; clock.now += 1_000) {
      assert.equal(limiter.attempt('a').allowed, false);
    }
    clock.now = 60_000;
    attemptTimes(limiter, 'a', 30);
  });

  it('limits each key separately', () => {
    const { limiter } = limiterWithClock();
    attemptTimes(limiter, 'a', 30);
    assert.equal(limiter.attempt('a').allowed, false);
    attemptTimes(limiter, 'b', 30);
    assert.equal(limiter.attempt('b').allowed, false);
  });

  it('keeps working after pruning', () => {
    const { clock, limiter } = limiterWithClock();
    attemptTimes(limiter, 'old', 30);
    clock.now = 30_000;
    attemptTimes(limiter, 'recent', 30);

    clock.now = 60_000;
    limiter.prune();
    attemptTimes(limiter, 'old', 30);
    assert.deepEqual(limiter.attempt('recent'), { allowed: false, retryAfter: 30 });
  });
});

/**
 * Sliding-log rate limiter: allows at most `limit` requests per key in any rolling window of
 * `windowMs` milliseconds.
 *
 * Only allowed requests are logged. A refused request doesn't push the client's wait further
 * out, so retrying after the returned number of seconds always succeeds (unless the client made
 * other requests in the meantime).
 */
export class RateLimiter {
  #limit;
  #windowMs;
  #now;
  /** @type {Map<string, number[]>} key -> times of its allowed requests in the window, oldest first */
  #requests = new Map();

  /**
   * @param {{ limit: number, windowMs: number, now?: () => number }} options `now` must be a
   *   clock in milliseconds that never goes backwards
   */
  constructor({ limit, windowMs, now = () => performance.now() }) {
    this.#limit = limit;
    this.#windowMs = windowMs;
    this.#now = now;
  }

  /**
   * Counts a request from `key` if the limit allows it.
   * @returns {{ allowed: true } | { allowed: false, retryAfter: number }} `retryAfter` is the
   *   whole number of seconds (at least 1) until a request from `key` would be allowed again
   */
  attempt(key) {
    const now = this.#now();
    const times = this.#requests.get(key) ?? [];
    const firstInWindow = times.findIndex((time) => time > now - this.#windowMs);
    times.splice(0, firstInWindow === -1 ? times.length : firstInWindow);

    if (times.length >= this.#limit) {
      const waitMs = times[0] + this.#windowMs - now;
      return { allowed: false, retryAfter: Math.max(1, Math.ceil(waitMs / 1000)) };
    }
    times.push(now);
    this.#requests.set(key, times);
    return { allowed: true };
  }

  /** Forgets keys without requests in the current window. Call periodically to bound memory. */
  prune() {
    const windowStart = this.#now() - this.#windowMs;
    for (const [key, times] of this.#requests) {
      if (times.length === 0 || times.at(-1) <= windowStart) this.#requests.delete(key);
    }
  }
}

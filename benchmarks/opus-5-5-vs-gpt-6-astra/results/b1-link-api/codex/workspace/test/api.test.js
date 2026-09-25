'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const token = 'integration-test-secret';
const authorization = { Authorization: `Bearer ${token}` };

async function unusedPort() {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
  return port;
}

async function createServer(t, { now = Date.now() } = {}) {
  const directory = await mkdtemp(path.join(projectRoot, '.test-api-'));
  const port = await unusedPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const clockFile = path.join(directory, 'clock.txt');
  const preloadFile = path.join(directory, 'clock.cjs');
  let child;
  let output = '';

  async function stop() {
    if (!child || child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, 'exit');
    child.kill();
    await exited;
  }

  t.after(async () => {
    await stop();
    // Only remove the temporary directory that this test created in the workspace.
    assert.ok(path.resolve(directory).startsWith(projectRoot + path.sep));
    await rm(directory, { recursive: true, force: true });
  });

  async function setTime(value) {
    const timestamp = typeof value === 'string' ? Date.parse(value) : value;
    assert.ok(Number.isFinite(timestamp));
    await writeFile(clockFile, String(timestamp), 'utf8');
  }

  await setTime(now);
  await writeFile(preloadFile, `
    const { readFileSync } = require('node:fs');
    const RealDate = Date;
    const clock = () => Number(readFileSync(process.env.TEST_CLOCK_FILE, 'utf8'));
    class ControlledDate extends RealDate {
      constructor(...args) { super(...(args.length === 0 ? [clock()] : args)); }
      static now() { return clock(); }
    }
    globalThis.Date = ControlledDate;
  `, 'utf8');

  async function start() {
    output = '';
    child = spawn(process.execPath, ['--require', preloadFile, 'server.js'], {
      cwd: projectRoot,
      env: { ...process.env, PORT: String(port), DB_PATH: path.join(directory, 'database.sqlite'), API_TOKEN: token, TEST_CLOCK_FILE: clockFile },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    let spawnError;
    child.on('error', error => { spawnError = error; });
    for (let attempt = 0; attempt < 200; attempt++) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error(`Server exited before becoming ready: ${output}`);
      }
      try {
        const response = await fetch(`${baseUrl}/api/links`, { signal: AbortSignal.timeout(500) });
        await response.arrayBuffer();
        return;
      } catch {
        await delay(25);
      }
    }
    throw new Error(`Server did not become ready: ${output}`);
  }

  await start();
  return {
    async request(route, options = {}) {
      return fetch(baseUrl + route, { redirect: 'manual', signal: AbortSignal.timeout(5000), ...options });
    },
    async rawRequest(target) {
      return new Promise((resolve, reject) => {
        const request = http.request({ hostname: '127.0.0.1', port, path: target }, response => {
          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.on('error', reject);
          response.on('end', () => resolve(new Response(Buffer.concat(chunks), {
            status: response.statusCode, headers: response.headers,
          })));
        });
        request.setTimeout(5000, () => request.destroy(new Error('Request timed out')));
        request.on('error', reject);
        request.end();
      });
    },
    async create(body) {
      return this.request('/api/links', {
        method: 'POST',
        headers: { ...authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
    async restart() {
      await stop();
      await start();
    },
    setTime,
  };
}

async function json(response, status) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('content-type'), 'application/json');
  return response.json();
}

async function error(response, status, code) {
  assert.deepEqual(await json(response, status), { error: code });
}

function validLink(link, slug, url, clicks = 0) {
  assert.deepEqual(link, { slug, url, createdAt: link.createdAt, clicks });
  assert.equal(typeof link.createdAt, 'string');
  assert.equal(new Date(link.createdAt).toISOString(), link.createdAt);
}

test('creation, case-sensitive slugs, generated slugs, and duplicates', async t => {
  const api = await createServer(t);
  const url = 'https://example.com/docs?topic=node#api';
  const original = await json(await api.create({ url, slug: 'docs' }), 201);
  validLink(original, 'docs', url);
  assert.deepEqual(await json(await api.request('/api/links/docs'), 200), original);

  validLink(await json(await api.create({ url, slug: 'Docs' }), 201), 'Docs', url);
  await error(await api.create({ url, slug: 'docs' }), 409, 'slug_taken');

  const generated = new Set();
  for (let index = 0; index < 8; index++) {
    const link = await json(await api.create({ url }), 201);
    assert.match(link.slug, /^[A-Za-z0-9]{7}$/);
    assert.ok(!generated.has(link.slug));
    generated.add(link.slug);
    validLink(link, link.slug, url);
  }

  for (const slug of ['a_B-9', 'a'.repeat(32), 'abc']) {
    validLink(await json(await api.create({ url, slug }), 201), slug, url);
  }
  const longestUrl = 'http://example.com/'.padEnd(2048, 'x');
  validLink(await json(await api.create({ url: longestUrl, slug: 'long-url' }), 201), 'long-url', longestUrl);
});

test('validation distinguishes JSON, URL, and slug errors in the required order', async t => {
  const api = await createServer(t);
  for (const body of ['{', '', 'null', '[]', '"text"', 'true', '123']) {
    await error(await api.request('/api/links', {
      method: 'POST', headers: { ...authorization, 'Content-Type': 'application/json' }, body,
    }), 400, 'invalid_json');
  }

  for (const body of [
    {}, { url: null }, { url: 123 }, { url: '' }, { url: '/relative/path' },
    { url: 'ftp://example.com/file' }, { url: 'https://' },
    { url: 'https://example.com/' + 'x'.repeat(2048) },
  ]) {
    await error(await api.create(body), 400, 'invalid_url');
  }

  for (const slug of [null, '', 'aa', 'a'.repeat(33), 'a b', 'a.b', 'a/b', 'abc\n', 'ééé', 'api', 'API', 'aPi', {}, 123]) {
    await error(await api.create({ url: 'https://example.com/', slug }), 400, 'invalid_slug');
  }
  await error(await api.create({ url: 'invalid', slug: 'api' }), 400, 'invalid_url');
});

test('authentication precedes body validation and protects deletion', async t => {
  const api = await createServer(t);
  for (const headers of [{}, { Authorization: 'Bearer wrong' }, { Authorization: token }, { Authorization: 'Basic anything' }]) {
    await error(await api.request('/api/links', { method: 'POST', headers, body: '{' }), 401, 'unauthorized');
    await error(await api.request('/api/links/missing', { method: 'DELETE', headers }), 401, 'unauthorized');
  }
  await json(await api.create({ url: 'https://example.com/', slug: 'safe' }), 201);
  await error(await api.request('/api/links/safe', { method: 'DELETE' }), 401, 'unauthorized');
  await json(await api.request('/api/links/safe'), 200);
});

test('listing uses reverse creation order, default limits, and complete pagination', async t => {
  const api = await createServer(t);
  const created = [];
  for (let index = 0; index < 23; index++) {
    created.push(await json(await api.create({ url: `https://example.com/${index}`, slug: `link-${index}` }), 201));
  }
  const newestFirst = created.toReversed();
  const first = await json(await api.request('/api/links'), 200);
  assert.deepEqual(first.items, newestFirst.slice(0, 20));
  assert.equal(typeof first.nextCursor, 'string');
  assert.ok(first.nextCursor.length > 0);
  assert.deepEqual(await json(await api.request(`/api/links?cursor=${encodeURIComponent(first.nextCursor)}`), 200), {
    items: newestFirst.slice(20), nextCursor: null,
  });

  const all = [];
  const seen = new Set();
  let cursor = null;
  do {
    const page = await json(await api.request(`/api/links?limit=4${cursor === null ? '' : `&cursor=${encodeURIComponent(cursor)}`}`), 200);
    assert.deepEqual(Object.keys(page).sort(), ['items', 'nextCursor']);
    assert.ok(page.items.length <= 4);
    all.push(...page.items);
    cursor = page.nextCursor;
    if (cursor !== null) {
      assert.equal(typeof cursor, 'string');
      assert.ok(!seen.has(cursor), 'pagination must make progress');
      seen.add(cursor);
    }
    assert.ok(seen.size < 10, 'pagination must terminate');
  } while (cursor !== null);
  assert.deepEqual(all, newestFirst);
  assert.deepEqual(await json(await api.request('/api/links?limit=100'), 200), { items: newestFirst, nextCursor: null });

  for (const limit of ['', '0', '-1', '101', '1.5', 'abc']) {
    await error(await api.request(`/api/links?limit=${encodeURIComponent(limit)}`), 400, 'invalid_limit');
  }
});

test('redirects record clicks; seven-day UTC stats and deletion survive restart', async t => {
  const timestamp = '2026-09-25T12:00:00.000Z';
  const api = await createServer(t, { now: timestamp });
  const url = 'https://example.com/saved?from=short';
  const original = await json(await api.create({ url, slug: 'saved' }), 201);
  await json(await api.create({ url, slug: 'removed' }), 201);
  for (const slug of ['saved', 'saved', 'removed']) {
    const response = await api.request(`/${slug}`);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), url);
    await response.arrayBuffer();
  }
  assert.deepEqual(await json(await api.request('/api/links/saved'), 200), { ...original, clicks: 2 });
  const stats = await json(await api.request('/api/links/saved/stats'), 200);
  const today = new Date(timestamp);
  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6 + index));
    return { date: date.toISOString().slice(0, 10), clicks: index === 6 ? 2 : 0 };
  });
  assert.deepEqual(stats, { slug: 'saved', clicks: 2, daily });

  const removed = await api.request('/api/links/removed', { method: 'DELETE', headers: authorization });
  assert.equal(removed.status, 204);
  assert.equal(await removed.text(), '');
  await api.restart();

  assert.deepEqual(await json(await api.request('/api/links/saved'), 200), { ...original, clicks: 2 });
  assert.deepEqual(await json(await api.request('/api/links/saved/stats'), 200), stats);
  for (const route of ['/removed', '/api/links/removed', '/api/links/removed/stats']) {
    await error(await api.request(route), 404, 'not_found');
  }
  await error(await api.create({ url, slug: 'saved' }), 409, 'slug_taken');
  const replacement = await json(await api.create({ url, slug: 'removed' }), 201);
  validLink(replacement, 'removed', url);
  assert.deepEqual(await json(await api.request('/api/links/removed/stats'), 200), {
    slug: 'removed', clicks: 0, daily: daily.map(day => ({ ...day, clicks: 0 })),
  });
});

test('unknown routes and unknown slugs return JSON not_found', async t => {
  const api = await createServer(t);
  assert.deepEqual(await json(await api.request('/api/links'), 200), { items: [], nextCursor: null });
  for (const route of ['/', '/api', '/missing', '/api/links/missing', '/api/links/missing/stats', '/api/links/missing/other', '/unknown/route', '/%', '/api/links/%FF', '/api/links/%2F/stats']) {
    await error(await api.request(route), 404, 'not_found');
  }
  await error(await api.rawRequest('//['), 404, 'not_found');
  await error(await api.request('/api/links/missing', { method: 'DELETE', headers: authorization }), 404, 'not_found');
  await error(await api.request('/unknown', { method: 'POST', headers: authorization, body: '{}' }), 404, 'not_found');
});

test('all creation attempts count toward the rate limit, which runs before authentication and JSON parsing', async t => {
  const api = await createServer(t);
  for (let index = 0; index < 10; index++) {
    await error(await api.request('/api/links', { method: 'POST', headers: authorization, body: '{' }), 400, 'invalid_json');
  }
  for (let index = 0; index < 10; index++) {
    await error(await api.request('/api/links', { method: 'POST', body: '{' }), 401, 'unauthorized');
  }
  for (let index = 0; index < 10; index++) {
    await json(await api.create({ url: 'https://example.com/', slug: `rate-${index}` }), 201);
  }
  for (const options of [
    { method: 'POST', body: '{' },
    { method: 'POST', headers: authorization, body: '{' },
  ]) {
    const response = await api.request('/api/links', options);
    const retry = response.headers.get('retry-after');
    assert.match(retry, /^\d+$/);
    assert.ok(Number(retry) >= 1 && Number(retry) <= 60);
    await error(response, 429, 'rate_limited');
  }
  const listing = await json(await api.request('/api/links'), 200);
  assert.equal(listing.items.length, 10);
  const response = await api.request('/api/links/rate-0', { method: 'DELETE', headers: authorization });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
});

test('rate limiting uses a rolling window, exact expiration, and counts blocked attempts', async t => {
  const start = Date.parse('2026-09-25T12:00:59.500Z');
  const api = await createServer(t, { now: start });
  const attempt = () => api.request('/api/links', { method: 'POST', body: '{' });
  async function limited(retryAfter) {
    const response = await attempt();
    assert.equal(response.headers.get('retry-after'), String(retryAfter));
    await error(response, 429, 'rate_limited');
  }

  for (let index = 0; index < 30; index++) {
    await error(await attempt(), 401, 'unauthorized');
  }
  await api.restart();
  await api.setTime(start + 500); // The clock minute changed, but the window has not expired.
  await limited(60);
  await api.setTime(start + 59_500);
  await limited(1);
  await api.setTime(start + 60_000); // Requests exactly 60 seconds old no longer count.
  for (let index = 0; index < 28; index++) {
    await error(await attempt(), 401, 'unauthorized');
  }
  // The two earlier blocked requests still count, so only 28 requests fit now.
  // This rejected attempt also counts and extends the next available slot.
  await limited(60);
  await api.setTime(start + 119_499);
  await limited(1);
  await api.setTime(start + 120_000);
  await error(await attempt(), 401, 'unauthorized');
});

test('UTC stats retain lifetime clicks while the seven-day daily window advances', async t => {
  const api = await createServer(t, { now: '2026-09-18T23:59:59.999Z' });
  await json(await api.create({ url: 'https://example.com/history', slug: 'history' }), 201);
  async function follow(times) {
    for (let index = 0; index < times; index++) {
      const response = await api.request('/history');
      assert.equal(response.status, 302);
      await response.arrayBuffer();
    }
  }
  await follow(1);
  await api.setTime('2026-09-19T00:00:00.000Z');
  await follow(2);
  await api.setTime('2026-09-24T23:59:59.999Z');
  await follow(1);
  await api.setTime('2026-09-25T00:00:00.000Z');
  await follow(2);
  const expected = {
    slug: 'history', clicks: 6,
    daily: [
      { date: '2026-09-19', clicks: 2 },
      { date: '2026-09-20', clicks: 0 },
      { date: '2026-09-21', clicks: 0 },
      { date: '2026-09-22', clicks: 0 },
      { date: '2026-09-23', clicks: 0 },
      { date: '2026-09-24', clicks: 1 },
      { date: '2026-09-25', clicks: 2 },
    ],
  };
  assert.deepEqual(await json(await api.request('/api/links/history/stats'), 200), expected);
  assert.equal((await json(await api.request('/api/links/history'), 200)).clicks, 6);
  assert.equal((await json(await api.request('/api/links'), 200)).items[0].clicks, 6);
  await api.restart();
  assert.deepEqual(await json(await api.request('/api/links/history/stats'), 200), expected);

  await api.setTime('2026-09-26T00:00:00.000Z');
  assert.deepEqual(await json(await api.request('/api/links/history/stats'), 200), {
    slug: 'history', clicks: 6,
    daily: [...expected.daily.slice(1), { date: '2026-09-26', clicks: 0 }],
  });
});

test('pagination cursors remain usable after deletion, insertion, and restart', async t => {
  const api = await createServer(t, { now: '2026-09-25T12:00:00.000Z' });
  const links = [];
  for (let index = 0; index < 6; index++) {
    links.push(await json(await api.create({ url: `https://example.com/${index}`, slug: `page-${index}` }), 201));
  }
  const first = await json(await api.request('/api/links?limit=2'), 200);
  assert.deepEqual(first.items, [links[5], links[4]]);
  assert.equal(typeof first.nextCursor, 'string');
  for (const slug of ['page-4', 'page-3']) {
    const response = await api.request(`/api/links/${slug}`, { method: 'DELETE', headers: authorization });
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
  }
  const newest = await json(await api.create({ url: 'https://example.com/6', slug: 'page-6' }), 201);
  await api.restart();
  const second = await json(await api.request(`/api/links?limit=2&cursor=${encodeURIComponent(first.nextCursor)}`), 200);
  assert.deepEqual(second.items, [links[2], links[1]]);
  assert.equal(typeof second.nextCursor, 'string');
  assert.deepEqual(await json(await api.request(`/api/links?limit=2&cursor=${encodeURIComponent(second.nextCursor)}`), 200), {
    items: [links[0]], nextCursor: null,
  });
  assert.deepEqual(await json(await api.request('/api/links'), 200), {
    items: [newest, links[5], links[2], links[1], links[0]], nextCursor: null,
  });
});

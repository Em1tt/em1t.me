import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { apiClient, startServer } from './helpers.js';

const TOKEN = 'test-token';
const DAY_MS = 24 * 60 * 60 * 1000;

const tempDir = mkdtempSync(join(tmpdir(), 'link-api-test-'));
after(() => rmSync(tempDir, { recursive: true, force: true }));

// The main suite makes far more than 30 POSTs a minute, so the server trusts one proxy hop and
// every request claims its own client address to stay clear of the rate limit.
let clientCount = 0;
const uniqueAddress = () => `10.0.${++clientCount >> 8}.${clientCount & 255}`;

function assertJson(res, status, body) {
  assert.equal(res.status, status);
  assert.equal(res.headers.get('content-type'), 'application/json');
  if (body !== undefined) assert.deepEqual(res.body, body);
}

const utcDate = (time) => new Date(time).toISOString().slice(0, 10);

describe('link shortener API', () => {
  let server;
  let api;
  const create = (body, token = TOKEN) => api('POST', '/api/links', { body, token });

  before(async () => {
    server = await startServer({ DB_PATH: join(tempDir, 'api.db'), API_TOKEN: TOKEN, TRUST_PROXY: '1' });
    api = apiClient(server.url, { forwardedFor: uniqueAddress });
  });
  after(() => server.stop());

  describe('POST /api/links', () => {
    it('creates a link with the requested slug', async () => {
      const startedAt = Date.now();
      const res = await create({ url: 'https://example.com/docs', slug: 'docs' });

      assertJson(res, 201);
      const { createdAt, ...link } = res.body;
      assert.deepEqual(link, { slug: 'docs', url: 'https://example.com/docs', clicks: 0 });
      assert.deepEqual(Object.keys(res.body), ['slug', 'url', 'createdAt', 'clicks']);
      assert.equal(new Date(createdAt).toISOString(), createdAt);
      assert.ok(Date.parse(createdAt) >= startedAt - 1000 && Date.parse(createdAt) <= Date.now() + 1000);
    });

    it('generates a unique 7-character slug when none is given', async () => {
      const slugs = new Set();
      for (const body of [{ url: 'https://example.com/a' }, { url: 'https://example.com/b', slug: null }]) {
        const res = await create(body);
        assertJson(res, 201);
        assert.match(res.body.slug, /^[A-Za-z0-9]{7}$/);
        assert.equal(res.body.url, body.url);
        slugs.add(res.body.slug);
      }
      assert.equal(slugs.size, 2);
    });

    it('keeps the URL exactly as submitted', async () => {
      for (const url of ['https://example.com', 'HTTP://Example.COM:80/a/../b?q=1&r=2#frag', 'http://localhost:8080']) {
        const res = await create({ url });
        assertJson(res, 201);
        assert.equal(res.body.url, url);
      }
    });

    it('accepts slugs of 3 to 32 letters, digits, underscores and hyphens', async () => {
      for (const slug of ['a_-', 'Z9_', 'x'.repeat(32), 'api-docs', 'apis', 'my_Link-2']) {
        const res = await create({ url: 'https://example.com', slug });
        assertJson(res, 201);
        assert.equal(res.body.slug, slug);
      }
    });

    it('treats slugs as case-sensitive', async () => {
      assertJson(await create({ url: 'https://example.com/lower', slug: 'casing' }), 201);
      assertJson(await create({ url: 'https://example.com/upper', slug: 'Casing' }), 201);
      assert.equal((await api('GET', '/api/links/casing')).body.url, 'https://example.com/lower');
      assert.equal((await api('GET', '/api/links/Casing')).body.url, 'https://example.com/upper');
    });

    it('rejects a slug that is already in use', async () => {
      assertJson(await create({ url: 'https://example.com/1', slug: 'taken' }), 201);
      assertJson(await create({ url: 'https://example.com/2', slug: 'taken' }), 409, { error: 'slug_taken' });
    });

    it('rejects a body that is not a JSON object', async () => {
      for (const body of ['', 'not json', '{"url":', '[]', '[{"url":"https://example.com"}]', 'null', '42', '"https://example.com"', 'true']) {
        assertJson(await create(body), 400, { error: 'invalid_json' });
      }
    });

    it('rejects a missing or invalid url', async () => {
      const invalid = [
        undefined, null, 42, ['https://example.com'], '', 'example.com', '/docs', '//example.com/docs',
        'ftp://example.com/file', 'javascript:alert(1)', 'mailto:someone@example.com', 'data:text/plain,hi',
        'https://', 'http://exa mple.com', `https://example.com/${'a'.repeat(2029)}`,
      ];
      for (const url of invalid) {
        assertJson(await create({ url, slug: 'never-created' }), 400, { error: 'invalid_url' });
      }
    });

    it('accepts a url of exactly 2048 characters', async () => {
      const url = `https://example.com/${'a'.repeat(2028)}`;
      assert.equal(url.length, 2048);
      assertJson(await create({ url }), 201);
    });

    it('rejects an invalid slug', async () => {
      const invalid = ['', 'ab', 'x'.repeat(33), 'has space', 'semi;colon', 'slash/es', 'dot.ted', 'ünï', 'api', 'API', 'Api', 42, true, ['abc'], {}];
      for (const slug of invalid) {
        assertJson(await create({ url: 'https://example.com', slug }), 400, { error: 'invalid_slug' });
      }
    });

    it('requires the bearer token', async () => {
      const body = { url: 'https://example.com', slug: 'secret-link' };
      const attempts = [
        {},
        { authorization: 'Bearer wrong-token' },
        { authorization: `Bearer ${TOKEN}x` },
        { authorization: `Basic ${TOKEN}` },
        { authorization: TOKEN },
        { authorization: 'Bearer' },
      ];
      for (const headers of attempts) {
        assertJson(await api('POST', '/api/links', { body, headers }), 401, { error: 'unauthorized' });
      }
      assertJson(await api('GET', '/api/links/secret-link'), 404);
    });

    it('checks authentication, then the JSON, then url, then slug', async () => {
      assertJson(await create('not json', 'wrong'), 401, { error: 'unauthorized' });
      assertJson(await create('[', TOKEN), 400, { error: 'invalid_json' });
      assertJson(await create({ url: 'nope', slug: 'a' }), 400, { error: 'invalid_url' });
      assertJson(await create({ url: 'https://example.com', slug: 'a' }), 400, { error: 'invalid_slug' });
    });

    it('ignores the Content-Type of the request', async () => {
      const res = await api('POST', '/api/links', {
        body: JSON.stringify({ url: 'https://example.com', slug: 'form-typed' }),
        token: TOKEN,
        headers: { 'content-type': 'text/plain' },
      });
      assertJson(res, 201);
    });
  });

  describe('GET /api/links/:slug', () => {
    it('returns the link', async () => {
      const created = (await create({ url: 'https://example.com/get', slug: 'get-me' })).body;
      assertJson(await api('GET', '/api/links/get-me'), 200, created);
    });

    it('returns 404 for an unknown slug', async () => {
      assertJson(await api('GET', '/api/links/missing'), 404, { error: 'not_found' });
      assertJson(await api('GET', '/api/links/GET-ME'), 404, { error: 'not_found' });
    });
  });

  describe('GET /:slug', () => {
    it('redirects to the URL and counts the click', async () => {
      const url = 'https://example.com/path?query=1&other=two#section';
      await create({ url, slug: 'follow' });

      for (let i = 0; i < 3; i++) {
        const res = await api('GET', '/follow');
        assert.equal(res.status, 302);
        assert.equal(res.headers.get('location'), url);
        assert.equal(res.text, '');
      }
      assert.equal((await api('GET', '/api/links/follow')).body.clicks, 3);
    });

    it('ignores the query string of the short link', async () => {
      await create({ url: 'https://example.com/q', slug: 'with-query' });
      const res = await api('GET', '/with-query?utm_source=test');
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), 'https://example.com/q');
    });

    it('percent-encodes characters a Location header cannot carry', async () => {
      await create({ url: 'https://example.com/ünï cödé?q=ä', slug: 'unicode' });
      const res = await api('GET', '/unicode');
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), 'https://example.com/%C3%BCn%C3%AF%20c%C3%B6d%C3%A9?q=%C3%A4');
    });

    it('answers HEAD without counting a click', async () => {
      await create({ url: 'https://example.com/head', slug: 'head-only' });
      const res = await api('HEAD', '/head-only');
      assert.equal(res.status, 302);
      assert.equal(res.headers.get('location'), 'https://example.com/head');
      assert.equal((await api('GET', '/api/links/head-only')).body.clicks, 0);
    });

    it('returns 404 for an unknown slug', async () => {
      assertJson(await api('GET', '/missing'), 404, { error: 'not_found' });
      assertJson(await api('GET', '/api'), 404, { error: 'not_found' });
      assertJson(await api('GET', '/FOLLOW'), 404, { error: 'not_found' });
    });
  });

  describe('GET /api/links/:slug/stats', () => {
    it('returns total clicks and the last 7 UTC days, oldest first', async () => {
      await create({ url: 'https://example.com/stats', slug: 'stats' });
      for (let i = 0; i < 4; i++) await api('GET', '/stats');

      const res = await api('GET', '/api/links/stats/stats');
      const today = Date.now();
      const expectedDays = Array.from({ length: 7 }, (_, i) => utcDate(today - (6 - i) * DAY_MS));
      assertJson(res, 200, {
        slug: 'stats',
        clicks: 4,
        daily: expectedDays.map((date, i) => ({ date, clicks: i === 6 ? 4 : 0 })),
      });
    });

    it('returns zeros for a link without clicks', async () => {
      await create({ url: 'https://example.com/quiet', slug: 'quiet' });
      const res = await api('GET', '/api/links/quiet/stats');
      assertJson(res, 200);
      assert.equal(res.body.clicks, 0);
      assert.equal(res.body.daily.length, 7);
      assert.ok(res.body.daily.every((day) => day.clicks === 0));
    });

    it('returns 404 for an unknown slug', async () => {
      assertJson(await api('GET', '/api/links/missing/stats'), 404, { error: 'not_found' });
    });
  });

  describe('DELETE /api/links/:slug', () => {
    it('deletes the link and its clicks', async () => {
      await create({ url: 'https://example.com/old', slug: 'doomed' });
      await api('GET', '/doomed');

      const res = await api('DELETE', '/api/links/doomed', { token: TOKEN });
      assert.equal(res.status, 204);
      assert.equal(res.text, '');
      assert.equal(res.headers.get('content-type'), null);

      assertJson(await api('GET', '/api/links/doomed'), 404, { error: 'not_found' });
      assertJson(await api('GET', '/api/links/doomed/stats'), 404, { error: 'not_found' });
      assertJson(await api('GET', '/doomed'), 404, { error: 'not_found' });
      assertJson(await api('DELETE', '/api/links/doomed', { token: TOKEN }), 404, { error: 'not_found' });

      // The slug is free again, and the new link starts without the old clicks.
      const recreated = await create({ url: 'https://example.com/new', slug: 'doomed' });
      assertJson(recreated, 201);
      assert.equal(recreated.body.clicks, 0);
      const stats = await api('GET', '/api/links/doomed/stats');
      assert.equal(stats.body.clicks, 0);
      assert.ok(stats.body.daily.every((day) => day.clicks === 0));
    });

    it('requires the bearer token', async () => {
      await create({ url: 'https://example.com/keep', slug: 'keeper' });
      assertJson(await api('DELETE', '/api/links/keeper'), 401, { error: 'unauthorized' });
      assertJson(await api('DELETE', '/api/links/keeper', { token: 'wrong' }), 401, { error: 'unauthorized' });
      assertJson(await api('DELETE', '/api/links/missing'), 401, { error: 'unauthorized' });
      assertJson(await api('GET', '/api/links/keeper'), 200);
    });
  });

  describe('unknown routes', () => {
    it('return 404 not_found as JSON', async () => {
      const requests = [
        ['GET', '/'], ['GET', '/api/links/docs/clicks'], ['GET', '/api/unknown'], ['GET', '/docs/extra'],
        ['GET', '/api/links/'], ['PUT', '/api/links/docs'], ['PATCH', '/api/links'], ['DELETE', '/api/links'],
        ['POST', '/docs'], ['POST', '/api/links/docs'], ['DELETE', '/docs'],
      ];
      for (const [method, path] of requests) {
        assertJson(await api(method, path, { token: TOKEN }), 404, { error: 'not_found' });
      }
    });
  });
});

describe('listing links', () => {
  let server;
  let api;
  const slugs = Array.from({ length: 25 }, (_, i) => `link-${String(i + 1).padStart(2, '0')}`);
  const newestFirst = slugs.toReversed();

  async function collectPages(limit) {
    const pages = [];
    let cursor = null;
    do {
      const query = `limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const res = await api('GET', `/api/links?${query}`);
      assertJson(res, 200);
      pages.push(res.body.items.map((link) => link.slug));
      cursor = res.body.nextCursor;
    } while (cursor !== null);
    return pages;
  }

  before(async () => {
    server = await startServer({ DB_PATH: join(tempDir, 'list.db'), API_TOKEN: TOKEN, TRUST_PROXY: '1' });
    api = apiClient(server.url, { forwardedFor: uniqueAddress });
    for (const slug of slugs) {
      await api('POST', '/api/links', { body: { url: `https://example.com/${slug}`, slug }, token: TOKEN });
    }
  });
  after(() => server.stop());

  it('returns 20 links, newest first, by default', async () => {
    const res = await api('GET', '/api/links');
    assertJson(res, 200);
    assert.deepEqual(Object.keys(res.body), ['items', 'nextCursor']);
    assert.deepEqual(res.body.items.map((link) => link.slug), newestFirst.slice(0, 20));
    assert.equal(typeof res.body.nextCursor, 'string');

    const next = await api('GET', `/api/links?cursor=${encodeURIComponent(res.body.nextCursor)}`);
    assertJson(next, 200);
    assert.deepEqual(next.body.items.map((link) => link.slug), newestFirst.slice(20));
    assert.equal(next.body.nextCursor, null);
  });

  it('returns full link objects', async () => {
    await api('GET', '/link-25');
    const [newest] = (await api('GET', '/api/links?limit=1')).body.items;
    assert.deepEqual(newest, (await api('GET', '/api/links/link-25')).body);
    assert.equal(newest.clicks, 1);
  });

  it('pages through every link exactly once', async () => {
    for (const limit of [1, 2, 5, 7, 24, 25, 26, 100]) {
      const pages = await collectPages(limit);
      assert.deepEqual(pages.flat(), newestFirst, `limit=${limit}`);
      assert.equal(pages.length, Math.ceil(slugs.length / limit), `limit=${limit}`);
      assert.ok(pages.every((page) => page.length > 0), `limit=${limit}`);
    }
  });

  it('rejects a limit that is not an integer from 1 to 100', async () => {
    for (const limit of ['0', '101', '-1', '1.5', '2e1', 'abc', '10abc', '', ' 5', '1000000000000000000000']) {
      assertJson(await api('GET', `/api/links?limit=${encodeURIComponent(limit)}`), 400, { error: 'invalid_limit' });
    }
  });

  it('rejects a malformed cursor', async () => {
    for (const cursor of ['garbage!', 'MA', 'LTE', 'eHl6']) {
      assertJson(await api('GET', `/api/links?cursor=${encodeURIComponent(cursor)}`), 400, { error: 'invalid_cursor' });
    }
  });

  it('keeps cursors valid when links are added or deleted', async () => {
    const first = (await api('GET', '/api/links?limit=10')).body;
    assert.deepEqual(first.items.map((link) => link.slug), newestFirst.slice(0, 10));

    await api('POST', '/api/links', { body: { url: 'https://example.com/late', slug: 'late' }, token: TOKEN });
    await api('DELETE', '/api/links/link-16', { token: TOKEN }); // last link of the first page
    await api('DELETE', '/api/links/link-15', { token: TOKEN }); // first link of the next page

    const second = (await api('GET', `/api/links?limit=10&cursor=${encodeURIComponent(first.nextCursor)}`)).body;
    assert.deepEqual(second.items.map((link) => link.slug), newestFirst.slice(11, 21));
  });
});

describe('persistence', () => {
  it('keeps links and clicks in the DB_PATH file across restarts', async () => {
    const dir = join(tempDir, 'persist', 'nested');
    const env = { DB_PATH: join(dir, 'links.db'), API_TOKEN: TOKEN };

    const first = await startServer(env);
    let api = apiClient(first.url);
    const created = (await api('POST', '/api/links', { body: { url: 'https://example.com/p', slug: 'persist' }, token: TOKEN })).body;
    await api('GET', '/persist');
    await api('GET', '/persist');
    await first.stop();

    assert.deepEqual(readdirSync(dir), ['links.db']);

    const second = await startServer(env);
    try {
      api = apiClient(second.url);
      assertJson(await api('GET', '/api/links/persist'), 200, { ...created, clicks: 2 });
      assert.equal((await api('GET', '/api/links/persist/stats')).body.daily.at(-1).clicks, 2);
      assert.deepEqual((await api('GET', '/api/links')).body.items.map((link) => link.slug), ['persist']);
      assertJson(await api('POST', '/api/links', { body: { url: 'https://example.com/q', slug: 'persist' }, token: TOKEN }), 409);
    } finally {
      await second.stop();
    }
  });
});

describe('rate limit on POST /api/links', () => {
  it('allows 30 requests a minute per client address, whatever their outcome', async () => {
    const server = await startServer({ DB_PATH: join(tempDir, 'rate.db'), API_TOKEN: TOKEN });
    try {
      const api = apiClient(server.url);
      for (let i = 0; i < 10; i++) {
        assertJson(await api('POST', '/api/links', { body: { url: 'https://example.com' } }), 401);
        assertJson(await api('POST', '/api/links', { body: '{', token: TOKEN }), 400);
        assertJson(await api('POST', '/api/links', { body: { url: 'https://example.com' }, token: TOKEN }), 201);
      }

      const limited = await api('POST', '/api/links', { body: { url: 'https://example.com' }, token: TOKEN });
      assertJson(limited, 429, { error: 'rate_limited' });
      const retryAfter = limited.headers.get('retry-after');
      assert.match(retryAfter, /^\d+$/);
      assert.ok(Number(retryAfter) >= 1 && Number(retryAfter) <= 60, `Retry-After: ${retryAfter}`);

      // The limit is checked before authentication, and X-Forwarded-For isn't trusted by default.
      assertJson(await api('POST', '/api/links', { body: '{' }), 429, { error: 'rate_limited' });
      assertJson(await api('POST', '/api/links', { body: { url: 'https://example.com' }, token: TOKEN, headers: { 'x-forwarded-for': '192.0.2.1' } }), 429);

      // Other endpoints aren't limited.
      assertJson(await api('GET', '/api/links?limit=1'), 200);
      assertJson(await api('DELETE', '/api/links/missing', { token: TOKEN }), 404);
    } finally {
      await server.stop();
    }
  });

  it('tells clients apart by the address the trusted proxy reports', async () => {
    const server = await startServer({ DB_PATH: join(tempDir, 'rate-proxy.db'), API_TOKEN: TOKEN, TRUST_PROXY: '1' });
    try {
      const api = apiClient(server.url);
      const post = (forwardedFor) => api('POST', '/api/links', { body: '{}', token: TOKEN, headers: { 'x-forwarded-for': forwardedFor } });
      // Entries before the one the proxy appended are client-supplied, so they must not matter.
      for (let i = 0; i < 30; i++) assertJson(await post(`198.51.100.${i}, 203.0.113.1`), 400);
      assertJson(await post('203.0.113.1'), 429);
      assertJson(await post('203.0.113.2'), 400);
    } finally {
      await server.stop();
    }
  });
});

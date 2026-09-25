// Hidden tests for B1, the link shortener API. Run: node test.mjs <workspace> <out-dir>
import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, mkdtempSync, openSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { checks, same, sleep } from '../../../tools/harness.mjs';

const [, , workspace, out] = process.argv;
mkdirSync(out, { recursive: true });
const TOKEN = 'test-token-7f3a';
const dbDir = mkdtempSync(join(tmpdir(), 'bench-b1-'));
const DB_PATH = join(dbDir, 'links.db');
const freePort = () => new Promise((ok) => { const s = createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => ok(p)); }); });
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;

let server;
async function start() {
	const log = openSync(join(out, 'server.log'), 'a');
	server = spawn('npm start', { cwd: workspace, shell: true, env: { ...process.env, PORT: String(PORT), DB_PATH, API_TOKEN: TOKEN }, stdio: ['ignore', log, log] });
	for (let i = 0; i < 120; i++) {
		try {
			await fetch(`${BASE}/api/links`);
			return true;
		} catch {
			await sleep(250);
		}
	}
	return false;
}
function stop() {
	try {
		execSync(`taskkill /PID ${server.pid} /T /F`, { stdio: 'ignore' });
	} catch {
		// Already gone.
	}
}
const auth = { authorization: `Bearer ${TOKEN}` };
// When each POST /api/links was sent, for the rate limit check.
const posts = [];
async function call(method, path, { body, headers = {}, raw } = {}) {
	if (method === 'POST' && path === '/api/links') posts.push(Date.now());
	const res = await fetch(BASE + path, {
		method,
		redirect: 'manual',
		headers: { ...(body !== undefined || raw !== undefined ? { 'content-type': 'application/json' } : {}), ...headers },
		body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined
	});
	const text = await res.text();
	let json = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		json = { unparsed: text.slice(0, 100) };
	}
	return { status: res.status, json, headers: res.headers, type: res.headers.get('content-type') ?? '' };
}
const create = (body, headers = auth) => call('POST', '/api/links', { body, headers });
const isJson = (r) => r.type.startsWith('application/json');
const linkShape = (l, slug, url, clicks = 0) =>
	l && same(Object.keys(l).sort(), ['clicks', 'createdAt', 'slug', 'url']) && l.slug === slug && l.url === url && l.clicks === clicks && !Number.isNaN(Date.parse(l.createdAt)) && Math.abs(Date.parse(l.createdAt) - Date.now()) < 86400000;

const c = checks();
const started = await start();
if (!started) {
	writeFileSync(join(out, 'result.json'), JSON.stringify({ passed: 0, total: 18, results: [], note: 'server did not start' }, null, 2));
	stop();
	process.exit(0);
}
const created = [];

await c.check('create with a slug: 201, the link, JSON', async () => {
	const r = await create({ url: 'https://example.com/docs', slug: 'docs' });
	created.push('docs');
	return (r.status === 201 && isJson(r) && linkShape(r.json, 'docs', 'https://example.com/docs')) || r;
});
await c.check('create without a slug: 7-character generated slug', async () => {
	const r1 = await create({ url: 'http://example.org/a?x=1' });
	const r2 = await create({ url: 'http://example.org/b' });
	created.push(r1.json?.slug, r2.json?.slug);
	const ok = [r1, r2].every((r) => r.status === 201 && /^[A-Za-z0-9]{7}$/.test(r.json?.slug ?? '')) && r1.json.slug !== r2.json.slug && linkShape(r1.json, r1.json.slug, 'http://example.org/a?x=1');
	return ok || { r1: r1.json, r2: r2.json };
});
await c.check('authentication: missing or wrong token', async () => {
	const a = await create({ url: 'https://example.com' }, {});
	const b = await create({ url: 'https://example.com' }, { authorization: 'Bearer nope' });
	const d = await call('DELETE', '/api/links/docs');
	const got = [a.status, a.json, b.status, b.json, d.status, d.json, isJson(a)];
	return same(got, [401, { error: 'unauthorized' }, 401, { error: 'unauthorized' }, 401, { error: 'unauthorized' }, true]) || { got };
});
await c.check('invalid URLs', async () => {
	const bodies = [{ url: 'ftp://example.com/x' }, { url: 'not a url' }, { url: '' }, {}, { url: 42 }, { url: 'https://example.com/' + 'a'.repeat(2040) }, { url: '/relative/path' }];
	const got = [];
	for (const b of bodies) {
		const r = await create(b);
		got.push([r.status, r.json?.error]);
	}
	const long = await create({ url: 'https://example.com/' + 'a'.repeat(2028) });
	if (long.status === 201) created.push(long.json.slug);
	return (got.every(([s, e]) => s === 400 && e === 'invalid_url') && long.status === 201) || { got, long: long.status };
});
await c.check('invalid slugs, reserved api', async () => {
	const got = [];
	for (const slug of ['ab', 'has space', 'a'.repeat(33), 'api', 'API', 'Api', 'bad/slug', 'ümlaut']) {
		const r = await create({ url: 'https://example.com', slug });
		got.push([slug, r.status, r.json?.error]);
	}
	const edge = await create({ url: 'https://example.com/e', slug: 'A-b_9' });
	if (edge.status === 201) created.push('A-b_9');
	const max = await create({ url: 'https://example.com/m', slug: 'm'.repeat(32) });
	if (max.status === 201) created.push('m'.repeat(32));
	return (got.every(([, s, e]) => s === 400 && e === 'invalid_slug') && edge.status === 201 && max.status === 201) || { got, edge: edge.status, max: max.status };
});
await c.check('slug taken: 409, and slugs are case-sensitive', async () => {
	const taken = await create({ url: 'https://example.com/other', slug: 'docs' });
	const upper = await create({ url: 'https://example.com/Docs', slug: 'Docs' });
	if (upper.status === 201) created.push('Docs');
	return (taken.status === 409 && taken.json?.error === 'slug_taken' && upper.status === 201) || { taken, upper: upper.status };
});
await c.check('bad JSON bodies', async () => {
	const a = await call('POST', '/api/links', { raw: '{"url": ', headers: auth });
	const b = await call('POST', '/api/links', { raw: '["https://example.com"]', headers: auth });
	const d = await call('POST', '/api/links', { raw: 'null', headers: auth });
	const got = [a.status, a.json?.error, b.status, b.json?.error, d.status, d.json?.error];
	return same(got, [400, 'invalid_json', 400, 'invalid_json', 400, 'invalid_json']) || { got };
});
await c.check('get a link; unknown slug is 404', async () => {
	const a = await call('GET', '/api/links/docs');
	const b = await call('GET', '/api/links/nope-nope');
	return (a.status === 200 && linkShape(a.json, 'docs', 'https://example.com/docs') && b.status === 404 && b.json?.error === 'not_found' && isJson(b)) || { a, b };
});
await c.check('following redirects with 302 and counts clicks', async () => {
	const results = [];
	for (let i = 0; i < 3; i++) {
		const r = await call('GET', '/docs');
		results.push([r.status, r.headers.get('location')]);
	}
	const link = await call('GET', '/api/links/docs');
	const unknown = await call('GET', '/nope-nope');
	return (results.every(([s, l]) => s === 302 && l === 'https://example.com/docs') && link.json?.clicks === 3 && unknown.status === 404) || { results, clicks: link.json?.clicks, unknown: unknown.status };
});
await c.check('stats: seven UTC days, oldest first, zero-filled', async () => {
	const r = await call('GET', '/api/links/docs/stats');
	const days = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10));
	const want = { slug: 'docs', clicks: 3, daily: days.map((date, i) => ({ date, clicks: i === 6 ? 3 : 0 })) };
	const unknown = await call('GET', '/api/links/nope-nope/stats');
	return (r.status === 200 && same(r.json, want) && unknown.status === 404) || { got: r.json, want };
});
await c.check('listing: newest first, cursor pagination with limit=2', async () => {
	const seen = [];
	let cursor = null;
	let pages = 0;
	do {
		const r = await call('GET', `/api/links?limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
		if (r.status !== 200 || !Array.isArray(r.json?.items)) return { r };
		if (r.json.items.length > 2) return { tooMany: r.json.items.length };
		seen.push(...r.json.items.map((l) => l.slug));
		cursor = r.json.nextCursor;
		pages++;
	} while (cursor && pages < 50);
	const want = [...created].reverse();
	return same(seen, want) || { seen, want };
});
await c.check('listing: default limit 20 and item shape', async () => {
	const r = await call('GET', '/api/links');
	const ok = r.status === 200 && r.json.items.length === Math.min(20, created.length) && r.json.nextCursor === null && linkShape(r.json.items.find((l) => l.slug === 'docs'), 'docs', 'https://example.com/docs', 3);
	return ok || { status: r.status, n: r.json?.items?.length, next: r.json?.nextCursor };
});
await c.check('listing: invalid limits', async () => {
	const got = [];
	for (const limit of ['0', '101', 'abc', '2.5', '-1']) {
		const r = await call('GET', `/api/links?limit=${limit}`);
		got.push([limit, r.status, r.json?.error]);
	}
	const hundred = await call('GET', '/api/links?limit=100');
	return (got.every(([, s, e]) => s === 400 && e === 'invalid_limit') && hundred.status === 200) || { got, hundred: hundred.status };
});
await c.check('delete: 204, then gone everywhere', async () => {
	const del = await call('DELETE', '/api/links/Docs', { headers: auth });
	created.splice(created.indexOf('Docs'), 1);
	const get = await call('GET', '/api/links/Docs');
	const follow = await call('GET', '/Docs');
	const again = await call('DELETE', '/api/links/Docs', { headers: auth });
	const other = await call('GET', '/api/links/docs');
	const got = [del.status, get.status, follow.status, again.status, again.json?.error, other.status];
	return same(got, [204, 404, 404, 404, 'not_found', 200]) || { got };
});
await c.check('unknown routes are 404 JSON', async () => {
	const a = await call('GET', '/api/nothing');
	const b = await call('POST', '/api/nothing', { body: {}, headers: auth });
	return (a.status === 404 && a.json?.error === 'not_found' && isJson(a) && b.status === 404) || { a: [a.status, a.json], b: b.status };
});

stop();
await sleep(500);
const restarted = await start();
await c.check('data survives a restart with the same DB_PATH', async () => {
	if (!restarted) return 'did not restart';
	const r = await call('GET', '/api/links/docs');
	const list = await call('GET', '/api/links?limit=100');
	return (r.status === 200 && r.json.clicks === 3 && same(list.json.items.map((l) => l.slug), [...created].reverse())) || { status: r.status, clicks: r.json?.clicks };
});
await c.check('rate limit: 30 POSTs a minute, then 429 with Retry-After', async () => {
	// A server may or may not remember requests from before the restart, so the 429 may come
	// after as few as 30 minus the earlier requests still inside the window.
	const earlier = posts.filter((t) => t > Date.now() - 55000).length;
	const statuses = [];
	let limited = null;
	for (let i = 0; i < 31 && !limited; i++) {
		const r = await create({ url: 'nope' });
		if (r.status === 429) limited = r;
		else statuses.push(r.status);
	}
	const allowed = statuses.length;
	const retry = Number(limited?.headers.get('retry-after'));
	const ok =
		statuses.every((s) => s === 400) &&
		!!limited &&
		allowed <= 30 &&
		allowed >= 30 - earlier &&
		limited.json?.error === 'rate_limited' &&
		isJson(limited) &&
		Number.isInteger(retry) &&
		retry >= 1 &&
		retry <= 60;
	return ok || { allowed, earlier, statuses: [...new Set(statuses)], limited: limited?.status, body: limited?.json, retry: limited?.headers.get('retry-after') };
});
await c.check('rate limit comes before authentication', async () => {
	const r = await create({ url: 'https://example.com' }, {});
	return (r.status === 429) || { status: r.status };
});

stop();
const summary = c.summary();
writeFileSync(join(out, 'result.json'), JSON.stringify(summary, null, 2));
console.log(`B1: ${summary.passed}/${summary.total}`);

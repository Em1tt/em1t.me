// Reference solution for B1: node:http and node:sqlite, nothing else.
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomInt } from 'node:crypto';

const db = new DatabaseSync(process.env.DB_PATH ?? './data.db');
db.exec(`CREATE TABLE IF NOT EXISTS links (seq INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, url TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS clicks (slug TEXT NOT NULL, at TEXT NOT NULL);`);
const TOKEN = process.env.API_TOKEN;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const hits = new Map();

const clicksOf = (slug) => db.prepare('SELECT COUNT(*) AS n FROM clicks WHERE slug = ?').get(slug).n;
const view = (row) => ({ slug: row.slug, url: row.url, createdAt: row.created_at, clicks: clicksOf(row.slug) });
const find = (slug) => db.prepare('SELECT * FROM links WHERE slug = ?').get(slug);

function send(res, status, body, headers = {}) {
	if (body === undefined) return res.writeHead(status, headers).end();
	res.writeHead(status, { 'content-type': 'application/json', ...headers }).end(JSON.stringify(body));
}
const readBody = (req) => new Promise((ok) => { let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => ok(s)); });

createServer(async (req, res) => {
	const url = new URL(req.url, 'http://x');
	const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
	const authed = req.headers.authorization === `Bearer ${TOKEN}`;
	if (req.method === 'POST' && url.pathname === '/api/links') {
		const ip = req.socket.remoteAddress;
		const now = Date.now();
		const recent = (hits.get(ip) ?? []).filter((t) => t > now - 60000);
		if (recent.length >= 30) {
			hits.set(ip, recent);
			return send(res, 429, { error: 'rate_limited' }, { 'retry-after': String(Math.max(1, Math.ceil((recent[0] + 60000 - now) / 1000))) });
		}
		recent.push(now);
		hits.set(ip, recent);
		if (!authed) return send(res, 401, { error: 'unauthorized' });
		let body;
		try {
			body = JSON.parse(await readBody(req));
		} catch {
			return send(res, 400, { error: 'invalid_json' });
		}
		if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { error: 'invalid_json' });
		let valid = false;
		try {
			valid = typeof body.url === 'string' && body.url.length <= 2048 && ['http:', 'https:'].includes(new URL(body.url).protocol);
		} catch {
			valid = false;
		}
		if (!valid) return send(res, 400, { error: 'invalid_url' });
		let slug = body.slug;
		if (slug !== undefined) {
			if (typeof slug !== 'string' || !/^[A-Za-z0-9_-]{3,32}$/.test(slug) || slug.toLowerCase() === 'api') return send(res, 400, { error: 'invalid_slug' });
			if (find(slug)) return send(res, 409, { error: 'slug_taken' });
		} else {
			do slug = Array.from({ length: 7 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
			while (find(slug));
		}
		db.prepare('INSERT INTO links (slug, url, created_at) VALUES (?, ?, ?)').run(slug, body.url, new Date().toISOString());
		return send(res, 201, view(find(slug)));
	}
	if (req.method === 'GET' && url.pathname === '/api/links') {
		const raw = url.searchParams.get('limit');
		const limit = raw === null ? 20 : /^\d+$/.test(raw) ? Number(raw) : NaN;
		if (!Number.isInteger(limit) || limit < 1 || limit > 100) return send(res, 400, { error: 'invalid_limit' });
		const cursor = Number(url.searchParams.get('cursor') ?? Infinity);
		const rows = db.prepare('SELECT * FROM links WHERE seq < ? ORDER BY seq DESC LIMIT ?').all(Number.isFinite(cursor) ? cursor : 2 ** 53, limit + 1);
		const page = rows.slice(0, limit);
		return send(res, 200, { items: page.map(view), nextCursor: rows.length > limit ? String(page.at(-1).seq) : null });
	}
	if (parts[0] === 'api' && parts[1] === 'links' && parts.length >= 3 && parts.length <= 4) {
		const link = find(parts[2]);
		if (req.method === 'DELETE' && parts.length === 3) {
			if (!authed) return send(res, 401, { error: 'unauthorized' });
			if (!link) return send(res, 404, { error: 'not_found' });
			db.prepare('DELETE FROM links WHERE slug = ?').run(link.slug);
			db.prepare('DELETE FROM clicks WHERE slug = ?').run(link.slug);
			return send(res, 204);
		}
		if (req.method === 'GET' && parts.length === 3) return link ? send(res, 200, view(link)) : send(res, 404, { error: 'not_found' });
		if (req.method === 'GET' && parts[3] === 'stats') {
			if (!link) return send(res, 404, { error: 'not_found' });
			const days = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10));
			const counts = Object.fromEntries(db.prepare('SELECT substr(at, 1, 10) AS day, COUNT(*) AS n FROM clicks WHERE slug = ? GROUP BY day').all(link.slug).map((r) => [r.day, r.n]));
			return send(res, 200, { slug: link.slug, clicks: clicksOf(link.slug), daily: days.map((date) => ({ date, clicks: counts[date] ?? 0 })) });
		}
	}
	if (req.method === 'GET' && parts.length === 1 && parts[0] !== 'api') {
		const link = find(parts[0]);
		if (!link) return send(res, 404, { error: 'not_found' });
		db.prepare('INSERT INTO clicks (slug, at) VALUES (?, ?)').run(link.slug, new Date().toISOString());
		return send(res, 302, undefined, { location: link.url });
	}
	send(res, 404, { error: 'not_found' });
}).listen(Number(process.env.PORT ?? 3000));

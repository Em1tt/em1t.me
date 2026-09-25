'use strict';

const http = require('node:http');
const { randomInt } = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const { mkdirSync } = require('node:fs');
const { dirname, resolve } = require('node:path');

const port = Number(process.env.PORT ?? 3000);
const token = process.env.API_TOKEN;
const dbPath = resolve(process.env.DB_PATH ?? 'links.sqlite');

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error('PORT must be an integer between 0 and 65535.');
}
if (!token) {
  throw new Error('API_TOKEN must be set to a nonempty secret.');
}

mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = DELETE;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE COLLATE BINARY,
    url TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS clicks_link_time ON clicks(link_id, clicked_at);
  CREATE TABLE IF NOT EXISTS rate_limits (
    ip TEXT PRIMARY KEY,
    attempts TEXT NOT NULL,
    last_attempt INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS rate_limits_time ON rate_limits(last_attempt);
`);

const columns = `links.id, slug, url, created_at,
  (SELECT COUNT(*) FROM clicks WHERE link_id = links.id) AS clicks`;
const sql = {
  find: db.prepare(`SELECT ${columns} FROM links WHERE slug = ?`),
  insert: db.prepare('INSERT INTO links (slug, url, created_at) VALUES (?, ?, ?)'),
  list: db.prepare(`SELECT ${columns} FROM links ORDER BY id DESC LIMIT ?`),
  page: db.prepare(`SELECT ${columns} FROM links WHERE id < ? ORDER BY id DESC LIMIT ?`),
  remove: db.prepare('DELETE FROM links WHERE slug = ?'),
  click: db.prepare('INSERT INTO clicks (link_id, clicked_at) VALUES (?, ?)'),
  daily: db.prepare(`SELECT substr(clicked_at, 1, 10) AS date, COUNT(*) AS clicks
    FROM clicks WHERE link_id = ? AND clicked_at >= ? AND clicked_at < ?
    GROUP BY substr(clicked_at, 1, 10)`),
  rate: db.prepare('SELECT attempts FROM rate_limits WHERE ip = ?'),
  saveRate: db.prepare(`INSERT INTO rate_limits (ip, attempts, last_attempt) VALUES (?, ?, ?)
    ON CONFLICT(ip) DO UPDATE SET attempts = excluded.attempts, last_attempt = excluded.last_attempt`),
  pruneRates: db.prepare('DELETE FROM rate_limits WHERE last_attempt <= ?'),
};

function transaction(action) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = action();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function linkObject(row) {
  return { slug: row.slug, url: row.url, createdAt: row.created_at, clicks: row.clicks };
}

function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

function errorResponse(res, status, error, headers) {
  json(res, status, { error }, headers);
}

function authenticated(req, res) {
  if (req.headers.authorization === `Bearer ${token}`) return true;
  req.resume();
  errorResponse(res, 401, 'unauthorized');
  return false;
}

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 30;

function checkRateLimit(ip) {
  return transaction(() => {
    const now = Date.now();
    sql.pruneRates.run(now - WINDOW_MS);
    const row = sql.rate.get(ip);
    const attempts = row
      ? JSON.parse(row.attempts).filter((time) => time > now - WINDOW_MS)
      : [];
    const allowed = attempts.length < MAX_ATTEMPTS;
    attempts.push(now);
    // Rejected attempts count too. The latest 30 determine when the next
    // request can be accepted, so older timestamps need not be retained.
    const recent = attempts.slice(-MAX_ATTEMPTS);
    sql.saveRate.run(ip, JSON.stringify(recent), now);
    return allowed ? 0 : Math.max(1, Math.min(60,
      Math.ceil((recent[0] + WINDOW_MS - now) / 1000)));
  });
}

function validUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validSlug(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{3,32}$/.test(value)
    && value.toLowerCase() !== 'api';
}

function randomSlug() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 7; i++) slug += alphabet[randomInt(alphabet.length)];
  return slug;
}

async function createLink(req, res) {
  const retryAfter = checkRateLimit(req.socket.remoteAddress ?? 'unknown');
  if (retryAfter) {
    req.resume();
    errorResponse(res, 429, 'rate_limited', { 'Retry-After': String(retryAfter) });
    return;
  }
  if (!authenticated(req, res)) return;

  let body;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      throw new Error('Expected a JSON object.');
    }
  } catch {
    errorResponse(res, 400, 'invalid_json');
    return;
  }
  if (!validUrl(body.url)) {
    errorResponse(res, 400, 'invalid_url');
    return;
  }
  const hasSlug = Object.hasOwn(body, 'slug');
  if (hasSlug && !validSlug(body.slug)) {
    errorResponse(res, 400, 'invalid_slug');
    return;
  }

  const row = transaction(() => {
    let slug = body.slug;
    if (hasSlug) {
      if (sql.find.get(slug)) return null;
    } else {
      do { slug = randomSlug(); } while (sql.find.get(slug));
    }
    sql.insert.run(slug, body.url, new Date().toISOString());
    return sql.find.get(slug);
  });
  if (!row) {
    errorResponse(res, 409, 'slug_taken');
    return;
  }
  json(res, 201, linkObject(row));
}

function encodeCursor(id) {
  return Buffer.from(JSON.stringify({ v: 1, before: id })).toString('base64url');
}

function decodeCursor(cursor) {
  if (!/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error('Invalid cursor.');
  const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  if (value?.v !== 1 || !Number.isSafeInteger(value.before) || value.before < 1) {
    throw new Error('Invalid cursor.');
  }
  return value.before;
}

function listLinks(res, params) {
  const rawLimit = params.get('limit');
  const limit = rawLimit === null ? 20 : Number(rawLimit);
  if (rawLimit !== null && (!/^[0-9]+$/.test(rawLimit)
      || !Number.isInteger(limit) || limit < 1 || limit > 100)) {
    errorResponse(res, 400, 'invalid_limit');
    return;
  }

  let before;
  if (params.has('cursor')) {
    try {
      before = decodeCursor(params.get('cursor'));
    } catch {
      errorResponse(res, 400, 'invalid_cursor');
      return;
    }
  }
  const rows = before === undefined ? sql.list.all(limit + 1) : sql.page.all(before, limit + 1);
  const more = rows.length > limit;
  const items = rows.slice(0, limit);
  json(res, 200, {
    items: items.map(linkObject),
    nextCursor: more ? encodeCursor(items.at(-1).id) : null,
  });
}

function stats(res, row) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const firstDay = new Date(today.getTime() - 6 * 86_400_000);
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const counts = new Map(sql.daily.all(row.id, firstDay.toISOString(), tomorrow.toISOString())
    .map((entry) => [entry.date, entry.clicks]));
  const daily = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(firstDay.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    return { date, clicks: counts.get(date) ?? 0 };
  });
  json(res, 200, { slug: row.slug, clicks: row.clicks, daily });
}

async function route(req, res) {
  let target;
  try {
    target = new URL(req.url, 'http://localhost');
  } catch {
    req.resume();
    errorResponse(res, 404, 'not_found');
    return;
  }
  const path = target.pathname;
  if (path === '/api/links') {
    if (req.method === 'POST') return createLink(req, res);
    if (req.method === 'GET') return listLinks(res, target.searchParams);
  }

  const apiMatch = /^\/api\/links\/([^/]+)(\/stats)?$/.exec(path);
  if (apiMatch && (req.method === 'GET' || (req.method === 'DELETE' && !apiMatch[2]))) {
    if (req.method === 'DELETE' && !authenticated(req, res)) return;
    let slug;
    try { slug = decodeURIComponent(apiMatch[1]); } catch { /* Unknown slug. */ }
    const row = slug === undefined ? undefined : sql.find.get(slug);
    if (!row) return errorResponse(res, 404, 'not_found');
    if (req.method === 'DELETE') {
      sql.remove.run(slug);
      res.writeHead(204);
      res.end();
      return;
    }
    if (apiMatch[2]) return stats(res, row);
    return json(res, 200, linkObject(row));
  }

  const shortMatch = /^\/([^/]+)$/.exec(path);
  if (req.method === 'GET' && shortMatch) {
    let slug;
    try { slug = decodeURIComponent(shortMatch[1]); } catch { /* Unknown slug. */ }
    const row = slug === undefined ? undefined : sql.find.get(slug);
    if (row) {
      // Preserve the submitted URL when it can be sent verbatim in a header.
      // URL serialization escapes Unicode and removes embedded control bytes.
      const location = /[^\x20-\x7e]/.test(row.url) ? new URL(row.url).href : row.url;
      sql.click.run(row.id, new Date().toISOString());
      res.writeHead(302, { Location: location });
      res.end();
      return;
    }
  }

  req.resume();
  errorResponse(res, 404, 'not_found');
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => {
    console.error(error);
    if (!res.headersSent && !res.destroyed) errorResponse(res, 500, 'internal_error');
    else res.destroy();
  });
});

server.listen(port, () => {
  console.log(`Link shortener API listening on port ${server.address().port}`);
});

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  server.close(() => {
    db.close();
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

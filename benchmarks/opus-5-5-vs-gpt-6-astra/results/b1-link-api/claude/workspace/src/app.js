import { createHash, timingSafeEqual } from 'node:crypto';

const SLUG_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;
const RESERVED_SLUG = 'api'; // in any letter case
const MAX_URL_LENGTH = 2048;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_BODY_BYTES = 1024 * 1024;

const utf8 = new TextDecoder('utf-8', { fatal: true });

/** An error response: `{ "error": code }` with the given status and extra headers. */
class HttpError extends Error {
  constructor(status, code, headers = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

const notFound = () => new HttpError(404, 'not_found');

/**
 * Creates the `node:http` request handler for the link shortener API.
 *
 * @param {object} options
 * @param {import('./store.js').LinkStore} options.store
 * @param {string} options.apiToken bearer token the write endpoints require; when empty, every write is refused
 * @param {import('./rate-limiter.js').RateLimiter} options.rateLimiter applied to `POST /api/links` per client address
 * @param {number} [options.trustedProxies] how many reverse proxies in front of the server append to
 *   X-Forwarded-For; the client address is taken from that header only when this is above 0
 */
export function createApp({ store, apiToken, rateLimiter, trustedProxies = 0 }) {
  const isAuthorized = bearerTokenChecker(apiToken);

  const routes = [
    { method: 'GET', path: /^\/api\/links$/, handle: listLinks },
    { method: 'POST', path: /^\/api\/links$/, handle: createLink },
    { method: 'GET', path: /^\/api\/links\/([^/]+)$/, handle: getLink },
    { method: 'DELETE', path: /^\/api\/links\/([^/]+)$/, handle: deleteLink },
    { method: 'GET', path: /^\/api\/links\/([^/]+)\/stats$/, handle: getStats },
    { method: 'GET', path: /^\/([^/]+)$/, handle: followLink },
  ];

  async function createLink(req, res) {
    // The checks run in this order: rate limit, authentication, JSON, url, slug.
    const limit = rateLimiter.attempt(clientAddress(req, trustedProxies));
    if (!limit.allowed) throw new HttpError(429, 'rate_limited', { 'Retry-After': String(limit.retryAfter) });
    if (!isAuthorized(req)) throw new HttpError(401, 'unauthorized');

    const { url, slug = null } = await readJsonObject(req);
    if (!isValidUrl(url)) throw new HttpError(400, 'invalid_url');
    if (slug !== null && !isValidSlug(slug)) throw new HttpError(400, 'invalid_slug');

    const link = store.create(url, slug);
    if (!link) throw new HttpError(409, 'slug_taken');
    sendJson(res, 201, link);
  }

  function listLinks(req, res, { query }) {
    const params = new URLSearchParams(query);
    const limit = params.has('limit') ? parseLimit(params.get('limit')) : DEFAULT_PAGE_SIZE;
    const cursor = params.get('cursor');
    const page = store.list({ limit, after: cursor ? decodeCursor(cursor) : null });
    sendJson(res, 200, { items: page.links, nextCursor: page.next === null ? null : encodeCursor(page.next) });
  }

  function getLink(req, res, { slug }) {
    const link = store.get(slug);
    if (!link) throw notFound();
    sendJson(res, 200, link);
  }

  function deleteLink(req, res, { slug }) {
    if (!isAuthorized(req)) throw new HttpError(401, 'unauthorized');
    if (!store.delete(slug)) throw notFound();
    res.writeHead(204).end();
  }

  function getStats(req, res, { slug }) {
    const stats = store.stats(slug);
    if (!stats) throw notFound();
    sendJson(res, 200, stats);
  }

  function followLink(req, res, { slug }) {
    // HEAD only inspects the redirect, so it isn't counted as a click.
    const url = req.method === 'HEAD' ? store.get(slug)?.url : store.recordClick(slug);
    if (!url) throw notFound();
    res.writeHead(302, { Location: toHeaderSafeUrl(url), 'Cache-Control': 'no-store', 'Content-Length': 0 }).end();
  }

  return async function handleRequest(req, res) {
    try {
      const queryStart = req.url.indexOf('?');
      const path = queryStart === -1 ? req.url : req.url.slice(0, queryStart);
      const query = queryStart === -1 ? '' : req.url.slice(queryStart + 1);
      // HEAD is answered like GET; node:http leaves out the body.
      const method = req.method === 'HEAD' ? 'GET' : req.method;

      const route = routes.find((candidate) => candidate.method === method && candidate.path.test(path));
      if (!route) throw notFound();
      const [, slug] = route.path.exec(path);
      await route.handle(req, res, { slug: slug === undefined ? undefined : decodePathSegment(slug), query });
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.code }, error.headers);
      } else if (!req.socket.destroyed) { // otherwise the client went away mid-request
        console.error(error);
        if (res.headersSent) res.destroy();
        else sendJson(res, 500, { error: 'internal_error' });
      }
    }
  };
}

function sendJson(res, status, body, headers = {}) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json), ...headers });
  res.end(json);
}

function bearerTokenChecker(apiToken) {
  if (!apiToken) return () => false;
  // Comparing fixed-length digests keeps the comparison constant-time without leaking the token length.
  const expected = sha256(apiToken);
  return (req) => {
    const match = /^Bearer[ \t]+(.+)$/i.exec(req.headers.authorization ?? '');
    return match !== null && timingSafeEqual(sha256(match[1]), expected);
  };
}

function sha256(value) {
  return createHash('sha256').update(value).digest();
}

function clientAddress(req, trustedProxies) {
  let address = req.socket.remoteAddress ?? '';
  if (trustedProxies > 0) {
    // Each trusted proxy appends the address it got the request from, so the entry `trustedProxies`
    // places from the end was written by the outermost trusted proxy; anything before it is client-supplied.
    const forwarded = (req.headers['x-forwarded-for'] ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);
    if (forwarded.length > 0) address = forwarded[Math.max(0, forwarded.length - trustedProxies)];
  }
  // Dual-stack sockets report IPv4 clients as IPv4-mapped IPv6 addresses.
  return address.startsWith('::ffff:') ? address.slice('::ffff:'.length) : address;
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const tooLarge = () => new HttpError(413, 'payload_too_large', { Connection: 'close' });
    if (Number(req.headers['content-length']) > maxBytes) return reject(tooLarge());
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size <= maxBytes) chunks.push(chunk);
      else reject(tooLarge());
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJsonObject(req) {
  const body = await readBody(req, MAX_BODY_BYTES);
  let value;
  try {
    value = JSON.parse(utf8.decode(body));
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new HttpError(400, 'invalid_json');
  return value;
}

function isValidUrl(value) {
  if (typeof value !== 'string' || value.length > MAX_URL_LENGTH) return false;
  const url = URL.parse(value);
  return url !== null && (url.protocol === 'http:' || url.protocol === 'https:');
}

function isValidSlug(value) {
  return typeof value === 'string' && SLUG_PATTERN.test(value) && value.toLowerCase() !== RESERVED_SLUG;
}

function parseLimit(value) {
  const limit = /^\d+$/.test(value) ? Number(value) : NaN;
  if (!(limit >= 1 && limit <= MAX_PAGE_SIZE)) throw new HttpError(400, 'invalid_limit');
  return limit;
}

// A cursor is the position of the last link on the previous page, wrapped so clients treat it as opaque.
function encodeCursor(position) {
  return Buffer.from(String(position)).toString('base64url');
}

function decodeCursor(cursor) {
  const position = Number(Buffer.from(cursor, 'base64url').toString());
  if (!Number.isSafeInteger(position) || position < 1 || encodeCursor(position) !== cursor) {
    throw new HttpError(400, 'invalid_cursor');
  }
  return position;
}

function decodePathSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment; // malformed escapes can't be part of a valid slug, so the lookup finds nothing
  }
}

// URLs are stored exactly as submitted, but a header can only carry visible ASCII. Anything else
// gets the WHATWG serialization, which percent-encodes (and punycodes) what needs it.
function toHeaderSafeUrl(url) {
  return /^[\x21-\x7E]+$/.test(url) ? url : new URL(url).href;
}
